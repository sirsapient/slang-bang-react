// src/screens/RaidScreen.tsx
import React, { useState, useEffect } from 'react';
import { useGame, useCurrentCity } from '../contexts/GameContext.jsx';
import { Modal } from '../components/Modal';
import { gameData } from '../game/data/gameData';

interface RaidScreenProps {
  onNavigate: (screen: string) => void;
}

export default function RaidScreen({ onNavigate }: RaidScreenProps) {
  const {
    getAvailableGangMembers,
    getAvailableGangMembersInCity,
    getAvailableGunsInCity,
    getAllRaidTargets,
    isRaidTargetOnCooldown,
    executeRaid,
    calculateRaidSuccess,
    getDifficultyColor,
    getDifficultyText,
  } = useGame();
  const currentCity = useCurrentCity();
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [raidGangSize, setRaidGangSize] = useState(3);
  const [showResults, setShowResults] = useState(false);
  const [raidResult, setRaidResult] = useState<any>(null);
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownMessage, setCooldownMessage] = useState('');

  const availableGang = getAvailableGangMembers();
  const availableGangInCity = getAvailableGangMembersInCity(currentCity);
  const availableGunsInCity = getAvailableGunsInCity(currentCity);
  const targets = getAllRaidTargets(currentCity);

  useEffect(() => {
    // Reset gang size when switching targets
    if (selectedTarget) {
      setRaidGangSize(Math.min(3, availableGangInCity));
    }
  }, [selectedTarget, availableGangInCity]);

  const handleTargetSelect = (targetId: string) => {
    setSelectedTarget(targetId);
  };

  const handleExecuteRaid = () => {
    if (!selectedTarget) return;
    const result = executeRaid(selectedTarget, raidGangSize, currentCity);
    if (result && typeof result === 'object') {
      if (result.onCooldown) {
        setCooldownMessage(result.error);
        setShowCooldownModal(true);
      } else if (result.success !== undefined) {
        setRaidResult(result);
        setShowResults(true);
      } else if (result.error) {
        // handle other errors if needed
      }
    }
  };

  const getSelectedTarget = () => {
    if (!selectedTarget || !targets) return null;
    return targets.find((t: any) => t.id === selectedTarget);
  };

  const calculateSuccessChance = () => {
    const target = getSelectedTarget();
    if (!target) return 0;
    return calculateRaidSuccess(
      raidGangSize,
      availableGunsInCity,
      target.difficulty,
      target.gangSize
    );
  };

  // Always show inventory summary at the top
  const renderInventorySummary = () => (
    <div style={{
      background: '#333',
      border: '1px solid #666',
      borderRadius: '10px',
      padding: '15px',
      marginBottom: '20px'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '15px',
        textAlign: 'center'
      }}>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
            👥 Total Gang
          </div>
          <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>
            {availableGang}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
            🗺️ In {currentCity}
          </div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>
            {availableGangInCity}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
            🔫 Guns in {currentCity}
          </div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>
            {availableGunsInCity}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
            🎯 Targets
          </div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>
            {targets.length}
          </div>
        </div>
      </div>
    </div>
  );

  // Main render
  return (
    <div className="raid-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>⚔️ Base Raids</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Attack Enemy Bases</div>
      </div>
      {renderInventorySummary()}
      {availableGangInCity < 3 ? (
        <div style={{
          background: '#222',
          border: '1px solid #444',
          borderRadius: '10px',
          padding: '30px',
          textAlign: 'center',
          marginTop: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚔️</div>
          <div style={{ fontSize: '16px', color: '#aaa', marginBottom: '10px' }}>
            Insufficient Gang Members
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '20px' }}>
            You need at least 3 unassigned gang members in {currentCity} to conduct raids
          </div>
          <div style={{ fontSize: '11px', color: '#888' }}>
            💡 Tip: Recruit more gang members and keep them unassigned for raids
          </div>
        </div>
      ) : (
        <>
          {/* Target Selection */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '10px' }}>
              🎯 Select Target
            </div>
            {targets.map((target: any) => renderTargetCard(target))}
          </div>
          {/* Raid Planning */}
          {selectedTarget && renderRaidPlanning()}
        </>
      )}
      {/* Raid Results Modal */}
      <Modal
        isOpen={showResults}
        onClose={() => {
          setShowResults(false);
          setRaidResult(null);
          setSelectedTarget(null);
          setRaidGangSize(3);
        }}
        title="⚔️ Raid Results"
      >
        {renderRaidResults()}
      </Modal>
      {/* Raid Cooldown Modal */}
      <Modal
        isOpen={showCooldownModal}
        onClose={() => setShowCooldownModal(false)}
        title="⏳ Raid Cooldown"
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>{cooldownMessage}</div>
          <button className="action-btn" onClick={() => setShowCooldownModal(false)}>
            OK
          </button>
        </div>
      </Modal>
    </div>
  );

  function renderTargetCard(target: any) {
    const difficultyColor = getDifficultyColor(target.difficulty);
    const difficultyText = getDifficultyText(target.difficulty);
    const totalDrugs = Object.values(target.drugs).reduce((sum: number, count: any) => sum + count, 0);
    const currentTime = Date.now();
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
    const timeSinceLastRaid = currentTime - target.lastRaid;
    const isOnCooldown = isRaidTargetOnCooldown(target);
    const remainingMinutes = isOnCooldown ? Math.ceil((cooldownPeriod - timeSinceLastRaid) / 1000 / 60) : 0;
    return (
      <div
        key={target.id}
        className="raid-target"
        style={{
          background: '#222',
          border: `2px solid ${isOnCooldown ? '#666' : difficultyColor}`,
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '10px',
          cursor: isOnCooldown ? 'not-allowed' : 'pointer',
          opacity: isOnCooldown ? 0.6 : 1
        }}
        onClick={() => !isOnCooldown && handleTargetSelect(target.id)}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div>
            <div style={{ fontWeight: 'bold', color: '#fff' }}>
              {target.name}
              {isOnCooldown && ' ⏰'}
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>{target.city}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              color: isOnCooldown ? '#666' : difficultyColor,
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {isOnCooldown ? 'On Cooldown' : difficultyText}
            </div>
            <div style={{ fontSize: '10px', color: '#aaa' }}>
              {isOnCooldown ? `${remainingMinutes}m left` : 'Difficulty'}
            </div>
          </div>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          fontSize: '11px',
          color: '#aaa'
        }}>
          <div>💰 ${target.cash.toLocaleString()}</div>
          <div>📦 {totalDrugs} drugs</div>
          <div>👥 {target.gangSize} guards</div>
        </div>
        {isOnCooldown && (
          <div style={{
            background: '#333',
            padding: '8px',
            borderRadius: '5px',
            marginTop: '10px',
            textAlign: 'center',
            fontSize: '11px',
            color: '#ffaa00'
          }}>
            ⏰ Cooldown: {remainingMinutes} minutes remaining
          </div>
        )}
      </div>
    );
  }

  function renderRaidPlanning() {
    const target = getSelectedTarget();
    if (!target) return null;
    const successChance = calculateSuccessChance();
    const successColor = successChance > 0.7 ? '#66ff66' : 
                       successChance > 0.5 ? '#ffff00' : '#ff6666';
    const hasEnoughGuns = availableGunsInCity >= raidGangSize;
    const hasEnoughGang = availableGangInCity >= raidGangSize;
    const isOnCooldown = isRaidTargetOnCooldown(target);
    const canExecuteRaid = hasEnoughGuns && hasEnoughGang && !isOnCooldown;
    return (
      <div style={{
        background: '#222',
        border: '1px solid #444',
        borderRadius: '10px',
        padding: '15px'
      }}>
        <div style={{
          fontSize: '14px',
          color: '#ffff00',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          ⚔️ Raid Planning - {target.name}
        </div>
        {/* Success Chance */}
        <div style={{
          background: '#333',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
            Success Chance
          </div>
          <div style={{ fontSize: '24px', color: successColor, fontWeight: 'bold' }}>
            {Math.round(successChance * 100)}%
          </div>
        </div>
        {/* Gang Size Slider */}
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '8px' }}>
            👥 Gang Members in {currentCity}: {raidGangSize} / {availableGangInCity}
          </div>
          <input
            type="range"
            min="3"
            max={Math.min(availableGangInCity, 25)}
            value={raidGangSize}
            onChange={(e) => setRaidGangSize(parseInt(e.target.value))}
            style={{ width: '100%' }}
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: '#666',
            marginTop: '5px'
          }}>
            <span>3</span>
            <span>{Math.min(availableGangInCity, 25)}</span>
          </div>
        </div>
        {/* Raid Details */}
        <div style={{
          background: '#333',
          padding: '10px',
          borderRadius: '5px',
          marginBottom: '15px'
        }}>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '8px' }}>
            Raid Details
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            fontSize: '10px'
          }}>
            <div>Your Gang: <span style={{ color: '#ffff00' }}>{raidGangSize}</span></div>
            <div>Enemy Guards: <span style={{ color: '#ff6666' }}>{target.gangSize}</span></div>
            <div>
              Your Guns: <span style={{ color: hasEnoughGuns ? '#66ff66' : '#ff6666' }}>
                {availableGunsInCity}
              </span>
            </div>
            <div>
              Difficulty: <span style={{ color: getDifficultyColor(target.difficulty) }}>
                {getDifficultyText(target.difficulty)}
              </span>
            </div>
          </div>
        </div>
        {/* Validation Warnings */}
        {!hasEnoughGuns && (
          <div style={{
            background: '#220000',
            border: '1px solid #660000',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '12px', color: '#ff6666' }}>
              ⚠️ Not enough guns! You need {raidGangSize} guns for {raidGangSize} gang members,
              but only have {availableGunsInCity} available in {currentCity}.
            </div>
          </div>
        )}
        {/* Execute Raid */}
        <button
          onClick={handleExecuteRaid}
          className="action-btn"
          style={{
            width: '100%',
            padding: '12px',
            background: canExecuteRaid ? '#660000' : '#333',
            borderColor: canExecuteRaid ? '#ff6666' : '#666'
          }}
          disabled={!canExecuteRaid}
        >
          ⚔️ Execute Raid
        </button>
      </div>
    );
  }

  function renderRaidResults() {
    if (!raidResult) return null;
    if (raidResult.success) {
      const cash = raidResult.loot?.cash || 0;
      const drugs = raidResult.loot?.drugs || {};
      const heatIncrease = raidResult.heatIncrease || 0;
      return (
        <div style={{ padding: '20px' }}>
          <div style={{
            background: '#002200',
            border: '1px solid #006600',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>✅</div>
            <div style={{
              fontSize: '18px',
              color: '#66ff66',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Raid Successful!
            </div>
            <div style={{ fontSize: '14px', color: '#aaffaa' }}>
              Looted ${cash.toLocaleString()} and drugs
            </div>
          </div>
          <div style={{
            background: '#222',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px'
          }}>
            <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '10px' }}>
              Loot Details
            </div>
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              <div>💰 Cash: ${cash.toLocaleString()}</div>
              {Object.keys(drugs).map(drug => (
                <div key={drug}>📦 {drug}: {drugs[drug]}</div>
              ))}
            </div>
          </div>
          <div style={{
            background: '#220000',
            border: '1px solid #660000',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <div style={{ fontSize: '12px', color: '#ff6666' }}>
              🔥 Heat increased by {heatIncrease.toLocaleString()}
            </div>
          </div>
        </div>
      );
    } else {
      const heatIncrease = raidResult.heatIncrease || 0;
      return (
        <div style={{ padding: '20px' }}>
          <div style={{
            background: '#220000',
            border: '1px solid #660000',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center',
            marginBottom: '20px'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>❌</div>
            <div style={{
              fontSize: '18px',
              color: '#ff6666',
              fontWeight: 'bold',
              marginBottom: '10px'
            }}>
              Raid Failed!
            </div>
            <div style={{ fontSize: '14px', color: '#ffaaaa' }}>
              Your gang was defeated
            </div>
          </div>
          <div style={{
            background: '#220000',
            border: '1px solid #660000',
            borderRadius: '8px',
            padding: '15px'
          }}>
            <div style={{ fontSize: '12px', color: '#ff6666' }}>
              🔥 Heat increased by {heatIncrease.toLocaleString()}
            </div>
          </div>
        </div>
      );
    }
  }
} 