import { querySnowflake } from "@/lib/snowflake"

export async function GET() {
  try {
    const rows = await querySnowflake(`
      SELECT
        SGG,
        EMD,
        YYYYMMDD,
        ROUND(AVG(MEME_PRICE_PER_SUPPLY_PYEONG), 0)   AS AVG_SALE_PRICE_PER_PYEONG,
        ROUND(AVG(JEONSE_PRICE_PER_SUPPLY_PYEONG), 0) AS AVG_JEONSE_PRICE_PER_PYEONG,
        SUM(TOTAL_HOUSEHOLDS)                         AS TOTAL_HOUSEHOLDS
      FROM KOREAN_POPULATION__APARTMENT_MARKET_PRICE_DATA.HACKATHON_2025Q2.REGION_APT_RICHGO_MARKET_PRICE_M_H
      GROUP BY SGG, EMD, YYYYMMDD
      ORDER BY YYYYMMDD DESC
    `)
    return Response.json({ success: true, data: rows })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}