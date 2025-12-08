import * as THREE from 'three';

export class Domino {
  constructor(leftPips, rightPips) {
    this.leftPips = leftPips;
    this.rightPips = rightPips;
    this.mesh = this.createDomino();
  }

  createDomino() {
    const group = new THREE.Group();

    // Domino dimensions
    const width = 1;
    const height = 2;
    const depth = 0.2;

    // Create the main body of the domino
    const bodyGeometry = new THREE.BoxGeometry(width, depth, height);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5dc,
      roughness: 0.5,
      metalness: 0.1,
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Create the dividing line in the middle
    const lineGeometry = new THREE.BoxGeometry(
      width + 0.02,
      depth + 0.02,
      0.02
    );
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
    });
    const line = new THREE.Mesh(lineGeometry, lineMaterial);
    group.add(line);

    // Add pips to the left half
    this.addPips(group, this.leftPips, -height / 4, width, depth);

    // Add pips to the right half
    this.addPips(group, this.rightPips, height / 4, width, depth);

    return group;
  }

  addPips(group, count, zPosition, dominoWidth, dominoDepth) {
    const pipRadius = 0.08;
    const pipGeometry = new THREE.SphereGeometry(pipRadius, 16, 16);
    const pipMaterial = new THREE.MeshStandardMaterial({
      color: 0x222222,
    });

    const spacing = 0.25;

    // Define pip positions based on count (0-6)
    const pipPositions = this.getPipPositions(count, spacing);

    pipPositions.forEach((pos) => {
      const pip = new THREE.Mesh(pipGeometry, pipMaterial);
      pip.position.set(
        pos.x,
        dominoDepth / 2 + pipRadius / 2,
        zPosition + pos.y
      );
      pip.castShadow = true;
      group.add(pip);
    });
  }

  getPipPositions(count, spacing) {
    // Returns positions for pips based on standard domino patterns
    const positions = [];

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

  setPosition(x, y, z) {
    this.mesh.position.set(x, y, z);
  }

  setRotation(x, y, z) {
    this.mesh.rotation.set(x, y, z);
  }

  getMesh() {
    return this.mesh;
  }
}
