'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Live 2026' },
  { href: '/tiers', label: 'Tier List' },
  { href: '/historical', label: 'Historical' },
  { href: '/effone-season-sim', label: '2026 Season Simulator'}
]

export default function Nav() {
  const path = usePathname()
  return (
    <nav style={{
      background: '#000', borderBottom: '3px solid #e8001e',
      padding: '0 24px', display: 'flex', alignItems: 'center',
      gap: 0, height: 56, position: 'sticky', top: 0, zIndex: 100,
      fontFamily: '"Titillium Web", sans-serif',
    }}>
      <Link href="/" style={{ fontSize: 20, fontWeight: 900, fontStyle: 'italic', color: 'white', textDecoration: 'none', marginRight: 32 }}>
        F1 <span style={{ color: '#e8001e' }}>ELO</span>
      </Link>
      {links.map(l => (
        <Link key={l.href} href={l.href} style={{
          padding: '0 20px', height: 56, display: 'flex', alignItems: 'center',
          fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
          textDecoration: 'none', color: path === l.href ? 'white' : '#5a5a6a',
          borderBottom: path === l.href ? '3px solid #e8001e' : '3px solid transparent',
          marginBottom: -3, transition: 'color 0.2s',
        }}>{l.label}</Link>
      ))}
    </nav>
  )
}