'use client'

import React, { useEffect, useState, useCallback } from 'react'
import Papa from 'papaparse'
import {
  Trophy, Zap, AlertTriangle, RotateCcw, Play,
  ChevronDown, TrendingUp, Flag, Shield, Activity, Cpu
} from 'lucide-react'

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface DriverElo {
  name: string
  elo: number
  team: string
}

interface CarPerf {
  team: string
  baseTime: number   // lower = faster
  reliability: number // 0-1, higher = more reliable
  trait: 'power' | 'cornering' | 'balanced'
}

interface RaceResult {
  raceName: string
  position: number | 'DNF'
  points: number
  event: RaceEvent
  isWet: boolean
  lapTime?: number
}

type RaceEvent = 'dry' | 'sc' | 'vsc' | 'red' | 'wet'

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"
const CONSTRUCTORS_URL = "https://ergast.com/api/f1/current/constructorStandings.json"

const POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1]

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE',
  'ferrari': '#E80020',
  'red bull': '#061D42',
  'mclaren': '#FF8000',
  'aston martin': '#006F62',
  'alpine': '#0090FF',
  'williams': '#005AFF',
  'racing bulls': '#1634CC',
  'rb': '#1634CC',
  'audi': '#BB0000',
  'sauber': '#52E252',
  'haas': '#B6BABD',
  'cadillac': '#F1A30B',
}

// 2026 Calendar with Track Characteristics
const FULL_CALENDAR = [
  { name: 'Australian GP', code: 'AUS', date: '2026-03-15', street: true, rain: 0.20, type: 'balanced' },
  { name: 'Chinese GP', code: 'CHN', date: '2026-03-22', street: false, rain: 0.30, type: 'balanced' },
  { name: 'Japanese GP', code: 'JPN', date: '2026-04-05', street: false, rain: 0.40, type: 'cornering' },
  { name: 'Miami GP', code: 'MIA', date: '2026-05-10', street: true, rain: 0.20, type: 'power' },
  { name: 'Canadian GP', code: 'CAN', date: '2026-05-24', street: true, rain: 0.50, type: 'power' },
  { name: 'Monaco GP', code: 'MON', date: '2026-06-07', street: true, rain: 0.30, type: 'cornering' },
  { name: 'Spanish GP', code: 'ESP', date: '2026-06-14', street: false, rain: 0.10, type: 'balanced' },
  { name: 'Austrian GP', code: 'AUT', date: '2026-06-28', street: false, rain: 0.30, type: 'power' },
  { name: 'British GP', code: 'GBR', date: '2026-07-05', street: false, rain: 0.60, type: 'cornering' },
  { name: 'Belgian GP', code: 'BEL', date: '2026-07-19', street: false, rain: 0.70, type: 'power' },
  { name: 'Hungarian GP', code: 'HUN', date: '2026-07-26', street: false, rain: 0.20, type: 'cornering' },
  { name: 'Dutch GP', code: 'NLD', date: '2026-08-23', street: false, rain: 0.50, type: 'cornering' },
  { name: 'Italian GP', code: 'ITA', date: '2026-09-06', street: false, rain: 0.20, type: 'power' },
  { name: 'Spanish GP (Madrid)', code: 'MAD', date: '2026-09-13', street: true, rain: 0.05, type: 'balanced' },
  { name: 'Azerbaijan GP', code: 'AZE', date: '2026-09-26', street: true, rain: 0.05, type: 'power' },
  { name: 'Singapore GP', code: 'SGP', date: '2026-10-11', street: true, rain: 0.55, type: 'cornering' },
  { name: 'United States GP', code: 'USA', date: '2026-10-25', street: false, rain: 0.15, type: 'balanced' },
  { name: 'Mexico City GP', code: 'MEX', date: '2026-11-01', street: false, rain: 0.10, type: 'balanced' },
  { name: 'São Paulo GP', code: 'BRA', date: '2026-11-08', street: false, rain: 0.60, type: 'balanced' },
  { name: 'Las Vegas GP', code: 'LVS', date: '2026-11-21', street: true, rain: 0.00, type: 'power' },
  { name: 'Qatar GP', code: 'QAT', date: '2026-11-29', street: false, rain: 0.00, type: 'cornering' },
  { name: 'Abu Dhabi GP', code: 'ABU', date: '2026-12-06', street: false, rain: 0.00, type: 'balanced' },
]

// Pre-season Default Gaps + Track Specializations
const DEFAULT_CAR_PERF: CarPerf[] = [
  { team: 'Mercedes', baseTime: 86.500, reliability: 0.93, trait: 'balanced' },
  { team: 'Ferrari', baseTime: 86.689, reliability: 0.91, trait: 'cornering' },
  { team: 'McLaren', baseTime: 86.855, reliability: 0.92, trait: 'cornering' },
  { team: 'Red Bull', baseTime: 87.242, reliability: 0.89, trait: 'power' },
  { team: 'Alpine', baseTime: 87.620, reliability: 0.88, trait: 'balanced' },
  { team: 'Haas', baseTime: 87.850, reliability: 0.90, trait: 'cornering' },
  { team: 'Audi', baseTime: 88.264, reliability: 0.87, trait: 'balanced' },
  { team: 'Racing Bulls', baseTime: 88.658, reliability: 0.88, trait: 'balanced' },
  { team: 'Williams', baseTime: 88.890, reliability: 0.86, trait: 'power' },
  { team: 'Cadillac', baseTime: 89.800, reliability: 0.85, trait: 'power' },
  { team: 'Aston Martin', baseTime: 90.900, reliability: 0.84, trait: 'balanced' },
]

const AI_GRID = [
  { name: 'Verstappen', team: 'Red Bull', elo: 1854 },
  { name: 'Norris', team: 'McLaren', elo: 1801 },
  { name: 'Leclerc', team: 'Ferrari', elo: 1794 },
  { name: 'Russell', team: 'Mercedes', elo: 1768 },
  { name: 'Piastri', team: 'McLaren', elo: 1761 },
  { name: 'Sainz', team: 'Williams', elo: 1707 },
  { name: 'Bottas', team: 'Audi', elo: 1705 },
  { name: 'Alonso', team: 'Aston Martin', elo: 1703 },
  { name: 'Hulkenberg', team: 'Haas', elo: 1683 },
  { name: 'Perez', team: 'Racing Bulls', elo: 1660 },
  { name: 'Bearman', team: 'Haas', elo: 1659 },
  { name: 'Gasly', team: 'Alpine', elo: 1655 },
  { name: 'Albon', team: 'Williams', elo: 1648 },
  { name: 'Hadjar', team: 'Racing Bulls', elo: 1645 },
  { name: 'Hamilton', team: 'Ferrari', elo: 1643 },
  { name: 'Antonelli', team: 'Mercedes', elo: 1619 },
  { name: 'Colapinto', team: 'Alpine', elo: 1601 },
  { name: 'Lawson', team: 'Red Bull', elo: 1592 },
  { name: 'Bortoleto', team: 'Audi', elo: 1590 },
  { name: 'Lindblad', team: 'Cadillac', elo: 1570 },
  { name: 'Stroll', team: 'Aston Martin', elo: 1528 },
]

// ─── SIMULATION ENGINE ─────────────────────────────────────────────────────────

const REF_TIME = 86.500
const MAX_ELO = 1854

function pickEvent(isStreet: boolean): RaceEvent {
  const r = Math.random()
  if (isStreet) {
    if (r < 0.12) return 'red'
    if (r < 0.38) return 'sc'
    if (r < 0.52) return 'vsc'
    return 'dry'
  } else {
    if (r < 0.05) return 'red'
    if (r < 0.22) return 'sc'
    if (r < 0.32) return 'vsc'
    return 'dry'
  }
}

function eventCarMult(event: RaceEvent, isWet: boolean): number {
  let m = event === 'red' ? 0.20 : event === 'sc' ? 0.55 : event === 'vsc' ? 0.75 : 1.0
  if (isWet) m *= 0.40
  return m
}

function eventVariance(event: RaceEvent, isStreet: boolean, isWet: boolean): number {
  let v = event === 'red' ? 2.5 : event === 'sc' ? 1.8 : event === 'vsc' ? 1.2 : 0.9
  if (isStreet) v *= 1.3
  if (isWet) v += 2.8
  return v
}

function dnfChance(event: RaceEvent, isStreet: boolean, isWet: boolean, reliability: number): number {
  let base = 0.055
  if (event === 'red') base += 0.025
  if (isStreet) base += 0.04
  if (isWet) base += 0.06
  return base * (1 - reliability + 0.5)
}

function simulateLapTime(
  carBaseTime: number,
  driverElo: number,
  carMult: number,
  variance: number,
  carTrait: string,
  trackType: string
): number {
  let carGap = (carBaseTime - REF_TIME) * carMult
  // Track characteristic matching bonus
  if (carTrait === trackType) {
    carGap -= 0.150 // 1.5 tenths advantage if car suits the track
  }
  
  const driverAdj = ((MAX_ELO - driverElo) / MAX_ELO) * 1.8
  const rand = (Math.random() - 0.5) * variance
  return REF_TIME + carGap + driverAdj + rand
}

interface RaceEntry {
  id: string
  baseTime: number
  elo: number
  reliability: number
  trait: string
  pace?: number
  dnf?: boolean
}

function simulateRace(
  userEntry: RaceEntry,
  aiGrid: RaceEntry[],
  track: any
): { position: number | 'DNF'; points: number; event: RaceEvent; isWet: boolean; lapTime?: number } {
  const isWet = Math.random() < track.rain
  const event = pickEvent(track.street)
  const carMult = eventCarMult(event, isWet)
  const variance = eventVariance(event, track.street, isWet)

  const allEntries = [...aiGrid, userEntry]
  const results = allEntries.map(e => {
    const dnf = Math.random() < dnfChance(event, track.street, isWet, e.reliability)
    if (dnf) return { id: e.id, pace: 9999, dnf: true }
    const pace = simulateLapTime(e.baseTime, e.elo, carMult, variance, e.trait, track.type)
    return { id: e.id, pace, dnf: false }
  })

  results.sort((a, b) => a.pace - b.pace)
  const userIdx = results.findIndex(r => r.id === 'USER')
  const userRes = results[userIdx]

  if (userRes.dnf) return { position: 'DNF', points: 0, event, isWet }

  const pos = userIdx + 1
  const pts = pos <= 10 ? POINTS[pos - 1] : 0
  return { position: pos, points: pts, event, isWet, lapTime: userRes.pace }
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function getTeamColor(team: string): string {
  const key = team.toLowerCase()
  return TEAM_COLORS[key] || '#8a8a94'
}

function eventIcon(event: RaceEvent, isWet: boolean): string {
  if (isWet) return '🌧️'
  if (event === 'sc') return '🟡'
  if (event === 'vsc') return '🟠'
  if (event === 'red') return '🔴'
  return '☀️'
}

function positionBadgeStyle(pos: number | 'DNF'): { bg: string; color: string; text: string } {
  if (pos === 'DNF') return { bg: '#7f1d1d', color: '#fca5a5', text: 'DNF' }
  if (pos === 1) return { bg: '#78350f', color: '#fbbf24', text: 'P1' }
  if (pos === 2) return { bg: '#374151', color: '#d1d5db', text: 'P2' }
  if (pos === 3) return { bg: '#431407', color: '#fb923c', text: 'P3' }
  if (pos <= 10) return { bg: '#14532d', color: '#86efac', text: `P${pos}` }
  return { bg: '#18181b', color: '#71717a', text: `P${pos}` }
}

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function DriverSelect({ drivers, value, onChange, label }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-bold rounded-lg px-4 py-3 pr-10 cursor-pointer focus:outline-none focus:border-orange-500 transition-colors"
        >
          {drivers.map((d: any) => (
            <option key={d.name} value={d.name}>{d.name} (ELO {d.elo})</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      </div>
    </div>
  )
}

function CarSelect({ cars, value, onChange, label }: any) {
  const sorted = [...cars].sort((a, b) => a.baseTime - b.baseTime)
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none bg-zinc-900 border border-zinc-800 text-zinc-100 text-sm font-bold rounded-lg px-4 py-3 pr-10 cursor-pointer focus:outline-none focus:border-orange-500 transition-colors"
        >
          {sorted.map((c: any, i: number) => (
            <option key={c.team} value={c.team}>
              {i === 0 ? '★ ' : ''}{c.team} (+{((c.baseTime - REF_TIME)).toFixed(3)}s)
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
      </div>
    </div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function SimulatorPage() {
  const [eloDrivers, setEloDrivers] = useState<DriverElo[]>([])
  const [carPerfs, setCarPerfs] = useState<CarPerf[]>(DEFAULT_CAR_PERF)
  const [carDataSource, setCarDataSource] = useState<'live' | 'default'>('default')
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)

  const [driver1Name, setDriver1Name] = useState('')
  const [driver2Name, setDriver2Name] = useState('')
  const [car1Team, setCar1Team] = useState('Mercedes')
  const [car2Team, setCar2Team] = useState('McLaren')

  const [results1, setResults1] = useState<RaceResult[]>([])
  const [results2, setResults2] = useState<RaceResult[]>([])
  const [simRan, setSimRan] = useState(false)
  const [simKey, setSimKey] = useState(0)

  // Auto-exclude past races
  const now = new Date()
  const futureRaces = FULL_CALENDAR.filter(r => new Date(r.date) > now)
  const pastRaces = FULL_CALENDAR.filter(r => new Date(r.date) <= now)

  useEffect(() => {
    Papa.parse(SHEET_URL + '&cachebust=' + Date.now(), {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        if (rows.length > 0) {
          const firstRow = rows[0]
          const find = (row: Record<string, string>, ...names: string[]) => {
            for (const n of names) {
              const match = Object.keys(row).find(k => k.toLowerCase().trim() === n)
              if (match) return match
            }
            return null
          }
          const DRIVER_KEY = find(firstRow, 'driver') || ''
          const ELO_KEY = find(firstRow, 'elo') || ''
          const TEAM_KEY = find(firstRow, 'team') || ''

          const parsed: DriverElo[] = rows
            .filter(r => r[DRIVER_KEY]?.trim())
            .map(r => ({
              name: r[DRIVER_KEY].trim(),
              elo: parseInt(r[ELO_KEY]) || 1500,
              team: r[TEAM_KEY]?.trim() || 'Unknown',
            }))
            .sort((a, b) => b.elo - a.elo)

          setEloDrivers(parsed)
          if (parsed.length > 0) setDriver1Name(parsed[0].name)
          if (parsed.length > 2) setDriver2Name(parsed[2].name)
        }
        setLoading(false)
      },
      error: () => setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetch(CONSTRUCTORS_URL)
      .then(r => r.json())
      .then(data => {
        const standings = data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings
        if (!standings || standings.length === 0) return

        const teamMapping: Record<string, string> = {
          'mercedes': 'Mercedes', 'ferrari': 'Ferrari', 'mclaren': 'McLaren',
          'red_bull': 'Red Bull', 'alpine': 'Alpine', 'haas': 'Haas',
          'alfa': 'Audi', 'alphatauri': 'Racing Bulls', 'williams': 'Williams',
          'aston_martin': 'Aston Martin', 'sauber': 'Audi',
        }

        const updatedCars: CarPerf[] = [...DEFAULT_CAR_PERF]
        standings.forEach((s: any, idx: number) => {
          const mappedTeam = teamMapping[s.Constructor.constructorId]
          if (!mappedTeam) return
          const carIdx = updatedCars.findIndex(c => c.team === mappedTeam)
          if (carIdx === -1) return
          updatedCars[carIdx].baseTime = REF_TIME + idx * 0.18
        })

        setCarPerfs(updatedCars)
        setCarDataSource('live')
      })
      .catch(() => {})
  }, [])

  const runSimulation = useCallback(() => {
    if (!driver1Name || !driver2Name) return
    setSimulating(true)
    setSimRan(false)

    setTimeout(() => {
      const d1 = eloDrivers.find(d => d.name === driver1Name)
      const d2 = eloDrivers.find(d => d.name === driver2Name)
      const c1 = carPerfs.find(c => c.team === car1Team) || carPerfs[0]
      const c2 = carPerfs.find(c => c.team === car2Team) || carPerfs[0]

      if (!d1 || !d2) { setSimulating(false); return }

      const aiGrid: RaceEntry[] = AI_GRID
        .filter(a => a.name !== driver1Name.split(' ').pop() && a.name !== driver2Name.split(' ').pop())
        .slice(0, 18)
        .map(a => {
          const teamCar = carPerfs.find(c => c.team === a.team) || carPerfs[carPerfs.length - 1]
          return {
            id: a.name,
            baseTime: teamCar.baseTime,
            elo: a.elo,
            reliability: teamCar.reliability,
            trait: teamCar.trait
          }
        })

      const r1: RaceResult[] = []
      const r2: RaceResult[] = []

      futureRaces.forEach(track => {
        const sim1 = simulateRace(
          { id: 'USER', baseTime: c1.baseTime, elo: d1.elo, reliability: c1.reliability, trait: c1.trait },
          aiGrid,
          track
        )
        r1.push({ raceName: track.name, ...sim1 })

        const sim2 = simulateRace(
          { id: 'USER', baseTime: c2.baseTime, elo: d2.elo, reliability: c2.reliability, trait: c2.trait },
          aiGrid,
          track
        )
        r2.push({ raceName: track.name, ...sim2 })
      })

      setResults1(r1)
      setResults2(r2)
      setSimRan(true)
      setSimulating(false)
      setSimKey(k => k + 1)
    }, 800)
  }, [driver1Name, driver2Name, car1Team, car2Team, eloDrivers, carPerfs, futureRaces])

  const pts1 = results1.reduce((s, r) => s + r.points, 0)
  const pts2 = results2.reduce((s, r) => s + r.points, 0)
  const wins1 = results1.filter(r => r.position === 1).length
  const wins2 = results2.filter(r => r.position === 1).length
  const dnf1 = results1.filter(r => r.position === 'DNF').length
  const dnf2 = results2.filter(r => r.position === 'DNF').length
  const podiums1 = results1.filter(r => typeof r.position === 'number' && r.position <= 3).length
  const podiums2 = results2.filter(r => typeof r.position === 'number' && r.position <= 3).length

  const d1Color = getTeamColor(car1Team)
  const d2Color = getTeamColor(car2Team)
  const d1Obj = eloDrivers.find(d => d.name === driver1Name)
  const d2Obj = eloDrivers.find(d => d.name === driver2Name)

  function getOutcome(pts: number, wins: number): string {
    if (wins >= 8) return '🏆 World Champion'
    if (wins >= 4) return '🥇 Title Contender'
    if (pts >= 200) return '🏅 Podium Regular'
    if (pts >= 100) return '📈 Points Finisher'
    return '📉 Midfield'
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans pb-32 selection:bg-orange-500/30">
      <section className="border-b border-zinc-800 bg-[#080808]">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Cpu size={16} className="text-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-orange-500">Season Simulator v2</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                What If <span className="text-orange-500">Machine</span>
              </h1>
              <p className="text-zinc-500 text-sm mt-3 max-w-lg">
                Remaining {futureRaces.length} races simulated using your ELO ratings + live constructor standings. {pastRaces.length} races already excluded.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {carDataSource === 'live' ? (
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-green-950 text-green-400 border border-green-800 px-3 py-1.5 rounded-full">
                  <Activity size={10} className="animate-pulse" /> Live Car Data
                </span>
              ) : (
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-500 border border-zinc-800 px-3 py-1.5 rounded-full">
                  <Shield size={10} /> Pre-Season Defaults
                </span>
              )}
              <span className="text-[10px] font-mono text-zinc-600 bg-zinc-900 px-3 py-1.5 rounded-full border border-zinc-800">
                {futureRaces.length} races remaining
              </span>
            </div>
          </div>
        </div>
      </section>

      {pastRaces.length > 0 && (
        <section className="border-b border-zinc-800/50 bg-[#060606] overflow-hidden">
          <div className="container mx-auto px-6 py-3">
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600 whitespace-nowrap flex-shrink-0">Completed:</span>
              {pastRaces.map(r => (
                <span key={r.code} className="text-[10px] font-bold text-zinc-700 whitespace-nowrap flex-shrink-0 line-through decoration-zinc-800">
                  {r.code}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div className="container mx-auto px-6 py-32 text-center">
          <p className="font-mono text-xs uppercase italic text-zinc-600 tracking-widest animate-pulse">Loading ELO data...</p>
        </div>
      ) : (
        <>
          <section className="container mx-auto px-6 mt-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-6" style={{ borderTop: `3px solid ${d1Color}` }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d1Color }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Challenger One</span>
                </div>
                <div className="space-y-4">
                  <DriverSelect drivers={eloDrivers} value={driver1Name} onChange={setDriver1Name} label="Driver" />
                  <CarSelect cars={carPerfs} value={car1Team} onChange={setCar1Team} label="Constructor" />
                </div>
                {d1Obj && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">ELO Rating</p>
                      <p className="font-black italic text-2xl" style={{ color: d1Color }}>{d1Obj.elo.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Car Gap</p>
                      <p className="font-black italic text-2xl text-zinc-300">
                        +{((carPerfs.find(c => c.team === car1Team)?.baseTime ?? REF_TIME) - REF_TIME).toFixed(3)}s
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-6" style={{ borderTop: `3px solid ${d2Color}` }}>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d2Color }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Challenger Two</span>
                </div>
                <div className="space-y-4">
                  <DriverSelect drivers={eloDrivers} value={driver2Name} onChange={setDriver2Name} label="Driver" />
                  <CarSelect cars={carPerfs} value={car2Team} onChange={setCar2Team} label="Constructor" />
                </div>
                {d2Obj && (
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">ELO Rating</p>
                      <p className="font-black italic text-2xl" style={{ color: d2Color }}>{d2Obj.elo.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-bold">Car Gap</p>
                      <p className="font-black italic text-2xl text-zinc-300">
                        +{((carPerfs.find(c => c.team === car2Team)?.baseTime ?? REF_TIME) - REF_TIME).toFixed(3)}s
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-4 items-center justify-center">
              <button
                onClick={runSimulation}
                disabled={simulating || !driver1Name || !driver2Name}
                className="group flex items-center gap-3 bg-orange-600 hover:bg-orange-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-black italic uppercase text-sm px-10 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(234,88,12,0.3)] hover:shadow-[0_0_40px_rgba(234,88,12,0.5)]"
              >
                {simulating ? (
                  <><Activity size={18} className="animate-pulse" /> Simulating Season...</>
                ) : (
                  <><Play size={18} /> Run Full Season Simulation</>
                )}
              </button>
              {simRan && (
                <button
                  onClick={runSimulation}
                  className="flex items-center gap-2 text-zinc-400 hover:text-white text-xs font-bold uppercase tracking-widest border border-zinc-800 hover:border-zinc-600 px-6 py-4 rounded-xl transition-all"
                >
                  <RotateCcw size={14} /> Re-run
                </button>
              )}
            </div>
          </section>

          {simRan && (
            <section className="container mx-auto px-6 mt-16" key={simKey}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {[
                  { name: driver1Name, pts: pts1, wins: wins1, podiums: podiums1, dnf: dnf1, color: d1Color, results: results1 },
                  { name: driver2Name, pts: pts2, wins: wins2, podiums: podiums2, dnf: dnf2, color: d2Color, results: results2 },
                ].map((d, i) => (
                  <div key={i} className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl overflow-hidden" style={{ borderTop: `3px solid ${d.color}` }}>
                    <div className="p-6 border-b border-zinc-800">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mb-1">Season Projection</p>
                          <p className="text-2xl font-black italic uppercase">{d.name.split(' ').pop()}</p>
                          <p className="text-xs text-zinc-500">{d.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-5xl font-black italic" style={{ color: d.color }}>{d.pts}</p>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">pts</p>
                        </div>
                      </div>

                      <div className="mt-6 grid grid-cols-4 gap-3">
                        {[
                          { label: 'Wins', val: d.wins, icon: <Trophy size={12} /> },
                          { label: 'Podiums', val: d.podiums, icon: <TrendingUp size={12} /> },
                          { label: 'DNFs', val: d.dnf, icon: <AlertTriangle size={12} /> },
                          { label: 'Races', val: futureRaces.length, icon: <Flag size={12} /> },
                        ].map(stat => (
                          <div key={stat.label} className="bg-zinc-900/60 rounded-lg p-3 text-center border border-zinc-800/50">
                            <div className="flex justify-center mb-1 text-zinc-500">{stat.icon}</div>
                            <p className="text-xl font-black">{stat.val}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-600">{stat.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 bg-zinc-900/40 rounded-lg p-3 text-center border border-zinc-800/30">
                        <p className="text-sm font-black">{getOutcome(d.pts, d.wins)}</p>
                      </div>
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {d.results.map((r, idx) => {
                        const badge = positionBadgeStyle(r.position)
                        const icon = eventIcon(r.event, r.isWet)
                        return (
                          <div key={idx} className="flex items-center justify-between px-5 py-2.5 border-b border-zinc-900/80 hover:bg-zinc-900/30 transition-colors">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <span className="text-sm">{icon}</span>
                              <span className="text-xs font-bold text-zinc-300 truncate">{r.raceName}</span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0">
                              <span
                                className="text-[10px] font-black px-2 py-0.5 rounded"
                                style={{ background: badge.bg, color: badge.color }}
                              >
                                {badge.text}
                              </span>
                              <span className="text-[11px] font-mono font-bold text-zinc-500 w-8 text-right">
                                {r.points > 0 ? `+${r.points}` : '—'}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-500 mb-6 flex items-center gap-2">
                  <Zap size={14} className="text-orange-500" /> Head to Head
                </h3>

                {[
                  { label: 'Points', v1: pts1, v2: pts2 },
                  { label: 'Wins', v1: wins1, v2: wins2 },
                  { label: 'Podiums', v1: podiums1, v2: podiums2 },
                  { label: 'DNFs', v1: dnf1, v2: dnf2, lowerBetter: true },
                ].map(stat => {
                  const w1 = stat.lowerBetter ? (stat.v1 < stat.v2) : (stat.v1 > stat.v2)
                  const w2 = stat.lowerBetter ? (stat.v2 < stat.v1) : (stat.v2 > stat.v1)
                  return (
                    <div key={stat.label} className="mb-5">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-black italic text-sm" style={{ color: w1 ? d1Color : 'inherit' }}>{stat.v1}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{stat.label}</span>
                        <span className="font-black italic text-sm" style={{ color: w2 ? d2Color : 'inherit' }}>{stat.v2}</span>
                      </div>
                      <div className="flex h-1.5 rounded-full overflow-hidden bg-zinc-900 gap-0.5">
                        <div
                          className="h-full rounded-l-full transition-all duration-500"
                          style={{ width: `${(stat.v1 / (stat.v1 + stat.v2 || 1)) * 100}%`, backgroundColor: d1Color }}
                        />
                        <div
                          className="h-full rounded-r-full transition-all duration-500"
                          style={{ width: `${(stat.v2 / (stat.v1 + stat.v2 || 1)) * 100}%`, backgroundColor: d2Color }}
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="mt-6 pt-6 border-t border-zinc-800 text-center">
                  {pts1 === pts2 ? (
                    <p className="text-lg font-black italic uppercase text-zinc-400">Dead Heat — Run Again</p>
                  ) : (
                    <>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-1">Projected Champion</p>
                      <p className="text-3xl font-black italic uppercase" style={{ color: pts1 > pts2 ? d1Color : d2Color }}>
                        {pts1 > pts2 ? driver1Name : driver2Name}
                      </p>
                      <p className="text-zinc-500 text-xs mt-1">by {Math.abs(pts1 - pts2)} points</p>
                    </>
                  )}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <section className="container mx-auto px-6 mt-12">
        <div className="bg-[#08080a] border border-zinc-900 rounded-xl p-4 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          <span>☀️ Dry</span>
          <span>🌧️ Wet (car gap −60%)</span>
          <span>🟡 Safety Car (field compress)</span>
          <span>🟠 VSC</span>
          <span>🔴 Red Flag</span>
          <span className="ml-auto">AI Grid: 20 drivers · ELO-weighted · Trait Matched</span>
        </div>
      </section>
    </div>
  )
}
