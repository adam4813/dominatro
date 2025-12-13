import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Domino } from './Domino.js';

const BOARD_PADDING = 1; // Extra space around the domino placements

export class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a4d2a);

    this.setupCamera();
    this.setupRenderer();
    this.setupLights();
    this.setupControls();
    this.setupGround();
    this.setupRaycaster();

    // State for interaction
    this.selectedDomino = null;
    this.selectedDominoData = null;
    this.selectedDominoFlipped = false; // Track if selected domino is flipped
    this.hoveredObject = null;
    this.hoveredZone = null; // Track which placement zone is hovered
    this.ghostDomino = null; // Ghost preview of domino at placement zone
    this.rackDominoes = []; // Domino objects in the rack
    this.placementZones = []; // Placement zone objects

    /**
     * Callback invoked when a domino is selected
     * @callback onDominoSelectedCallback
     * @param {Object} dominoData - The data of the selected domino {left, right, type}
     */
    this.onDominoSelectedCallback = null;

    /**
     * Callback invoked when a domino is deselected
     * @callback onDominoDeselectedCallback
     */
    this.onDominoDeselectedCallback = null;

    /**
     * Callback to check if domino can be flipped
     * @callback canFlipDominoCallback
     * @param {Object} dominoData - The domino data
     * @returns {boolean} - True if flip is allowed
     */
    this.canFlipDominoCallback = null;

    /**
     * Callback to get the correct placement orientation for a domino
     * @callback getPlacementOrientationCallback
     * @param {Object} dominoData - The domino data
     * @param {string} side - 'left', 'right', or 'center'
     * @returns {Object} - { left: number, right: number }
     */
    this.getPlacementOrientationCallback = null;

    // Track mouse position for click vs drag detection
    this.mouseDownPosition = null;
    this.isDragging = false;

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

  setupCamera() {
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    // Camera positioned for top-down view (0, 15, 0)
    // This initial position should be maintained as the default view
    this.camera.position.set(0, 15, 0);
    this.camera.lookAt(0, 0, 0);
  }

  setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  setupLights() {
    // Ambient light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    // Directional light for shadows and definition
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

  setupControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Disable rotation
    this.controls.enableRotate = false;

    // Enable panning for both mouse and touch
    this.controls.enablePan = true;
    this.controls.screenSpacePanning = true;

    // Enable zooming for both mouse wheel and pinch
    this.controls.enableZoom = true;

    // Touch controls configuration
    this.controls.touches = {
      ONE: THREE.TOUCH.PAN, // One finger drag to pan
      TWO: THREE.TOUCH.DOLLY_PAN, // Two finger pinch to zoom, drag to pan
    };

    // Damping for smooth controls
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Zoom limits
    this.controls.minDistance = 5;
    this.controls.maxDistance = 30;

    // Initial pan limits (match initial small ground size)
    this.controls.minPan = new THREE.Vector3(-6, 0, -10);
    this.controls.maxPan = new THREE.Vector3(6, 0, 10);
  }

  /**
   * Update camera pan limits based on board width
   * @param {number} minX - Minimum X position on the board
   * @param {number} maxX - Maximum X position on the board
   */
  updatePanLimits(minX, maxX) {
    const padding = 5; // Extra padding beyond the board edges
    this.controls.minPan = new THREE.Vector3(minX - padding, 0, -10);
    this.controls.maxPan = new THREE.Vector3(maxX + padding, 0, 10);
  }

  setupGround() {
    // Create a table/ground surface - start small, ~6 domino widths
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

    // Track ground boundaries to avoid shifting when expanding
    this.groundMinX = -6;
    this.groundMaxX = 6;
  }

  /**
   * Update ground size based on board width
   * Only expands on the side that needs it
   * @param {number} minX - Minimum X position on the board
   * @param {number} maxX - Maximum X position on the board
   */
  updateGroundSize(minX, maxX) {
    const dominoWidth = 2; // Approximate horizontal domino width
    const edgeBuffer = dominoWidth * BOARD_PADDING;

    let needsUpdate = false;
    let newMinX = this.groundMinX;
    let newMaxX = this.groundMaxX;

    // Check if we need to expand left
    if (minX - edgeBuffer < this.groundMinX) {
      newMinX = minX - edgeBuffer; // Add 2 extra to avoid constant resizing
      needsUpdate = true;
    }

    // Check if we need to expand right
    if (maxX + edgeBuffer > this.groundMaxX) {
      newMaxX = maxX + edgeBuffer; // Add 2 extra to avoid constant resizing
      needsUpdate = true;
    }

    if (!needsUpdate) {
      return; // No expansion needed
    }

    // Update boundaries
    this.groundMinX = newMinX;
    this.groundMaxX = newMaxX;

    // Calculate new dimensions
    const newWidth = newMaxX - newMinX;
    const depth = 20; // Keep depth constant
    const centerX = (newMinX + newMaxX) / 2;

    // Remove old ground
    if (this.ground) {
      this.scene.remove(this.ground);
      this.ground.geometry.dispose();
    }

    // Create new ground with updated size
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

  setupRaycaster() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  handleMouseDown(event) {
    // Record mouse position to detect drag vs click
    this.mouseDownPosition = {
      x: event.clientX,
      y: event.clientY,
    };
    this.isDragging = false;
  }

  handleMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Detect if user is dragging (for OrbitControls)
    if (this.mouseDownPosition) {
      const dx = event.clientX - this.mouseDownPosition.x;
      const dy = event.clientY - this.mouseDownPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 5) {
        // 5px threshold
        this.isDragging = true;
      }
    }

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check for placement zone hover (if domino is selected)
    if (this.selectedDomino && this.placementZones.length > 0) {
      const zoneMeshes = this.placementZones.map((z) => z.mesh);
      const zoneIntersects = this.raycaster.intersectObjects(zoneMeshes, false);

      if (zoneIntersects.length > 0) {
        const hoveredZone = this.placementZones.find(
          (z) => z.mesh === zoneIntersects[0].object
        );
        if (hoveredZone !== this.hoveredZone) {
          this.hoveredZone = hoveredZone;
          if (hoveredZone && hoveredZone.isValid) {
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

    // Check for intersections with rack dominoes
    const rackMeshes = this.rackDominoes.map((d) => d.mesh);
    const intersects = this.raycaster.intersectObjects(rackMeshes, true);

    // Reset previous hover state
    if (this.hoveredObject && !this.selectedDomino) {
      this.clearHighlight(this.hoveredObject);
      this.hoveredObject = null;
    }

    // Highlight hovered domino (only if nothing is selected)
    if (intersects.length > 0 && !this.selectedDomino) {
      const hoveredMesh = this.findParentDomino(
        intersects[0].object,
        rackMeshes
      );
      if (hoveredMesh) {
        this.hoveredObject = hoveredMesh;
        this.highlightDomino(hoveredMesh, 0x88ccff, 0.3);
      }
    }
  }

  handleMouseClick(event) {
    // Ignore clicks that are actually drags (from OrbitControls)
    if (this.isDragging) {
      this.isDragging = false;
      this.mouseDownPosition = null;
      return;
    }

    // Update mouse position first
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update raycaster
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Check if clicking on a placement zone
    if (this.selectedDomino && this.placementZones.length > 0) {
      const zoneMeshes = this.placementZones.map((z) => z.mesh);
      const zoneIntersects = this.raycaster.intersectObjects(zoneMeshes, false);

      if (zoneIntersects.length > 0) {
        const clickedZone = this.placementZones.find(
          (z) => z.mesh === zoneIntersects[0].object
        );
        if (clickedZone && clickedZone.onClickCallback) {
          clickedZone.onClickCallback(clickedZone.side, clickedZone.isValid);
        }
        return;
      }
    }

    // Check for clicking on rack dominoes
    const rackMeshes = this.rackDominoes.map((d) => d.mesh);
    const intersects = this.raycaster.intersectObjects(rackMeshes, true);

    if (intersects.length > 0) {
      const clickedMesh = this.findParentDomino(
        intersects[0].object,
        rackMeshes
      );
      if (clickedMesh) {
        this.selectDomino(clickedMesh);
      }
    } else {
      // Clicked on empty space - deselect
      this.deselectDomino();
    }

    // Reset drag tracking
    this.mouseDownPosition = null;
    this.isDragging = false;
  }

  handleKeyDown(event) {
    if (event.key === 'Escape') {
      this.deselectDomino();
    } else if (
      event.key === ' ' &&
      this.selectedDomino &&
      this.selectedDominoData
    ) {
      // Flip the selected domino
      event.preventDefault(); // Prevent page scroll
      this.flipSelectedDomino();
    }
  }

  flipSelectedDomino() {
    if (!this.selectedDominoData) return;

    // Check if flip is allowed
    if (
      this.canFlipDominoCallback &&
      !this.canFlipDominoCallback(this.selectedDominoData)
    ) {
      console.log('Scene: Flip not allowed for this domino placement');
      return;
    }

    // Toggle flipped state
    this.selectedDominoFlipped = !this.selectedDominoFlipped;

    // Swap left and right in the data
    [this.selectedDominoData.left, this.selectedDominoData.right] = [
      this.selectedDominoData.right,
      this.selectedDominoData.left,
    ];

    console.log(
      `Scene: Flipped domino to [${this.selectedDominoData.left}|${this.selectedDominoData.right}]`
    );

    // Notify callback first (for updating placement zones)
    if (this.onDominoSelectedCallback) {
      this.onDominoSelectedCallback(this.selectedDominoData);
    }

    // Then update ghost domino if visible - force re-check of hover
    if (this.hoveredZone) {
      this.updateGhostDomino(this.hoveredZone);
    }
  }

  findParentDomino(object, dominoMeshes) {
    // Traverse up to find the parent domino group
    let current = object;
    while (current) {
      if (dominoMeshes.includes(current)) {
        return current;
      }
      current = current.parent;
    }
    return null;
  }

  selectDomino(dominoMesh) {
    const dominoObj = this.rackDominoes.find((d) => d.mesh === dominoMesh);
    if (!dominoObj) return;

    // Deselect previous domino
    if (this.selectedDomino && this.selectedDomino !== dominoMesh) {
      this.clearHighlight(this.selectedDomino);
    }

    this.selectedDomino = dominoMesh;
    this.selectedDominoData = dominoObj.data;
    this.selectedDominoFlipped = false; // Reset flip state on selection

    // Highlight selected domino
    this.highlightDomino(dominoMesh, 0xffff00, 0.5);

    console.log('Scene: Selected domino:', this.selectedDominoData);

    // Notify callback if set
    if (this.onDominoSelectedCallback) {
      this.onDominoSelectedCallback(dominoObj.data);
    }
  }

  deselectDomino() {
    if (this.selectedDomino) {
      this.clearHighlight(this.selectedDomino);
      this.selectedDomino = null;
      this.selectedDominoData = null;
      this.selectedDominoFlipped = false;

      console.log('Scene: Deselected domino');

      // Clear ghost domino
      this.clearGhostDomino();
      this.hoveredZone = null;

      // Clear placement zones
      this.clearPlacementZones();

      // Notify callback if set
      if (this.onDominoDeselectedCallback) {
        this.onDominoDeselectedCallback();
      }
    }
  }

  highlightDomino(dominoMesh, color, intensity) {
    dominoMesh.traverse((child) => {
      if (child.isMesh && child.material) {
        // Clone material if it's shared (static) to avoid affecting other dominoes
        if (
          child.material === Domino.bodyMaterial ||
          child.material === Domino.lineMaterial ||
          child.material === Domino.pipMaterial
        ) {
          child.material = child.material.clone();
        }

        // Store original material properties if not already stored
        if (!child.userData.originalEmissive) {
          child.userData.originalEmissive = child.material.emissive.clone();
          child.userData.originalEmissiveIntensity =
            child.material.emissiveIntensity || 0;
        }
        child.material.emissive.setHex(color);
        child.material.emissiveIntensity = intensity;
      }
    });
  }

  clearHighlight(dominoMesh) {
    dominoMesh.traverse((child) => {
      if (child.isMesh && child.material && child.userData.originalEmissive) {
        child.material.emissive.copy(child.userData.originalEmissive);
        child.material.emissiveIntensity =
          child.userData.originalEmissiveIntensity;
        // Clean up userData to prevent memory leaks
        delete child.userData.originalEmissive;
        delete child.userData.originalEmissiveIntensity;
      }
    });
  }

  createPlacementZone(side, x, z, isValid, onClickCallback, isDouble = false) {
    // Validate side parameter
    const validSides = ['left', 'right', 'center'];
    if (!validSides.includes(side)) {
      console.error(
        `Scene: Invalid side parameter "${side}". Must be one of: ${validSides.join(', ')}`
      );
      return null;
    }

    // Horizontal orientation for regular dominoes, vertical for doubles
    // Swap dimensions for doubles to show vertical placement
    const geometry = isDouble
      ? new THREE.BoxGeometry(1.5, 0.5, 2.5)
      : new THREE.BoxGeometry(2.5, 0.5, 1.5);
    const color = isValid ? 0x00ff00 : 0xff0000;
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.5,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 0.25, z); // Raised slightly higher
    this.scene.add(mesh);

    const zone = { mesh, side, isValid, onClickCallback };
    this.placementZones.push(zone);

    return zone;
  }

  clearPlacementZones() {
    this.placementZones.forEach((zone) => {
      this.scene.remove(zone.mesh);
      zone.mesh.geometry.dispose();
      zone.mesh.material.dispose();
    });
    this.placementZones = [];
    this.clearGhostDomino();
  }

  /**
   * Update ghost domino preview at placement zone
   * @param {Object} zone - The placement zone being hovered
   */
  updateGhostDomino(zone) {
    if (!this.selectedDominoData || !zone.isValid) {
      this.clearGhostDomino();
      return;
    }

    // Clear existing ghost
    this.clearGhostDomino();

    // Get the correct orientation for placement
    let dominoToShow = { ...this.selectedDominoData };
    if (this.getPlacementOrientationCallback) {
      dominoToShow = this.getPlacementOrientationCallback(
        this.selectedDominoData,
        zone.side
      );
    }

    // Create ghost domino with the correctly oriented pips
    const ghostDomino = new Domino(dominoToShow.left, dominoToShow.right);

    const isDouble = dominoToShow.left === dominoToShow.right;
    const mesh = ghostDomino.getMesh();

    // Position at the zone
    mesh.position.copy(zone.mesh.position);
    mesh.position.y = 0.1; // Same height as placed dominoes

    // Rotate if not a double
    if (!isDouble) {
      mesh.rotation.set(0, Math.PI / 2, 0);
    }

    // Make it semi-transparent
    mesh.traverse((child) => {
      if (child.isMesh && child.material) {
        child.material = child.material.clone();
        child.material.transparent = true;
        child.material.opacity = 0.5;
      }
    });

    this.ghostDomino = { domino: ghostDomino, mesh };
    this.scene.add(mesh);
  }

  /**
   * Clear the ghost domino preview
   */
  clearGhostDomino() {
    if (this.ghostDomino) {
      this.scene.remove(this.ghostDomino.mesh);
      this.ghostDomino.domino.dispose();
      this.ghostDomino = null;
    }
  }

  add(object) {
    this.scene.add(object);
  }

  remove(object) {
    this.scene.remove(object);
  }

  handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  getCanvas() {
    return this.renderer.domElement;
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('mousedown', this.handleMouseDown);
    window.removeEventListener('click', this.handleMouseClick);
    window.removeEventListener('keydown', this.handleKeyDown);
    this.renderer.dispose();
    this.controls.dispose();
    if (this.ground) {
      this.ground.geometry.dispose();
      this.ground.material.dispose();
    }
    this.clearGhostDomino();
    this.clearPlacementZones();
  }
}
