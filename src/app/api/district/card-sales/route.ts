import { querySnowflake } from "@/lib/snowflake"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const district = searchParams.get("district") // 11650 | 11560 | 11140

  const whereDistrict = district
    ? `AND CITY_CODE = '${district}'`
    : `AND CITY_CODE IN ('11650', '11560', '11140')`

  try {
    const rows = await querySnowflake(`
      SELECT
        DISTRICT_CODE,
        STANDARD_YEAR_MONTH,
        SUM(TOTAL_SALES)              AS TOTAL_SALES,
        SUM(FOOD_SALES)               AS FOOD_SALES,
        SUM(COFFEE_SALES)             AS COFFEE_SALES,
        SUM(BEAUTY_SALES)             AS BEAUTY_SALES,
        SUM(EDUCATION_ACADEMY_SALES)  AS EDUCATION_SALES,
        SUM(MEDICAL_SALES)            AS MEDICAL_SALES,
        SUM(SPORTS_CULTURE_LEISURE_SALES) AS SPORTS_SALES,
        SUM(TOTAL_COUNT)              AS TOTAL_COUNT
      FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.CARD_SALES_INFO
      WHERE STANDARD_YEAR_MONTH >= '202101'
        ${whereDistrict}
      GROUP BY DISTRICT_CODE, STANDARD_YEAR_MONTH
      ORDER BY STANDARD_YEAR_MONTH DESC
    `)
    return Response.json({ success: true, data: rows })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}