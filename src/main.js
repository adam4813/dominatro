import './style.css';
import { Scene } from './game/Scene.js';
import { Board } from './game/Board.js';

class Game {
  constructor() {
    this.scene = new Scene();
    this.board = new Board(this.scene);
    this.init();
  }

  init() {
    // Add canvas to DOM
    const app = document.querySelector('#app');
    app.appendChild(this.scene.getCanvas());

    // Start animation loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.scene.render();
  }

  // Expose methods for testing HUD updates
  testAddScore(points) {
    this.board.addScore(points);
    console.log(
      'Added',
      points,
      'points. New score:',
      this.board.gameState.getScore()
    );
  }

  testDealTiles(count) {
    const tiles = this.board.dealTilesToRack(count);
    console.log(
      'Dealt',
      tiles.length,
      'tiles. Bone pile:',
      this.board.gameState.getBonePileSize()
    );
  }

  testPlayTile(index) {
    const tile = this.board.playTile(index);
    if (tile) {
      console.log('Played tile:', tile, 'from rack');
    }
  }

  testDecrementPulls() {
    this.board.decrementPulls();
    console.log('Pulls remaining:', this.board.gameState.getPullsRemaining());
  }
}

// Store game instance for later access (cleanup, testing, etc.)
// Note: This will be null until DOMContentLoaded event fires
let gameInstance = null;

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  gameInstance = new Game();
  // Make it available globally for testing
  window.gameInstance = gameInstance;
});

export { gameInstance };
