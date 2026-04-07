import Link from "next/link"

export default function About() {
  return (
    <main className="min-h-screen p-12 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">About 페이지</h1>
      <p className="text-gray-600 mb-8">이건 /about 경로 테스트 페이지입니다.</p>
      <Link href="/" className="text-blue-500 hover:underline">← 홈으로</Link>
    </main>
  )
}