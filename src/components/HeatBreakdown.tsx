import React from 'react';
import { useGame } from '../contexts/GameContext';

interface HeatBreakdownProps {
  showDetails?: boolean;
}

export default function HeatBreakdown({ showDetails = false }: HeatBreakdownProps) {
  const { calculateHeatLevel, getHeatBreakdown } = useGame();
  
  const heatLevel = calculateHeatLevel();
  const breakdown = getHeatBreakdown();
  
  const getHeatColor = (level: number) => {
    if (level >= 80) return '#ff0000';
    if (level >= 60) return '#ff6600';
    if (level >= 40) return '#ffaa00';
    if (level >= 20) return '#ffff00';
    return '#66ff66';
  };
  
  const getHeatText = (level: number) => {
    if (level >= 90) return 'CRITICAL';
    if (level >= 80) return 'EXTREME';
    if (level >= 70) return 'HIGH';
    if (level >= 50) return 'MODERATE';
    if (level >= 30) return 'ELEVATED';
    return 'LOW';
  };
  
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #444',
      borderRadius: '8px',
      padding: '15px',
      marginBottom: '15px'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: showDetails ? '10px' : '0'
      }}>
        <div style={{ fontSize: '14px', color: '#aaa' }}>
          🔥 Heat Level
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: 'bold',
          color: getHeatColor(heatLevel)
        }}>
          {getHeatText(heatLevel)} ({Math.round(heatLevel)}%)
        </div>
      </div>
      
      {showDetails && (
        <div style={{ fontSize: '12px', color: '#ccc' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Warrant Heat:</span>
              <span>{breakdown.warrantHeat}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Time Heat:</span>
              <span>{breakdown.timeHeat}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Raid Activity:</span>
              <span>{breakdown.gangRetaliationHeat}%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Base/Gang Heat:</span>
              <span>{breakdown.baseGangHeat}%</span>
            </div>
          </div>
          
          {breakdown.breakdown.baseHeatDetails.length > 0 && (
            <div style={{ marginTop: '8px', padding: '8px', background: '#222', borderRadius: '4px' }}>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Base Heat Sources:</div>
              {breakdown.breakdown.baseHeatDetails.map((detail, index) => (
                <div key={index} style={{ fontSize: '10px', color: '#ccc', marginBottom: '2px' }}>
                  {detail.city} (Level {detail.level}): {detail.totalHeat}%
                  {detail.fortressBonus > 0 && ` (+${detail.fortressBonus}% Drug Fortress)`}
                </div>
              ))}
            </div>
          )}
          
          <div style={{ marginTop: '8px', padding: '8px', background: '#222', borderRadius: '4px' }}>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px' }}>Gang Heat:</div>
            <div style={{ fontSize: '10px', color: '#ccc' }}>
              {breakdown.breakdown.gangHeat.totalMembers} members: {breakdown.breakdown.gangHeat.totalHeat}%
              {breakdown.breakdown.gangHeat.largeGangBonus > 0 && ` (+${breakdown.breakdown.gangHeat.largeGangBonus}% Large Gang)`}
              {breakdown.breakdown.gangHeat.massiveGangBonus > 0 && ` (+${breakdown.breakdown.gangHeat.massiveGangBonus}% Massive Gang)`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}