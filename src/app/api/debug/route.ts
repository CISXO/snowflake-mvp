import { querySnowflake } from "@/lib/snowflake"

export async function GET() {
  try {
    const [districtCodes, e1Columns] = await Promise.all([
      querySnowflake(`
        SELECT DISTINCT PROVINCE_CODE, CITY_CODE, DISTRICT_CODE
        FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.FLOATING_POPULATION_INFO
        LIMIT 20
      `),
      querySnowflake(`SELECT * FROM NEXTRADE_EQUITY_MARKET_DATA.FIN.NX_HT_ONL_STATS_B5 LIMIT 1`),
    ])

    return Response.json({
      districtCodes,
      e1Columns: e1Columns[0] ? Object.keys(e1Columns[0]) : [],
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}
