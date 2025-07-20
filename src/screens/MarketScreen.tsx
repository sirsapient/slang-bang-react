import React, { useState } from 'react';
import { useGame, useCurrentCity, useInventory } from '../contexts/GameContext';
import { Modal } from '../components/Modal';
import { DrugPriceTable } from '../components/DrugPriceTable';

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

  const prices = state.cityPrices?.[currentCity] || {};
  const supply = state.citySupply?.[currentCity] || {};

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
      systems.trading.buyDrug(selectedDrug, buyAmount, currentCity);
      updateGameState('cash', state.cash - totalCost);
      refreshUI();
    }
    setShowBuyModal(false);
  };

  return (
    <div className="market-screen">
      <h2>Market - {currentCity}</h2>
      <DrugPriceTable
        city={currentCity}
        prices={prices}
        inventory={inventory}
        supply={supply}
        onBuy={handleBuy}
      />
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title={`Buy ${selectedDrug}`}
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
    </div>
  );
};

export default MarketScreen; 