import { Domino } from './Domino.js';
import { GameState } from './GameState.js';

export class Board {
  constructor(scene) {
    this.scene = scene;
    this.dominoes = [];
    this.gameState = new GameState();
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

  clear() {
    this.dominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
      domino.dispose();
    });
    this.dominoes = [];
  }
}
