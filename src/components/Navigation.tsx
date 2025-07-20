import React from 'react';

interface NavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export default function Navigation({ currentScreen, onNavigate }: NavigationProps) {
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'market', icon: '💊', label: 'Market' },
    { id: 'travel', icon: '✈️', label: 'Travel' }
  ];

  return (
    <div className="nav-bar">
      {navItems.map(item => (
        <div
          key={item.id}
          className={`nav-item ${currentScreen === item.id ? 'active' : ''}`}
          onClick={() => onNavigate(item.id)}
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
} 