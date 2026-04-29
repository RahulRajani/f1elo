'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import Link from 'next/link'
import {
  Quote, Trophy, Activity, ChevronRight, TrendingUp, TrendingDown,
  Crosshair, BarChart2, Zap, Flame, Target, X, Wallet, ShoppingCart, ArrowRight
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

const COUNTRY_THEMES: Record<string, { name: string; primaryColor: string; secondaryColor: string; accentColor: string; flag: string; flagEmoji: string }> = {
  'Australian GP': { name: 'Australia', primaryColor: '#FFD700', secondaryColor: '#1e3a8a', accentColor: '#FFA500', flag: '🇦🇺', flagEmoji: '🇦🇺' },
  'Chinese GP': { name: 'China', primaryColor: '#DE2910', secondaryColor: '#FFDE00', accentColor: '#FF6B6B', flag: '🇨🇳', flagEmoji: '🇨🇳' },
  'Japanese GP': { name: 'Japan', primaryColor: '#BC002D', secondaryColor: '#FFFFFF', accentColor: '#FF1744', flag: '🇯🇵', flagEmoji: '🇯🇵' },
  'Miami GP': { name: 'USA', primaryColor: '#3C3B6B', secondaryColor: '#FF1E56', accentColor: '#00B4D8', flag: '🇺🇸', flagEmoji: '🇺🇸' },
  'Canadian GP': { name: 'Canada', primaryColor: '#FF0000', secondaryColor: '#FFFFFF', accentColor: '#FF6B6B', flag: '🇨🇦', flagEmoji: '🇨🇦' },
  'Monaco GP': { name: 'Monaco', primaryColor: '#E8000B', secondaryColor: '#FFFFFF', accentColor: '#FFD700', flag: '🇲🇨', flagEmoji: '🇲🇨' },
  'Spanish GP (Barcelona)': { name: 'Spain', primaryColor: '#FFC400', secondaryColor: '#C60B1E', accentColor: '#005AFF', flag: '🇪🇸', flagEmoji: '🇪🇸' },
  'Austrian GP': { name: 'Austria', primaryColor: '#ED2939', secondaryColor: '#FFFFFF', accentColor: '#FFC400', flag: '🇦🇹', flagEmoji: '🇦🇹' },
  'British GP': { name: 'United Kingdom', primaryColor: '#002D62', secondaryColor: '#FFFFFF', accentColor: '#FF1744', flag: '🇬🇧', flagEmoji: '🇬🇧' },
  'Belgian GP': { name: 'Belgium', primaryColor: '#000000', secondaryColor: '#FFD700', accentColor: '#EF3B39', flag: '🇧🇪', flagEmoji: '🇧🇪' },
  'Hungarian GP': { name: 'Hungary', primaryColor: '#CE1126', secondaryColor: '#FFFFFF', accentColor: '#007F5F', flag: '🇭🇺', flagEmoji: '🇭🇺' },
  'Dutch GP': { name: 'Netherlands', primaryColor: '#AE1C28', secondaryColor: '#FFFFFF', accentColor: '#21468B', flag: '🇳🇱', flagEmoji: '🇳🇱' },
  'Italian GP': { name: 'Italy', primaryColor: '#009246', secondaryColor: '#CE2B37', accentColor: '#002395', flag: '🇮🇹', flagEmoji: '🇮🇹' },
  'Spanish GP (Madrid)': { name: 'Spain', primaryColor: '#FFC400', secondaryColor: '#C60B1E', accentColor: '#005AFF', flag: '🇪🇸', flagEmoji: '🇪🇸' },
  'Azerbaijan GP': { name: 'Azerbaijan', primaryColor: '#3F9FD7', secondaryColor: '#FFFFFF', accentColor: '#00A651', flag: '🇦🇿', flagEmoji: '🇦🇿' },
  'Singapore GP': { name: 'Singapore', primaryColor: '#FFFFFF', secondaryColor: '#FF0000', accentColor: '#FF8C00', flag: '🇸🇬', flagEmoji: '🇸🇬' },
  'United States GP': { name: 'USA', primaryColor: '#3C3B6B', secondaryColor: '#FF1E56', accentColor: '#00B4D8', flag: '🇺🇸', flagEmoji: '🇺🇸' },
  'Mexico City GP': { name: 'Mexico', primaryColor: '#C41E3A', secondaryColor: '#FFFFFF', accentColor: '#007C3F', flag: '🇲🇽', flagEmoji: '🇲🇽' },
  'São Paulo GP': { name: 'Brazil', primaryColor: '#009B3A', secondaryColor: '#FFCC00', accentColor: '#002776', flag: '🇧🇷', flagEmoji: '🇧🇷' },
  'Las Vegas GP': { name: 'USA', primaryColor: '#3C3B6B', secondaryColor: '#FF1E56', accentColor: '#00B4D8', flag: '🇺🇸', flagEmoji: '🇺🇸' },
  'Qatar GP': { name: 'Qatar', primaryColor: '#8B0000', secondaryColor: '#FFFFFF', accentColor: '#FFD700', flag: '🇶🇦', flagEmoji: '🇶🇦' },
  'Abu Dhabi GP': { name: 'UAE', primaryColor: '#CE1126', secondaryColor: '#00843D', accentColor: '#007F5F', flag: '🇦🇪', flagEmoji: '🇦🇪' },
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

const DriverCard = ({ driver, isGainer, onTrade }: { driver: Driver; isGainer: boolean; onTrade: (code: string) => void }) => {
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
        const nameMap: Record<string, string> = {
          'Yuuki Tsunoda': 'Yuki Tsunoda',
          'George Russell': 'George Russell (racing driver)',
        };
        const searchName = nameMap[driver.driver] || driver.driver;
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
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${tc}, transparent)`, opacity: 0.6 }} />

      {/* Image */}
      <div className="relative h-32 overflow-hidden bg-gradient-to-b from-zinc-800 to-black">
        {isLoading && <div className="absolute inset-0 bg-zinc-800/20 animate-pulse" />}
        
        {(imageError || (!isLoading && !imageUrl)) ? (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tc}30 0%, transparent 100%)` }}>
            <User size={60} className="text-zinc-700/30" />
          </div>
        ) : (
          <img 
            src={imageUrl || ''}
            alt=""
            onError={() => setImageError(true)}
            className={`w-full h-full object-cover object-top group-hover:scale-110 transition-transform duration-700 ${isLoading ? 'invisible' : 'visible'}`}
          />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/30 to-black/90" />
        <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 60% 40%, ${tc}20, transparent 70%)` }} />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 relative z-10">
        <div className="mb-3">
          <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold">{first}</p>
          <h3 className="text-lg font-black italic uppercase text-white break-words">{last}</h3>
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-700/50">
            <div className="w-1 h-3 rounded-full" style={{ backgroundColor: tc }} />
            <p className="text-[8px] font-black uppercase tracking-[0.1em] break-words" style={{ color: tc }}>
              {driver.team}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-3 border-t border-zinc-700/40 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[9px] text-zinc-500 uppercase font-bold">Rating</span>
            <div className="text-lg font-black font-mono text-white">{driver.elo}</div>
          </div>
          
          <div className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs font-black transition-all justify-center ${isGainer ? 'bg-green-500/15 text-green-300 border border-green-500/30' : 'bg-red-500/15 text-red-300 border border-red-500/30'}`}>
            {isGainer ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{isGainer ? '+' : ''}{changeVal}</span>
          </div>

          <button 
            onClick={() => onTrade(driver.driver.split(' ').pop()?.substring(0, 3).toUpperCase() || '')}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-[10px] font-black uppercase italic py-2 rounded-lg transition-all shadow-lg shadow-orange-500/20 active:scale-95 flex items-center justify-center gap-1.5 mt-2"
          >
            <ShoppingCart size={12} /> Trade
          </button>
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
  const [tradeModal, setTradeModal] = useState<{ isOpen: boolean, driverCode: string | null }>({ isOpen: false, driverCode: null })
  const [currentTheme, setCurrentTheme] = useState(COUNTRY_THEMES['Miami GP'])

  useEffect(() => {
    const now = new Date().getTime()
    const ONE_DAY_MS = 24 * 60 * 60 * 1000
    const upcomingRace = RACE_CALENDAR.find(r => new Date(r.date).getTime() > now) || RACE_CALENDAR[RACE_CALENDAR.length - 1]
    const completedCount = RACE_CALENDAR.filter(r => now > new Date(r.date).getTime() + ONE_DAY_MS).length
    const raceIdx = RACE_CALENDAR.indexOf(upcomingRace)
    
    setNextRaceIndex(raceIdx)
    setTargetRaceDate(new Date(upcomingRace.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))
    setTargetRaceName(upcomingRace.name)
    setCurrentTheme(COUNTRY_THEMES[upcomingRace.name] || COUNTRY_THEMES['Miami GP'])
    
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

      {/* ── EDITORIAL HERO ── */}
      <section className="relative overflow-hidden border-b border-orange-500/20 mb-12">
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1614200187524-dc4b892acf16?q=80&w=2000&auto=format&fit=crop')", backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
        
        <div className="container mx-auto px-6 relative z-10 py-16 lg:py-20">
          <Link href="/editorial" className="group block">
            <div className="mb-6 flex items-center gap-3">
              <span className="bg-orange-600 text-white text-[11px] font-black italic px-4 py-2 uppercase tracking-widest">Premium</span>
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-zinc-400">Issue 03</span>
            </div>
            <h1 className="text-6xl lg:text-7xl font-black italic uppercase tracking-tighter leading-[0.9] mb-6 max-w-3xl group-hover:text-orange-300 transition-colors">
              McLaren, <br />Regulations<br />&amp; <span className="text-orange-500">Miami</span>
            </h1>
            <div className="flex items-center gap-3 text-orange-400 text-[11px] font-black italic uppercase tracking-widest group-hover:gap-6 transition-all">
              Read Analysis <ChevronRight size={20} />
            </div>
          </Link>
        </div>
      </section>

      {/* ── NEXT RACE BAR WITH DYNAMIC COUNTRY THEME ── */}
      <section className="container mx-auto px-6 mb-12 relative">
        {/* Dynamic country background flag */}
        <div className="absolute inset-0 opacity-[0.08] rounded-xl overflow-hidden" style={{ background: `linear-gradient(135deg, ${currentTheme.primaryColor} 0%, ${currentTheme.secondaryColor} 100%)` }} />
        
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 bg-gradient-to-br from-zinc-900/50 to-black border rounded-xl p-8 relative z-10" style={{ borderColor: `${currentTheme.primaryColor}40` }}>
          <div className="flex items-start gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-lg flex items-center justify-center shadow-2xl" style={{ background: `linear-gradient(135deg, ${currentTheme.primaryColor}, ${currentTheme.accentColor})`, boxShadow: `0 0 30px ${currentTheme.primaryColor}40` }}>
                <span className="font-black italic text-white text-3xl">R{(nextRaceIndex + 1).toString().padStart(2, '0')}</span>
              </div>
              <div className="absolute -top-2 -right-2 w-3 h-3 bg-lime-400 rounded-full shadow-lg shadow-lime-400/60 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] mb-2" style={{ color: currentTheme.primaryColor }}>Next Race</p>
              <h2 className="text-3xl font-black italic uppercase tracking-tight text-white mb-1">
                {currentTheme.flagEmoji} {targetRaceName}
              </h2>
              <p className="text-sm text-zinc-400">{targetRaceDate}</p>
            </div>
          </div>

          <div className="flex items-stretch gap-0 rounded-lg border overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.6)', borderColor: `${currentTheme.primaryColor}50` }}>
            {[{ val: timeLeft.d, label: 'DAYS' }, { val: timeLeft.h, label: 'HRS' }, { val: timeLeft.m, label: 'MIN' }, { val: timeLeft.s, label: 'SEC' }].map((t, i) => (
              <div key={i} className="flex flex-col items-center justify-center px-5 py-3 border-r last:border-r-0" style={{ borderColor: 'rgba(39,39,42,0.5)' }}>
                <span className="text-3xl font-black font-mono" style={{ color: currentTheme.primaryColor }}>{t.val}</span>
                <span className="text-[8px] font-black uppercase tracking-[0.25em] text-zinc-500 mt-1.5">{t.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEASON TRAJECTORY (BIG CHART) ── */}
      <section className="container mx-auto px-6 mb-12">
        <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl shadow-xl overflow-hidden backdrop-blur-sm">
          <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-700/40 bg-black/40">
            <div className="flex items-center gap-3">
              <Target size={20} className="text-orange-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">Season Trajectory</span>
            </div>
            <span className="text-[10px] font-mono text-zinc-500">{updated}</span>
          </div>
          
          {/* Driver Selectors */}
          <div className="flex flex-wrap gap-2 px-6 py-4 border-b border-zinc-700/40 max-h-[100px] overflow-y-auto no-scrollbar bg-black/20">
            {drivers.map(d => {
              const sel = selectedChartDrivers.includes(d.driver)
              const tc = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'
              return (
                <button key={d.driver} onClick={() => toggleDriverChart(d.driver)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase border transition-all ${sel ? 'bg-orange-600/30 text-white border-orange-500/50' : 'bg-black/40 text-zinc-400 border-zinc-700/40 hover:text-zinc-200'}`}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: tc }} />
                  {d.driver.split(' ').pop()}
                </button>
              )
            })}
          </div>

          {/* Chart - LANDSCAPE */}
          <div className="relative w-full h-[500px] py-6 px-6">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs uppercase text-zinc-600 animate-pulse">Loading chart...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.3} />
                  <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 15', 'dataMax + 15']} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<CustomTooltip />} />
                  {selectedChartDrivers.map(id => {
                    const d = drivers.find(x => x.driver === id)
                    const color = d ? TEAM_COLORS[d.team.toLowerCase()] : '#8a8a94'
                    return <Line key={id} type="monotone" dataKey={id} name={id} stroke={color} strokeWidth={3} dot={false} activeDot={{ r: 6 }} connectNulls isAnimationActive={false} />
                  })}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </section>

      {/* ── BIGGEST MOVERS ── */}
      <section className="container mx-auto px-6 mb-16">
        <div className="mb-8">
          <h2 className="text-4xl font-black uppercase tracking-tight flex items-center gap-3 mb-2">
            <Flame size={32} className="text-orange-500" />
            Biggest Movers This Weekend
          </h2>
          <p className="text-sm text-zinc-500">Buy low, sell high. Trade F1 driver ELO ratings in real-time.</p>
        </div>

        {/* TOP GAINERS & LOSERS SIDE BY SIDE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* TOP GAINERS */}
          <div>
            <h3 className="text-xl font-black uppercase tracking-wider text-green-400 mb-6 flex items-center gap-2 pb-3 border-b border-green-500/20">
              <TrendingUp size={24} /> Top Gainers
            </h3>
            <div className="grid grid-cols-2 gap-4 auto-rows-max">
              {loading ? (
                Array(4).fill(null).map((_, i) => <div key={i} className="h-64 bg-gradient-to-br from-zinc-800 to-black rounded-xl animate-pulse" />)
              ) : (
                sortedDrivers.filter(d => (d.change ?? 0) > 0).slice(0, 6).map((d) => (
                  <DriverCard key={d.driver} driver={d} isGainer={true} onTrade={(code) => setTradeModal({ isOpen: true, driverCode: code })} />
                ))
              )}
            </div>
          </div>

          {/* TOP LOSERS */}
          <div>
            <h3 className="text-xl font-black uppercase tracking-wider text-red-400 mb-6 flex items-center gap-2 pb-3 border-b border-red-500/20">
              <TrendingDown size={24} /> Top Losers
            </h3>
            <div className="grid grid-cols-2 gap-4 auto-rows-max">
              {loading ? (
                Array(4).fill(null).map((_, i) => <div key={i} className="h-64 bg-gradient-to-br from-zinc-800 to-black rounded-xl animate-pulse" />)
              ) : (
                sortedDrivers.filter(d => (d.change ?? 0) < 0).slice(0, 6).map((d) => (
                  <DriverCard key={d.driver} driver={d} isGainer={false} onTrade={(code) => setTradeModal({ isOpen: true, driverCode: code })} />
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── MARKET SECTION ── */}
      <section className="container mx-auto px-6 mb-12">
        <Link href="https://www.f1elo.me/market" className="group block relative overflow-hidden rounded-2xl border-2 border-orange-500/40 hover:border-orange-500/80 transition-all duration-500">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-950/20 via-black to-black" />
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-orange-600/15 blur-3xl animate-pulse" />
          
          <div className="relative z-10 p-12 lg:p-16">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <Wallet className="text-orange-500" size={32} />
                  <span className="text-[11px] font-black italic px-4 py-2 uppercase tracking-widest" style={{ color: '#FF8000' }}>Stock Market</span>
                </div>
                
                <h2 className="text-5xl lg:text-6xl font-black italic uppercase tracking-tighter leading-[0.95] mb-6 text-white group-hover:text-orange-300 transition-colors">
                  Trade Driver<br />
                  <span className="text-orange-500">ELO Ratings</span>
                </h2>
                
                <p className="text-lg text-zinc-300 mb-8 leading-relaxed font-light max-w-lg">
                  Build your portfolio with real F1 ELO data. Buy drivers before they peak, sell at the right moment. Real-time trading powered by live performance analytics.
                </p>
                
                <div className="flex items-center gap-3 text-orange-400 text-[11px] font-black italic uppercase tracking-widest group-hover:gap-6 transition-all">
                  Enter Market <ArrowRight size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-500/10 to-green-900/20 border border-green-500/30 rounded-xl p-6 text-center">
                  <p className="text-[11px] uppercase tracking-widest font-black text-green-400 mb-2">Biggest Gainer</p>
                  <p className="text-2xl font-black text-white">{sortedDrivers.filter(d => (d.change ?? 0) > 0).length}x</p>
                  <p className="text-[9px] text-zinc-500 mt-2">Gainers Available</p>
                </div>
                <div className="bg-gradient-to-br from-red-500/10 to-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
                  <p className="text-[11px] uppercase tracking-widest font-black text-red-400 mb-2">Biggest Loser</p>
                  <p className="text-2xl font-black text-white">{sortedDrivers.filter(d => (d.change ?? 0) < 0).length}x</p>
                  <p className="text-[9px] text-zinc-500 mt-2">Losers to Short</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-900/20 border border-blue-500/30 rounded-xl p-6 text-center lg:col-span-2">
                  <p className="text-[11px] uppercase tracking-widest font-black text-blue-400 mb-2">Total Market Cap</p>
                  <p className="text-2xl font-black text-white">{sortedDrivers.length} Drivers</p>
                  <p className="text-[9px] text-zinc-500 mt-2">Actively Trading</p>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* ── TRADE MODAL ── */}
      {tradeModal.isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-black border border-orange-500/30 rounded-2xl w-full max-w-md p-8 relative shadow-2xl">
            <button onClick={() => setTradeModal({ isOpen: false, driverCode: null })} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
              <X size={20} />
            </button>
            
            <div className="mb-6">
              <h3 className="text-3xl font-black italic uppercase text-white mb-2">Trade Asset</h3>
              <p className="text-sm text-zinc-400">Coming soon: Real trading integration</p>
            </div>

            <div className="bg-gradient-to-br from-zinc-800/50 to-black border border-zinc-700 rounded-xl p-6 mb-6">
              <p className="text-sm text-zinc-300">
                This feature will allow you to trade driver ELO ratings using a Firebase-backed portfolio system. 
              </p>
            </div>

            <button onClick={() => setTradeModal({ isOpen: false, driverCode: null })} className="w-full bg-gradient-to-r from-zinc-700 to-zinc-800 hover:from-zinc-600 hover:to-zinc-700 text-white font-black italic uppercase py-3 rounded-xl transition-all">
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}