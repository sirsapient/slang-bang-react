import React, { useState } from 'react';
import { useGame, useCash, useCurrentCity } from '../contexts/GameContext';
import { gameData } from '../game/data/gameData';

interface AssetsScreenProps {
  onNavigate: (screen: string) => void;
}

export default function AssetsScreen({ onNavigate }: AssetsScreenProps) {
  const { state, systems, refreshUI, events } = useGame();
  const cash = useCash();
  const currentCity = useCurrentCity();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [buyAsset, setBuyAsset] = useState<any>(null);
  const [showSellModal, setShowSellModal] = useState(false);
  const [sellAsset, setSellAsset] = useState<any>(null);
  const [showError, setShowError] = useState<string | null>(null);

  // Asset summary
  const assetSummary = systems.assets.getAssetSummary();
  const flexScore = assetSummary.flexScore;
  const totalValue = assetSummary.totalValue;
  const jewelryCount = assetSummary.jewelryCount;
  const carCount = assetSummary.carCount;
  const propertyCount = assetSummary.propertyCount;
  const wearingJewelry = systems.assets.getWornJewelry();

  // Asset unlocks
  const playerRank = systems.assets.getCurrentPlayerRank();
  const canBuyCars = playerRank >= 4;
  const canBuyProperties = playerRank >= 4;

  // Available assets
  const jewelryAssets = systems.assets.getAssetsByType('jewelry');
  const carAssets = systems.assets.getAssetsByType('car');
  const propertyAssets = systems.assets.getAssetsByType('property');

  // Owned assets
  const ownedAssets = systems.assets.getAllOwnedInstances();

  // Buy handler
  const handleBuy = (asset: any) => {
    setBuyAsset(asset);
    setShowBuyModal(true);
  };
  const confirmBuy = () => {
    if (!buyAsset) return;
    const result = systems.assets.purchaseAsset(buyAsset.id);
    if (!result.success && result.error) {
      setShowError(result.error);
    } else {
      setShowBuyModal(false);
      setBuyAsset(null);
      setShowError(null);
      refreshUI();
    }
  };
  const cancelBuy = () => {
    setShowBuyModal(false);
    setBuyAsset(null);
    setShowError(null);
  };

  // Sell handler
  const handleSell = (instance: any) => {
    setSellAsset(instance);
    setShowSellModal(true);
  };
  const confirmSell = () => {
    if (!sellAsset) return;
    const result = systems.assets.sellAsset(sellAsset.instanceId);
    if (!result.success && result.error) {
      setShowError(result.error);
    } else {
      setShowSellModal(false);
      setSellAsset(null);
      setShowError(null);
      refreshUI();
    }
  };
  const cancelSell = () => {
    setShowSellModal(false);
    setSellAsset(null);
    setShowError(null);
  };

  // Wear/Remove jewelry
  const handleWearJewelry = (instanceId: string) => {
    const result = systems.assets.wearJewelry(instanceId);
    if (!result.success && result.error) {
      setShowError(result.error);
    } else {
      refreshUI();
    }
  };
  const handleRemoveJewelry = (instanceId: string) => {
    const result = systems.assets.removeJewelry(instanceId);
    if (!result.success && result.error) {
      setShowError(result.error);
    } else {
      refreshUI();
    }
  };

  return (
    <div className="assets-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>💎 Assets</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Jewelry, Cars, Properties</div>
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
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Flex Score</div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>{flexScore}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Total Value</div>
          <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>${totalValue.toLocaleString()}</div>
        </div>
        <div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>Jewelry / Cars / Properties</div>
          <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>{jewelryCount} / {carCount} / {propertyCount}</div>
        </div>
      </div>

      {/* Available Assets */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Available Assets</div>
        <div style={{ fontWeight: 'bold', color: '#66ff66', marginBottom: '5px' }}>Jewelry</div>
        {jewelryAssets.map((asset: any) => (
          <div key={asset.id} style={{
            background: '#222',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#ffff00' }}>{asset.name}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{asset.description}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>Flex: +{asset.flexScore} | Cost: ${asset.cost.toLocaleString()}</div>
            </div>
            <button
              className="action-btn"
              style={{ background: cash >= asset.cost ? '#00ff00' : '#666', color: '#000' }}
              disabled={cash < asset.cost}
              onClick={() => handleBuy(asset)}
            >
              Buy
            </button>
          </div>
        ))}
        {canBuyCars && <div style={{ fontWeight: 'bold', color: '#66ff66', margin: '10px 0 5px' }}>Cars</div>}
        {canBuyCars && carAssets.map((asset: any) => (
          <div key={asset.id} style={{
            background: '#222',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#ffff00' }}>{asset.name}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{asset.description}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>Flex: +{asset.flexScore} | Cost: ${asset.cost.toLocaleString()}</div>
            </div>
            <button
              className="action-btn"
              style={{ background: cash >= asset.cost ? '#00ff00' : '#666', color: '#000' }}
              disabled={cash < asset.cost}
              onClick={() => handleBuy(asset)}
            >
              Buy
            </button>
          </div>
        ))}
        {canBuyProperties && <div style={{ fontWeight: 'bold', color: '#66ff66', margin: '10px 0 5px' }}>Properties</div>}
        {canBuyProperties && propertyAssets.map((asset: any) => (
          <div key={asset.id} style={{
            background: '#222',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#ffff00' }}>{asset.name}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{asset.description}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>Flex: +{asset.flexScore} | Cost: ${asset.cost.toLocaleString()}</div>
            </div>
            <button
              className="action-btn"
              style={{ background: cash >= asset.cost ? '#00ff00' : '#666', color: '#000' }}
              disabled={cash < asset.cost}
              onClick={() => handleBuy(asset)}
            >
              Buy
            </button>
          </div>
        ))}
      </div>

      {/* Owned Assets */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '10px' }}>Owned Assets</div>
        {ownedAssets.length === 0 && <div style={{ color: '#666' }}>You don't own any assets yet.</div>}
        {ownedAssets.map((instance: any) => (
          <div key={instance.instanceId} style={{
            background: '#222',
            border: '1px solid #444',
            borderRadius: '8px',
            padding: '10px',
            marginBottom: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', color: '#ffff00' }}>{instance.name}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>{instance.description}</div>
              <div style={{ fontSize: '12px', color: '#aaa' }}>Flex: +{instance.flexScore} | Resale: ${instance.resaleValue?.toLocaleString() || Math.floor(instance.cost * 0.9).toLocaleString()}</div>
              {instance.type === 'jewelry' && (
                <div style={{ fontSize: '12px', color: '#aaa' }}>
                  {wearingJewelry.includes(instance.instanceId)
                    ? <span style={{ color: '#66ff66' }}>Wearing</span>
                    : <span style={{ color: '#aaa' }}>Not Wearing</span>}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {instance.type === 'jewelry' && (
                wearingJewelry.includes(instance.instanceId)
                  ? <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => handleRemoveJewelry(instance.instanceId)}>Remove</button>
                  : <button className="action-btn" onClick={() => handleWearJewelry(instance.instanceId)}>Wear</button>
              )}
              <button className="action-btn" style={{ background: '#ff6600' }} onClick={() => handleSell(instance)}>Sell</button>
            </div>
          </div>
        ))}
      </div>

      {/* Buy Modal */}
      {showBuyModal && buyAsset && (
        <div className="modal-overlay" onClick={cancelBuy}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Purchase</span>
              <button className="modal-close" onClick={cancelBuy}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontWeight: 'bold', color: '#ffff00', fontSize: '18px', marginBottom: '10px' }}>{buyAsset.name}</div>
              <div style={{ color: '#aaa', marginBottom: '10px' }}>{buyAsset.description}</div>
              <div style={{ color: '#aaa', marginBottom: '10px' }}>Flex: +{buyAsset.flexScore} | Cost: ${buyAsset.cost.toLocaleString()}</div>
              {showError && <div style={{ color: '#ff6666', marginBottom: '10px' }}>{showError}</div>}
              <button className="action-btn" onClick={confirmBuy}>
                Confirm
              </button>
              <button className="action-btn" style={{ background: '#ff6666', marginLeft: 10 }} onClick={cancelBuy}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sell Modal */}
      {showSellModal && sellAsset && (
        <div className="modal-overlay" onClick={cancelSell}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Sale</span>
              <button className="modal-close" onClick={cancelSell}>×</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontWeight: 'bold', color: '#ffff00', fontSize: '18px', marginBottom: '10px' }}>{sellAsset.name}</div>
              <div style={{ color: '#aaa', marginBottom: '10px' }}>{sellAsset.description}</div>
              <div style={{ color: '#aaa', marginBottom: '10px' }}>Resale: ${sellAsset.resaleValue?.toLocaleString() || Math.floor(sellAsset.cost * 0.9).toLocaleString()}</div>
              {showError && <div style={{ color: '#ff6666', marginBottom: '10px' }}>{showError}</div>}
              <button className="action-btn" onClick={confirmSell}>
                Confirm
              </button>
              <button className="action-btn" style={{ background: '#ff6666', marginLeft: 10 }} onClick={cancelSell}>
                Cancel
              </button>
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