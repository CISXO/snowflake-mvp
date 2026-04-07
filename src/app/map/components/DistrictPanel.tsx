"use client"

import { useState } from "react"
import { DistrictFeature, PRIMARY, GRADE_COLOR, GRADE_BG, GRADE_LABEL, fmt, fmtWon, getRecommendation } from "../types"

interface Props {
  feature: DistrictFeature | null
  businessType: string
  onClose: () => void
}

interface BookmarkState {
  status: "idle" | "saving" | "saved" | "error"
}

export default function DistrictPanel({ feature, businessType, onClose }: Props) {
  const [bookmark, setBookmark] = useState<BookmarkState>({ status: "idle" })

  const handleBookmark = async () => {
    if (!feature) return
    setBookmark({ status: "saving" })
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          districtCode: feature.districtCode,
          districtName: feature.districtName,
          cityName: feature.cityName,
          businessType,
          score: feature.score?.total,
          grade: feature.score?.grade,
        }),
      })
      setBookmark({ status: res.ok ? "saved" : "error" })
      setTimeout(() => setBookmark({ status: "idle" }), 2000)
    } catch {
      setBookmark({ status: "error" })
      setTimeout(() => setBookmark({ status: "idle" }), 2000)
    }
  }

  if (!feature) return null

  const score = feature.score
  const pop = feature.population
  const sales = feature.sales
  const gradeColor = score ? GRADE_COLOR[score.grade] : PRIMARY

  return (
    <div style={{
      position: "absolute", top: 16, right: 16, bottom: 16,
      width: 280, overflowY: "auto",
      background: "white", borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,0.13)",
    }}>
      <div style={{ padding: "16px 16px 20px" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, marginBottom: 2 }}>{feature.cityName}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>{feature.districtName}</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {/* 북마크 버튼 */}
            <button
              onClick={handleBookmark}
              title="북마크 저장"
              style={{
                background: bookmark.status === "saved" ? "#fbbf24" : "#f8fbff",
                border: `1.5px solid ${bookmark.status === "saved" ? "#fbbf24" : "#e0f2fe"}`,
                borderRadius: 8, width: 30, height: 30, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14,
              }}
            >
              {bookmark.status === "saving" ? "⋯" : bookmark.status === "saved" ? "★" : "☆"}
            </button>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", fontSize: 22, color: "#9ca3af", cursor: "pointer", lineHeight: 1, padding: 0 }}
            >×</button>
          </div>
        </div>

        {/* 업종 뱃지 */}
        {businessType !== "전체" && (
          <div style={{
            display: "inline-block", padding: "3px 10px", borderRadius: 20,
            background: `${PRIMARY}15`, color: PRIMARY, fontSize: 11, fontWeight: 600,
            marginBottom: 12,
          }}>
            {businessType} 업종 기준
          </div>
        )}

        {score ? (
          <>
            {/* 종합 점수 카드 */}
            <div style={{
              borderRadius: 14, padding: "14px 16px", marginBottom: 14,
              background: GRADE_BG[score.grade],
              border: `1.5px solid ${gradeColor}33`,
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: gradeColor, fontWeight: 700, marginBottom: 2 }}>
                    {GRADE_LABEL[score.grade]}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: gradeColor, lineHeight: 1 }}>
                    {score.total}
                    <span style={{ fontSize: 14, fontWeight: 600, color: gradeColor, marginLeft: 2 }}>점</span>
                  </div>
                </div>
                <div style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: gradeColor, color: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, fontWeight: 900,
                }}>
                  {score.grade}
                </div>
              </div>

              {/* 점수 바 */}
              {[
                { label: "유동인구", value: score.visiting, color: "#29B5E8" },
                { label: "소비 규모", value: score.consumption, color: "#10b981" },
                { label: "업종 적합도", value: score.businessFit, color: "#8b5cf6" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: "#4a7a99" }}>{label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--foreground)" }}>{value}점</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "rgba(0,0,0,0.06)" }}>
                    <div style={{
                      height: "100%", borderRadius: 3,
                      width: `${value}%`, background: color,
                      transition: "width 0.6s ease",
                    }} />
                  </div>
                </div>
              ))}
            </div>

            {/* 추천 코멘트 */}
            <div style={{
              borderRadius: 10, padding: "10px 12px", marginBottom: 14,
              background: "#f8fbff", border: "1px solid #e0f2fe",
              fontSize: 12, color: "#4a7a99", lineHeight: 1.7,
            }}>
              💡 {getRecommendation(feature, businessType)}
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>점수 계산 중…</div>
        )}

        {/* 유동인구 */}
        {pop ? (
          <>
            <SectionTitle>유동인구</SectionTitle>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
              {[
                { label: "방문", value: pop.VISITING, icon: "🚶", color: "#e0f2fe" },
                { label: "근무", value: pop.WORKING, icon: "💼", color: "#dcfce7" },
                { label: "거주", value: pop.RESIDENTIAL, icon: "🏠", color: "#fef9c3" },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ borderRadius: 10, background: color, padding: "10px 6px", textAlign: "center" }}>
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{fmt(value)}</div>
                  <div style={{ fontSize: 10, color: "#4a7a99" }}>{label}</div>
                </div>
              ))}
            </div>
          </>
        ) : null}

        {/* 카드 소비 */}
        {sales ? (
          <>
            <SectionTitle>카드 소비 현황</SectionTitle>
            <div style={{ marginBottom: 14 }}>
              {/* 전체 소비 강조 */}
              <div style={{
                borderRadius: 10, padding: "10px 14px", marginBottom: 8,
                background: "#f0f9ff",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 12, color: "#4a7a99" }}>💳 월 총 소비</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: "var(--foreground)" }}>
                  {fmtWon(sales.TOTAL_SALES)}
                </span>
              </div>

              {/* 업종별 소비 */}
              {[
                { label: "음식점", value: sales.FOOD_SALES, icon: "🍽" },
                { label: "카페", value: sales.COFFEE_SALES, icon: "☕" },
                { label: "뷰티", value: sales.BEAUTY_SALES, icon: "💅" },
                { label: "학원/교육", value: sales.EDUCATION_SALES, icon: "📚" },
                { label: "의료", value: sales.MEDICAL_SALES, icon: "🏥" },
                { label: "스포츠/문화", value: sales.SPORTS_SALES, icon: "⚽" },
              ].filter(item => item.value > 0).map(({ label, value, icon }) => {
                const ratio = sales.TOTAL_SALES > 0 ? (value / sales.TOTAL_SALES * 100).toFixed(1) : "0"
                return (
                  <div key={label} style={{ marginBottom: 5 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                      <span style={{ fontSize: 11, color: "#4a7a99" }}>{icon} {label}</span>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: "var(--foreground)" }}>{fmtWon(value)}</span>
                        <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 4 }}>({ratio}%)</span>
                      </div>
                    </div>
                    <div style={{ height: 4, borderRadius: 2, background: "#f1f5f9" }}>
                      <div style={{
                        height: "100%", borderRadius: 2,
                        width: `${ratio}%`, background: PRIMARY,
                        transition: "width 0.5s ease",
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* 월 거래 건수 */}
            {sales.TOTAL_COUNT > 0 && (
              <div style={{
                borderRadius: 10, padding: "8px 14px",
                background: "#f8fbff",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                fontSize: 12,
              }}>
                <span style={{ color: "#4a7a99" }}>🧾 월 결제 건수</span>
                <span style={{ fontWeight: 700, color: "var(--foreground)" }}>{fmt(sales.TOTAL_COUNT)}건</span>
              </div>
            )}
          </>
        ) : null}

        {!pop && !sales && (
          <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "32px 0" }}>데이터 없음</div>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 8, letterSpacing: "0.03em" }}>
      {children}
    </div>
  )
}
