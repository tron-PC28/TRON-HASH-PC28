import React, { useState, useMemo, useEffect } from 'react';
import { Bet, BetOption, BetType, GameConfig, GameStatus } from '../types';
import { 
  ShieldCheck, 
  Lock, 
  LayoutDashboard, 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Wallet,
  ScrollText,
  Settings,
  Save,
  AlertCircle,
  Construction,
  Eye,
  EyeOff,
  CheckCircle2,
  ListFilter,
  CheckSquare,
  Square,
  Filter,
  CircleDollarSign,
  Coins,
  Zap,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  activeBets: Bet[];
  history: Bet[]; // All settled bets
  houseBalance: number;
  gamesConfig: GameConfig[];
  onUpdateGames: (newGames: GameConfig[]) => void;
  onBack: () => void;
}

export const AdminPanel: React.FC<Props> = ({ activeBets, history, houseBalance, gamesConfig, onUpdateGames, onBack }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'bets' | 'settings'>('dashboard');
  
  // Settings Tab State - Odds/Status
  const [selectedGameId, setSelectedGameId] = useState<string>(gamesConfig[0].id);
  const [localGamesConfig, setLocalGamesConfig] = useState<GameConfig[]>(gamesConfig);

  // Settings Tab State - Limits
  const [limitMin, setLimitMin] = useState<number>(10);
  const [limitMax, setLimitMax] = useState<number>(50000);
  // Initialize with ALL games selected by default for better UX
  const [limitTargetGames, setLimitTargetGames] = useState<string[]>(gamesConfig.map(g => g.id));

  // Bets History Tab State - Filter
  const [historyFilterGameId, setHistoryFilterGameId] = useState<string>('all');

  // Sync props to local state if they change externally
  useEffect(() => {
    setLocalGamesConfig(gamesConfig);
    // Reset selection to all games when config reloads to ensure ID validity, 
    // or keep it if you prefer persistence. Here we reset for safety.
    setLimitTargetGames(gamesConfig.map(g => g.id));
  }, [gamesConfig]);

  const selectedGame = localGamesConfig.find(g => g.id === selectedGameId) || localGamesConfig[0];

  // Login Logic
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '8888') { // Simple mock password
      setIsAuthenticated(true);
    } else {
      alert('密码错误 (提示: 8888)');
    }
  };

  const handleSaveConfig = () => {
    onUpdateGames(localGamesConfig);
    alert('游戏配置已保存生效!');
  };

  const handleOddsChange = (gameId: string, type: BetType, value: string) => {
    const numVal = parseFloat(value);
    setLocalGamesConfig(prev => prev.map(game => {
      if (game.id !== gameId) return game;
      const newOdds = game.odds.map(item => 
        item.type === type ? { ...item, odds: isNaN(numVal) ? 0 : numVal } : item
      );
      return { ...game, odds: newOdds };
    }));
  };

  const handleStatusChange = (gameId: string, status: GameStatus) => {
    setLocalGamesConfig(prev => prev.map(game => 
      game.id === gameId ? { ...game, status } : game
    ));
  };
  
  // Handle Toggle for Special Rules
  const toggleSpecialRules = (gameId: string) => {
    setLocalGamesConfig(prev => prev.map(game => 
      game.id === gameId ? { ...game, specialRulesEnabled: !game.specialRulesEnabled } : game
    ));
  };

  // Handle Special Odds Values
  const handleSpecialOddsConfigChange = (gameId: string, field: 'specialSingleOdds' | 'specialComboOdds', value: string) => {
    const numVal = parseFloat(value);
    setLocalGamesConfig(prev => prev.map(game => 
      game.id === gameId ? { ...game, [field]: isNaN(numVal) ? 0 : numVal } : game
    ));
  };

  // Limit Management Logic
  const toggleLimitTarget = (gameId: string) => {
    setLimitTargetGames(prev => 
      prev.includes(gameId) ? prev.filter(id => id !== gameId) : [...prev, gameId]
    );
  };

  const toggleAllLimitTargets = () => {
    if (limitTargetGames.length === localGamesConfig.length) {
      setLimitTargetGames([]);
    } else {
      setLimitTargetGames(localGamesConfig.map(g => g.id));
    }
  };

  const applyLimits = () => {
    if (limitTargetGames.length === 0) {
      alert("请至少选择一个游戏来应用限额设置。");
      return;
    }
    if (limitMin < 0 || limitMax < limitMin) {
      alert("限额设置无效，请检查数值。");
      return;
    }

    // Calculate new config
    const newConfig = localGamesConfig.map(game => {
      if (limitTargetGames.includes(game.id)) {
        return { ...game, minBet: limitMin, maxBet: limitMax };
      }
      return game;
    });

    // Update LOCAL state
    setLocalGamesConfig(newConfig);
    
    // Update GLOBAL state immediately
    onUpdateGames(newConfig);

    alert(`成功！限额配置已立即更新至 ${limitTargetGames.length} 个游戏。`);
  };

  // Global Dashboard Stats
  const dashboardStats = useMemo(() => {
    const totalTurnover = history.reduce((acc, bet) => acc + bet.amount, 0); 
    const totalPayout = history.reduce((acc, bet) => acc + (bet.payout || 0), 0); 
    const netProfit = totalTurnover - totalPayout; 
    
    const houseWinRate = totalTurnover > 0 ? (netProfit / totalTurnover) * 100 : 0;
    
    const currentExposure = activeBets.reduce((acc, bet) => acc + bet.amount, 0);
    const maxPotentialPayout = activeBets.reduce((acc, bet) => acc + (bet.amount * bet.odds), 0);

    return { totalTurnover, totalPayout, netProfit, houseWinRate, currentExposure, maxPotentialPayout };
  }, [history, activeBets]);

  // Filtered History Stats (For Bets Tab)
  const filteredHistory = useMemo(() => {
    return history.filter(bet => {
      if (historyFilterGameId === 'all') return true;
      // Handle missing gameId in legacy data
      const betGameId = bet.gameId || 'pc2.0';
      return betGameId === historyFilterGameId;
    });
  }, [history, historyFilterGameId]);

  const historyStats = useMemo(() => {
    const count = filteredHistory.length;
    const turnover = filteredHistory.reduce((acc, bet) => acc + bet.amount, 0);
    const payout = filteredHistory.reduce((acc, bet) => acc + (bet.payout || 0), 0);
    const housePnL = turnover - payout;
    const houseWinRate = turnover > 0 ? (housePnL / turnover) * 100 : 0;
    
    return { count, turnover, payout, housePnL, houseWinRate };
  }, [filteredHistory]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
        <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-md">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-white">庄家管理系统</h2>
            <p className="text-slate-500 text-sm mt-2">请输入管理员密码以继续</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码 (8888)"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors text-center tracking-widest text-lg"
              autoFocus
            />
            <button 
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg transition-colors"
            >
              解锁后台
            </button>
            <button 
              type="button"
              onClick={onBack}
              className="w-full text-slate-500 text-sm hover:text-slate-300 py-2"
            >
              返回游戏
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8 bg-slate-800/50 p-4 rounded-xl border border-slate-700">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <ShieldCheck className="text-green-500" /> 
               运营监控中心
             </h2>
             <p className="text-xs text-slate-500 font-mono mt-1">SYSTEM STATUS: ONLINE | NILE TESTNET</p>
          </div>
        </div>
        
        <div className="flex gap-2 bg-slate-900/80 p-1 rounded-lg border border-slate-700 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={clsx(
              "px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'dashboard' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <LayoutDashboard className="w-4 h-4" /> 概览
          </button>
          <button 
            onClick={() => setActiveTab('bets')}
            className={clsx(
              "px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'bets' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <ScrollText className="w-4 h-4" /> 注单流水
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={clsx(
              "px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === 'settings' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-white"
            )}
          >
            <Settings className="w-4 h-4" /> 游戏设置
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* House Balance */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Wallet className="w-16 h-16 text-indigo-500" />
               </div>
               <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">庄家资金池</div>
               <div className="text-2xl font-mono font-bold text-white">
                 {houseBalance.toLocaleString()}
               </div>
               <div className="mt-2 text-xs text-green-400 flex items-center gap-1">
                 <ShieldCheck className="w-3 h-3" /> 资金安全
               </div>
            </div>

            {/* Net Profit */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 {dashboardStats.netProfit >= 0 ? <TrendingUp className="w-16 h-16 text-green-500" /> : <TrendingDown className="w-16 h-16 text-red-500" />}
               </div>
               <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">累计净盈利 (P&L)</div>
               <div className={clsx(
                 "text-2xl font-mono font-bold",
                 dashboardStats.netProfit >= 0 ? "text-green-400" : "text-red-400"
               )}>
                 {dashboardStats.netProfit > 0 ? '+' : ''}{dashboardStats.netProfit.toLocaleString()}
               </div>
               <div className="mt-2 text-xs text-slate-500">
                 总流水: {dashboardStats.totalTurnover.toLocaleString()}
               </div>
            </div>

            {/* House Edge / Win Rate */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
               <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">庄家杀率 (Win Rate)</div>
               <div className="text-2xl font-mono font-bold text-blue-400">
                 {dashboardStats.houseWinRate.toFixed(2)}%
               </div>
               <div className="w-full bg-slate-700 h-1.5 mt-3 rounded-full overflow-hidden">
                 <div className="bg-blue-500 h-full" style={{ width: `${Math.max(0, Math.min(100, dashboardStats.houseWinRate))}%` }}></div>
               </div>
               <div className="mt-2 text-xs text-slate-500">
                 理论期望值: ~2.5%
               </div>
            </div>

            {/* Current Exposure */}
            <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
               <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">当前风险敞口</div>
               <div className="text-2xl font-mono font-bold text-yellow-400">
                 {dashboardStats.currentExposure.toLocaleString()}
               </div>
               <div className="mt-2 text-xs text-red-400 flex items-center gap-1">
                 <AlertTriangle className="w-3 h-3" /> 最大赔付: {dashboardStats.maxPotentialPayout.toLocaleString()}
               </div>
            </div>
          </div>

          {/* Current Active Round Panel */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ScrollText className="w-5 h-5 text-indigo-400" />
              当前期盘口监控
            </h3>
            {activeBets.length === 0 ? (
              <div className="text-slate-500 text-center py-8 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                当前无活跃注单
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-900 text-slate-400 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3">注单ID</th>
                      <th className="px-4 py-3">游戏</th>
                      <th className="px-4 py-3">玩法</th>
                      <th className="px-4 py-3 text-right">下注金额</th>
                      <th className="px-4 py-3 text-right">赔率</th>
                      <th className="px-4 py-3 text-right text-red-400">潜在赔付</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700 bg-slate-900/30">
                    {activeBets.map(bet => {
                      const gameName = gamesConfig.find(g => g.id === bet.gameId)?.name || '未知';
                      return (
                        <tr key={bet.id}>
                          <td className="px-4 py-2 font-mono text-slate-500 text-xs">{bet.id}</td>
                          <td className="px-4 py-2 text-slate-400 text-xs">{gameName}</td>
                          <td className="px-4 py-2 text-white font-bold">{bet.label}</td>
                          <td className="px-4 py-2 text-right font-mono text-yellow-400">{bet.amount}</td>
                          <td className="px-4 py-2 text-right font-mono">x{bet.odds}</td>
                          <td className="px-4 py-2 text-right font-mono text-red-400">{(bet.amount * bet.odds).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-800 font-bold text-slate-200">
                     <tr>
                       <td colSpan={3} className="px-4 py-3 text-right">总计:</td>
                       <td className="px-4 py-3 text-right text-yellow-500">{dashboardStats.currentExposure}</td>
                       <td></td>
                       <td className="px-4 py-3 text-right text-red-500">{dashboardStats.maxPotentialPayout}</td>
                     </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'bets' ? (
        /* Bets History Tab */
        <div className="space-y-6">
           {/* Filter & Summary Section */}
           <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 md:p-6">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
               <h3 className="font-bold text-white flex items-center gap-2">
                 <ListFilter className="w-5 h-5 text-indigo-400" />
                 历史报表查询
               </h3>
               
               {/* Game Filter */}
               <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-700">
                 <div className="px-3 text-slate-400 flex items-center gap-2 border-r border-slate-700 pr-3">
                   <Filter className="w-4 h-4" />
                   <span className="text-xs font-bold uppercase">Filter</span>
                 </div>
                 <select 
                   value={historyFilterGameId}
                   onChange={(e) => setHistoryFilterGameId(e.target.value)}
                   className="bg-transparent text-sm text-white font-bold py-1.5 px-3 focus:outline-none cursor-pointer"
                 >
                   <option value="all" className="bg-slate-800">全部游戏汇总</option>
                   {gamesConfig.map(game => (
                     <option key={game.id} value={game.id} className="bg-slate-800">
                       {game.name}
                     </option>
                   ))}
                 </select>
               </div>
             </div>

             {/* Summary Cards based on Filter */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                 <div className="text-slate-500 text-xs mb-1">总注单数</div>
                 <div className="text-xl font-mono font-bold text-white">{historyStats.count}</div>
               </div>
               
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                 <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                    <CircleDollarSign className="w-3 h-3" /> 总流水 (Turnover)
                 </div>
                 <div className="text-xl font-mono font-bold text-blue-300">{historyStats.turnover.toLocaleString()}</div>
               </div>

               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                 <div className="text-slate-500 text-xs mb-1">玩家总盈利 (Payout)</div>
                 <div className="text-xl font-mono font-bold text-yellow-400">{historyStats.payout.toLocaleString()}</div>
               </div>

               <div className={clsx(
                 "p-4 rounded-lg border bg-slate-900/50",
                 historyStats.housePnL >= 0 ? "border-green-500/30" : "border-red-500/30"
               )}>
                 <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                    {historyStats.housePnL >= 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                    庄家净盈亏 (P&L)
                 </div>
                 <div className={clsx(
                   "text-xl font-mono font-bold",
                   historyStats.housePnL >= 0 ? "text-green-400" : "text-red-400"
                 )}>
                   {historyStats.housePnL > 0 ? '+' : ''}{historyStats.housePnL.toLocaleString()}
                 </div>
               </div>
             </div>
           </div>

           {/* Table */}
           <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="bg-slate-900 text-slate-400 text-xs uppercase">
                   <tr>
                     <th className="px-4 py-3">结算时间</th>
                     <th className="px-4 py-3">期号</th>
                     <th className="px-4 py-3">游戏</th>
                     <th className="px-4 py-3">内容</th>
                     <th className="px-4 py-3 text-right">玩家投注</th>
                     <th className="px-4 py-3 text-right">玩家盈利</th>
                     <th className="px-4 py-3 text-center">状态</th>
                     <th className="px-4 py-3 text-right">庄家损益</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-700">
                   {filteredHistory.map(bet => {
                     const housePnL = bet.amount - (bet.payout || 0);
                     const targetGameId = bet.gameId || 'pc2.0';
                     const gameName = gamesConfig.find(g => g.id === targetGameId)?.name || '未知';
                     return (
                       <tr key={bet.id} className="hover:bg-slate-700/30 transition-colors">
                         <td className="px-4 py-2 text-slate-500 font-mono text-xs">
                           {bet.settledAt ? new Date(bet.settledAt).toLocaleTimeString() : '-'}
                         </td>
                         <td className="px-4 py-2 font-mono text-slate-300">#{bet.issue}</td>
                         <td className="px-4 py-2 text-slate-400 text-xs">{gameName}</td>
                         <td className="px-4 py-2">
                           <span className="text-slate-200 font-bold">{bet.label}</span>
                           <span className="text-xs text-slate-500 ml-1">@{bet.odds}</span>
                         </td>
                         <td className="px-4 py-2 text-right font-mono text-slate-300">{bet.amount}</td>
                         <td className="px-4 py-2 text-right font-mono text-yellow-500">{bet.payout || 0}</td>
                         <td className="px-4 py-2 text-center">
                           {bet.status === 'won' ? (
                             <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">玩家赢</span>
                           ) : (
                             <span className="text-xs bg-green-500/10 text-green-400 px-2 py-0.5 rounded border border-green-500/20">庄家杀</span>
                           )}
                         </td>
                         <td className={clsx(
                           "px-4 py-2 text-right font-mono font-bold",
                           housePnL >= 0 ? "text-green-400" : "text-red-400"
                         )}>
                           {housePnL > 0 ? '+' : ''}{housePnL}
                         </td>
                       </tr>
                     )
                   })}
                   {filteredHistory.length === 0 && (
                     <tr><td colSpan={8} className="text-center py-8 text-slate-500">
                        {historyFilterGameId === 'all' ? '暂无任何历史数据' : '该游戏暂无注单记录'}
                     </td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>
        </div>
      ) : (
        /* Settings Tab */
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden p-6 max-w-4xl mx-auto space-y-12">
          
          <div className="flex justify-between items-center border-b border-slate-700 pb-4">
             <h3 className="text-2xl font-bold text-white flex items-center gap-2">
               <Settings className="w-6 h-6 text-indigo-400" /> 游戏参数配置
             </h3>
             <button 
               onClick={handleSaveConfig}
               className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5"
             >
               <Save className="w-4 h-4" /> 保存其他设置
             </button>
          </div>

          {/* Section 1: Limits Management (New) */}
          <div className="bg-slate-900/30 p-6 rounded-xl border border-slate-700">
             <h4 className="text-lg text-slate-200 font-bold mb-4 flex items-center gap-2">
               <ListFilter className="w-5 h-5 text-yellow-500" /> 投注限额管理
             </h4>
             <div className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-slate-400 uppercase font-bold">单注最低额 (Min)</label>
                    <input 
                      type="number" 
                      value={limitMin}
                      onChange={(e) => setLimitMin(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-slate-400 uppercase font-bold">单注最高额 (Max)</label>
                    <input 
                      type="number" 
                      value={limitMax}
                      onChange={(e) => setLimitMax(parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <button 
                    onClick={applyLimits}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded font-bold h-[42px] transition-colors shadow-lg hover:shadow-indigo-500/20"
                  >
                    应用并生效
                  </button>
                </div>

                <div className="pt-4 border-t border-slate-700/50">
                   <label className="text-sm text-slate-400 mb-3 block">选择应用范围:</label>
                   <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={toggleAllLimitTargets}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg border text-sm font-bold flex items-center gap-2 transition-all",
                          limitTargetGames.length === localGamesConfig.length 
                           ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" 
                           : "bg-slate-800 border-slate-600 text-slate-400"
                        )}
                      >
                         {limitTargetGames.length === localGamesConfig.length ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                         全选
                      </button>
                      {localGamesConfig.map(game => (
                        <button
                          key={game.id}
                          onClick={() => toggleLimitTarget(game.id)}
                          className={clsx(
                            "px-3 py-1.5 rounded-lg border text-sm font-bold flex items-center gap-2 transition-all",
                            limitTargetGames.includes(game.id)
                             ? "bg-indigo-500/20 border-indigo-500 text-indigo-400" 
                             : "bg-slate-800 border-slate-600 text-slate-400"
                          )}
                        >
                           {limitTargetGames.includes(game.id) ? <CheckSquare className="w-4 h-4"/> : <Square className="w-4 h-4"/>}
                           {game.name}
                        </button>
                      ))}
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Section 2: Game Selector for Details */}
            <div className="lg:col-span-2">
              <label className="text-slate-400 text-sm font-bold mb-2 block uppercase tracking-wider">选择要编辑状态或赔率的游戏</label>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {localGamesConfig.map(game => (
                  <button
                    key={game.id}
                    onClick={() => setSelectedGameId(game.id)}
                    className={clsx(
                      "px-4 py-2 rounded-lg border text-sm font-bold transition-all whitespace-nowrap",
                      selectedGameId === game.id 
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg" 
                        : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    )}
                  >
                    {game.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Status Config */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 h-full">
               <h4 className="text-slate-200 font-bold mb-4 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-orange-400" /> 状态控制 - {selectedGame.name}
               </h4>
               <div className="grid grid-cols-1 gap-4">
                  <button 
                    onClick={() => handleStatusChange(selectedGame.id, 'active')}
                    className={clsx(
                      "p-4 rounded-xl border flex items-center gap-4 transition-all text-left",
                      selectedGame.status === 'active' 
                        ? "bg-green-500/10 border-green-500 text-green-400" 
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:border-green-500/50"
                    )}
                  >
                    <CheckCircle2 className="w-8 h-8 shrink-0" />
                    <div>
                      <div className="font-bold">正常运营</div>
                      <div className="text-xs opacity-70">玩家可正常下注</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleStatusChange(selectedGame.id, 'maintenance')}
                    className={clsx(
                      "p-4 rounded-xl border flex items-center gap-4 transition-all text-left",
                      selectedGame.status === 'maintenance' 
                        ? "bg-orange-500/10 border-orange-500 text-orange-400" 
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:border-orange-500/50"
                    )}
                  >
                    <Construction className="w-8 h-8 shrink-0" />
                    <div>
                      <div className="font-bold">暂停/维护</div>
                      <div className="text-xs opacity-70">允许访问但禁止下注</div>
                    </div>
                  </button>

                  <button 
                    onClick={() => handleStatusChange(selectedGame.id, 'hidden')}
                    className={clsx(
                      "p-4 rounded-xl border flex items-center gap-4 transition-all text-left",
                      selectedGame.status === 'hidden' 
                        ? "bg-red-500/10 border-red-500 text-red-400" 
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:border-red-500/50"
                    )}
                  >
                    <EyeOff className="w-8 h-8 shrink-0" />
                    <div>
                      <div className="font-bold">下架隐藏</div>
                      <div className="text-xs opacity-70">主页不再显示此游戏</div>
                    </div>
                  </button>
               </div>
               
               <div className="mt-6 pt-6 border-t border-slate-700">
                  <h5 className="text-slate-400 text-xs font-bold uppercase mb-2">当前限额</h5>
                  <div className="flex justify-between items-center bg-slate-900 px-4 py-2 rounded font-mono text-sm">
                    <span className="text-slate-500">Min: {selectedGame.minBet}</span>
                    <span className="text-slate-500">Max: {selectedGame.maxBet}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">* 如需修改限额，请使用上方的批量限额管理工具。</p>
               </div>
            </div>

            {/* Section 4: Odds Config */}
            <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 h-full">
              <h4 className="text-slate-200 font-bold mb-4 flex items-center gap-2">
                 <TrendingUp className="w-4 h-4 text-indigo-400" /> 
                 赔率设置 - {selectedGame.name}
               </h4>
              
              {/* Special Odds Config (13/14) */}
              <div className="mb-6 bg-indigo-900/20 p-4 rounded-lg border border-indigo-500/30">
                 <div className="flex justify-between items-start mb-4">
                   <h5 className="text-indigo-300 text-xs font-bold uppercase flex items-center gap-2">
                      <Zap className="w-3 h-3" /> 特殊号赔率 (特码回水)
                   </h5>
                   <button 
                     onClick={() => toggleSpecialRules(selectedGame.id)}
                     className={clsx(
                       "flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full border transition-all",
                       selectedGame.specialRulesEnabled 
                         ? "bg-green-500/20 text-green-400 border-green-500/50" 
                         : "bg-slate-800 text-slate-500 border-slate-600"
                     )}
                   >
                     {selectedGame.specialRulesEnabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                     {selectedGame.specialRulesEnabled ? "已启用" : "已禁用"}
                   </button>
                 </div>
                 
                 {selectedGame.specialRulesEnabled ? (
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">单项赔率 (13小单/14大双)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={selectedGame.specialSingleOdds}
                          onChange={(e) => handleSpecialOddsConfigChange(selectedGame.id, 'specialSingleOdds', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 text-white rounded px-2 py-1.5 font-mono text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">组合赔率 (小单/大双)</label>
                        <input 
                          type="number" 
                          step="0.01"
                          value={selectedGame.specialComboOdds}
                          onChange={(e) => handleSpecialOddsConfigChange(selectedGame.id, 'specialComboOdds', e.target.value)}
                          className="w-full bg-slate-800 border border-slate-600 text-white rounded px-2 py-1.5 font-mono text-sm focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                   </div>
                 ) : (
                   <div className="text-xs text-slate-500 bg-slate-900/50 p-2 rounded text-center">
                     特殊值规则已禁用，将按照下方常规赔率表执行。
                   </div>
                 )}
                 <p className="text-[10px] text-slate-500 mt-3 leading-relaxed">
                   * <strong className="text-slate-400">结果13:</strong> 小、单 按 <span className="text-white">{selectedGame.specialSingleOdds}</span> 结算; 小单组合 按 <span className="text-white">{selectedGame.specialComboOdds}</span> 结算。<br/>
                   * <strong className="text-slate-400">结果14:</strong> 大、双 按 <span className="text-white">{selectedGame.specialSingleOdds}</span> 结算; 大双组合 按 <span className="text-white">{selectedGame.specialComboOdds}</span> 结算。<br/>
                   * 其他形态（如对子、豹子）不受影响。
                 </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedGame.odds.map((item) => (
                  <div key={item.type} className="bg-slate-800 p-3 rounded-lg border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-10 text-slate-400 font-bold">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500">1 :</span>
                      <input 
                        type="number" 
                        step="0.01"
                        value={item.odds}
                        onChange={(e) => handleOddsChange(selectedGame.id, item.type, e.target.value)}
                        className="w-20 bg-slate-900 border border-slate-600 text-white rounded px-2 py-1 text-right font-mono focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};