import React, { useState } from 'react';
import { useGame, useCurrentCity, useInventory, useCash } from '../contexts/GameContext';
import { Modal } from '../components/Modal';
import { DrugPriceTable } from '../components/DrugPriceTable';
import { gameData } from '../game/data/gameData';

interface MarketScreenProps {
  onNavigate: (screen: string) => void;
}

const MarketScreen: React.FC<MarketScreenProps> = ({ onNavigate }) => {
  const { state, systems, updateGameState, refreshUI } = useGame();
  const currentCity = useCurrentCity();
  const inventory = useInventory();
  const cash = useCash();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedSellDrug, setSelectedSellDrug] = useState<string | null>(null);
  const [sellAmount, setSellAmount] = useState(1);
  const [selectedCity, setSelectedCity] = useState(currentCity);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorType, setCalculatorType] = useState<'buy' | 'sell' | 'compare'>('buy');
  const [calculatorDrug, setCalculatorDrug] = useState<string>('');
  const [calculatorAmount, setCalculatorAmount] = useState(1);
  const [compareCity, setCompareCity] = useState<string>('');

  // List of all cities
  const cities = Object.keys(gameData.cities);
  console.log('MarketScreen cities:', cities);

  const prices = state.cityPrices?.[selectedCity] || {};
  console.log('MarketScreen prices:', prices);
  const supply = state.citySupply?.[selectedCity] || {};

  const handleBuy = (drug: string, amount: number) => {
    setSelectedDrug(drug);
    setBuyAmount(amount);
    setShowBuyModal(true);
  };

  const confirmBuy = () => {
    if (!selectedDrug) return;
    const price = prices[selectedDrug] || 0;
    const totalCost = price * buyAmount;
    if (state.cash >= totalCost && supply[selectedDrug] >= buyAmount) {
      systems.trading.buyDrug(selectedDrug, buyAmount, selectedCity);
      updateGameState('cash', state.cash - totalCost);
      refreshUI();
    }
    setShowBuyModal(false);
  };

  const handleSell = (drug: string, amount: number) => {
    setSelectedSellDrug(drug);
    setSellAmount(amount);
    setShowSellModal(true);
  };

  const confirmSell = () => {
    if (!selectedSellDrug) return;
    const price = prices[selectedSellDrug] || 0;
    if ((inventory[selectedSellDrug] || 0) >= sellAmount && sellAmount > 0) {
      systems.trading.sellDrug(selectedSellDrug, sellAmount);
      refreshUI();
    }
    setShowSellModal(false);
  };

  const handleFastTravel = () => {
    if (selectedCity !== currentCity) {
      const cost = systems.trading.calculateTravelCost(selectedCity);
      if (cash >= cost) {
        // Navigate to travel screen with pre-selected city
        onNavigate('travel');
        // You could also implement direct travel here if needed
      } else {
        alert(`Need $${cost.toLocaleString()} to travel to ${selectedCity}`);
      }
    }
  };

  const openCalculator = (type: 'buy' | 'sell' | 'compare', drug?: string) => {
    setCalculatorType(type);
    if (drug) setCalculatorDrug(drug);
    setCalculatorAmount(1);
    setCompareCity('');
    setShowCalculator(true);
  };

  const calculateProfit = () => {
    if (!calculatorDrug || calculatorAmount <= 0) return { profit: 0, roi: 0 };
    
    const currentPrice = prices[calculatorDrug] || 0;
    const totalCost = currentPrice * calculatorAmount;
    
    if (calculatorType === 'buy') {
      return { cost: totalCost, canAfford: cash >= totalCost };
    } else if (calculatorType === 'sell') {
      const owned = inventory[calculatorDrug] || 0;
      const canSell = owned >= calculatorAmount;
      const profit = currentPrice * calculatorAmount;
      return { profit, canSell, owned };
    } else if (calculatorType === 'compare' && compareCity) {
      const targetPrice = state.cityPrices?.[compareCity]?.[calculatorDrug] || 0;
      const priceDiff = targetPrice - currentPrice;
      const profit = priceDiff * calculatorAmount;
      const travelCost = systems.trading.calculateTravelCost(compareCity);
      const netProfit = profit - travelCost;
      return { 
        currentPrice, 
        targetPrice, 
        priceDiff, 
        profit, 
        travelCost, 
        netProfit,
        canAfford: cash >= travelCost
      };
    }
    return { profit: 0, roi: 0 };
  };

  const calculatorResult = calculateProfit();

  return (
    <div className="market-screen">
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '5px' }}>Select City:</div>
        <select
          value={selectedCity}
          onChange={e => setSelectedCity(e.target.value)}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
        >
          {cities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Fast Travel Button */}
      {selectedCity !== currentCity && (
        <div style={{ marginBottom: '15px' }}>
          <button 
            className="action-btn" 
            onClick={handleFastTravel}
            style={{ width: '100%', background: '#ff6600' }}
          >
            ✈️ Fast Travel to {selectedCity} (${systems.trading.calculateTravelCost(selectedCity).toLocaleString()})
          </button>
        </div>
      )}

      <h2>Market - {selectedCity}</h2>

      {/* Calculator Tools */}
      <div style={{ marginBottom: '15px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
        <button 
          className="action-btn" 
          onClick={() => openCalculator('buy')}
          style={{ fontSize: '11px', padding: '6px' }}
        >
          💰 Buy Calculator
        </button>
        <button 
          className="action-btn" 
          onClick={() => openCalculator('sell')}
          style={{ fontSize: '11px', padding: '6px', background: '#ff6600' }}
        >
          💸 Sell Calculator
        </button>
        <button 
          className="action-btn" 
          onClick={() => openCalculator('compare')}
          style={{ fontSize: '11px', padding: '6px', background: '#6666ff' }}
        >
          📊 Price Compare
        </button>
      </div>

      <DrugPriceTable
        city={selectedCity}
        prices={prices}
        inventory={inventory}
        supply={supply}
        onBuy={handleBuy}
        onSell={handleSell}
      />

      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>

      {/* Buy Modal */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title={`Confirm Purchase`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Buy <strong>{buyAmount}</strong> {selectedDrug} for <strong>${((prices[selectedDrug!] || 0) * buyAmount).toLocaleString()}</strong>?
          </p>
          <button className="action-btn" onClick={confirmBuy}>
            Confirm
          </button>
          <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setShowBuyModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>

      {/* Sell Modal */}
      <Modal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title={`Confirm Sale`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Sell <strong>{sellAmount}</strong> {selectedSellDrug} for <strong>${((prices[selectedSellDrug!] || 0) * sellAmount).toLocaleString()}</strong>?
          </p>
          <button className="action-btn" onClick={confirmSell}>
            Confirm
          </button>
          <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setShowSellModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>

      {/* Calculator Modal */}
      <Modal
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        title={`${calculatorType === 'buy' ? '💰 Buy' : calculatorType === 'sell' ? '💸 Sell' : '📊 Price Comparison'} Calculator`}
      >
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Drug:</label>
            <select
              value={calculatorDrug}
              onChange={(e) => setCalculatorDrug(e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
            >
              <option value="">Select Drug</option>
              {Object.keys(prices).map(drug => (
                <option key={drug} value={drug}>{drug}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Amount:</label>
            <input
              type="number"
              value={calculatorAmount}
              onChange={(e) => setCalculatorAmount(parseInt(e.target.value) || 1)}
              min="1"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
            />
          </div>

          {calculatorType === 'compare' && (
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Compare with City:</label>
              <select
                value={compareCity}
                onChange={(e) => setCompareCity(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
              >
                <option value="">Select City</option>
                {cities.filter(city => city !== selectedCity).map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
          )}

          {/* Calculator Results */}
          {calculatorDrug && calculatorAmount > 0 && (
            <div style={{ 
              background: '#333', 
              padding: '15px', 
              borderRadius: '8px', 
              marginBottom: '15px',
              border: '1px solid #666'
            }}>
              {calculatorType === 'buy' && (
                <div>
                  <div style={{ color: '#66ff66', marginBottom: '5px' }}>💰 Buy Analysis:</div>
                  <div>Cost: ${calculatorResult.cost?.toLocaleString()}</div>
                  <div style={{ color: calculatorResult.canAfford ? '#66ff66' : '#ff6666' }}>
                    {calculatorResult.canAfford ? '✅ Can afford' : '❌ Cannot afford'}
                  </div>
                </div>
              )}

              {calculatorType === 'sell' && (
                <div>
                  <div style={{ color: '#ff6600', marginBottom: '5px' }}>💸 Sell Analysis:</div>
                  <div>Profit: ${calculatorResult.profit?.toLocaleString()}</div>
                  <div style={{ color: calculatorResult.canSell ? '#66ff66' : '#ff6666' }}>
                    {calculatorResult.canSell ? '✅ Can sell' : `❌ Only have ${calculatorResult.owned}`}
                  </div>
                </div>
              )}

              {calculatorType === 'compare' && compareCity && (
                <div>
                  <div style={{ color: '#6666ff', marginBottom: '5px' }}>📊 Price Comparison:</div>
                  <div>Current Price: ${calculatorResult.currentPrice?.toLocaleString()}</div>
                  <div>Target Price: ${calculatorResult.targetPrice?.toLocaleString()}</div>
                  <div style={{ color: (calculatorResult.priceDiff || 0) > 0 ? '#66ff66' : '#ff6666' }}>
                    Price Difference: ${(calculatorResult.priceDiff || 0).toLocaleString()}
                  </div>
                  <div>Travel Cost: ${(calculatorResult.travelCost || 0).toLocaleString()}</div>
                  <div style={{ color: (calculatorResult.netProfit || 0) > 0 ? '#66ff66' : '#ff6666', fontWeight: 'bold' }}>
                    Net Profit: ${(calculatorResult.netProfit || 0).toLocaleString()}
                  </div>
                  <div style={{ color: calculatorResult.canAfford ? '#66ff66' : '#ff6666' }}>
                    {calculatorResult.canAfford ? '✅ Can afford travel' : '❌ Cannot afford travel'}
                  </div>
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="action-btn" 
              onClick={() => setShowCalculator(false)}
              style={{ flex: 1 }}
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MarketScreen; 