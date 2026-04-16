'use client'

import React, { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { useUser } from '@clerk/nextjs'
import { 
  Activity, TrendingUp, TrendingDown, 
  Wallet, Trophy, PieChart, X, Loader2
} from 'lucide-react'

// --- CONFIGURATION ---
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS3Ia2YO0T2yMBlPlOLOMUCgWnT0IzT-hNqKscWJT1SqqyE5INYObl3BEP7pdmaKJI3fzJQILj7BUV6/pub?gid=1401420857&single=true&output=csv"
const DB_URL = "https://f1-stock-game-default-rtdb.europe-west1.firebasedatabase.app/"
const INITIAL_CASH = 10000

// --- TYPES ---
interface MarketStock {
  code: string
  name: string
  team: string
  currentPrice: number
  history: number[]
  change: number
}

interface UserProfile {
  managerName: string
  cash: number
  portfolio: Record<string, number>
  netWorth: number
}

interface LeaderboardEntry {
  name: string
  netWorth: number
  isMe: boolean
}

export default function StockMarket() {
  const { isLoaded: authLoaded, isSignedIn, user } = useUser()

  const [marketData, setMarketData] = useState<MarketStock[]>([])
  const [isDataLoaded, setIsDataLoaded] = useState(false)
  const [dataError, setDataError] = useState<string | null>(null)
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  
  const [activeTab, setActiveTab] = useState<'market' | 'portfolio' | 'leaderboard'>('market')
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(false)

  const [tradeModal, setTradeModal] = useState<{ isOpen: boolean, stockCode: string | null }>({ isOpen: false, stockCode: null })
  const [tradeQty, setTradeQty] = useState<number>(1)

  // 1. FETCH FIREBASE USER PROFILE
  useEffect(() => {
    if (authLoaded && isSignedIn && user) {
      const fetchOrInitializeUser = async () => {
        try {
          const res = await fetch(`${DB_URL}users/${user.id}.json`)
          const data = await res.json()

          // Firebase permission errors return an object with an 'error' key
          if (data && data.error) {
            console.error("Firebase Rules Error:", data.error)
            setDataError("Firebase Permission Denied. Check DB Rules.")
            return
          }

          if (data) {
            // Safely parse numbers to prevent NaN infinite loops
            setUserProfile({ 
              ...data, 
              portfolio: data.portfolio || {},
              cash: Number(data.cash) || 0,
              netWorth: Number(data.netWorth) || 0
            })
          } else {
            const newUser: UserProfile = { 
              managerName: user.fullName || user.firstName || 'Anonymous Manager', 
              cash: INITIAL_CASH, 
              netWorth: INITIAL_CASH, 
              portfolio: {} 
            }
            await fetch(`${DB_URL}users/${user.id}.json`, { 
              method: 'PUT', 
              body: JSON.stringify(newUser) 
            })
            setUserProfile(newUser)
          }
        } catch (e) {
          console.error("Firebase sync error:", e)
          setDataError("Failed to connect to Firebase.")
        }
      }
      fetchOrInitializeUser()
    }
  }, [authLoaded, isSignedIn, user])

  // 2. FETCH ELO DATA FROM GOOGLE SHEETS
  useEffect(() => {
    Papa.parse(SHEET_URL + '&cachebust=' + Date.now(), {
      download: true,
      header: true,
      skipEmptyLines: true,
      error: (err) => {
        console.error("CSV Error:", err)
        setDataError("Failed to load Google Sheet data.")
      },
      complete: (results) => {
        const rows = results.data as Record<string, string>[]
        if (!rows || rows.length === 0) {
          setDataError("Google Sheet is empty or malformed.")
          return
        }

        const firstRow = rows[0]
        const getCol = (...names: string[]) => Object.keys(firstRow).find(k => names.includes(k.toLowerCase().trim())) || ''
        const TEAM_KEY = getCol('team')
        const DRIVER_KEY = getCol('driver')
        const ELO_KEY = getCol('elo')
        const raceColumns = Object.keys(firstRow).filter(key => /^\d{2}\s[A-Z]{2,4}_1$/.test(key.trim()))

        const parsedStocks: MarketStock[] = rows.filter(r => r[DRIVER_KEY]?.trim()).map(r => {
          const nameParts = r[DRIVER_KEY].trim().split(' ')
          const code = nameParts[nameParts.length - 1].substring(0, 3).toUpperCase()
          const currentPrice = parseInt(r[ELO_KEY]) || 1500
          
          const history = raceColumns.map(col => parseInt(r[col])).filter(val => !isNaN(val) && val > 500)
          if (history.length === 0) history.push(currentPrice) 
          
          const change = history.length > 1 ? history[history.length - 1] - history[history.length - 2] : 0

          return {
            code,
            name: r[DRIVER_KEY].trim(),
            team: r[TEAM_KEY]?.trim() || 'Unemployed',
            currentPrice,
            history,
            change
          }
        })
        
        setMarketData(parsedStocks.sort((a, b) => b.currentPrice - a.currentPrice))
        setIsDataLoaded(true)
      }
    })
  }, [])

  // 3. SAFE NET WORTH RECALCULATION
  useEffect(() => {
    if (userProfile && marketData.length > 0) {
      let stockVal = 0
      Object.entries(userProfile.portfolio || {}).forEach(([code, qty]) => {
        const stock = marketData.find(s => s.code === code)
        if (stock) stockVal += (stock.currentPrice * Number(qty))
      })
      
      const safeCash = Number(userProfile.cash) || 0
      const safeNetWorth = Number(userProfile.netWorth) || 0
      const newNetWorth = safeCash + stockVal

      if (newNetWorth !== safeNetWorth && !isNaN(newNetWorth)) {
        setUserProfile(prev => prev ? { ...prev, netWorth: newNetWorth } : null)
        if (user?.id) {
          fetch(`${DB_URL}users/${user.id}/netWorth.json`, { method: 'PUT', body: JSON.stringify(newNetWorth) })
        }
      }
    }
  }, [marketData, userProfile?.portfolio, userProfile?.cash, user?.id]) 

  // --- ACTIONS ---
  const executeTrade = async (action: 'buy' | 'sell') => {
    if (!userProfile || !tradeModal.stockCode || tradeQty <= 0 || !user) return
    
    const stock = marketData.find(s => s.code === tradeModal.stockCode)
    if (!stock) return

    const cost = stock.currentPrice * tradeQty
    let newProfile = { ...userProfile }

    if (action === 'buy') {
      if (newProfile.cash < cost) return alert("Insufficient Funds")
      newProfile.cash -= cost
      newProfile.portfolio[stock.code] = (newProfile.portfolio[stock.code] || 0) + tradeQty
    } else {
      if ((newProfile.portfolio[stock.code] || 0) < tradeQty) return alert("Not enough shares to sell")
      newProfile.cash += cost
      newProfile.portfolio[stock.code] -= tradeQty
    }

    setUserProfile(newProfile)
    setTradeModal({ isOpen: false, stockCode: null })
    
    await fetch(`${DB_URL}users/${user.id}.json`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProfile)
    })
  }

  const loadLeaderboard = async () => {
    setIsLeaderboardLoading(true)
    try {
      const res = await fetch(`${DB_URL}users.json`)
      const data = await res.json()
      
      if (data && !data.error) {
        const players = Object.values(data).map((u: any) => {
          let currentPortfolioValue = 0
          if (u.portfolio) {
            Object.entries(u.portfolio).forEach(([ticker, qty]: [string, any]) => {
              const stock = marketData.find(m => m.code === ticker)
              if (stock) currentPortfolioValue += (stock.currentPrice * qty)
            })
          }
          return {
            name: u.managerName || "Unknown",
            netWorth: (Number(u.cash) || 0) + currentPortfolioValue,
            isMe: u.managerName === userProfile?.managerName
          }
        })
        setLeaderboard(players.sort((a, b) => b.netWorth - a.netWorth))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsLeaderboardLoading(false)
    }
  }

  // --- RENDER HELPERS ---
  const renderSparkline = (history: number[], isUp: boolean) => {
    const min = Math.min(...history) - 10
    const max = Math.max(...history) + 10
    const colorClass = isUp ? 'bg-green-500' : 'bg-red-500'

    return (
      <div className="h-8 flex items-end gap-[2px] opacity-80 mt-2">
        {history.map((val, i) => {
          const height = Math.max(10, ((val - min) / (max - min)) * 100)
          const isLast = i === history.length - 1
          return (
            <div 
              key={i} 
              className={`flex-1 min-h-[2px] rounded-t-sm transition-all duration-300 ${isLast ? colorClass + ' opacity-100 shadow-[0_0_8px_currentColor]' : 'bg-zinc-700 opacity-50'}`}
              style={{ height: `${height}%` }}
            />
          )
        })}
      </div>
    )
  }

  // --- ERROR STATE ---
  if (dataError) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-red-500 font-mono text-sm tracking-widest gap-4">
        <X size={48} />
        <div>System Failure: {dataError}</div>
      </div>
    )
  }

  // --- LOADING STATE (WITH DIAGNOSTICS) ---
  if (!authLoaded || !isDataLoaded || (isSignedIn && !userProfile)) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-orange-500 font-mono text-sm tracking-widest gap-4">
        <Loader2 className="animate-spin" size={32} />
        <div>Syncing Telemetry...</div>
        
        {/* Debug Box so you know exactly what is stuck */}
        <div className="mt-8 flex flex-col items-center gap-2 text-[10px] text-zinc-500 bg-[#0a0a0c] p-4 rounded-lg border border-zinc-800">
          <p>Auth Link: {authLoaded ? <span className="text-green-500">Established</span> : 'Connecting...'}</p>
          <p>Market Data: {isDataLoaded ? <span className="text-green-500">Fetched</span> : 'Awaiting Sheet...'}</p>
          <p>Cloud Profile: {userProfile ? <span className="text-green-500">Synced</span> : (isSignedIn ? 'Querying Firebase...' : 'No Auth Token')}</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-zinc-500 font-mono text-sm tracking-widest gap-2">
        <Activity size={32} className="text-orange-500 mb-4" />
        Authentication required. 
        <span className="text-[10px]">Use the top navigation to INITIATE UPLINK.</span>
      </div>
    )
  }

  // --- MAIN APP ---
  const activeStockForModal = tradeModal.stockCode ? marketData.find(s => s.code === tradeModal.stockCode) : null
  const ownedShares = activeStockForModal ? (userProfile?.portfolio?.[activeStockForModal.code] || 0) : 0

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans pb-20 selection:bg-orange-500/30">
      
      {/* HEADER / HUD */}
      <header className="sticky top-[64px] z-40 bg-[#0a0a0c] border-b border-zinc-800 px-6 py-4 shadow-xl">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest flex items-center gap-1"><Wallet size={12}/> Liquid Capital</p>
            <p className="text-2xl md:text-3xl font-mono font-black text-white">${Math.round(userProfile?.cash || 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Total Net Worth</p>
            <p className="text-2xl md:text-3xl font-mono font-black text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.4)]">
              ${Math.round(userProfile?.netWorth || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="max-w-6xl mx-auto px-6 mt-8 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'market', label: 'Live Market', icon: Activity },
          { id: 'portfolio', label: 'My Portfolio', icon: PieChart },
          { id: 'leaderboard', label: 'Global Rank', icon: Trophy }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id as any); if(tab.id === 'leaderboard') loadLeaderboard(); }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
              activeTab === tab.id 
                ? 'bg-orange-600 text-white border-orange-500 shadow-[0_0_15px_rgba(234,88,12,0.3)]' 
                : 'bg-[#0a0a0c] text-zinc-500 border-zinc-800 hover:text-zinc-300 hover:border-zinc-700'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-6 mt-8">
        
        {/* MARKET & PORTFOLIO GRIDS */}
        {(activeTab === 'market' || activeTab === 'portfolio') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {marketData
              .filter(stock => activeTab === 'market' || (userProfile?.portfolio?.[stock.code] || 0) > 0)
              .map(stock => {
                const isUp = stock.change >= 0
                const owned = userProfile?.portfolio?.[stock.code] || 0

                return (
                  <div key={stock.code} className="bg-[#0a0a0c] border border-zinc-800/80 rounded-xl p-5 hover:border-zinc-700 transition-colors group relative overflow-hidden flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-xl font-black italic tracking-tighter text-white">{stock.code}</h3>
                          <p className="text-[10px] uppercase tracking-widest text-zinc-500 truncate w-32">{stock.name}</p>
                        </div>
                        {owned > 0 && (
                          <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-mono px-2 py-1 rounded-md whitespace-nowrap">
                            OWNED: <span className="font-bold">{owned}</span>
                          </div>
                        )}
                      </div>
                      
                      {renderSparkline(stock.history, isUp)}

                      <div className="flex justify-between items-end mt-4 mb-5">
                        <div className="text-2xl font-mono font-black text-white drop-shadow-md">${stock.currentPrice}</div>
                        <div className={`flex items-center gap-1 font-mono text-xs font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                          {isUp ? <TrendingUp size={14}/> : <TrendingDown size={14}/>} {isUp ? '+' : ''}{stock.change}
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => setTradeModal({ isOpen: true, stockCode: stock.code })}
                      className="w-full bg-[#111116] hover:bg-white hover:text-black border border-zinc-800 text-zinc-300 text-xs font-black uppercase italic py-2.5 rounded-lg transition-all"
                    >
                      Trade Asset
                    </button>
                  </div>
                )
            })}
            {activeTab === 'portfolio' && Object.keys(userProfile?.portfolio || {}).length === 0 && (
               <div className="col-span-full py-20 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest border border-dashed border-zinc-800 rounded-2xl">
                 Portfolio Empty. Head to the Market to acquire assets.
               </div>
            )}
          </div>
        )}

        {/* LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl">
             <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#0c0c0f] text-[10px] font-black uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
                  <th className="px-6 py-5 text-left w-20">Rank</th>
                  <th className="px-6 py-5 text-left">Manager Callsign</th>
                  <th className="px-6 py-5 text-right text-green-500">Net Worth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLeaderboardLoading ? (
                  <tr><td colSpan={3} className="py-20 text-center text-zinc-600 font-mono text-xs uppercase tracking-widest animate-pulse">Syncing Global Data...</td></tr>
                ) : (
                  leaderboard.map((p, i) => (
                    <tr key={p.name + i} className={`${p.isMe ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : 'hover:bg-[#111116]'} transition-colors`}>
                      <td className="px-6 py-4 font-black italic text-zinc-500 text-lg">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </td>
                      <td className={`px-6 py-4 font-bold ${p.isMe ? 'text-orange-500' : 'text-zinc-300'}`}>
                        {p.name} {p.isMe && <span className="ml-2 text-[9px] bg-orange-600 text-white px-2 py-0.5 rounded-full uppercase tracking-widest font-black not-italic">You</span>}
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-black text-white">
                        ${Math.round(p.netWorth).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* TRADE MODAL */}
      {tradeModal.isOpen && activeStockForModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0a0a0c] border border-zinc-800 rounded-3xl w-full max-w-md p-6 md:p-8 relative shadow-2xl">
            <button onClick={() => setTradeModal({ isOpen: false, stockCode: null })} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors bg-zinc-900 rounded-full p-1 border border-zinc-800">
              <X size={16} />
            </button>
            
            <div className="mb-6 border-b border-zinc-800 pb-4">
              <h3 className="text-3xl font-black italic uppercase text-white tracking-tighter mb-1">Trade</h3>
              <p className="text-xs text-orange-500 font-mono tracking-widest uppercase font-bold">{activeStockForModal.name}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-[#111116] p-4 rounded-2xl border border-zinc-800/50 flex flex-col justify-center">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Price / Share</p>
                <p className="text-2xl font-mono font-black text-white">${activeStockForModal.currentPrice}</p>
              </div>
              <div className="bg-[#111116] p-4 rounded-2xl border border-zinc-800/50 flex flex-col justify-center">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">Shares Owned</p>
                <p className="text-2xl font-mono font-black text-orange-500">{ownedShares}</p>
              </div>
            </div>

            <div className="mb-8 bg-[#111116] p-4 rounded-2xl border border-zinc-800/50">
              <div className="flex justify-between items-center mb-3">
                <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Quantity</label>
                <button onClick={() => setTradeQty(Math.floor((userProfile?.cash || 0) / activeStockForModal.currentPrice))} className="text-[10px] font-black uppercase tracking-widest text-orange-500 hover:text-orange-400 bg-orange-500/10 px-2 py-1 rounded">Max Afford</button>
              </div>
              
              <input 
                type="number" min="1"
                value={tradeQty} 
                onChange={(e) => setTradeQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-[#050505] border border-zinc-800 text-white text-center text-3xl font-mono font-black py-4 rounded-xl focus:outline-none focus:border-orange-500 transition-colors"
              />
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-zinc-800">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Total Transaction</span>
                <strong className="text-white font-mono text-xl">${(activeStockForModal.currentPrice * tradeQty).toLocaleString()}</strong>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => executeTrade('buy')} className="flex-1 bg-green-500 text-black hover:bg-green-400 font-black italic uppercase py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)] active:scale-95 text-sm md:text-base">
                Buy
              </button>
              <button onClick={() => executeTrade('sell')} className="flex-1 bg-red-500 text-white hover:bg-red-400 font-black italic uppercase py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] active:scale-95 text-sm md:text-base">
                Sell
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER SYSTEM TAG */}
      <div className="fixed bottom-4 right-4 text-[10px] font-mono text-zinc-500 uppercase tracking-widest bg-[#0a0a0c] px-3 py-1.5 rounded-full border border-zinc-800 shadow-lg pointer-events-none hidden md:block">
        User: <span className="text-orange-500">{user?.fullName || user?.firstName || 'Unknown'}</span>
      </div>
    </div>
  )
}