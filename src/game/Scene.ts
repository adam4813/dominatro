import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Domino } from './Domino';
import type {
  DominoData,
  RackDomino,
  PlacementZone,
  GhostDomino,
  PlacementSide,
  DominoSelectedCallback,
  DominoDeselectedCallback,
  CanFlipDominoCallback,
  GetPlacementOrientationCallback,
  PlacementZoneClickCallback,
} from '../types';

const BOARD_PADDING = 1;

/**
 * Manages the Three.js scene, camera, controls, and rendering
 * Acts as a Facade for Three.js scene management
 */
export class Scene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private ground: THREE.Mesh | null = null;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  // HUD rendering
  private hudScene: THREE.Scene | null = null;
  private hudCamera: THREE.OrthographicCamera | null = null;

  // Interaction state
  private selectedDomino: THREE.Group | null = null;
  private selectedDominoData: DominoData | null = null;
  private selectedDominoFlipped: boolean = false;
  private hoveredObject: THREE.Group | null = null;
  private hoveredZone: PlacementZone | null = null;
  private ghostDomino: GhostDomino | null = null;

  // Public for Game class access
  rackDominoes: RackDomino[] = [];
  private placementZones: PlacementZone[] = [];

  // Ground boundaries
  private groundMinX: number = -6;
  private groundMaxX: number = 6;

  // Mouse tracking
  private mouseDownPosition: { x: number; y: number } | null = null;
  private isDragging: boolean = false;

  // Callbacks
  onDominoSelectedCallback: DominoSelectedCallback | null = null;
  onDominoDeselectedCallback: DominoDeselectedCallback | null = null;
  canFlipDominoCallback: CanFlipDominoCallback | null = null;
  getPlacementOrientationCallback: GetPlacementOrientationCallback | null =
    null;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a4d2a);

    this.camera = this.setupCamera();
    this.renderer = this.setupRenderer();
    this.setupLights();
    this.controls = this.setupControls();
    this.setupGround();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.handleResize = this.handleResize.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseClick = this.handleMouseClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('mousedown', this.handleMouseDown);
    window.addEventListener('click', this.handleMouseClick);
    window.addEventListener('keydown', this.handleKeyDown);
  }

  private setupCamera(): THREE.PerspectiveCamera {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 15, 0);
    camera.lookAt(0, 0, 0);
    return camera;
  }

  private setupRenderer(): THREE.WebGLRenderer {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    return renderer;
  }

  private setupLights(): void {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    this.scene.add(directionalLight);
  }

  private setupControls(): OrbitControls {
    const controls = new OrbitControls(this.camera, this.renderer.domElement);

    controls.enableRotate = false;
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.enableZoom = true;

    controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 30;

    // @ts-expect-error - OrbitControls minPan/maxPan are not in types but work
    controls.minPan = new THREE.Vector3(-6, 0, -10);
    // @ts-expect-error - OrbitControls minPan/maxPan are not in types but work
    controls.maxPan = new THREE.Vector3(6, 0, 10);

    return controls;
  }

  updatePanLimits(minX: number, maxX: number): void {
    const padding = 5;
    // @ts-expect-error - OrbitControls minPan/maxPan are not in types but work
    this.controls.minPan = new THREE.Vector3(minX - padding, 0, -10);
    // @ts-expect-error - OrbitControls minPan/maxPan are not in types but work
    this.controls.maxPan = new THREE.Vector3(maxX + padding, 0, 10);
  }

  private setupGround(): void {
    const groundGeometry = new THREE.PlaneGeometry(12, 20);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      roughness: 0.8,
      metalness: 0.2,
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);
  }

  updateGroundSize(minX: number, maxX: number): void {
    const dominoWidth = 2;
    const edgeBuffer = dominoWidth * BOARD_PADDING;

    let needsUpdate = false;
    let newMinX = this.groundMinX;
    let newMaxX = this.groundMaxX;

    if (minX - edgeBuffer < this.groundMinX) {
      newMinX = minX - edgeBuffer - 2;
      needsUpdate = true;
    }

    if (maxX + edgeBuffer > this.groundMaxX) {
      newMaxX = maxX + edgeBuffer + 2;
      needsUpdate = true;
    }

    if (!needsUpdate) return;

    this.groundMinX = newMinX;
    this.groundMaxX = newMaxX;

    const newWidth = newMaxX - newMinX;
    const depth = 20;
    const centerX = (newMinX + newMaxX) / 2;

    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
      (this.ground.material as THREE.Material).dispose();
    }

    const groundGeometry = new THREE.PlaneGeometry(newWidth, depth);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a3a1a,
      roughness: 0.8,
      metalness: 0.2,
    });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.receiveShadow = true;
    this.ground.position.set(centerX, 0, 0);

    this.scene.add(this.ground);
  }

  private handleMouseDown(event: MouseEvent): void {
    this.mouseDownPosition = { x: event.clientX, y: event.clientY };
    this.isDragging = false;
  }

  private handleMouseMove(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    if (this.mouseDownPosition) {
      const dx = event.clientX - this.mouseDownPosition.x;
      const dy = event.clientY - this.mouseDownPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        this.isDragging = true;
      }
    }

    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check for placement zone hover
    if (this.selectedDomino && this.placementZones.length > 0) {
      const zoneMeshes = this.placementZones.map((z) => z.mesh);
      const zoneIntersects = this.raycaster.intersectObjects(zoneMeshes, false);

      if (zoneIntersects.length > 0) {
        const hoveredZone = this.placementZones.find(
          (z) => z.mesh === zoneIntersects[0]?.object
        );
        if (hoveredZone && hoveredZone !== this.hoveredZone) {
          this.hoveredZone = hoveredZone;
          if (hoveredZone.isValid) {
            this.updateGhostDomino(hoveredZone);
          } else {
            this.clearGhostDomino();
          }
        }
      } else {
        if (this.hoveredZone) {
          this.hoveredZone = null;
          this.clearGhostDomino();
        }
      }
    }

    // Check for rack domino hover
    const rackMeshes = this.rackDominoes.map((d) => d.mesh);
    const intersects = this.raycaster.intersectObjects(rackMeshes, true);

    if (this.hoveredObject && !this.selectedDomino) {
      this.clearHighlight(this.hoveredObject);
      this.hoveredObject = null;
    }

    if (intersects.length > 0 && !this.selectedDomino) {
      const hoveredMesh = this.findParentDomino(
        intersects[0]!.object,
        rackMeshes
      );
      if (hoveredMesh) {
        this.hoveredObject = hoveredMesh;
        this.highlightDomino(hoveredMesh, 0x88ccff, 0.3);
      }
    }
  }

  private handleMouseClick(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.mouseDownPosition = null;
      return;
    }

    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check placement zone click
    if (this.selectedDomino && this.placementZones.length > 0) {
      const zoneMeshes = this.placementZones.map((z) => z.mesh);
      const zoneIntersects = this.raycaster.intersectObjects(zoneMeshes, false);

      if (zoneIntersects.length > 0) {
        const clickedZone = this.placementZones.find(
          (z) => z.mesh === zoneIntersects[0]?.object
        );
        if (clickedZone?.onClickCallback) {
          clickedZone.onClickCallback(clickedZone.side, clickedZone.isValid);
        }
        return;
      }
    }

    // Check rack domino click
    const rackMeshes = this.rackDominoes.map((d) => d.mesh);
    const intersects = this.raycaster.intersectObjects(rackMeshes, true);

    if (intersects.length > 0) {
      const clickedMesh = this.findParentDomino(
        intersects[0]!.object,
        rackMeshes
      );
      if (clickedMesh) {
        this.selectDomino(clickedMesh);
      }
    } else {
      this.deselectDomino();
    }

    this.mouseDownPosition = null;
    this.isDragging = false;
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.deselectDomino();
    } else if (
      event.key === ' ' &&
      this.selectedDomino &&
      this.selectedDominoData
    ) {
      event.preventDefault();
      this.flipSelectedDomino();
    }
  }

  private flipSelectedDomino(): void {
    if (!this.selectedDominoData) return;

    if (
      this.canFlipDominoCallback &&
      !this.canFlipDominoCallback(this.selectedDominoData)
    ) {
      console.log('Scene: Flip not allowed for this domino placement');
      return;
    }

    this.selectedDominoFlipped = !this.selectedDominoFlipped;

    this.selectedDominoData = {
      ...this.selectedDominoData,
      left: this.selectedDominoData.right,
      right: this.selectedDominoData.left,
    };

    console.log(
      `Scene: Flipped domino to [${this.selectedDominoData.left}|${this.selectedDominoData.right}]`
    );

    if (this.onDominoSelectedCallback) {
      this.onDominoSelectedCallback(this.selectedDominoData);
    }

    if (this.hoveredZone) {
      this.updateGhostDomino(this.hoveredZone);
    }
  }

  private findParentDomino(
    object: THREE.Object3D,
    dominoMeshes: THREE.Group[]
  ): THREE.Group | null {
    let current: THREE.Object3D | null = object;
    while (current) {
      if (dominoMeshes.includes(current as THREE.Group)) {
        return current as THREE.Group;
      }
      current = current.parent;
    }
    return null;
  }

  private selectDomino(dominoMesh: THREE.Group): void {
    const dominoObj = this.rackDominoes.find((d) => d.mesh === dominoMesh);
    if (!dominoObj) return;

    if (this.selectedDomino && this.selectedDomino !== dominoMesh) {
      this.clearHighlight(this.selectedDomino);
    }

    this.selectedDomino = dominoMesh;
    this.selectedDominoData = dominoObj.data;
    this.selectedDominoFlipped = false;

    this.highlightDomino(dominoMesh, 0xffff00, 0.5);

    console.log('Scene: Selected domino:', this.selectedDominoData);

    if (this.onDominoSelectedCallback) {
      this.onDominoSelectedCallback(dominoObj.data);
    }
  }

  deselectDomino(): void {
    if (this.selectedDomino) {
      this.clearHighlight(this.selectedDomino);
      this.selectedDomino = null;
      this.selectedDominoData = null;
      this.selectedDominoFlipped = false;

      console.log('Scene: Deselected domino');

      this.clearGhostDomino();
      this.hoveredZone = null;
      this.clearPlacementZones();

      if (this.onDominoDeselectedCallback) {
        this.onDominoDeselectedCallback();
      }
    }
  }

  private highlightDomino(
    dominoMesh: THREE.Group,
    color: number,
    intensity: number
  ): void {
    dominoMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;

        if (
          material === Domino.bodyMaterial ||
          material === Domino.lineMaterial ||
          material === Domino.pipMaterial
        ) {
          child.material = material.clone();
        }

        const clonedMaterial = child.material as THREE.MeshStandardMaterial;
        if (!child.userData.originalEmissive) {
          child.userData.originalEmissive = clonedMaterial.emissive.clone();
          child.userData.originalEmissiveIntensity =
            clonedMaterial.emissiveIntensity || 0;
        }
        clonedMaterial.emissive.setHex(color);
        clonedMaterial.emissiveIntensity = intensity;
      }
    });
  }

  private clearHighlight(dominoMesh: THREE.Group): void {
    dominoMesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (child.userData.originalEmissive) {
          material.emissive.copy(child.userData.originalEmissive);
          material.emissiveIntensity = child.userData.originalEmissiveIntensity;
          delete child.userData.originalEmissive;
          delete child.userData.originalEmissiveIntensity;
        }
      }
    });
  }

  createPlacementZone(
    side: PlacementSide,
    x: number,
    z: number,
    isValid: boolean,
    onClickCallback: PlacementZoneClickCallback,
    isDouble: boolean = false
  ): PlacementZone | null {
    const validSides: PlacementSide[] = ['left', 'right', 'center'];
    if (!validSides.includes(side)) {
      console.error(
        `Scene: Invalid side parameter "${side}". Must be one of: ${validSides.join(', ')}`
      );
      return null;
    }

    const geometry = isDouble
      ? new THREE.BoxGeometry(1.5, 0.5, 2.5)
      : new THREE.BoxGeometry(2.5, 0.5, 1.5);
    const color = isValid ? 0x00ff00 : 0xff0000;
    const material = new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0.25, z);
    this.scene.add(mesh);

    const zone: PlacementZone = { mesh, side, isValid, onClickCallback };
    this.placementZones.push(zone);

    return zone;
  }

  clearPlacementZones(): void {
    this.placementZones.forEach((zone) => {
      this.scene.remove(zone.mesh);
      zone.mesh.geometry.dispose();
      (zone.mesh.material as THREE.Material).dispose();
    });
    this.placementZones = [];
    this.clearGhostDomino();
  }

  private updateGhostDomino(zone: PlacementZone): void {
    if (!this.selectedDominoData || !zone.isValid) {
      this.clearGhostDomino();
      return;
    }

    this.clearGhostDomino();

    let dominoToShow = { ...this.selectedDominoData };
    if (this.getPlacementOrientationCallback) {
      dominoToShow = this.getPlacementOrientationCallback(
        this.selectedDominoData,
        zone.side
      );
    }

    const ghostDomino = new Domino(
      dominoToShow.left,
      dominoToShow.right,
      dominoToShow.type
    );
    const isDouble = dominoToShow.left === dominoToShow.right;
    const mesh = ghostDomino.getMesh();

    mesh.position.copy(zone.mesh.position);
    mesh.position.y = 0.1;

    if (!isDouble) {
      mesh.rotation.set(0, Math.PI / 2, 0);
    }

    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        child.material = (child.material as THREE.Material).clone();
        (child.material as THREE.MeshStandardMaterial).transparent = true;
        (child.material as THREE.MeshStandardMaterial).opacity = 0.5;
      }
    });

    this.ghostDomino = { domino: ghostDomino, mesh };
    this.scene.add(mesh);
  }

  private clearGhostDomino(): void {
    if (this.ghostDomino) {
      this.ghostDomino.mesh.traverse((child: THREE.Object3D) => {
        if (child instanceof THREE.Mesh && child.material) {
          const material = child.material as THREE.MeshStandardMaterial;
          if (material.opacity === 0.5) {
            material.dispose();
          }
        }
      });

      this.scene.remove(this.ghostDomino.mesh);
      this.ghostDomino.domino.dispose();
      this.ghostDomino = null;
    }
  }

  add(object: THREE.Object3D): void {
    this.scene.add(object);
  }

  remove(object: THREE.Object3D): void {
    this.scene.remove(object);
  }

  private handleResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render(): void {
    this.controls.update();

    this.renderer.autoClear = true;
    this.renderer.render(this.scene, this.camera);

    if (this.hudScene && this.hudCamera) {
      this.renderer.autoClear = false;
      try {
        this.renderer.render(this.hudScene, this.hudCamera);
      } finally {
        this.renderer.autoClear = true;
      }
    }
  }

  getCanvas(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  setHUD(
    hudScene: THREE.Scene | null,
    hudCamera: THREE.OrthographicCamera | null
  ): void {
    this.hudScene = hudScene;
    this.hudCamera = hudCamera;
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('click', this.handleMouseClick);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.renderer.dispose();
    this.controls.dispose();
    if (this.ground) {
      this.ground.geometry.dispose();
      (this.ground.material as THREE.Material).dispose();
    }
    this.clearGhostDomino();
    this.clearPlacementZones();
  }
}
