import React, { useState } from 'react';
import { useGame } from '../contexts/GameContext.jsx';
// @ts-ignore
import { gameData } from '../game/data/gameData';
import type { Base } from '../game/data/gameData-types';
import { Modal } from '../components/Modal';
import RaidRiskMeter from '../components/RaidRiskMeter';

interface BasesScreenProps {
  onNavigate: (screen: string) => void;
}

// Utility to normalize city keys
function normalizeCityKey(city: string) {
  return city.trim();
}

export default function BasesScreen({ onNavigate }: BasesScreenProps) {
  const { state, updateCash, updateInventory, travelToCity, dispatch, addNotification, getCityRaidActivity } = useGame();
  const currentCity = state.currentCity;
  const cash = state.cash;
  const [selectedBase, setSelectedBase] = useState<string>('');
  const [assignGang, setAssignGang] = useState<number | ''>(1);
  const [showPurchaseModal, setShowPurchaseModal] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showGangRequirementModal, setShowGangRequirementModal] = useState<boolean>(false);
  const [pendingUpgrade, setPendingUpgrade] = useState<{ baseId: string, nextType: string } | null>(null);
  const [drugModalBaseId, setDrugModalBaseId] = useState<string | null>(null);
  // Update drugTransfer state type
  type DrugTransferState = { [drug: string]: number | '' };
  const [drugTransfer, setDrugTransfer] = useState<DrugTransferState>({});
  const [pendingGangAssign, setPendingGangAssign] = useState<{ baseId: string, value: number } | null>(null);
  const [pendingGunsAssign, setPendingGunsAssign] = useState<{ baseId: string, value: number } | null>(null);
  const [assignGuns, setAssignGuns] = useState<number>(1);
  const [showConfirmTransferModal, setShowConfirmTransferModal] = useState<boolean>(false);
  const [pendingTransfer, setPendingTransfer] = useState<{ base: Base, transfers: { [drug: string]: number }, drugs: string[], maxPerDrug: number } | null>(null);
  const [showCollectInfo, setShowCollectInfo] = useState<{ baseId: string, reasons: string[], cooldown: number } | null>(null);
  const [pendingMaxTransfer, setPendingMaxTransfer] = useState<{ drug: string, direction: 'toBase' | 'toPlayer', max: number } | null>(null);
  const [now, setNow] = useState<number>(Date.now());
  const [pendingFastTravelCity, setPendingFastTravelCity] = useState<string | null>(null);
  const [showFastTravelModal, setShowFastTravelModal] = useState(false);
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const isBase = (obj: any): obj is Base => {
    return obj && typeof obj === 'object' && typeof obj.id === 'string' && typeof obj.city === 'string' && (typeof obj.type === 'string' || typeof obj.type === 'number') && typeof obj.level === 'number';
  };

  // --- NEW: Gather all bases grouped by city ---
  const basesByCity: Record<string, Base[]> = React.useMemo(() => {
    const result: Record<string, Base[]> = {};
    Object.entries(state.bases || {}).forEach(([city, baseList]) => {
      const normCity = normalizeCityKey(city);
      let arr: any[] = [];
      if (Array.isArray(baseList)) {
        arr = Array.isArray(baseList[0]) ? baseList.flat() : baseList;
      } else if (baseList) {
        arr = [baseList];
      }
      result[normCity] = arr.filter(isBase) as Base[];
    });
    return result;
  }, [state.bases]);

  // Add index signatures for local objects
  const bases: { [key: string]: Base[] } = React.useMemo(() => {
    const result: { [key: string]: Base[] } = {};
    Object.entries(state.bases || {}).forEach(([city, baseList]) => {
      let arr: any[] = [];
      if (Array.isArray(baseList)) {
        arr = baseList.flat();
      } else if (baseList) {
        arr = [baseList];
      }
      result[normalizeCityKey(city)] = arr.filter(isBase);
    });
    return result;
  }, [state.bases]);
  const gangMembers: { [key: string]: number } = state.gangMembers || {};
  // Calculate available gang in city
  const getAvailableGangMembersInCity = (city: string) => {
    const normCity = normalizeCityKey(city);
    const totalInCity = gangMembers[normCity] || 0;
    let assignedInCity = 0;
    const cityBases = bases[normCity] || [];
    cityBases.forEach((base: Base) => {
      assignedInCity += base.assignedGang || 0;
    });
    return Math.max(0, totalInCity - assignedInCity);
  };
  const availableGang = getAvailableGangMembersInCity(currentCity);
  const cityBases: Base[] = (() => {
    const arr = bases[normalizeCityKey(currentCity)];
    if (!arr) return [];
    // If arr is nested, flatten it
    const flatArr = Array.isArray(arr[0]) ? arr.flat() : arr;
    return flatArr.filter(isBase);
  })();
  console.log('[DEBUG] bases:', bases);
  console.log('[DEBUG] basesByCity:', basesByCity);
  console.log('[DEBUG] cityBases:', cityBases, 'currentCity:', currentCity);
  
  const baseTypes = gameData.baseTypes || {
    small: { name: 'Small Base', cost: 50000, income: 1000, capacity: 10 },
    medium: { name: 'Medium Base', cost: 150000, income: 3000, capacity: 25 },
    large: { name: 'Large Base', cost: 500000, income: 10000, capacity: 50 }
  };
  
  const calculateBaseCost = (type: string) => {
    const baseType = baseTypes[type];
    if (!baseType) return 0;
    const cityData = gameData.cities[currentCity];
    const cityModifier = cityData?.heatModifier || 1.0;
    return Math.floor(baseType.cost * cityModifier);
  };
  
  const calculateUpgradeCost = (base: any, newType: string) => {
    const currentType = base.type;
    const currentCost = calculateBaseCost(currentType);
    const newCost = calculateBaseCost(newType);
    return Math.floor((newCost - currentCost) * 0.8); // 20% discount for upgrade
  };
  
  const handlePurchaseBase = (type: number) => {
    const cost = calculateBaseCost(String(type));
    if (cost > cash) {
      alert(`Not enough cash. Need $${cost.toLocaleString()}`);
      return;
    }
    const normCity = normalizeCityKey(currentCity);
    if ((state.bases && state.bases[normCity] && state.bases[normCity].length > 0)) {
      alert('You already own a base in this city!');
      return;
    }
    const typeNum = type;
    console.log('baseTypes:', baseTypes);
    console.log('baseTypes[typeNum]:', baseTypes[typeNum]);
    console.log('gameData.drugs:', gameData.drugs);
    const newBase: Base = {
      id: Date.now().toString(),
      city: normCity,
      type: typeNum.toString(), // store as string
      level: 1,
      assignedGang: 0,
      drugStorage: 0,
      operational: false,
      cashStored: 0,
      lastCollection: Date.now(),
      lastCollected: Date.now(),
      guns: 0,
      income: baseTypes[typeNum].income,
      capacity: baseTypes[typeNum].capacity,
      inventory: Object.fromEntries(Object.keys(gameData.drugs).map(drug => [drug, 0]))
    };
    console.log('newBase:', newBase);
    // Use the raw state.bases, not the filtered local bases object
    const updatedBases = { ...(state.bases || {}) };
    if (!updatedBases[normCity]) {
      updatedBases[normCity] = [];
    }
    updatedBases[normCity] = [...updatedBases[normCity], newBase];
    console.log('About to dispatch UPDATE_BASES with:', updatedBases[normCity]);
    updateCash(-cost);
    dispatch({ type: 'UPDATE_BASES', bases: updatedBases });
    console.log('[DEBUG] After purchase, updatedBases:', updatedBases, 'currentCity:', normCity);
    setShowPurchaseModal(false);
  };
  
  const handleUpgradeBase = (baseId: string, newType: string) => {
    let modalCity = currentCity;
    let modalBase: Base | undefined = undefined;
    for (const [city, basesList] of Object.entries(bases)) {
      const arr = basesList;
      const found = arr.find((b: Base) => b.id === baseId);
      if (found) {
        modalCity = city;
        modalBase = found;
        break;
      }
    }
    if (!modalBase) return;
    const cityBasesArr = bases[modalCity];
    const base = cityBasesArr.find((b: Base) => b.id === baseId);
    if (!base) return;
    const upgradeCost = calculateUpgradeCost(base, String(newType));
    if (upgradeCost > cash) {
      alert(`Not enough cash. Need $${upgradeCost.toLocaleString()}`);
      return;
    }
    const updatedBases = { ...bases };
    updatedBases[modalCity] = cityBasesArr.map((b: Base) =>
      b.id === baseId
        ? { ...b, type: newType, income: baseTypes[newType].income, capacity: baseTypes[newType].capacity }
        : b
    );
    updateCash(-upgradeCost);
    dispatch({ type: 'UPDATE_BASES', bases: updatedBases });
    setShowUpgradeModal(false);
  };
  
  const handleAssignGang = (baseId: string) => {
    const allBases: Base[] = Object.values(bases).flatMap((b: Base | Base[]) => b);
    const modalBase = allBases.find((b: Base) => b.id === baseId);
    let modalCity = currentCity;
    for (const [city, basesList] of Object.entries(bases)) {
      const arr: Base[] = basesList;
      if (arr.some((b: Base) => b.id === baseId)) {
        modalCity = city;
        break;
      }
    }
    const cityBasesArr: Base[] = bases[modalCity];
    const base: Base | undefined = cityBasesArr.find((b: Base) => b.id === baseId);
    if (!base) return;
    const limits = getGangLimits(base.level);
    let value = typeof assignGang === 'number' ? assignGang : limits.min;
    value = Math.max(limits.min, Math.min(limits.max, value));
    setPendingGangAssign({ baseId, value });
  };

  const confirmAssignGang = () => {
    if (!pendingGangAssign) return;
    const { baseId, value } = pendingGangAssign;
    const allBases: Base[] = Object.values(bases).flatMap((b: Base | Base[]) => b);
    const modalBase = allBases.find((b: Base) => b.id === baseId);
    let modalCity = currentCity;
    for (const [city, basesList] of Object.entries(bases)) {
      const arr: Base[] = basesList;
      if (arr.some((b: Base) => b.id === baseId)) {
        modalCity = city;
        break;
      }
    }
    const cityBasesArr: Base[] = bases[modalCity];
    const updatedBases = { ...bases };
    updatedBases[modalCity] = cityBasesArr.map((b: Base) =>
      b.id === baseId ? { ...b, assignedGang: value } : b
    );
    dispatch({ type: 'UPDATE_BASES', bases: updatedBases });
    setAssignGang(getGangLimits(cityBasesArr.find((b: Base) => b.id === baseId)?.level || 1).min);
    setPendingGangAssign(null);
  };
  const cancelAssignGang = () => setPendingGangAssign(null);

  const handleAssignGuns = (baseId: string) => {
    const allBases: Base[] = Object.values(bases).flatMap((b: Base | Base[]) => b);
    const modalBase = allBases.find((b: Base) => b.id === baseId);
    let modalCity = currentCity;
    for (const [city, basesList] of Object.entries(bases)) {
      const arr: Base[] = basesList;
      if (arr.some((b: Base) => b.id === baseId)) {
        modalCity = city;
        break;
      }
    }
    const cityBasesArr: Base[] = bases[modalCity];
    const base: Base | undefined = cityBasesArr.find((b: Base) => b.id === baseId);
    if (!base) return;
    const limits = getGunLimits(base.level);
    const value = Math.max(limits.min, Math.min(limits.max, assignGuns));
    setPendingGunsAssign({ baseId, value });
  };

  const confirmAssignGuns = () => {
    if (!pendingGunsAssign) return;
    const { baseId, value } = pendingGunsAssign;
    const allBases: Base[] = Object.values(bases).flatMap((b: Base | Base[]) => b);
    const modalBase = allBases.find((b: Base) => b.id === baseId);
    let modalCity = currentCity;
    for (const [city, basesList] of Object.entries(bases)) {
      const arr: Base[] = basesList;
      if (arr.some((b: Base) => b.id === baseId)) {
        modalCity = city;
        break;
      }
    }
    const cityBasesArr: Base[] = bases[modalCity];
    const base: Base | undefined = cityBasesArr.find((b: Base) => b.id === baseId);
    if (!base) return;
    const prevAssigned = base.guns || 0;
    const diff = value - prevAssigned;
    const updatedBases = { ...bases };
    updatedBases[modalCity] = cityBasesArr.map((b: Base) =>
      b.id === baseId ? { ...b, guns: value } : b
    );
    const updatedGunsByCity = { ...(state.gunsByCity || {}) };
    const prevGuns = updatedGunsByCity[modalCity] !== undefined ? updatedGunsByCity[modalCity] : (state.guns || 0);
    updatedGunsByCity[modalCity] = Math.max(0, prevGuns - diff);
    dispatch({ type: 'UPDATE_BASES', bases: updatedBases });
    dispatch({ type: 'UPDATE_GUNS_BY_CITY', city: modalCity, amount: updatedGunsByCity[modalCity] });
    setAssignGuns(getGunLimits(base.level).min);
    setPendingGunsAssign(null);
  };
  const cancelAssignGuns = () => setPendingGunsAssign(null);
  
  const handleCollectIncome = (baseId: string) => {
    const allBases: Base[] = Object.values(bases).flatMap((b: Base | Base[]) => b);
    const modalBase = allBases.find((b: Base) => b.id === baseId);
    let modalCity = currentCity;
    for (const [city, basesList] of Object.entries(bases)) {
      const arr: Base[] = basesList;
      if (arr.some((b: Base) => b.id === baseId)) {
        modalCity = city;
        break;
      }
    }
    const cityBasesArr: Base[] = bases[modalCity];
    const base: Base | undefined = cityBasesArr.find((b: Base) => b.id === baseId);
    if (!base) return;
    const now = Date.now();
    const timeSinceLastCollect = now - (base.lastCollected || now);
    const hoursSinceLastCollect = timeSinceLastCollect / (1000 * 60 * 60);
    if (hoursSinceLastCollect < 1) {
      alert('Income can only be collected once per hour');
      return;
    }
    const income = base.income * (base.assignedGang || 0);
    updateCash(income);
    addNotification(`💰 Collected $${income.toLocaleString()} from your base in ${modalCity}.`, 'success');
    const updatedBases = { ...bases };
    updatedBases[modalCity] = cityBasesArr.map((b: Base) =>
      b.id === baseId ? { ...b, lastCollected: now } : b
    );
    dispatch({ type: 'UPDATE_BASES', bases: updatedBases });
  };
  
  // Calculate total income from all bases in all cities
  const totalIncome = Object.values(basesByCity).flat().reduce((sum: number, base: Base) => {
    return sum + (base.income * (base.assignedGang || 0));
  }, 0);
  
  // Gang/gun assignment limits per base level
  const getGangLimits = (level: number) => {
    if (level === 1) return { min: 4, max: 6 };
    if (level === 2) return { min: 6, max: 8 };
    if (level === 3) return { min: 8, max: 10 };
    return { min: 4, max: 6 };
  };
  const getGunLimits = (level: number) => {
    if (level === 1) return { min: 2, max: 4 };
    if (level === 2) return { min: 4, max: 6 };
    if (level === 3) return { min: 6, max: 8 };
    return { min: 2, max: 4 };
  };
  
  // For live cooldown timer updates
  React.useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Travel cost calculation (copied from TravelScreen)
  const calculateTravelCost = (destination: string) => {
    const currentDistance = gameData.cities[currentCity].distanceIndex;
    const destDistance = gameData.cities[destination].distanceIndex;
    const distance = Math.abs(currentDistance - destDistance);
    const cost = gameData.config.baseTravelCost + (distance * 100);
    return Math.min(cost, gameData.config.maxTravelCost);
  };
  
  return (
    <div className="bases-screen">
      <div className="screen-header">
        <button className="back-button" onClick={() => onNavigate('home')}>
          ← Back
        </button>
        <h3>🏢 Base Management</h3>
        <div style={{ fontSize: '12px', color: '#aaa' }}>Control Your Empire</div>
      </div>
      
      {/* Overview */}
      <div style={{
        background: '#333',
        border: '1px solid #666',
        borderRadius: '10px',
        padding: '15px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', textAlign: 'center' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              🏢 Bases
            </div>
            <div style={{ fontSize: '18px', color: '#ffff00', fontWeight: 'bold' }}>
              {Object.values(basesByCity).reduce((sum, cityBases) => sum + cityBases.length, 0)}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
              💰 Available Income
            </div>
            <div style={{ fontSize: '18px', color: '#66ff66', fontWeight: 'bold' }}>
              ${totalIncome.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
      
      {/* Purchase New Base - Only show if no base in current city */}
      {cityBases.length === 0 && (
        <div className="market-item">
          <div className="market-header">
            <div className="drug-name">🏢 Purchase New Base</div>
            <div className="drug-price">${calculateBaseCost('small').toLocaleString()}</div>
          </div>
          <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '15px' }}>
            Bases generate income and provide storage. Assign gang members to increase income.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
            {Object.entries(baseTypes).map(([type, baseType]: [string, any]) => {
              const typeNum = Number(type);
              const cost = calculateBaseCost(type);
              return (
                <button
                  key={typeNum}
                  className="action-btn"
                  onClick={() => {
                    if (availableGang < 4) {
                      setShowGangRequirementModal(true);
                    } else {
                      setSelectedBase(typeNum.toString());
                      setShowPurchaseModal(true);
                    }
                  }}
                  disabled={cost > cash}
                  style={{
                    background: cost > cash ? '#444' : '#333',
                    color: cost > cash ? '#666' : '#fff',
                    padding: '15px',
                    textAlign: 'center'
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                    {baseType.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '5px' }}>
                    ${cost.toLocaleString()}
                  </div>
                  {/* Removed $/hr and capacity lines */}
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Existing Bases */}
      {[currentCity, ...Object.keys(basesByCity).filter(city => city !== currentCity)].map(city => {
        // basesByCity[city] is always Base[] now
        return (basesByCity[city] || []).map((base, index) => {
          // Always use string for base.type as key
          const baseType = baseTypes[String(base.type)];
          const timeSinceLastCollect = (now - (base.lastCollected || now)) / (1000 * 60 * 60);
          const requiredGang = baseType?.gangRequired || 4;
          const requiredGuns = baseType?.gunsRequired || 2;
          const hasEnoughGang = (base.assignedGang || 0) >= requiredGang;
          const hasEnoughGuns = (base.guns || 0) >= requiredGuns;
          const drugsInBase = base.inventory ? Object.values(base.inventory).reduce((sum, qty) => sum + qty, 0) : 0;
          const hasDrugs = drugsInBase > 0;
          const isOperating = hasEnoughGang && hasEnoughGuns && hasDrugs;
          const availableIncome = isOperating
            ? base.income * (base.assignedGang || 0) * Math.min(timeSinceLastCollect, 24)
            : 0;
          return (
            <div key={base.id} style={{
              background: '#222',
              border: '1px solid #444',
              borderRadius: '10px',
              padding: '15px',
              marginBottom: '15px',
              // Remove opacity dimming for fast travel button
              opacity: 1
            }}>
              {/* Move header inside the box */}
              <div style={{ fontSize: '14px', color: '#ffff00', marginBottom: '10px', textAlign: 'center' }}>
                🏢 Your Bases in {city}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#ffff00' }}>
                    {baseType?.name || base.type} (Level {base.level})
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa' }}>
                    Base #{index + 1} in {city}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '13px', color: '#66ff66', fontWeight: 'bold' }}>
                    ${availableIncome.toLocaleString()} available
                  </div>
                  <div style={{ fontSize: '12px', color: isOperating ? '#66ff66' : '#ff6666', fontWeight: 'bold' }}>
                    {isOperating ? 'Operating' : 'Not Operating'}
                  </div>
                  {/* Move Collect button here, under available income */}
                  {currentCity === city && (
                    <button
                      className="action-btn"
                      style={{ background: '#ffaa00', color: '#222', fontSize: '13px', padding: '8px 16px', marginTop: 8, fontWeight: 'bold', width: '100%' }}
                      onClick={() => handleCollectIncome(base.id)}
                      disabled={((now - (base.lastCollected || now)) / (1000 * 60 * 60)) < 1}
                    >
                      Collect
                    </button>
                  )}
                  {currentCity !== city && (
                    <button
                      className="action-btn"
                      style={{ background: '#ff9900', color: '#fff', fontSize: 14, padding: '8px 18px', marginTop: 8, fontWeight: 'bold', boxShadow: '0 2px 8px rgba(255,140,0,0.25)', border: 'none', cursor: 'pointer', opacity: 1 }}
                      onClick={() => {
                        setPendingFastTravelCity(city);
                        setShowFastTravelModal(true);
                      }}
                    >
                      Fast Travel
                      {` ($${calculateTravelCost(city).toLocaleString()})`}
                    </button>
                  )}
                </div>
              </div>
              {/* Only show management controls if in this city */}
              {currentCity === city && (
                <div style={{ marginTop: 10 }}>
                  {/* Assigned Section at the top left */}
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: 2 }}>Assigned</div>
                    <div style={{ fontSize: '11px', color: '#ffff00' }}>
                      Gang: {base.assignedGang || 0} / {getGangLimits(base.level).max}
                    </div>
                    <div style={{ fontSize: '11px', color: '#ffff00' }}>
                      Guns: {base.guns || 0} / {getGunLimits(base.level).max}
                    </div>
                  </div>
                  {/* Gang Assignment - input and button side by side */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
                    <div style={{ fontSize: '11px', color: '#aaa', minWidth: 70 }}>Assign Gang</div>
                    <input
                      type="number"
                      value={assignGang === '' ? '' : assignGang}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === '') {
                          setAssignGang('');
                        } else {
                          const num = parseInt(val, 10);
                          if (!isNaN(num)) setAssignGang(num);
                        }
                      }}
                      min={getGangLimits(base.level).min}
                      max={Math.min(getGangLimits(base.level).max, availableGang + (base.assignedGang || 0))}
                      className="quantity-input"
                      placeholder="Gang to assign"
                      style={{ width: 60 }}
                    />
                    <button
                      className="action-btn"
                      onClick={() => handleAssignGang(base.id)}
                      disabled={
                        typeof assignGang !== 'number' ||
                        assignGang < getGangLimits(base.level).min ||
                        assignGang > getGangLimits(base.level).max ||
                        assignGang > availableGang + (base.assignedGang || 0)
                      }
                      style={{ fontSize: '12px', padding: '8px 12px' }}
                    >
                      Assign
                    </button>
                  </div>
                  {/* Gun Assignment - input and button side by side */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 8 }}>
                    <div style={{ fontSize: '11px', color: '#aaa', minWidth: 70 }}>Assign Guns</div>
                    <input
                      type="number"
                      value={assignGuns}
                      onChange={(e) => setAssignGuns(Math.max(getGunLimits(base.level).min, Math.min(getGunLimits(base.level).max, parseInt(e.target.value) || getGunLimits(base.level).min)))}
                      min={getGunLimits(base.level).min}
                      max={getGunLimits(base.level).max}
                      className="quantity-input"
                      placeholder="Guns to assign"
                      style={{ width: 60 }}
                    />
                    <button
                      className="action-btn"
                      onClick={() => handleAssignGuns(base.id)}
                      disabled={assignGuns < getGunLimits(base.level).min || assignGuns > getGunLimits(base.level).max}
                      style={{ fontSize: '12px', padding: '8px 12px' }}
                    >
                      Assign
                    </button>
                  </div>
                  {/* Drug Inventory and Upgrade Buttons Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 8 }}>
                    <button
                      className="action-btn"
                      onClick={() => {
                        setDrugModalBaseId(base.id);
                        setDrugTransfer({});
                      }}
                      style={{ fontSize: '12px', padding: '8px 12px', background: '#22bb33', color: '#fff', flex: 1 }}
                    >
                      Manage Drug Inventory
                    </button>
                    {(() => {
                      const typeOrder = Object.keys(baseTypes);
                      const currentTypeIndex = typeOrder.indexOf(base.type);
                      const nextType = typeOrder[currentTypeIndex + 1];
                      if (!nextType) {
                        return (
                          <button className="action-btn" disabled style={{ fontSize: '10px', padding: '5px 8px', background: '#444', color: '#666', flex: 1 }}>
                            Max Level
                          </button>
                        );
                      }
                      const upgradeCost = calculateUpgradeCost(base, nextType);
                      return (
                        <button
                          className="action-btn"
                          onClick={() => setPendingUpgrade({ baseId: base.id, nextType })}
                          disabled={upgradeCost > cash}
                          style={{
                            background: '#ff9900',
                            color: '#fff',
                            fontSize: '10px',
                            padding: '5px 8px',
                            flex: 1
                          }}
                        >
                          Upgrade to {baseTypes[nextType].name} (${upgradeCost.toLocaleString()})
                        </button>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          );
        });
      })}
      
      {/* Purchase Modal */}
      {showPurchaseModal && baseTypes[Number(selectedBase)] && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">🏢 Purchase Base</span>
              <button className="modal-close" onClick={() => setShowPurchaseModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px' }}>
                <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>
                    {baseTypes[Number(selectedBase)].name}
                  </div>
                  <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '15px' }}>
                    {baseTypes[Number(selectedBase)].description || 'A base for your operations'}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px' }}>
                    <div>Cost: <span style={{ color: '#ffff00' }}>${calculateBaseCost(selectedBase).toLocaleString()}</span></div>
                    <div>Location: <span style={{ color: '#ffff00' }}>{currentCity}</span></div>
                  </div>
                </div>
                <button
                  onClick={() => handlePurchaseBase(Number(selectedBase))}
                  className="action-btn"
                  style={{ width: '100%' }}
                  disabled={calculateBaseCost(selectedBase) > cash}
                >
                  Purchase for ${calculateBaseCost(selectedBase).toLocaleString()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Not Enough Gang Members Modal */}
      {showGangRequirementModal && (
        <div className="modal-overlay" onClick={() => setShowGangRequirementModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">👥 Not Enough Gang Members</span>
              <button className="modal-close" onClick={() => setShowGangRequirementModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ padding: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                  You need at least <strong>4 gang members</strong> in this city to purchase a base.
                </div>
                <button className="action-btn" onClick={() => setShowGangRequirementModal(false)} style={{ width: '100%' }}>
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Confirmation Modal */}
      {pendingUpgrade && (() => {
        const allBases: Base[] = Object.values(bases).flatMap(b => Array.isArray(b) ? b : [b]);
        const modalBase = allBases.find((b: Base) => b.id === pendingUpgrade.baseId);
        let modalCity = currentCity;
        for (const [city, basesList] of Object.entries(bases)) {
          const arr = Array.isArray(basesList) ? basesList : [basesList];
          if (arr.some((b: Base) => b.id === pendingUpgrade.baseId)) {
            modalCity = city;
            break;
          }
        }
        const cityBasesArr: Base[] = Array.isArray(bases[modalCity]) ? bases[modalCity] : [bases[modalCity]];
        const base = cityBasesArr.find((b: Base) => b.id === pendingUpgrade.baseId);
        if (!base) return null;
        const nextType = pendingUpgrade.nextType;
        const upgradeCost = calculateUpgradeCost(base, nextType);
        return (
          <div className="modal-overlay" onClick={() => setPendingUpgrade(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Confirm Upgrade</span>
                <button className="modal-close" onClick={() => setPendingUpgrade(null)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                    Upgrade to <strong>{baseTypes[Number(nextType)].name}</strong>?
                  </div>
                  <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                    Cost: <span style={{ color: '#ffff00' }}>${upgradeCost.toLocaleString()}</span>
                  </div>
                  <button
                    className="action-btn"
                    onClick={() => {
                      handleUpgradeBase(base.id, nextType);
                      setPendingUpgrade(null);
                    }}
                    style={{ width: '100%', marginBottom: 10 }}
                    disabled={upgradeCost > cash}
                  >
                    Confirm
                  </button>
                  <button
                    className="action-btn"
                    style={{ background: '#ff6666', width: '100%' }}
                    onClick={() => setPendingUpgrade(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Drug Inventory Modal */}
      {drugModalBaseId && (() => {
        const allBases: Base[] = Object.values(bases).flatMap(b => b);
        const modalBase = allBases.find((b: Base) => b.id === drugModalBaseId);
        let modalCity = currentCity;
        for (const [city, basesList] of Object.entries(bases)) {
          const arr = basesList;
          if (arr.some((b: Base) => b.id === drugModalBaseId)) {
            modalCity = city;
            break;
          }
        }
        const cityBasesArr: Base[] = bases[modalCity];
        const base = cityBasesArr.find((b: Base) => b.id === drugModalBaseId);
        if (!base) return null;
        // In confirm max transfer modal
        const baseType = baseTypes[String(base.type)];
        const numDrugs = Object.keys(gameData.drugs).length;
        const maxPerDrug = Math.floor((baseType.maxInventory || 60) / numDrugs);
        const drugs = Object.keys(gameData.drugs);
        return (
          <div className="modal-overlay" onClick={() => setDrugModalBaseId(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Manage Drug Inventory</span>
                <button className="modal-close" onClick={() => setDrugModalBaseId(null)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '20px' }}>
                  <table style={{ width: '100%', fontSize: 13, marginBottom: 16 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Drug</th>
                        <th>In Base</th>
                        <th>Available</th>
                        <th>Transfer</th>
                      </tr>
                    </thead>
                    <tbody>
                      {drugs.map(drug => {
                        const d = drug;
                        const inBase = base.inventory?.[d] || 0;
                        const available = state.inventory[d] || 0;
                        const transfer = drugTransfer[d] ?? 0;
                        const maxToBase = Math.min(available, maxPerDrug - inBase);
                        const maxToPlayer = inBase;
                        return (
                          <tr key={d}>
                            <td>{d}</td>
                            <td style={{ textAlign: 'center' }}>{inBase}</td>
                            <td style={{ textAlign: 'center' }}>{Number(available).toFixed(2)}</td>
                            <td style={{ textAlign: 'center', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <input
                                type="number"
                                value={transfer === '' ? '' : String(transfer ?? '')}
                                min={-inBase}
                                max={maxToBase}
                                onChange={e => {
                                  const val = e.target.value;
                                  setDrugTransfer(prev => ({ ...prev, [d]: val === '' ? '' : parseInt(val, 10) }));
                                }}
                                style={{ width: 60 }}
                              />
                              {/* Max to Base */}
                              <button
                                className="action-btn"
                                style={{ fontSize: '11px', padding: '2px 8px' }}
                                onClick={() => setDrugTransfer(prev => ({ ...prev, [d]: maxToBase }))}
                                disabled={maxToBase <= 0}
                              >
                                Max
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  <button
                    className="action-btn"
                    style={{ width: '100%', marginBottom: 10 }}
                    onClick={() => {
                      // Prepare transfer summary for confirmation
                      const transferSummary = drugs.filter(drug => (drugTransfer[drug] ?? 0) !== 0);
                      setPendingTransfer({ base, transfers: { ...drugTransfer }, drugs: transferSummary, maxPerDrug });
                      setShowConfirmTransferModal(true);
                    }}
                  >
                    Confirm Transfers
                  </button>
                  <button
                    className="action-btn"
                    style={{ background: '#ff6666', width: '100%' }}
                    onClick={() => setDrugModalBaseId(null)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirm Assign Gang Modal */}
      {pendingGangAssign && (
        <div className="modal-overlay" onClick={cancelAssignGang}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Gang Assignment</span>
              <button className="modal-close" onClick={cancelAssignGang}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>
                  Assign <strong>{pendingGangAssign.value}</strong> gang member(s) to this base?
                </p>
                <button className="action-btn" onClick={confirmAssignGang}>Confirm</button>
                <button className="action-btn" style={{ background: '#ff6666' }} onClick={cancelAssignGang}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Assign Guns Modal */}
      {pendingGunsAssign && (
        <div className="modal-overlay" onClick={cancelAssignGuns}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Confirm Gun Assignment</span>
              <button className="modal-close" onClick={cancelAssignGuns}>×</button>
            </div>
            <div className="modal-body">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>
                  Assign <strong>{pendingGunsAssign.value}</strong> gun(s) to this base?
                </p>
                <button className="action-btn" onClick={confirmAssignGuns}>Confirm</button>
                <button className="action-btn" style={{ background: '#ff6666' }} onClick={cancelAssignGuns}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirmTransferModal && pendingTransfer && (() => {
        const baseId = pendingTransfer.base.id;
        const allBases: Base[] = Object.values(bases).flatMap((b: Base | Base[]) => b);
        const modalBase = allBases.find((b: Base) => b.id === baseId);
        let modalCity = currentCity;
        for (const [city, basesList] of Object.entries(bases)) {
          const arr: Base[] = basesList;
          if (arr.some((b: Base) => b.id === baseId)) {
            modalCity = city;
            break;
          }
        }
        const cityBasesArr: Base[] = bases[modalCity];
        return (
          <div className="modal-overlay" onClick={() => setShowConfirmTransferModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Confirm Drug Transfer</span>
                <button className="modal-close" onClick={() => setShowConfirmTransferModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', marginBottom: '10px' }}>
                    Are you sure you want to transfer the following drugs?
                  </div>
                  <ul style={{ textAlign: 'left', marginBottom: 16 }}>
                    {pendingTransfer.drugs.length === 0 ? (
                      <li>No drugs selected for transfer.</li>
                    ) : (
                      pendingTransfer.drugs.map(drug => (
                        <li key={drug}>
                          <strong>{drug}:</strong> {pendingTransfer.transfers[drug] > 0 ? `To Base (+${pendingTransfer.transfers[drug]})` : `To Player (${pendingTransfer.transfers[drug]})`}
                        </li>
                      ))
                    )}
                  </ul>
                  <button
                    className="action-btn"
                    style={{ width: '100%', marginBottom: 10 }}
                    onClick={() => {
                      // Apply transfers (copied from original Confirm Transfers logic)
                      const { base, transfers, maxPerDrug } = pendingTransfer;
                      const drugs = Object.keys(transfers);
                      const updatedBases = { ...bases };
                      updatedBases[currentCity] = cityBasesArr.map((b: Base) => {
                        if (b.id !== base.id) return b;
                        const newInventory = { ...b.inventory };
                        drugs.forEach(drug => {
                          const transfer = transfers[drug] ?? 0;
                          if (transfer > 0) {
                            // Move from player to base
                            const moveToBase = Math.min(transfer, state.inventory[drug], maxPerDrug - (b.inventory?.[drug] || 0));
                            newInventory[drug] = (newInventory[drug] || 0) + moveToBase;
                          } else if (transfer < 0) {
                            // Move from base to player
                            const moveToPlayer = Math.min(-transfer, b.inventory?.[drug] || 0);
                            newInventory[drug] = (newInventory[drug] || 0) - moveToPlayer;
                          }
                        });
                        return { ...b, inventory: newInventory };
                      });
                      // Update player inventory
                      const newPlayerInventory = { ...state.inventory };
                      drugs.forEach(drug => {
                        const transfer = transfers[drug] ?? 0;
                        if (transfer > 0) {
                          const moveToBase = Math.min(transfer, state.inventory[drug], maxPerDrug - (base.inventory?.[drug] || 0));
                          newPlayerInventory[drug] = (newPlayerInventory[drug] || 0) - moveToBase;
                        } else if (transfer < 0) {
                          const moveToPlayer = Math.min(-transfer, base.inventory?.[drug] || 0);
                          newPlayerInventory[drug] = (newPlayerInventory[drug] || 0) + moveToPlayer;
                        }
                      });
                      dispatch({ type: 'UPDATE_BASES', bases: updatedBases });
                      dispatch({ type: 'UPDATE_INVENTORY', drug: '__bulk', amount: 0, newInventory: newPlayerInventory });
                      setDrugModalBaseId(null);
                      setShowConfirmTransferModal(false);
                      setPendingTransfer(null);
                      setDrugTransfer({});
                    }}
                    disabled={pendingTransfer.drugs.length === 0}
                  >
                    Confirm
                  </button>
                  <button
                    className="action-btn"
                    style={{ background: '#ff6666', width: '100%' }}
                    onClick={() => setShowConfirmTransferModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Collect Info Modal */}
      {showCollectInfo && (() => {
        const { reasons, cooldown } = showCollectInfo;
        let cooldownText = '';
        if (cooldown > 0) {
          const minutes = Math.floor(cooldown * 60);
          const seconds = Math.floor((cooldown * 60 - minutes) * 60);
          cooldownText = `Time remaining: ${minutes}m ${seconds}s`;
        }
        return (
          <div className="modal-overlay" onClick={() => setShowCollectInfo(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span className="modal-title">Cannot Collect Income</span>
                <button className="modal-close" onClick={() => setShowCollectInfo(null)}>×</button>
              </div>
              <div className="modal-body">
                <div style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', marginBottom: '10px', color: '#ff6666' }}>
                    You cannot collect income from this base right now.
                  </div>
                  <ul style={{ color: '#ff6666', fontSize: '13px', marginBottom: 10, textAlign: 'left' }}>
                    {reasons.map(r => <li key={r}>{r}</li>)}
                  </ul>
                  {cooldownText && <div style={{ color: '#ffaa00', fontSize: '13px', marginBottom: 10 }}>{cooldownText}</div>}
                  <button className="action-btn" style={{ width: '100%' }} onClick={() => setShowCollectInfo(null)}>
                    OK
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {/* Fast Travel Confirmation Modal */}
      <Modal
        isOpen={showFastTravelModal}
        onClose={() => {
          setShowFastTravelModal(false);
          setPendingFastTravelCity(null);
        }}
        title="Fast Travel Confirmation"
      >
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', marginBottom: 10 }}>
            Fast travel to <strong>{pendingFastTravelCity}</strong>?
          </div>
          <div style={{ fontSize: '15px', marginBottom: 10 }}>
            Cost: <span style={{ color: '#ffaa00' }}>
              ${pendingFastTravelCity ? calculateTravelCost(pendingFastTravelCity).toLocaleString() : 0}
            </span>
          </div>
          <div style={{ marginTop: '20px' }}>
            <button
              className="action-btn"
              style={{ background: '#ff8800', color: '#fff', marginRight: 10 }}
              onClick={() => {
                if (pendingFastTravelCity) {
                  const cost = calculateTravelCost(pendingFastTravelCity);
                  if (cash >= cost) {
                    updateCash(-cost);
                    travelToCity(pendingFastTravelCity);
                    setTimeout(() => window.scrollTo(0, 0), 100);
                  } else {
                    addNotification('Not enough cash for fast travel.', 'error');
                  }
                }
                setShowFastTravelModal(false);
                setPendingFastTravelCity(null);
              }}
            >
              Confirm
            </button>
            <button
              className="action-btn"
              style={{ background: '#ff6666' }}
              onClick={() => {
                setShowFastTravelModal(false);
                setPendingFastTravelCity(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 