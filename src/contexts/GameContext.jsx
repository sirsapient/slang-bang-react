import React, { createContext, useContext, useReducer, useEffect } from 'react';
// import { gameState } from '../game/gameState'; // No longer used for state
// @ts-ignore
import { gameData } from '../game/data/gameData';
import { PlayerRaidSystem } from '../game/systems/playerRaid';
import { BaseDefenseSystem } from '../game/systems/baseDefense';
import { useTutorial } from './TutorialContext';

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
  cityRaidActivity: {}, // { [city]: { count: number, lastRaid: number } }
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
      if (!owned[assetData.cityPurchased]) owned[assetData.cityPurchased] = {};
      if (!owned[assetData.cityPurchased][assetId]) owned[assetData.cityPurchased][assetId] = [];
      owned[assetData.cityPurchased][assetId] = [...owned[assetData.cityPurchased][assetId], assetData];
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
      const { instanceId, assetId, resaleValue, city } = action;
      const owned = { ...state.assets.owned };
      if (!owned[city]) return state;
      if (!owned[city][assetId]) return state;
      
      owned[city][assetId] = owned[city][assetId].filter((inst) => inst.instanceId !== instanceId);
      if (owned[city][assetId].length === 0) delete owned[city][assetId];
      
      // If no more assets in this city, remove the city entry
      if (Object.keys(owned[city]).length === 0) {
        delete owned[city];
      }
      
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
    case 'UPDATE_HEAT_LEVEL': {
      return {
        ...state,
        heatLevel: action.heatLevel,
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
    case 'UPGRADE_BASE': {
      const { baseId, oldLevel, newLevel, city } = action;
      const newBases = { ...state.bases };
      
      // Find and upgrade the base
      if (newBases[city]) {
        newBases[city] = newBases[city].map(base => {
          if (base.id === baseId) {
            return { ...base, level: newLevel };
          }
          return base;
        });
      }
      
      // Add heat warning notification
      const heatIncrease = Math.min(20, newLevel * 2) - Math.min(20, oldLevel * 2);
      if (newLevel >= 4 && oldLevel < 4) {
        // Drug Fortress upgrade
        const notifications = [
          ...state.notifications,
          {
            id: Date.now() + Math.floor(Math.random() * 10000),
            message: `🔥 Upgraded base in ${city} - Heat increased by ${heatIncrease}%`,
            type: 'warning',
            day: state.day,
            timestamp: Date.now(),
            read: false,
          },
          {
            id: Date.now() + Math.floor(Math.random() * 10000) + 1,
            message: `⚠️ Drug Fortress attracts major attention! Police raids more likely.`,
            type: 'warning',
            day: state.day,
            timestamp: Date.now(),
            read: false,
          }
        ];
        return {
          ...state,
          bases: newBases,
          notifications,
        };
      } else if (heatIncrease > 0) {
        const notifications = [
          ...state.notifications,
          {
            id: Date.now() + Math.floor(Math.random() * 10000),
            message: `🔥 Upgraded base in ${city} - Heat increased by ${heatIncrease}%`,
            type: 'warning',
            day: state.day,
            timestamp: Date.now(),
            read: false,
          }
        ];
        return {
          ...state,
          bases: newBases,
          notifications,
        };
      }
      
      return {
        ...state,
        bases: newBases,
      };
    }
    case 'UPDATE_GUNS_BY_CITY': {
      const { city, amount } = action;
      return {
        ...state,
        guns: state.guns + amount,
        gunsByCity: {
          ...state.gunsByCity,
          [city]: (state.gunsByCity[city] || 0) + amount
        }
      };
    }
    case 'UPDATE_GANG_MEMBERS': {
      const { city, amount } = action;
      const oldTotal = state.gangSize;
      const newTotal = oldTotal + amount;
      
      // Calculate heat warnings
      const notifications = [...state.notifications];
      
      // Check if crossing gang size thresholds
      if (oldTotal < 50 && newTotal >= 50) {
        notifications.push({
          id: Date.now() + Math.floor(Math.random() * 10000),
          message: `👥 Large gang detected! Heat increased by 5%`,
          type: 'warning',
          day: state.day,
          timestamp: Date.now(),
          read: false,
        });
      }
      
      if (oldTotal < 100 && newTotal >= 100) {
        notifications.push({
          id: Date.now() + Math.floor(Math.random() * 10000) + 1,
          message: `👥 Massive gang detected! Heat increased by 10%`,
          type: 'warning',
          day: state.day,
          timestamp: Date.now(),
          read: false,
        });
      }
      
      // General warning for significant recruitment
      if (amount >= 10) {
        const heatIncrease = Math.floor(amount / 10) * 0.5;
        notifications.push({
          id: Date.now() + Math.floor(Math.random() * 10000) + 2,
          message: `👥 Recruited ${amount} members - Heat increased by ${heatIncrease}%`,
          type: 'warning',
          day: state.day,
          timestamp: Date.now(),
          read: false,
        });
      }
      
      return {
        ...state,
        gangSize: newTotal,
        gangMembers: {
          ...state.gangMembers,
          [city]: (state.gangMembers[city] || 0) + amount
        },
        notifications,
      };
    }
    case 'UPDATE_CITY_RAID_ACTIVITY': {
      const { city, activity } = action;
      return {
        ...state,
        cityRaidActivity: {
          ...state.cityRaidActivity,
          [city]: activity
        }
      };
    }
    case 'UPDATE_WARRANT': {
      return {
        ...state,
        warrant: Math.max(0, (state.warrant || 0) + action.amount)
      };
    }
    case 'UPDATE_BASE_INVENTORY': {
      const { baseId, city, drug, amount } = action;
      const newBases = { ...state.bases };
      
      if (newBases[city]) {
        newBases[city] = newBases[city].map(base => {
          if (base.id === baseId) {
            const newInventory = { ...base.inventory };
            newInventory[drug] = Math.max(0, (newInventory[drug] || 0) + amount);
            return { ...base, inventory: newInventory };
          }
          return base;
        });
      }
      
      return {
        ...state,
        bases: newBases
      };
    }
    case 'UPDATE_BASE_CASH': {
      const { baseId, city, amount } = action;
      const newBases = { ...state.bases };
      
      if (newBases[city]) {
        newBases[city] = newBases[city].map(base => {
          if (base.id === baseId) {
            return { ...base, cashStored: Math.max(0, (base.cashStored || 0) + amount) };
          }
          return base;
        });
      }
      
      return {
        ...state,
        bases: newBases
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
  // Get tutorial context for triggering assets tutorial
  const { progress, startTutorial } = useTutorial();
  
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

  // Assets tutorial is now triggered by clicking the Asset button instead of automatically
  // This allows the user to control when they want to see the tutorial

  // Auto-save on every state change
  useEffect(() => {
    try {
      localStorage.setItem('slngBangSave', JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save game to localStorage:', e);
    }
  }, [state]);

  // Modal system for notifications
  const [modalContent, setModalContent] = React.useState({
    isOpen: false,
    title: '',
    content: '',
    type: 'info'
  });

  const showModal = (title, content, type = 'info') => {
    setModalContent({
      isOpen: true,
      title,
      content,
      type
    });
  };

  const hideModal = () => {
    setModalContent(prev => ({ ...prev, isOpen: false }));
  };

  // Initialize window.game.ui.modals for systems to use
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.game = window.game || {};
      window.game.ui = window.game.ui || {};
      window.game.ui.modals = {
        alert: (content, title) => {
          showModal(title, content, 'info');
        },
        success: (content, title) => {
          showModal(title, content, 'success');
        },
        warning: (content, title) => {
          showModal(title, content, 'warning');
        },
        error: (content, title) => {
          showModal(title, content, 'error');
        }
      };
    }
  }, []);

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

      // --- Heat-based Gang Retaliation Checking ---
      // Calculate current heat level for the current city
      const currentCity = state.currentCity;
      const warrantHeat = Math.min((state.warrant || 0) / 10000, 50);
      const timeHeat = Math.max(0, (state.daysInCurrentCity || 0) - 3) * 5;
      const currentHeatLevel = Math.min(100, warrantHeat + timeHeat);
      
      // Update heat level in state
      dispatch({ type: 'UPDATE_HEAT_LEVEL', heatLevel: currentHeatLevel });
      
      // Debug logging for heat-based retaliation
      console.log(`[HEAT DEBUG] Current city: ${currentCity}, Heat level: ${currentHeatLevel.toFixed(1)}% (warrant: ${warrantHeat.toFixed(1)}, time: ${timeHeat.toFixed(1)})`);
      
      // OLD GANG ATTACK SYSTEM REMOVED - Now using new BaseDefenseSystem with priority-based losses
      // The new system destroys guns/gangs first before taking drugs/cash
      
      // --- Base Raid Checking (existing raid activity based) ---
      // Check for base raids based on raid activity
      const cityRaidActivity = state.cityRaidActivity?.[currentCity];
      const raidCount = cityRaidActivity?.count || 0;
      
      // Only check if player has a base in this city
      if (state.bases[currentCity] && state.bases[currentCity].length > 0) {
        // Calculate base raid probability based on raid activity
        // Each raid increases probability by 5%, max 50%
        const baseRaidChance = Math.min(0.5, raidCount * 0.05);
        
        if (Math.random() < baseRaidChance) {
          // Execute base raid
          const base = state.bases[currentCity][0]; // Use first base for now
          if (base) {
            // Calculate base defense based on assigned gang and guns
            const baseDefense = (base.assignedGang || 0) + (base.guns || 0);
            const baseCash = base.cashStored || 0;
            const baseInventory = base.inventory || {};
            
            // Calculate raid success chance (higher defense = lower success)
            const raidSuccessChance = Math.max(0.1, 0.8 - (baseDefense * 0.02));
            const raidSuccessful = Math.random() < raidSuccessChance;
            
            if (raidSuccessful) {
              // Base raid successful - steal cash and drugs
              const cashStolen = Math.floor(baseCash * (0.3 + Math.random() * 0.4)); // 30-70% of cash
              const drugsStolen = {};
              
              Object.keys(baseInventory).forEach(drug => {
                const amount = baseInventory[drug] || 0;
                const stolen = Math.floor(amount * (0.2 + Math.random() * 0.6)); // 20-80% of drugs
                if (stolen > 0) {
                  drugsStolen[drug] = stolen;
                  base.inventory[drug] = Math.max(0, amount - stolen);
                }
              });
              
              // Update base cash
              base.cashStored = Math.max(0, baseCash - cashStolen);
              
              // Create raid message
              let raidMessage = `🏢 Your base in ${currentCity} was raided! Lost $${cashStolen.toLocaleString()} cash`;
              if (Object.keys(drugsStolen).length > 0) {
                const drugList = Object.keys(drugsStolen).map(drug => `${drugsStolen[drug]} ${drug}`).join(', ');
                raidMessage += ` and ${drugList}`;
              }
              
              addNotification(raidMessage, 'error');
              
              // Reset raid activity for this city (successful raid cools down the area)
              dispatch({ 
                type: 'UPDATE_CITY_RAID_ACTIVITY', 
                city: currentCity, 
                activity: { count: 0, lastRaid: 0 } 
              });
              
            } else {
              // Base raid failed - defenders repelled the attack
              addNotification(`🏢 Base raid in ${currentCity} repelled! Your defenses held strong.`, 'success');
              
              // Reduce raid activity slightly (failed raid still cools down the area a bit)
              if (cityRaidActivity && cityRaidActivity.count > 0) {
                dispatch({ 
                  type: 'UPDATE_CITY_RAID_ACTIVITY', 
                  city: currentCity, 
                  activity: { 
                    count: Math.max(0, cityRaidActivity.count - 1), 
                    lastRaid: cityRaidActivity.lastRaid 
                  } 
                });
              }
            }
            
            // Update the base in state
            dispatch({ type: 'UPDATE_BASES', bases: updatedBases });
          }
        }
      }
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
    
    dispatch({ type: 'BUY_ASSET', assetId, assetData, city: state.currentCity });
    addNotification(`Purchased ${asset.name} in ${state.currentCity} for $${asset.cost.toLocaleString()}`, 'success');
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
    
    // Search through all cities for the asset
    for (const [cityName, cityAssets] of Object.entries(state.assets.owned)) {
      for (const [id, arr] of Object.entries(cityAssets)) {
        const inst = arr.find(a => a.instanceId === instanceId);
        if (inst) {
          assetId = id;
          resaleValue = inst.resaleValue;
          assetName = inst.name;
          assetType = inst.type;
          cityPurchased = inst.cityPurchased || cityName;
          storagePropertyId = inst.storagePropertyId;
          isWorn = state.assets.wearing.jewelry.includes(instanceId);
          break;
        }
      }
      if (assetId) break;
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
    
    dispatch({ type: 'SELL_ASSET', instanceId, assetId, resaleValue, city: cityPurchased });
    addNotification(`Sold ${assetName} from ${cityPurchased} for $${resaleValue.toLocaleString()}`, 'success');
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
  
  const getOwnedAssets = (type, city = null) => {
    // type: 'jewelry', 'car', 'property', etc.
    const owned = state.assets?.owned;
    const result = {};
    
    // Safety check for assets structure
    if (!owned) {
      return result;
    }
    
    // Handle legacy structure (assets.owned is an array)
    if (Array.isArray(owned)) {
      owned.forEach(instance => {
        if (instance && typeof instance === 'object') {
          const asset = gameData.assets.find((a) => a.id === instance.id);
          if (asset && asset.type === type) {
            if (!result[instance.id]) result[instance.id] = [];
            result[instance.id].push(instance);
          }
        }
      });
      return result;
    }
    
    // Handle new city-based structure
    const citiesToCheck = city ? [city] : Object.keys(owned);
    
    citiesToCheck.forEach(cityName => {
      if (!owned[cityName]) return;
      
      for (const [id, arr] of Object.entries(owned[cityName])) {
        if (Array.isArray(arr)) {
          const asset = gameData.assets.find((a) => a.id === id);
          if (asset && asset.type === type) {
            if (!result[id]) result[id] = [];
            result[id].push(...arr);
          }
        }
      }
    });
    
    return result;
  };
  
  const getAllOwnedInstances = (type = null, city = null) => {
    const owned = state.assets?.owned;
    const allInstances = [];
    
    // Safety check for assets structure
    if (!owned) {
      return allInstances;
    }
    
    // Handle legacy structure (assets.owned is an array)
    if (Array.isArray(owned)) {
      owned.forEach(instance => {
        if (instance && typeof instance === 'object') {
          if (!type || instance.type === type) {
            allInstances.push(instance);
          }
        }
      });
      return allInstances;
    }
    
    // Handle new city-based structure
    const citiesToCheck = city ? [city] : Object.keys(owned);
    
    citiesToCheck.forEach(cityName => {
      if (!owned[cityName]) return;
      
      Object.values(owned[cityName]).forEach(instances => {
        if (Array.isArray(instances)) {
          instances.forEach(instance => {
            if (instance && typeof instance === 'object') {
              if (!type || instance.type === type) {
                allInstances.push(instance);
              }
            }
          });
        }
      });
    });
    
    return allInstances;
  };
  
  const getWornJewelry = () => {
    return state.assets?.wearing?.jewelry || [];
  };
  
  /**
   * Returns a summary of the player's assets.
   * @returns {{ totalValue: number, flexScore: number, totalAssets: number }}
   */
  const getAssetSummary = () => {
    let totalValue = 0;
    let flexScore = 0;
    let totalAssets = 0;
    
    // Safety check for assets structure
    if (!state.assets || !state.assets.owned) {
      return { totalValue, flexScore, totalAssets };
    }
    
    // Handle both old and new data structures
    if (Array.isArray(state.assets.owned)) {
      // Legacy structure - assets.owned is an array
      for (const inst of state.assets.owned) {
        if (inst && typeof inst === 'object') {
          totalValue += inst.resaleValue || 0;
          flexScore += inst.flexScore || 0;
          totalAssets++;
        }
      }
    } else {
      // New city-based structure
      for (const cityAssets of Object.values(state.assets.owned)) {
        if (cityAssets && typeof cityAssets === 'object') {
          for (const instances of Object.values(cityAssets)) {
            if (Array.isArray(instances)) {
              for (const inst of instances) {
                if (inst && typeof inst === 'object') {
                  totalValue += inst.resaleValue || 0;
                  flexScore += inst.flexScore || 0;
                  totalAssets++;
                }
              }
            }
          }
        }
      }
    }
    
    return { totalValue, flexScore, totalAssets };
  };
  
  /**
   * Get assets owned in a specific city
   * @param {string} city
   * @returns {Object} - Returns arrays of asset instances by asset ID for the specified city
   */
  const getAssetsInCity = (city) => {
    return getOwnedAssets(null, city);
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
    const totalInCity = (state.gunsByCity && state.gunsByCity[city]) || 0;
    let assignedInCity = 0;
    const cityBases = (state.bases && state.bases[city]) || [];
    (cityBases).forEach((base) => {
      assignedInCity += base.guns || 0;
    });
    return Math.max(0, totalInCity - assignedInCity);
  }

  // --- Raid System Integration ---
  const raidSystemRef = React.useRef(null);
  const baseDefenseSystemRef = React.useRef(null);
  
  // Initialize RaidSystem only once
  React.useEffect(() => {
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
        updateWarrant: (amount) => {
          dispatch({ type: 'UPDATE_WARRANT', amount });
        },
        trackAchievement: () => {}, // stub
        addNotification: (msg, type) => addNotification(msg, type),
        getCityRaidActivity: (city) => getCityRaidActivity(city),
        getCash: () => state.cash || 0,
        removeGangMembersFromCity: (city, amount) => {
          // Remove gang members from the specified city
          const currentGang = state.gangMembers[city] || 0;
          const newGang = Math.max(0, currentGang - amount);
          dispatch({
            type: 'UPDATE_GANG_MEMBERS',
            city,
            amount: newGang - currentGang // Negative amount to reduce
          });
        },
        removeGunsFromCity: (city, amount) => {
          // Remove guns from the specified city
          const currentGuns = state.gunsByCity[city] || 0;
          const newGuns = Math.max(0, currentGuns - amount);
          dispatch({
            type: 'UPDATE_GUNS_BY_CITY',
            city,
            amount: newGuns - currentGuns // Negative amount to reduce
          });
        },
        incrementCityRaidActivity: (city) => {
          const currentActivity = getCityRaidActivity(city);
          const newActivity = {
            count: currentActivity.count + 1,
            lastRaid: Date.now()
          };
          dispatch({
            type: 'UPDATE_CITY_RAID_ACTIVITY',
            city,
            activity: newActivity
          });
        },
      };
      raidSystemRef.current = new PlayerRaidSystem(raidState, events, gameData);
      
      // Initialize BaseDefenseSystem
      const baseDefenseState = {
        get: (key) => state[key],
        getCash: () => state.cash,
        getGangMembersInCity: (city) => state.gangMembers[city] || 0,
        getGunsInCity: (city) => state.gunsByCity[city] || 0,
        updateGangMembersInCity: (city, amount) => {
          dispatch({
            type: 'UPDATE_GANG_MEMBERS',
            city,
            amount: amount - (state.gangMembers[city] || 0)
          });
        },
        updateGunsInCity: (city, amount) => {
          dispatch({
            type: 'UPDATE_GUNS_BY_CITY',
            city,
            amount: amount - (state.gunsByCity[city] || 0)
          });
        },
        getCityRaidActivity: (city) => getCityRaidActivity(city),
        addNotification: (message, type) => {
          addNotification(message, type);
        },
        updateBaseInventory: (baseId, city, drug, amount) => {
          dispatch({
            type: 'UPDATE_BASE_INVENTORY',
            baseId,
            city,
            drug,
            amount
          });
        },
        updateBaseCash: (baseId, city, amount) => {
          dispatch({
            type: 'UPDATE_BASE_CASH',
            baseId,
            city,
            amount
          });
        }
      };
      
      const baseDefenseEvents = {
        add: (message, type) => {
          addNotification(message, type);
        }
      };
      
      baseDefenseSystemRef.current = new BaseDefenseSystem(baseDefenseState, baseDefenseEvents, gameData);
    }
  }, []); // Empty dependency array ensures this runs only once
  
  // Periodic base raid checks
  React.useEffect(() => {
    if (!baseDefenseSystemRef.current) return;
    
    // Check for base raids every 30 seconds
    const interval = setInterval(() => {
      checkForBaseRaids();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []); // Empty dependency array - effect runs once and checks ref inside
  
  const raidSystem = raidSystemRef.current;
  const baseDefenseSystem = baseDefenseSystemRef.current;

  // --- Raid Selectors & Actions (using RaidSystem) ---
  function getAvailableRaidTargets(city) {
    // Return all targets, including those on cooldown - the UI will handle displaying them properly
    if (!raidSystemRef.current) {
      return [];
    }
    return raidSystemRef.current.enemyBases[city] || [];
  }
  function executeRaid(targetId, raidGangSize, city) {
    if (!raidSystemRef.current) {
      return { success: false, error: 'Raid system not ready' };
    }
    // The RaidSystem will handle cooldown and all logic
    const result = raidSystemRef.current.executeRaid(targetId, raidGangSize);
    
    return result;
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
    // Return all targets, including those on cooldown - the UI will handle displaying them properly
    if (!raidSystemRef.current) {
      return [];
    }
    const allTargets = raidSystemRef.current.enemyBases[city] || [];
    return allTargets;
  }
  function isRaidTargetOnCooldown(target) {
    const currentTime = Date.now();
    const cooldownPeriod = 5 * 60 * 1000;
    const isOnCooldown = (currentTime - target.lastRaid) < cooldownPeriod;
    return isOnCooldown;
  }

  // --- Utility: Raid Activity ---
  function getCityRaidActivity(city) {
    if (!state.cityRaidActivity || !state.cityRaidActivity[city]) {
      return { count: 0, lastRaid: 0 };
    }
    return state.cityRaidActivity[city];
  }

  function incrementCityRaidActivity(city) {
    const currentActivity = getCityRaidActivity(city);
    const newActivity = {
      count: currentActivity.count + 1,
      lastRaid: Date.now()
    };
    dispatch({
      type: 'UPDATE_CITY_RAID_ACTIVITY',
      city,
      activity: newActivity
    });
  }

  // --- Base Defense System Integration ---
  function checkForBaseRaids() {
    if (!baseDefenseSystemRef.current) {
      console.warn('[BASE DEFENSE DEBUG] BaseDefenseSystem not initialized yet');
      return;
    }
    baseDefenseSystemRef.current.checkForBaseRaids();
  }

  function executeBaseRaid(baseId) {
    if (!baseDefenseSystemRef.current) {
      console.warn('[BASE DEFENSE DEBUG] BaseDefenseSystem not initialized yet');
      return { success: false, error: 'Base defense system not ready' };
    }
    return baseDefenseSystemRef.current.executeBaseRaid(baseId);
  }

  function calculateBaseRaidProbability(city, base) {
    if (!baseDefenseSystemRef.current) {
      console.warn('[BASE DEFENSE DEBUG] BaseDefenseSystem not initialized yet');
      return 0;
    }
    return baseDefenseSystemRef.current.calculateRaidProbability(city, base);
  }

  // --- Utility: Base Check ---
  function hasBaseInCity(city) {
    return state.bases[city] && state.bases[city].length > 0;
  }

  // --- Base Upgrade Function with Heat Warnings ---
  function upgradeBase(baseId, oldLevel, newLevel, city) {
    dispatch({
      type: 'UPGRADE_BASE',
      baseId,
      oldLevel,
      newLevel,
      city
    });
  }

  // --- Heat System Integration ---
  function calculateHeatLevel() {
    const warrantHeat = Math.min((state.warrant || 0) / 10000, 50);
    const timeHeat = Math.max(0, (state.daysInCurrentCity || 1) - 3) * 5;
    
    // Add gang retaliation heat based on raid activity
    const currentCity = state.currentCity;
    const cityRaidActivity = getCityRaidActivity(currentCity);
    const raidCount = cityRaidActivity.count || 0;
    const gangRetaliationHeat = Math.min(30, raidCount * 8);
    
    // Add base and gang heat
    const bases = state.bases || {};
    const gangMembers = state.gangMembers || {};
    let baseGangHeat = 0;
    
    // Calculate heat from bases
    Object.values(bases).forEach(cityBases => {
      if (Array.isArray(cityBases)) {
        cityBases.forEach(base => {
          if (base && base.level) {
            // Base heat: 2% per level, max 20% per base
            const baseHeat = Math.min(20, base.level * 2);
            baseGangHeat += baseHeat;
            
            // Additional heat for Drug Fortress (level 4)
            if (base.level >= 4) {
              baseGangHeat += 10;
            }
          }
        });
      }
    });
    
    // Calculate heat from gang members
    const totalGangMembers = Object.values(gangMembers).reduce((sum, count) => sum + (count || 0), 0);
    const gangHeat = Math.min(25, Math.floor(totalGangMembers / 10) * 0.5);
    baseGangHeat += gangHeat;
    
    // Additional heat for large gangs
    if (totalGangMembers >= 50) {
      baseGangHeat += 5;
    }
    if (totalGangMembers >= 100) {
      baseGangHeat += 10;
    }
    
    const totalHeat = warrantHeat + timeHeat + gangRetaliationHeat + Math.min(50, baseGangHeat);
    return Math.min(100, totalHeat);
  }

  function getHeatBreakdown() {
    const warrantHeat = Math.min((state.warrant || 0) / 10000, 50);
    const timeHeat = Math.max(0, (state.daysInCurrentCity || 1) - 3) * 5;
    
    const currentCity = state.currentCity;
    const cityRaidActivity = getCityRaidActivity(currentCity);
    const raidCount = cityRaidActivity.count || 0;
    const gangRetaliationHeat = Math.min(30, raidCount * 8);
    
    const bases = state.bases || {};
    const gangMembers = state.gangMembers || {};
    const totalGangMembers = Object.values(gangMembers).reduce((sum, count) => sum + (count || 0), 0);
    
    const baseHeatDetails = [];
    Object.values(bases).forEach(cityBases => {
      if (Array.isArray(cityBases)) {
        cityBases.forEach(base => {
          if (base && base.level) {
            const baseHeat = Math.min(20, base.level * 2);
            let fortressBonus = 0;
            if (base.level >= 4) {
              fortressBonus = 10;
            }
            baseHeatDetails.push({
              city: base.city,
              level: base.level,
              baseHeat: baseHeat,
              fortressBonus: fortressBonus,
              totalHeat: baseHeat + fortressBonus
            });
          }
        });
      }
    });
    
    const gangHeat = Math.min(25, Math.floor(totalGangMembers / 10) * 0.5);
    let largeGangBonus = 0;
    let massiveGangBonus = 0;
    
    if (totalGangMembers >= 100) {
      massiveGangBonus = 10;
    } else if (totalGangMembers >= 50) {
      largeGangBonus = 5;
    }
    
    const baseGangHeat = baseHeatDetails.reduce((sum, detail) => sum + detail.totalHeat, 0) + gangHeat + largeGangBonus + massiveGangBonus;
    
    return {
      warrantHeat: Math.round(warrantHeat),
      timeHeat: Math.round(timeHeat),
      gangRetaliationHeat: Math.round(gangRetaliationHeat),
      baseGangHeat: Math.round(baseGangHeat),
      totalHeat: Math.round(warrantHeat + timeHeat + gangRetaliationHeat + baseGangHeat),
      breakdown: {
        warrantHeat,
        timeHeat,
        gangRetaliationHeat,
        baseGangHeat,
        baseHeatDetails,
        gangHeat: {
          totalMembers: totalGangMembers,
          baseHeat: gangHeat,
          largeGangBonus,
          massiveGangBonus,
          totalHeat: gangHeat + largeGangBonus + massiveGangBonus
        }
      }
    };
  }

  function calculateNetWorth() {
    // Calculate cash
    const cash = state.cash || 0;
    
    // Calculate inventory value
    let inventoryValue = 0;
    Object.entries(state.inventory || {}).forEach(([drug, amount]) => {
      const drugData = gameData.drugs[drug];
      if (drugData && amount > 0) {
        // Use average price across all cities for inventory valuation
        const avgPrice = Object.values(state.cityPrices || {}).reduce((sum, cityPrices) => {
          return sum + (cityPrices[drug] || 0);
        }, 0) / Math.max(1, Object.keys(state.cityPrices || {}).length);
        inventoryValue += (amount || 0) * avgPrice;
      }
    });
    
    // Calculate assets value
    const assetSummary = getAssetSummary();
    const assetsValue = assetSummary.totalValue;
    
    // Calculate bases value (if any)
    let basesValue = 0;
    Object.values(state.bases || {}).forEach(cityBases => {
      if (Array.isArray(cityBases)) {
        cityBases.forEach(base => {
          if (base && base.level) {
            // Base value increases with level
            basesValue += base.level * 10000; // 10k per level
          }
        });
      }
    });
    
    return Math.round(cash + inventoryValue + assetsValue + basesValue);
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
    incrementCityRaidActivity,
    hasBaseInCity,
    showModal,
    hideModal,
    modalContent,
    upgradeBase,
    calculateHeatLevel,
    getHeatBreakdown,
    checkForBaseRaids,
    executeBaseRaid,
    calculateBaseRaidProbability,
    calculateNetWorth
  };

  return (
    <GameContext.Provider value={value}>
      {children}
      {/* Global Modal */}
      {modalContent.isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            style={{
              background: '#222',
              color: '#fff',
              borderRadius: '10px',
              padding: '24px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflow: 'auto',
              boxShadow: '0 4px 32px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div style={{
                fontWeight: 'bold',
                fontSize: '1.2em',
                color: modalContent.type === 'error' ? '#ff6666' : 
                       modalContent.type === 'success' ? '#66ff66' : 
                       modalContent.type === 'warning' ? '#ffcc66' : '#66ccff'
              }}>
                {modalContent.title}
              </div>
              <button
                onClick={hideModal}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.5em',
                  cursor: 'pointer',
                  padding: '0',
                  width: '30px',
                  height: '30px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
            <div 
              style={{ marginTop: '8px' }}
              dangerouslySetInnerHTML={{ __html: modalContent.content }}
            />
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <button
                onClick={hideModal}
                className="action-btn"
                style={{
                  background: modalContent.type === 'error' ? '#ff6666' : 
                             modalContent.type === 'success' ? '#66ff66' : 
                             modalContent.type === 'warning' ? '#ffcc66' : '#66ccff'
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </GameContext.Provider>
  );
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