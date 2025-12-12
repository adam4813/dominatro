export class GameState {
  constructor() {
    this.bonePile = [];
    this.playerRack = [];
    this.board = [];
    this.score = 0;
    this.pullsRemaining = 5;
    this.targetScore = 100;

    this.initializeBonePile();
  }

  /**
   * Initialize a complete set of double-six dominoes (0-0 through 6-6)
   * Total of 28 unique tiles
   */
  initializeBonePile() {
    this.bonePile = [];

    // Generate all unique combinations of double-six dominoes
    for (let left = 0; left <= 6; left++) {
      for (let right = left; right <= 6; right++) {
        this.bonePile.push({
          left: left,
          right: right,
          type: 'standard',
        });
      }
    }
  }

  /**
   * Shuffle the bone pile using Fisher-Yates algorithm
   */
  shuffle() {
    for (let i = this.bonePile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bonePile[i], this.bonePile[j]] = [
        this.bonePile[j],
        this.bonePile[i],
      ];
    }
  }

  /**
   * Deal tiles from the bone pile to the player's rack
   * @param {number} count - Number of tiles to deal
   * @returns {Array} - Array of dealt tiles
   */
  dealToRack(count) {
    const dealtTiles = [];

    for (let i = 0; i < count && this.bonePile.length > 0; i++) {
      const tile = this.bonePile.pop();
      this.playerRack.push(tile);
      dealtTiles.push(tile);
    }

    return dealtTiles;
  }

  /**
   * Remove a domino from the player's rack
   * @param {Object} domino - The domino object to remove
   * @returns {boolean} - True if domino was found and removed
   */
  removeDominoFromRack(domino) {
    const index = this.playerRack.indexOf(domino);
    if (index > -1) {
      this.playerRack.splice(index, 1);
      console.log(
        'GameState: Removed domino from rack. Remaining:',
        this.playerRack.length
      );
      return true;
    }
    return false;
  }

  /**
   * Reset the game state to initial conditions
   * Note: This does not shuffle the bone pile. Call shuffle() separately if needed.
   */
  reset() {
    this.playerRack = [];
    this.board = [];
    this.score = 0;
    this.pullsRemaining = 5;
    this.initializeBonePile();
  }

  // Getters
  getBonePile() {
    return this.bonePile;
  }

  getPlayerRack() {
    return this.playerRack;
  }

  getBoard() {
    return this.board;
  }

  getScore() {
    return this.score;
  }

  getPullsRemaining() {
    return this.pullsRemaining;
  }

  getTargetScore() {
    return this.targetScore;
  }

  getBonePileSize() {
    return this.bonePile.length;
  }

  getPlayerRackSize() {
    return this.playerRack.length;
  }
}
