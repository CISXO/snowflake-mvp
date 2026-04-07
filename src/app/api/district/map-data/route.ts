import { querySnowflake } from "@/lib/snowflake"

export async function GET() {
  try {
    const [geometries, population, cardSales] = await Promise.all([
      // 동 경계 폴리곤
      querySnowflake(`
        SELECT DISTRICT_CODE, CITY_CODE, CITY_KOR_NAME, DISTRICT_KOR_NAME, DISTRICT_GEOM
        FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.M_SCCO_MST
        WHERE CITY_CODE IN ('11140', '11560', '11650')
      `),
      // 최근 월 유동인구 (동 단위 합산)
      querySnowflake(`
        SELECT DISTRICT_CODE,
          SUM(VISITING_POPULATION)    AS VISITING,
          SUM(WORKING_POPULATION)     AS WORKING,
          SUM(RESIDENTIAL_POPULATION) AS RESIDENTIAL
        FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
        WHERE STANDARD_YEAR_MONTH = (
          SELECT MAX(STANDARD_YEAR_MONTH) FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
        )
        GROUP BY DISTRICT_CODE
      `),
      // 최근 월 카드 소비 (동 단위 합산)
      querySnowflake(`
        SELECT DISTRICT_CODE,
          SUM(TOTAL_SALES)    AS TOTAL_SALES,
          SUM(FOOD_SALES)     AS FOOD_SALES,
          SUM(COFFEE_SALES)   AS COFFEE_SALES,
          SUM(BEAUTY_SALES)   AS BEAUTY_SALES
        FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.CARD_SALES_INFO
        WHERE STANDARD_YEAR_MONTH = (
          SELECT MAX(STANDARD_YEAR_MONTH) FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.CARD_SALES_INFO
        )
        GROUP BY DISTRICT_CODE
      `),
    ])

    type Row = Record<string, unknown>

    const popMap = Object.fromEntries((population as Row[]).map((r) => [r.DISTRICT_CODE, r]))
    const salesMap = Object.fromEntries((cardSales as Row[]).map((r) => [r.DISTRICT_CODE, r]))

    const features = (geometries as Row[]).map((g) => ({
      districtCode: g.DISTRICT_CODE,
      cityCode: g.CITY_CODE,
      cityName: g.CITY_KOR_NAME,
      districtName: g.DISTRICT_KOR_NAME,
      geom: g.DISTRICT_GEOM,
      population: popMap[g.DISTRICT_CODE as string] ?? null,
      sales: salesMap[g.DISTRICT_CODE as string] ?? null,
    }))

    return Response.json({ success: true, count: features.length, data: features })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}