import React from 'react';
import { X, BookOpen, AlertCircle, Coins, Zap } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameName: string;
  oddsConfig: { label: string; odds: number }[];
  minBet: number;
  maxBet: number;
  specialRulesEnabled: boolean;
  specialSingleOdds: number;
  specialComboOdds: number;
}

export const GameRules: React.FC<Props> = ({ 
  isOpen, 
  onClose, 
  gameName,
  oddsConfig, 
  minBet, 
  maxBet,
  specialRulesEnabled,
  specialSingleOdds,
  specialComboOdds
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-indigo-500" /> 【{gameName}】 游戏说明书
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-8 text-slate-300">
          
          <section>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <div className="w-1 h-6 bg-red-500 rounded-full"></div> 核心玩法
            </h3>
            <div className="space-y-3 text-sm leading-relaxed bg-slate-800/30 p-4 rounded-lg border border-slate-800">
              <p>1. 本游戏基于 <strong className="text-red-400">TRON Nile Testnet</strong> 区块哈希值进行开奖。</p>
              <p>2. 系统自动采集最新的区块哈希值。</p>
              <p>3. <strong className="text-white">算法：</strong>取哈希值中剔除字母后的最后 3 位数字。</p>
              <p className="pl-4 border-l-2 border-slate-600 text-slate-400 italic">
                例如：Hash ...8a3b9c... 过滤后取末尾 8, 3, 9。<br/>
                结果 = 8 + 3 + 9 = 20 (大, 双)
              </p>
            </div>
          </section>
          
          {specialRulesEnabled && (
            <section>
              <h3 className="text-lg font-bold text-indigo-400 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4" /> 特殊规则 (特码回水)
              </h3>
              <div className="bg-indigo-900/10 border border-indigo-500/30 p-4 rounded-lg text-sm space-y-2">
                 <p><span className="text-white font-bold">当开奖结果为 13 时：</span>属于“小”和“单”。此时投注“小”或“单”的中奖注单，赔率将自动调整为特殊赔率 (<span className="text-yellow-400 font-bold">{specialSingleOdds}</span>)，组合玩法(小单)赔率调整为 <span className="text-yellow-400 font-bold">{specialComboOdds}</span>。</p>
                 <p><span className="text-white font-bold">当开奖结果为 14 时：</span>属于“大”和“双”。此时投注“大”或“双”的中奖注单，赔率将自动调整为特殊赔率 (<span className="text-yellow-400 font-bold">{specialSingleOdds}</span>)，组合玩法(大双)赔率调整为 <span className="text-yellow-400 font-bold">{specialComboOdds}</span>。</p>
                 <p className="text-slate-400 text-xs mt-1">* 其他特殊形态（如对子、豹子）不受此规则影响，按原定高赔率结算。</p>
              </div>
            </section>
          )}

          <section>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <div className="w-1 h-6 bg-yellow-500 rounded-full"></div> 基础赔率表
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {oddsConfig.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded border border-slate-700">
                  <span className="font-bold text-white">{item.label}</span>
                  <span className="font-mono text-yellow-500 font-bold">1:{item.odds}</span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <div className="w-1 h-6 bg-blue-500 rounded-full"></div> 投注限额与规则
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                <span>单注最低下注：<strong className="text-white">{minBet}</strong> 金币</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                <span>单注最高下注：<strong className="text-white">{maxBet.toLocaleString()}</strong> 金币</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 text-blue-500 shrink-0" />
                <span>封盘时间：开奖前 <strong className="text-white">5</strong> 个区块停止下注。</span>
              </li>
            </ul>
          </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-800/30 text-center">
          <button 
            onClick={onClose}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-8 rounded-lg transition-colors"
          >
            我已知晓
          </button>
        </div>
      </div>
    </div>
  );
};