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
    }
    
    generateLevel() {
        const playerStats = {
            level: this.level,
            score: this.score,
            accuracy: this.getAccuracy(),
            avgTime: this.getAverageTime(),
            streak: this.streak,
            history: this.playerHistory
        };
        
        return this.aiGenerator.generateChallenge(playerStats).then(challenge => {
            this.currentChallenge = challenge;
            
            const safeChallengeName = challenge.name.replace(/\s+/g, '-').toLowerCase();
            this.ui.updateChallengeInfo(
                `Level ${this.level}: ${challenge.name}`,
                challenge.description
            );
            
            this.ui.renderChallengeGrid(challenge);
            this.levelStartTime = Date.now();
        });
    }
    
    handleTileClick(tileElement, isTarget) {
        if (tileElement.classList.contains('clicked')) return;
        
        tileElement.classList.add('clicked');
        this.totalClicks++;
        
        // Record player action for AI learning
        const tileIndex = Array.from(tileElement.parentNode.children).indexOf(tileElement);
        this.playerHistory.push({
            level: this.level,
            tileIndex: tileIndex,
            isCorrect: isTarget,
            timestamp: Date.now() - this.levelStartTime
        });
        
        if (isTarget) {
            tileElement.classList.add('correct');
            this.correctClicks++;
            this.streak++;
            this.score += 100 * this.level + (this.streak * 10);
            this.checkAchievements();
        } else {
            tileElement.classList.add('incorrect');
            this.streak = 0;
            this.score = Math.max(0, this.score - 50);
        }
        
        this.updateUI();
        this.checkLevelComplete();
    }
    
    checkLevelComplete() {
        const targets = document.querySelectorAll('.game-tile[data-target="true"]');
        const clickedTargets = Array.from(targets).filter(t => t.classList.contains('correct'));
        
        if (clickedTargets.length === targets.length) {
            this.completeLevel();
        }
    }
    
    completeLevel() {
        this.ui.stopTimer();
        
        const levelTime = (Date.now() - this.levelStartTime) / 1000;
        const timeBonus = Math.max(0, Math.floor((30 - levelTime) * 10));
        
        this.score += timeBonus;
        this.level++;
        
        this.ui.showAchievement('Level Complete!', `+${timeBonus} time bonus!`);
        
        setTimeout(() => {
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
            targets[0].classList.add('hint');
            setTimeout(() => targets[0].classList.remove('hint'), 2000);
        }
    }
    
    skipLevel() {
        this.score = Math.max(0, this.score - 200);
        this.level++;
        
        this.ui.stopTimer();
        this.generateLevel().then(() => {
            this.ui.startTimer(() => this.gameOver());
        });
    }
    
    usePowerUp() {
        if (this.powerUps <= 0) return;
        
        this.powerUps--;
        const targets = document.querySelectorAll('.game-tile[data-target="true"]:not(.clicked)');
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
    }
    
    gameOver() {
        const stats = {
            score: this.score,
            bestStreak: this.bestStreak,
            accuracy: this.getAccuracy(),
            level: this.level
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
    }
}