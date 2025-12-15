import { Domino } from './Domino.js';
import * as THREE from 'three';
import { HUD } from './HUD.js';

export class Board {
  // Constants for domino dimensions and spacing
  static DOUBLE_HALF_WIDTH = 0.5;
  static REGULAR_HALF_WIDTH = 1.1;
  static DOMINO_GAP = 0.1;

  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.chain = []; // Array of placed dominoes with their pip values
    this.chainDominoes = []; // Array of Domino objects for rendering
    this.openEnds = { left: null, right: null };
    this.rootIndex = -1; // Index of the first placed domino (stays fixed at x=0)
    this.rootOutline = null; // Visual indicator for root domino

    // Visual spacing for board chain
    this.dominoSpacing = 2.2; // Space between dominoes in the chain
    this.boardYPosition = 0.1; // Height of dominoes on board
    this.boardZPosition = -3; // Position board chain towards back

    this.hud = new HUD(this.gameState);

    // Register HUD with scene for rendering
    this.scene.setHUD(this.hud.getHUDScene(), this.hud.getHUDCamera());

    console.log('Board: Initialized empty board');
  }

  /**
   * Check if a domino can be legally placed on the specified side
   * @param {Object} dominoData - Object with left and right properties
   * @param {string} side - 'left' or 'right'
   * @returns {boolean} - True if placement is valid
   */
  isValidPlacement(dominoData, side) {
    // Validate side parameter
    const validSides = ['left', 'right'];
    if (!validSides.includes(side)) {
      console.error(
        `Board: Invalid side parameter "${side}". Must be one of: ${validSides.join(', ')}`
      );
      return false;
    }

    // If board is empty, any domino can be placed
    if (this.chain.length === 0) {
      console.log('Board: First domino - placement is valid');
      return true;
    }

    const openEnd = side === 'left' ? this.openEnds.left : this.openEnds.right;

    // Check if domino matches the open end (considering it can be flipped)
    const matches = dominoData.left === openEnd || dominoData.right === openEnd;

    console.log(
      `Board: Checking placement on ${side} side. Open end: ${openEnd}, Domino: [${dominoData.left}|${dominoData.right}], Valid: ${matches}`
    );

    return matches;
  }

  /**
   * Place a domino on the board chain
   * @param {Object} dominoData - Object with left and right properties
   * @param {string} side - 'left' or 'right'
   * @returns {boolean} - True if placement succeeded
   */
  placeDomino(dominoData, side) {
    // Validate side parameter
    const validSides = ['left', 'right'];
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

    // Save previous state for potential rollback
    const previousOpenEnds = { ...this.openEnds };
    const previousChainLength = this.chain.length;
    const previousRootIndex = this.rootIndex;

    // Determine the correct orientation for the domino
    let left = dominoData.left;
    let right = dominoData.right;

    if (this.chain.length === 0) {
      // First domino - add to chain and set open ends
      console.log('Board: Placing first domino');
      this.chain.push({ left, right });
      this.rootIndex = 0; // First domino is at index 0
      this.openEnds.left = left;
      this.openEnds.right = right;
    } else if (side === 'left') {
      // Placing on left - need to match with current left end
      // The right pip of the new domino should match the current left end
      // The left pip of the new domino becomes the new left end
      // Note: For double dominoes (e.g., [3|3]), flipping doesn't change anything, which is correct
      if (left === this.openEnds.left) {
        // left matches, so flip the domino
        [left, right] = [right, left];
      }
      // Now right should match openEnds.left
      this.chain.unshift({ left, right });
      this.rootIndex++; // Root index shifts right when we add to the left
      this.openEnds.left = left; // The left pip of the placed domino is the new open end
    } else {
      // Placing on right - need to match with current right end
      // The left pip of the new domino should match the current right end
      // The right pip of the new domino becomes the new right end
      // Note: For double dominoes (e.g., [3|3]), flipping doesn't change anything, which is correct
      if (right === this.openEnds.right) {
        // right matches, so flip the domino
        [left, right] = [right, left];
      }
      // Now left should match openEnds.right
      this.chain.push({ left, right });
      // rootIndex stays the same when adding to the right
      this.openEnds.right = right; // The right pip of the placed domino is the new open end
    }

    // Remove from rack if gameState is available
    // Note: This removes from the data model (GameState.playerRack)
    // Visual rack cleanup is handled separately in main.js
    if (this.gameState) {
      const removed = this.gameState.removeDominoFromRack(dominoData);
      if (!removed) {
        console.error(
          'Board: Failed to remove domino from rack. Aborting placement.'
        );
        // Rollback using saved state
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
    }

    // Re-render the entire board chain
    this.renderChain();

    console.log('Board: Domino placed successfully');
    console.log('Board: Current chain:', this.chain);
    console.log('Board: Open ends:', this.openEnds);

    return true;
  }

  /**
   * Get the current open ends of the board chain
   * @returns {Object} - { left: number, right: number }
   */
  getOpenEnds() {
    return { ...this.openEnds };
  }

  /**
   * Calculate positions for all dominoes in the chain relative to root at x=0
   * @returns {Array<number>} - Array of x positions for each domino in chain
   */
  calculateChainPositions() {
    if (this.chain.length === 0) return [];

    const positions = [];
    positions[this.rootIndex] = 0;

    // Calculate positions to the right of root
    let currentX = 0;
    for (let i = this.rootIndex + 1; i < this.chain.length; i++) {
      const prevDomino = this.chain[i - 1];
      const currDomino = this.chain[i];
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

    // Calculate positions to the left of root
    currentX = 0;
    for (let i = this.rootIndex - 1; i >= 0; i--) {
      const prevDomino = this.chain[i + 1];
      const currDomino = this.chain[i];
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

  /**
   * Get the orientation a domino would need to be placed
   * @param {Object} dominoData - Object with left and right properties
   * @param {string} side - 'left' or 'right'
   * @returns {Object} - { left: number, right: number } - The oriented domino
   */
  getPlacementOrientation(dominoData, side) {
    let left = dominoData.left;
    let right = dominoData.right;

    if (this.chain.length === 0) {
      // First domino - orientation doesn't matter
      return { left, right };
    }

    if (side === 'left') {
      // Placing on left - right pip should match the current left end
      if (left === this.openEnds.left) {
        // Need to flip
        [left, right] = [right, left];
      }
      return { left, right };
    } else {
      // Placing on right - left pip should match the current right end
      if (right === this.openEnds.right) {
        // Need to flip
        [left, right] = [right, left];
      }
      return { left, right };
    }
  }

  /**
   * Get the X positions for placement zones based on current chain
   * @returns {Object} - { leftX: number, rightX: number }
   */
  getPlacementPositions() {
    if (this.chain.length === 0) {
      return { leftX: 0, rightX: 0 };
    }

    // Use the shared position calculation
    const positions = this.calculateChainPositions();

    // Get the leftmost and rightmost domino positions
    const leftmostPos = positions[0];
    const rightmostPos = positions[this.chain.length - 1];
    const leftmostDomino = this.chain[0];
    const rightmostDomino = this.chain[this.chain.length - 1];
    const leftIsDouble = leftmostDomino.left === leftmostDomino.right;
    const rightIsDouble = rightmostDomino.left === rightmostDomino.right;

    // Calculate zone positions (outside the chain)
    const leftHalfWidth = leftIsDouble
      ? Board.DOUBLE_HALF_WIDTH
      : Board.REGULAR_HALF_WIDTH;
    const rightHalfWidth = rightIsDouble
      ? Board.DOUBLE_HALF_WIDTH
      : Board.REGULAR_HALF_WIDTH;

    return {
      leftX: leftmostPos - leftHalfWidth - 1.4, // 1.4 = zone half-width + gap
      rightX: rightmostPos + rightHalfWidth + 1.4,
    };
  }

  /**
   * Render the entire domino chain on the board
   * The first domino placed stays at a fixed position (x=0).
   * Dominoes added to the left go in negative X direction.
   * Dominoes added to the right go in positive X direction.
   * Doubles are displayed perpendicular (vertical) in the chain.
   */
  renderChain() {
    // Clear existing rendered dominoes
    this.chainDominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
      domino.dispose();
    });
    this.chainDominoes = [];

    if (this.chain.length === 0) return;

    // Use the shared position calculation
    const positions = this.calculateChainPositions();

    // Render each domino
    this.chain.forEach((dominoData, index) => {
      const domino = new Domino(dominoData.left, dominoData.right);
      const x = positions[index];
      const isDouble = dominoData.left === dominoData.right;

      domino.setPosition(x, this.boardYPosition, this.boardZPosition);
      // Doubles stay vertical (no rotation), non-doubles rotate 90 degrees horizontal
      if (!isDouble) {
        domino.setRotation(0, Math.PI / 2, 0);
      }
      this.chainDominoes.push(domino);
      this.scene.add(domino.getMesh());
    });

    // Add outline to root domino
    this.addRootOutline();

    // Update camera pan limits based on board width
    this.updateCameraPanLimits();
  }

  /**
   * Update camera pan limits to match the board's current width
   */
  updateCameraPanLimits() {
    if (this.chain.length === 0) {
      // No dominoes, use default limits
      if (this.scene.updatePanLimits) {
        this.scene.updatePanLimits(-10, 10);
      }
      return;
    }

    // Use the shared position calculation
    const positions = this.calculateChainPositions();

    // Get min and max X positions
    const leftmostPos = positions[0];
    const rightmostPos = positions[this.chain.length - 1];
    const leftmostDomino = this.chain[0];
    const rightmostDomino = this.chain[this.chain.length - 1];
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

    // Update scene's pan limits and ground size
    if (this.scene.updatePanLimits) {
      this.scene.updatePanLimits(minX, maxX);
    }
    if (this.scene.updateGroundSize) {
      this.scene.updateGroundSize(minX, maxX);
    }
  }

  /**
   * Add a visual outline around the root domino
   */
  addRootOutline() {
    // Remove existing outline if any
    if (this.rootOutline) {
      this.scene.remove(this.rootOutline);
      this.rootOutline.geometry.dispose();
      this.rootOutline.material.dispose();
      this.rootOutline = null;
    }

    if (this.chain.length === 0 || this.rootIndex < 0) return;

    const rootDominoData = this.chain[this.rootIndex];
    const isDouble = rootDominoData.left === rootDominoData.right;

    // Create a solid box underneath the domino, slightly wider
    // Domino dimensions: width=1, height=2, depth=0.2
    // When rotated: horizontal dominoes are 2 wide, 1 deep
    const outlineGeometry = isDouble
      ? new THREE.BoxGeometry(1.3, 0.05, 2.3) // Vertical double
      : new THREE.BoxGeometry(2.3, 0.05, 1.3); // Horizontal domino

    const outlineMaterial = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xffaa00,
      emissiveIntensity: 0.5,
      roughness: 0.5,
      metalness: 0.1,
    });

    this.rootOutline = new THREE.Mesh(outlineGeometry, outlineMaterial);
    // Position it just below the domino
    this.rootOutline.position.set(
      0,
      this.boardYPosition - 0.1,
      this.boardZPosition
    );
    this.scene.add(this.rootOutline);
  }

  /**
   * Add a domino to the scene at a specific position (for rack, etc.)
   */
  addDomino(leftPips, rightPips, x, y, z) {
    const domino = new Domino(leftPips, rightPips);
    domino.setPosition(x, y, z);
    this.scene.add(domino.getMesh());
    return domino;
  }

  removeDomino(domino) {
    const index = this.chainDominoes.indexOf(domino);
    if (index > -1) {
      this.chainDominoes.splice(index, 1);
      this.scene.remove(domino.getMesh());
      domino.dispose();
    }
  }

  getDominoes() {
    return this.chainDominoes;
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
    this.chainDominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
      domino.dispose();
    });
    this.chainDominoes = [];
    this.chain = [];
    this.rootIndex = -1;
    this.openEnds = { left: null, right: null };

    // Remove root outline
    if (this.rootOutline) {
      this.scene.remove(this.rootOutline);
      this.rootOutline.geometry.dispose();
      this.rootOutline.material.dispose();
      this.rootOutline = null;
    }
  }

  destroy() {
    this.clear();
    if (this.hud) {
      this.hud.destroy();
      this.hud = null;
      // Clear HUD references from the scene to prevent memory leaks
      this.scene.setHUD(null, null);
    }
  }
}
