import React, { useState } from 'react';
import { useGame, useCurrentCity, useCash } from '../contexts/GameContext';
import { gameData } from '../game/data/gameData';

interface RaidScreenProps {
  onNavigate: (screen: string) => void;
}

interface EnemyBase {
  id: string;
  city: string;
  type: string;
  level: number;
  gang: number;
  guns: number;
  cash: number;
  drugs: { [key: string]: number };
}

export default function RaidScreen({ onNavigate }: RaidScreenProps) {
  const { state, systems, events, refreshUI } = useGame();
  const currentCity = useCurrentCity();
  const cash = useCash();
  const [selectedTarget, setSelectedTarget] = useState<EnemyBase | null>(null);
  const [raidGang, setRaidGang] = useState(1);
  const [showRaidModal, setShowRaidModal] = useState(false);
  const [raidResult, setRaidResult] = useState<any>(null);
  
  const gangMembers = state.gangMembers || {};
  const availableGang = state.getAvailableGangMembersInCity(currentCity);
  const guns = state.getInventory('guns') || 0;
  
  // Get enemy bases from the raid system
  const enemyBases = (window as any).enemyBases || [];
  
  const calculateRaidSuccess = (target: EnemyBase, gangSize: number) => {
    const targetStrength = target.gang + target.guns;
    const raiderStrength = gangSize + Math.min(gangSize, guns);
    const successChance = Math.min(0.95, raiderStrength / (targetStrength + 1));
    return Math.random() < successChance;
  };
  
  const calculateRaidRewards = (target: EnemyBase, success: boolean) => {
    if (!success) return { cash: 0, drugs: {}, heat: 1000 };
    
    const baseCash = Math.floor(target.cash * 0.3);
    const cashReward = Math.floor(baseCash * (0.5 + Math.random() * 0.5));
    
    const drugsReward: { [key: string]: number } = {};
    Object.entries(target.drugs).forEach(([drug, amount]) => {
      if (amount > 0) {
        const stolen = Math.floor(amount * (0.2 + Math.random() * 0.3));
        if (stolen > 0) {
          drugsReward[drug] = stolen;
        }
      }
    });
    
    const heatIncrease = Math.floor(target.level * 500 + Math.random() * 1000);
    
    return { cash: cashReward, drugs: drugsReward, heat: heatIncrease };
  };
  
  const handleRaid = () => {
    if (!selectedTarget || raidGang <= 0 || raidGang > availableGang) return;
    
    const success = calculateRaidSuccess(selectedTarget, raidGang);
    const rewards = calculateRaidRewards(selectedTarget, success);
    
    // Apply raid results
    if (success) {
      state.updateCash(rewards.cash);
      Object.entries(rewards.drugs).forEach(([drug, amount]) => {
        state.updateInventory(drug, amount);
      });
      
      events.add(`🎯 Raid successful! Stole $${rewards.cash.toLocaleString()} and drugs from ${selectedTarget.city}`, 'good');
      if (Object.keys(rewards.drugs).length > 0) {
        const drugList = Object.entries(rewards.drugs).map(([drug, amount]) => `${amount} ${drug}`).join(', ');
        events.add(`📦 Stolen drugs: ${drugList}`, 'good');
      }
    } else {
      events.add(`💥 Raid failed! Lost ${raidGang} gang members in ${selectedTarget.city}`, 'bad');
    }
    
    // Increase heat
    state.updateWarrant(rewards.heat);
    events.add(`🔥 Raid increased heat by ${rewards.heat.toLocaleString()}`, 'bad');
    
    // Remove gang members (lost in raid)
    state.removeGangMembersFromCity(currentCity, raidGang);
    
    // Remove target from enemy bases
    const targetIndex = enemyBases.findIndex((base: EnemyBase) => base.id === selectedTarget.id);
    if (targetIndex !== -1) {
      enemyBases.splice(targetIndex, 1);
    }
    
    setRaidResult({ success, rewards, target: selectedTarget });
    setShowRaidModal(false);
    refreshUI();
  };
  
  const generateNewEnemyBases = () => {
    const cities = Object.keys(gameData.cities);
    const baseTypes = ['small', 'medium', 'large'];
    const newBases: EnemyBase[] = [];
    
    for (let i = 0; i < 5; i++) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      const type = baseTypes[Math.floor(Math.random() * baseTypes.length)];
      const level = Math.floor(Math.random() * 5) + 1;
      const gang = Math.floor(Math.random() * 20) + 5;
      const guns = Math.floor(Math.random() * 10) + 2;
      const cash = Math.floor(Math.random() * 50000) + 10000;
      
      const drugs: { [key: string]: number } = {};
      Object.keys(gameData.drugs).forEach(drug => {
        if (Math.random() < 0.3) {
          drugs[drug] = Math.floor(Math.random() * 50) + 10;
        }
      });
      
      newBases.push({
        id: Date.now().toString() + i,
        city,
        type,
        level,
        gang,
        guns,
        cash,
        drugs
      });
    }
    
    (window as any).enemyBases = newBases;
    refreshUI();
  };
  
  return (
    <div className="raid-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>⚔️ Raid Enemy Bases</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Attack and Plunder</div>
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
              🎯 Targets
            </div>
            <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>
              {enemyBases.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              👥 Available Gang
            </div>
            <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>
              {availableGang}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              🔫 Guns
            </div>
            <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>
              {guns}
            </div>
          </div>
        </div>
      </div>
      
      {/* Generate New Targets */}
      <div style={{ marginBottom: '20px' }}>
        <button
          className="action-btn"
          onClick={generateNewEnemyBases}
          style={{ width: '100%', marginBottom: '10px' }}
        >
          🎲 Generate New Targets
        </button>
        <div style={{ fontSize: '12px', color: '#aaa', textAlign: 'center' }}>
          Find new enemy bases to raid
        </div>
      </div>
      
      {/* Enemy Bases */}
      {enemyBases.length > 0 ? (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '15px', textAlign: 'center' }}>
            🎯 Available Targets
          </div>
          {enemyBases.map((base: EnemyBase) => {
            const totalDrugs = Object.values(base.drugs).reduce((sum: number, amount: number) => sum + amount, 0);
            const targetStrength = base.gang + base.guns;
            const successChance = Math.min(0.95, (raidGang + Math.min(raidGang, guns)) / (targetStrength + 1));
            
            return (
              <div key={base.id} style={{
                background: '#222',
                border: '1px solid #444',
                borderRadius: '10px',
                padding: '15px',
                marginBottom: '15px',
                cursor: 'pointer'
              }}
              onClick={() => {
                setSelectedTarget(base);
                setRaidGang(Math.min(availableGang, Math.max(1, Math.floor(targetStrength * 0.8))));
                setShowRaidModal(true);
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#ffff00' }}>
                      {base.type.charAt(0).toUpperCase() + base.type.slice(1)} Base in {base.city}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>
                      Level {base.level} • {base.gang} gang • {base.guns} guns
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: '#66ff66', fontWeight: 'bold' }}>
                      ${base.cash.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '12px', color: '#ffff00' }}>
                      {totalDrugs} drugs
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                  <div>Strength: <span style={{ color: '#ff6666' }}>{targetStrength}</span></div>
                  <div>Success: <span style={{ color: '#66ff66' }}>{(successChance * 100).toFixed(0)}%</span></div>
                  <div>Cash: <span style={{ color: '#ffff00' }}>${base.cash.toLocaleString()}</span></div>
                  <div>Drugs: <span style={{ color: '#ffff00' }}>{totalDrugs}</span></div>
                </div>
                
                <div style={{ marginTop: '10px', fontSize: '12px', color: '#aaa' }}>
                  Click to raid this target
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: '#222',
          border: '1px solid #444',
          borderRadius: '10px',
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '16px', color: '#666', marginBottom: '10px' }}>
            No enemy bases available
          </div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            Generate new targets to find bases to raid
          </div>
        </div>
      )}
      
      {/* Raid Modal */}
      {showRaidModal && selectedTarget && (
        <div className="modal-overlay" onClick={() => setShowRaidModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">⚔️ Raid Target</span>
              <button className="modal-close" onClick={() => setShowRaidModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                    {selectedTarget.type.charAt(0).toUpperCase() + selectedTarget.type.slice(1)} Base in {selectedTarget.city}
                  </div>
                  <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
                    Level {selectedTarget.level} • {selectedTarget.gang} gang • {selectedTarget.guns} guns
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '15px' }}>
                    <div>Target Strength: <span style={{ color: '#ff6666' }}>{selectedTarget.gang + selectedTarget.guns}</span></div>
                    <div>Your Strength: <span style={{ color: '#66ff66' }}>{raidGang + Math.min(raidGang, guns)}</span></div>
                    <div>Success Chance: <span style={{ color: '#66ff66' }}>{(calculateRaidSuccess(selectedTarget, raidGang) * 100).toFixed(0)}%</span></div>
                    <div>Heat Increase: <span style={{ color: '#ff6666' }}>+{Math.floor(selectedTarget.level * 500 + Math.random() * 1000)}</span></div>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                    Gang Members to Send
                  </label>
                  <input
                    type="number"
                    value={raidGang}
                    onChange={(e) => setRaidGang(Math.max(1, Math.min(availableGang, parseInt(e.target.value) || 1)))}
                    min="1"
                    max={availableGang}
                    className="quantity-input"
                    style={{ width: '100%' }}
                  />
                  <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                    Available: {availableGang} • Guns: {guns}
                  </div>
                </div>
                
                <button
                  onClick={handleRaid}
                  className="action-btn"
                  style={{ width: '100%' }}
                  disabled={raidGang <= 0 || raidGang > availableGang}
                >
                  ⚔️ Launch Raid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Raid Result Modal */}
      {raidResult && (
        <div className="modal-overlay" onClick={() => setRaidResult(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">
                {raidResult.success ? '🎯 Raid Successful!' : '💥 Raid Failed!'}
              </span>
              <button className="modal-close" onClick={() => setRaidResult(null)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px', textAlign: 'center' }}>
                {raidResult.success ? (
                  <>
                    <div style={{ fontSize: '18px', color: '#66ff66', marginBottom: '15px' }}>
                      You successfully raided {raidResult.target.city}!
                    </div>
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '5px' }}>
                        Loot:
                      </div>
                      <div style={{ fontSize: '16px', color: '#66ff66', fontWeight: 'bold' }}>
                        ${raidResult.rewards.cash.toLocaleString()}
                      </div>
                      {Object.keys(raidResult.rewards.drugs).length > 0 && (
                        <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
                          {Object.entries(raidResult.rewards.drugs).map(([drug, amount]) => (
                            <div key={drug}>{amount} {drug}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: '18px', color: '#ff6666', marginBottom: '15px' }}>
                    The raid failed! You lost {raidGang} gang members.
                  </div>
                )}
                
                <div style={{ fontSize: '12px', color: '#ff6666', marginBottom: '20px' }}>
                  Heat increased by {raidResult.rewards.heat.toLocaleString()}
                </div>
                
                <button
                  onClick={() => setRaidResult(null)}
                  className="action-btn"
                  style={{ width: '100%' }}
                >
                  Continue
      </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 