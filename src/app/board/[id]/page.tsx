"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"

const PRIMARY = "#29B5E8"

interface Post {
  _id: string; title: string; author: string; category: string
  district: string | null; createdAt: string; viewCount: number
  likes: number; commentCount: number; content: string
}
interface Comment {
  _id: string; content: string; author: string; createdAt: string
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "방금 전"
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return new Date(date).toLocaleDateString("ko-KR")
}

export default function PostPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentForm, setCommentForm] = useState({ content: "", author: "" })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/board/posts/${id}`).then(r => r.json()),
      fetch(`/api/board/posts/${id}/comments`).then(r => r.json()),
    ]).then(([postJson, cmtJson]) => {
      if (postJson.success) setPost(postJson.data)
      if (cmtJson.success) setComments(cmtJson.data)
    }).finally(() => setLoading(false))
  }, [id])

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentForm.content.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/board/posts/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(commentForm),
      })
      if (res.ok) {
        const cmtJson = await fetch(`/api/board/posts/${id}/comments`).then(r => r.json())
        if (cmtJson.success) setComments(cmtJson.data)
        setCommentForm(f => ({ ...f, content: "" }))
        setPost(p => p ? { ...p, commentCount: p.commentCount + 1 } : p)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return
    await fetch(`/api/board/posts/${id}`, { method: "DELETE" })
    router.push("/board")
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fbff" }}>
      <div style={{ fontSize: 13, color: "#94a3b8" }}>불러오는 중…</div>
    </div>
  )

  if (!post) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#f8fbff" }}>
      <div style={{ fontSize: 24, marginBottom: 12 }}>🔍</div>
      <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>게시글을 찾을 수 없습니다.</div>
      <Link href="/board" style={{ color: PRIMARY, textDecoration: "none", fontSize: 13 }}>← 목록으로</Link>
    </div>
  )

  return (
    <div style={{ minHeight: "100vh", background: "#f8fbff" }}>
      <nav style={{ background: "white", borderBottom: "1px solid #d6eef9", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ color: PRIMARY, fontSize: 20 }}>❄</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>상권 나침반</span>
        </Link>
        <Link href="/board" style={{ fontSize: 13, color: "#4a7a99", textDecoration: "none" }}>← 목록으로</Link>
      </nav>

      <div style={{ maxWidth: 700, margin: "32px auto", padding: "0 16px" }}>
        {/* 게시글 */}
        <div style={{ background: "white", borderRadius: 16, padding: "28px", boxShadow: "0 2px 12px rgba(41,181,232,0.06)", marginBottom: 16 }}>
          {/* 카테고리 + 지역 */}
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <span style={{ padding: "3px 10px", borderRadius: 20, background: `${PRIMARY}18`, color: PRIMARY, fontSize: 11, fontWeight: 600 }}>{post.category}</span>
            {post.district && <span style={{ fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>📍{post.district}</span>}
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1e293b", marginBottom: 12, lineHeight: 1.4 }}>{post.title}</h1>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid #f0f9ff" }}>
            <div style={{ display: "flex", gap: 12, fontSize: 12, color: "#94a3b8" }}>
              <span>✍️ {post.author}</span>
              <span>🕐 {timeAgo(post.createdAt)}</span>
              <span>👁 {post.viewCount}</span>
            </div>
            <button onClick={handleDelete}
              style={{ padding: "4px 12px", borderRadius: 8, border: "1px solid #fecaca", background: "white", color: "#ef4444", fontSize: 11, cursor: "pointer" }}>
              삭제
            </button>
          </div>

          <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
            {post.content}
          </div>
        </div>

        {/* 댓글 */}
        <div style={{ background: "white", borderRadius: 16, padding: "24px", boxShadow: "0 2px 12px rgba(41,181,232,0.06)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginBottom: 16 }}>
            댓글 <span style={{ color: PRIMARY }}>{comments.length}</span>
          </h2>

          {comments.map((c, i) => (
            <div key={c._id} style={{ paddingBottom: 14, marginBottom: 14, borderBottom: i < comments.length - 1 ? "1px solid #f0f9ff" : "none" }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#4a7a99" }}>{c.author}</span>
                <span style={{ fontSize: 11, color: "#94a3b8" }}>{timeAgo(c.createdAt)}</span>
              </div>
              <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.7 }}>{c.content}</div>
            </div>
          ))}

          {comments.length === 0 && (
            <div style={{ textAlign: "center", padding: "24px 0", color: "#94a3b8", fontSize: 13 }}>첫 댓글을 달아보세요!</div>
          )}

          {/* 댓글 작성 */}
          <form onSubmit={handleComment} style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #f0f9ff" }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="text" value={commentForm.author} onChange={e => setCommentForm(f => ({ ...f, author: e.target.value }))}
                placeholder="닉네임 (선택)"
                style={{ width: 120, padding: "8px 12px", borderRadius: 8, border: "1.5px solid #c8e8f5", fontSize: 12, outline: "none" }} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <textarea value={commentForm.content} onChange={e => setCommentForm(f => ({ ...f, content: e.target.value }))}
                placeholder="댓글을 입력하세요" rows={3}
                style={{ flex: 1, padding: "10px 12px", borderRadius: 10, border: "1.5px solid #c8e8f5", fontSize: 13, outline: "none", resize: "none" }} />
              <button type="submit" disabled={submitting}
                style={{ padding: "0 18px", borderRadius: 10, background: submitting ? "#94a3b8" : PRIMARY, color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, alignSelf: "stretch" }}>
                {submitting ? "…" : "등록"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
