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

  /**
   * Test helper: Add points to the score
   * @param {number} points - Points to add to the current score
   */
  testAddScore(points) {
    if (typeof points !== 'number' || !Number.isFinite(points)) {
      console.error('testAddScore: points must be a valid number');
      return;
    }
    try {
      this.board.addScore(points);
      console.log(
        'Added',
        points,
        'points. New score:',
        this.board.gameState.getScore()
      );
    } catch (error) {
      console.error('testAddScore error:', error.message);
    }
  }

  /**
   * Test helper: Deal tiles from the bone pile to the player's rack
   * @param {number} count - Number of tiles to deal (must be a positive integer)
   */
  testDealTiles(count) {
    if (
      typeof count !== 'number' ||
      !Number.isFinite(count) ||
      count < 0 ||
      !Number.isInteger(count)
    ) {
      console.error('testDealTiles: count must be a non-negative integer');
      return;
    }
    if (count > this.board.gameState.getBonePileSize()) {
      console.error(
        'testDealTiles: not enough tiles in bone pile. Available:',
        this.board.gameState.getBonePileSize()
      );
      return;
    }
    try {
      const tiles = this.board.dealTilesToRack(count);
      console.log(
        'Dealt',
        tiles.length,
        'tiles. Bone pile:',
        this.board.gameState.getBonePileSize()
      );
    } catch (error) {
      console.error('testDealTiles error:', error.message);
    }
  }

  /**
   * Test helper: Play a tile from the player's rack
   * @param {number} index - Index of the tile in the rack (must be a non-negative integer)
   */
  testPlayTile(index) {
    if (
      typeof index !== 'number' ||
      !Number.isFinite(index) ||
      index < 0 ||
      !Number.isInteger(index) ||
      index >= this.board.gameState.getPlayerRackSize()
    ) {
      console.error(
        'testPlayTile: index must be a valid integer rack position (0-' +
          (this.board.gameState.getPlayerRackSize() - 1) +
          ')'
      );
      return;
    }
    const tile = this.board.playTile(index);
    if (tile) {
      console.log('Played tile:', tile, 'from rack');
    }
  }

  /**
   * Test helper: Complete the current pull and advance to the next one
   */
  testCompletePull() {
    this.board.completePull();
    console.log('Pulls remaining:', this.board.gameState.getPullsRemaining());
  }
}

// Store game instance for later access (cleanup, testing, etc.)
// Note: This will be null until DOMContentLoaded event fires
let gameInstance = null;

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  gameInstance = new Game();
  // Expose for development/testing only
  window.__GAME_DEBUG__ = { gameInstance };
});

export { gameInstance };
