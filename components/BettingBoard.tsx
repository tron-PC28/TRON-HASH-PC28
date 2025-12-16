import React, { useState, useMemo } from 'react';
import { BetType, Bet, BetOption } from '../types';
import { Coins, Trash2, X, Lock, Construction, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
  currentIssue: number;
  balance: number;
  onPlaceBet: (type: BetType, amount: number) => void;
  onClearBets: () => void;
  onCancelBetType: (type: BetType) => void;
  currentBets: Bet[];
  isLocked: boolean;
  isPaused?: boolean;
  oddsConfig: BetOption[];
  minBet: number; // New prop
  maxBet: number; // New prop
}

export const BettingBoard: React.FC<Props> = ({ currentIssue, balance, onPlaceBet, onClearBets, onCancelBetType, currentBets, isLocked, isPaused = false, oddsConfig, minBet, maxBet }) => {
  const [amount, setAmount] = useState<number>(100);

  const chips = [10, 50, 100, 500, 1000];
  // Basic validation for the input itself (single bet size)
  const isInputAmountValid = amount >= minBet && amount <= maxBet;

  const handleBetClick = (type: BetType) => {
    if (isLocked || isPaused) return;
    
    // 1. Calculate Existing Bets for this specific type
    const existingAmount = currentBets
      .filter(b => b.type === type)
      .reduce((sum, b) => sum + b.amount, 0);

    const newTotal = existingAmount + amount;

    // 2. Validation Checks
    if (amount < minBet) {
      alert(`单注最低下注金额为 ${minBet}`);
      return;
    }

    // Cumulative Check
    if (newTotal > maxBet) {
      const remaining = Math.max(0, maxBet - existingAmount);
      alert(`下注失败：超出限额！\n\n该玩法单期累计限额: ${maxBet}\n当前已投: ${existingAmount}\n本次尝试: ${amount}\n\n您剩余可投额度为: ${remaining}`);
      return;
    }

    if (balance < amount) {
      alert("余额不足!");
      return;
    }
    
    onPlaceBet(type, amount);
  };

  // Group bets by type for display
  const groupedBets = useMemo(() => {
    const groups: Record<string, { type: BetType, label: string, amount: number, odds: number }> = {};
    currentBets.forEach(bet => {
      if (!groups[bet.type]) {
        groups[bet.type] = {
          type: bet.type,
          label: bet.label,
          amount: 0,
          odds: bet.odds
        };
      }
      groups[bet.type].amount += bet.amount;
    });
    return Object.values(groups);
  }, [currentBets]);

  return (
    <div className="bg-tron-card rounded-xl border border-slate-700 shadow-lg p-4 md:p-6 mt-6 relative overflow-hidden">
      
      {/* Maintenance Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6 border border-slate-700 rounded-xl">
           <div className="bg-red-500/20 p-4 rounded-full mb-4">
             <Construction className="w-12 h-12 text-red-500" />
           </div>
           <h3 className="text-xl font-bold text-white mb-2">游戏维护中</h3>
           <p className="text-slate-400 max-w-sm">
             当前游戏已暂停下注，您可以查看历史记录，但无法进行新的投注。给您带来不便敬请谅解。
           </p>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Coins className="text-yellow-500" />
            开始投注
            <span className="text-sm font-normal text-slate-500 ml-2">
              (第 #{currentIssue} 期)
            </span>
          </h2>
          <div className="flex items-center gap-3 mt-1 h-6">
             <p className="text-slate-400 text-sm flex items-center gap-2">
               状态: 
               {isPaused ? (
                 <span className="text-red-500 font-bold">暂停</span>
               ) : isLocked ? (
                 <span className="text-red-500 font-bold">已封盘，等待开奖</span>
               ) : (
                 <span className="text-green-500 font-bold">开放投注</span>
               )}
             </p>
             
             {/* Global Cancel Button */}
             {currentBets.length > 0 && !isLocked && !isPaused && (
               <button 
                 onClick={onClearBets}
                 className="flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
               >
                 <Trash2 className="w-3 h-3" /> 全部撤销
               </button>
             )}
          </div>
        </div>
        
        <div className={clsx("flex flex-col sm:flex-row items-center gap-2", isPaused ? "opacity-30 pointer-events-none" : "")}>
          <div className="flex items-center bg-slate-900 rounded-lg p-1 border border-slate-700">
            {chips.map(chip => (
              <button
                key={chip}
                onClick={() => setAmount(chip)}
                className={clsx(
                  "px-3 py-1.5 rounded-md text-sm font-mono font-bold transition-all",
                  amount === chip 
                    ? "bg-indigo-600 text-white shadow-lg" 
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Custom Amount Input Area */}
          <div className={clsx(
            "flex items-center bg-slate-900 rounded-lg border p-1 relative group transition-colors",
            !isInputAmountValid ? "border-red-500 animate-pulse" : "border-slate-700 focus-within:border-indigo-500"
          )}>
            <span className="text-xs text-slate-500 px-2 font-semibold uppercase tracking-wider whitespace-nowrap">自定义</span>
            <input 
              type="number"
              value={amount}
              onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 0))}
              className={clsx(
                "bg-slate-800 text-white w-32 md:w-40 py-1 px-2 rounded text-right font-mono focus:outline-none focus:ring-1",
                !isInputAmountValid ? "focus:ring-red-500 text-red-400" : "focus:ring-indigo-500"
              )}
            />
          </div>
        </div>
      </div>

      <div className="mb-4 px-1 flex items-center justify-between text-xs">
         <div className="flex items-center gap-2 text-slate-500">
           <AlertCircle className="w-3 h-3" />
           <span>单项累计限额: <strong className="text-slate-300">{minBet} - {maxBet}</strong></span>
         </div>
         {!isInputAmountValid && (
           <span className="text-red-400 font-bold bg-red-500/10 px-2 py-0.5 rounded animate-bounce">
             单笔输入金额超出限制!
           </span>
         )}
      </div>

      <div className={clsx("grid grid-cols-2 md:grid-cols-4 gap-3", isPaused ? "opacity-50" : "")}>
        {oddsConfig.map((bt) => {
          // Check if user can afford or if limit is reached for this specific button
          const existing = groupedBets.find(g => g.type === bt.type)?.amount || 0;
          const wouldExceedLimit = existing + amount > maxBet;
          const isButtonDisabled = isLocked || isPaused || !isInputAmountValid;

          return (
            <button
              key={bt.type}
              disabled={isButtonDisabled}
              onClick={() => handleBetClick(bt.type)}
              className={clsx(
                "relative p-4 rounded-lg border-2 transition-all flex flex-col items-center justify-center group",
                isButtonDisabled 
                  ? "opacity-60 cursor-not-allowed border-slate-700 bg-slate-800" 
                  : wouldExceedLimit
                    ? "opacity-80 cursor-pointer border-orange-500/30 bg-orange-900/10 hover:border-orange-500" // Visual warning for limit
                    : "hover:-translate-y-1 hover:shadow-xl cursor-pointer bg-slate-800/50",
                
                // Normal Border Colors if not disabled
                !isButtonDisabled && !wouldExceedLimit && (
                  bt.type.includes('big') || bt.type === 'pair' || bt.type === 'leopard' 
                  ? "border-red-500/20 hover:border-red-500" 
                  : "border-blue-500/20 hover:border-blue-500"
                )
              )}
            >
              <span className="text-lg font-bold text-slate-200">{bt.label}</span>
              <span className="text-xs text-slate-400 font-mono mt-1">x{bt.odds.toFixed(2)}</span>
              
              {/* Show active bets on this tile */}
              {existing > 0 && (
                <div className={clsx(
                  "absolute -top-2 -right-2 font-bold text-xs px-2 py-1 rounded-full shadow-lg border",
                  existing >= maxBet ? "bg-red-500 text-white border-red-400" : "bg-yellow-500 text-black border-yellow-300"
                )}>
                  {existing >= maxBet ? "已满" : existing}
                </div>
              )}
              
              {/* Over Limit Warning Overlay on Hover */}
              {wouldExceedLimit && !isButtonDisabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <span className="text-xs font-bold text-orange-300">将超限额</span>
                </div>
              )}

              {/* Lock icon overlay for locked/paused state */}
              {(isLocked || isPaused) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 pointer-events-none">
                      <Lock className="w-4 h-4 text-slate-500 opacity-20" />
                  </div>
              )}
            </button>
          );
        })}
      </div>

      {groupedBets.length > 0 && (
        <div className="mt-6 pt-4 border-t border-slate-700">
           <div className="flex justify-between items-center mb-2">
             <h3 className="text-sm font-semibold text-slate-400">本期已投</h3>
             <span className="text-xs font-mono text-slate-500">
               总计: {currentBets.reduce((a,b) => a + b.amount, 0)}
             </span>
           </div>
           <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
             {groupedBets.map((betGroup) => (
               <div key={betGroup.type} className="flex justify-between items-center bg-slate-900/50 px-3 py-2 rounded border border-slate-800 hover:bg-slate-800 transition-colors">
                 <div className="flex items-center gap-2">
                   <span className="text-indigo-400 font-bold">{betGroup.label}</span>
                   <span className="text-slate-500 text-sm">@{betGroup.odds}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className={clsx("font-mono", betGroup.amount >= maxBet ? "text-red-400 font-bold" : "text-yellow-500")}>
                     {betGroup.amount} {betGroup.amount >= maxBet && "(满)"}
                   </div>
                   {!isLocked && !isPaused && (
                     <button 
                       onClick={() => onCancelBetType(betGroup.type)}
                       className="text-slate-500 hover:text-red-500 hover:bg-red-500/10 p-1 rounded transition-colors"
                       title={`撤销${betGroup.label}投注`}
                     >
                       <X className="w-4 h-4" />
                     </button>
                   )}
                 </div>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};