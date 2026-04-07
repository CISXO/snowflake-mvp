"use client"

import { useState } from "react"
import Link from "next/link"

export default function Home() {
  const [getResult, setGetResult] = useState<string>("")
  const [postResult, setPostResult] = useState<string>("")
  const [input, setInput] = useState("")

  async function testGet() {
    const res = await fetch("/api/hello")
    const data = await res.json()
    setGetResult(JSON.stringify(data, null, 2))
  }

  async function testPost() {
    const res = await fetch("/api/hello", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: input }),
    })
    const data = await res.json()
    setPostResult(JSON.stringify(data, null, 2))
  }

  return (
    <main className="min-h-screen p-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Next.js API 테스트</h1>
      <nav className="flex gap-4 mb-8">
        <Link href="/about" className="text-blue-500 hover:underline">About</Link>
        <Link href="/contact" className="text-blue-500 hover:underline">Contact</Link>
      </nav>

      {/* GET 테스트 */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-3">GET /api/hello</h2>
        <button
          onClick={testGet}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          GET 요청 보내기
        </button>
        {getResult && (
          <pre className="mt-3 bg-gray-100 p-4 rounded text-sm">{getResult}</pre>
        )}
      </section>

      {/* POST 테스트 */}
      <section>
        <h2 className="text-xl font-semibold mb-3">POST /api/hello</h2>
        <div className="flex gap-2 mb-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="이름 입력"
            className="border px-3 py-2 rounded flex-1"
          />
          <button
            onClick={testPost}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            POST 요청 보내기
          </button>
        </div>
        {postResult && (
          <pre className="mt-3 bg-gray-100 p-4 rounded text-sm">{postResult}</pre>
        )}
      </section>
    </main>
  )
}
