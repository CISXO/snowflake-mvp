"use client"

import { DistrictFeature, PRIMARY, fmt } from "../types"

interface Props {
  feature: DistrictFeature | null
  onClose: () => void
}

export default function DistrictPanel({ feature, onClose }: Props) {
  return (
    <div style={{
      position: "absolute", top: 16, right: 16, bottom: 16,
      width: feature ? 256 : 0,
      opacity: feature ? 1 : 0,
      pointerEvents: feature ? "auto" : "none",
      transition: "width 0.25s ease, opacity 0.2s ease",
      background: "white", borderRadius: 16, overflowY: "auto",
      boxShadow: feature ? "0 4px 24px rgba(0,0,0,0.12)" : "none",
    }}>
      {feature && (
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, marginBottom: 2 }}>{feature.cityName}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>{feature.districtName}</div>
            </div>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", fontSize: 22, color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}
            >×</button>
          </div>

          {feature.population ? (
            <>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 8 }}>유동인구</div>
              {[
                { label: "방문인구", value: feature.population.VISITING, icon: "🚶" },
                { label: "근무인구", value: feature.population.WORKING, icon: "💼" },
                { label: "거주인구", value: feature.population.RESIDENTIAL, icon: "🏠" },
              ].map(({ label, value, icon }) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", borderRadius: 10, background: "#f0f9ff", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#4a7a99" }}>{icon} {label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{fmt(value)}</span>
                </div>
              ))}

              {feature.sales && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", margin: "14px 0 8px" }}>카드 소비</div>
                  {[
                    { label: "전체 소비", value: feature.sales.TOTAL_SALES, icon: "💳" },
                    { label: "음식점", value: feature.sales.FOOD_SALES, icon: "🍽" },
                    { label: "카페", value: feature.sales.COFFEE_SALES, icon: "☕" },
                    { label: "뷰티", value: feature.sales.BEAUTY_SALES, icon: "💅" },
                  ].map(({ label, value, icon }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", borderRadius: 10, background: "#f0fdf4", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "#4a7a99" }}>{icon} {label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{fmt(value)}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <div style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", padding: "32px 0" }}>데이터 없음</div>
          )}
        </div>
      )}
    </div>
  )
}