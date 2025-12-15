import * as THREE from 'three';

/**
 * HUD (Heads-Up Display) class for rendering game information on canvas
 *
 * Displays player score, match progression, bone pile count, and player rack
 * using Three.js sprites with dynamically rendered canvas textures.
 *
 * @class HUD
 */
export class HUD {
  // Constants for HUD layout and styling
  static PANEL_SCORE_WIDTH = 200;
  static PANEL_SCORE_HEIGHT = 120;
  static PANEL_PROGRESSION_WIDTH = 280;
  static PANEL_PROGRESSION_HEIGHT = 120;
  static PANEL_BONE_PILE_WIDTH = 200;
  static PANEL_BONE_PILE_HEIGHT = 120;
  static PANEL_RACK_WIDTH = 800;
  static PANEL_RACK_HEIGHT = 200;

  static FONT_LABEL = 'bold 16px Arial';
  static FONT_VALUE_LARGE = 'bold 42px Arial';
  static FONT_VALUE_MEDIUM = 'bold 32px Arial';
  static FONT_VALUE_SMALL = '18px Arial';
  static FONT_VALUE_SMALL_BOLD = 'bold 18px Arial';

  static COLOR_BG = 'rgba(0, 0, 0, 0.7)';
  static COLOR_BORDER = 'rgba(255, 255, 255, 0.3)';
  static COLOR_LABEL = 'rgba(255, 255, 255, 0.7)';
  static COLOR_VALUE = '#ffffff';
  static COLOR_TARGET = '#ffd700';
  static COLOR_TILE_BG = '#f5f5dc';
  static COLOR_TILE_BORDER = '#333333';
  static COLOR_PIP = '#222222';

  static SPRITE_SCALE_NORMAL_X = 2;
  static SPRITE_SCALE_NORMAL_Y = 1.2;
  static SPRITE_SCALE_RACK_X = 8;
  static SPRITE_SCALE_RACK_Y = 2;

  static TILE_WIDTH = 80;
  static TILE_HEIGHT = 120;
  static TILE_SPACING = 15;
  static PIP_SIZE = 18;

  // Sprite indices
  static SPRITE_INDEX_SCORE = 0;
  static SPRITE_INDEX_PROGRESSION = 1;
  static SPRITE_INDEX_BONE_PILE = 2;
  static SPRITE_INDEX_RACK = 3;

  /**
   * Creates a new HUD instance
   * @param {GameState} gameState - The game state object to display information from
   */
  constructor(gameState) {
    this.gameState = gameState;
    this.sprites = [];
    this.canvases = {};
    this.handleResize = this.handleResize.bind(this);

    // Create a separate scene and orthographic camera for HUD rendering
    this.hudScene = new THREE.Scene();
    this.hudCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    this.createHUD();
    window.addEventListener('resize', this.handleResize);
  }

  createCanvasTexture(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  createHUD() {
    const positions = this.calculatePositions();

    // Create score panel (top-left)
    const scoreCanvas = this.createCanvasTexture(
      HUD.PANEL_SCORE_WIDTH,
      HUD.PANEL_SCORE_HEIGHT
    );
    this.canvases.score = scoreCanvas;
    this.drawScorePanel(scoreCanvas.context, this.gameState.getScore());

    this.sprites[HUD.SPRITE_INDEX_SCORE] = this.createSprite(
      scoreCanvas.canvas,
      positions.leftX,
      positions.topY
    );

    // Create progression panel (top-center)
    const progressionCanvas = this.createCanvasTexture(
      HUD.PANEL_PROGRESSION_WIDTH,
      HUD.PANEL_PROGRESSION_HEIGHT
    );
    this.canvases.progression = progressionCanvas;
    const currentPull = Math.min(
      this.gameState.getTotalPulls() - this.gameState.getPullsRemaining() + 1,
      this.gameState.getTotalPulls()
    );
    this.drawProgressionPanel(
      progressionCanvas.context,
      currentPull,
      this.gameState.getTotalPulls(),
      this.gameState.getTargetScore()
    );

    this.sprites[HUD.SPRITE_INDEX_PROGRESSION] = this.createSprite(
      progressionCanvas.canvas,
      0,
      positions.topY
    );

    // Create bone pile panel (top-right)
    const bonePileCanvas = this.createCanvasTexture(
      HUD.PANEL_BONE_PILE_WIDTH,
      HUD.PANEL_BONE_PILE_HEIGHT
    );
    this.canvases.bonePile = bonePileCanvas;
    this.drawBonePilePanel(
      bonePileCanvas.context,
      this.gameState.getBonePileSize()
    );

    this.sprites[HUD.SPRITE_INDEX_BONE_PILE] = this.createSprite(
      bonePileCanvas.canvas,
      positions.rightX,
      positions.topY
    );

    // Create rack panel (bottom)
    const rackCanvas = this.createCanvasTexture(
      HUD.PANEL_RACK_WIDTH,
      HUD.PANEL_RACK_HEIGHT
    );
    this.canvases.rack = rackCanvas;
    this.drawRackPanel(rackCanvas.context, this.gameState.getPlayerRack());
    const rackSprite = this.createSprite(
      rackCanvas.canvas,
      0,
      positions.bottomY
    );
    rackSprite.scale.set(
      HUD.SPRITE_SCALE_RACK_X * 0.1,
      HUD.SPRITE_SCALE_RACK_Y * 0.1,
      1
    );
    this.sprites[HUD.SPRITE_INDEX_RACK] = rackSprite;

    // Initial update
    this.updateAll();
  }

  /**
   * Calculate HUD panel positions in normalized screen coordinates (-1 to 1)
   * @returns {Object} Object containing position coordinates for HUD panels
   */
  calculatePositions() {
    // Position panels at edges of the screen in normalized coordinates
    const topY = 0.85; // Near top edge
    const bottomY = -0.85; // Near bottom edge
    const leftX = -0.85; // Near left edge
    const rightX = 0.85; // Near right edge

    return { topY, bottomY, leftX, rightX };
  }

  /**
   * Handle window resize events by updating sprite positions
   */
  handleResize() {
    const positions = this.calculatePositions();

    // Update sprite positions
    if (this.sprites[HUD.SPRITE_INDEX_SCORE]) {
      this.sprites[HUD.SPRITE_INDEX_SCORE].position.set(
        positions.leftX,
        positions.topY,
        0
      );
    }
    if (this.sprites[HUD.SPRITE_INDEX_PROGRESSION]) {
      this.sprites[HUD.SPRITE_INDEX_PROGRESSION].position.set(
        0,
        positions.topY,
        0
      );
    }
    if (this.sprites[HUD.SPRITE_INDEX_BONE_PILE]) {
      this.sprites[HUD.SPRITE_INDEX_BONE_PILE].position.set(
        positions.rightX,
        positions.topY,
        0
      );
    }
    if (this.sprites[HUD.SPRITE_INDEX_RACK]) {
      this.sprites[HUD.SPRITE_INDEX_RACK].position.set(0, positions.bottomY, 0);
    }
  }

  createSprite(canvas, x, y) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({
      map: texture,
      depthTest: false,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, 0);
    sprite.scale.set(
      HUD.SPRITE_SCALE_NORMAL_X * 0.1,
      HUD.SPRITE_SCALE_NORMAL_Y * 0.1,
      1
    );
    this.hudScene.add(sprite);
    return sprite;
  }

  drawScorePanel(ctx, score) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = HUD.COLOR_BG;
    ctx.strokeStyle = HUD.COLOR_BORDER;
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    // Draw label
    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', width / 2, 35);

    // Draw value
    ctx.fillStyle = HUD.COLOR_VALUE;
    ctx.font = HUD.FONT_VALUE_LARGE;
    ctx.fillText(score.toLocaleString(), width / 2, 85);
  }

  drawProgressionPanel(ctx, currentPull, totalPulls, targetScore) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = HUD.COLOR_BG;
    ctx.strokeStyle = HUD.COLOR_BORDER;
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    // Draw pull text
    ctx.fillStyle = HUD.COLOR_VALUE;
    ctx.font = HUD.FONT_VALUE_MEDIUM;
    ctx.textAlign = 'center';
    ctx.fillText(`Pull ${currentPull}/${totalPulls}`, width / 2, 50);

    // Draw target
    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_VALUE_SMALL;
    ctx.fillText('Target: ', width / 2 - 30, 85);
    ctx.fillStyle = HUD.COLOR_TARGET;
    ctx.font = HUD.FONT_VALUE_SMALL_BOLD;
    ctx.fillText(targetScore.toLocaleString(), width / 2 + 30, 85);
  }

  drawBonePilePanel(ctx, count) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = HUD.COLOR_BG;
    ctx.strokeStyle = HUD.COLOR_BORDER;
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    // Draw label
    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('BONE PILE', width / 2, 35);

    // Draw value
    ctx.fillStyle = HUD.COLOR_VALUE;
    ctx.font = HUD.FONT_VALUE_LARGE;
    ctx.fillText(count.toString(), width / 2, 85);
  }

  drawRackPanel(ctx, tiles) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 15);
    ctx.fill();

    // Draw label
    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_VALUE_SMALL_BOLD;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR HAND', width / 2, 35);

    // Draw tiles
    if (tiles.length === 0) return;

    const totalWidth =
      tiles.length * HUD.TILE_WIDTH + (tiles.length - 1) * HUD.TILE_SPACING;
    const startX = (width - totalWidth) / 2;
    const startY = 60;

    tiles.forEach((tile, index) => {
      const x = startX + index * (HUD.TILE_WIDTH + HUD.TILE_SPACING);
      this.drawDominoTile(
        ctx,
        x,
        startY,
        HUD.TILE_WIDTH,
        HUD.TILE_HEIGHT,
        tile.left,
        tile.right
      );
    });
  }

  drawDominoTile(ctx, x, y, width, height, leftPips, rightPips) {
    // Draw tile background
    ctx.fillStyle = HUD.COLOR_TILE_BG;
    ctx.strokeStyle = HUD.COLOR_TILE_BORDER;
    ctx.lineWidth = 3;
    this.roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Draw center divider
    ctx.strokeStyle = HUD.COLOR_TILE_BORDER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.stroke();

    // Draw pips
    this.drawPips(ctx, x + width / 2, y + height / 4, leftPips, HUD.PIP_SIZE);
    this.drawPips(
      ctx,
      x + width / 2,
      y + (3 * height) / 4,
      rightPips,
      HUD.PIP_SIZE
    );
  }

  drawPips(ctx, centerX, centerY, count, size) {
    ctx.fillStyle = HUD.COLOR_PIP;
    const positions = this.getPipPositions(count, size);

    positions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(centerX + pos.x, centerY + pos.y, size / 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  getPipPositions(count, spacing) {
    const positions = [];
    const offset = spacing / 1.5;

    // Validate pip count
    if (count < 0) {
      console.warn(
        `Negative pip count ${count} is invalid. Dominoes have 0-6 pips per half.`
      );
      return positions;
    }

    switch (count) {
      case 0:
        break;
      case 1:
        positions.push({ x: 0, y: 0 });
        break;
      case 2:
        positions.push({ x: -offset, y: -offset });
        positions.push({ x: offset, y: offset });
        break;
      case 3:
        positions.push({ x: -offset, y: -offset });
        positions.push({ x: 0, y: 0 });
        positions.push({ x: offset, y: offset });
        break;
      case 4:
        positions.push({ x: -offset, y: -offset });
        positions.push({ x: offset, y: -offset });
        positions.push({ x: -offset, y: offset });
        positions.push({ x: offset, y: offset });
        break;
      case 5:
        positions.push({ x: -offset, y: -offset });
        positions.push({ x: offset, y: -offset });
        positions.push({ x: 0, y: 0 });
        positions.push({ x: -offset, y: offset });
        positions.push({ x: offset, y: offset });
        break;
      case 6:
        positions.push({ x: -offset, y: -offset });
        positions.push({ x: -offset, y: 0 });
        positions.push({ x: -offset, y: offset });
        positions.push({ x: offset, y: -offset });
        positions.push({ x: offset, y: 0 });
        positions.push({ x: offset, y: offset });
        break;
      default:
        // For pip counts > 6, fall back to showing the number
        // This handles expansion to double-nine or higher dominoes
        console.warn(
          `Pip count ${count} not supported. Dominoes typically have 0-6 pips per half.`
        );
        break;
    }

    return positions;
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  updateScore() {
    const score = this.gameState.getScore();
    this.drawScorePanel(this.canvases.score.context, score);
    this.sprites[HUD.SPRITE_INDEX_SCORE].material.map.needsUpdate = true;
  }

  updateBonePile() {
    const bonePileSize = this.gameState.getBonePileSize();
    this.drawBonePilePanel(this.canvases.bonePile.context, bonePileSize);
    this.sprites[HUD.SPRITE_INDEX_BONE_PILE].material.map.needsUpdate = true;
  }

  updateProgression() {
    const pullsRemaining = this.gameState.getPullsRemaining();
    const totalPulls = this.gameState.getTotalPulls();
    const currentPull = Math.min(totalPulls - pullsRemaining + 1, totalPulls);
    const targetScore = this.gameState.getTargetScore();
    this.drawProgressionPanel(
      this.canvases.progression.context,
      currentPull,
      totalPulls,
      targetScore
    );
    this.sprites[HUD.SPRITE_INDEX_PROGRESSION].material.map.needsUpdate = true;
  }

  updateRack() {
    const playerRack = this.gameState.getPlayerRack();
    this.drawRackPanel(this.canvases.rack.context, playerRack);
    this.sprites[HUD.SPRITE_INDEX_RACK].material.map.needsUpdate = true;
  }

  updateAll() {
    this.updateScore();
    this.updateBonePile();
    this.updateProgression();
    this.updateRack();
  }

  getHUDScene() {
    return this.hudScene;
  }

  getHUDCamera() {
    return this.hudCamera;
  }

  destroy() {
    // Remove resize handler
    window.removeEventListener('resize', this.handleResize);

    // Remove all sprites from HUD scene
    this.sprites.forEach((sprite) => {
      this.hudScene.remove(sprite);
      if (sprite.material.map) {
        sprite.material.map.dispose();
      }
      sprite.material.dispose();
    });
    this.sprites = [];
    this.canvases = {};
  }
}
