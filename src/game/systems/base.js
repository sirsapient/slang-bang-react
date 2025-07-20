// js/systems/bases.js - Base management system
import { formatCurrency, formatNumber } from '../utils.js';
/**
 * BaseSystem manages all base-related logic: purchasing, upgrading, storage, income, etc.
 */
export class BaseSystem {
    constructor(gameState, eventLogger, gameData) {
        this.state = gameState;
        this.events = eventLogger;
        this.data = gameData;
    }

    /**
     * Calculate base cost for a city.
     * @param {string} city
     * @returns {number}
     */
    calculateBaseCost(city) {
        const baseCost = this.data.baseTypes[1].cost;
        const cityModifier = this.data.cities[city].heatModifier;
        return Math.floor(baseCost * cityModifier);
    }

    /**
     * Attempt to purchase a base. Returns {success, error}.
     * @param {string} city
     * @returns {{success: boolean, error?: string}}
     */
    purchaseBase(city) {
        const cost = this.calculateBaseCost(city);
        if (this.state.hasBase(city)) {
            return { success: false, error: `You already own a base in ${city}` };
        }
        if (this.state.get('gangSize') < 4) {
            return { success: false, error: 'Need at least 4 gang members to purchase a base' };
        }
        if (!this.state.canAfford(cost)) {
            return { success: false, error: `Can't afford base in ${city}. Need ${formatCurrency(cost)}` };
        }
        this.state.updateCash(-cost);
        this.state.addBase(city, {
            city: city,
            level: 1,
            assignedGang: 0,
            drugStorage: 0,
            operational: false,
            cashStored: 0,
            lastCollection: this.state.get('day'),
            guns: 0,
            inventory: this.createEmptyInventory()
        });
        this.events.add(`🏠 Purchased Trap House in ${city} for ${formatCurrency(cost)}`, 'good');
        this.state.addNotification(`🏠 Purchased Trap House in ${city} for ${formatCurrency(cost)}`, 'success');
        
        // Track achievements
        this.state.trackAchievement('basesOwned');
        this.state.trackAchievement('firstBase');
        
        return { success: true };
    }

    /**
     * Create empty inventory for base.
     * @returns {Object}
     */
    createEmptyInventory() {
        const inventory = {};
        Object.keys(this.data.drugs).forEach(drug => {
            inventory[drug] = 0;
        });
        return inventory;
    }

    /**
     * Assign gang members to base.
     * @param {string} city
     * @param {number} amount
     * @returns {{success: boolean, error?: string}}
     */
    assignGangToBase(city, amount) {
        const base = this.state.getBase(city);
        if (!base) return { success: false, error: 'Base not found' };
        const available = this.state.getAvailableGangMembersInCity(city);
        const actualAmount = Math.min(amount, available);
        if (actualAmount > 0) {
            base.assignedGang += actualAmount;
            this.updateBaseOperationalStatus(city);
            this.events.add(`Assigned ${actualAmount} gang members to ${city} base`, 'good');
            return { success: true };
        }
        return { success: false, error: 'No available gang members to assign' };
    }

    /**
     * Remove gang members from base.
     * @param {string} city
     * @param {number} amount
     * @returns {{success: boolean, error?: string}}
     */
    removeGangFromBase(city, amount) {
        const base = this.state.getBase(city);
        if (!base) return { success: false, error: 'Base not found' };
        const actualAmount = Math.min(amount, base.assignedGang);
        if (actualAmount > 0) {
            base.assignedGang -= actualAmount;
            this.updateBaseOperationalStatus(city);
            this.events.add(`Removed ${actualAmount} gang members from ${city} base`, 'neutral');
            if (window.game && window.game.ui && window.game.ui.modals) {
                window.game.ui.modals.showNotification(`Removed ${actualAmount} gang members from ${city} base`, 'warning', 4000);
            }
            return { success: true };
        }
        return { success: false, error: 'No gang members to remove' };
    }

    /**
     * Update base operational status.
     * @param {string} city
     */
    updateBaseOperationalStatus(city) {
        const base = this.state.getBase(city);
        if (!base) return;
        const baseType = this.data.baseTypes[base.level];
        const hasEnoughGang = base.assignedGang >= baseType.gangRequired;
        const hasEnoughGuns = (base.guns || 0) >= baseType.gunsRequired;
        const hasDrugs = this.getBaseDrugCount(base) > 0;
        base.operational = hasEnoughGang && hasEnoughGuns && hasDrugs;
    }

    /**
     * Get total drugs in base.
     * @param {Object} base
     * @returns {number}
     */
    getBaseDrugCount(base) {
        if (!base.inventory) return 0;
        return Object.values(base.inventory).reduce((sum, qty) => sum + qty, 0);
    }

    /**
     * Calculate base income.
     * @param {Object} base
     * @returns {number}
     */
    calculateBaseIncome(base) {
        const baseType = this.data.baseTypes[base.level];
        const efficiency = Math.min(1, base.assignedGang / baseType.gangRequired);
        const drugBonus = this.getBaseDrugCount(base) > 0 ? this.data.config.baseIncomeBonus : 1;
        
        // Add rank-based income scaling
        const playerRank = window.game?.screens?.home?.getCurrentRank() || 1;
        const incomeScaling = this.data?.config?.baseIncomeScaling || 1.15;
        const rankBonus = Math.pow(incomeScaling, playerRank - 1);
        
        return Math.floor(baseType.income * efficiency * drugBonus * rankBonus);
    }
    
    /**
     * Get base efficiency bonus percentage.
     * @param {Object} base
     * @returns {number}
     */
    getBaseEfficiencyBonus(base) {
        const baseType = this.data.baseTypes[base.level];
        const extraGang = Math.max(0, base.assignedGang - baseType.gangRequired);
        const extraGuns = Math.max(0, (base.guns || 0) - baseType.gunsRequired);
        
        // Each extra gang member provides 2% bonus
        const gangBonus = extraGang * 0.02;
        // Each extra gun provides 1% bonus
        const gunBonus = extraGuns * 0.01;
        
        return gangBonus + gunBonus;
    }

    /**
     * Generate daily income for all bases.
     */
    generateDailyIncome() {
        let totalIncome = 0;
        Object.values(this.state.data.bases).forEach(base => {
            if (base.operational) {
                const income = this.calculateBaseIncome(base);
                base.cashStored = Math.min(base.cashStored + income, this.data.baseTypes[base.level].maxSafe);
                totalIncome += income;
                // Consume drugs
                if (this.getBaseDrugCount(base) > 0) {
                    const availableDrugs = Object.keys(base.inventory).filter(drug => base.inventory[drug] > 0);
                    if (availableDrugs.length > 0) {
                        const drugToConsume = availableDrugs[Math.floor(Math.random() * availableDrugs.length)];
                        base.inventory[drugToConsume]--;
                        this.updateBaseOperationalStatus(base.city);
                    }
                }
            }
        });
        if (totalIncome > 0) {
            this.events.add(`🏢 Bases generated ${formatCurrency(totalIncome)} income`, 'good');
        }
    }

    /**
     * Collect income from a base. Returns {success, error}.
     * @param {string} city
     * @returns {{success: boolean, error?: string}}
     */
    collectBaseIncome(city) {
        const base = this.state.getBase(city);
        if (!base || base.cashStored === 0) return { success: false, error: 'No income to collect' };
        const collected = base.cashStored;
        // Guard: Only add if collected is a valid number
        if (typeof collected !== 'number' || isNaN(collected) || collected < 0) {
            console.warn(`Invalid base.cashStored value for ${city}:`, collected);
            this.events.add(`⚠️ Error: Invalid cash stored in ${city} base.`, 'bad');
            return { success: false, error: 'Invalid cash stored in base' };
        }
        this.state.updateCash(collected);
        base.cashStored = 0;
        this.events.add(`💰 Collected ${formatCurrency(collected)} from ${city} base`, 'good');
        // Removed notification - only keep event log
        return { success: true };
    }

    /**
     * Collect income from all bases. Returns {success, error, totalCollected}.
     * @returns {{success: boolean, error?: string, totalCollected?: number}}
     */
    collectAllBaseCash() {
        let totalCollected = 0;
        Object.values(this.state.data.bases).forEach(base => {
            if (base.cashStored > 0) {
                // Guard: Only add if cashStored is a valid number
                if (typeof base.cashStored !== 'number' || isNaN(base.cashStored) || base.cashStored < 0) {
                    console.warn(`Invalid base.cashStored value in collectAllBaseCash:`, base.cashStored, base);
                    this.events.add(`⚠️ Error: Invalid cash stored in a base. Skipping.`, 'bad');
                    return;
                }
                totalCollected += base.cashStored;
                base.cashStored = 0;
            }
        });
        if (totalCollected > 0) {
            this.state.updateCash(totalCollected);
            this.events.add(`💰 Collected ${formatCurrency(totalCollected)} from all bases`, 'good');
            // Removed notification - only keep event log
            return { success: true, totalCollected };
        }
        return { success: false, error: 'No income to collect' };
    }

    /**
     * Attempt to upgrade a base. Returns {success, error}.
     * @param {string} city
     * @returns {{success: boolean, error?: string}}
     */
    upgradeBase(city) {
        const base = this.state.getBase(city);
        if (!base) return { success: false, error: 'Base not found' };
        const currentType = this.data.baseTypes[base.level];
        if (!currentType.upgradeCost) {
            return { success: false, error: `${city} base is already at maximum level` };
        }
        if (!this.state.canAfford(currentType.upgradeCost)) {
            return { success: false, error: `Need ${formatCurrency(currentType.upgradeCost)} to upgrade ${city} base` };
        }
        const newLevel = base.level + 1;
        const newType = this.data.baseTypes[newLevel];
        this.state.updateCash(-currentType.upgradeCost);
        base.level = newLevel;
        this.updateBaseOperationalStatus(city);
        this.events.add(`🔧 Upgraded ${city} base to ${newType.name} for ${formatCurrency(currentType.upgradeCost)}`, 'good');
        return { success: true };
    }

    /**
     * Attempt to store drugs in a base. Returns {success, error}.
     * @param {string} city
     * @param {string} drug
     * @param {number} amount
     * @returns {{success: boolean, error?: string}}
     */
    storeDrugsInBase(city, drug, amount) {
        const base = this.state.getBase(city);
        if (!base) return { success: false, error: 'Base not found' };
        const baseType = this.data.baseTypes[base.level];
        const currentStorage = this.getBaseDrugCount(base);
        const spaceAvailable = baseType.maxInventory - currentStorage;
        const drugsCount = Object.keys(this.data.drugs).length;
        const perDrugCap = Math.floor(baseType.maxInventory / drugsCount);
        const currentDrugAmount = base.inventory[drug] || 0;
        const perDrugSpace = perDrugCap - currentDrugAmount;
        if (spaceAvailable <= 0 || perDrugSpace <= 0) {
            return { success: false, error: 'Base storage is full for this drug' };
        }
        const playerHas = this.state.getInventory(drug);
        const actualAmount = Math.min(amount, playerHas, spaceAvailable, perDrugSpace);
        if (actualAmount > 0) {
            this.state.updateInventory(drug, -actualAmount);
            base.inventory[drug] = (base.inventory[drug] || 0) + actualAmount;
            this.updateBaseOperationalStatus(city);
            this.events.add(`Stored ${actualAmount} ${drug} in ${city} base`, 'good');
            return { success: true };
        }
        return { success: false, error: 'No drugs to store' };
    }

    /**
     * Attempt to take drugs from a base. Returns {success, error}.
     * @param {string} city
     * @param {string} drug
     * @param {number} amount
     * @returns {{success: boolean, error?: string}}
     */
    takeDrugsFromBase(city, drug, amount) {
        const base = this.state.getBase(city);
        if (!base || !base.inventory[drug]) return { success: false, error: 'No drugs to take' };
        const actualAmount = Math.min(amount, base.inventory[drug]);
        if (actualAmount > 0) {
            base.inventory[drug] -= actualAmount;
            this.state.updateInventory(drug, actualAmount);
            this.updateBaseOperationalStatus(city);
            this.events.add(`Took ${actualAmount} ${drug} from ${city} base`, 'good');
            return { success: true };
        }
        return { success: false, error: 'No drugs to take' };
    }

    /**
     * Assign guns to base.
     * @param {string} city
     * @param {number} amount
     * @returns {{success: boolean, error?: string}}
     */
    assignGunsToBase(city, amount) {
        const base = this.state.getBase(city);
        if (!base) return { success: false, error: 'Base not found' };
        const available = this.state.getAvailableGunsInCity(city);
        const actualAmount = Math.min(amount, available);
        if (actualAmount > 0) {
            base.guns = (base.guns || 0) + actualAmount;
            this.state.removeGunsFromCity(city, actualAmount);
            this.updateBaseOperationalStatus(city);
            this.events.add(`Assigned ${actualAmount} guns to ${city} base`, 'good');
            return { success: true };
        }
        return { success: false, error: 'No available guns to assign' };
    }

    /**
     * Remove guns from base.
     * @param {string} city
     * @param {number} amount
     * @returns {{success: boolean, error?: string}}
     */
    removeGunsFromBase(city, amount) {
        const base = this.state.getBase(city);
        if (!base) return { success: false, error: 'Base not found' };
        const actualAmount = Math.min(amount, base.guns || 0);
        if (actualAmount > 0) {
            base.guns -= actualAmount;
            this.state.addGunsToCity(city, actualAmount);
            this.updateBaseOperationalStatus(city);
            this.events.add(`Removed ${actualAmount} guns from ${city} base`, 'neutral');
            return { success: true };
        }
        return { success: false, error: 'No guns to remove' };
    }

    // Buy guns for base
    buyGunsForBase(city, amount = 1) {
        const base = this.state.getBase(city);
        if (!base) return false;
        
        const costPerGun = this.data.config.gunCost;
        const totalCost = costPerGun * amount;
        
        if (!this.state.canAfford(totalCost)) {
            this.events.add(`Need ${totalCost.toLocaleString()} to buy ${amount} guns`, 'bad');
            return false;
        }
        
        this.state.updateCash(-totalCost);
        this.state.updateGuns(amount);
        this.events.add(`Bought ${amount} guns for inventory`, 'good');
        return true;
    }
    
    // Calculate daily income for all bases
    calculateTotalDailyIncome() {
        let total = 0;
        Object.values(this.state.data.bases).forEach(base => {
            if (base.operational) {
                total += this.calculateBaseIncome(base);
            }
        });
        return total;
    }
    
    // Get base summary
    getBaseSummary() {
        const bases = this.state.data.bases;
        const basesOwned = Object.keys(bases).length;
        let assignedGang = 0;
        let assignedGuns = 0;
        let totalCashStored = 0;
        let operationalBases = 0;
        
        Object.values(bases).forEach(base => {
            assignedGang += base.assignedGang;
            assignedGuns += (base.guns || 0);
            totalCashStored += base.cashStored;
            if (base.operational) operationalBases++;
        });
        
        return {
            basesOwned,
            operationalBases,
            assignedGang,
            assignedGuns,
            totalCashStored,
            dailyIncome: this.calculateTotalDailyIncome()
        };
    }

    // Process real-time sales for all bases (called every minute)
    processRealTimeSales() {
        const UNITS_PER_MIN = 1 / 60; // 0.01667 units per minute
        Object.values(this.state.data.bases).forEach(base => {
            if (!base.operational) return;
            const city = base.city;
            const cityPrices = this.state.cityPrices[city] || {};
            let soldAny = false;
            Object.keys(base.inventory).forEach(drug => {
                let available = base.inventory[drug];
                if (available >= 0.01) {
                    const toSell = Math.min(UNITS_PER_MIN, available);
                    const price = cityPrices[drug] || 0;
                    const profit = toSell * price * 3;
                    base.inventory[drug] -= toSell;
                    base.cashStored = (base.cashStored || 0) + profit;
                    soldAny = true;
                }
            });
            if (soldAny) {
                this.updateBaseOperationalStatus(city);
            }
        });
    }

    /**
     * Check for base raids and execute them.
     */
    checkForBaseRaids() {
        Object.values(this.state.data.bases).forEach(base => {
            if (!base.operational) return;
            
            // Base raid chance increases with heat and decreases with defense
            const heat = this.state.get('warrant');
            const baseRaidChance = Math.min(0.15, (heat - 50) / 200); // Max 15% chance
            
            if (Math.random() < baseRaidChance) {
                this.executeBaseRaid(base);
            }
        });
    }

    /**
     * Execute a raid on a base.
     * @param {Object} base
     */
    executeBaseRaid(base) {
        const baseType = this.data.baseTypes[base.level];
        const gangDefense = base.assignedGang * 0.1; // Each gang member provides 10% defense
        const gunDefense = (base.guns || 0) * 0.05; // Each gun provides 5% defense
        const totalDefense = Math.min(0.8, gangDefense + gunDefense); // Max 80% defense
        
        const raidSuccess = Math.random() > totalDefense;
        
        if (raidSuccess) {
            // Raid successful - calculate losses
            const cashLost = Math.floor(base.cashStored * (0.3 + Math.random() * 0.4)); // 30-70% of cash
            const gunsLost = Math.floor((base.guns || 0) * (0.2 + Math.random() * 0.3)); // 20-50% of guns
            const gangLost = Math.floor(base.assignedGang * (0.1 + Math.random() * 0.2)); // 10-30% of gang
            
            // Apply losses
            base.cashStored = Math.max(0, base.cashStored - cashLost);
            base.guns = Math.max(0, (base.guns || 0) - gunsLost);
            base.assignedGang = Math.max(0, base.assignedGang - gangLost);
            
            // Add notification for gang losses
            if (gangLost > 0 && window.game && window.game.ui && window.game.ui.modals) {
                window.game.ui.modals.showNotification(`Lost ${gangLost} gang members from ${base.city} base in raid`, 'error', 4000);
            }
            
            // Lose some drugs
            const drugsLost = {};
            Object.keys(base.inventory).forEach(drug => {
                if (base.inventory[drug] > 0) {
                    const lost = Math.floor(base.inventory[drug] * (0.2 + Math.random() * 0.3));
                    base.inventory[drug] = Math.max(0, base.inventory[drug] - lost);
                    if (lost > 0) drugsLost[drug] = lost;
                }
            });
            
            // Update operational status
            this.updateBaseOperationalStatus(base.city);
            
            // Log the raid
            let raidMessage = `🚨 ${base.city} base was raided! `;
            if (cashLost > 0) raidMessage += `Lost $${cashLost.toLocaleString()} cash. `;
            if (gunsLost > 0) raidMessage += `Lost ${gunsLost} guns. `;
            if (gangLost > 0) raidMessage += `Lost ${gangLost} gang members. `;
            if (Object.keys(drugsLost).length > 0) {
                const drugList = Object.entries(drugsLost).map(([drug, amount]) => `${amount} ${drug}`).join(', ');
                raidMessage += `Lost ${drugList}. `;
            }
            
            this.events.add(raidMessage, 'bad');
            
            // Increase heat from the raid
            const heatIncrease = Math.floor(1000 + Math.random() * 2000);
            this.state.updateWarrant(heatIncrease);
            this.events.add(`Heat increased by ${heatIncrease.toLocaleString()} from the raid`, 'bad');
            
        } else {
            // Raid failed - defenders held them off
            this.events.add(`🚨 ${base.city} base was attacked but your crew held them off!`, 'good');
            
            // Small heat increase even for failed raids
            const heatIncrease = Math.floor(200 + Math.random() * 500);
            this.state.updateWarrant(heatIncrease);
        }
    }
}