import * as THREE from 'three';
import { Domino } from './Domino';
import { HUD } from './HUD';
import type { Scene } from './Scene';
import type { GameState } from './GameState';
import type { DominoData, OpenEnds, PlacementSide } from '../types';

/**
 * Manages the game board, domino chain, and board-related game logic
 * Implements the Mediator pattern between visual dominoes and game state
 */
export class Board {
  // Constants for domino dimensions and spacing
  private static readonly DOUBLE_HALF_WIDTH = 0.5;
  private static readonly REGULAR_HALF_WIDTH = 1.1;
  private static readonly DOMINO_GAP = 0.1;

  private scene: Scene;
  readonly gameState: GameState;
  chain: DominoData[] = [];
  private chainDominoes: Domino[] = [];
  private openEnds: OpenEnds = { left: null, right: null };
  private rootIndex: number = -1;
  private rootOutline: THREE.Mesh | null = null;

  // Visual spacing
  private dominoSpacing: number = 2.2;
  private boardYPosition: number = 0.1;
  readonly boardZPosition: number = -3;

  private hud: HUD;

  constructor(scene: Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;

    this.hud = new HUD(this.gameState);
    this.scene.setHUD(this.hud.getHUDScene(), this.hud.getHUDCamera());

    console.log('Board: Initialized empty board');
  }

  /**
   * Check if a domino can be legally placed on the specified side
   */
  isValidPlacement(dominoData: DominoData, side: PlacementSide): boolean {
    const validSides: PlacementSide[] = ['left', 'right'];
    if (!validSides.includes(side)) {
      console.error(
        `Board: Invalid side parameter "${side}". Must be one of: ${validSides.join(', ')}`
      );
      return false;
    }

    if (this.chain.length === 0) {
      console.log('Board: First domino - placement is valid');
      return true;
    }

    const openEnd = side === 'left' ? this.openEnds.left : this.openEnds.right;
    const isWild = dominoData.type === 'wild';

    // Wild tiles match any value
    const matches =
      isWild || dominoData.left === openEnd || dominoData.right === openEnd;

    console.log(
      `Board: Checking placement on ${side} side. Open end: ${openEnd}, Domino: [${dominoData.left}|${dominoData.right}] (${dominoData.type}), Valid: ${matches}`
    );

    return matches;
  }

  /**
   * Place a domino on the board chain
   */
  placeDomino(dominoData: DominoData, side: PlacementSide): boolean {
    const validSides: PlacementSide[] = ['left', 'right'];
    if (!validSides.includes(side)) {
      console.error(
        `Board: Invalid side parameter "${side}". Must be one of: ${validSides.join(', ')}`
      );
      return false;
    }

    if (!this.isValidPlacement(dominoData, side)) {
      console.log('Board: Invalid placement attempt');
      return false;
    }

    const previousOpenEnds = { ...this.openEnds };
    const previousChainLength = this.chain.length;
    const previousRootIndex = this.rootIndex;

    let left = dominoData.left;
    let right = dominoData.right;

    if (this.chain.length === 0) {
      console.log('Board: Placing first domino');
      this.chain.push({ left, right, type: dominoData.type });
      this.rootIndex = 0;
      this.openEnds.left = left;
      this.openEnds.right = right;
    } else if (side === 'left') {
      if (left === this.openEnds.left) {
        [left, right] = [right, left];
      }
      this.chain.unshift({ left, right, type: dominoData.type });
      this.rootIndex++;
      this.openEnds.left = left;
    } else {
      if (right === this.openEnds.right) {
        [left, right] = [right, left];
      }
      this.chain.push({ left, right, type: dominoData.type });
      this.openEnds.right = right;
    }

    const removed = this.gameState.removeDominoFromRack(dominoData);
    if (!removed) {
      console.error(
        'Board: Failed to remove domino from rack. Aborting placement.'
      );
      this.openEnds = previousOpenEnds;
      this.rootIndex = previousRootIndex;
      if (previousChainLength === 0) {
        this.chain = [];
      } else if (side === 'left') {
        this.chain.shift();
      } else {
        this.chain.pop();
      }
      return false;
    }

    this.renderChain();

    console.log('Board: Domino placed successfully');
    console.log('Board: Current chain:', this.chain);
    console.log('Board: Open ends:', this.openEnds);

    return true;
  }

  getOpenEnds(): OpenEnds {
    return { ...this.openEnds };
  }

  private calculateChainPositions(): number[] {
    if (this.chain.length === 0) return [];

    const positions: number[] = [];
    positions[this.rootIndex] = 0;

    let currentX = 0;
    for (let i = this.rootIndex + 1; i < this.chain.length; i++) {
      const prevDomino = this.chain[i - 1]!;
      const currDomino = this.chain[i]!;
      const prevIsDouble = prevDomino.left === prevDomino.right;
      const currIsDouble = currDomino.left === currDomino.right;
      const prevHalfWidth = prevIsDouble
        ? Board.DOUBLE_HALF_WIDTH
        : Board.REGULAR_HALF_WIDTH;
      const currHalfWidth = currIsDouble
        ? Board.DOUBLE_HALF_WIDTH
        : Board.REGULAR_HALF_WIDTH;
      currentX += prevHalfWidth + currHalfWidth + Board.DOMINO_GAP;
      positions[i] = currentX;
    }

    currentX = 0;
    for (let i = this.rootIndex - 1; i >= 0; i--) {
      const prevDomino = this.chain[i + 1]!;
      const currDomino = this.chain[i]!;
      const prevIsDouble = prevDomino.left === prevDomino.right;
      const currIsDouble = currDomino.left === currDomino.right;
      const prevHalfWidth = prevIsDouble
        ? Board.DOUBLE_HALF_WIDTH
        : Board.REGULAR_HALF_WIDTH;
      const currHalfWidth = currIsDouble
        ? Board.DOUBLE_HALF_WIDTH
        : Board.REGULAR_HALF_WIDTH;
      currentX -= prevHalfWidth + currHalfWidth + Board.DOMINO_GAP;
      positions[i] = currentX;
    }

    return positions;
  }

  getPlacementOrientation(
    dominoData: DominoData,
    side: PlacementSide
  ): DominoData {
    let left = dominoData.left;
    let right = dominoData.right;

    if (this.chain.length === 0) {
      return { left, right, type: dominoData.type };
    }

    if (side === 'left') {
      if (left === this.openEnds.left) {
        [left, right] = [right, left];
      }
      return { left, right, type: dominoData.type };
    } else {
      if (right === this.openEnds.right) {
        [left, right] = [right, left];
      }
      return { left, right, type: dominoData.type };
    }
  }

  getPlacementPositions(): { leftX: number; rightX: number } {
    if (this.chain.length === 0) {
      return { leftX: 0, rightX: 0 };
    }

    const positions = this.calculateChainPositions();

    const leftmostPos = positions[0]!;
    const rightmostPos = positions[this.chain.length - 1]!;
    const leftmostDomino = this.chain[0]!;
    const rightmostDomino = this.chain[this.chain.length - 1]!;
    const leftIsDouble = leftmostDomino.left === leftmostDomino.right;
    const rightIsDouble = rightmostDomino.left === rightmostDomino.right;

    const leftHalfWidth = leftIsDouble
      ? Board.DOUBLE_HALF_WIDTH
      : Board.REGULAR_HALF_WIDTH;
    const rightHalfWidth = rightIsDouble
      ? Board.DOUBLE_HALF_WIDTH
      : Board.REGULAR_HALF_WIDTH;

    return {
      leftX: leftmostPos - leftHalfWidth - 1.4,
      rightX: rightmostPos + rightHalfWidth + 1.4,
    };
  }

  private renderChain(): void {
    this.chainDominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
      domino.dispose();
    });
    this.chainDominoes = [];

    if (this.chain.length === 0) return;

    const positions = this.calculateChainPositions();

    this.chain.forEach((dominoData, index) => {
      const domino = new Domino(
        dominoData.left,
        dominoData.right,
        dominoData.type
      );
      const x = positions[index]!;
      const isDouble = dominoData.left === dominoData.right;

      domino.setPosition(x, this.boardYPosition, this.boardZPosition);
      if (!isDouble) {
        domino.setRotation(0, Math.PI / 2, 0);
      }
      this.chainDominoes.push(domino);
      this.scene.add(domino.getMesh());
    });

    this.addRootOutline();
    this.updateCameraPanLimits();
  }

  private updateCameraPanLimits(): void {
    if (this.chain.length === 0) {
      this.scene.updatePanLimits(-10, 10);
      return;
    }

    const positions = this.calculateChainPositions();

    const leftmostPos = positions[0]!;
    const rightmostPos = positions[this.chain.length - 1]!;
    const leftmostDomino = this.chain[0]!;
    const rightmostDomino = this.chain[this.chain.length - 1]!;
    const leftIsDouble = leftmostDomino.left === leftmostDomino.right;
    const rightIsDouble = rightmostDomino.left === rightmostDomino.right;
    const leftHalfWidth = leftIsDouble
      ? Board.DOUBLE_HALF_WIDTH
      : Board.REGULAR_HALF_WIDTH;
    const rightHalfWidth = rightIsDouble
      ? Board.DOUBLE_HALF_WIDTH
      : Board.REGULAR_HALF_WIDTH;

    const minX = leftmostPos - leftHalfWidth;
    const maxX = rightmostPos + rightHalfWidth;

    this.scene.updatePanLimits(minX, maxX);
    this.scene.updateGroundSize(minX, maxX);
  }

  private addRootOutline(): void {
    if (this.rootOutline) {
      this.scene.remove(this.rootOutline);
      this.rootOutline.geometry.dispose();
      (this.rootOutline.material as THREE.Material).dispose();
      this.rootOutline = null;
    }

    if (this.chain.length === 0 || this.rootIndex < 0) return;

    const rootDominoData = this.chain[this.rootIndex]!;
    const isDouble = rootDominoData.left === rootDominoData.right;

    const outlineGeometry = isDouble
      ? new THREE.BoxGeometry(1.3, 0.05, 2.3)
      : new THREE.BoxGeometry(2.3, 0.05, 1.3);

    const outlineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
      roughness: 0.5,
      metalness: 0.1,
    });

    this.rootOutline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    this.rootOutline.position.set(
      0,
      this.boardYPosition - 0.1,
      this.boardZPosition
    );
    this.scene.add(this.rootOutline);
  }

  addDomino(
    leftPips: number,
    rightPips: number,
    x: number,
    y: number,
    z: number
  ): Domino {
    const domino = new Domino(leftPips, rightPips);
    domino.setPosition(x, y, z);
    this.scene.add(domino.getMesh());
    return domino;
  }

  removeDomino(domino: Domino): void {
    const index = this.chainDominoes.indexOf(domino);
    if (index > -1) {
      this.chainDominoes.splice(index, 1);
      this.scene.remove(domino.getMesh());
      domino.dispose();
    }
  }

  getDominoes(): Domino[] {
    return this.chainDominoes;
  }

  getHUD(): HUD {
    return this.hud;
  }

  addScore(points: number): void {
    this.gameState.addScore(points);
    this.hud.updateScore();
  }

  dealTilesToRack(count: number): DominoData[] {
    if (
      typeof count !== 'number' ||
      !Number.isFinite(count) ||
      count < 0 ||
      !Number.isInteger(count)
    ) {
      throw new Error('Count must be a non-negative integer');
    }
    const dealtTiles = this.gameState.dealToRack(count);
    this.hud.updateBonePile();
    this.hud.updateRack();
    return dealtTiles;
  }

  playTile(rackIndex: number): DominoData | null {
    const tile = this.gameState.playTileFromRack(rackIndex);
    if (tile) {
      this.hud.updateRack();
    }
    return tile;
  }

  completePull(): void {
    this.gameState.decrementPulls();
    this.hud.updateProgression();
  }

  clear(): void {
    this.chainDominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
      domino.dispose();
    });
    this.chainDominoes = [];
    this.chain = [];
    this.rootIndex = -1;
    this.openEnds = { left: null, right: null };

    if (this.rootOutline) {
      this.scene.remove(this.rootOutline);
      this.rootOutline.geometry.dispose();
      (this.rootOutline.material as THREE.Material).dispose();
      this.rootOutline = null;
    }
  }

  destroy(): void {
    this.clear();
    this.hud.destroy();
    this.scene.setHUD(null, null);
  }
}
