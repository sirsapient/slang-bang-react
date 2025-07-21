import React, { useState } from 'react';
import { useGame, useCash, useCurrentCity } from '../contexts/GameContext';
import { Modal } from '../components/Modal';
import { gameData } from '../game/data/gameData'; // eslint-disable-line @typescript-eslint/no-var-requires

interface TravelScreenProps {
  onNavigate: (screen: string) => void;
}

export default function TravelScreen({ onNavigate }: TravelScreenProps) {
  const { state, systems, events } = useGame();
  const cash = useCash();
  const currentCity = useCurrentCity();
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showArrestModal, setShowArrestModal] = useState(false);
  const [arrestData, setArrestData] = useState<any>(null);
  
  const heatLevel = systems.heat.getHeatLevelText();
  const heatColor = heatLevel === 'High' || heatLevel === 'Critical' ? '#ff6666' : '#66ff66';

  const handleCityClick = (cityName: string, cost: number) => {
    if (cash >= cost) {
      setSelectedCity(cityName);
      setShowConfirm(true);
    }
  };
  
  const executeTravel = () => {
    if (!selectedCity) return;
    
    const cost = systems.trading.calculateTravelCost(selectedCity);
    
    // Deduct cost
    state.updateCash(-cost);
    
    // Check for arrest/bust
    const inventory = state.inventory;
    const totalDrugs = Object.values(inventory).reduce((a: number, b: any) => a + b, 0);
    const heat = state.heatLevel;
    
    let risk = 0;
    if (totalDrugs > 0) risk += 4; // Drugs in inventory
    if (heat >= 40) risk += 1; // High heat
    if (totalDrugs > 0 && heat >= 70) risk += 2; // High heat + drugs
    
    const bustChance = risk * 0.08;
    const randomRoll = Math.random();
    
    if (risk > 0 && randomRoll < bustChance) {
      // Determine severity
      let severity = 'mild';
      if (risk >= 5) severity = 'severe';
      else if (risk >= 3) severity = 'medium';
      
      setArrestData({ severity, totalDrugs });
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
    state.travelToCity(selectedCity);
    
    // Apply heat reduction
    systems.heat.applyTravelHeatReduction();
    
    // Trigger police raid and gang heat
    systems.heat.checkPoliceRaid();
    systems.heat.generateGangHeat();
    
    // Log event
    events.add(`✈️ Arrived in ${selectedCity}`, 'good');
    
    // Check for new drops
    checkNewDropsInCity(selectedCity);
    
    // Reset state and navigate
    setShowConfirm(false);
    setSelectedCity(null);
    onNavigate('home');
  };
  
  const checkNewDropsInCity = (cityName: string) => {
    // This would check for exclusive asset drops
    // For now, just a placeholder
    const cityDrops = systems.assetDrop?.getCityDrops(cityName) || [];
    const recentDrops = cityDrops.filter((drop: any) => {
      const timeSinceCreation = Date.now() - drop.createdAt;
      return timeSinceCreation < 10 * 60 * 1000; // 10 minutes
    });
    
    if (recentDrops.length > 0) {
      setTimeout(() => {
        alert(`🌟 New exclusive items available in ${cityName}!`);
      }, 500);
    }
  };
  
  const handleArrest = (action: string) => {
    if (!arrestData) return;
    
    const { severity, totalDrugs } = arrestData;
    
    switch (severity) {
      case 'mild':
        if (action === 'pay') {
          state.updateCash(-1000);
          state.updateWarrant(-5000);
          events.add('Bribed police and walked away.', 'good');
        } else {
          state.updateWarrant(2000);
          events.add('Refused bribe - warrant increased.', 'bad');
        }
        break;
        
      case 'medium':
        // Confiscate all drugs
        Object.keys(state.inventory).forEach(drug => {
          state.updateInventory(drug, -state.inventory[drug]);
        });
        state.updateWarrant(5000);
        events.add('Police took all your drugs.', 'bad');
        break;
        
      case 'severe':
        // Take all drugs and cash
        Object.keys(state.inventory).forEach(drug => {
          state.updateInventory(drug, -state.inventory[drug]);
        });
        const currentCash = state.cash;
        state.updateCash(-currentCash);
        state.updateWarrant(10000);
        events.add('Arrested! Lost all drugs and cash.', 'bad');
        break;
    }
    
    setShowArrestModal(false);
    completeTravel();
  };

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
          
          const cost = systems.trading.calculateTravelCost(cityName);
          const canAfford = cash >= cost;
          const hasBase = state.bases?.[cityName] != null;
          
          return (
          <div
              key={cityName}
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
                  {hasBase && ' 🏢'}
                </div>
                <div className="travel-cost" style={{ color: canAfford ? '#ff6666' : '#ff0000' }}>
                  ${cost.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>
                Population: {(cityData as any).population}
                {!canAfford && ' • Cannot afford'}
                {state.heatLevel >= 40 && ' • Will reduce heat'}
                {hasBase && ' • You own a base here'}
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
          <p dangerouslySetInnerHTML={{ __html: `Travel to ${selectedCity} for $${selectedCity ? systems.trading.calculateTravelCost(selectedCity).toLocaleString() : 0}?${
            state.heatLevel >= 40 ? '<br><br>🌊 Traveling will reduce your heat level!' : ''
          }${
            state.bases?.[selectedCity || ''] ? '<br><br>🏢 You have a base in this city.' : ''
          }` }} />
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