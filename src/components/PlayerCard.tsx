
import { useGame } from '../contexts/GameContext.jsx';
import { formatLargeCurrency } from '../game/utils.js';
// @ts-ignore
import { gameData } from '../game/data/gameData';

export function PlayerCard() {
  const { state, getAssetSummary } = useGame();
  const cash = state.cash || 0;
  const currentCity = state.currentCity;
  const assetSummary = getAssetSummary();

  // Calculate current player rank
  const getCurrentRank = () => {
    const netWorth = (() => {
      let total = cash;
      const cityData = (gameData as any).cities[currentCity];
      const prices = cityData?.prices || {};
      for (const drug in state.inventory) {
        const qty = state.inventory[drug] || 0;
        const price = prices[drug] || 0;
        total += qty * price;
      }
      total += assetSummary.totalValue || 0;
      return total;
    })();
    
    const basesOwned = Object.keys(state.bases || {}).length;
    const gangSize = state.gangSize || 0;
    const assetValue = assetSummary.totalValue || 0;
    
    // Calculate number of leveled up bases (level > 1)
    const leveledBases = (() => {
      let count = 0;
      Object.values(state.bases || {}).forEach((cityBases: any) => {
        (cityBases as any[]).forEach((base: any) => {
          if (base.level && base.level > 1) count++;
        });
      });
      return count;
    })();
    
    let currentRank = 1;
    const playerRanks = (gameData as any).playerRanks;
    for (let rankId = 10; rankId >= 1; rankId--) {
      const rank = playerRanks[rankId];
      if (
        netWorth >= rank.minNetWorth &&
        basesOwned >= rank.minBases &&
        gangSize >= rank.minGang &&
        assetValue >= (rank.minAssets || 0) &&
        leveledBases >= (rank.minLeveledBases || 0)
      ) {
        currentRank = rankId;
        break;
      }
    }
    return currentRank;
  };

  const currentRank = getCurrentRank();
  const rankData = (gameData as any).playerRanks[currentRank];

  return (
    <div className="player-card">
      <div className="cash-display">
        <div className="cash-title" style={{ fontSize: 15, color: '#fff', fontWeight: 'bold', marginBottom: 2 }}>Cash</div>
        <div style={{ fontSize: 22, fontWeight: 'bold' }}>{formatLargeCurrency(cash)}</div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
          {rankData.emoji} {rankData.name} (Rank {currentRank})
        </div>
      </div>
    </div>
  );
} 