"use client"

import { useState } from "react"
import { DistrictFeature, PRIMARY } from "../types"

interface Props {
  open: boolean
  districts: DistrictFeature[]
  selected: DistrictFeature | null
  onSelect: (f: DistrictFeature) => void
}

export default function MapSidebar({ open, districts, selected, onSelect }: Props) {
  const [query, setQuery] = useState("")

  const filtered = districts.filter((d) =>
    d.districtName.includes(query) || d.cityName.includes(query)
  )
  const grouped = filtered.reduce<Record<string, DistrictFeature[]>>((acc, d) => {
    if (!acc[d.cityName]) acc[d.cityName] = []
    acc[d.cityName].push(d)
    return acc
  }, {})

  return (
    <div style={{
      width: open ? 250 : 0,
      flexShrink: 0,
      display: "flex",
      flexDirection: "column",
      background: "white",
      borderRight: open ? "1px solid #e0f2fe" : "none",
      overflow: "hidden",
      transition: "width 0.25s ease",
    }}>
      <div style={{ width: 250, padding: "12px 12px 6px", flexShrink: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 8 }}>동(洞) 검색</div>
        <input
          type="text"
          placeholder="동 이름 또는 구 이름"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box",
            padding: "8px 10px", borderRadius: 10,
            border: "1.5px solid #c8e8f5", fontSize: 13,
            color: "var(--foreground)", outline: "none", background: "#f8fbff",
          }}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px", width: 250 }}>
        {Object.entries(grouped).map(([cityName, items]) => (
          <div key={cityName} style={{ marginBottom: 4 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: PRIMARY, padding: "6px 6px 3px", letterSpacing: "0.05em" }}>
              {cityName}
            </div>
            {items.map((d) => {
              const isSelected = selected?.districtCode === d.districtCode
              return (
                <button
                  key={d.districtCode}
                  onClick={() => onSelect(d)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", textAlign: "left", padding: "6px 10px", borderRadius: 8,
                    border: "none", cursor: "pointer", fontSize: 13,
                    background: isSelected ? "#e0f2fe" : "transparent",
                    color: isSelected ? PRIMARY : "var(--foreground)",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                >
                  <span>{d.districtName}</span>
                  {d.population && <span style={{ fontSize: 9, color: "#cbd5e1" }}>●</span>}
                </button>
              )
            })}
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 24 }}>검색 결과 없음</div>
        )}
      </div>
    </div>
  )
}