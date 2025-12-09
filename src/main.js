import './style.css';
import { Scene } from './game/Scene.js';
import { Board } from './game/Board.js';

class Game {
  constructor() {
    this.scene = new Scene();
    this.board = new Board(this.scene);
    this.init();
  }

  init() {
    // Add canvas to DOM
    const app = document.querySelector('#app');
    app.appendChild(this.scene.getCanvas());

    // Start animation loop
    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.scene.render();
  }
}

// Store game instance for later access (cleanup, testing, etc.)
// Note: This will be null until DOMContentLoaded event fires
let gameInstance = null;

// Initialize the game when the page loads
window.addEventListener('DOMContentLoaded', () => {
  gameInstance = new Game();
});

export { gameInstance };
