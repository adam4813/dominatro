import { Domino } from './Domino.js';

export class Board {
  constructor(scene, gameState) {
    this.scene = scene;
    this.gameState = gameState;
    this.chain = []; // Array of placed dominoes with their pip values
    this.chainDominoes = []; // Array of Domino objects for rendering
    this.openEnds = { left: null, right: null };

    // Visual spacing for board chain
    this.dominoSpacing = 2.2; // Space between dominoes in the chain
    this.boardYPosition = 0.1; // Height of dominoes on board
    this.boardZPosition = -3; // Position board chain towards back

    console.log('Board: Initialized empty board');
  }

  /**
   * Check if a domino can be legally placed on the specified side
   * @param {Object} dominoData - Object with left and right properties
   * @param {string} side - 'left' or 'right'
   * @returns {boolean} - True if placement is valid
   */
  isValidPlacement(dominoData, side) {
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
    if (!this.isValidPlacement(dominoData, side)) {
      console.log('Board: Invalid placement attempt');
      return false;
    }

    // Determine the correct orientation for the domino
    let left = dominoData.left;
    let right = dominoData.right;

    if (this.chain.length === 0) {
      // First domino - add to chain and set open ends
      console.log('Board: Placing first domino');
      this.chain.push({ left, right });
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
        // Rollback the chain modification
        if (this.chain.length === 1) {
          this.chain = [];
          this.openEnds = { left: null, right: null };
        } else if (side === 'left') {
          this.chain.shift();
          this.openEnds.left = this.chain[0].left;
        } else {
          this.chain.pop();
          this.openEnds.right = this.chain[this.chain.length - 1].right;
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
   * Render the entire domino chain on the board
   */
  renderChain() {
    // Clear existing rendered dominoes
    this.chainDominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
      domino.dispose();
    });
    this.chainDominoes = [];

    // Render each domino in the chain
    const totalWidth = (this.chain.length - 1) * this.dominoSpacing;
    const startX = -totalWidth / 2;

    this.chain.forEach((dominoData, index) => {
      const domino = new Domino(dominoData.left, dominoData.right);
      const x = startX + index * this.dominoSpacing;
      domino.setPosition(x, this.boardYPosition, this.boardZPosition);
      this.chainDominoes.push(domino);
      this.scene.add(domino.getMesh());
    });
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

  clear() {
    this.chainDominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
      domino.dispose();
    });
    this.chainDominoes = [];
    this.chain = [];
    this.openEnds = { left: null, right: null };
  }
}
