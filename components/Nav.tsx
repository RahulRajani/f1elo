'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
// Use 'Show' instead of the deprecated SignedIn/SignedOut
import { SignInButton, Show, UserButton } from '@clerk/nextjs'

const links = [
  { href: '/', label: 'Live 2026' },
  { href: '/tiers', label: 'Drivers' },
  { href: '/historical', label: 'Historical ELO' },
  { href: '/effone-season-sim', label: '2026 Season Simulator'},
  { href: '/market', label: 'Stock Market' },
  { href: '/about', label: 'About' }
]

export default function Nav() {
  const path = usePathname()
  
  return (
    <nav className="fixed top-0 left-0 w-full z-[999] bg-[#050505]/95 backdrop-blur-md border-b border-zinc-800 h-16 shadow-2xl font-sans">
      <div className="container mx-auto px-6 flex items-center justify-between h-full">
        
        <div className="flex items-center h-full flex-1 overflow-hidden">
          {/* Main Logo */}
          <Link 
            href="/" 
            className="text-2xl flex-shrink-0 font-black italic uppercase tracking-tighter text-white mr-8 hover:opacity-80 transition-opacity flex items-center"
          >
            F1 <span className="text-[#e8001e] ml-1 drop-shadow-[0_0_12px_rgba(232,0,30,0.6)]">ELO</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex h-full items-center gap-4 md:gap-8 overflow-x-auto no-scrollbar">
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

        {/* CLERK AUTHENTICATION UI - UPDATED FOR V6 */}
        <div className="flex items-center gap-4 ml-4 flex-shrink-0">
          
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="bg-[#e8001e] hover:bg-[#ff1a38] text-white text-[10px] md:text-xs font-black italic uppercase px-4 py-2 rounded-lg transition-all shadow-[0_0_15px_rgba(232,0,30,0.3)] hover:shadow-[0_0_20px_rgba(232,0,30,0.5)] active:scale-95">
                Sign In
              </button>
            </SignInButton>
          </Show>
          
          <Show when="signed-in">
            {/* Renders their Google profile picture with a custom styled border */}
            <UserButton appearance={{ elements: { avatarBox: "w-8 h-8 border border-zinc-700 hover:border-[#e8001e] transition-colors shadow-lg" } }} />
          </Show>

        </div>
        
      </div>
    </nav>
  )
}