export class HUD {
  constructor(gameState) {
    this.gameState = gameState;
    this.elements = {};
    this.createHUD();
  }

  createHUD() {
    // Create main HUD container
    this.hudContainer = document.createElement('div');
    this.hudContainer.id = 'hud-container';
    this.hudContainer.className = 'hud-container';

    // Create top bar for score and progression
    const topBar = document.createElement('div');
    topBar.className = 'hud-top-bar';

    // Score display
    const scoreContainer = document.createElement('div');
    scoreContainer.className = 'hud-score-container';
    const scoreLabel = document.createElement('div');
    scoreLabel.className = 'hud-label';
    scoreLabel.textContent = 'Score';
    this.elements.score = document.createElement('div');
    this.elements.score.className = 'hud-score-value';
    this.elements.score.textContent = '0';
    scoreContainer.appendChild(scoreLabel);
    scoreContainer.appendChild(this.elements.score);

    // Match progression display
    const progressionContainer = document.createElement('div');
    progressionContainer.className = 'hud-progression-container';
    this.elements.progression = document.createElement('div');
    this.elements.progression.className = 'hud-progression-text';
    this.elements.progression.textContent = 'Pull 1/5';
    const targetLabel = document.createElement('div');
    targetLabel.className = 'hud-target-label';
    this.elements.target = document.createElement('span');
    this.elements.target.className = 'hud-target-value';
    this.elements.target.textContent = '100';
    targetLabel.innerHTML = 'Target: ';
    targetLabel.appendChild(this.elements.target);
    progressionContainer.appendChild(this.elements.progression);
    progressionContainer.appendChild(targetLabel);

    // Bone pile display
    const bonePileContainer = document.createElement('div');
    bonePileContainer.className = 'hud-bone-pile-container';
    const bonePileLabel = document.createElement('div');
    bonePileLabel.className = 'hud-label';
    bonePileLabel.textContent = 'Bone Pile';
    this.elements.bonePile = document.createElement('div');
    this.elements.bonePile.className = 'hud-bone-pile-value';
    this.elements.bonePile.textContent = '28';
    bonePileContainer.appendChild(bonePileLabel);
    bonePileContainer.appendChild(this.elements.bonePile);

    topBar.appendChild(scoreContainer);
    topBar.appendChild(progressionContainer);
    topBar.appendChild(bonePileContainer);

    // Create player rack display
    const rackContainer = document.createElement('div');
    rackContainer.className = 'hud-rack-container';
    const rackLabel = document.createElement('div');
    rackLabel.className = 'hud-rack-label';
    rackLabel.textContent = 'Your Hand';
    this.elements.rack = document.createElement('div');
    this.elements.rack.className = 'hud-rack-tiles';
    rackContainer.appendChild(rackLabel);
    rackContainer.appendChild(this.elements.rack);

    // Assemble HUD
    this.hudContainer.appendChild(topBar);
    this.hudContainer.appendChild(rackContainer);

    // Add to DOM
    document.body.appendChild(this.hudContainer);

    // Initial update
    this.updateAll();
  }

  updateScore() {
    const score = this.gameState.getScore();
    this.elements.score.textContent = score.toLocaleString();
  }

  updateBonePile() {
    const bonePileSize = this.gameState.getBonePileSize();
    this.elements.bonePile.textContent = bonePileSize;
  }

  updateProgression() {
    const pullsRemaining = this.gameState.getPullsRemaining();
    const totalPulls = 5; // Default total pulls
    const currentPull = totalPulls - pullsRemaining + 1;
    this.elements.progression.textContent = `Pull ${currentPull}/${totalPulls}`;

    const targetScore = this.gameState.getTargetScore();
    this.elements.target.textContent = targetScore.toLocaleString();
  }

  updateRack() {
    const playerRack = this.gameState.getPlayerRack();
    this.elements.rack.innerHTML = '';

    playerRack.forEach((tile) => {
      const tileElement = document.createElement('div');
      tileElement.className = 'hud-rack-tile';

      const leftHalf = document.createElement('div');
      leftHalf.className = 'hud-tile-half';
      leftHalf.textContent = this.getPipDisplay(tile.left);

      const divider = document.createElement('div');
      divider.className = 'hud-tile-divider';

      const rightHalf = document.createElement('div');
      rightHalf.className = 'hud-tile-half';
      rightHalf.textContent = this.getPipDisplay(tile.right);

      tileElement.appendChild(leftHalf);
      tileElement.appendChild(divider);
      tileElement.appendChild(rightHalf);

      this.elements.rack.appendChild(tileElement);
    });
  }

  getPipDisplay(count) {
    // Use Unicode dice faces for pip display
    const pipMap = {
      0: '○',
      1: '⚀',
      2: '⚁',
      3: '⚂',
      4: '⚃',
      5: '⚄',
      6: '⚅',
    };
    return pipMap[count] || count;
  }

  updateAll() {
    this.updateScore();
    this.updateBonePile();
    this.updateProgression();
    this.updateRack();
  }

  destroy() {
    if (this.hudContainer && this.hudContainer.parentNode) {
      this.hudContainer.parentNode.removeChild(this.hudContainer);
    }
  }
}
