'use client'

import React from 'react'
import Link from 'next/link'
import { AlertTriangle, ChevronRight, Flag, TrendingUp, Wind, Zap, Trophy } from 'lucide-react'

export default function MiamiArticlePage() {
  // Full 22-driver predicted data parsed from the latest F1 simulation results[cite: 2]
  const predictions = [
    { rank: 1, driver: "Lando Norris", team: "McLaren", gap: "—" },
    { rank: 2, driver: "Oscar Piastri", team: "McLaren", gap: "+2.223s" },
    { rank: 3, driver: "Charles Leclerc", team: "Ferrari", gap: "+9.690s" },
    { rank: 4, driver: "George Russell", team: "Mercedes", gap: "+12.597s" },
    { rank: 5, driver: "Lewis Hamilton", team: "Ferrari", gap: "+17.385s" },
    { rank: 6, driver: "Kimi Antonelli", team: "Mercedes", gap: "+19.608s" },
    { rank: 7, driver: "Max Verstappen", team: "Red Bull", gap: "+33.801s" },
    { rank: 8, driver: "Isack Hadjar", team: "Red Bull", gap: "+44.346s" },
    { rank: 9, driver: "Pierre Gasly", team: "Alpine", gap: "+83.790s" },
    { rank: 10, driver: "Franco Colapinto", team: "Alpine", gap: "+88.464s" },
    { rank: 11, driver: "Nico Hulkenberg", team: "Sauber", gap: "+97.812s" },
    { rank: 12, driver: "Carlos Sainz", team: "Williams", gap: "+98.838s" },
    { rank: 13, driver: "Oliver Bearman", team: "Haas", gap: "+101.745s" },
    { rank: 14, driver: "Gabriel Bortoleto", team: "Sauber", gap: "+102.144s" },
    { rank: 15, driver: "Alex Albon", team: "Williams", gap: "+102.657s" },
    { rank: 16, driver: "Esteban Ocon", team: "Haas", gap: "+104.139s" },
    { rank: 17, driver: "Liam Lawson", team: "VCARB", gap: "+134.292s" },
    { rank: 18, driver: "Arvid Lindblad", team: "VCARB", gap: "+134.805s" },
    { rank: 19, driver: "Valtteri Bottas", team: "Cadillac", gap: "+170.886s" },
    { rank: 20, driver: "Sergio Perez", team: "Cadillac", gap: "+172.767s" },
    { rank: 21, driver: "Fernando Alonso", team: "Aston Martin", gap: "+204.402s" },
    { rank: 22, driver: "Lance Stroll", team: "Aston Martin", gap: "+214.377s" }
  ]

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@600;700;800&display=swap');
        body { font-family: 'Space Grotesk', sans-serif; }
        h1, h2, h3, h4, h5, h6 { font-family: 'Syne', sans-serif; font-weight: 700; }
        
        /* Custom Scrollbar for the leaderboard */
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(234, 88, 12, 0.4); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(234, 88, 12, 0.8); }
      `}</style>

      {/* Navigation Bar */}
      <div className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-orange-500/20">
        <div className="max-w-4xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="text-2xl font-black text-white hover:text-orange-500 transition-colors">
            F1 <span className="text-orange-600">NEWS</span>
          </Link>
          <Link href="/rankings" className="text-orange-500/70 hover:text-orange-500 font-bold text-sm uppercase tracking-wider transition-all flex items-center gap-2">
            Back to Rankings <ChevronRight size={16} />
          </Link>
        </div>
      </div>

      {/* Article Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        
        {/* Header / Hero */}
        <div className="mb-12 border-b border-orange-500/20 pb-12">
          <p className="text-orange-500 font-bold uppercase tracking-widest text-sm mb-4 flex items-center gap-2">
            <Flag size={16} />
            Race Preview • Miami 2026
          </p>
          <h1 className="text-5xl md:text-7xl font-black text-white mb-6 italic leading-tight uppercase">
            Miami Heat: McLaren Upgrades Ignite a Four-Way Fight as Red Bull Fumbles
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed font-medium">
            The 2026 Formula 1 season has hit a fever pitch in Florida. Following an unscheduled four-week break, the grid arrives at the Miami International Autodrome with a revised set of FIA regulations and a pecking order that looks increasingly unstable. While Mercedes dominated the opening rounds in Australia, China, and Japan, the sunshine state suggests a shift in the winds of power.
          </p>
        </div>

        {/* The Papaya Revolution */}
        <div className="bg-orange-600/10 border-2 border-orange-600/30 rounded-lg p-8 mb-10 hover:border-orange-500/50 transition-all shadow-lg shadow-orange-900/20">
          <div className="flex items-center gap-3 mb-6">
            <Zap size={28} className="text-orange-500" />
            <h2 className="text-3xl font-black text-white uppercase">The Papaya Revolution: McLaren’s "B" Spec Dominance</h2>
          </div>
          <p className="text-lg text-slate-300 mb-6">
            McLaren has arrived in Miami with what is effectively a "B" version of the MCL40, and if early data is any indication, the rest of the field should be worried.
          </p>
          <ul className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="bg-orange-500/20 p-2 rounded text-orange-500 shrink-0 mt-1"><TrendingUp size={16} /></div>
              <div>
                <strong className="text-white text-lg">Scintillating Pace:</strong> 
                <span className="text-slate-400 block mt-1">Lando Norris claimed pole for the Sprint Qualifying, showcasing a car that has mastered the balance between slow-speed technicality and high-speed downforce.</span>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-orange-500/20 p-2 rounded text-orange-500 shrink-0 mt-1"><Flag size={16} /></div>
              <div>
                <strong className="text-white text-lg">A Predicted 1-2:</strong> 
                <span className="text-slate-400 block mt-1">According to the latest race simulations, McLaren is favored to secure a dominant one-two finish, with Norris leading teammate Oscar Piastri across the line.</span>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="bg-orange-500/20 p-2 rounded text-orange-500 shrink-0 mt-1"><Wind size={16} /></div>
              <div>
                <strong className="text-white text-lg">Power and Weight:</strong> 
                <span className="text-slate-400 block mt-1">The team has successfully reduced the car's weight while maximizing the efficiency of their Mercedes Power Unit.</span>
              </div>
            </li>
          </ul>
        </div>

        {/* Ferrari and Mercedes */}
        <div className="mb-10">
          <h2 className="text-3xl font-black text-white uppercase mb-6">Ferrari and Mercedes: The Battle for the Podium</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            While McLaren steals the headlines, Ferrari and Mercedes are locked in a high-stakes chess match for the remaining silverware.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-orange-500/20 p-6 rounded-lg">
              <h3 className="text-2xl font-black text-white mb-4 uppercase">Leclerc’s Charge & The Hamilton Factor</h3>
              <p className="text-slate-400 leading-relaxed mb-4">
                <strong>Charles Leclerc</strong> showed early promise by topping the only practice session of the weekend. He is predicted to secure P3, keeping Ferrari firmly in the hunt. 
              </p>
              <p className="text-slate-400 leading-relaxed">
                Moving to Ferrari has seen <strong>Lewis Hamilton</strong> settle into a consistent rhythm, with a P5 finish predicted for Sunday’s main event.
              </p>
            </div>
            <div className="bg-black/40 border border-orange-500/20 p-6 rounded-lg">
              <h3 className="text-2xl font-black text-white mb-4 uppercase">The Mercedes Slump</h3>
              <p className="text-slate-400 leading-relaxed">
                After winning the first three races of the season, Mercedes appears to be on the back foot. While <strong>Kimi Antonelli</strong> currently leads the championship, he and <strong>George Russell</strong> have struggled with rear-end stability in the Miami heat.
              </p>
            </div>
          </div>
        </div>

        {/* Red Bull in Crisis */}
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-lg p-8 mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <AlertTriangle size={120} className="text-red-500" />
          </div>
          <div className="relative z-10">
            <h2 className="text-3xl font-black text-white uppercase mb-4 flex items-center gap-3">
              <AlertTriangle className="text-red-500" /> 
              Red Bull in Crisis: Verstappen’s Uphill Battle
            </h2>
            <p className="text-slate-300 leading-relaxed mb-4">
              The most shocking narrative in Miami isn't just on the track, but in the paddock.
            </p>
            <blockquote className="border-l-4 border-red-500 pl-4 py-2 mb-6 bg-red-500/5 text-red-200 italic font-medium text-lg">
              "Red Bull in crisis as Verstappen's engineer moves to McLaren."
            </blockquote>
            <p className="text-slate-300 leading-relaxed mb-4">
              With Gianpiero Lambiase departing for a rival, Max Verstappen’s season continues to stutter. Having failed to finish higher than sixth in the first three races of 2026, the Dutchman is predicted to cross the line in a lonely P7. 
            </p>
            <p className="text-slate-300 leading-relaxed">
              The energy management issues inherent in the 2026 regulations continue to plague the RB22, leaving Verstappen vocal about his dissatisfaction with the current state of the sport.
            </p>
          </div>
        </div>

        {/* Midfield */}
        <div className="mb-14">
          <h2 className="text-3xl font-black text-white uppercase mb-4">The Audi Era and Midfield Struggles</h2>
          <div className="border-l-2 border-orange-500/50 pl-6 py-2">
            <p className="text-slate-300 leading-relaxed mb-4">
              In a notable shift for the grid, the team formerly known as Sauber is now competing under the Audi banner. Their first major outing in Miami sees a respectable showing, though they remain just outside the points-paying positions.
            </p>
            <p className="text-orange-400/80 text-sm font-bold uppercase tracking-wider bg-orange-500/10 inline-block px-3 py-1 rounded">
              Note: Audi's Nico Hulkenberg is expected to lead the charge for the new manufacturer in P11, followed by teammate Gabriel Bortoleto in P14.
            </p>
          </div>
        </div>

        {/* Predictions Widget / Leaderboard UI (All 22 Drivers) */}
        <div className="mb-14">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className="text-4xl font-black text-white italic uppercase flex items-center gap-3">
                <Trophy className="text-orange-500" size={32} />
                Full Grid Prediction
              </h2>
              <p className="text-orange-500 font-bold uppercase tracking-widest text-sm mt-2">
                Simulated 57-Lap Results[cite: 2]
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 uppercase font-bold tracking-widest bg-white/5 px-3 py-2 rounded">
              Scroll to view full grid
            </div>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar rounded-lg">
            {predictions.map((p, idx) => {
              // Styling logic based on grid position
              const isPodium = idx < 3;
              const isPoints = idx >= 3 && idx < 10;
              
              let containerClasses = "w-full group transition-all duration-200 border-2 rounded-lg p-4 flex items-center justify-between ";
              let rankClasses = "text-2xl font-black w-12 flex-shrink-0 text-center ";
              let textClasses = "text-lg font-black transition-colors ";
              
              if (isPodium) {
                containerClasses += "bg-orange-600/15 border-orange-600/50 shadow-md shadow-orange-900/20 hover:bg-orange-600/25";
                rankClasses += "text-orange-500";
                textClasses += "text-white group-hover:text-orange-400";
              } else if (isPoints) {
                containerClasses += "bg-black/60 border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5";
                rankClasses += "text-slate-400";
                textClasses += "text-slate-100 group-hover:text-white";
              } else {
                containerClasses += "bg-black/30 border-white/5 hover:border-white/10 opacity-80 hover:opacity-100";
                rankClasses += "text-slate-600 font-bold text-xl";
                textClasses += "text-slate-300";
              }

              return (
                <div key={p.rank} className={containerClasses}>
                  <div className="flex items-center gap-4 flex-1">
                    <div className={rankClasses}>
                      {p.rank}
                    </div>
                    <div>
                      <p className={textClasses}>
                        {p.driver}
                      </p>
                      <p className={`text-xs mt-1 uppercase tracking-wider font-bold ${isPodium ? 'text-orange-500/80' : 'text-slate-500'}`}>
                        {p.team}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`font-black ${isPodium ? 'text-white' : 'text-slate-300'}`}>{p.gap}</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-widest">Gap</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Final Outlook */}
        <div className="bg-gradient-to-r from-orange-600/20 to-black border border-orange-500/30 rounded-lg p-8">
          <h3 className="text-2xl font-black text-white uppercase mb-4 flex items-center gap-3">
            <Wind className="text-orange-500" size={24} /> 
            Final Outlook
          </h3>
          <p className="text-slate-300 leading-relaxed text-lg">
            With rain and storms forecasted for Sunday, the theoretical data might be thrown out the window in favor of pure driver instinct. However, one thing is certain: the era of Mercedes' 2026 dominance is facing its first true test at the hands of a revitalized McLaren.
          </p>
        </div>

      </div>
    </div>
  )
}