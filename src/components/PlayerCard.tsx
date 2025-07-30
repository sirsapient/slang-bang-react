
import { useGame } from '../contexts/GameContext.jsx';
import { formatLargeCurrency } from '../game/utils.js';

export function PlayerCard() {
  const { state } = useGame();
  const cash = state.cash || 0;

  const heatLevel = state.heatLevel || 0;
  

  
  return (
    <div className="player-card">
      <div className="cash-display">
        <div className="cash-title" style={{ fontSize: 15, color: '#fff', fontWeight: 'bold', marginBottom: 2 }}>Cash</div>
        <div style={{ fontSize: 22, fontWeight: 'bold' }}>{formatLargeCurrency(cash)}</div>
      </div>
    </div>
  );
} 