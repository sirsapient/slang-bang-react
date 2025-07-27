import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useGame } from '../contexts/GameContext.jsx';
import { useTutorial } from '../contexts/TutorialContext.jsx';
import { Modal } from '../components/Modal';
// @ts-ignore
import { gameData } from '../game/data/gameData';

interface TravelScreenProps {
  onNavigate: (screen: string) => void;
}

export default function TravelScreen({ onNavigate }: TravelScreenProps) {
  const { state, updateCash, updateInventory, travelToCity } = useGame();
  const { nextStep, activeTutorial, stepIndex, tutorialSteps } = useTutorial();
  const cash = state.cash;
  const currentCity = state.currentCity;
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showArrestModal, setShowArrestModal] = useState(false);
  const [arrestData, setArrestData] = useState<any>(null);
  
  // Handle tutorial navigation back to home
  useEffect(() => {
    if (activeTutorial === 'gettingStarted' && stepIndex === 9) {
      const step = tutorialSteps[activeTutorial][stepIndex];
      if (step && step.id === 'return-home') {
        console.log('Tutorial: Navigating back to home for trading button step');
        // Navigate back to home after a short delay to show the message
        setTimeout(() => {
          onNavigate('home');
          nextStep();
        }, 2000);
      }
    }
  }, [activeTutorial, stepIndex, tutorialSteps, onNavigate, nextStep]);
  
  // Calculate heat level text
  const getHeatLevelText = () => {
    const heat = state.heatLevel;
    if (heat < 20) return 'Low';
    if (heat < 40) return 'Medium';
    if (heat < 70) return 'High';
    return 'Critical';
  };
  const heatLevel = getHeatLevelText();
  const heatColor = heatLevel === 'High' || heatLevel === 'Critical' ? '#ff6666' : '#66ff66';

  const handleCityClick = (cityName: string, cost: number) => {
    // Check if this is a tutorial click for Chicago
    if (activeTutorial === 'gettingStarted' && stepIndex === 8 && cityName === 'Chicago') {
      const step = tutorialSteps[activeTutorial][stepIndex];
      if (step && step.requireClick) {
        nextStep();
      }
    }
    
    if (cash >= cost) {
      setSelectedCity(cityName);
      setShowConfirm(true);
    }
  };
  
  // Calculate travel cost (moved from trading system)
  const calculateTravelCost = (destination: string) => {
    const currentDistance = gameData.cities[currentCity].distanceIndex;
    const destDistance = gameData.cities[destination].distanceIndex;
    const distance = Math.abs(currentDistance - destDistance);
    const cost = gameData.config.baseTravelCost + (distance * 100);
    return Math.min(cost, gameData.config.maxTravelCost);
  };

  const executeTravel = () => {
    if (!selectedCity) return;
    const cost = calculateTravelCost(selectedCity);
    updateCash(-cost);
    // Check for arrest/bust
    const inventory = state.inventory;
    // Calculate total drug value using current city prices
    const prices = gameData.cities[currentCity]?.prices || {};
    let totalDrugValue = 0;
    Object.keys(inventory).forEach(drug => {
      totalDrugValue += (inventory[drug] || 0) * (prices[drug] || 0);
    });
    const heat = state.heatLevel;
    let bustChance = 0;
    if (totalDrugValue > 0) {
      if (totalDrugValue < 30000) {
        bustChance = 0.01; // 1% chance for small hauls
      } else {
        bustChance = 0.01 + ((totalDrugValue - 30000) / 200000);
        if (heat >= 40) bustChance += 0.03;
        if (heat >= 70) bustChance += 0.05;
        bustChance = Math.min(bustChance, 0.3); // Cap at 30%
      }
    }
    const randomRoll = Math.random();
    if (bustChance > 0 && randomRoll < bustChance) {
      // Severity based on value
      let severity = 'mild';
      if (totalDrugValue >= 200000) severity = 'severe';
      else if (totalDrugValue >= 100000) severity = 'medium';
      setArrestData({ severity, totalDrugs: totalDrugValue });
      setShowArrestModal(true);
      setShowConfirm(false);
      return;
    }
    // Normal travel
    completeTravel();
  };
  
  const completeTravel = () => {
    if (!selectedCity) return;
    
    // Update location
    travelToCity(selectedCity);
    // TODO: Apply heat reduction, police raid, gang heat, and asset drops if needed
    setShowConfirm(false);
    setSelectedCity(null);
    onNavigate('home');
  };
  
  // checkNewDropsInCity: TODO for future asset system
  
  const handleArrest = (action: string) => {
    if (!arrestData) return;
    
    const { severity, totalDrugs } = arrestData;
    
    switch (severity) {
      case 'mild':
        if (action === 'pay') {
          updateCash(-1000);
          // TODO: updateWarrant(-5000);
        } else {
          // TODO: updateWarrant(2000);
        }
        break;
        
      case 'medium':
        // Confiscate all drugs
        Object.keys(state.inventory).forEach(drug => {
          updateInventory(drug, -state.inventory[drug]);
        });
        // TODO: updateWarrant(5000);
        break;
        
      case 'severe':
        // Take all drugs and cash
        Object.keys(state.inventory).forEach(drug => {
          updateInventory(drug, -state.inventory[drug]);
        });
        const currentCash = state.cash;
        updateCash(-currentCash);
        // TODO: updateWarrant(10000);
        break;
    }
    
    setShowArrestModal(false);
    completeTravel();
  };

  // Utility to normalize city keys
  function normalizeCityKey(city: string): string {
    return city.trim();
  }

  return (
    <div className="travel-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>✈️ Travel</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Choose Destination</div>
      </div>
      
      <div style={{
        background: '#333',
        padding: '10px',
        marginBottom: '15px',
        borderRadius: '8px',
        fontSize: '12px'
      }}>
        <div>💰 Your Cash: ${cash.toLocaleString()}</div>
        <div>📍 Current City: {currentCity}</div>
        <div>🔥 Heat Level: <span style={{ color: heatColor }}>{heatLevel}</span></div>
      </div>
      
      <div id="cityList">
        {Object.entries(gameData.cities).map(([cityName, cityData]) => {
          if (cityName === currentCity) return null;
          const cost = calculateTravelCost(cityName);
          const canAfford = cash >= cost;
          const normCity = normalizeCityKey(cityName);
          const hasBase = state.bases && state.bases[normCity] && state.bases[normCity].length > 0;
          return (
            <div
              key={cityName}
              id={cityName === 'Chicago' ? 'chicago-button' : `${cityName.toLowerCase()}-button`}
              className="city-item"
              style={{
                opacity: canAfford ? 1 : 0.5,
                cursor: canAfford ? 'pointer' : 'not-allowed'
              }}
              onClick={() => canAfford && handleCityClick(cityName, cost)}
            >
              <div className="city-header">
                <div className="city-name">
                  {cityName}
                  {hasBase && ' 🏠'}
                </div>
                <div className="travel-cost" style={{ color: canAfford ? '#ff6666' : '#ff0000' }}>
                  ${cost.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                Population: {(cityData as any).population}
                {!canAfford && ' • Cannot afford'}
                {state.heatLevel >= 40 && ' • Will reduce heat'}
                {hasBase && ' • You own a house here'}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Travel Confirmation Modal */}
      <Modal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setSelectedCity(null);
        }}
        title="✈️ Confirm Travel"
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', marginBottom: 10 }}>
            Travel to <strong>{selectedCity}</strong>?
          </div>
          <div style={{ fontSize: '15px', marginBottom: 10 }}>
            Cost: <span style={{ color: '#ffcc00' }}>${selectedCity ? calculateTravelCost(selectedCity).toLocaleString() : 0}</span>
          </div>
          {state.heatLevel >= 40 && (
            <div style={{ color: '#66ccff', marginBottom: 8 }}>
              🌊 Traveling will reduce your heat level!
            </div>
          )}
          {state.bases?.[selectedCity || ''] && (
            <div style={{ color: '#66ff66', marginBottom: 8 }}>
              🏠 You have a house in this city.
            </div>
          )}
          <div style={{ marginTop: '20px' }}>
            <button className="action-btn" onClick={executeTravel}>
              Confirm
            </button>
            <button className="action-btn" style={{ background: '#ff6666', marginLeft: 10 }} onClick={() => {
              setShowConfirm(false);
              setSelectedCity(null);
            }}>
              Cancel
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Arrest Modal */}
      {showArrestModal && arrestData && renderArrestModal()}
    </div>
  );
  
  function renderArrestModal() {
    const { severity } = arrestData;
    
    let content = '';
    let buttons: React.ReactNode[] = [];
    
    switch (severity) {
      case 'mild':
        content = 'You were stopped by police, but a quick bribe will get you out of trouble.<br><br>Pay $1,000 to walk away?';
        buttons = [
          <button
            key="pay"
            onClick={() => handleArrest('pay')}
            className="action-btn"
            style={{ margin: '0 10px' }}
          >
            Pay Bribe
          </button>,
          <button
            key="refuse"
            onClick={() => handleArrest('refuse')}
            className="action-btn"
            style={{ margin: '0 10px', background: '#ff6666' }}
          >
            Refuse
          </button>
        ];
        break;
        
      case 'medium':
        content = 'Police caught you with drugs! They confiscate all drugs on you.<br><br>Continue?';
        buttons = [
          <button
            key="continue"
            onClick={() => handleArrest('continue')}
            className="action-btn"
          >
            Continue
          </button>
        ];
        break;
        
      case 'severe':
        content = 'You were arrested! Police take all your drugs and all your cash.<br><br>Continue?';
        buttons = [
          <button
            key="continue"
            onClick={() => handleArrest('continue')}
            className="action-btn"
          >
            Continue
          </button>
        ];
        break;
    }
    
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <span className="modal-title">🚨 BUSTED!</span>
          </div>
          <div className="modal-body">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p dangerouslySetInnerHTML={{ __html: content }} />
              <div style={{ marginTop: '20px' }}>
                {buttons}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
} 