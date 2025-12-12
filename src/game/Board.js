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
   * @param {Object} dominoData - Object with leftPips and rightPips
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
    const matches =
      dominoData.leftPips === openEnd || dominoData.rightPips === openEnd;

    console.log(
      `Board: Checking placement on ${side} side. Open end: ${openEnd}, Domino: [${dominoData.leftPips}|${dominoData.rightPips}], Valid: ${matches}`
    );

    return matches;
  }

  /**
   * Place a domino on the board chain
   * @param {Object} dominoData - Object with leftPips and rightPips
   * @param {string} side - 'left' or 'right'
   * @returns {boolean} - True if placement succeeded
   */
  placeDomino(dominoData, side) {
    if (!this.isValidPlacement(dominoData, side)) {
      console.log('Board: Invalid placement attempt');
      return false;
    }

    // Determine the correct orientation for the domino
    let leftPips = dominoData.leftPips;
    let rightPips = dominoData.rightPips;

    if (this.chain.length === 0) {
      // First domino - add to chain and set open ends
      console.log('Board: Placing first domino');
      this.chain.push({ leftPips, rightPips });
      this.openEnds.left = leftPips;
      this.openEnds.right = rightPips;
    } else if (side === 'left') {
      // Placing on left - need to match with current left end
      // If rightPips matches the open end, flip the domino
      if (rightPips === this.openEnds.left) {
        [leftPips, rightPips] = [rightPips, leftPips];
      }
      this.chain.unshift({ leftPips, rightPips });
      this.openEnds.left = leftPips;
    } else {
      // Placing on right - need to match with current right end
      // If leftPips matches the open end, flip the domino
      if (leftPips === this.openEnds.right) {
        [leftPips, rightPips] = [rightPips, leftPips];
      }
      this.chain.push({ leftPips, rightPips });
      this.openEnds.right = rightPips;
    }

    // Remove from rack if gameState is available
    if (this.gameState) {
      this.gameState.removeDominoFromRack(dominoData);
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
      const domino = new Domino(dominoData.leftPips, dominoData.rightPips);
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
