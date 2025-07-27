import React, { useState } from 'react';
import { useGame, useCash, useCurrentCity } from '../contexts/GameContext.jsx';
import { useTutorial } from '../contexts/TutorialContext.jsx';
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
  const { state, resetGame, updateCash, updateInventory, addNotification, dispatch, getAssetSummary } = useGame();
  const { resetTutorial, nextStep, activeTutorial, stepIndex, tutorialSteps, startTutorial, skipTutorial, progress } = useTutorial();
  // Remove systems and events, use only state and gameState
  const cash = state.cash ?? 0;
  const currentCity = state.currentCity;
  const assetSummary = getAssetSummary();
  // Calculate net worth: cash + inventory value (using current city prices if available)
  const getNetWorth = () => {
    let total = state.cash || 0;
    const prices = (gameData.cities[currentCity] && gameData.cities[currentCity].prices) || {};
    for (const drug in state.inventory) {
      const qty = state.inventory[drug] || 0;
      const price = prices[drug] || 0;
      total += qty * price;
    }
    total += assetSummary.totalValue || 0;
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

  // Calculate number of leveled up bases (level > 1)
  const getLeveledBases = () => {
    let count = 0;
    Object.values(state.bases || {}).forEach((cityBases: any) => {
      (cityBases as any[]).forEach((base: any) => {
        if (base.level && base.level > 1) count++;
      });
    });
    return count;
  };
  const leveledBases = getLeveledBases();

  // Calculate current player rank
  const getCurrentRank = () => {
    const basesOwned = Object.keys(state.bases || {}).length;
    const gangSize = state.gangSize || 0;
    const assetValue = assetSummary.totalValue || 0;
    let currentRank = 1;
    for (let rankId = 10; rankId >= 1; rankId--) {
      const rank = gameData.playerRanks[rankId];
      if (
        netWorth >= rank.minNetWorth &&
        basesOwned >= rank.minBases &&
        gangSize >= rank.minGang &&
        assetValue >= (rank.minAssets || 0) &&
        leveledBases >= (rank.minLeveledBases || 0)
      ) {
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
    { 
      id: 'raid', 
      icon: '⚔️', 
      name: 'Raid Bases', 
      onClick: () => {
        // Check if player has a base in current city
        const hasBaseInCity = state.getBase(currentCity);
        if (!hasBaseInCity) {
          alert(`You need to establish a base in ${currentCity} before you can raid here. Build a base first to unlock raiding in this city.`);
          return;
        }
        onNavigate('raid');
      },
      disabled: !state.getBase(currentCity),
      disabledMessage: `Requires base in ${currentCity}`
    },
    { 
      id: 'market', 
      icon: '💊', 
      name: 'Market', 
      onClick: () => {
        // Check if this is a tutorial click
        if (activeTutorial === 'gettingStarted' && stepIndex === 1) {
          const step = tutorialSteps[activeTutorial][stepIndex];
          if (step && step.requireClick) {
            nextStep();
          }
        }
        onNavigate('market');
      },
      elementId: 'market-button'
    },
    { 
      id: 'trading', 
      icon: '💼', 
      name: 'Trading', 
      onClick: () => {
        console.log('Trading button clicked');
        console.log('Current tutorial state:', { activeTutorial, stepIndex });
        // Check if this is a tutorial click for Trading button
        if (activeTutorial === 'gettingStarted' && stepIndex === 10) {
          console.log('Tutorial condition met, calling nextStep');
          const step = tutorialSteps[activeTutorial][stepIndex];
          if (step && step.requireClick) {
            console.log('Calling nextStep from Trading button click');
            nextStep();
          }
        }
        console.log('Navigating to trading screen');
        onNavigate('trading');
      },
      elementId: 'trading-button'
    },
    { id: 'travel', icon: '✈️', name: 'Travel', onClick: () => onNavigate('travel') },
    { id: 'inventory', icon: '🎒', name: 'Inventory', onClick: () => onNavigate('inventory') },
    { 
      id: 'assets', 
      icon: '💎', 
      name: 'Assets', 
      onClick: () => {
        // Check if we should start the assets tutorial
        if (progress.gettingStarted && !progress.assetsTutorial && state.cash >= 20000) {
          console.log('Starting assets tutorial from Asset button click');
          startTutorial('assetsTutorial');
        }
        onNavigate('assets');
      },
      elementId: 'assets-button'
    },
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
        {appsWithSettings.map(app => {
          const isDisabled = app.disabled;
          return (
            <button
              key={app.id}
              id={app.elementId || app.id}
              className={`app-icon${isDisabled ? ' disabled' : ''}`}
              onClick={isDisabled ? undefined : app.onClick}
              style={{ 
                minWidth: 80,
                opacity: isDisabled ? 0.5 : 1,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                position: 'relative'
              }}
              title={isDisabled ? app.disabledMessage : undefined}
            >
              <div style={{ fontSize: 32 }}>{app.icon}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{app.name}</div>
              {isDisabled && (
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  background: 'rgba(0,0,0,0.8)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  whiteSpace: 'nowrap',
                  zIndex: 10
                }}>
                  🔒 Locked
                </div>
              )}
            </button>
          );
        })}
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
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: 12 }}>
            This will erase all progress and start a new game.
          </div>
          <button
            className="action-btn"
            style={{ background: '#66ff66', marginBottom: 12 }}
            onClick={() => {
              resetTutorial('gettingStarted');
              setShowSettingsModal(false);
            }}
          >
            Test Tutorial
          </button>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: 12 }}>
            Reset the tutorial to test it again.
          </div>
          <button
            className="action-btn"
            style={{ background: '#ffaa00', marginBottom: 12 }}
            onClick={() => {
              localStorage.removeItem('tutorialProgress');
              window.location.reload();
            }}
          >
            Clear Tutorial Progress
          </button>
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            Clear all tutorial progress and reload.
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
    const nextRank = currentRankId < 10 ? gameData.playerRanks[currentRankId + 1] : null;
    // Calculate Empire Value breakdown
    const baseValue = (() => {
      let total = 0;
      Object.values(state.bases || {}).forEach((cityBases: any) => {
        (cityBases as any[]).forEach((base: any) => {
          // Use cost from gameData.baseTypes if possible
          const baseType = gameData.baseTypes[base.type] || {};
          total += baseType.cost || 0;
        });
      });
      return total;
    })();
    const gangValue = (state.gangSize || 0) * (gameData.config.baseGangCost || 10000);
    const gunValue = (state.guns || 0) * (gameData.config.gunCost || 5000);
    const drugValue = (() => {
      let total = 0;
      const prices = (gameData.cities[currentCity] && gameData.cities[currentCity].prices) || {};
      for (const drug in state.inventory) {
        const qty = state.inventory[drug] || 0;
        const price = prices[drug] || 0;
        total += qty * price;
      }
      return total;
    })();
    const empireValue = cash + assetSummary.totalValue + baseValue + gangValue + gunValue + drugValue;
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <div style={{ fontSize: '32px', marginBottom: '10px', color: '#ffcc00' }}>
          🏆 Empire Value: ${empireValue.toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '20px' }}>
          <div>💵 Cash: ${cash.toLocaleString()}</div>
          <div>💎 Asset Value: ${assetSummary.totalValue.toLocaleString()}</div>
          <div>🏢 Base Value: ${baseValue.toLocaleString()}</div>
          <div>👥 Gang Value: ${gangValue.toLocaleString()}</div>
          <div>🔫 Gun Value: ${gunValue.toLocaleString()}</div>
          <div>🎒 Drug Inventory: ${drugValue.toLocaleString()}</div>
        </div>
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
          Rank {currentRankId} of 10
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
            💵 Cash: ${cash.toLocaleString()}<br/>
            💎 Asset Value: ${assetSummary.totalValue.toLocaleString()}<br/>
            🏢 Bases: {Object.keys(state.bases || {}).length}<br/>
            🏢 Leveled Bases: {leveledBases}<br/>
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
              💎 ${typeof nextRank.minAssets === 'number' ? nextRank.minAssets.toLocaleString() : 0} asset value<br/>
              🏢 {nextRank.minBases} bases<br/>
              🏢 {nextRank.minLeveledBases || 0} leveled bases<br/>
              👥 {nextRank.minGang} gang members<br/>
              🔫 {nextRank.minGuns || 0} guns
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