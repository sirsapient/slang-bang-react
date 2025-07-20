import React, { useState } from 'react';
import { useGame, useCurrentCity } from '../contexts/GameContext';
import { Modal } from '../components/Modal';

interface TravelScreenProps {
  onNavigate: (screen: string) => void;
}

const TravelScreen: React.FC<TravelScreenProps> = ({ onNavigate }) => {
  const { state, systems, updateGameState, refreshUI } = useGame();
  const currentCity = useCurrentCity();
  const [showTravelModal, setShowTravelModal] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);

  const cities = Object.keys(state.cityPrices || {});

  const handleTravel = (city: string) => {
    setSelectedCity(city);
    setShowTravelModal(true);
  };

  const confirmTravel = () => {
    if (!selectedCity) return;
    systems.trading.travelToCity(selectedCity);
    updateGameState('currentCity', selectedCity);
    updateGameState('daysInCurrentCity', 1);
    updateGameState('daysSinceTravel', 0);
    updateGameState('lastTravelDay', state.day);
    refreshUI();
    setShowTravelModal(false);
    onNavigate('home');
  };

  return (
    <div className="travel-screen">
      <h2>Travel</h2>
      <div className="city-list">
        {cities.map(city => (
          <div
            key={city}
            className={`city-item ${city === currentCity ? 'current' : ''}`}
            onClick={() => city !== currentCity && handleTravel(city)}
          >
            <span>{city}</span>
            {city === currentCity && <span style={{ color: '#66ff66', marginLeft: 8 }}>(Current)</span>}
          </div>
        ))}
      </div>
      <button className="action-btn" onClick={() => onNavigate('home')}>
        Back to Home
      </button>
      <Modal
        isOpen={showTravelModal}
        onClose={() => setShowTravelModal(false)}
        title={`Travel to ${selectedCity}`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Are you sure you want to travel to <strong>{selectedCity}</strong>?
          </p>
          <button className="action-btn" onClick={confirmTravel}>
            Confirm
          </button>
          <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setShowTravelModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default TravelScreen; 