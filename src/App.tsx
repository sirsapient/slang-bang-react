import React, { useEffect, useState } from 'react';
import { gameState } from './game/gameState';
import { useGame } from './contexts/GameContext';
import Navigation from './components/Navigation';
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
import './App.css';
import { Modal } from './components/Modal';

function GameContent() {
  const { state, systems, updateGameState, refreshUI } = useGame();
  const [currentScreen, setCurrentScreen] = useState('home');

  // Initialize game on mount
  useEffect(() => {
    const initializeGame = () => {
      // Load saved game
      const loaded = gameState.load();
      // Check if we need to generate prices
      if (!gameState.cityPrices || Object.keys(gameState.cityPrices).length === 0) {
        systems.trading.generateAllCityPrices();
        gameState.save();
      }
      // Sync cityPrices to React state
      updateGameState('cityPrices', gameState.cityPrices);
      // Start game timers
      const gameTimer = setInterval(() => {
        advanceDay();
      }, 60000);
      const countdownTimer = setInterval(() => {
        gameState.timeRemaining -= 1000;
        if (gameState.timeRemaining <= 0) {
          gameState.timeRemaining = 60000;
        }
        refreshUI();
      }, 1000);
      const autoSaveTimer = setInterval(() => {
        gameState.save();
      }, 10000);
      // Store timers
      gameState.gameTimer = gameTimer;
      gameState.countdownTimer = countdownTimer;
      return () => {
        clearInterval(gameTimer);
        clearInterval(countdownTimer);
        clearInterval(autoSaveTimer);
      };
    };
    return initializeGame();
  }, []);

  // Advance day function
  const advanceDay = () => {
    const newDay = state.day + 1;
    updateGameState('day', newDay);
    updateGameState('daysInCurrentCity', state.daysInCurrentCity + 1);
    updateGameState('daysSinceTravel', state.daysSinceTravel + 1);
    // Apply daily systems
    systems.heat.applyWarrantDecay();
    systems.bases.generateDailyIncome();
    systems.trading.updateMarketPrices();
    refreshUI();
  };

  // Handle screen navigation
  const navigateToScreen = (screen: string) => {
    console.log('navigateToScreen called with:', screen);
    setCurrentScreen(screen);
    updateGameState('currentScreen', screen);
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
      {/* Fixed debug box for overlay test */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '300px',
        height: '100px',
        background: 'yellow',
        color: 'black',
        zIndex: 1000000,
        fontSize: '20px',
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '5px solid red',
        pointerEvents: 'none',
      }}>
        DEBUG OVERLAY VISIBLE?
      </div>
      {/* Debug overlay to confirm modal is covering the app */}
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
      <div className="screen-container">
        {renderScreen()}
      </div>
      <Navigation 
        currentScreen={currentScreen} 
        onNavigate={navigateToScreen}
      />
    </div>
  );
}

function App() {
  return <GameContent />;
}

export default App;
