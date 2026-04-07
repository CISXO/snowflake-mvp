"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import MapSidebar from "./components/MapSidebar"
import MapCanvas from "./components/MapCanvas"
import { DistrictFeature, computeScores, BUSINESS_TYPES, PRIMARY } from "./types"

export default function MapPage() {
  const [rawDistricts, setRawDistricts] = useState<DistrictFeature[]>([])
  const [selected, setSelected] = useState<DistrictFeature | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [businessType, setBusinessType] = useState("전체")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLoading(true)
    fetch("/api/district/map-data")
      .then(r => r.json())
      .then(json => { if (json.success) setRawDistricts(json.data) })
      .finally(() => setLoading(false))
  }, [])

  // 업종이 바뀔 때마다 점수 재계산
  const districts = useMemo(
    () => computeScores(rawDistricts, businessType),
    [rawDistricts, businessType]
  )

  // 선택 상태도 점수와 동기화
  const selectedWithScore = useMemo(() => {
    if (!selected) return null
    return districts.find(d => d.districtCode === selected.districtCode) ?? selected
  }, [selected, districts])

  const handleSelect = (f: DistrictFeature) => {
    const scored = districts.find(d => d.districtCode === f.districtCode)
    setSelected(scored ?? f)
  }

  const handleClear = () => setSelected(null)

  return (
    <div suppressHydrationWarning style={{ display: "flex", flexDirection: "column", width: "100%", height: "100vh" }}>
      {/* 상단 바 */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", height: 52, background: "white",
        boxShadow: "0 1px 8px rgba(41,181,232,0.12)", flexShrink: 0, zIndex: 10,
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ color: PRIMARY, fontSize: 20 }}>❄</span>
          <span style={{ fontWeight: 700, fontSize: 15, color: "var(--foreground)" }}>상권 나침반</span>
        </Link>

        {/* 업종 선택 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#4a7a99", fontWeight: 600 }}>업종</span>
          <select
            value={businessType}
            onChange={e => setBusinessType(e.target.value)}
            style={{
              padding: "5px 10px", borderRadius: 8,
              border: `1.5px solid ${PRIMARY}55`, fontSize: 12,
              color: "var(--foreground)", background: "white",
              fontWeight: 600, cursor: "pointer", outline: "none",
            }}
          >
            {BUSINESS_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {loading && (
          <span style={{ fontSize: 11, color: PRIMARY }}>데이터 로딩 중…</span>
        )}
      </div>

      {/* 본문 */}
      {mounted && (
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <MapSidebar
            open={sidebarOpen}
            districts={districts}
            selected={selectedWithScore}
            businessType={businessType}
            onSelect={handleSelect}
          />
          <MapCanvas
            districts={districts}
            selected={selectedWithScore}
            sidebarOpen={sidebarOpen}
            businessType={businessType}
            onSelect={handleSelect}
            onClear={handleClear}
            onToggleSidebar={() => setSidebarOpen(v => !v)}
          />
        </div>
      )}
    </div>
  )
}
