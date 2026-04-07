import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db("nuri")

    // 테스트 데이터 삽입
    const collection = db.collection("test")
    await collection.insertOne({ message: "MongoDB 연결 성공!", createdAt: new Date() })

    // 전체 조회
    const docs = await collection.find({}).toArray()

    return NextResponse.json({ success: true, count: docs.length, docs })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}