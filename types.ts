
export interface BlockData {
  blockID: string;
  block_header: {
    raw_data: {
      number: number;
      timestamp: number;
    };
  };
}

export interface GameResult {
  issue: number;
  hash: string;
  sourceNumbers: [number, number, number]; // The extracted A, B, C
  sum: number; // The result (0-27)
  attributes: ResultAttributes;
  timestamp: number;
}

export interface ResultAttributes {
  size: 'Big' | 'Small'; // Big >= 14, Small <= 13
  parity: 'Odd' | 'Even';
  isPair: boolean; // Source numbers has a pair (e.g. 8,8,1)
  isLeopard: boolean; // Source numbers are identical (e.g. 8,8,8)
  combo: string; // e.g., "Small Odd"
}

export interface Bet {
  id: string;
  type: BetType;
  label: string;
  amount: number;
  odds: number;
  status: 'pending' | 'won' | 'lost';
  issue: number;
  payout?: number; // Amount won (including returned stake)
  settledAt?: number; // Timestamp
  gameId: string; // Add gameId to track which game this bet belongs to
}

export type BetType = 'big' | 'small' | 'odd' | 'even' | 'big_odd' | 'big_even' | 'small_odd' | 'small_even' | 'pair' | 'leopard';

export interface BetOption {
  type: BetType;
  label: string;
  odds: number;
}

export type GameStatus = 'active' | 'maintenance' | 'hidden';

export interface GameConfig {
  id: string;
  name: string;
  description: string;
  color: string;
  badge: string | null;
  status: GameStatus;
  odds: BetOption[];
  minBet: number;
  maxBet: number;
  specialRulesEnabled: boolean; // Toggle for the 13/14 rule
  specialSingleOdds: number; // For Big/Small/Odd/Even when 13/14 (default 1.98)
  specialComboOdds: number; // For SmallOdd/BigEven when 13/14 (default 1.6)
}

export const DEFAULT_BET_TYPES: BetOption[] = [
  { type: 'big', label: '大', odds: 2.0 },
  { type: 'small', label: '小', odds: 2.0 },
  { type: 'odd', label: '单', odds: 2.0 },
  { type: 'even', label: '双', odds: 2.0 },
  { type: 'big_odd', label: '大单', odds: 3.8 },
  { type: 'big_even', label: '大双', odds: 3.8 },
  { type: 'small_odd', label: '小单', odds: 3.8 },
  { type: 'small_even', label: '小双', odds: 3.8 },
  { type: 'pair', label: '对子', odds: 3.0 },
  { type: 'leopard', label: '豹子', odds: 50.0 },
];

// Higher odds for "Full Odds" mode
export const HIGH_ODDS_BET_TYPES: BetOption[] = [
  { type: 'big', label: '大', odds: 2.05 },
  { type: 'small', label: '小', odds: 2.05 },
  { type: 'odd', label: '单', odds: 2.05 },
  { type: 'even', label: '双', odds: 2.05 },
  { type: 'big_odd', label: '大单', odds: 4.2 },
  { type: 'big_even', label: '大双', odds: 4.2 },
  { type: 'small_odd', label: '小单', odds: 4.2 },
  { type: 'small_even', label: '小双', odds: 4.2 },
  { type: 'pair', label: '对子', odds: 3.5 },
  { type: 'leopard', label: '豹子', odds: 60.0 },
];

export const DEFAULT_GAMES: GameConfig[] = [
  {
    id: 'pc2.0',
    name: 'Nile PC 2.0',
    description: '经典区块哈希玩法，实时开奖，公平公正',
    color: 'from-indigo-500 to-purple-600',
    badge: '热门',
    status: 'active',
    odds: DEFAULT_BET_TYPES,
    minBet: 10,
    maxBet: 50000,
    specialRulesEnabled: true,
    specialSingleOdds: 1.98,
    specialComboOdds: 1.6
  },
  {
    id: 'netdisk',
    name: '网盘 PC28',
    description: '基于云端存储哈希，超高赔率，极速体验',
    color: 'from-blue-500 to-cyan-600',
    badge: '新上线',
    status: 'active',
    odds: DEFAULT_BET_TYPES,
    minBet: 10,
    maxBet: 50000,
    specialRulesEnabled: true,
    specialSingleOdds: 1.98,
    specialComboOdds: 1.6
  },
  {
    id: 'pure',
    name: '纯流水 PC28',
    description: '零抽水，纯粹博弈，回归游戏本质',
    color: 'from-emerald-500 to-teal-600',
    badge: null,
    status: 'active',
    odds: DEFAULT_BET_TYPES,
    minBet: 10,
    maxBet: 50000,
    specialRulesEnabled: false, // Disabled by default for pure flow
    specialSingleOdds: 1.98,
    specialComboOdds: 1.6
  },
  {
    id: 'full',
    name: '满赔率 PC28',
    description: '全网最高赔率，挑战极限收益',
    color: 'from-orange-500 to-red-600',
    badge: '高爆',
    status: 'active',
    odds: HIGH_ODDS_BET_TYPES,
    minBet: 100, // Higher entry for high odds
    maxBet: 20000, // Lower max for high odds to control risk
    specialRulesEnabled: true,
    specialSingleOdds: 1.98,
    specialComboOdds: 1.6
  }
];
