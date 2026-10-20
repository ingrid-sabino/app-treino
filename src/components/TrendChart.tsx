import { useState } from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

// Linha de tendência de uma série (1RM estimado, peso corporal).
// Uma série só: sem legenda, o título do card nomeia o que está plotado.
// Cor validada contra a superfície nos dois temas (--chart-line).

export interface TrendPoint {
  date: string // AAAA-MM-DD
  value: number
}

const fmtDate = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`

export default function TrendChart({ points, unit, height = 160 }: { points: TrendPoint[]; unit: string; height?: number }) {
  const [showTable, setShowTable] = useState(false)
  if (points.length === 0) return null
  const last = points[points.length - 1]
  // Eixo com números redondos: passo de 1, 2, 5 ou 10 conforme a amplitude
  const values = points.map((p) => p.value)
  const range = Math.max(...values) - Math.min(...values) || 1
  const step = [1, 2, 5, 10, 20].find((s) => range / s <= 4) ?? 50
  const lo = Math.floor(Math.min(...values) / step) * step
  const hi = Math.ceil(Math.max(...values) / step) * step + (Math.max(...values) % step === 0 ? step : 0)
  const ticks = Array.from({ length: Math.round((hi - lo) / step) + 1 }, (_, i) => lo + i * step)
  const fmt = (v: number) => `${v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} ${unit}`

  return (
    <div>
      <div style={{ height }} className="-mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={points} margin={{ top: 24, right: 12, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--line)" strokeWidth={1} />
            <XAxis
              dataKey="date"
              tickFormatter={fmtDate}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: 'var(--line)' }}
              minTickGap={24}
            />
            <YAxis
              domain={[lo, hi]}
              ticks={ticks}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={32}
              tickFormatter={(v: number) => Math.round(v).toString()}
            />
            <Tooltip
              cursor={{ stroke: 'var(--text-muted)', strokeWidth: 1 }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                color: 'var(--text)',
                fontSize: 13,
              }}
              labelFormatter={(d) => fmtDate(String(d))}
              formatter={(v) => [fmt(Number(v)), '']}
              separator=""
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="var(--chart-line)"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              fill="var(--chart-line)"
              fillOpacity={0.1}
              isAnimationActive={false}
              activeDot={{ r: 5, fill: 'var(--chart-line)', stroke: 'var(--surface)', strokeWidth: 2 }}
              // Só o último ponto tem marcador e rótulo direto
              dot={(props: { cx?: number; cy?: number; index?: number }) =>
                props.index === points.length - 1 ? (
                  <g key="last">
                    <circle cx={props.cx} cy={props.cy} r={4} fill="var(--chart-line)" stroke="var(--surface)" strokeWidth={2} />
                    <text x={props.cx} y={(props.cy ?? 0) - 10} textAnchor="end" fontSize={12} fontWeight={700} fill="var(--text)">
                      {fmt(last.value)}
                    </text>
                  </g>
                ) : (
                  <g key={props.index} />
                )
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <button className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted" onClick={() => setShowTable(!showTable)}>
        {showTable ? 'Esconder valores' : 'Ver valores'}
      </button>
      {showTable && (
        <table className="mt-2 w-full text-sm">
          <tbody>
            {[...points].reverse().map((p) => (
              <tr key={p.date} className="border-t border-line">
                <td className="py-1 text-muted">{fmtDate(p.date)}</td>
                <td className="py-1 text-right font-semibold">{fmt(p.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
