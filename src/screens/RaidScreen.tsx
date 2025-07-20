import React, { useState } from 'react';
import { useGame, useCurrentCity } from '../contexts/GameContext';
import { gameData } from '../game/data/gameData';

interface RaidScreenProps {
  onNavigate: (screen: string) => void;
}

export default function RaidScreen({ onNavigate }: RaidScreenProps) {
  const { state, systems, refreshUI, events } = useGame();
  const currentCity = useCurrentCity();
  const [selectedCity, setSelectedCity] = useState(currentCity);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [raidGang, setRaidGang] = useState(1);
  const [raidResult, setRaidResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);

  // Get available cities (where you have gang/guns)
  const citiesWithGang = Object.keys(state.gangMembers || {}).filter(city => (state.gangMembers[city] || 0) > 0);
  const allCities = Array.from(new Set([currentCity, ...citiesWithGang]));

  // Get available targets for selected city
  const targets = systems.raid.getAvailableTargets(selectedCity);

  // Get available gang/guns in selected city
  const availableGang = systems.bases.state.getAvailableGangMembersInCity(selectedCity);
  const availableGuns = systems.bases.state.getAvailableGunsInCity(selectedCity);

  // Calculate success chance
  const successChance = selectedTarget
    ? systems.raid.calculateRaidSuccess(
        raidGang,
        Math.min(raidGang, availableGuns),
        selectedTarget.difficulty,
        selectedTarget.gangSize
      )
    : 0;

  // Handle raid action
  const handleRaid = () => {
    if (!selectedTarget) return;
    if (raidGang > availableGang) {
      alert('Not enough gang members in this city.');
      return;
    }
    if (raidGang > availableGuns) {
      alert('Not enough guns in this city.');
      return;
    }
    const result = systems.raid.executeRaid(selectedTarget.id, raidGang);
    setRaidResult(result);
    setShowResult(true);
    refreshUI();
  };

  // Render
  return (
    <div className="raid-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>⚔️ Raid Enemy Bases</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Attack rival bases for cash and drugs</div>
      </div>

      {/* City Selector */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '5px' }}>Select City:</div>
        <select
          value={selectedCity}
          onChange={e => {
            setSelectedCity(e.target.value);
            setSelectedTarget(null);
          }}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', background: '#222', color: '#00ff00', border: '1px solid #666' }}
        >
          {allCities.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

      {/* Available Gang/Guns */}
      <div style={{
        background: '#333',
        borderRadius: '10px',
        padding: '10px',
        marginBottom: '15px',
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '13px'
      }}>
        <div>👥 Gang: {availableGang}</div>
        <div>🔫 Guns: {availableGuns}</div>
      </div>

      {/* Target List */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Available Targets</div>
        {targets.length === 0 && <div style={{ color: '#666' }}>No enemy bases available to raid in this city.</div>}
        {targets.map((target: any) => (
          <div
            key={target.id}
            className={`target-item${selectedTarget && selectedTarget.id === target.id ? ' selected' : ''}`}
            style={{
              background: selectedTarget && selectedTarget.id === target.id ? '#444' : '#222',
              border: '1px solid #444',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '10px',
              cursor: 'pointer'
            }}
            onClick={() => setSelectedTarget(target)}
          >
            <div style={{ fontWeight: 'bold', color: '#ffff00' }}>{target.name}</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>Gang: {target.gangSize} | Cash: ${target.cash.toLocaleString()} | Difficulty: {(target.difficulty * 100).toFixed(0)}%</div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>Drugs: {Object.entries(target.drugs).map(([drug, qty]) => `${drug} (${qty})`).join(', ')}</div>
          </div>
        ))}
      </div>

      {/* Raid Setup */}
      {selectedTarget && (
        <div style={{
          background: '#222',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Prepare Raid</div>
          <div style={{ marginBottom: '10px' }}>
            <label>Gang Members to Send:</label>
            <input
              type="number"
              min={1}
              max={availableGang}
              value={raidGang}
              onChange={e => setRaidGang(Math.max(1, Math.min(availableGang, parseInt(e.target.value) || 1)))}
              className="quantity-input"
              style={{ width: '80px', marginLeft: '10px' }}
            />
          </div>
          <div style={{ fontSize: '13px', color: '#aaa', marginBottom: '10px' }}>
            Success Chance: <span style={{ color: successChance > 0.5 ? '#66ff66' : '#ff6666' }}>{(successChance * 100).toFixed(0)}%</span>
          </div>
          <button className="action-btn" style={{ width: '100%' }} onClick={handleRaid}>
            ⚔️ Execute Raid
          </button>
        </div>
      )}

      {/* Raid Result Modal */}
      {showResult && raidResult && (
        <div className="modal-overlay" onClick={() => setShowResult(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Raid Result</span>
              <button className="modal-close" onClick={() => setShowResult(false)}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              {raidResult.success ? (
                <>
                  <div style={{ fontSize: '20px', color: '#66ff66', marginBottom: '10px' }}>Raid Successful!</div>
                  <div>Looted: <strong>${raidResult.loot.cash.toLocaleString()}</strong></div>
                  <div>Drugs: {Object.entries(raidResult.loot.drugs).length > 0 ? Object.entries(raidResult.loot.drugs).map(([drug, qty]) => `${drug} (${qty})`).join(', ') : 'None'}</div>
                  <div style={{ marginTop: '10px', color: '#ff6666' }}>Heat Gained: +{raidResult.heatIncrease.toLocaleString()}</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '20px', color: '#ff6666', marginBottom: '10px' }}>Raid Failed!</div>
                  <div style={{ marginTop: '10px', color: '#ff6666' }}>Heat Gained: +{raidResult.heatIncrease.toLocaleString()}</div>
                </>
              )}
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