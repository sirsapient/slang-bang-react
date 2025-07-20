import React, { useEffect, useState } from 'react';
import { gameState } from '../game/gameState';
import { TradingSystem } from '../game/systems/trading';
import { gameData } from '../game/data/gameData';

// Accept cityPrices as a prop, but also use gameState for reactivity
const Market: React.FC<{ cityPrices: { [drug: string]: number } }> = ({ cityPrices }) => {
  const [ignored, forceUpdate] = useState(0);
  const currentCity = gameState.data.currentCity;

  useEffect(() => {
    const handlePriceChange = () => {
      forceUpdate(x => x + 1);
    };
    // Listen for price changes
    gameState.on('cityPricesGenerated', handlePriceChange);
    gameState.on('stateChange', (data: any) => {
      if (data.key === 'cityPrices') {
        handlePriceChange();
      }
    });
    return () => {
      gameState.off('cityPricesGenerated', handlePriceChange);
      // Note: This does not remove the anonymous stateChange listener, but avoids memory leaks for cityPricesGenerated
    };
  }, []);

  // Safety check for prices
  const prices = gameState.cityPrices?.[currentCity] || {};
  const hasValidPrices = Object.keys(prices).length > 0;

  if (!hasValidPrices) {
    // If no prices, try to generate them
    if (!gameState.cityPrices || Object.keys(gameState.cityPrices).length === 0) {
      const tradingSystem = new TradingSystem(gameState, null, gameData);
      tradingSystem.generateAllCityPrices();
      gameState.save();
    }
    return (
      <div className="market-screen">
        <h3>Market loading...</h3>
      </div>
    );
  }

  return (
    <div>
      <h2>Market Prices</h2>
      <table>
        <thead>
          <tr>
            <th>Drug</th>
            <th>Price ($)</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(prices).map(([drug, price]) => (
            <tr key={drug}>
              <td>{drug}</td>
              <td>{price}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Market;