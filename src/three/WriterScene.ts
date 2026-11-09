import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

// Pre-allocated scratch objects to prevent garbage collection inside render loop
const _vec3 = new THREE.Vector3();
const _targetCamPos = new THREE.Vector3();
const _targetLookAt = new THREE.Vector3();

export type CameraPreset = 'desk' | 'typewriter' | 'window' | 'epiphany';

export interface WriterSceneOptions {
  onEpiphanyClick?: (index: number) => void;
}

export class WriterScene {
  private container: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private isSoftwareGl: boolean;
  private frameId: number = 0;
  private clock: THREE.Clock;
  private isDisposed: boolean = false;

  // Camera damping targets
  private currentLookAt: THREE.Vector3 = new THREE.Vector3(0, 0.4, 0);
  private targetLookAt: THREE.Vector3 = new THREE.Vector3(0, 0.4, 0);
  private targetCamPos: THREE.Vector3 = new THREE.Vector3(0, 2.2, 2.6);
  private camPreset: CameraPreset = 'desk';

  // Dynamic objects for animations
  private typewriterGroup: THREE.Group = new THREE.Group();
  private carriageGroup: THREE.Group = new THREE.Group();
  private strikerHammer: THREE.Mesh | null = null;
  private paperMesh: THREE.Mesh | null = null;
  private paperTexture: THREE.CanvasTexture | null = null;
  private paperCanvas: HTMLCanvasElement | null = null;
  private paperCtx: CanvasRenderingContext2D | null = null;
  private candleLight: THREE.PointLight | null = null;
  private lampLight: THREE.PointLight | null = null;
  private steamParticles: THREE.Points | null = null;
  private floatingPapers: THREE.Mesh[] = [];
  private epiphanyOrbs: THREE.Mesh[] = [];
  private rainParticles: THREE.Points | null = null;
  private typewriterKeys: THREE.Mesh[] = [];

  // Interaction & Raycasting
  private raycaster: THREE.Raycaster = new THREE.Raycaster();
  private mousePos: THREE.Vector2 = new THREE.Vector2();
  private onEpiphanyClickCb?: (index: number) => void;

  // Typewriter state
  private carriageX: number = 0;
  private strikerAnim: number = 0; // 0 = rested, 1 = striking
  private textBuffer: string = 'In the quiet between two breaths, the clock chimed three...';

  constructor(container: HTMLElement, options?: WriterSceneOptions) {
    this.container = container;
    this.onEpiphanyClickCb = options?.onEpiphanyClick;
    this.clock = new THREE.Clock();

    // 1. Detect software WebGL renderer safely
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Initialize renderer with tone mapping
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // 3. Scene & Camera setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0c10);
    this.scene.fog = new THREE.FogExp2(0x0a0c10, 0.08);

    this.camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      50
    );
    this.camera.position.set(0, 2.2, 2.6);
    this.camera.lookAt(this.currentLookAt);

    // 4. Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    this.setupLighting();
    this.buildWorld();
    this.buildTypewriter();
    this.buildDeskAccessories();
    this.buildFloatingMindscape();
    this.buildWindowRain();

    this.bindEvents();
    this.startLoop();
  }

  private setupLighting() {
    // Soft cool ambient fill
    const hemiLight = new THREE.HemisphereLight(0x3a4b60, 0x1a1410, 0.85);
    this.scene.add(hemiLight);

    // Moonlight through window (directional rim/key from behind-left)
    const moonLight = new THREE.DirectionalLight(0x7a9ec2, 1.2);
    moonLight.position.set(-4, 5, -2);
    moonLight.castShadow = !this.isSoftwareGl;
    if (moonLight.castShadow) {
      moonLight.shadow.mapSize.width = 1024;
      moonLight.shadow.mapSize.height = 1024;
      moonLight.shadow.bias = -0.0005;
      moonLight.shadow.camera.near = 1;
      moonLight.shadow.camera.far = 15;
      const d = 3.5;
      moonLight.shadow.camera.left = -d;
      moonLight.shadow.camera.right = d;
      moonLight.shadow.camera.top = d;
      moonLight.shadow.camera.bottom = -d;
    }
    this.scene.add(moonLight);

    // Banker's Lamp warm pool of light
    this.lampLight = new THREE.PointLight(0xffdf99, 2.6, 4.5, 1.2);
    this.lampLight.position.set(-0.75, 1.25, -0.15);
    this.lampLight.castShadow = !this.isSoftwareGl;
    if (this.lampLight.castShadow) {
      this.lampLight.shadow.bias = -0.001;
      this.lampLight.shadow.mapSize.width = 1024;
      this.lampLight.shadow.mapSize.height = 1024;
    }
    this.scene.add(this.lampLight);

    // Candle flame flickering warm point light
    this.candleLight = new THREE.PointLight(0xff9533, 1.1, 2.8, 1.5);
    this.candleLight.position.set(0.85, 0.65, 0.25);
    this.scene.add(this.candleLight);
  }

  /**
   * Procedural textures generator
   */
  private createWoodTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich dark walnut wood base
    ctx.fillStyle = '#261b14';
    ctx.fillRect(0, 0, 512, 512);

    // Wood rings and grain
    for (let i = 0; i < 300; i++) {
      ctx.strokeStyle = i % 2 === 0 ? 'rgba(56, 38, 27, 0.45)' : 'rgba(20, 13, 9, 0.55)';
      ctx.lineWidth = 1 + Math.random() * 2.5;
      ctx.beginPath();
      const y = Math.random() * 512;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(
        150, y + (Math.random() - 0.5) * 35,
        350, y + (Math.random() - 0.5) * 35,
        512, y + (Math.random() - 0.5) * 20
      );
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  private buildWorld() {
    // 1. The Walnut Writing Desk (Composite 4-part: tabletop, chamfer rim, brass corners, legs)
    const deskGroup = new THREE.Group();
    const woodTexture = this.createWoodTexture();

    const deskMat = new THREE.MeshStandardMaterial({
      color: 0x422e23,
      map: woodTexture,
      roughness: 0.35,
      metalness: 0.1,
    });

    // Main top slab
    const topGeo = new THREE.BoxGeometry(3.2, 0.1, 1.8);
    const deskTop = new THREE.Mesh(topGeo, deskMat);
    deskTop.position.set(0, 0, 0);
    deskTop.receiveShadow = !this.isSoftwareGl;
    deskTop.castShadow = !this.isSoftwareGl;
    deskGroup.add(deskTop);

    // Green leather writing pad (inlaid blotter)
    const blotterGeo = new THREE.BoxGeometry(1.6, 0.015, 1.05);
    const blotterMat = new THREE.MeshStandardMaterial({
      color: 0x1f3427,
      roughness: 0.8,
      metalness: 0.05,
    });
    const blotter = new THREE.Mesh(blotterGeo, blotterMat);
    blotter.position.set(0, 0.055, 0.1);
    blotter.receiveShadow = !this.isSoftwareGl;
    deskGroup.add(blotter);

    // Brass corner brackets on blotter
    const cornerMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.9,
      roughness: 0.25,
    });
    const cornerOffsets = [
      [-0.78, 0.06, -0.4],
      [0.78, 0.06, -0.4],
      [-0.78, 0.06, 0.6],
      [0.78, 0.06, 0.6],
    ];
    cornerOffsets.forEach(([cx, cy, cz]) => {
      const corner = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, 0.06), cornerMat);
      corner.position.set(cx, cy, cz);
      deskGroup.add(corner);
    });

    // Desk contact shadow on floor plane
    const shadowGeo = new THREE.PlaneGeometry(3.6, 2.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x050608,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const floorShadow = new THREE.Mesh(shadowGeo, shadowMat);
    floorShadow.rotation.x = -Math.PI / 2;
    floorShadow.position.set(0, -1.2, 0);
    this.scene.add(floorShadow);

    this.scene.add(deskGroup);

    // Back wall with wainscoting paneling
    const wallGeo = new THREE.PlaneGeometry(16, 10);
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x121720,
      roughness: 0.9,
      metalness: 0.1,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 2.5, -2.2);
    this.scene.add(backWall);
  }

  /**
   * Builds the antique mechanical typewriter (10+ composite parts)
   */
  private buildTypewriter() {
    this.typewriterGroup = new THREE.Group();
    this.typewriterGroup.position.set(0, 0.06, 0.15);

    // Materials
    const blackEnamelMat = new THREE.MeshStandardMaterial({
      color: 0x16171b,
      roughness: 0.3,
      metalness: 0.6,
    });

    const polishedBrassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.2,
      metalness: 0.95,
    });

    const chromeSteelMat = new THREE.MeshStandardMaterial({
      color: 0xc8cdd4,
      roughness: 0.25,
      metalness: 0.9,
    });

    const rubberMat = new THREE.MeshStandardMaterial({
      color: 0x222225,
      roughness: 0.85,
      metalness: 0.05,
    });

    // 1. Cast-iron Chassis (tapered base)
    const baseGeo = new THREE.BoxGeometry(0.68, 0.08, 0.55);
    const baseMesh = new THREE.Mesh(baseGeo, blackEnamelMat);
    baseMesh.position.set(0, 0.04, 0);
    baseMesh.castShadow = !this.isSoftwareGl;
    this.typewriterGroup.add(baseMesh);

    // Sloped keyboard well
    const wellGeo = new THREE.BoxGeometry(0.64, 0.06, 0.28);
    const wellMesh = new THREE.Mesh(wellGeo, blackEnamelMat);
    wellMesh.rotation.x = 0.22;
    wellMesh.position.set(0, 0.05, 0.14);
    this.typewriterGroup.add(wellMesh);

    // 2. Brass Logo Plaque ("HERMES // OPUS")
    const plaqueGeo = new THREE.BoxGeometry(0.24, 0.025, 0.005);
    const plaqueMesh = new THREE.Mesh(plaqueGeo, polishedBrassMat);
    plaqueMesh.position.set(0, 0.082, -0.16);
    this.typewriterGroup.add(plaqueMesh);

    // 3. Circular Keycaps array (3 rows of vintage typewriter keys)
    const keyGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.012, 16);
    const keyRimGeo = new THREE.TorusGeometry(0.016, 0.0025, 8, 16);

    for (let row = 0; row < 3; row++) {
      const keysInRow = 10 - row;
      const zOffset = 0.06 + row * 0.055;
      const yOffset = 0.09 - row * 0.02;
      const startX = -((keysInRow - 1) * 0.052) / 2;

      for (let k = 0; k < keysInRow; k++) {
        const xOffset = startX + k * 0.052;
        const keyGroup = new THREE.Group();
        keyGroup.position.set(xOffset, yOffset, zOffset);

        const keyCap = new THREE.Mesh(keyGeo, blackEnamelMat);
        const keyRim = new THREE.Mesh(keyRimGeo, polishedBrassMat);
        keyRim.rotation.x = Math.PI / 2;

        keyGroup.add(keyCap);
        keyGroup.add(keyRim);
        this.typewriterGroup.add(keyGroup);
        this.typewriterKeys.push(keyCap);
      }
    }

    // Spacebar
    const spaceGeo = new THREE.BoxGeometry(0.32, 0.015, 0.028);
    const spaceMesh = new THREE.Mesh(spaceGeo, polishedBrassMat);
    spaceMesh.position.set(0, 0.035, 0.23);
    this.typewriterGroup.add(spaceMesh);

    // 4. Typebar Basket (semi-circular radial steel strikers)
    const basketArc = new THREE.Group();
    basketArc.position.set(0, 0.09, -0.05);

    for (let b = 0; b < 14; b++) {
      const angle = -Math.PI * 0.4 + (b / 13) * Math.PI * 0.8;
      const barGeo = new THREE.BoxGeometry(0.004, 0.006, 0.12);
      const barMesh = new THREE.Mesh(barGeo, chromeSteelMat);
      barMesh.rotation.y = angle;
      barMesh.position.set(Math.sin(angle) * 0.06, 0, Math.cos(angle) * 0.06);
      basketArc.add(barMesh);
    }
    this.typewriterGroup.add(basketArc);

    // Active animated striker hammer (hits the platen during typing)
    const hammerGeo = new THREE.BoxGeometry(0.008, 0.008, 0.14);
    this.strikerHammer = new THREE.Mesh(hammerGeo, chromeSteelMat);
    this.strikerHammer.position.set(0, 0.1, -0.06);
    this.strikerHammer.rotation.x = 0.4;
    this.typewriterGroup.add(this.strikerHammer);

    // 5. Twin Ribbon Spools with two-tone ribbon
    const spoolGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 24);
    const leftSpool = new THREE.Mesh(spoolGeo, blackEnamelMat);
    leftSpool.position.set(-0.22, 0.1, -0.04);
    const rightSpool = new THREE.Mesh(spoolGeo, blackEnamelMat);
    rightSpool.position.set(0.22, 0.1, -0.04);

    const spoolCapGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.025, 16);
    const leftCap = new THREE.Mesh(spoolCapGeo, polishedBrassMat);
    leftCap.position.copy(leftSpool.position);
    const rightCap = new THREE.Mesh(spoolCapGeo, polishedBrassMat);
    rightCap.position.copy(rightSpool.position);

    this.typewriterGroup.add(leftSpool, rightSpool, leftCap, rightCap);

    // 6. The Movable Carriage & Platen Assembly
    this.carriageGroup = new THREE.Group();
    this.carriageGroup.position.set(0, 0.14, -0.15);

    // Carriage base rail
    const railGeo = new THREE.BoxGeometry(0.82, 0.02, 0.08);
    const railMesh = new THREE.Mesh(railGeo, chromeSteelMat);
    this.carriageGroup.add(railMesh);

    // Platen Roller (main black rubber cylinder)
    const platenGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.72, 24);
    const platenMesh = new THREE.Mesh(platenGeo, rubberMat);
    platenMesh.rotation.z = Math.PI / 2;
    platenMesh.position.set(0, 0.035, 0);
    this.carriageGroup.add(platenMesh);

    // Chrome knobs at ends of platen
    const knobGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.03, 16);
    const leftKnob = new THREE.Mesh(knobGeo, chromeSteelMat);
    leftKnob.rotation.z = Math.PI / 2;
    leftKnob.position.set(-0.38, 0.035, 0);
    const rightKnob = new THREE.Mesh(knobGeo, chromeSteelMat);
    rightKnob.rotation.z = Math.PI / 2;
    rightKnob.position.set(0.38, 0.035, 0);
    this.carriageGroup.add(leftKnob, rightKnob);

    // Carriage Return Lever
    const leverGeo = new THREE.BoxGeometry(0.01, 0.12, 0.015);
    const leverMesh = new THREE.Mesh(leverGeo, chromeSteelMat);
    leverMesh.rotation.z = -0.4;
    leverMesh.position.set(-0.36, 0.1, 0.04);
    this.carriageGroup.add(leverMesh);

    // 7. Typed Manuscript Paper in Roller with real dynamic canvas text!
    this.paperCanvas = document.createElement('canvas');
    this.paperCanvas.width = 512;
    this.paperCanvas.height = 720;
    this.paperCtx = this.paperCanvas.getContext('2d')!;
    this.updatePaperTexture();

    this.paperTexture = new THREE.CanvasTexture(this.paperCanvas);
    this.paperTexture.colorSpace = THREE.SRGBColorSpace;

    const paperMat = new THREE.MeshStandardMaterial({
      map: this.paperTexture,
      roughness: 0.9,
      metalness: 0.0,
      side: THREE.DoubleSide,
    });

    const paperGeo = new THREE.PlaneGeometry(0.48, 0.65);
    this.paperMesh = new THREE.Mesh(paperGeo, paperMat);
    this.paperMesh.rotation.x = -0.35;
    this.paperMesh.position.set(0, 0.22, -0.06);
    this.carriageGroup.add(this.paperMesh);

    this.typewriterGroup.add(this.carriageGroup);
    this.scene.add(this.typewriterGroup);
  }

  /**
   * Updates the 3D typewriter paper with dynamic live ink lines!
   */
  public updatePaperTexture(customText?: string) {
    if (!this.paperCanvas || !this.paperCtx) return;
    const ctx = this.paperCtx;
    const w = this.paperCanvas.width;
    const h = this.paperCanvas.height;

    // Aged cream parchment background
    ctx.fillStyle = '#f6f1e6';
    ctx.fillRect(0, 0, w, h);

    // Subtle paper grain
    ctx.fillStyle = 'rgba(180, 160, 130, 0.08)';
    for (let i = 0; i < 400; i++) {
      ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }

    // Typed text header
    ctx.fillStyle = '#1c1b19';
    ctx.font = 'bold 18px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('— CHAPTER DRAFT —', w / 2, 60);

    // Typed lines
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'left';
    const textToRender = customText || this.textBuffer;
    const words = textToRender.split(' ');
    let line = '';
    let y = 110;
    const maxWidth = w - 80;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, 45, y);
        line = words[n] + ' ';
        y += 28;
        if (y > h - 80) break;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line + '█', 45, y); // Typer blinking block cursor

    if (this.paperTexture) {
      this.paperTexture.needsUpdate = true;
    }
  }

  /**
   * Desk accessories: Banker's Lamp, Coffee Cup, Hourglass, Candle, Books
   */
  private buildDeskAccessories() {
    // 1. Emerald Banker's Lamp
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-0.85, 0.05, -0.2);

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xc49e35,
      metalness: 0.9,
      roughness: 0.25,
    });

    const greenGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x0f5234,
      emissive: 0x0a331f,
      emissiveIntensity: 0.4,
      roughness: 0.15,
      metalness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    // Lamp Base
    const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.03, 24), brassMat);
    lampGroup.add(lampBase);

    // Lamp Stem
    const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.48, 16), brassMat);
    lampStem.position.set(0, 0.24, 0);
    lampGroup.add(lampStem);

    // Lamp Shade (Cylindrical emerald glass)
    const shadeGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.32, 24, 1, false, 0, Math.PI);
    const shadeMesh = new THREE.Mesh(shadeGeo, greenGlassMat);
    shadeMesh.rotation.z = Math.PI / 2;
    shadeMesh.position.set(0, 0.48, 0.08);
    lampGroup.add(shadeMesh);

    this.scene.add(lampGroup);

    // 2. Steaming Coffee Cup
    const coffeeGroup = new THREE.Group();
    coffeeGroup.position.set(0.65, 0.05, 0.4);

    const porcelainMat = new THREE.MeshStandardMaterial({
      color: 0xf2f0eb,
      roughness: 0.2,
      metalness: 0.05,
    });

    const saucer = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.015, 24), porcelainMat);
    coffeeGroup.add(saucer);

    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.05, 0.09, 24), porcelainMat);
    cup.position.set(0, 0.05, 0);
    coffeeGroup.add(cup);

    // Coffee surface
    const coffeeMat = new THREE.MeshStandardMaterial({
      color: 0x1a0f08,
      roughness: 0.1,
      metalness: 0.1,
    });
    const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.06, 24), coffeeMat);
    coffee.rotation.x = -Math.PI / 2;
    coffee.position.set(0, 0.09, 0);
    coffeeGroup.add(coffee);

    // Coffee steam particles
    const steamCount = 35;
    const steamGeo = new THREE.BufferGeometry();
    const steamPositions = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 0.04;
      steamPositions[i * 3 + 1] = 0.1 + Math.random() * 0.25;
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));

    const steamMat = new THREE.PointsMaterial({
      color: 0xdddddd,
      size: 0.035,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    });
    this.steamParticles = new THREE.Points(steamGeo, steamMat);
    coffeeGroup.add(this.steamParticles);

    this.scene.add(coffeeGroup);

    // 3. Antique Brass Hourglass
    const hourglassGroup = new THREE.Group();
    hourglassGroup.position.set(-0.7, 0.05, 0.45);

    const woodEndMat = new THREE.MeshStandardMaterial({
      color: 0x3d2719,
      roughness: 0.4,
    });
    const hgTop = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16), woodEndMat);
    hgTop.position.set(0, 0.22, 0);
    const hgBottom = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.02, 16), woodEndMat);
    hourglassGroup.add(hgTop, hgBottom);

    // Brass support rods
    for (let r = 0; r < 3; r++) {
      const ang = (r / 3) * Math.PI * 2;
      const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.22, 8), brassMat);
      rod.position.set(Math.cos(ang) * 0.05, 0.11, Math.sin(ang) * 0.05);
      hourglassGroup.add(rod);
    }

    // Glass double bulb
    const glassBulbMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: this.isSoftwareGl ? 0 : 0.85,
      opacity: this.isSoftwareGl ? 0.35 : 1.0,
      transparent: true,
      roughness: 0.1,
      ior: 1.5,
    });
    const bulbUpper = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 16), glassBulbMat);
    bulbUpper.position.set(0, 0.15, 0);
    const bulbLower = new THREE.Mesh(new THREE.SphereGeometry(0.042, 16, 16), glassBulbMat);
    bulbLower.position.set(0, 0.07, 0);
    hourglassGroup.add(bulbUpper, bulbLower);

    this.scene.add(hourglassGroup);

    // 4. Stacks of Leather-Bound Books
    const bookStack = new THREE.Group();
    bookStack.position.set(0.9, 0.05, -0.2);

    const bookColors = [0x541e1b, 0x1d3328, 0x1d2838];
    bookColors.forEach((color, idx) => {
      const bMat = new THREE.MeshStandardMaterial({ color, roughness: 0.5 });
      const pageMat = new THREE.MeshStandardMaterial({ color: 0xeee7d5, roughness: 0.8 });
      const bGroup = new THREE.Group();
      bGroup.position.set((Math.random() - 0.5) * 0.04, idx * 0.05, (Math.random() - 0.5) * 0.03);
      bGroup.rotation.y = (Math.random() - 0.5) * 0.25;

      const cover = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.045, 0.22), bMat);
      const pages = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.038, 0.2), pageMat);
      pages.position.set(0.008, 0, 0);

      bGroup.add(cover, pages);
      bookStack.add(bGroup);
    });
    this.scene.add(bookStack);

    // 5. Burning Candle with Teardrop Flame
    const candleGroup = new THREE.Group();
    candleGroup.position.set(0.85, 0.05, 0.25);

    const candleStick = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.022, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xf5eedb, roughness: 0.6 })
    );
    candleStick.position.set(0, 0.1, 0);

    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffaa33 });
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.04, 12), flameMat);
    flame.position.set(0, 0.22, 0);

    candleGroup.add(candleStick, flame);
    this.scene.add(candleGroup);
  }

  /**
   * Floating Manuscripts & Interactive Epiphany Orbs
   */
  private buildFloatingMindscape() {
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0xf7f2e7,
      roughness: 0.8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });

    // 8 floating manuscript sheets caught in gentle literary drift
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.38), paperMat);
      const angle = (i / 8) * Math.PI * 2;
      const radius = 1.3 + (i % 3) * 0.3;
      p.position.set(
        Math.cos(angle) * radius,
        0.7 + Math.sin(i * 1.5) * 0.4,
        Math.sin(angle) * radius - 0.2
      );
      p.rotation.set(
        (Math.random() - 0.5) * 0.5,
        angle + Math.PI / 2,
        (Math.random() - 0.5) * 0.5
      );
      this.floatingPapers.push(p);
      this.scene.add(p);
    }

    // 5 Interactive Epiphany Orbs (Golden Sparks of Inspiration)
    const orbGeo = new THREE.SphereGeometry(0.04, 16, 16);
    const orbMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
    });

    for (let k = 0; k < 5; k++) {
      const orb = new THREE.Mesh(orbGeo, orbMat);
      orb.position.set(
        (Math.random() - 0.5) * 2.2,
        0.5 + Math.random() * 0.9,
        (Math.random() - 0.5) * 1.6
      );
      orb.userData = { id: k, basePos: orb.position.clone() };
      this.epiphanyOrbs.push(orb);
      this.scene.add(orb);
    }
  }

  /**
   * Window Rain Particles outside the arched window
   */
  private buildWindowRain() {
    const rainCount = 400;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 8;
      rainPositions[i * 3 + 1] = Math.random() * 6;
      rainPositions[i * 3 + 2] = -2.1 + (Math.random() - 0.5) * 0.5;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));

    const rainMat = new THREE.PointsMaterial({
      color: 0x88aacc,
      size: 0.035,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    this.rainParticles = new THREE.Points(rainGeo, rainMat);
    this.scene.add(this.rainParticles);
  }

  /**
   * Trigger physical typing stroke animation in the 3D typewriter
   */
  public triggerTypeStroke(char?: string) {
    this.strikerAnim = 1.0;

    // Shift carriage slightly to the left (advance writing line)
    this.carriageX -= 0.007;
    if (this.carriageX < -0.28) {
      this.carriageX = 0; // carriage return
    }

    // Depress a random key
    if (this.typewriterKeys.length > 0) {
      const idx = Math.floor(Math.random() * this.typewriterKeys.length);
      const key = this.typewriterKeys[idx];
      key.position.y -= 0.008;
      setTimeout(() => {
        key.position.y += 0.008;
      }, 70);
    }
  }

  /**
   * Carriage return animation
   */
  public carriageReturn() {
    this.carriageX = 0;
  }

  /**
   * Switch camera views smoothly
   */
  public setCameraPreset(preset: CameraPreset) {
    this.camPreset = preset;
    if (preset === 'desk') {
      this.targetCamPos.set(0, 2.1, 2.5);
      this.targetLookAt.set(0, 0.35, 0.1);
    } else if (preset === 'typewriter') {
      this.targetCamPos.set(0, 0.75, 0.95);
      this.targetLookAt.set(0, 0.28, 0.12);
    } else if (preset === 'window') {
      this.targetCamPos.set(1.2, 1.8, 1.8);
      this.targetLookAt.set(-0.8, 1.2, -1.5);
    } else if (preset === 'epiphany') {
      this.targetCamPos.set(0, 3.2, 1.8);
      this.targetLookAt.set(0, 0.2, 0);
    }
  }

  private bindEvents() {
    const onResize = () => {
      if (!this.container || this.isDisposed) return;
      const w = this.container.clientWidth;
      const h = this.container.clientHeight;
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    const onPointerDown = (e: MouseEvent) => {
      if (this.isDisposed) return;
      const rect = this.container.getBoundingClientRect();
      this.mousePos.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mousePos.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mousePos, this.camera);
      const hits = this.raycaster.intersectObjects(this.epiphanyOrbs);
      if (hits.length > 0) {
        const hitOrb = hits[0].object as THREE.Mesh;
        if (hitOrb.userData?.id !== undefined && this.onEpiphanyClickCb) {
          this.onEpiphanyClickCb(hitOrb.userData.id);
          // Pop animation
          hitOrb.scale.set(1.6, 1.6, 1.6);
          setTimeout(() => hitOrb.scale.set(1, 1, 1), 200);
        }
      }
    };
    this.container.addEventListener('pointerdown', onPointerDown);
  }

  private startLoop() {
    const tick = () => {
      if (this.isDisposed) return;

      const dt = Math.min(this.clock.getDelta(), 0.05);
      const time = this.clock.getElapsedTime();

      // 1. Exponential Damped Camera
      const dampFactor = 1 - Math.exp(-6 * dt);
      this.camera.position.lerp(this.targetCamPos, dampFactor);
      this.currentLookAt.lerp(this.targetLookAt, dampFactor);
      this.camera.lookAt(this.currentLookAt);

      // 2. Carriage damping & striker animation
      if (this.carriageGroup) {
        this.carriageGroup.position.x = THREE.MathUtils.damp(
          this.carriageGroup.position.x,
          this.carriageX,
          14,
          dt
        );
      }

      if (this.strikerHammer) {
        if (this.strikerAnim > 0) {
          this.strikerAnim = Math.max(0, this.strikerAnim - dt * 8);
          this.strikerHammer.rotation.x = 0.4 + Math.sin(this.strikerAnim * Math.PI) * 0.65;
        } else {
          this.strikerHammer.rotation.x = 0.4;
        }
      }

      // 3. Candle Flame flicker
      if (this.candleLight) {
        this.candleLight.intensity = 1.0 + Math.sin(time * 12) * 0.15 + (Math.random() - 0.5) * 0.1;
      }

      // 4. Coffee Steam gentle ascent
      if (this.steamParticles) {
        const pos = this.steamParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < pos.length / 3; i++) {
          pos[i * 3 + 1] += dt * 0.08;
          pos[i * 3] += Math.sin(time * 3 + i) * 0.0004;
          if (pos[i * 3 + 1] > 0.4) {
            pos[i * 3 + 1] = 0.1;
            pos[i * 3] = (Math.random() - 0.5) * 0.04;
          }
        }
        this.steamParticles.geometry.attributes.position.needsUpdate = true;
      }

      // 5. Floating manuscripts gentle oscillation
      this.floatingPapers.forEach((paper, i) => {
        paper.position.y += Math.sin(time * 1.2 + i) * 0.0008;
        paper.rotation.z += Math.cos(time * 0.8 + i) * 0.0004;
      });

      // 6. Epiphany Orbs gentle pulsing
      this.epiphanyOrbs.forEach((orb, k) => {
        const base = orb.userData.basePos as THREE.Vector3;
        orb.position.y = base.y + Math.sin(time * 2.5 + k * 1.5) * 0.06;
      });

      // 7. Rain droplets descending outside window
      if (this.rainParticles) {
        const rainPos = this.rainParticles.geometry.attributes.position.array as Float32Array;
        for (let j = 0; j < rainPos.length / 3; j++) {
          rainPos[j * 3 + 1] -= dt * 6.5;
          if (rainPos[j * 3 + 1] < -0.5) {
            rainPos[j * 3 + 1] = 5.5;
          }
        }
        this.rainParticles.geometry.attributes.position.needsUpdate = true;
      }

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        // Paced drawing for software WebGL
        this.frameId = window.setTimeout(tick, 50);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  public dispose() {
    this.isDisposed = true;
    if (this.isSoftwareGl) {
      clearTimeout(this.frameId);
    } else {
      cancelAnimationFrame(this.frameId);
    }
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
