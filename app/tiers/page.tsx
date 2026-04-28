'use client'

import React, { useEffect, useState } from 'react'
import Papa from 'papaparse'
import Link from 'next/link'
import {
  ChevronRight, TrendingUp, TrendingDown, BarChart3, List
} from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Cell
} from 'recharts'

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#1E3050',
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

interface TierGroup {
  tier: string
  minElo: number
  maxElo: number
  color: string
  drivers: DriverData[]
}

export default function RankingsPage() {
  const [view, setView] = useState<'leaderboard' | 'tiers'>('leaderboard')
  const [drivers, setDrivers] = useState<DriverData[]>([])
  const [tiers, setTiers] = useState<TierGroup[]>([])
  const [distributionData, setDistributionData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDriver, setSelectedDriver] = useState<DriverData | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        await new Promise(resolve => {
          Papa.parse(SHEET_URL + '&cachebust=' + Date.now(), {
            download: true,
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              try {
                const rows = results.data as Record<string, string>[]
                if (!rows || rows.length === 0) throw new Error('No data found')

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

                if (!DRIVER_KEY || !ELO_KEY) throw new Error('Missing required columns')

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

                setDrivers(parsed)
                if (parsed.length > 0) setSelectedDriver(parsed[0])

                // Create tier groupings
                const tierDefinitions = [
                  { tier: 'S', minElo: 1820, color: '#dc2626' },
                  { tier: 'A', minElo: 1750, color: '#ea580c' },
                  { tier: 'B', minElo: 1700, color: '#16a34a' },
                  { tier: 'C', minElo: 1650, color: '#2563eb' },
                  { tier: 'D', minElo: 1600, color: '#9333ea' },
                  { tier: 'E', minElo: 0, color: '#64748b' }
                ]

                const tierGroups: TierGroup[] = tierDefinitions.map((def, idx) => {
                  const maxElo = idx === 0 ? Infinity : tierDefinitions[idx - 1].minElo
                  const driversInTier = parsed.filter(d => d.elo >= def.minElo && d.elo < maxElo)
                  return {
                    tier: def.tier,
                    minElo: def.minElo,
                    maxElo,
                    color: def.color,
                    drivers: driversInTier
                  }
                })

                setTiers(tierGroups)

                const distribution = tierGroups.map(t => ({
                  tier: t.tier,
                  count: t.drivers.length,
                  color: t.color,
                  percentage: ((t.drivers.length / parsed.length) * 100).toFixed(1)
                }))
                setDistributionData(distribution)
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to parse data')
              } finally {
                setLoading(false)
                resolve(null)
              }
            },
            error: (err) => {
              setError(`Failed to load data: ${err.message}`)
              setLoading(false)
              resolve(null)
            }
          })
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-slate-400 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-sm font-medium">Loading rankings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 max-w-md">
          <p className="text-red-400 text-sm font-medium mb-4">{error}</p>
          <Link href="/" className="inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded transition-colors">
            Back Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&family=Crimson+Text:ital@0;1&display=swap');
        body { font-family: 'Outfit', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Crimson Text', serif; font-weight: 700; }
      `}</style>

      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-sm border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold text-white hover:text-slate-300 transition-colors">
            F1 ELO
          </Link>
          <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700">
            <button
              onClick={() => setView('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-all font-medium text-sm ${
                view === 'leaderboard'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <List size={16} />
              Leaderboard
            </button>
            <button
              onClick={() => setView('tiers')}
              className={`flex items-center gap-2 px-4 py-2 rounded transition-all font-medium text-sm ${
                view === 'tiers'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <BarChart3 size={16} />
              Tier Distribution
            </button>
          </div>
        </div>
      </div>

      {/* LEADERBOARD VIEW */}
      {view === 'leaderboard' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-2">Leaderboard</h1>
            <p className="text-slate-400 text-base">2026 Formula 1 ELO Ratings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Drivers List */}
            <div className="lg:col-span-2 space-y-2">
              {drivers.map((driver) => (
                <button
                  key={driver.driver}
                  onClick={() => setSelectedDriver(driver)}
                  className={`w-full group transition-all duration-200 ${
                    selectedDriver?.driver === driver.driver
                      ? 'bg-slate-800/80 border-slate-700'
                      : 'bg-slate-800/30 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  } border rounded-lg p-4`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Rank */}
                      <div className="text-2xl font-bold text-slate-500 w-8 text-right flex-shrink-0">
                        {driver.rank}
                      </div>

                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-semibold text-white truncate group-hover:text-slate-100">
                          {driver.driver}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">{driver.team}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{driver.elo}</p>
                        <p className="text-xs text-slate-500 mt-1">ELO</p>
                      </div>
                      <div className={`flex items-center gap-1 px-3 py-1 rounded ${
                        driver.change > 0 ? 'bg-emerald-500/10' : driver.change < 0 ? 'bg-red-500/10' : 'bg-slate-700/30'
                      }`}>
                        {driver.change > 0 ? (
                          <TrendingUp size={14} className="text-emerald-500" />
                        ) : driver.change < 0 ? (
                          <TrendingDown size={14} className="text-red-500" />
                        ) : null}
                        <span className={`text-xs font-semibold ${
                          driver.change > 0 ? 'text-emerald-500' : driver.change < 0 ? 'text-red-500' : 'text-slate-500'
                        }`}>
                          {driver.change > 0 ? '+' : ''}{driver.change}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Driver Details Sidebar */}
            {selectedDriver && (
              <div className="lg:col-span-1 h-fit sticky top-24">
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 space-y-6">
                  {/* Header */}
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                      {selectedDriver.team}
                    </p>
                    <h2 className="text-3xl font-bold text-white">{selectedDriver.driver}</h2>
                  </div>

                  {/* Main Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                        Current ELO
                      </p>
                      <p className="text-3xl font-bold text-white">{selectedDriver.elo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                        Peak
                      </p>
                      <p className="text-3xl font-bold text-emerald-500">{selectedDriver.peak}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                        Average
                      </p>
                      <p className="text-3xl font-bold text-blue-500">{selectedDriver.avg.toFixed(0)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-2">
                        Form
                      </p>
                      <p className="text-3xl font-bold text-amber-500">{selectedDriver.form.toFixed(1)}</p>
                    </div>
                  </div>

                  {/* Chart */}
                  {selectedDriver.history.length > 0 && (
                    <div className="pt-4 border-t border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold mb-4">
                        ELO Trend
                      </p>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={selectedDriver.history} margin={{ top: 5, right: 0, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                          <XAxis dataKey="race" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis domain={['dataMin - 15', 'dataMax + 15']} tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} width={35} />
                          <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '6px' }} />
                          <Line type="monotone" dataKey="elo" stroke={TEAM_COLORS[selectedDriver.team.toLowerCase()] || '#94a3b8'} strokeWidth={2} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* View Full Profile */}
                  <Link href={`/drivers/${encodeURIComponent(selectedDriver.driver)}`}>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded transition-colors flex items-center justify-center gap-2 text-sm">
                      View Full Profile
                      <ChevronRight size={16} />
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TIER DISTRIBUTION VIEW */}
      {view === 'tiers' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-bold text-white mb-2">Tier Distribution</h1>
            <p className="text-slate-400 text-base">Driver rankings by skill tier (2026 season)</p>
          </div>

          {/* Distribution Chart */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 mb-12">
            <h2 className="text-xl font-bold text-white mb-6">Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="tier" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 500 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #475569', borderRadius: '6px', color: '#e2e8f0' }}
                  formatter={(value) => [`${value} drivers`, 'Count']}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tiers Grid */}
          <div className="space-y-8">
            {tiers.map((tierGroup) => (
              <div key={tierGroup.tier}>
                {/* Tier Header */}
                <div className="mb-4 flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                    style={{ backgroundColor: tierGroup.color }}
                  >
                    {tierGroup.tier}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">{tierGroup.tier} Tier</h3>
                    <p className="text-sm text-slate-400">
                      {tierGroup.drivers.length} driver{tierGroup.drivers.length !== 1 ? 's' : ''} ({tierGroup.drivers.length > 0 ? ((tierGroup.drivers.length / (tiers.reduce((sum, t) => sum + t.drivers.length, 0))) * 100).toFixed(0) : 0}%)
                    </p>
                  </div>
                </div>

                {/* Drivers in Tier */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tierGroup.drivers.length > 0 ? (
                    tierGroup.drivers.map((driver) => (
                      <Link key={driver.driver} href={`/drivers/${encodeURIComponent(driver.driver)}`}>
                        <div className="bg-slate-800/30 hover:bg-slate-800/60 border border-slate-700 hover:border-slate-600 rounded-lg p-4 transition-all group cursor-pointer">
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <div>
                              <p className="font-semibold text-white group-hover:text-slate-100 transition-colors text-sm">
                                {driver.driver}
                              </p>
                              <p className="text-xs text-slate-500">{driver.team}</p>
                            </div>
                            <span className="text-lg font-bold text-white flex-shrink-0">{driver.elo}</span>
                          </div>
                          <div className="flex gap-2 text-xs">
                            <span className="text-slate-400">Peak: <span className="text-slate-200 font-medium">{driver.peak}</span></span>
                            <span className="text-slate-400">Avg: <span className="text-slate-200 font-medium">{driver.avg.toFixed(0)}</span></span>
                          </div>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full py-6 text-center text-slate-500 text-sm">
                      No drivers in this tier
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tier Explanation */}
          <div className="mt-16 pt-12 border-t border-slate-800">
            <h2 className="text-2xl font-bold text-white mb-6">Tier Definitions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
                <div className="text-xl font-bold text-red-500 mb-2">S & A</div>
                <p className="text-sm text-slate-300">World-class performers. Consistently outperform peer groups with elite racecraft.</p>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
                <div className="text-xl font-bold text-emerald-500 mb-2">B & C</div>
                <p className="text-sm text-slate-300">Capable professionals demonstrating solid performance. Strong technical abilities.</p>
              </div>
              <div className="bg-slate-800/30 border border-slate-700 rounded-lg p-6">
                <div className="text-xl font-bold text-slate-400 mb-2">D & E</div>
                <p className="text-sm text-slate-300">Developing drivers with potential. Varied skill levels within the field.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}