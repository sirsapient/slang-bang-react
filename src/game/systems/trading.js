// js/systems/trading.js - Market and trading system
import { formatCurrency, formatNumber } from '../utils.js';
/**
 * TradingSystem manages all market and trading logic: prices, buying, selling, supply, etc.
 */
export class TradingSystem {
    constructor(gameState, eventLogger, gameData) {
        this.state = gameState;
        this.events = eventLogger;
        this.data = gameData;
    }

    /**
     * Generate prices for all cities and initialize supply if needed.
     */
    generateAllCityPrices() {
        const cityPrices = {};
        // Initialize citySupply if needed
        if (!this.state.data.citySupply) {
            this.state.data.citySupply = {};
        }
        Object.keys(this.data.cities).forEach(city => {
            cityPrices[city] = this.generateCityPrices(city);
            // Always initialize supply for each city
            this.state.data.citySupply[city] = {};
            Object.keys(this.data.drugs).forEach(drug => {
                this.state.data.citySupply[city][drug] = Math.floor(Math.random() * 150) + 50;
            });
            // DEBUG: Log initial supply for this city
            console.log(`[DEBUG] Initialized supply for ${city}:`, this.state.data.citySupply[city]);
        });
        // IMPORTANT: Set cityPrices on the gameState object
        this.state.cityPrices = cityPrices;
        this.state.gameInitialized = true;
        console.log('Generated cityPrices:', cityPrices);
        // Emit state change so React knows to update
        this.state.emit('cityPricesGenerated', cityPrices);
        this.state.emit('stateChange', { key: 'cityPrices', value: cityPrices });
    }

    /**
     * Generate prices for a specific city.
     * @param {string} city
     * @returns {Object}
     */
    generateCityPrices(city) {
        const cityData = this.data.cities[city];
        const prices = {};
        Object.entries(this.data.drugs).forEach(([drug, drugData]) => {
            const basePrice = drugData.basePrice;
            const variation = (Math.random() - 0.5) * drugData.volatility;
            const price = Math.round(basePrice * (1 + variation) * cityData.heatModifier);
            prices[drug] = price;
        });
        return prices;
    }

    /**
     * Update market prices for all cities (called daily).
     */
    updateMarketPrices() {
        Object.keys(this.state.cityPrices).forEach(city => {
            Object.keys(this.state.cityPrices[city]).forEach(drug => {
                const drugData = this.data.drugs[drug];
                const cityData = this.data.cities[city];
                const volatility = 0.95 + Math.random() * 0.1;
                let newPrice = Math.floor(this.state.cityPrices[city][drug] * volatility);
                const minPrice = Math.floor(drugData.basePrice * cityData.heatModifier * 0.5);
                const maxPrice = Math.floor(drugData.basePrice * cityData.heatModifier * 2.0);
                newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
                this.state.cityPrices[city][drug] = newPrice;
            });
        });
        this.restockCitySupplies();
    }

    /**
     * Restock city drug supplies.
     */
    restockCitySupplies() {
        // Track restocked drugs for consolidated notification
        const restockedDrugs = {};
        
        Object.keys(this.state.data.citySupply).forEach(city => {
            restockedDrugs[city] = [];
            
            Object.keys(this.state.data.citySupply[city]).forEach(drug => {
                const currentSupply = this.state.data.citySupply[city][drug];
                if (currentSupply < 20) {
                    const restockAmount = Math.floor(10 + Math.random() * 20);
                    this.state.data.citySupply[city][drug] = Math.min(200, currentSupply + restockAmount);
                    if (currentSupply === 0) {
                        restockedDrugs[city].push({ drug, amount: restockAmount });
                    }
                } else if (currentSupply < 50) {
                    const restockAmount = Math.floor(5 + Math.random() * 10);
                    this.state.data.citySupply[city][drug] = Math.min(200, currentSupply + restockAmount);
                }
            });
        });
        
        // Show consolidated restock notifications
        Object.keys(restockedDrugs).forEach(city => {
            const drugs = restockedDrugs[city];
            if (drugs.length > 0) {
                if (city === this.state.get('currentCity')) {
                    this.showConsolidatedRestockNotification(city, drugs);
                } else {
                    // Just add to event log for other cities
                    const drugList = drugs.map(d => `${d.drug} (+${d.amount})`).join(', ');
                    this.events.add(`📦 Drug supply restocked in ${city}: ${drugList}`, 'neutral');
                }
            }
        });
    }

    /**
     * Attempt to buy drugs. Returns {success, error}.
     * @param {string} drug
     * @param {number} quantity
     * @returns {{success: boolean, error?: string}}
     */
    buyDrug(drug, quantity) {
        console.log('[DEBUG] buyDrug this.state:', this.state);
        console.log('[DEBUG] buyDrug this.state.updateInventory:', this.state.updateInventory);
        console.log('[DEBUG] buyDrug this.state.updateCash:', this.state.updateCash);
        const city = this.state.get('currentCity');
        const price = this.state.cityPrices[city][drug];
        const totalCost = price * quantity;
        const supply = this.state.data.citySupply[city][drug];
        if (quantity <= 0) {
            return { success: false, error: `Enter a quantity to buy ${drug}` };
        }
        if (quantity > supply) {
            return { success: false, error: `Only ${supply} ${drug} available in ${city}` };
        }
        if (!this.state.canAfford(totalCost)) {
            return { success: false, error: `Not enough cash to buy ${quantity} ${drug}` };
        }
        this.state.updateCash(-totalCost);
        this.state.updateInventory(drug, quantity);
        this.state.data.citySupply[city][drug] -= quantity;
        this.events.add(`Bought ${quantity} ${drug} for ${formatCurrency(totalCost)}`, 'good');
        
        // Add notification for successful purchase
        this.state.addNotification(`Bought ${quantity} ${drug} for ${formatCurrency(totalCost)}`, 'success');
        
        if (quantity >= 10) {
            const warrantIncrease = Math.floor(quantity * 50);
            this.state.updateWarrant(warrantIncrease);
            this.events.add(`Large purchase increased heat by ${formatNumber(warrantIncrease)}`, 'bad');
            this.state.addNotification(`Large purchase increased heat by ${formatNumber(warrantIncrease)}`, 'warning');
        }
        return { success: true };
    }

    /**
     * Attempt to sell drugs. Returns {success, error}.
     * @param {string} drug
     * @param {number} quantity
     * @returns {{success: boolean, error?: string}}
     */
    sellDrug(drug, quantity) {
        const city = this.state.get('currentCity');
        const price = this.state.cityPrices[city][drug];
        const owned = this.state.getInventory(drug);
        if (quantity <= 0) {
            return { success: false, error: `Enter a quantity to sell ${drug}` };
        }
        if (quantity > owned) {
            return { success: false, error: `You only have ${owned} ${drug} to sell` };
        }
        const totalEarned = price * quantity;
        this.state.updateCash(totalEarned);
        this.state.updateInventory(drug, -quantity);
        this.events.add(`Sold ${quantity} ${drug} for ${formatCurrency(totalEarned)}`, 'good');
        
        // Add notification for successful sale
        this.state.addNotification(`Sold ${quantity} ${drug} for ${formatCurrency(totalEarned)}`, 'success');
        
        return { success: true };
    }

    /**
     * Attempt to sell all drugs. Returns {success, error, totalEarned, drugsSold}.
     * @returns {{success: boolean, error?: string, totalEarned?: number, drugsSold?: Array<string>}}
     */
    sellAllDrugs() {
        const city = this.state.get('currentCity');
        let totalEarned = 0;
        const drugsSold = [];
        Object.keys(this.state.get('inventory')).forEach(drug => {
            const quantity = this.state.getInventory(drug);
            if (quantity > 0) {
                const price = this.state.cityPrices[city][drug];
                const earned = price * quantity;
                totalEarned += earned;
                this.state.updateInventory(drug, -quantity);
                drugsSold.push(`${quantity} ${drug}`);
            }
        });
        if (totalEarned > 0) {
            this.state.updateCash(totalEarned);
            this.events.add(`💸 Sold all drugs (${drugsSold.join(', ')}) for ${formatCurrency(totalEarned)}`, 'good');
            this.state.addNotification(`💸 Sold all drugs for ${formatCurrency(totalEarned)}`, 'success');
            return { success: true, totalEarned, drugsSold };
        } else {
            return { success: false, error: 'No drugs to sell' };
        }
    }

    /**
     * Get current city prices.
     * @returns {Object}
     */
    getCurrentCityPrices() {
        const city = this.state.get('currentCity');
        return this.state.cityPrices[city] || {};
    }

    /**
     * Get city prices for a specific city.
     * @param {string} city
     * @returns {Object}
     */
    getCityPrices(city) {
        return this.state.cityPrices[city] || {};
    }

    /**
     * Get drug supply for current city.
     * @param {string} drug
     * @returns {number}
     */
    getCurrentCitySupply(drug) {
        const city = this.state.get('currentCity');
        return this.state.data.citySupply[city]?.[drug] || 0;
    }

    /**
     * Get price comparison between current and target city.
     * @param {string} drug
     * @param {string} targetCity
     * @returns {Object}
     */
    getPriceComparison(drug, targetCity) {
        const currentCity = this.state.get('currentCity');
        const currentPrice = this.state.cityPrices[currentCity]?.[drug] || 0;
        const targetPrice = this.state.cityPrices[targetCity]?.[drug] || 0;
        const difference = targetPrice - currentPrice;
        const percentDiff = currentPrice > 0 ? (difference / currentPrice) * 100 : 0;
        let indicator = '';
        let color = '#66ff66';
        if (percentDiff < -10) {
            indicator = '📈 GREAT BUY';
            color = '#00ff00';
        } else if (percentDiff < 0) {
            indicator = '📊 Good Buy';
            color = '#66ff66';
        } else if (percentDiff > 10) {
            indicator = '📉 Poor Deal';
            color = '#ff6666';
        } else if (percentDiff > 0) {
            indicator = '📊 Good Sell';
            color = '#ff9999';
        }
        return {
            currentPrice,
            targetPrice,
            difference,
            percentDiff,
            indicator,
            color
        };
    }

    /**
     * Calculate travel cost between current city and destination.
     * @param {string} destination
     * @returns {number}
     */
    calculateTravelCost(destination) {
        const currentCity = this.state.get('currentCity');
        const currentDistance = this.data.cities[currentCity].distanceIndex;
        const destDistance = this.data.cities[destination].distanceIndex;
        const distance = Math.abs(currentDistance - destDistance);
        const cost = this.data.config.baseTravelCost + (distance * 100);
        return Math.min(cost, this.data.config.maxTravelCost);
    }
    
    /**
     * Show consolidated restock notification for a city
     * @param {string} city
     * @param {Array} drugs
     */
    showConsolidatedRestockNotification(city, drugs) {
        if (drugs.length === 0) return;
        
        if (window.game && window.game.ui && window.game.ui.modals) {
            let content = `📦 Drug supply restocked in ${city}!<br><br>`;
            
            drugs.forEach((item, index) => {
                content += `<strong>${item.drug}</strong>: +${item.amount} units<br>`;
            });
            
            content += `<br>Check the Trading screen to purchase!`;
            
            window.game.ui.modals.alert(
                content,
                `📦 ${drugs.length} Drug${drugs.length > 1 ? 's' : ''} Restocked!`
            );
        }
    }
}