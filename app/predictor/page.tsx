'use client'

import React, { useEffect, useState, useMemo } from 'react'
import Papa from 'papaparse'
import { ChevronDown, Zap, TrendingUp, AlertCircle, BarChart3 } from 'lucide-react'

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#061D42',
  'mclaren': '#FF8000', 'aston martin': '#006F62', 'alpine': '#0090FF',
  'williams': '#005AFF', 'racing bulls': '#1634CC', 'vcarb': '#1634CC',
  'sauber': '#52E252', 'haas': '#B6BABD', 'cadillac': '#C8A951',
  'audi': '#00A651',
}

interface CarPerf {
  team: string
  baseTime: number
  trait: string
}

const DEFAULT_CAR_PERF: CarPerf[] = [
  { team: 'McLaren', baseTime: 84.200, trait: 'cornering' },
  { team: 'Ferrari', baseTime: 84.450, trait: 'cornering' },
  { team: 'Mercedes', baseTime: 84.500, trait: 'balanced' },
  { team: 'Red Bull', baseTime: 84.750, trait: 'power' },
  { team: 'Aston Martin', baseTime: 85.200, trait: 'balanced' },
  { team: 'Williams', baseTime: 85.450, trait: 'power' },
  { team: 'Haas', baseTime: 85.650, trait: 'cornering' },
  { team: 'Alpine', baseTime: 85.850, trait: 'balanced' },
  { team: 'Sauber', baseTime: 86.050, trait: 'balanced' },
  { team: 'Racing Bulls', baseTime: 86.300, trait: 'balanced' },
  { team: 'Cadillac', baseTime: 86.600, trait: 'power' },
]

interface Driver {
  driver: string
  team: string
  elo: number
}

interface RacePrediction {
  position: number
  driver: string
  team: string
  elo: number
  totalTime: number
  gapToPrevious: number | null
  lapTime: number
}

export default function RacePredictor() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [carPerformance, setCarPerformance] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_CAR_PERF.map(cp => [cp.team.toLowerCase(), cp.baseTime]))
  )
  const [laps, setLaps] = useState(50)
  const [predictions, setPredictions] = useState<RacePrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [showPredictions, setShowPredictions] = useState(false)

  // Fetch driver data
  useEffect(() => {
    Papa.parse(SHEET_URL + '&cachebust=' + Date.now(), {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]

        const find = (row: Record<string, string>, ...names: string[]) => {
          for (const n of names) {
            const m = Object.keys(row).find(k => k.toLowerCase().trim() === n)
            if (m) return m
          }
          return null
        }

        if (rows.length > 0) {
          const fr = rows[0]
          const DRIVER_KEY = find(fr, 'driver') || ''
          const TEAM_KEY = find(fr, 'team') || ''
          const ELO_KEY = find(fr, 'elo') || ''

          const parsed: Driver[] = rows
            .filter(r => r[DRIVER_KEY]?.trim())
            .map(r => ({
              driver: r[DRIVER_KEY].trim(),
              team: (r[TEAM_KEY] || 'Unemployed').trim(),
              elo: parseInt(r[ELO_KEY]) || 1500,
            }))

          setDrivers(parsed)
        }
        setLoading(false)
      },
      error: () => setLoading(false),
    })
  }, [])

  // Group drivers by team
  const driversByTeam = useMemo(() => {
    const grouped: Record<string, Driver[]> = {}
    drivers.forEach(d => {
      const key = d.team.toLowerCase()
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(d)
    })
    return grouped
  }, [drivers])

  // Calculate race prediction
  const calculatePrediction = () => {
    if (drivers.length === 0) return

    // Calculate lap time for each driver
    // Find max ELO in the field for reference
    const maxElo = Math.max(...drivers.map(d => d.elo))

    const predictions: RacePrediction[] = drivers.map(driver => {
      const teamKey = driver.team.toLowerCase()
      const baseTime = carPerformance[teamKey] || 84.2

      // Higher ELO = faster (subtract from lap time)
      // 1 ELO difference = 1ms per lap = 0.001 seconds
      const eloAdvantageSeconds = (driver.elo - maxElo) / 1000

      // Lap time = base time - ELO advantage (negative advantage makes it faster)
      const lapTime = baseTime + eloAdvantageSeconds

      // Total race time (for sorting, not displayed)
      const totalTime = lapTime * laps

      return {
        position: 0,
        driver: driver.driver,
        team: driver.team,
        elo: driver.elo,
        totalTime,
        lapTime,
        gapToPrevious: null,
      }
    })

    // Sort by total time
    predictions.sort((a, b) => a.totalTime - b.totalTime)
    
    // Calculate gaps to leader
    const leaderTime = predictions[0].totalTime
    predictions.forEach((pred, i) => {
      pred.position = i + 1
      if (i > 0) {
        pred.gapToPrevious = pred.totalTime - leaderTime
      }
    })

    setPredictions(predictions)
    setShowPredictions(true)
  }

  const uniqueTeams = useMemo(() => {
    return Object.keys(driversByTeam).sort()
  }, [driversByTeam])

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toFixed(3).padStart(6, '0')}`
  }

  const formatGap = (seconds: number): string => {
    if (seconds < 0.001) return '—'
    if (seconds < 1) {
      const ms = Math.round(seconds * 1000)
      return `+${ms}ms`
    }
    return `+${seconds.toFixed(3)}s`
  }

  const exportResults = () => {
    if (predictions.length === 0) return

    const lines: string[] = []
    lines.push('F1 RACE PREDICTOR RESULTS')
    lines.push('='.repeat(80))
    lines.push(``)
    lines.push(`Race Distance: ${laps} laps`)
    lines.push(`Generated: ${new Date().toLocaleString()}`)
    lines.push(``)
    lines.push('='.repeat(80))
    lines.push(``)

    // Table header
    lines.push(`POS | DRIVER                | TEAM              | ELO  | LAP TIME  | GAP TO LEADER`)
    lines.push('-'.repeat(80))

    // Results
    predictions.forEach(pred => {
      const pos = pred.position.toString().padStart(2, ' ')
      const driver = pred.driver.padEnd(20, ' ')
      const team = pred.team.padEnd(16, ' ')
      const elo = pred.elo.toString().padStart(4, ' ')
      const lapTime = `${(pred.lapTime * 1000).toFixed(1)}ms`.padStart(8, ' ')
      const gap = pred.gapToPrevious === null ? '—'.padEnd(14, ' ') : formatGap(pred.gapToPrevious).padEnd(14, ' ')

      lines.push(`${pos} | ${driver} | ${team} | ${elo} | ${lapTime} | ${gap}`)
    })

    lines.push(``)
    lines.push('-'.repeat(80))
    lines.push(``)

    // Summary
    lines.push(`SUMMARY STATISTICS`)
    lines.push(`Leader: ${predictions[0].driver} (${(predictions[0].lapTime * 1000).toFixed(1)}ms per lap)`)
    lines.push(`Gap (Leader to Last): ${formatGap(predictions[predictions.length - 1].gapToPrevious || 0)}`)
    lines.push(`Average Top 3 Lap Time: ${(predictions.slice(0, 3).reduce((a, b) => a + b.lapTime, 0) / 3 * 1000).toFixed(1)}ms`)
    lines.push(``)
    lines.push('='.repeat(80))

    const text = lines.join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `f1-race-prediction-${laps}laps-${new Date().getTime()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-24 selection:bg-orange-500/30">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Syne:wght@400;500;600;700;800&display=swap');
        body { font-family: 'Inter', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Syne', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Header */}
      <section className="relative overflow-hidden border-b border-zinc-800/50 mb-12">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

        <div className="container mx-auto px-6 py-16 relative z-10">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 size={32} className="text-orange-500" />
              <span className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-400">Race Simulation</span>
            </div>
            <h1 className="text-5xl lg:text-6xl font-black italic uppercase tracking-tighter text-white mb-4">
              F1 Race Predictor
            </h1>
            <p className="text-lg text-zinc-300 max-w-2xl leading-relaxed">
              Simulate race outcomes based on car performance and driver ELO ratings. Every 1 ELO difference adds 1ms per lap.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-6 max-w-6xl">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block text-zinc-500 text-sm uppercase tracking-widest animate-pulse">
              Loading drivers...
            </div>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            {/* Inputs Panel */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
                {/* Panel Header */}
                <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-700/40 bg-black/40 sticky top-0 z-20">
                  <Zap size={18} className="text-orange-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">Car Performance</span>
                </div>

                {/* Laps Input */}
                <div className="px-6 py-6 border-b border-zinc-700/40 bg-black/20">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-3 block">Race Distance (Laps)</span>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={laps}
                        onChange={(e) => setLaps(Math.max(1, parseInt(e.target.value) || 1))}
                        className="flex-1 px-4 py-3 bg-zinc-900/60 border border-zinc-700/60 rounded-lg text-white font-bold text-lg focus:outline-none focus:border-orange-500/60 focus:bg-zinc-900 transition-all"
                      />
                      <span className="text-[11px] font-mono text-zinc-500 font-bold uppercase">{laps} laps</span>
                    </div>
                  </label>
                </div>

                {/* Team Performance Inputs */}
                <div className="p-6">
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 mb-5">
                    Car base lap times (seconds) - editable
                  </p>

                  <div className="space-y-4">
                    {uniqueTeams.map(teamKey => {
                      const teamName = driversByTeam[teamKey][0]?.team || teamKey
                      const teamColor = TEAM_COLORS[teamKey] || '#8a8a94'
                      const teamDrivers = driversByTeam[teamKey]
                      const baseTime = carPerformance[teamKey] || 84.2

                      return (
                        <div
                          key={teamKey}
                          className="p-4 rounded-lg border border-zinc-700/40 hover:border-zinc-600/60 transition-all bg-zinc-900/30"
                          style={{ borderLeftColor: teamColor, borderLeftWidth: '3px' }}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <p className="text-sm font-black uppercase tracking-wider text-white">{teamName}</p>
                              <p className="text-[9px] text-zinc-500 mt-1">
                                {teamDrivers.length} driver{teamDrivers.length !== 1 ? 's' : ''} (avg ELO: {Math.round(teamDrivers.reduce((a, b) => a + b.elo, 0) / teamDrivers.length)})
                              </p>
                            </div>
                          </div>

                          <input
                            type="number"
                            min="80"
                            max="95"
                            step="0.001"
                            value={baseTime}
                            onChange={(e) =>
                              setCarPerformance(prev => ({
                                ...prev,
                                [teamKey]: parseFloat(e.target.value) || 84.2,
                              }))
                            }
                            className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-700/60 rounded text-white font-bold text-sm focus:outline-none focus:border-orange-500/60 transition-all"
                            style={{ borderLeftColor: teamColor, borderLeftWidth: '2px' }}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Calculate Button */}
                <div className="px-6 py-5 border-t border-zinc-700/40 bg-black/40">
                  <button
                    onClick={calculatePrediction}
                    className="w-full px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-black uppercase tracking-wider rounded-lg hover:from-orange-500 hover:to-orange-400 transition-all duration-300 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 active:scale-95"
                  >
                    Calculate Race Prediction
                  </button>
                </div>
              </div>
            </div>

            {/* Info Panel */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm h-full">
                <div className="flex items-center gap-3 px-6 py-5 border-b border-zinc-700/40 bg-black/40">
                  <AlertCircle size={18} className="text-orange-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">How It Works</span>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400 mb-2">Base Lap Times</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Each team has a realistic base lap time. Mercedes is fastest, others progressively slower.
                    </p>
                  </div>

                  <div className="h-px bg-zinc-700/40" />

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400 mb-2">ELO Impact</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Higher ELO = Faster. Each 1 ELO point = 1ms faster per lap. A 50 ELO advantage = 50ms per lap faster.
                    </p>
                  </div>

                  <div className="h-px bg-zinc-700/40" />

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400 mb-2">Race Calculation</p>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Final time = (base time + ELO advantage in seconds) × number of laps.
                    </p>
                  </div>

                  <div className="h-px bg-zinc-700/40" />

                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-orange-400 mb-2">Total Drivers</p>
                    <p className="text-2xl font-black text-white">{drivers.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Predictions Table */}
        {showPredictions && predictions.length > 0 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-zinc-900/80 to-black border border-zinc-700/50 rounded-xl overflow-hidden shadow-xl backdrop-blur-sm">
              {/* Table Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-700/40 bg-black/40 sticky top-0 z-20">
                <div className="flex items-center gap-3">
                  <TrendingUp size={18} className="text-orange-500" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-300">
                    Race Results – {laps} Laps
                  </span>
                </div>
                <button
                  onClick={exportResults}
                  className="px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 rounded text-[10px] font-black uppercase tracking-widest text-orange-400 hover:text-orange-300 transition-all active:scale-95"
                >
                  Export as Text
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-700/40 bg-black/40">
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 w-16">Pos</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 flex-1">Driver</th>
                      <th className="text-left px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 w-24">Team</th>
                      <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 w-28">ELO</th>
                      <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 w-32">Lap Time</th>
                      <th className="text-right px-6 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 w-28">Gap to Leader</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((pred, idx) => {
                      const teamColor = TEAM_COLORS[pred.team.toLowerCase()] || '#8a8a94'
                      const isLeader = idx === 0
                      const isPodium = idx < 3

                      return (
                        <tr
                          key={pred.driver}
                          className={`border-b border-zinc-800/30 transition-colors ${
                            isLeader
                              ? 'bg-orange-500/5 hover:bg-orange-500/10'
                              : isPodium
                              ? 'bg-zinc-900/40 hover:bg-zinc-900/60'
                              : 'hover:bg-zinc-900/30'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <span
                              className={`text-lg font-black italic ${
                                isLeader ? 'text-orange-500' : isPodium ? 'text-zinc-300' : 'text-zinc-600'
                              }`}
                            >
                              {pred.position}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: teamColor }} />
                              <span className="font-bold text-white">{pred.driver}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold uppercase" style={{ color: teamColor }}>
                              {pred.team}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-mono font-bold text-white">{pred.elo}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-mono text-xs font-bold text-zinc-300">
                              {(pred.lapTime * 1000).toFixed(1)}ms
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={`font-mono font-bold text-sm ${
                                pred.gapToPrevious === null
                                  ? 'text-orange-500'
                                  : pred.gapToPrevious < 0.1
                                  ? 'text-red-400'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {pred.gapToPrevious === null ? '—' : formatGap(pred.gapToPrevious)}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-6 py-6 border-t border-zinc-700/40 bg-black/40">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-2">Leader</p>
                  <p className="text-lg font-black text-white">{predictions[0].driver}</p>
                  <p className="text-[9px] text-zinc-500 mt-1">{(predictions[0].lapTime * 1000).toFixed(1)}ms per lap</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-2">Gap to Last</p>
                  <p className="text-lg font-black text-white">{formatGap(predictions[predictions.length - 1].gapToPrevious || 0)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-500 mb-2">Avg Lap (Top 3)</p>
                  <p className="text-lg font-black text-white">
                    {(predictions.slice(0, 3).reduce((a, b) => a + b.lapTime, 0) / 3 * 1000).toFixed(1)}ms
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}