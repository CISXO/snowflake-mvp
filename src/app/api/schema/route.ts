import { querySnowflake } from "@/lib/snowflake"

const TABLES = [
  { db: "SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS", schema: "GRANDATA", table: "FLOATING_POPULATION_INFO" },
  { db: "SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS", schema: "GRANDATA", table: "CARD_SALES_INFO" },
  { db: "SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS", schema: "GRANDATA", table: "ASSET_INCOME_INFO" },
  { db: "KOREAN_POPULATION__APARTMENT_MARKET_PRICE_DATA", schema: "HACKATHON_2025Q2", table: "REGION_APT_RICHGO_MARKET_PRICE_M_H" },
  { db: "NEXTRADE_EQUITY_MARKET_DATA", schema: "FIN", table: "NX_HT_BAT_REFER_A0" },
]

export async function GET() {
  try {
    const results: Record<string, unknown> = {}

    for (const { db, schema, table } of TABLES) {
      const rows = await querySnowflake(
        `SELECT * FROM ${db}.${schema}.${table} LIMIT 1`
      )
      results[`${db}.${schema}.${table}`] = rows[0] ? Object.keys(rows[0]) : []
    }

    return Response.json({ success: true, columns: results })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}