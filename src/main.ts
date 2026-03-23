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
const RACK_HELD_Y_OFFSET = 0.5; // How much to raise held tiles

// Constants for passive pool layout (HUD top center, below pulls/target)
const PASSIVE_POOL_HUD_Y = 0.65; // Below progression panel

/**
 * Main game controller class
 * Orchestrates the game components and handles user interactions
 */
class Game {
  private scene: Scene;
  private gameState: GameState;
  private board: Board;
  private rackDominoes: RackDomino[] = [];
  private holdModeActive: boolean = false;
  private holdButton: HTMLButtonElement | null = null;
  private holdCountDisplay: HTMLDivElement | null = null;

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

    this.createHoldButton();
    this.createHoldCountDisplay();
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

  private createHoldButton(): void {
    this.holdButton = document.createElement('button');
    this.holdButton.textContent = 'Hold & Discard';
    this.holdButton.style.position = 'absolute';
    this.holdButton.style.bottom = '20px';
    this.holdButton.style.left = '50%';
    this.holdButton.style.transform = 'translateX(-50%)';
    this.holdButton.style.padding = '12px 24px';
    this.holdButton.style.fontSize = '16px';
    this.holdButton.style.fontWeight = 'bold';
    this.holdButton.style.backgroundColor = '#ff6b6b';
    this.holdButton.style.color = 'white';
    this.holdButton.style.border = 'none';
    this.holdButton.style.borderRadius = '8px';
    this.holdButton.style.cursor = 'pointer';
    this.holdButton.style.display = 'block';
    this.holdButton.style.zIndex = '1000';
    this.holdButton.style.transition = 'opacity 0.3s';

    this.holdButton.addEventListener('click', () => this.toggleHoldMode());
    document.body.appendChild(this.holdButton);

    // Update button state initially
    this.updateHoldButtonState();
  }

  private createHoldCountDisplay(): void {
    this.holdCountDisplay = document.createElement('div');
    this.holdCountDisplay.style.position = 'absolute';
    this.holdCountDisplay.style.bottom = '70px';
    this.holdCountDisplay.style.left = '50%';
    this.holdCountDisplay.style.transform = 'translateX(-50%)';
    this.holdCountDisplay.style.padding = '8px 16px';
    this.holdCountDisplay.style.fontSize = '14px';
    this.holdCountDisplay.style.fontWeight = 'bold';
    this.holdCountDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    this.holdCountDisplay.style.color = 'white';
    this.holdCountDisplay.style.borderRadius = '6px';
    this.holdCountDisplay.style.display = 'none';
    this.holdCountDisplay.style.zIndex = '1000';

    document.body.appendChild(this.holdCountDisplay);
  }

  private updateHoldCountDisplay(): void {
    if (!this.holdCountDisplay) return;

    const heldCount = this.rackDominoes.filter((rd) => rd.isHeld).length;
    const maxHold = this.gameState.getMaxHoldCount();

    this.holdCountDisplay.textContent = `Holding: ${heldCount}/${maxHold}`;

    // Change color based on limit
    if (heldCount >= maxHold) {
      this.holdCountDisplay.style.color = '#ff6b6b'; // Red when at limit
    } else {
      this.holdCountDisplay.style.color = 'white';
    }
  }

  private updateHoldButtonState(): void {
    if (!this.holdButton) return;

    const pullsRemaining = this.gameState.getPullsRemaining();
    if (pullsRemaining <= 0 && !this.holdModeActive) {
      // Disable button when no pulls remain
      this.holdButton.style.opacity = '0.5';
      this.holdButton.style.cursor = 'not-allowed';
      this.holdButton.title = 'No pulls remaining';
    } else {
      this.holdButton.style.opacity = '1';
      this.holdButton.style.cursor = 'pointer';
      this.holdButton.title = '';
    }
  }

  private toggleHoldMode(): void {
    if (!this.holdModeActive) {
      // Check if pulls are available
      if (this.gameState.getPullsRemaining() <= 0) {
        console.log('Game: No pulls remaining - cannot use Hold & Discard');
        return;
      }

      // Enter hold mode
      this.holdModeActive = true;
      this.holdButton!.textContent = 'Confirm Discard';
      this.holdButton!.style.backgroundColor = '#4ecdc4';
      this.holdCountDisplay!.style.display = 'block';
      this.updateHoldCountDisplay();
      this.scene.deselectDomino();
      console.log('Game: Hold mode activated - click tiles to hold them');
    } else {
      // Confirm and execute discard
      this.executeHoldAndDiscard();
    }
  }

  private executeHoldAndDiscard(): void {
    const heldTiles = this.rackDominoes
      .filter((rd) => rd.isHeld)
      .map((rd) => rd.data);

    const unheldCount = this.rackDominoes.length - heldTiles.length;

    if (heldTiles.length === 0) {
      console.log('Game: No tiles held, discarding entire rack');
    } else {
      console.log(
        `Game: Holding ${heldTiles.length} tiles, discarding ${unheldCount}`
      );
    }

    // If nothing to discard, just exit hold mode
    if (unheldCount === 0) {
      console.log('Game: All tiles held, nothing to discard');
      this.rackDominoes.forEach((rd) => {
        rd.isHeld = false;
        rd.domino.setPosition(
          rd.domino.getMesh().position.x,
          RACK_Y_POSITION,
          RACK_Z_POSITION
        );
      });
      this.holdModeActive = false;
      this.holdButton!.textContent = 'Hold & Discard';
      this.holdButton!.style.backgroundColor = '#ff6b6b';
      this.holdCountDisplay!.style.display = 'none';
      this.scene.deselectDomino();
      return;
    }

    // Discard unheld tiles from game state
    const discarded = this.gameState.discardUnheldTiles(heldTiles);

    // Remove unheld visual dominoes
    const tilesToRemove = this.rackDominoes.filter((rd) => !rd.isHeld);
    tilesToRemove.forEach((rd) => {
      this.scene.remove(rd.mesh);
      rd.domino.dispose();
    });

    // Keep only held tiles
    this.rackDominoes = this.rackDominoes.filter((rd) => rd.isHeld);

    // Reset held status and lower tiles back down
    this.rackDominoes.forEach((rd) => {
      rd.isHeld = false;
      rd.domino.setPosition(
        rd.domino.getMesh().position.x,
        RACK_Y_POSITION,
        RACK_Z_POSITION
      );
    });

    this.scene.rackDominoes = this.rackDominoes;
    this.repositionRack();

    // Exit hold mode and reset button
    this.holdModeActive = false;
    this.holdButton!.textContent = 'Hold & Discard';
    this.holdButton!.style.backgroundColor = '#ff6b6b';
    this.holdCountDisplay!.style.display = 'none';
    this.scene.deselectDomino();

    console.log(
      `Game: Discarded ${discarded} tiles. ${this.rackDominoes.length} tiles remain in rack.`
    );

    // Draw new tiles to fill rack up to limit
    this.pullTilesToRack();

    // Update button state after pull
    this.updateHoldButtonState();
  }

  private pullTilesToRack(): void {
    const rackLimit = this.gameState.getRackLimit();
    const currentRackSize = this.rackDominoes.length;
    const tilesToDraw = rackLimit - currentRackSize;

    if (tilesToDraw <= 0) {
      console.log('Game: Rack is already full');
      return;
    }

    const bonePileSize = this.gameState.getBonePileSize();
    const actualDraw = Math.min(tilesToDraw, bonePileSize);

    console.log(
      `Game: Drawing ${actualDraw} tiles to fill rack (${currentRackSize} -> ${currentRackSize + actualDraw})`
    );

    // Deal tiles from bone pile (even if 0)
    const newTiles = this.board.dealTilesToRack(actualDraw);

    // Create visual dominoes for new tiles
    newTiles.forEach((dominoData) => {
      const domino = new Domino(
        dominoData.left,
        dominoData.right,
        dominoData.type
      );

      const rackDomino: RackDomino = {
        domino,
        mesh: domino.getMesh(),
        data: dominoData,
        isHeld: false,
      };

      this.rackDominoes.push(rackDomino);
      this.scene.add(domino.getMesh());
    });

    this.scene.rackDominoes = this.rackDominoes;
    this.repositionRack();

    // Always decrement pulls remaining (even if bone pile was empty)
    this.board.completePull();

    console.log(
      `Game: Rack now has ${this.rackDominoes.length} tiles. Bone pile: ${this.gameState.getBonePileSize()}, Pulls remaining: ${this.gameState.getPullsRemaining()}`
    );
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

    if (this.holdModeActive) {
      // In hold mode, toggle the held status
      this.toggleDominoHeld(dominoData);
      this.scene.deselectDomino();
    } else {
      this.updatePlacementZones(dominoData);
    }
  }

  private toggleDominoHeld(dominoData: DominoData): void {
    const rackDomino = this.rackDominoes.find(
      (rd) =>
        rd.data.left === dominoData.left &&
        rd.data.right === dominoData.right &&
        rd.data.type === dominoData.type
    );

    if (!rackDomino) return;

    const currentHeldCount = this.rackDominoes.filter((rd) => rd.isHeld).length;
    const maxHoldCount = this.gameState.getMaxHoldCount();

    // If trying to hold and already at max, don't allow
    if (!rackDomino.isHeld && currentHeldCount >= maxHoldCount) {
      console.log(`Game: Cannot hold more than ${maxHoldCount} tiles`);
      return;
    }

    rackDomino.isHeld = !rackDomino.isHeld;

    // Raise or lower the tile visually
    const yPos = rackDomino.isHeld
      ? RACK_Y_POSITION + RACK_HELD_Y_OFFSET
      : RACK_Y_POSITION;

    rackDomino.domino.setPosition(
      rackDomino.mesh.position.x,
      yPos,
      RACK_Z_POSITION
    );

    console.log(
      `Game: Tile ${rackDomino.isHeld ? 'held' : 'released'}:`,
      dominoData
    );

    // Update the hold count display
    this.updateHoldCountDisplay();
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

  testIncreaseMaxHold(amount: number = 1): void {
    this.gameState.increaseMaxHoldCount(amount);
    console.log('Max hold count:', this.gameState.getMaxHoldCount());
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
