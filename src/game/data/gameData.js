// js/data/gameData.js - All game constants and configuration data

/**
 * @typedef {Object} PlayerRank
 * @property {string} name
 * @property {number} minNetWorth
 * @property {number} minBases
 * @property {number} minGang
 * @property {string} emoji
 * @property {string} color
 */

/**
 * @typedef {Object} Asset
 * @property {string} id
 * @property {string} name
 * @property {string} type
 * @property {number} cost
 * @property {number} resaleValue
 * @property {number} flexScore
 * @property {number} [storageSize]
 * @property {Object} [capacity]
 * @property {string} description
 * @property {number} tier - Asset tier (1-3, higher = more expensive)
 * @property {number} unlockRank - Minimum player rank required to unlock
 */

/**
 * @typedef {Object} City
 * @property {string} population
 * @property {number} heatModifier
 * @property {number} distanceIndex
 */

/**
 * @typedef {Object} Drug
 * @property {number} basePrice
 * @property {number} volatility
 * @property {number} heatGeneration
 */

/**
 * @typedef {Object} BaseType
 * @property {string} name
 * @property {number} cost
 * @property {number} income
 * @property {number} gangRequired
 * @property {number|null} upgradeCost
 * @property {number} maxInventory
 * @property {number} maxSafe
 */

/**
 * @typedef {Object} GameData
 * @property {Object.<string, City>} cities
 * @property {Object.<string, Drug>} drugs
 * @property {Object.<number, BaseType>} baseTypes
 * @property {Object.<number, PlayerRank>} playerRanks
 * @property {Object} config
 * @property {Array} gangTiers
 * @property {Array.<Asset>} assets
 */

/** @type {GameData} */
export const gameData = {
    // Cities configuration
    cities: {
        'New York': { 
            population: '8.3M', 
            heatModifier: 1.2,
            distanceIndex: 0
        },
        'Los Angeles': { 
            population: '4.0M', 
            heatModifier: 1.1,
            distanceIndex: 7
        },
        'Chicago': { 
            population: '2.7M', 
            heatModifier: 1.3,
            distanceIndex: 3
        },
        'Houston': { 
            population: '2.3M', 
            heatModifier: 0.9,
            distanceIndex: 5
        },
        'Phoenix': { 
            population: '1.7M', 
            heatModifier: 0.8,
            distanceIndex: 6
        },
        'Philadelphia': { 
            population: '1.6M', 
            heatModifier: 1.1,
            distanceIndex: 1
        },
        'San Antonio': { 
            population: '1.5M', 
            heatModifier: 0.7,
            distanceIndex: 5
        },
        'San Diego': { 
            population: '1.4M', 
            heatModifier: 0.8,
            distanceIndex: 7
        },
        'Dallas': { 
            population: '1.3M', 
            heatModifier: 0.9,
            distanceIndex: 4
        },
        'Austin': { 
            population: '965K', 
            heatModifier: 0.8,
            distanceIndex: 5
        }
    },
    
    // Drug configuration
    drugs: {
        'Fentanyl': { 
            basePrice: 25000,
            volatility: 0.6,
            heatGeneration: 5
        },
        'Oxycontin': { 
            basePrice: 18000,
            volatility: 0.4,
            heatGeneration: 3
        },
        'Heroin': { 
            basePrice: 22000,
            volatility: 0.5,
            heatGeneration: 4
        },
        'Cocaine': { 
            basePrice: 20000,
            volatility: 0.5,
            heatGeneration: 4
        },
        'Weed': { 
            basePrice: 2000,
            volatility: 0.3,
            heatGeneration: 1
        },
        'Meth': { 
            basePrice: 15000,
            volatility: 0.4,
            heatGeneration: 3
        }
    },
    
    // Base types configuration
    baseTypes: {
        1: { 
            name: 'Trap House', 
            cost: 50000,
            income: 1000, 
            gangRequired: 4, 
            gunsRequired: 4, // Updated to match gang member min
            upgradeCost: 15000, 
            maxInventory: 60, // 10 per drug, 6 drugs
            maxSafe: 50000,
            maxCash: 25000, // Cash available for raiding
            capacity: 6 // Max gang members
        },
        2: { 
            name: 'Safe House', 
            cost: 65000,
            income: 2500, 
            gangRequired: 6, 
            gunsRequired: 6, // Updated to match gang member min
            upgradeCost: 40000, 
            maxInventory: 120, // 20 per drug
            maxSafe: 250000,
            maxCash: 50000, // Cash available for raiding
            capacity: 12
        },
        3: { 
            name: 'Distribution Center', 
            cost: 105000,
            income: 6000, 
            gangRequired: 10, 
            gunsRequired: 10, // Updated to match gang member min
            upgradeCost: 100000, 
            maxInventory: 240, // 40 per drug
            maxSafe: 500000,
            maxCash: 100000, // Cash available for raiding
            capacity: 24
        },
        4: { 
            name: 'Drug Fortress', 
            cost: 205000,
            income: 15000, 
            gangRequired: 15, 
            gunsRequired: 15, // Updated to match gang member min
            upgradeCost: null, 
            maxInventory: 480, // 80 per drug
            maxSafe: 1000000,
            maxCash: 200000, // Cash available for raiding
            capacity: 48
        }
    },
    
    // Player ranks
    playerRanks: {
        1: {
            name: 'Street Dealer',
            minNetWorth: 0,
            minBases: 0,
            minGang: 0,
            minAssets: 0,
            minLeveledBases: 0,
            emoji: '👤',
            color: '#888888'
        },
        2: {
            name: 'Corner Boss',
            minNetWorth: 25000,
            minBases: 1,
            minGang: 5,
            minAssets: 10000,
            minLeveledBases: 0,
            emoji: '🔫',
            color: '#996633'
        },
        3: {
            name: 'Block Captain',
            minNetWorth: 100000,
            minBases: 2,
            minGang: 15,
            minAssets: 25000,
            minLeveledBases: 0,
            emoji: '👔',
            color: '#6666ff'
        },
        4: {
            name: 'District Chief',
            minNetWorth: 500000,
            minBases: 3,
            minGang: 30,
            minAssets: 50000,
            minLeveledBases: 1,
            emoji: '🎯',
            color: '#9966ff'
        },
        5: {
            name: 'City Kingpin',
            minNetWorth: 1000000,
            minBases: 5,
            minGang: 50,
            minAssets: 100000,
            minLeveledBases: 2,
            emoji: '👑',
            color: '#ffaa00'
        },
        6: {
            name: 'Drug Lord',
            minNetWorth: 5000000,
            minBases: 7,
            minGang: 100,
            minAssets: 250000,
            minLeveledBases: 3,
            emoji: '💎',
            color: '#ff6600'
        },
        7: {
            name: 'Cartel Boss',
            minNetWorth: 10000000,
            minBases: 10,
            minGang: 200,
            minAssets: 500000,
            minLeveledBases: 4,
            emoji: '🏆',
            color: '#ff0066'
        },
        8: {
            name: 'Underworld Emperor',
            minNetWorth: 25000000,
            minBases: 12,
            minGang: 300,
            minAssets: 1000000,
            minLeveledBases: 5,
            emoji: '👑',
            color: '#00bfff'
        },
        9: {
            name: 'Shadow Syndicate',
            minNetWorth: 50000000,
            minBases: 15,
            minGang: 400,
            minAssets: 2000000,
            minLeveledBases: 6,
            emoji: '🕴️',
            color: '#8e44ad'
        },
        10: {
            name: 'Global Kingpin',
            minNetWorth: 100000000,
            minBases: 20,
            minGang: 500,
            minAssets: 5000000,
            minLeveledBases: 8,
            emoji: '🌎',
            color: '#e67e22'
        }
    },
    
    // Game configuration
    config: {
        // Starting values
        startingCash: 5000,
        startingCity: 'New York',
        
        // Time settings
        dayDuration: 60000, // 60 seconds
        autoSaveInterval: 10000, // 10 seconds
        
        // Travel settings
        baseTravelCost: 200,
        maxTravelCost: 800,
        travelHeatReduction: 0.4, // 40% warrant reduction
        
        // Heat and warrant settings
        baseHeatGeneration: 100,
        heatScalingFactor: 1.2, // Heat increases 20% per rank
        maxHeatPerRaid: 15000,
        
        // Raid settings
        baseRaidSuccessChance: 0.8,
        raidSuccessScaling: 0.95, // 5% harder per rank
        raidRewardScaling: 1.1, // 10% more rewards per rank
        
        // Gang recruitment scaling
        baseGangCost: 10000, // Base cost per gang member
        gangCostScaling: 0.1, // 10% more per gang member
        gangRecruitHeat: 50,
        gangHeatPerMember: 10, // Daily heat generated per gang member
        
        // Gun settings
        gunCost: 5000,
        
        // Base settings
        baseIncomeScaling: 1.15, // 15% more income per rank
        baseCollectionInterval: 5, // Days between collections
        baseIncomeBonus: 1.5, // 50% bonus when base has drugs
        
        // Market settings
        priceVolatility: 0.3,
        maxPriceMultiplier: 3.0,
        minPriceMultiplier: 0.3,
        
        // Asset settings
        assetFlexScoreMultiplier: 1.5, // Flex score increases with rank
        assetResaleValue: 0.9, // 90% resale value
        
        // Achievement settings
        achievementUnlockThresholds: {
            firstBase: 1,
            firstRaid: 1,
            firstAsset: 1,
            millionaire: 1000000,
            drugLord: 5000000,
            cartelBoss: 10000000
        }
    },
    
    // Gang tiers (for display purposes)
    gangTiers: [
        { 
            name: 'Street Soldiers', 
            range: [1, 5], 
            emoji: '🔫', 
            description: 'Basic operations' 
        },
        { 
            name: 'Lieutenants', 
            range: [6, 15], 
            emoji: '👤', 
            description: 'Enhanced operations' 
        },
        { 
            name: 'Crew Chiefs', 
            range: [16, 30], 
            emoji: '👔', 
            description: 'Base management' 
        },
        { 
            name: 'Underbosses', 
            range: [31, 50], 
            emoji: '🎯', 
            description: 'Territory control' 
        },
        { 
            name: 'Crime Family', 
            range: [51, 999], 
            emoji: '👑', 
            description: 'Empire operations' 
        }
    ],

    // Asset definitions (merged from assetsData.js)
    assets: [
        // JEWELRY
        {
            id: 'fake_chain', name: 'Fake Gold Chain', type: 'jewelry', cost: 2500, resaleValue: 2000, flexScore: 3, storageSize: 1, description: 'Looks real from a distance', tier: 1, unlockRank: 1
        },
        { id: 'silver_chain', name: 'Silver Chain', type: 'jewelry', cost: 5000, resaleValue: 4500, flexScore: 5, storageSize: 1, description: 'Basic but clean', tier: 1, unlockRank: 1 },
        { id: 'cuban_link', name: 'Cuban Link Chain', type: 'jewelry', cost: 10000, resaleValue: 9000, flexScore: 10, storageSize: 1, description: 'Classic street style', tier: 1, unlockRank: 1 },
        { id: 'gold_watch', name: 'Gold Watch', type: 'jewelry', cost: 12000, resaleValue: 10800, flexScore: 11, storageSize: 1, description: 'Time is money', tier: 1, unlockRank: 1 },
        { id: 'iced_watch', name: 'Iced Out Watch', type: 'jewelry', cost: 15000, resaleValue: 13500, flexScore: 12, storageSize: 1, description: 'Diamonds dancing on your wrist', tier: 1, unlockRank: 1 },
        { id: 'grillz', name: 'Gold Grillz', type: 'jewelry', cost: 7000, resaleValue: 6000, flexScore: 8, storageSize: 1, description: 'Smile worth a fortune', tier: 1, unlockRank: 1 },
        { id: 'diamond_earrings', name: 'Diamond Earrings', type: 'jewelry', cost: 8000, resaleValue: 7200, flexScore: 9, storageSize: 1, description: '2 carat studs', tier: 1, unlockRank: 1 },
        { id: 'iced_chain', name: 'Iced Out Chain', type: 'jewelry', cost: 25000, resaleValue: 22500, flexScore: 18, storageSize: 1, description: 'VVS diamonds everywhere', tier: 1, unlockRank: 1 },
        { id: 'pinky_ring', name: 'Diamond Pinky Ring', type: 'jewelry', cost: 20000, resaleValue: 18000, flexScore: 15, storageSize: 1, description: 'Boss status', tier: 1, unlockRank: 1 },
        { id: 'rolex', name: 'Rolex Submariner', type: 'jewelry', cost: 50000, resaleValue: 45000, flexScore: 25, storageSize: 1, description: 'Swiss precision meets street cred', tier: 1, unlockRank: 1 },
        // TIER 2 JEWELRY (Unlock at Rank 3)
        { id: 'diamond_chain', name: 'Diamond Chain', type: 'jewelry', cost: 75000, resaleValue: 67500, flexScore: 35, storageSize: 1, description: 'Real diamonds, real flex', tier: 2, unlockRank: 3 },
        { id: 'platinum_watch', name: 'Platinum Watch', type: 'jewelry', cost: 100000, resaleValue: 90000, flexScore: 40, storageSize: 1, description: 'Platinum status', tier: 2, unlockRank: 3 },
        { id: 'emerald_ring', name: 'Emerald Ring', type: 'jewelry', cost: 85000, resaleValue: 76500, flexScore: 38, storageSize: 1, description: 'Green with envy', tier: 2, unlockRank: 3 },
        { id: 'sapphire_necklace', name: 'Sapphire Necklace', type: 'jewelry', cost: 90000, resaleValue: 81000, flexScore: 42, storageSize: 1, description: 'Blue blood luxury', tier: 2, unlockRank: 3 },
        // TIER 3 JEWELRY (Unlock at Rank 6)
        { id: 'ruby_crown', name: 'Ruby Crown', type: 'jewelry', cost: 200000, resaleValue: 180000, flexScore: 60, storageSize: 1, description: 'King of the streets', tier: 3, unlockRank: 6 },
        { id: 'diamond_crown', name: 'Diamond Crown', type: 'jewelry', cost: 300000, resaleValue: 270000, flexScore: 75, storageSize: 1, description: 'Emperor status', tier: 3, unlockRank: 6 },
        { id: 'emerald_crown', name: 'Emerald Crown', type: 'jewelry', cost: 250000, resaleValue: 225000, flexScore: 65, storageSize: 1, description: 'Green throne', tier: 3, unlockRank: 6 },
        { id: 'sapphire_crown', name: 'Sapphire Crown', type: 'jewelry', cost: 275000, resaleValue: 247500, flexScore: 70, storageSize: 1, description: 'Blue blood royalty', tier: 3, unlockRank: 6 },
        // CARS
        { id: 'hooptie', name: 'Beater Sedan', type: 'car', cost: 5000, resaleValue: 4000, flexScore: 4, description: 'Gets you from A to B', tier: 1, unlockRank: 1 },
        { id: 'used_bmw', name: 'Used BMW 3 Series', type: 'car', cost: 12000, resaleValue: 10800, flexScore: 8, description: 'Entry level luxury', tier: 1, unlockRank: 1 },
        { id: 'muscle_car', name: 'Old-School Muscle', type: 'car', cost: 15000, resaleValue: 13500, flexScore: 10, description: 'American power', tier: 1, unlockRank: 1 },
        { id: 'escalade', name: 'Black Escalade', type: 'car', cost: 35000, resaleValue: 31500, flexScore: 15, description: 'Rolling like a boss', tier: 1, unlockRank: 1 },
        { id: 'mercedes', name: 'Mercedes S-Class', type: 'car', cost: 45000, resaleValue: 40500, flexScore: 18, description: 'German engineering', tier: 1, unlockRank: 1 },
        { id: 'lambo', name: 'Black Lambo', type: 'car', cost: 60000, resaleValue: 54000, flexScore: 20, description: 'Italian stallion', tier: 1, unlockRank: 1 },
        { id: 'bentley', name: 'Bentley Continental', type: 'car', cost: 80000, resaleValue: 72000, flexScore: 28, description: 'British luxury', tier: 1, unlockRank: 1 },
        { id: 'ferrari', name: 'Red Ferrari', type: 'car', cost: 100000, resaleValue: 90000, flexScore: 35, description: 'Ultimate flex machine', tier: 1, unlockRank: 1 },
        { id: 'bugatti', name: 'Bugatti Veyron', type: 'car', cost: 250000, resaleValue: 225000, flexScore: 50, description: 'King of the streets', tier: 1, unlockRank: 1 },
        // TIER 2 CARS (Unlock at Rank 4)
        { id: 'rolls_royce', name: 'Rolls Royce Phantom', type: 'car', cost: 400000, resaleValue: 360000, flexScore: 65, description: 'British royalty', tier: 2, unlockRank: 4 },
        { id: 'maybach', name: 'Maybach S-Class', type: 'car', cost: 350000, resaleValue: 315000, flexScore: 60, description: 'German luxury', tier: 2, unlockRank: 4 },
        { id: 'aston_martin', name: 'Aston Martin DB11', type: 'car', cost: 300000, resaleValue: 270000, flexScore: 55, description: 'James Bond style', tier: 2, unlockRank: 4 },
        { id: 'mclaren', name: 'McLaren 720S', type: 'car', cost: 450000, resaleValue: 405000, flexScore: 70, description: 'British speed', tier: 2, unlockRank: 4 },
        // TIER 3 CARS (Unlock at Rank 7)
        { id: 'koenigsegg', name: 'Koenigsegg Agera', type: 'car', cost: 1000000, resaleValue: 900000, flexScore: 100, description: 'Swedish hypercar', tier: 3, unlockRank: 7 },
        { id: 'pagani', name: 'Pagani Huayra', type: 'car', cost: 1200000, resaleValue: 1080000, flexScore: 110, description: 'Italian masterpiece', tier: 3, unlockRank: 7 },
        { id: 'bugatti_chiron', name: 'Bugatti Chiron', type: 'car', cost: 1500000, resaleValue: 1350000, flexScore: 120, description: 'Ultimate hypercar', tier: 3, unlockRank: 7 },
        { id: 'laferrari', name: 'LaFerrari', type: 'car', cost: 2000000, resaleValue: 1800000, flexScore: 130, description: 'Ferrari\'s finest', tier: 3, unlockRank: 7 },
        // PROPERTIES
        { id: 'studio_apt', name: 'Studio Apartment', type: 'property', cost: 15000, resaleValue: 13500, flexScore: 5, capacity: { jewelry: 3, cars: 0 }, description: 'Small but yours', tier: 1, unlockRank: 1 },
        { id: 'trap_house', name: 'Trap House', type: 'property', cost: 20000, resaleValue: 18000, flexScore: 8, capacity: { jewelry: 3, cars: 1 }, description: 'Where it all started', tier: 1, unlockRank: 1 },
        { id: 'condo', name: 'Downtown Condo', type: 'property', cost: 35000, resaleValue: 31500, flexScore: 12, capacity: { jewelry: 4, cars: 1 }, description: 'City views included', tier: 1, unlockRank: 1 },
        { id: 'suburban_home', name: 'Suburban Home', type: 'property', cost: 50000, resaleValue: 45000, flexScore: 15, capacity: { jewelry: 5, cars: 2 }, description: 'Nice neighborhood', tier: 1, unlockRank: 1 },
        { id: 'luxury_house', name: 'Luxury House', type: 'property', cost: 75000, resaleValue: 67500, flexScore: 20, capacity: { jewelry: 7, cars: 3 }, description: 'Pool and hot tub included', tier: 1, unlockRank: 1 },
        { id: 'penthouse', name: 'Downtown Penthouse', type: 'property', cost: 120000, resaleValue: 100000, flexScore: 30, capacity: { jewelry: 10, cars: 3 }, description: 'Sky-high luxury', tier: 1, unlockRank: 1 },
        { id: 'mansion', name: 'Beverly Hills Mansion', type: 'property', cost: 200000, resaleValue: 180000, flexScore: 40, capacity: { jewelry: 15, cars: 5 }, description: 'Celebrity neighborhood', tier: 1, unlockRank: 1 },
        { id: 'compound', name: 'Cartel Compound', type: 'property', cost: 500000, resaleValue: 450000, flexScore: 60, capacity: { jewelry: 20, cars: 10 }, description: 'Ultimate drug lord fortress', tier: 1, unlockRank: 1 },
        // TIER 2 PROPERTIES (Unlock at Rank 5)
        { id: 'island_villa', name: 'Private Island Villa', type: 'property', cost: 1000000, resaleValue: 900000, flexScore: 80, capacity: { jewelry: 25, cars: 15 }, description: 'Your own island paradise', tier: 2, unlockRank: 5 },
        { id: 'skyscraper_penthouse', name: 'Skyscraper Penthouse', type: 'property', cost: 1500000, resaleValue: 1350000, flexScore: 90, capacity: { jewelry: 30, cars: 20 }, description: 'Above the clouds', tier: 2, unlockRank: 5 },
        { id: 'castle', name: 'Medieval Castle', type: 'property', cost: 2000000, resaleValue: 1800000, flexScore: 100, capacity: { jewelry: 35, cars: 25 }, description: 'Royal residence', tier: 2, unlockRank: 5 },
        { id: 'underground_bunker', name: 'Underground Bunker', type: 'property', cost: 2500000, resaleValue: 2250000, flexScore: 110, capacity: { jewelry: 40, cars: 30 }, description: 'Nuclear-proof luxury', tier: 2, unlockRank: 5 },
        // TIER 3 PROPERTIES (Unlock at Rank 8)
        { id: 'space_station', name: 'Private Space Station', type: 'property', cost: 10000000, resaleValue: 9000000, flexScore: 200, capacity: { jewelry: 50, cars: 40 }, description: 'Orbital luxury', tier: 3, unlockRank: 8 },
        { id: 'underwater_city', name: 'Underwater City', type: 'property', cost: 15000000, resaleValue: 13500000, flexScore: 250, capacity: { jewelry: 60, cars: 50 }, description: 'Atlantis reborn', tier: 3, unlockRank: 8 },
        { id: 'moon_base', name: 'Lunar Base', type: 'property', cost: 25000000, resaleValue: 22500000, flexScore: 300, capacity: { jewelry: 75, cars: 60 }, description: 'Moonwalking in luxury', tier: 3, unlockRank: 8 },
        { id: 'mars_colony', name: 'Mars Colony', type: 'property', cost: 50000000, resaleValue: 45000000, flexScore: 400, capacity: { jewelry: 100, cars: 80 }, description: 'Red planet paradise', tier: 3, unlockRank: 8 }
    ]
};