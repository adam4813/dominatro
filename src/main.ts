import './style.css';
import { Scene } from './game/Scene';
import { Board } from './game/Board';
import { GameState } from './game/GameState';
import { Domino } from './game/Domino';
import type { DominoData, RackDomino, PlacementSide } from './types';
import { SPECIAL_TILE_PIP_VALUE } from './types';

// Constants for rack layout
const RACK_SPACING = 1.5;
const RACK_Z_POSITION = 4;
const RACK_Y_POSITION = 0.1;

/**
 * Main game controller class
 * Orchestrates the game components and handles user interactions
 */
class Game {
  private scene: Scene;
  private gameState: GameState;
  private board: Board;
  private rackDominoes: RackDomino[] = [];

  constructor() {
    this.scene = new Scene();
    this.gameState = new GameState();
    this.board = new Board(this.scene, this.gameState);

    this.init();
  }

  private init(): void {
    const app = document.querySelector('#app');
    if (app) {
      app.appendChild(this.scene.getCanvas());
    }

    this.initializeGame();
    this.setupRack();
    this.setupInteractionCallbacks();
    this.animate();
  }

  private initializeGame(): void {
    this.gameState.shuffle();
    this.gameState.dealToRack(7);

    console.log('Game: Dealt 7 tiles to rack');
    console.log(
      'Game: Remaining bone pile size:',
      this.gameState.getBonePileSize()
    );
  }

  private setupRack(): void {
    const rack = this.gameState.getPlayerRack();
    const rackStartX = (-(rack.length - 1) * RACK_SPACING) / 2;

    rack.forEach((dominoData, index) => {
      const domino = new Domino(
        dominoData.left,
        dominoData.right,
        dominoData.type
      );
      const x = rackStartX + index * RACK_SPACING;
      domino.setPosition(x, RACK_Y_POSITION, RACK_Z_POSITION);

      this.rackDominoes.push({
        domino,
        mesh: domino.getMesh(),
        data: dominoData,
      });

      this.scene.add(domino.getMesh());
    });

    this.scene.rackDominoes = this.rackDominoes;

    console.log('Game: Player rack displayed with', rack.length, 'dominoes');
  }

  private setupInteractionCallbacks(): void {
    this.scene.onDominoSelectedCallback = (dominoData: DominoData) => {
      this.handleDominoSelected(dominoData);
    };

    this.scene.onDominoDeselectedCallback = () => {
      this.handleDominoDeselected();
    };

    this.scene.canFlipDominoCallback = (dominoData: DominoData) => {
      return this.canFlipDomino(dominoData);
    };

    this.scene.getPlacementOrientationCallback = (
      dominoData: DominoData,
      side: PlacementSide
    ) => {
      return this.board.getPlacementOrientation(dominoData, side);
    };
  }

  private canFlipDomino(dominoData: DominoData): boolean {
    if (this.board.chain.length === 0) {
      return true;
    }

    if (dominoData.left === dominoData.right) {
      return false;
    }

    const openEnds = this.board.getOpenEnds();

    const matchesLeft =
      dominoData.left === openEnds.left || dominoData.right === openEnds.left;
    const matchesRight =
      dominoData.left === openEnds.right || dominoData.right === openEnds.right;

    if (matchesLeft && matchesRight) {
      return true;
    } else if (matchesLeft || matchesRight) {
      return true;
    }

    return false;
  }

  private handleDominoSelected(dominoData: DominoData): void {
    console.log('Game: Domino selected:', dominoData);
    this.updatePlacementZones(dominoData);
  }

  private handleDominoDeselected(): void {
    console.log('Game: Domino deselected');
  }

  private updatePlacementZones(dominoData: DominoData): void {
    this.scene.clearPlacementZones();

    if (!this.board || !this.board.chain) {
      console.error('Game: Board not properly initialized');
      return;
    }

    const boardZ = this.board.boardZPosition;
    // Special tiles with SPECIAL_TILE_PIP_VALUE should not be treated as doubles
    const isDouble =
      dominoData.left === dominoData.right &&
      dominoData.left !== SPECIAL_TILE_PIP_VALUE;

    if (this.board.chain.length === 0) {
      this.scene.createPlacementZone(
        'center',
        0,
        boardZ,
        true,
        (_side, valid) =>
          this.handlePlacementZoneClick('center', valid, dominoData),
        isDouble
      );
      return;
    }

    const { leftX, rightX } = this.board.getPlacementPositions();

    const leftValid = this.board.isValidPlacement(dominoData, 'left');
    this.scene.createPlacementZone(
      'left',
      leftX,
      boardZ,
      leftValid,
      (_side, valid) =>
        this.handlePlacementZoneClick('left', valid, dominoData),
      isDouble
    );

    const rightValid = this.board.isValidPlacement(dominoData, 'right');
    this.scene.createPlacementZone(
      'right',
      rightX,
      boardZ,
      rightValid,
      (_side, valid) =>
        this.handlePlacementZoneClick('right', valid, dominoData),
      isDouble
    );

    console.log(
      `Game: Placement zones shown - Left: ${leftValid ? 'valid' : 'invalid'} at x=${leftX}, Right: ${rightValid ? 'valid' : 'invalid'} at x=${rightX}`
    );
  }

  private handlePlacementZoneClick(
    side: PlacementSide,
    valid: boolean,
    dominoData: DominoData
  ): void {
    if (!valid) {
      console.log('Game: Invalid placement attempt - deselecting domino');
      this.scene.deselectDomino();
      return;
    }

    console.log(`Game: Placing domino on ${side} side`);

    const actualSide: PlacementSide = side === 'center' ? 'left' : side;
    const success = this.board.placeDomino(dominoData, actualSide);

    if (success) {
      this.removeDominoFromRack(dominoData);
      this.scene.deselectDomino();
    } else {
      console.log('Game: Placement failed');
    }
  }

  private removeDominoFromRack(dominoData: DominoData): void {
    const index = this.rackDominoes.findIndex((rd) => {
      if (!rd.data || !dominoData) return false;
      return (
        (rd.data.left === dominoData.left &&
          rd.data.right === dominoData.right) ||
        (rd.data.left === dominoData.right && rd.data.right === dominoData.left)
      );
    });

    if (index > -1) {
      const rackDomino = this.rackDominoes[index]!;
      this.scene.remove(rackDomino.mesh);
      rackDomino.domino.dispose();
      this.rackDominoes.splice(index, 1);

      this.scene.rackDominoes = this.rackDominoes;
      this.repositionRack();
    } else {
      console.error('removeDominoFromRack: Domino not found in rackDominoes.', {
        dominoData,
        rackDominoes: this.rackDominoes.map((rd) => rd.data),
      });
    }
  }

  private repositionRack(): void {
    if (this.rackDominoes.length === 0) {
      return;
    }

    const rackStartX = (-(this.rackDominoes.length - 1) * RACK_SPACING) / 2;

    this.rackDominoes.forEach((rackDomino, index) => {
      const x = rackStartX + index * RACK_SPACING;
      rackDomino.domino.setPosition(x, RACK_Y_POSITION, RACK_Z_POSITION);
    });
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());
    this.scene.render();
  }

  // Test helpers for development
  testAddScore(points: number): void {
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
      console.error('testAddScore error:', (error as Error).message);
    }
  }

  testDealTiles(count: number): void {
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
      console.error('testDealTiles error:', (error as Error).message);
    }
  }

  testPlayTile(index: number): void {
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

  testCompletePull(): void {
    this.board.completePull();
    console.log('Pulls remaining:', this.board.gameState.getPullsRemaining());
  }
}

// Store game instance for later access
let gameInstance: Game | null = null;

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  gameInstance = new Game();
  // Expose for development/testing only
  if (import.meta.env?.DEV) {
    (
      window as unknown as { __GAME_DEBUG__: { gameInstance: Game } }
    ).__GAME_DEBUG__ = { gameInstance };
  }
});

export { gameInstance };
