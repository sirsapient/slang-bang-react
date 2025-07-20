import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { gameState } from '../game/gameState';
import { gameData } from '../game/data/gameData';
import { HeatSystem } from '../game/systems/heat';
import { TradingSystem } from '../game/systems/trading';
import { BaseSystem } from '../game/systems/base';
import { AssetSystem } from '../game/systems/assets';
import { AssetDropSystem } from '../game/systems/assetDrop';
import { RaidSystem } from '../game/systems/raid';
import { EventLogger } from '../game/ui/events';

interface GameSystems {
  heat: HeatSystem;
  trading: TradingSystem;
  bases: BaseSystem;
  assets: AssetSystem;
  assetDrop: AssetDropSystem;
  raid: RaidSystem;
}

interface GameContextType {
  state: any; // This will be the reactive state
  systems: GameSystems;
  events: EventLogger;
  dispatch: React.Dispatch<any>;
  updateGameState: (key: string, value: any) => void;
  refreshUI: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

// Action types
const GAME_ACTIONS = {
  UPDATE_STATE: 'UPDATE_STATE',
  UPDATE_CASH: 'UPDATE_CASH',
  UPDATE_INVENTORY: 'UPDATE_INVENTORY',
  UPDATE_WARRANT: 'UPDATE_WARRANT',
  UPDATE_GANG: 'UPDATE_GANG',
  UPDATE_CITY: 'UPDATE_CITY',
  FORCE_REFRESH: 'FORCE_REFRESH',
  BATCH_UPDATE: 'BATCH_UPDATE'
};

// Reducer to handle state updates
function gameReducer(state: any, action: any) {
  switch (action.type) {
    case GAME_ACTIONS.UPDATE_STATE:
      return {
        ...state,
        [action.key]: action.value,
        lastUpdate: Date.now()
      };
    case GAME_ACTIONS.UPDATE_CASH:
      return {
        ...state,
        cash: Math.max(0, state.cash + action.amount),
        lastUpdate: Date.now()
      };
    case GAME_ACTIONS.UPDATE_INVENTORY:
      return {
        ...state,
        inventory: {
          ...state.inventory,
          [action.drug]: Math.max(0, (state.inventory[action.drug] || 0) + action.amount)
        },
        lastUpdate: Date.now()
      };
    case GAME_ACTIONS.UPDATE_WARRANT:
      return {
        ...state,
        warrant: Math.max(0, state.warrant + action.amount),
        lastUpdate: Date.now()
      };
    case GAME_ACTIONS.UPDATE_GANG:
      return {
        ...state,
        gangSize: Math.max(0, state.gangSize + action.amount),
        lastUpdate: Date.now()
      };
    case GAME_ACTIONS.UPDATE_CITY:
      return {
        ...state,
        currentCity: action.city,
        daysInCurrentCity: 1,
        daysSinceTravel: 0,
        lastTravelDay: state.day,
        lastUpdate: Date.now()
      };
    case GAME_ACTIONS.FORCE_REFRESH:
      return {
        ...state,
        lastUpdate: Date.now()
      };
    case GAME_ACTIONS.BATCH_UPDATE:
      return {
        ...state,
        ...action.updates,
        lastUpdate: Date.now()
      };
    default:
      return state;
  }
}

export function GameProvider({ children }: { children: React.ReactNode }) {
  // Initialize systems
  const events = new EventLogger();
  const systems: GameSystems = {
    heat: new HeatSystem(gameState, events),
    trading: new TradingSystem(gameState, events, gameData),
    bases: new BaseSystem(gameState, events, gameData),
    assets: new AssetSystem(gameState, events, gameData),
    assetDrop: new AssetDropSystem(gameState, events, gameData),
    raid: new RaidSystem(gameState, events, gameData)
  };

  // Initialize React state with gameState data
  const [state, dispatch] = useReducer(gameReducer, {
    ...gameState.data,
    cityPrices: gameState.cityPrices || {},
    lastUpdate: Date.now()
  });

  // Sync React state back to gameState
  // useEffect(() => {
  //   // Update gameState.data when React state changes
  //   Object.keys(state).forEach(key => {
  //     if (key !== 'lastUpdate' && key !== 'cityPrices') {
  //       gameState.data[key] = state[key];
  //     }
  //   });
  //   // Update cityPrices separately
  //   if (state.cityPrices) {
  //     gameState.cityPrices = state.cityPrices;
  //   }
  // }, [state]);

  // Override gameState methods to use React dispatch
  useEffect(() => {
    const originalUpdateCash = gameState.updateCash.bind(gameState);
    const originalUpdateInventory = gameState.updateInventory.bind(gameState);
    const originalUpdateWarrant = gameState.updateWarrant.bind(gameState);
    const originalUpdateGangSize = gameState.updateGangSize.bind(gameState);
    const originalTravelToCity = gameState.travelToCity.bind(gameState);
    const originalSet = gameState.set.bind(gameState);

    // Override methods to dispatch React actions
    gameState.updateCash = (amount: number) => {
      originalUpdateCash(amount);
      dispatch({ type: GAME_ACTIONS.UPDATE_CASH, amount });
    };
    gameState.updateInventory = (drug: string, amount: number) => {
      originalUpdateInventory(drug, amount);
      dispatch({ type: GAME_ACTIONS.UPDATE_INVENTORY, drug, amount });
    };
    gameState.updateWarrant = (amount: number) => {
      originalUpdateWarrant(amount);
      dispatch({ type: GAME_ACTIONS.UPDATE_WARRANT, amount });
    };
    gameState.updateGangSize = (amount: number) => {
      originalUpdateGangSize(amount);
      dispatch({ type: GAME_ACTIONS.UPDATE_GANG, amount });
    };
    gameState.travelToCity = (city: string) => {
      originalTravelToCity(city);
      dispatch({ type: GAME_ACTIONS.UPDATE_CITY, city });
    };
    gameState.set = (key: string, value: any) => {
      originalSet(key, value);
      dispatch({ type: GAME_ACTIONS.UPDATE_STATE, key, value });
    };
    // Add a method to force React updates
    (gameState as any).forceReactUpdate = () => {
      dispatch({ type: GAME_ACTIONS.FORCE_REFRESH });
    };
    // Cleanup
    return () => {
      gameState.updateCash = originalUpdateCash;
      gameState.updateInventory = originalUpdateInventory;
      gameState.updateWarrant = originalUpdateWarrant;
      gameState.updateGangSize = originalUpdateGangSize;
      gameState.travelToCity = originalTravelToCity;
      gameState.set = originalSet;
    };
  }, []);

  const updateGameState = useCallback((key: string, value: any) => {
    gameState.set(key, value);
    dispatch({ type: GAME_ACTIONS.UPDATE_STATE, key, value });
  }, []);

  const refreshUI = useCallback(() => {
    dispatch({ type: GAME_ACTIONS.FORCE_REFRESH });
  }, []);

  const contextValue: GameContextType = {
    state,
    systems,
    events,
    dispatch,
    updateGameState,
    refreshUI
  };

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  );
}

// Custom hook to use game context
export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
}

// Custom hooks for specific game data
export function useCash() {
  const { state } = useGame();
  return state.cash || 0;
}

export function useInventory() {
  const { state } = useGame();
  return state.inventory || {};
}

export function useCurrentCity() {
  const { state } = useGame();
  return state.currentCity || 'New York';
}

export function useHeatLevel() {
  const { state, systems } = useGame();
  return systems.heat.calculateHeatLevel();
}

export function useNetWorth() {
  const { state } = useGame();
  return gameState.calculateNetWorth();
} 