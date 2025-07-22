export declare const gameData: any;

declare module '../game/data/gameData';
declare module '../game/systems/base';

export interface IBaseSystem {
  calculateBaseCost(city: string): number;
  purchaseBase(city: string): { success: boolean; error?: string };
  createEmptyInventory(): Record<string, number>;
  assignGangToBase(city: string, amount: number): { success: boolean; error?: string };
  removeGangFromBase(city: string, amount: number): { success: boolean; error?: string };
  updateBaseOperationalStatus(city: string): void;
  getBaseDrugCount(base: any): number;
  calculateBaseIncome(base: any): number;
  getBaseEfficiencyBonus(base: any): number;
  generateDailyIncome(): void;
  collectBaseIncome(city: string): { success: boolean; error?: string };
  collectAllBaseCash(): { success: boolean; error?: string; totalCollected?: number };
  upgradeBase(city: string): { success: boolean; error?: string };
  storeDrugsInBase(city: string, drug: string, amount: number): { success: boolean; error?: string };
  takeDrugsFromBase(city: string, drug: string, amount: number): { success: boolean; error?: string };
  assignGunsToBase(city: string, amount: number): { success: boolean; error?: string };
  removeGunsFromBase(city: string, amount: number): { success: boolean; error?: string };
  buyGunsForBase(city: string, amount?: number): boolean;
  calculateTotalDailyIncome(): number;
  getBaseSummary(): any;
  processRealTimeSales(): void;
  checkForBaseRaids(): void;
  executeBaseRaid(base: any): void;
}

export interface Base {
  id: string;
  city: string;
  type: string;
  level: number;
  assignedGang: number;
  drugStorage: number;
  operational: boolean;
  cashStored: number;
  lastCollection: number;
  lastCollected?: number;
  guns: number;
  income: number;
  capacity: number;
  inventory: Record<string, number>;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  cost: number;
  resaleValue: number;
  flexScore: number;
  // Add other fields as needed
  cityPurchased?: string;
  storagePropertyId?: string; // property instanceId if stored
}

export interface AssetInstance extends Asset {
  instanceId: string;
  purchaseDate: number;
  purchasePrice: number;
  resaleValue: number;
  flexScore: number;
  name: string;
  type: string;
  cityPurchased: string;
  storagePropertyId?: string;
  [key: string]: any;
}

export interface Notification {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  day: number;
  timestamp: number;
  read: boolean;
}

export interface IGameState {
  getBase(city: string): Base | null;
  get(key: string): any;
  updateCash(amount: number): void;
  canAfford(amount: number): boolean;
  addBase(city: string, baseData: Base): void;
  updateInventory(drug: string, amount: number): void;
  addNotification(message: string, type: string): void;
  getAvailableGangMembersInCity?(city: string): number;
  getAvailableGunsInCity?(city: string): number;
  removeGunsFromCity?(city: string, amount: number): void;
  addGunsToCity?(city: string, amount: number): void;
  getInventory?(drug: string): number;
  data: any;
  cityPrices?: any;
  // Add more as needed
}

export interface IEventLogger {
  add(message: string, type: string): void;
}

export interface IGameData {
  baseTypes: any;
  cities: any;
  drugs: any;
  config: any;
  // Add more as needed
}

export declare class BaseSystem implements IBaseSystem {
  constructor(
    gameState: IGameState,
    eventLogger: IEventLogger,
    gameData: IGameData
  );
  calculateBaseCost(city: string): number;
  purchaseBase(city: string): { success: boolean; error?: string };
  createEmptyInventory(): Record<string, number>;
  assignGangToBase(city: string, amount: number): { success: boolean; error?: string };
  removeGangFromBase(city: string, amount: number): { success: boolean; error?: string };
  updateBaseOperationalStatus(city: string): void;
  getBaseDrugCount(base: any): number;
  calculateBaseIncome(base: any): number;
  getBaseEfficiencyBonus(base: any): number;
  generateDailyIncome(): void;
  collectBaseIncome(city: string): { success: boolean; error?: string };
  collectAllBaseCash(): { success: boolean; error?: string; totalCollected?: number };
  upgradeBase(city: string): { success: boolean; error?: string };
  storeDrugsInBase(city: string, drug: string, amount: number): { success: boolean; error?: string };
  takeDrugsFromBase(city: string, drug: string, amount: number): { success: boolean; error?: string };
  assignGunsToBase(city: string, amount: number): { success: boolean; error?: string };
  removeGunsFromBase(city: string, amount: number): { success: boolean; error?: string };
  buyGunsForBase(city: string, amount?: number): boolean;
  calculateTotalDailyIncome(): number;
  getBaseSummary(): any;
  processRealTimeSales(): void;
  checkForBaseRaids(): void;
  executeBaseRaid(base: any): void;
}

// --- System Constructor Argument Interfaces ---
export interface IHeatSystemGameState {
  get(key: string): any;
  updateWarrant(amount: number): void;
  updateInventory(drug: string, amount: number): void;
  updateCash(amount: number): void;
  set(key: string, value: any): void;
  getTotalInventory(): number;
  getRaidLossLast24h?(): number;
  addRaidLoss?(amount: number): void;
  canAfford(amount: number): boolean;
  addNotification(message: string, type: string): void;
  // ...add more as needed
}
export interface IHeatSystemEventLogger {
  add(message: string, type: string): void;
}

export declare class HeatSystem {
  constructor(gameState: IHeatSystemGameState, eventLogger: IHeatSystemEventLogger);
}

export interface IRaidSystemGameState {
  get(key: string): any;
  updateCash(amount: number): void;
  updateInventory(drug: string, amount: number): void;
  updateWarrant(amount: number): void;
  addNotification(message: string, type: string): void;
  getAvailableGangMembersInCity(city: string): number;
  getAvailableGunsInCity(city: string): number;
  trackAchievement?(id: string, value?: number): void;
  incrementCityRaidActivity?(city: string): void;
  // ...add more as needed
}
export interface IRaidSystemEventLogger {
  add(message: string, type: string): void;
}
export interface IRaidSystemGameData {
  baseTypes: any;
  cities: any;
  drugs: any;
  config: any;
  playerRanks?: any;
  // ...add more as needed
}
export declare class RaidSystem {
  constructor(state: IRaidSystemGameState, events: IRaidSystemEventLogger, data: IRaidSystemGameData);
}

export interface ITradingSystemGameState {
  get(key: string): any;
  updateCash(amount: number): void;
  updateInventory(drug: string, amount: number): void;
  canAfford(amount: number): boolean;
  addNotification(message: string, type: string): void;
  data: any;
  cityPrices: any;
  emit?(event: string, data?: any): void;
  // ...add more as needed
}
export interface ITradingSystemEventLogger {
  add(message: string, type: string): void;
}
export interface ITradingSystemGameData {
  baseTypes: any;
  cities: any;
  drugs: any;
  config: any;
  // ...add more as needed
}
export declare class TradingSystem {
  constructor(gameState: ITradingSystemGameState, eventLogger: ITradingSystemEventLogger, gameData: ITradingSystemGameData);
}

export interface IAssetSystemGameState {
  get(key: string): any;
  updateCash(amount: number): void;
  data: any;
  // ...add more as needed
}
export interface IAssetSystemEventLogger {
  add(message: string, type: string): void;
}
export interface IAssetSystemGameData {
  assets: any;
  config: any;
  playerRanks?: any;
  // ...add more as needed
}
export declare class AssetSystem {
  constructor(gameState: IAssetSystemGameState, eventLogger: IAssetSystemEventLogger, gameData: IAssetSystemGameData);
}

export interface IAssetDropSystemGameState {
  get(key: string): any;
  updateCash(amount: number): void;
  data: any;
  // ...add more as needed
}
export interface IAssetDropSystemEventLogger {
  add(message: string, type: string): void;
}
export interface IAssetDropSystemGameData {
  assets: any;
  cities: any;
  // ...add more as needed
}
export declare class AssetDropSystem {
  constructor(gameState: IAssetDropSystemGameState, eventLogger: IAssetDropSystemEventLogger, gameData: IAssetDropSystemGameData);
} 