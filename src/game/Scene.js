import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class Scene {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x2a4d2a);

    this.setupCamera();
    this.setupRenderer();
    this.setupLights();
    this.setupControls();
    this.setupGround();

    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
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
  }

  setupGround() {
    // Create a table/ground surface
    const groundGeometry = new THREE.PlaneGeometry(20, 20);
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

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  destroy() {
    window.removeEventListener('resize', this.handleResize);
    this.renderer.dispose();
    this.controls.dispose();
    if (this.ground) {
      this.ground.geometry.dispose();
      this.ground.material.dispose();
    }
  }
}
