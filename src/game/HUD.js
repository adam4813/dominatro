import * as THREE from 'three';

export class HUD {
  constructor(gameState, scene, camera) {
    this.gameState = gameState;
    this.scene = scene;
    this.camera = camera;
    this.sprites = [];
    this.canvases = {};
    this.createHUD();
  }

  createCanvasTexture(width, height) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    return { canvas, context };
  }

  createHUD() {
    // Create score panel
    const scoreCanvas = this.createCanvasTexture(200, 120);
    this.canvases.score = scoreCanvas;
    this.drawScorePanel(scoreCanvas.context, 0);
    const scoreSprite = this.createSprite(scoreCanvas.canvas, -7, 6);
    this.sprites.push(scoreSprite);

    // Create progression panel
    const progressionCanvas = this.createCanvasTexture(280, 120);
    this.canvases.progression = progressionCanvas;
    this.drawProgressionPanel(progressionCanvas.context, 1, 5, 100);
    const progressionSprite = this.createSprite(progressionCanvas.canvas, 0, 6);
    this.sprites.push(progressionSprite);

    // Create bone pile panel
    const bonePileCanvas = this.createCanvasTexture(200, 120);
    this.canvases.bonePile = bonePileCanvas;
    this.drawBonePilePanel(bonePileCanvas.context, 28);
    const bonePileSprite = this.createSprite(bonePileCanvas.canvas, 7, 6);
    this.sprites.push(bonePileSprite);

    // Create rack panel
    const rackCanvas = this.createCanvasTexture(800, 200);
    this.canvases.rack = rackCanvas;
    this.drawRackPanel(rackCanvas.context, []);
    const rackSprite = this.createSprite(rackCanvas.canvas, 0, -6);
    rackSprite.scale.set(8, 2, 1);
    this.sprites.push(rackSprite);

    // Initial update
    this.updateAll();
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
    sprite.scale.set(2, 1.2, 1);
    sprite.renderOrder = 999; // Render on top
    this.scene.add(sprite);
    return sprite;
  }

  drawScorePanel(ctx, score) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    // Draw label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', width / 2, 35);

    // Draw value
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
    ctx.fillText(score.toLocaleString(), width / 2, 85);
  }

  drawProgressionPanel(ctx, currentPull, totalPulls, targetScore) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    // Draw pull text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Pull ${currentPull}/${totalPulls}`, width / 2, 50);

    // Draw target
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '18px Arial';
    ctx.fillText('Target: ', width / 2 - 30, 85);
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 18px Arial';
    ctx.fillText(targetScore.toLocaleString(), width / 2 + 30, 85);
  }

  drawBonePilePanel(ctx, count) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    // Draw label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('BONE PILE', width / 2, 35);

    // Draw value
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px Arial';
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('YOUR HAND', width / 2, 35);

    // Draw tiles
    if (tiles.length === 0) return;

    const tileWidth = 80;
    const tileHeight = 120;
    const spacing = 15;
    const totalWidth = tiles.length * tileWidth + (tiles.length - 1) * spacing;
    const startX = (width - totalWidth) / 2;
    const startY = 60;

    tiles.forEach((tile, index) => {
      const x = startX + index * (tileWidth + spacing);
      this.drawDominoTile(
        ctx,
        x,
        startY,
        tileWidth,
        tileHeight,
        tile.left,
        tile.right
      );
    });
  }

  drawDominoTile(ctx, x, y, width, height, leftPips, rightPips) {
    // Draw tile background
    ctx.fillStyle = '#f5f5dc';
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 3;
    this.roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    // Draw center divider
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.stroke();

    // Draw pips
    this.drawPips(ctx, x + width / 2, y + height / 4, leftPips, 18);
    this.drawPips(ctx, x + width / 2, y + (3 * height) / 4, rightPips, 18);
  }

  drawPips(ctx, centerX, centerY, count, size) {
    ctx.fillStyle = '#222222';
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
    this.sprites[0].material.map.needsUpdate = true;
  }

  updateBonePile() {
    const bonePileSize = this.gameState.getBonePileSize();
    this.drawBonePilePanel(this.canvases.bonePile.context, bonePileSize);
    this.sprites[2].material.map.needsUpdate = true;
  }

  updateProgression() {
    const pullsRemaining = this.gameState.getPullsRemaining();
    const totalPulls = 5;
    const currentPull = totalPulls - pullsRemaining + 1;
    const targetScore = this.gameState.getTargetScore();
    this.drawProgressionPanel(
      this.canvases.progression.context,
      currentPull,
      totalPulls,
      targetScore
    );
    this.sprites[1].material.map.needsUpdate = true;
  }

  updateRack() {
    const playerRack = this.gameState.getPlayerRack();
    this.drawRackPanel(this.canvases.rack.context, playerRack);
    this.sprites[3].material.map.needsUpdate = true;
  }

  updateAll() {
    this.updateScore();
    this.updateBonePile();
    this.updateProgression();
    this.updateRack();
  }

  destroy() {
    // Remove all sprites from scene
    this.sprites.forEach((sprite) => {
      this.scene.remove(sprite);
      if (sprite.material.map) {
        sprite.material.map.dispose();
      }
      sprite.material.dispose();
    });
    this.sprites = [];
    this.canvases = {};
  }
}
