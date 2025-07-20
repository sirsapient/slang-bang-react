import React, { useState } from 'react';
import { useGame, useCash, useCurrentCity } from '../contexts/GameContext';
import { gameData } from '../game/data/gameData';

interface BasesScreenProps {
  onNavigate: (screen: string) => void;
}

export default function BasesScreen({ onNavigate }: BasesScreenProps) {
  const { state, systems, refreshUI, events } = useGame();
  const cash = useCash();
  const currentCity = useCurrentCity();
  const bases = state.bases || {};
  const gangMembers = state.gangMembers || {};
  const gunsByCity = state.gunsByCity || {};
  const [showPurchase, setShowPurchase] = useState(false);
  const [purchaseCity, setPurchaseCity] = useState('');
  const [upgradeCity, setUpgradeCity] = useState('');

  // Summary
  const baseSummary = systems.bases.getBaseSummary();

  // Helper: get base type info
  const getBaseType = (level: number) => gameData.baseTypes[level];

  // Helper: get available cities for new base
  const ownedCities = Object.keys(bases);
  const availableCities = Object.keys(gameData.cities).filter(city => !ownedCities.includes(city));

  // Purchase base handler
  const handlePurchaseBase = (city: string) => {
    const result = systems.bases.purchaseBase(city);
    if (!result.success && result.error) {
      alert(result.error);
    } else {
      events.add(`Purchased base in ${city}`, 'good');
      setShowPurchase(false);
      refreshUI();
    }
  };

  // Collect all income handler
  const handleCollectAll = () => {
    const result = systems.bases.collectAllBaseCash();
    if (!result.success && result.error) {
      alert(result.error);
    } else {
      events.add(`Collected all base income`, 'good');
      refreshUI();
    }
  };

  // Upgrade base handler
  const handleUpgradeBase = (city: string) => {
    const result = systems.bases.upgradeBase(city);
    if (!result.success && result.error) {
      alert(result.error);
    } else {
      events.add(`Upgraded base in ${city}`, 'good');
      setUpgradeCity('');
      refreshUI();
    }
  };

  // Collect cash from a single base
  const handleCollectBase = (city: string) => {
    const base = bases[city];
    if (base && base.cashStored > 0) {
      state.updateCash(base.cashStored);
      base.cashStored = 0;
      events.add(`Collected $${base.cashStored.toLocaleString()} from ${city} base`, 'good');
      refreshUI();
    }
  };

  return (
    <div className="bases-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>🏢 Bases</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Manage your empire's safehouses</div>
      </div>

      {/* Summary */}
      <div style={{
        background: '#333',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '10px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Bases Owned</div>
          <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>{baseSummary.basesOwned}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Total Cash Stored</div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>${baseSummary.totalCashStored.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Daily Income</div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>${baseSummary.dailyIncome.toLocaleString()}</div>
        </div>
      </div>

      {/* Collect All Income */}
      <button className="action-btn" style={{ width: '100%', marginBottom: '20px' }} onClick={handleCollectAll}>
        💰 Collect All Income
      </button>

      {/* List of Bases */}
      <div style={{ marginBottom: '20px' }}>
        {Object.keys(bases).length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', marginBottom: '10px' }}>You don't own any bases yet.</div>
        )}
        {Object.entries(bases).map(([city, base]: [string, any]) => {
          const baseType = getBaseType(base.level);
          const canUpgrade = baseType.upgradeCost && cash >= baseType.upgradeCost;
          const drugsStored = Object.entries(base.inventory || {}).filter(([_, qty]) => (qty as number) > 0);
          const operational = base.operational;
          return (
            <div key={city} style={{
              background: '#222',
              border: '1px solid #444',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#ffff00', fontSize: '16px' }}>{city}</div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>{baseType.name} (Level {base.level})</div>
                </div>
                <div>
                  {operational ? (
                    <span style={{ color: '#66ff66', fontWeight: 'bold' }}>Operational</span>
                  ) : (
                    <span style={{ color: '#ff6666', fontWeight: 'bold' }}>Not Operational</span>
                  )}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px', marginBottom: '8px' }}>
                <div>👥 Gang: {base.assignedGang} / {baseType.gangRequired}</div>
                <div>🔫 Guns: {base.guns || 0} / {baseType.gunsRequired}</div>
                <div>💰 Cash: ${base.cashStored.toLocaleString()}</div>
                <div>📦 Drugs: {drugsStored.length > 0 ? drugsStored.map(([drug, qty]) => `${drug} (${qty})`).join(', ') : 'None'}</div>
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                {base.cashStored > 0 && (
                  <button className="action-btn" onClick={() => handleCollectBase(city)}>
                    Collect Cash
                  </button>
                )}
                {baseType.upgradeCost && (
                  <button
                    className="action-btn"
                    style={{ background: canUpgrade ? '#00ff00' : '#666', color: '#000' }}
                    disabled={!canUpgrade}
                    onClick={() => handleUpgradeBase(city)}
                  >
                    Upgrade (${baseType.upgradeCost.toLocaleString()})
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Purchase New Base */}
      <button className="action-btn" style={{ width: '100%', marginBottom: '20px' }} onClick={() => setShowPurchase(true)}>
        + Purchase New Base
      </button>
      {showPurchase && (
        <div className="modal-overlay" onClick={() => setShowPurchase(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Purchase New Base</span>
              <button className="modal-close" onClick={() => setShowPurchase(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '10px', color: '#aaa' }}>
                Select a city to purchase a base:
              </div>
              {availableCities.length === 0 && <div style={{ color: '#666' }}>No cities available for new bases.</div>}
              {availableCities.map(city => {
                const baseType = getBaseType(1);
                const canAfford = cash >= baseType.cost;
                const hasGang = (gangMembers[city] || 0) >= baseType.gangRequired;
                return (
                  <div key={city} style={{
                    background: '#222',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontWeight: 'bold', color: '#ffff00' }}>{city}</div>
                      <div style={{ fontSize: '12px', color: '#aaa' }}>
                        Cost: ${baseType.cost.toLocaleString()} | Gang: {baseType.gangRequired}+
                      </div>
                    </div>
                    <button
                      className="action-btn"
                      style={{ background: canAfford && hasGang ? '#00ff00' : '#666', color: '#000' }}
                      disabled={!canAfford || !hasGang}
                      onClick={() => handlePurchaseBase(city)}
                    >
                      Purchase
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <button className="action-btn" onClick={() => onNavigate('home')} style={{ width: '100%', marginTop: '10px' }}>
        Back to Home
      </button>
    </div>
  );
} 