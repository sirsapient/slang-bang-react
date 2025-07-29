import React from 'react';
import { useGame } from '../contexts/GameContext.jsx';
// @ts-ignore
import { gameData } from '../game/data/gameData';

interface InventoryScreenProps {
  onNavigate: (screen: string) => void;
}

const InventoryScreen: React.FC<InventoryScreenProps> = ({ onNavigate }) => {
  const { state } = useGame();
  const { inventory, cash, currentCity, cityPrices } = state;
  const prices = cityPrices?.[currentCity] || {};

  return (
    <div className="inventory-screen">
      <h2>🎒 Inventory</h2>
      <div style={{ marginBottom: 16, fontSize: 16 }}>
        Cash: <span style={{ color: '#ffcc00' }}>${Math.floor(cash).toLocaleString()}</span>
      </div>
      <div style={{ background: '#222', borderRadius: '10px', overflow: 'hidden', marginBottom: 24 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: '0',
          background: '#444',
          padding: '10px',
          fontWeight: 'bold',
        }}>
          <div>Drug</div>
          <div>Have</div>
          <div>Value</div>
        </div>
        {Object.keys(inventory).map(drug => (
          <div key={drug} style={{
            borderBottom: '1px solid #444',
            padding: '16px 10px',
            minHeight: 60,
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr',
            alignItems: 'center',
            gap: 0,
          }}>
            <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#66ff66' }}>{drug}</div>
            <div style={{ fontSize: '15px' }}>{inventory[drug] || 0}</div>
            <div style={{ color: '#66ff66', fontSize: '15px' }}>
              ${((prices[drug] || 0) * (inventory[drug] || 0)).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
    </div>
  );
};

export default InventoryScreen; 