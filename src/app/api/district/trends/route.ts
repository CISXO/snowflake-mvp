import { NextRequest } from "next/server"
import { querySnowflake } from "@/lib/snowflake"
import clientPromise from "@/lib/mongodb"

const DB = "snowflake"
const COL = "trend_cache"
const TTL_HOURS = 24

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  if (!code) return Response.json({ success: false, error: "code required" }, { status: 400 })

  // MongoDB 캐시 확인
  try {
    const client = await clientPromise
    const col = client.db(DB).collection(COL)

    const cached = await col.findOne({ districtCode: code })
    if (cached) {
      const age = Date.now() - new Date(cached.cachedAt).getTime()
      if (age < TTL_HOURS * 3600 * 1000) {
        return Response.json({ success: true, data: cached.data, cached: true })
      }
    }
  } catch (_) { /* 캐시 실패 시 Snowflake에서 직접 조회 */ }

  try {
    const rows = await querySnowflake<{
      STANDARD_YEAR_MONTH: string
      VISITING: number
      WORKING: number
      RESIDENTIAL: number
    }>(`
      SELECT
        STANDARD_YEAR_MONTH,
        SUM(VISITING_POPULATION)    AS VISITING,
        SUM(WORKING_POPULATION)     AS WORKING,
        SUM(RESIDENTIAL_POPULATION) AS RESIDENTIAL
      FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
      WHERE DISTRICT_CODE = '${code}'
        AND STANDARD_YEAR_MONTH >= '202101'
      GROUP BY STANDARD_YEAR_MONTH
      ORDER BY STANDARD_YEAR_MONTH ASC
    `)

    const data = rows.map(r => ({
      month: r.STANDARD_YEAR_MONTH,
      visiting: Math.round(r.VISITING),
      working: Math.round(r.WORKING),
      residential: Math.round(r.RESIDENTIAL),
    }))

    // MongoDB에 캐시 저장
    try {
      const client = await clientPromise
      await client.db(DB).collection(COL).updateOne(
        { districtCode: code },
        { $set: { districtCode: code, data, cachedAt: new Date() } },
        { upsert: true }
      )
    } catch (_) { /* 캐시 저장 실패는 무시 */ }

    return Response.json({ success: true, data, cached: false })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
