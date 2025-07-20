import React, { useState } from 'react';
import { useGame, useCash, useCurrentCity } from '../contexts/GameContext';
import { gameData } from '../game/data/gameData';

interface GangScreenProps {
  onNavigate: (screen: string) => void;
}

export default function GangScreen({ onNavigate }: GangScreenProps) {
  const { state, systems, refreshUI, events } = useGame();
  const cash = useCash();
  const currentCity = useCurrentCity();
  const gangMembers = state.gangMembers || {};
  const totalGang = state.gangSize || 0;
  const bases = state.bases || {};

  // Calculate available gang (not assigned to bases)
  const assignedGang = Object.values(bases).reduce((sum: number, base: any) => sum + (base.assignedGang || 0), 0);
  const availableGang = Math.max(0, totalGang - assignedGang);

  // Calculate current gang tier
  const currentTier = gameData.gangTiers.find((tier: any) => totalGang >= tier.range[0] && totalGang <= tier.range[1]);

  // Calculate cost to recruit next member
  const baseCost = gameData.config.baseGangCost || 10000;
  const gangCostScaling = gameData.config.gangCostScaling || 0.1;
  const cityModifier = gameData.cities[currentCity]?.heatModifier || 1.0;
  const gangSize = totalGang;
  const gangModifier = 1 + (gangSize * gangCostScaling);
  const recruitCost = Math.floor(baseCost * cityModifier * gangModifier);
  const maxAffordable = Math.floor(cash / recruitCost);

  const [recruitQty, setRecruitQty] = useState(1);
  const [recruiting, setRecruiting] = useState(false);

  // Recruit handler
  const handleRecruit = () => {
    if (recruitQty <= 0) return;
    if (cash < recruitCost * recruitQty) {
      alert('Not enough cash to recruit this many gang members.');
      return;
    }
    systems.bases.addGangMembers(currentCity, recruitQty);
    systems.bases.updateCash(-recruitCost * recruitQty);
    systems.heat.updateWarrant(recruitQty * gameData.config.gangRecruitHeat);
    events.add(`Recruited ${recruitQty} gang member${recruitQty > 1 ? 's' : ''} for $${(recruitCost * recruitQty).toLocaleString()}`, 'good');
    events.add(`Gang recruitment increased heat by ${(recruitQty * gameData.config.gangRecruitHeat).toLocaleString()}`, 'bad');
    setRecruiting(false);
    setRecruitQty(1);
    refreshUI();
  };

  return (
    <div className="gang-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>👥 Gang Management</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Manage your crew across cities</div>
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
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Total Gang</div>
          <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>{totalGang}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Available</div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>{availableGang}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>💰 Cash</div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>${cash.toLocaleString()}</div>
        </div>
      </div>

      {/* Gang Tier */}
      {currentTier && (
        <div style={{
          background: '#222',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '5px' }}>{currentTier.emoji}</div>
          <div style={{ fontWeight: 'bold', color: '#66ff66', fontSize: '16px' }}>{currentTier.name}</div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>{currentTier.description}</div>
        </div>
      )}

      {/* Gang by City */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Gang Members by City</div>
        {Object.entries(gangMembers).length === 0 && (
          <div style={{ color: '#666', textAlign: 'center', marginBottom: '10px' }}>No gang members recruited yet.</div>
        )}
        {Object.entries(gangMembers).map(([city, count]) => {
          const available = systems.bases.state.getAvailableGangMembersInCity(city);
          const assigned = (bases[city]?.assignedGang || 0);
          return (
            <div key={city} style={{
              background: '#222',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '10px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', color: '#ffff00' }}>{city}</div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>
                  {count} total &nbsp;|&nbsp; {available} available
                  {assigned > 0 && <span> &nbsp;|&nbsp; {assigned} assigned to base</span>}
                </div>
              </div>
              {city === currentCity && (
                <button
                  className="action-btn"
                  style={{ padding: '8px 16px', fontSize: '13px' }}
                  onClick={() => setRecruiting(true)}
                >
                  + Recruit
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Recruit Modal */}
      {recruiting && (
        <div className="modal-overlay" onClick={() => setRecruiting(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Recruit Gang Members</span>
              <button className="modal-close" onClick={() => setRecruiting(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ marginBottom: '10px', color: '#aaa' }}>
                Each member costs <span style={{ color: '#66ff66' }}>${recruitCost.toLocaleString()}</span><br />
                Heat per recruit: <span style={{ color: '#ff6666' }}>{gameData.config.gangRecruitHeat}</span>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <input
                  type="number"
                  min={1}
                  max={maxAffordable}
                  value={recruitQty}
                  onChange={e => setRecruitQty(Math.max(1, Math.min(maxAffordable, parseInt(e.target.value) || 1)))}
                  className="quantity-input"
                  style={{ width: '80px', marginRight: '10px' }}
                />
                <span style={{ color: '#aaa' }}>
                  (You can afford {maxAffordable})
                </span>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button className="action-btn" onClick={handleRecruit}>
                  Recruit
                </button>
                <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setRecruiting(false)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Heat Impact */}
      <div style={{
        background: '#222',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px',
        textAlign: 'center',
        color: '#ff6666',
        fontSize: '13px'
      }}>
        <span>🔥 Each gang member increases heat by {gameData.config.gangRecruitHeat} when recruited.</span>
      </div>

      <button className="action-btn" onClick={() => { console.log('Back to Home clicked'); onNavigate('home'); }} style={{ width: '100%', marginTop: '10px' }}>
        Back to Home
      </button>
    </div>
  );
} 