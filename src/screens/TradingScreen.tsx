import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext.jsx';
import { useTutorial } from '../contexts/TutorialContext.jsx';
import { Modal } from '../components/Modal';
// @ts-ignore
import { gameData } from '../game/data/gameData';
import Navigation from '../components/Navigation';

interface TradingScreenProps {
  onNavigate: (screen: string) => void;
}

type Drug = 'Fentanyl' | 'Oxycontin' | 'Heroin' | 'Cocaine' | 'Weed' | 'Meth';

const TradingScreen: React.FC<TradingScreenProps> = ({ onNavigate }) => {
  const { state, buyDrug, sellDrug, sellAllDrugs } = useGame();
  const { nextStep, activeTutorial, stepIndex, tutorialSteps } = useTutorial();
  const currentCity = state.currentCity || 'Unknown';
  const inventory = state.inventory;
  const cash = state.cash;
  const initialDrugQuantities: Record<Drug, number> = {
    Fentanyl: 0,
    Oxycontin: 0,
    Heroin: 0,
    Cocaine: 0,
    Weed: 0,
    Meth: 0,
  };
  const [buyQuantities, setBuyQuantities] = useState<Record<Drug, number>>(initialDrugQuantities);
  const [sellQuantities, setSellQuantities] = useState<Record<Drug, number>>(initialDrugQuantities);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const [showSellAllModal, setShowSellAllModal] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [confirmAmount, setConfirmAmount] = useState(0);
  const [sellAllSummary, setSellAllSummary] = useState<{ total: number, drugs: string[] }>({ total: 0, drugs: [] });
  const [_, forceUpdate] = useState(0);

  const prices = state.cityPrices?.[currentCity] || {};
  const supply = state.citySupply?.[currentCity] || {};

  // Handle tutorial steps
  useEffect(() => {
    if (activeTutorial === 'gettingStarted' && stepIndex === 11) {
      const step = tutorialSteps[activeTutorial][stepIndex];
      if (step && step.id === 'sell-weed-instruction') {
        console.log('Tutorial: Showing sell instruction modal');
        // The tutorial overlay will show the instruction
      }
    }
  }, [activeTutorial, stepIndex, tutorialSteps]);

  // Handle tutorial completion after selling
  useEffect(() => {
    if (activeTutorial === 'gettingStarted' && stepIndex === 12) {
      const step = tutorialSteps[activeTutorial][stepIndex];
      if (step && step.id === 'congratulations') {
        console.log('Tutorial: Showing congratulations modal');
        // The tutorial overlay will show the congratulations message
      }
    }
  }, [activeTutorial, stepIndex, tutorialSteps]);

  // TODO: Price generation should be handled in context or on app start

  const handleBuy = (drug: string) => {
    setSelectedDrug(drug as Drug);
    setConfirmAmount(buyQuantities[drug as Drug] || 0);
    setShowBuyModal(true);
  };

  const handleSell = (drug: string) => {
    setSelectedDrug(drug as Drug);
    setConfirmAmount(sellQuantities[drug as Drug] || 0);
    setShowSellModal(true);
  };

  const confirmBuy = () => {
    if (!selectedDrug) return;
    const amount = confirmAmount;
    if (amount <= 0) return setShowBuyModal(false);
    
    // Check if this is a tutorial click for Weed purchase
    if (activeTutorial === 'gettingStarted' && stepIndex === 6 && selectedDrug === 'Weed' && amount === 2) {
      const step = tutorialSteps[activeTutorial][stepIndex];
      if (step && step.requireClick) {
        nextStep();
      }
    }
    
    // Use context action
    buyDrug(selectedDrug, amount, prices[selectedDrug!] || 0);
    setShowBuyModal(false);
    setBuyQuantities(q => ({ ...q, [selectedDrug!]: 0 }));
    forceUpdate(x => x + 1);
  };

  const confirmSell = () => {
    if (!selectedDrug) return;
    const amount = confirmAmount;
    if (amount <= 0) return setShowSellModal(false);
    // Use context action
    sellDrug(selectedDrug, amount, prices[selectedDrug!] || 0);
    setShowSellModal(false);
    setSellQuantities(q => ({ ...q, [selectedDrug!]: 0 }));
    forceUpdate(x => x + 1);
  };

  const handleBuyQuantityChange = (drug: string, value: string) => {
    const num = parseInt(value) || 0;
    setBuyQuantities(q => ({ ...q, [drug as Drug]: num }));
  };

  const handleSellQuantityChange = (drug: string, value: string) => {
    const num = parseInt(value) || 0;
    setSellQuantities(q => ({ ...q, [drug as Drug]: num }));
  };

  const handleSellAll = () => {
    console.log('[DEBUG] handleSellAll called (TradingScreen)');
    console.trace();
    // Calculate total and drugs to sell
    let total = 0;
    const drugs: string[] = [];
    Object.keys(inventory).forEach(drug => {
      const qty = inventory[drug as Drug] || 0;
      if (qty > 0) {
        const price = prices[drug as Drug] || 0;
        total += price * qty;
        drugs.push(`${qty} ${drug}`);
      }
    });
    setSellAllSummary({ total, drugs });
    setShowSellAllModal(true);
  };

  const confirmSellAll = () => {
    console.log('[DEBUG] confirmSellAll called (TradingScreen)');
    console.trace();
    const result = sellAllDrugs();
    setSellAllSummary({ total: result.totalEarned, drugs: result.drugsSold });
    setShowSellAllModal(false);
    forceUpdate(x => x + 1);
    
    // Check if this is a tutorial sell all
    if (activeTutorial === 'gettingStarted' && stepIndex === 11) {
      const step = tutorialSteps[activeTutorial][stepIndex];
      if (step && step.id === 'sell-weed-instruction') {
        console.log('Tutorial: Weed sold, advancing to congratulations');
        nextStep();
      }
    }
    
    // Optionally, show a toast or summary here
  };

  useEffect(() => {
    if (showSellAllModal) {
      console.log('[DEBUG] Sell All Modal rendered');
    }
  }, [showSellAllModal]);

  return (
    <div className="trading-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>💼 Trading - {currentCity}</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Cash: <span style={{ color: '#ffcc00' }}>${cash.toLocaleString()}</span></div>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <div style={{
          background: '#222',
          borderRadius: '10px',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '0',
            background: '#444',
            padding: '10px',
            fontWeight: 'bold',
          }}>
            <div>Drug</div>
            <div>Price</div>
            <div>Have</div>
            <div>Supply</div>
          </div>
          {Object.entries(prices).map(([drug, price]) => (
            <div 
              key={drug} 
              id={drug === 'Weed' ? 'weed-purchase-section' : `${drug.toLowerCase()}-purchase-section`}
              style={{
                borderBottom: '1px solid #444',
                padding: '16px 10px',
                minHeight: 80,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {/* First line: Drug info */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1fr',
                alignItems: 'center',
                marginBottom: 8,
                gap: 0,
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#66ff66' }}>{drug} <span style={{ color: '#66ff66', fontSize: '11px' }}>({supply[drug as Drug] || 0})</span></div>
                <div style={{ color: '#66ff66', fontSize: '15px' }}>${(price as number).toLocaleString()}</div>
                <div style={{ fontSize: '15px' }}>{inventory[drug as Drug] || 0}</div>
                <div style={{ color: supply[drug as Drug] > 0 ? '#66ff66' : '#ff6666', fontSize: '15px' }}>{supply[drug as Drug] || 0}</div>
              </div>
              {/* Second line: Buy/Sell controls */}
              <div style={{
                display: 'flex',
                flexDirection: 'row',
                gap: 12,
                width: '100%',
                justifyContent: 'space-between',
              }}>
                {/* Buy controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1 }}>
                  <input
                    id={drug === 'Weed' ? 'weed-entry' : `${drug.toLowerCase()}-entry`}
                    type="number"
                    value={buyQuantities[drug as Drug] || ''}
                    onChange={e => handleBuyQuantityChange(drug, e.target.value)}
                    min="0"
                    max={supply[drug as Drug] || 0}
                    className="quantity-input"
                    style={{ width: '60px', fontSize: '15px' }}
                  />
                  <button
                    className="action-btn"
                    onClick={() => handleBuy(drug)}
                    disabled={
                      (buyQuantities[drug as Drug] || 0) <= 0 ||
                      (supply[drug as Drug] || 0) < (buyQuantities[drug as Drug] || 0) ||
                      ((buyQuantities[drug as Drug] || 0) * (price as number)) > cash
                    }
                    style={{ fontSize: '13px', padding: '6px 14px' }}
                    title={
                      (buyQuantities[drug as Drug] || 0) > (supply[drug as Drug] || 0)
                        ? 'Not enough supply'
                        : ((buyQuantities[drug as Drug] || 0) * (price as number)) > cash
                        ? 'Not enough cash'
                        : ''
                    }
                  >
                    Buy
                  </button>
                </div>
                {/* Buy calculator */}
                {buyQuantities[drug as Drug] > 0 && (
                  <div style={{ fontSize: '12px', color: '#66ff66', marginLeft: 4, flex: 1 }}>
                    Total: ${(buyQuantities[drug as Drug] * (price as number)).toLocaleString()}
                  </div>
                )}
                {/* Sell controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 1, justifyContent: 'flex-end' }}>
                  <input
                    type="number"
                    value={sellQuantities[drug as Drug] || ''}
                    onChange={e => handleSellQuantityChange(drug, e.target.value)}
                    min="0"
                    max={inventory[drug as Drug] || 0}
                    className="quantity-input"
                    style={{ width: '60px', fontSize: '15px' }}
                  />
                  <button
                    className="action-btn"
                    onClick={() => handleSell(drug)}
                    disabled={
                      (sellQuantities[drug as Drug] || 0) <= 0 ||
                      (inventory[drug as Drug] || 0) < (sellQuantities[drug as Drug] || 0)
                    }
                    style={{ fontSize: '13px', padding: '6px 14px', background: '#ff6600' }}
                    title={
                      (sellQuantities[drug as Drug] || 0) > (inventory[drug as Drug] || 0)
                        ? 'Not enough in inventory'
                        : ''
                    }
                  >
                    Sell
                  </button>
                </div>
                {/* Sell calculator */}
                {sellQuantities[drug as Drug] > 0 && (
                  <div style={{ fontSize: '12px', color: '#ff6600', marginLeft: 4, flex: 1, textAlign: 'right' }}>
                    Total: ${(sellQuantities[drug as Drug] * (price as number)).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Buy Confirmation Modal */}
      <Modal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        title={`Confirm Purchase`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Buy <strong>{confirmAmount}</strong> {selectedDrug} for <strong>${((prices[selectedDrug!] || 0) * confirmAmount).toLocaleString()}</strong>?
          </p>
          <button className="action-btn" onClick={confirmBuy}>
            Confirm
          </button>
          <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setShowBuyModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>
      {/* Sell Confirmation Modal */}
      <Modal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        title={`Confirm Sale`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Sell <strong>{confirmAmount}</strong> {selectedDrug} for <strong>${((prices[selectedDrug!] || 0) * confirmAmount).toLocaleString()}</strong>?
          </p>
          <button className="action-btn" onClick={confirmSell}>
            Confirm
          </button>
          <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setShowSellModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>
      {/* Sell All Confirmation Modal */}
      <Modal
        isOpen={showSellAllModal}
        onClose={() => setShowSellAllModal(false)}
        title={`Confirm Sell All`}
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>
            Sell all drugs for <strong>${sellAllSummary.total.toLocaleString()}</strong>?<br/>
            <span style={{ fontSize: '12px', color: '#aaa' }}>{sellAllSummary.drugs.join(', ')}</span>
          </p>
          <button className="action-btn" onClick={() => { console.log('[DEBUG] Sell All modal confirm button clicked'); confirmSellAll(); }}>
            Confirm
          </button>
          <button className="action-btn" style={{ background: '#ff6666' }} onClick={() => setShowSellAllModal(false)}>
            Cancel
          </button>
        </div>
      </Modal>
      {/* Remove custom nav bar, use Navigation component instead */}
      <Navigation currentScreen="trading" onNavigate={onNavigate} onSellAll={handleSellAll} />
    </div>
  );
};

export default TradingScreen; 