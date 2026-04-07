export interface PopulationData {
  VISITING: number
  WORKING: number
  RESIDENTIAL: number
}

export interface SalesData {
  TOTAL_SALES: number
  FOOD_SALES: number
  COFFEE_SALES: number
  BEAUTY_SALES: number
  EDUCATION_SALES: number
  MEDICAL_SALES: number
  SPORTS_SALES: number
  TOTAL_COUNT: number
}

export interface DistrictScore {
  total: number        // 0-100 종합 점수
  visiting: number     // 유동인구 점수
  consumption: number  // 소비 규모 점수
  businessFit: number  // 업종 적합도 점수
  grade: "S" | "A" | "B" | "C" | "D"
}

export interface DistrictFeature {
  districtCode: string
  cityCode: string
  cityName: string
  districtName: string
  geom: { type: string; coordinates: number[][][][] }
  population: PopulationData | null
  sales: SalesData | null
  score?: DistrictScore
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return "-"
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function fmtWon(n: number | null | undefined): string {
  if (n == null) return "-"
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`
  if (n >= 10_000) return `${(n / 10_000).toFixed(0)}만`
  return `${n}원`
}

export function getCentroid(coords: number[][][][]): [number, number] {
  let latSum = 0, lngSum = 0, count = 0
  coords[0][0].forEach(([lng, lat]) => { lngSum += lng; latSum += lat; count++ })
  return [lngSum / count, latSum / count]
}

export const PRIMARY = "#29B5E8"
export const STROKE_DEFAULT = "#0ea5e9"
export const STROKE_W = 1.5

// 업종별 소비 필드 매핑
const BIZ_KEY: Partial<Record<string, keyof SalesData>> = {
  "카페/음료": "COFFEE_SALES",
  "음식점": "FOOD_SALES",
  "미용/뷰티": "BEAUTY_SALES",
  "학원/교육": "EDUCATION_SALES",
  "헬스/운동": "SPORTS_SALES",
  "병원/약국": "MEDICAL_SALES",
}

export const BUSINESS_TYPES = [
  "전체", "카페/음료", "음식점", "편의점", "미용/뷰티",
  "의류/패션", "학원/교육", "헬스/운동", "병원/약국", "세탁소",
]

function norm(val: number, max: number): number {
  return max > 0 ? Math.min(100, Math.round(val / max * 100)) : 0
}

export function computeScores(districts: DistrictFeature[], businessType: string): DistrictFeature[] {
  const maxVisiting = Math.max(...districts.map(d => d.population?.VISITING ?? 0), 1)
  const maxTotal = Math.max(...districts.map(d => d.sales?.TOTAL_SALES ?? 0), 1)

  const bizKey = BIZ_KEY[businessType]
  const maxBiz = bizKey
    ? Math.max(...districts.map(d => (d.sales?.[bizKey] as number) ?? 0), 1)
    : maxTotal

  return districts.map(d => {
    const visiting = norm(d.population?.VISITING ?? 0, maxVisiting)
    const consumption = norm(d.sales?.TOTAL_SALES ?? 0, maxTotal)

    const bizVal = bizKey
      ? ((d.sales?.[bizKey] as number) ?? 0)
      : (d.sales?.TOTAL_SALES ?? 0)
    const businessFit = norm(bizVal, maxBiz)

    // 가중 합산: 유동인구 40% + 소비규모 30% + 업종적합 30%
    const total = Math.round(visiting * 0.4 + consumption * 0.3 + businessFit * 0.3)

    const grade: DistrictScore["grade"] =
      total >= 82 ? "S" : total >= 65 ? "A" : total >= 48 ? "B" : total >= 32 ? "C" : "D"

    return { ...d, score: { total, visiting, consumption, businessFit, grade } }
  })
}

export const GRADE_COLOR: Record<DistrictScore["grade"], string> = {
  S: "#10b981",
  A: "#22c55e",
  B: "#eab308",
  C: "#f97316",
  D: "#ef4444",
}

export const GRADE_BG: Record<DistrictScore["grade"], string> = {
  S: "#ecfdf5",
  A: "#f0fdf4",
  B: "#fefce8",
  C: "#fff7ed",
  D: "#fef2f2",
}

export const GRADE_LABEL: Record<DistrictScore["grade"], string> = {
  S: "최우수 상권",
  A: "우수 상권",
  B: "보통 상권",
  C: "주의 필요",
  D: "창업 부적합",
}

export function getRecommendation(d: DistrictFeature, businessType: string): string {
  if (!d.score) return ""
  const { total, visiting, consumption, businessFit } = d.score
  const biz = businessType !== "전체" ? businessType : ""

  if (total >= 82) {
    return `유동인구와 소비 규모 모두 상위권입니다.${biz ? ` ${biz} 업종의 수요도 높아` : ""} 창업 적합도가 매우 뛰어납니다.`
  }
  if (total >= 65) {
    if (businessFit >= 70) return `${biz ? `${biz} 관련 소비 수요가 높아` : "업종 수요가 충분해"} 창업에 유리한 환경입니다.`
    if (visiting >= 70) return "유동인구가 풍부해 고객 유입이 용이합니다. 소비 특성에 맞는 업종을 선택하세요."
    return "전반적으로 안정적인 상권입니다. 틈새 수요를 공략하면 효과적입니다."
  }
  if (total >= 48) {
    if (visiting < 40) return "유동인구가 적은 편입니다. 단골 중심의 내방형 업종이 더 적합할 수 있습니다."
    if (consumption < 40) return "소비 규모가 낮습니다. 저가 전략이나 주거 밀착형 업종을 고려하세요."
    return "중간 수준의 상권입니다. 차별화된 콘셉트와 마케팅 전략이 필요합니다."
  }
  if (total >= 32) {
    return "유동인구와 소비가 낮습니다. 창업 전 충분한 현장 조사를 권장합니다."
  }
  return "현재 데이터 기준 창업 여건이 어렵습니다. 인근 상권도 함께 검토하세요."
}
