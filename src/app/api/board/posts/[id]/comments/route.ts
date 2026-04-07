import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const DB = "snowflake"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const client = await clientPromise
    const comments = await client.db(DB).collection("comments")
      .find({ postId: id })
      .sort({ createdAt: 1 })
      .toArray()
    return Response.json({ success: true, data: comments })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await req.json()
    const { content, author } = body
    if (!content?.trim()) {
      return Response.json({ success: false, error: "내용은 필수입니다." }, { status: 400 })
    }

    const client = await clientPromise
    await client.db(DB).collection("comments").insertOne({
      _id: new ObjectId(),
      postId: id,
      content: content.trim(),
      author: author?.trim() || "익명",
      createdAt: new Date(),
    })
    // 댓글 수 업데이트
    await client.db(DB).collection("posts").updateOne(
      { _id: new ObjectId(id) },
      { $inc: { commentCount: 1 } }
    )
    return Response.json({ success: true })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
