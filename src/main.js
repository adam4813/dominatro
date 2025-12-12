import './style.css';
import { Scene } from './game/Scene.js';
import { Board } from './game/Board.js';
import { GameState } from './game/GameState.js';
import { Domino } from './game/Domino.js';

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
    this.setupRack();
    this.setupInteractionCallbacks();

    // Start animation loop
    this.animate();
  }

  setupRack() {
    // Display player rack dominoes
    const rack = this.gameState.getPlayerRack();
    const rackStartX = (-(rack.length - 1) * 1.5) / 2;
    const rackZ = 4; // Position rack in front of board
    const rackY = 0.1;

    rack.forEach((dominoData, index) => {
      const domino = new Domino(dominoData.leftPips, dominoData.rightPips);
      const x = rackStartX + index * 1.5;
      domino.setPosition(x, rackY, rackZ);

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

    const openEnds = this.board.getOpenEnds();
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
      console.log('Game: Showing center placement zone (board empty)');
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
      `Game: Placement zones shown - Left: ${leftValid ? 'valid' : 'invalid'} at x=${leftX}, Right: ${rightValid ? 'valid' : 'invalid'} at x=${rightX}, z=${boardZ}`
    );
  }

  handlePlacementZoneClick(side, valid, dominoData) {
    if (!valid) {
      console.log('Game: Invalid placement attempt - zone is red');
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

      console.log('Game: Domino placed successfully');
    } else {
      console.log('Game: Placement failed');
    }
  }

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
    const rackStartX = (-(this.rackDominoes.length - 1) * 1.5) / 2;
    const rackZ = 4;
    const rackY = 0.1;

    this.rackDominoes.forEach((rackDomino, index) => {
      const x = rackStartX + index * 1.5;
      rackDomino.domino.setPosition(x, rackY, rackZ);
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
