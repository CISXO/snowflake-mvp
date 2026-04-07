import { querySnowflake } from "@/lib/snowflake"

export async function GET() {
  try {
    const rows = await querySnowflake("SELECT CURRENT_ACCOUNT(), CURRENT_USER(), CURRENT_WAREHOUSE()")
    return Response.json({ success: true, data: rows })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}