import React, { useState, useEffect } from 'react';
import { gameState } from './game/gameState';
import { TradingSystem } from './game/systems/trading';
import { gameData } from './game/data/gameData';
import PlayerStats from './components/PlayerStats';
import InventoryModal from './components/InventoryModal';
import Market from './components/Market';
import './App.css';

function App() {
  const [isInventoryOpen, setInventoryOpen] = useState(false);
  const [, forceUpdate] = useState(0); // Used to force re-render

  // Dummy advanceDay function for now (implement your own logic as needed)
  const advanceDay = () => {
    // Example: increment day and save
    gameState.data.day += 1;
    gameState.save();
    forceUpdate(x => x + 1);
  };

  useEffect(() => {
    const tradingSystem = new TradingSystem(gameState, null, gameData);
    const initializeGame = () => {
      console.log('Initializing game...');
      // Try to load saved game
      const loaded = gameState.load();
      // Check if we need to generate prices
      const needsPriceGeneration = !gameState.cityPrices ||
        Object.keys(gameState.cityPrices).length === 0 ||
        Object.values(gameState.cityPrices).some(cityPrices =>
          !cityPrices || Object.keys(cityPrices).length === 0
        );
      if (needsPriceGeneration) {
        console.log('Generating city prices...');
        tradingSystem.generateAllCityPrices();
        // Save immediately after generating prices
        gameState.save();
        console.log('Prices generated and saved:', gameState.cityPrices);
      }
      // Set up auto-save
      const autoSaveInterval = setInterval(() => {
        gameState.save();
      }, 10000); // Save every 10 seconds
      // Set up real-time game loop
      const gameTimer = setInterval(() => {
        advanceDay();
      }, 60000); // 60 seconds per day
      const countdownTimer = setInterval(() => {
        gameState.timeRemaining -= 1000;
        if (gameState.timeRemaining <= 0) {
          gameState.timeRemaining = 60000;
        }
        // Force re-render for countdown
        forceUpdate(x => x + 1);
      }, 1000);
      // Store timers for cleanup
      gameState.gameTimer = gameTimer;
      gameState.countdownTimer = countdownTimer;
      return () => {
        clearInterval(autoSaveInterval);
        clearInterval(gameTimer);
        clearInterval(countdownTimer);
      };
    };
    // Initialize the game
    const cleanup = initializeGame();
    return cleanup;
  }, []); // Empty dependency array - only run once on mount

  return (
    <div>
      <h1>Slang & Bang (React Port)</h1>
      <PlayerStats
        playerName={gameState.data.playerName}
        cash={gameState.data.cash}
        currentCity={gameState.data.currentCity}
        day={gameState.data.day}
        heatLevel={gameState.data.heatLevel}
      />
      <button onClick={() => setInventoryOpen(true)}>Show Inventory</button>
      <InventoryModal
        inventory={gameState.data.inventory}
        isOpen={isInventoryOpen}
        onClose={() => setInventoryOpen(false)}
      />
      <Market cityPrices={gameState.cityPrices[gameState.data.currentCity] || {}} />
    </div>
  );
}

export default App;
