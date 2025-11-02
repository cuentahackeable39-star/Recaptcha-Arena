// js/game-logic.js instruction="Adding progressive difficulty scaling and challenge mechanics"
class GameLogic {
    constructor(ui, aiGenerator) {
        this.ui = ui;
        this.aiGenerator = aiGenerator;
        
        // Game state
        this.score = 0;
        this.level = 1;
        this.streak = 0;
        this.bestStreak = 0;
        this.totalClicks = 0;
        this.correctClicks = 0;
        this.hints = 3;
        this.powerUps = 1;
        
        // Timing
        this.startTime = Date.now();
        this.levelStartTime = Date.now();
        
        // Challenge state
        this.currentChallenge = null;
        this.playerHistory = [];
        this.achievementShown = false;
        
        // NEW: Progressive difficulty system
        this.difficultyMultiplier = 1.0;
        this.consecutiveCorrectLevels = 0;
        this.maxMistakes = 2;
        this.currentMistakes = 0;
        this.comboMultiplier = 1;
        
        // Advanced mechanics flags
        this.timePressureMode = false;
        this.distractionMode = false;
        this.rotatingGrid = false;
        this.hiddenTargets = false;
        this.movingTargets = false;
        this.decoyMode = false;
        this.mirrorMode = false;
    }
    
    generateLevel() {
        const playerStats = {
            level: this.level,
            score: this.score,
            accuracy: this.getAccuracy(),
            avgTime: this.getAverageTime(),
            streak: this.streak,
            history: this.playerHistory,
            difficultyMultiplier: this.difficultyMultiplier,
            consecutiveCorrectLevels: this.consecutiveCorrectLevels
        };
        
        return this.aiGenerator.generateChallenge(playerStats).then(challenge => {
            this.currentChallenge = challenge;
            
            // Apply progressive difficulty scaling
            this.applyProgressiveDifficulty(challenge);
            
            this.ui.updateChallengeInfo(
                `Level ${this.level}: ${challenge.name}`,
                challenge.description
            );
            
            this.ui.renderChallengeGrid(challenge);
            this.levelStartTime = Date.now();
            
            // Start advanced mechanics
            this.startAdvancedMechanics();
        });
    }
    
    applyProgressiveDifficulty(challenge) {
        // Dynamic difficulty based on performance
        if (this.streak >= 5) {
            this.difficultyMultiplier = Math.min(2.5, 1 + (this.streak / 15));
        }
        
        // Reduce time for skilled players
        if (this.getAccuracy() > 80 && this.level > 8) {
            challenge.timeLimit = Math.max(12, challenge.timeLimit - Math.floor(this.level / 4));
        }
        
        // Unlock advanced mechanics based on level
        if (this.level > 3) {
            this.hiddenTargets = Math.random() < 0.2;
            this.decoyMode = Math.random() < 0.15;
        }
        
        if (this.level > 8) {
            this.movingTargets = Math.random() < 0.2;
            this.rotatingGrid = Math.random() < 0.1;
            this.mirrorMode = Math.random() < 0.1;
        }
        
        if (this.level > 12) {
            this.timePressureMode = Math.random() < 0.25;
            this.distractionMode = Math.random() < 0.15;
        }
        
        // Scale target count with difficulty
        const originalTargetCount = challenge.pattern.length;
        const newTargetCount = Math.min(
            Math.floor(originalTargetCount * this.difficultyMultiplier),
            Math.floor(challenge.gridSize * challenge.gridSize * 0.5)
        );
        
        // Regenerate pattern with scaled difficulty
        challenge.pattern = this.aiGenerator.generatePattern(challenge.gridSize, newTargetCount);
    }
    
    startAdvancedMechanics() {
        // Rotating grid
        if (this.rotatingGrid) {
            setTimeout(() => {
                this.ui.rotateGrid(180);
                setTimeout(() => this.ui.rotateGrid(0), 2500);
            }, 4000);
        }
        
        // Moving targets
        if (this.movingTargets) {
            this.startMovingTargets();
        }
        
        // Hidden targets with brief reveal
        if (this.hiddenTargets) {
            setTimeout(() => this.ui.hideTargets(), 2500);
        }
        
        // Mirror mode (flip grid horizontally)
        if (this.mirrorMode) {
            this.ui.mirrorGrid();
        }
        
        // Time acceleration
        if (this.timePressureMode) {
            this.ui.accelerateTimer(1.3);
        }
        
        // Visual distractions
        if (this.distractionMode) {
            this.ui.addDistractions();
        }
        
        // Decoy targets
        if (this.decoyMode) {
            this.ui.addDecoys();
        }
    }
    
    handleTileClick(tileElement, isTarget) {
        if (tileElement.classList.contains('clicked')) return;
        
        tileElement.classList.add('clicked');
        this.totalClicks++;
        
        const tileIndex = Array.from(tileElement.parentNode.children).indexOf(tileElement);
        this.playerHistory.push({
            level: this.level,
            tileIndex: tileIndex,
            isCorrect: isTarget,
            timestamp: Date.now() - this.levelStartTime,
            difficulty: this.difficultyMultiplier
        });
        
        if (isTarget) {
            tileElement.classList.add('correct');
            this.correctClicks++;
            this.streak++;
            this.consecutiveCorrectLevels++;
            
            // Combo system
            if (this.streak > 3) {
                this.comboMultiplier = Math.min(4, 1 + (this.streak - 3) * 0.15);
            }
            
            const baseScore = 100 * this.level;
            const streakBonus = this.streak * 12 * this.comboMultiplier;
            const difficultyBonus = Math.floor(baseScore * (this.difficultyMultiplier - 1) * 0.4);
            
            this.score += baseScore + streakBonus + difficultyBonus;
            this.checkAchievements();
            
            // Reduce difficulty if player is dominating
            if (this.consecutiveCorrectLevels > 8) {
                this.difficultyMultiplier = Math.max(1, this.difficultyMultiplier - 0.05);
            }
        } else {
            tileElement.classList.add('incorrect');
            this.streak = 0;
            this.comboMultiplier = 1;
            this.currentMistakes++;
            this.consecutiveCorrectLevels = 0;
            
            // Increase difficulty after mistakes
            this.difficultyMultiplier = Math.min(2.5, this.difficultyMultiplier + 0.08);
            
            const penalty = 40 * this.difficultyMultiplier;
            this.score = Math.max(0, this.score - penalty);
            
            // Game over on too many mistakes in hard mode
            if (this.currentMistakes >= this.maxMistakes && this.level > 15) {
                this.gameOver();
                return;
            }
        }
        
        this.updateUI();
        this.checkLevelComplete();
    }
    
    checkLevelComplete() {
        const targets = document.querySelectorAll('.game-tile[data-target="true"]');
        const clickedTargets = Array.from(targets).filter(t => t.classList.contains('correct'));
        const decoys = document.querySelectorAll('.game-tile.decoy');
        const clickedDecoys = Array.from(decoys).filter(t => t.classList.contains('incorrect'));
        
        const totalTargets = targets.length;
        const completedTargets = clickedTargets.length;
        
        if (completedTargets === totalTargets && clickedDecoys.length === 0) {
            this.completeLevel();
        } else if (clickedDecoys.length > 0) {
            // Decoy penalty
            const decoyPenalty = 20 * clickedDecoys.length;
            this.score = Math.max(0, this.score - decoyPenalty);
            this.updateUI();
        }
    }
    
    completeLevel() {
        this.ui.stopTimer();
        
        const levelTime = (Date.now() - this.levelStartTime) / 1000;
        const timeBonus = Math.max(0, Math.floor((this.currentChallenge.timeLimit - levelTime) * 15 * this.difficultyMultiplier));
        const perfectBonus = this.currentMistakes === 0 ? 300 * this.level : 0;
        const streakBonus = this.streak > 15 ? 800 : 0;
        
        this.score += timeBonus + perfectBonus + streakBonus;
        this.currentMistakes = 0;
        
        let achievementText = `+${timeBonus} time bonus!`;
        if (perfectBonus > 0) achievementText += ` +${perfectBonus} perfect!`;
        if (streakBonus > 0) achievementText += ` +${streakBonus} streak!`;
        
        this.ui.showAchievement('Level Complete!', achievementText);
        
        setTimeout(() => {
            this.level++;
            this.generateLevel();
            this.ui.startTimer(() => this.gameOver());
        }, 1500);
    }
    
    useHint() {
        if (this.hints <= 0) return;
        
        this.hints--;
        this.ui.updateHints(this.hints);
        
        const targets = document.querySelectorAll('.game-tile[data-target="true"]:not(.clicked)');
        if (targets.length > 0) {
            // In decoy mode, hints might mislead
            if (this.decoyMode && Math.random() < 0.25) {
                const decoys = document.querySelectorAll('.game-tile.decoy:not(.clicked)');
                if (decoys.length > 0) {
                    decoys[0].classList.add('hint');
                    setTimeout(() => decoys[0].classList.remove('hint'), 2000);
                    return;
                }
            }
            
            targets[0].classList.add('hint');
            setTimeout(() => targets[0].classList.remove('hint'), 2000);
        }
    }
    
    skipLevel() {
        const penalty = 150 * this.difficultyMultiplier;
        this.score = Math.max(0, this.score - penalty);
        this.level++;
        this.streak = 0;
        this.comboMultiplier = 1;
        
        this.ui.stopTimer();
        this.generateLevel().then(() => {
            this.ui.startTimer(() => this.gameOver());
        });
    }
    
    usePowerUp() {
        if (this.powerUps <= 0) return;
        
        this.powerUps--;
        const targets = document.querySelectorAll('.game-tile[data-target="true"]:not(.clicked)');
        
        // Power-up backfire chance in hard mode
        if (this.level > 10 && Math.random() < 0.15) {
            this.ui.showAchievement('Power Surge!', 'System overload!');
            targets.forEach(target => {
                target.classList.add('glitch');
                setTimeout(() => target.classList.remove('glitch'), 800);
            });
            return;
        }
        
        targets.forEach(target => {
            target.classList.add('powered');
            setTimeout(() => this.handleTileClick(target, true), 100);
        });
    }
    
    checkAchievements() {
        if (this.streak > this.bestStreak) {
            this.bestStreak = this.streak;
            this.ui.showAchievement('New Best Streak!', `${this.bestStreak} in a row!`);
        }
        
        if (this.score >= 1000 && !this.achievementShown) {
            this.achievementShown = true;
            this.ui.showAchievement('Score Master!', 'Reached 1000 points!');
        }
        
        if (this.streak >= 15) {
            this.ui.showAchievement('Combo King!', '15+ combo!');
        }
        
        if (this.level > 20) {
            this.ui.showAchievement('Legend!', 'Level 20+ reached!');
        }
    }
    
    gameOver() {
        const stats = {
            score: this.score,
            bestStreak: this.bestStreak,
            accuracy: this.getAccuracy(),
            level: this.level,
            difficulty: this.difficultyMultiplier
        };
        
        this.ui.showGameOver(stats);
    }
    
    restart() {
        this.score = 0;
        this.level = 1;
        this.streak = 0;
        this.bestStreak = 0;
        this.totalClicks = 0;
        this.correctClicks = 0;
        this.hints = 3;
        this.powerUps = 1;
        this.startTime = Date.now();
        this.levelStartTime = Date.now();
        this.achievementShown = false;
        this.difficultyMultiplier = 1.0;
        this.consecutiveCorrectLevels = 0;
        this.currentMistakes = 0;
        this.comboMultiplier = 1;
        
        // Reset mechanics
        this.timePressureMode = false;
        this.distractionMode = false;
        this.rotatingGrid = false;
        this.hiddenTargets = false;
        this.movingTargets = false;
        this.decoyMode = false;
        this.mirrorMode = false;
        
        this.playerHistory = [];
        
        this.ui.hideGameOver();
        this.ui.updateHints(this.hints);
        
        this.generateLevel().then(() => {
            this.ui.startTimer(() => this.gameOver());
        });
    }
    
    getAccuracy() {
        return this.totalClicks > 0 ? Math.round((this.correctClicks / this.totalClicks) * 100) : 100;
    }
    
    getAverageTime() {
        return this.totalClicks > 0 ? ((Date.now() - this.startTime) / 1000 / this.totalClicks).toFixed(1) : 0.0;
    }
    
    updateUI() {
        this.ui.updateScore(this.score);
        this.ui.updateLevel(this.level);
        this.ui.updateStreak(this.streak);
        this.ui.updateStats(this.getAccuracy(), this.getAverageTime(), this.bestStreak);
        
        // Update difficulty indicator
        const difficultyElement = document.getElementById('difficultyValue');
        if (difficultyElement) {
            difficultyElement.textContent = `${this.difficultyMultiplier.toFixed(1)}x`;
        }
    }
}

// js/ai-generator.js instruction="Enhanced AI generation with more complex patterns and challenges"
class AILevelGenerator {
    constructor() {
        this.currentType = 0;
        this.patternCache = new Map();
    }

    async generateChallenge(playerStats) {
        const challengeType = this.selectChallengeType(playerStats);
        const gridSize = this.calculateGridSize(playerStats);

        // Dynamic target count with difficulty scaling
        const baseTargetCount = Math.max(1, Math.floor(gridSize * gridSize * 0.25));
        const difficultyMultiplier = playerStats.difficultyMultiplier || 1;
        const targetCount = Math.min(
            Math.floor(baseTargetCount * difficultyMultiplier),
            Math.floor(gridSize * gridSize * 0.6)
        );

        const pattern = this.generateAdvancedPattern(gridSize, targetCount, playerStats);

        // Add special effects for higher levels
        const specialEffects = this.generateSpecialEffects(playerStats);

        // Calculate time limit based on difficulty
        const timeLimit = this.calculateTimeLimit(playerStats, gridSize, targetCount);

        const challenge = {
            type: challengeType.type,
            name: challengeType.name,
            description: this.generateDescription(challengeType, playerStats),
            targetType: this.selectTargetType(challengeType.targetTypes, playerStats),
            gridSize: gridSize,
            pattern: pattern,
            timeLimit: timeLimit,
            specialEffects: specialEffects,
            emoji: true,
            difficultyRating: this.calculateDifficultyRating(playerStats)
        };

        return challenge;
    }

    calculateGridSize(playerStats) {
        // Smarter grid sizing based on performance
        const baseSize = 3 + Math.floor(playerStats.level / 3);

        // Reduce grid size if player is struggling
        if (playerStats.accuracy < 60 && playerStats.level > 10) {
            return Math.max(4, baseSize - 1);
        }

        // Increase grid size for skilled players
        if (playerStats.accuracy > 85 && playerStats.level > 15) {
            return Math.min(8, baseSize + 1);
        }

        return Math.min(7, baseSize);
    }

    calculateTimeLimit(playerStats, gridSize, targetCount) {
        let baseTime = 35 - Math.floor(playerStats.level / 4);

        // Adjust based on grid complexity
        const complexity = (gridSize * gridSize) / (targetCount + 1);
        baseTime += Math.floor(complexity);

        // Reduce time for skilled players
        if (playerStats.accuracy > 80) {
            baseTime -= 5;
        }

        return Math.max(8, baseTime);
    }

    generateAdvancedPattern(gridSize, targetCount, playerStats) {
        // Use cached patterns for performance
        const cacheKey = `${gridSize}-${targetCount}-${playerStats.level}`;
        if (this.patternCache.has(cacheKey)) {
            return this.patternCache.get(cacheKey);
        }

        const totalTiles = gridSize * gridSize;
        const pattern = [];
        const used = new Set();

        // Advanced pattern generation based on player skill
        if (playerStats.level > 20) {
            // Generate complex patterns for expert players
            this.generateComplexPattern(gridSize, targetCount, pattern, used);
        } else if (playerStats.level > 10) {
            // Generate challenging patterns
            this.generateChallengingPattern(gridSize, targetCount, pattern, used);
        } else {
            // Standard pattern generation
            this.generateStandardPattern(gridSize, targetCount, pattern, used);
        }

        // Cache the pattern
        this.patternCache.set(cacheKey, [...pattern]);

        return pattern;
    }

    generateComplexPattern(gridSize, targetCount, pattern, used) {
        // Create patterns that are hard to spot
        const strategies = [
            () => this.createDiagonalPattern(gridSize, pattern, used),
            () => this.createSpiralPattern(gridSize, pattern, used),
            () => this.createClusteredPattern(gridSize, targetCount, pattern, used),
            () => this.createEdgePattern(gridSize, pattern, used),
            () => this.createCheckerboardPattern(gridSize, pattern, used),
            () => this.createCrossPattern(gridSize, pattern, used)
        ];

        const strategy = strategies[Math.floor(Math.random() * strategies.length)];
        strategy();

        // Fill remaining targets randomly
        while (pattern.length < targetCount && pattern.length < gridSize * gridSize) {
            const pos = Math.floor(Math.random() * gridSize * gridSize);
            if (!used.has(pos)) {
                pattern.push(pos);
                used.add(pos);
            }
        }
    }

    generateChallengingPattern(gridSize, targetCount, pattern, used) {
        // Mix of edge and random positions
        const edgePositions = this.getEdgePositions(gridSize);
        const randomEdge = edgePositions[Math.floor(Math.random() * edgePositions.length)];

        if (!used.has(randomEdge)) {
            pattern.push(randomEdge);
            used.add(randomEdge);
        }

        // Add some clustered positions
        const clusterCenter = Math.floor(Math.random() * gridSize * gridSize);
        const clusterPositions = this.getClusterPositions(clusterCenter, gridSize, 2);

        clusterPositions.forEach(pos => {
            if (pattern.length < targetCount && !used.has(pos)) {
                pattern.push(pos);
                used.add(pos);
            }
        });

        // Fill with random positions
        while (pattern.length < targetCount && pattern.length < gridSize * gridSize) {
            const pos = Math.floor(Math.random() * gridSize * gridSize);
            if (!used.has(pos)) {
                pattern.push(pos);
                used.add(pos);
            }
        }
    }

    generateStandardPattern(gridSize, targetCount, pattern, used) {
        // Ensure good distribution
        const positions = Array.from({length: gridSize * gridSize}, (_, i) => i);

        // Shuffle using Fisher-Yates
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        // Take first targetCount positions
        for (let i = 0; i < targetCount && i < positions.length; i++) {
            pattern.push(positions[i]);
            used.add(positions[i]);
        }
    }

    createDiagonalPattern(gridSize, pattern, used) {
        const diagonal = Math.floor(Math.random() * 2); // 0 for main, 1 for anti-diagonal
        for (let i = 0; i < gridSize; i++) {
            const pos = diagonal === 0 ? i * gridSize + i : i * gridSize + (gridSize - 1 - i);
            if (!used.has(pos)) {
                pattern.push(pos);
                used.add(pos);
            }
        }
    }

    createSpiralPattern(gridSize, pattern, used) {
        const spiral = [];
        let top = 0, bottom = gridSize - 1, left = 0, right = gridSize - 1;

        while (top <= bottom && left <= right) {
            for (let i = left; i <= right; i++) spiral.push(top * gridSize + i);
            top++;
            for (let i = top; i <= bottom; i++) spiral.push(i * gridSize + right);
            right--;
            if (top <= bottom) {
                for (let i = right; i >= left; i--) spiral.push(bottom * gridSize + i);
                bottom--;
            }
            if (left <= right) {
                for (let i = bottom; i >= top; i--) spiral.push(i * gridSize + left);
                left++;
            }
        }

        // Take every 3rd position from spiral
        for (let i = 0; i < spiral.length; i += 3) {
            if (!used.has(spiral[i])) {
                pattern.push(spiral[i]);
                used.add(spiral[i]);
            }
        }
    }

    createClusteredPattern(gridSize, targetCount, pattern, used) {
        const clusterCount = Math.ceil(targetCount / 3);
        for (let c = 0; c < clusterCount; c++) {
            const center = Math.floor(Math.random() * gridSize * gridSize);
            const clusterSize = Math.min(3, targetCount - pattern.length);
            const clusterPositions = this.getClusterPositions(center, gridSize, clusterSize);

            clusterPositions.forEach(pos => {
                if (!used.has(pos)) {
                    pattern.push(pos);
                    used.add(pos);
                }
            });
        }
    }

    createEdgePattern(gridSize, pattern, used) {
        const edges = this.getEdgePositions(gridSize);
        const selectedEdges = edges.sort(() => Math.random() - 0.5).slice(0, Math.min(edges.length, 4));

        selectedEdges.forEach(pos => {
            if (!used.has(pos)) {
                pattern.push(pos);
                used.add(pos);
            }
        });
    }

    createCheckerboardPattern(gridSize, pattern, used) {
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                if ((i + j) % 2 === 0) {
                    const pos = i * gridSize + j;
                    if (!used.has(pos)) {
                        pattern.push(pos);
                        used.add(pos);
                    }
                }
            }
        }
    }

    createCrossPattern(gridSize, pattern, used) {
        const center = Math.floor(gridSize / 2);
        
        // Horizontal line
        for (let i = 0; i < gridSize; i++) {
            const pos = center * gridSize + i;
            if (!used.has(pos)) {
                pattern.push(pos);
                used.add(pos);
            }
        }
        
        // Vertical line
        for (let i = 0; i < gridSize; i++) {
            const pos = i * gridSize + center;
            if (!used.has(pos)) {
                pattern.push(pos);
                used.add(pos);
            }
        }
    }

    getEdgePositions(gridSize) {
        const edges = [];
        // Top and bottom edges
        for (let i = 0; i < gridSize; i++) {
            edges.push(i); // Top
            edges.push((gridSize - 1) * gridSize + i); // Bottom
        }
        // Left and right edges (excluding corners)
        for (let i = 1; i < gridSize - 1; i++) {
            edges.push(i * gridSize); // Left
            edges.push(i * gridSize + gridSize - 1); // Right
        }
        return edges;
    }

    getClusterPositions(center, gridSize, clusterSize) {
        const positions = [center];
        const row = Math.floor(center / gridSize);
        const col = center % gridSize;

        for (let i = 0; i < clusterSize - 1; i++) {
            const dr = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            const dc = Math.floor(Math.random() * 3) - 1;
            const newRow = Math.max(0, Math.min(gridSize - 1, row + dr));
            const newCol = Math.max(0, Math.min(gridSize - 1, col + dc));
            positions.push(newRow * gridSize + newCol);
        }

        return positions;
    }

    generateSpecialEffects(playerStats) {
        const effects = [];

        if (playerStats.level > 5) {
            effects.push(['rainbow', 'neon', 'pulse'][Math.floor(Math.random() * 3)]);
        }

        if (playerStats.level > 10) {
            effects.push(['glitch', 'wave'][Math.floor(Math.random() * 2)]);
        }

        if (playerStats.level > 15 && playerStats.accuracy > 80) {
            effects.push('matrix');
        }

        return effects.length > 0 ? effects[Math.floor(Math.random() * effects.length)] : null;
    }

    selectChallengeType(playerStats) {
        const types = GAME_CONFIG.CHALLENGE_TYPES;

        // Rotate through types, but favor harder ones for skilled players
        let index = (playerStats.level - 1) % types.length;

        if (playerStats.accuracy > 85 && playerStats.level > 15) {
            // Skilled players get more challenging types
            const hardTypes = [0, 1, 3]; // Traffic, Emoji, Animal
            index = hardTypes[Math.floor(Math.random() * hardTypes.length)];
        }

        return types[index];
    }

    selectTargetType(possibleTypes, playerStats) {
        // Ensure we always return a valid emoji, not undefined
        if (!possibleTypes || possibleTypes.length === 0) {
            return '🎯'; // Default fallback
        }

        // Favor more complex emojis for higher levels
        if (playerStats.level > 20) {
            const complexTypes = possibleTypes.filter(type =>
                ['🚁', '🚀', '🛸', '🦖', '🦄', '🐉', '🧬', '🔮', '⚡', '💎'].includes(type)
            );
            if (complexTypes.length > 0) {
                return complexTypes[Math.floor(Math.random() * complexTypes.length)];
            }
        }

        // Return a random valid emoji from the list
        return possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    }

    generateDescription(challengeType, playerStats) {
        const level = playerStats.level;
        const accuracy = playerStats.accuracy;

        if (level > 25) {
            return `Master level: Find the hidden ${challengeType.name.toLowerCase()} among distractions!`;
        } else if (level > 15) {
            return `Expert challenge: Spot the ${challengeType.name.toLowerCase()} before time runs out!`;
        } else if (level > 10) {
            return `Advanced: Multiple ${challengeType.name.toLowerCase()} types, limited time!`;
        } else if (level > 5) {
            return `Find all ${challengeType.name.toLowerCase()} targets to proceed!`;
        } else {
            return challengeType.descriptionFunc(level);
        }
    }

    calculateDifficultyRating(playerStats) {
        const levelFactor = playerStats.level / 30;
        const accuracyFactor = playerStats.accuracy / 100;
        const streakFactor = Math.min(1, playerStats.streak / 20);

        return Math.min(1, (levelFactor + accuracyFactor + streakFactor) / 3);
    }

    generatePattern(gridSize, targetCount) {
        // Legacy method for backward compatibility
        const totalTiles = gridSize * gridSize;
        const pattern = [];
        const used = new Set();

        const positions = Array.from({length: totalTiles}, (_, i) => i);

        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        for (let i = 0; i < targetCount && i < positions.length; i++) {
            pattern.push(positions[i]);
        }

        return pattern;
    }
}

// js/game-ui.js instruction="Enhanced UI with better emoji display and advanced effects"
class GameUI {
    constructor() {
        this.elements = {
            scoreValue: document.getElementById('scoreValue'),
            levelValue: document.getElementById('levelValue'),
            streakValue: document.getElementById('streakValue'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            challengeGrid: document.getElementById('challengeGrid'),
            challengeTitle: document.getElementById('challengeTitle'),
            challengeDesc: document.getElementById('challengeDesc'),
            timerText: document.getElementById('timerText'),
            timerProgress: document.getElementById('timerProgress'),
            achievementPopup: document.getElementById('achievementPopup'),
            gameOverModal: document.getElementById('gameOverModal')
        };
        
        this.timerInterval = null;
        this.particleSystem = new ParticleSystem();
        this.timerSpeed = 1;
        this.distractionElements = [];
        this.decoyElements = [];
    }
    
    async renderChallengeGrid(challenge) {
        const grid = this.elements.challengeGrid;
        grid.innerHTML = '';
        
        const gridSize = challenge.gridSize;
        const totalTiles = gridSize * gridSize;
        
        grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        
        // Add special effects based on level
        if (challenge.specialEffects) {
            grid.classList.add(`effect-${challenge.specialEffects}`);
        }
        
        const pattern = challenge.pattern;
        const isEmoji = challenge.emoji;
        
        for (let i = 0; i < totalTiles; i++) {
            const tile = this.createTile(challenge, i, pattern, isEmoji);
            grid.appendChild(tile);
        }
        
        this.updateProgress();
        
        // Add difficulty indicator
        this.addDifficultyIndicator();
    }
    
    createTile(challenge, index, pattern, isEmoji) {
        const tile = document.createElement('div');
        tile.className = `game-tile ${challenge.specialEffects || ''}`;
        
        const isTarget = pattern.includes(index);
        tile.dataset.target = isTarget;
        tile.dataset.type = challenge.targetType;
        
        const tileContent = document.createElement('div');
        tileContent.className = 'tile-content';
        
        if (isEmoji) {
            // Always show the target emoji for target tiles, decoy emoji for others
            tileContent.textContent = isTarget ? challenge.targetType : this.getDecoyEmoji(challenge.targetType);
            tileContent.style.fontSize = 'clamp(24px, 8vw, 48px)';
            tileContent.style.display = 'flex';
            tileContent.style.alignItems = 'center';
            tileContent.style.justifyContent = 'center';
        }
        
        // Add particle effects on hover
        tile.addEventListener('mouseenter', () => {
            if (!tile.classList.contains('clicked')) {
                this.particleSystem.create(tile);
            }
        });
        
        // Add click feedback
        tile.addEventListener('click', () => {
            if (!tile.classList.contains('clicked')) {
                this.createClickEffect(tile);
            }
        });
        
        tile.appendChild(tileContent);
        return tile;
    }
    
    getDecoyEmoji(targetType) {
        const decoys = {
            '🚗': ['🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🚲', '🛵', '🚂', '✈️', '🚁', '🚤', '⛵', '🚢', '🚀'],
            '🍕': ['🍔', '🍟', '🌭', '🍿', '🧂', '🥓', '🍳', '🥞', '🥐', '🥨', '🥯', '🧀', '🍖', '🍗', '🥩', '🥪', '🌮', '🌯', '🧆', '🥙', '🍱', '🍜', '🍲', '🍣', '🍤', '🍙', '🍚', '🍛', '🍝', '🥪', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍡', '🍦', '🍧', '🍨', '🥮', '🍯', '🥛', '☕', '🍵', '🥤', '🍶', '🍺', '🍻', '🥂', '🍾', '🍹', '🍸', '🥃', '🍷'],
            '🐶': ['🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦗', '🕷️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🐘', '🦏', '🐪', '🐫', '🦒', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔'],
            '⭐': ['✨', '💫', '🎯', '🎪', '🎭', '🎨', '🎸', '🎺', '🎮', '🎲', '🎰', '🎪', '🎨', '🔮', '⚡', '🔥', '💎', '🌈', '☀️', '🌙', '💥', '🎊', '🎉', '🪄', '🧿', '⚗️', '🧪', '🔭', '🛸', '🪐', '☄️', '💫'],
            '🎯': ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎟️', '🎫', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻'],
            '🚀': ['🛸', '🪐', '☄️', '💫', '⭐', '🌟', '✨', '🌙', '☀️', '🌍', '🌎', '🌏', '🌌', '🔭', '🛰️', '👽', '👾', '🌠', '🌟', '🛰️', '🚀', '🛸', '🪐', '☄️', '💫'],
            '💎': ['💍', '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💎', '💍', '👑', '💍', '💎', '🔮', '⚡', '🔥', '💎', '🌈', '☀️', '🌙', '⭐', '💥', '🎊', '🎉']
        };

        const options = decoys[targetType] || ['❓', '❔', '💭', '🤔', '❓', '🔍', '🔎', '❌', '⚠️', '❕'];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    addDifficultyIndicator() {
        const existingIndicator = document.getElementById('difficultyIndicator');
        if (existingIndicator) existingIndicator.remove();
        
        const indicator = document.createElement('div');
        indicator.id = 'difficultyIndicator';
        indicator.className = 'difficulty-indicator';
        indicator.innerHTML = `
            <span class="difficulty-label">Difficulty</span>
            <span class="difficulty-value" id="difficultyValue">1.0x</span>
        `;
        
        document.querySelector('.game-ui').appendChild(indicator);
    }
    
    rotateGrid(degrees) {
        const grid = this.elements.challengeGrid;
        grid.style.transform = `rotate(${degrees}deg)`;
        grid.style.transition = 'transform 0.8s ease';
    }
    
    mirrorGrid() {
        const grid = this.elements.challengeGrid;
        grid.style.transform = 'scaleX(-1)';
        setTimeout(() => {
            grid.style.transform = 'scaleX(1)';
        }, 3000);
    }
    
    hideTargets() {
        const targets = document.querySelectorAll('.game-tile[data-target="true"]:not(.clicked)');
        targets.forEach(target => {
            target.style.opacity = '0.15';
            target.style.filter = 'blur(3px)';
        });
        
        // Brief reveal every 8 seconds
        setTimeout(() => {
            targets.forEach(target => {
                target.style.opacity = '0.7';
                target.style.filter = 'none';
            });
            
            setTimeout(() => {
                targets.forEach(target => {
                    if (!target.classList.contains('clicked')) {
                        target.style.opacity = '0.15';
                        target.style.filter = 'blur(3px)';
                    }
                });
            }, 1500);
        }, 8000);
    }
    
    accelerateTimer(speed) {
        this.timerSpeed = speed;
    }
    
    addDistractions() {
        // Add floating emojis that distract
        for (let i = 0; i < 4; i++) {
            const distraction = document.createElement('div');
            distraction.className = 'distraction-element';
            distraction.textContent = ['🌀', '✨', '💫', '🌟', '🔥', '⚡', '💥', '🎊'][Math.floor(Math.random() * 8)];
            distraction.style.position = 'fixed';
            distraction.style.fontSize = '35px';
            distraction.style.left = Math.random() * window.innerWidth + 'px';
            distraction.style.top = Math.random() * window.innerHeight + 'px';
            distraction.style.animation = 'float-distraction 4s linear infinite';
            distraction.style.pointerEvents = 'none';
            distraction.style.zIndex = '999';
            
            document.body.appendChild(distraction);
            this.distractionElements.push(distraction);
            
            setTimeout(() => {
                distraction.remove();
                this.distractionElements = this.distractionElements.filter(d => d !== distraction);
            }, 4000);
        }
    }
    
    addDecoys() {
        // Add fake targets that look real
        const grid = this.elements.challengeGrid;
        const tiles = grid.querySelectorAll('.game-tile:not([data-target="true"]):not(.clicked)');
        const decoyCount = Math.min(4, tiles.length);
        
        for (let i = 0; i < decoyCount; i++) {
            const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
            randomTile.classList.add('decoy');
            randomTile.dataset.fakeTarget = 'true';
            this.decoyElements.push(randomTile);
        }
    }
    
    createClickEffect(tile) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.textContent = ['✨', '💥', '⚡', '🔥', '💫', '🌟'][Math.floor(Math.random() * 6)];
        effect.style.position = 'absolute';
        effect.style.pointerEvents = 'none';
        effect.style.fontSize = '24px';
        effect.style.animation = 'click-burst 0.6s ease-out forwards';
        effect.style.zIndex = '1000';
        
        const rect = tile.getBoundingClientRect();
        effect.style.left = rect.left + rect.width / 2 + 'px';
        effect.style.top = rect.top + rect.height / 2 + 'px';
        
        document.body.appendChild(effect);
        setTimeout(() => effect.remove(), 600);
    }
    
    updateScore(score) {
        this.elements.scoreValue.textContent = score.toLocaleString();
        
        // Add score animation
        this.elements.scoreValue.style.transform = 'scale(1.15)';
        setTimeout(() => {
            this.elements.scoreValue.style.transform = 'scale(1)';
        }, 200);
    }
    
    updateLevel(level) {
        this.elements.levelValue.textContent = level;
    }
    
    updateStreak(streak) {
        this.elements.streakValue.textContent = streak;
        
        // Streak glow effect
        if (streak > 5) {
            this.elements.streakValue.style.color = '#ffa502';
            this.elements.streakValue.style.textShadow = '0 0 15px rgba(255, 165, 2, 0.9)';
        } else {
            this.elements.streakValue.style.color = '#fff';
            this.elements.streakValue.style.textShadow = 'none';
        }
    }
    
    updateProgress() {
        const total = document.querySelectorAll('.game-tile[data-target="true"]').length;
        const completed = document.querySelectorAll('.game-tile[data-target="true"].correct').length;
        
        const progress = total > 0 ? (completed / total) * 100 : 0;
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${completed}/${total}`;
        
        // Progress bar color based on completion
        if (progress === 100) {
            this.elements.progressFill.style.background = 'linear-gradient(90deg, #4caf50, #45a049)';
        } else if (progress > 60) {
            this.elements.progressFill.style.background = 'linear-gradient(90deg, #ffa502, #ff6348)';
        }
    }
    
    updateChallengeInfo(title, description) {
        this.elements.challengeTitle.textContent = title;
        this.elements.challengeDesc.textContent = description;
    }
    
    startTimer(callback) {
        let timeLeft = GAME_CONFIG.LEVEL_TIME;
        this.elements.timerText.textContent = timeLeft;
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        
        this.timerInterval = setInterval(() => {
            timeLeft -= this.timerSpeed;
            this.elements.timerText.textContent = Math.ceil(timeLeft);
            
            const progress = (timeLeft / GAME_CONFIG.LEVEL_TIME) * 283;
            this.elements.timerProgress.style.strokeDashoffset = 283 - progress;
            
            // Timer color changes
            if (timeLeft <= 10) {
                this.elements.timerProgress.style.stroke = '#ff4757';
                this.elements.timerProgress.style.animation = 'timer-panic 0.8s ease-in-out infinite';
            } else if (timeLeft <= 20) {
                this.elements.timerProgress.style.stroke = '#ffa502';
            } else {
                this.elements.timerProgress.style.stroke = '#667eea';
            }
            
            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                if (callback) callback();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.timerSpeed = 1;
        
        // Clean up distractions
        this.distractionElements.forEach(d => d.remove());
        this.distractionElements = [];
        
        // Clean up decoys
        this.decoyElements.forEach(d => d.classList.remove('decoy'));
        this.decoyElements = [];
    }
    
    showAchievement(title, desc) {
        const popup = this.elements.achievementPopup;
        document.getElementById('achievementTitle').textContent = title;
        document.getElementById('achievementDesc').textContent = desc;
        
        popup.classList.add('show');
        
        // Add confetti effect
        this.createConfetti();
        
        // Add achievement sound effect
        this.playAchievementSound();
        
        setTimeout(() => popup.classList.remove('show'), 3000);
    }
    
    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#ffa502', '#ff4757'];
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        
        for (let i = 0; i < 80; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        setTimeout(() => confettiContainer.remove(), 4000);
    }
    
    playAchievementSound() {
        // Create audio context for achievement sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
            oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
            // Fallback for browsers that don't support Web Audio API
            console.log('Achievement unlocked!');
        }
    }
    
    showGameOver(stats) {
        document.getElementById('finalScoreValue').textContent = stats.score.toLocaleString();
        document.getElementById('finalBestStreak').textContent = stats.bestStreak;
        document.getElementById('finalAccuracy').textContent = `${stats.accuracy}%`;
        document.getElementById('finalLevel').textContent = stats.level;
        
        this.elements.gameOverModal.style.display = 'flex';
    }
    
    hideGameOver() {
        this.elements.gameOverModal.style.display = 'none';
    }
    
    updateStats(accuracy, speed, bestStreak) {
        document.getElementById('accuracyText').textContent = `${accuracy}%`;
        document.getElementById('speedText').textContent = `${speed}s`;
        document.getElementById('bestStreakText').textContent = bestStreak;
    }
    
    updateHints(hints) {
        document.getElementById('hintsLeft').textContent = hints;
    }
}

// Simple particle system for hover effects
class ParticleSystem {
    create(element) {
        const rect = element.getBoundingClientRect();
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = rect.left + rect.width / 2 + 'px';
        particle.style.top = rect.top + rect.height / 2 + 'px';
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 1000);
    }
}

