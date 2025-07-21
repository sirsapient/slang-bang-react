import React, { useState } from 'react';
import { useGame, useCurrentCity, useInventory, useCash } from '../contexts/GameContext';
import { Modal } from '../components/Modal';
import { gameData } from '../game/data/gameData';

interface TradingScreenProps {
  onNavigate: (screen: string) => void;
}

const TradingScreen: React.FC<TradingScreenProps> = ({ onNavigate }) => {
  const { state, systems, updateGameState, refreshUI } = useGame();
  const currentCity = useCurrentCity();
  const inventory = useInventory();
  const cash = useCash();
  
  const [selectedCity, setSelectedCity] = useState(currentCity);
  const [selectedDrug, setSelectedDrug] = useState<string>('');
  const [tradeAmount, setTradeAmount] = useState(1);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [compareCity, setCompareCity] = useState<string>('');
  const [showBulkTrade, setShowBulkTrade] = useState(false);
  const [bulkAmount, setBulkAmount] = useState(1000);

  const cities = Object.keys(gameData.cities);
  const prices = state.cityPrices?.[selectedCity] || {};
  const supply = state.citySupply?.[selectedCity] || {};
  const drugs = Object.keys(prices);

  const handleTrade = () => {
    if (!selectedDrug || tradeAmount <= 0) return;
    
    if (tradeType === 'buy') {
      const price = prices[selectedDrug] || 0;
      const totalCost = price * tradeAmount;
      const availableSupply = supply[selectedDrug] || 0;
      
      if (totalCost > cash) {
        alert(`Not enough cash! Need $${totalCost.toLocaleString()}`);
        return;
      }
      
      if (tradeAmount > availableSupply) {
        alert(`Only ${availableSupply} ${selectedDrug} available in ${selectedCity}`);
        return;
      }
      
      setShowConfirmModal(true);
    } else {
      const owned = inventory[selectedDrug] || 0;
      if (tradeAmount > owned) {
        alert(`You only have ${owned} ${selectedDrug} to sell`);
        return;
      }
      setShowConfirmModal(true);
    }
  };

  const confirmTrade = () => {
    if (!selectedDrug || tradeAmount <= 0) return;
    
    if (tradeType === 'buy') {
      const price = prices[selectedDrug] || 0;
      const totalCost = price * tradeAmount;
      
      systems.trading.buyDrug(selectedDrug, tradeAmount, selectedCity);
      updateGameState('cash', state.cash - totalCost);
      refreshUI();
    } else {
      systems.trading.sellDrug(selectedDrug, tradeAmount);
      refreshUI();
    }
    
    setShowConfirmModal(false);
    setTradeAmount(1);
  };

  const handleBulkTrade = () => {
    if (!selectedDrug || bulkAmount <= 0) return;
    
    if (tradeType === 'buy') {
      const price = prices[selectedDrug] || 0;
      const maxAffordable = Math.floor(cash / price);
      const maxAvailable = supply[selectedDrug] || 0;
      const actualAmount = Math.min(bulkAmount, maxAffordable, maxAvailable);
      
      if (actualAmount <= 0) {
        alert('Cannot afford any or no supply available');
        return;
      }
      
      setTradeAmount(actualAmount);
      setShowConfirmModal(true);
    } else {
      const owned = inventory[selectedDrug] || 0;
      const actualAmount = Math.min(bulkAmount, owned);
      
      if (actualAmount <= 0) {
        alert('No drugs to sell');
        return;
      }
      
      setTradeAmount(actualAmount);
      setShowConfirmModal(true);
    }
  };

  const getPriceComparison = (drug: string, targetCity: string) => {
    const currentPrice = prices[drug] || 0;
    const targetPrice = state.cityPrices?.[targetCity]?.[drug] || 0;
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
    
    return { currentPrice, targetPrice, difference, percentDiff, indicator, color };
  };

  const calculateTradeValue = () => {
    if (!selectedDrug || tradeAmount <= 0) return { cost: 0, profit: 0 };
    
    const price = prices[selectedDrug] || 0;
    if (tradeType === 'buy') {
      return { cost: price * tradeAmount, profit: 0 };
    } else {
      return { cost: 0, profit: price * tradeAmount };
    }
  };

  const tradeValue = calculateTradeValue();

  return (
    <div className="trading-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>💼 Advanced Trading</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Professional Trading Tools</div>
      </div>

      {/* Trading Controls */}
      <div style={{
        background: '#333',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '15px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <button
            className={`action-btn ${tradeType === 'buy' ? 'active' : ''}`}
            onClick={() => setTradeType('buy')}
            style={{ 
              background: tradeType === 'buy' ? '#00ff00' : '#666',
              color: tradeType === 'buy' ? '#000' : '#fff'
            }}
          >
            💰 Buy
          </button>
          <button
            className={`action-btn ${tradeType === 'sell' ? 'active' : ''}`}
            onClick={() => setTradeType('sell')}
            style={{ 
              background: tradeType === 'sell' ? '#ff6600' : '#666',
              color: tradeType === 'sell' ? '#000' : '#fff'
            }}
          >
            💸 Sell
          </button>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>City:</label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
          >
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Drug:</label>
          <select
            value={selectedDrug}
            onChange={(e) => setSelectedDrug(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
          >
            <option value="">Select Drug</option>
            {drugs.map(drug => (
              <option key={drug} value={drug}>{drug}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Amount:</label>
          <input
            type="number"
            value={tradeAmount}
            onChange={(e) => setTradeAmount(parseInt(e.target.value) || 1)}
            min="1"
            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
          />
        </div>

        {/* Trade Summary */}
        {selectedDrug && tradeAmount > 0 && (
          <div style={{
            background: '#222',
            padding: '10px',
            borderRadius: '6px',
            marginBottom: '15px',
            border: '1px solid #666'
          }}>
            <div style={{ color: '#66ff66', marginBottom: '5px' }}>
              {tradeType === 'buy' ? '💰 Buy Summary' : '💸 Sell Summary'}
            </div>
            <div>Drug: {selectedDrug}</div>
            <div>Amount: {tradeAmount}</div>
            <div>Price: ${(prices[selectedDrug] || 0).toLocaleString()}</div>
            {tradeType === 'buy' ? (
              <div style={{ color: tradeValue.cost <= cash ? '#66ff66' : '#ff6666' }}>
                Cost: ${tradeValue.cost.toLocaleString()}
                {tradeValue.cost > cash && ' (Cannot afford)'}
              </div>
            ) : (
              <div style={{ color: '#ff6600' }}>
                Profit: ${tradeValue.profit.toLocaleString()}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            className="action-btn"
            onClick={handleTrade}
            disabled={!selectedDrug || tradeAmount <= 0}
          >
            {tradeType === 'buy' ? 'Buy' : 'Sell'}
          </button>
          <button
            className="action-btn"
            onClick={() => setShowBulkTrade(true)}
            style={{ background: '#6666ff' }}
          >
            Bulk Trade
          </button>
        </div>
      </div>

      {/* Price Comparison Section */}
      <div style={{
        background: '#333',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '15px'
      }}>
        <h4 style={{ marginBottom: '10px', color: '#66ff66' }}>📊 Price Comparison</h4>
        <div style={{ marginBottom: '10px' }}>
          <select
            value={compareCity}
            onChange={(e) => setCompareCity(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
          >
            <option value="">Select City to Compare</option>
            {cities.filter(city => city !== selectedCity).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        
        {compareCity && selectedDrug && (
          <div style={{
            background: '#222',
            padding: '10px',
            borderRadius: '6px',
            border: '1px solid #666'
          }}>
            {(() => {
              const comparison = getPriceComparison(selectedDrug, compareCity);
              return (
                <div>
                  <div style={{ color: comparison.color, fontWeight: 'bold', marginBottom: '5px' }}>
                    {comparison.indicator}
                  </div>
                  <div>Current ({selectedCity}): ${comparison.currentPrice.toLocaleString()}</div>
                  <div>Target ({compareCity}): ${comparison.targetPrice.toLocaleString()}</div>
                  <div style={{ color: comparison.difference > 0 ? '#66ff66' : '#ff6666' }}>
                    Difference: ${comparison.difference.toLocaleString()} ({comparison.percentDiff.toFixed(1)}%)
                  </div>
                  <div>Travel Cost: ${systems.trading.calculateTravelCost(compareCity).toLocaleString()}</div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{
        background: '#333',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '15px'
      }}>
        <h4 style={{ marginBottom: '10px', color: '#66ff66' }}>⚡ Quick Actions</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            className="action-btn"
            onClick={() => {
              const result = systems.trading.sellAllDrugs();
              if (result.success) {
                refreshUI();
              } else {
                alert(result.error || 'No drugs to sell');
              }
            }}
            style={{ background: '#ff6600' }}
          >
            💸 Sell All Drugs
          </button>
          <button
            className="action-btn"
            onClick={() => onNavigate('market')}
            style={{ background: '#6666ff' }}
          >
            📊 Market View
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={`Confirm ${tradeType === 'buy' ? 'Purchase' : 'Sale'}`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            {tradeType === 'buy' ? 'Buy' : 'Sell'} <strong>{tradeAmount}</strong> {selectedDrug} for{' '}
            <strong>${tradeType === 'buy' ? tradeValue.cost : tradeValue.profit}</strong>?
          </p>
          <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
            <button className="action-btn" onClick={confirmTrade}>
              Confirm
            </button>
            <button 
              className="action-btn" 
              style={{ background: '#ff6666' }} 
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk Trade Modal */}
      <Modal
        isOpen={showBulkTrade}
        onClose={() => setShowBulkTrade(false)}
        title="Bulk Trade"
      >
        <div style={{ padding: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Amount to {tradeType}:</label>
            <input
              type="number"
              value={bulkAmount}
              onChange={(e) => setBulkAmount(parseInt(e.target.value) || 1000)}
              min="1"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <p style={{ fontSize: '12px', color: '#aaa' }}>
              This will {tradeType} as much as possible with your available {tradeType === 'buy' ? 'cash' : 'inventory'}.
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="action-btn" onClick={handleBulkTrade}>
              Execute Bulk Trade
            </button>
            <button 
              className="action-btn" 
              style={{ background: '#ff6666' }} 
              onClick={() => setShowBulkTrade(false)}
            >
              Cancel
      </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TradingScreen; 