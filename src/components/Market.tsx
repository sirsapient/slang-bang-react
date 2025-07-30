import React from 'react';
import { useGame, useCurrentCity } from '../contexts/GameContext.jsx';


// Accept cityPrices as a prop, but also use GameContext for reactivity
const Market: React.FC<{ cityPrices?: { [drug: string]: number } }> = ({ cityPrices }) => {
  const { state } = useGame();
  const currentCity = useCurrentCity();

  // Safety check for prices
  const prices = state.cityPrices?.[currentCity] || {};
  const hasValidPrices = Object.keys(prices).length > 0;

  if (!hasValidPrices) {
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
                             <td>{String(price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Market;