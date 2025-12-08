import { Domino } from './Domino.js';

export class Board {
  constructor(scene) {
    this.scene = scene;
    this.dominoes = [];
    this.initializeSampleDominoes();
  }

  initializeSampleDominoes() {
    // Create a few sample dominoes to demonstrate the rendering
    const sampleDominoes = [
      { left: 6, right: 6, x: -4, z: 0 },
      { left: 5, right: 4, x: -2, z: 0 },
      { left: 3, right: 2, x: 0, z: 0 },
      { left: 2, right: 1, x: 2, z: 0 },
      { left: 1, right: 0, x: 4, z: 0 },
    ];

    sampleDominoes.forEach((data) => {
      this.addDomino(data.left, data.right, data.x, data.z);
    });
  }

  addDomino(leftPips, rightPips, x, z) {
    const domino = new Domino(leftPips, rightPips);
    domino.setPosition(x, 0.1, z);
    this.dominoes.push(domino);
    this.scene.add(domino.getMesh());
    return domino;
  }

  removeDomino(domino) {
    const index = this.dominoes.indexOf(domino);
    if (index > -1) {
      this.dominoes.splice(index, 1);
      this.scene.remove(domino.getMesh());
    }
  }

  getDominoes() {
    return this.dominoes;
  }

  clear() {
    this.dominoes.forEach((domino) => {
      this.scene.remove(domino.getMesh());
    });
    this.dominoes = [];
  }
}
