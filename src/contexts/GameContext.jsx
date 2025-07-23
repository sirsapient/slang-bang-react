import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import { gameState } from '../game/gameState'; // No longer used for state
// @ts-ignore
import { gameData } from '../game/data/gameData';
import { RaidSystem } from '../game/systems/raid';

// --- Price & Supply Generation ---
function generateCityPrices(city, gameData) {
  /** @type {any} */
  const cityData = gameData.cities[city];
  /** @type {any} */
  const prices = {};
  Object.entries(gameData.drugs).forEach(([drug, drugData]) => {
    const basePrice = drugData.basePrice;
    const variation = (Math.random() - 0.5) * drugData.volatility;
    const price = Math.round(basePrice * (1 + variation) * cityData.heatModifier);
    prices[drug] = price;
  });
  return prices;
}

function generateAllCityPricesAndSupply(gameData) {
  /** @type {any} */
  const cityPrices = {};
  /** @type {any} */
  const citySupply = {};
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

const initialState = {
  playerName: 'Player',
  cash: 1000000,
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
function gameReducer(state, action) {
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
      owned[assetId] = owned[assetId].filter((inst) => inst.instanceId !== instanceId);
      if (owned[assetId].length === 0) delete owned[assetId];
      // Remove from wearing if jewelry
      const wearing = { ...state.assets.wearing };
      wearing.jewelry = wearing.jewelry.filter((id) => id !== instanceId);
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
      wearing.jewelry = wearing.jewelry.filter((id) => id !== instanceId);
      return {
        ...state,
        assets: {
          ...state.assets,
          wearing,
        },
      };
    }
    case 'MARK_NOTIFICATION_AS_READ': {
      const notifications = state.notifications.map((n) =>
        n.id === action.id ? { ...n, read: true } : n
      );
      return { ...state, notifications };
    }
    case 'MARK_ALL_NOTIFICATIONS_AS_READ': {
      const notifications = state.notifications.map((n) => ({ ...n, read: true }));
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
      // Always store flat arrays for each city
      const newBases = {};
      Object.entries(action.bases).forEach(([city, baseList]) => {
        if (baseList && (Array.isArray(baseList) ? baseList.length > 0 : Object.keys(baseList).length > 0)) {
          let arr = [];
          if (Array.isArray(baseList)) {
            arr = baseList.flat(Infinity);
          } else {
            arr = [baseList];
          }
          // Filter to only include objects with required Base properties (id, city, type, level, inventory, income, capacity)
          newBases[city] = arr.filter(x => x && typeof x === 'object' &&
            typeof x.id === 'string' &&
            typeof x.city === 'string' &&
            (typeof x.type === 'string' || typeof x.type === 'number') &&
            typeof x.level === 'number' &&
            typeof x.inventory === 'object' &&
            typeof x.income === 'number' &&
            typeof x.capacity === 'number');
        } else {
          newBases[city] = [];
        }
      });
      console.log('Reducer: newBases after filter:', newBases);
      return {
        ...state,
        // @ts-expect-error: We guarantee newBases is correct at runtime
        bases: newBases,
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
const GameContext = createContext(undefined);

export function GameProvider({ children }) {
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
        // MIGRATION: Ensure bases are always arrays
        if (parsed.bases) {
          Object.keys(parsed.bases).forEach(city => {
            const val = parsed.bases[city];
            if (!Array.isArray(val)) {
              parsed.bases[city] = val ? [val] : [];
            }
          });
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

  // --- Daily Game Loop: Advance day and generate base income/drug depletion ---
  useEffect(() => {
    const interval = setInterval(() => {
      // For each city with bases
      const updatedBases = { ...state.bases };
      let totalProfit = 0;
      const now = Date.now();
      Object.entries(updatedBases).forEach(([city, baseList]) => {
        const basesArr = Array.isArray(baseList) ? baseList : [baseList];
        updatedBases[city] = basesArr.map((base) => {
          // Only operate if base is operational (enough gang, guns, and at least 1 drug)
          const baseType = gameData.baseTypes[base.type] || gameData.baseTypes[base.level] || {};
          const requiredGang = baseType.gangRequired || 4;
          const requiredGuns = baseType.gunsRequired || 2;
          const hasEnoughGang = (base.assignedGang || 0) >= requiredGang;
          const hasEnoughGuns = (base.guns || 0) >= requiredGuns;
          const drugsInBase = base.inventory ? (Object.values(base.inventory).reduce((sum, qty) => sum + qty, 0)) : 0;
          const hasDrugs = drugsInBase > 0;
          if (!(hasEnoughGang && hasEnoughGuns && hasDrugs)) {
            return base;
          }
          // Track lastDrugSale (real time, ms)
          const lastDrugSale = base.lastDrugSale || base.lastCollected || now;
          const hoursElapsed = Math.floor((now - lastDrugSale) / (1000 * 60 * 60));
          if (hoursElapsed < 1) return base;
          let newInventory = { ...base.inventory };
          let profit = 0;
          let sales = 0;
          for (let i = 0; i < hoursElapsed; i++) {
            // For each drug, sell 1 unit if available
            Object.keys(newInventory).forEach(d => {
              if (newInventory[d] > 0) {
                newInventory[d] -= 1;
                const price = state.cityPrices?.[city]?.[d] || gameData.drugs[d]?.basePrice || 0;
                profit += price * 3;
                sales = i + 1; // Track the last hour processed
              }
            });
          }
          if (profit > 0) {
            totalProfit += profit;
          }
          return {
            ...base,
            inventory: newInventory,
            lastDrugSale: lastDrugSale + hoursElapsed * 60 * 60 * 1000, // advance by hours
          };
        });
      });
      if (totalProfit > 0) {
        dispatch({ type: 'UPDATE_CASH', amount: totalProfit });
      }
      dispatch({ type: 'UPDATE_BASES', bases: updatedBases });
    }, 60000); // 60 seconds
    return () => clearInterval(interval);
  }, [state, dispatch]);

  // --- Actions ---
  const updateCash = (amount) => {
    dispatch({ type: 'UPDATE_CASH', amount });
  };

  const updateInventory = (drug, amount) => {
    dispatch({ type: 'UPDATE_INVENTORY', drug, amount });
    // For quick buy: guns/gang
    if (drug === 'guns' && amount > 0) {
      addNotification(`Purchased ${amount} gun${amount > 1 ? 's' : ''}`, 'success');
    }
    if (drug === 'gang' && amount > 0) {
      addNotification(`Recruited ${amount} gang member${amount > 1 ? 's' : ''}`, 'success');
    }
  };

  const buyDrug = (drug, amount, price) => {
    updateCash(-amount * price);
    updateInventory(drug, amount);
    dispatch({ type: 'UPDATE_SUPPLY', drug, amount: -amount, city: state.currentCity });
    addNotification(`Bought ${amount} ${drug} for $${(amount * price).toLocaleString()}`, 'success');
  };

  const sellDrug = (drug, amount, price) => {
    updateCash(amount * price);
    updateInventory(drug, -amount);
    dispatch({ type: 'UPDATE_SUPPLY', drug, amount, city: state.currentCity });
    addNotification(`Sold ${amount} ${drug} for $${(amount * price).toLocaleString()}`, 'success');
  };

  const travelToCity = (city) => {
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
    const drugsSold = [];
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
  const buyAsset = (assetId) => {
    const asset = gameData.assets.find((a) => a.id === assetId);
    if (!asset) return { success: false, error: 'Asset not found' };
    if (state.cash < asset.cost) return { success: false, error: 'Not enough cash' };
    // --- Storage checks for jewelry/cars ---
    if (asset.type === 'jewelry') {
      // Count worn + stored jewelry
      const wornCount = state.assets.wearing.jewelry.length;
      const ownedJewelry = Object.values(state.assets.owned)
        .flat()
        .filter((inst) => inst.type === 'jewelry');
      const storedJewelry = ownedJewelry.length - wornCount;
      // Calculate total jewelry storage from properties
      const propertyStorage = Object.values(state.assets.owned)
        .flat()
        .filter((inst) => inst.type === 'property')
        .reduce((sum, prop) => sum + (prop.capacity?.jewelry || 0), 0);
      const maxJewelry = 2 + propertyStorage;
      if (ownedJewelry.length >= maxJewelry) {
        return { success: false, error: `Jewelry storage full! Buy more property to store more jewelry.` };
      }
    }
    if (asset.type === 'car') {
      // Count owned cars
      const ownedCars = Object.values(state.assets.owned)
        .flat()
        .filter((inst) => inst.type === 'car');
      // Calculate total car storage from properties
      const propertyStorage = Object.values(state.assets.owned)
        .flat()
        .filter((inst) => inst.type === 'property')
        .reduce((sum, prop) => sum + (prop.capacity?.cars || 0), 0);
      if (ownedCars.length >= propertyStorage) {
        return { success: false, error: `Car storage full! Buy more property to store more cars.` };
      }
    }
    // --- Assign cityPurchased and storagePropertyId ---
    const instanceId = `${assetId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let storagePropertyId = undefined;
    if (asset.type === 'jewelry' && state.assets.wearing.jewelry.length >= 2) {
      // Find a property with available jewelry storage
      const properties = Object.values(state.assets.owned)
        .flat()
        .filter((inst) => inst.type === 'property');
      let assigned = false;
      for (const prop of properties) {
        const propJewelry = Object.values(state.assets.owned)
          .flat()
          .filter((inst) => inst.type === 'jewelry' && (inst.storagePropertyId === prop.instanceId)).length;
        if (propJewelry < (prop.capacity || 0)) {
          storagePropertyId = prop.instanceId;
          assigned = true;
          break;
        }
      }
      if (!assigned && properties.length > 0) {
        storagePropertyId = properties[0].instanceId;
      }
    }
    if (asset.type === 'car') {
      // Find a property with available car storage
      const properties = Object.values(state.assets.owned)
        .flat()
        .filter((inst) => inst.type === 'property');
      let assigned = false;
      for (const prop of properties) {
        const propCars = Object.values(state.assets.owned)
          .flat()
          .filter((inst) => inst.type === 'car' && (inst.storagePropertyId === prop.instanceId)).length;
        if (propCars < (prop.capacity || 0)) {
          storagePropertyId = prop.instanceId;
          assigned = true;
          break;
        }
      }
      if (!assigned && properties.length > 0) {
        storagePropertyId = properties[0].instanceId;
      }
    }
    const assetData = {
      ...asset,
      instanceId,
      purchaseDate: state.day,
      purchasePrice: asset.cost,
      resaleValue: asset.resaleValue || Math.floor(asset.cost * 0.9),
      cityPurchased: state.currentCity,
      storagePropertyId,
    };
    dispatch({ type: 'BUY_ASSET', assetId, assetData });
    addNotification(`Purchased ${asset.name} for $${asset.cost.toLocaleString()}`, 'success');
    return { success: true };
  };

  const sellAsset = (instanceId) => {
    // Find assetId by instanceId
    let assetId = null;
    let resaleValue = 0;
    let assetName = '';
    let assetType = '';
    let cityPurchased = '';
    let storagePropertyId = '';
    let isWorn = false;
    for (const [id, arr] of Object.entries(state.assets.owned)) {
      const inst = (arr).find(a => a.instanceId === instanceId);
      if (inst) {
        assetId = id;
        resaleValue = inst.resaleValue;
        assetName = inst.name;
        assetType = inst.type;
        cityPurchased = inst.cityPurchased;
        storagePropertyId = inst.storagePropertyId;
        isWorn = state.assets.wearing.jewelry.includes(instanceId);
        break;
      }
    }
    if (!assetId) return { success: false, error: 'Asset not found' };
    // --- Enforce city rules ---
    if (assetType === 'jewelry') {
      if (!isWorn && state.currentCity !== cityPurchased) {
        return { success: false, error: `You must be in ${cityPurchased} to sell this jewelry (not currently worn).` };
      }
    } else if (assetType === 'car' || assetType === 'property') {
      if (state.currentCity !== cityPurchased) {
        return { success: false, error: `You must be in ${cityPurchased} to sell this ${assetType}.` };
      }
    }
    dispatch({ type: 'SELL_ASSET', instanceId, assetId, resaleValue });
    addNotification(`Sold ${assetName} for $${resaleValue.toLocaleString()}`, 'success');
    return { success: true };
  };
  const wearJewelry = (instanceId) => {
    dispatch({ type: 'WEAR_JEWELRY', instanceId });
    return { success: true };
  };
  const removeJewelry = (instanceId) => {
    dispatch({ type: 'REMOVE_JEWELRY', instanceId });
    return { success: true };
  };
  const getOwnedAssets = (type) => {
    // type: 'jewelry', 'car', 'property', etc.
    const owned = state.assets.owned;
    const result = {};
    for (const [id, arr] of Object.entries(owned)) {
      const asset = gameData.assets.find((a) => a.id === id);
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
  /**
   * Returns a summary of the player's assets.
   * @returns {{ totalValue: number, flexScore: number }}
   */
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
    return (state.notifications || []).filter((n) => !n.read);
  };
  const markNotificationAsRead = (id) => {
    dispatch({ type: 'MARK_NOTIFICATION_AS_READ', id });
  };
  const markAllNotificationsAsRead = () => {
    dispatch({ type: 'MARK_ALL_NOTIFICATIONS_AS_READ' });
  };
  const clearNotifications = () => {
    dispatch({ type: 'CLEAR_NOTIFICATIONS' });
  };

  const addNotification = (message, nType = 'info') => {
    dispatch({ type: 'ADD_NOTIFICATION', message, nType });
  };

  // --- Raid Selectors & Actions ---
  function getAvailableGangMembers() {
    // Total unassigned gang members (global)
    let assigned = 0;
    Object.values(state.bases || {}).forEach((cityBases) => {
      (cityBases).forEach((base) => {
        assigned += base.assignedGang || 0;
      });
    });
    return Math.max(0, (state.gangSize || 0) - assigned);
  }
  function getAvailableGangMembersInCity(city) {
    // Unassigned gang members in a specific city
    const totalInCity = (state.gangMembers && state.gangMembers[city]) || 0;
    let assignedInCity = 0;
    const cityBases = (state.bases && state.bases[city]) || [];
    (cityBases).forEach((base) => {
      assignedInCity += base.assignedGang || 0;
    });
    return Math.max(0, totalInCity - assignedInCity);
  }
  function getAvailableGunsInCity(city) {
    // Unassigned guns in a specific city
    const totalInCity = (state.gunsByCity && state.gunsByCity[city]) || (state.guns || 0);
    let assignedInCity = 0;
    const cityBases = (state.bases && state.bases[city]) || [];
    (cityBases).forEach((base) => {
      assignedInCity += base.guns || 0;
    });
    return Math.max(0, totalInCity - assignedInCity);
  }

  // --- Raid System Integration ---
  const raidSystemRef = React.useRef(null);
  if (!raidSystemRef.current) {
    // Minimal event logger for RaidSystem
    const events = {
      add: (msg, type) => addNotification(msg, type),
    };
    // Provide a minimal state interface for RaidSystem
    const raidState = {
      getAvailableGangMembersInCity: (city) => getAvailableGangMembersInCity(city),
      getAvailableGunsInCity: (city) => getAvailableGunsInCity(city),
      updateCash: (amount) => updateCash(amount),
      updateInventory: (drug, amount) => updateInventory(drug, amount),
      updateWarrant: (amount) => dispatch({ type: 'UPDATE_CASH', amount: 0 }), // stub, implement if needed
      trackAchievement: () => {}, // stub
      addNotification: (msg, type) => addNotification(msg, type),
      incrementCityRaidActivity: () => {}, // stub
    };
    raidSystemRef.current = new RaidSystem(raidState, events, gameData);
  }
  const raidSystem = raidSystemRef.current;

  // --- Raid Selectors & Actions (using RaidSystem) ---
  function getAvailableRaidTargets(city) {
    return raidSystem.getAvailableTargets(city);
  }
  function executeRaid(targetId, raidGangSize, city) {
    // The RaidSystem will handle cooldown and all logic
    return raidSystem.executeRaid(targetId, raidGangSize);
  }
  function calculateRaidSuccess(raidGangSize, guns, difficulty, enemyGang) {
    // Simple formula: more gang/guns = higher chance, higher difficulty/enemy = lower
    let base = 0.5 + 0.03 * (raidGangSize + guns) - 0.04 * (difficulty + enemyGang);
    return Math.max(0.05, Math.min(0.95, base));
  }
  function getDifficultyColor(difficulty) {
    if (difficulty < 0.3) return '#66ff66'; // Easy - Green
    if (difficulty < 0.7) return '#ffff00'; // Medium - Yellow
    return '#ff6666'; // Hard - Red
  }
  function getDifficultyText(difficulty) {
    if (difficulty < 0.3) return 'Easy';
    if (difficulty < 0.7) return 'Medium';
    return 'Hard';
  }
  function getAllRaidTargets(city) {
    // Only return targets not on cooldown
    const allTargets = raidSystem.enemyBases[city] || [];
    const currentTime = Date.now();
    const cooldownPeriod = 5 * 60 * 1000;
    return allTargets.filter(target => (currentTime - target.lastRaid) >= cooldownPeriod);
  }
  function isRaidTargetOnCooldown(target) {
    const currentTime = Date.now();
    const cooldownPeriod = 5 * 60 * 1000;
    return (currentTime - target.lastRaid) < cooldownPeriod;
  }

  // --- Utility: Raid Activity ---
  function getCityRaidActivity(city) {
    if (!state.cityRaidActivity || !state.cityRaidActivity[city]) {
      return { count: 0, lastRaid: 0 };
    }
    return state.cityRaidActivity[city];
  }

  // --- Context Value ---
  const value = {
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
    getAllRaidTargets,
    isRaidTargetOnCooldown,
    executeRaid,
    calculateRaidSuccess,
    getDifficultyColor,
    getDifficultyText,
    getCityRaidActivity,
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