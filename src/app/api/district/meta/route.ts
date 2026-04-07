import { querySnowflake } from "@/lib/snowflake"

export async function GET() {
  try {
    const [sample, columns] = await Promise.all([
      querySnowflake(`
        SELECT * FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.M_SCCO_MST
        WHERE CITY_CODE IN ('11140', '11560', '11650')
        LIMIT 5
      `),
      querySnowflake(`
        SELECT * FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.M_SCCO_MST
        LIMIT 1
      `),
    ])
    return Response.json({
      columns: (columns[0] as Record<string, unknown>) ? Object.keys(columns[0] as Record<string, unknown>) : [],
      sample,
    })
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 })
  }
}