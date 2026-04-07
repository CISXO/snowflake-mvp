import { querySnowflake } from "@/lib/snowflake"

// 서초구 11650 | 영등포구 11560 | 중구 11140
export async function GET() {
  try {
    const rows = await querySnowflake(`
      SELECT
        DISTRICT_CODE,
        STANDARD_YEAR_MONTH,
        SUM(VISITING_POPULATION)    AS TOTAL_VISITING,
        SUM(RESIDENTIAL_POPULATION) AS TOTAL_RESIDENTIAL,
        SUM(WORKING_POPULATION)     AS TOTAL_WORKING
      FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
      WHERE CITY_CODE IN ('11650', '11560', '11140')
        AND STANDARD_YEAR_MONTH >= '202101'
      GROUP BY DISTRICT_CODE, STANDARD_YEAR_MONTH
      ORDER BY STANDARD_YEAR_MONTH DESC
    `)
    return Response.json({ success: true, data: rows })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}