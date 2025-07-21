import React, { useState } from 'react';
import { useGame, useCurrentCity, useCash } from '../contexts/GameContext';
import { gameData } from '../game/data/gameData';

interface BasesScreenProps {
  onNavigate: (screen: string) => void;
}

export default function BasesScreen({ onNavigate }: BasesScreenProps) {
  const { state, systems, events, refreshUI } = useGame();
  const currentCity = useCurrentCity();
  const cash = useCash();
  const [selectedBase, setSelectedBase] = useState<string>('');
  const [assignGang, setAssignGang] = useState(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  
  const bases = state.bases || {};
  const gangMembers = state.gangMembers || {};
  const availableGang = state.getAvailableGangMembersInCity(currentCity);
  const cityBases = bases[currentCity] || [];
  
  const baseTypes = gameData.baseTypes || {
    small: { name: 'Small Base', cost: 50000, income: 1000, capacity: 10 },
    medium: { name: 'Medium Base', cost: 150000, income: 3000, capacity: 25 },
    large: { name: 'Large Base', cost: 500000, income: 10000, capacity: 50 }
  };
  
  const calculateBaseCost = (type: string) => {
    const baseType = baseTypes[type];
    const cityData = gameData.cities[currentCity];
    const cityModifier = cityData?.heatModifier || 1.0;
    return Math.floor(baseType.cost * cityModifier);
  };
  
  const calculateUpgradeCost = (base: any, newType: string) => {
    const currentType = base.type;
    const currentCost = calculateBaseCost(currentType);
    const newCost = calculateBaseCost(newType);
    return Math.floor((newCost - currentCost) * 0.8); // 20% discount for upgrade
  };
  
  const handlePurchaseBase = (type: string) => {
    const cost = calculateBaseCost(type);
    if (!state.canAfford(cost)) {
      alert(`Not enough cash. Need $${cost.toLocaleString()}`);
      return;
    }
    
    const newBase = {
      id: Date.now().toString(),
      type,
      level: 1,
      assignedGang: 0,
      income: baseTypes[type].income,
      capacity: baseTypes[type].capacity,
      lastCollected: Date.now()
    };
    
    if (!bases[currentCity]) {
      bases[currentCity] = [];
    }
    bases[currentCity].push(newBase);
    
    state.updateCash(-cost);
    state.bases = bases;
    
    events.add(`Purchased ${baseTypes[type].name} in ${currentCity} for $${cost.toLocaleString()}`, 'good');
    setShowPurchaseModal(false);
    refreshUI();
  };
  
  const handleUpgradeBase = (baseId: string, newType: string) => {
    const base = cityBases.find(b => b.id === baseId);
    if (!base) return;
    
    const upgradeCost = calculateUpgradeCost(base, newType);
    if (!state.canAfford(upgradeCost)) {
      alert(`Not enough cash. Need $${upgradeCost.toLocaleString()}`);
      return;
    }
    
    base.type = newType;
    base.income = baseTypes[newType].income;
    base.capacity = baseTypes[newType].capacity;
    
    state.updateCash(-upgradeCost);
    
    events.add(`Upgraded base in ${currentCity} to ${baseTypes[newType].name} for $${upgradeCost.toLocaleString()}`, 'good');
    setShowUpgradeModal(false);
    refreshUI();
  };
  
  const handleAssignGang = (baseId: string) => {
    const base = cityBases.find(b => b.id === baseId);
    if (!base || assignGang <= 0 || assignGang > availableGang) return;
    
    const currentAssigned = base.assignedGang || 0;
    const newAssigned = Math.min(currentAssigned + assignGang, base.capacity);
    const actualAssigned = newAssigned - currentAssigned;
    
    if (actualAssigned > 0) {
      base.assignedGang = newAssigned;
      events.add(`Assigned ${actualAssigned} gang members to base in ${currentCity}`, 'good');
      setAssignGang(1);
      refreshUI();
    }
  };
  
  const handleCollectIncome = (baseId: string) => {
    const base = cityBases.find(b => b.id === baseId);
    if (!base) return;
    
    const now = Date.now();
    const timeSinceLastCollect = now - (base.lastCollected || now);
    const hoursSinceLastCollect = timeSinceLastCollect / (1000 * 60 * 60);
    
    if (hoursSinceLastCollect < 1) {
      alert('Income can only be collected once per hour');
      return;
    }
    
    const income = base.income * (base.assignedGang || 0);
    state.updateCash(income);
    base.lastCollected = now;
    
    events.add(`Collected $${income.toLocaleString()} from base in ${currentCity}`, 'good');
    refreshUI();
  };
  
  const totalIncome = cityBases.reduce((sum, base) => {
    const timeSinceLastCollect = (Date.now() - (base.lastCollected || Date.now())) / (1000 * 60 * 60);
    const income = base.income * (base.assignedGang || 0) * Math.min(timeSinceLastCollect, 24);
    return sum + income;
  }, 0);
  
  return (
    <div className="bases-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>🏢 Base Management</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Control Your Empire</div>
      </div>
      
      {/* Overview */}
      <div style={{
        background: '#333',
        border: '1px solid #666',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              🏢 Bases
            </div>
            <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>
              {cityBases.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              💰 Available Income
            </div>
            <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>
              ${totalIncome.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              👥 Available Gang
            </div>
            <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>
              {availableGang}
            </div>
          </div>
        </div>
      </div>
      
      {/* Purchase New Base */}
      <div className="market-item">
        <div className="market-header">
          <div className="drug-name">🏢 Purchase New Base</div>
          <div className="drug-price">${calculateBaseCost('small').toLocaleString()}</div>
        </div>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px' }}>
          Bases generate income and provide storage. Assign gang members to increase income.
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
          {Object.entries(baseTypes).map(([type, baseType]) => {
            const cost = calculateBaseCost(type);
            return (
              <button
                key={type}
                className="action-btn"
                onClick={() => {
                  setSelectedBase(type);
                  setShowPurchaseModal(true);
                }}
                disabled={cost > cash}
                style={{
                  background: cost > cash ? '#444' : '#333',
                  color: cost > cash ? '#666' : '#fff',
                  padding: '15px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  {baseType.name}
                </div>
                <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                  ${cost.toLocaleString()}
                </div>
                <div style={{ fontSize: '10px', color: '#66ff66' }}>
                  ${baseType.income.toLocaleString()}/hr
                </div>
                <div style={{ fontSize: '10px', color: '#ffff00' }}>
                  {baseType.capacity} capacity
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Existing Bases */}
      {cityBases.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '15px', textAlign: 'center' }}>
            🏢 Your Bases in {currentCity}
          </div>
          {cityBases.map((base, index) => {
            const baseType = baseTypes[base.type];
            const timeSinceLastCollect = (Date.now() - (base.lastCollected || Date.now())) / (1000 * 60 * 60);
            const availableIncome = base.income * (base.assignedGang || 0) * Math.min(timeSinceLastCollect, 24);
            const canCollect = timeSinceLastCollect >= 1;
            
            return (
              <div key={base.id} style={{
                background: '#222',
                border: '1px solid #444',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffff00' }}>
                      {baseType.name} #{index + 1}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      Level {base.level} • {base.assignedGang || 0}/{base.capacity} gang assigned
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: '#66ff66', fontWeight: 'bold' }}>
                      ${(base.income * (base.assignedGang || 0)).toLocaleString()}/hr
                    </div>
                    <div style={{ fontSize: '12px', color: '#ffff00' }}>
                      ${availableIncome.toLocaleString()} available
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="number"
                    value={assignGang}
                    onChange={(e) => setAssignGang(Math.max(0, parseInt(e.target.value) || 0))}
                    min="0"
                    max={availableGang}
                    className="quantity-input"
                    placeholder="Gang to assign"
                  />
                  <button
                    className="action-btn"
                    onClick={() => handleAssignGang(base.id)}
                    disabled={assignGang <= 0 || assignGang > availableGang}
                    style={{ fontSize: '12px', padding: '8px 12px' }}
                  >
                    Assign
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => handleCollectIncome(base.id)}
                    disabled={!canCollect || availableIncome <= 0}
                    style={{ 
                      fontSize: '12px', 
                      padding: '8px 12px',
                      background: canCollect && availableIncome > 0 ? '#66ff66' : '#444',
                      color: canCollect && availableIncome > 0 ? '#000' : '#666'
                    }}
                  >
                    Collect
                  </button>
                </div>
                
                {/* Upgrade Options */}
                <div style={{ marginTop: '10px', display: 'flex', gap: '5px' }}>
                  {Object.entries(baseTypes).map(([type, upgradeType]) => {
                    if (type === base.type) return null;
                    const upgradeCost = calculateUpgradeCost(base, type);
                    return (
                      <button
                        key={type}
                        className="action-btn"
                        onClick={() => {
                          setSelectedBase(base.id);
                          setShowUpgradeModal(true);
                        }}
                        disabled={upgradeCost > cash}
                        style={{
                          background: upgradeCost > cash ? '#444' : '#333',
                          color: upgradeCost > cash ? '#666' : '#fff',
                          fontSize: '10px',
                          padding: '5px 8px'
                        }}
                      >
                        Upgrade to {upgradeType.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Purchase Modal */}
      {showPurchaseModal && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🏢 Purchase Base</span>
              <button className="modal-close" onClick={() => setShowPurchaseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                    {baseTypes[selectedBase].name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
                    {baseTypes[selectedBase].description || 'A base for your operations'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                    <div>Cost: <span style={{ color: '#ffff00' }}>${calculateBaseCost(selectedBase).toLocaleString()}</span></div>
                    <div>Income: <span style={{ color: '#66ff66' }}>${baseTypes[selectedBase].income.toLocaleString()}/hr</span></div>
                    <div>Capacity: <span style={{ color: '#ffff00' }}>{baseTypes[selectedBase].capacity} gang</span></div>
                    <div>Location: <span style={{ color: '#ffff00' }}>{currentCity}</span></div>
                  </div>
                </div>
                
                <button
                  onClick={() => handlePurchaseBase(selectedBase)}
                  className="action-btn"
                  style={{ width: '100%' }}
                  disabled={calculateBaseCost(selectedBase) > cash}
                >
                  Purchase for ${calculateBaseCost(selectedBase).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="modal-overlay" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⬆️ Upgrade Base</span>
              <button className="modal-close" onClick={() => setShowUpgradeModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '10px' }}>
                    Upgrade Options
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px' }}>
                    Choose a new base type to upgrade to:
                  </div>
                  {Object.entries(baseTypes).map(([type, upgradeType]) => {
                    const upgradeCost = calculateUpgradeCost(cityBases.find(b => b.id === selectedBase), type);
                    return (
                      <button
                        key={type}
                        className="action-btn"
                        onClick={() => handleUpgradeBase(selectedBase, type)}
                        disabled={upgradeCost > cash}
                        style={{
                          width: '100%',
                          marginBottom: '10px',
                          background: upgradeCost > cash ? '#444' : '#333',
                          color: upgradeCost > cash ? '#666' : '#fff',
                          textAlign: 'left',
                          padding: '15px'
                        }}
                      >
                        <div style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {upgradeType.name}
                        </div>
                        <div style={{ fontSize: '12px', color: '#aaa' }}>
                          Cost: ${upgradeCost.toLocaleString()} • Income: ${upgradeType.income.toLocaleString()}/hr • Capacity: {upgradeType.capacity}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 