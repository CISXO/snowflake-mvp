"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import Link from "next/link"

declare global {
  interface Window { naver: any }
}

interface DistrictFeature {
  districtCode: string
  cityCode: string
  cityName: string
  districtName: string
  geom: { type: string; coordinates: number[][][][] }
  population: { VISITING: number; WORKING: number; RESIDENTIAL: number } | null
  sales: { TOTAL_SALES: number; FOOD_SALES: number; COFFEE_SALES: number; BEAUTY_SALES: number } | null
}

const PRIMARY = "#29B5E8"
const STROKE_DEFAULT = "#0ea5e9"  // 기본 선 색상 (진한 파랑)
const STROKE_W = 2               // 기본 선 두께

function fmt(n: number | null | undefined) {
  if (n == null) return "-"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

function getCentroid(coords: number[][][][]): [number, number] {
  let latSum = 0, lngSum = 0, count = 0
  coords[0][0].forEach(([lng, lat]) => { lngSum += lng; latSum += lat; count++ })
  return [lngSum / count, latSum / count]
}

export default function MapPage() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<any>(null)
  const polygonMap = useRef<Map<string, any>>(new Map())
  const applyHighlightRef = useRef<((code: string | null) => void) | null>(null)
  const selectedCodeRef = useRef<string | null>(null)
  const justClickedPolygon = useRef(false)

  const [mounted, setMounted] = useState(false)
  const [districts, setDistricts] = useState<DistrictFeature[]>([])
  const [selected, setSelected] = useState<DistrictFeature | null>(null)
  const [hovered, setHovered] = useState<{ feature: DistrictFeature; x: number; y: number } | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [mapsReady, setMapsReady] = useState(false)

  useEffect(() => {
    setMounted(true)
    setLoading(true)
    fetch("/api/district/map-data")
      .then((r) => r.json())
      .then((json) => { if (json.success) setDistricts(json.data) })
      .finally(() => setLoading(false))
  }, [])

  const initMap = () => {
    if (!mapRef.current) return
    mapObj.current = new window.naver.maps.Map(mapRef.current, {
      center: new window.naver.maps.LatLng(37.545, 126.985),
      zoom: 13,
      mapTypeControl: false,
      zoomControl: true,
      zoomControlOptions: { position: window.naver.maps.Position.TOP_RIGHT },
    })
    setMapsReady(true)
  }

  useEffect(() => {
    if (!mapsReady || !districts.length) return

    // 기존 폴리곤 제거
    polygonMap.current.forEach((p) => p.setMap(null))
    polygonMap.current.clear()

    const applyHighlight = (code: string | null) => {
      polygonMap.current.forEach((polygon, distCode) => {
        if (code === null) {
          polygon.setOptions({ strokeColor: STROKE_DEFAULT, strokeOpacity: 1, strokeWeight: STROKE_W, fillOpacity: 0 })
        } else if (distCode === code) {
          polygon.setOptions({ strokeColor: PRIMARY, strokeOpacity: 1, strokeWeight: 3, fillColor: PRIMARY, fillOpacity: 0.18 })
        } else {
          polygon.setOptions({ strokeColor: STROKE_DEFAULT, strokeOpacity: 0.25, strokeWeight: STROKE_W, fillOpacity: 0 })
        }
      })
    }
    applyHighlightRef.current = applyHighlight

    districts.forEach((feature) => {
      const paths = feature.geom.coordinates[0][0].map(
        ([lng, lat]: number[]) => new window.naver.maps.LatLng(lat, lng)
      )

      const polygon = new window.naver.maps.Polygon({
        map: mapObj.current,
        paths,
        fillColor: PRIMARY,
        fillOpacity: 0,
        strokeColor: STROKE_DEFAULT,
        strokeOpacity: 1,
        strokeWeight: STROKE_W,
        clickable: true,
      })

      polygonMap.current.set(feature.districtCode, polygon)

      window.naver.maps.Event.addListener(polygon, "click", () => {
        justClickedPolygon.current = true
        selectedCodeRef.current = feature.districtCode
        setSelected(feature)
        applyHighlight(feature.districtCode)
      })

      window.naver.maps.Event.addListener(polygon, "mouseover", (e: any) => {
        if (selectedCodeRef.current !== feature.districtCode) {
          polygon.setOptions({ strokeWeight: 3, strokeOpacity: 1, fillColor: PRIMARY, fillOpacity: 0.12 })
        }
        const rect = mapRef.current?.getBoundingClientRect()
        setHovered({
          feature,
          x: (e.domEvent?.clientX ?? 0) - (rect?.left ?? 0),
          y: (e.domEvent?.clientY ?? 0) - (rect?.top ?? 0),
        })
      })

      window.naver.maps.Event.addListener(polygon, "mousemove", (e: any) => {
        const rect = mapRef.current?.getBoundingClientRect()
        setHovered((prev) => prev ? {
          ...prev,
          x: (e.domEvent?.clientX ?? 0) - (rect?.left ?? 0),
          y: (e.domEvent?.clientY ?? 0) - (rect?.top ?? 0),
        } : null)
      })

      window.naver.maps.Event.addListener(polygon, "mouseout", () => {
        if (selectedCodeRef.current === feature.districtCode) {
          // 선택된 동은 호버 스타일 유지
          polygon.setOptions({ strokeWeight: 3, strokeOpacity: 1, fillColor: PRIMARY, fillOpacity: 0.18 })
        } else {
          polygon.setOptions({ strokeColor: STROKE_DEFAULT, strokeWeight: STROKE_W, strokeOpacity: 1, fillOpacity: 0 })
        }
        setHovered(null)
      })
    })

    const mapClickListener = window.naver.maps.Event.addListener(mapObj.current, "click", () => {
      if (justClickedPolygon.current) {
        justClickedPolygon.current = false
        return
      }
      selectedCodeRef.current = null
      setSelected(null)
      applyHighlight(null)
    })

    return () => {
      polygonMap.current.forEach((p) => p.setMap(null))
      polygonMap.current.clear()
      window.naver.maps.Event.removeListener(mapClickListener)
    }
  }, [mapsReady, districts])

  const handleSidebarSelect = (feature: DistrictFeature) => {
    justClickedPolygon.current = true
    selectedCodeRef.current = feature.districtCode
    setSelected(feature)
    applyHighlightRef.current?.(feature.districtCode)
    if (mapObj.current) {
      const [lng, lat] = getCentroid(feature.geom.coordinates)
      mapObj.current.panTo(new window.naver.maps.LatLng(lat, lng))
    }
  }

  const handleClear = () => {
    selectedCodeRef.current = null
    setSelected(null)
    applyHighlightRef.current?.(null)
  }

  const filtered = districts.filter((d) =>
    d.districtName.includes(query) || d.cityName.includes(query)
  )
  const grouped = filtered.reduce<Record<string, DistrictFeature[]>>((acc, d) => {
    if (!acc[d.cityName]) acc[d.cityName] = []
    acc[d.cityName].push(d)
    return acc
  }, {})

  return (
    <div suppressHydrationWarning style={{ display: "flex", flexDirection: "column", width: "100%", height: "100vh" }}>
      {/* 상단 바 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", background: "white", boxShadow: "0 1px 8px rgba(41,181,232,0.12)", flexShrink: 0 }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
          <span style={{ color: PRIMARY, fontSize: 18 }}>❄</span>
          <span style={{ fontWeight: 700, fontSize: 14, color: "var(--foreground)" }}>상권 나침반</span>
        </Link>
        {loading && <span style={{ fontSize: 12, color: PRIMARY }}>로딩 중…</span>}
      </div>

      {/* 본문 */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* 좌측 검색 패널 */}
        <div style={{ width: mounted && sidebarOpen ? 250 : 0, flexShrink: 0, display: "flex", flexDirection: "column", background: "white", borderRight: mounted && sidebarOpen ? "1px solid #e0f2fe" : "none", overflow: "hidden", transition: "width 0.25s ease" }}>
          <div style={{ width: 250, padding: "12px 12px 6px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 8, letterSpacing: "0.03em" }}>동(洞) 검색</div>
            <input
              type="text"
              placeholder="동 이름 또는 구 이름"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{ width: "100%", boxSizing: "border-box", padding: "8px 10px", borderRadius: 10, border: `1.5px solid #c8e8f5`, fontSize: 13, color: "var(--foreground)", outline: "none", background: "#f8fbff" }}
            />
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px 8px" }}>
            {Object.entries(grouped).map(([cityName, items]) => (
              <div key={cityName} style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: PRIMARY, padding: "6px 6px 3px", letterSpacing: "0.05em" }}>{cityName}</div>
                {items.map((d) => {
                  const isSelected = selected?.districtCode === d.districtCode
                  return (
                    <button
                      key={d.districtCode}
                      onClick={() => handleSidebarSelect(d)}
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

        {/* 지도 영역 */}
        <div style={{ flex: 1, position: "relative" }}>
          <Script
            src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`}
            onLoad={initMap}
          />
          <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

          {/* 사이드바 토글 버튼 */}
          {mounted && (
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              style={{
                position: "absolute", top: 16, left: 16, zIndex: 20,
                background: "white", border: "none", borderRadius: 10,
                width: 36, height: 36, cursor: "pointer",
                boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: PRIMARY,
              }}
              title={sidebarOpen ? "검색창 닫기" : "검색창 열기"}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          )}

          {/* 우측 상세 패널 */}
          <div style={{
            position: "absolute", top: 16, right: 16, bottom: 16,
            width: selected ? 256 : 0, opacity: selected ? 1 : 0,
            pointerEvents: selected ? "auto" : "none",
            transition: "width 0.25s ease, opacity 0.2s ease",
            background: "white", borderRadius: 16, overflowY: "auto",
            boxShadow: selected ? "0 4px 24px rgba(0,0,0,0.12)" : "none",
          }}>
            {selected && (
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, color: PRIMARY, fontWeight: 600, marginBottom: 2 }}>{selected.cityName}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--foreground)" }}>{selected.districtName}</div>
                  </div>
                  <button onClick={handleClear} style={{ background: "none", border: "none", fontSize: 22, color: "#9ca3af", cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>

                {selected.population ? (
                  <>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", marginBottom: 8 }}>유동인구</div>
                    {[
                      { label: "방문인구", value: selected.population.VISITING, icon: "🚶" },
                      { label: "근무인구", value: selected.population.WORKING, icon: "💼" },
                      { label: "거주인구", value: selected.population.RESIDENTIAL, icon: "🏠" },
                    ].map(({ label, value, icon }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 12px", borderRadius: 10, background: "#f0f9ff", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#4a7a99" }}>{icon} {label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--foreground)" }}>{fmt(value)}</span>
                      </div>
                    ))}

                    {selected.sales && (
                      <>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#4a7a99", margin: "14px 0 8px" }}>카드 소비</div>
                        {[
                          { label: "전체 소비", value: selected.sales.TOTAL_SALES, icon: "💳" },
                          { label: "음식점", value: selected.sales.FOOD_SALES, icon: "🍽" },
                          { label: "카페", value: selected.sales.COFFEE_SALES, icon: "☕" },
                          { label: "뷰티", value: selected.sales.BEAUTY_SALES, icon: "💅" },
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

          {/* 호버 툴팁 */}
          {hovered && !selected && (
            <div style={{
              position: "absolute",
              left: hovered.x + 14,
              top: hovered.y - 10,
              pointerEvents: "none",
              background: "white",
              borderRadius: 10,
              padding: "8px 12px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
              border: `1.5px solid ${PRIMARY}22`,
              minWidth: 140,
              zIndex: 30,
            }}>
              <div style={{ fontSize: 10, color: PRIMARY, fontWeight: 700, marginBottom: 2 }}>
                {hovered.feature.cityName}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>
                {hovered.feature.districtName}
              </div>
              {hovered.feature.population ? (
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { label: "방문", value: hovered.feature.population.VISITING },
                    { label: "근무", value: hovered.feature.population.WORKING },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 9, color: "#94a3b8" }}>{label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>{fmt(value)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 10, color: "#9ca3af" }}>클릭해서 상세보기</div>
              )}
            </div>
          )}

          {!selected && !loading && (
            <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 20, padding: "8px 16px", fontSize: 12, color: "#4a7a99", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}>
              동(洞)을 클릭하거나 좌측에서 검색하세요
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
