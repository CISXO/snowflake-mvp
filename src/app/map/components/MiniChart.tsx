"use client"

interface Series {
  label: string
  color: string
  data: number[]
}

interface Props {
  labels: string[]      // x축 레이블 (월 코드 등)
  series: Series[]
  height?: number
  showLabels?: boolean
  yFormat?: (v: number) => string
}

function minMax(series: Series[]) {
  const all = series.flatMap(s => s.data)
  return { min: Math.min(...all), max: Math.max(...all) }
}

function toPath(data: number[], min: number, max: number, W: number, H: number, pad: number): string {
  const range = max - min || 1
  const pts = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (W - pad * 2)
    const y = H - pad - ((v - min) / range) * (H - pad * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  return "M" + pts.join("L")
}

export default function MiniChart({ labels, series, height = 120, showLabels = true, yFormat }: Props) {
  const W = 100   // viewBox units (percentage-like)
  const H = height / (showLabels ? 1 : 1)
  const PAD = 6
  const { min, max } = minMax(series)
  const fmt = yFormat ?? ((v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))

  // x축 레이블: 최대 6개만 표시
  const step = Math.ceil(labels.length / 6)
  const xLabels = labels.map((l, i) => ({ label: l, i, show: i % step === 0 || i === labels.length - 1 }))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={height}
      style={{ overflow: "visible" }}
    >
      {/* 격자선 */}
      {[0, 0.5, 1].map(t => {
        const y = PAD + (1 - t) * (H - PAD * 2)
        const val = min + t * (max - min)
        return (
          <g key={t}>
            <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#f1f5f9" strokeWidth={0.5} />
            {t !== 0 && (
              <text x={PAD - 1} y={y + 1} fontSize={3} fill="#94a3b8" textAnchor="end">
                {fmt(val)}
              </text>
            )}
          </g>
        )
      })}

      {/* 데이터 시리즈 */}
      {series.map(s => {
        const pathD = toPath(s.data, min, max, W, H, PAD)
        const areaD = pathD + `L${(PAD + (W - PAD * 2)).toFixed(1)},${(H - PAD).toFixed(1)}L${PAD},${(H - PAD).toFixed(1)}Z`
        return (
          <g key={s.label}>
            <path d={areaD} fill={s.color} fillOpacity={0.08} stroke="none" />
            <path d={pathD} fill="none" stroke={s.color} strokeWidth={1.2} strokeLinejoin="round" strokeLinecap="round" />
            {/* 마지막 점 강조 */}
            {(() => {
              const last = s.data.length - 1
              const range = max - min || 1
              const lx = PAD + (last / (s.data.length - 1)) * (W - PAD * 2)
              const ly = H - PAD - ((s.data[last] - min) / range) * (H - PAD * 2)
              return <circle cx={lx} cy={ly} r={1.2} fill={s.color} />
            })()}
          </g>
        )
      })}

      {/* x축 레이블 */}
      {showLabels && xLabels.filter(l => l.show).map(({ label, i }) => {
        const x = PAD + (i / (labels.length - 1)) * (W - PAD * 2)
        const disp = label.length === 6 ? `${label.slice(2, 4)}.${label.slice(4)}` : label
        return (
          <text key={i} x={x} y={H - 0.5} fontSize={2.8} fill="#94a3b8" textAnchor="middle">
            {disp}
          </text>
        )
      })}

      {/* 범례 */}
      {series.length > 1 && (
        <g>
          {series.map((s, i) => (
            <g key={s.label} transform={`translate(${PAD + i * 20}, ${PAD - 2})`}>
              <line x1={0} y1={0} x2={5} y2={0} stroke={s.color} strokeWidth={1.5} />
              <text x={6} y={0.8} fontSize={2.8} fill={s.color}>{s.label}</text>
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}
