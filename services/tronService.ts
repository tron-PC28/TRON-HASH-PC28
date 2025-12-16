import { NILE_NODE_URL, BIG_THRESHOLD } from '../constants';
import { BlockData, GameResult, ResultAttributes } from '../types';

export const fetchLatestBlock = async (): Promise<BlockData | null> => {
  try {
    const response = await fetch(`${NILE_NODE_URL}/wallet/getnowblock`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: BlockData = await response.json();
    if (!data.blockID) {
      return null;
    }
    return data;
  } catch (error) {
    console.error('Failed to fetch block:', error);
    return null;
  }
};

export const fetchBlockByNumber = async (num: number): Promise<BlockData | null> => {
  try {
    const response = await fetch(`${NILE_NODE_URL}/wallet/getblockbynum`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ num }),
    });
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data: BlockData = await response.json();
    if (!data.blockID) {
      return null;
    }
    return data;
  } catch (error) {
    console.error(`Failed to fetch block #${num}:`, error);
    return null;
  }
};

/**
 * Implements the specific PC28 algorithm requested:
 * 1. Filter out letters from Hash
 * 2. Take last 3 digits
 * 3. Sum them up
 */
export const calculateResultFromHash = (block: BlockData): GameResult => {
  const hash = block.blockID;
  const blockNum = block.block_header.raw_data.number;
  
  // 1. Filter out all non-digit characters
  const digitsOnly = hash.replace(/\D/g, '');
  
  // 2. Take the last 3 digits. 
  // Fallback: If for some rare reason hash has < 3 digits, pad with 0
  const cleanDigits = digitsOnly.padStart(3, '0'); 
  const lastThreeStr = cleanDigits.slice(-3);
  
  // Convert to numbers
  const nums = lastThreeStr.split('').map(Number) as [number, number, number];
  const [a, b, c] = nums;
  
  // 3. Sum
  const sum = a + b + c;

  // Determine attributes
  const isBig = sum >= BIG_THRESHOLD;
  const isEven = sum % 2 === 0;
  
  const isLeopard = a === b && b === c; // 3 same
  const isPair = !isLeopard && (a === b || b === c || a === c); // 2 same

  const attributes: ResultAttributes = {
    size: isBig ? 'Big' : 'Small',
    parity: isEven ? 'Even' : 'Odd',
    isPair,
    isLeopard,
    combo: `${isBig ? '大' : '小'}${isEven ? '双' : '单'}`
  };

  return {
    issue: blockNum,
    hash,
    sourceNumbers: nums,
    sum,
    attributes,
    timestamp: block.block_header.raw_data.timestamp
  };
};