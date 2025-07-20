// js/systems/assets.js - Asset management system
import { formatCurrency, formatNumber } from '../utils.js';
/**
 * AssetSystem manages all asset-related logic: buying, selling, flex score, storage, etc.
 */
export class AssetSystem {
    constructor(gameState, eventLogger, gameData) {
        this.state = gameState;
        this.events = eventLogger;
        this.data = gameData;
    }

    /**
     * Check if player has unlocked assets (Rank 4+ for cars/properties, but jewelry available from start)
     * @returns {boolean}
     */
    isUnlocked() {
        const rankId = this.getCurrentPlayerRank();
        return rankId >= 4;
    }
    
    /**
     * Check if jewelry is unlocked (available from start)
     * @returns {boolean}
     */
    isJewelryUnlocked() {
        return true; // Jewelry is always available
    }

    /**
     * Get the current player rank ID based on net worth, bases, gang size, and assets.
     * @returns {number} Current rank ID
     */
    getCurrentPlayerRank() {
        const netWorth = this.state.calculateNetWorth();
        const basesOwned = Object.keys(this.state.data.bases).length;
        const gangSize = this.state.get('gangSize');
        const assetCount = this.getOwnedAssetCount();

        let currentRank = 1;
        if (!this.data.playerRanks) {
            // Return error code for missing data, let UI handle alert
            return -1;
        }
        for (let rankId = 7; rankId >= 1; rankId--) {
            const rank = this.data.playerRanks[rankId];
            if (!rank) continue;
            if (netWorth >= rank.minNetWorth && 
                basesOwned >= rank.minBases && 
                gangSize >= rank.minGang &&
                assetCount >= rank.minAssets) {
                currentRank = rankId;
                break;
            }
        }
        return currentRank;
    }

    /**
     * Initialize player assets if not exists
     */
    initializeAssets() {
        if (!this.state.data.assets) {
            this.state.data.assets = {
                owned: {}, // Will store arrays of assets by ID
                wearing: { jewelry: [] },
                storage: { jewelry: 2, cars: 0 }
            };
        }
    }

    /**
     * Get all assets of a specific type
     * @param {string} type
     * @returns {Array}
     */
    getAssetsByType(type) {
        return this.data.assets.filter(asset => asset.type === type);
    }

    /**
     * Get all owned assets, optionally filtered by type
     * @param {string|null} type
     * @returns {Object} - Returns arrays of asset instances by asset ID
     */
    getOwnedAssets(type = null) {
        this.initializeAssets();
        const owned = this.state.data.assets.owned;
        if (!type) return owned;
        const filtered = {};
        Object.entries(owned).forEach(([id, instances]) => {
            if (instances.length > 0 && instances[0].type === type) {
                filtered[id] = instances;
            }
        });
        return filtered;
    }
    
    /**
     * Get all owned asset instances as a flat array
     * @param {string|null} type
     * @returns {Array} - Returns array of all asset instances
     */
    getAllOwnedInstances(type = null) {
        this.initializeAssets();
        const owned = this.state.data.assets.owned;
        const allInstances = [];
        
        Object.values(owned).forEach(instances => {
            instances.forEach(instance => {
                if (!type || instance.type === type) {
                    allInstances.push(instance);
                }
            });
        });
        
        return allInstances;
    }

    /**
     * Get instance IDs of worn jewelry
     * @returns {Array<string>}
     */
    getWornJewelry() {
        this.initializeAssets();
        return this.state.data.assets.wearing.jewelry || [];
    }

    /**
     * Calculate total flex score
     * @returns {number}
     */
    calculateFlexScore() {
        this.initializeAssets();
        let flexScore = 0;
        const playerRank = window.game?.screens?.home?.getCurrentRank() || 1;
        const flexMultiplier = this.data?.config?.assetFlexScoreMultiplier || 1.5;
        const rankBonus = Math.pow(flexMultiplier, playerRank - 1);
        
        // Calculate flex from worn jewelry
        this.getWornJewelry().forEach(instanceId => {
            const jewelry = this.findAssetByInstanceId(instanceId);
            if (jewelry) {
                flexScore += (jewelry.flexScore || 0) * rankBonus;
            }
        });
        
        // Calculate flex from cars (all cars count)
        const allInstances = this.getAllOwnedInstances();
        allInstances.forEach(instance => {
            if (instance.type === 'car') {
                flexScore += (instance.flexScore || 0) * rankBonus;
            }
        });
        
        // Calculate flex from best property only
        let bestHouseFlex = 0;
        allInstances.forEach(instance => {
            if (instance.type === 'property') {
                bestHouseFlex = Math.max(bestHouseFlex, (instance.flexScore || 0) * rankBonus);
            }
        });
        flexScore += bestHouseFlex;
        
        return Math.floor(flexScore);
    }
    
    /**
     * Find asset by instance ID
     * @param {string} instanceId
     * @returns {Object|null}
     */
    findAssetByInstanceId(instanceId) {
        this.initializeAssets();
        const owned = this.state.data.assets.owned;
        
        for (const instances of Object.values(owned)) {
            const instance = instances.find(inst => inst.instanceId === instanceId);
            if (instance) {
                return instance;
            }
        }
        return null;
    }

    /**
     * Attempt to purchase an asset. Returns {success, error}.
     * @param {string} assetId
     * @returns {{success: boolean, error?: string}}
     */
    purchaseAsset(assetId) {
        const asset = this.data.assets.find(a => a.id === assetId);
        if (!asset) {
            return { success: false, error: 'Asset not found' };
        }
        
        // Check if asset type is unlocked
        if (asset.type === 'jewelry') {
            if (!this.isJewelryUnlocked()) {
                return { success: false, error: 'Jewelry store is not available' };
            }
        } else {
            if (!this.isUnlocked()) {
                return { success: false, error: 'Asset Store unlocks at Rank 4 (District Chief)' };
            }
        }
        
        if (!this.state.canAfford(asset.cost)) {
            return { success: false, error: `Can't afford ${asset.name}. Need ${formatCurrency(asset.cost)}` };
        }
        if (asset.type === 'car') {
            const allCarInstances = this.getAllOwnedInstances('car');
            const carCapacity = this.getStorageCapacity().cars;
            if (allCarInstances.length >= carCapacity && carCapacity > 0) {
                return { success: false, error: 'No car storage available. Buy a house first!' };
            }
        }
        this.initializeAssets();
        this.state.updateCash(-asset.cost);
        
        // Create unique instance ID for this asset
        const instanceId = `${assetId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Initialize array for this asset type if it doesn't exist
        if (!this.state.data.assets.owned[assetId]) {
            this.state.data.assets.owned[assetId] = [];
        }
        
        // Add the new asset instance
        this.state.data.assets.owned[assetId].push({
            ...asset,
            instanceId: instanceId,
            purchaseDate: this.state.get('day'),
            purchasePrice: asset.cost
        });
        
        if (asset.type === 'property' && asset.capacity) {
            this.updateStorageCapacity(asset.capacity);
        }
        this.events.add(`💎 Purchased ${asset.name} for ${formatCurrency(asset.cost)}`, 'good');
        
        // Track achievements
        this.state.trackAchievement('assetsOwned');
        this.state.trackAchievement('firstAsset');
        
        // Add prestige notification for expensive assets
        if (asset.cost >= 100000) {
            this.state.addNotification(`🏆 Prestige Asset: ${asset.name}`, 'success');
        }
        
        if (asset.type === 'jewelry' && this.canWearMoreJewelry()) {
            this.wearJewelry(instanceId);
        }
        return { success: true };
    }
    
    /**
     * Attempt to sell an asset. Returns {success, error}.
     * @param {string} instanceId - The specific instance ID to sell
     * @returns {{success: boolean, error?: string}}
     */
    sellAsset(instanceId) {
        this.initializeAssets();
        
        // Find the asset by instance ID
        let asset = null;
        let assetId = null;
        let assetIndex = -1;
        
        for (const [id, instances] of Object.entries(this.state.data.assets.owned)) {
            const index = instances.findIndex(instance => instance.instanceId === instanceId);
            if (index !== -1) {
                asset = instances[index];
                assetId = id;
                assetIndex = index;
                break;
            }
        }
        
        if (!asset) {
            return { success: false, error: "You don't own this asset" };
        }
        
        // Remove from wearing if worn
        if (asset.type === 'jewelry') {
            this.removeJewelry(instanceId);
        }
        
        // Calculate resale value
        const resaleValue = asset.resaleValue || Math.floor(asset.cost * 0.9);
        
        // Remove the specific instance
        this.state.data.assets.owned[assetId].splice(assetIndex, 1);
        
        // If no more instances of this asset, remove the array
        if (this.state.data.assets.owned[assetId].length === 0) {
            delete this.state.data.assets.owned[assetId];
        }
        
        // Update cash
        this.state.updateCash(resaleValue);
        
        // Reduce storage if selling property
        if (asset.type === 'property' && asset.capacity) {
            this.reduceStorageCapacity(asset.capacity);
        }
        
        this.events.add(`💰 Sold ${asset.name} for ${formatCurrency(resaleValue)}`, 'good');
        return { success: true };
    }

    /**
     * Attempt to wear a jewelry item. Returns {success, error}.
     * @param {string} instanceId
     * @returns {{success: boolean, error?: string}}
     */
    wearJewelry(instanceId) {
        this.initializeAssets();
        const jewelry = this.findAssetByInstanceId(instanceId);
        if (!jewelry || jewelry.type !== 'jewelry') {
            return { success: false, error: 'Invalid jewelry item' };
        }
        const wearing = this.state.data.assets.wearing.jewelry;
        const maxWearable = this.getMaxWearableJewelry();
        if (wearing.includes(instanceId)) {
            return { success: false, error: `Already wearing ${jewelry.name}` };
        }
        if (wearing.length >= maxWearable) {
            return { success: false, error: `Can only wear ${maxWearable} jewelry items. Remove one first or buy storage!` };
        }
        wearing.push(instanceId);
        this.events.add(`💍 Now wearing ${jewelry.name} (+${jewelry.flexScore} flex)`, 'good');
        return { success: true };
    }

    /**
     * Remove a jewelry item from wearing. Returns {success, error}.
     * @param {string} instanceId
     * @returns {{success: boolean, error?: string}}
     */
    removeJewelry(instanceId) {
        this.initializeAssets();
        const wearing = this.state.data.assets.wearing.jewelry;
        const index = wearing.indexOf(instanceId);
        if (index > -1) {
            const jewelry = this.findAssetByInstanceId(instanceId);
            wearing.splice(index, 1);
            if (jewelry) {
                this.events.add(`Removed ${jewelry.name}`, 'neutral');
            }
            return { success: true };
        }
        return { success: false, error: 'Jewelry not currently worn' };
    }

    /**
     * Get storage capacity for jewelry and cars.
     * @returns {{jewelry: number, cars: number}}
     */
    getStorageCapacity() {
        this.initializeAssets();
        return this.state.data.assets.storage;
    }

    /**
     * Get max wearable jewelry slots.
     * @returns {number}
     */
    getMaxWearableJewelry() {
        const storage = this.getStorageCapacity();
        return storage.jewelry || 2;
    }

    /**
     * Check if player can wear more jewelry.
     * @returns {boolean}
     */
    canWearMoreJewelry() {
        const wearing = this.getWornJewelry();
        const max = this.getMaxWearableJewelry();
        return wearing.length < max;
    }

    /**
     * Update storage capacity when buying property.
     * @param {Object} capacity
     */
    updateStorageCapacity(capacity) {
        this.initializeAssets();
        const storage = this.state.data.assets.storage;
        let bestJewelryCapacity = 2;
        let bestCarCapacity = 0;
        
        const allInstances = this.getAllOwnedInstances();
        allInstances.forEach(instance => {
            if (instance.type === 'property' && instance.capacity) {
                bestJewelryCapacity = Math.max(bestJewelryCapacity, instance.capacity.jewelry || 2);
                bestCarCapacity = Math.max(bestCarCapacity, instance.capacity.cars || 0);
            }
        });
        
        storage.jewelry = bestJewelryCapacity;
        storage.cars = bestCarCapacity;
    }

    /**
     * Reduce storage when selling property. Removes excess jewelry if needed.
     * @param {Object} capacity
     */
    reduceStorageCapacity(capacity) {
        this.updateStorageCapacity({});
        const wearing = this.getWornJewelry();
        const maxWearable = this.getMaxWearableJewelry();
        if (wearing.length > maxWearable) {
            const toRemove = wearing.length - maxWearable;
            for (let i = 0; i < toRemove; i++) {
                const jewelryId = wearing[wearing.length - 1];
                this.removeJewelry(jewelryId);
                this.events.add('Had to remove jewelry due to reduced storage', 'bad');
            }
        }
    }

    /**
     * Get total asset value.
     * @returns {number}
     */
    getTotalAssetValue() {
        this.initializeAssets();
        let total = 0;
        const allInstances = this.getAllOwnedInstances();
        allInstances.forEach(instance => {
            total += instance.resaleValue || Math.floor(instance.cost * 0.9);
        });
        return total;
    }

    /**
     * Get the total number of asset instances owned by the player.
     * @returns {number}
     */
    getOwnedAssetCount() {
        this.initializeAssets();
        const allInstances = this.getAllOwnedInstances();
        return allInstances.length;
    }

    /**
     * Get a summary of owned assets.
     * @returns {Object}
     */
    getAssetSummary() {
        this.initializeAssets();
        const wearing = this.getWornJewelry();
        const allInstances = this.getAllOwnedInstances();
        
        let jewelryCount = 0;
        let carCount = 0;
        let propertyCount = 0;
        
        allInstances.forEach(instance => {
            if (instance.type === 'jewelry') jewelryCount++;
            else if (instance.type === 'car') carCount++;
            else if (instance.type === 'property') propertyCount++;
        });
        
        return {
            totalAssets: allInstances.length,
            jewelryCount,
            carCount,
            propertyCount,
            wearingCount: wearing.length,
            flexScore: this.calculateFlexScore(),
            totalValue: this.getTotalAssetValue()
        };
    }
}