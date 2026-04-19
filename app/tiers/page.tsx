'use client'

import { useEffect, useState, useMemo } from "react"
import Papa from "papaparse"
import { TrendingUp, TrendingDown, Search, ChevronUp, ChevronDown, ChevronsUpDown, Activity, BarChart2, Layers } from "lucide-react"

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#3671C6',
  'mclaren': '#FF8000', 'aston martin': '#006F62', 'alpine': '#0090FF',
  'williams': '#005AFF', 'racing bulls': '#1634CC', 'rb f1 team': '#1634CC',
  'vcarb': '#1634CC', 'sauber': '#52E252', 'haas': '#B6BABD',
  'haas f1 team': '#B6BABD', 'cadillac': '#C8A951', 'cadillac f1 team': '#C8A951',
  'audi': '#D0D0D0',
}

const TIERS = [
  { label: 'S', desc: 'Benchmark', min: 1820, gradient: 'linear-gradient(135deg, #ff3b3b, #ff0060)', glow: '#ff3b3b' },
  { label: 'A', desc: 'Elite',     min: 1750, gradient: 'linear-gradient(135deg, #ff9500, #ffcc00)', glow: '#ff9500' },
  { label: 'B', desc: 'Upper Mid', min: 1700, gradient: 'linear-gradient(135deg, #34c759, #30d158)', glow: '#34c759' },
  { label: 'C', desc: 'Midfield',  min: 1650, gradient: 'linear-gradient(135deg, #007aff, #0055ff)', glow: '#007aff' },
  { label: 'D', desc: 'Lower Mid', min: 1600, gradient: 'linear-gradient(135deg, #af52de, #8c2be2)', glow: '#af52de' },
  { label: 'E', desc: 'Backmarker',min: 0,    gradient: 'linear-gradient(135deg, #636366, #48484a)', glow: '#636366' },
]

interface Driver {
  rank:   number
  driver: string
  team:   string
  elo:    number
  pts:    number
  change: number
  wins:   number
  p2:     number
  p3:     number
  peak:   number
}

type SortDir = 'asc' | 'desc'
type SortCol = keyof Driver

const getTeamColor = (team: string | undefined): string =>
  TEAM_COLORS[team?.toLowerCase() ?? ''] ?? '#8a8a94'

// ── Sub-components ────────────────────────────────────────────────

function DriverName({
  name,
  size = 14,
  lastSize = 14,
  color = '#fff',
}: {
  name: string
  size?: number
  lastSize?: number
  color?: string
}) {
  const parts = name.split(' ')
  const last  = parts.pop() ?? ''
  const first = parts.join(' ')
  return (
    <span>
      <span style={{ fontSize: size - 1, color: '#52525b', fontWeight: 600 }}>{first} </span>
      <span style={{ fontSize: lastSize, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', color, letterSpacing: '-0.01em' }}>
        {last}
      </span>
    </span>
  )
}

function SortIndicator({ col, sort }: { col: SortCol; sort: { col: SortCol; dir: SortDir } }) {
  if (sort.col !== col) return <ChevronsUpDown size={10} style={{ color: '#3f3f46', marginLeft: 3 }} />
  return sort.dir === 'asc'
    ? <ChevronUp   size={10} style={{ color: '#f97316', marginLeft: 3 }} />
    : <ChevronDown size={10} style={{ color: '#f97316', marginLeft: 3 }} />
}

// ── Main component ────────────────────────────────────────────────

export default function App() {
  const [drivers,  setDrivers]  = useState<Driver[]>([])
  const [loading,  setLoading]  = useState(true)
  const [view,     setView]     = useState<'rankings' | 'tiers'>('rankings')
  const [search,   setSearch]   = useState('')
  const [sort,     setSort]     = useState<{ col: SortCol; dir: SortDir }>({ col: 'elo', dir: 'desc' })
  const [updated,  setUpdated]  = useState('')
  const [hovered,  setHovered]  = useState<string | null>(null)

  useEffect(() => {
    Papa.parse<Record<string, string>>(SHEET_URL + '&cachebust=' + Date.now(), {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data
        if (!rows.length) { setLoading(false); return }

        const keys = Object.keys(rows[0])
        const find = (...names: string[]): string =>
          keys.find(k => names.includes(k.toLowerCase().trim())) ?? ''

        const DRIVER  = find('driver')
        const TEAM    = find('team')
        const ELO     = find('elo')
        const CHANGE  = find('last change')
        const PEAK    = find('highest rating')
        const LOW     = find('lowest rating')
        const AVG     = find('season average')
        const IMPLIED = find('implied rating')

        const parsed: Driver[] = rows
          .filter(r => r[DRIVER]?.trim())
          .map(r => ({
            rank:    0,
            driver:  r[DRIVER].trim(),
            team:    (r[TEAM] || 'Unknown').trim(),
            elo:     parseInt(r[ELO])      || 1500,
            pts:     parseFloat(r[AVG])    || 0,   // repurposed as Season Avg
            change:  r[CHANGE] ? parseInt(r[CHANGE]) : 0,
            wins:    parseInt(r[IMPLIED])  || 0,   // repurposed as Implied
            p2:      parseInt(r[LOW])      || 0,   // repurposed as Lowest
            p3:      0,
            peak:    parseInt(r[PEAK])     || parseInt(r[ELO]) || 1500,
          }))
          .sort((a, b) => b.elo - a.elo)
          .map((d, i) => ({ ...d, rank: i + 1 }))

        setDrivers(parsed)
        setUpdated(new Date().toLocaleTimeString())
        setLoading(false)
      },
      error: () => setLoading(false),
    })
  }, [])

  const sorted = useMemo<Driver[]>(() => {
    const filtered = drivers.filter(d =>
      d.driver.toLowerCase().includes(search.toLowerCase()) ||
      d.team.toLowerCase().includes(search.toLowerCase())
    )
    return [...filtered].sort((a, b) => {
      const va = (a[sort.col] as number) ?? -Infinity
      const vb = (b[sort.col] as number) ?? -Infinity
      return sort.dir === 'asc' ? va - vb : vb - va
    })
  }, [drivers, search, sort])

  const top3 = useMemo<Driver[]>(() => drivers.slice(0, 3), [drivers])

  const handleSort = (col: SortCol) =>
    setSort(prev => ({ col, dir: prev.col === col && prev.dir === 'desc' ? 'asc' : 'desc' }))

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#050507', color: '#e4e4e7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ═══ HEADER ═══ */}
      <div style={{ position: 'relative', overflow: 'hidden', background: '#08080b', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(249,115,22,1) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,1) 1px, transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(249,115,22,0.06), transparent)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 28px 0', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.45em', textTransform: 'uppercase', color: '#ef4444' }}>LIVE · 2026 SEASON</span>
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: '-0.03em', lineHeight: 1 }}>
                Driver <span style={{ color: '#f97316' }}>Power</span> Index
              </h1>
            </div>
            {updated && <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#3f3f46', paddingBottom: 8 }}>synced {updated}</span>}
          </div>

          {/* NAV TABS */}
          <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            {([
              { id: 'rankings', label: 'Rankings',  Icon: BarChart2 },
              { id: 'tiers',    label: 'Tier List',  Icon: Layers    },
            ] as const).map(({ id, label, Icon }) => (
              <button key={id} onClick={() => setView(id)} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '12px 24px', background: 'transparent', border: 'none', cursor: 'pointer',
                borderBottom: view === id ? '2px solid #f97316' : '2px solid transparent',
                color: view === id ? '#f97316' : '#52525b',
                fontSize: 11, fontWeight: 900, letterSpacing: '0.3em', textTransform: 'uppercase',
                transition: 'color 0.2s', marginBottom: -1,
              }}>
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '28px 28px 80px' }}>

        {/* ═══ RANKINGS VIEW ═══ */}
        {view === 'rankings' && (
          <div>
            {/* PODIUM */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, flexWrap: 'wrap' }}>
                {loading
                  ? [180, 220, 180].map((w, i) => (
                      <div key={i} style={{ width: w, height: i === 1 ? 210 : 175, background: '#111116', borderRadius: 20, animation: 'pulse 1.5s infinite' }} />
                    ))
                  : ([top3[1], top3[0], top3[2]] as (Driver | undefined)[]).filter((d): d is Driver => !!d).map((d, idx) => {
                      const pos = idx === 0 ? 2 : idx === 1 ? 1 : 3
                      const color      = getTeamColor(d.team)
                      const isP1       = pos === 1
                      const medalColor = pos === 1 ? '#FBB924' : pos === 2 ? '#9CA3AF' : '#CD7F32'
                      const medalBg    = pos === 1 ? 'rgba(251,191,36,0.12)' : pos === 2 ? 'rgba(156,163,175,0.1)' : 'rgba(205,127,50,0.1)'
                      return (
                        <div key={d.driver} style={{
                          width: isP1 ? 230 : 195, position: 'relative',
                          background: 'linear-gradient(160deg, #111116, #0d0d11)',
                          border: `1px solid ${isP1 ? 'rgba(249,115,22,0.2)' : 'rgba(255,255,255,0.06)'}`,
                          borderRadius: 22, padding: isP1 ? '30px 22px 22px' : '22px 18px 18px',
                          overflow: 'hidden', textAlign: 'center',
                          boxShadow: isP1 ? '0 20px 60px -10px rgba(249,115,22,0.12), 0 0 0 1px rgba(249,115,22,0.1)' : 'none',
                        }}>
                          <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% -10%, ${color}12, transparent)`, pointerEvents: 'none' }} />
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, transparent 0%, ${color} 40%, ${color} 60%, transparent 100%)` }} />
                          <div style={{ width: isP1 ? 46 : 38, height: isP1 ? 46 : 38, borderRadius: '50%', background: medalBg, border: `1.5px solid ${medalColor}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontSize: isP1 ? 20 : 16, fontWeight: 900, fontStyle: 'italic', color: medalColor }}>{pos}</div>
                          <div style={{ marginBottom: 12 }}><DriverName name={d.driver} size={isP1 ? 13 : 11} lastSize={isP1 ? 22 : 17} /></div>
                          <div style={{ fontSize: 8, fontWeight: 800, letterSpacing: '0.25em', textTransform: 'uppercase', color, opacity: 0.85, marginBottom: 14 }}>{d.team}</div>
                          <div style={{ fontSize: isP1 ? 30 : 24, fontFamily: 'monospace', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em', lineHeight: 1 }}>{d.elo.toLocaleString()}</div>
                          <div style={{ fontSize: 8, letterSpacing: '0.4em', color: '#3f3f46', fontWeight: 800, textTransform: 'uppercase', marginTop: 3 }}>ELO RATING</div>
                          {d.change !== 0 && (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 12, fontSize: 10, fontFamily: 'monospace', fontWeight: 800, color: d.change > 0 ? '#22c55e' : '#ef4444', background: d.change > 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', padding: '3px 9px', borderRadius: 99, border: `1px solid ${d.change > 0 ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                              {d.change > 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                              {d.change > 0 ? `+${d.change}` : d.change}
                            </div>
                          )}
                        </div>
                      )
                    })}
              </div>
            </div>

            {/* TABLE */}
            <div style={{ background: 'linear-gradient(180deg, #0f0f14, #0a0a0d)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.4)', flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Activity size={13} style={{ color: '#f97316' }} />
                  <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.4em', textTransform: 'uppercase', color: '#52525b' }}>FULL DRIVER GRID</span>
                  <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#27272a' }}>· {sorted.length} drivers</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <Search size={11} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#3f3f46' }} />
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
                    style={{ background: '#08080b', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '7px 12px 7px 30px', color: '#e4e4e7', fontSize: 12, outline: 'none', width: 200, fontFamily: 'inherit' }} />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(0,0,0,0.5)' }}>
                      {([
                        { k: null,     label: '#',      align: 'left',  pl: 24 },
                        { k: null,     label: 'DRIVER', align: 'left' },
                        { k: 'elo',    label: 'ELO',    align: 'right' },
                        { k: 'pts',  label: 'AVG',     align: 'right' },
                        { k: 'wins', label: 'IMPLIED', align: 'right' },
                        { k: 'p2',   label: 'LOW',     align: 'right' },
                        { k: 'change', label: '+/−',    align: 'right' },
                        { k: 'peak',   label: 'PEAK',   align: 'right' },
                        { k: null,     label: 'FORM',   align: 'right', pr: 20 },
                      ] as { k: SortCol | null; label: string; align: string; pl?: number; pr?: number }[]).map(({ k, label, align, pl, pr }) => (
                        <th key={label} onClick={k ? () => handleSort(k) : undefined}
                          style={{ padding: `10px ${pr ?? 14}px 10px ${pl ?? 14}px`, textAlign: align as 'left' | 'right', fontSize: 9, fontWeight: 900, letterSpacing: '0.35em', textTransform: 'uppercase', color: k && sort.col === k ? '#f97316' : '#3f3f46', cursor: k ? 'pointer' : 'default', whiteSpace: 'nowrap', userSelect: 'none', transition: 'color 0.15s' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: align === 'right' ? 'flex-end' : 'flex-start' }}>
                            {label}{k && <SortIndicator col={k} sort={sort} />}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loading
                      ? Array(12).fill(null).map((_, i) => (
                          <tr key={i} style={{ borderTop: '1px solid rgba(255,255,255,0.03)' }}>
                            {Array(10).fill(null).map((_, j) => (
                              <td key={j} style={{ padding: '15px 14px' }}>
                                <div style={{ height: 12, background: '#111116', borderRadius: 4, width: j === 1 ? 130 : 50, animation: 'pulse 1.5s infinite' }} />
                              </td>
                            ))}
                          </tr>
                        ))
                      : sorted.map(d => {
                          const color  = getTeamColor(d.team)
                          const isHov  = hovered === d.driver
                          const isTop  = d.rank <= 3
                          const pct    = d.peak > 0 ? Math.min(100, Math.round((d.elo / d.peak) * 100)) : 100
                          const medalColor = d.rank === 1 ? '#FBB924' : d.rank === 2 ? '#9CA3AF' : '#CD7F32'

                          return (
                            <tr key={d.driver}
                              onMouseEnter={() => setHovered(d.driver)}
                              onMouseLeave={() => setHovered(null)}
                              style={{ borderTop: '1px solid rgba(255,255,255,0.03)', background: isHov ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.1s', cursor: 'default' }}>

                              <td style={{ padding: '13px 14px 13px 24px', width: 60 }}>
                                {isTop
                                  ? <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.1em', color: medalColor, background: `${medalColor}15`, border: `1px solid ${medalColor}35`, padding: '3px 8px', borderRadius: 99, fontFamily: 'monospace' }}>
                                      {d.rank === 1 ? '1ST' : d.rank === 2 ? '2ND' : '3RD'}
                                    </span>
                                  : <span style={{ fontSize: 12, fontWeight: 800, fontStyle: 'italic', color: '#3f3f46', fontFamily: 'monospace' }}>{d.rank}</span>}
                              </td>

                              <td style={{ padding: '13px 14px', minWidth: 185 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <div style={{ width: 3, height: 30, background: color, borderRadius: 99, flexShrink: 0, opacity: isHov ? 1 : 0.7, transition: 'opacity 0.15s' }} />
                                  <div>
                                    <DriverName name={d.driver} size={11} lastSize={14} />
                                    <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color, opacity: 0.7, marginTop: 1 }}>{d.team}</div>
                                  </div>
                                </div>
                              </td>

                              <td style={{ padding: '13px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 15, fontWeight: 900, color: isTop ? '#fff' : '#d4d4d8', whiteSpace: 'nowrap' }}>
                                {d.elo.toLocaleString()}
                              </td>

                              <td style={{ padding: '13px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#a1a1aa', whiteSpace: 'nowrap' }}>
                                {d.pts > 0 ? d.pts : <span style={{ color: '#27272a' }}>—</span>}
                              </td>

                              <td style={{ padding: '13px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {d.wins > 0 ? <span style={{ color: '#FBB924', fontWeight: 900 }}>{d.wins}</span> : <span style={{ color: '#27272a' }}>—</span>}
                              </td>

                              {(['p2', 'p3'] as const).map(k => (
                                <td key={k} style={{ padding: '13px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#71717a', whiteSpace: 'nowrap' }}>
                                  {d[k] > 0 ? d[k] : <span style={{ color: '#27272a' }}>—</span>}
                                </td>
                              ))}

                              <td style={{ padding: '13px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontFamily: 'monospace', fontSize: 12, fontWeight: 800, color: d.change > 0 ? '#22c55e' : d.change < 0 ? '#ef4444' : '#3f3f46' }}>
                                  {d.change > 0 ? <TrendingUp size={9} /> : d.change < 0 ? <TrendingDown size={9} /> : null}
                                  {d.change > 0 ? `+${d.change}` : d.change === 0 ? '—' : d.change}
                                </span>
                              </td>

                              <td style={{ padding: '13px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#52525b', whiteSpace: 'nowrap' }}>
                                {d.peak.toLocaleString()}
                              </td>

                              <td style={{ padding: '13px 20px 13px 14px', textAlign: 'right' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
                                  <div style={{ width: 64, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                                    <div style={{ height: '100%', width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})`, borderRadius: 99, transition: 'width 0.6s ease' }} />
                                  </div>
                                  <span style={{ fontSize: 8, fontFamily: 'monospace', color: '#27272a' }}>{pct}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                  </tbody>
                </table>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', padding: '12px 20px', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: '#27272a' }}>ELO calculated after each race weekend</span>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#27272a' }}>2026 F1 Season</span>
              </div>
            </div>
          </div>
        )}

        {/* ═══ TIER LIST VIEW ═══ */}
        {view === 'tiers' && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {TIERS.map(t => (
                <div key={t.label} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#0f0f14', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '6px 12px' }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: t.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, fontStyle: 'italic', color: '#fff', flexShrink: 0, boxShadow: `0 0 10px ${t.glow}40` }}>{t.label}</div>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#52525b' }}>{t.desc}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loading
                ? Array(4).fill(null).map((_, i) => (
                    <div key={i} style={{ height: 100, background: '#0f0f14', borderRadius: 20, border: '1px solid rgba(255,255,255,0.06)', animation: 'pulse 1.5s infinite' }} />
                  ))
                : TIERS.map((tier, ti) => {
                    const inTier = drivers.filter(d =>
                      d.elo >= tier.min && (ti === 0 ? true : d.elo < TIERS[ti - 1].min)
                    )
                    if (!inTier.length) return null

                    return (
                      <div key={tier.label} style={{ display: 'flex', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', boxShadow: `0 0 30px -5px ${tier.glow}15`, position: 'relative' }}>
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${tier.glow}80, ${tier.glow}20)` }} />

                        <div style={{ width: 110, flexShrink: 0, background: `linear-gradient(160deg, ${tier.glow}20, ${tier.glow}08)`, borderRight: `1px solid ${tier.glow}20`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, padding: '16px 0', position: 'relative' }}>
                          <div style={{ width: 52, height: 52, borderRadius: 14, background: tier.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, fontStyle: 'italic', color: '#fff', boxShadow: `0 8px 24px -4px ${tier.glow}50, 0 0 0 1px ${tier.glow}30`, lineHeight: 1 }}>{tier.label}</div>
                          <span style={{ fontSize: 8, fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: tier.glow, opacity: 0.7 }}>{tier.desc}</span>
                        </div>

                        <div style={{ flex: 1, background: 'linear-gradient(160deg, #0f0f14, #0a0a0d)', padding: '14px 16px', display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                          {inTier.map(d => {
                            const color = getTeamColor(d.team)
                            const isHov = hovered === d.driver
                            return (
                              <div key={d.driver}
                                onMouseEnter={() => setHovered(d.driver)}
                                onMouseLeave={() => setHovered(null)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, background: isHov ? 'rgba(255,255,255,0.04)' : '#111116', border: `1px solid ${isHov ? color + '40' : 'rgba(255,255,255,0.05)'}`, borderRadius: 12, padding: '10px 14px', width: 210, cursor: 'default', transition: 'border-color 0.2s, background 0.15s', position: 'relative', overflow: 'hidden' }}>
                                {isHov && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at left, ${color}10, transparent 70%)`, pointerEvents: 'none' }} />}
                                <div style={{ width: 3, height: 36, background: color, borderRadius: 99, flexShrink: 0 }} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ marginBottom: 2 }}><DriverName name={d.driver} size={10} lastSize={14} /></div>
                                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color, opacity: 0.65 }}>{d.team}</div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <div style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic', fontFamily: 'monospace', color: '#fff', lineHeight: 1 }}>{d.elo.toLocaleString()}</div>
                                  {d.change !== 0 && (
                                    <div style={{ fontSize: 9, fontFamily: 'monospace', fontWeight: 800, color: d.change > 0 ? '#22c55e' : '#ef4444', marginTop: 2 }}>
                                      {d.change > 0 ? `+${d.change}` : d.change}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <div style={{ position: 'absolute', top: 10, right: 12, background: `${tier.glow}20`, border: `1px solid ${tier.glow}30`, borderRadius: 99, padding: '2px 8px', fontSize: 9, fontWeight: 900, fontFamily: 'monospace', color: tier.glow }}>
                          {inTier.length}
                        </div>
                      </div>
                    )
                  })}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        ::-webkit-scrollbar { width:4px; height:4px }
        ::-webkit-scrollbar-track { background:transparent }
        ::-webkit-scrollbar-thumb { background:#1f1f27; border-radius:99px }
        input::placeholder { color:#27272a }
        * { box-sizing:border-box }
      `}</style>
    </div>
  )
}