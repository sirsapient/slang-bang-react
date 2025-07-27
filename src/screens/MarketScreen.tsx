import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext.jsx';
import { useTutorial } from '../contexts/TutorialContext.jsx';
// @ts-ignore
import { gameData } from '../game/data/gameData';
import { Modal } from '../components/Modal';

interface MarketScreenProps {
  onNavigate: (screen: string) => void;
}

const MarketScreen: React.FC<MarketScreenProps> = ({ onNavigate }) => {
  const { state, updateCash, travelToCity } = useGame();
  const { nextStep, activeTutorial, stepIndex, tutorialSteps } = useTutorial();
  const currentCity = state.currentCity;
  const cash = state.cash;
  const [selectedCity, setSelectedCity] = useState(currentCity);
  const [showTravelModal, setShowTravelModal] = useState(false);

  const cities = Object.keys(gameData.cities);
  const prices = state.cityPrices?.[selectedCity] || {};
  // Calculate travel cost (moved from trading system)
  const calculateTravelCost = (destination: string) => {
    const currentDistance = gameData.cities[currentCity].distanceIndex;
    const destDistance = gameData.cities[destination].distanceIndex;
    const distance = Math.abs(currentDistance - destDistance);
    const cost = gameData.config.baseTravelCost + (distance * 100);
    return Math.min(cost, gameData.config.maxTravelCost);
  };
  const travelCost = calculateTravelCost(selectedCity);

  const handleFastTravel = () => {
    console.log('handleFastTravel called');
    setShowTravelModal(true);
  };

  const confirmFastTravel = () => {
    updateCash(-travelCost);
    travelToCity(selectedCity);
    setShowTravelModal(false);
    // Automatically navigate to trading page after travel
    onNavigate('trading');
  };

  const handleTradeHere = () => {
    onNavigate('trading');
  };

  useEffect(() => {
    if (showTravelModal) {
      console.log('Modal rendered, showTravelModal:', showTravelModal);
    }
  }, [showTravelModal]);

  return (
    <div className="market-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>💊 Market</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>View Drug Prices</div>
      </div>

      {/* City Selector */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '5px' }}>Select City:</div>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
          gap: '8px' 
        }}>
          {cities.map(city => (
            <button
              key={city}
              id={city === 'San Antonio' ? 'san-antonio-button' : `${city}-button`}
              onClick={() => {
                setSelectedCity(city);
                // Check if this is a tutorial click
                if (activeTutorial === 'gettingStarted' && stepIndex === 3) {
                  const step = tutorialSteps[activeTutorial][stepIndex];
                  if (step && step.requireClick && city === 'San Antonio') {
                    nextStep();
                  }
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                background: selectedCity === city ? '#66ff66' : '#222',
                color: selectedCity === city ? '#222' : '#fff',
                border: '1px solid #666',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {/* Current City Info */}
      <div style={{
        background: '#333',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px',
        border: '2px solid #ff6600'
      }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ff6600', marginBottom: '10px' }}>
          📍 Currently in: {currentCity}
        </div>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px' }}>
          Population: {gameData.cities[currentCity].population}
        </div>
        <button 
          className="action-btn" 
          onClick={handleTradeHere}
          style={{ width: '100%', background: '#ff6600', fontSize: '14px' }}
        >
          💼 Trade Here
        </button>
      </div>

      {/* Fast Travel Button */}
      {selectedCity !== currentCity && (
        <div style={{ marginBottom: '20px' }}>
          <button 
            id="fast-travel-button"
            className="action-btn" 
            onClick={() => {
              // Check if this is a tutorial click
              if (activeTutorial === 'gettingStarted' && stepIndex === 4) {
                const step = tutorialSteps[activeTutorial][stepIndex];
                if (step && step.requireClick) {
                  nextStep();
                }
              }
              handleFastTravel();
            }}
            style={{ width: '100%', background: '#ff6600' }}
            disabled={cash < travelCost}
          >
            ✈️ Fast Travel to {selectedCity} (${travelCost.toLocaleString()})
          </button>
        </div>
      )}

      {/* Travel Confirmation Modal */}
      <Modal
        isOpen={showTravelModal}
        onClose={() => setShowTravelModal(false)}
        title={`✈️ Confirm Travel`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Travel to <strong>{selectedCity}</strong> for <strong>${travelCost.toLocaleString()}</strong>?
          </p>
          <button className="action-btn" onClick={confirmFastTravel} disabled={cash < travelCost}>
            Confirm
          </button>
          <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setShowTravelModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>

      {/* Drug Prices Table */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#66ff66', marginBottom: '15px' }}>📊 {selectedCity} Prices</h4>
        <div style={{
          background: '#222',
          borderRadius: '10px',
          overflow: 'hidden'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr',
            gap: '0',
            background: '#444',
            padding: '10px',
            fontWeight: 'bold'
          }}>
            <div>Drug</div>
            <div>Price</div>
          </div>
          {Object.entries(prices).map(([drug, price]) => (
            <div key={drug} style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '0',
              padding: '10px',
              borderBottom: '1px solid #444'
            }}>
              <div>{drug}</div>
              <div style={{ color: '#66ff66' }}>${(price as number).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketScreen; 