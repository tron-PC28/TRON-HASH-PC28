import React, { useMemo, useState } from 'react';
import { Bet, GameConfig, GameResult } from '../types';
import { ArrowLeft, TrendingUp, TrendingDown, History as HistoryIcon, CircleDollarSign, Filter } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  history: Bet[];
  gameResults: GameResult[]; 
  gamesConfig: GameConfig[];
  onBack: () => void;
}

export const PlayerHistory: React.FC<Props> = ({ history, gameResults, gamesConfig, onBack }) => {
  const [filterGameId, setFilterGameId] = useState<string>('all');

  // Filter history based on selection
  const filteredHistory = useMemo(() => {
    return history.filter(bet => {
      if (filterGameId === 'all') return true;
      // Compatible handling: If gameId is missing (legacy data), treat as 'pc2.0'
      const betGameId = bet.gameId || 'pc2.0';
      return betGameId === filterGameId;
    });
  }, [history, filterGameId]);

  // Calculate Statistics based on FILTERED history
  const stats = useMemo(() => {
    const totalBets = filteredHistory.length;
    const totalWager = filteredHistory.reduce((acc, bet) => acc + bet.amount, 0);
    const totalPayout = filteredHistory.reduce((acc, bet) => acc + (bet.payout || 0), 0);
    const netProfit = totalPayout - totalWager;
    
    const winCount = filteredHistory.filter(h => h.status === 'won').length;
    const winRate = totalBets > 0 ? (winCount / totalBets) * 100 : 0;

    return { totalBets, totalWager, totalPayout, netProfit, winRate };
  }, [filteredHistory]);

  const getGameName = (gameId?: string) => {
    const targetId = gameId || 'pc2.0';
    return gamesConfig.find(g => g.id === targetId)?.name || '未知游戏';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Back Button and Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HistoryIcon className="text-indigo-500" /> 
            我的游戏记录
          </h2>
        </div>

        {/* Game Filter Dropdown */}
        <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-lg border border-slate-700">
           <div className="px-2 text-slate-400">
             <Filter className="w-4 h-4" />
           </div>
           <select 
             value={filterGameId}
             onChange={(e) => setFilterGameId(e.target.value)}
             className="bg-transparent text-sm text-white font-bold py-1 pr-8 focus:outline-none cursor-pointer"
           >
             <option value="all" className="bg-slate-800">全部游戏</option>
             {gamesConfig.map(game => (
               <option key={game.id} value={game.id} className="bg-slate-800">
                 {game.name}
               </option>
             ))}
           </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
             <CircleDollarSign className="w-3 h-3" /> 总投注额
          </div>
          <div className="text-xl font-mono font-bold text-white">
            {stats.totalWager.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
          <div className="text-slate-400 text-xs mb-1">总中奖额</div>
          <div className="text-xl font-mono font-bold text-yellow-400">
            {stats.totalPayout.toLocaleString()}
          </div>
        </div>

        <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700">
           <div className="text-slate-400 text-xs mb-1">胜率</div>
           <div className="text-xl font-mono font-bold text-blue-400">
             {stats.winRate.toFixed(1)}%
           </div>
        </div>

        <div className={clsx(
          "bg-slate-800/50 p-4 rounded-xl border",
          stats.netProfit >= 0 ? "border-green-500/30 bg-green-900/10" : "border-red-500/30 bg-red-900/10"
        )}>
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            {stats.netProfit >= 0 ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
            净盈亏
          </div>
          <div className={clsx(
            "text-xl font-mono font-bold",
            stats.netProfit >= 0 ? "text-green-400" : "text-red-400"
          )}>
            {stats.netProfit > 0 ? '+' : ''}{stats.netProfit.toLocaleString()}
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-tron-card rounded-xl border border-slate-700 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-800/30 text-slate-400 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3">游戏 / 期号</th>
                <th className="px-4 py-3">开奖结果</th>
                <th className="px-4 py-3">下注内容 (实赔)</th>
                <th className="px-4 py-3 text-right">投注金额</th>
                <th className="px-4 py-3 text-center">状态</th>
                <th className="px-4 py-3 text-right">盈亏变动</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    {filterGameId === 'all' ? '暂无游戏记录，快去下注吧！' : '该游戏暂无下注记录。'}
                  </td>
                </tr>
              ) : (
                filteredHistory.map((bet) => {
                   const profit = (bet.payout || 0) - bet.amount;
                   const gameName = getGameName(bet.gameId);
                   const resultData = gameResults.find(r => r.issue === bet.issue);
                   
                   // Calculate Effective Odds for display
                   let effectiveOdds = bet.odds;
                   if (bet.status === 'won' && bet.payout && bet.amount) {
                      effectiveOdds = parseFloat((bet.payout / bet.amount).toFixed(2));
                   }

                   return (
                    <tr key={bet.id} className="hover:bg-slate-700/20 transition-colors">
                      <td className="px-4 py-3">
                        <div className="text-xs text-indigo-300 font-bold mb-0.5">{gameName}</div>
                        <div className="font-mono text-slate-400">#{bet.issue}</div>
                      </td>
                      <td className="px-4 py-3">
                        {resultData ? (
                          <div className="flex items-center gap-2">
                             <span className={clsx(
                               "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                               resultData.attributes.size === 'Big' ? "bg-red-600" : "bg-blue-600"
                             )}>
                               {resultData.sum}
                             </span>
                             <span className="text-xs text-slate-500">
                               {resultData.attributes.combo}
                             </span>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600">等待开奖</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-slate-200">{bet.label}</span>
                        <span className={clsx("text-xs ml-1 font-mono", effectiveOdds !== bet.odds ? "text-yellow-400 font-bold" : "text-slate-500")}>
                          (@{effectiveOdds})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-300">
                        {bet.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-xs font-bold uppercase",
                          bet.status === 'won' ? "bg-green-500/20 text-green-400" : 
                          bet.status === 'lost' ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-400"
                        )}>
                          {bet.status === 'won' ? '赢' : bet.status === 'lost' ? '输' : '待'}
                        </span>
                      </td>
                      <td className={clsx(
                        "px-4 py-3 text-right font-mono font-bold",
                        profit >= 0 ? "text-green-400" : "text-red-400"
                      )}>
                        {profit > 0 ? '+' : ''}{profit.toLocaleString()}
                      </td>
                    </tr>
                   );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};