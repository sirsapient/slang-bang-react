import React from 'react';

interface DrugPriceTableProps {
  city: string;
  prices: Record<string, number>;
  inventory?: Record<string, number>;
  supply?: Record<string, number>;
  onBuy?: (drug: string, amount: number) => void;
  onSell?: (drug: string, amount: number) => void;
}

export function DrugPriceTable({ 
 
  prices, 
  inventory = {}, 
  supply = {},
  onBuy,
  onSell 
}: DrugPriceTableProps) {
  const [quantities, setQuantities] = React.useState<Record<string, number>>({});
  
  const handleQuantityChange = (drug: string, value: string) => {
    const num = parseInt(value) || 0;
    setQuantities(prev => ({ ...prev, [drug]: num }));
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
      {Object.entries(prices).map(([drug, price]) => (
        <div key={drug} className="drug-market">
          <div>{drug}</div>
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
      ))}
    </div>
  );
} 