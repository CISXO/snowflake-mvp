import { NextRequest } from "next/server"
import { querySnowflake } from "@/lib/snowflake"
import clientPromise from "@/lib/mongodb"

const DB = "snowflake"
const COL = "income_cache"
const TTL_HOURS = 24

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")
  if (!code) return Response.json({ success: false, error: "code required" }, { status: 400 })

  // MongoDB 캐시 확인
  try {
    const client = await clientPromise
    const cached = await client.db(DB).collection(COL).findOne({ districtCode: code })
    if (cached) {
      const age = Date.now() - new Date(cached.cachedAt).getTime()
      if (age < TTL_HOURS * 3600 * 1000) {
        return Response.json({ success: true, data: cached.data, cached: true })
      }
    }
  } catch (_) {}

  try {
    const rows = await querySnowflake<Record<string, number | string>>(`
      SELECT
        STANDARD_YEAR_MONTH,
        AVG(AVERAGE_INCOME)           AS AVG_INCOME,
        AVG(AVERAGE_HOUSEHOLD_INCOME) AS AVG_HOUSEHOLD_INCOME,
        AVG(AVERAGE_ASSET_AMOUNT)     AS AVG_ASSET,
        AVG(RATE_HIGHEND)             AS RATE_HIGHEND,
        AVG(AVERAGE_SCORE)            AS AVG_CREDIT_SCORE,
        AVG(AVERAGE_USAGE_AMOUNT)     AS AVG_CARD_USAGE,
        SUM(CUSTOMER_COUNT)           AS CUSTOMER_COUNT
      FROM SEOUL_DISTRICTLEVEL_DATA_FLOATING_POPULATION_CONSUMPTION_AND_ASSETS.GRANDATA.ASSET_INCOME_INFO
      WHERE DISTRICT_CODE = '${code}'
      GROUP BY STANDARD_YEAR_MONTH
      ORDER BY STANDARD_YEAR_MONTH DESC
      LIMIT 1
    `)

    const raw = rows[0] ?? null
    const data = raw ? {
      avgIncome: Math.round(Number(raw.AVG_INCOME) * 10000),           // 만원 → 원
      avgHouseholdIncome: Math.round(Number(raw.AVG_HOUSEHOLD_INCOME) * 10000),
      avgAsset: Math.round(Number(raw.AVG_ASSET) * 10000),
      rateHighend: Number(raw.RATE_HIGHEND).toFixed(1),                // 고소득자 비율 %
      avgCreditScore: Math.round(Number(raw.AVG_CREDIT_SCORE)),
      avgCardUsage: Math.round(Number(raw.AVG_CARD_USAGE) * 10000),
      customerCount: Math.round(Number(raw.CUSTOMER_COUNT)),
      month: raw.STANDARD_YEAR_MONTH,
    } : null

    // 캐시 저장
    try {
      const client = await clientPromise
      await client.db(DB).collection(COL).updateOne(
        { districtCode: code },
        { $set: { districtCode: code, data, cachedAt: new Date() } },
        { upsert: true }
      )
    } catch (_) {}

    return Response.json({ success: true, data })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
