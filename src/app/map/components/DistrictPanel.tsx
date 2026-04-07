"use client"

import { useEffect, useState } from "react"
import { DistrictFeature, PRIMARY, GRADE_COLOR, GRADE_BG, GRADE_LABEL, fmt, fmtWon, getRecommendation } from "../types"
import MiniChart from "./MiniChart"

interface Props {
  feature: DistrictFeature | null
  businessType: string
  onClose: () => void
}

type Tab = "overview" | "trend" | "income"

interface TrendPoint { month: string; visiting: number; working: number; residential: number }
interface IncomeData {
  avgIncome: number; avgHouseholdIncome: number; avgAsset: number
  rateHighend: string; avgCreditScore: number; avgCardUsage: number; customerCount: number; month: string
}

export default function DistrictPanel({ feature, businessType, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("overview")
  const [trend, setTrend] = useState<TrendPoint[] | null>(null)
  const [trendLoading, setTrendLoading] = useState(false)
  const [income, setIncome] = useState<IncomeData | null>(null)
  const [incomeLoading, setIncomeLoading] = useState(false)
  const [bookmarkStatus, setBookmarkStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")

  // 지역 바뀌면 탭 리셋 + 캐시 초기화
  useEffect(() => {
    setTab("overview")
    setTrend(null)
    setIncome(null)
  }, [feature?.districtCode])

  // 트렌드 탭 선택 시 fetch
  useEffect(() => {
    if (tab !== "trend" || !feature || trend) return
    setTrendLoading(true)
    fetch(`/api/district/trends?code=${feature.districtCode}`)
      .then(r => r.json())
      .then(json => { if (json.success) setTrend(json.data) })
      .finally(() => setTrendLoading(false))
  }, [tab, feature, trend])

  // 소득 탭 선택 시 fetch
  useEffect(() => {
    if (tab !== "income" || !feature || income) return
    setIncomeLoading(true)
    fetch(`/api/district/income?code=${feature.districtCode}`)
      .then(r => r.json())
      .then(json => { if (json.success) setIncome(json.data) })
      .finally(() => setIncomeLoading(false))
  }, [tab, feature, income])

  const handleBookmark = async () => {
    if (!feature) return
    setBookmarkStatus("saving")
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
      setBookmarkStatus(res.ok ? "saved" : "error")
      setTimeout(() => setBookmarkStatus("idle"), 2000)
    } catch {
      setBookmarkStatus("error")
      setTimeout(() => setBookmarkStatus("idle"), 2000)
    }
  }

  if (!feature) return null

  const score = feature.score
  const pop = feature.population
  const sales = feature.sales
  const gradeColor = score ? GRADE_COLOR[score.grade] : PRIMARY

  // 트렌드 증가율 계산 (첫 달 대비 마지막 달)
  const visitingGrowth = trend && trend.length >= 2
    ? ((trend[trend.length - 1].visiting - trend[0].visiting) / trend[0].visiting * 100).toFixed(1)
    : null

  return (
    <div style={{
      position: "absolute", top: 16, right: 16, bottom: 16,
      width: 292, overflowY: "auto", background: "white", borderRadius: 16,
      boxShadow: "0 4px 24px rgba(0,0,0,0.13)", display: "flex", flexDirection: "column",
    }}>
      {/* 헤더 */}
      <div style={{ padding: "16px 16px 12px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, marginBottom: 2 }}>{feature.cityName}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--foreground)" }}>{feature.districtName}</div>
          </div>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={handleBookmark} title="북마크"
              style={{ background: bookmarkStatus === "saved" ? "#fbbf24" : "#f8fbff", border: `1.5px solid ${bookmarkStatus === "saved" ? "#fbbf24" : "#e0f2fe"}`, borderRadius: 8, width: 30, height: 30, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>
              {bookmarkStatus === "saving" ? "⋯" : bookmarkStatus === "saved" ? "★" : "☆"}
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 22, color: "#9ca3af", cursor: "pointer", padding: 0, lineHeight: 1 }}>×</button>
          </div>
        </div>

        {businessType !== "전체" && (
          <div style={{ display: "inline-block", padding: "3px 10px", borderRadius: 20, background: `${PRIMARY}15`, color: PRIMARY, fontSize: 11, fontWeight: 600, marginBottom: 8 }}>
            {businessType} 업종
          </div>
        )}

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, background: "#f8fbff", borderRadius: 10, padding: 4 }}>
          {([
            { key: "overview", label: "종합 분석" },
            { key: "trend", label: "유동 트렌드" },
            { key: "income", label: "소득·자산" },
          ] as { key: Tab; label: string }[]).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: "5px 0", borderRadius: 7, border: "none", cursor: "pointer",
                fontSize: 11, fontWeight: 600,
                background: tab === t.key ? "white" : "transparent",
                color: tab === t.key ? PRIMARY : "#94a3b8",
                boxShadow: tab === t.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 16px" }}>

        {/* ===== 종합 분석 탭 ===== */}
        {tab === "overview" && (
          <>
            {score ? (
              <>
                {/* 점수 카드 */}
                <div style={{ borderRadius: 14, padding: "14px 16px", marginBottom: 12, background: GRADE_BG[score.grade], border: `1.5px solid ${gradeColor}33` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 11, color: gradeColor, fontWeight: 700, marginBottom: 2 }}>{GRADE_LABEL[score.grade]}</div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: gradeColor, lineHeight: 1 }}>
                        {score.total}<span style={{ fontSize: 14, fontWeight: 600, marginLeft: 2 }}>점</span>
                      </div>
                    </div>
                    <div style={{ width: 50, height: 50, borderRadius: "50%", background: gradeColor, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 900 }}>
                      {score.grade}
                    </div>
                  </div>
                  {[
                    { label: "유동인구", value: score.visiting, color: "#29B5E8" },
                    { label: "소비 규모", value: score.consumption, color: "#10b981" },
                    { label: "업종 적합도", value: score.businessFit, color: "#8b5cf6" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: "#4a7a99" }}>{label}</span>
                        <span style={{ fontSize: 11, fontWeight: 700 }}>{value}점</span>
                      </div>
                      <div style={{ height: 5, borderRadius: 3, background: "rgba(0,0,0,0.06)" }}>
                        <div style={{ height: "100%", borderRadius: 3, width: `${value}%`, background: color, transition: "width 0.6s ease" }} />
                      </div>
                    </div>
                  ))}
                </div>
                {/* 코멘트 */}
                <div style={{ borderRadius: 10, padding: "10px 12px", marginBottom: 12, background: "#f8fbff", border: "1px solid #e0f2fe", fontSize: 12, color: "#4a7a99", lineHeight: 1.7 }}>
                  💡 {getRecommendation(feature, businessType)}
                </div>
              </>
            ) : null}

            {/* 유동인구 */}
            {pop && (
              <>
                <SectionTitle>유동인구 현황</SectionTitle>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 12 }}>
                  {[
                    { label: "방문", value: pop.VISITING, icon: "🚶", bg: "#e0f2fe" },
                    { label: "근무", value: pop.WORKING, icon: "💼", bg: "#dcfce7" },
                    { label: "거주", value: pop.RESIDENTIAL, icon: "🏠", bg: "#fef9c3" },
                  ].map(({ label, value, icon, bg }) => (
                    <div key={label} style={{ borderRadius: 10, background: bg, padding: "10px 6px", textAlign: "center" }}>
                      <div style={{ fontSize: 16, marginBottom: 3 }}>{icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{fmt(value)}</div>
                      <div style={{ fontSize: 10, color: "#4a7a99" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* 카드 소비 */}
            {sales && (
              <>
                <SectionTitle>업종별 카드 소비</SectionTitle>
                <div style={{ borderRadius: 10, padding: "8px 12px", background: "#f0f9ff", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, color: "#4a7a99" }}>💳 월 총 소비</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtWon(sales.TOTAL_SALES)}</span>
                </div>
                {([
                  { label: "음식점", val: sales.FOOD_SALES, icon: "🍽" },
                  { label: "카페", val: sales.COFFEE_SALES, icon: "☕" },
                  { label: "뷰티", val: sales.BEAUTY_SALES, icon: "💅" },
                  { label: "학원·교육", val: sales.EDUCATION_SALES, icon: "📚" },
                  { label: "의료", val: sales.MEDICAL_SALES, icon: "🏥" },
                  { label: "스포츠·문화", val: sales.SPORTS_SALES, icon: "⚽" },
                ] as { label: string; val: number; icon: string }[]).filter(i => i.val > 0).map(({ label, val, icon }) => {
                  const pct = sales.TOTAL_SALES > 0 ? (val / sales.TOTAL_SALES * 100) : 0
                  return (
                    <div key={label} style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 11, color: "#4a7a99" }}>{icon} {label}</span>
                        <span style={{ fontSize: 11, fontWeight: 600 }}>{fmtWon(val)} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({pct.toFixed(1)}%)</span></span>
                      </div>
                      <div style={{ height: 4, borderRadius: 2, background: "#f1f5f9" }}>
                        <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: PRIMARY, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  )
                })}
                {sales.TOTAL_COUNT > 0 && (
                  <div style={{ marginTop: 8, padding: "6px 12px", background: "#f8fbff", borderRadius: 8, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                    <span style={{ color: "#4a7a99" }}>🧾 월 결제 건수</span>
                    <span style={{ fontWeight: 700 }}>{fmt(sales.TOTAL_COUNT)}건</span>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ===== 유동인구 트렌드 탭 ===== */}
        {tab === "trend" && (
          <>
            {trendLoading ? (
              <Loading />
            ) : trend && trend.length > 0 ? (
              <>
                {/* 증가율 배지 */}
                {visitingGrowth && (
                  <div style={{
                    borderRadius: 10, padding: "10px 14px", marginBottom: 12,
                    background: Number(visitingGrowth) >= 0 ? "#ecfdf5" : "#fef2f2",
                    border: `1px solid ${Number(visitingGrowth) >= 0 ? "#bbf7d0" : "#fecaca"}`,
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ fontSize: 10, color: "#4a7a99", marginBottom: 2 }}>2021→2025 방문인구 변화율</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: Number(visitingGrowth) >= 0 ? "#10b981" : "#ef4444" }}>
                        {Number(visitingGrowth) >= 0 ? "+" : ""}{visitingGrowth}%
                      </div>
                    </div>
                    <span style={{ fontSize: 28 }}>{Number(visitingGrowth) >= 0 ? "📈" : "📉"}</span>
                  </div>
                )}

                <SectionTitle>방문·근무인구 월별 추이</SectionTitle>
                <div style={{ marginBottom: 16 }}>
                  <MiniChart
                    labels={trend.map(d => d.month)}
                    series={[
                      { label: "방문", color: "#29B5E8", data: trend.map(d => d.visiting) },
                      { label: "근무", color: "#10b981", data: trend.map(d => d.working) },
                    ]}
                    height={130}
                    yFormat={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                  />
                </div>

                <SectionTitle>거주인구 (인구 유입 지표)</SectionTitle>
                <div style={{ marginBottom: 16 }}>
                  <MiniChart
                    labels={trend.map(d => d.month)}
                    series={[{ label: "거주", color: "#8b5cf6", data: trend.map(d => d.residential) }]}
                    height={100}
                    yFormat={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)}
                  />
                </div>

                {/* 최근 vs 2년 전 비교 */}
                {trend.length >= 24 && (() => {
                  const latest = trend[trend.length - 1]
                  const prev = trend[trend.length - 25]
                  const vChg = ((latest.visiting - prev.visiting) / prev.visiting * 100).toFixed(1)
                  const wChg = ((latest.working - prev.working) / prev.working * 100).toFixed(1)
                  return (
                    <>
                      <SectionTitle>전년 동월 대비</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {[{ label: "방문인구", val: vChg, icon: "🚶" }, { label: "근무인구", val: wChg, icon: "💼" }].map(({ label, val, icon }) => (
                          <div key={label} style={{ borderRadius: 10, padding: "10px", background: "#f8fbff", textAlign: "center" }}>
                            <div style={{ fontSize: 14 }}>{icon}</div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: Number(val) >= 0 ? "#10b981" : "#ef4444" }}>
                              {Number(val) >= 0 ? "+" : ""}{val}%
                            </div>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "32px 0" }}>데이터 없음</div>
            )}
          </>
        )}

        {/* ===== 소득·자산 탭 ===== */}
        {tab === "income" && (
          <>
            {incomeLoading ? (
              <Loading />
            ) : income ? (
              <>
                <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 10 }}>
                  기준: {String(income.month).slice(0, 4)}년 {String(income.month).slice(4)}월
                </div>

                <SectionTitle>소득 현황</SectionTitle>
                {[
                  { label: "평균 개인 연소득", value: income.avgIncome, icon: "💰" },
                  { label: "평균 가계 연소득", value: income.avgHouseholdIncome, icon: "🏠" },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ borderRadius: 10, padding: "10px 14px", background: "#f0f9ff", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#4a7a99" }}>{icon} {label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtWon(value)}</span>
                  </div>
                ))}

                <SectionTitle style={{ marginTop: 12 }}>자산 현황</SectionTitle>
                <div style={{ borderRadius: 10, padding: "10px 14px", background: "#f0fdf4", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#4a7a99" }}>💎 평균 자산</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtWon(income.avgAsset)}</span>
                </div>
                <div style={{ borderRadius: 10, padding: "10px 14px", background: "#fef9c3", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#4a7a99" }}>👑 고소득자 비율</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{income.rateHighend}%</span>
                </div>

                <SectionTitle style={{ marginTop: 12 }}>소비·신용</SectionTitle>
                {[
                  { label: "월 평균 카드 사용액", value: income.avgCardUsage, icon: "💳" },
                ].map(({ label, value, icon }) => (
                  <div key={label} style={{ borderRadius: 10, padding: "10px 14px", background: "#f8fbff", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, color: "#4a7a99" }}>{icon} {label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{fmtWon(value)}</span>
                  </div>
                ))}
                <div style={{ borderRadius: 10, padding: "10px 14px", background: "#f8fbff", marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#4a7a99" }}>⭐ 평균 신용 등급</span>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{income.avgCreditScore}등급</span>
                </div>

                {/* 소비 수준 해석 */}
                <div style={{ borderRadius: 10, padding: "10px 12px", marginTop: 10, background: "#fefce8", border: "1px solid #fde68a", fontSize: 11, color: "#92400e", lineHeight: 1.7 }}>
                  📊 고소득자 비율 {income.rateHighend}%로{" "}
                  {Number(income.rateHighend) >= 10 ? "상권 내 구매력이 높아 프리미엄 업종에 유리합니다." : "중저가 업종이 더 적합한 상권입니다."}
                </div>
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: "32px 0" }}>데이터 없음</div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 8, letterSpacing: "0.03em", ...style }}>
      {children}
    </div>
  )
}

function Loading() {
  return (
    <div style={{ textAlign: "center", padding: "32px 0" }}>
      <div style={{ fontSize: 24, marginBottom: 8 }}>⏳</div>
      <div style={{ fontSize: 12, color: "#94a3b8" }}>데이터 불러오는 중…</div>
      <div style={{ fontSize: 10, color: "#c0d8e8", marginTop: 4 }}>첫 조회 시 Snowflake에서 직접 조회합니다</div>
    </div>
  )
}
