'use client'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import Nav from '@/components/Nav'
import { HISTORICAL_DATA, HistoryPoint } from '@/app/lib/historicalData';

const COLORS = ['#e8001e','#00D2BE','#FF8000','#ffcc00','#a371f7','#34d058','#4fc3f7','#ff6b6b','#06d6a0']

const ALL_DRIVERS = Object.keys(HISTORICAL_DATA.final).map(id => ({
  id,
  name: id.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
})).sort((a, b) => a.name.localeCompare(b.name))

const DEFAULT_DRIVERS = ['hamilton', 'michael_schumacher', 'senna', 'alonso', 'vettel']

export default function HistoricalPage() {
  const [selected, setSelected] = useState<string[]>(DEFAULT_DRIVERS)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    ALL_DRIVERS.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  )
const chartData = useMemo(() => {
  // Define seasonMap to allow dynamic string keys (driver IDs)
  const seasonMap: Record<number, Record<string, any>> = {};

  selected.forEach(id => {
    // Cast history to Record so we can use the 'id' string to index it
    const history = (HISTORICAL_DATA.history as Record<string, HistoryPoint[]>)[id] || [];

    history.forEach((point: HistoryPoint) => {
      if (!seasonMap[point.season]) {
        seasonMap[point.season] = { season: point.season };
      }
      // This now works because the inner record is Record<string, any>
      seasonMap[point.season][id] = point.elo;
    });
  });

  return Object.values(seasonMap).sort((a, b) => a.season - b.season);
}, [selected]);

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(-9)
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d10', fontFamily: '"Titillium Web", sans-serif', color: '#f0f0f5' }}>
      <Nav />
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 36, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1 }}>
          Historical <span style={{ color: '#e8001e' }}>ELO</span>
        </h1>
        <p style={{ margin: '0 0 32px', fontSize: 12, color: '#5a5a6a', textTransform: 'uppercase', letterSpacing: 2 }}>
          1950–2024 · 611 Drivers · Select up to 9 to compare
        </p>

        {/* Chart */}
        <div style={{ background: '#16161d', borderRadius: 8, padding: '24px 16px 16px', marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={chartData}>
              <XAxis dataKey="season" stroke="#3a3a4a" tick={{ fill: '#5a5a6a', fontSize: 11 }} />
              <YAxis stroke="#3a3a4a" tick={{ fill: '#5a5a6a', fontSize: 11 }} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{ background: '#1e1e28', border: '1px solid #2a2a35', borderRadius: 6, fontFamily: '"Titillium Web", sans-serif' }}
                labelStyle={{ color: '#f0f0f5', fontWeight: 700 }}
                itemStyle={{ color: '#b0b0ba' }}
              />
              <Legend wrapperStyle={{ fontSize: 12, fontFamily: '"Titillium Web", sans-serif' }} />
              {selected.map((id, i) => (
                <Line
                  key={id}
                  type="monotone"
                  dataKey={id}
                  name={ALL_DRIVERS.find(d => d.id === id)?.name || id}
                  stroke={COLORS[i % COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Selected chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
          {selected.map((id, i) => (
            <div key={id} onClick={() => toggle(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px', borderRadius: 20,
              background: COLORS[i % COLORS.length] + '22',
              border: `1px solid ${COLORS[i % COLORS.length]}55`,
              color: COLORS[i % COLORS.length], fontSize: 12, fontWeight: 700,
              cursor: 'pointer',
            }}>
              {ALL_DRIVERS.find(d => d.id === id)?.name || id}
              <span style={{ fontSize: 14 }}>×</span>
            </div>
          ))}
        </div>

        {/* Search + driver grid */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search driver..."
          style={{
            width: '100%', padding: '10px 14px', marginBottom: 16,
            background: '#16161d', border: '1px solid #2a2a35', borderRadius: 6,
            color: '#f0f0f5', fontSize: 14, fontFamily: '"Titillium Web", sans-serif',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6, maxHeight: 320, overflowY: 'auto' }}>
          {filtered.map(d => {
            const isSelected = selected.includes(d.id)
            const colorIdx = selected.indexOf(d.id)
            return (
              <div key={d.id} onClick={() => toggle(d.id)} style={{
                padding: '8px 12px', borderRadius: 6, cursor: 'pointer',
                background: isSelected ? (COLORS[colorIdx % COLORS.length] + '22') : '#16161d',
                border: `1px solid ${isSelected ? COLORS[colorIdx % COLORS.length] + '66' : '#2a2a35'}`,
                color: isSelected ? COLORS[colorIdx % COLORS.length] : '#8a8a94',
                fontSize: 13, fontWeight: isSelected ? 700 : 400,
                transition: 'all 0.15s',
              }}>
                {d.name}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}