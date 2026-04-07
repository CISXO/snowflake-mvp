import { NextRequest } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  const client = await clientPromise
  const users = await client.db("nuri").collection("users").find({}).toArray()
  return Response.json(users)
}

export async function POST(req: NextRequest) {
  const { name, email } = await req.json()
  const client = await clientPromise
  const result = await client.db("nuri").collection("users").insertOne({
    name,
    email,
    createdAt: new Date(),
  })
  return Response.json({ _id: result.insertedId, name, email }, { status: 201 })
}