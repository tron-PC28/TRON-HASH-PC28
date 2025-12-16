import React from 'react';
import { GameResult } from '../types';
import { StatusBadge } from './StatusBadge';
import { ExternalLink, Hash } from 'lucide-react';
import { NILE_EXPLORER_URL } from '../constants';

interface Props {
  history: GameResult[];
}

export const HistoryTable: React.FC<Props> = ({ history }) => {
  return (
    <div className="bg-tron-card rounded-xl border border-slate-700 overflow-hidden shadow-lg mt-6">
      <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/50 flex items-center gap-2">
        <Hash className="w-4 h-4 text-slate-400" />
        <h3 className="font-semibold text-slate-200">往期记录 (近20期)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-800/30 text-slate-400">
            <tr>
              <th className="px-4 py-2">区块号</th>
              <th className="px-4 py-2">开奖时间</th>
              <th className="px-4 py-2">哈希值 (尾数)</th>
              <th className="px-4 py-2 text-center">计算公式</th>
              <th className="px-4 py-2 text-center">结果</th>
              <th className="px-4 py-2">属性</th>
              <th className="px-4 py-2">验证</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {history.map((game) => (
              <tr key={game.issue} className="hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-2 font-mono text-tron-green">#{game.issue}</td>
                <td className="px-4 py-2 text-slate-400">
                  {new Date(game.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-4 py-2 font-mono text-slate-500">
                  ...{game.hash.slice(-8)}
                </td>
                <td className="px-4 py-2 text-center">
                  <span className="text-slate-400">{game.sourceNumbers[0]} + {game.sourceNumbers[1]} + {game.sourceNumbers[2]} </span>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                    game.attributes.size === 'Big' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
                  }`}>
                    {game.sum}
                  </span>
                </td>
                <td className="px-4 py-2">
                  <StatusBadge result={game.attributes} />
                </td>
                <td className="px-4 py-2">
                  <a 
                    href={`${NILE_EXPLORER_URL}${game.issue}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    校验 <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  正在等待开奖数据...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};