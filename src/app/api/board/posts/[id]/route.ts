import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const DB = "snowflake"
const COL = "posts"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const client = await clientPromise
    const col = client.db(DB).collection(COL)

    const post = await col.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { viewCount: 1 } },
      { returnDocument: "after" }
    )

    if (!post) return Response.json({ success: false, error: "게시글 없음" }, { status: 404 })
    return Response.json({ success: true, data: post })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const client = await clientPromise
    await client.db(DB).collection(COL).deleteOne({ _id: new ObjectId(id) })
    // 연결된 댓글도 삭제
    await client.db(DB).collection("comments").deleteMany({ postId: id })
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
