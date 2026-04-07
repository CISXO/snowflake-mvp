import clientPromise from "@/lib/mongodb"

const DB = "snowflake"
const COL = "bookmarks"

export async function GET() {
  try {
    const client = await clientPromise
    const docs = await client.db(DB).collection(COL)
      .find({})
      .sort({ savedAt: -1 })
      .limit(50)
      .toArray()
    return Response.json({ success: true, data: docs })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { districtCode, districtName, cityName, businessType, score, grade } = body

    if (!districtCode) {
      return Response.json({ success: false, error: "districtCode required" }, { status: 400 })
    }

    const client = await clientPromise
    const col = client.db(DB).collection(COL)

    // 중복 방지: 같은 동 + 업종은 upsert
    await col.updateOne(
      { districtCode, businessType },
      { $set: { districtCode, districtName, cityName, businessType, score, grade, savedAt: new Date() } },
      { upsert: true }
    )

    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
