import React from 'react';

export interface GameState {
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
  gangMembers: Record<string, any>;
  gunsByCity: Record<string, number>;
  citySupply: Record<string, Record<string, number>>;
  cityPrices: Record<string, Record<string, number>>;
  lastPurchase: Record<string, any>;
  saveVersion: string;
  lastSaved: number;
  notifications: Array<any>;
  cityRaidActivity: Record<string, { count: number; lastRaid: number }>;
  achievements: {
    unlocked: string[];
    progress: {
      totalRaids: number;
      successfulRaids: number;
      totalEarnings: number;
      basesOwned: number;
      assetsOwned: number;
      drugsSold: number;
      daysSurvived: number;
      citiesVisited: number;
      maxNetWorth: number;
      maxHeatSurvived: number;
    };
  };
  assets: {
    owned: Record<string, any>;
    wearing: { jewelry: string[] };
  };
}

export interface GameContextType {
  state: GameState;
  updateCash: (amount: number) => void;
  updateInventory: (drug: string, amount: number) => void;
  buyDrug: (drug: string, amount: number, price: number) => void;
  sellDrug: (drug: string, amount: number, price: number) => void;
  travelToCity: (city: string) => void;
  regeneratePrices: () => void;
  resetGame: () => void;
  sellAllDrugs: () => void;
  buyAsset: (assetId: string) => void;
  sellAsset: (instanceId: string) => void;
  wearJewelry: (instanceId: string) => void;
  removeJewelry: (instanceId: string) => void;
  getOwnedAssets: (type: string, city?: string) => any[];
  getAllOwnedInstances: (type?: string, city?: string) => any[];
  getWornJewelry: () => any[];
  getAssetSummary: () => any;
  getAssetsInCity: (city: string) => any[];
  getNotifications: () => any[];
  getUnreadNotifications: () => any[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotifications: () => void;
  addNotification: (message: string, nType?: string) => void;
  getAvailableGangMembers: () => any[];
  getAvailableGangMembersInCity: (city: string) => any[];
  getAvailableGunsInCity: (city: string) => number;
  getAvailableRaidTargets: (city: string) => any[];
  executeRaid: (targetId: string, raidGangSize: number, city: string) => any;
  calculateRaidSuccess: (raidGangSize: number, guns: number, difficulty: number, enemyGang: number) => number;
  getDifficultyColor: (difficulty: number) => string;
  getDifficultyText: (difficulty: number) => string;
  getAllRaidTargets: (city: string) => any[];
  isRaidTargetOnCooldown: (target: any) => boolean;
  getCityRaidActivity: (city: string) => any;
  incrementCityRaidActivity: (city: string) => void;
  checkForBaseRaids: () => void;
  executeBaseRaid: (baseId: string) => any;
  calculateBaseRaidProbability: (city: string, base: any) => number;
  hasBaseInCity: (city: string) => boolean;
  upgradeBase: (baseId: string, oldLevel: number, newLevel: number, city: string) => void;
  calculateHeatLevel: () => void;
  getHeatBreakdown: () => any;
  calculateNetWorth: () => number;
  showModal: (title: string, content: React.ReactNode, type?: string) => void;
  hideModal: () => void;
}

export declare const GameProvider: React.FC<{ children: React.ReactNode }>;
export declare const useGame: () => GameContextType;
export declare const useCash: () => number;
export declare const useInventory: () => Record<string, number>;
export declare const useCurrentCity: () => string; 