import React, { useState } from 'react';
import { useGame, useCurrentCity, useInventory } from '../contexts/GameContext';
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
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
  const [buyAmount, setBuyAmount] = useState(1);
  const [showSellModal, setShowSellModal] = useState(false);
  const [selectedSellDrug, setSelectedSellDrug] = useState<string | null>(null);
  const [sellAmount, setSellAmount] = useState(1);
  const [selectedCity, setSelectedCity] = useState(currentCity);

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
      <h2>Market - {selectedCity}</h2>
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
    </div>
  );
};

export default MarketScreen; 