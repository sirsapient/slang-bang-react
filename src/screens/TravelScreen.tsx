import React, { useState, useEffect } from 'react';
// @ts-ignore
import { useGame } from '../contexts/GameContext.jsx';
import { useTutorial } from '../contexts/TutorialContext';
import { Modal } from '../components/Modal';
// @ts-ignore
import { gameData } from '../game/data/gameData';

interface TravelScreenProps {
  onNavigate: (screen: string) => void;
}

export default function TravelScreen({ onNavigate }: TravelScreenProps) {
  const { state, updateCash, updateInventory, travelToCity, addNotification } = useGame();
  const { nextStep, activeTutorial, stepIndex, tutorialSteps } = useTutorial();
  const cash = state.cash;
  const currentCity = state.currentCity;
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showArrestModal, setShowArrestModal] = useState(false);
  const [arrestData, setArrestData] = useState<any>(null);
  
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
        console.log('Tutorial: Chicago button clicked, advancing to next step');
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
    console.log('[DEBUG] executeTravel called - starting bust check');
    if (!selectedCity) return;
    const cost = calculateTravelCost(selectedCity);
    updateCash(-cost);
    // Check for arrest/bust
    const inventory = state.inventory;
    // Calculate total drug value using current city prices from state
    const prices = state.cityPrices?.[currentCity] || {};
    let totalDrugValue = 0;
    
    // Debug: Log inventory and prices
    console.log(`[DEBUG] Current inventory:`, inventory);
    console.log(`[DEBUG] Current city prices for ${currentCity}:`, prices);
    
    Object.keys(inventory).forEach(drug => {
      const quantity = inventory[drug] || 0;
      const price = prices[drug] || 0;
      const drugValue = quantity * price;
      totalDrugValue += drugValue;
      if (quantity > 0) {
        console.log(`[DEBUG] ${drug}: ${quantity} units × $${price} = $${drugValue.toLocaleString()}`);
      }
    });
    
    const heat = state.heatLevel;
    let bustChance = 0;
    if (totalDrugValue > 0) {
      // Base bust chance increases with drug value
      if (totalDrugValue < 10000) {
        bustChance = 0.005; // 0.5% chance for very small hauls
      } else if (totalDrugValue < 50000) {
        bustChance = 0.02; // 2% chance for small hauls
      } else if (totalDrugValue < 100000) {
        bustChance = 0.05; // 5% chance for medium hauls
      } else if (totalDrugValue < 200000) {
        bustChance = 0.10; // 10% chance for large hauls
      } else {
        bustChance = 0.15 + ((totalDrugValue - 200000) / 100000) * 0.05; // 15%+ for huge hauls
      }
      
      // Heat increases bust chance significantly
      if (heat >= 20) bustChance += 0.02;
      if (heat >= 40) bustChance += 0.05;
      if (heat >= 60) bustChance += 0.10;
      if (heat >= 80) bustChance += 0.15;
      
      // Cap at 50% maximum bust chance
      bustChance = Math.min(bustChance, 0.5);
    }
    
    console.log(`[DEBUG] Bust check - Total drug value: $${totalDrugValue.toLocaleString()}, Heat: ${heat}, Bust chance: ${(bustChance * 100).toFixed(1)}%`);
    
    const randomRoll = Math.random();
    console.log(`[DEBUG] Random roll: ${randomRoll.toFixed(3)} (need < ${bustChance.toFixed(3)} to bust)`);
    
    if (bustChance > 0 && randomRoll < bustChance) {
      console.log(`[DEBUG] BUSTED! Random roll ${randomRoll.toFixed(3)} < ${bustChance.toFixed(3)}`);
      // Severity based on value
      let severity = 'mild';
      if (totalDrugValue >= 200000) severity = 'severe';
      else if (totalDrugValue >= 100000) severity = 'medium';
      setArrestData({ severity, totalDrugs: totalDrugValue });
      setShowArrestModal(true);
      setShowConfirm(false);
      return;
    } else {
      console.log(`[DEBUG] Safe! Random roll ${randomRoll.toFixed(3)} >= ${bustChance.toFixed(3)}`);
      // Add notification for successful travel (optional - for debugging)
      if (totalDrugValue > 0) {
        addNotification(`✅ Traveled safely with $${totalDrugValue.toLocaleString()} worth of drugs. Bust chance was ${(bustChance * 100).toFixed(1)}%`, 'success');
      } else {
        addNotification(`✅ Traveled safely - no drugs in inventory.`, 'info');
      }
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
          addNotification(`🚨 BUSTED! Paid $1,000 bribe to avoid arrest. Drug value: $${totalDrugs.toLocaleString()}`, 'bust');
          // TODO: updateWarrant(-5000);
        } else {
          addNotification(`🚨 BUSTED! Refused bribe - warrant increased. Drug value: $${totalDrugs.toLocaleString()}`, 'bust');
          // TODO: updateWarrant(2000);
        }
        break;
        
      case 'medium':
        // Confiscate all drugs
        Object.keys(state.inventory).forEach(drug => {
          updateInventory(drug, -state.inventory[drug]);
        });
        addNotification(`🚨 BUSTED! All drugs confiscated. Lost $${totalDrugs.toLocaleString()} worth of drugs.`, 'bust');
        // TODO: updateWarrant(5000);
        break;
        
      case 'severe':
        // Take all drugs and cash
        Object.keys(state.inventory).forEach(drug => {
          updateInventory(drug, -state.inventory[drug]);
        });
        const currentCash = state.cash;
        updateCash(-currentCash);
        addNotification(`🚨 BUSTED! All drugs AND cash confiscated. Lost $${totalDrugs.toLocaleString()} in drugs + $${Math.floor(currentCash).toLocaleString()} cash.`, 'bust');
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

  // Debug function to test bust system
  const testBustSystem = () => {
    console.log('=== BUST SYSTEM TEST ===');
    const inventory = state.inventory;
    const prices = state.cityPrices?.[currentCity] || {};
    const heat = state.heatLevel;
    
    console.log('Current inventory:', inventory);
    console.log('Current city prices:', prices);
    console.log('Current heat level:', heat);
    
    let totalDrugValue = 0;
    Object.keys(inventory).forEach(drug => {
      const quantity = inventory[drug] || 0;
      const price = prices[drug] || 0;
      const drugValue = quantity * price;
      totalDrugValue += drugValue;
      if (quantity > 0) {
        console.log(`${drug}: ${quantity} units × $${price} = $${drugValue.toLocaleString()}`);
      }
    });
    
    console.log(`Total drug value: $${totalDrugValue.toLocaleString()}`);
    
    // Test bust chance calculation
    let bustChance = 0;
    if (totalDrugValue > 0) {
      if (totalDrugValue < 10000) {
        bustChance = 0.005;
      } else if (totalDrugValue < 50000) {
        bustChance = 0.02;
      } else if (totalDrugValue < 100000) {
        bustChance = 0.05;
      } else if (totalDrugValue < 200000) {
        bustChance = 0.10;
      } else {
        bustChance = 0.15 + ((totalDrugValue - 200000) / 100000) * 0.05;
      }
      
      if (heat >= 20) bustChance += 0.02;
      if (heat >= 40) bustChance += 0.05;
      if (heat >= 60) bustChance += 0.10;
      if (heat >= 80) bustChance += 0.15;
      
      bustChance = Math.min(bustChance, 0.5);
    }
    
    console.log(`Calculated bust chance: ${(bustChance * 100).toFixed(1)}%`);
    
    // Simulate 100 travel attempts to see bust frequency
    if (totalDrugValue > 0) {
      let bustCount = 0;
      for (let i = 0; i < 100; i++) {
        if (Math.random() < bustChance) {
          bustCount++;
        }
      }
      console.log(`Simulation: ${bustCount}/100 travel attempts would result in bust (${bustCount}%)`);
    }
    
    console.log('=== END TEST ===');
  };

  // Call test function on component mount
  useEffect(() => {
    testBustSystem();
    
    // Expose inventory to global scope for debugging
    (window as any).debugInventory = () => {
      console.log('Current inventory:', state.inventory);
      console.log('Current city prices:', state.cityPrices?.[currentCity]);
      console.log('Total inventory units:', Object.values(state.inventory).reduce((sum: number, qty: any) => sum + (qty as number), 0));
      return state.inventory;
    };
  }, []);

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
        <div>💰 Your Cash: ${Math.floor(cash).toLocaleString()}</div>
        <div>📍 Current City: {currentCity}</div>
        <div>🔥 Heat Level: <span style={{ color: heatColor }}>{heatLevel}</span></div>
        <div>🎒 Total Inventory: {Object.values(state.inventory).reduce((sum: number, qty: any) => sum + (qty as number), 0)} units</div>
        {Object.values(state.inventory).reduce((sum: number, qty: any) => sum + (qty as number), 0) > 0 && (
          <div style={{ color: '#ffcc66', marginTop: '5px', fontSize: '11px' }}>
            ⚠️ Traveling with drugs risks police bust!
          </div>
        )}
        <button 
          onClick={testBustSystem}
          style={{ 
            background: '#666', 
            color: '#fff', 
            border: 'none', 
            padding: '5px 10px', 
            borderRadius: '4px',
            fontSize: '10px',
            marginTop: '5px'
          }}
        >
          Debug: Test Bust System
        </button>
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