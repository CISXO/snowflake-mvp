"use client"

import { useState } from "react"
import Link from "next/link"

const BUSINESS_TYPES = [
  "카페/음료", "음식점", "편의점", "미용/뷰티", "의류/패션",
  "학원/교육", "헬스/운동", "병원/약국", "세탁소", "기타",
]

const BUDGET_RANGES = [
  "1천만원 이하", "1천~3천만원", "3천~5천만원", "5천만원~1억", "1억 이상",
]

const FEATURES = [
  {
    icon: "📍",
    title: "상권 매력도 분석",
    desc: "유동인구 · 소비 지출 · 지역 소득 수준을 기반으로 동(洞) 단위 상권 점수를 산출합니다.",
    tags: ["유동인구", "신용카드 소비", "소득 수준"],
  },
  {
    icon: "⚠️",
    title: "리스크 조기 경보",
    desc: "유동인구 감소, 업종 과밀, 아파트 시세 급등 등 창업 위험 신호를 자동 감지합니다.",
    tags: ["폐업 위험", "경쟁 포화", "임대료 급등"],
  },
  {
    icon: "📈",
    title: "리츠 타이밍 인디케이터",
    desc: "해당 상권 상업용 부동산 리츠 동향으로 '지금 이 상권, 임대료 오를까?'를 판단합니다.",
    tags: ["넥스트레이드", "리츠 시세", "부동산 타이밍"],
  },
  {
    icon: "🗺️",
    title: "지도 클러스터링",
    desc: "전국 상가 데이터를 지도 위에 시각화. 멀리서는 밀집도, 가까이서는 상세 정보를 확인합니다.",
    tags: ["상권 지도", "클러스터링", "상세 정보"],
  },
]

export default function Home() {
  const [businessType, setBusinessType] = useState("")
  const [budget, setBudget] = useState("")

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-4" style={{ background: "white", borderBottom: "1px solid #d6eef9" }}>
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--primary)", fontSize: "1.5rem" }}>❄</span>
          <span className="font-bold text-lg" style={{ color: "var(--foreground)" }}>상권 나침반</span>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <Link href="/map" style={{ color: "var(--primary)" }} className="hover:opacity-70">지도 보기</Link>
          <a href="#features" style={{ color: "var(--foreground)" }} className="hover:opacity-70">기능 소개</a>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-4 pt-20 pb-16">
        <div
          className="inline-block text-xs font-semibold px-4 py-1 rounded-full mb-6"
          style={{ background: "#d0edf9", color: "var(--primary-dark)" }}
        >
          Powered by Snowflake · 소상공인진흥공단 · 넥스트레이드
        </div>

        <h1 className="text-4xl font-bold leading-tight mb-4" style={{ color: "var(--foreground)" }}>
          업종과 예산을 입력하면<br />
          <span style={{ color: "var(--primary)" }}>최적 창업 입지</span>를 추천해드립니다
        </h1>
        <p className="text-base mb-10 max-w-xl" style={{ color: "#4a7a99" }}>
          유동인구 · 소비 패턴 · 소득 수준 · 리츠 타이밍까지 분석해<br />
          지금 이 상권에 창업해도 되는지 알려드립니다.
        </p>

        {/* Search Card */}
        <div
          className="w-full max-w-xl rounded-2xl p-6 text-left"
          style={{ background: "white", boxShadow: "0 4px 24px rgba(41,181,232,0.12)" }}
        >
          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              업종 선택
            </label>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "#c8e8f5", color: "var(--foreground)" }}
            >
              <option value="">업종을 선택하세요</option>
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>
              예산 범위
            </label>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm"
              style={{ borderColor: "#c8e8f5", color: "var(--foreground)" }}
            >
              <option value="">예산 범위를 선택하세요</option>
              {BUDGET_RANGES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <Link
            href="/map"
            className="flex items-center justify-center w-full py-3 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90"
            style={{ background: "var(--primary)" }}
          >
            상권 분석 시작하기 →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-16 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--foreground)" }}>
          4개 레이어로 분석하는 상권
        </h2>
        <p className="text-center text-sm mb-10" style={{ color: "#4a7a99" }}>
          데이터 기반으로 창업의 모든 리스크를 사전에 파악하세요
        </p>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl p-6"
              style={{ background: "white", boxShadow: "0 2px 12px rgba(41,181,232,0.08)" }}
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-base mb-2" style={{ color: "var(--foreground)" }}>{f.title}</h3>
              <p className="text-sm mb-4" style={{ color: "#4a7a99" }}>{f.desc}</p>
              <div className="flex flex-wrap gap-2">
                {f.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-3 py-1 rounded-full"
                    style={{ background: "#e8f6fd", color: "var(--primary-dark)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Example Output */}
      <section className="px-8 py-12 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-2" style={{ color: "var(--foreground)" }}>
          이런 결과를 받아보세요
        </h2>
        <p className="text-center text-sm mb-8" style={{ color: "#4a7a99" }}>업종: 카페 | 예산: 중간 | 타겟: 20-30대 여성</p>

        <div
          className="rounded-2xl p-6"
          style={{ background: "white", boxShadow: "0 2px 12px rgba(41,181,232,0.08)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: "var(--primary)", color: "white" }}
            >
              추천 1위
            </span>
            <span className="font-bold" style={{ color: "var(--foreground)" }}>서초구 반포동</span>
          </div>

          <div className="flex flex-col gap-2 text-sm mb-5">
            <div className="flex items-center gap-2" style={{ color: "#15803d" }}>
              <span>✅</span> 유동인구 상위 15%
            </div>
            <div className="flex items-center gap-2" style={{ color: "#15803d" }}>
              <span>✅</span> 20-30대 여성 비율 높음
            </div>
            <div className="flex items-center gap-2" style={{ color: "#15803d" }}>
              <span>✅</span> 1인당 소비 지출 높음
            </div>
            <div className="flex items-center gap-2" style={{ color: "#b45309" }}>
              <span>⚠️</span> 아파트 시세 상승 중 → 임대료 주의
            </div>
          </div>

          <div
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#fefce8", border: "1px solid #fde68a" }}
          >
            <span>🟡</span>
            <div>
              <div className="font-semibold text-sm mb-1" style={{ color: "#92400e" }}>리츠 타이밍: 중립</div>
              <div className="text-xs" style={{ color: "#92400e" }}>
                서초구 상업용 리츠 최근 3개월 횡보 — 임대료 급등 가능성 낮음, 창업 타이밍 무난
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-16 px-4">
        <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--foreground)" }}>
          지금 바로 상권을 분석해보세요
        </h2>
        <Link
          href="/map"
          className="inline-flex items-center px-8 py-3 rounded-xl text-white font-bold transition-opacity hover:opacity-90"
          style={{ background: "var(--primary)" }}
        >
          지도에서 상권 탐색하기 →
        </Link>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-xs" style={{ color: "#7ab8d4", borderTop: "1px solid #d6eef9" }}>
        상권 나침반 · Snowflake Hackathon · 데이터 출처: 소상공인시장진흥공단, 한국부동산원, 넥스트레이드
      </footer>
    </div>
  )
}