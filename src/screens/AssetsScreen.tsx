// src/screens/AssetsScreen.tsx
import React, { useState, useEffect } from 'react';
import { useGame, useCash, useCurrentCity } from '../contexts/GameContext';
import { Modal } from '../components/Modal';
import { gameData } from '../game/data/gameData';

interface AssetsScreenProps {
  onNavigate: (screen: string) => void;
}

type TabType = 'exclusive' | 'jewelry' | 'cars' | 'property' | 'owned';

export default function AssetsScreen({ onNavigate }: AssetsScreenProps) {
  const { state, systems, events, refreshUI } = useGame();
  const cash = useCash();
  const currentCity = useCurrentCity();
  const [activeTab, setActiveTab] = useState<TabType>('exclusive');
  const [showPurchaseConfirm, setShowPurchaseConfirm] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [selectedDrop, setSelectedDrop] = useState<any>(null);
  
  const isAssetsUnlocked = systems.assets.isUnlocked();
  const isJewelryUnlocked = systems.assets.isJewelryUnlocked();
  
  useEffect(() => {
    // Initialize assets on mount
    systems.assets.initializeAssets();
    
    // Set default tab based on what's available
    if (!isAssetsUnlocked && isJewelryUnlocked) {
      setActiveTab('jewelry');
    } else if (!activeTab || (activeTab === 'jewelry' && !isJewelryUnlocked)) {
      setActiveTab('owned');
    }
  }, [isAssetsUnlocked, isJewelryUnlocked]);
  
  if (!isAssetsUnlocked && !isJewelryUnlocked) {
    return renderLockedScreen();
  }
  
  const summary = systems.assets.getAssetSummary();
  
  const getAvailableTabCount = () => {
    let count = 1; // Always have "Owned" tab
    if (isAssetsUnlocked) count += 3; // Exclusive, Cars, Property
    if (isJewelryUnlocked) count += 1; // Jewelry
    return count;
  };
  
  const handlePurchaseAsset = (assetId: string) => {
    const result = systems.assets.purchaseAsset(assetId);
    if (result.success) {
      refreshUI();
    } else if (result.error) {
      alert(result.error);
    }
  };
  
  const handleSellAsset = (instanceId: string) => {
    const asset = systems.assets.findAssetByInstanceId(instanceId);
    if (asset && window.confirm(`Sell ${asset.name} for $${asset.resaleValue.toLocaleString()}?`)) {
      const result = systems.assets.sellAsset(instanceId);
      if (result.success) {
        refreshUI();
      } else if (result.error) {
        alert(result.error);
      }
    }
  };
  
  const handleWearJewelry = (instanceId: string) => {
    const result = systems.assets.wearJewelry(instanceId);
    if (result.success) {
      refreshUI();
    } else if (result.error) {
      alert(result.error);
    }
  };
  
  const handleRemoveJewelry = (instanceId: string) => {
    const result = systems.assets.removeJewelry(instanceId);
    if (result.success) {
      refreshUI();
    } else if (result.error) {
      alert(result.error);
    }
  };
  
  const handlePurchaseExclusive = (dropId: string) => {
    const cityDrops = systems.assetDrop.getCityDrops(currentCity);
    const drop = cityDrops?.find((d: any) => d.id === dropId);
    
    if (!drop) {
      alert('Item not found');
      return;
    }
    
    setSelectedDrop(drop);
    setShowPurchaseConfirm(true);
  };
  
  const confirmPurchaseExclusive = () => {
    if (!selectedDrop) return;
    
    const result = systems.assetDrop.purchaseExclusiveDrop(selectedDrop.id);
    if (result.success) {
      setShowPurchaseConfirm(false);
      setSelectedDrop(null);
      refreshUI();
    } else if (result.error) {
      alert(result.error);
    }
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
        {isAssetsUnlocked && (
          <button
            onClick={() => setActiveTab('exclusive')}
            className={`tab-btn ${activeTab === 'exclusive' ? 'active' : ''}`}
            style={{ padding: '10px', borderRadius: '8px', fontSize: '12px' }}
          >
            🌟 Exclusive
          </button>
        )}
        {isJewelryUnlocked && (
          <button
            onClick={() => setActiveTab('jewelry')}
            className={`tab-btn ${activeTab === 'jewelry' ? 'active' : ''}`}
            style={{ padding: '10px', borderRadius: '8px', fontSize: '12px' }}
          >
            💍 Jewelry
          </button>
        )}
        {isAssetsUnlocked && (
          <>
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
          </>
        )}
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
      {showPurchaseConfirm && selectedDrop && (
        <Modal
          isOpen={showPurchaseConfirm}
          onClose={() => {
            setShowPurchaseConfirm(false);
            setSelectedDrop(null);
          }}
          title="🌟 Purchase Exclusive Item"
        >
          <div style={{ padding: '20px' }}>
            <p>
              Purchase exclusive item "{selectedDrop.name}" for $
              {systems.assetDrop.calculateDynamicPrice(selectedDrop).toLocaleString()}?
            </p>
            <div style={{ marginTop: '15px', fontSize: '12px', color: '#aaa' }}>
              • Flex Score: +{selectedDrop.baseFlexScore}<br />
              • Remaining: {selectedDrop.remaining}/{selectedDrop.totalSupply}<br />
              • Expires: {systems.assetDrop.getTimeRemaining(selectedDrop.expiresAt)}
            </div>
            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px',
              justifyContent: 'center'
            }}>
              <button onClick={confirmPurchaseExclusive} className="action-btn">
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowPurchaseConfirm(false);
                  setSelectedDrop(null);
                }}
                className="action-btn"
                style={{ background: '#ff6666' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
  
  function renderLockedScreen() {
    const currentRankId = systems.assets.getCurrentPlayerRank();
    const currentRank = gameData.playerRanks[currentRankId];
    const requiredRank = gameData.playerRanks[4];
    
    return (
      <div className="assets-screen">
        <div className="screen-header">
          <button className="back-button" onClick={() => onNavigate('home')}>
            ← Back
          </button>
          <h3>💎 Asset Store</h3>
          <div style={{ fontSize: '12px', color: '#aaa' }}>Locked</div>
        </div>
        
        <div style={{
          background: '#222',
          border: '2px solid #ff6666',
          borderRadius: '10px',
          padding: '40px 20px',
          textAlign: 'center',
          marginTop: '50px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
          <div style={{
            fontSize: '18px',
            color: '#ff6666',
            fontWeight: 'bold',
            marginBottom: '10px'
          }}>
            Asset Store Locked
          </div>
          <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '20px' }}>
            Assets unlock at Rank 4 (District Chief)
          </div>
          
          <div style={{
            background: '#333',
            padding: '15px',
            borderRadius: '8px',
            margin: '20px 0'
          }}>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              Current Rank
            </div>
            <div style={{
              color: currentRank.color,
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {currentRank.emoji} {currentRank.name}
            </div>
          </div>
          
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '20px' }}>
            Requirements for District Chief:<br />
            💰 ${requiredRank.minNetWorth.toLocaleString()} net worth<br />
            🏢 {requiredRank.minBases} bases<br />
            👥 {requiredRank.minGang} gang members
          </div>
          
          <button
            onClick={() => onNavigate('home')}
            className="action-btn"
            style={{ marginTop: '30px', padding: '12px 24px' }}
          >
            Continue Building Empire
          </button>
        </div>
      </div>
    );
  }
  
  function renderTabContent() {
    switch (activeTab) {
      case 'exclusive':
        return renderExclusiveTab();
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
  
  function renderExclusiveTab() {
    const cityDrops = systems.assetDrop.getCityDrops(currentCity);
    
    if (!cityDrops || cityDrops.length === 0) {
      return (
        <div style={{
          background: '#222',
          border: '1px solid #444',
          borderRadius: '10px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📦</div>
          <div style={{ fontSize: '16px', color: '#aaa' }}>
            No exclusive items in {currentCity} right now
          </div>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
            Check back soon or travel to another city!
          </div>
        </div>
      );
    }
    
    return (
      <>
        <div style={{
          background: '#1a1a1a',
          padding: '10px',
          borderRadius: '8px',
          marginBottom: '15px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#ffaa00'
        }}>
          🌟 {currentCity} Exclusive Items - Limited Supply!
        </div>
        
        {cityDrops.map((drop: any) => {
          const currentPrice = systems.assetDrop.calculateDynamicPrice(drop);
          const soldOut = drop.remaining === 0;
          const lowStock = drop.remaining < 10 && drop.remaining > 0;
          
          return (
            <div
              key={drop.id}
              className="market-item"
              style={{
                border: `2px solid ${soldOut ? '#666' : '#ffaa00'}`,
                opacity: soldOut ? 0.7 : 1
              }}
            >
              <div className="market-header">
                <div className="drug-name">
                  {drop.name}
                  {soldOut && ' ❌ SOLD OUT'}
                </div>
                <div className="drug-price">
                  ${currentPrice.toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#aaa', margin: '8px 0' }}>
                {drop.description} • ⭐ +{drop.baseFlexScore} Flex
              </div>
              <div style={{
                background: '#333',
                padding: '10px',
                borderRadius: '5px',
                margin: '8px 0'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px'
                }}>
                  <span style={{ color: lowStock ? '#ff6666' : '#ffaa00' }}>
                    {drop.remaining}/{drop.totalSupply} available
                  </span>
                  <span style={{ color: '#666' }}>
                    Expires: {systems.assetDrop.getTimeRemaining(drop.expiresAt)}
                  </span>
                </div>
              </div>
              {!soldOut ? (
                <button
                  onClick={() => handlePurchaseExclusive(drop.id)}
                  className="action-btn"
                  style={{ width: '100%', padding: '8px' }}
                  disabled={cash < currentPrice}
                >
                  🛒 Purchase Exclusive
                </button>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '8px',
                  color: '#666',
                  fontWeight: 'bold'
                }}>
                  SOLD OUT
                </div>
              )}
            </div>
          );
        })}
      </>
    );
  }
  
  function renderJewelryTab() {
    const jewelry = systems.assets.getAssetsByType('jewelry');
    const owned = systems.assets.getOwnedAssets('jewelry');
    const wearing = systems.assets.getWornJewelry();
    const capacity = systems.assets.getStorageCapacity();
    
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
          Wearing: {wearing.length}/{capacity.jewelry} jewelry items
          {wearing.length >= capacity.jewelry && ' (Buy property for more slots!)'}
        </div>
        
        {jewelry.map((item: any) => {
          const ownedInstances = owned[item.id] || [];
          const ownedCount = ownedInstances.length;
          const isWorn = wearing.some((instanceId: string) => {
            const instance = systems.assets.findAssetByInstanceId(instanceId);
            return instance && instance.id === item.id;
          });
          
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
                  {isWorn && ' 👤'}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {!isWorn ? (
                    <button
                      onClick={() => handleWearJewelry(ownedInstances[0].instanceId)}
                      className="action-btn"
                      style={{ padding: '6px', fontSize: '11px' }}
                    >
                      👤 Wear
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        const wornInstance = wearing.find((id: string) => {
                          const instance = systems.assets.findAssetByInstanceId(id);
                          return instance && instance.id === item.id;
                        });
                        if (wornInstance) handleRemoveJewelry(wornInstance);
                      }}
                      className="action-btn"
                      style={{ padding: '6px', fontSize: '11px', background: '#666' }}
                    >
                      Remove
                    </button>
                  )}
                  <button
                    onClick={() => handleSellAsset(ownedInstances[0].instanceId)}
                    className="action-btn sell"
                    style={{ padding: '6px', fontSize: '11px' }}
                  >
                    💰 Sell
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handlePurchaseAsset(item.id)}
                  className="action-btn"
                  style={{ width: '100%', padding: '8px' }}
                  disabled={cash < item.cost}
                >
                  💎 Purchase
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  }
  
  function renderCarsTab() {
    const cars = systems.assets.getAssetsByType('car');
    const owned = systems.assets.getOwnedAssets('car');
    const capacity = systems.assets.getStorageCapacity();
    
    let totalOwnedCars = 0;
    Object.values(owned).forEach((instances: any) => {
      totalOwnedCars += instances.length;
    });
    
    return (
      <>
        {capacity.cars === 0 ? (
          <div style={{
            background: '#331111',
            border: '1px solid #ff6666',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'center'
          }}>
            <div style={{ color: '#ff6666', fontWeight: 'bold', marginBottom: '5px' }}>
              ⚠️ No Car Storage Available
            </div>
            <div style={{ fontSize: '12px', color: '#ffaaaa' }}>
              Buy a property with garage space to own cars!
            </div>
          </div>
        ) : (
          <div style={{
            background: '#1a1a1a',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '15px',
            textAlign: 'center',
            fontSize: '12px',
            color: '#ffff00'
          }}>
            Car Storage: {totalOwnedCars}/{capacity.cars} cars
          </div>
        )}
        
        {cars.map((item: any) => {
          const ownedInstances = owned[item.id] || [];
          const ownedCount = ownedInstances.length;
          const canBuy = capacity.cars > 0 && totalOwnedCars < capacity.cars;
          
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
                  disabled={!canBuy || cash < item.cost}
                >
                  {!canBuy ? 'No Storage' : '🚗 Purchase'}
                </button>
              )}
            </div>
          );
        })}
      </>
    );
  }
  
  function renderPropertyTab() {
    const properties = systems.assets.getAssetsByType('property');
    const owned = systems.assets.getOwnedAssets('property');
    
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
                Storage: 💍 {item.capacity.jewelry} jewelry • 🚗 {item.capacity.cars} cars
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
    const allInstances = systems.assets.getAllOwnedInstances();
    const wearing = systems.assets.getWornJewelry();
    
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
    
    const grouped: any = { jewelry: [], cars: [], property: [], exclusive: [] };
    allInstances.forEach((instance: any) => {
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
              
              {grouped[type].map((instance: any) => {
                const isWorn = wearing.includes(instance.instanceId);
                const isExclusive = instance.exclusive;
                
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
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      {instance.type === 'jewelry' && (
                        <>
                          {!isWorn ? (
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
                          )}
                        </>
                      )}
                      <button
                        onClick={() => handleSellAsset(instance.instanceId)}
                        className="action-btn sell"
                        style={{ padding: '4px 8px', fontSize: '10px' }}
                      >
                        💰 Sell
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </>
    );
  }
} 