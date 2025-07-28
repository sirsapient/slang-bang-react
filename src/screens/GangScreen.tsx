import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext.jsx';
import { useTutorial } from '../contexts/TutorialContext';
import { ConfirmModal } from '../components/Modal';
// @ts-ignore
import { gameData } from '../game/data/gameData';

interface GangScreenProps {
  onNavigate: (screen: string) => void;
}

export default function GangScreen({ onNavigate }: GangScreenProps) {
  const { state, updateCash, dispatch } = useGame();
  const { progress, startTutorial } = useTutorial();
  const currentCity = state.currentCity;
  const cash = state.cash;
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromCity: '',
    toCity: '',
    amount: 1 as number | ''
  });
  
  const gangSize = state.gangSize || 0;
  // Calculate available gang globally and in city
  const getAvailableGangMembers = () => {
    let assignedGang = 0;
    Object.values(state.bases || {}).forEach((cityBases: any) => {
      (cityBases as any[]).forEach((base: any) => {
        assignedGang += base.assignedGang || 0;
      });
    });
    return Math.max(0, state.gangSize - assignedGang);
  };
  const getAvailableGangMembersInCity = (city: string) => {
    const totalInCity = (state.gangMembers && state.gangMembers[city]) || 0;
    let assignedInCity = 0;
    const cityBases = (state.bases && state.bases[city]) || [];
    (cityBases as any[]).forEach((base: any) => {
      assignedInCity += base.assignedGang || 0;
    });
    return Math.max(0, totalInCity - assignedInCity);
  };
  const availableGang = getAvailableGangMembers();
  const availableGangInCity = getAvailableGangMembersInCity(currentCity);
  
  // Tutorial trigger logic
  useEffect(() => {
    // Only start tutorial if it hasn't been completed and there are unassigned gang members
    if (!progress.gangManagementTutorial && availableGang > 0) {
      startTutorial('gangManagementTutorial');
    }
  }, [progress.gangManagementTutorial, availableGang, startTutorial]);
  
  const calculateTransferCost = (fromCity: string, toCity: string, amount: number) => {
    const baseTransferCost = gameData.config.baseGangCost * 0.3;
    const fromDistance = gameData.cities[fromCity]?.distanceIndex || 0;
    const toDistance = gameData.cities[toCity]?.distanceIndex || 0;
    const distance = Math.abs(fromDistance - toDistance);
    const distanceMultiplier = 1 + (distance * 0.1);
    const toCityHeat = gameData.cities[toCity]?.heatModifier || 1.0;
    const heatMultiplier = 1 + (toCityHeat - 1) * 0.5;
    
    return Math.floor(baseTransferCost * amount * distanceMultiplier * heatMultiplier);
  };
  
  const handleTransfer = () => {
    const { fromCity, toCity, amount } = transferData;
    const safeAmount = typeof amount === 'number' && amount > 0 ? amount : 1;
    const transferCost = calculateTransferCost(fromCity, toCity, safeAmount);
    if (transferCost > cash) {
      alert(`Not enough cash. Need $${transferCost.toLocaleString()}`);
      return;
    }
    // Remove from fromCity
    const updatedGangMembers = { ...state.gangMembers };
    updatedGangMembers[fromCity] = Math.max(0, (updatedGangMembers[fromCity] || 0) - safeAmount);
    // Add to toCity
    updatedGangMembers[toCity] = (updatedGangMembers[toCity] || 0) + safeAmount;
    dispatch({ type: 'UPDATE_GANG', gangMembers: updatedGangMembers, gangSize: state.gangSize });
    updateCash(-transferCost);
    setShowTransferModal(false);
  };
  
  const gangMembers = state.gangMembers || {};
  const citiesWithGang = Object.keys(gangMembers).filter(city => gangMembers[city] > 0);
  
  return (
    <div className="gang-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>👥 Gang Management</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Build Your Crew</div>
      </div>
      
      {/* Gang Overview */}
      <div style={{
        background: '#333',
        border: '1px solid #666',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              👥 Gang Size
            </div>
            <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>
              {gangSize}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              💰 Cash
            </div>
            <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>
              ${cash.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              📍 Location
            </div>
            <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>
              {currentCity}
            </div>
          </div>
        </div>
      </div>
      
      {/* Gang Members by City */}
      {citiesWithGang.length > 0 && (
        <div style={{
          background: '#222',
          border: '1px solid #444',
          borderRadius: '10px',
          padding: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '15px', textAlign: 'center' }}>
            🗺️ Gang Members by City
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {citiesWithGang.map(city => {
              const totalInCity = gangMembers[city];
              const availableInCity = getAvailableGangMembersInCity(city);
              const assignedInCity = totalInCity - availableInCity;
              
              return (
                <div key={city} style={{
                  background: '#1a1a1a',
                  padding: '10px',
                  borderRadius: '5px'
                }}>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                    {city}
                  </div>
                  <div style={{ fontSize: '14px', color: '#ffff00', fontWeight: 'bold' }}>
                    {totalInCity} total
                  </div>
                  <div style={{ fontSize: '10px', color: '#66ff66' }}>
                    {availableInCity} available
                  </div>
                  {assignedInCity > 0 && (
                    <div style={{ fontSize: '10px', color: '#ff6666' }}>
                      {assignedInCity} assigned
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {citiesWithGang.length > 0 && (
            <button
              onClick={() => {
                setTransferData({
                  fromCity: citiesWithGang[0],
                  toCity: Object.keys(gameData.cities).find(city => city !== citiesWithGang[0]) || citiesWithGang[0],
                  amount: 1
                });
                setShowTransferModal(true);
              }}
              className="action-btn"
              style={{ width: '100%', marginTop: '15px' }}
            >
              🔄 Transfer Gang Members
            </button>
          )}
        </div>
      )}
      
      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🔄 Transfer Gang Members</span>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                    From City
                  </label>
                  <select
                    value={transferData.fromCity}
                    onChange={e => setTransferData({...transferData, fromCity: e.target.value})}
                    style={{
                      width: '100%',
                      background: '#333',
                      color: '#fff',
                      border: '1px solid #666',
                      padding: '8px',
                      borderRadius: '4px'
                    }}
                  >
                    {citiesWithGang.map(city => (
                      <option key={city} value={city}>
                        {city} ({getAvailableGangMembersInCity(city)} available)
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                    To City
                  </label>
                  <select
                    value={transferData.toCity}
                    onChange={e => setTransferData({...transferData, toCity: e.target.value})}
                    style={{
                      width: '100%',
                      background: '#333',
                      color: '#fff',
                      border: '1px solid #666',
                      padding: '8px',
                      borderRadius: '4px'
                    }}
                  >
                    {Object.keys(gameData.cities).map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', color: '#aaa' }}>
                    Amount
                  </label>
                  <input
                    type="number"
                    value={transferData.amount === '' ? '' : transferData.amount}
                    onChange={e => {
                      const val = e.target.value;
                      setTransferData({
                        ...transferData,
                        amount: val === '' ? '' : parseInt(val, 10)
                      });
                    }}
                    min="1"
                    max={getAvailableGangMembersInCity(transferData.fromCity)}
                    style={{
                      width: '100%',
                      background: '#333',
                      color: '#fff',
                      border: '1px solid #666',
                      padding: '8px',
                      borderRadius: '4px'
                    }}
                  />
                </div>
                
                {transferData.fromCity && transferData.toCity && typeof transferData.amount === 'number' && transferData.amount > 0 && (
                  <div style={{
                    background: '#1a1a1a',
                    padding: '10px',
                    borderRadius: '5px',
                    marginBottom: '20px',
                    fontSize: '12px'
                  }}>
                    <div>Transfer Cost: <span style={{ color: '#ffff00' }}>
                      ${calculateTransferCost(transferData.fromCity, transferData.toCity, transferData.amount).toLocaleString()}
                    </span></div>
                  </div>
                )}
                
                <button
                  onClick={handleTransfer}
                  className="action-btn"
                  style={{ width: '100%' }}
                  disabled={
                    transferData.fromCity === transferData.toCity ||
                    typeof transferData.amount !== 'number' ||
                    transferData.amount <= 0
                  }
                >
                  Transfer
      </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 