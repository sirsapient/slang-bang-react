import React from 'react';
import { useGame, useCurrentCity } from '../contexts/GameContext';

interface DrugPriceTableProps {
  city: string;
  prices: Record<string, number>;
  inventory?: Record<string, number>;
  supply?: Record<string, number>;
  onBuy?: (drug: string, amount: number) => void;
  onSell?: (drug: string, amount: number) => void;
}

export function DrugPriceTable({ 
  city, 
  prices, 
  inventory = {}, 
  supply = {},
  onBuy,
  onSell 
}: DrugPriceTableProps) {
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});
  const { state, systems } = useGame();
  const currentCity = useCurrentCity();
  
  const handleQuantityChange = (drug: string, value: string) => {
    const num = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [drug]: num }));
  };

  const getPriceComparison = (drug: string) => {
    if (city === currentCity) return null;
    
    const currentPrice = state.cityPrices?.[currentCity]?.[drug] || 0;
    const targetPrice = prices[drug] || 0;
    const difference = targetPrice - currentPrice;
    const percentDiff = currentPrice > 0 ? (difference / currentPrice) * 100 : 0;
    
    let indicator = '';
    let color = '#66ff66';
    if (percentDiff < -10) {
      indicator = '📈 GREAT BUY';
      color = '#00ff00';
    } else if (percentDiff < 0) {
      indicator = '📊 Good Buy';
      color = '#66ff66';
    } else if (percentDiff > 10) {
      indicator = '📉 Poor Deal';
      color = '#ff6666';
    } else if (percentDiff > 0) {
      indicator = '📊 Good Sell';
      color = '#ff9999';
    }
    
    return { difference, percentDiff, indicator, color };
  };
  
  return (
    <div className="drug-market-container">
      <div className="drug-market header">
        <div>Drug</div>
        <div>Price</div>
        <div>Have</div>
        <div>Supply</div>
        {onBuy && <div>Buy</div>}
        {onSell && <div>Sell</div>}
      </div>
      {Object.entries(prices).map(([drug, price]) => {
        const comparison = getPriceComparison(drug);
        return (
          <div key={drug} className="drug-market">
            <div>
              {drug}
              {comparison && (
                <div style={{ fontSize: '10px', color: comparison.color, fontWeight: 'bold' }}>
                  {comparison.indicator}
                </div>
              )}
            </div>
            <div style={{ color: '#66ff66' }}>${price.toLocaleString()}</div>
            <div>{inventory[drug] || 0}</div>
            <div style={{ color: supply[drug] > 0 ? '#66ff66' : '#ff6666' }}>
              {supply[drug] || 0}
            </div>
            {onBuy && (
              <div>
                <input
                  type="number"
                  value={quantities[drug] || ''}
                  onChange={(e) => handleQuantityChange(drug, e.target.value)}
                  min="0"
                  max={supply[drug] || 0}
                  className="quantity-input"
                  style={{ width: '60px' }}
                />
                <button
                  onClick={() => onBuy(drug, quantities[drug] || 0)}
                  disabled={!supply[drug] || supply[drug] === 0}
                  style={{ fontSize: '10px', padding: '4px 8px' }}
                >
                  Buy
                </button>
              </div>
            )}
            {onSell && (
              <div>
                <input
                  type="number"
                  value={quantities[drug] || ''}
                  onChange={(e) => handleQuantityChange(drug, e.target.value)}
                  min="0"
                  max={inventory[drug] || 0}
                  className="quantity-input"
                  style={{ width: '60px' }}
                />
                <button
                  onClick={() => onSell(drug, quantities[drug] || 0)}
                  disabled={!inventory[drug] || inventory[drug] === 0}
                  style={{ fontSize: '10px', padding: '4px 8px', background: '#ff6600' }}
                >
                  Sell
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
} 