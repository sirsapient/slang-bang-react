// js/systems/assetDrop.js - Global asset drop and rotation system
export class AssetDropSystem {
    constructor(gameState, eventLogger, gameData) {
        this.state = gameState;
        this.events = eventLogger;
        this.data = gameData;
        
        // Initialize global inventory if not exists
        if (!window.globalAssetInventory) {
            window.globalAssetInventory = {};
        }
        this.globalInventory = window.globalAssetInventory;
        
        // Initialize drop timers
        this.dropTimers = {};
        this.initializeDropSchedule();
    }
    
    initializeDropSchedule() {
        // Check each city for needed drops on startup
        Object.keys(this.data.cities).forEach(city => {
            this.checkCityDrops(city);
        });
        
        // Set up rotation timer (check every 24 hours)
        setInterval(() => {
            Object.keys(this.data.cities).forEach(city => {
                this.checkCityDrops(city);
                this.cleanExpiredDrops(city);
            });
        }, 24 * 60 * 60 * 1000); // Every 24 hours
    }
    
    checkCityDrops(city) {
        const cityDrops = this.getCityDrops(city);
        const activeDrops = cityDrops.filter(drop => drop.remaining > 0);
        
        // Only generate new drops if city has no active items
        // This ensures drops last longer and are more valuable
        if (activeDrops.length === 0) {
            this.generateNewDrop(city);
        }
    }
    
    generateNewDrop(city) {
        const templates = this.getRandomTemplates(city, 1);
        if (templates.length === 0) return;
        
        const template = templates[0];
        const quantity = Math.floor(Math.random() * 150) + 50; // 50-200 items
        
        const dropId = `${city}_${template.id}_${Date.now()}`;
        const drop = {
            id: dropId,
            city: city,
            templateId: template.id,
            name: template.name,
            type: template.type,
            description: template.description,
            baseFlexScore: template.flexScore,
            baseCost: template.cost,
            currentPrice: template.cost,
            totalSupply: quantity,
            remaining: quantity,
            purchasedBy: {},
            createdAt: Date.now(),
            expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
            isExpired: false
        };
        
        this.globalInventory[dropId] = drop;
        
        // Track new drops for consolidated notification
        if (!this.state.data.newDropsByCity) {
            this.state.data.newDropsByCity = {};
        }
        if (!this.state.data.newDropsByCity[city]) {
            this.state.data.newDropsByCity[city] = [];
        }
        this.state.data.newDropsByCity[city].push({
            name: template.name,
            quantity: quantity,
            cost: template.cost,
            flexScore: template.flexScore
        });
        
        // Announce new drop with enhanced messaging
        const dropMessage = `🎉 NEW DROP: ${quantity} ${template.name} now available in ${city}!`;
        this.events.add(dropMessage, 'good');
        
        // Show consolidated popup notification if player is in the same city
        const currentCity = this.state.get('currentCity');
        if (currentCity === city) {
            this.state.addNotification(`🎉 New drop available in ${city}: ${template.name}`, 'success');
        }
    }
    
    getRandomTemplates(city, count = 1) {
        // Filter assets by city availability or create city-specific templates
        const availableAssets = this.data.assets.filter(asset => {
            // For now, all assets are available in all cities
            // You could add city-specific asset availability here
            return asset.type === 'jewelry' || asset.type === 'car';
        });
        
        const templates = [];
        const usedIndices = new Set();
        
        for (let i = 0; i < count && i < availableAssets.length; i++) {
            let index;
            do {
                index = Math.floor(Math.random() * availableAssets.length);
            } while (usedIndices.has(index));
            
            usedIndices.add(index);
            templates.push(availableAssets[index]);
        }
        
        return templates;
    }
    
    getCityDrops(city) {
        return Object.values(this.globalInventory)
            .filter(drop => drop.city === city && !drop.isExpired);
    }
    
    calculateDynamicPrice(drop) {
        const basePrice = drop.baseCost;
        const remainingRatio = drop.remaining / drop.totalSupply;
        const demandMultiplier = 1 + (1 - remainingRatio) * 0.5; // Price increases as supply decreases
        return Math.floor(basePrice * demandMultiplier);
    }
    
    purchaseExclusiveDrop(dropId) {
        const drop = this.globalInventory[dropId];
        
        if (!drop) {
            return { success: false, error: 'Item not found' };
        }
        
        if (drop.remaining <= 0) {
            return { success: false, error: 'SOLD OUT! This item is no longer available' };
        }
        
        if (drop.isExpired) {
            return { success: false, error: 'This drop has expired' };
        }
        
        const price = this.calculateDynamicPrice(drop);
        
        if (!this.state.canAfford(price)) {
            return { success: false, error: `Need $${price.toLocaleString()} to purchase` };
        }
        
        // Process purchase
        drop.remaining--;
        drop.currentPrice = this.calculateDynamicPrice(drop);
        
        // Track who bought it
        const playerName = this.state.get('playerName');
        if (!drop.purchasedBy[playerName]) {
            drop.purchasedBy[playerName] = 0;
        }
        drop.purchasedBy[playerName]++;
        
        // Deduct money
        this.state.updateCash(-price);
        
        // Add to player's inventory
        const assetData = {
            id: `${dropId}_${Date.now()}`,
            dropId: dropId,
            templateId: drop.templateId,
            name: drop.name,
            type: drop.type,
            description: drop.description,
            flexScore: drop.baseFlexScore,
            cost: price,
            resaleValue: Math.floor(price * 0.9),
            purchaseDate: this.state.get('day'),
            purchasePrice: price,
            exclusive: true,
            cityPurchased: drop.city
        };
        
        // Add to owned assets using the new city-based structure
        if (!this.state.data.assets) {
            this.state.data.assets = { owned: {}, wearing: { jewelry: [] } };
        }
        
        // Initialize city structure if it doesn't exist
        if (!this.state.data.assets.owned[drop.city]) {
            this.state.data.assets.owned[drop.city] = {};
        }
        
        // Initialize array for this asset type if it doesn't exist
        if (!this.state.data.assets.owned[drop.city][assetData.id]) {
            this.state.data.assets.owned[drop.city][assetData.id] = [];
        }
        
        // Add the new asset instance
        this.state.data.assets.owned[drop.city][assetData.id].push({
            ...assetData,
            instanceId: assetData.id,
            city: drop.city // Store which city this asset is in
        });
        
        this.events.add(`🎉 Purchased exclusive ${drop.name} from ${drop.city} for ${price.toLocaleString()}`, 'good');
        return { success: true };
    }
    
    cleanExpiredDrops(city) {
        const now = Date.now();
        Object.values(this.globalInventory)
            .filter(drop => drop.city === city && drop.expiresAt < now)
            .forEach(drop => {
                drop.isExpired = true;
                if (drop.remaining > 0) {
                    this.events.add(`❌ ${drop.remaining} ${drop.name} expired in ${city}`, 'neutral');
                }
            });
    }
    
    getTimeRemaining(expiresAt) {
        const now = Date.now();
        const remaining = expiresAt - now;
        
        if (remaining <= 0) return 'Expired';
        
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }
    
    /**
     * Show consolidated drop notification for a city
     * @param {string} city
     */
    showConsolidatedDropNotification(city) {
        const newDrops = this.state.data.newDropsByCity[city] || [];
        if (newDrops.length === 0) return;
        
        if (window.game && window.game.ui && window.game.ui.modals) {
            let content = `🌟 New exclusive items available in ${city}!<br><br>`;
            
            newDrops.forEach((drop, index) => {
                content += `<strong>${drop.name}</strong><br>` +
                          `Quantity: ${drop.quantity}<br>` +
                          `Base Price: $${drop.cost.toLocaleString()}<br>` +
                          `Flex Score: +${drop.flexScore}<br>`;
                
                if (index < newDrops.length - 1) {
                    content += '<br>';
                }
            });
            
            content += `<br>Check the Asset Store to purchase!`;
            
            window.game.ui.modals.alert(
                content,
                `🎉 ${newDrops.length} New Drop${newDrops.length > 1 ? 's' : ''} Available!`
            );
            
            // Clear the drops for this city after showing notification
            this.state.data.newDropsByCity[city] = [];
        }
    }
    
    /**
     * Clear pending notifications for a city (called when player travels)
     * @param {string} city
     */
    clearCityNotifications(city) {
        if (this.state.data.newDropsByCity && this.state.data.newDropsByCity[city]) {
            this.state.data.newDropsByCity[city] = [];
        }
    }
} 