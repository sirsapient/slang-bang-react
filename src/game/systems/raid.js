// js/systems/raid.js - Raid system for attacking enemy bases
export class RaidSystem {
    constructor(state, events, data) {
        this.state = state;
        this.events = events;
        this.data = data;
        // Persist enemyBases for the session and across reloads
        if (typeof window !== 'undefined') {
            const savedBases = localStorage.getItem('enemyBases');
            if (savedBases) {
                try {
                    this.enemyBases = JSON.parse(savedBases);
                    console.log('[RAID DEBUG] Loaded saved bases from localStorage:', this.enemyBases);
                    
                    // Validate the loaded data structure
                    if (!this.enemyBases || typeof this.enemyBases !== 'object') {
                        console.warn('[RAID DEBUG] Invalid saved bases structure, regenerating');
                        this.enemyBases = this.generateEnemyBases();
                        localStorage.setItem('enemyBases', JSON.stringify(this.enemyBases));
                    }
                } catch (error) {
                    console.error('[RAID DEBUG] Error parsing saved bases:', error);
                    this.enemyBases = this.generateEnemyBases();
                    localStorage.setItem('enemyBases', JSON.stringify(this.enemyBases));
                }
            } else {
                this.enemyBases = this.generateEnemyBases();
                localStorage.setItem('enemyBases', JSON.stringify(this.enemyBases));
                console.log('[RAID DEBUG] Generated new bases and saved to localStorage:', this.enemyBases);
            }
        } else {
            this.enemyBases = this.generateEnemyBases();
        }
    }
    
    generateEnemyBases() {
        const bases = {};
        const cities = Object.keys(this.data.cities);
        
        cities.forEach(city => {
            const cityData = this.data.cities[city];
            const baseCount = Math.floor(Math.random() * 3) + 2; // 2-4 bases per city
            
            bases[city] = [];
            for (let i = 0; i < baseCount; i++) {
                const difficulty = Math.random();
                const baseType = this.getBaseTypeByDifficulty(difficulty);
                
                bases[city].push({
                    id: `${city}_enemy_${i}`,
                    city: city,
                    name: `${baseType.name} Base`,
                    difficulty: difficulty,
                    baseType: baseType,
                    cash: Math.floor(baseType.maxCash * (0.3 + difficulty * 0.7)),
                    drugs: this.generateDrugInventory(baseType.maxInventory, difficulty),
                    gangSize: Math.floor(baseType.gangRequired * (0.5 + difficulty * 0.5)),
                    lastRaid: 0 // Track when last raided
                });
            }
        });
        
        return bases;
    }
    
    getBaseTypeByDifficulty(difficulty) {
        if (difficulty < 0.3) return this.data.baseTypes[1]; // Small base
        if (difficulty < 0.7) return this.data.baseTypes[2]; // Medium base
        return this.data.baseTypes[3]; // Large base
    }
    
    generateDrugInventory(maxInventory, difficulty) {
        const inventory = {};
        const drugTypes = Object.keys(this.data.drugs);
        const drugCount = Math.floor(maxInventory * (0.2 + difficulty * 0.8));
        
        // Cap the maximum drug count based on base type
        // Use a reasonable cap that scales with base type but doesn't exceed maxInventory
        const maxDrugCap = Math.min(maxInventory, 60); // Cap at 60 for any base type
        const cappedDrugCount = Math.min(drugCount, maxDrugCap);
        
        for (let i = 0; i < cappedDrugCount; i++) {
            const drug = drugTypes[Math.floor(Math.random() * drugTypes.length)];
            inventory[drug] = (inventory[drug] || 0) + 1;
        }
        
        return inventory;
    }
    
    getAvailableTargets(city) {
        const targets = this.enemyBases[city] || [];
        const currentTime = Date.now();
        const cooldownPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        return targets.filter(target => {
            return (currentTime - target.lastRaid) > cooldownPeriod;
        });
    }
    
    calculateRaidSuccess(gangSize, guns, targetDifficulty, targetGangSize) {
        // Base success chance starts at 50%
        let successChance = 0.5;
        
        // Gang size advantage/disadvantage (increased impact)
        const gangRatio = gangSize / Math.max(targetGangSize, 1);
        successChance += (gangRatio - 1) * 0.4; // Increased from 0.3 to 0.4
        
        // Guns provide combat advantage (increased impact)
        const gunBonus = Math.min(guns * 0.15, 0.4); // Increased from 0.1 to 0.15, max from 0.3 to 0.4
        successChance += gunBonus;
        
        // Difficulty penalty (reduced impact)
        successChance -= targetDifficulty * 0.3; // Reduced from 0.4 to 0.3
        
        // Clamp between 5% and 95%
        return Math.max(0.05, Math.min(0.95, successChance));
    }
    
    calculateRaidLoot(target, successChance) {
        if (!target || typeof target !== 'object') {
            console.error('Invalid target in calculateRaidLoot:', target);
            return { cash: 0, drugs: {} };
        }
        
        const lootMultiplier = 0.3 + (successChance * 0.7); // Better success = more loot
        
        const cash = Math.floor((target.cash || 0) * lootMultiplier);
        const drugs = {};
        
        if (target.drugs && typeof target.drugs === 'object') {
            Object.keys(target.drugs).forEach(drug => {
                const amount = Math.floor((target.drugs[drug] || 0) * lootMultiplier);
                if (amount > 0) {
                    drugs[drug] = amount;
                }
            });
        }
        
        return { cash, drugs };
    }
    
    calculateGangLosses(gangSize, successChance, targetDifficulty) {
        if (successChance > 0.8) return 0; // High success = no losses
        if (successChance > 0.6) return Math.floor(gangSize * 0.1); // Low losses
        if (successChance > 0.4) return Math.floor(gangSize * 0.2); // Medium losses
        return Math.floor(gangSize * 0.4); // High losses
    }

    // NEW: Calculate risk of losses for every raid attempt
    calculateRaidRisk(gangSize, successChance, targetDifficulty, isSuccessful) {
        const risk = {
            gangLost: 0,
            gunsLost: 0,
            riskLevel: 'none'
        };

        // Base risk probability increases with difficulty
        const baseRiskProbability = 0.1 + (targetDifficulty * 0.3); // 10-40% base risk
        
        // Failed raids have much higher risk
        const riskMultiplier = isSuccessful ? 0.5 : 2.0; // Failed raids = 2x risk
        const finalRiskProbability = Math.min(0.9, baseRiskProbability * riskMultiplier);
        
        // Determine if losses occur
        const hasLosses = Math.random() < finalRiskProbability;
        
        if (hasLosses) {
            // Calculate loss amounts based on difficulty and success
            let lossPercentage;
            if (isSuccessful) {
                // Successful raids: 5-20% loss based on difficulty
                lossPercentage = 0.05 + (targetDifficulty * 0.15);
                risk.riskLevel = targetDifficulty < 0.5 ? 'low' : 'medium';
            } else {
                // Failed raids: 15-50% loss based on difficulty
                lossPercentage = 0.15 + (targetDifficulty * 0.35);
                risk.riskLevel = 'high';
            }
            
            // Apply some randomness to the loss percentage
            const randomFactor = 0.8 + (Math.random() * 0.4); // ±20% variation
            const finalLossPercentage = lossPercentage * randomFactor;
            
            risk.gangLost = Math.floor(gangSize * finalLossPercentage);
            risk.gunsLost = Math.floor(gangSize * finalLossPercentage); // Assume 1 gun per gang member
            
            // Ensure at least some losses on high-risk raids
            if (!isSuccessful && risk.gangLost === 0 && gangSize > 0) {
                risk.gangLost = 1;
                risk.gunsLost = 1;
            }
        }
        
        return risk;
    }
    
    executeRaid(targetId, gangSize) {
        // Find the target object from the target ID
        const city = targetId.split('_')[0];
        const target = this.enemyBases[city]?.find(t => t.id === targetId);
        
        if (!target) {
            console.error('Target not found:', targetId);
            return { success: false, error: 'Target not found' };
        }
        
        // Check if target is on cooldown
        const currentTime = Date.now();
        const cooldownPeriod = 5 * 60 * 1000; // 5 minutes
        const timeSinceLastRaid = currentTime - target.lastRaid;
        
        console.log('[RAID DEBUG] Cooldown check for target:', target.id);
        console.log('[RAID DEBUG] Current time:', currentTime);
        console.log('[RAID DEBUG] Last raid time:', target.lastRaid);
        console.log('[RAID DEBUG] Time since last raid:', timeSinceLastRaid);
        console.log('[RAID DEBUG] Cooldown period:', cooldownPeriod);
        console.log('[RAID DEBUG] Is on cooldown:', timeSinceLastRaid < cooldownPeriod);
        
        if (timeSinceLastRaid < cooldownPeriod) {
            const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastRaid) / 1000 / 60);
            console.log('[RAID DEBUG] Target is on cooldown, remaining minutes:', remainingTime);
            return { 
                success: false, 
                error: `Target is on cooldown. Wait ${remainingTime} more minutes before raiding again.`,
                onCooldown: true,
                remainingMinutes: remainingTime
            };
        }
        
        const availableGang = this.state.getAvailableGangMembersInCity(city);
        const availableGuns = this.state.getAvailableGunsInCity(city);
        
        console.log('executeRaid called');
        console.log('selectedTarget:', targetId);
        console.log('raidGangSize:', gangSize);
        console.log('city:', city);
        console.log('available gang in city:', availableGang);
        console.log('available guns in city:', availableGuns);
        
        // Validate raid
        if (gangSize > availableGang) {
            return { success: false, error: `Not enough gang members in ${city}. Need ${gangSize}, have ${availableGang}` };
        }
        
        if (gangSize > availableGuns) {
            return { success: false, error: `Not enough guns in ${city}. Need ${gangSize}, have ${availableGuns}` };
        }
        
        console.log('Raid validation: gangSize=' + gangSize + ', availableGuns=' + availableGuns);
        
        // Calculate success chance using the improved formula
        const successChance = this.calculateRaidSuccess(gangSize, availableGuns, target.difficulty, target.gangSize);
        
        const success = Math.random() < successChance;
        
        // Calculate base heat based on target difficulty
        // Hard targets (difficulty > 0.7) generate 2x more heat than easy targets (difficulty < 0.3)
        const difficultyHeatMultiplier = 1 + (target.difficulty * 1.5); // 1x for easy, 2.05x for hard
        
        if (success) {
            console.log('Raid successful! Target:', target);
            console.log('Target cash:', target.cash);
            console.log('Target drugs:', target.drugs);
            console.log('Success chance:', successChance);
            const loot = this.calculateRaidLoot(target, successChance);
            console.log('Calculated loot:', loot);
            
            // Validate loot.cash
            if (isNaN(loot.cash)) {
                console.warn('[RAID BUG] Loot cash is NaN! Setting to 0. Target:', target, 'SuccessChance:', successChance, 'Loot:', loot, new Error().stack);
                loot.cash = 0;
            }
            // Apply loot
            this.state.updateCash(loot.cash);
            Object.keys(loot.drugs).forEach(drug => {
                this.state.updateInventory(drug, loot.drugs[drug]);
            });
            
            // ENHANCED HEAT SYSTEM: Successful raids generate significantly more heat
            // Base heat increased from 1000-3000 to 2000-5000, with difficulty multiplier
            const baseHeat = 2000 + Math.floor(Math.random() * 3000);
            const difficultyAdjustedHeat = Math.floor(baseHeat * difficultyHeatMultiplier);
            
            const heatScaling = this.data?.config?.heatScalingFactor || 1.2;
            // Simple rank calculation based on cash/net worth instead of accessing window.game
            const playerCash = this.state.getCash ? this.state.getCash() : 0;
            const playerRank = Math.min(10, Math.max(1, Math.floor(Math.log10(playerCash + 1))));
            const scaledHeat = Math.floor(difficultyAdjustedHeat * Math.pow(heatScaling, playerRank - 1));
            
            // Add city raid activity penalty (increased from 10% to 15% per raid)
            const cityRaidActivity = this.state.getCityRaidActivity(city);
            const raidCount = cityRaidActivity.count;
            const activityPenalty = Math.floor(scaledHeat * (raidCount * 0.15)); // 15% increase per raid
            const totalHeat = scaledHeat + activityPenalty;
            
            // BASE DAMAGE SYSTEM: Successful raids cause significant base damage
            const baseDamagePercent = 0.15 + (target.difficulty * 0.25); // 15-40% damage based on difficulty
            const baseDamage = Math.floor(target.cash * baseDamagePercent);
            target.cash = Math.max(0, target.cash - baseDamage);
            
            // Also damage drug inventory
            const drugDamagePercent = 0.1 + (target.difficulty * 0.2); // 10-30% drug damage
            if (target.drugs && typeof target.drugs === 'object') {
                Object.keys(target.drugs).forEach(drug => {
                    const currentAmount = target.drugs[drug] || 0;
                    const drugDamage = Math.floor(currentAmount * drugDamagePercent);
                    target.drugs[drug] = Math.max(0, currentAmount - drugDamage);
                });
            }
            
            this.state.updateWarrant(totalHeat);
            
            // NEW: Calculate and apply risk of losses for successful raids
            const raidRisk = this.calculateRaidRisk(gangSize, successChance, target.difficulty, true);
            if (raidRisk.gangLost > 0 && this.state.removeGangMembersFromCity) {
                this.state.removeGangMembersFromCity(city, raidRisk.gangLost);
            }
            if (raidRisk.gunsLost > 0 && this.state.removeGunsFromCity) {
                this.state.removeGunsFromCity(city, raidRisk.gunsLost);
            }
            
            // Track achievements
            this.state.trackAchievement('totalRaids');
            this.state.trackAchievement('successfulRaids');
            this.state.trackAchievement('totalEarnings', loot.cash);
            
            // Update last raid timestamp
            target.lastRaid = Date.now();
            console.log('[RAID DEBUG] Updated lastRaid timestamp for target:', target.id, 'to:', target.lastRaid);
            // Persist enemyBases to localStorage after raid
            if (typeof window !== 'undefined') {
                localStorage.setItem('enemyBases', JSON.stringify(this.enemyBases));
                console.log('[RAID DEBUG] Saved updated bases to localStorage');
            }

            // Increment city raid activity
            if (this.state.incrementCityRaidActivity) {
                this.state.incrementCityRaidActivity(city);
            }

            // Log results with base damage and risk info
            let raidMsg = `⚔️ Raid successful! Looted $${(loot.cash || 0).toLocaleString()} and drugs. Base damaged: $${baseDamage.toLocaleString()}`;
            if (raidRisk.gangLost > 0 || raidRisk.gunsLost > 0) {
                raidMsg += ` Lost ${raidRisk.gangLost} gang members and ${raidRisk.gunsLost} guns.`;
            }
            this.events.add(raidMsg, 'good');
            this.state.addNotification(raidMsg, 'success');
            
            return { 
                success: true, 
                loot, 
                heatIncrease: totalHeat,
                baseDamage: baseDamage,
                losses: raidRisk,
                heatBreakdown: {
                    baseHeat: scaledHeat,
                    activityPenalty: activityPenalty,
                    raidCount: raidCount,
                    difficultyMultiplier: difficultyHeatMultiplier
                }
            };
        } else {
            // Failed raid - still get heat but no loot, and less base damage
            // ENHANCED HEAT SYSTEM: Failed raids still generate significant heat but less than successful
            // Base heat increased from 500-1500 to 1000-2500, with difficulty multiplier
            const baseHeat = 1000 + Math.floor(Math.random() * 1500);
            const difficultyAdjustedHeat = Math.floor(baseHeat * difficultyHeatMultiplier);
            
            const heatScaling = this.data?.config?.heatScalingFactor || 1.2;
            // Simple rank calculation based on cash/net worth instead of accessing window.game
            const playerCash = this.state.getCash ? this.state.getCash() : 0;
            const playerRank = Math.min(10, Math.max(1, Math.floor(Math.log10(playerCash + 1))));
            const scaledHeat = Math.floor(difficultyAdjustedHeat * Math.pow(heatScaling, playerRank - 1));
            
            // Add city raid activity penalty (increased from 10% to 15% per raid)
            const cityRaidActivity = this.state.getCityRaidActivity(city);
            const raidCount = cityRaidActivity.count;
            const activityPenalty = Math.floor(scaledHeat * (raidCount * 0.15)); // 15% increase per raid
            const totalHeat = scaledHeat + activityPenalty;
            
            // BASE DAMAGE SYSTEM: Failed raids cause minimal base damage
            const baseDamagePercent = 0.05 + (target.difficulty * 0.1); // 5-15% damage based on difficulty
            const baseDamage = Math.floor(target.cash * baseDamagePercent);
            target.cash = Math.max(0, target.cash - baseDamage);
            
            // Minimal drug inventory damage
            const drugDamagePercent = 0.03 + (target.difficulty * 0.07); // 3-10% drug damage
            if (target.drugs && typeof target.drugs === 'object') {
                Object.keys(target.drugs).forEach(drug => {
                    const currentAmount = target.drugs[drug] || 0;
                    const drugDamage = Math.floor(currentAmount * drugDamagePercent);
                    target.drugs[drug] = Math.max(0, currentAmount - drugDamage);
                });
            }
            
            this.state.updateWarrant(totalHeat);
            
            // NEW: Calculate and apply risk of losses for failed raids (much higher risk)
            const raidRisk = this.calculateRaidRisk(gangSize, successChance, target.difficulty, false);
            if (raidRisk.gangLost > 0 && this.state.removeGangMembersFromCity) {
                this.state.removeGangMembersFromCity(city, raidRisk.gangLost);
            }
            if (raidRisk.gunsLost > 0 && this.state.removeGunsFromCity) {
                this.state.removeGunsFromCity(city, raidRisk.gunsLost);
            }
            
            // Track failed raid
            this.state.trackAchievement('totalRaids');
            
            // Update last raid timestamp (even for failed raids)
            target.lastRaid = Date.now();
            console.log('[RAID DEBUG] Updated lastRaid timestamp for failed raid target:', target.id, 'to:', target.lastRaid);
            // Persist enemyBases to localStorage after raid
            if (typeof window !== 'undefined') {
                localStorage.setItem('enemyBases', JSON.stringify(this.enemyBases));
                console.log('[RAID DEBUG] Saved updated bases to localStorage after failed raid');
            }

            // Increment city raid activity (even for failed raids)
            if (this.state.incrementCityRaidActivity) {
                this.state.incrementCityRaidActivity(city);
            }

            // Log results with risk info
            let failMsg = `❌ Raid failed! Gained ${totalHeat.toLocaleString()} heat, Base damaged: $${baseDamage.toLocaleString()}`;
            if (raidRisk.gangLost > 0 || raidRisk.gunsLost > 0) {
                failMsg += ` Lost ${raidRisk.gangLost} gang members and ${raidRisk.gunsLost} guns.`;
            }
            this.events.add(failMsg, 'bad');
            this.state.addNotification(failMsg, 'error');
            
            return { 
                success: false, 
                heatIncrease: totalHeat,
                baseDamage: baseDamage,
                losses: raidRisk,
                heatBreakdown: {
                    baseHeat: scaledHeat,
                    activityPenalty: activityPenalty,
                    raidCount: raidCount,
                    difficultyMultiplier: difficultyHeatMultiplier
                }
            };
        }
    }
    
    getDifficultyColor(difficulty) {
        if (difficulty < 0.3) return '#66ff66'; // Easy - Green
        if (difficulty < 0.7) return '#ffff00'; // Medium - Yellow
        return '#ff6666'; // Hard - Red
    }
    
    getDifficultyText(difficulty) {
        if (difficulty < 0.3) return 'Easy';
        if (difficulty < 0.7) return 'Medium';
        return 'Hard';
    }
    
    // Method to refresh data from localStorage (for debugging)
    refreshFromStorage() {
        if (typeof window !== 'undefined') {
            const savedBases = localStorage.getItem('enemyBases');
            if (savedBases) {
                try {
                    this.enemyBases = JSON.parse(savedBases);
                    console.log('[RAID DEBUG] Refreshed from localStorage:', this.enemyBases);
                    return true;
                } catch (error) {
                    console.error('[RAID DEBUG] Error refreshing from localStorage:', error);
                    return false;
                }
            }
        }
        return false;
    }
} 