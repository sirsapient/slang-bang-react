// src/screens/AssetsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useGame, useCash, useCurrentCity } from '../contexts/GameContext.jsx';
import { Modal } from '../components/Modal';
import { gameData } from '../game/data/gameData';
import type { Asset, AssetInstance } from '../game/data/gameData-types';

interface AssetsScreenProps {
  onNavigate: (screen: string) => void;
}

type TabType = 'exclusive' | 'jewelry' | 'cars' | 'property' | 'owned';

export default function AssetsScreen({ onNavigate }: AssetsScreenProps) {
  const { state, buyAsset, sellAsset, wearJewelry, removeJewelry, getOwnedAssets, getAllOwnedInstances, getWornJewelry, getAssetSummary } = useGame();
  const cash = useCash();
  const currentCity = useCurrentCity();
  const [activeTab, setActiveTab] = useState<TabType>('exclusive');
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedDrop, setSelectedDrop] = useState<any>(null);
  const [pendingPurchase, setPendingPurchase] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSellConfirmModal, setShowSellConfirmModal] = useState(false);
  const [pendingSellInstanceId, setPendingSellInstanceId] = useState<string | null>(null);
  const [showFastTravelModal, setShowFastTravelModal] = useState(false);
  const [pendingTravelCity, setPendingTravelCity] = useState<string | null>(null);

  // For now, unlock all tabs for testing
  const isAssetsUnlocked = true;
  const isJewelryUnlocked = true;

  // --- NEW: Get all worn jewelry instances ---
  const allInstances: AssetInstance[] = getAllOwnedInstances();
  const wornJewelryIds: string[] = getWornJewelry();
  const wornJewelry: AssetInstance[] = allInstances.filter(inst => wornJewelryIds.includes(inst.instanceId));

  useEffect(() => {
    // No-op: context handles asset state
    if (!activeTab) setActiveTab('owned');
  }, [activeTab]);

  const summary = getAssetSummary();

  const getAvailableTabCount = () => 5;

  const handlePurchaseAsset = (assetId: string) => {
    const asset = (gameData.assets || []).find((a: any) => a.id === assetId);
    if (!asset) return;
    setPendingPurchase(asset);
    setShowConfirmModal(true);
  };
  const confirmPurchase = () => {
    if (pendingPurchase) {
      const result = buyAsset(pendingPurchase.id);
      if (!result.success && result.error) {
        alert(result.error);
      }
    }
    setShowConfirmModal(false);
    setPendingPurchase(null);
  };
  const cancelPurchase = () => {
    setShowConfirmModal(false);
    setPendingPurchase(null);
  };

  const handleSellAsset = (instanceId: string) => {
    setPendingSellInstanceId(instanceId);
    setShowSellConfirmModal(true);
  };

  const confirmSell = () => {
    if (pendingSellInstanceId) {
      const result = sellAsset(pendingSellInstanceId);
      if (!result.success && result.error) {
        alert(result.error);
      }
    }
    setShowSellConfirmModal(false);
    setPendingSellInstanceId(null);
  };

  const cancelSell = () => {
    setShowSellConfirmModal(false);
    setPendingSellInstanceId(null);
  };

  const handleWearJewelry = (instanceId: string) => {
    wearJewelry(instanceId);
  };

  const handleRemoveJewelry = (instanceId: string) => {
    removeJewelry(instanceId);
  };

  // For now, skip exclusive drops (requires assetDrop system)
  const handlePurchaseExclusive = () => {};
  const confirmPurchaseExclusive = () => {};

  // --- Fast Travel Handler ---
  const handleFastTravel = (city: string) => {
    setPendingTravelCity(city);
    setShowFastTravelModal(true);
  };
  const confirmFastTravel = () => {
    if (pendingTravelCity) {
      // Optionally, you could call a travelToCity action here if you want instant travel
      // For now, navigate to the travel screen and preselect the city
      onNavigate('travel');
      // You may want to set a context value for the destination city
    }
    setShowFastTravelModal(false);
    setPendingTravelCity(null);
  };
  const cancelFastTravel = () => {
    setShowFastTravelModal(false);
    setPendingTravelCity(null);
  };

  return (
    <div className="assets-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>💎 Asset Store</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Build Your Empire</div>
      </div>
      {/* --- NEW: Active Jewelry Display --- */}
      {wornJewelry.length > 0 && (
        <div style={{
          background: '#222',
          border: '2px solid #ffaa00',
          borderRadius: '10px',
          padding: '10px',
          marginBottom: '15px',
          textAlign: 'center',
          color: '#fff',
        }}>
          <div style={{ fontSize: '13px', color: '#ffaa00', marginBottom: '5px' }}>Active Jewelry</div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            {wornJewelry.map(jewel => (
              <div key={jewel.instanceId} style={{ background: '#333', borderRadius: '6px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{jewel.name}</span>
                <button
                  onClick={() => handleRemoveJewelry(jewel.instanceId)}
                  className="action-btn"
                  style={{ fontSize: '10px', padding: '2px 8px', background: '#666' }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Asset Summary */}
      <div style={{
        background: '#333',
        border: '2px solid #ffaa00',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '15px',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              💰 Cash
            </div>
            <div style={{ fontSize: '16px', color: '#66ff66', fontWeight: 'bold' }}>
              ${cash.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              💎 Asset Value
            </div>
            <div style={{ fontSize: '16px', color: '#ffaa00', fontWeight: 'bold' }}>
              ${summary.totalValue.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              ⭐ Flex Score
            </div>
            <div style={{ fontSize: '16px', color: '#ff66ff', fontWeight: 'bold' }}>
              {summary.flexScore}
            </div>
          </div>
        </div>
      </div>
      {/* Tab Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getAvailableTabCount()}, 1fr)`,
        gap: '8px',
        marginBottom: '20px'
      }}>
        <button
          onClick={() => setActiveTab('exclusive')}
          className={`tab-btn ${activeTab === 'exclusive' ? 'active' : ''}`}
          style={{ padding: '10px', borderRadius: '8px', fontSize: '12px' }}
        >
          🌟 Exclusive
        </button>
        <button
          onClick={() => setActiveTab('jewelry')}
          className={`tab-btn ${activeTab === 'jewelry' ? 'active' : ''}`}
          style={{ padding: '10px', borderRadius: '8px', fontSize: '12px' }}
        >
          💍 Jewelry
        </button>
        <button
          onClick={() => setActiveTab('cars')}
          className={`tab-btn ${activeTab === 'cars' ? 'active' : ''}`}
          style={{ padding: '10px', borderRadius: '8px', fontSize: '12px' }}
        >
          🚗 Cars
        </button>
        <button
          onClick={() => setActiveTab('property')}
          className={`tab-btn ${activeTab === 'property' ? 'active' : ''}`}
          style={{ padding: '10px', borderRadius: '8px', fontSize: '12px' }}
        >
          🏠 Property
        </button>
        <button
          onClick={() => setActiveTab('owned')}
          className={`tab-btn ${activeTab === 'owned' ? 'active' : ''}`}
          style={{ padding: '10px', borderRadius: '8px', fontSize: '12px' }}
        >
          📦 Owned
        </button>
      </div>
      {/* Tab Content */}
      <div id="assetTabContent">
        {renderTabContent()}
      </div>
      {/* Purchase Confirmation Modal */}
      {showConfirmModal && pendingPurchase && (
        <Modal
          isOpen={showConfirmModal}
          onClose={cancelPurchase}
          title="Confirm Purchase"
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>
              Purchase <strong>{pendingPurchase.name}</strong> for <strong>${pendingPurchase.cost.toLocaleString()}</strong>?
            </p>
            <button className="action-btn" onClick={confirmPurchase}>
              Confirm
            </button>
            <button className="action-btn" style={{ background: '#ff6666' }} onClick={cancelPurchase}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {/* Sell Confirmation Modal */}
      {showSellConfirmModal && pendingSellInstanceId && (
        <Modal
          isOpen={showSellConfirmModal}
          onClose={cancelSell}
          title="Confirm Sale"
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>
              Sell this asset?
            </p>
            <button className="action-btn" onClick={confirmSell}>
              Confirm
            </button>
            <button className="action-btn" style={{ background: '#ff6666' }} onClick={cancelSell}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
      {/* Fast Travel Confirmation Modal */}
      {showFastTravelModal && pendingTravelCity && (
        <Modal
          isOpen={showFastTravelModal}
          onClose={cancelFastTravel}
          title="Fast Travel"
        >
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <p>
              Fast travel to <strong>{pendingTravelCity}</strong>?
            </p>
            <button className="action-btn" onClick={confirmFastTravel}>
              Confirm
            </button>
            <button className="action-btn" style={{ background: '#ff6666' }} onClick={cancelFastTravel}>
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );

  function renderTabContent() {
    switch (activeTab) {
      case 'exclusive':
        return <div style={{ color: '#ffaa00', textAlign: 'center', padding: 40 }}>Exclusive drops coming soon!</div>;
      case 'jewelry':
        return renderJewelryTab();
      case 'cars':
        return renderCarsTab();
      case 'property':
        return renderPropertyTab();
      case 'owned':
        return renderOwnedTab();
      default:
        return null;
    }
  }

  function renderJewelryTab() {
    const jewelry = (gameData.assets || []).filter((a: any) => a.type === 'jewelry');
    const owned = getOwnedAssets('jewelry');
    const wearing = getWornJewelry();
    return (
      <>
        <div style={{
          background: '#1a1a1a',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#ffff00'
        }}>
          Wearing: {wearing.length} jewelry items
        </div>
        {jewelry.map((item: any) => {
          const ownedInstances: AssetInstance[] = owned[item.id] || [];
          const ownedCount = ownedInstances.length;
          // --- NEW: Show all owned instances, with wear/unassign for each ---
          return ownedCount > 0 ? (
            ownedInstances.map((inst, idx) => {
              const isWorn = wearing.includes(inst.instanceId);
              return (
                <div
                  key={inst.instanceId}
                  className="market-item"
                  style={{ border: isWorn ? '2px solid #ffaa00' : '2px solid #66ff66', marginBottom: '10px' }}
                >
                  <div className="market-header">
                    <div className="drug-name">
                      {item.name} {isWorn && '👤'}
                    </div>
                    <div className="drug-price">
                      💰 ${inst.resaleValue.toLocaleString()}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', margin: '8px 0' }}>
                    {item.description} • ⭐ +{item.flexScore} Flex
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {!isWorn ? (
                      <button
                        onClick={() => handleWearJewelry(inst.instanceId)}
                        className="action-btn"
                        style={{ padding: '6px', fontSize: '11px' }}
                      >
                        👤 Wear
                      </button>
                    ) : (
                      <button
                        onClick={() => handleRemoveJewelry(inst.instanceId)}
                        className="action-btn"
                        style={{ padding: '6px', fontSize: '11px', background: '#666' }}
                      >
                        Remove
                      </button>
                    )}
                    <button
                      onClick={() => handleSellAsset(inst.instanceId)}
                      className="action-btn sell"
                      style={{ padding: '6px', fontSize: '11px' }}
                    >
                      💰 Sell
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              key={item.id}
              className="market-item"
            >
              <div className="market-header">
                <div className="drug-name">
                  {item.name}
                </div>
                <div className="drug-price">
                  ${item.cost.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', margin: '8px 0' }}>
                {item.description} • ⭐ +{item.flexScore} Flex
              </div>
              <button
                onClick={() => handlePurchaseAsset(item.id)}
                className="action-btn"
                style={{ width: '100%', padding: '8px' }}
                disabled={cash < item.cost}
              >
                💎 Purchase
              </button>
            </div>
          );
        })}
      </>
    );
  }

  function renderCarsTab() {
    const cars = (gameData.assets || []).filter((a: any) => a.type === 'car');
    const owned = getOwnedAssets('car');
    let totalOwnedCars = 0;
    Object.values(owned).forEach((instances: any) => {
      totalOwnedCars += instances.length;
    });
    // For now, no storage cap
    return (
      <>
        <div style={{
          background: '#1a1a1a',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#ffff00'
        }}>
          Car Storage: {totalOwnedCars} cars
        </div>
        {cars.map((item: any) => {
          const ownedInstances = owned[item.id] || [];
          const ownedCount = ownedInstances.length;
          return (
            <div
              key={item.id}
              className="market-item"
              style={ownedCount > 0 ? { border: '2px solid #66ff66' } : {}}
            >
              <div className="market-header">
                <div className="drug-name">
                  {item.name}
                  {ownedCount > 0 && ` ✅ (${ownedCount})`}
                </div>
                <div className="drug-price">
                  {ownedCount > 0
                    ? `💰 $${item.resaleValue.toLocaleString()}`
                    : `$${item.cost.toLocaleString()}`}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', margin: '8px 0' }}>
                {item.description} • ⭐ +{item.flexScore} Flex
              </div>
              {ownedCount > 0 ? (
                <button
                  onClick={() => handleSellAsset(ownedInstances[0].instanceId)}
                  className="action-btn sell"
                  style={{ width: '100%', padding: '8px' }}
                >
                  💰 Sell Car
                </button>
              ) : (
                <button
                  onClick={() => handlePurchaseAsset(item.id)}
                  className="action-btn"
                  style={{ width: '100%', padding: '8px' }}
                  disabled={cash < item.cost}
                >
                  🚗 Purchase
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  }

  function renderPropertyTab() {
    const properties = (gameData.assets || []).filter((a: any) => a.type === 'property');
    const owned = getOwnedAssets('property');
    return (
      <>
        <div style={{
          background: '#1a1a1a',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#aaa'
        }}>
          Properties increase your jewelry and car storage capacity
        </div>
        {properties.map((item: any) => {
          const ownedInstances = owned[item.id] || [];
          const ownedCount = ownedInstances.length;
          return (
            <div
              key={item.id}
              className="market-item"
              style={ownedCount > 0 ? { border: '2px solid #66ff66' } : {}}
            >
              <div className="market-header">
                <div className="drug-name">
                  {item.name}
                  {ownedCount > 0 && ` ✅ (${ownedCount})`}
                </div>
                <div className="drug-price">
                  {ownedCount > 0
                    ? `💰 $${item.resaleValue.toLocaleString()}`
                    : `$${item.cost.toLocaleString()}`}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', margin: '8px 0' }}>
                {item.description} • ⭐ +{item.flexScore} Flex
              </div>
              <div style={{
                background: '#1a1a1a',
                padding: '8px',
                borderRadius: '5px',
                margin: '8px 0',
                fontSize: '11px',
                color: '#ffff00'
              }}>
                Storage: 💍 {item.capacity?.jewelry ?? 0} jewelry • 🚗 {item.capacity?.cars ?? 0} cars
              </div>
              {ownedCount > 0 ? (
                <button
                  onClick={() => handleSellAsset(ownedInstances[0].instanceId)}
                  className="action-btn sell"
                  style={{ width: '100%', padding: '8px' }}
                >
                  💰 Sell Property
                </button>
              ) : (
                <button
                  onClick={() => handlePurchaseAsset(item.id)}
                  className="action-btn"
                  style={{ width: '100%', padding: '8px' }}
                  disabled={cash < item.cost}
                >
                  🏠 Purchase
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  }

  function renderOwnedTab() {
    const allInstances: AssetInstance[] = getAllOwnedInstances();
    const wearing: string[] = getWornJewelry();
    if (allInstances.length === 0) {
      return (
        <div style={{
          background: '#222',
          border: '1px solid #444',
          borderRadius: '10px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>💎</div>
          <div style={{ fontSize: '16px', color: '#aaa' }}>
            No assets owned yet
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Start building your collection!
          </div>
        </div>
      );
    }
    const grouped: Record<string, AssetInstance[]> = { jewelry: [], cars: [], property: [], exclusive: [] };
    allInstances.forEach((instance: AssetInstance) => {
      if (instance.exclusive) {
        grouped.exclusive.push(instance);
      } else if (grouped[instance.type]) {
        grouped[instance.type].push(instance);
      }
    });
    return (
      <>
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#ffaa00', marginBottom: '15px' }}>
            💎 Your Asset Collection
            <span title="Jewelry: 2 worn, rest require property. Cars: require property. Cars/properties can only be sold in their city.">
              <span style={{ marginLeft: 8, fontSize: 16, cursor: 'pointer', color: '#ffaa00' }}>ℹ️</span>
            </span>
          </h4>
        </div>
        {['exclusive', 'jewelry', 'cars', 'property'].map(type => {
          if (grouped[type].length === 0) return null;
          const typeEmoji = type === 'exclusive' ? '🌟' : 
                           type === 'jewelry' ? '💍' : 
                           type === 'cars' ? '🚗' : '🏠';
          const typeName = type.charAt(0).toUpperCase() + type.slice(1);
          return (
            <div key={type} style={{ marginBottom: '20px' }}>
              <h5 style={{ color: '#aaa', marginBottom: '10px' }}>
                {typeEmoji} {typeName} ({grouped[type].length})
              </h5>
              {grouped[type].map((instance: AssetInstance) => {
                const isWorn = wearing.includes(instance.instanceId);
                const isExclusive = instance.exclusive;
                const showFastTravel = (instance.type === 'car' || instance.type === 'property') && currentCity !== instance.cityPurchased;
                return (
                  <div
                    key={instance.instanceId}
                    style={{
                      background: '#222',
                      border: `1px solid ${isExclusive ? '#ffaa00' : '#444'}`,
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '10px'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#fff' }}>
                          {instance.name} {isWorn && '👤'} {isExclusive && '🌟'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#aaa' }}>
                          Bought Day {instance.purchaseDate} • ⭐ +{instance.flexScore} Flex
                          {isExclusive && ` • Purchased in ${instance.cityPurchased}`}
                        </div>
                        {/* --- Storage/City Info --- */}
                        <div style={{ fontSize: '11px', color: '#ffaa00', marginTop: 2 }}>
                          {instance.type === 'jewelry' && (isWorn ? 'Worn (can be sold anywhere)' : instance.storagePropertyId ? `Stored in property (${instance.cityPurchased})` : `Worn (can be sold anywhere)`)}
                          {instance.type === 'car' && `Stored in ${instance.cityPurchased}`}
                          {instance.type === 'property' && `Located in ${instance.cityPurchased}`}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '11px', color: '#66ff66' }}>
                          Sell: ${instance.resaleValue.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '10px', color: '#aaa' }}>
                          Paid: ${instance.purchasePrice.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {instance.type === 'jewelry' && (
                        !isWorn ? (
                          <button
                            onClick={() => handleWearJewelry(instance.instanceId)}
                            className="action-btn"
                            style={{ padding: '4px 8px', fontSize: '10px' }}
                          >
                            👤 Wear
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRemoveJewelry(instance.instanceId)}
                            className="action-btn"
                            style={{
                              padding: '4px 8px',
                              fontSize: '10px',
                              background: '#666'
                            }}
                          >
                            Remove
                          </button>
                        )
                      )}
                      <button
                        onClick={() => handleSellAsset(instance.instanceId)}
                        className="action-btn sell"
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                      >
                        💰 Sell
                      </button>
                      {/* --- Fast Travel Button --- */}
                      {showFastTravel && instance.cityPurchased && (
                        <button
                          onClick={() => handleFastTravel(instance.cityPurchased!)}
                          className="action-btn"
                          style={{ padding: '4px 8px', fontSize: '10px', background: '#ffaa00', color: '#222' }}
                        >
                          🚀 Fast Travel to {instance.cityPurchased}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
        {/* --- Fast Travel Confirm Modal --- */}
        {showFastTravelModal && pendingTravelCity && (
          <Modal
            isOpen={showFastTravelModal}
            onClose={cancelFastTravel}
            title="Fast Travel"
          >
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <p>
                Fast travel to <strong>{pendingTravelCity}</strong>?
              </p>
              <button className="action-btn" onClick={confirmFastTravel}>
                Confirm
              </button>
              <button className="action-btn" style={{ background: '#ff6666' }} onClick={cancelFastTravel}>
                Cancel
              </button>
            </div>
          </Modal>
        )}
      </>
    );
  }
} 