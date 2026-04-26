'use client'

import React, { useState } from 'react';
import { 
  Activity, 
  Trophy,
  Flag,
  Zap,
  AlertTriangle,
  ChevronRight,
  Award
} from 'lucide-react';

interface Race {
  race: string;
  country: string;
  winner: string;
  summary: string;
  highlights: string[];
}

interface RacesRecord {
  [key: string]: Race;
}

export default function ArticlePage() {
  const [expandedYear, setExpandedYear] = useState<string | null>('2026');

  const races: RacesRecord = {
    '2026': {
      race: 'Japan',
      country: '🇯🇵',
      winner: 'Antonelli',
      summary: 'We are only 3 races into the 2026 season, and I have made my opinions very clear on these regulations in a previous article. However, I think there were positives from this race. There was a genuine battle for the lead between Piastri and Russell, and there was more action than the processions we had in the ground effect era.',
      highlights: ['Piastri vs Russell battle', 'Mercedes vulnerability', 'More overtaking action', 'Bearman crash drama']
    },
    '2025': {
      race: 'Brazil',
      country: '🇧🇷',
      winner: 'Norris',
      summary: 'Brazil had almost everything you wanted from a race. We had multiple strategies, lots of overtakes, different strategies, controversy and safety cars. While Norris did end up winning relatively comfortably, there was drama everywhere you looked.',
      highlights: ['Antonelli career-best', 'Verstappen pit lane recovery', 'Multi-car incident Turn 1', '3 car battle Piastri vs Russell']
    },
    '2024': {
      race: 'Silverstone',
      country: '🇬🇧',
      winner: 'Hamilton',
      summary: 'Silverstone very rarely fails to deliver. You cannot go wrong with a mixed conditions race. You also had various battles for the lead, with about 4 drivers at various points looking like the favourite to win.',
      highlights: ['Mixed conditions drama', 'Tyre strategy gambles', 'Multiple lead battles', 'Hamilton victory after drought']
    },
    '2023': {
      race: 'Las Vegas',
      country: '🇺🇸',
      winner: 'Leclerc',
      summary: 'Las Vegas in its first year was destined to be a good race because none of the drivers knew it. We had a mixed up grid, crashes in bizarre places, more overtakes than what felt like the entire 2025 season and an actual battle for the lead.',
      highlights: ['Leclerc vs Verstappen duel', 'Perez 11th to 2nd', 'Unpredictable racing', 'Last lap Leclerc overtake']
    },
    '2022': {
      race: 'Bahrain',
      country: '🇧🇭',
      winner: 'Leclerc',
      summary: 'The battle between Leclerc and Verstappen was some of the best racing in Formula 1 history. The constant planning and execution from both to try and keep hold of first place was outstanding.',
      highlights: ['Leclerc vs Verstappen epic', 'Magnussen P5 return', 'Zhou debut points', 'Peak ground effect potential']
    },
    '2021': {
      race: 'Brazil',
      country: '🇧🇷',
      winner: 'Verstappen',
      summary: 'This was the peak of the title battle between Hamilton and Verstappen. Hamilton fought back from 10th on the grid, making some great moves, with the highlight coming when he caught up to the top 3.',
      highlights: ['Hamilton 10th to battle', 'Perez strong defence', 'Hamilton vs Verstappen battle', 'Controversial but epic']
    },
    '2020': {
      race: 'Sakhir',
      country: '🇧🇭',
      winner: 'Perez',
      summary: 'In a year dominated by Mercedes, Sakhir was a glimpse of how good it could be if they were not really there. We had Perez\'s first ever F1 win after 190 races, driving from P18 to victory.',
      highlights: ['Russell Mercedes debut shock', 'Perez pit lane recovery', 'Multiple safety cars', 'Ocon first podium']
    }
  };

  const yearOrder = ['2026', '2025', '2024', '2023', '2022', '2021', '2020'];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-zinc-100 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
      
      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-xl border-b border-orange-500/20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="text-orange-500" size={24} />
            <span className="text-xl font-black italic tracking-tighter text-white">F1<span className="text-orange-500">ELO</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <a href="#" className="hover:text-orange-400 transition-colors">Dashboard</a>
            <a href="#" className="text-white border-b-2 border-orange-500 pb-1">Analysis</a>
            <a href="#" className="hover:text-orange-400 transition-colors">Archive</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-32 pb-24 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(251,146,60,0.15),rgba(51,65,85,0))]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="relative max-w-5xl mx-auto px-6 z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-mono font-bold mb-8 backdrop-blur-sm">
            <Trophy size={14} /> 
            <span>Hall of Fame Analysis</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-[0.95] mb-6 drop-shadow-2xl">
            The Best F1<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
              Races of My Life
            </span>
          </h1>
          
          <p className="text-lg text-zinc-300 max-w-2xl leading-relaxed mb-8 font-light">
            A journey through 22 years of Formula 1. From 2005 to 2026, I'm breaking down the greatest races I've witnessed, analyzed without bias, to showcase what makes this sport truly magical.
          </p>
          
          <div className="flex items-center gap-4 border-t border-zinc-700/50 pt-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 border border-orange-400/50 flex items-center justify-center">
              <Award className="text-white" size={20} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">@FullTimeMclarenFan</p>
              <p className="text-zinc-400 text-xs font-mono">Published • Spring Break Special</p>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto px-6 pb-32">
        
        {/* INTRO SECTION */}
        <section className="mb-20 p-8 rounded-2xl bg-gradient-to-br from-zinc-800/30 to-transparent border border-zinc-700/40 backdrop-blur-sm">
          <p className="text-lg text-zinc-300 leading-relaxed mb-6">
            As the F1 spring break comes to a temporary end next weekend, I think it's a good time to go through every year I've been alive (2005-2026) and run through what I believe are the best races from each year. While I don't have my biases towards Jenson Button as a driver and McLaren as a team, I will be objectively looking at what races were the most entertaining to watch as a neutral.
          </p>
          <p className="text-zinc-400 italic">Because no one really thinks races like Singapore 2024 are the peak of this sport's potential.</p>
        </section>

        {/* TIMELINE */}
        <div className="space-y-4 relative">
          {/* Vertical line */}
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-orange-500/50 via-orange-500/20 to-transparent" />
          
          {yearOrder.map((year, idx) => {
            const race = races[year];
            const isExpanded = expandedYear === year;
            
            return (
              <div key={year} className="relative">
                {/* Timeline dot */}
                <div className="absolute -left-[18px] top-8 w-9 h-9 bg-slate-900 border-2 border-orange-500 rounded-full flex items-center justify-center cursor-pointer hover:scale-110 transition-transform group"
                  onClick={() => setExpandedYear(isExpanded ? null : year)}>
                  <span className="text-xs font-black text-orange-400">{idx + 1}</span>
                  <div className="absolute inset-0 rounded-full bg-orange-500/20 group-hover:bg-orange-500/40 transition-all animate-pulse" />
                </div>

                {/* Race Card */}
                <div 
                  onClick={() => setExpandedYear(isExpanded ? null : year)}
                  className={`ml-8 cursor-pointer group transition-all duration-500 ${isExpanded ? 'scale-100' : 'hover:scale-105'}`}
                >
                  <div className={`rounded-2xl border transition-all duration-500 overflow-hidden ${
                    isExpanded 
                      ? 'bg-gradient-to-br from-orange-900/40 to-slate-900/40 border-orange-500/60 shadow-2xl shadow-orange-500/20' 
                      : 'bg-slate-800/40 border-zinc-700/40 hover:border-orange-500/40 hover:bg-slate-800/60'
                  }`}>
                    
                    {/* Header */}
                    <div className="p-6 border-b border-zinc-700/40 bg-gradient-to-r from-slate-800/50 to-transparent">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block text-4xl mb-3">{race.country}</span>
                          <div>
                            <h3 className="text-5xl font-black italic uppercase text-white mb-2">{year}</h3>
                            <p className="text-2xl font-bold text-orange-400">{race.race} Grand Prix</p>
                            <p className="text-xs text-zinc-400 mt-2 font-mono">Winner: <span className="text-white font-bold">{race.winner}</span></p>
                          </div>
                        </div>
                        <ChevronRight size={28} className={`text-orange-500 transition-transform duration-500 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="p-8 space-y-6 animate-in fade-in duration-300">
                        <p className="text-lg text-zinc-300 leading-relaxed font-light">
                          {race.summary}
                        </p>

                        {/* Highlights Grid */}
                        <div>
                          <h4 className="text-sm font-bold uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-2">
                            <Zap size={16} /> Race Highlights
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {race.highlights.map((highlight: string, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                                <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                <span className="text-sm text-zinc-200">{highlight}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Year-specific note */}
                        {year === '2024' && (
                          <div className="flex gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                            <p><span className="font-bold">Admin Note:</span> Brazil was 100% robbed here. Are we serious?</p>
                          </div>
                        )}
                        {year === '2021' && (
                          <div className="flex gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                            <p><span className="font-bold">Admin Note:</span> Abu Dhabi is right there! Most viewed F1 race of all time...</p>
                          </div>
                        )}
                        {year === '2020' && (
                          <div className="flex gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                            <p><span className="font-bold">Admin Note:</span> Monza was clearly the best race of the year. This race was pretty much the Perez show.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CLOSING SECTION */}
        <section className="mt-24 p-8 rounded-2xl bg-gradient-to-r from-slate-800/50 to-orange-900/20 border border-orange-500/20 backdrop-blur-sm">
          <h2 className="text-3xl font-black uppercase italic tracking-tight text-white mb-6">The Journey Continues</h2>
          <p className="text-lg text-zinc-300 leading-relaxed mb-6">
            From the glory days of the ground effect era to the controversial regulations of 2026, Formula 1 has given us moments that define generations. Every race tells a story—some of heartbreak, some of triumph, but all of them iconic in their own way.
          </p>
          <p className="text-zinc-400">
            The 2010s and earlier years coming soon. Stay tuned for more deep dives into the races that shaped F1 history.
          </p>
          
          <a href="https://www.f1elo.me" className="mt-8 inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-red-500 text-white font-black uppercase tracking-wider text-sm px-8 py-4 rounded-full transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/40">
            Back to Main Site <ChevronRight size={18} />
          </a>
        </section>
      </main>
    </div>
  );
}