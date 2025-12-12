export class GameState {
  constructor() {
    this.playerRack = [];
    this.initializeRack();
  }

  initializeRack() {
    // Initialize with a sample set of dominoes for testing
    // Each domino is represented as an object with leftPips and rightPips
    this.playerRack = [
      { leftPips: 6, rightPips: 4 },
      { leftPips: 5, rightPips: 5 },
      { leftPips: 3, rightPips: 2 },
      { leftPips: 4, rightPips: 1 },
      { leftPips: 2, rightPips: 0 },
      { leftPips: 6, rightPips: 3 },
      { leftPips: 1, rightPips: 1 },
    ];
    console.log(
      'GameState: Player rack initialized with',
      this.playerRack.length,
      'dominoes'
    );
  }

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

  getPlayerRack() {
    return this.playerRack;
  }
}
