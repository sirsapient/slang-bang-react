export interface GameData {
  drugs: Record<string, {
    basePrice: number;
    volatility: number;
  }>;
  cities: Record<string, {
    heatModifier: number;
  }>;
}

export declare const gameData: GameData; 