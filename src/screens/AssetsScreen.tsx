import React, { useState } from 'react';
import { useGame, useCurrentCity, useCash } from '../contexts/GameContext';
import { gameData } from '../game/data/gameData';

interface AssetsScreenProps {
  onNavigate: (screen: string) => void;
}

interface Asset {
  id: string;
  name: string;
  type: string;
  cost: number;
  flexValue: number;
  city?: string;
  description?: string;
}

export default function AssetsScreen({ onNavigate }: AssetsScreenProps) {
  const { state, systems, events, refreshUI } = useGame();
  const currentCity = useCurrentCity();
  const cash = useCash();
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  
  const assets = state.assets || {};
  const wornJewelry = state.wornJewelry || [];
  
  const assetTypes = {
    jewelry: {
      name: 'Jewelry',
      emoji: '💎',
      items: [
        { id: 'gold_chain', name: 'Gold Chain', cost: 5000, flexValue: 100, description: 'Basic gold chain' },
        { id: 'diamond_ring', name: 'Diamond Ring', cost: 25000, flexValue: 500, description: 'Sparkling diamond ring' },
        { id: 'rolex', name: 'Rolex Watch', cost: 100000, flexValue: 2000, description: 'Luxury timepiece' },
        { id: 'crown', name: 'Crown', cost: 500000, flexValue: 10000, description: 'Royal crown' }
      ]
    },
    cars: {
      name: 'Cars',
      emoji: '🚗',
      items: [
        { id: 'beater', name: 'Beater Car', cost: 10000, flexValue: 200, description: 'Basic transportation' },
        { id: 'sports_car', name: 'Sports Car', cost: 100000, flexValue: 2000, description: 'Fast and flashy' },
        { id: 'limo', name: 'Limo', cost: 500000, flexValue: 10000, description: 'Luxury transportation' },
        { id: 'supercar', name: 'Supercar', cost: 2000000, flexValue: 50000, description: 'Ultimate luxury' }
      ]
    },
    properties: {
      name: 'Properties',
      emoji: '🏠',
      items: [
        { id: 'apartment', name: 'Apartment', cost: 50000, flexValue: 1000, description: 'Basic apartment' },
        { id: 'mansion', name: 'Mansion', cost: 1000000, flexValue: 20000, description: 'Luxury mansion' },
        { id: 'penthouse', name: 'Penthouse', cost: 5000000, flexValue: 100000, description: 'Exclusive penthouse' },
        { id: 'island', name: 'Private Island', cost: 50000000, flexValue: 1000000, description: 'Ultimate luxury' }
      ]
    }
  };
  
  const calculateFlexScore = () => {
    let totalFlex = 0;
    
    // Add flex from owned assets
    Object.values(assets).forEach((assetList: any) => {
      assetList.forEach((asset: Asset) => {
        totalFlex += asset.flexValue;
      });
    });
    
    // Add flex from worn jewelry
    wornJewelry.forEach((jewelryId: string) => {
      const jewelry = assetTypes.jewelry.items.find(item => item.id === jewelryId);
      if (jewelry) {
        totalFlex += jewelry.flexValue * 2; // Worn jewelry gives double flex
      }
    });
    
    return totalFlex;
  };
  
  const handleBuyAsset = (asset: Asset) => {
    if (!state.canAfford(asset.cost)) {
      alert(`Not enough cash. Need $${asset.cost.toLocaleString()}`);
      return;
    }
    
    if (!assets[asset.type]) {
      assets[asset.type] = [];
    }
    
    const newAsset = {
      ...asset,
      id: Date.now().toString(),
      city: currentCity
    };
    
    assets[asset.type].push(newAsset);
    state.updateCash(-asset.cost);
    state.assets = assets;
    
    events.add(`Purchased ${asset.name} for $${asset.cost.toLocaleString()}`, 'good');
    setShowBuyModal(false);
    refreshUI();
  };
  
  const handleSellAsset = (asset: Asset) => {
    const sellValue = Math.floor(asset.cost * 0.7); // 70% of original cost
    state.updateCash(sellValue);
    
    // Remove from assets
    const assetList = assets[asset.type];
    const assetIndex = assetList.findIndex((a: Asset) => a.id === asset.id);
    if (assetIndex !== -1) {
      assetList.splice(assetIndex, 1);
    }
    
    events.add(`Sold ${asset.name} for $${sellValue.toLocaleString()}`, 'good');
    setShowSellModal(false);
    refreshUI();
  };
  
  const handleWearJewelry = (jewelryId: string) => {
    if (!wornJewelry.includes(jewelryId)) {
      state.wornJewelry = [...wornJewelry, jewelryId];
      events.add(`Wore ${assetTypes.jewelry.items.find(item => item.id === jewelryId)?.name}`, 'good');
      refreshUI();
    }
  };
  
  const handleRemoveJewelry = (jewelryId: string) => {
    const newWornJewelry = wornJewelry.filter(id => id !== jewelryId);
    state.wornJewelry = newWornJewelry;
    events.add(`Removed ${assetTypes.jewelry.items.find(item => item.id === jewelryId)?.name}`, 'neutral');
    refreshUI();
  };
  
  const flexScore = calculateFlexScore();
  
  return (
    <div className="assets-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>💎 Assets & Flex</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Show Off Your Wealth</div>
      </div>
      
      {/* Flex Score */}
      <div style={{
        background: '#333',
        border: '1px solid #666',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
          💎 Flex Score
        </div>
        <div style={{ fontSize: '24px', color: '#ffff00', fontWeight: 'bold', marginBottom: '10px' }}>
          {flexScore.toLocaleString()}
        </div>
        <div style={{ fontSize: '12px', color: '#aaa' }}>
          Higher flex score increases respect and unlocks exclusive content
        </div>
      </div>
      
      {/* Asset Categories */}
      {Object.entries(assetTypes).map(([type, category]) => (
        <div key={type} className="market-item">
          <div className="market-header">
            <div className="drug-name">{category.emoji} {category.name}</div>
            <div className="drug-price">{assets[type]?.length || 0} owned</div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {category.items.map((item) => {
              const owned = assets[type]?.filter((asset: Asset) => asset.name === item.name).length || 0;
              const isWorn = type === 'jewelry' && wornJewelry.includes(item.id);
              
              return (
                <div key={item.id} style={{
                  background: '#1a1a1a',
                  border: isWorn ? '2px solid #66ff66' : '1px solid #444',
                  borderRadius: '8px',
                  padding: '12px',
                  position: 'relative'
                }}>
                  {isWorn && (
                    <div style={{
                      position: 'absolute',
                      top: '5px',
                      right: '5px',
                      background: '#66ff66',
                      color: '#000',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      fontWeight: 'bold'
                    }}>
                      WORN
                    </div>
                  )}
                  
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ffff00', marginBottom: '5px' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                    {item.description}
                  </div>
                  <div style={{ fontSize: '12px', color: '#66ff66', marginBottom: '5px' }}>
                    ${item.cost.toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: '#ffff00', marginBottom: '10px' }}>
                    +{item.flexValue} flex
                  </div>
                  
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      className="action-btn"
                      onClick={() => {
                        setSelectedAsset(item);
                        setShowBuyModal(true);
                      }}
                      disabled={item.cost > cash}
                      style={{
                        fontSize: '10px',
                        padding: '5px 8px',
                        background: item.cost > cash ? '#444' : '#333',
                        color: item.cost > cash ? '#666' : '#fff'
                      }}
                    >
                      Buy
                    </button>
                    
                    {owned > 0 && (
                      <button
                        className="action-btn"
                        onClick={() => {
                          const ownedAsset = assets[type].find((asset: Asset) => asset.name === item.name);
                          if (ownedAsset) {
                            setSelectedAsset(ownedAsset);
                            setShowSellModal(true);
                          }
                        }}
                        style={{
                          fontSize: '10px',
                          padding: '5px 8px',
                          background: '#ff6666',
                          color: '#000'
                        }}
                      >
                        Sell
                      </button>
                    )}
                    
                    {type === 'jewelry' && owned > 0 && !isWorn && (
                      <button
                        className="action-btn"
                        onClick={() => handleWearJewelry(item.id)}
                        style={{
                          fontSize: '10px',
                          padding: '5px 8px',
                          background: '#66ff66',
                          color: '#000'
                        }}
                      >
                        Wear
                      </button>
                    )}
                    
                    {type === 'jewelry' && isWorn && (
                      <button
                        className="action-btn"
                        onClick={() => handleRemoveJewelry(item.id)}
                        style={{
                          fontSize: '10px',
                          padding: '5px 8px',
                          background: '#ff6666',
                          color: '#000'
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  {owned > 0 && (
                    <div style={{ fontSize: '10px', color: '#66ff66', marginTop: '5px' }}>
                      Owned: {owned}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      
      {/* Worn Jewelry Display */}
      {wornJewelry.length > 0 && (
        <div style={{
          background: '#222',
          border: '1px solid #444',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '15px', textAlign: 'center' }}>
            💎 Currently Wearing
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {wornJewelry.map((jewelryId) => {
              const jewelry = assetTypes.jewelry.items.find(item => item.id === jewelryId);
              if (!jewelry) return null;
              
              return (
                <div key={jewelryId} style={{
                  background: '#1a1a1a',
                  padding: '10px',
                  borderRadius: '5px',
                  border: '1px solid #66ff66'
                }}>
                  <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#66ff66' }}>
                    {jewelry.name}
                  </div>
                  <div style={{ fontSize: '10px', color: '#aaa' }}>
                    +{jewelry.flexValue * 2} flex (worn)
                  </div>
                  <button
                    onClick={() => handleRemoveJewelry(jewelryId)}
                    className="action-btn"
                    style={{
                      fontSize: '10px',
                      padding: '3px 6px',
                      background: '#ff6666',
                      color: '#000',
                      marginTop: '5px'
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Buy Modal */}
      {showBuyModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => setShowBuyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">💎 Purchase Asset</span>
              <button className="modal-close" onClick={() => setShowBuyModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {selectedAsset.name}
                </div>
                <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
                  {selectedAsset.description}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '20px' }}>
                  <div>Cost: <span style={{ color: '#ffff00' }}>${selectedAsset.cost.toLocaleString()}</span></div>
                  <div>Flex Value: <span style={{ color: '#66ff66' }}>+{selectedAsset.flexValue}</span></div>
                  <div>Type: <span style={{ color: '#ffff00' }}>{selectedAsset.type}</span></div>
                  <div>Location: <span style={{ color: '#ffff00' }}>{currentCity}</span></div>
                </div>
                
                <button
                  onClick={() => handleBuyAsset(selectedAsset)}
                  className="action-btn"
                  style={{ width: '100%' }}
                  disabled={selectedAsset.cost > cash}
                >
                  Purchase for ${selectedAsset.cost.toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Sell Modal */}
      {showSellModal && selectedAsset && (
        <div className="modal-overlay" onClick={() => setShowSellModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">💰 Sell Asset</span>
              <button className="modal-close" onClick={() => setShowSellModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                  {selectedAsset.name}
                </div>
                <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
                  Sell this asset for 70% of its original value
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '20px' }}>
                  <div>Original Cost: <span style={{ color: '#ffff00' }}>${selectedAsset.cost.toLocaleString()}</span></div>
                  <div>Sell Value: <span style={{ color: '#66ff66' }}>${Math.floor(selectedAsset.cost * 0.7).toLocaleString()}</span></div>
                  <div>Flex Lost: <span style={{ color: '#ff6666' }}>-{selectedAsset.flexValue}</span></div>
                  <div>Location: <span style={{ color: '#ffff00' }}>{selectedAsset.city}</span></div>
                </div>
                
                <button
                  onClick={() => handleSellAsset(selectedAsset)}
                  className="action-btn"
                  style={{ width: '100%', background: '#ff6666', color: '#000' }}
                >
                  Sell for ${Math.floor(selectedAsset.cost * 0.7).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 