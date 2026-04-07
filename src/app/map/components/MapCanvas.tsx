"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { DistrictFeature, PRIMARY, STROKE_W, GRADE_COLOR, GRADE_LABEL } from "../types"
import DistrictPanel from "./DistrictPanel"

declare global {
  interface Window { naver: any }
}

interface HoverInfo {
  feature: DistrictFeature
  x: number
  y: number
}

interface Props {
  districts: DistrictFeature[]
  selected: DistrictFeature | null
  sidebarOpen: boolean
  businessType: string
  onSelect: (f: DistrictFeature) => void
  onClear: () => void
  onToggleSidebar: () => void
}

function scoreToFill(score: number): string {
  if (score >= 82) return GRADE_COLOR.S
  if (score >= 65) return GRADE_COLOR.A
  if (score >= 48) return GRADE_COLOR.B
  if (score >= 32) return GRADE_COLOR.C
  return GRADE_COLOR.D
}

export default function MapCanvas({ districts, selected, sidebarOpen, businessType, onSelect, onClear, onToggleSidebar }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapObj = useRef<any>(null)
  const polygonMap = useRef<Map<string, any>>(new Map())
  const applyHighlightRef = useRef<((code: string | null) => void) | null>(null)
  const selectedCodeRef = useRef<string | null>(null)
  const justClickedPolygon = useRef(false)
  const lastMousePos = useRef<{ x: number; y: number } | null>(null)
  const [hovered, setHovered] = useState<HoverInfo | null>(null)
  const [mapsReady, setMapsReady] = useState(false)

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
    if (!mapsReady) return
    const timer = setTimeout(() => mapObj.current?.autoResize(), 260)
    return () => clearTimeout(timer)
  }, [sidebarOpen, mapsReady])

  // 외부 선택(사이드바) 동기화
  useEffect(() => {
    if (!mapsReady || !applyHighlightRef.current) return
    if (selected) {
      selectedCodeRef.current = selected.districtCode
      applyHighlightRef.current(selected.districtCode)
      // 사이드바에서 선택 시 지도 이동
      const poly = polygonMap.current.get(selected.districtCode)
      if (poly && mapObj.current) {
        const bounds = poly.getBounds()
        if (bounds) mapObj.current.panTo(bounds.getCenter())
      }
    } else {
      selectedCodeRef.current = null
      applyHighlightRef.current(null)
    }
  }, [selected, mapsReady])

  // 폴리곤 렌더링 + 하이라이트 (districts 변경 시 재실행)
  useEffect(() => {
    if (!mapsReady || !districts.length) return

    const currentPolygons = polygonMap.current
    currentPolygons.forEach(p => p.setMap(null))
    currentPolygons.clear()

    // districtCode → feature 빠른 조회
    const districtMap = new Map(districts.map(d => [d.districtCode, d]))

    const applyHighlight = (code: string | null) => {
      currentPolygons.forEach((polygon, distCode) => {
        const feature = districtMap.get(distCode)
        const hasScore = !!feature?.score
        const fill = hasScore ? scoreToFill(feature!.score!.total) : PRIMARY

        if (code === null) {
          polygon.setOptions({
            strokeColor: "#94a3b8", strokeOpacity: 0.55, strokeWeight: STROKE_W,
            fillColor: fill, fillOpacity: hasScore ? 0.22 : 0,
          })
        } else if (distCode === code) {
          polygon.setOptions({
            strokeColor: fill, strokeOpacity: 1, strokeWeight: 3,
            fillColor: fill, fillOpacity: 0.48,
          })
        } else {
          polygon.setOptions({
            strokeColor: "#94a3b8", strokeOpacity: 0.3, strokeWeight: STROKE_W,
            fillColor: fill, fillOpacity: hasScore ? 0.1 : 0,
          })
        }
      })
    }
    applyHighlightRef.current = applyHighlight

    districts.forEach(feature => {
      const paths = feature.geom.coordinates[0][0].map(
        ([lng, lat]: number[]) => new window.naver.maps.LatLng(lat, lng)
      )
      const hasScore = !!feature.score
      const fill = hasScore ? scoreToFill(feature.score!.total) : PRIMARY

      const polygon = new window.naver.maps.Polygon({
        map: mapObj.current,
        paths,
        fillColor: fill,
        fillOpacity: hasScore ? 0.22 : 0,
        strokeColor: "#94a3b8",
        strokeOpacity: 0.55,
        strokeWeight: STROKE_W,
        clickable: true,
      })
      currentPolygons.set(feature.districtCode, polygon)

      window.naver.maps.Event.addListener(polygon, "click", (e: any) => {
        justClickedPolygon.current = true
        selectedCodeRef.current = feature.districtCode
        onSelect(feature)
        applyHighlight(feature.districtCode)
        if (e.coord) mapObj.current.morph(e.coord, Math.min(mapObj.current.getZoom() + 1, 16))
      })

      window.naver.maps.Event.addListener(polygon, "mouseover", (e: any) => {
        if (selectedCodeRef.current !== feature.districtCode) {
          polygon.setOptions({ strokeWeight: 2.5, strokeOpacity: 0.9, fillOpacity: hasScore ? 0.38 : 0.15 })
        }
        const rect = mapRef.current?.getBoundingClientRect()
        setHovered({ feature, x: (e.domEvent?.clientX ?? 0) - (rect?.left ?? 0), y: (e.domEvent?.clientY ?? 0) - (rect?.top ?? 0) })
      })

      window.naver.maps.Event.addListener(polygon, "mousemove", (e: any) => {
        const rect = mapRef.current?.getBoundingClientRect()
        setHovered(prev => prev ? { ...prev, x: (e.domEvent?.clientX ?? 0) - (rect?.left ?? 0), y: (e.domEvent?.clientY ?? 0) - (rect?.top ?? 0) } : null)
      })

      window.naver.maps.Event.addListener(polygon, "mouseout", () => {
        if (selectedCodeRef.current === feature.districtCode) {
          polygon.setOptions({ strokeWeight: 3, strokeOpacity: 1, fillOpacity: 0.48 })
        } else {
          polygon.setOptions({ strokeColor: "#94a3b8", strokeOpacity: 0.55, strokeWeight: STROKE_W, fillOpacity: hasScore ? 0.22 : 0 })
        }
        setHovered(null)
      })
    })

    // 초기 하이라이트 적용 (현재 선택 반영)
    applyHighlight(selectedCodeRef.current)

    const mapClickListener = window.naver.maps.Event.addListener(mapObj.current, "click", () => {
      if (justClickedPolygon.current) { justClickedPolygon.current = false; return }
      selectedCodeRef.current = null
      onClear()
      applyHighlight(null)
    })

    return () => {
      currentPolygons.forEach(p => p.setMap(null))
      currentPolygons.clear()
      window.naver.maps.Event.removeListener(mapClickListener)
    }
  }, [mapsReady, districts, onSelect, onClear])

  return (
    <div style={{ flex: 1, position: "relative" }}>
      <Script
        src={`https://openapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${process.env.NEXT_PUBLIC_NAVER_CLIENT_ID}`}
        onLoad={initMap}
      />
      <div
        ref={mapRef}
        style={{ width: "100%", height: "100%" }}
        onMouseMove={e => { lastMousePos.current = { x: e.clientX, y: e.clientY } }}
        onMouseLeave={() => { lastMousePos.current = null }}
      />

      {/* 사이드바 토글 버튼 */}
      <button
        onClick={onToggleSidebar}
        style={{
          position: "absolute", top: 16, left: 16, zIndex: 20,
          background: "white", border: "none", borderRadius: 10,
          width: 36, height: 36, cursor: "pointer",
          boxShadow: "0 2px 10px rgba(0,0,0,0.12)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14, color: PRIMARY,
        }}
      >
        {sidebarOpen ? "◀" : "▶"}
      </button>

      {/* 히트맵 범례 */}
      {districts.some(d => d.score) && !selected && (
        <div style={{
          position: "absolute", bottom: 32, left: 16, zIndex: 20,
          background: "white", borderRadius: 12, padding: "10px 14px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.1)",
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "#4a7a99", marginBottom: 7 }}>
            입지 평가 {businessType !== "전체" ? `· ${businessType}` : ""}
          </div>
          {(["S", "A", "B", "C", "D"] as const).map(g => (
            <div key={g} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
              <div style={{ width: 13, height: 13, borderRadius: 3, background: GRADE_COLOR[g] }} />
              <span style={{ fontSize: 10, color: "#4a7a99" }}>
                <strong style={{ color: GRADE_COLOR[g] }}>{g}</strong> {GRADE_LABEL[g]}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 호버 툴팁 */}
      {hovered && !selected && (
        <div style={{
          position: "absolute", left: hovered.x + 14, top: hovered.y - 10,
          pointerEvents: "none", background: "white", borderRadius: 10,
          padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
          border: `1.5px solid ${PRIMARY}33`, minWidth: 150, zIndex: 30,
        }}>
          <div style={{ fontSize: 10, color: PRIMARY, fontWeight: 700, marginBottom: 2 }}>
            {hovered.feature.cityName}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: 6 }}>
            {hovered.feature.districtName}
          </div>
          {hovered.feature.score ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                background: GRADE_COLOR[hovered.feature.score.grade],
                color: "white", borderRadius: 6, padding: "2px 8px",
                fontSize: 12, fontWeight: 700,
              }}>
                {hovered.feature.score.grade}등급
              </div>
              <span style={{ fontSize: 16, fontWeight: 900, color: GRADE_COLOR[hovered.feature.score.grade] }}>
                {hovered.feature.score.total}점
              </span>
            </div>
          ) : (
            hovered.feature.population && (
              <div style={{ fontSize: 11, color: "#4a7a99" }}>
                방문 {hovered.feature.population.VISITING >= 1000
                  ? `${(hovered.feature.population.VISITING / 1000).toFixed(0)}K`
                  : hovered.feature.population.VISITING}명
              </div>
            )
          )}
          <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>클릭해서 상세 분석 보기</div>
        </div>
      )}

      {/* 우측 상세 패널 */}
      <DistrictPanel feature={selected} businessType={businessType} onClose={onClear} />

      {!selected && !districts.some(d => d.score) && (
        <div style={{
          position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "white", borderRadius: 20, padding: "8px 16px",
          fontSize: 12, color: "#4a7a99", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", whiteSpace: "nowrap",
        }}>
          동(洞)을 클릭하거나 좌측에서 검색하세요
        </div>
      )}
    </div>
  )
}
