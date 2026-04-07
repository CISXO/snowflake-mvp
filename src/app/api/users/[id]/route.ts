import { NextRequest } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function PUT(req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const { id } = await ctx.params
  const { name, email } = await req.json()
  const client = await clientPromise
  await client.db("nuri").collection("users").updateOne(
    { _id: new ObjectId(id) },
    { $set: { name, email } }
  )
  return Response.json({ _id: id, name, email })
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/users/[id]">) {
  const { id } = await ctx.params
  const client = await clientPromise
  await client.db("nuri").collection("users").deleteOne({ _id: new ObjectId(id) })
  return Response.json({ deleted: id })
}