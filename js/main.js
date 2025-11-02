class RecaptchaGame {
    constructor() {
        this.ui = new GameUI();
        this.aiGenerator = new AILevelGenerator();
        this.gameLogic = new GameLogic(this.ui, this.aiGenerator);
        
        // Make accessible globally for async image generation
        window.game = this;
        
        this.init();
    }
    
    async init() {
        this.setupEventListeners();
        await this.gameLogic.generateLevel();
        this.ui.startTimer(() => this.gameLogic.gameOver());
        this.gameLogic.updateUI();
    }
    
    setupEventListeners() {
        document.getElementById('hintBtn').addEventListener('click', () => this.gameLogic.useHint());
        document.getElementById('skipBtn').addEventListener('click', () => this.gameLogic.skipLevel());
        document.getElementById('powerBtn').addEventListener('click', () => this.gameLogic.usePowerUp());
        document.getElementById('restartBtn').addEventListener('click', () => this.gameLogic.restart());
        
        // Handle tile clicks through event delegation
        document.getElementById('challengeGrid').addEventListener('click', (e) => {
            const tile = e.target.closest('.game-tile');
            if (tile && !tile.classList.contains('clicked')) {
                const isTarget = tile.dataset.target === 'true';
                this.gameLogic.handleTileClick(tile, isTarget);
            }
        });
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new RecaptchaGame();
});