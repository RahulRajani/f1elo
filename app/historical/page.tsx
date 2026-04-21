'use client'
import { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from 'recharts'
import { HISTORICAL_DATA, HistoryPoint } from '@/app/lib/historicalData'

const COLORS = ['#e8001e','#00D2BE','#FF8000','#ffcc00','#a371f7','#34d058','#4fc3f7','#ff6b6b','#06d6a0']

const ALL_DRIVERS = Object.keys(HISTORICAL_DATA.final).map(id => ({
  id,
  name: id.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
})).sort((a, b) => a.name.localeCompare(b.name))

const DEFAULT_DRIVERS = ['hamilton', 'michael_schumacher', 'senna', 'alonso', 'vettel']

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const sorted = [...payload].sort((a, b) => b.value - a.value);
    return (
      <div style={{ background: '#16161d', border: '1px solid #2a2a35', borderRadius: 8, padding: '12px 16px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)', fontFamily: '"Titillium Web", sans-serif' }}>
        <p style={{ margin: '0 0 10px', color: '#8a8a94', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
          Career Race {label}
        </p>
        {sorted.map((entry, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginBottom: 6 }}>
            <span style={{ color: entry.color, fontWeight: 700, fontSize: 14 }}>
              {entry.name}
            </span>
            <span style={{ color: '#f0f0f5', fontWeight: 900, fontSize: 16, fontVariantNumeric: 'tabular-nums' }}>
              {Math.round(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function HistoricalPage() {
  const [selected, setSelected] = useState<string[]>(DEFAULT_DRIVERS)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() =>
    ALL_DRIVERS.filter(d => d.name.toLowerCase().includes(search.toLowerCase())),
    [search]
  )

  // Transform data for chart
const chartData = useMemo(() => {
  const data: any[] = [];
  let maxRaces = 0;
  const history = HISTORICAL_DATA.history as Record<string, HistoryPoint[]>;

  console.log('🔍 Building chart:');
  console.log('Selected:', selected);
  console.log('History keys:', Object.keys(history).slice(0, 5)); // first 5 drivers

  selected.forEach(id => {
    const driverHistory = history[id];
    console.log(`${id}:`, driverHistory?.length, 'races');
    if (driverHistory?.length) {
      maxRaces = Math.max(maxRaces, driverHistory.length);
    }
  });

  console.log('Max races:', maxRaces);

  for (let i = 0; i < maxRaces; i++) {
    const point: Record<string, any> = { race: i + 1 };
    selected.forEach(id => {
      const driverHistory = history[id];
      if (driverHistory?.[i]) {
        point[id] = driverHistory[i].elo;
      }
    });
    data.push(point);
  }
  
  console.log('Final chartData:', data.slice(0, 3)); // first 3 points
  return data;
}, [selected])

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id].slice(-9)
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', fontFamily: '"Titillium Web", sans-serif', color: '#f0f0f5' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        
        <header style={{ marginBottom: 32 }}>
          <h1 style={{ margin: '0 0 4px', fontSize: 42, fontWeight: 900, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -1.5 }}>
            Historical <span style={{ color: '#e8001e' }}>ELO</span>
          </h1>
          <p style={{ margin: '0', fontSize: 13, color: '#71717a', textTransform: 'uppercase', letterSpacing: 2, fontWeight: 600 }}>
            1950–2024 · 611 Drivers · Cross-Era Comparison
          </p>
        </header>

        <div style={{ background: '#121217', borderRadius: 12, padding: '32px 24px 24px', marginBottom: 32, border: '1px solid #27272a', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
          <ResponsiveContainer width="100%" height={450}>
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
              <XAxis dataKey="race" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} tickLine={false} axisLine={false} minTickGap={30} />
              <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 12, fontWeight: 600 }} domain={['auto', 'auto']} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#3f3f46', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <Legend wrapperStyle={{ paddingTop: 20, fontSize: 13, fontWeight: 600 }} iconType="circle" />
              {selected.map((id, i) => (
                <Line key={id} type="monotone" dataKey={id} name={ALL_DRIVERS.find(d => d.id === id)?.name || id} stroke={COLORS[i % COLORS.length]} strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: COLORS[i % COLORS.length] }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 24 }}>
          {selected.map((id, i) => (
            <div key={id} onClick={() => toggle(id)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 24, background: COLORS[i % COLORS.length] + '1A', border: `1px solid ${COLORS[i % COLORS.length]}40`, color: COLORS[i % COLORS.length], fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease' }}>
              {ALL_DRIVERS.find(d => d.id === id)?.name || id}
              <span style={{ fontSize: 16, lineHeight: 1 }}>×</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#121217', padding: 24, borderRadius: 12, border: '1px solid #27272a' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search 611 historical drivers..." style={{ width: '100%', padding: '14px 18px', marginBottom: 20, background: '#09090b', border: '1px solid #27272a', borderRadius: 8, color: '#f0f0f5', fontSize: 15, fontFamily: '"Titillium Web", sans-serif', fontWeight: 600, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s ease' }} onFocus={(e) => e.currentTarget.style.borderColor = '#e8001e'} onBlur={(e) => e.currentTarget.style.borderColor = '#27272a'} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 8, maxHeight: 300, overflowY: 'auto', paddingRight: 8 }}>
            {filtered.map(d => {
              const isSelected = selected.includes(d.id)
              const colorIdx = selected.indexOf(d.id)
              return (
                <div key={d.id} onClick={() => toggle(d.id)} style={{ padding: '10px 14px', borderRadius: 8, cursor: 'pointer', background: isSelected ? (COLORS[colorIdx % COLORS.length] + '1A') : '#09090b', border: `1px solid ${isSelected ? COLORS[colorIdx % COLORS.length] + '40' : '#27272a'}`, color: isSelected ? COLORS[colorIdx % COLORS.length] : '#a1a1aa', fontSize: 14, fontWeight: isSelected ? 700 : 500, transition: 'all 0.15s ease', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {d.name}
                </div>
              )
            })}
          </div>
        </div>
        
      </div>
    </div>
  )
}