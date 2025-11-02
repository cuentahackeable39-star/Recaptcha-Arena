class AILevelGenerator {
    constructor() {
        // Remove API rate limiting entirely - use emoji-based gameplay
        this.currentType = 0;
    }

    async generateChallenge(playerStats) {
        const challengeType = this.selectChallengeType(playerStats);
        const gridSize = Math.min(6, 3 + Math.floor(playerStats.level / 2));
        
        // Dynamic target count based on level difficulty
        const targetCount = Math.max(1, Math.min(
            Math.floor(gridSize * gridSize * 0.3), 
            2 + Math.floor(playerStats.level / 3)
        ));
        
        const pattern = this.generatePattern(gridSize, targetCount);
        
        // Add special effects for higher levels
        const specialEffects = playerStats.level > 5 ? this.generateSpecialEffects() : null;
        
        const challenge = {
            type: challengeType.type,
            name: challengeType.name,
            description: challengeType.descriptionFunc(playerStats.level),
            targetType: this.selectTargetType(challengeType.targetTypes),
            gridSize: gridSize,
            pattern: pattern,
            timeLimit: Math.max(15, 35 - playerStats.level),
            specialEffects: specialEffects,
            emoji: true // Always use emojis
        };
        
        return challenge;
    }

    selectChallengeType(playerStats) {
        const types = GAME_CONFIG.CHALLENGE_TYPES;
        // Rotate through challenge types for variety
        const index = (playerStats.level - 1) % types.length;
        return types[index];
    }

    selectTargetType(possibleTypes) {
        return possibleTypes[Math.floor(Math.random() * possibleTypes.length)];
    }

    generatePattern(gridSize, targetCount) {
        const totalTiles = gridSize * gridSize;
        const pattern = [];
        const used = new Set();
        
        // Ensure targets are somewhat spread out
        const positions = Array.from({length: totalTiles}, (_, i) => i);
        
        // Shuffle positions
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }
        
        return positions.slice(0, targetCount);
    }

    generateSpecialEffects() {
        // Add visual effects for higher levels
        const effects = ['rainbow', 'neon', 'glitch', 'pulse', 'wave'];
        return effects[Math.floor(Math.random() * effects.length)];
    }

    // Remove image generation entirely - use emoji system
    async generateTileImages(challenge) {
        return { emoji: true };
    }

    getFallbackImages(challenge) {
        return { emoji: true };
    }
}