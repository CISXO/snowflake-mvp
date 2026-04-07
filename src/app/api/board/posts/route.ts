import clientPromise from "@/lib/mongodb"
import { NextRequest } from "next/server"
import { ObjectId } from "mongodb"

const DB = "snowflake"
const COL = "posts"

export async function GET(req: NextRequest) {
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1")
  const limit = 20
  const skip = (page - 1) * limit
  const category = req.nextUrl.searchParams.get("category") ?? ""

  try {
    const client = await clientPromise
    const col = client.db(DB).collection(COL)
    const filter = category ? { category } : {}

    const [posts, total] = await Promise.all([
      col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      col.countDocuments(filter),
    ])

    return Response.json({ success: true, data: posts, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { title, content, author, category, district } = body

    if (!title?.trim() || !content?.trim()) {
      return Response.json({ success: false, error: "제목과 내용은 필수입니다." }, { status: 400 })
    }

    const client = await clientPromise
    const result = await client.db(DB).collection(COL).insertOne({
      _id: new ObjectId(),
      title: title.trim(),
      content: content.trim(),
      author: author?.trim() || "익명",
      category: category || "자유",
      district: district || null,
      createdAt: new Date(),
      viewCount: 0,
      likes: 0,
      commentCount: 0,
    })

    return Response.json({ success: true, id: result.insertedId })
  } catch (err) {
    return Response.json({ success: false, error: String(err) }, { status: 500 })
  }
}
