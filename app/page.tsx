'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import Link from 'next/link'
import { 
  Timer, Quote, Trophy, 
  Activity, ChevronRight, TrendingUp, TrendingDown,
  ArrowUpDown, ArrowUp, ArrowDown, Crosshair, MapPin
} from 'lucide-react'
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid
} from 'recharts'

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#061D42',
  'mclaren': '#FF8000', 'aston martin': '#006F62', 'alpine': '#0090FF',
  'williams': '#005AFF', 'racing bulls': '#1634CC', 'vcarb': '#1634CC',
  'sauber': '#52E252', 'haas': '#B6BABD', 'cadillac': '#C8A951',
}

const TEAM_SECTOR_DATA: Record<string, { speed: number; battery: number; aero: number; speedVal: string; batteryVal: string; aeroVal: string }> = {
  'McLaren':      { speed: 85, battery: 65, aero: 92, speedVal: '224 MPH', batteryVal: '120kW/S', aeroVal: 'Stage 4' },
  'Ferrari':      { speed: 91, battery: 78, aero: 88, speedVal: '231 MPH', batteryVal: '148kW/S', aeroVal: 'Stage 3' },
  'Red Bull':     { speed: 89, battery: 82, aero: 95, speedVal: '228 MPH', batteryVal: '156kW/S', aeroVal: 'Stage 5' },
  'Mercedes':     { speed: 82, battery: 90, aero: 80, speedVal: '219 MPH', batteryVal: '171kW/S', aeroVal: 'Stage 3' },
  'Aston Martin': { speed: 77, battery: 71, aero: 74, speedVal: '211 MPH', batteryVal: '134kW/S', aeroVal: 'Stage 2' },
}

const TEAM_SELECTOR_COLORS: Record<string, string> = {
  'McLaren': '#FF8000', 'Ferrari': '#E80020', 'Red Bull': '#3B82F6',
  'Mercedes': '#00D2BE', 'Aston Martin': '#006F62',
}

const RACE_FLAGS: Record<string, string> = {
  'Australian GP': '🇦🇺', 'Chinese GP': '🇨🇳', 'Japanese GP': '🇯🇵',
  'Miami GP': '🇺🇸', 'Canadian GP': '🇨🇦', 'Monaco GP': '🇲🇨',
  'Spanish GP (Barcelona)': '🇪🇸', 'Austrian GP': '🇦🇹', 'British GP': '🇬🇧',
  'Belgian GP': '🇧🇪', 'Hungarian GP': '🇭🇺', 'Dutch GP': '🇳🇱',
  'Italian GP': '🇮🇹', 'Spanish GP (Madrid)': '🇪🇸', 'Azerbaijan GP': '🇦🇿',
  'Singapore GP': '🇸🇬', 'United States GP': '🇺🇸', 'Mexico City GP': '🇲🇽',
  'São Paulo GP': '🇧🇷', 'Las Vegas GP': '🇺🇸', 'Qatar GP': '🇶🇦', 'Abu Dhabi GP': '🇦🇪',
}

const RACE_CALENDAR = [
  { name: 'Australian GP', date: '2026-03-08T04:00:00Z' },
  { name: 'Chinese GP', date: '2026-03-15T07:00:00Z' },
  { name: 'Japanese GP', date: '2026-03-29T05:00:00Z' },
  { name: 'Miami GP', date: '2026-05-03T20:00:00Z' },
  { name: 'Canadian GP', date: '2026-05-24T18:00:00Z' },
  { name: 'Monaco GP', date: '2026-06-07T13:00:00Z' },
  { name: 'Spanish GP (Barcelona)', date: '2026-06-14T13:00:00Z' },
  { name: 'Austrian GP', date: '2026-06-28T13:00:00Z' },
  { name: 'British GP', date: '2026-07-05T14:00:00Z' },
  { name: 'Belgian GP', date: '2026-07-19T13:00:00Z' },
  { name: 'Hungarian GP', date: '2026-07-26T13:00:00Z' },
  { name: 'Dutch GP', date: '2026-08-23T13:00:00Z' },
  { name: 'Italian GP', date: '2026-09-06T13:00:00Z' },
  { name: 'Spanish GP (Madrid)', date: '2026-09-13T13:00:00Z' },
  { name: 'Azerbaijan GP', date: '2026-09-26T11:00:00Z' },
  { name: 'Singapore GP', date: '2026-10-11T12:00:00Z' },
  { name: 'United States GP', date: '2026-10-25T19:00:00Z' },
  { name: 'Mexico City GP', date: '2026-11-01T20:00:00Z' },
  { name: 'São Paulo GP', date: '2026-11-08T17:00:00Z' },
  { name: 'Las Vegas GP', date: '2026-11-21T06:00:00Z' },
  { name: 'Qatar GP', date: '2026-11-29T17:00:00Z' },
  { name: 'Abu Dhabi GP', date: '2026-12-06T13:00:00Z' }
]

interface Driver {
  rank: number
  driver: string
  team: string
  avg: number
  elo: number
  change: number | null
}

type SortConfig = {
  key: keyof Driver | null
  direction: 'ascending' | 'descending'
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const sorted = [...payload].sort((a, b) => b.value - a.value)
    return (
      <div className="bg-[#0a0a0c]/95 border border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-md">
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">
          GP / {label}
        </p>
        {sorted.map((entry, index) => (
          <div key={index} className="flex justify-between items-center gap-6 mb-1.5">
            <span style={{ color: entry.color }} className="font-bold text-sm tracking-tight">
              {entry.name}
            </span>
            <span className="text-zinc-100 font-black font-mono text-sm tabular-nums">
              {Math.round(entry.value)}
            </span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const MiniSparkline = ({ data, driverName, color }: { data: any[], driverName: string, color: string }) => {
  const points = data.map(d => d[driverName]).filter((v): v is number => v !== undefined && !isNaN(v))
  if (points.length < 2) return <span className="text-zinc-700 text-[9px] font-mono italic">NO DATA</span>
  const min = Math.min(...points), max = Math.max(...points)
  const range = max - min || 1
  const w = 88, h = 30
  const coords = points.map((v, i) => `${(i / (points.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  const lastX = w, lastY = h - ((points[points.length - 1] - min) / range) * h
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

export default function Home() {
  const [sectorTeam, setSectorTeam] = useState('McLaren')
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [selectedChartDrivers, setSelectedChartDrivers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'elo', direction: 'descending' })
  const [targetRaceName, setTargetRaceName] = useState<string>('Loading...')
  const [timeLeft, setTimeLeft] = useState({ d: '00', h: '00', m: '00', s: '00' })
  const [nextRaceIndex, setNextRaceIndex] = useState(0)
  const [targetRaceDate, setTargetRaceDate] = useState('')

  useEffect(() => {
    const now = new Date().getTime()
    const ONE_DAY_MS = 24 * 60 * 60 * 1000

    const upcomingRace = RACE_CALENDAR.find(r => new Date(r.date).getTime() > now) || RACE_CALENDAR[RACE_CALENDAR.length - 1]
    const completedCount = RACE_CALENDAR.filter(r => now > new Date(r.date).getTime() + ONE_DAY_MS).length

    const raceIdx = RACE_CALENDAR.indexOf(upcomingRace)
    setNextRaceIndex(raceIdx)
    setTargetRaceDate(new Date(upcomingRace.date).toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    }))
    setTargetRaceName(upcomingRace.name)

    const targetDate = new Date(upcomingRace.date).getTime()

    const interval = setInterval(() => {
      const currentTime = new Date().getTime()
      const diff = targetDate - currentTime
      if (diff <= 0) {
        clearInterval(interval)
        setTimeLeft({ d: '00', h: '00', m: '00', s: '00' })
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24)).toString().padStart(2, '0')
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)).toString().padStart(2, '0')
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, '0')
        const s = Math.floor((diff % (1000 * 60)) / 1000).toString().padStart(2, '0')
        setTimeLeft({ d, h, m, s })
      }
    }, 1000)

    Papa.parse(SHEET_URL + '&cachebust=' + Date.now(), {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        const find = (row: Record<string, string>, ...names: string[]) => {
          for (const n of names) {
            const match = Object.keys(row).find(k => k.toLowerCase().trim() === n)
            if (match) return match
          }
          return null
        }

        if (rows.length > 0) {
          const firstRow = rows[0]
          const TEAM_KEY = find(firstRow, 'team') || ''
          const DRIVER_KEY = find(firstRow, 'driver') || ''
          const AVG_KEY = find(firstRow, 'season average', 'avg', 'average') || ''
          const ELO_KEY = find(firstRow, 'elo') || ''
          const CHANGE_KEY = find(firstRow, 'last change', 'elo change', 'change', 'delta') || ''

          const parsed: Driver[] = rows
            .filter(r => r[DRIVER_KEY]?.trim())
            .map((r, i) => ({
              rank: i + 1,
              driver: r[DRIVER_KEY].trim(),
              team: (r[TEAM_KEY] || 'Unemployed').trim(),
              avg: parseFloat(r[AVG_KEY]) || 0,
              elo: parseInt(r[ELO_KEY]) || 1500,
              change: r[CHANGE_KEY] ? parseInt(r[CHANGE_KEY]) : null,
            }))
          setDrivers(parsed)

          if (selectedChartDrivers.length === 0) {
            setSelectedChartDrivers(parsed.slice(0, 5).map(d => d.driver))
          }

          const allKeys = Object.keys(firstRow)
          const raceColumns = allKeys
            .filter(key => /^\d{2}\s[A-Z]{2,4}_1$/.test(key.trim()))
            .slice(0, completedCount)

          const timelineData = raceColumns.map(race => {
            const raceName = race.trim().replace('_1', '').substring(3)
            const dataPoint: any = { name: raceName }
            rows.forEach(row => {
              const driverName = row[DRIVER_KEY]?.trim()
              const val = parseInt(row[race])
              if (driverName && !isNaN(val) && val > 500) {
                dataPoint[driverName] = val
              }
            })
            return dataPoint
          })

          setChartData(timelineData)
        }
        setUpdated(new Date().toLocaleTimeString())
        setLoading(false)
      },
      error: () => setLoading(false)
    })

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sortedDrivers = useMemo(() => {
    let sortableItems = [...drivers]
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key!] ?? 0
        const bValue = b[sortConfig.key!] ?? 0
        if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1
        return 0
      })
    }
    return sortableItems
  }, [drivers, sortConfig])

  const requestSort = (key: keyof Driver) => {
    let direction: 'ascending' | 'descending' = 'descending'
    if (sortConfig.key === key && sortConfig.direction === 'descending') {
      direction = 'ascending'
    }
    setSortConfig({ key, direction })
  }

  const getSortIcon = (key: keyof Driver) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="opacity-20" />
    return sortConfig.direction === 'ascending'
      ? <ArrowUp size={14} className="text-orange-500" />
      : <ArrowDown size={14} className="text-orange-500" />
  }

  const toggleDriverChart = (driverName: string) => {
    setSelectedChartDrivers(prev =>
      prev.includes(driverName)
        ? prev.filter(n => n !== driverName)
        : [...prev, driverName].slice(-9)
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans pb-20 selection:bg-orange-500/30">

      {/* ══════════ NEXT RACE COMMAND BAR ══════════ */}
      <section className="w-full bg-[#08080a] border-b border-zinc-800/80 relative overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_120px,rgba(255,255,255,0.012)_120px,rgba(255,255,255,0.012)_121px)] pointer-events-none" />
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">

            <div className="flex items-center gap-5">
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-full bg-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.35)]">
                  <span className="font-black italic text-white text-xl leading-none">
                    R{(nextRaceIndex + 1).toString().padStart(2, '0')}
                  </span>
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.45em] text-zinc-500 mb-0.5 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full" /> Next Race
                </p>
                <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
                  {RACE_FLAGS[targetRaceName] ?? '🏁'}&nbsp;{targetRaceName}
                </h2>
                <p className="text-[10px] font-mono text-zinc-500 mt-1 tracking-wider">{targetRaceDate}</p>
              </div>
            </div>

            <div className="flex items-stretch gap-0 bg-[#0c0c0f] rounded-xl border border-zinc-800 overflow-hidden shadow-inner">
              {[
                { val: timeLeft.d, label: 'DAYS' },
                { val: timeLeft.h, label: 'HRS' },
                { val: timeLeft.m, label: 'MIN' },
                { val: timeLeft.s, label: 'SEC' },
              ].map((t, i) => (
                <div key={i} className={`flex flex-col items-center justify-center px-5 py-3 tabular-nums ${i < 3 ? 'border-r border-zinc-800' : ''}`}>
                  <span className="text-2xl md:text-3xl font-black font-mono text-white leading-none">{t.val}</span>
                  <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-600 mt-1">{t.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ══════════ EDITORIAL HERO ══════════ */}
      <section className="relative w-full border-b border-zinc-800 overflow-hidden bg-[#050505]">
        <div
          className="absolute inset-0 z-0 opacity-10 hover:opacity-20 transition-opacity duration-1000 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=3200&auto=format&fit=crop')" }}
        />
        <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#050505] via-[#050505]/90 to-transparent" />
        <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        <div className="absolute top-0 right-0 w-1/3 h-full z-0 pointer-events-none overflow-hidden hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-l from-orange-600/5 to-transparent" />
          <div className="absolute top-0 left-0 w-px h-full bg-gradient-to-b from-transparent via-orange-600/30 to-transparent" />
        </div>

        <Link href="/editorial" className="relative z-10 group block">
          <div className="container mx-auto grid grid-cols-1 lg:grid-cols-12">

            {/* Main content */}
            <div className="lg:col-span-8 px-8 md:px-16 pt-16 pb-12 lg:border-r border-zinc-800/40">
              <div className="flex items-center gap-3 mb-8 flex-wrap">
                <span className="bg-orange-600 text-white text-[9px] font-black italic px-3 py-1 uppercase tracking-widest shadow-lg shadow-orange-900/30">
                  Premium Analysis
                </span>
                <span className="text-[9px] uppercase tracking-[0.4em] font-black text-zinc-500 border border-zinc-800 px-3 py-1 rounded-full">
                  2026 Season · Issue 03
                </span>
                <span className="ml-auto text-[10px] font-mono text-orange-500/70 group-hover:text-orange-400 transition-colors hidden sm:block">
                  Read Full Article →
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black italic uppercase tracking-tighter leading-[0.88] mb-10 group-hover:text-white transition-colors duration-300">
                <span className="block text-zinc-400 text-lg md:text-xl font-black italic tracking-widest mb-4 not-italic normal-case">
                  The State of the Grid
                </span>
                McLaren,<br />
                Regulations<br />
                &amp; the Road<br />
                to <span className="text-orange-500 group-hover:text-orange-400 transition-colors relative">
                  Miami
                  <span className="absolute -bottom-1 left-0 w-full h-px bg-orange-500/50 group-hover:w-0 transition-all duration-500" />
                </span>
              </h1>

              <div className="flex items-center gap-4 mb-10">
                <div className="w-9 h-9 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-orange-500 font-black italic text-sm shadow-md">
                  MF
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">@FullTimeMclarenFan</p>
                  <p className="text-[9px] font-mono text-zinc-500 italic uppercase tracking-widest">Senior Technical Analyst</p>
                </div>
                <div className="ml-auto hidden md:flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-1.5">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Live Commentary</span>
                </div>
              </div>

              <blockquote className="relative border-l-2 border-orange-600 pl-8 py-4 mb-10 group-hover:border-orange-400 transition-colors">
                <Quote size={20} className="absolute top-2 left-2 text-orange-600/30" />
                <p className="text-xl md:text-2xl text-zinc-200 leading-relaxed italic font-light">
                  "Stella made it very clear we would start on the backfoot, but hopefully we should have a stable platform to upgrade on going forward."
                </p>
              </blockquote>

              <div className="grid md:grid-cols-2 gap-8 text-sm text-zinc-500 leading-relaxed">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-orange-500 mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-orange-600 inline-block" /> McLaren
                  </p>
                  <p>Inconsistent but trending upwards. We were 4th best in Australia, 3rd in China, and 2nd in Japan...</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.35em] text-orange-500 mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-orange-600 inline-block" /> The Regs
                  </p>
                  <p>The "super clipping" at 50kph is killing the show. Battery recovery is determining race order...</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-10 text-orange-500 text-xs font-black italic uppercase tracking-widest group-hover:gap-4 transition-all duration-300">
                Read Full Editorial <ChevronRight size={16} />
              </div>
            </div>

            {/* Right sidebar — interactive sector analysis */}
            <div className="lg:col-span-4 bg-[#07070a] border-t lg:border-t-0 border-zinc-800/50 p-8 flex flex-col gap-8 relative overflow-hidden">
              <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-600/4 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center gap-2 border-b border-zinc-800 pb-4 mb-6">
                  <Timer size={12} className="text-orange-500 shrink-0" />
                  <h3 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Sector Analysis</h3>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-8">
                  {Object.keys(TEAM_SECTOR_DATA).map(team => {
                    const isActive = sectorTeam === team
                    const col = TEAM_SELECTOR_COLORS[team]
                    return (
                      <button
                        key={team}
                        onClick={(e) => { e.preventDefault(); setSectorTeam(team) }}
                        className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-200 border ${
                          isActive ? 'text-white' : 'text-zinc-600 border-zinc-800 bg-transparent hover:text-zinc-400'
                        }`}
                        style={isActive ? { borderColor: col, backgroundColor: `${col}22`, color: col } : {}}
                      >
                        {team}
                      </button>
                    )
                  })}
                </div>

                {(() => {
                  const stats = TEAM_SECTOR_DATA[sectorTeam]
                  const col = TEAM_SELECTOR_COLORS[sectorTeam]
                  return (
                    <div className="space-y-6">
                      {[
                        { label: 'Straight Line Speed', val: stats.speedVal,   pct: stats.speed },
                        { label: 'Battery Recovery',    val: stats.batteryVal, pct: stats.battery },
                        { label: 'Aero Efficiency',     val: stats.aeroVal,    pct: stats.aero },
                      ].map((s) => (
                        <div key={s.label}>
                          <div className="flex justify-between text-[10px] font-bold uppercase mb-2.5">
                            <span className="text-zinc-500">{s.label}</span>
                            <span className="font-mono text-white">{s.val}</span>
                          </div>
                          <div className="h-px w-full bg-zinc-800 relative">
                            <div
                              className="absolute top-0 left-0 h-full transition-all duration-700 ease-out"
                              style={{ width: `${s.pct}%`, backgroundColor: col }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              <div className="relative z-10 mt-auto">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-500 mb-3">Season Progress</p>
                <div className="flex gap-1 flex-wrap">
                  {RACE_CALENDAR.map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-2 rounded-sm transition-colors duration-300"
                      style={{
                        backgroundColor: i < nextRaceIndex ? '#f97316' : i === nextRaceIndex ? '#fdba74' : '#1f1f23'
                      }}
                    />
                  ))}
                </div>
                <p className="text-[9px] font-mono text-zinc-600 mt-2">
                  {nextRaceIndex} / {RACE_CALENDAR.length} races complete
                </p>
              </div>
            </div>

          </div>
        </Link>
      </section>

      {/* ══════════ GRID AT A GLANCE ══════════ */}
      <section className="container mx-auto px-6 mt-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <Trophy size={16} />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Grid at a Glance</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">
              Top 5 · Live Standings
            </h2>
          </div>
          <p className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest hidden md:block">
            ELO · Δ Last Race · Trajectory
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {sortedDrivers.slice(0, 5).map((d, i) => {
            const teamColor = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'
            const changeVal = d.change ?? 0
            const nameParts = d.driver.split(' ')
            const last = nameParts.pop()
            const first = nameParts.join(' ')

            return (
              <div
                key={d.driver}
                className="relative bg-[#0a0a0c] border rounded-2xl p-5 overflow-hidden hover:bg-[#0f0f13] transition-all duration-300 group"
                style={{
                  borderColor: i === 0 ? `${teamColor}60` : '#27272a',
                  boxShadow: i === 0 ? `0 0 40px ${teamColor}12` : undefined
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                  style={{ backgroundColor: teamColor, opacity: i === 0 ? 1 : 0.5 }} />

                <p className={`text-6xl font-black italic leading-none mb-4 ${i === 0 ? 'text-orange-500' : 'text-zinc-800'} group-hover:text-zinc-700 transition-colors`}>
                  {d.rank}
                </p>

                <div className="mb-5">
                  <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{first}</p>
                  <p className="text-xl font-black italic uppercase tracking-tight text-white leading-none">{last}</p>
                  <p className="text-[8px] font-black uppercase tracking-widest mt-1" style={{ color: teamColor }}>{d.team}</p>
                </div>

                <div className="mb-5">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-1">ELO</p>
                  <p className="text-2xl font-black font-mono text-white tabular-nums">{d.elo.toLocaleString()}</p>
                </div>

                <div className="mb-4">
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-600 mb-2">Trajectory</p>
                  {loading
                    ? <div className="h-[30px] w-full bg-zinc-900 rounded animate-pulse" />
                    : <MiniSparkline data={chartData} driverName={d.driver} color={teamColor} />
                  }
                </div>

                <div className={`flex items-center gap-1.5 text-xs font-black font-mono ${
                  changeVal > 0 ? 'text-green-500' : changeVal < 0 ? 'text-red-500' : 'text-zinc-600'
                }`}>
                  {changeVal > 0 ? <TrendingUp size={11} /> : changeVal < 0 ? <TrendingDown size={11} /> : null}
                  <span>{d.change !== null ? (changeVal > 0 ? `+${changeVal}` : changeVal) : '—'}</span>
                  <span className="text-zinc-700 font-normal text-[8px] uppercase tracking-widest">last race</span>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ══════════ TELEMETRY HUB ══════════ */}
      <section className="container mx-auto px-6 mt-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-orange-500 mb-2">
              <Crosshair size={18} className="animate-[spin_4s_linear_infinite]" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Visual Telemetry Hub</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black italic uppercase tracking-tighter">
              Season Trajectory
            </h2>
          </div>

          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-xl px-6 py-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center gap-6">
            <div className="hidden sm:block text-right pr-6 border-r border-zinc-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 flex items-center gap-1 justify-end">
                <MapPin size={10} /> Target Lock
              </p>
              <p className="font-bold text-sm uppercase text-orange-500 italic">{targetRaceName}</p>
            </div>
            <div className="flex items-center gap-4 text-center tabular-nums font-mono font-black">
              {[
                { val: timeLeft.d, label: 'DAY' },
                { val: timeLeft.h, label: 'HRS' },
                { val: timeLeft.m, label: 'MIN' },
                { val: timeLeft.s, label: 'SEC' }
              ].map((time, idx) => (
                <div key={idx} className="flex flex-col">
                  <span className="text-2xl md:text-3xl text-zinc-100">{time.val}</span>
                  <span className="text-[9px] text-zinc-600 uppercase tracking-widest">{time.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#0c0c0f] border border-zinc-800 rounded-2xl p-6 h-[450px] shadow-2xl relative overflow-hidden group">
          {loading ? (
            <div className="w-full h-full flex items-center justify-center font-mono text-xs uppercase italic text-zinc-600 tracking-widest animate-pulse">
              Connecting to Telemetry Servers...
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity" />
              <div style={{ width: '100%', height: '100%', minHeight: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f1f22" />
                    <XAxis
                      dataKey="name"
                      stroke="#52525b"
                      tick={{ fill: '#52525b', fontSize: 10, fontWeight: 800 }}
                      tickFormatter={(value) => value.toString().toUpperCase()}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={20}
                    />
                    <YAxis
                      domain={['dataMin - 25', 'dataMax + 25']}
                      stroke="#52525b"
                      tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                      axisLine={false}
                      tickLine={false}
                      width={45}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
                    {selectedChartDrivers.map((driverId) => {
                      const driverObj = drivers.find(d => d.driver === driverId)
                      const color = driverObj ? TEAM_COLORS[driverObj.team.toLowerCase()] : '#8a8a94'
                      return (
                        <Line
                          key={driverId}
                          type="monotone"
                          dataKey={driverId}
                          name={driverId}
                          stroke={color}
                          strokeWidth={3}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0, fill: color }}
                          connectNulls
                        />
                      )
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-black uppercase italic tracking-widest text-zinc-600 mr-2">
            Target Focus:
          </span>
          {drivers.slice(0, 15).map((d) => {
            const isSelected = selectedChartDrivers.includes(d.driver)
            const teamColor = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'
            return (
              <button
                key={d.driver}
                onClick={() => toggleDriverChart(d.driver)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all duration-200 border flex items-center gap-2 ${
                  isSelected
                    ? 'bg-zinc-800 text-white shadow-lg'
                    : 'bg-transparent text-zinc-500 border-zinc-800 hover:border-zinc-600'
                }`}
                style={{
                  borderColor: isSelected ? teamColor : undefined,
                  boxShadow: isSelected ? `0 0 10px ${teamColor}30` : undefined
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: teamColor }} />
                {d.driver.split(' ').pop()}
              </button>
            )
          })}
        </div>
      </section>

      {/* ══════════ LIVE RANKINGS ══════════ */}
      <section className="container mx-auto px-6 mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Activity size={18} className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Live Leaderboard</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
              2026 Driver <span className="text-red-600 underline decoration-zinc-800">ELO</span> Rankings
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-[#0a0a0c] px-3 py-1 rounded-full border border-zinc-800 inline-block shadow-inner">
              Last Sync: {updated || 'Awaiting Data...'}
            </p>
          </div>
        </div>

        <div className="bg-[#0a0a0c] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#0c0c0f] text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                  <th className="px-6 py-5 text-left cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('rank')}>
                    <div className="flex items-center gap-2">Pos {getSortIcon('rank')}</div>
                  </th>
                  <th className="px-6 py-5 text-left cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('driver')}>
                    <div className="flex items-center gap-2">Driver {getSortIcon('driver')}</div>
                  </th>
                  <th className="px-6 py-5 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('avg')}>
                    <div className="flex items-center justify-end gap-2 text-orange-500">Season Avg {getSortIcon('avg')}</div>
                  </th>
                  <th className="px-6 py-5 text-right cursor-pointer hover:text-white transition-colors" onClick={() => requestSort('elo')}>
                    <div className="flex items-center justify-end gap-2">ELO Rating {getSortIcon('elo')}</div>
                  </th>
                  <th className="px-6 py-5 text-right">Delta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-24 text-center font-mono text-xs uppercase italic text-zinc-600 tracking-widest">
                      Decrypting Data Streams...
                    </td>
                  </tr>
                ) : (
                  sortedDrivers.map((d) => {
                    const isTop3 = d.rank <= 3
                    const nameParts = d.driver.split(' ')
                    const last = nameParts.pop()
                    const first = nameParts.join(' ')
                    const changeVal = d.change ?? 0

                    return (
                      <tr key={d.driver} className="group hover:bg-[#111116] transition-all duration-300">
                        <td className="px-6 py-5">
                          <span className={`text-xl font-black italic ${isTop3 ? 'text-orange-500' : 'text-zinc-600'} group-hover:text-white transition-colors`}>
                            {d.rank}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-1 h-8 rounded-full" style={{ backgroundColor: TEAM_COLORS[d.team.toLowerCase()] || '#333' }} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-light text-zinc-400 group-hover:text-zinc-200">{first}</span>
                                <span className="text-sm font-black italic uppercase text-zinc-100 group-hover:text-white">{last}</span>
                              </div>
                              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{d.team}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right font-mono text-orange-500/80 font-bold text-sm">
                          {d.avg.toFixed(1)}
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-black italic text-lg text-zinc-100 group-hover:text-orange-400 transition-colors">
                          {d.elo.toLocaleString()}
                        </td>
                        <td className={`px-6 py-5 text-right font-mono text-xs font-bold ${
                          changeVal > 0 ? 'text-green-500' : changeVal < 0 ? 'text-red-500' : 'text-zinc-600'
                        }`}>
                          <div className="flex items-center justify-end gap-1">
                            {changeVal > 0 ? <TrendingUp size={12} /> : changeVal < 0 ? <TrendingDown size={12} /> : null}
                            {d.change !== null ? (changeVal > 0 ? `+${changeVal}` : changeVal) : '—'}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <footer className="container mx-auto px-6 mt-20 text-center">
        <div className="inline-flex flex-col md:flex-row items-center gap-6 p-4 md:p-1 rounded-3xl md:rounded-full bg-[#0a0a0c] border border-zinc-800 pl-6 pr-2 shadow-2xl">
          <span className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500">Analyze Full Telemetry History</span>
          <button className="bg-zinc-100 text-black text-[10px] font-black uppercase italic px-8 py-3 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105 active:scale-95">
            <Link href="/historical">Open Archives</Link>
          </button>
        </div>
      </footer>

    </div>
  )
}