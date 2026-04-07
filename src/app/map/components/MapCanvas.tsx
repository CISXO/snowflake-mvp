"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { DistrictFeature, PRIMARY, STROKE_DEFAULT, STROKE_W } from "../types"
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
  onSelect: (f: DistrictFeature) => void
  onClear: () => void
  onToggleSidebar: () => void
}

export default function MapCanvas({ districts, selected, sidebarOpen, onSelect, onClear, onToggleSidebar }: Props) {
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

    window.naver.maps.Event.addListener(mapObj.current, "idle", () => {
      if (!lastMousePos.current) return
      const { x, y } = lastMousePos.current
      const el = document.elementFromPoint(x, y)
      if (el && mapRef.current?.contains(el)) {
        el.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: x, clientY: y }))
      }
    })

    setMapsReady(true)
  }

  // 사이드바 토글 시 지도 컨테이너 크기 재계산
  useEffect(() => {
    if (!mapsReady) return
    const timer = setTimeout(() => {
      mapObj.current?.autoResize()
    }, 260)
    return () => clearTimeout(timer)
  }, [sidebarOpen, mapsReady])

  // 외부 선택(사이드바) 동기화
  useEffect(() => {
    if (!mapsReady || !applyHighlightRef.current) return
    if (selected) {
      selectedCodeRef.current = selected.districtCode
      applyHighlightRef.current(selected.districtCode)
    } else {
      selectedCodeRef.current = null
      applyHighlightRef.current(null)
    }
  }, [selected, mapsReady])

  useEffect(() => {
    if (!mapsReady || !districts.length) return

    const currentPolygons = polygonMap.current
    currentPolygons.forEach((p) => p.setMap(null))
    currentPolygons.clear()

    const applyHighlight = (code: string | null) => {
      currentPolygons.forEach((polygon, distCode) => {
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

      currentPolygons.set(feature.districtCode, polygon)

      window.naver.maps.Event.addListener(polygon, "click", (e: any) => {
        justClickedPolygon.current = true
        selectedCodeRef.current = feature.districtCode
        onSelect(feature)
        applyHighlight(feature.districtCode)
        const currentZoom = mapObj.current.getZoom()
        const targetZoom = Math.min(currentZoom + 2, 16)
        if (e.coord) {
          mapObj.current.morph(e.coord, targetZoom)
        }
      })

      window.naver.maps.Event.addListener(polygon, "mouseover", (e: MouseEvent & { domEvent?: MouseEvent }) => {
        if (selectedCodeRef.current !== feature.districtCode) {
          polygon.setOptions({ strokeWeight: 3, strokeOpacity: 1, fillColor: PRIMARY, fillOpacity: 0.12 })
        }
        const rect = mapRef.current?.getBoundingClientRect()
        setHovered({ feature, x: (e.domEvent?.clientX ?? 0) - (rect?.left ?? 0), y: (e.domEvent?.clientY ?? 0) - (rect?.top ?? 0) })
      })

      window.naver.maps.Event.addListener(polygon, "mousemove", (e: MouseEvent & { domEvent?: MouseEvent }) => {
        const rect = mapRef.current?.getBoundingClientRect()
        setHovered((prev) => prev ? { ...prev, x: (e.domEvent?.clientX ?? 0) - (rect?.left ?? 0), y: (e.domEvent?.clientY ?? 0) - (rect?.top ?? 0) } : null)
      })

      window.naver.maps.Event.addListener(polygon, "mouseout", () => {
        if (selectedCodeRef.current === feature.districtCode) {
          polygon.setOptions({ strokeWeight: 3, strokeOpacity: 1, fillColor: PRIMARY, fillOpacity: 0.18 })
        } else {
          polygon.setOptions({ strokeColor: STROKE_DEFAULT, strokeWeight: STROKE_W, strokeOpacity: 1, fillOpacity: 0 })
        }
        setHovered(null)
      })
    })

    const mapClickListener = window.naver.maps.Event.addListener(mapObj.current, "click", () => {
      if (justClickedPolygon.current) { justClickedPolygon.current = false; return }
      selectedCodeRef.current = null
      onClear()
      applyHighlight(null)
    })

    return () => {
      currentPolygons.forEach((p) => p.setMap(null))
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
        onMouseMove={(e) => { lastMousePos.current = { x: e.clientX, y: e.clientY } }}
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

      {/* 호버 툴팁 */}
      {hovered && !selected && (
        <div style={{
          position: "absolute", left: hovered.x + 14, top: hovered.y - 10,
          pointerEvents: "none", background: "white", borderRadius: 10,
          padding: "8px 12px", boxShadow: "0 4px 16px rgba(0,0,0,0.13)",
          border: `1.5px solid ${PRIMARY}33`, minWidth: 140, zIndex: 30,
        }}>
          <div style={{ fontSize: 10, color: PRIMARY, fontWeight: 700, marginBottom: 2 }}>{hovered.feature.cityName}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--foreground)", marginBottom: hovered.feature.population ? 6 : 0 }}>
            {hovered.feature.districtName}
          </div>
          {hovered.feature.population && (
            <div style={{ display: "flex", gap: 12 }}>
              {[
                { label: "방문", value: hovered.feature.population.VISITING },
                { label: "근무", value: hovered.feature.population.WORKING },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 9, color: "#94a3b8" }}>{label}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--foreground)" }}>
                    {value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 우측 상세 패널 */}
      <DistrictPanel feature={selected} onClose={onClear} />

      {!selected && (
        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 20, padding: "8px 16px", fontSize: 12, color: "#4a7a99", boxShadow: "0 2px 12px rgba(0,0,0,0.1)", whiteSpace: "nowrap" }}>
          동(洞)을 클릭하거나 좌측에서 검색하세요
        </div>
      )}
    </div>
  )
}