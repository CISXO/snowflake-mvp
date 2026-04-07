"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

const PRIMARY = "#29B5E8"
const CATEGORIES = ["창업 후기", "상권 분석", "자유", "질문"]

export default function NewPostPage() {
  const router = useRouter()
  const [form, setForm] = useState({ title: "", content: "", author: "", category: "자유", district: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.content.trim()) {
      setError("제목과 내용을 입력하세요.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/board/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.success) {
        router.push(`/board/${json.id}`)
      } else {
        setError(json.error ?? "오류가 발생했습니다.")
      }
    } catch {
      setError("서버 오류가 발생했습니다.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fbff" }}>
      <nav style={{ background: "white", borderBottom: "1px solid #d6eef9", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ color: PRIMARY, fontSize: 20 }}>❄</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>상권 나침반</span>
        </Link>
        <Link href="/board" style={{ fontSize: 13, color: "#4a7a99", textDecoration: "none" }}>← 목록으로</Link>
      </nav>

      <div style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 24 }}>글쓰기</h1>

        <form onSubmit={handleSubmit} style={{ background: "white", borderRadius: 16, padding: "28px", boxShadow: "0 2px 12px rgba(41,181,232,0.06)" }}>
          {/* 카테고리 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4a7a99", marginBottom: 6 }}>카테고리</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {CATEGORIES.map(cat => (
                <button type="button" key={cat} onClick={() => setForm(f => ({ ...f, category: cat }))}
                  style={{ padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, background: form.category === cat ? PRIMARY : "#f0f9ff", color: form.category === cat ? "white" : "#4a7a99" }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4a7a99", marginBottom: 6 }}>제목 *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="제목을 입력하세요"
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #c8e8f5", fontSize: 14, outline: "none" }} />
          </div>

          {/* 내용 */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4a7a99", marginBottom: 6 }}>내용 *</label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="내용을 입력하세요" rows={10}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #c8e8f5", fontSize: 13, outline: "none", resize: "vertical", lineHeight: 1.7 }} />
          </div>

          {/* 작성자 + 지역 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4a7a99", marginBottom: 6 }}>닉네임</label>
              <input type="text" value={form.author} onChange={e => setForm(f => ({ ...f, author: e.target.value }))} placeholder="익명"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #c8e8f5", fontSize: 13, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#4a7a99", marginBottom: 6 }}>관련 지역 (선택)</label>
              <input type="text" value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} placeholder="예: 반포동, 여의도동"
                style={{ width: "100%", boxSizing: "border-box", padding: "9px 12px", borderRadius: 10, border: "1.5px solid #c8e8f5", fontSize: 13, outline: "none" }} />
            </div>
          </div>

          {error && (
            <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "#fef2f2", color: "#ef4444", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <Link href="/board"
              style={{ padding: "10px 20px", borderRadius: 10, background: "#f0f9ff", color: "#4a7a99", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
              취소
            </Link>
            <button type="submit" disabled={submitting}
              style={{ padding: "10px 24px", borderRadius: 10, background: submitting ? "#94a3b8" : PRIMARY, color: "white", border: "none", cursor: submitting ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700 }}>
              {submitting ? "등록 중…" : "등록"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
