import { Domino } from './Domino.js';
import { GameState } from './GameState.js';
import { HUD } from './HUD.js';

export class Board {
  constructor(scene) {
    this.scene = scene;
    this.dominoes = [];
    this.gameState = new GameState();
    this.hud = null;
    this.initializeGame();
  }

  initializeGame() {
    // Initialize game state
    console.log('Initial bone pile size:', this.gameState.getBonePileSize());

    // Shuffle the bone pile
    this.gameState.shuffle();

    // Deal 5 tiles to player rack
    const dealtTiles = this.gameState.dealToRack(5);
    console.log('Dealt tiles to rack:', dealtTiles);
    console.log('Remaining bone pile size:', this.gameState.getBonePileSize());

    // Initialize HUD
    this.hud = new HUD(
      this.gameState,
      this.scene.getScene(),
      this.scene.getCamera()
    );

    // Display the player's rack
    this.displayPlayerRack();
  }

  displayPlayerRack() {
    const playerRack = this.gameState.getPlayerRack();
    const spacing = 1.5; // Space between dominoes
    const startX = (-(playerRack.length - 1) * spacing) / 2; // Center the rack

    playerRack.forEach((tile, index) => {
      const x = startX + index * spacing;
      this.addDomino(tile.left, tile.right, x, 0);
    });
  }

  addDomino(leftPips, rightPips, x, z) {
    const domino = new Domino(leftPips, rightPips);
    domino.setPosition(x, 0.1, z);
    this.dominoes.push(domino);
    this.scene.add(domino.getMesh());
    return domino;
  }

  removeDomino(domino) {
    const index = this.dominoes.indexOf(domino);
    if (index > -1) {
      this.dominoes.splice(index, 1);
      this.scene.remove(domino.getMesh());
      domino.dispose();
    }
  }

  getDominoes() {
    return this.dominoes;
  }

  getHUD() {
    return this.hud;
  }

  /**
   * Update score and refresh HUD
   * @param {number} points - Points to add
   */
  addScore(points) {
    this.gameState.addScore(points);
    if (this.hud) {
      this.hud.updateScore();
    }
  }

  /**
   * Deal tiles from bone pile to player rack and refresh HUD
   * @param {number} count - Number of tiles to deal (must be a positive integer)
   * @returns {Array} Array of dealt tiles
   */
  dealTilesToRack(count) {
    if (
      typeof count !== 'number' ||
      !Number.isFinite(count) ||
      count < 0 ||
      !Number.isInteger(count)
    ) {
      throw new Error('Count must be a non-negative integer');
    }
    const dealtTiles = this.gameState.dealToRack(count);
    if (this.hud) {
      this.hud.updateBonePile();
      this.hud.updateRack();
    }
    return dealtTiles;
  }

  /**
   * Play a tile from rack to board and refresh HUD
   * @param {number} rackIndex - Index of tile in rack
   */
  playTile(rackIndex) {
    const tile = this.gameState.playTileFromRack(rackIndex);
    if (tile && this.hud) {
      this.hud.updateRack();
    }
    return tile;
  }

  /**
   * Decrement pulls and refresh HUD
   * Represents completion of a pull in the match progression
   */
  completePull() {
    this.gameState.decrementPulls();
    if (this.hud) {
      this.hud.updateProgression();
    }
  }

  clear() {
    this.dominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
      domino.dispose();
    });
    this.dominoes = [];
  }

  destroy() {
    this.clear();
    if (this.hud) {
      this.hud.destroy();
      this.hud = null;
    }
  }
}
