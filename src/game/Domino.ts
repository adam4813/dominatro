import * as THREE from 'three';
import type { PipPosition, DominoType } from '../types';
import { SPECIAL_TILE_PIP_VALUE } from '../types';

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
  readonly type: DominoType;
  private mesh: THREE.Group;

  constructor(
    leftPips: number,
    rightPips: number,
    type: DominoType = 'standard'
  ) {
    this.leftPips = leftPips;
    this.rightPips = rightPips;
    this.type = type;
    this.mesh = this.createDomino();
  }

  private createDomino(): THREE.Group {
    const group = new THREE.Group();

    // Domino dimensions
    const width = 1;
    const height = 2;
    const depth = 0.2;

    // Get body material based on tile type
    const bodyMaterial = this.getBodyMaterial();

    // Create the main body of the domino
    const body = new THREE.Mesh(Domino.bodyGeometry, bodyMaterial);
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

    // Add special marker for non-standard tiles
    if (this.type !== 'standard') {
      this.addTypeMarker(group, width, depth);
    }

    return group;
  }

  /**
   * Get body material based on tile type with unique colors
   */
  private getBodyMaterial(): THREE.Material {
    if (this.type === 'standard') {
      return Domino.bodyMaterial;
    }

    // Clone and customize material for special types
    const material = Domino.bodyMaterial.clone();

    switch (this.type) {
      case 'wild':
        material.color.setHex(0xcc99ff); // Purple
        material.emissive.setHex(0x9966ff);
        material.emissiveIntensity = 0.3;
        break;
      case 'doubler':
        material.color.setHex(0xffd700); // Gold
        material.emissive.setHex(0xffaa00);
        material.emissiveIntensity = 0.3;
        break;
      case 'odd-favor':
        material.color.setHex(0xff6b6b); // Red
        material.emissive.setHex(0xff4444);
        material.emissiveIntensity = 0.2;
        break;
      case 'spinner':
        material.color.setHex(0x4ecdc4); // Teal
        material.emissive.setHex(0x2fa89f);
        material.emissiveIntensity = 0.2;
        break;
      case 'crusher':
        material.color.setHex(0x6c5ce7); // Blue-Purple
        material.emissive.setHex(0x5545b8);
        material.emissiveIntensity = 0.2;
        break;
      case 'cheater':
        material.color.setHex(0xfd79a8); // Pink
        material.emissive.setHex(0xfc5c9c);
        material.emissiveIntensity = 0.2;
        break;
      case 'thief':
        material.color.setHex(0x2d3436); // Dark Gray
        material.emissive.setHex(0x636e72);
        material.emissiveIntensity = 0.3;
        break;
      case 'blank-slate':
        material.color.setHex(0xdfe6e9); // Light Gray
        material.emissive.setHex(0xb2bec3);
        material.emissiveIntensity = 0.2;
        break;
    }

    return material;
  }

  /**
   * Add a visual marker to indicate special tile type
   */
  private addTypeMarker(
    group: THREE.Group,
    width: number,
    depth: number
  ): void {
    // Create a small icon/emblem on the tile
    const markerGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8);
    const markerMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xffffff,
      emissiveIntensity: 0.5,
      metalness: 0.8,
      roughness: 0.2,
    });

    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
    marker.position.set(0, depth / 2 + 0.025, 0);
    marker.rotation.x = Math.PI / 2;
    marker.castShadow = true;
    group.add(marker);
  }

  private addPips(
    group: THREE.Group,
    count: number,
    zPosition: number,
    dominoWidth: number,
    dominoDepth: number
  ): void {
    // Special tiles (with pip value -1) show X symbol instead of pips
    if (count === SPECIAL_TILE_PIP_VALUE) {
      this.addXSymbol(group, zPosition, dominoWidth, dominoDepth);
      return;
    }

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

  /**
   * Add an X symbol for special tiles instead of pips
   */
  private addXSymbol(
    group: THREE.Group,
    zPosition: number,
    dominoWidth: number,
    dominoDepth: number
  ): void {
    const lineThickness = 0.06;
    const lineLength = 0.4;
    const lineGeometry = new THREE.BoxGeometry(lineThickness, 0.05, lineLength);
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
      metalness: 0.3,
      roughness: 0.5,
    });

    // First diagonal line (\)
    const line1 = new THREE.Mesh(lineGeometry, lineMaterial);
    line1.position.set(0, dominoDepth / 2 + 0.025, zPosition);
    line1.rotation.set(0, Math.PI / 4, 0);
    line1.castShadow = true;
    group.add(line1);

    // Second diagonal line (/)
    const line2 = new THREE.Mesh(lineGeometry, lineMaterial);
    line2.position.set(0, dominoDepth / 2 + 0.025, zPosition);
    line2.rotation.set(0, -Math.PI / 4, 0);
    line2.castShadow = true;
    group.add(line2);
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
