"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const PRIMARY = "#29B5E8"
const CATEGORIES = ["전체", "창업 후기", "상권 분석", "자유", "질문"]

interface Post {
  _id: string
  title: string
  author: string
  category: string
  district: string | null
  createdAt: string
  viewCount: number
  likes: number
  commentCount: number
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "방금 전"
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  return `${d}일 전`
}

export default function BoardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [category, setCategory] = useState("전체")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const cat = category === "전체" ? "" : category
    fetch(`/api/board/posts?page=${page}&category=${encodeURIComponent(cat)}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setPosts(json.data)
          setTotal(json.total)
        }
      })
      .finally(() => setLoading(false))
  }, [page, category])

  const totalPages = Math.ceil(total / 20)

  return (
    <div style={{ minHeight: "100vh", background: "#f8fbff" }}>
      {/* 상단 네비 */}
      <nav style={{ background: "white", borderBottom: "1px solid #d6eef9", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 56 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ color: PRIMARY, fontSize: 20 }}>❄</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1e293b" }}>상권 나침반</span>
        </Link>
        <div style={{ display: "flex", gap: 20, fontSize: 13, fontWeight: 600 }}>
          <Link href="/map" style={{ color: "#4a7a99", textDecoration: "none" }}>지도 분석</Link>
          <Link href="/board" style={{ color: PRIMARY, textDecoration: "none", borderBottom: `2px solid ${PRIMARY}`, paddingBottom: 2 }}>커뮤니티</Link>
        </div>
      </nav>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 16px" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#1e293b", margin: 0, marginBottom: 4 }}>커뮤니티</h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>창업 경험을 나누고 상권 정보를 공유하세요</p>
          </div>
          <Link href="/board/new"
            style={{ padding: "9px 18px", background: PRIMARY, color: "white", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 700 }}>
            글쓰기
          </Link>
        </div>

        {/* 카테고리 필터 */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => { setCategory(cat); setPage(1) }}
              style={{
                padding: "6px 14px", borderRadius: 20, border: "none", cursor: "pointer",
                fontSize: 12, fontWeight: 600,
                background: category === cat ? PRIMARY : "white",
                color: category === cat ? "white" : "#4a7a99",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
              {cat}
            </button>
          ))}
        </div>

        {/* 게시글 목록 */}
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(41,181,232,0.06)", overflow: "hidden" }}>
          {/* 목록 헤더 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px 60px 60px", gap: 8, padding: "10px 20px", background: "#f8fbff", fontSize: 11, fontWeight: 700, color: "#94a3b8", borderBottom: "1px solid #e0f2fe" }}>
            <span>제목</span>
            <span style={{ textAlign: "center" }}>작성자</span>
            <span style={{ textAlign: "center" }}>댓글</span>
            <span style={{ textAlign: "center" }}>조회</span>
            <span style={{ textAlign: "right" }}>작성일</span>
          </div>

          {loading ? (
            <div style={{ padding: "48px", textAlign: "center", color: "#94a3b8", fontSize: 13 }}>불러오는 중…</div>
          ) : posts.length === 0 ? (
            <div style={{ padding: "64px", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📝</div>
              <div style={{ fontSize: 14, color: "#94a3b8", marginBottom: 16 }}>아직 게시글이 없습니다.</div>
              <Link href="/board/new"
                style={{ padding: "8px 16px", background: PRIMARY, color: "white", borderRadius: 8, textDecoration: "none", fontSize: 13, fontWeight: 600 }}>
                첫 글 작성하기
              </Link>
            </div>
          ) : (
            posts.map((post, i) => (
              <Link key={post._id} href={`/board/${post._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 80px 60px 60px 60px", gap: 8,
                  padding: "14px 20px", borderBottom: i < posts.length - 1 ? "1px solid #f0f9ff" : "none",
                  cursor: "pointer", transition: "background 0.15s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fbff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: `${PRIMARY}18`, color: PRIMARY, fontWeight: 600 }}>
                        {post.category}
                      </span>
                      {post.district && (
                        <span style={{ fontSize: 10, color: "#94a3b8" }}>📍{post.district}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", lineHeight: 1.4 }}>{post.title}</div>
                  </div>
                  <div style={{ textAlign: "center", fontSize: 12, color: "#64748b", alignSelf: "center" }}>{post.author}</div>
                  <div style={{ textAlign: "center", fontSize: 12, color: post.commentCount > 0 ? PRIMARY : "#94a3b8", fontWeight: post.commentCount > 0 ? 700 : 400, alignSelf: "center" }}>
                    {post.commentCount > 0 ? post.commentCount : "-"}
                  </div>
                  <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8", alignSelf: "center" }}>{post.viewCount}</div>
                  <div style={{ textAlign: "right", fontSize: 11, color: "#94a3b8", alignSelf: "center" }}>{timeAgo(post.createdAt)}</div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 20 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                  background: p === page ? PRIMARY : "white", color: p === page ? "white" : "#64748b",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                }}>
                {p}
              </button>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 12, fontSize: 12, color: "#94a3b8" }}>
          총 {total}개 게시글
        </div>
      </div>
    </div>
  )
}
