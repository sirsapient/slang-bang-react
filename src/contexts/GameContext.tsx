import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import { gameState } from '../game/gameState'; // No longer used for state
// @ts-ignore
import { gameData } from '../game/data/gameData';

// --- Types ---
interface GameState {
  playerName: string;
  cash: number;
  gangSize: number;
  warrant: number;
  day: number;
  guns: number;
  currentCity: string;
  daysInCurrentCity: number;
  daysSinceTravel: number;
  lastTravelDay: number;
  currentScreen: string;
  heatLevel: number;
  inventory: Record<string, number>;
  bases: Record<string, any>;
  gangMembers: Record<string, number>;
  gunsByCity: Record<string, number>;
  citySupply: Record<string, any>;
  cityPrices: Record<string, any>;
  lastPurchase: Record<string, any>;
  saveVersion: string;
  lastSaved: number;
  notifications: any[];
  achievements: {
    unlocked: string[];
    progress: Record<string, number>;
  };
  assets: {
    owned: Record<string, any[]>; // assetId -> array of asset instances
    wearing: { jewelry: string[] }; // instanceIds of worn jewelry
  };
  // Add more fields as needed
}

interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<any>;
  buyDrug: (drug: string, amount: number, price: number) => void;
  sellDrug: (drug: string, amount: number, price: number) => void;
  updateCash: (amount: number) => void;
  updateInventory: (drug: string, amount: number) => void;
  travelToCity: (city: string) => void;
  regeneratePrices: () => void;
  resetGame: () => void;
  sellAllDrugs: () => { totalEarned: number; drugsSold: string[] };
  buyAsset: (assetId: string) => { success: boolean; error?: string };
  sellAsset: (instanceId: string) => { success: boolean; error?: string };
  wearJewelry: (instanceId: string) => { success: boolean };
  removeJewelry: (instanceId: string) => { success: boolean };
  getOwnedAssets: (type: string) => Record<string, any[]>;
  getAllOwnedInstances: () => any[];
  getWornJewelry: () => string[];
  getAssetSummary: () => { totalValue: number; flexScore: number };
  getNotifications: () => any[];
  getUnreadNotifications: () => any[];
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (message: string, nType?: string) => void;
  getAvailableGangMembers: () => number;
  getAvailableGangMembersInCity: (city: string) => number;
  getAvailableGunsInCity: (city: string) => number;
  getAvailableRaidTargets: (city: string) => any[];
  executeRaid: (targetId: string, raidGangSize: number, city: string) => any;
  calculateRaidSuccess: (raidGangSize: number, guns: number, difficulty: number, enemyGang: number) => number;
  getDifficultyColor: (difficulty: number) => string;
  getDifficultyText: (difficulty: number) => string;
  // Add more actions as needed
}

// --- Price & Supply Generation ---
function generateCityPrices(city: string, gameData: any) {
  const cityData = gameData.cities[city];
  const prices: Record<string, number> = {};
  Object.entries(gameData.drugs).forEach(([drug, drugData]: [string, any]) => {
    const basePrice = drugData.basePrice;
    const variation = (Math.random() - 0.5) * drugData.volatility;
    const price = Math.round(basePrice * (1 + variation) * cityData.heatModifier);
    prices[drug] = price;
  });
  return prices;
}

function generateAllCityPricesAndSupply(gameData: any) {
  const cityPrices: Record<string, any> = {};
  const citySupply: Record<string, any> = {};
  Object.keys(gameData.cities).forEach(city => {
    cityPrices[city] = generateCityPrices(city, gameData);
    citySupply[city] = {};
    Object.keys(gameData.drugs).forEach(drug => {
      citySupply[city][drug] = Math.floor(Math.random() * 150) + 50;
    });
  });
  return { cityPrices, citySupply };
}

// --- Initial State ---
const initialPricesAndSupply = generateAllCityPricesAndSupply(gameData);

const initialState: GameState = {
  playerName: 'Player',
  cash: 5000,
  gangSize: 0,
  warrant: 0,
  day: 1,
  guns: 0,
  currentCity: 'New York',
  daysInCurrentCity: 1,
  daysSinceTravel: 0,
  lastTravelDay: 0,
  currentScreen: 'home',
  heatLevel: 0,
  inventory: {
    Fentanyl: 0,
    Oxycontin: 0,
    Heroin: 0,
    Cocaine: 0,
    Weed: 0,
    Meth: 0,
  },
  bases: {},
  gangMembers: {},
  gunsByCity: {},
  citySupply: initialPricesAndSupply.citySupply,
  cityPrices: initialPricesAndSupply.cityPrices,
  lastPurchase: {},
  saveVersion: '1.0',
  lastSaved: Date.now(),
  notifications: [],
  achievements: {
    unlocked: [],
    progress: {
      totalRaids: 0,
      successfulRaids: 0,
      totalEarnings: 0,
      basesOwned: 0,
      assetsOwned: 0,
      drugsSold: 0,
      daysSurvived: 0,
      citiesVisited: 0,
      maxNetWorth: 0,
      maxHeatSurvived: 0,
    },
  },
  assets: {
    owned: {},
    wearing: { jewelry: [] },
  },
};

// --- Reducer ---
function gameReducer(state: GameState, action: any): GameState {
  switch (action.type) {
    case 'UPDATE_CASH':
      return { ...state, cash: Math.max(0, state.cash + action.amount) };
    case 'UPDATE_INVENTORY': {
      // Support both single-drug and bulk inventory updates
      if (action.newInventory) {
        // Bulk update: replace entire inventory
        return {
          ...state,
          inventory: { ...action.newInventory },
        };
      } else {
        const { drug, amount } = action;
        return {
          ...state,
          inventory: {
            ...state.inventory,
            [drug]: Math.max(0, (state.inventory[drug] || 0) + amount),
          },
        };
      }
    }
    case 'TRAVEL_TO_CITY':
      return {
        ...state,
        currentCity: action.city,
        daysInCurrentCity: 1,
        daysSinceTravel: 0,
        lastTravelDay: state.day,
      };
    case 'REGENERATE_PRICES': {
      const { cityPrices, citySupply } = generateAllCityPricesAndSupply(gameData);
      return {
        ...state,
        cityPrices,
        citySupply,
      };
    }
    case 'RESET_GAME':
      return { ...initialState };
    case 'SELL_ALL_DRUGS': {
      console.log('[DEBUG] SELL_ALL_DRUGS reducer called', action.inventory, action.prices);
      const { inventory, prices } = action;
      let totalEarned = 0;
      const newInventory = { ...state.inventory };
      Object.keys(inventory).forEach(drug => {
        const qty = inventory[drug] || 0;
        if (qty > 0) {
          const price = prices[drug] || 0;
          totalEarned += price * qty;
          newInventory[drug] = 0;
        }
      });
      return {
        ...state,
        cash: state.cash + totalEarned,
        inventory: newInventory,
      };
    }
    case 'BUY_ASSET': {
      const { assetId, assetData } = action;
      const owned = { ...state.assets.owned };
      if (!owned[assetId]) owned[assetId] = [];
      owned[assetId] = [...owned[assetId], assetData];
      return {
        ...state,
        cash: state.cash - assetData.cost,
        assets: {
          ...state.assets,
          owned,
        },
      };
    }
    case 'SELL_ASSET': {
      const { instanceId, assetId, resaleValue } = action;
      const owned = { ...state.assets.owned };
      if (!owned[assetId]) return state;
      owned[assetId] = owned[assetId].filter((inst: any) => inst.instanceId !== instanceId);
      if (owned[assetId].length === 0) delete owned[assetId];
      // Remove from wearing if jewelry
      const wearing = { ...state.assets.wearing };
      wearing.jewelry = wearing.jewelry.filter((id: string) => id !== instanceId);
      return {
        ...state,
        cash: state.cash + resaleValue,
        assets: {
          owned,
          wearing,
        },
      };
    }
    case 'WEAR_JEWELRY': {
      const { instanceId } = action;
      const wearing = { ...state.assets.wearing };
      if (!wearing.jewelry.includes(instanceId)) {
        wearing.jewelry = [...wearing.jewelry, instanceId];
      }
      return {
        ...state,
        assets: {
          ...state.assets,
          wearing,
        },
      };
    }
    case 'REMOVE_JEWELRY': {
      const { instanceId } = action;
      const wearing = { ...state.assets.wearing };
      wearing.jewelry = wearing.jewelry.filter((id: string) => id !== instanceId);
      return {
        ...state,
        assets: {
          ...state.assets,
          wearing,
        },
      };
    }
    case 'MARK_NOTIFICATION_AS_READ': {
      const notifications = state.notifications.map((n: any) =>
        n.id === action.id ? { ...n, read: true } : n
      );
      return { ...state, notifications };
    }
    case 'MARK_ALL_NOTIFICATIONS_AS_READ': {
      const notifications = state.notifications.map((n: any) => ({ ...n, read: true }));
      return { ...state, notifications };
    }
    case 'CLEAR_NOTIFICATIONS': {
      return { ...state, notifications: [] };
    }
    case 'ADD_NOTIFICATION': {
      const notifications = [
        ...state.notifications,
        {
          id: Date.now() + Math.floor(Math.random() * 10000),
          message: action.message,
          type: action.nType || 'info',
          day: state.day,
          timestamp: Date.now(),
          read: false,
        },
      ];
      return { ...state, notifications };
    }
    case 'UPDATE_GANG': {
      // Update both gangMembers (by city) and gangSize (global)
      return {
        ...state,
        gangMembers: action.gangMembers,
        gangSize: action.gangSize,
      };
    }
    case 'UPDATE_BASES': {
      return {
        ...state,
        bases: action.bases,
      };
    }
    case 'UPDATE_GUNS_BY_CITY': {
      const { city, amount } = action;
      return {
        ...state,
        gunsByCity: {
          ...state.gunsByCity,
          [city]: amount
        }
      };
    }
    // Add more cases as needed
    default:
      return state;
  }
}

// --- Context ---
const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  // Load from localStorage if present
  const loadState = () => {
    try {
      const saved = localStorage.getItem('slngBangSave');
      if (saved) {
        const parsed = JSON.parse(saved);
        // MIGRATION: Ensure assets always exists
        if (!parsed.assets) {
          parsed.assets = { owned: {}, wearing: { jewelry: [] } };
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load game from localStorage:', e);
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(gameReducer, initialState, loadState);

  // Auto-save on every state change
  useEffect(() => {
    try {
      localStorage.setItem('slngBangSave', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save game to localStorage:', e);
    }
  }, [state]);

  // --- Actions ---
  const updateCash = (amount: number) => {
    dispatch({ type: 'UPDATE_CASH', amount });
  };

  const updateInventory = (drug: string, amount: number) => {
    dispatch({ type: 'UPDATE_INVENTORY', drug, amount });
    // For quick buy: guns/gang
    if (drug === 'guns' && amount > 0) {
      addNotification(`Purchased ${amount} gun${amount > 1 ? 's' : ''}`, 'success');
    }
    if (drug === 'gang' && amount > 0) {
      addNotification(`Recruited ${amount} gang member${amount > 1 ? 's' : ''}`, 'success');
    }
  };

  const buyDrug = (drug: string, amount: number, price: number) => {
    updateCash(-amount * price);
    updateInventory(drug, amount);
    dispatch({ type: 'UPDATE_SUPPLY', drug, amount: -amount, city: state.currentCity });
    addNotification(`Bought ${amount} ${drug} for $${(amount * price).toLocaleString()}`, 'success');
  };

  const sellDrug = (drug: string, amount: number, price: number) => {
    updateCash(amount * price);
    updateInventory(drug, -amount);
    dispatch({ type: 'UPDATE_SUPPLY', drug, amount, city: state.currentCity });
    addNotification(`Sold ${amount} ${drug} for $${(amount * price).toLocaleString()}`, 'success');
  };

  const travelToCity = (city: string) => {
    dispatch({ type: 'TRAVEL_TO_CITY', city });
    addNotification(`Traveled to ${city}`, 'info');
  };

  const regeneratePrices = () => {
    dispatch({ type: 'REGENERATE_PRICES' });
  };

  const resetGame = () => {
    localStorage.removeItem('slngBangSave');
    dispatch({ type: 'RESET_GAME' });
  };

  const sellAllDrugs = () => {
    console.log('[DEBUG] sellAllDrugs function called');
    const { inventory, currentCity, cityPrices } = state;
    const prices = cityPrices?.[currentCity] || {};
    let totalEarned = 0;
    const drugsSold: string[] = [];
    Object.keys(inventory).forEach(drug => {
      const qty = inventory[drug] || 0;
      if (qty > 0) {
        const price = prices[drug] || 0;
        totalEarned += price * qty;
        drugsSold.push(`${qty} ${drug}`);
      }
    });
    dispatch({ type: 'SELL_ALL_DRUGS', inventory, prices });
    return { totalEarned, drugsSold };
  };

  // --- Asset Actions & Selectors ---
  const buyAsset = (assetId: string) => {
    const asset = gameData.assets.find((a: any) => a.id === assetId);
    if (!asset) return { success: false, error: 'Asset not found' };
    if (state.cash < asset.cost) return { success: false, error: 'Not enough cash' };
    // Storage checks for cars/jewelry can be added here
    const instanceId = `${assetId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const assetData = {
      ...asset,
      instanceId,
      purchaseDate: state.day,
      purchasePrice: asset.cost,
      resaleValue: asset.resaleValue || Math.floor(asset.cost * 0.9),
    };
    dispatch({ type: 'BUY_ASSET', assetId, assetData });
    addNotification(`Purchased ${asset.name} for $${asset.cost.toLocaleString()}`, 'success');
    return { success: true };
  };
  const sellAsset = (instanceId: string) => {
    // Find assetId by instanceId
    let assetId = null;
    let resaleValue = 0;
    let assetName = '';
    for (const [id, arr] of Object.entries(state.assets.owned)) {
      const inst = (arr as any[]).find(a => a.instanceId === instanceId);
      if (inst) {
        assetId = id;
        resaleValue = inst.resaleValue;
        assetName = inst.name;
        break;
      }
    }
    if (!assetId) return { success: false, error: 'Asset not found' };
    dispatch({ type: 'SELL_ASSET', instanceId, assetId, resaleValue });
    addNotification(`Sold ${assetName} for $${resaleValue.toLocaleString()}`, 'success');
    return { success: true };
  };
  const wearJewelry = (instanceId: string) => {
    dispatch({ type: 'WEAR_JEWELRY', instanceId });
    return { success: true };
  };
  const removeJewelry = (instanceId: string) => {
    dispatch({ type: 'REMOVE_JEWELRY', instanceId });
    return { success: true };
  };
  const getOwnedAssets = (type: string) => {
    // type: 'jewelry', 'car', 'property', etc.
    const owned = state.assets.owned;
    const result: Record<string, any[]> = {};
    for (const [id, arr] of Object.entries(owned)) {
      const asset = gameData.assets.find((a: any) => a.id === id);
      if (asset && asset.type === type) {
        result[id] = arr;
      }
    }
    return result;
  };
  const getAllOwnedInstances = () => {
    return Object.values(state.assets.owned).flat();
  };
  const getWornJewelry = () => {
    return state.assets.wearing.jewelry;
  };
  const getAssetSummary = () => {
    let totalValue = 0;
    let flexScore = 0;
    for (const arr of Object.values(state.assets.owned)) {
      for (const inst of arr) {
        totalValue += inst.resaleValue || 0;
        flexScore += inst.flexScore || 0;
      }
    }
    return { totalValue, flexScore };
  };

  // --- Notification Actions & Selectors ---
  const getNotifications = () => {
    return state.notifications || [];
  };
  const getUnreadNotifications = () => {
    return (state.notifications || []).filter((n: any) => !n.read);
  };
  const markNotificationAsRead = (id: number) => {
    dispatch({ type: 'MARK_NOTIFICATION_AS_READ', id });
  };
  const markAllNotificationsAsRead = () => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_AS_READ' });
  };
  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const addNotification = (message: string, nType: string = 'info') => {
    dispatch({ type: 'ADD_NOTIFICATION', message, nType });
  };

  // --- Raid Selectors & Actions ---
  function getAvailableGangMembers() {
    // Total unassigned gang members (global)
    let assigned = 0;
    Object.values(state.bases || {}).forEach((cityBases: any) => {
      (cityBases as any[]).forEach((base: any) => {
        assigned += base.assignedGang || 0;
      });
    });
    return Math.max(0, (state.gangSize || 0) - assigned);
  }
  function getAvailableGangMembersInCity(city: string) {
    // Unassigned gang members in a specific city
    const totalInCity = (state.gangMembers && state.gangMembers[city]) || 0;
    let assignedInCity = 0;
    const cityBases = (state.bases && state.bases[city]) || [];
    (cityBases as any[]).forEach((base: any) => {
      assignedInCity += base.assignedGang || 0;
    });
    return Math.max(0, totalInCity - assignedInCity);
  }
  function getAvailableGunsInCity(city: string) {
    // Unassigned guns in a specific city
    const totalInCity = (state.gunsByCity && state.gunsByCity[city]) || (state.guns || 0);
    let assignedInCity = 0;
    const cityBases = (state.bases && state.bases[city]) || [];
    (cityBases as any[]).forEach((base: any) => {
      assignedInCity += base.guns || 0;
    });
    return Math.max(0, totalInCity - assignedInCity);
  }
  function getAvailableRaidTargets(city: string) {
    // Demo targets (replace with real logic as needed)
    return [
      {
        id: 'target1',
        name: 'Enemy Base Alpha',
        city,
        cash: 5000,
        drugs: { Cocaine: 10, Weed: 20 },
        gangSize: 5,
        difficulty: 2,
        lastRaid: 0,
      },
      {
        id: 'target2',
        name: 'Enemy Base Beta',
        city,
        cash: 8000,
        drugs: { Meth: 15 },
        gangSize: 8,
        difficulty: 3,
        lastRaid: 0,
      },
    ];
  }
  function calculateRaidSuccess(raidGangSize: number, guns: number, difficulty: number, enemyGang: number) {
    // Simple formula: more gang/guns = higher chance, higher difficulty/enemy = lower
    let base = 0.5 + 0.03 * (raidGangSize + guns) - 0.04 * (difficulty + enemyGang);
    return Math.max(0.05, Math.min(0.95, base));
  }
  function getDifficultyColor(difficulty: number) {
    if (difficulty <= 1) return '#66ff66';
    if (difficulty === 2) return '#ffff00';
    return '#ff6666';
  }
  function getDifficultyText(difficulty: number) {
    if (difficulty <= 1) return 'Easy';
    if (difficulty === 2) return 'Medium';
    return 'Hard';
  }
  function executeRaid(targetId: string, raidGangSize: number, city: string) {
    // Find target (stub logic)
    const targets = getAvailableRaidTargets(city);
    const target = targets.find((t: any) => t.id === targetId);
    if (!target) return { error: 'Target not found' };
    // Cooldown check (stub: always available)
    // Calculate success
    const guns = getAvailableGunsInCity(city);
    const successChance = calculateRaidSuccess(raidGangSize, guns, target.difficulty, target.gangSize);
    const roll = Math.random();
    const heatIncrease = 1000 + Math.floor(Math.random() * 2000);
    if (roll < successChance) {
      // Success: loot cash/drugs
      dispatch({ type: 'UPDATE_CASH', amount: target.cash });
      let drugsWon: string[] = [];
      Object.entries(target.drugs || {}).forEach(([drug, amount]) => {
        if (amount > 0) {
          dispatch({ type: 'UPDATE_INVENTORY', drug, amount });
          drugsWon.push(`${amount} ${drug}`);
        }
      });
      addNotification(
        `Raid successful! Looted $${target.cash.toLocaleString()}${drugsWon.length ? ' and ' + drugsWon.join(', ') : ''}.`,
        'success'
      );
      return {
        success: true,
        loot: { cash: target.cash, drugs: target.drugs },
        heatIncrease,
      };
    } else {
      // Failure
      addNotification('Raid failed! Your gang was defeated.', 'error');
      return {
        success: false,
        heatIncrease,
      };
    }
  }

  // --- Context Value ---
  const value: GameContextType = {
    state,
    dispatch,
    buyDrug,
    sellDrug,
    updateCash,
    updateInventory,
    travelToCity,
    regeneratePrices,
    resetGame,
    sellAllDrugs,
    buyAsset,
    sellAsset,
    wearJewelry,
    removeJewelry,
    getOwnedAssets,
    getAllOwnedInstances,
    getWornJewelry,
    getAssetSummary,
    getNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearNotifications,
    addNotification,
    getAvailableGangMembers,
    getAvailableGangMembersInCity,
    getAvailableGunsInCity,
    getAvailableRaidTargets,
    executeRaid,
    calculateRaidSuccess,
    getDifficultyColor,
    getDifficultyText,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// --- Hooks ---
export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within a GameProvider');
  return ctx;
}

export function useCash() {
  return useGame().state.cash;
}

export function useInventory() {
  return useGame().state.inventory;
}

export function useCurrentCity() {
  return useGame().state.currentCity;
}

// Add more hooks as needed 