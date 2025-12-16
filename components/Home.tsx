import React from 'react';
import { Gamepad2, Database, Zap, Percent, ShieldCheck, ArrowRight, Ban, Construction } from 'lucide-react';
import { GameConfig } from '../types';

interface Props {
  games: GameConfig[];
  onSelectGame: (gameId: string) => void;
  onOpenAdmin: () => void;
}

export const Home: React.FC<Props> = ({ games, onSelectGame, onOpenAdmin }) => {
  
  // Helper to get icon
  const getIcon = (id: string) => {
    switch(id) {
      case 'pc2.0': return <Gamepad2 className="w-8 h-8 text-white" />;
      case 'netdisk': return <Database className="w-8 h-8 text-white" />;
      case 'pure': return <Zap className="w-8 h-8 text-white" />;
      case 'full': return <Percent className="w-8 h-8 text-white" />;
      default: return <Gamepad2 className="w-8 h-8 text-white" />;
    }
  };

  const visibleGames = games.filter(g => g.status !== 'hidden');

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-red-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-5xl w-full z-10">
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl mx-auto flex items-center justify-center shadow-2xl mb-6 transform rotate-3 hover:rotate-6 transition-transform">
            <span className="text-4xl font-bold text-white font-mono">N</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            Nile <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">PC28</span> 娱乐城
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            基于 TRON Nile 测试网区块哈希的去中心化游戏平台。
            <br />
            数据透明，不可篡改，极速开奖。
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleGames.map((game) => (
            <button
              key={game.id}
              onClick={() => onSelectGame(game.id)}
              className="group relative bg-slate-800/50 border border-slate-700 rounded-2xl p-6 text-left hover:border-slate-500 transition-all hover:-translate-y-1 hover:shadow-2xl overflow-hidden flex flex-col h-full"
            >
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${game.color} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`}></div>
              
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${game.color} shadow-lg relative`}>
                  {getIcon(game.id)}
                  {game.status === 'maintenance' && (
                    <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1 border border-slate-900">
                      <Construction className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                {game.badge && game.status !== 'maintenance' && (
                  <span className="bg-white/10 text-white text-xs font-bold px-2 py-1 rounded-full border border-white/10">
                    {game.badge}
                  </span>
                )}
                 {game.status === 'maintenance' && (
                  <span className="bg-red-500/20 text-red-300 text-xs font-bold px-2 py-1 rounded-full border border-red-500/20">
                    维护暂停
                  </span>
                )}
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">{game.name}</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed flex-grow">
                {game.description}
              </p>
              
              <div className={`flex items-center text-sm font-bold transition-colors ${
                game.status === 'maintenance' ? 'text-slate-500' : 'text-indigo-400 group-hover:text-indigo-300'
              }`}>
                {game.status === 'maintenance' ? (
                  <>
                    <Ban className="w-4 h-4 mr-1" /> 暂停下注 (仅查询)
                  </>
                ) : (
                  <>
                    立即开始 <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </div>
            </button>
          ))}
        </div>

        <div className="mt-16 text-center">
          <button 
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-400 transition-colors text-sm px-4 py-2 rounded-full hover:bg-slate-800/50"
          >
            <ShieldCheck className="w-4 h-4" /> 庄家/管理员入口
          </button>
        </div>
      </div>
    </div>
  );
};