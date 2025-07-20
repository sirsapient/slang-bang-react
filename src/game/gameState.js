// js/gameState.js - Centralized game state management
import { TradingSystem } from './systems/trading';
import { gameData } from './data/gameData';

export class GameState {
    constructor() {
        this.data = {
            // Player stats
            playerName: 'Player',
            cash: 5000,
            gangSize: 0,
            warrant: 0,
            day: 1,
            guns: 0,
            
            // Location
            currentCity: 'New York',
            daysInCurrentCity: 1,
            daysSinceTravel: 0,
            lastTravelDay: 0,
            
            // Game state
            currentScreen: 'home',
            heatLevel: 0,
            
            // Inventory
            inventory: {
                'Fentanyl': 0,
                'Oxycontin': 0,
                'Heroin': 0,
                'Cocaine': 0,
                'Weed': 0,
                'Meth': 0
            },
            
            // Bases
            bases: {},
            
            // Gang members by city
            gangMembers: {},
            
            // Guns by city
            gunsByCity: {},
            
            // Market data
            citySupply: {},
            lastPurchase: {},
            
            // Meta
            saveVersion: '1.0',
            lastSaved: Date.now(),
            
            // Notifications
            notifications: [],
            
            // Achievements
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
                    maxHeatSurvived: 0
                }
            }
        };
        
        // Runtime data (not saved)
        this.cityPrices = {};
        this.gameInitialized = false;
        this.gameTimer = null;
        this.countdownTimer = null;
        this.dayDuration = 60000; // 60 seconds per day
        this.timeRemaining = this.dayDuration;

        // Police raid loss tracking (not saved)
        this.raidLossHistory = [];
        // Event listeners
        this.listeners = {};
    }
    
    // Basic getters/setters
    get(key) {
        const value = this.data[key];
        
        // Special handling for cash to prevent NaN
        if (key === 'cash') {
            if (value === undefined || value === null || isNaN(value)) {
                console.warn('Invalid cash value detected, resetting to 0:', value, new Error().stack);
                this.data.cash = 0;
                return 0;
            }
        }
        
        return value;
    }
    
    set(key, value) {
        if (key === 'cash') {
            console.log('[CASH DEBUG][SET] set cash:', value, new Error().stack);
        }
        this.data[key] = value;
        this.emit('stateChange', { key, value });
        this.emit(`${key}Changed`, value);
    }
    
    // Inventory management
    getInventory(drug) {
        return this.data.inventory[drug] || 0;
    }
    
    updateInventory(drug, amount) {
        this.data.inventory[drug] = Math.max(0, (this.data.inventory[drug] || 0) + amount);
        this.emit('inventoryChanged', { drug, amount: this.data.inventory[drug] });
        this.emit('stateChange', { key: 'inventory', value: { ...this.data.inventory } });
    }
    
    // Cash management
    updateCash(amount) {
        const oldCash = this.data.cash;
        const newCash = Math.max(0, oldCash + amount);
        
        // Debug logging for cash changes
        if (amount < 0 && Math.abs(amount) > 1000) {
            console.warn(`[CASH DEBUG][LARGE LOSS] Large cash loss detected: oldCash=${oldCash}, amount=${amount}, newCash=${newCash}`, new Error().stack);
        }
        
        console.log(`[CASH DEBUG][UPDATE] updateCash called: oldCash=${oldCash}, amount=${amount}, newCash=${newCash}`, new Error().stack);
        this.data.cash = newCash;
        this.emit('cashChanged', this.data.cash);
        this.emit('stateChange', { key: 'cash', value: this.data.cash });
    }
    
    updateGuns(amount) {
        this.data.guns = Math.max(0, this.data.guns + amount);
        this.emit('gunsChanged', this.data.guns);
        this.emit('stateChange', { key: 'guns', value: this.data.guns });
    }
    
    canAfford(amount) {
        return this.data.cash >= amount;
    }
    
    // Gang management
    updateGangSize(amount) {
        this.data.gangSize = Math.max(0, this.data.gangSize + amount);
        this.emit('gangChanged', this.data.gangSize);
        this.emit('stateChange', { key: 'gangSize', value: this.data.gangSize });
    }
    
    // City-based gang management
    addGangMembers(city, amount) {
        console.log(`addGangMembers called: city=${city}, amount=${amount}`);
        console.log(`Before adding - gangMembers:`, this.data.gangMembers);
        console.log(`Before adding - gangSize:`, this.data.gangSize);
        
        if (!this.data.gangMembers[city]) {
            this.data.gangMembers[city] = 0;
        }
        this.data.gangMembers[city] += amount;
        
        // Recalculate total gang size from city data
        this.recalculateGangSize();
        
        console.log(`After adding - gangMembers:`, this.data.gangMembers);
        console.log(`After adding - gangSize:`, this.data.gangSize);
        console.log(`Gang members after adding: ${this.data.gangMembers[city]} in ${city}, total: ${this.data.gangSize}`);
        
        this.emit('gangChanged', this.data.gangSize);
        this.emit('gangMembersChanged', { city, amount: this.data.gangMembers[city] });
        this.emit('stateChange', { key: 'gangMembers', value: { ...this.data.gangMembers } });
    }
    
    recalculateGangSize() {
        const totalGangMembers = Object.values(this.data.gangMembers).reduce((sum, count) => sum + count, 0);
        this.data.gangSize = totalGangMembers;
        console.log(`Recalculated gang size: ${this.data.gangSize} from city data:`, this.data.gangMembers);
    }
    
    getGangMembersInCity(city) {
        return this.data.gangMembers[city] || 0;
    }
    
    getAvailableGangMembersInCity(city) {
        const totalInCity = this.getGangMembersInCity(city);
        let assignedInCity = 0;
        
        // Check if there's a base in this city
        const base = this.getBase(city);
        if (base) {
            assignedInCity = base.assignedGang || 0;
        }
        
        const available = Math.max(0, totalInCity - assignedInCity);
        
        // Debug logging for Austin
        if (city === 'Austin') {
            console.log(`[DEBUG] Austin gang members: total=${totalInCity}, assigned=${assignedInCity}, available=${available}`);
            console.log(`[DEBUG] Austin base:`, base);
            console.log(`[DEBUG] All gang members:`, this.data.gangMembers);
        }
        
        return available;
    }
    
    removeGangMembersFromCity(city, amount) {
        console.log(`removeGangMembersFromCity called: city=${city}, amount=${amount}`);
        console.log(`Current gang members in ${city}:`, this.data.gangMembers[city]);
        
        if (!this.data.gangMembers[city] || this.data.gangMembers[city] < amount) {
            console.log(`Cannot remove ${amount} from ${city}, only have ${this.data.gangMembers[city]}`);
            return false;
        }
        
        this.data.gangMembers[city] -= amount;
        
        // If no more gang members in this city, remove the city entry
        if (this.data.gangMembers[city] <= 0) {
            delete this.data.gangMembers[city];
            console.log(`Removed ${city} from gangMembers object`);
        }
        
        // Recalculate total gang size from city data
        this.recalculateGangSize();
        
        console.log(`After removal: ${this.data.gangMembers[city] || 0} in ${city}, total: ${this.data.gangSize}`);
        
        this.emit('gangChanged', this.data.gangSize);
        this.emit('gangMembersChanged', { city, amount: this.data.gangMembers[city] || 0 });
        this.emit('stateChange', { key: 'gangMembers', value: { ...this.data.gangMembers } });
        
        return true;
    }
    
    // City-based gun management
    addGunsToCity(city, amount) {
        if (!this.data.gunsByCity[city]) {
            this.data.gunsByCity[city] = 0;
        }
        this.data.gunsByCity[city] += amount;
        this.data.guns += amount;
        this.emit('gunsChanged', this.data.guns);
        this.emit('gunsByCityChanged', { city, amount: this.data.gunsByCity[city] });
        this.emit('stateChange', { key: 'gunsByCity', value: { ...this.data.gunsByCity } });
    }
    
    getGunsInCity(city) {
        return this.data.gunsByCity[city] || 0;
    }
    
    getAvailableGunsInCity(city) {
        const totalInCity = this.getGunsInCity(city);
        let assignedInCity = 0;
        
        // Check if there's a base in this city
        const base = this.getBase(city);
        if (base) {
            assignedInCity = base.guns || 0;
        }
        
        return Math.max(0, totalInCity - assignedInCity);
    }
    
    removeGunsFromCity(city, amount) {
        if (!this.data.gunsByCity[city] || this.data.gunsByCity[city] < amount) {
            return false;
        }
        
        this.data.gunsByCity[city] -= amount;
        this.data.guns -= amount;
        
        // If no more guns in this city, remove the city entry
        if (this.data.gunsByCity[city] <= 0) {
            delete this.data.gunsByCity[city];
        }
        
        this.emit('gunsChanged', this.data.guns);
        this.emit('gunsByCityChanged', { city, amount: this.data.gunsByCity[city] || 0 });
        this.emit('stateChange', { key: 'gunsByCity', value: { ...this.data.gunsByCity } });
        
        return true;
    }
    
    getAvailableGangMembers() {
        let assignedGang = 0;
        Object.values(this.data.bases).forEach(base => {
            assignedGang += base.assignedGang || 0;
        });
        return Math.max(0, this.data.gangSize - assignedGang);
    }
    
    // Heat/Warrant management
    updateWarrant(amount) {
        this.data.warrant = Math.max(0, this.data.warrant + amount);
        this.calculateHeatLevel();
        this.emit('warrantChanged', this.data.warrant);
        this.emit('stateChange', { key: 'warrant', value: this.data.warrant });
    }
    
    calculateHeatLevel() {
        const warrantHeat = Math.min(this.data.warrant / 10000, 50);
        const timeHeat = Math.max(0, this.data.daysInCurrentCity - 3) * 5;
        this.data.heatLevel = Math.min(100, warrantHeat + timeHeat);
        return this.data.heatLevel;
    }
    
    getHeatLevelText() {
        const heat = this.data.heatLevel;
        if (heat < 20) return 'Low';
        if (heat < 40) return 'Medium';
        if (heat < 70) return 'High';
        return 'Critical';
    }
    
    // Base management
    hasBase(city) {
        return !!this.data.bases[city];
    }
    
    getBase(city) {
        return this.data.bases[city];
    }
    
    addBase(city, baseData) {
        this.data.bases[city] = baseData;
        this.emit('baseAdded', { city, base: baseData });
        this.emit('stateChange', { key: 'bases', value: { ...this.data.bases } });
    }
    
    // City/Travel management
    travelToCity(city) {
        this.data.currentCity = city;
        this.data.daysInCurrentCity = 1;
        this.data.daysSinceTravel = 0;
        this.data.lastTravelDay = this.data.day;
        this.emit('cityChanged', city);
        this.emit('stateChange', { key: 'currentCity', value: city });
    }
    
    // Save/Load functionality
    save() {
        // Validate cash before saving
        if (this.data.cash === undefined || this.data.cash === null || isNaN(this.data.cash)) {
            console.warn('Invalid cash value detected before saving, resetting to 5000:', this.data.cash);
            this.data.cash = 5000;
        }
        const saveData = {
            gameState: this.data,
            cityPrices: this.cityPrices,  // Save cityPrices explicitly
            timeRemaining: this.timeRemaining,
            saveTime: Date.now()
        };
        // Save to localStorage
        localStorage.setItem('slangBangSave', JSON.stringify(saveData));
        // In Claude environment, save to memory
        window.gameSaveData = saveData;
        console.log('Game saved with cityPrices:', this.cityPrices);
        this.emit('gameSaved');
        this.emit('stateChange', { key: 'save', value: true });
    }

    load() {
        try {
            let saveData = null;
            // Try memory first (Claude environment)
            if (window.gameSaveData) {
                console.log('Loading from window.gameSaveData');
                saveData = window.gameSaveData;
            }
            // Load from localStorage
            const saved = localStorage.getItem('slangBangSave');
            if (saved) {
                console.log('Loading from localStorage');
                saveData = JSON.parse(saved);
            }
            if (saveData) {
                this.data = { ...this.data, ...saveData.gameState };
                this.timeRemaining = saveData.timeRemaining || this.dayDuration;
                // Load cityPrices if available
                if (saveData.cityPrices && Object.keys(saveData.cityPrices).length > 0) {
                    this.cityPrices = saveData.cityPrices;
                    console.log('Loaded cityPrices from save:', this.cityPrices);
                } else {
                    // If no cityPrices in save, mark as needing generation
                    this.cityPrices = {};
                    console.log('No cityPrices in save data, will need to generate');
                }
                // Validate critical values after loading
                if (this.data.cash === undefined || this.data.cash === null || isNaN(this.data.cash)) {
                    console.warn('Invalid cash value in save data, resetting to 5000');
                    this.data.cash = 5000;
                }
                // If cash is 0 but player has been playing (day > 1), give them some money back
                if (this.data.cash === 0 && this.data.day > 1) {
                    console.warn('Cash is 0 but player has been playing, restoring to 10000');
                    this.data.cash = 10000;
                    this.addNotification('💰 Cash restored to $10,000 due to save data issue', 'success');
                }
                // Recalculate gang size from city data to ensure consistency
                this.recalculateGangSize();
                console.log('Game loaded successfully');
                this.emit('gameLoaded');
                this.emit('stateChange', { key: 'load', value: true });
                return true;
            }
        } catch (error) {
            console.error('Failed to load game:', error);
        }
        return false;
    }
    
    // Event system
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
    
    off(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
    
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    /**
     * Add a one-time event listener for the given event.
     * @param {string} event
     * @param {Function} callback
     */
    once(event, callback) {
        const wrapper = (data) => {
            this.off(event, wrapper);
            callback(data);
        };
        this.on(event, wrapper);
    }
    
    // Utility methods
    getTotalInventory() {
        return Object.values(this.data.inventory).reduce((sum, qty) => sum + qty, 0);
    }
    
    calculateNetWorth() {
        let netWorth = this.data.cash;
        
        // Add inventory value
        Object.keys(this.data.inventory).forEach(drug => {
            const qty = this.data.inventory[drug];
            const price = this.cityPrices[this.data.currentCity]?.[drug] || 0;
            netWorth += qty * price;
        });
        
        // Add base values
        Object.values(this.data.bases).forEach(base => {
            netWorth += base.cashStored || 0;
            // Add estimated base value
            netWorth += 35000; // Simplified for now
        });
        
        // Add gang value
        netWorth += this.data.gangSize * 1250; // Half of avg recruitment cost

        // Add asset value
        if (window.game?.systems?.assets) {
            netWorth += window.game.systems.assets.getTotalAssetValue();
        }
        
        return Math.floor(netWorth);
    }

    // Police raid loss tracking
    addRaidLoss(amount) {
        const now = Date.now();
        this.raidLossHistory.push({ amount, time: now });
        // Remove entries older than 24 hours
        const cutoff = now - 24 * 60 * 60 * 1000;
        this.raidLossHistory = this.raidLossHistory.filter(entry => entry.time >= cutoff);
    }

    getRaidLossLast24h() {
        const now = Date.now();
        const cutoff = now - 24 * 60 * 60 * 1000;
        return this.raidLossHistory
            .filter(entry => entry.time >= cutoff)
            .reduce((sum, entry) => sum + entry.amount, 0);
    }
    
    // Notification management
    addNotification(message, type = 'info', duration = 4000) {
        const notification = {
            id: Date.now() + Math.random(),
            message: message,
            type: type, // 'info', 'success', 'warning', 'error'
            timestamp: Date.now(),
            day: this.get('day'),
            read: false
        };
        
        this.data.notifications.unshift(notification);
        
        // Keep only last 100 notifications
        if (this.data.notifications.length > 100) {
            this.data.notifications = this.data.notifications.slice(0, 100);
        }
        
        this.emit('notificationAdded', notification);
        this.emit('stateChange', { key: 'notifications', value: [...this.data.notifications] });
        
        return notification;
    }
    
    getNotifications() {
        return this.data.notifications;
    }
    
    getUnreadNotifications() {
        return this.data.notifications.filter(n => !n.read);
    }
    
    markNotificationAsRead(notificationId) {
        const notification = this.data.notifications.find(n => n.id === notificationId);
        if (notification) {
            notification.read = true;
            this.emit('notificationRead', notification);
            this.emit('stateChange', { key: 'notifications', value: [...this.data.notifications] });
        }
    }
    
    markAllNotificationsAsRead() {
        this.data.notifications.forEach(n => n.read = true);
        this.emit('notificationsRead');
        this.emit('stateChange', { key: 'notifications', value: [...this.data.notifications] });
    }
    
    clearNotifications() {
        this.data.notifications = [];
        this.emit('notificationsCleared');
        this.emit('stateChange', { key: 'notifications', value: [] });
    }
    
    // Emergency save data reset
    resetSaveData() {
        localStorage.removeItem('slangBangSave');
        window.gameSaveData = null;
        console.log('Save data cleared');
        this.addNotification('🔄 Save data reset - starting fresh game', 'info');
        location.reload();
    }
    
    // Achievement system
    trackAchievement(achievementId, value = 1) {
        if (!this.data.achievements.progress[achievementId]) {
            this.data.achievements.progress[achievementId] = 0;
        }
        this.data.achievements.progress[achievementId] += value;
        this.checkAchievements();
    }
    
    checkAchievements() {
        const progress = this.data.achievements.progress;
        const unlocked = this.data.achievements.unlocked;
        
        // Check for new achievements
        const achievements = [
            { id: 'firstBase', condition: () => progress.basesOwned >= 1, name: '🏠 First Base', description: 'Purchase your first base' },
            { id: 'firstRaid', condition: () => progress.totalRaids >= 1, name: '⚔️ First Raid', description: 'Conduct your first raid' },
            { id: 'firstAsset', condition: () => progress.assetsOwned >= 1, name: '💎 First Asset', description: 'Purchase your first asset' },
            { id: 'millionaire', condition: () => progress.maxNetWorth >= 1000000, name: '💰 Millionaire', description: 'Reach $1M net worth' },
            { id: 'drugLord', condition: () => progress.maxNetWorth >= 5000000, name: '💎 Drug Lord', description: 'Reach $5M net worth' },
            { id: 'cartelBoss', condition: () => progress.maxNetWorth >= 10000000, name: '🏆 Cartel Boss', description: 'Reach $10M net worth' },
            { id: 'raidMaster', condition: () => progress.successfulRaids >= 50, name: '⚔️ Raid Master', description: 'Successfully complete 50 raids' },
            { id: 'empireBuilder', condition: () => progress.basesOwned >= 10, name: '🏢 Empire Builder', description: 'Own 10 bases' },
            { id: 'assetCollector', condition: () => progress.assetsOwned >= 20, name: '💎 Asset Collector', description: 'Own 20 assets' },
            { id: 'survivor', condition: () => progress.daysSurvived >= 100, name: '🕊️ Survivor', description: 'Survive 100 days' },
            { id: 'heatMaster', condition: () => progress.maxHeatSurvived >= 50000, name: '🔥 Heat Master', description: 'Survive with 50K+ warrant' },
            { id: 'traveler', condition: () => progress.citiesVisited >= 8, name: '✈️ Traveler', description: 'Visit 8 different cities' }
        ];
        
        achievements.forEach(achievement => {
            if (!unlocked.includes(achievement.id) && achievement.condition()) {
                unlocked.push(achievement.id);
                this.addNotification(`🏆 ${achievement.name}: ${achievement.description}`, 'success');
                this.emit('achievementUnlocked', achievement.id); // New event for achievement unlock
                this.emit('stateChange', { key: 'achievements', value: { ...this.data.achievements } });
            }
        });
    }
    
    getAchievements() {
        return {
            unlocked: this.data.achievements.unlocked,
            progress: this.data.achievements.progress
        };
    }
}

/**
 * GameState Event System
 *
 * Available Events:
 * - stateChange: { key, value } — Any state key changes
 * - cashChanged: newCash (number)
 * - inventoryChanged: { drug, amount } (drug name and new amount)
 * - gangChanged: newGangSize (number)
 * - warrantChanged: newWarrant (number)
 * - baseAdded: { city, base }
 * - cityChanged: newCity (string)
 * - gameSaved: void
 * - gameLoaded: void
 * - (add more as needed for new state changes)
 *
 * Example Usage:
 *   gameState.on('cashChanged', (newCash) => {
 *     // Update UI with new cash value
 *   });
 *
 *   gameState.once('gameLoaded', () => {
 *     // Do something once after game loads
 *   });
 */
// Export singleton instance
export const gameState = new GameState();