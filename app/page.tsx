'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import Link from 'next/link' // Import Link for navigation
import { 
  Timer, Zap, ShieldAlert, Quote, Trophy, 
  Activity, ChevronRight, TrendingUp, TrendingDown,
  ArrowUpDown, ArrowUp, ArrowDown 
} from 'lucide-react'
import Nav from '@/components/Nav'

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#061D42',
  'mclaren': '#FF8000', 'aston martin': '#006F62', 'alpine': '#0090FF',
  'williams': '#005AFF', 'racing bulls': '#1634CC', 'vcarb': '#1634CC',
  'sauber': '#52E252', 'haas': '#B6BABD', 'cadillac': '#C8A951',
}

interface Driver {
  rank: number
  driver: string
  team: string
  avg: number
  elo: number
  change: number | null
}

type SortConfig = {
  key: keyof Driver | null;
  direction: 'ascending' | 'descending';
}

export default function Home() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState('')
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'elo', direction: 'descending' })

  useEffect(() => {
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
          const CHANGE_KEY = find(firstRow, 'elo change', 'last change', 'change', 'delta') || ''

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
        }
        setUpdated(new Date().toLocaleTimeString())
        setLoading(false)
      },
      error: () => setLoading(false)
    })
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
    return sortConfig.direction === 'ascending' ? <ArrowUp size={14} className="text-orange-500" /> : <ArrowDown size={14} className="text-orange-500" />
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans pb-20">
      <Nav />

      {/* --- HERO EDITORIAL SECTION (NOW CLICKABLE) --- */}
      <section className="relative w-full border-b border-zinc-800 bg-[#0d0d10] transition-colors hover:bg-[#111116]">
        <Link href="/editorial" className="group block container mx-auto grid grid-cols-1 lg:grid-cols-12 cursor-pointer">
          <div className="lg:col-span-8 p-8 md:p-16 lg:border-r border-zinc-800">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-orange-600 text-[10px] font-black italic px-2 py-0.5 uppercase tracking-tighter">Premium Analysis</span>
              <span className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest group-hover:text-orange-500 transition-colors">Click to Read Full Article →</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.85] mb-8 group-hover:text-white transition-colors">
              The State of the Grid: <br/>
              <span className="text-orange-500 group-hover:text-orange-400">Innovation</span> vs. Imitation
            </h1>

            <div className="flex items-center gap-4 mb-12">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-orange-500 font-black italic shadow-lg shadow-orange-500/10">MF</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-200">@FullTimeMclarenFan</p>
                <p className="text-[10px] font-mono text-zinc-500 italic">Senior Technical Analyst</p>
              </div>
            </div>

            <div className="prose prose-invert prose-orange max-w-none">
              <p className="text-xl text-zinc-400 leading-relaxed italic border-l-4 border-orange-600 pl-6 mb-10 bg-orange-500/5 py-4 group-hover:bg-orange-500/10 transition-colors">
                "Stella made it very clear we would start on the backfoot, but hopefully we should have a stable platform to upgrade on going forward."
              </p>

              <div className="grid md:grid-cols-2 gap-8 text-sm text-zinc-300 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                <p>
                  <span className="text-orange-500 font-black italic uppercase text-xs">McLaren:</span> Inconsistent but trending upwards. We were 4th best in Australia, 3rd in China, and 2nd in Japan...
                </p>
                <p>
                  <span className="text-orange-500 font-black italic uppercase text-xs">The Regs:</span> The "super clipping" at 50kph is killing the show. Battery recovery is determining race order...
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats Sidebar (Visual only on Home) */}
          <div className="lg:col-span-4 bg-[#0a0a0c] p-8 flex flex-col justify-between group-hover:bg-[#0c0c0e] transition-colors">
            <div className="space-y-8">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 flex items-center gap-2 underline underline-offset-8 decoration-orange-500/50">
                <Timer size={14} className="text-orange-500" /> Sector Analysis
              </h3>
              
              <div className="space-y-6">
                {[
                  { label: 'Straight Line Speed', val: '224 MPH', percent: 85 },
                  { label: 'Battery Recovery', val: '120kW/S', percent: 65 },
                  { label: 'Aero Efficiency', val: 'STAGE 4', percent: 92 }
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex justify-between text-[10px] font-bold uppercase mb-2">
                      <span className="text-zinc-500">{stat.label}</span>
                      <span className="text-white font-mono group-hover:text-orange-500 transition-colors">{stat.val}</span>
                    </div>
                    <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-600 transition-all duration-1000" 
                        style={{ width: `${stat.percent}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-12">
              <div className="flex items-center gap-2 text-orange-500 text-xs font-black italic uppercase tracking-widest animate-pulse">
                Read Full Editorial <ChevronRight size={16} />
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* --- LIVE RANKINGS SECTION --- */}
      <section className="container mx-auto px-6 mt-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <Activity size={18} className="animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.4em]">Live Telemetry</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter">
              2026 Driver <span className="text-red-600 underline decoration-zinc-800">ELO</span> Rankings
            </h2>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800 inline-block">
              Last Sync: {updated || 'Awaiting Data...'}
            </p>
          </div>
        </div>

        <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-zinc-900/80 text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
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
                    const isTop3 = d.rank <= 3;
                    const nameParts = d.driver.split(' ');
                    const last = nameParts.pop();
                    const first = nameParts.join(' ');
                    const changeVal = d.change ?? 0;

                    return (
                      <tr key={d.driver} className="group hover:bg-orange-500/[0.03] transition-all duration-300">
                        <td className="px-6 py-5">
                          <span className={`text-xl font-black italic ${isTop3 ? 'text-orange-500' : 'text-zinc-700'} group-hover:text-white transition-colors`}>
                            {d.rank}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-1 h-8 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]" style={{ backgroundColor: TEAM_COLORS[d.team.toLowerCase()] || '#333' }} />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-light text-zinc-400 group-hover:text-zinc-200">{first}</span>
                                <span className="text-sm font-black italic uppercase text-zinc-100 group-hover:text-white">{last}</span>
                              </div>
                              <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{d.team}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-right font-mono text-orange-500 font-bold text-sm">
                          {d.avg.toFixed(1)}
                        </td>
                        <td className="px-6 py-5 text-right font-mono font-black italic text-lg text-zinc-100 group-hover:text-orange-400 transition-colors">
                          {d.elo.toLocaleString()}
                        </td>
                        <td className={`px-6 py-5 text-right font-mono text-xs font-bold ${
                          changeVal > 0 ? 'text-green-500' : changeVal < 0 ? 'text-red-500' : 'text-zinc-600'
                        }`}>
                          <div className="flex items-center justify-end gap-1">
                            {changeVal > 0 ? <TrendingUp size={12}/> : changeVal < 0 ? <TrendingDown size={12}/> : null}
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
        <div className="inline-flex flex-col md:flex-row items-center gap-6 p-4 md:p-1 rounded-3xl md:rounded-full bg-zinc-900 border border-zinc-800 pl-6 pr-2 shadow-xl">
          <span className="text-[10px] font-black uppercase italic tracking-widest text-zinc-500">Analyze Full Telemetry History</span>
          <button className="bg-white text-black text-[10px] font-black uppercase italic px-8 py-3 rounded-full hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105 active:scale-95">
            Open Archives
          </button>
        </div>
      </footer>
    </div>
  )
}