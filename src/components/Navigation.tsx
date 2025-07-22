import React from 'react';

interface NavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onSellAll?: () => void; // Optional handler for Sell All
}

export default function Navigation({ currentScreen, onNavigate, onSellAll }: NavigationProps) {
  // Always show Home, Market, Travel
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'market', icon: '💊', label: 'Market' },
    { id: 'travel', icon: '✈️', label: 'Travel' }
  ];
  const isTradingPage = currentScreen === 'trading';

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        background: '#111',
        borderTop: '2px solid #333',
        padding: '10px 0',
        display: 'flex',
        zIndex: 10000,
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        justifyContent: 'space-between',
      }}
    >
      {navItems.map(item => (
        <button
          key={item.id}
          className={`action-btn${currentScreen === item.id ? ' active' : ''}`}
          style={{ flex: 1, minWidth: 0 }}
          onClick={() => onNavigate(item.id)}
        >
          <span>{item.icon}</span>
          <span style={{ marginLeft: 4 }}>{item.label}</span>
        </button>
      ))}
      {isTradingPage && (
        <button
          className="action-btn"
          style={{ flex: 1, minWidth: 0, background: '#ff6600', color: '#fff', fontWeight: 'bold', marginLeft: 8 }}
          onClick={onSellAll}
        >
          Sell All
        </button>
      )}
    </div>
  );
} 