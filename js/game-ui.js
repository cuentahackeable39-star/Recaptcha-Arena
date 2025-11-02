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
        // Build a broad decoy pool from all challenge types, excluding the current targetType
        const globalPool = (GAME_CONFIG?.CHALLENGE_TYPES || [])
            .flatMap(t => t.targetTypes)
            .filter(e => e && e !== targetType);

        const decoys = {
            '🚗': ['🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🏍️', '🚲', '🛵', '🚂', '✈️', '🚁', '🚤', '⛵', '🚢'],
            '🍕': ['🍔', '🍟', '🌭', '🍿', '🥓', '🍳', '🥞', '🥐', '🥨', '🥯', '🧀', '🍖', '🍗', '🥩', '🥪', '🌮', '🌯', '🧆', '🥙', '🍱', '🍜', '🍲', '🍣', '🍤', '🍙', '🍚', '🍛', '🍝', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍡', '🍦', '🍧', '🍨'],
            '🐶': ['🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅', '🦉', '🐺', '🐗', '🐴', '🦄', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈'],
            '⭐': ['🌟', '✨', '💫', '🎯', '🔮', '⚡', '🔥', '💎', '🌈', '☀️', '🌙', '💥', '🎊', '🎉'],
            '🎯': ['🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '🏵️', '🎗️', '🎟️', '🎫', '🎪', '🎭', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻'],
            '🚀': ['🛸', '🪐', '☄️', '💫', '⭐', '🌟', '✨', '🌙', '☀️', '🌍', '🌎', '🌏', '🌌', '🔭', '🛰️', '👽', '👾', '🌠']
        };

        const options = decoys[targetType] && decoys[targetType].length > 0
            ? decoys[targetType]
            : (globalPool.length > 0 ? globalPool : ['🌟', '✨', '💫', '⚡', '🔥', '💎', '🎲', '🎮', '🍕', '🐶', '🚗', '🚀']);

        return options[Math.floor(Math.random() * options.length)];
    }
    
    // Add confetti celebration
    showAchievement(title, desc) {
        const popup = this.elements.achievementPopup;
        document.getElementById('achievementTitle').textContent = title;
        document.getElementById('achievementDesc').textContent = desc;
        
        popup.classList.add('show');
        
        // Add confetti effect
        this.createConfetti();
        
        setTimeout(() => popup.classList.remove('show'), 3000);
    }
    
    createConfetti() {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7'];
        const confettiContainer = document.createElement('div');
        confettiContainer.className = 'confetti-container';
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confettiContainer.appendChild(confetti);
        }
        
        document.body.appendChild(confettiContainer);
        setTimeout(() => confettiContainer.remove(), 3000);
    }
    
    showLoadingState(grid, totalTiles) {
        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'game-tile loading';
            
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '⏳';
            
            tile.appendChild(spinner);
            grid.appendChild(tile);
        }
    }
    
    renderTiles(challenge, images, grid, totalTiles) {
        grid.innerHTML = '';
        
        const pattern = challenge.pattern;
        
        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'game-tile';
            
            const isTarget = pattern.includes(i);
            tile.dataset.target = isTarget;
            tile.dataset.type = isTarget ? challenge.targetType : 'decoy';
            
            const tileContent = document.createElement('div');
            tileContent.className = 'tile-content';
            
            // Use the emoji from TILE_EMOJIS as fallback
            const emoji = GAME_CONFIG.TILE_EMOJIS[challenge.targetType] || '🎯';
            tileContent.textContent = emoji;
            tileContent.style.fontSize = '40px';
            tileContent.style.display = 'flex';
            tileContent.style.alignItems = 'center';
            tileContent.style.justifyContent = 'center';
            
            // Only try to use images if they're valid URLs
            if (images.targetImage && images.targetImage.startsWith('http')) {
                tileContent.style.backgroundImage = `url(${isTarget ? images.targetImage : images.decoyImages[i % images.decoyImages.length]})`;
                tileContent.style.backgroundSize = 'cover';
                tileContent.style.backgroundPosition = 'center';
                tileContent.style.backgroundRepeat = 'no-repeat';
                tileContent.style.fontSize = '0'; // Hide emoji when image loads
            }
            
            tile.appendChild(tileContent);
            grid.appendChild(tile);
            
            // Handle image loading errors
            const img = new Image();
            img.onerror = () => {
                // Fallback to emoji if image fails to load
                const emoji = GAME_CONFIG.TILE_EMOJIS[challenge.targetType] || '🎯';
                tileContent.style.backgroundImage = 'none';
                tileContent.textContent = emoji;
            };
            img.src = isTarget ? images.targetImage : images.decoyImages[i % images.decoyImages.length];
        }
    }
    
    renderEmojiTiles(challenge, grid, totalTiles) {
        grid.innerHTML = '';
        
        const pattern = challenge.pattern;
        
        for (let i = 0; i < totalTiles; i++) {
            const tile = document.createElement('div');
            tile.className = 'game-tile';
            
            const isTarget = pattern.includes(i);
            tile.dataset.target = isTarget;
            tile.dataset.type = isTarget ? challenge.targetType : 'decoy';
            
            const tileContent = document.createElement('div');
            tileContent.className = 'tile-content';
            
            // Use the provided emoji directly, and a real decoy emoji for non-targets
            tileContent.textContent = isTarget ? challenge.targetType : this.getDecoyEmoji(challenge.targetType);
            tileContent.style.backgroundImage = 'none';
            tileContent.style.fontSize = '40px';
            tileContent.style.display = 'flex';
            tileContent.style.alignItems = 'center';
            tileContent.style.justifyContent = 'center';
            
            tile.appendChild(tileContent);
            grid.appendChild(tile);
        }
    }
    
    updateScore(score) {
        this.elements.scoreValue.textContent = score.toLocaleString();
    }
    
    updateLevel(level) {
        this.elements.levelValue.textContent = level;
    }
    
    updateStreak(streak) {
        this.elements.streakValue.textContent = streak;
    }
    
    updateProgress() {
        const total = document.querySelectorAll('.game-tile[data-target="true"]').length;
        const completed = document.querySelectorAll('.game-tile[data-target="true"].correct').length;
        
        const progress = total > 0 ? (completed / total) * 100 : 0;
        this.elements.progressFill.style.width = `${progress}%`;
        this.elements.progressText.textContent = `${completed}/${total}`;
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
            timeLeft--;
            this.elements.timerText.textContent = timeLeft;
            
            const progress = (timeLeft / GAME_CONFIG.LEVEL_TIME) * 283;
            this.elements.timerProgress.style.strokeDashoffset = 283 - progress;
            
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
    
    createClickEffect(tile) {
        // Add click effect here if needed
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