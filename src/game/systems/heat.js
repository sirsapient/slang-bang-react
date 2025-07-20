// js/systems/heat.js - Heat and warrant management system
import { formatCurrency, formatNumber } from '../utils.js';
/**
 * HeatSystem manages heat, warrant, raids, and bribery logic.
 */
export class HeatSystem {
    constructor(gameState, eventLogger) {
        this.state = gameState;
        this.events = eventLogger;
    }

    /**
     * Calculate current heat level based on warrant and time in city.
     * @returns {number}
     */
    calculateHeatLevel() {
        const warrantHeat = Math.min(this.state.get('warrant') / 10000, 50);
        const timeHeat = Math.max(0, this.state.get('daysInCurrentCity') - 3) * 5;
        const totalHeat = warrantHeat + timeHeat;
        this.state.set('heatLevel', Math.min(100, totalHeat));
        return this.state.get('heatLevel');
    }

    /**
     * Get heat level as text.
     * @returns {string}
     */
    getHeatLevelText() {
        const heat = this.state.get('heatLevel');
        if (heat < 20) return 'Low';
        if (heat < 40) return 'Medium';
        if (heat < 70) return 'High';
        return 'Critical';
    }

    /**
     * Get heat level color class.
     * @returns {string}
     */
    getHeatColorClass() {
        const heat = this.state.get('heatLevel');
        if (heat < 20) return 'heat-low';
        if (heat < 40) return 'heat-medium';
        if (heat < 70) return 'heat-high';
        return 'heat-critical';
    }

    /**
     * Apply warrant decay when staying in same city.
     */
    applyWarrantDecay() {
        const daysSinceTravel = this.state.get('daysSinceTravel');
        if (daysSinceTravel > 0) {
            let decayRate = 0.02;
            if (daysSinceTravel >= 3) decayRate = 0.035;
            if (daysSinceTravel >= 7) decayRate = 0.05;
            if (daysSinceTravel >= 14) decayRate = 0.08;
            const currentWarrant = this.state.get('warrant');
            const warrantReduction = Math.floor(currentWarrant * decayRate);
            if (warrantReduction > 0) {
                this.state.updateWarrant(-warrantReduction);
                this.events.add(`🕊️ Laying low is working - warrant reduced by ${formatNumber(warrantReduction)}`, 'good');
                // Removed notification - only keep event log
            } else if (daysSinceTravel === 7) {
                this.events.add(`😎 Heat cooling down - warrant reduced by ${formatNumber(warrantReduction)}`, 'good');
                // Removed notification - only keep event log
            } else if (daysSinceTravel >= 14 && daysSinceTravel % 7 === 0) {
                this.events.add(`🏖️ Deep cover paying off - warrant reduced by ${formatNumber(warrantReduction)}`, 'good');
                // Removed notification - only keep event log
            }
        }
    }

    /**
     * Check for police raids based on heat level.
     */
    checkPoliceRaid() {
        const inventory = this.state.get('inventory');
        const hasDrugs = Object.values(inventory).some(amount => amount > 0);
        if (!hasDrugs) {
            this.events.add('You have no drugs in your inventory. Police left you alone.', 'good');
            return;
        }
        const heat = this.calculateHeatLevel();
        if (heat >= 70) {
            const raidChance = Math.min(0.3, (heat - 70) / 100);
            if (Math.random() < raidChance) {
                this.executePoliceRaid();
            }
        }
    }

    /**
     * Execute a police raid.
     */
    executePoliceRaid() {
        const inventory = this.state.get('inventory');
        const hasDrugs = Object.values(inventory).some(amount => amount > 0);
        if (!hasDrugs) {
            this.events.add('🚔 Police raided but found no drugs in your inventory. You were left alone.', 'good');
            return;
        }
        const totalDrugs = this.state.getTotalInventory();
        const guns = this.state.get('guns');
        if (totalDrugs === 0 && guns === 0) {
            this.events.add('🚔 Police raided but found nothing! Lucky escape.', 'good');
            this.state.updateWarrant(-Math.floor(this.state.get('warrant') * 0.5));
            return;
        }
        const gunProtection = Math.min(0.4, guns * 0.02);
        const baseLossPercent = 0.3 + Math.random() * 0.4;
        const actualLossPercent = Math.max(0.1, baseLossPercent - gunProtection);
        const drugsLost = [];
        Object.keys(inventory).forEach(drug => {
            const currentAmount = inventory[drug];
            const lost = Math.floor(currentAmount * actualLossPercent);
            if (lost > 0) {
                this.state.updateInventory(drug, -lost);
                drugsLost.push(`${lost} ${drug}`);
            }
        });
        const cash = this.state.get('cash');
        const maxLoss24h = Math.floor(cash * 0.05);
        const alreadyLost = this.state.getRaidLossLast24h ? this.state.getRaidLossLast24h() : 0;
        let cashLoss = Math.floor(cash * (0.1 + Math.random() * 0.2));
        let allowedLoss = Math.max(0, maxLoss24h - alreadyLost);
        if (cashLoss > allowedLoss) cashLoss = allowedLoss;
        if (cashLoss > 0) {
            this.state.updateCash(-cashLoss);
            if (this.state.addRaidLoss) this.state.addRaidLoss(cashLoss);
        }
        const gunsLost = Math.floor(guns * (0.1 + Math.random() * 0.2));
        this.state.set('guns', Math.max(0, guns - gunsLost));
        const warrantIncrease = 5000 + Math.floor(Math.random() * 10000);
        this.state.updateWarrant(warrantIncrease);
        const assetValue = window.game?.systems?.assets?.getTotalAssetValue() || 0;
        if (assetValue > 0) {
            this.events.add('💎 Your assets were protected from the raid!', 'good');
        }
        let raidMessage = `🚔 POLICE RAID! Lost `;
        if (drugsLost.length > 0) {
            raidMessage += drugsLost.join(', ') + ', ';
        }
        raidMessage += `${formatNumber(cashLoss)} cash`;
        if (gunsLost > 0) {
            raidMessage += `, ${formatNumber(gunsLost)} guns`;
        }
        raidMessage += `, +${formatNumber(warrantIncrease)} warrant`;
        if (gunProtection > 0) {
            this.events.add(`🔫 Guns reduced raid losses by ${Math.floor(gunProtection * 100)}%`, 'good');
        }
        if (cashLoss === 0) {
            raidMessage += ' (cash loss capped for 24h)';
        }
        this.events.add(raidMessage, 'bad');
        this.state.addNotification(raidMessage, 'error');
    }

    /**
     * Generate heat from gang activities.
     */
    generateGangHeat() {
        const gangSize = this.state.get('gangSize');
        const inventory = this.state.get('inventory');
        const hasDrugs = Object.values(inventory).some(amount => amount > 0);
        if (hasDrugs) {
            const warrantIncrease = Math.floor(gangSize * 100 * Math.random());
            if (warrantIncrease > 0) {
                this.state.updateWarrant(warrantIncrease);
                this.events.add(`Gang activities increased heat by ${formatNumber(warrantIncrease)}`, 'bad');
                // Removed notification - only keep event log
            }
        }
    }

    /**
     * Handle travel heat reduction.
     */
    applyTravelHeatReduction() {
        const currentWarrant = this.state.get('warrant');
        const heatReduction = Math.floor(currentWarrant * 0.4);
        if (heatReduction > 0) {
            this.state.updateWarrant(-heatReduction);
            this.events.add(`🌊 Travel cooled you down, heat reduced by ${formatNumber(heatReduction)}`, 'good');
        }
    }

    /**
     * Attempt to process bribery. Returns {success, error}.
     * @param {number} cost
     * @param {number} reduction
     * @returns {{success: boolean, error?: string}}
     */
    processBribery(cost, reduction) {
        if (!this.state.canAfford(cost)) {
            return { success: false, error: `Can't afford bribe. Need ${formatCurrency(cost)}` };
        }
        this.state.updateCash(-cost);
        this.state.updateWarrant(-reduction);
        this.events.add(`💰 Paid ${formatCurrency(cost)} in bribes - warrant reduced by ${formatNumber(reduction)}`, 'good');
        this.state.addNotification(`💰 Paid ${formatCurrency(cost)} in bribes - warrant reduced by ${formatNumber(reduction)}`, 'success');
        if (Math.random() < 0.05) {
            const backfireWarrant = Math.floor(cost * 0.1);
            this.state.updateWarrant(backfireWarrant);
            this.events.add(`🚨 Bribery discovered! Additional warrant: ${formatNumber(backfireWarrant)}`, 'bad');
        }
        return { success: true };
    }

    /**
     * Get heat warning message.
     * @returns {string|null}
     */
    getHeatWarning() {
        const heat = this.state.get('heatLevel');
        if (heat >= 70) {
            return '🚨 CRITICAL: Police raids likely! Travel or pay bribes immediately!';
        } else if (heat >= 40) {
            return '⚠️ HIGH HEAT: Consider traveling to a new city or paying bribes.';
        }
        return null;
    }

    /**
     * Calculate bribery costs.
     * @returns {{cost: number, reduction: number}}
     */
    calculateBriberyCost() {
        const warrant = this.state.get('warrant');
        const cost = warrant * 2;
        const reduction = Math.floor(warrant * 0.75);
        return { cost, reduction };
    }
}