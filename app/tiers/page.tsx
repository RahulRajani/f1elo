'use client'
import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import Nav from '@/components/Nav'

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"

const TEAM_COLORS: Record<string, string> = {
  'mercedes': '#00D2BE', 'ferrari': '#E80020', 'red bull': '#061D42',
  'mclaren': '#FF8000', 'aston martin': '#006F62', 'alpine': '#0090FF',
  'williams': '#005AFF', 'racing bulls': '#1634CC', 'vcarb': '#1634CC',
  'sauber': '#52E252', 'haas': '#B6BABD', 'cadillac': '#C8A951',
}

const TIERS = [
  { label: 'S', desc: 'Benchmark', min: 1820, color: '#ff3b3b', textColor: '#fff' },
  { label: 'A', desc: 'Elite',     min: 1750, color: '#ff9500', textColor: '#000' },
  { label: 'B', desc: 'Upper Mid', min: 1700, color: '#ffcc00', textColor: '#000' },
  { label: 'C', desc: 'Midfield',  min: 1650, color: '#34c759', textColor: '#000' },
  { label: 'D', desc: 'Lower Mid', min: 1600, color: '#007aff', textColor: '#fff' },
  { label: 'E', desc: 'Backmarker',min: 0,    color: '#af52de', textColor: '#fff' },
]

interface Driver { rank: number; driver: string; team: string; elo: number; avg: number }

export default function TiersPage() {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Papa.parse(SHEET_URL + '&cachebust=' + Date.now(), {
      download: true, header: true, skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        const find = (...names: string[]) => Object.keys(rows[0]).find(k => names.includes(k.toLowerCase().trim())) || ''
        const TEAM = find('team'); const DRIVER = find('driver')
        const ELO = find('elo'); const AVG = find('season average', 'avg')

        const parsed = rows.filter(r => r[DRIVER]?.trim()).map((r, i) => ({
          rank: i + 1, driver: r[DRIVER].trim(),
          team: (r[TEAM] || 'Unemployed').trim(),
          elo: parseInt(r[ELO]) || 1500,
          avg: parseFloat(r[AVG]) || 0,
        })).sort((a, b) => b.elo - a.elo).map((d, i) => ({ ...d, rank: i + 1 }))

        setDrivers(parsed); setLoading(false)
      }
    })
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d10', fontFamily: '"Titillium Web", sans-serif', color: '#f0f0f5' }}>
      <Nav />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 36, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1 }}>
          2026 Driver <span style={{ color: '#e8001e' }}>Tier</span> List
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 12, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 2 }}>
          Based on ELO rating · Season so far
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#5a5a6a' }}>Loading...</div>
        ) : TIERS.map(tier => {
          const inTier = drivers.filter(d =>
            d.elo >= tier.min && (TIERS[TIERS.indexOf(tier) - 1] ? d.elo < TIERS[TIERS.indexOf(tier) - 1].min : true)
          )
          if (inTier.length === 0) return null
          return (
            <div key={tier.label} style={{ display: 'flex', marginBottom: 12, borderRadius: 8, overflow: 'hidden', minHeight: 90 }}>
              {/* Tier label */}
              <div style={{
                width: 100, flexShrink: 0, background: tier.color,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 48, fontWeight: 900, fontStyle: 'italic', lineHeight: 1, color: tier.textColor }}>{tier.label}</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: tier.textColor, opacity: 0.8 }}>{tier.desc}</span>
              </div>

              {/* Driver cards */}
              <div style={{ flex: 1, background: '#16161d', padding: 12, display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
                {inTier.map(d => {
                  const parts = d.driver.trim().split(' '); const last = parts.pop(); const first = parts.join(' ')
                  const tc = TEAM_COLORS[d.team.toLowerCase()] || '#999'
                  return (
                    <div key={d.driver} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      background: '#1e1e28', border: '1px solid #2a2a35',
                      borderRadius: 6, padding: '8px 14px', width: 220,
                    }}>
                      <div style={{ width: 4, height: 36, background: tc, borderRadius: 2, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, lineHeight: 1.1 }}>
                          <span style={{ fontWeight: 400, color: '#8a8a94', marginRight: 3 }}>{first}</span>
                          <span style={{ fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase' }}>{last}</span>
                        </div>
                        <div style={{ fontSize: 9, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{d.team}</div>
                      </div>
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 900, fontStyle: 'italic' }}>{d.elo.toLocaleString()}</div>
                        <div style={{ fontSize: 9, color: '#5a5a6a', textTransform: 'uppercase' }}>ELO</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}