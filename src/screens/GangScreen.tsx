import React, { useState } from 'react';
import { useGame, useCurrentCity, useCash } from '../contexts/GameContext';
import { ConfirmModal } from '../components/Modal';
import { gameData } from '../game/data/gameData';

interface GangScreenProps {
  onNavigate: (screen: string) => void;
}

export default function GangScreen({ onNavigate }: GangScreenProps) {
  const { state, systems, events, refreshUI } = useGame();
  const currentCity = useCurrentCity();
  const cash = useCash();
  const [recruitCount, setRecruitCount] = useState(1);
  const [showRecruitConfirm, setShowRecruitConfirm] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromCity: '',
    toCity: '',
    amount: 1
  });
  
  const gangSize = state.gangSize || 0;
  const availableGang = state.getAvailableGangMembers();
  const availableGangInCity = state.getAvailableGangMembersInCity(currentCity);
  
  const calculateGangMemberCost = () => {
    const baseCost = gameData.config.baseGangCost || 10000;
    const cityData = gameData.cities[currentCity];
    const cityModifier = cityData?.heatModifier || 1.0;
    const gangCostScaling = gameData.config.gangCostScaling || 0.1;
    const gangModifier = 1 + (gangSize * gangCostScaling);
    
    const cost = Math.floor(baseCost * cityModifier * gangModifier);
    return Math.min(cost, 40000); // Cap at 40k
  };
  
  const costPerMember = calculateGangMemberCost();
  const totalRecruitCost = costPerMember * recruitCount;
  const maxAffordable = Math.floor(cash / costPerMember);
  
  const handleRecruit = () => {
    if (recruitCount <= 0 || totalRecruitCost > cash) return;
    
    state.updateCash(-totalRecruitCost);
    state.addGangMembers(currentCity, recruitCount);
    
    const heatIncrease = recruitCount * gameData.config.gangRecruitHeat;
    state.updateWarrant(heatIncrease);
    
    events.add(`Recruited ${recruitCount} gang members in ${currentCity} for $${totalRecruitCost.toLocaleString()}`, 'good');
    events.add(`Gang recruitment increased heat by ${heatIncrease.toLocaleString()}`, 'bad');
    
    setRecruitCount(1);
    setShowRecruitConfirm(false);
    refreshUI();
  };
  
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
    const transferCost = calculateTransferCost(fromCity, toCity, amount);
    
    if (!state.canAfford(transferCost)) {
      alert(`Not enough cash. Need $${transferCost.toLocaleString()}`);
      return;
    }
    
    state.removeGangMembersFromCity(fromCity, amount);
    state.addGangMembers(toCity, amount);
    state.updateCash(-transferCost);
    
    events.add(`Transferred ${amount} gang members from ${fromCity} to ${toCity} for $${transferCost.toLocaleString()}`, 'good');
    
    setShowTransferModal(false);
    refreshUI();
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
      
      {/* Recruitment Section */}
      <div className="market-item">
        <div className="market-header">
          <div className="drug-name">🔫 Recruit Gang Members</div>
          <div className="drug-price">${costPerMember.toLocaleString()} each</div>
        </div>
        <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px' }}>
          Gang members generate heat but enable advanced operations.
          <span style={{ color: '#ffff00' }}> Cost increases with city heat modifier.</span>
        </div>
        
        <div style={{ background: '#1a1a1a', padding: '15px', borderRadius: '8px', marginBottom: '15px' }}>
          <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '10px', textAlign: 'center' }}>
            💼 Bulk Recruitment
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: '8px',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <input
              type="number"
              value={recruitCount}
              onChange={(e) => setRecruitCount(Math.max(1, parseInt(e.target.value) || 1))}
              min="1"
              max="50"
              className="quantity-input"
              placeholder="Members to recruit"
            />
            <button
              className="action-btn"
              onClick={() => setShowRecruitConfirm(true)}
              disabled={recruitCount <= 0 || totalRecruitCost > cash}
            >
              Recruit
            </button>
            <button
              className="action-btn"
              style={{ background: '#666', fontSize: '10px', padding: '6px 8px' }}
              onClick={() => setRecruitCount(Math.min(50, maxAffordable))}
            >
              Max
            </button>
          </div>
          
          <div style={{ fontSize: '12px', color: '#ffff00', textAlign: 'center', minHeight: '40px' }}>
            {recruitCount > 0 && (
              <>
                <div>Total Cost: <span style={{ color: totalRecruitCost > cash ? '#ff6666' : '#ffff00' }}>
                  ${totalRecruitCost.toLocaleString()}
                </span></div>
                <div style={{ marginTop: '5px' }}>
                  Heat Increase: <span style={{ color: '#ff6666' }}>
                    +{(recruitCount * gameData.config.gangRecruitHeat).toLocaleString()}
                  </span>
                </div>
              </>
            )}
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
              const availableInCity = state.getAvailableGangMembersInCity(city);
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
          
          {citiesWithGang.length > 1 && (
            <button
              onClick={() => {
                setTransferData({
                  fromCity: citiesWithGang[0],
                  toCity: citiesWithGang[1],
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
      
      {/* Recruit Confirmation */}
      <ConfirmModal
        isOpen={showRecruitConfirm}
        onConfirm={handleRecruit}
        onCancel={() => setShowRecruitConfirm(false)}
        title="Recruit Gang Members"
        message={`Recruit ${recruitCount} gang members in ${currentCity}?<br><br>
          <strong>Cost:</strong> $${totalRecruitCost.toLocaleString()}<br>
          <strong>Cost per member:</strong> $${costPerMember.toLocaleString()}<br>
          <strong>Heat increase:</strong> +${(recruitCount * gameData.config.gangRecruitHeat).toLocaleString()}<br>
          <strong>New gang size:</strong> ${gangSize + recruitCount}<br><br>
          This will increase your daily heat generation.`}
      />
      
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
                        {city} ({state.getAvailableGangMembersInCity(city)} available)
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
                    value={transferData.amount}
                    onChange={e => setTransferData({...transferData, amount: Math.max(1, parseInt(e.target.value) || 1)})}
                    min="1"
                    max={state.getAvailableGangMembersInCity(transferData.fromCity)}
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
                
                {transferData.fromCity && transferData.toCity && transferData.amount > 0 && (
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
                  disabled={transferData.fromCity === transferData.toCity || transferData.amount <= 0}
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