import * as THREE from 'three';
import type {
  DominoData,
  PipPosition,
  CanvasContext,
  HUDCanvases,
} from '../types';
import type { GameState } from './GameState';

/**
 * HUD (Heads-Up Display) class for rendering game information on canvas
 *
 * Displays player score, match progression, bone pile count, and player rack
 * using Three.js sprites with dynamically rendered canvas textures.
 */
export class HUD {
  // Constants for HUD layout and styling
  private static readonly PANEL_SCORE_WIDTH = 200;
  private static readonly PANEL_SCORE_HEIGHT = 120;
  private static readonly PANEL_PROGRESSION_WIDTH = 280;
  private static readonly PANEL_PROGRESSION_HEIGHT = 120;
  private static readonly PANEL_BONE_PILE_WIDTH = 200;
  private static readonly PANEL_BONE_PILE_HEIGHT = 120;
  private static readonly PANEL_PASSIVE_POOL_WIDTH = 600;
  private static readonly PANEL_PASSIVE_POOL_HEIGHT = 180;

  private static readonly FONT_LABEL = 'bold 16px Arial';
  private static readonly FONT_VALUE_LARGE = 'bold 42px Arial';
  private static readonly FONT_VALUE_MEDIUM = 'bold 32px Arial';
  private static readonly FONT_VALUE_SMALL = '18px Arial';
  private static readonly FONT_VALUE_SMALL_BOLD = 'bold 18px Arial';

  private static readonly COLOR_BG = 'rgba(0, 0, 0, 0.7)';
  private static readonly COLOR_BORDER = 'rgba(255, 255, 255, 0.3)';
  private static readonly COLOR_LABEL = 'rgba(255, 255, 255, 0.7)';
  private static readonly COLOR_VALUE = '#ffffff';
  private static readonly COLOR_TARGET = '#ffd700';
  private static readonly COLOR_TILE_BG = '#f5f5dc';
  private static readonly COLOR_TILE_BORDER = '#333333';
  private static readonly COLOR_PIP = '#222222';

  private static readonly SPRITE_SCALE_NORMAL_X = 2;
  private static readonly SPRITE_SCALE_NORMAL_Y = 1.2;
  private static readonly SPRITE_SCALE_PASSIVE_X = 6;
  private static readonly SPRITE_SCALE_PASSIVE_Y = 1.8;

  private static readonly TILE_WIDTH = 80;
  private static readonly TILE_HEIGHT = 120;
  private static readonly TILE_SPACING = 15;
  private static readonly PIP_SIZE = 18;

  // Sprite indices
  private static readonly SPRITE_INDEX_SCORE = 0;
  private static readonly SPRITE_INDEX_PROGRESSION = 1;
  private static readonly SPRITE_INDEX_BONE_PILE = 2;
  private static readonly SPRITE_INDEX_PASSIVE_POOL = 3;

  private gameState: GameState;
  private sprites: THREE.Sprite[] = [];
  private canvases: HUDCanvases = {};
  private hudScene: THREE.Scene;
  private hudCamera: THREE.OrthographicCamera;
  private tooltipElement: HTMLDivElement;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);

    // Create a separate scene and orthographic camera for HUD rendering
    this.hudScene = new THREE.Scene();
    this.hudCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create tooltip element
    this.tooltipElement = document.createElement('div');
    this.tooltipElement.style.position = 'absolute';
    this.tooltipElement.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    this.tooltipElement.style.color = 'white';
    this.tooltipElement.style.padding = '8px 12px';
    this.tooltipElement.style.borderRadius = '4px';
    this.tooltipElement.style.fontSize = '14px';
    this.tooltipElement.style.pointerEvents = 'none';
    this.tooltipElement.style.display = 'none';
    this.tooltipElement.style.zIndex = '1000';
    this.tooltipElement.style.maxWidth = '250px';
    document.body.appendChild(this.tooltipElement);

    this.createHUD();
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
  }

  private getTileDescription(type: string): string {
    switch (type) {
      case 'doubler':
        return 'Doubles the score of your next play';
      case 'odd-favor':
        return 'Grants bonus points when odd pip sums are scored';
      case 'thief':
        return 'Steals points or tiles from opponents';
      case 'blank-slate':
        return 'Resets certain game conditions';
      case 'wild':
        return 'Matches any pip value';
      case 'crusher':
        return 'Wildcard with crushing ability';
      case 'cheater':
        return 'Wildcard with rule-bending ability';
      case 'spinner':
        return 'Wildcard with rotation ability';
      default:
        return 'Special tile';
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const passivePool = this.gameState.getPassivePool();
    if (passivePool.length === 0) {
      this.tooltipElement.style.display = 'none';
      return;
    }

    // Get the passive pool sprite position and dimensions
    const sprite = this.sprites[HUD.SPRITE_INDEX_PASSIVE_POOL];
    if (!sprite) {
      this.tooltipElement.style.display = 'none';
      return;
    }

    // Convert sprite position to screen coordinates
    const spritePos = sprite.position.clone();
    spritePos.project(this.hudCamera);

    const screenX = (spritePos.x * 0.5 + 0.5) * window.innerWidth;
    const screenY = (-spritePos.y * 0.5 + 0.5) * window.innerHeight;

    const spriteWidth = sprite.scale.x * window.innerWidth * 0.5;
    const spriteHeight = sprite.scale.y * window.innerHeight * 0.5;

    // Calculate tile positions within the panel
    const totalWidth =
      passivePool.length * HUD.TILE_WIDTH +
      (passivePool.length - 1) * HUD.TILE_SPACING;
    const startX =
      screenX - ((totalWidth / HUD.PANEL_PASSIVE_POOL_WIDTH) * spriteWidth) / 2;
    const startY =
      screenY -
      spriteHeight / 2 +
      (60 / HUD.PANEL_PASSIVE_POOL_HEIGHT) * spriteHeight;

    const tileWidth =
      (HUD.TILE_WIDTH / HUD.PANEL_PASSIVE_POOL_WIDTH) * spriteWidth;
    const tileHeight =
      (HUD.TILE_HEIGHT / HUD.PANEL_PASSIVE_POOL_HEIGHT) * spriteHeight;
    const tileSpacing =
      (HUD.TILE_SPACING / HUD.PANEL_PASSIVE_POOL_WIDTH) * spriteWidth;

    // Check if mouse is over any tile
    let hoveredTile: DominoData | null = null;
    for (let i = 0; i < passivePool.length; i++) {
      const tileX = startX + i * (tileWidth + tileSpacing);
      const tileY = startY;

      if (
        event.clientX >= tileX &&
        event.clientX <= tileX + tileWidth &&
        event.clientY >= tileY &&
        event.clientY <= tileY + tileHeight
      ) {
        hoveredTile = passivePool[i]!;
        break;
      }
    }

    if (hoveredTile) {
      this.tooltipElement.textContent = this.getTileDescription(
        hoveredTile.type
      );
      this.tooltipElement.style.display = 'block';
      this.tooltipElement.style.left = `${event.clientX + 15}px`;
      this.tooltipElement.style.top = `${event.clientY + 15}px`;
    } else {
      this.tooltipElement.style.display = 'none';
    }
  }

  private createCanvasTexture(width: number, height: number): CanvasContext {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d')!;
    return { canvas, context };
  }

  private createHUD(): void {
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

    // Create passive pool panel (below top-center)
    const passivePoolCanvas = this.createCanvasTexture(
      HUD.PANEL_PASSIVE_POOL_WIDTH,
      HUD.PANEL_PASSIVE_POOL_HEIGHT
    );
    this.canvases.passivePool = passivePoolCanvas;
    this.drawPassivePoolPanel(
      passivePoolCanvas.context,
      this.gameState.getPassivePool()
    );
    const passivePoolSprite = this.createSprite(
      passivePoolCanvas.canvas,
      0,
      0.65
    );
    passivePoolSprite.scale.set(
      HUD.SPRITE_SCALE_PASSIVE_X * 0.1,
      HUD.SPRITE_SCALE_PASSIVE_Y * 0.1,
      1
    );
    this.sprites[HUD.SPRITE_INDEX_PASSIVE_POOL] = passivePoolSprite;

    // Initial update
    this.updateAll();
  }

  private calculatePositions(): {
    topY: number;
    bottomY: number;
    leftX: number;
    rightX: number;
  } {
    // Position panels at edges of the screen in normalized coordinates
    const topY = 0.85;
    const bottomY = -0.85;
    const leftX = -0.85;
    const rightX = 0.85;

    return { topY, bottomY, leftX, rightX };
  }

  private handleResize(): void {
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
    if (this.sprites[HUD.SPRITE_INDEX_PASSIVE_POOL]) {
      this.sprites[HUD.SPRITE_INDEX_PASSIVE_POOL].position.set(0, 0.65, 0);
    }
  }

  private createSprite(
    canvas: HTMLCanvasElement,
    x: number,
    y: number
  ): THREE.Sprite {
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

  private drawScorePanel(ctx: CanvasRenderingContext2D, score: number): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = HUD.COLOR_BG;
    ctx.strokeStyle = HUD.COLOR_BORDER;
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('SCORE', width / 2, 35);

    ctx.fillStyle = HUD.COLOR_VALUE;
    ctx.font = HUD.FONT_VALUE_LARGE;
    ctx.fillText(score.toLocaleString(), width / 2, 85);
  }

  private drawProgressionPanel(
    ctx: CanvasRenderingContext2D,
    currentPull: number,
    totalPulls: number,
    targetScore: number
  ): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = HUD.COLOR_BG;
    ctx.strokeStyle = HUD.COLOR_BORDER;
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = HUD.COLOR_VALUE;
    ctx.font = HUD.FONT_VALUE_MEDIUM;
    ctx.textAlign = 'center';
    ctx.fillText(`Pull ${currentPull}/${totalPulls}`, width / 2, 50);

    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_VALUE_SMALL;
    ctx.fillText('Target: ', width / 2 - 30, 85);
    ctx.fillStyle = HUD.COLOR_TARGET;
    ctx.font = HUD.FONT_VALUE_SMALL_BOLD;
    ctx.fillText(targetScore.toLocaleString(), width / 2 + 30, 85);
  }

  private drawBonePilePanel(
    ctx: CanvasRenderingContext2D,
    count: number
  ): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = HUD.COLOR_BG;
    ctx.strokeStyle = HUD.COLOR_BORDER;
    ctx.lineWidth = 3;
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_LABEL;
    ctx.textAlign = 'center';
    ctx.fillText('BONE PILE', width / 2, 35);

    ctx.fillStyle = HUD.COLOR_VALUE;
    ctx.font = HUD.FONT_VALUE_LARGE;
    ctx.fillText(count.toString(), width / 2, 85);
  }

  private drawPassivePoolPanel(
    ctx: CanvasRenderingContext2D,
    tiles: DominoData[]
  ): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 15);
    ctx.fill();

    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_VALUE_SMALL_BOLD;
    ctx.textAlign = 'center';
    ctx.fillText('PASSIVE TILES', width / 2, 35);

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
        tile.right,
        tile.type
      );
    });
  }

  private drawRackPanel(
    ctx: CanvasRenderingContext2D,
    tiles: DominoData[]
  ): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.roundRect(ctx, 10, 10, width - 20, height - 20, 15);
    ctx.fill();

    ctx.fillStyle = HUD.COLOR_LABEL;
    ctx.font = HUD.FONT_VALUE_SMALL_BOLD;
    ctx.textAlign = 'center';
    ctx.fillText('YOUR HAND', width / 2, 35);

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

  private drawDominoTile(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    leftPips: number,
    rightPips: number,
    type?: string
  ): void {
    // Set background color based on type
    if (type && type !== 'standard') {
      switch (type) {
        case 'wild':
          ctx.fillStyle = '#cc99ff';
          break;
        case 'doubler':
          ctx.fillStyle = '#ffd700';
          break;
        case 'odd-favor':
          ctx.fillStyle = '#ff6b6b';
          break;
        case 'spinner':
          ctx.fillStyle = '#4ecdc4';
          break;
        case 'crusher':
          ctx.fillStyle = '#6c5ce7';
          break;
        case 'cheater':
          ctx.fillStyle = '#fd79a8';
          break;
        case 'thief':
          ctx.fillStyle = '#2d3436';
          break;
        case 'blank-slate':
          ctx.fillStyle = '#dfe6e9';
          break;
        default:
          ctx.fillStyle = HUD.COLOR_TILE_BG;
      }
    } else {
      ctx.fillStyle = HUD.COLOR_TILE_BG;
    }

    ctx.strokeStyle = HUD.COLOR_TILE_BORDER;
    ctx.lineWidth = 3;
    this.roundRect(ctx, x, y, width, height, 8);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = HUD.COLOR_TILE_BORDER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y + height / 2);
    ctx.lineTo(x + width, y + height / 2);
    ctx.stroke();

    this.drawPips(ctx, x + width / 2, y + height / 4, leftPips, HUD.PIP_SIZE);
    this.drawPips(
      ctx,
      x + width / 2,
      y + (3 * height) / 4,
      rightPips,
      HUD.PIP_SIZE
    );
  }

  private drawPips(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    count: number,
    size: number
  ): void {
    ctx.fillStyle = HUD.COLOR_PIP;
    const positions = this.getPipPositions(count, size);

    positions.forEach((pos) => {
      ctx.beginPath();
      ctx.arc(centerX + pos.x, centerY + pos.y, size / 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  private getPipPositions(count: number, spacing: number): PipPosition[] {
    const positions: PipPosition[] = [];
    const offset = spacing / 1.5;

    if (typeof count !== 'number' || !Number.isInteger(count)) {
      console.warn(`Pip count must be an integer. Received: ${count}`);
      return positions;
    }

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
        console.warn(
          `Pip count ${count} not supported. Dominoes typically have 0-6 pips per half.`
        );
        break;
    }

    return positions;
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
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

  updateScore(): void {
    const score = this.gameState.getScore();
    if (this.canvases.score) {
      this.drawScorePanel(this.canvases.score.context, score);
      const sprite = this.sprites[HUD.SPRITE_INDEX_SCORE];
      if (sprite?.material.map) {
        sprite.material.map.needsUpdate = true;
      }
    }
  }

  updateBonePile(): void {
    const bonePileSize = this.gameState.getBonePileSize();
    if (this.canvases.bonePile) {
      this.drawBonePilePanel(this.canvases.bonePile.context, bonePileSize);
      const sprite = this.sprites[HUD.SPRITE_INDEX_BONE_PILE];
      if (sprite?.material.map) {
        sprite.material.map.needsUpdate = true;
      }
    }
  }

  updateProgression(): void {
    const pullsRemaining = this.gameState.getPullsRemaining();
    const totalPulls = this.gameState.getTotalPulls();
    const currentPull = Math.min(totalPulls - pullsRemaining + 1, totalPulls);
    const targetScore = this.gameState.getTargetScore();
    if (this.canvases.progression) {
      this.drawProgressionPanel(
        this.canvases.progression.context,
        currentPull,
        totalPulls,
        targetScore
      );
      const sprite = this.sprites[HUD.SPRITE_INDEX_PROGRESSION];
      if (sprite?.material.map) {
        sprite.material.map.needsUpdate = true;
      }
    }
  }

  updatePassivePool(): void {
    const passivePool = this.gameState.getPassivePool();
    if (this.canvases.passivePool) {
      this.drawPassivePoolPanel(this.canvases.passivePool.context, passivePool);
      const sprite = this.sprites[HUD.SPRITE_INDEX_PASSIVE_POOL];
      if (sprite?.material.map) {
        sprite.material.map.needsUpdate = true;
      }
    }
  }

  updateAll(): void {
    this.updateScore();
    this.updateBonePile();
    this.updateProgression();
    this.updatePassivePool();
  }

  getHUDScene(): THREE.Scene {
    return this.hudScene;
  }

  getHUDCamera(): THREE.OrthographicCamera {
    return this.hudCamera;
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);

    if (this.tooltipElement.parentNode) {
      this.tooltipElement.parentNode.removeChild(this.tooltipElement);
    }

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
