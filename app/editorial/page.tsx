import React from 'react';
import { 
  Activity, 
  BatteryWarning, 
  Car, 
  Flag, 
  Gauge, 
  TrendingUp, 
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export default function ArticlePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* NAVIGATION - Glassmorphism Sticky Header */}
      <nav className="fixed top-0 w-full z-50 bg-zinc-950/70 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flag className="text-orange-500" size={24} />
            <span className="text-xl font-black italic tracking-tighter text-white">F1<span className="text-orange-500">ELO</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-zinc-400">
            <a href="#" className="hover:text-white transition-colors">Cool Gadgets</a>
            <a href="#" className="hover:text-white transition-colors">Updates</a>
            <a href="#" className="hover:text-white transition-colors">2026 Previews</a>
            <a href="#" className="hover:text-white transition-colors">2026 Reviews</a>
            <a href="#" className="text-white border-b-2 border-orange-500 pb-1">About</a>
            <a href="#" className="hover:text-white transition-colors">Driver Tier List</a>
            <a href="#" className="hover:text-white transition-colors">Archive</a>
          </div>
        </div>
      </nav>

      {/* HERO SECTION - Telemetry Grid Vibe */}
      <header className="relative pt-32 pb-20 overflow-hidden">
        {/* Abstract Background Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono font-semibold mb-6">
            <Activity size={14} /> Analysis & Opinion
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-[0.9] mb-6">
            The State of the Grid: <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600">
              McLaren, Regulations,
            </span><br />
            and the Road to Miami
          </h1>
          
          <div className="flex items-center gap-4 mt-8 border-t border-zinc-800 pt-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700 flex items-center justify-center">
              <Car className="text-zinc-400" size={20} />
            </div>
            <div>
              <p className="text-white font-bold text-sm">@FullTimeMclarenFan</p>
              <p className="text-zinc-500 text-xs font-mono">Published • 2026 Season</p>
            </div>
          </div>
        </div>
      </header>

      {/* ARTICLE CONTENT */}
      <main className="max-w-4xl mx-auto px-6 pb-32">
        <article className="space-y-16 text-lg leading-relaxed text-zinc-400">
          
          {/* SECTION 1: MCLAREN */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white border-b border-zinc-800 pb-4">
              <TrendingUp className="text-orange-500" />
              <h2 className="text-3xl font-black uppercase italic tracking-tight">McLaren: A Teetering Start</h2>
            </div>
            
            <p>
              We'll start at McLaren, and from the team's perspective, it's been an inconsistent start to the season. We were probably <strong className="text-white">4th best in Australia, 3rd best in China and 2nd best in Japan</strong> (so let's hope we'll be quickest by Miami).
            </p>
            
            <p>
              Obviously, the main talking point has to be <span className="text-orange-400 font-semibold bg-orange-500/10 px-2 py-0.5 rounded">reliability</span>. I think we've had a problem in almost every session this year due to learning about the Mercedes power unit every week, so I'm hoping now we are 3 races in we can reduce the number of issues we have and actually start more races. On the aero side, Stella made it very clear we would start on the backfoot but hopefully we should have a stable platform to upgrade on going forward.
            </p>
            
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 my-8 shadow-2xl">
              <h3 className="text-sm font-mono text-zinc-500 uppercase tracking-widest mb-4">Driver Telemetry</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border-l-2 border-orange-500 pl-4">
                  <h4 className="text-white font-bold text-xl uppercase italic">Piastri</h4>
                  <p className="text-sm mt-2">Completed one race and was the best driver on the grid, but missed out in Australia and China.</p>
                </div>
                <div className="border-l-2 border-yellow-500 pl-4">
                  <h4 className="text-white font-bold text-xl uppercase italic">Norris</h4>
                  <p className="text-sm mt-2">More racing done, but severely lacks practice laps, leaving him further off the pace than he should be.</p>
                </div>
              </div>
            </div>
            
            <p>
              If he can have a clean weekend, he should be back up there competing for good positions. Compared to previous new regulations, this has been a much more positive start and hopefully we can be fighting for wins again soon.
            </p>
          </section>

          {/* SECTION 2: REGULATIONS */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white border-b border-zinc-800 pb-4">
              <Gauge className="text-blue-500" />
              <h2 className="text-3xl font-black uppercase italic tracking-tight">The New Regulations: A Step Backward?</h2>
            </div>
            
            <p>
              As for these new regulations, I have a lot of thoughts about them. Firstly, qualifying is abysmal. I know the ground effect cars were some of the best qualifying cars of all time, but the step down in quality is far larger than I could've imagined.
            </p>
            
            {/* Highlight Metric Card */}
            <div className="flex items-center gap-6 bg-blue-950/20 border border-blue-900/30 rounded-xl p-6">
              <BatteryWarning className="text-blue-500 w-12 h-12 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">The way the battery works makes for a product that I believe isn't worth watching.</p>
                <p className="text-blue-400 font-mono text-sm mt-2">Cars on push laps are losing <strong className="text-white text-lg">50 kph</strong> due to "super clipping."</p>
              </div>
            </div>

            <p>
              But the main event in Formula One is what we really watch this sport for. And I have very mixed thoughts on this too. I think the aero side of the regulations are a positive improvement. Smaller cars make it so it isn't impossible to make overtakes and allows for more wheel-to-wheel action, like the Ferraris in China.
            </p>
            <p>
              However, the artificial nature of these regulations make DRS look like a standard part of racing rather than a gimmick. The engine (specifically the battery) is the major downside to these regulations. Yes, there are more overtakes, but they're purely down to battery saving rather than driver skill. Even in the DRS era, overtakes were being made at the end of corners. Most of these new overtakes take place halfway down the straights, and the driver is usually repassed immediately due to wasting their battery.
            </p>
          </section>

          {/* SECTION 3: FIA DILEMMA */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 text-white border-b border-zinc-800 pb-4">
              <AlertTriangle className="text-red-500" />
              <h2 className="text-3xl font-black uppercase italic tracking-tight">The FIA’s Dilemma</h2>
            </div>
            
            <p>
              The FIA looked at the complaints about the lack of overtakes and ignored any nuance regarding people's issues. The solution should be to get rid of the battery, or at least significantly reduce its impact from 50% to like 25%. People don't care if the cars are 10 seconds slower than 2026; fans just want to see the best racing possible, and I believe these regulations aren't getting the best out of the drivers and therefore we aren't getting the best racing we can.
            </p>

            <blockquote className="border-l-4 border-red-600 bg-red-950/20 p-6 rounded-r-xl my-8">
              <p className="text-zinc-300 italic">
                "There are moments (like the Ferraris in China), but there were also moments in the GE era which was universally disliked. And then you have the fact that these cars have insane overspeed which is incredibly dangerous, as seen in the <strong className="text-red-400">50g Bearman crash</strong> in Japan."
              </p>
            </blockquote>

            <p>
              Considering the step forward the FIA made in the aero, I believe they undid all that good work with an engine which is nothing short of awful.
            </p>
          </section>

          {/* SECTION 4: CONCLUSION */}
          <section className="space-y-6 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800/50 backdrop-blur-sm mt-12">
            <h2 className="text-2xl font-black uppercase italic tracking-tight text-white">Looking Ahead</h2>
            <p>
              These are just my opinions and if you enjoy these regs, more power to you. I never want to go into an F1 season wanting the cars to be bad, and I have tried to see the positives, but unfortunately, I think these regulations aren't going to create a product worthy of F1. I really hope I'm either wrong or they make changes because I don't enjoy disliking the cars.
            </p>
            <p>
              I will still watch and make posts, and obviously still be incredibly biased, because I still love F1. I just want it to be the best it possibly can.
            </p>
            
            <button className="mt-6 flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold uppercase tracking-wider text-sm px-6 py-3 rounded-full transition-all hover:scale-105 active:scale-95">
              Read More Analysis <ChevronRight size={18} />
            </button>
          </section>

        </article>
      </main>
      
    </div>
  );
}