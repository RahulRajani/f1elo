'use client'

import React from 'react'
import Link from 'next/link'
import { 
  Cpu, 
  ChevronRight, 
  Activity, 
  Calculator, 
  AlertTriangle, 
  Users, 
  Mail,
  Crosshair,
  TrendingUp,
  Zap,
  ArrowRight,
  Database
} from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans pb-20 selection:bg-orange-500/30">
      
      {/* --- HEADER --- */}
      <section className="relative w-full border-b border-zinc-800 bg-[#0a0a0c] pt-24 pb-16">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-20"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="flex items-center gap-2 text-orange-500 mb-4">
            <Cpu size={18} className="animate-pulse" />
            <span className="text-xs font-black uppercase tracking-[0.4em]">System Docs // v2.0</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-[0.85] mb-6">
            The <span className="text-orange-500 drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">Algorithm</span>
          </h1>
          
          <p className="max-w-2xl text-zinc-400 text-lg leading-relaxed border-l-2 border-zinc-800 pl-4">
            First things first... This isn't that other Elo model. You might have seen "How I calculated an ELO rating for every F1 driver ever" on YouTube or Matthew Perron's work. Those are great. They are arguably more "statistically rigorous" using strict head-to-head teammate comparisons. 
            <br/><br/>
            <strong className="text-zinc-200">Our model does not do that.</strong> We adopt a different, slightly more abstract set of weighted performance factors. Different tools for different jobs!
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* --- LEFT COLUMN: CALCULATION & LIMITATIONS --- */}
        <div className="lg:col-span-7 space-y-16">
          
          {/* Calculation Engine */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Calculator className="text-orange-500" size={24} />
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Computation Engine</h2>
            </div>
            
            <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <p className="text-sm text-zinc-400 mb-8">
                It's an iterative process. We update it after every Grand Prix. The core concept is the <strong className="text-white">Race Performance Score</strong>.
              </p>
              
              <div className="space-y-4 relative">
                <div className="absolute left-[15px] top-4 bottom-4 w-px bg-zinc-800 group-hover:bg-orange-500/20 transition-colors"></div>
                
                {[
                  "Take an arbitrary race rating (e.g. 8.6)",
                  "Scale it by a multiplier (100)",
                  "Add a baseline (1000)",
                  "Compare against the pre-race Elo",
                  "Multiply the difference by a Weighting Factor (K)",
                  "Add that to the old Elo"
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-6 relative z-10">
                    <div className="w-8 h-8 rounded-full bg-[#0c0c0f] border border-zinc-700 flex items-center justify-center text-xs font-black text-orange-500 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                      {idx + 1}
                    </div>
                    <div className="flex-1 bg-[#111116] border border-zinc-800/50 rounded-lg p-3 text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Implied Ratings */}
          <section>
            <div className="flex items-center gap-3 mb-8">
              <Crosshair className="text-orange-500" size={24} />
              <h2 className="text-2xl font-black italic uppercase tracking-tighter">Implied Ratings Translation</h2>
            </div>
            
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              Abstract Elo numbers are hard to visualize. What does 1721 actually mean? Let's map it to something familiar... like the F1 25 game ratings (1-100). We assume a linear correlation between our Elo and the game's rating using a two-point linear interpolation ($y = mx + c$).
            </p>

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {/* Upper Anchor */}
              <div className="bg-[#0a0a0c] border border-zinc-800 rounded-xl p-5 border-t-2 border-t-orange-500">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Upper Anchor (2025 Grid)</p>
                <h3 className="text-xl font-black italic uppercase mb-1">Max Verstappen</h3>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">System Elo</p>
                    <p className="text-2xl font-mono font-bold text-zinc-100">1890</p>
                  </div>
                  <ArrowRight className="text-zinc-700" />
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase">F1 25 Game</p>
                    <p className="text-2xl font-mono font-black text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]">95</p>
                  </div>
                </div>
              </div>

              {/* Lower Anchor */}
              <div className="bg-[#0a0a0c] border border-zinc-800 rounded-xl p-5 border-t-2 border-t-zinc-600">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Lower Anchor (2025 Grid)</p>
                <h3 className="text-xl font-black italic uppercase mb-1 text-zinc-300">Lance Stroll</h3>
                <div className="flex justify-between items-end mt-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase">System Elo</p>
                    <p className="text-2xl font-mono font-bold text-zinc-400">1460</p>
                  </div>
                  <ArrowRight className="text-zinc-700" />
                  <div className="text-right">
                    <p className="text-[10px] text-zinc-500 uppercase">F1 25 Game</p>
                    <p className="text-2xl font-mono font-black text-zinc-300">78</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formula output */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 font-mono text-xs text-center text-zinc-300 flex items-center justify-center gap-4">
              <Database size={14} className="text-orange-500" />
              <span>Derived Function: <strong className="text-orange-400">f(x) ≈ 0.03953x + 20.279</strong></span>
            </div>
          </section>

        </div>

        {/* --- RIGHT COLUMN: TELEMETRY EXAMPLE & METADATA --- */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Telemetry Example Card */}
          <div className="bg-[#08080a] border border-zinc-800 rounded-2xl p-6 shadow-2xl relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="flex items-center gap-2 text-orange-500 mb-6">
              <Activity size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Telemetry Simulation</span>
            </div>
            
            <h3 className="text-xl font-black italic uppercase mb-6 pb-4 border-b border-zinc-800">
              Case Study: <span className="text-white">Gasly (Bahrain)</span>
            </h3>

            <div className="space-y-5 font-mono text-sm">
              <div className="flex justify-between items-center text-zinc-400">
                <span>Base Rating</span>
                <span className="text-white font-bold">8.6</span>
              </div>
              
              <div className="flex justify-between items-center text-zinc-400">
                <span>Perf. Score <span className="text-[10px] text-zinc-600 ml-1">1000+(8.6*100)</span></span>
                <span className="text-orange-400 font-bold">1860</span>
              </div>

              <div className="h-px bg-zinc-800/50 w-full my-2"></div>

              <div className="flex justify-between items-center text-zinc-400">
                <span>Pre-Race ELO</span>
                <span className="text-white">1714</span>
              </div>

              <div className="flex justify-between items-center text-zinc-400">
                <span>ELO Delta <span className="text-[10px] text-zinc-600 ml-1">(1860-1714)</span></span>
                <span className="text-white">146</span>
              </div>

              <div className="flex justify-between items-center text-zinc-400">
                <span>Weighting <span className="text-[10px] text-zinc-600 ml-1">(146 * 0.05)</span></span>
                <span className="text-green-500 flex items-center gap-1"><TrendingUp size={12}/> +7</span>
              </div>

              <div className="h-px bg-zinc-800/50 w-full my-2"></div>

              <div className="flex justify-between items-center bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                <span className="font-sans font-black italic uppercase text-zinc-300">Final ELO</span>
                <span className="text-xl font-black text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">1721</span>
              </div>
            </div>
          </div>

          {/* Limitations Warning */}
          <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-red-500 mb-3">
              <AlertTriangle size={16} />
              <span className="text-xs font-black uppercase tracking-widest">Model Limitations</span>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              It is imperative to note that this is an estimation. It is not a precise reflection of the official F1 25 game logic. Assuming a perfect linear relationship based on two data points is a massive simplification. Treat the "Implied Rating" as an illustrative abstraction. It's a point of correlation, not a definitive prediction. <strong className="text-red-400 italic">But it works for us ;-)</strong>
            </p>
          </div>

          {/* Credits & Contact */}
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-center gap-2 text-zinc-500 mb-4">
              <Users size={16} />
              <span className="text-[10px] font-black uppercase tracking-widest">Development Team</span>
            </div>
            
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Free Formula 1 driver ratings and Elo statistics. Visualising F1 driver performance, teammate comparisons, and historical rankings. All inquiries regarding the ELO model, the specific dataset employed, or the calculation methodology are welcome.
            </p>

            <div className="flex flex-wrap gap-2 mb-6">
              {['Rahul Rajani', 'Shlok Patel', 'Harrison Lee', 'Fred'].map(name => (
                <span key={name} className="px-3 py-1 bg-[#111116] border border-zinc-800 rounded-md text-[10px] font-bold uppercase tracking-wider text-zinc-300">
                  {name}
                </span>
              ))}
            </div>

            <a 
              href="mailto:RahulRajani2006@gmail.com" 
              className="w-full group flex items-center justify-between bg-zinc-100 text-black px-4 py-3 rounded-lg hover:bg-orange-500 hover:text-white transition-all transform active:scale-[0.98]"
            >
              <div className="flex items-center gap-2 font-black italic uppercase text-xs">
                <Mail size={14} /> Contact Admin
              </div>
              <ChevronRight size={16} className="opacity-50 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>

        </div>
      </div>
      
    </div>
  )
}