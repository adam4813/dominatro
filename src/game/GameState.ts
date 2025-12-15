import type { DominoData } from '../types';

/**
 * Manages the game state including bone pile, player rack, and scoring
 * Acts as a single source of truth for game data (Singleton-like usage)
 */
export class GameState {
  private bonePile: DominoData[] = [];
  private playerRack: DominoData[] = [];
  private board: DominoData[] = [];
  private score: number = 0;
  private totalPulls: number = 5;
  private pullsRemaining: number = 5;
  private targetScore: number = 100;

  constructor() {
    this.initializeBonePile();
  }

  /**
   * Initialize a complete set of double-six dominoes (0-0 through 6-6)
   * Total of 28 unique tiles
   */
  private initializeBonePile(): void {
    this.bonePile = [];

    // Generate all unique combinations of double-six dominoes
    for (let left = 0; left <= 6; left++) {
      for (let right = left; right <= 6; right++) {
        this.bonePile.push({
          left,
          right,
          type: 'standard',
        });
      }
    }
  }

  /**
   * Shuffle the bone pile using Fisher-Yates algorithm
   */
  shuffle(): void {
    for (let i = this.bonePile.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bonePile[i], this.bonePile[j]] = [
        this.bonePile[j]!,
        this.bonePile[i]!,
      ];
    }
  }

  /**
   * Deal tiles from the bone pile to the player's rack
   */
  dealToRack(count: number): DominoData[] {
    const dealtTiles: DominoData[] = [];

    for (let i = 0; i < count && this.bonePile.length > 0; i++) {
      const tile = this.bonePile.pop();
      if (tile) {
        this.playerRack.push(tile);
        dealtTiles.push(tile);
      }
    }

    return dealtTiles;
  }

  /**
   * Remove a domino from the player's rack
   */
  removeDominoFromRack(domino: DominoData): boolean {
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
  reset(): void {
    this.playerRack = [];
    this.board = [];
    this.score = 0;
    this.pullsRemaining = 5;
    this.initializeBonePile();
  }

  // Getters
  getBonePile(): DominoData[] {
    return this.bonePile;
  }

  getPlayerRack(): DominoData[] {
    return this.playerRack;
  }

  getBoard(): DominoData[] {
    return this.board;
  }

  getScore(): number {
    return this.score;
  }

  getPullsRemaining(): number {
    return this.pullsRemaining;
  }

  getTargetScore(): number {
    return this.targetScore;
  }

  getTotalPulls(): number {
    return this.totalPulls;
  }

  getBonePileSize(): number {
    return this.bonePile.length;
  }

  getPlayerRackSize(): number {
    return this.playerRack.length;
  }

  /**
   * Add points to the current score
   */
  addScore(points: number): void {
    if (typeof points !== 'number' || !Number.isFinite(points)) {
      throw new Error('Points must be a finite number');
    }
    this.score += points;
  }

  /**
   * Decrement pulls remaining
   */
  decrementPulls(): void {
    if (this.pullsRemaining > 0) {
      this.pullsRemaining--;
    }
  }

  /**
   * Place a tile from the rack onto the board
   */
  playTileFromRack(rackIndex: number): DominoData | null {
    if (
      typeof rackIndex !== 'number' ||
      !Number.isFinite(rackIndex) ||
      !Number.isInteger(rackIndex) ||
      rackIndex < 0
    ) {
      return null;
    }
    if (rackIndex < this.playerRack.length) {
      const tile = this.playerRack.splice(rackIndex, 1)[0];
      if (tile) {
        this.board.push(tile);
        return tile;
      }
    }
    return null;
  }
}
