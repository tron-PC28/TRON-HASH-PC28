import React from 'react';
import { clsx } from 'clsx';
import { ResultAttributes } from '../types';

interface Props {
  result: ResultAttributes;
  className?: string;
}

export const StatusBadge: React.FC<Props> = ({ result, className }) => {
  return (
    <div className={clsx("flex gap-2 flex-wrap", className)}>
      <span className={clsx(
        "px-2 py-0.5 rounded text-xs font-bold",
        result.size === 'Big' ? "bg-red-500/20 text-red-400 border border-red-500/50" : "bg-blue-500/20 text-blue-400 border border-blue-500/50"
      )}>
        {result.size === 'Big' ? '大' : '小'}
      </span>
      <span className={clsx(
        "px-2 py-0.5 rounded text-xs font-bold",
        result.parity === 'Odd' ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/50" : "bg-purple-500/20 text-purple-400 border border-purple-500/50"
      )}>
        {result.parity === 'Odd' ? '单' : '双'}
      </span>
      {result.isPair && (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-green-500/20 text-green-400 border border-green-500/50">
          对子
        </span>
      )}
      {result.isLeopard && (
        <span className="px-2 py-0.5 rounded text-xs font-bold bg-pink-500/20 text-pink-400 border border-pink-500/50 animate-pulse">
          豹子
        </span>
      )}
    </div>
  );
};