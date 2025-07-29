// js/systems/baseDefense.js - Player base defense system
export class BaseDefenseSystem {
    constructor(state, events, data) {
        this.state = state;
        this.events = events;
        this.data = data;
    }

    /**
     * Calculate the probability of a player base being raided
     * @param {string} city - The city where the base is located
     * @param {Object} base - The player's base object
     * @returns {number} Probability of being raided (0-1)
     */
    calculateRaidProbability(city, base) {
        // Base probability starts at 5% per day
        let probability = 0.05;
        
        // Heat increases raid probability
        const heatLevel = this.state.get('warrant') || 0;
        const heatMultiplier = Math.min(2.0, 1 + (heatLevel / 10000)); // Max 2x from heat
        probability *= heatMultiplier;
        
        // City raid activity increases probability
        const cityRaidActivity = this.state.getCityRaidActivity ? this.state.getCityRaidActivity(city) : { count: 0 };
        const raidCount = cityRaidActivity.count || 0;
        const activityMultiplier = 1 + (raidCount * 0.1); // 10% increase per raid in city
        probability *= activityMultiplier;
        
        // Base level affects probability (higher level = more attractive target)
        const levelMultiplier = 1 + (base.level * 0.2); // 20% increase per base level
        probability *= levelMultiplier;
        
        // Gang members provide protection (reduces probability)
        const gangProtection = Math.min(0.5, base.assignedGang * 0.1); // Max 50% protection
        probability *= (1 - gangProtection);
        
        // Cap probability between 1% and 50%
        return Math.max(0.01, Math.min(0.5, probability));
    }

    /**
     * Calculate raid success chance for enemy attacking player base
     * @param {Object} base - Player's base
     * @param {number} enemyGangSize - Number of enemy gang members
     * @param {number} enemyGuns - Number of enemy guns
     * @returns {number} Success chance (0-1)
     */
    calculateRaidSuccess(base, enemyGangSize, enemyGuns) {
        // Base success chance starts at 30%
        let successChance = 0.3;
        
        // Enemy gang size advantage
        const gangRatio = enemyGangSize / Math.max(base.assignedGang, 1);
        successChance += (gangRatio - 1) * 0.3;
        
        // Enemy guns advantage
        const gunRatio = enemyGuns / Math.max(base.guns, 1);
        successChance += (gunRatio - 1) * 0.2;
        
        // Base level provides defense bonus
        const baseDefense = base.level * 0.1; // 10% defense per level
        successChance -= baseDefense;
        
        // Clamp between 5% and 95%
        return Math.max(0.05, Math.min(0.95, successChance));
    }

    /**
     * Calculate losses when player base is raided
     * @param {Object} base - Player's base
     * @param {boolean} isSuccessful - Whether the raid was successful
     * @param {number} successChance - The calculated success chance
     * @returns {Object} Loss breakdown
     */
    calculateBaseLosses(base, isSuccessful, successChance) {
        const losses = {
            gangLost: 0,
            gunsLost: 0,
            drugsLost: {},
            cashLost: 0,
            totalLosses: 0
        };

        // Base loss percentage depends on success
        let baseLossPercentage;
        if (isSuccessful) {
            baseLossPercentage = 0.2 + (successChance * 0.3); // 20-50% for successful raids
        } else {
            baseLossPercentage = 0.05 + (successChance * 0.15); // 5-20% for failed raids
        }

        // Apply randomness
        const randomFactor = 0.7 + (Math.random() * 0.6); // ±30% variation
        const finalLossPercentage = baseLossPercentage * randomFactor;

        // PRIORITY-BASED LOSS SYSTEM
        // 1. First, lose guns and gang members
        const availableGang = base.assignedGang || 0;
        const availableGuns = base.guns || 0;
        
        // Calculate gang and gun losses
        losses.gangLost = Math.floor(availableGang * finalLossPercentage);
        losses.gunsLost = Math.floor(availableGuns * finalLossPercentage);
        
        // Ensure we don't lose more than available
        losses.gangLost = Math.min(losses.gangLost, availableGang);
        losses.gunsLost = Math.min(losses.gunsLost, availableGuns);
        
        // 2. Only lose drugs and cash if gang members are zero
        const remainingGang = availableGang - losses.gangLost;
        
        if (remainingGang === 0) {
            // Calculate drug losses
            if (base.inventory && typeof base.inventory === 'object') {
                Object.keys(base.inventory).forEach(drug => {
                    const currentAmount = base.inventory[drug] || 0;
                    const drugLoss = Math.floor(currentAmount * finalLossPercentage);
                    if (drugLoss > 0) {
                        losses.drugsLost[drug] = drugLoss;
                    }
                });
            }
            
            // Calculate cash losses
            const availableCash = base.cashStored || 0;
            losses.cashLost = Math.floor(availableCash * finalLossPercentage);
        }

        // Calculate total losses for reporting
        losses.totalLosses = losses.gangLost + losses.gunsLost + 
            Object.values(losses.drugsLost).reduce((sum, amount) => sum + amount, 0) + 
            losses.cashLost;

        return losses;
    }

    /**
     * Execute a raid on a player base
     * @param {string} baseId - The base ID to raid
     * @returns {Object} Raid result
     */
    executeBaseRaid(baseId) {
        // Find the base
        const bases = this.state.get('bases') || {};
        let targetBase = null;
        let baseCity = null;

        // Search through all cities for the base
        Object.keys(bases).forEach(city => {
            const cityBases = bases[city];
            if (Array.isArray(cityBases)) {
                const found = cityBases.find(base => base.id === baseId);
                if (found) {
                    targetBase = found;
                    baseCity = city;
                }
            }
        });

        if (!targetBase) {
            console.error('Base not found for raid:', baseId);
            return { success: false, error: 'Base not found' };
        }

        // Calculate raid probability
        const raidProbability = this.calculateRaidProbability(baseCity, targetBase);
        const isRaided = Math.random() < raidProbability;

        if (!isRaided) {
            return { success: false, raided: false, message: 'No raid occurred' };
        }

        // Generate enemy forces
        const enemyGangSize = Math.floor(Math.random() * 20) + 5; // 5-25 enemy gang members
        const enemyGuns = Math.floor(enemyGangSize * (0.8 + Math.random() * 0.4)); // 80-120% guns per gang member

        // Calculate raid success
        const successChance = this.calculateRaidSuccess(targetBase, enemyGangSize, enemyGuns);
        const isSuccessful = Math.random() < successChance;

        // Calculate losses
        const losses = this.calculateBaseLosses(targetBase, isSuccessful, successChance);

        // Apply losses to the base
        this.applyBaseLosses(targetBase, losses);

        // Generate raid message
        const raidMessage = this.generateRaidMessage(targetBase, isSuccessful, losses, enemyGangSize, enemyGuns);

        // Add notification
        this.events.add(raidMessage, isSuccessful ? 'bad' : 'good');
        this.state.addNotification(raidMessage, isSuccessful ? 'error' : 'success');

        return {
            success: true,
            raided: true,
            successful: isSuccessful,
            losses: losses,
            enemyForces: {
                gangSize: enemyGangSize,
                guns: enemyGuns
            },
            message: raidMessage
        };
    }

    /**
     * Apply calculated losses to the base
     * @param {Object} base - The base to apply losses to
     * @param {Object} losses - The calculated losses
     */
    applyBaseLosses(base, losses) {
        // Remove gang members
        if (losses.gangLost > 0) {
            base.assignedGang = Math.max(0, (base.assignedGang || 0) - losses.gangLost);
            // Do NOT update city gang count here
            // const city = base.city;
            // const currentCityGang = this.state.getGangMembersInCity ? this.state.getGangMembersInCity(city) : 0;
            // if (this.state.updateGangMembersInCity) {
            //     this.state.updateGangMembersInCity(city, currentCityGang - losses.gangLost);
            // }
        }

        // Remove guns
        if (losses.gunsLost > 0) {
            base.guns = Math.max(0, (base.guns || 0) - losses.gunsLost);
            // Do NOT update city gun count here
            // const city = base.city;
            // const currentCityGuns = this.state.getGunsInCity ? this.state.getGunsInCity(city) : 0;
            // if (this.state.updateGunsInCity) {
            //     this.state.updateGunsInCity(city, currentCityGuns - losses.gunsLost);
            // }
        }

        // Remove drugs (only if gang members are zero)
        if (Object.keys(losses.drugsLost).length > 0) {
            Object.keys(losses.drugsLost).forEach(drug => {
                const currentAmount = base.inventory[drug] || 0;
                const newAmount = Math.max(0, currentAmount - losses.drugsLost[drug]);
                base.inventory[drug] = newAmount;
                
                // Update through reducer if available
                if (this.state.updateBaseInventory) {
                    this.state.updateBaseInventory(base.id, base.city, drug, newAmount - currentAmount);
                }
            });
        }

        // Remove cash (only if gang members are zero)
        if (losses.cashLost > 0) {
            const currentCash = base.cashStored || 0;
            const newCash = Math.max(0, currentCash - losses.cashLost);
            base.cashStored = newCash;
            
            // Update through reducer if available
            if (this.state.updateBaseCash) {
                this.state.updateBaseCash(base.id, base.city, newCash - currentCash);
            }
        }
    }

    /**
     * Generate a raid message for the player
     * @param {Object} base - The raided base
     * @param {boolean} isSuccessful - Whether the raid was successful
     * @param {Object} losses - The calculated losses
     * @param {number} enemyGangSize - Number of enemy gang members
     * @param {number} enemyGuns - Number of enemy guns
     * @returns {string} Raid message
     */
    generateRaidMessage(base, isSuccessful, losses, enemyGangSize, enemyGuns) {
        const baseName = this.data.baseTypes[base.level]?.name || `Level ${base.level} Base`;
        
        if (isSuccessful) {
            let message = `🔥 Your ${baseName} in ${base.city} was successfully raided by ${enemyGangSize} enemies with ${enemyGuns} guns!`;
            
            // Report gang and gun losses first (priority-based system)
            if (losses.gangLost > 0 || losses.gunsLost > 0) {
                message += ` Destroyed:`;
                if (losses.gangLost > 0) {
                    message += ` ${losses.gangLost} gang members`;
                }
                if (losses.gunsLost > 0) {
                    message += losses.gangLost > 0 ? ` and ${losses.gunsLost} guns` : ` ${losses.gunsLost} guns`;
                }
            }
            
            // Report drug and cash losses (only taken after gang/guns destroyed)
            if (Object.keys(losses.drugsLost).length > 0 || losses.cashLost > 0) {
                message += `. Stolen:`;
                if (Object.keys(losses.drugsLost).length > 0) {
                    const drugList = Object.keys(losses.drugsLost).map(drug => `${losses.drugsLost[drug]} ${drug}`).join(', ');
                    message += ` ${drugList}`;
                }
                if (losses.cashLost > 0) {
                    message += Object.keys(losses.drugsLost).length > 0 ? ` and $${losses.cashLost.toLocaleString()} cash` : ` $${losses.cashLost.toLocaleString()} cash`;
                }
            }
            
            return message;
        } else {
            return `🛡️ Your ${baseName} in ${base.city} successfully defended against ${enemyGangSize} enemies! No losses sustained.`;
        }
    }

    /**
     * Check all player bases for potential raids
     * Called periodically by the game loop
     */
    checkForBaseRaids() {
        const bases = this.state.get('bases') || {};
        
        Object.keys(bases).forEach(city => {
            const cityBases = bases[city];
            if (Array.isArray(cityBases)) {
                cityBases.forEach(base => {
                    // Only check operational bases
                    if (base.operational) {
                        this.executeBaseRaid(base.id);
                    }
                });
            }
        });
    }
}