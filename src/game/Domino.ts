import * as THREE from 'three';
import type { PipPosition } from '../types';

/**
 * Visual representation of a domino tile using Three.js
 * Uses shared geometries and materials for memory efficiency (Flyweight pattern)
 */
export class Domino {
  // Static shared geometries and materials for memory efficiency
  static bodyGeometry = new THREE.BoxGeometry(1, 0.2, 2);
  static bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xf5f5dc,
    roughness: 0.5,
    metalness: 0.1,
  });
  static lineGeometry = new THREE.BoxGeometry(1.02, 0.22, 0.02);
  static lineMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
  static pipGeometry = new THREE.SphereGeometry(0.08, 16, 16);
  static pipMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });

  readonly leftPips: number;
  readonly rightPips: number;
  private mesh: THREE.Group;

  constructor(leftPips: number, rightPips: number) {
    this.leftPips = leftPips;
    this.rightPips = rightPips;
    this.mesh = this.createDomino();
  }

  private createDomino(): THREE.Group {
    const group = new THREE.Group();

    // Domino dimensions
    const width = 1;
    const height = 2;
    const depth = 0.2;

    // Create the main body of the domino using shared geometry and material
    const body = new THREE.Mesh(Domino.bodyGeometry, Domino.bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Create the dividing line in the middle using shared geometry and material
    const line = new THREE.Mesh(Domino.lineGeometry, Domino.lineMaterial);
    group.add(line);

    // Add pips to the left half
    this.addPips(group, this.leftPips, -height / 4, width, depth);

    // Add pips to the right half
    this.addPips(group, this.rightPips, height / 4, width, depth);

    return group;
  }

  private addPips(
    group: THREE.Group,
    count: number,
    zPosition: number,
    _dominoWidth: number,
    dominoDepth: number
  ): void {
    const pipRadius = 0.08;
    const spacing = 0.25;

    // Define pip positions based on count (0-6)
    const pipPositions = this.getPipPositions(count, spacing);

    pipPositions.forEach((pos) => {
      // Use shared geometry and material
      const pip = new THREE.Mesh(Domino.pipGeometry, Domino.pipMaterial);
      pip.position.set(
        pos.x,
        dominoDepth / 2 + pipRadius / 2,
        zPosition + pos.y
      );
      pip.castShadow = true;
      group.add(pip);
    });
  }

  private getPipPositions(count: number, spacing: number): PipPosition[] {
    // Returns positions for pips based on standard domino patterns
    const positions: PipPosition[] = [];

    switch (count) {
      case 0:
        // No pips
        break;
      case 1:
        // Center
        positions.push({ x: 0, y: 0 });
        break;
      case 2:
        // Diagonal
        positions.push({ x: -spacing, y: -spacing });
        positions.push({ x: spacing, y: spacing });
        break;
      case 3:
        // Diagonal with center
        positions.push({ x: -spacing, y: -spacing });
        positions.push({ x: 0, y: 0 });
        positions.push({ x: spacing, y: spacing });
        break;
      case 4:
        // Four corners
        positions.push({ x: -spacing, y: -spacing });
        positions.push({ x: spacing, y: -spacing });
        positions.push({ x: -spacing, y: spacing });
        positions.push({ x: spacing, y: spacing });
        break;
      case 5:
        // Four corners with center
        positions.push({ x: -spacing, y: -spacing });
        positions.push({ x: spacing, y: -spacing });
        positions.push({ x: 0, y: 0 });
        positions.push({ x: -spacing, y: spacing });
        positions.push({ x: spacing, y: spacing });
        break;
      case 6:
        // Two columns of three
        positions.push({ x: -spacing, y: -spacing });
        positions.push({ x: -spacing, y: 0 });
        positions.push({ x: -spacing, y: spacing });
        positions.push({ x: spacing, y: -spacing });
        positions.push({ x: spacing, y: 0 });
        positions.push({ x: spacing, y: spacing });
        break;
    }

    return positions;
  }

  setPosition(x: number, y: number, z: number): void {
    this.mesh.position.set(x, y, z);
  }

  setRotation(x: number, y: number, z: number): void {
    this.mesh.rotation.set(x, y, z);
  }

  getMesh(): THREE.Group {
    return this.mesh;
  }

  dispose(): void {
    // Since we're using shared geometries and materials, we don't dispose them here
    // The mesh will be garbage collected after being removed from the scene
    // Individual domino instances don't own the shared resources
  }

  // Static method to dispose shared resources when completely done with all dominoes
  static disposeSharedResources(): void {
    Domino.bodyGeometry?.dispose();
    Domino.bodyMaterial?.dispose();
    Domino.lineGeometry?.dispose();
    Domino.lineMaterial?.dispose();
    Domino.pipGeometry?.dispose();
    Domino.pipMaterial?.dispose();
  }
}
