import './style.css';
import { Scene } from './game/Scene.js';
import { Board } from './game/Board.js';
import { GameState } from './game/GameState.js';
import { Domino } from './game/Domino.js';

// Constants for rack layout
const RACK_SPACING = 1.5;
const RACK_Z_POSITION = 4;
const RACK_Y_POSITION = 0.1;

class Game {
  constructor() {
    this.scene = new Scene();
    this.gameState = new GameState();
    this.board = new Board(this.scene, this.gameState);
    this.rackDominoes = []; // Store domino objects with their data

    this.init();
  }

  init() {
    // Add canvas to DOM
    const app = document.querySelector('#app');
    app.appendChild(this.scene.getCanvas());

    // Setup the game
    this.initializeGame();
    this.setupRack();
    this.setupInteractionCallbacks();

    // Start animation loop
    this.animate();
  }

  initializeGame() {
    // Shuffle the bone pile
    this.gameState.shuffle();

    // Deal 7 tiles to player rack for testing placement
    this.gameState.dealToRack(7);

    console.log('Game: Dealt 7 tiles to rack');
    console.log(
      'Game: Remaining bone pile size:',
      this.gameState.getBonePileSize()
    );
  }

  setupRack() {
    // Display player rack dominoes
    const rack = this.gameState.getPlayerRack();
    const rackStartX = (-(rack.length - 1) * RACK_SPACING) / 2;

    rack.forEach((dominoData, index) => {
      const domino = new Domino(dominoData.left, dominoData.right);
      const x = rackStartX + index * RACK_SPACING;
      domino.setPosition(x, RACK_Y_POSITION, RACK_Z_POSITION);

      // Store domino with its data for later reference
      this.rackDominoes.push({
        domino: domino,
        mesh: domino.getMesh(),
        data: dominoData,
      });

      this.scene.add(domino.getMesh());
    });

    // Register rack dominoes with scene for raycasting
    this.scene.rackDominoes = this.rackDominoes;

    console.log('Game: Player rack displayed with', rack.length, 'dominoes');
  }

  setupInteractionCallbacks() {
    // Set up callback for when a domino is selected
    this.scene.onDominoSelectedCallback = (dominoData) => {
      this.handleDominoSelected(dominoData);
    };

    // Set up callback for when a domino is deselected
    this.scene.onDominoDeselectedCallback = () => {
      this.handleDominoDeselected();
    };
  }

  handleDominoSelected(dominoData) {
    console.log('Game: Domino selected:', dominoData);

    // Show placement zones
    this.updatePlacementZones(dominoData);
  }

  handleDominoDeselected() {
    console.log('Game: Domino deselected');
  }

  updatePlacementZones(dominoData) {
    // Clear existing zones
    this.scene.clearPlacementZones();

    // Defensive null check
    if (!this.board || !this.board.chain) {
      console.error('Game: Board not properly initialized');
      return;
    }

    const boardZ = this.board.boardZPosition;
    const spacing = this.board.dominoSpacing;

    // If board is empty, show a single central placement zone
    if (this.board.chain.length === 0) {
      const isValid = true;
      this.scene.createPlacementZone(
        'center',
        0,
        boardZ,
        isValid,
        (side, valid) =>
          this.handlePlacementZoneClick('center', valid, dominoData)
      );
      return;
    }

    // Calculate positions for left and right zones
    const chainLength = this.board.chain.length;
    const totalWidth = (chainLength - 1) * spacing;
    const leftX = -totalWidth / 2 - spacing;
    const rightX = totalWidth / 2 + spacing;

    // Left placement zone
    const leftValid = this.board.isValidPlacement(dominoData, 'left');
    this.scene.createPlacementZone(
      'left',
      leftX,
      boardZ,
      leftValid,
      (side, valid) => this.handlePlacementZoneClick('left', valid, dominoData)
    );

    // Right placement zone
    const rightValid = this.board.isValidPlacement(dominoData, 'right');
    this.scene.createPlacementZone(
      'right',
      rightX,
      boardZ,
      rightValid,
      (side, valid) => this.handlePlacementZoneClick('right', valid, dominoData)
    );

    console.log(
      `Game: Placement zones shown - Left: ${leftValid ? 'valid' : 'invalid'} at x=${leftX}, Right: ${rightValid ? 'valid' : 'invalid'} at x=${rightX}`
    );
  }

  handlePlacementZoneClick(side, valid, dominoData) {
    if (!valid) {
      console.log('Game: Invalid placement attempt - deselecting domino');
      this.scene.deselectDomino();
      return;
    }

    console.log(`Game: Placing domino on ${side} side`);

    // For center placement (first domino), treat it as left for consistency
    const actualSide = side === 'center' ? 'left' : side;

    // Place the domino on the board
    const success = this.board.placeDomino(dominoData, actualSide);

    if (success) {
      // Remove domino from rack visually
      this.removeDominoFromRack(dominoData);

      // Deselect the domino
      this.scene.deselectDomino();
    } else {
      console.log('Game: Placement failed');
    }
  }

  /**
   * Remove a domino from the visual rack display
   * Note: The domino data is removed from GameState.playerRack by Board.placeDomino
   * This method handles the visual/Three.js representation cleanup
   * @param {Object} dominoData - The domino data object to remove from visual rack
   */
  removeDominoFromRack(dominoData) {
    const index = this.rackDominoes.findIndex((rd) => rd.data === dominoData);

    if (index > -1) {
      const rackDomino = this.rackDominoes[index];
      this.scene.remove(rackDomino.mesh);
      rackDomino.domino.dispose();
      this.rackDominoes.splice(index, 1);

      // Update scene's rack dominoes
      this.scene.rackDominoes = this.rackDominoes;

      // Reposition remaining dominoes
      this.repositionRack();
    }
  }

  repositionRack() {
    // Early return if rack is empty
    if (this.rackDominoes.length === 0) {
      return;
    }

    const rackStartX = (-(this.rackDominoes.length - 1) * RACK_SPACING) / 2;

    this.rackDominoes.forEach((rackDomino, index) => {
      const x = rackStartX + index * RACK_SPACING;
      rackDomino.domino.setPosition(x, RACK_Y_POSITION, RACK_Z_POSITION);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.scene.render();
  }
}

// Store game instance for later access (cleanup, testing, etc.)
// Note: This will be null until DOMContentLoaded event fires
let gameInstance = null;

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  gameInstance = new Game();
});

export { gameInstance };
