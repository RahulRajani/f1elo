'use client'

import React, { useEffect, useState } from 'react'
import Papa from 'papaparse'
import Link from 'next/link'
import { ChevronRight, TrendingUp, TrendingDown, BarChart3, List, Zap } from 'lucide-react'
import {
  BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
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
  form: number
  history: { race: string; elo: number }[]
  podiums: { first: number; second: number; third: number }
}

interface TierGroup {
  tier: string
  color: string
  drivers: DriverData[]
  minElo: number
  maxElo: number
}

// Calculate form from last 3 races
const calculateForm = (history: { race: string; elo: number }[]) => {
  if (history.length < 3) return 0
  const last3 = history.slice(-3)
  const avg = last3.reduce((sum, h) => sum + h.elo, 0) / last3.length
  // Formula: (avg_elo - 1100) / 32, capped at 0-10
  return Math.max(0, Math.min(10, (avg - 1100) / 32))
}

// Natural clustering with tier size cap
const clusterDriversByElo = (drivers: DriverData[], maxTierSize: number = 5) => {
  if (drivers.length === 0) return []
  
  const sorted = [...drivers].sort((a, b) => b.elo - a.elo)
  const clusters: DriverData[][] = []
  let currentCluster: DriverData[] = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    const eloGap = sorted[i - 1].elo - sorted[i].elo
    const tierFull = currentCluster.length >= maxTierSize
    
    // New tier if: gap > 30 ELO OR tier is at max size
    if ((eloGap > 30 && currentCluster.length >= 2) || tierFull) {
      clusters.push(currentCluster)
      currentCluster = [sorted[i]]
    } else {
      currentCluster.push(sorted[i])
    }
  }
  clusters.push(currentCluster)
  
  const tierLabels = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
  const tierColors = [
    '#dc2626', '#ea580c', '#16a34a', '#2563eb',
    '#9333ea', '#64748b', '#475569', '#1f2937', '#111827'
  ]
  
  return clusters.map((cluster, idx) => ({
    tier: tierLabels[idx] || `T${idx + 1}`,
    color: tierColors[idx] || '#64748b',
    drivers: cluster,
    minElo: Math.min(...cluster.map(d => d.elo)),
    maxElo: Math.max(...cluster.map(d => d.elo))
  }))
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

                if (!DRIVER_KEY || !ELO_KEY) throw new Error('Missing required columns')

                // Find all race columns (format: "XX ABC" where XX is number, ABC is location code)
                let raceColumns = Object.keys(fr)
                  .filter(k => /^\d{2}\s[A-Z]{2,4}/.test(k.trim()))
                  .sort()

                // Filter out garbage data: only keep races where at least 50% of drivers have data
                raceColumns = raceColumns.filter(col => {
                  const filledCells = rows.filter(r => {
                    const val = r[col]
                    return val && val.trim() && !isNaN(parseInt(val))
                  }).length
                  return filledCells / rows.length >= 0.5
                })

                const parsed: DriverData[] = rows
                  .filter(r => r[DRIVER_KEY]?.trim())
                  .map((r, idx) => {
                    const elo = parseInt(r[ELO_KEY]) || 1500
                    const history = raceColumns
                      .map(col => ({
                        race: col.trim().substring(0, 7),
                        elo: parseInt(r[col]) || 0
                      }))
                      .filter(h => h.elo > 500)

                    return {
                      rank: idx + 1,
                      driver: r[DRIVER_KEY].trim(),
                      team: r[TEAM_KEY]?.trim() || 'Unknown',
                      elo,
                      change: CHANGE_KEY ? (parseInt(r[CHANGE_KEY]) || 0) : 0,
                      form: calculateForm(history),
                      history,
                      podiums: { first: 0, second: 0, third: 0 }
                    }
                  })
                  .sort((a, b) => b.elo - a.elo)
                  .map((d, i) => ({ ...d, rank: i + 1 }))

                setDrivers(parsed)
                if (parsed.length > 0) setSelectedDriver(parsed[0])

                // Create natural tier clusters with size cap
                const tierGroups = clusterDriversByElo(parsed, 5)
                setTiers(tierGroups)

                const distribution = tierGroups.map(t => ({
                  tier: t.tier,
                  count: t.drivers.length,
                  color: t.color
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-orange-500 text-sm font-bold uppercase tracking-widest">Loading rankings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-6 max-w-md">
          <p className="text-orange-500 text-sm font-medium mb-4">{error}</p>
          <Link href="/" className="inline-block px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-bold rounded transition-colors">
            Back Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Syne', sans-serif; font-weight: 700; }
      `}</style>

      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-white hover:text-orange-500 transition-colors">
            F1 <span className="text-orange-600">ELO</span>
          </Link>
          <div className="flex items-center gap-2 bg-black/50 border border-orange-500/30 p-1 rounded-lg">
            <button
              onClick={() => setView('leaderboard')}
              className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-sm uppercase tracking-wider transition-all ${
                view === 'leaderboard'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/50'
                  : 'text-orange-500/70 hover:text-orange-500'
              }`}
            >
              <List size={16} />
              Leaderboard
            </button>
            <button
              onClick={() => setView('tiers')}
              className={`flex items-center gap-2 px-4 py-2 rounded font-bold text-sm uppercase tracking-wider transition-all ${
                view === 'tiers'
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/50'
                  : 'text-orange-500/70 hover:text-orange-500'
              }`}
            >
              <BarChart3 size={16} />
              Tiers
            </button>
          </div>
        </div>
      </div>

      {/* LEADERBOARD VIEW */}
      {view === 'leaderboard' && (
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-6xl font-black text-white mb-2 italic">LEADERBOARD</h1>
            <p className="text-orange-500 font-bold uppercase tracking-widest text-sm">2026 Formula 1 ELO Ratings</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Drivers List */}
            <div className="lg:col-span-2 space-y-3">
              {drivers.map((driver) => (
                <button
                  key={driver.driver}
                  onClick={() => setSelectedDriver(driver)}
                  className={`w-full group transition-all duration-200 border-2 rounded-lg p-5 text-left ${
                    selectedDriver?.driver === driver.driver
                      ? 'bg-orange-600/20 border-orange-600 shadow-lg shadow-orange-600/30'
                      : 'bg-transparent border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Rank */}
                      <div className="text-3xl font-black text-orange-600 w-10 flex-shrink-0">
                        #{driver.rank}
                      </div>

                      {/* Driver Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-lg font-black text-white truncate group-hover:text-orange-400">
                          {driver.driver}
                        </p>
                        <p className="text-xs text-orange-500/60 mt-1 uppercase tracking-wider font-bold">{driver.team}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-3xl font-black text-white">{driver.elo}</p>
                        <p className="text-xs text-orange-500/60 mt-1 uppercase font-bold">ELO</p>
                      </div>
                      <div className={`flex items-center gap-2 px-3 py-2 rounded font-bold ${
                        driver.change > 0 ? 'bg-emerald-500/20 text-emerald-500' : driver.change < 0 ? 'bg-red-500/20 text-red-500' : 'bg-slate-500/10 text-slate-500'
                      }`}>
                        {driver.change > 0 ? (
                          <TrendingUp size={16} />
                        ) : driver.change < 0 ? (
                          <TrendingDown size={16} />
                        ) : null}
                        <span>{driver.change > 0 ? '+' : ''}{driver.change}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Driver Details Sidebar */}
            {selectedDriver && (
              <div className="lg:col-span-1 h-fit sticky top-24">
                <div className="bg-orange-600/10 border-2 border-orange-600/30 rounded-lg p-6 space-y-6">
                  {/* Header */}
                  <div>
                    <p className="text-xs text-orange-500 uppercase tracking-widest font-black mb-2">
                      {selectedDriver.team}
                    </p>
                    <h2 className="text-4xl font-black text-white">{selectedDriver.driver}</h2>
                  </div>

                  {/* Main Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 border border-orange-500/20 rounded-lg p-4">
                      <p className="text-xs text-orange-500 uppercase tracking-widest font-bold mb-2">
                        Current
                      </p>
                      <p className="text-3xl font-black text-white">{selectedDriver.elo}</p>
                    </div>
                    <div className="bg-black/40 border border-orange-500/20 rounded-lg p-4">
                      <p className="text-xs text-orange-500 uppercase tracking-widest font-bold mb-2">
                        Change
                      </p>
                      <p className={`text-3xl font-black ${selectedDriver.change > 0 ? 'text-emerald-500' : selectedDriver.change < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                        {selectedDriver.change > 0 ? '+' : ''}{selectedDriver.change}
                      </p>
                    </div>
                  </div>

                  {/* Form Rating */}
                  <div className="bg-black/40 border border-orange-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap size={16} className="text-orange-500" />
                      <p className="text-xs text-orange-500 uppercase tracking-widest font-bold">
                        Form (Last 3 Races)
                      </p>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <p className="text-4xl font-black text-orange-500">{selectedDriver.form.toFixed(2)}</p>
                      <p className="text-sm text-slate-500">/10</p>
                    </div>
                    <div className="mt-3 h-1 bg-orange-600/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all"
                        style={{ width: `${(selectedDriver.form / 10) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Recent Races */}
                  {selectedDriver.history.length > 0 && (
                    <div className="bg-black/40 border border-orange-500/20 rounded-lg p-4">
                      <p className="text-xs text-orange-500 uppercase tracking-widest font-bold mb-3">
                        Recent Races
                      </p>
                      <div className="space-y-2">
                        {selectedDriver.history.slice(-5).reverse().map((race, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">{race.race}</span>
                            <span className="font-bold text-white">{race.elo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Full Profile */}
                  <Link href={`/drivers/${encodeURIComponent(selectedDriver.driver)}`}>
                    <button className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black py-3 rounded-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm shadow-lg shadow-orange-600/30">
                      Full Profile
                      <ChevronRight size={18} />
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
            <h1 className="text-6xl font-black text-white mb-2 italic">TIER DISTRIBUTION</h1>
            <p className="text-orange-500 font-bold uppercase tracking-widest text-sm">Natural ELO Clustering (2026)</p>
          </div>

          {/* Distribution Chart */}
          <div className="bg-orange-600/10 border-2 border-orange-600/30 rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-black text-white mb-8 uppercase">Distribution</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ea580c" opacity={0.1} />
                <XAxis dataKey="tier" stroke="#ea580c" tick={{ fill: '#ea580c', fontSize: 13, fontWeight: 700 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#ea580c" tick={{ fill: '#ea580c', fontSize: 13 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '2px solid #ea580c', borderRadius: '8px', color: '#fff' }}
                  formatter={(value) => [`${value} drivers`, 'Count']}
                  labelStyle={{ color: '#ea580c', fontWeight: 'bold' }}
                />
                <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Tiers Grid */}
          <div className="space-y-10">
            {tiers.map((tierGroup) => (
              <div key={tierGroup.tier}>
                {/* Tier Header */}
                <div className="mb-6 flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-lg flex items-center justify-center text-white font-black text-3xl shadow-lg"
                    style={{ backgroundColor: tierGroup.color }}
                  >
                    {tierGroup.tier}
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase">{tierGroup.tier} Tier</h3>
                    <p className="text-sm text-orange-500 font-bold uppercase tracking-wider mt-1">
                      {tierGroup.drivers.length} driver{tierGroup.drivers.length !== 1 ? 's' : ''} • {tierGroup.minElo}-{tierGroup.maxElo} ELO
                    </p>
                  </div>
                </div>

                {/* Drivers in Tier */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tierGroup.drivers.map((driver) => (
                    <Link key={driver.driver} href={`/drivers/${encodeURIComponent(driver.driver)}`}>
                      <div className={`border-2 rounded-lg p-5 transition-all group cursor-pointer h-full ${
                        tierGroup.color === '#dc2626' ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/60' :
                        tierGroup.color === '#ea580c' ? 'bg-orange-500/10 border-orange-500/30 hover:border-orange-500/60' :
                        tierGroup.color === '#16a34a' ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/60' :
                        tierGroup.color === '#2563eb' ? 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/60' :
                        'bg-slate-500/10 border-slate-500/30 hover:border-slate-500/60'
                      }`}>
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-black text-white group-hover:text-orange-400 transition-colors text-base">
                              {driver.driver}
                            </p>
                            <p className="text-xs text-orange-500 font-bold uppercase mt-1">{driver.team}</p>
                          </div>
                          <span className="text-2xl font-black flex-shrink-0" style={{ color: tierGroup.color }}>
                            {driver.elo}
                          </span>
                        </div>
                        <div className="flex gap-3 text-xs font-bold">
                          <span className="text-slate-400">Change: <span className={driver.change > 0 ? 'text-emerald-500' : driver.change < 0 ? 'text-red-500' : 'text-slate-500'}>{driver.change > 0 ? '+' : ''}{driver.change}</span></span>
                          <span className="text-slate-400">Form: <span className="text-orange-500">{driver.form.toFixed(2)}</span></span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}