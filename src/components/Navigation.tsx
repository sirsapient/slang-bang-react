import React from 'react';
import { useTutorial } from '../contexts/TutorialContext';

interface NavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
  onSellAll?: () => void; // Optional handler for Sell All
}

export default function Navigation({ currentScreen, onNavigate, onSellAll }: NavigationProps) {
  const { nextStep, activeTutorial, stepIndex, tutorialSteps } = useTutorial();
  
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
          id={item.id === 'travel' ? 'travel-nav-button' : `${item.id}-nav-button`}
          className={`action-btn${currentScreen === item.id ? ' active' : ''}`}
          style={{ flex: 1, minWidth: 0 }}
          onClick={() => {
            // Check if this is a tutorial click for Travel button
            if (activeTutorial === 'gettingStarted' && stepIndex === 7 && item.id === 'travel') {
              const step = tutorialSteps[activeTutorial][stepIndex];
              if (step && step.requireClick) {
                nextStep();
              }
            }
            onNavigate(item.id);
          }}
        >
          <span>{item.icon}</span>
          <span style={{ marginLeft: 4 }}>{item.label}</span>
        </button>
      ))}
      {isTradingPage && (
        <button
          id="sell-all-button"
          className="action-btn"
          style={{ flex: 1, minWidth: 0, background: '#ff6600', color: '#fff', fontWeight: 'bold', marginLeft: 8 }}
          onClick={() => {
            // Check if this is a tutorial click for Sell All button
            if (activeTutorial === 'gettingStarted' && stepIndex === 11) {
              const step = tutorialSteps[activeTutorial][stepIndex];
              if (step && step.requireClick) {
                nextStep();
              }
            }
            onSellAll?.();
          }}
        >
          Sell All
        </button>
      )}
    </div>
  );
} 