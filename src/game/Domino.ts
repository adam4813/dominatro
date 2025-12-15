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

  // Shared materials for special tile types
  static wildMaterial = new THREE.MeshStandardMaterial({
    color: 0xcc99ff,
    emissive: 0x9966ff,
    emissiveIntensity: 0.3,
    roughness: 0.5,
    metalness: 0.1,
  });
  static doublerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffd700,
    emissive: 0xffaa00,
    emissiveIntensity: 0.3,
    roughness: 0.5,
    metalness: 0.1,
  });
  static oddFavorMaterial = new THREE.MeshStandardMaterial({
    color: 0xff6b6b,
    emissive: 0xff4444,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.1,
  });
  static spinnerMaterial = new THREE.MeshStandardMaterial({
    color: 0x4ecdc4,
    emissive: 0x2fa89f,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.1,
  });
  static crusherMaterial = new THREE.MeshStandardMaterial({
    color: 0x6c5ce7,
    emissive: 0x5545b8,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.1,
  });
  static cheaterMaterial = new THREE.MeshStandardMaterial({
    color: 0xfd79a8,
    emissive: 0xfc5c9c,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.1,
  });
  static thiefMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d3436,
    emissive: 0x636e72,
    emissiveIntensity: 0.3,
    roughness: 0.5,
    metalness: 0.1,
  });
  static blankSlateMaterial = new THREE.MeshStandardMaterial({
    color: 0xdfe6e9,
    emissive: 0xb2bec3,
    emissiveIntensity: 0.2,
    roughness: 0.5,
    metalness: 0.1,
  });

  // Shared geometries and materials for type marker
  static markerGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.05, 8);
  static markerMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xffffff,
    emissiveIntensity: 0.5,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Shared geometries and materials for X symbol
  static xLineGeometry = new THREE.BoxGeometry(0.06, 0.05, 0.4);
  static xLineMaterial = new THREE.MeshStandardMaterial({
    color: 0x222222,
    metalness: 0.3,
    roughness: 0.5,
  });

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
    switch (this.type) {
      case 'standard':
        return Domino.bodyMaterial;
      case 'wild':
        return Domino.wildMaterial;
      case 'doubler':
        return Domino.doublerMaterial;
      case 'odd-favor':
        return Domino.oddFavorMaterial;
      case 'spinner':
        return Domino.spinnerMaterial;
      case 'crusher':
        return Domino.crusherMaterial;
      case 'cheater':
        return Domino.cheaterMaterial;
      case 'thief':
        return Domino.thiefMaterial;
      case 'blank-slate':
        return Domino.blankSlateMaterial;
      default:
        return Domino.bodyMaterial;
    }
  }

  /**
   * Add a visual marker to indicate special tile type
   */
  private addTypeMarker(
    group: THREE.Group,
    _width: number,
    depth: number
  ): void {
    // Use shared geometry and material
    const marker = new THREE.Mesh(Domino.markerGeometry, Domino.markerMaterial);
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
    _dominoWidth: number,
    dominoDepth: number
  ): void {
    // Use shared geometry and material
    // First diagonal line (\)
    const line1 = new THREE.Mesh(Domino.xLineGeometry, Domino.xLineMaterial);
    line1.position.set(0, dominoDepth / 2 + 0.025, zPosition);
    line1.rotation.set(0, Math.PI / 4, 0);
    line1.castShadow = true;
    group.add(line1);

    // Second diagonal line (/)
    const line2 = new THREE.Mesh(Domino.xLineGeometry, Domino.xLineMaterial);
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
    Domino.wildMaterial?.dispose();
    Domino.doublerMaterial?.dispose();
    Domino.oddFavorMaterial?.dispose();
    Domino.spinnerMaterial?.dispose();
    Domino.crusherMaterial?.dispose();
    Domino.cheaterMaterial?.dispose();
    Domino.thiefMaterial?.dispose();
    Domino.blankSlateMaterial?.dispose();
    Domino.markerGeometry?.dispose();
    Domino.markerMaterial?.dispose();
    Domino.xLineGeometry?.dispose();
    Domino.xLineMaterial?.dispose();
  }
}
