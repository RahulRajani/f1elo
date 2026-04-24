'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import Link from 'next/link'
import {
  Quote, Trophy, Activity, ChevronRight, TrendingUp, TrendingDown,
  Crosshair, BarChart2, Zap, Flame, Target
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'
import { User } from 'lucide-react'

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#061D42',
  'mclaren': '#FF8000', 'aston martin': '#006F62', 'alpine': '#0090FF',
  'williams': '#005AFF', 'racing bulls': '#1634CC', 'vcarb': '#1634CC',
  'sauber': '#52E252', 'haas': '#B6BABD', 'cadillac': '#C8A951',
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1552820728-8ac41f1ce891?w=500&h=600&fit=crop'

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
  { name: 'Australian GP',         date: '2026-03-08T04:00:00Z' },
  { name: 'Chinese GP',            date: '2026-03-15T07:00:00Z' },
  { name: 'Japanese GP',           date: '2026-03-29T05:00:00Z' },
  { name: 'Miami GP',              date: '2026-05-03T20:00:00Z' },
  { name: 'Canadian GP',           date: '2026-05-24T18:00:00Z' },
  { name: 'Monaco GP',             date: '2026-06-07T13:00:00Z' },
  { name: 'Spanish GP (Barcelona)',date: '2026-06-14T13:00:00Z' },
  { name: 'Austrian GP',           date: '2026-06-28T13:00:00Z' },
  { name: 'British GP',            date: '2026-07-05T14:00:00Z' },
  { name: 'Belgian GP',            date: '2026-07-19T13:00:00Z' },
  { name: 'Hungarian GP',          date: '2026-07-26T13:00:00Z' },
  { name: 'Dutch GP',              date: '2026-08-23T13:00:00Z' },
  { name: 'Italian GP',            date: '2026-09-06T13:00:00Z' },
  { name: 'Spanish GP (Madrid)',   date: '2026-09-13T13:00:00Z' },
  { name: 'Azerbaijan GP',         date: '2026-09-26T11:00:00Z' },
  { name: 'Singapore GP',          date: '2026-10-11T12:00:00Z' },
  { name: 'United States GP',      date: '2026-10-25T19:00:00Z' },
  { name: 'Mexico City GP',        date: '2026-11-01T20:00:00Z' },
  { name: 'São Paulo GP',          date: '2026-11-08T17:00:00Z' },
  { name: 'Las Vegas GP',          date: '2026-11-21T06:00:00Z' },
  { name: 'Qatar GP',              date: '2026-11-29T17:00:00Z' },
  { name: 'Abu Dhabi GP',          date: '2026-12-06T13:00:00Z' },
]

interface Driver {
  rank: number; driver: string; team: string; avg: number; elo: number; change: number | null
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const sorted = [...payload].sort((a, b) => b.value - a.value)
    return (
      <div className="bg-black/90 border border-orange-500/40 rounded-lg p-3 shadow-2xl backdrop-blur-md">
        <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
        {sorted.map((entry, i) => (
          <div key={i} className="flex justify-between gap-4 mb-1.5">
            <span style={{ color: entry.color }} className="font-bold text-sm">{entry.name}</span>
            <span className="text-white font-mono text-sm">{Math.round(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const MiniSparkline = ({ data, driverName, color, w = 72, h = 28 }: { data: any[], driverName: string, color: string, w?: number, h?: number }) => {
  const pts = data.map(d => d[driverName]).filter((v): v is number => v !== undefined && !isNaN(v))
  if (pts.length < 2) return <span className="text-zinc-600 text-[10px] font-mono italic">—</span>
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1
  const coords = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  const lastY = h - ((pts[pts.length - 1] - min) / range) * h
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
      <circle cx={w} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

const DriverCard = ({ driver, isGainer }: { driver: Driver; isGainer: boolean }) => {
  const tc = TEAM_COLORS[driver.team.toLowerCase()] || '#8a8a94'
  const changeVal = driver.change ?? 0
  const last = driver.driver.split(' ').pop()
  const first = driver.driver.split(' ').slice(0, -1).join(' ')
  
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchWikiImage = async () => {
      try {
        const searchName = driver.driver === 'Yuuki Tsunoda' ? 'Yuki Tsunoda' : driver.driver;
        const res = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchName)}&prop=pageimages&format=json&pithumbsize=600&origin=*`
        );
        const data = await res.json();
        const pages = data.query?.pages;
        
        if (!pages) throw new Error("No pages found");

        const pageId = Object.keys(pages)[0];
        
        if (pageId !== '-1' && pages[pageId].thumbnail?.source) {
          setImageUrl(pages[pageId].thumbnail.source);
        } else {
          throw new Error("No image found on Wikipedia");
        }
      } catch (err) {
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWikiImage();
  }, [driver.driver]);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-zinc-700/40 hover:border-orange-500/40 transition-all duration-500 h-full flex flex-col bg-gradient-to-br from-zinc-900 to-black shadow-lg hover:shadow-2xl hover:shadow-orange-500/10">
      {/* Top accent beam */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${tc}, transparent)`, opacity: 0.6 }} />

      {/* Image Section */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-b from-zinc-800 to-black">
        {isLoading && <div className="absolute inset-0 bg-zinc-800/20 animate-pulse" />}
        
        {(imageError || (!isLoading && !imageUrl)) ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tc}30 0%, transparent 100%)` }}>
            <User size={80} className="text-zinc-700/30" />
          </div>
        ) : (
          <img 
            src={imageUrl || ''}
            alt=""
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ${isLoading ? 'invisible' : 'visible'}`}
          />
        )}
        
        {/* Multi-layer overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black/90" />
        <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 60% 40%, ${tc}20, transparent 70%)` }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5 relative z-10">
        <div className="mb-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{first}</p>
          <h3 className="text-2xl font-black italic uppercase text-white mt-1 drop-shadow-lg">{last}</h3>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-700/50">
            <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: tc }} />
            <p className="text-[9px] font-black uppercase tracking-[0.15em]" style={{ color: tc }}>
              {driver.team}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-700/40">
          <div className="mb-4">
            <span className="text-[10px] text-zinc-500 uppercase tracking-[0.15em] font-bold">ELO Rating</span>
            <div className="text-2xl font-black font-mono text-white mt-1">{driver.elo.toLocaleString()}</div>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-black transition-all ${isGainer ? 'bg-green-500/15 text-green-300 border border-green-500/30 shadow-lg shadow-green-500/10' : 'bg-red-500/15 text-red-300 border border-red-500/30 shadow-lg shadow-red-500/10'}`}>
            {isGainer ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isGainer ? '+' : ''}{changeVal}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [chartData, setChartData] = useState<any[]>([])
  const [selectedChartDrivers, setSelectedChartDrivers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [updated, setUpdated] = useState('')
  const [targetRaceName, setTargetRaceName] = useState('Loading...')
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
    setTargetRaceDate(new Date(upcomingRace.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    setTargetRaceName(upcomingRace.name)
    
    const targetDate = new Date(upcomingRace.date).getTime()
    const interval = setInterval(() => {
      const diff = targetDate - new Date().getTime()
      if (diff <= 0) { clearInterval(interval); setTimeLeft({ d: '00', h: '00', m: '00', s: '00' }) }
      else setTimeLeft({
        d: Math.floor(diff / 86400000).toString().padStart(2, '0'),
        h: Math.floor((diff % 86400000) / 3600000).toString().padStart(2, '0'),
        m: Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0'),
        s: Math.floor((diff % 60000) / 1000).toString().padStart(2, '0'),
      })
    }, 1000)

    Papa.parse(SHEET_URL + '&cachebust=' + Date.now(), {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        const find = (row: Record<string, string>, ...names: string[]) => {
          for (const n of names) { const m = Object.keys(row).find(k => k.toLowerCase().trim() === n); if (m) return m }
          return null
        }
        
        if (rows.length > 0) {
          const fr = rows[0]
          const TEAM_KEY = find(fr, 'team') || ''
          const DRIVER_KEY = find(fr, 'driver') || ''
          const AVG_KEY = find(fr, 'season average', 'avg', 'average') || ''
          const ELO_KEY = find(fr, 'elo') || ''
          const CHANGE_KEY = find(fr, 'last change', 'elo change', 'change', 'delta') || ''
          
          const parsed: Driver[] = rows.filter(r => r[DRIVER_KEY]?.trim()).map((r, i) => ({
            rank: i + 1, driver: r[DRIVER_KEY].trim(),
            team: (r[TEAM_KEY] || 'Unemployed').trim(),
            avg: parseFloat(r[AVG_KEY]) || 0,
            elo: parseInt(r[ELO_KEY]) || 1500,
            change: r[CHANGE_KEY] ? parseInt(r[CHANGE_KEY]) : null,
          }))
          
          setDrivers(parsed)
          if (selectedChartDrivers.length === 0) setSelectedChartDrivers(parsed.slice(0, 5).map(d => d.driver))
          
          const raceColumns = Object.keys(fr).filter(k => /^\d{2}\s[A-Z]{2,4}_1$/.test(k.trim())).slice(0, completedCount)
          setChartData(raceColumns.map(race => {
            const dp: any = { name: race.trim().replace('_1', '').substring(3) }
            rows.forEach(row => { const v = parseInt(row[race]); if (row[DRIVER_KEY]?.trim() && !isNaN(v) && v > 500) dp[row[DRIVER_KEY].trim()] = v })
            return dp
          }))
        }
        setUpdated(new Date().toLocaleTimeString())
        setLoading(false)
      },
      error: () => setLoading(false)
    })
    return () => clearInterval(interval)
  }, [])

  const sortedDrivers = useMemo(() => {
    return [...drivers].sort((a, b) => b.elo - a.elo)
  }, [drivers])

  const toggleDriverChart = (n: string) => setSelectedChartDrivers(prev => prev.includes(n) ? prev.filter(x => x !== n) : [...prev, n].slice(-9))

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24 selection:bg-orange-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syne:wght@400;500;600;700;800&display=swap');
        
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Syne', sans-serif; }
        
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── HERO NEXT RACE ── */}
      <section className="relative overflow-hidden mb-16">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-950/20 via-black to-black" />
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-orange-600/10 blur-3xl animate-pulse" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

        <div className="container mx-auto px-6 py-12 relative z-10">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-12">
            {/* Left: Race Info */}
            <div className="flex items-start gap-8">
              <div className="relative shrink-0">
                <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-2xl shadow-orange-500/40">
                  <span className="font-black italic text-white text-4xl">R{(nextRaceIndex + 1).toString().padStart(2, '0')}</span>
                </div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-lime-400 rounded-full shadow-lg shadow-lime-400/60 animate-pulse" />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-orange-400 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-400 rounded-full" /> Next Race
                </p>
                <h2 className="text-4xl lg:text-5xl font-black italic uppercase tracking-tighter mb-2 text-white">
                  {RACE_FLAGS[targetRaceName] ?? '🏁'} {targetRaceName}
                </h2>
                <p className="text-sm text-zinc-400 tracking-wider">{targetRaceDate}</p>
              </div>
            </div>

            {/* Right: Countdown */}
            <div className="flex items-stretch gap-0 bg-black/60 rounded-xl border border-orange-500/30 overflow-hidden backdrop-blur-sm">
              {[{ val: timeLeft.d, label: 'DAYS' }, { val: timeLeft.h, label: 'HRS' }, { val: timeLeft.m, label: 'MIN' }, { val: timeLeft.s, label: 'SEC' }].map((t, i) => (
                <div key={i} className={`flex flex-col items-center justify-center px-7 py-4 tabular-nums border-r border-zinc-800/50 last:border-r-0`}>
                  <span className="text-4xl font-black font-mono text-orange-400 leading-none">{t.val}</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BIGGEST MOVERS ── */}
      <div className="container mx-auto px-6 max-w-[1400px] mb-16">
        <div className="mb-8 flex items-center gap-3">
          <Flame size={32} className="text-orange-500" />
          <h2 className="text-4xl font-black uppercase tracking-tight">Biggest Movers</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TOP GAINERS */}
          <div>
            <h3 className="text-xl font-black uppercase tracking-wider text-green-400 mb-6 flex items-center gap-3 pb-4 border-b border-green-500/20">
              <TrendingUp size={24} className="text-green-500" /> 
              <span>Top Gainers</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(null).map((_, i) => <div key={i} className="h-80 bg-gradient-to-br from-zinc-800 to-black rounded-xl animate-pulse" />)
              ) : (
                sortedDrivers.filter(d => (d.change ?? 0) > 0).slice(0, 4).map((d) => (
                  <DriverCard key={d.driver} driver={d} isGainer={true} />
                ))
              )}
            </div>
          </div>

          {/* TOP LOSERS */}
          <div>
            <h3 className="text-xl font-black uppercase tracking-wider text-red-400 mb-6 flex items-center gap-3 pb-4 border-b border-red-500/20">
              <TrendingDown size={24} className="text-red-500" /> 
              <span>Top Losers</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(null).map((_, i) => <div key={i} className="h-80 bg-gradient-to-br from-zinc-800 to-black rounded-xl animate-pulse" />)
              ) : (
                sortedDrivers.filter(d => (d.change ?? 0) < 0).slice(0, 4).map((d) => (
                  <DriverCard key={d.driver} driver={d} isGainer={false} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ANALYTICS GRID ── */}
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ELO RANKINGS */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl flex flex-col shadow-xl flex-1 overflow-hidden backdrop-blur-sm">
              <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-700/40 bg-black/40">
                <Activity size={18} className="text-orange-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">Live Rankings</span>
                <span className="ml-auto flex items-center gap-1.5 text-[10px] text-lime-400 font-black uppercase">
                  <span className="w-1.5 h-1.5 bg-lime-400 rounded-full animate-pulse" />Live
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto no-scrollbar p-2">
                {loading ? (
                  <div className="py-20 text-center text-sm uppercase text-zinc-600 animate-pulse">Loading rankings...</div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {sortedDrivers.slice(0, 15).map((d, i) => {
                      const tc = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'
                      const nameParts = d.driver.split(' ')
                      const last = nameParts.pop()
                      const first = nameParts.join(' ')
                      const changeVal = d.change ?? 0
                      const isTop3 = i < 3

                      return (
                        <div key={d.driver} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-zinc-800/40 transition-colors group cursor-pointer border border-transparent hover:border-orange-500/20">
                          <span className={`text-xl font-black italic w-7 text-center shrink-0 transition-colors ${isTop3 ? 'text-orange-500' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{i + 1}</span>
                          
                          <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: tc }} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[10px] text-zinc-500">{first}</span>
                              <span className="text-sm font-black italic uppercase text-white">{last}</span>
                            </div>
                            <div className="text-[8px] font-bold uppercase tracking-[0.15em] mt-1" style={{ color: tc }}>{d.team}</div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <div className="text-lg font-black font-mono text-orange-400">{d.elo}</div>
                            <div className={`text-[10px] font-bold font-mono mt-1 flex justify-end items-center gap-1 ${changeVal > 0 ? 'text-green-400' : changeVal < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                              {changeVal > 0 ? <TrendingUp size={10}/> : changeVal < 0 ? <TrendingDown size={10}/> : null}
                              <span>{changeVal !== null ? (changeVal > 0 ? `+${changeVal}` : changeVal) : '—'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* TRAJECTORY CHART */}
          <div className="lg:col-span-6 flex flex-col">
            <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl flex flex-col shadow-xl flex-1 overflow-hidden backdrop-blur-sm">
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-700/40 bg-black/40">
                <div className="flex items-center gap-3">
                  <Target size={18} className="text-orange-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">Season Trajectory</span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500">{updated ? `${updated}` : 'live'}</span>
              </div>
              
              {/* Driver Selectors */}
              <div className="flex flex-wrap gap-2 px-4 py-3 border-b border-zinc-700/40 max-h-[120px] overflow-y-auto no-scrollbar bg-black/20">
                {drivers.map(d => {
                  const sel = selectedChartDrivers.includes(d.driver)
                  const tc = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'
                  return (
                    <button key={d.driver} onClick={() => toggleDriverChart(d.driver)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all ${sel ? 'bg-orange-600/30 text-white border-orange-500/50 shadow-lg shadow-orange-500/20' : 'bg-black/40 text-zinc-400 border-zinc-700/40 hover:text-zinc-200 hover:border-zinc-600/60'}`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tc, opacity: sel ? 1 : 0.5 }} />
                      {d.driver.split(' ').pop()}
                    </button>
                  )
                })}
              </div>

              {/* Chart */}
              <div className="flex-1 relative py-4 px-4 min-h-[320px]">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center text-xs uppercase text-zinc-600 animate-pulse">Loading chart...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.3} />
                      <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10, fontWeight: 600 }} tickFormatter={v => v.toUpperCase()} axisLine={false} tickLine={false} minTickGap={20} dy={5} />
                      <YAxis domain={['dataMin - 15', 'dataMax + 15']} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                      <Tooltip content={<CustomTooltip />} />
                      {selectedChartDrivers.map(id => {
                        const d = drivers.find(x => x.driver === id)
                        const color = d ? TEAM_COLORS[d.team.toLowerCase()] : '#8a8a94'
                        return <Line key={id} type="monotone" dataKey={id} name={id} stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: color }} connectNulls isAnimationActive={false} />
                      })}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PREMIUM EDITORIAL CARD */}
        <div className="mt-8 mb-8">
          <Link href="/editorial" className="group block bg-gradient-to-r from-black via-orange-950/10 to-black border border-orange-500/20 rounded-xl overflow-hidden relative hover:border-orange-500/40 transition-all duration-300">
            <div className="absolute inset-0 opacity-20 group-hover:opacity-30 transition-opacity"
              style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=1600&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />
            
            <div className="relative z-10 p-10 lg:p-14">
              <div className="mb-6">
                <span className="inline-block bg-orange-600 text-white text-[11px] font-black italic px-4 py-2 uppercase tracking-widest rounded shadow-lg">Premium Analysis</span>
              </div>
              <h2 className="text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-[0.95] mb-6 text-white group-hover:text-orange-300 transition-colors">
                McLaren, Regulations &amp; <span className="text-orange-500">Miami</span>
              </h2>
              <div className="flex items-center gap-3 text-orange-400 text-[11px] font-black italic uppercase tracking-widest group-hover:gap-6 transition-all">
                Read Analysis <ChevronRight size={18} />
              </div>
            </div>
          </Link>
        </div>
      </div>

    </div>
  )
}