import clientPromise from "@/lib/mongodb"

const DB = "snowflake"
const COL = "bookmarks"

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params
    const client = await clientPromise
    await client.db(DB).collection(COL).deleteMany({ districtCode: code })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
