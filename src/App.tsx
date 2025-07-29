import React, { useState, useEffect, useRef } from 'react';
import { useGame } from './contexts/GameContext.jsx';
import { useTutorial } from './contexts/TutorialContext';
import { Modal } from './components/Modal';
import { NotificationManager, useNotifications } from './components/NotificationManager';
import HomeScreen from './screens/HomeScreen';
import MarketScreen from './screens/MarketScreen';
import TravelScreen from './screens/TravelScreen';
import InventoryScreen from './screens/InventoryScreen';
import GangScreen from './screens/GangScreen';
import BasesScreen from './screens/BasesScreen';
import AssetsScreen from './screens/AssetsScreen';
import TradingScreen from './screens/TradingScreen';
import RaidScreen from './screens/RaidScreen';
import MailScreen from './screens/MailScreen';
import Navigation from './components/Navigation';
import './App.css';

// Declare global window property for gang attack notifications
declare global {
  interface Window {
    triggerGangAttackNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  }
}

function GameContent() {
  const { state, sellAllDrugs } = useGame();
  const { showNotification } = useNotifications();

  // No systems, updateGameState, or refreshUI in minimal context
  const [currentScreen, setCurrentScreen] = useState('home');

  // Sell All modal state
  const [showSellAllModal, setShowSellAllModal] = useState(false);
  const [sellAllSummary, setSellAllSummary] = useState({ total: 0, drugs: [] as string[] });

  // Set up global notification trigger for game systems
  useEffect(() => {
    window.triggerGangAttackNotification = (message: string, type: 'success' | 'error' | 'warning' | 'info') => {
      showNotification(message, type, 2000);
    };

    return () => {
      delete window.triggerGangAttackNotification;
    };
  }, [showNotification]);

  // Handler for Sell All button
  const handleSellAll = () => {
    console.log('[DEBUG] handleSellAll called (App)');
    console.trace();
    const inventory = state.inventory;
    const currentCity = state.currentCity;
    const prices = state.cityPrices?.[currentCity] || {};
    let total = 0;
    const drugs: string[] = [];
    Object.keys(inventory).forEach(drug => {
      const qty = inventory[drug] || 0;
      if (qty > 0) {
        const price = prices[drug] || 0;
        total += price * qty;
        drugs.push(`${qty} ${drug}`);
      }
    });
    setSellAllSummary({ total, drugs });
    setShowSellAllModal(true);
  };

  // Confirm Sell All
  const confirmSellAll = () => {
    console.log('[DEBUG] confirmSellAll called (App)');
    console.trace();
    const result = sellAllDrugs();
    setSellAllSummary({ total: result.totalEarned, drugs: result.drugsSold });
    setShowSellAllModal(false);
  };

  // Initialize game on mount
  useEffect(() => {
    // No-op for now: loading/saving will be handled via context in the future
    // You can add localStorage logic here if needed
    return () => {};
  }, []);

  // Advance day function
  // Remove advanceDay logic for now

  // Handle screen navigation
  const navigateToScreen = (screen: string) => {
    console.log('navigateToScreen called with:', screen);
    setCurrentScreen(screen);
    // No updateGameState in minimal context
  };

  // Render current screen
  const renderScreen = () => {
    switch (currentScreen) {
      case 'home':
        return <HomeScreen onNavigate={navigateToScreen} />;
      case 'market':
        return <MarketScreen onNavigate={navigateToScreen} />;
      case 'travel':
        return <TravelScreen onNavigate={navigateToScreen} />;
      case 'inventory':
        return <InventoryScreen onNavigate={navigateToScreen} />;
      case 'gang':
        return <GangScreen onNavigate={navigateToScreen} />;
      case 'bases':
        return <BasesScreen onNavigate={navigateToScreen} />;
      case 'assets':
        return <AssetsScreen onNavigate={navigateToScreen} />;
      case 'trading':
        return <TradingScreen onNavigate={navigateToScreen} />;
      case 'raid':
        return <RaidScreen onNavigate={navigateToScreen} />;
      case 'mail':
        return <MailScreen onNavigate={navigateToScreen} />;
      default:
        return <HomeScreen onNavigate={navigateToScreen} />;
    }
  };

  return (
    <div className="phone-container">
      {/* Debug overlay removed */}
      <div id="modal-debug-overlay"></div>
      <div className="status-bar">
        <div>🔐 Secure</div>
        <div id="phoneTime">{new Date().toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })}</div>
        <div>🔋 100%</div>
      </div>
      <div className="header">
        <div className="game-title">💊 SLANG AND BANG</div>
        <div className="subtitle">Drug Empire Simulator</div>
      </div>
      <div className="screen-container" style={{ position: 'relative' }}>
        {renderScreen()}
      </div>
      {/* Sell All Confirmation Modal (global) */}
      <Modal
        isOpen={showSellAllModal}
        onClose={() => setShowSellAllModal(false)}
        title={`Confirm Sell All`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Sell all drugs for <strong>${sellAllSummary.total.toLocaleString()}</strong>?<br/>
            <span style={{ fontSize: '12px', color: '#aaa' }}>{sellAllSummary.drugs.join(', ')}</span>
          </p>
          <button className="action-btn" onClick={confirmSellAll}>
            Confirm
          </button>
          <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setShowSellAllModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>
      <Navigation 
        currentScreen={currentScreen} 
        onNavigate={navigateToScreen}
        onSellAll={currentScreen === 'trading' ? handleSellAll : undefined}
      />
    </div>
  );
}

function App() {
  const { progress, startTutorial } = useTutorial();
  
  // Only trigger the gettingStarted tutorial
  React.useEffect(() => {
    if (!progress.gettingStarted) {
      startTutorial('gettingStarted');
    }
  }, [progress.gettingStarted]); // Remove startTutorial from dependencies
  
  return (
    <NotificationManager>
      <GameContent />
    </NotificationManager>
  );
}

export default App;
