import React from 'react';
import { useGame } from '../contexts/GameContext.jsx';

export function PlayerCard() {
  const context = useGame();
  let cash = 0;
  let currentCity = 'Unknown';
  let heatLevel = 0;
  if (context) {
    const { state, gameState } = context;
    currentCity = state.currentCity || (gameState.data && gameState.data.currentCity) || 'Unknown';
    heatLevel = state.heat ?? 0;
    cash = state.cash ?? (gameState.data && gameState.data.cash) ?? 0;
  }
  
  const getHeatColor = () => {
    if (heatLevel < 20) return '#66ff66';
    if (heatLevel < 40) return '#ffff00';
    if (heatLevel < 70) return '#ff6600';
    return '#ff0000';
  };
  
  const getHeatText = () => {
    if (heatLevel < 20) return 'Low';
    if (heatLevel < 40) return 'Medium';
    if (heatLevel < 70) return 'High';
    return 'Critical';
  };
  
  return (
    <div className="player-card">
      <div className="cash-display">
        <div className="cash-title" style={{ fontSize: 15, color: '#fff', fontWeight: 'bold', marginBottom: 2 }}>Cash</div>
        <div style={{ fontSize: 22, fontWeight: 'bold' }}>${Math.floor(cash).toLocaleString()}</div>
      </div>
    </div>
  );
} 