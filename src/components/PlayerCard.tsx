import React from 'react';
import { useCash, useCurrentCity, useHeatLevel } from '../contexts/GameContext';

export function PlayerCard() {
  const cash = useCash();
  const currentCity = useCurrentCity();
  const heatLevel = useHeatLevel();
  
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
        ${cash.toLocaleString()}
      </div>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-label">Location</div>
          <div className="stat-value">{currentCity}</div>
        </div>
        <div className="stat-item">
          <div className="stat-label">Heat</div>
          <div className="stat-value" style={{ color: getHeatColor() }}>
            {getHeatText()}
          </div>
          <div className="heat-meter">
            <div 
              className="heat-bar"
              style={{ 
                width: `${heatLevel}%`,
                background: getHeatColor()
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 