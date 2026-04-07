import { querySnowflake } from "@/lib/snowflake"

export async function GET() {
  try {
    const reits = await querySnowflake(`
      SELECT
        ISU_CD,
        ISU_SRT_CD,
        ISU_ABWD_NM   AS NAME,
        REITS_KIND_CD,
        BASE_PRC      AS BASE_PRICE,
        ULPR          AS UPPER_LIMIT,
        LWLP          AS LOWER_LIMIT,
        CAPT_AMT      AS MARKET_CAP,
        LIST_DD       AS LISTED_DATE
      FROM NEXTRADE_EQUITY_MARKET_DATA.FIN.NX_HT_BAT_REFER_A0
      WHERE REITS_KIND_CD IS NOT NULL
        AND REITS_KIND_CD != ''
      ORDER BY CAPT_AMT DESC NULLS LAST
    `)

    return Response.json({ success: true, count: (reits as unknown[]).length, data: reits })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}