'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import Link from 'next/link'
import {
  Quote, Trophy,
  Activity, ChevronRight, TrendingUp, TrendingDown,
  Crosshair, BarChart2, Zap
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts'

// --- CONFIGURATION ---
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#061D42',
  'mclaren': '#FF8000', 'aston martin': '#006F62', 'alpine': '#0090FF',
  'williams': '#005AFF', 'racing bulls': '#1634CC', 'vcarb': '#1634CC',
  'sauber': '#52E252', 'haas': '#B6BABD', 'cadillac': '#C8A951',
}

// Fallback image if Motorsport fails
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

// --- INTERFACES ---
interface Driver {
  rank: number; driver: string; team: string; avg: number; elo: number; change: number | null
}

// --- HELPER COMPONENTS ---
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    const sorted = [...payload].sort((a, b) => b.value - a.value)
    return (
      <div className="bg-[#0a0a0c]/95 border border-zinc-800 rounded-xl p-4 shadow-2xl backdrop-blur-md">
        <p className="text-zinc-500 text-[11px] font-black uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">GP / {label}</p>
        {sorted.map((entry, i) => (
          <div key={i} className="flex justify-between items-center gap-6 mb-2">
            <span style={{ color: entry.color }} className="font-bold text-sm">{entry.name}</span>
            <span className="text-zinc-100 font-black font-mono text-sm tabular-nums">{Math.round(entry.value)}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

const MiniSparkline = ({ data, driverName, color, w = 72, h = 28 }: { data: any[], driverName: string, color: string, w?: number, h?: number }) => {
  const pts = data.map(d => d[driverName]).filter((v): v is number => v !== undefined && !isNaN(v))
  if (pts.length < 2) return <span className="text-zinc-700 text-[10px] font-mono italic">—</span>
  const min = Math.min(...pts), max = Math.max(...pts), range = max - min || 1
  const coords = pts.map((v, i) => `${(i / (pts.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
  const lastY = h - ((pts[pts.length - 1] - min) / range) * h
  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={coords} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
      <circle cx={w} cy={lastY} r="2.5" fill={color} />
    </svg>
  )
}

const TileHeader = ({ label, icon: Icon, extra }: { label: string; icon: any; extra?: React.ReactNode }) => (
  <div className="flex items-center justify-between px-7 py-5 border-b border-zinc-800/70 bg-[#0a0a0c]/50">
    <div className="flex items-center gap-3">
      <Icon size={16} className="text-orange-500" />
      <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">{label}</span>
    </div>
    {extra}
  </div>
)

// Driver Card Component with auto-fetched Wikipedia images
const DriverCard = ({ driver, isGainer }: { driver: Driver; isGainer: boolean }) => {
  const tc = TEAM_COLORS[driver.team.toLowerCase()] || '#8a8a94'
  const changeVal = driver.change ?? 0
  const last = driver.driver.split(' ').pop()
  const first = driver.driver.split(' ').slice(0, -1).join(' ')
  
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)

  useEffect(() => {
    const fetchWikiImage = async () => {
      try {
        // Handle common CSV name variations to match Wikipedia exact titles
        const searchName = driver.driver === 'Yuuki Tsunoda' ? 'Yuki Tsunoda' : driver.driver;

        // Fetch page image from Wikipedia API (CORS friendly via origin=*)
        const res = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchName)}&prop=pageimages&format=json&pithumbsize=600&origin=*`
        );
        const data = await res.json();
        const pages = data.query?.pages;
        
        if (!pages) throw new Error("No pages found");

        const pageId = Object.keys(pages)[0];
        
        // If a valid page and thumbnail exist, use it
        if (pageId !== '-1' && pages[pageId].thumbnail?.source) {
          setImageUrl(pages[pageId].thumbnail.source);
        } else {
          throw new Error("No image found on Wikipedia");
        }
      } catch (err) {
        console.warn(`Failed to fetch image for ${driver.driver}`, err);
        setImageUrl(FALLBACK_IMAGE);
      }
    };

    fetchWikiImage();
  }, [driver.driver]);

  // Use fallback if it's still loading, errored out, or failed the wiki fetch
  const displayImage = imageError || !imageUrl ? FALLBACK_IMAGE : imageUrl;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-zinc-800/60 hover:border-zinc-600 transition-all duration-300 h-full flex flex-col bg-[#111116]`}>
      {/* Image Background */}
      <div className="relative h-48 overflow-hidden bg-[#0a0a0c]">
        {/* Skeleton loader while fetching */}
        {!imageUrl && (
          <div className="absolute inset-0 bg-zinc-800/50 animate-pulse" />
        )}
        
        <img 
          src={displayImage}
          alt={driver.driver}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-40 group-hover:opacity-60 ${!imageUrl ? 'invisible' : 'visible'}`}
        />
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#111116]/40 to-[#111116]" />
        
        {/* Team Color Bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: tc }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-5">
        <div className="mb-4">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">{first}</p>
          <h3 className="text-xl font-black italic uppercase text-white mt-1">{last}</h3>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-2" style={{ color: tc }}>{driver.team}</p>
        </div>

        <div className="mt-auto">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-xs text-zinc-500 uppercase tracking-wider">ELO Rating</span>
            <span className="text-2xl font-black font-mono text-white">{driver.elo.toLocaleString()}</span>
          </div>
          
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-black ${isGainer ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {isGainer ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>{isGainer ? '+' : ''}{changeVal}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans pb-24 selection:bg-orange-500/30">

      {/* ── NEXT RACE BAR ── */}
      <section className="w-full bg-[#08080a] border-b border-zinc-800/80 relative overflow-hidden mb-10">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_120px,rgba(255,255,255,0.012)_120px,rgba(255,255,255,0.012)_121px)] pointer-events-none" />
        <div className="container mx-auto px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-orange-600 flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.35)]">
                  <span className="font-black italic text-white text-2xl leading-none">R{(nextRaceIndex + 1).toString().padStart(2, '0')}</span>
                </div>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.45em] text-zinc-500 mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-orange-500 rounded-full inline-block" /> Next Race
                </p>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black italic uppercase tracking-tighter leading-none text-white">
                  {RACE_FLAGS[targetRaceName] ?? '🏁'}&nbsp;{targetRaceName}
                </h2>
                <p className="text-[11px] font-mono text-zinc-500 mt-2 tracking-wider">{targetRaceDate}</p>
              </div>
            </div>
            <div className="flex items-stretch gap-0 bg-[#0c0c0f] rounded-xl border border-zinc-800 overflow-hidden">
              {[{ val: timeLeft.d, label: 'DAYS' }, { val: timeLeft.h, label: 'HRS' }, { val: timeLeft.m, label: 'MIN' }, { val: timeLeft.s, label: 'SEC' }].map((t, i) => (
                <div key={i} className={`flex flex-col items-center justify-center px-6 py-3 tabular-nums ${i < 3 ? 'border-r border-zinc-800' : ''}`}>
                  <span className="text-3xl sm:text-4xl font-black font-mono text-white leading-none">{t.val}</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.25em] text-zinc-600 mt-1.5">{t.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── BIGGEST MOVERS SECTION (NOW FIRST - CENTER STAGE) ── */}
      <div className="container mx-auto px-6 max-w-[1400px] mb-12">
        <div className="mb-6">
          <h2 className="text-3xl lg:text-4xl font-black uppercase tracking-tight flex items-center gap-3">
            <Zap size={28} className="text-orange-500" />
            Biggest Movers This Weekend
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TOP GAINERS */}
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest text-green-500 mb-6 flex items-center gap-2 pb-3 border-b-2 border-green-500/30">
              <TrendingUp size={20} /> Top Gainers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(null).map((_, i) => <div key={i} className="h-80 bg-[#111116] rounded-2xl animate-pulse" />)
              ) : (
                sortedDrivers.filter(d => (d.change ?? 0) > 0).slice(0, 4).map((d) => (
                  <DriverCard key={d.driver} driver={d} isGainer={true} />
                ))
              )}
            </div>
          </div>

          {/* TOP LOSERS */}
          <div>
            <h3 className="text-xl font-black uppercase tracking-widest text-red-500 mb-6 flex items-center gap-2 pb-3 border-b-2 border-red-500/30">
              <TrendingDown size={20} /> Top Losers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {loading ? (
                Array(4).fill(null).map((_, i) => <div key={i} className="h-80 bg-[#111116] rounded-2xl animate-pulse" />)
              ) : (
                sortedDrivers.filter(d => (d.change ?? 0) < 0).slice(0, 4).map((d) => (
                  <DriverCard key={d.driver} driver={d} isGainer={false} />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── EDITORIAL HERO SECTION ── */}
      <div className="container mx-auto px-6 max-w-[1400px] mb-10">
        <div className="bg-[#0a0a0c] border border-zinc-800/80 rounded-3xl relative overflow-hidden group shadow-2xl">
          <div className="absolute inset-0 z-0 opacity-[0.2] bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=1600&auto=format&fit=crop')" }} />
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-[#0a0a0c] via-[#0a0a0c]/85 to-transparent" />
          
          <Link href="/editorial" className="relative z-10 flex flex-col p-10 lg:p-14 min-h-[420px] justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-orange-600 text-white text-[12px] font-black italic px-4 py-2 uppercase tracking-widest shadow-md">Premium Analysis</span>
                <span className="text-[11px] uppercase tracking-[0.3em] font-black text-zinc-500 border border-zinc-800 px-4 py-2 rounded-full bg-black/40 backdrop-blur-sm">Issue 03</span>
              </div>
              <h2 className="text-5xl lg:text-6xl xl:text-7xl font-black italic uppercase tracking-tighter leading-[0.95] group-hover:text-white transition-colors duration-200 mb-8">
                McLaren, <br />Regulations<br />&amp; <span className="text-orange-500">Miami</span>
              </h2>
            </div>

            <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
              <blockquote className="border-l-4 border-orange-600 pl-6 group-hover:border-orange-400 transition-colors flex-1 max-w-2xl">
                <Quote size={26} className="text-orange-600/60 mb-4" />
                <p className="text-lg text-zinc-300 italic leading-relaxed font-light">"Stella made it very clear we would start on the backfoot, but hopefully we should have a stable platform to upgrade on going forward."</p>
              </blockquote>
              
              <div className="flex items-center gap-3 text-orange-500 text-[12px] font-black italic uppercase tracking-widest group-hover:gap-6 transition-all duration-300 whitespace-nowrap shrink-0">
                Read Full Analysis <ChevronRight size={20} />
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* ── SUPPORTING SECTIONS BELOW ── */}
      <div className="container mx-auto px-6 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* LEFT COLUMN - ELO RANKINGS */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* LARGE ELO RANKINGS CARD */}
            <div className="bg-[#0a0a0c] border border-zinc-800/80 rounded-3xl flex flex-col shadow-2xl flex-1 overflow-hidden">
              <TileHeader label="Live ELO Rankings" icon={Activity} 
                extra={<span className="flex items-center gap-1.5 text-[10px] text-red-500 font-black uppercase tracking-widest"><span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse inline-block" />Live</span>}
              />
              
              <div className="flex-1 overflow-y-auto no-scrollbar p-3">
                {loading ? (
                  <div className="py-20 text-center font-mono text-sm uppercase italic text-zinc-700 animate-pulse">Decrypting Feed...</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {sortedDrivers.slice(0, 15).map((d, i) => {
                      const tc = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'
                      const nameParts = d.driver.split(' ')
                      const last = nameParts.pop()
                      const first = nameParts.join(' ')
                      const changeVal = d.change ?? 0
                      const isTop3 = i < 3

                      return (
                        <div key={d.driver} className="flex items-center gap-4 px-5 py-4 rounded-xl hover:bg-[#111116] transition-colors group cursor-pointer border border-transparent hover:border-zinc-800">
                          <span className={`text-2xl font-black italic w-8 text-center shrink-0 ${isTop3 ? 'text-orange-500' : 'text-zinc-600'} group-hover:text-zinc-300 transition-colors`}>{i + 1}</span>
                          
                          <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: tc }} />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <span className="text-[11px] text-zinc-500 group-hover:text-zinc-400 transition-colors">{first}</span>
                              <span className="text-base lg:text-lg font-black italic uppercase text-white tracking-tight">{last}</span>
                            </div>
                            <div className="text-[9px] font-bold uppercase tracking-[0.2em] mt-1.5" style={{ color: tc }}>{d.team}</div>
                          </div>
                          
                          <div className="text-right shrink-0">
                            <div className="text-lg lg:text-xl font-black font-mono text-white tabular-nums leading-none">{d.elo.toLocaleString()}</div>
                            <div className={`text-[10px] font-bold font-mono mt-2 flex justify-end items-center gap-1 ${changeVal > 0 ? 'text-green-500' : changeVal < 0 ? 'text-red-500' : 'text-zinc-600'}`}>
                              {changeVal > 0 ? <TrendingUp size={11}/> : changeVal < 0 ? <TrendingDown size={11}/> : null}
                              <span>{changeVal !== null ? (changeVal > 0 ? `+${changeVal}` : changeVal) : '—'}</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              <div className="border-t border-zinc-800/80 px-6 py-4 bg-[#08080a]">
                <Link href="#tiers" className="text-[11px] font-black uppercase tracking-widest text-orange-500/80 hover:text-orange-400 transition-colors flex items-center justify-center gap-2">
                  View Full Grid <ChevronRight size={14} />
                </Link>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN - GRAPH */}
          <div className="lg:col-span-6 flex flex-col gap-6">
            
            {/* TRAJECTORY GRAPH */}
            <div className="bg-[#0a0a0c] border border-zinc-800/80 rounded-3xl flex flex-col shadow-2xl overflow-hidden flex-1">
              <TileHeader label="Season Trajectory" icon={Crosshair} 
                extra={<span className="text-[10px] font-mono text-zinc-600">{updated ? `synced ${updated}` : 'live'}</span>}
              />
              
              {/* Driver Selectors */}
              <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-zinc-800/40 max-h-[140px] overflow-y-auto no-scrollbar">
                {drivers.map(d => {
                  const sel = selectedChartDrivers.includes(d.driver)
                  const tc = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'
                  return (
                    <button key={d.driver} onClick={() => toggleDriverChart(d.driver)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase border transition-all duration-300 ${sel ? 'bg-zinc-800 text-white shadow-md' : 'bg-[#0f0f13] text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'}`}
                      style={{ borderColor: sel ? tc : undefined }}
                    >
                      <span className={`w-2 h-2 rounded-full ${sel ? 'shadow-sm' : ''}`} style={{ backgroundColor: tc, boxShadow: sel ? `0 0 6px ${tc}` : 'none' }} />
                      {d.driver.split(' ').pop()}
                    </button>
                  )
                })}
              </div>

              {/* Graph Container */}
              <div className="flex-1 relative pt-6 pr-6 pb-2 min-h-[350px]">
                {loading ? (
                  <div className="absolute inset-0 flex items-center justify-center font-mono text-xs uppercase italic text-zinc-700 tracking-widest animate-pulse">Connecting to Telemetry...</div>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.6} />
                        <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 700 }} tickFormatter={v => v.toString().toUpperCase()} axisLine={false} tickLine={false} minTickGap={20} dy={10} />
                        <YAxis domain={['dataMin - 15', 'dataMax + 15']} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11, fontFamily: 'monospace' }} axisLine={false} tickLine={false} width={50} dx={-10} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        {selectedChartDrivers.map(id => {
                          const d = drivers.find(x => x.driver === id)
                          const color = d ? TEAM_COLORS[d.team.toLowerCase()] : '#8a8a94'
                          return <Line key={id} type="monotone" dataKey={id} name={id} stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0, fill: color }} connectNulls />
                        })}
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* MARKET EXCHANGE - FULL WIDTH BELOW */}
        <div className="mt-6">
          <div className="bg-[#0a0a0c] border border-zinc-800/80 rounded-3xl flex flex-col shadow-2xl overflow-hidden">
            <TileHeader label="Market Exchange" icon={BarChart2} 
              extra={<span className="text-[9px] bg-orange-500/10 text-orange-400 font-black uppercase tracking-widest px-2.5 py-1 rounded-full border border-orange-500/20">BETA</span>}
            />
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {(loading ? Array(3).fill(null) : sortedDrivers.slice(0, 3)).map((d, i) => {
                if (!d) return <div key={i} className="h-[100px] bg-[#111116] rounded-xl animate-pulse" />
                const tc = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'
                const last = d.driver.split(' ').pop()
                const changeVal = d.change ?? 0
                const isUp = changeVal >= 0

                return (
                  <div key={d.driver} className="flex flex-col bg-[#111116] rounded-xl p-5 border border-zinc-800/40 hover:border-zinc-600 transition-colors group">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: tc }} />
                      <div>
                        <p className="text-sm font-black italic uppercase text-white leading-none">{last}</p>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mt-1.5 group-hover:text-zinc-400">{last?.substring(0, 3).toUpperCase()}</p>
                      </div>
                    </div>
                    
                    <div className="hidden sm:block mb-4 opacity-70 group-hover:opacity-100 transition-opacity">
                      <MiniSparkline data={chartData} driverName={d.driver} color={tc} w={100} h={32} />
                    </div>

                    <div className="mt-auto">
                      <p className="text-xl font-black font-mono text-white tabular-nums leading-none">${d.elo.toLocaleString()}</p>
                      <p className={`text-[11px] font-bold font-mono mt-2 ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                        {changeVal > 0 ? '+' : ''}{changeVal !== 0 ? changeVal : '—'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-6 pb-6 pt-2">
               <Link href="/market" className="block w-full text-center bg-zinc-100 text-black text-[11px] font-black uppercase italic py-3.5 rounded-xl hover:bg-orange-500 hover:text-white transition-colors font-semibold">
                  Enter Trading Floor
               </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}