import React, { useState } from 'react';
import { useGame, useCash, useCurrentCity } from '../contexts/GameContext.jsx';
import { Modal } from '../components/Modal';
import { PlayerCard } from '../components/PlayerCard';
// @ts-ignore
import { gameData } from '../game/data/gameData';

interface HomeScreenProps {
  onNavigate: (screen: string) => void;
}

interface PendingPurchase {
  qty: number;
  cost: number;
}

export default function HomeScreen({ onNavigate }: HomeScreenProps) {
  const { state, resetGame, updateCash, updateInventory, addNotification, dispatch } = useGame();
  // Remove systems and events, use only state and gameState
  const cash = state.cash ?? 0;
  const currentCity = state.currentCity || 'Unknown';
  // Calculate net worth: cash + inventory value (using current city prices if available)
  const getNetWorth = () => {
    let total = state.cash || 0;
    const prices = (gameData.cities[currentCity] && gameData.cities[currentCity].prices) || {};
    for (const drug in state.inventory) {
      const qty = state.inventory[drug] || 0;
      const price = prices[drug] || 0;
      total += qty * price;
    }
    return total;
  };
  const netWorth = getNetWorth();
  const [showBriberyModal, setShowBriberyModal] = useState(false);
  const [showRankingModal, setShowRankingModal] = useState(false);
  const [showQuickBuyModal, setShowQuickBuyModal] = useState(false);
  const [confirmBribery, setConfirmBribery] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [gunQty, setGunQty] = useState<number | "">(1);
  const [gangQty, setGangQty] = useState<number | "">(1);
  // Confirmation modal state
  const [showGunConfirm, setShowGunConfirm] = useState(false);
  const [showGangConfirm, setShowGangConfirm] = useState(false);
  const [pendingGunPurchase, setPendingGunPurchase] = useState<PendingPurchase>({ qty: 0, cost: 0 });
  const [pendingGangRecruit, setPendingGangRecruit] = useState<PendingPurchase>({ qty: 0, cost: 0 });

  const cityData = gameData.cities[currentCity] || {};
  const heatLevel = state.heatLevel ?? 0;
  const heatWarning = heatLevel > 80 ? 'Heat is very high!' : undefined;

  // Calculate current player rank
  const getCurrentRank = () => {
    const basesOwned = Object.keys(state.bases || {}).length;
    const gangSize = state.gangSize || 0;
    const assetCount = 0; // No systems.assets in minimal context
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

  // Remove handleBribery and systems.heat references

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

  // Add Settings to the apps array
  const appsWithSettings = [
    ...apps,
    { id: 'settings', icon: '⚙️', name: 'Settings', onClick: () => setShowSettingsModal(true) },
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
        {appsWithSettings.map(app => (
          <button
            key={app.id}
            className="app-icon"
            onClick={app.onClick}
            style={{ minWidth: 80 }}
          >
            <div style={{ fontSize: 32 }}>{app.icon}</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>{app.name}</div>
          </button>
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
              Current Warrant: ${(state.warrant ?? 0).toLocaleString()}<br />
              Bribery Cost: N/A<br />
              Warrant Reduction: N/A
            </p>
            <button 
              className="action-btn" 
              style={{ margin: '0 10px' }}
              onClick={() => setShowBriberyModal(false)}
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
      {showQuickBuyModal && (
        <Modal
          isOpen={showQuickBuyModal}
          onClose={() => setShowQuickBuyModal(false)}
          title="🛒 Quick Buy"
        >
          {renderQuickBuyContent(gunQty, setGunQty, gangQty, setGangQty)}
          <button
            className="action-btn"
            style={{ marginTop: 16, background: '#ff6666' }}
            onClick={() => setShowQuickBuyModal(false)}
          >
            Close
          </button>
        </Modal>
      )}
      {/* Gun Purchase Confirmation Modal */}
      <Modal
        isOpen={showGunConfirm}
        onClose={() => setShowGunConfirm(false)}
        title="Confirm Gun Purchase"
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Buy <strong>{pendingGunPurchase.qty}</strong> gun(s) for <strong>${pendingGunPurchase.cost.toLocaleString()}</strong>?
          </p>
          <button
            className="action-btn"
            onClick={() => {
              updateCash(-pendingGunPurchase.cost);
              // Always add guns to city pool (create if needed)
              const gunsByCity = { ...(state.gunsByCity || {}) };
              const city = state.currentCity;
              const newAmount = (gunsByCity[city] || 0) + pendingGunPurchase.qty;
              dispatch({ type: 'UPDATE_GUNS_BY_CITY', city, amount: newAmount });
              addNotification(`Purchased ${pendingGunPurchase.qty} gun${pendingGunPurchase.qty > 1 ? 's' : ''} for $${pendingGunPurchase.cost.toLocaleString()}`, 'success');
              setShowGunConfirm(false);
              setShowQuickBuyModal(false);
            }}
          >
            Confirm
          </button>
          <button
            className="action-btn"
            style={{ background: '#ff6666' }}
            onClick={() => setShowGunConfirm(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
      {/* Gang Recruit Confirmation Modal */}
      <Modal
        isOpen={showGangConfirm}
        onClose={() => setShowGangConfirm(false)}
        title="Confirm Gang Recruitment"
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Recruit <strong>{pendingGangRecruit.qty}</strong> gang member(s) for <strong>${pendingGangRecruit.cost.toLocaleString()}</strong>?
          </p>
          <button
            className="action-btn"
            onClick={() => {
              updateCash(-pendingGangRecruit.cost);
              // Update gangMembers for current city and gangSize globally
              const updatedGangMembers = { ...state.gangMembers };
              const city = state.currentCity;
              updatedGangMembers[city] = (updatedGangMembers[city] || 0) + pendingGangRecruit.qty;
              const newGangSize = (state.gangSize || 0) + pendingGangRecruit.qty;
              dispatch({ type: 'UPDATE_GANG', gangMembers: updatedGangMembers, gangSize: newGangSize });
              addNotification(`Recruited ${pendingGangRecruit.qty} gang member${pendingGangRecruit.qty > 1 ? 's' : ''} for $${pendingGangRecruit.cost.toLocaleString()}`, 'success');
              setShowGangConfirm(false);
              setShowQuickBuyModal(false);
            }}
          >
            Confirm
          </button>
          <button
            className="action-btn"
            style={{ background: '#ff6666' }}
            onClick={() => setShowGangConfirm(false)}
          >
            Cancel
          </button>
        </div>
      </Modal>
      {/* Modals */}
      <Modal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} title="Settings">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button
            className="action-btn"
            style={{ background: '#ff6666', marginBottom: 12 }}
            onClick={() => {
              setShowSettingsModal(false);
              setShowResetConfirm(true);
            }}
          >
            Reset Game
          </button>
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            This will erase all progress and start a new game.
          </div>
        </div>
      </Modal>
      <Modal isOpen={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Confirm Reset">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ marginBottom: 16 }}>
            Are you sure you want to reset your game? This cannot be undone.
          </div>
          <button
            className="action-btn"
            style={{ background: '#ff2222', marginRight: 10 }}
            onClick={() => {
              resetGame();
              setShowResetConfirm(false);
            }}
          >
            Yes, Reset
          </button>
          <button
            className="action-btn"
            onClick={() => setShowResetConfirm(false)}
          >
            Cancel
          </button>
        </div>
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

  function renderQuickBuyContent(gunQty: number | "", setGunQty: (n: number | "") => void, gangQty: number | "", setGangQty: (n: number | "") => void) {
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
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") setGunQty("");
                else setGunQty(Math.max(1, parseInt(val)));
              }}
              min="1"
              max="100"
              className="quantity-input"
            />
            <button
              className="action-btn"
              onClick={() => {
                const qty = gunQty === "" ? 1 : gunQty;
                const cost = qty * gunCost;
                if (cash >= cost) {
                  setPendingGunPurchase({ qty, cost });
                  setShowGunConfirm(true);
                }
              }}
              disabled={gunQty === "" || gunQty < 1}
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
          padding: '15px',
          marginBottom: '15px'
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
            You have: {state.gangSize || 0} gang members
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
            <input
              type="number"
              value={gangQty}
              onChange={(e) => {
                const val = e.target.value;
                if (val === "") setGangQty("");
                else setGangQty(Math.max(1, parseInt(val)));
              }}
              min="1"
              max="100"
              className="quantity-input"
            />
            <button
              className="action-btn"
              onClick={() => {
                const qty = gangQty === "" ? 1 : gangQty;
                const cost = qty * gangCost;
                if (cash >= cost) {
                  setPendingGangRecruit({ qty, cost });
                  setShowGangConfirm(true);
                }
              }}
              disabled={gangQty === "" || gangQty < 1}
            >
              Recruit
            </button>
          </div>
        </div>
      </div>
    );
  }
} 