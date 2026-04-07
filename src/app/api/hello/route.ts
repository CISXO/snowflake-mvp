export async function GET() {
  return Response.json({ message: "안녕하세요! Next.js API 작동 중 🎉", time: new Date().toISOString() })
}

export async function POST(request: Request) {
  const body = await request.json()
  return Response.json({ received: body, message: "POST 요청 받았어요!" })
}