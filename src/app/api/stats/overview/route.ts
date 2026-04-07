import { querySnowflake } from "@/lib/snowflake"
import clientPromise from "@/lib/mongodb"

const DB = "snowflake"
const COL = "stats_cache"
const TTL_HOURS = 6

export async function GET() {
  // 캐시 확인
  try {
    const client = await clientPromise
    const cached = await client.db(DB).collection(COL).findOne({ key: "overview" })
    if (cached) {
      const age = Date.now() - new Date(cached.cachedAt).getTime()
      if (age < TTL_HOURS * 3600 * 1000) {
        return Response.json({ success: true, data: cached.data, cached: true })
      }
    }
  } catch (_) {}

  try {
    const [yearlyTrend, topDistricts, latestPop] = await Promise.all([
      // 연도별 유동인구 트렌드 (3개 구 합산)
      querySnowflake<Record<string, unknown>>(`
        SELECT
          SUBSTR(STANDARD_YEAR_MONTH, 1, 4) AS YR,
          SUM(VISITING_POPULATION)    AS VISITING,
          SUM(WORKING_POPULATION)     AS WORKING,
          SUM(RESIDENTIAL_POPULATION) AS RESIDENTIAL
        FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
        WHERE CITY_CODE IN ('11140','11560','11650')
          AND STANDARD_YEAR_MONTH < '202512'
        GROUP BY YR
        ORDER BY YR ASC
      `),
      // 구별 최신 유동인구 상위 동
      querySnowflake<Record<string, unknown>>(`
        SELECT
          d.DISTRICT_KOR_NAME,
          d.CITY_KOR_NAME,
          f.DISTRICT_CODE,
          SUM(f.VISITING_POPULATION) AS VISITING
        FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO f
        JOIN SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.M_SCCO_MST d
          ON f.DISTRICT_CODE = d.DISTRICT_CODE
        WHERE f.STANDARD_YEAR_MONTH = (
          SELECT MAX(STANDARD_YEAR_MONTH) FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
        )
        AND f.CITY_CODE IN ('11140','11560','11650')
        GROUP BY d.DISTRICT_KOR_NAME, d.CITY_KOR_NAME, f.DISTRICT_CODE
        ORDER BY VISITING DESC
        LIMIT 5
      `),
      // 최신 월 구별 합산
      querySnowflake<Record<string, unknown>>(`
        SELECT
          CITY_CODE,
          SUM(VISITING_POPULATION) AS VISITING,
          SUM(WORKING_POPULATION) AS WORKING
        FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
        WHERE STANDARD_YEAR_MONTH = (
          SELECT MAX(STANDARD_YEAR_MONTH) FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
        )
        AND CITY_CODE IN ('11140','11560','11650')
        GROUP BY CITY_CODE
      `),
    ])

    const CITY_NAME: Record<string, string> = { "11140": "중구", "11560": "영등포구", "11650": "서초구" }

    const data = {
      yearlyTrend: yearlyTrend.map(r => ({
        year: r.YR,
        visiting: Math.round(Number(r.VISITING)),
        working: Math.round(Number(r.WORKING)),
        residential: Math.round(Number(r.RESIDENTIAL)),
      })),
      topDistricts: topDistricts.map(r => ({
        name: r.DISTRICT_KOR_NAME,
        city: r.CITY_KOR_NAME,
        code: r.DISTRICT_CODE,
        visiting: Math.round(Number(r.VISITING)),
      })),
      cityStats: latestPop.map(r => ({
        cityCode: r.CITY_CODE,
        cityName: CITY_NAME[r.CITY_CODE as string] ?? String(r.CITY_CODE),
        visiting: Math.round(Number(r.VISITING)),
        working: Math.round(Number(r.WORKING)),
      })),
    }

    // 캐시 저장
    try {
      const client = await clientPromise
      await client.db(DB).collection(COL).updateOne(
        { key: "overview" },
        { $set: { key: "overview", data, cachedAt: new Date() } },
        { upsert: true }
      )
    } catch (_) {}

    return Response.json({ success: true, data })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
