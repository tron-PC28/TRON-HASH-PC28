import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetchLatestBlock, fetchBlockByNumber, calculateResultFromHash } from './services/tronService';
import { GameResult, Bet, BetType, DEFAULT_GAMES, GameConfig, BetOption } from './types';
import { HistoryTable } from './components/HistoryTable';
import { BettingBoard } from './components/BettingBoard';
import { StatusBadge } from './components/StatusBadge';
import { PlayerHistory } from './components/PlayerHistory';
import { AdminPanel } from './components/AdminPanel';
import { Home } from './components/Home';
import { GameRules } from './components/GameRules';
import { BLOCKS_PER_ISSUE, REFRESH_INTERVAL_MS, INITIAL_BALANCE, NILE_EXPLORER_URL } from './constants';
import { Wallet, Timer, RefreshCw, Trophy, AlertCircle, ArrowRight, Building2, ScrollText, Gamepad2, ShieldCheck, Home as HomeIcon, BookOpen, Ban, Swords, Coins } from 'lucide-react';

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'home' | 'game' | 'history' | 'admin'>('home');
  const [activeGameId, setActiveGameId] = useState<string>('pc2.0');
  
  // Games Configuration State (Persisted in state to allow admin edits)
  const [gamesConfig, setGamesConfig] = useState<GameConfig[]>(DEFAULT_GAMES);

  // Ref to hold latest config for polling interval
  const gamesConfigRef = useRef(gamesConfig);
  useEffect(() => {
    gamesConfigRef.current = gamesConfig;
  }, [gamesConfig]);

  // Game Logic State
  const [history, setHistory] = useState<GameResult[]>([]);
  const [playerHistory, setPlayerHistory] = useState<Bet[]>([]); 
  const [latestBlock, setLatestBlock] = useState<GameResult | null>(null);
  const [currentTipHeight, setCurrentTipHeight] = useState<number>(0);
  
  // User/House State
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [houseBalance, setHouseBalance] = useState<number>(88888888);
  const [activeBets, setActiveBets] = useState<Bet[]>([]);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'info' | 'error'} | null>(null);
  
  const [isRulesOpen, setIsRulesOpen] = useState(false);

  // Derived state
  const currentIssueNum = Math.floor(currentTipHeight / BLOCKS_PER_ISSUE) * BLOCKS_PER_ISSUE;
  const nextIssueNum = currentIssueNum + BLOCKS_PER_ISSUE;
  const blocksRemaining = Math.max(0, nextIssueNum - currentTipHeight);
  const isGameLocked = blocksRemaining < 5;
  const progressPercent = Math.max(0, Math.min(100, ((BLOCKS_PER_ISSUE - blocksRemaining) / BLOCKS_PER_ISSUE) * 100));

  // Helper to get current game config
  const activeGame = gamesConfig.find(g => g.id === activeGameId) || gamesConfig[0];
  const isGamePaused = activeGame.status === 'maintenance';

  // Stats Logic for Sidebar "Battle Report"
  const battleReport = useMemo(() => {
    const report = new Map<number, { bet: number, profit: number }>();
    
    // Filter history for current active game to keep context relevant
    const relevantHistory = playerHistory.filter(b => b.gameId === activeGameId);

    relevantHistory.forEach(bet => {
       if (!report.has(bet.issue)) {
         report.set(bet.issue, { bet: 0, profit: 0 });
       }
       const entry = report.get(bet.issue)!;
       entry.bet += bet.amount;
       const payout = bet.payout || 0;
       // Profit = Payout - Stake
       entry.profit += (payout - bet.amount);
    });

    return Array.from(report.entries())
      .sort((a, b) => b[0] - a[0]) // Sort by issue descending
      .slice(0, 5); // Take top 5
  }, [playerHistory, activeGameId]);

  const currentRoundStats = useMemo(() => {
     // Filter active bets for current game and current issue
     const currentBets = activeBets.filter(b => b.issue === nextIssueNum && b.gameId === activeGameId);
     const totalBet = currentBets.reduce((acc, b) => acc + b.amount, 0);
     return { totalBet, count: currentBets.length };
  }, [activeBets, nextIssueNum, activeGameId]);


  // Polling Logic
  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval>;

    const tick = async () => {
      const tipData = await fetchLatestBlock();
      if (!tipData) return;
      
      const tipHeight = tipData.block_header.raw_data.number;
      setCurrentTipHeight(tipHeight);

      const lastGameBlockNum = Math.floor(tipHeight / BLOCKS_PER_ISSUE) * BLOCKS_PER_ISSUE;
      
      if (!latestBlock || latestBlock.issue < lastGameBlockNum) {
        let gameBlockData = null;

        if (tipHeight === lastGameBlockNum) {
          gameBlockData = tipData;
        } else {
          gameBlockData = await fetchBlockByNumber(lastGameBlockNum);
        }

        if (gameBlockData) {
          const result = calculateResultFromHash(gameBlockData);
          setLatestBlock(result);
          
          setHistory(prev => {
             if (prev.find(h => h.issue === result.issue)) return prev;
             return [result, ...prev].slice(0, 20);
          });
          settleBets(result);
        }
      }
    };

    tick();
    intervalId = setInterval(tick, REFRESH_INTERVAL_MS);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestBlock]); 

  const settleBets = (result: GameResult) => {
    setActiveBets(currentBets => {
      const betsForThisIssue = currentBets.filter(b => b.issue === result.issue);
      const otherBets = currentBets.filter(b => b.issue !== result.issue);
      
      if (betsForThisIssue.length === 0) return currentBets;

      let totalWin = 0;
      let totalBetAmount = 0;
      const { attributes } = result;
      
      // Use the ref to ensure we have the latest config even inside the interval closure
      const currentConfig = gamesConfigRef.current;

      const processedBets: Bet[] = betsForThisIssue.map(bet => {
        totalBetAmount += bet.amount;
        let won = false;
        switch (bet.type) {
          case 'big': won = attributes.size === 'Big'; break;
          case 'small': won = attributes.size === 'Small'; break;
          case 'odd': won = attributes.parity === 'Odd'; break;
          case 'even': won = attributes.parity === 'Even'; break;
          case 'big_odd': won = attributes.size === 'Big' && attributes.parity === 'Odd'; break;
          case 'big_even': won = attributes.size === 'Big' && attributes.parity === 'Even'; break;
          case 'small_odd': won = attributes.size === 'Small' && attributes.parity === 'Odd'; break;
          case 'small_even': won = attributes.size === 'Small' && attributes.parity === 'Even'; break;
          case 'pair': won = attributes.isPair; break;
          case 'leopard': won = attributes.isLeopard; break;
        }

        // Logic for 13/14 Special Odds Rule
        // Find the game config associated with this bet
        const gameConfig = currentConfig.find(g => g.id === bet.gameId) || currentConfig[0];
        let finalPayoutRatio = bet.odds;

        if (gameConfig.specialRulesEnabled) {
          // Rule: If result is 13
          // Small/Odd => specialSingleOdds
          // SmallOdd Combo => specialComboOdds
          if (result.sum === 13) {
              if (bet.type === 'small' || bet.type === 'odd') {
                  finalPayoutRatio = gameConfig.specialSingleOdds;
              }
              if (bet.type === 'small_odd') {
                  finalPayoutRatio = gameConfig.specialComboOdds;
              }
          }
          // Rule: If result is 14
          // Big/Even => specialSingleOdds
          // BigEven Combo => specialComboOdds
          if (result.sum === 14) {
               if (bet.type === 'big' || bet.type === 'even') {
                   finalPayoutRatio = gameConfig.specialSingleOdds;
               }
               if (bet.type === 'big_even') {
                   finalPayoutRatio = gameConfig.specialComboOdds;
               }
          }
        }

        const payout = won ? bet.amount * finalPayoutRatio : 0;
        if (won) totalWin += payout;

        return {
          ...bet,
          status: won ? 'won' : 'lost',
          payout,
          settledAt: Date.now()
        };
      });

      setPlayerHistory(prev => [...processedBets, ...prev]);
      setHouseBalance(prev => prev + (totalBetAmount - totalWin));

      if (totalWin > 0) {
        setBalance(prev => prev + totalWin);
        showNotification(`🎉 恭喜! 在第 #${result.issue} 期赢得 ${totalWin} 金币`, 'success');
      } else {
        showNotification(`第 #${result.issue} 期已结束，再接再厉!`, 'info');
      }
      
      return otherBets; 
    });
  };

  const handlePlaceBet = (type: BetType, amount: number) => {
    if (activeGame.status !== 'active') {
      showNotification('该游戏目前暂停下注', 'error');
      return;
    }

    setBalance(prev => prev - amount);
    // Use CURRENT active game odds
    const betOption = activeGame.odds.find(b => b.type === type)!;
    
    const newBet: Bet = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: betOption.label,
      amount,
      odds: betOption.odds,
      status: 'pending',
      issue: nextIssueNum,
      gameId: activeGame.id
    };
    
    setActiveBets(prev => [...prev, newBet]);
    showNotification(`下注成功: ${betOption.label} (第 #${nextIssueNum} 期)`, 'info');
  };

  const handleClearBets = () => {
    // Only clear bets for CURRENT active game
    const betsToClear = activeBets.filter(b => b.issue === nextIssueNum && b.gameId === activeGameId);
    if (betsToClear.length === 0) return;
    const refundAmount = betsToClear.reduce((acc, bet) => acc + bet.amount, 0);
    setBalance(prev => prev + refundAmount);
    setActiveBets(prev => prev.filter(b => !(b.issue === nextIssueNum && b.gameId === activeGameId)));
    showNotification(`已撤销本期全部投注，退还 ${refundAmount} 金币`, 'info');
  };

  const handleCancelBetsByType = (type: BetType) => {
    const betsToRemove = activeBets.filter(b => b.type === type && b.issue === nextIssueNum && b.gameId === activeGameId);
    if (betsToRemove.length === 0) return;
    const refundAmount = betsToRemove.reduce((acc, bet) => acc + bet.amount, 0);
    setBalance(prev => prev + refundAmount);
    setActiveBets(prev => prev.filter(b => !(b.type === type && b.issue === nextIssueNum && b.gameId === activeGameId)));
    showNotification(`撤销 ${betsToRemove[0].label} 全部投注，退还 ${refundAmount}`, 'info');
  };

  const showNotification = (msg: string, type: 'success' | 'info' | 'error') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSelectGame = (gameId: string) => {
    setActiveGameId(gameId);
    setView('game');
  };

  const handleUpdateGameConfig = (updatedGames: GameConfig[]) => {
    setGamesConfig(updatedGames);
  };

  // Render Logic
  if (view === 'home') {
    return <Home games={gamesConfig} onSelectGame={handleSelectGame} onOpenAdmin={() => setView('admin')} />;
  }

  return (
    <div className="min-h-screen pb-12 font-sans selection:bg-tron-green/30">
      
      {/* Global Rules Modal */}
      <GameRules 
        isOpen={isRulesOpen} 
        onClose={() => setIsRulesOpen(false)} 
        gameName={activeGame.name}
        oddsConfig={activeGame.odds}
        minBet={activeGame.minBet}
        maxBet={activeGame.maxBet}
        specialRulesEnabled={activeGame.specialRulesEnabled}
        specialSingleOdds={activeGame.specialSingleOdds}
        specialComboOdds={activeGame.specialComboOdds}
      />

      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-2xl border flex items-center gap-3 animate-bounce ${
          notification.type === 'success' ? 'bg-green-900/90 border-green-500 text-green-100' : 'bg-slate-800 border-slate-600 text-white'
        }`}>
          {notification.type === 'success' ? <Trophy className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {notification.msg}
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('home')} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
              <HomeIcon className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('game')}>
              <div className="w-8 h-8 rounded bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center font-bold text-white">N</div>
              <h1 className="font-bold text-lg md:text-xl tracking-tight hidden sm:block">
                {activeGame.name}
                {isGamePaused && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">维护中</span>}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            
            {view !== 'admin' && (
              <button 
                onClick={() => setView(view === 'game' ? 'history' : 'game')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  view === 'history' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {view === 'game' ? (
                  <>
                    <ScrollText className="w-4 h-4" /> <span className="hidden sm:inline">游戏记录</span>
                  </>
                ) : (
                  <>
                    <Gamepad2 className="w-4 h-4" /> <span className="hidden sm:inline">返回游戏</span>
                  </>
                )}
              </button>
            )}

            {view !== 'admin' && (
              <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-full border border-slate-700">
                <Wallet className="w-4 h-4 text-yellow-500" />
                <span className="font-mono font-bold text-yellow-400">{balance.toLocaleString()}</span>
              </div>
            )}
            
            {view === 'admin' && (
              <div className="px-3 py-1 bg-red-900/30 border border-red-500/30 rounded text-red-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Admin Mode
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        
        {view === 'admin' ? (
           <AdminPanel 
              activeBets={activeBets} 
              history={playerHistory} 
              houseBalance={houseBalance}
              gamesConfig={gamesConfig}
              onUpdateGames={handleUpdateGameConfig}
              onBack={() => setView('game')}
           />
        ) : view === 'history' ? (
          <PlayerHistory 
             history={playerHistory} 
             gameResults={history}
             gamesConfig={gamesConfig} 
             onBack={() => setView('game')} 
          />
        ) : (
          /* Game Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Display: Next Draw Info + Latest Result */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="bg-tron-card rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                 {/* TOP: Next Issue Status */}
                 <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 border-b border-slate-700">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                       <div className="text-center md:text-left">
                          <h2 className="text-indigo-400 font-bold text-sm uppercase tracking-wide flex items-center gap-2 justify-center md:justify-start">
                             <Timer className="w-4 h-4" /> 下期开奖 {isGamePaused ? '(维护暂停)' : (isGameLocked ? '(已封盘)' : '(投注中)')}
                          </h2>
                          <div className="text-4xl font-mono font-bold text-white mt-1">
                             #{nextIssueNum}
                          </div>
                       </div>
  
                       {/* Countdown Box */}
                       <div className="flex items-center gap-6">
                          <div className="text-center">
                             <div className="text-slate-500 text-xs uppercase font-semibold">当前区块</div>
                             <div className="font-mono text-xl text-slate-300">#{currentTipHeight}</div>
                          </div>
                          <ArrowRight className="text-slate-600 hidden md:block" />
                          <div className="text-center px-6 py-2 bg-slate-800 rounded-lg border border-slate-600/50">
                             <div className="text-slate-400 text-xs uppercase font-semibold mb-1">距离开奖</div>
                             <div className={`font-mono text-3xl font-bold ${blocksRemaining < 5 ? 'text-red-500 animate-pulse' : 'text-tron-green'}`}>
                               {blocksRemaining} <span className="text-sm text-slate-500 font-normal">个区块</span>
                             </div>
                          </div>
                       </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="mt-6 relative h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="absolute top-0 left-0 h-full bg-indigo-500 transition-all duration-1000 ease-linear"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                 </div>
  
                 {/* BOTTOM: Last Result */}
                 <div className="p-6 relative group bg-slate-800/20">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">上期结果</h2>
                        <div className="text-2xl font-bold font-mono mt-1 text-white">
                          Block #{latestBlock?.issue ?? '...'}
                        </div>
                      </div>
                       {latestBlock && (
                          <div className="text-right hidden sm:block">
                             <a href={`${NILE_EXPLORER_URL}${latestBlock.issue}`} target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:underline block">
                               验证哈希: ...{latestBlock.hash.slice(-12)}
                             </a>
                             <div className="font-mono text-xs text-slate-500 mt-1">
                                取值 (A+B+C): {latestBlock.hash.replace(/\D/g, '').slice(-3)}
                             </div>
                          </div>
                       )}
                    </div>
  
                    {latestBlock ? (
                      <div className="flex flex-col md:flex-row items-center gap-6">
                         <div className="flex items-center gap-3">
                            {latestBlock.sourceNumbers.map((num, i) => (
                              <div key={i} className="w-10 h-10 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-lg font-bold shadow-inner">
                                {num}
                              </div>
                            ))}
                            <span className="text-xl text-slate-500 font-bold">=</span>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg border-4 ${
                              latestBlock.attributes.size === 'Big' ? 'bg-red-600 border-red-400' : 'bg-blue-600 border-blue-400'
                            }`}>
                              {latestBlock.sum}
                            </div>
                         </div>
                         
                         <div className="h-10 w-px bg-slate-700 hidden md:block"></div>
                         
                         <div className="flex-1">
                           <StatusBadge result={latestBlock.attributes} className="text-base" />
                         </div>
                      </div>
                    ) : (
                      <div className="h-24 flex items-center justify-center text-slate-500">
                        等待第一期开奖...
                      </div>
                    )}
                 </div>
              </div>
  
              {/* Betting Area */}
              <BettingBoard 
                currentIssue={nextIssueNum} 
                balance={balance}
                onPlaceBet={handlePlaceBet}
                onClearBets={handleClearBets}
                onCancelBetType={handleCancelBetsByType}
                currentBets={activeBets.filter(b => b.issue === nextIssueNum && b.gameId === activeGameId)}
                isLocked={isGameLocked}
                isPaused={isGamePaused}
                oddsConfig={activeGame.odds}
                minBet={activeGame.minBet}
                maxBet={activeGame.maxBet}
              />
  
            </div>
  
            {/* Right Sidebar */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Stats Card */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                 <div className="flex justify-between items-center mb-4">
                   <h4 className="font-bold text-slate-300 flex items-center gap-2">
                     <RefreshCw className="w-4 h-4" /> 庄家信息
                   </h4>
                   <button 
                    onClick={() => setIsRulesOpen(true)}
                    className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/30 transition-colors flex items-center gap-1"
                   >
                     <BookOpen className="w-3 h-3" /> 玩法说明
                   </button>
                 </div>
                 <div className="space-y-4">
                    {/* House Balance Display */}
                    <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
                         <Building2 className="w-3 h-3" /> 庄家资金池
                      </div>
                      <div className="text-tron-green font-mono font-bold text-lg">
                         {houseBalance.toLocaleString()}
                      </div>
                    </div>
  
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">开奖频率</span>
                      <span className="text-slate-200">每 {BLOCKS_PER_ISSUE} 个区块</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">当前模式</span>
                      <span className="text-tron-green font-mono">{activeGame.name}</span>
                    </div>
                     {isGamePaused && (
                      <div className="bg-red-500/10 border border-red-500/30 p-2 rounded text-red-400 text-xs flex items-center gap-2">
                        <Ban className="w-4 h-4" /> 此游戏目前维护中，暂停下注。
                      </div>
                    )}
                    <div className="h-px bg-slate-700"></div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      结果基于波场 Nile 测试网区块哈希值。取哈希值中最后 3 个数字相加得出结果。
                    </div>
                 </div>
              </div>
  
              {/* Battle Report (Real-time Stats) */}
              <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700">
                 <h4 className="font-bold text-slate-300 text-sm mb-4 flex items-center gap-2">
                   <Swords className="w-4 h-4 text-red-400" /> 实时战况
                 </h4>
                 
                 {/* Current Issue Stats */}
                 <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/50 mb-5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                       <Coins className="w-12 h-12 text-yellow-500" />
                    </div>
                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">
                       本期投入 (#{nextIssueNum})
                    </div>
                    <div className="text-2xl font-mono font-bold text-yellow-400">
                       {currentRoundStats.totalBet.toLocaleString()}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">
                       {currentRoundStats.count} 笔注单待结算
                    </div>
                 </div>

                 {/* Past Issues Report */}
                 <div>
                    <div className="text-xs text-slate-500 font-bold mb-2 uppercase flex justify-between px-1">
                       <span>近期战绩</span>
                       <span>盈亏</span>
                    </div>
                    <div className="space-y-2">
                      {battleReport.length === 0 ? (
                         <div className="text-center py-4 text-slate-600 text-xs bg-slate-900/30 rounded-lg">
                            暂无战绩
                         </div>
                      ) : (
                        battleReport.map(([issue, stats]) => (
                           <div key={issue} className="flex justify-between items-center p-2.5 rounded-lg bg-slate-900/40 border border-slate-700/30 hover:bg-slate-800/50 transition-colors">
                             <div className="flex flex-col gap-0.5">
                                <span className="text-xs font-mono text-slate-400">#{issue}</span>
                                <span className="text-xs text-slate-500">投: {stats.bet.toLocaleString()}</span>
                             </div>
                             <div className={`font-mono font-bold text-sm ${stats.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stats.profit > 0 ? '+' : ''}{stats.profit.toLocaleString()}
                             </div>
                           </div>
                        ))
                      )}
                    </div>
                 </div>
              </div>
  
            </div>
            
            {/* Full History Table */}
            <div className="lg:col-span-3">
               <HistoryTable history={history} />
            </div>
          </div>
        )}
        
      </main>

      <footer className="mt-12 py-6 text-center text-slate-600 text-sm border-t border-slate-800">
        <p>演示仅供参考。数据来源于 Tron Nile Testnet 公共节点。</p>
        <button 
          onClick={() => setView('admin')} 
          className="mt-4 text-slate-800 hover:text-slate-700 transition-colors text-xs"
        >
          [庄家管理入口]
        </button>
      </footer>
    </div>
  );
};

export default App;