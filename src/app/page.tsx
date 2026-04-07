"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

const PRIMARY = "#29B5E8"
const BUSINESS_TYPES = ["카페/음료", "음식점", "편의점", "미용/뷰티", "의류/패션", "학원/교육", "헬스/운동", "병원/약국", "세탁소", "기타"]
const BUDGET_RANGES = ["1천만원 이하", "1천~3천만원", "3천~5천만원", "5천만원~1억", "1억 이상"]

const CITY_COLORS: Record<string, string> = { "11140": "#29B5E8", "11560": "#10b981", "11650": "#8b5cf6" }
const CITY_NAMES: Record<string, string> = { "11140": "중구", "11560": "영등포구", "11650": "서초구" }

interface YearlyTrend { year: string; visiting: number; working: number; residential: number }
interface TopDistrict { name: string; city: string; code: string; visiting: number }
interface CityStats { cityCode: string; cityName: string; visiting: number; working: number }
interface OverviewData {
  yearlyTrend: YearlyTrend[]
  topDistricts: TopDistrict[]
  cityStats: CityStats[]
}
interface Post { _id: string; title: string; author: string; category: string; createdAt: string; commentCount: number }

// SVG 라인 차트 (홈용)
function LineChart({ data, series, height = 160 }: {
  data: YearlyTrend[]
  series: { key: keyof YearlyTrend; label: string; color: string }[]
  height: number
}) {
  const W = 400; const H = height; const PAD_L = 44; const PAD_R = 16; const PAD_T = 20; const PAD_B = 28
  const plotW = W - PAD_L - PAD_R; const plotH = H - PAD_T - PAD_B

  const allVals = series.flatMap(s => data.map(d => Number(d[s.key])))
  const maxVal = Math.max(...allVals, 1)

  const px = (i: number) => PAD_L + (i / (data.length - 1)) * plotW
  const py = (v: number) => PAD_T + (1 - v / maxVal) * plotH

  const fmtY = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} style={{ overflow: "visible" }}>
      {/* 격자 */}
      {[0, 0.25, 0.5, 0.75, 1].map(t => {
        const y = PAD_T + (1 - t) * plotH
        return (
          <g key={t}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={PAD_L - 4} y={y + 3.5} fontSize={8} fill="#94a3b8" textAnchor="end">{fmtY(maxVal * t)}</text>
          </g>
        )
      })}

      {/* 시리즈 */}
      {series.map(s => {
        const points = data.map((d, i) => `${px(i).toFixed(1)},${py(Number(d[s.key])).toFixed(1)}`)
        const pathD = "M" + points.join("L")
        const lastX = px(data.length - 1); const lastY = py(Number(data[data.length - 1][s.key]))
        return (
          <g key={s.key as string}>
            <path d={pathD} fill="none" stroke={s.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={lastX} cy={lastY} r={3.5} fill={s.color} />
            <text x={lastX + 5} y={lastY + 4} fontSize={8} fill={s.color} fontWeight="700">{fmtY(Number(data[data.length - 1][s.key]))}</text>
          </g>
        )
      })}

      {/* x축 레이블 */}
      {data.map((d, i) => (
        <text key={i} x={px(i)} y={H - PAD_B + 14} fontSize={8.5} fill="#64748b" textAnchor="middle">{d.year}</text>
      ))}

      {/* 범례 */}
      <g transform={`translate(${PAD_L}, ${PAD_T - 10})`}>
        {series.map((s, i) => (
          <g key={s.key as string} transform={`translate(${i * 80}, 0)`}>
            <line x1={0} y1={0} x2={12} y2={0} stroke={s.color} strokeWidth={2} />
            <circle cx={6} cy={0} r={2.5} fill={s.color} />
            <text x={15} y={3.5} fontSize={8} fill={s.color} fontWeight="600">{s.label}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

// 바 차트 (구별 비교)
function BarChart({ cityStats }: { cityStats: CityStats[] }) {
  const max = Math.max(...cityStats.map(c => c.visiting), 1)
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {cityStats.map(c => (
        <div key={c.cityCode}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: "#4a7a99", fontWeight: 600 }}>{c.cityName}</span>
            <span style={{ fontSize: 12, fontWeight: 700 }}>{(c.visiting / 1_000_000).toFixed(1)}M</span>
          </div>
          <div style={{ height: 10, borderRadius: 5, background: "#f1f5f9" }}>
            <div style={{ height: "100%", borderRadius: 5, width: `${c.visiting / max * 100}%`, background: CITY_COLORS[c.cityCode] ?? PRIMARY, transition: "width 0.8s ease" }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function timeAgo(date: string) {
  const m = Math.floor((Date.now() - new Date(date).getTime()) / 60000)
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  return `${Math.floor(h / 24)}일 전`
}

export default function Home() {
  const [businessType, setBusinessType] = useState("")
  const [budget, setBudget] = useState("")
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [chartTab, setChartTab] = useState<"visiting" | "residential">("visiting")

  useEffect(() => {
    fetch("/api/stats/overview").then(r => r.json()).then(json => { if (json.success) setOverview(json.data) })
    fetch("/api/board/posts?page=1").then(r => r.json()).then(json => { if (json.success) setRecentPosts(json.data.slice(0, 4)) })
  }, [])

  const trend = overview?.yearlyTrend ?? []

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav style={{ background: "white", borderBottom: "1px solid #d6eef9", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: PRIMARY, fontSize: 22 }}>❄</span>
          <span style={{ fontWeight: 800, fontSize: 16, color: "var(--foreground)" }}>상권 나침반</span>
        </div>
        <div style={{ display: "flex", gap: 24, fontSize: 13, fontWeight: 600, alignItems: "center" }}>
          <Link href="/map" style={{ color: "#4a7a99", textDecoration: "none" }}>지도 분석</Link>
          <Link href="/board" style={{ color: "#4a7a99", textDecoration: "none" }}>커뮤니티</Link>
          <Link href="/map" style={{ padding: "7px 18px", background: PRIMARY, color: "white", borderRadius: 10, textDecoration: "none" }}>
            시작하기
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "64px 24px 40px", display: "flex", gap: 48, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 360px" }}>
          <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20, background: "#d0edf9", color: "#0e7ab0", marginBottom: 20 }}>
            Snowflake × 소상공인 데이터 분석 플랫폼
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 900, lineHeight: 1.3, color: "var(--foreground)", marginBottom: 16, margin: "0 0 16px" }}>
            업종과 예산 입력 한 번으로<br />
            <span style={{ color: PRIMARY }}>최적 창업 입지</span>를 찾아드립니다
          </h1>
          <p style={{ fontSize: 14, color: "#4a7a99", lineHeight: 1.8, marginBottom: 28, margin: "0 0 28px" }}>
            유동인구 · 카드 소비 · 소득 수준 · 월별 트렌드까지<br />
            2021~2025년 실데이터로 상권을 분석합니다.
          </p>

          {/* 검색 카드 */}
          <div style={{ background: "white", borderRadius: 16, padding: "20px", boxShadow: "0 4px 24px rgba(41,181,232,0.12)" }}>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 6 }}>업종 선택</label>
              <select value={businessType} onChange={e => setBusinessType(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid #c8e8f5`, fontSize: 13, color: "var(--foreground)", outline: "none" }}>
                <option value="">업종을 선택하세요</option>
                {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 6 }}>예산 범위</label>
              <select value={budget} onChange={e => setBudget(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", borderRadius: 10, border: `1.5px solid #c8e8f5`, fontSize: 13, color: "var(--foreground)", outline: "none" }}>
                <option value="">예산 범위를 선택하세요</option>
                {BUDGET_RANGES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <Link href={`/map${businessType ? `?biz=${encodeURIComponent(businessType)}` : ""}`}
              style={{ display: "flex", justifyContent: "center", padding: "12px", borderRadius: 12, background: PRIMARY, color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              상권 지도 분석 시작 →
            </Link>
          </div>
        </div>

        {/* 실시간 통계 카드 */}
        <div style={{ flex: "1 1 280px", display: "flex", flexDirection: "column", gap: 12 }}>
          {overview?.cityStats.map(c => (
            <div key={c.cityCode} style={{ background: "white", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 12px rgba(41,181,232,0.08)", borderLeft: `4px solid ${CITY_COLORS[c.cityCode] ?? PRIMARY}` }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>{c.cityName} 최신 월 유동인구</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: CITY_COLORS[c.cityCode] ?? PRIMARY }}>{(c.visiting / 1_000_000).toFixed(2)}M</div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>방문인구 · 근무: {(c.working / 1_000_000).toFixed(2)}M</div>
            </div>
          )) ?? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ background: "white", borderRadius: 14, padding: "16px 20px", boxShadow: "0 2px 12px rgba(41,181,232,0.08)", height: 72, opacity: 0.4 }} />
            ))
          )}
        </div>
      </section>

      {/* 차트 섹션 */}
      <section style={{ maxWidth: 960, margin: "0 auto", padding: "0 24px 48px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

          {/* 유동인구 연도별 트렌드 */}
          <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(41,181,232,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: 0 }}>유동인구 연도별 추이</h3>
              <div style={{ display: "flex", gap: 6 }}>
                {(["visiting", "residential"] as const).map(k => (
                  <button key={k} onClick={() => setChartTab(k)}
                    style={{ padding: "3px 10px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600, background: chartTab === k ? PRIMARY : "#f0f9ff", color: chartTab === k ? "white" : "#4a7a99" }}>
                    {k === "visiting" ? "방문·근무" : "거주(유입)"}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>서초구·영등포구·중구 합산 (2021~2025)</div>
            {trend.length > 0 ? (
              <LineChart
                data={trend}
                height={160}
                series={chartTab === "visiting"
                  ? [{ key: "visiting", label: "방문인구", color: PRIMARY }, { key: "working", label: "근무인구", color: "#10b981" }]
                  : [{ key: "residential", label: "거주인구", color: "#8b5cf6" }]
                }
              />
            ) : (
              <div style={{ height: 160, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>데이터 로딩 중…</div>
            )}
          </div>

          {/* 구별 방문인구 비교 */}
          <div style={{ background: "white", borderRadius: 16, padding: "20px 24px", boxShadow: "0 2px 12px rgba(41,181,232,0.08)" }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", margin: "0 0 4px" }}>최신 월 구별 방문인구</h3>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 16 }}>현재 분석 대상 지역 비교</div>
            {overview?.cityStats ? (
              <BarChart cityStats={overview.cityStats} />
            ) : (
              <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center", color: "#94a3b8", fontSize: 12 }}>로딩 중…</div>
            )}

            {/* 유동인구 TOP 5 */}
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 8 }}>방문인구 TOP 5 동(洞)</div>
              {(overview?.topDistricts ?? []).map((d, i) => (
                <div key={d.code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 4 ? "1px solid #f0f9ff" : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: i < 3 ? PRIMARY : "#94a3b8", minWidth: 14 }}>{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--foreground)" }}>{d.name}</div>
                      <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.city}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: PRIMARY }}>{(d.visiting / 1_000_000).toFixed(2)}M</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 기능 소개 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 24 }}>
          {[
            { icon: "📊", title: "입지 평가 점수", desc: "S~D등급 + 100점 만점 종합 평가. 업종별 가중치 적용", tags: ["유동인구", "소비분석"] },
            { icon: "📈", title: "5년 트렌드 분석", desc: "2021~2025 월별 유동인구 변화율 & 거주인구 유입 추이", tags: ["월별 차트", "성장률"] },
            { icon: "💰", title: "소득·자산 레이어", desc: "고소득자 비율, 가계소득, 평균 카드 사용액 기준 상권 평가", tags: ["소득분석", "구매력"] },
            { icon: "💬", title: "커뮤니티", desc: "창업 경험자들의 생생한 후기와 상권 정보를 공유하는 공간", tags: ["후기", "질문"] },
          ].map(f => (
            <div key={f.title} style={{ background: "white", borderRadius: 14, padding: "18px", boxShadow: "0 2px 10px rgba(41,181,232,0.07)" }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>{f.title}</h3>
              <p style={{ fontSize: 12, color: "#4a7a99", lineHeight: 1.6, marginBottom: 10 }}>{f.desc}</p>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {f.tags.map(t => <span key={t} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "#e8f6fd", color: "#0e7ab0" }}>{t}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 커뮤니티 미리보기 */}
      <section style={{ maxWidth: 960, margin: "0 auto 48px", padding: "0 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--foreground)", margin: 0 }}>커뮤니티 최신 글</h2>
          <Link href="/board" style={{ fontSize: 12, color: PRIMARY, textDecoration: "none", fontWeight: 600 }}>전체 보기 →</Link>
        </div>
        <div style={{ background: "white", borderRadius: 16, boxShadow: "0 2px 12px rgba(41,181,232,0.06)", overflow: "hidden" }}>
          {recentPosts.length === 0 ? (
            <div style={{ padding: "32px", textAlign: "center" }}>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 12 }}>아직 게시글이 없습니다.</div>
              <Link href="/board/new" style={{ padding: "8px 16px", background: PRIMARY, color: "white", borderRadius: 8, textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                첫 글 작성하기
              </Link>
            </div>
          ) : (
            recentPosts.map((post, i) => (
              <Link key={post._id} href={`/board/${post._id}`} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ display: "flex", alignItems: "center", padding: "14px 20px", borderBottom: i < recentPosts.length - 1 ? "1px solid #f0f9ff" : "none", gap: 12, cursor: "pointer" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f8fbff")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <span style={{ padding: "2px 8px", borderRadius: 20, background: `${PRIMARY}18`, color: PRIMARY, fontSize: 10, fontWeight: 600, flexShrink: 0 }}>{post.category}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", flex: 1 }}>{post.title}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{post.author}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", flexShrink: 0 }}>{timeAgo(post.createdAt)}</span>
                  {post.commentCount > 0 && <span style={{ fontSize: 11, color: PRIMARY, fontWeight: 700, flexShrink: 0 }}>댓글 {post.commentCount}</span>}
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section style={{ textAlign: "center", padding: "48px 24px", background: `linear-gradient(135deg, ${PRIMARY}08, #8b5cf608)` }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--foreground)", marginBottom: 8 }}>지금 바로 상권을 분석해보세요</h2>
        <p style={{ fontSize: 13, color: "#4a7a99", marginBottom: 24 }}>5년치 실데이터 기반 · 업종별 입지 점수 · 소득/자산 분석</p>
        <Link href="/map"
          style={{ display: "inline-flex", alignItems: "center", padding: "13px 32px", borderRadius: 12, background: PRIMARY, color: "white", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          지도에서 상권 탐색하기 →
        </Link>
      </section>

      <footer style={{ textAlign: "center", padding: "20px", fontSize: 11, color: "#7ab8d4", borderTop: "1px solid #d6eef9" }}>
        상권 나침반 · Snowflake Hackathon · 데이터 출처: 소상공인시장진흥공단, 한국부동산원, GRANDATA
      </footer>
    </div>
  )
}
