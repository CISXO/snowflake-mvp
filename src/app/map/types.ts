export interface DistrictFeature {
  districtCode: string
  cityCode: string
  cityName: string
  districtName: string
  geom: { type: string; coordinates: number[][][][] }
  population: { VISITING: number; WORKING: number; RESIDENTIAL: number } | null
  sales: { TOTAL_SALES: number; FOOD_SALES: number; COFFEE_SALES: number; BEAUTY_SALES: number } | null
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return "-"
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}

export function getCentroid(coords: number[][][][]): [number, number] {
  let latSum = 0, lngSum = 0, count = 0
  coords[0][0].forEach(([lng, lat]) => { lngSum += lng; latSum += lat; count++ })
  return [lngSum / count, latSum / count]
}

export const PRIMARY = "#29B5E8"
export const STROKE_DEFAULT = "#0ea5e9"
export const STROKE_W = 2