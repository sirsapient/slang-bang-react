import React, { useState } from 'react';
import { useGame, useCash, useCurrentCity, useNetWorth } from '../contexts/GameContext';
import { Modal } from '../components/Modal';
import { PlayerCard } from '../components/PlayerCard';
import { gameData } from '../game/data/gameData';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { state, systems, events } = useGame();
  const cash = useCash();
  const currentCity = useCurrentCity();
  const netWorth = useNetWorth();
  const [showBriberyModal, setShowBriberyModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showQuickBuyModal, setShowQuickBuyModal] = useState(false);
  const [confirmBribery, setConfirmBribery] = useState(false);

  const cityData = gameData.cities[currentCity];
  const heatLevel = systems.heat.calculateHeatLevel();
  const heatWarning = systems.heat.getHeatWarning();

  // Calculate current player rank
  const getCurrentRank = () => {
    const basesOwned = Object.keys(state.bases || {}).length;
    const gangSize = state.gangSize || 0;
    const assetCount = systems.assets?.getOwnedAssetCount() || 0;
    let currentRank = 1;
    for (let rankId = 7; rankId >= 1; rankId--) {
      const rank = gameData.playerRanks[rankId];
      if (netWorth >= rank.minNetWorth && 
          basesOwned >= rank.minBases && 
          gangSize >= rank.minGang &&
          assetCount >= (rank.minAssets || 0)) {
        currentRank = rankId;
        break;
      }
    }
    return currentRank;
  };

  const handleBribery = () => {
    const bribery = systems.heat.calculateBriberyCost();
    setConfirmBribery(false);
    const result = systems.heat.processBribery(bribery.cost, bribery.reduction);
    if (!result.success && result.error) {
      alert(result.error);
    }
    setShowBriberyModal(false);
  };

  const apps = [
    { id: 'quickBuy', icon: '🛒', name: 'Quick Buy', onClick: () => setShowQuickBuyModal(true) },
    { id: 'bases', icon: '🏢', name: 'Manage Bases', onClick: () => onNavigate('bases') },
    { id: 'gang', icon: '👥', name: 'Manage Gang', onClick: () => onNavigate('gang') },
    { id: 'raid', icon: '⚔️', name: 'Raid Bases', onClick: () => onNavigate('raid') },
    { id: 'market', icon: '💊', name: 'Market', onClick: () => onNavigate('market') },
    { id: 'trading', icon: '💼', name: 'Trading', onClick: () => onNavigate('trading') },
    { id: 'travel', icon: '✈️', name: 'Travel', onClick: () => onNavigate('travel') },
    { id: 'inventory', icon: '🎒', name: 'Inventory', onClick: () => onNavigate('inventory') },
    { id: 'assets', icon: '💎', name: 'Assets', onClick: () => onNavigate('assets') },
    { id: 'ranking', icon: '🏆', name: 'Ranking', onClick: () => setShowRankingModal(true) },
    { id: 'mail', icon: '📧', name: 'Mail', onClick: () => onNavigate('mail') }
  ];

  return (
    <div className="home-screen">
      {/* Current Location */}
      <div style={{
        background: '#333',
        border: '1px solid #666',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
          📍 Current Location
        </div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ffff00' }}>
          {currentCity}
        </div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>
          Population: {cityData.population}
        </div>
      </div>
      {/* Cash and Stats */}
      <PlayerCard />
      {/* Heat Warning */}
      {heatWarning && (
        <div className="warrant-card">
          <div style={{ fontSize: '16px', marginBottom: '10px' }}>
            🔥 HIGH HEAT WARNING
          </div>
          <div style={{ fontSize: '12px', color: '#ffaaaa', marginBottom: '10px' }}>
            {heatWarning}
          </div>
          <button 
            className="action-btn bribe"
            onClick={() => setShowBriberyModal(true)}
            style={{ marginTop: '15px', width: '100%' }}
          >
            💰 Pay Bribe to Reduce Heat
          </button>
        </div>
      )}
      {/* App Grid */}
      <div className="app-grid">
        {apps.map(app => (
          <div 
            key={app.id}
            className="app-icon"
            onClick={app.onClick}
          >
            <div className="app-emoji">{app.icon}</div>
            <div className="app-name">{app.name}</div>
          </div>
        ))}
      </div>
      {/* Bribery Modal */}
      {showBriberyModal && (
        <Modal
          isOpen={showBriberyModal}
          onClose={() => setShowBriberyModal(false)}
          title="💰 Corrupt Officials"
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>
              Pay bribes to reduce your heat level?<br /><br />
              Current Warrant: ${state.warrant.toLocaleString()}<br />
              Bribery Cost: ${systems.heat.calculateBriberyCost().cost.toLocaleString()}<br />
              Warrant Reduction: -${systems.heat.calculateBriberyCost().reduction.toLocaleString()}
            </p>
            <button 
              className="action-btn" 
              style={{ margin: '0 10px' }}
              onClick={handleBribery}
            >
              Confirm
            </button>
            <button 
              className="action-btn" 
              style={{ margin: '0 10px', background: '#ff6666' }}
              onClick={() => setShowBriberyModal(false)}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {/* Ranking Modal */}
      <Modal
        isOpen={showRankingModal}
        onClose={() => setShowRankingModal(false)}
        title="🏆 Player Ranking"
      >
        {renderRankingContent()}
      </Modal>
      {/* Quick Buy Modal */}
      <Modal
        isOpen={showQuickBuyModal}
        onClose={() => setShowQuickBuyModal(false)}
        title="🛒 Quick Buy Assets"
      >
        {renderQuickBuyContent()}
      </Modal>
    </div>
  );

  function renderRankingContent() {
    const currentRankId = getCurrentRank();
    const currentRank = gameData.playerRanks[currentRankId];
    const nextRank = currentRankId < 7 ? gameData.playerRanks[currentRankId + 1] : null;
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
          {currentRank.emoji}
        </div>
        <div style={{ 
          fontSize: '20px', 
          color: currentRank.color, 
          fontWeight: 'bold' 
        }}>
          {currentRank.name}
        </div>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px' }}>
          Rank {currentRankId} of 7
        </div>
        <div style={{
          background: '#222',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '10px' }}>
            📊 Current Stats
          </div>
          <div style={{ textAlign: 'left', fontSize: '12px' }}>
            💰 Net Worth: ${netWorth.toLocaleString()}<br/>
            🏢 Bases: {Object.keys(state.bases || {}).length}<br/>
            👥 Gang: {state.gangSize || 0}<br/>
            🔫 Guns: {state.guns || 0}
          </div>
        </div>
        {nextRank && (
          <div style={{
            background: '#1a1a1a',
            padding: '15px',
            borderRadius: '10px'
          }}>
            <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>
              🎯 Next: {nextRank.emoji} {nextRank.name}
            </div>
            <div style={{ textAlign: 'left', fontSize: '11px', color: '#aaa' }}>
              Need:<br/>
              💰 ${nextRank.minNetWorth.toLocaleString()} net worth<br/>
              🏢 {nextRank.minBases} bases<br/>
              👥 {nextRank.minGang} gang members
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderQuickBuyContent() {
    const [gunQty, setGunQty] = useState(1);
    const [gangQty, setGangQty] = useState(1);
    const gunCost = gameData.config.gunCost;
    const gangCost = calculateGangMemberCost();
    function calculateGangMemberCost() {
      const baseCost = gameData.config.baseGangCost || 10000;
      const cityModifier = cityData?.heatModifier || 1.0;
      const gangSize = state.gangSize || 0;
      const gangCostScaling = gameData.config.gangCostScaling || 0.1;
      const gangModifier = 1 + (gangSize * gangCostScaling);
      const cost = Math.floor(baseCost * cityModifier * gangModifier);
      return Math.min(cost, 40000);
    }
    return (
      <div>
        <div style={{
          background: '#222',
          border: '1px solid #666',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
            💰 Available Cash
          </div>
          <div style={{ fontSize: '20px', color: '#66ff66', fontWeight: 'bold' }}>
            ${cash.toLocaleString()}
          </div>
        </div>
        {/* Guns Section */}
        <div style={{
          background: '#222',
          border: '1px solid #444',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: 'bold' }}>🔫 Guns</div>
            <div style={{ color: '#66ff66' }}>${gunCost.toLocaleString()} each</div>
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>
            You have: {state.guns || 0} guns
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
            <input
              type="number"
              value={gunQty}
              onChange={(e) => setGunQty(parseInt(e.target.value) || 1)}
              min="1"
              max="100"
              className="quantity-input"
            />
            <button
              className="action-btn"
              onClick={() => {
                const cost = gunQty * gunCost;
                if (cash >= cost) {
                  systems.bases.addGunsToCity(currentCity, gunQty);
                  systems.bases.updateCash(-cost);
                  events.add(`Purchased ${gunQty} guns for $${cost.toLocaleString()}`, 'good');
                  setShowQuickBuyModal(false);
                }
              }}
            >
              Buy
            </button>
          </div>
        </div>
        {/* Gang Members Section */}
        <div style={{
          background: '#222',
          border: '1px solid #444',
          borderRadius: '10px',
          padding: '15px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <div style={{ fontWeight: 'bold' }}>👥 Gang Members</div>
            <div style={{ color: '#66ff66' }}>${gangCost.toLocaleString()} each</div>
          </div>
          <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px' }}>
            You have: {state.gangSize || 0} members
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
            <input
              type="number"
              value={gangQty}
              onChange={(e) => setGangQty(parseInt(e.target.value) || 1)}
              min="1"
              max="50"
              className="quantity-input"
            />
            <button
              className="action-btn"
              onClick={() => {
                const cost = gangQty * gangCost;
                const heat = gangQty * gameData.config.gangRecruitHeat;
                if (cash >= cost) {
                  systems.bases.addGangMembers(currentCity, gangQty);
                  systems.bases.updateCash(-cost);
                  systems.heat.updateWarrant(heat);
                  events.add(`Recruited ${gangQty} gang members for $${cost.toLocaleString()}`, 'good');
                  events.add(`Gang recruitment increased heat by ${heat.toLocaleString()}`, 'bad');
                  setShowQuickBuyModal(false);
                }
              }}
            >
              Buy
            </button>
          </div>
        </div>
      </div>
    );
  }
} 