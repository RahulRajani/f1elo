'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import Link from 'next/link'
import {
  ChevronLeft, Trophy, TrendingUp, TrendingDown, Award, 
  BarChart3, Zap, Target, Share2, Download, X, AlertCircle
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { User } from 'lucide-react'

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#061D42',
  'mclaren': '#FF8000', 'aston martin': '#006F62', 'alpine': '#0090FF',
  'williams': '#005AFF', 'racing bulls': '#1634CC', 'vcarb': '#1634CC',
  'sauber': '#52E252', 'haas': '#B6BABD', 'cadillac': '#C8A951',
}

interface DriverData {
  rank: number
  driver: string
  team: string
  elo: number
  change: number
  avg: number
  peak: number
  low: number
  form: number
  history: { race: string; elo: number }[]
  podiums: { first: number; second: number; third: number }
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-black/90 border border-orange-500/40 rounded-lg p-3 shadow-2xl backdrop-blur-md">
        <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest mb-2">{label}</p>
        <div className="flex justify-between gap-4">
          <span className="font-bold text-sm" style={{ color: payload[0].color }}>ELO</span>
          <span className="text-white font-mono text-sm">{Math.round(payload[0].value)}</span>
        </div>
      </div>
    )
  }
  return null
}

export default function DriverProfile({ params }: { params: { name?: string } }) {
  // FIX: Safely handle undefined parameters
  const driverName = params?.name ? decodeURIComponent(params.name) : null
  
  const [driver, setDriver] = useState<DriverData | null>(null)
  const [allDrivers, setAllDrivers] = useState<DriverData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareDriver, setCompareDriver] = useState<DriverData | null>(null)

  // Fetch data from Google Sheet
  useEffect(() => {
    // FIX: Check if driverName exists before fetching
    if (!driverName) {
      setError('No driver specified. Please select a driver from the rankings.')
      setLoading(false)
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        await new Promise(resolve => {
          Papa.parse(SHEET_URL + '&cachebust=' + Date.now(), {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              try {
                const rows = results.data as Record<string, string>[]
                
                if (!rows || rows.length === 0) {
                  throw new Error('No data found in spreadsheet')
                }

                // Find column keys
                const find = (row: Record<string, string>, ...names: string[]) => {
                  for (const n of names) {
                    const m = Object.keys(row).find(k => k.toLowerCase().trim() === n.toLowerCase().trim())
                    if (m) return m
                  }
                  return null
                }

                const fr = rows[0]
                const TEAM_KEY = find(fr, 'team') || ''
                const DRIVER_KEY = find(fr, 'driver') || ''
                const ELO_KEY = find(fr, 'elo') || ''
                const CHANGE_KEY = find(fr, 'last change', 'change') || ''
                const AVG_KEY = find(fr, 'season average', 'avg') || ''
                const PEAK_KEY = find(fr, 'peak', 'highest rating') || ''
                const LOW_KEY = find(fr, 'low', 'lowest rating') || ''
                const FORM_KEY = find(fr, 'form') || ''

                if (!DRIVER_KEY || !ELO_KEY) {
                  throw new Error('Could not find required columns in spreadsheet')
                }

                const raceColumns = Object.keys(fr).filter(k => /^\d{2}\s[A-Z]{2,4}_1$/.test(k.trim()))

                const parsed: DriverData[] = rows
                  .filter(r => r[DRIVER_KEY]?.trim())
                  .map((r, idx) => {
                    const elo = parseInt(r[ELO_KEY]) || 1500
                    const history = raceColumns
                      .map(col => ({
                        race: col.trim().replace('_1', '').substring(3),
                        elo: parseInt(r[col]) || 0
                      }))
                      .filter(h => h.elo > 500)

                    return {
                      rank: idx + 1,
                      driver: r[DRIVER_KEY].trim(),
                      team: r[TEAM_KEY]?.trim() || 'Unknown',
                      elo,
                      change: CHANGE_KEY ? (parseInt(r[CHANGE_KEY]) || 0) : 0,
                      avg: AVG_KEY ? (parseFloat(r[AVG_KEY]) || 0) : 0,
                      peak: PEAK_KEY ? (parseInt(r[PEAK_KEY]) || elo) : elo,
                      low: LOW_KEY ? (parseInt(r[LOW_KEY]) || 0) : 0,
                      form: FORM_KEY ? (parseFloat(r[FORM_KEY]) || 0) : 0,
                      history,
                      podiums: { first: 0, second: 0, third: 0 }
                    }
                  })
                  .sort((a, b) => b.elo - a.elo)
                  .map((d, i) => ({ ...d, rank: i + 1 }))

                setAllDrivers(parsed)

                // Find the specific driver (case-insensitive)
                const found = parsed.find(d => 
                  d.driver.toLowerCase() === driverName.toLowerCase()
                )

                if (found) {
                  setDriver(found)
                  fetchDriverImage(found.driver)
                } else {
                  // Try partial match as fallback
                  const partial = parsed.find(d =>
                    d.driver.toLowerCase().includes(driverName.toLowerCase()) ||
                    driverName.toLowerCase().includes(d.driver.toLowerCase())
                  )
                  if (partial) {
                    setDriver(partial)
                    fetchDriverImage(partial.driver)
                  } else {
                    setError(`Driver "${driverName}" not found. Available drivers: ${parsed.map(d => d.driver).join(', ').substring(0, 100)}...`)
                  }
                }
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to parse data')
              } finally {
                setLoading(false)
                resolve(null)
              }
            },
            error: (err) => {
              setError(`Failed to load spreadsheet: ${err.message}`)
              setLoading(false)
              resolve(null)
            }
          })
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred')
        setLoading(false)
      }
    }

    fetchData()
  }, [driverName])

  const fetchDriverImage = async (driverName: string) => {
    try {
      const searchName = driverName === 'Yuuki Tsunoda' ? 'Yuki Tsunoda' : driverName
      const res = await fetch(
        `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(searchName)}&prop=pageimages&format=json&pithumbsize=800&origin=*`,
        { signal: AbortSignal.timeout(5000) }
      )
      const data = await res.json()
      const pages = data.query?.pages
      const pageId = Object.keys(pages)[0]
      if (pageId !== '-1' && pages[pageId].thumbnail?.source) {
        setImageUrl(pages[pageId].thumbnail.source)
      } else {
        setImageError(true)
      }
    } catch (err) {
      setImageError(true)
    }
  }

  // Show leaderboard if no driver specified
  if (!driverName && allDrivers.length > 0) {
    return (
      <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24 selection:bg-orange-500/30">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syne:wght@400;500;600;700;800&display=swap');
          body { font-family: 'Inter', sans-serif; }
          h1, h2, h3, h4, h5, h6 { font-family: 'Syne', sans-serif; }
        `}</style>

        {/* HEADER */}
        <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800/50">
          <div className="container mx-auto px-6 py-6 max-w-6xl">
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white">🏁 F1 ELO Rankings</h1>
            <p className="text-zinc-400 text-sm mt-2">2026 Season Standings</p>
          </div>
        </div>

        <div className="container mx-auto px-6 py-12 max-w-6xl">
          {/* Tier Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-12">
            {[
              { label: 'S', desc: 'Benchmark', color: '#ff3b3b' },
              { label: 'A', desc: 'Elite', color: '#ff9500' },
              { label: 'B', desc: 'Upper Mid', color: '#34c759' },
              { label: 'C', desc: 'Midfield', color: '#007aff' },
              { label: 'D', desc: 'Lower Mid', color: '#af52de' },
              { label: 'E', desc: 'Backmarker', color: '#636366' },
            ].map(tier => (
              <div key={tier.label} className="text-center">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-lg mx-auto mb-2 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)` }}
                >
                  {tier.label}
                </div>
                <p className="text-xs font-bold text-zinc-400">{tier.desc}</p>
              </div>
            ))}
          </div>

          {/* Rankings Table */}
          <div className="space-y-2">
            {allDrivers.map((d) => {
              const getTier = (elo: number) => {
                if (elo >= 1820) return { label: 'S', color: '#ff3b3b' }
                if (elo >= 1750) return { label: 'A', color: '#ff9500' }
                if (elo >= 1700) return { label: 'B', color: '#34c759' }
                if (elo >= 1650) return { label: 'C', color: '#007aff' }
                if (elo >= 1600) return { label: 'D', color: '#af52de' }
                return { label: 'E', color: '#636366' }
              }
              const tier = getTier(d.elo)
              const tc = TEAM_COLORS[d.team.toLowerCase()] || '#8a8a94'

              return (
                <Link key={d.driver} href={`/drivers/${encodeURIComponent(d.driver)}`}>
                  <div className="bg-gradient-to-r from-zinc-900/50 to-black border border-zinc-700/30 hover:border-orange-500/50 hover:bg-zinc-900/80 rounded-lg p-4 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      {/* Rank */}
                      <div className="text-2xl font-black text-orange-500 w-12 text-center">#{d.rank}</div>

                      {/* Tier Badge */}
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg"
                        style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)` }}
                      >
                        {tier.label}
                      </div>

                      {/* Driver Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-lg font-black uppercase group-hover:text-orange-400 transition-colors">{d.driver}</p>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tc }} />
                          <p className="text-xs font-bold text-zinc-500 uppercase">{d.team}</p>
                        </div>
                        <p className="text-xs text-zinc-600">Peak: {d.peak} | Avg: {d.avg.toFixed(0)}</p>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-6 text-right">
                        <div>
                          <p className="text-2xl font-black font-mono text-white">{d.elo}</p>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">ELO</p>
                        </div>
                        <div className={`flex items-center gap-1 ${d.change > 0 ? 'text-green-400' : d.change < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                          {d.change > 0 ? <TrendingUp size={16} /> : d.change < 0 ? <TrendingDown size={16} /> : null}
                          <span className="font-bold text-sm">{d.change > 0 ? '+' : ''}{d.change}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="flex gap-4 items-start p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
            <AlertCircle className="text-red-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-red-400 font-bold mb-2">Error Loading Profile</h3>
              <p className="text-red-300/80 text-sm mb-4">{error}</p>
              <Link href="/" className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-bold rounded-lg transition-colors">
                ← Back to Rankings
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (loading || !driver) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-zinc-400 uppercase tracking-widest text-sm font-bold">Loading {driverName || 'profile'}...</p>
          <p className="text-zinc-600 text-xs mt-3">Fetching driver data from spreadsheet</p>
        </div>
      </div>
    )
  }

  const tc = TEAM_COLORS[driver.team.toLowerCase()] || '#8a8a94'
  const last = driver.driver.split(' ').pop()
  const first = driver.driver.split(' ').slice(0, -1).join(' ')

  const getTier = (elo: number) => {
    if (elo >= 1820) return { label: 'S', desc: 'Benchmark', color: '#ff3b3b' }
    if (elo >= 1750) return { label: 'A', desc: 'Elite', color: '#ff9500' }
    if (elo >= 1700) return { label: 'B', desc: 'Upper Mid', color: '#34c759' }
    if (elo >= 1650) return { label: 'C', desc: 'Midfield', color: '#007aff' }
    if (elo >= 1600) return { label: 'D', desc: 'Lower Mid', color: '#af52de' }
    return { label: 'E', desc: 'Backmarker', color: '#636366' }
  }

  const tier = getTier(driver.elo)

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24 selection:bg-orange-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syne:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Syne', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── HEADER WITH BACK BUTTON ── */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md border-b border-zinc-800/50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
            <span className="text-sm font-bold uppercase tracking-widest">Back</span>
          </Link>
          <div className="flex items-center gap-3">
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <Share2 size={18} className="text-zinc-400" />
            </button>
            <button className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
              <Download size={18} className="text-zinc-400" />
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        
        {/* ── HERO SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Left: Image & Meta */}
          <div className="lg:col-span-1">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-800 to-black border border-zinc-700/50 shadow-xl mb-6 aspect-[3/4]">
              {imageError || !imageUrl ? (
                <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${tc}30 0%, transparent 100%)` }}>
                  <User size={100} className="text-zinc-700/30" />
                </div>
              ) : (
                <img src={imageUrl} alt={driver.driver} className="w-full h-full object-cover object-top" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Tier badge */}
              <div className="absolute top-4 right-4 flex flex-col items-center gap-2">
                <div 
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-black italic text-2xl shadow-2xl"
                  style={{ background: `linear-gradient(135deg, ${tier.color}, ${tier.color}dd)`, boxShadow: `0 0 20px ${tier.color}60` }}
                >
                  {tier.label}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-center px-2 text-zinc-300">{tier.desc}</span>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Peak ELO</p>
                <p className="text-3xl font-black font-mono text-green-400">{driver.peak.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Low ELO</p>
                <p className="text-3xl font-black font-mono text-red-400">{driver.low.toLocaleString()}</p>
              </div>
              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl p-4">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2">Season Avg</p>
                <p className="text-3xl font-black font-mono text-orange-400">{driver.avg.toFixed(0)}</p>
              </div>
            </div>
          </div>

          {/* Right: Name & Stats */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              <p className="text-sm text-zinc-500 uppercase tracking-widest font-bold mb-2">{first}</p>
              <h1 className="text-6xl font-black italic uppercase tracking-tighter mb-3 text-white">{last}</h1>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-3 h-12 rounded-full" style={{ backgroundColor: tc }} />
                <div>
                  <p className="text-sm font-bold uppercase tracking-widest" style={{ color: tc }}>{driver.team}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Rank #{driver.rank}</p>
                </div>
              </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl p-6">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">Current ELO</p>
                <p className="text-5xl font-black font-mono text-white mb-2">{driver.elo.toLocaleString()}</p>
                <div className={`flex items-center gap-2 text-sm font-bold ${driver.change > 0 ? 'text-green-400' : driver.change < 0 ? 'text-red-400' : 'text-zinc-600'}`}>
                  {driver.change > 0 ? <TrendingUp size={16} /> : driver.change < 0 ? <TrendingDown size={16} /> : null}
                  <span>{driver.change > 0 ? '+' : ''}{driver.change}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl p-6">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-3">Form Rating</p>
                <p className="text-5xl font-black font-mono text-orange-400 mb-2">{driver.form.toFixed(1)}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">out of 10</p>
              </div>
            </div>

            {/* Podiums */}
            <div className="mt-6 flex gap-4">
              <div className="flex-1 bg-gradient-to-br from-amber-900/20 to-black border border-amber-700/30 rounded-xl p-5 text-center">
                <Trophy size={24} className="mx-auto mb-2 text-amber-400" />
                <p className="text-3xl font-black font-mono text-amber-400">{driver.podiums.first}</p>
                <p className="text-[9px] text-amber-600 uppercase tracking-widest font-bold mt-1">1st Place</p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-gray-600/20 to-black border border-gray-500/30 rounded-xl p-5 text-center">
                <Award size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-3xl font-black font-mono text-gray-300">{driver.podiums.second}</p>
                <p className="text-[9px] text-gray-500 uppercase tracking-widest font-bold mt-1">2nd Place</p>
              </div>
              <div className="flex-1 bg-gradient-to-br from-orange-900/20 to-black border border-orange-700/30 rounded-xl p-5 text-center">
                <Zap size={24} className="mx-auto mb-2 text-orange-400" />
                <p className="text-3xl font-black font-mono text-orange-400">{driver.podiums.third}</p>
                <p className="text-[9px] text-orange-600 uppercase tracking-widest font-bold mt-1">3rd Place</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── ELO CHART ── */}
        {driver.history.length > 0 && (
          <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl shadow-xl overflow-hidden mb-12">
            <div className="px-6 py-5 border-b border-zinc-700/40 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 size={18} className="text-orange-500" />
                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">ELO Rating Over Time</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500">2026 Season</span>
            </div>

            <div className="relative w-full h-[400px] py-6 px-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={driver.history} margin={{ top: 10, right: 20, left: -10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.3} />
                  <XAxis dataKey="race" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis domain={['dataMin - 15', 'dataMax + 15']} stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="elo" stroke={tc} strokeWidth={3} dot={false} activeDot={{ r: 6, fill: tc }} connectNulls isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* ── COMPARISON ── */}
        <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
              <Target size={20} className="text-orange-500" />
              Compare Drivers
            </h3>
            <button
              onClick={() => setCompareOpen(!compareOpen)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-black uppercase rounded-lg transition-colors"
            >
              {compareOpen ? 'Close' : 'Select Driver'}
            </button>
          </div>

          {compareOpen && (
            <div className="max-h-[300px] overflow-y-auto no-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-6 p-4 bg-black/40 rounded-lg">
              {allDrivers.filter(d => d.driver !== driver.driver).map(d => (
                <button
                  key={d.driver}
                  onClick={() => {
                    setCompareDriver(d)
                    setCompareOpen(false)
                  }}
                  className="p-3 bg-zinc-800/50 hover:bg-orange-600/30 border border-zinc-700/50 hover:border-orange-500/50 rounded-lg transition-all text-left"
                >
                  <p className="text-xs font-bold text-white truncate">{d.driver.split(' ').pop()}</p>
                  <p className="text-[10px] text-zinc-500 truncate">{d.team}</p>
                  <p className="text-sm font-mono font-black text-orange-400 mt-1">{d.elo}</p>
                </button>
              ))}
            </div>
          )}

          {compareDriver && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Current Driver */}
              <div className="bg-black/40 border border-orange-500/30 rounded-lg p-4">
                <p className="text-sm font-black uppercase mb-3 text-orange-400">You</p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 uppercase font-bold">ELO</span>
                    <span className="text-lg font-black font-mono text-white">{driver.elo}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Peak</span>
                    <span className="text-lg font-black font-mono text-green-400">{driver.peak}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Form</span>
                    <span className="text-lg font-black font-mono text-orange-400">{driver.form.toFixed(1)}</span>
                  </div>
                </div>
              </div>

              {/* Comparison Driver */}
              <div className="bg-black/40 border border-zinc-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-black uppercase text-zinc-400">{compareDriver.driver.split(' ').pop()}</p>
                  <button onClick={() => setCompareDriver(null)} className="text-zinc-500 hover:text-white">
                    <X size={16} />
                  </button>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 uppercase font-bold">ELO</span>
                    <span className={`text-lg font-black font-mono ${compareDriver.elo > driver.elo ? 'text-green-400' : 'text-red-400'}`}>
                      {compareDriver.elo} {compareDriver.elo > driver.elo ? '+' : '-'}{Math.abs(compareDriver.elo - driver.elo)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Peak</span>
                    <span className={`text-lg font-black font-mono ${compareDriver.peak > driver.peak ? 'text-green-400' : 'text-red-400'}`}>
                      {compareDriver.peak}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 uppercase font-bold">Form</span>
                    <span className={`text-lg font-black font-mono ${compareDriver.form > driver.form ? 'text-green-400' : 'text-red-400'}`}>
                      {compareDriver.form.toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}