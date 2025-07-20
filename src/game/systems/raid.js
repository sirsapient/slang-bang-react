// js/systems/raid.js - Raid system for attacking enemy bases
export class RaidSystem {
    constructor(state, events, data) {
        this.state = state;
        this.events = events;
        this.data = data;
        this.enemyBases = this.generateEnemyBases();
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
        
        for (let i = 0; i < drugCount; i++) {
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
        
        if (timeSinceLastRaid < cooldownPeriod) {
            const remainingTime = Math.ceil((cooldownPeriod - timeSinceLastRaid) / 1000 / 60);
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
            
            // Apply rank-based heat scaling
            const baseHeat = 1000 + Math.floor(Math.random() * 2000);
            const heatScaling = this.data?.config?.heatScalingFactor || 1.2;
            const playerRank = window.game?.screens?.home?.getCurrentRank() || 1;
            const scaledHeat = Math.floor(baseHeat * Math.pow(heatScaling, playerRank - 1));
            this.state.updateWarrant(scaledHeat);
            
            // Track achievements
            this.state.trackAchievement('totalRaids');
            this.state.trackAchievement('successfulRaids');
            this.state.trackAchievement('totalEarnings', loot.cash);
            
            // Update last raid timestamp
            target.lastRaid = Date.now();
            
            // Log results
            const raidMsg = `⚔️ Raid successful! Looted $${(loot.cash || 0).toLocaleString()} and drugs`;
            this.events.add(raidMsg, 'good');
            this.state.addNotification(raidMsg, 'success');
            
            return { success: true, loot, heatIncrease: scaledHeat };
        } else {
            // Failed raid - still get heat but no loot
            const baseHeat = 500 + Math.floor(Math.random() * 1000);
            const heatScaling = this.data?.config?.heatScalingFactor || 1.2;
            const playerRank = window.game?.screens?.home?.getCurrentRank() || 1;
            const scaledHeat = Math.floor(baseHeat * Math.pow(heatScaling, playerRank - 1));
            this.state.updateWarrant(scaledHeat);
            
            // Track failed raid
            this.state.trackAchievement('totalRaids');
            
            // Update last raid timestamp (even for failed raids)
            target.lastRaid = Date.now();
            
            const failMsg = `❌ Raid failed! Gained ${scaledHeat.toLocaleString()} heat`;
            this.events.add(failMsg, 'bad');
            this.state.addNotification(failMsg, 'error');
            
            return { success: false, heatIncrease: scaledHeat };
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
} 