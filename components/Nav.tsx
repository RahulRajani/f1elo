'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Live 2026' },
  { href: '/tiers', label: 'Tier List' },
  { href: '/historical', label: 'Historical' },
  { href: '/effone-season-sim', label: '2026 Season Simulator'},
  { href: '/about', label: 'About' }
]

export default function Nav() {
  const path = usePathname()
  
  return (
    <nav className="fixed top-0 left-0 w-full z-[999] bg-[#050505]/95 backdrop-blur-md border-b border-zinc-800 h-16 shadow-2xl">
      <div className="container mx-auto px-6 flex items-center h-full">
        
        {/* Main Logo */}
        <Link 
          href="/" 
          className="text-2xl flex-shrink-0 font-black italic uppercase tracking-tighter text-white mr-8 hover:opacity-80 transition-opacity flex items-center"
        >
          F1 <span className="text-[#e8001e] ml-1 drop-shadow-[0_0_12px_rgba(232,0,30,0.6)]">ELO</span>
        </Link>

        {/* Navigation Links - Overflow completely removed, standard flex gap used */}
        <div className="flex h-full items-center gap-4 md:gap-8 flex-1">
          {links.map(l => {
            const isActive = path === l.href
            return (
              <Link 
                key={l.href} 
                href={l.href} 
                className={`relative h-full flex items-center text-[11px] md:text-xs font-black uppercase tracking-widest transition-colors duration-300 whitespace-nowrap ${
                  isActive 
                    ? 'text-white' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {l.label}
                
                {/* Active Underline Glow */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-[3px] bg-[#e8001e] shadow-[0_-3px_12px_rgba(232,0,30,0.6)] rounded-t-sm"></span>
                )}
              </Link>
            )
          })}
        </div>
        
      </div>
    </nav>
  )
}