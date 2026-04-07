"use client"

import { useState, useMemo } from "react"
import { DistrictFeature, PRIMARY, GRADE_COLOR, GRADE_LABEL } from "../types"

interface Props {
  open: boolean
  districts: DistrictFeature[]
  selected: DistrictFeature | null
  businessType: string
  onSelect: (f: DistrictFeature) => void
}

export default function MapSidebar({ open, districts, selected, businessType, onSelect }: Props) {
  const [query, setQuery] = useState("")
  const [mode, setMode] = useState<"search" | "rank">("rank")

  const filtered = useMemo(() => {
    const q = query.trim()
    return q
      ? districts.filter(d => d.districtName.includes(q) || d.cityName.includes(q))
      : districts
  }, [districts, query])

  const ranked = useMemo(
    () => [...filtered].sort((a, b) => (b.score?.total ?? 0) - (a.score?.total ?? 0)),
    [filtered]
  )

  const grouped = useMemo(
    () => filtered.reduce<Record<string, DistrictFeature[]>>((acc, d) => {
      if (!acc[d.cityName]) acc[d.cityName] = []
      acc[d.cityName].push(d)
      return acc
    }, {}),
    [filtered]
  )

  return (
    <div style={{
      width: open ? 260 : 0,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      background: "white",
      borderRight: open ? "1px solid #e0f2fe" : "none",
      overflow: "hidden",
      transition: "width 0.25s ease",
    }}>
      <div style={{ width: 260, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* 검색창 */}
        <div style={{ padding: "12px 12px 8px", flexShrink: 0 }}>
          <input
            type="text"
            placeholder="동 이름 또는 구 이름 검색"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "8px 10px", borderRadius: 10,
              border: `1.5px solid #c8e8f5`, fontSize: 12,
              color: "var(--foreground)", outline: "none", background: "#f8fbff",
            }}
          />
        </div>

        {/* 모드 탭 */}
        <div style={{ display: "flex", padding: "0 12px 8px", gap: 6, flexShrink: 0 }}>
          {(["rank", "search"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "5px 0", borderRadius: 8, border: "none",
                fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: mode === m ? PRIMARY : "#f0f9ff",
                color: mode === m ? "white" : "#4a7a99",
              }}
            >
              {m === "rank" ? "📊 점수 순위" : "🔍 구별 목록"}
            </button>
          ))}
        </div>

        {/* 업종 표시 */}
        {businessType !== "전체" && (
          <div style={{
            margin: "0 12px 8px", padding: "5px 10px", borderRadius: 8,
            background: `${PRIMARY}15`, fontSize: 11, color: PRIMARY, fontWeight: 600,
          }}>
            {businessType} 업종 기준 평가 중
          </div>
        )}

        {/* 목록 */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>
          {mode === "rank" ? (
            // 순위 모드
            ranked.map((d, i) => {
              const isSelected = selected?.districtCode === d.districtCode
              const grade = d.score?.grade
              const color = grade ? GRADE_COLOR[grade] : "#94a3b8"
              return (
                <button
                  key={d.districtCode}
                  onClick={() => onSelect(d)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", textAlign: "left", padding: "8px 10px",
                    borderRadius: 10, border: "none", cursor: "pointer",
                    background: isSelected ? "#e0f2fe" : "transparent",
                    marginBottom: 2,
                  }}
                >
                  {/* 순위 번호 */}
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: i < 3 ? PRIMARY : "#94a3b8",
                    minWidth: 16, textAlign: "right",
                  }}>
                    {i + 1}
                  </span>

                  {/* 지역명 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: isSelected ? 700 : 500, color: "var(--foreground)", marginBottom: 2 }}>
                      {d.districtName}
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{d.cityName}</div>
                  </div>

                  {/* 점수 + 등급 */}
                  {d.score && (
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color }}>{d.score.total}</div>
                      <div style={{
                        fontSize: 9, fontWeight: 700,
                        color: "white", background: color,
                        borderRadius: 4, padding: "1px 4px",
                      }}>
                        {d.score.grade}
                      </div>
                    </div>
                  )}
                </button>
              )
            })
          ) : (
            // 구별 목록 모드
            Object.entries(grouped).map(([cityName, items]) => (
              <div key={cityName} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: PRIMARY, padding: "6px 6px 3px" }}>
                  {cityName}
                </div>
                {items.map(d => {
                  const isSelected = selected?.districtCode === d.districtCode
                  const grade = d.score?.grade
                  const color = grade ? GRADE_COLOR[grade] : "#94a3b8"
                  return (
                    <button
                      key={d.districtCode}
                      onClick={() => onSelect(d)}
                      style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        width: "100%", textAlign: "left", padding: "6px 10px", borderRadius: 8,
                        border: "none", cursor: "pointer", fontSize: 12, marginBottom: 1,
                        background: isSelected ? "#e0f2fe" : "transparent",
                        color: isSelected ? PRIMARY : "var(--foreground)",
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      <span>{d.districtName}</span>
                      {d.score && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          color: "white", background: color,
                          borderRadius: 4, padding: "1px 6px",
                        }}>
                          {d.score.grade} {d.score.total}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}

          {filtered.length === 0 && (
            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 24 }}>
              검색 결과 없음
            </div>
          )}
        </div>

        {/* 하단 범례 */}
        <div style={{ padding: "8px 12px 12px", borderTop: "1px solid #f0f9ff", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {(["S", "A", "B", "C", "D"] as const).map(g => (
              <div key={g} style={{ textAlign: "center" }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 5, margin: "0 auto 2px",
                  background: GRADE_COLOR[g],
                }} />
                <div style={{ fontSize: 9, color: "#94a3b8" }}>{g}</div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, color: "#94a3b8", textAlign: "center", marginTop: 4 }}>
            {GRADE_LABEL.S} ~ {GRADE_LABEL.D}
          </div>
        </div>
      </div>
    </div>
  )
}
