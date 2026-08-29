import * as THREE from 'three';
import gsap from 'gsap';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { audioManager } from '../audio/audioManager.js';
import { SparkSystem } from '../effects/sparks.js';

const assetUrl = (path) => `${import.meta.env.BASE_URL}${String(path).replace(/^\//, '')}`;

export class World {
  constructor(scene, camera, renderer, sceneManager = null) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.sceneManager = sceneManager;

    this.interactiveObjects = [];
    this.orbitingProjects = [];
    this.robotMesh = null;
    this.robotGroup = null;
    this.platformMesh = null;
    this.platformGroup = null;
    this.robotBaseY = 0;

    this.showProjectCore = false;
    this.showBackgroundWall = false;

    this.sparks = new SparkSystem(this.scene);
    this.gltfLoader = new GLTFLoader();
    this.textureLoader = new THREE.TextureLoader();

    this.init();
  }

  init() {
    this.createMaterials();
    this.createAtmosphere();
    this.loadMainHallAssets();

    if (this.showProjectCore) {
      this.createConnectingLightBridges();
      this.createFloatingProjectsCore();
    }
  }

  createMaterials() {
    this.matPlatformDark = new THREE.MeshStandardMaterial({
      color: 0x141a26,
      roughness: 0.35,
      metalness: 0.4
    });

    this.matPlatformLight = new THREE.MeshStandardMaterial({
      color: 0x222a3d,
      roughness: 0.3,
      metalness: 0.25
    });

    this.matGunmetal = new THREE.MeshStandardMaterial({
      color: 0x222733,
      roughness: 0.35,
      metalness: 0.85
    });

    this.matBrushedAlu = new THREE.MeshStandardMaterial({
      color: 0x9ca8b8,
      roughness: 0.28,
      metalness: 0.75
    });

    this.matGlowCyan = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      emissive: 0x00e1ff,
      emissiveIntensity: 3.5,
      roughness: 0.1
    });

    this.matGlowAmber = new THREE.MeshStandardMaterial({
      color: 0xffb703,
      emissive: 0xff9e00,
      emissiveIntensity: 3.0,
      roughness: 0.1
    });

    this.matDarkWall = new THREE.MeshStandardMaterial({
      color: 0x0f1422,
      roughness: 0.6,
      metalness: 0.25
    });

    this.matPlatformGraffiti = new THREE.MeshStandardMaterial({
      map: this.createGraffitiTexture(),
      roughness: 0.45,
      metalness: 0.18
    });
  }

  createTextTexture(text, subtitle = '', bg = '#111728', color = '#00ffff', width = 512, height = 256) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(0, 0, width, height, 16);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(4, 4, width - 8, height - 8, 14);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, subtitle ? height / 2 - 20 : height / 2);

    if (subtitle) {
      ctx.fillStyle = color;
      ctx.font = '600 20px "JetBrains Mono", monospace';
      ctx.fillText(subtitle, width / 2, height / 2 + 28);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createGridFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0f1420';
    ctx.fillRect(0, 0, 512, 512);

    // Subtle graffiti spray paint splatters on the grid floor
    const colors = ['rgba(255, 0, 119, 0.22)', 'rgba(0, 240, 255, 0.22)', 'rgba(0, 255, 136, 0.22)'];
    for (let i = 0; i < 4; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const r = 40 + Math.random() * 80;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
      const col = colors[Math.floor(Math.random() * colors.length)];
      grad.addColorStop(0, col);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#00e5ff';
    for (let x = 8; x < 512; x += 16) {
      for (let y = 8; y < 512; y += 16) {
        ctx.beginPath();
        ctx.arc(x, y, 2.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(5, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createGraffitiTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base color matches the dark tech platform look
    ctx.fillStyle = '#141a26';
    ctx.fillRect(0, 0, 1024, 1024);

    // Grunge texture lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 1024, 0);
      ctx.lineTo(Math.random() * 1024, 1024);
      ctx.stroke();
    }

    // Spray paint splatters
    const colors = ['#ff0077', '#00f0ff', '#00ff88', '#ffaa00', '#a855f7'];
    for (let i = 0; i < 18; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const r = 50 + Math.random() * 100;
      const grad = ctx.createRadialGradient(x, y, 2, x, y, r);
      const col = colors[Math.floor(Math.random() * colors.length)];
      grad.addColorStop(0, col);
      grad.addColorStop(0.25, col + '77');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Graffiti tags/words
    const tags = ['SYNERGY', 'CYBER', 'WEBGL', 'DEV', 'AI', 'K8S', 'GO', 'NEON', 'THREEJS', 'GLSL', 'GRAFFITI'];
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 15; i++) {
      const x = 120 + Math.random() * 784;
      const y = 120 + Math.random() * 784;
      const size = 35 + Math.random() * 55;
      const angle = (Math.random() - 0.5) * 0.5;
      const word = tags[Math.floor(Math.random() * tags.length)];
      const col = colors[Math.floor(Math.random() * colors.length)];

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);

      // Draw shadow/outline
      ctx.font = `bold italic ${size}px "Impact", "Arial Black", sans-serif`;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 12;
      ctx.strokeText(word, 0, 0);

      // Draw main text
      ctx.fillStyle = col;
      ctx.fillText(word, 0, 0);

      // Add highlights
      ctx.font = `bold italic ${size}px "Impact", "Arial Black", sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(word, -2, -2);

      // Add drips
      if (Math.random() > 0.4) {
        ctx.fillStyle = col;
        const dripCount = 2 + Math.floor(Math.random() * 3);
        for (let d = 0; d < dripCount; d++) {
          const dx = (Math.random() - 0.5) * (size * 1.4);
          const dy = size / 2;
          const dlen = 25 + Math.random() * 45;
          ctx.beginPath();
          ctx.moveTo(dx, dy);
          ctx.lineTo(dx, dy + dlen);
          ctx.lineWidth = 4 + Math.random() * 3;
          ctx.strokeStyle = col;
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(dx, dy + dlen, ctx.lineWidth / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createKeyboardTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0a0f1d';
    ctx.fillRect(0, 0, 512, 256);

    // Draw keyboard grid
    ctx.strokeStyle = '#00f0ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 10, 492, 236);

    // Draw keys
    ctx.fillStyle = 'rgba(0, 240, 255, 0.12)';
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 15; c++) {
        const kw = 26;
        const kh = 26;
        const kx = 25 + c * 31;
        const ky = 25 + r * 34;
        ctx.fillRect(kx, ky, kw, kh);
        ctx.strokeRect(kx, ky, kw, kh);
      }
    }
    return new THREE.CanvasTexture(canvas);
  }

  // FRONT STAGE: WELCOME PLATFORM, TERMINAL 01 & HOLOGRAPHIC BILLBOARD
  createWelcomeRoom() {
    this.roomGroup = new THREE.Group();
    this.roomGroup.position.set(0, 0, 0.5);

    // Front Floor Platform with Graffiti Texture!
    const baseGeo = new THREE.BoxGeometry(8.2, 0.8, 4.6);
    const baseMesh = new THREE.Mesh(baseGeo, this.matPlatformGraffiti);
    baseMesh.position.y = -0.4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.roomGroup.add(baseMesh);

    // Metallic corner brackets for the platform
    const bracketMat = this.matBrushedAlu;
    const bracketGeo = new THREE.BoxGeometry(0.3, 0.84, 0.3);
    const corners = [
      [-4.1, 2.3],
      [4.1, 2.3],
      [-4.1, -2.3],
      [4.1, -2.3]
    ];
    corners.forEach(([cx, cz]) => {
      const bracket = new THREE.Mesh(bracketGeo, bracketMat);
      bracket.position.set(cx, -0.4, cz);
      this.roomGroup.add(bracket);

      // Small glowing neon rivet on each bracket
      const rivetGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const rivetMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const rivet = new THREE.Mesh(rivetGeo, rivetMat);
      rivet.position.set(cx + (cx > 0 ? -0.12 : 0.12), 0.02, cz + (cz > 0 ? -0.12 : 0.12));
      this.roomGroup.add(rivet);
    });

    // Illuminated Honeycomb Tech Grid Floor Plate
    const gridTex = this.createGridFloorTexture();
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0x7eccf8,
      map: gridTex,
      emissive: 0x003355,
      emissiveIntensity: 0.5,
      roughness: 0.25,
      metalness: 0.3
    });

    const gridGeo = new THREE.BoxGeometry(7.6, 0.08, 4.0);
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.y = 0.04;
    gridMesh.receiveShadow = true;
    this.roomGroup.add(gridMesh);

    // Glowing Cyan Linear Light Strips
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 3.8), stripMat);
    stripL.position.set(-3.75, 0.09, 0);
    const stripR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 3.8), stripMat);
    stripR.position.set(3.75, 0.09, 0);
    const stripF = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.06, 0.08), stripMat);
    stripF.position.set(0, 0.09, 1.95);
    this.roomGroup.add(stripL, stripR, stripF);

    // --- TERMINAL 01 KIOSK & HOLOGRAPHIC PROJECTION ---
    const kioskGroup = new THREE.Group();
    kioskGroup.position.set(0.6, 0.08, 0.2);

    // Sleek futuristic pedestal structure
    const pedestalGroup = new THREE.Group();

    // Angled base column with graffiti
    const colGeo = new THREE.CylinderGeometry(0.28, 0.48, 0.85, 4);
    const colMesh = new THREE.Mesh(colGeo, this.matPlatformGraffiti);
    colMesh.position.y = 0.425;
    colMesh.rotation.y = Math.PI / 4; // rotate 45 deg to make it diamond-shaped
    colMesh.castShadow = true;
    colMesh.receiveShadow = true;
    pedestalGroup.add(colMesh);

    // Side wings with neon lights
    const wingGeo = new THREE.BoxGeometry(0.12, 0.75, 0.45);
    const wingL = new THREE.Mesh(wingGeo, this.matGunmetal);
    wingL.position.set(-0.45, 0.4, 0);
    const wingR = new THREE.Mesh(wingGeo, this.matGunmetal);
    wingR.position.set(0.45, 0.4, 0);

    const neonStripGeo = new THREE.BoxGeometry(0.02, 0.7, 0.04);
    const neonStripL = new THREE.Mesh(neonStripGeo, new THREE.MeshBasicMaterial({ color: 0xff0077 })); // hot pink neon!
    neonStripL.position.set(-0.52, 0.4, 0.1);
    const neonStripR = new THREE.Mesh(neonStripGeo, new THREE.MeshBasicMaterial({ color: 0x00ff88 })); // lime green neon!
    neonStripR.position.set(0.52, 0.4, 0.1);

    pedestalGroup.add(wingL, wingR, neonStripL, neonStripR);

    // Angled control deck
    const deckGeo = new THREE.BoxGeometry(1.35, 0.15, 0.85);
    const deckMesh = new THREE.Mesh(deckGeo, this.matBrushedAlu);
    deckMesh.position.set(0, 0.88, 0.05);
    deckMesh.rotation.x = -0.22;
    deckMesh.castShadow = true;
    pedestalGroup.add(deckMesh);

    // Keyboard touch panel on the deck
    const kbTex = this.createKeyboardTexture();
    const kbMat = new THREE.MeshBasicMaterial({ map: kbTex });
    const kbMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.55), kbMat);
    kbMesh.position.set(0, 0.96, 0.12);
    kbMesh.rotation.x = -0.22;
    pedestalGroup.add(kbMesh);

    // Screen frame mounted on top
    const screenFrameGeo = new THREE.BoxGeometry(1.26, 0.72, 0.06);
    const screenFrame = new THREE.Mesh(screenFrameGeo, this.matGunmetal);
    screenFrame.position.set(0, 1.28, 0.18);
    screenFrame.rotation.x = -0.45;
    screenFrame.castShadow = true;

    const screenTex = this.createTextTexture('TERMINAL 01', 'STATUS: SYSTEM READY', '#09101d', '#00ffff', 512, 256);
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.62), new THREE.MeshBasicMaterial({ map: screenTex }));
    screenMesh.position.z = 0.04;
    screenFrame.add(screenMesh);
    pedestalGroup.add(screenFrame);

    kioskGroup.add(pedestalGroup);

    this.createHolographicWelcomeScreen(kioskGroup);

    this.roomGroup.add(kioskGroup);

    this.scene.add(this.roomGroup);
  }

  createHolographicWelcomeScreen(kioskGroup) {
    const holoGroup = new THREE.Group();
    holoGroup.position.set(0.55, 2.22, -0.42);
    holoGroup.rotation.y = -0.1;
    kioskGroup.add(holoGroup);

    const width = 3.55;
    const height = width * (9 / 16);

    const glowGeo = new THREE.PlaneGeometry(width + 0.12, height + 0.12);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.holoGlow = new THREE.Mesh(glowGeo, glowMat);
    this.holoGlow.position.z = -0.02;
    holoGroup.add(this.holoGlow);

    const frameGeo = new THREE.PlaneGeometry(width + 0.06, height + 0.06);
    const frameMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide
    });
    const frameMesh = new THREE.Mesh(frameGeo, frameMat);
    frameMesh.position.z = -0.01;
    holoGroup.add(frameMesh);

    const holoMat = new THREE.MeshBasicMaterial({
      color: 0x0a1424,
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide
    });
    this.holoScreen = new THREE.Mesh(new THREE.PlaneGeometry(width, height), holoMat);
    holoGroup.add(this.holoScreen);

    this.textureLoader.load(
      assetUrl('/textures/holo-welcome-hub.png'),
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = Math.min(8, this.renderer?.capabilities?.getMaxAnisotropy?.() || 8);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        holoMat.map = texture;
        holoMat.color = new THREE.Color(0xffffff);
        holoMat.needsUpdate = true;
      },
      undefined,
      (error) => {
        console.warn('Could not load holographic welcome texture:', error);
      }
    );
  }

  createAtmosphere() {
    this.atmosphereRoot = new THREE.Group();
    this.scene.add(this.atmosphereRoot);
    this.backdrops = {};
    this.currentBackdrop = 'nebula';
    this.rainSpeeds = null;

    this.backdrops.nebula = this.buildNebulaBackdrop();
    this.backdrops.matrix = this.buildMatrixBackdrop();
    this.backdrops.sunset = this.buildSunsetBackdrop();

    Object.values(this.backdrops).forEach((group) => {
      this.atmosphereRoot.add(group);
    });

    this.setBackdrop('nebula', true);
  }

  buildNebulaBackdrop() {
    const group = new THREE.Group();
    group.name = 'backdrop-nebula';

    group.add(this.makeSkySphere(this.createSkyTexture({
      stops: ['#140828', '#0b1230', '#050814'],
      blobs: [
        [220, 180, 280, 'rgba(255, 45, 149, 0.32)'],
        [780, 160, 300, 'rgba(0, 229, 255, 0.28)'],
        [510, 120, 260, 'rgba(124, 58, 237, 0.3)'],
        [400, 280, 180, 'rgba(92, 255, 122, 0.12)']
      ]
    })));

    this.addGlowPlanes(group, [
      { color: 0xff2d95, pos: [-10, 3.5, -14], scale: [18, 10, 1], opacity: 0.16 },
      { color: 0x00e5ff, pos: [11, 2.8, -13], scale: [16, 9, 1], opacity: 0.15 },
      { color: 0x7c3aed, pos: [0, 6.5, -18], scale: [22, 12, 1], opacity: 0.12 }
    ]);

    group.add(this.makeHorizonGrid('rgba(0, 240, 255, 0.28)'));
    group.add(this.makeStarField(900, ['#ffffff', '#00f0ff', '#ff4d9d', '#c4b5fd']));
    group.add(this.makeDust(0x88ddff));
    return group;
  }

  buildMatrixBackdrop() {
    const group = new THREE.Group();
    group.name = 'backdrop-matrix';

    group.add(this.makeSkySphere(this.createSkyTexture({
      stops: ['#03160c', '#052010', '#010805'],
      blobs: [
        [300, 160, 240, 'rgba(0, 255, 120, 0.22)'],
        [720, 200, 260, 'rgba(40, 220, 90, 0.18)'],
        [510, 80, 200, 'rgba(180, 255, 160, 0.08)']
      ],
      scanlines: true
    })));

    this.addGlowPlanes(group, [
      { color: 0x00ff88, pos: [0, 4, -16], scale: [24, 14, 1], opacity: 0.12 },
      { color: 0x39ff14, pos: [-8, 1.5, -10], scale: [12, 6, 1], opacity: 0.08 }
    ]);

    group.add(this.makeHorizonGrid('rgba(0, 255, 136, 0.32)'));
    group.add(this.makeStarField(400, ['#7CFFB2', '#00ff88', '#d1fae5']));

    const rainCount = 280;
    const rainGeo = new THREE.BufferGeometry();
    const rainPos = new Float32Array(rainCount * 3);
    this.rainSpeeds = new Float32Array(rainCount);
    for (let i = 0; i < rainCount; i++) {
      rainPos[i * 3] = (Math.random() - 0.5) * 22;
      rainPos[i * 3 + 1] = Math.random() * 12;
      rainPos[i * 3 + 2] = (Math.random() - 0.5) * 18 - 3;
      this.rainSpeeds[i] = 1.8 + Math.random() * 3.4;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
    this.matrixRain = new THREE.Points(
      rainGeo,
      new THREE.PointsMaterial({
        color: 0x39ff14,
        size: 0.08,
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    group.add(this.matrixRain);
    return group;
  }

  buildSunsetBackdrop() {
    const group = new THREE.Group();
    group.name = 'backdrop-sunset';

    group.add(this.makeSkySphere(this.createSkyTexture({
      stops: ['#2a1030', '#7a2048', '#ff6b35', '#1a0a12'],
      blobs: [
        [512, 300, 220, 'rgba(255, 180, 60, 0.45)'],
        [380, 240, 180, 'rgba(255, 80, 120, 0.28)'],
        [700, 220, 160, 'rgba(255, 120, 40, 0.22)']
      ]
    })));

    this.addGlowPlanes(group, [
      { color: 0xff6b35, pos: [0, 1.2, -15], scale: [28, 8, 1], opacity: 0.22 },
      { color: 0xff2d95, pos: [-8, 3, -12], scale: [14, 8, 1], opacity: 0.14 },
      { color: 0xffb703, pos: [8, 2.2, -11], scale: [12, 6, 1], opacity: 0.12 }
    ]);

    group.add(this.makeHorizonGrid('rgba(255, 140, 64, 0.22)'));
    group.add(this.makeStarField(260, ['#ffe8c2', '#ffb703', '#ff8a65']));
    group.add(this.makeDust(0xffc38b));
    return group;
  }

  makeSkySphere(texture) {
    return new THREE.Mesh(
      new THREE.SphereGeometry(42, 48, 32),
      new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide,
        fog: false,
        depthWrite: false
      })
    );
  }

  addGlowPlanes(group, configs) {
    configs.forEach((cfg) => {
      const glow = new THREE.Mesh(
        new THREE.PlaneGeometry(1, 1),
        new THREE.MeshBasicMaterial({
          color: cfg.color,
          transparent: true,
          opacity: cfg.opacity,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          fog: false,
          side: THREE.DoubleSide
        })
      );
      glow.position.set(...cfg.pos);
      glow.scale.set(...cfg.scale);
      group.add(glow);
    });
  }

  makeHorizonGrid(stroke) {
    const grid = new THREE.Mesh(
      new THREE.PlaneGeometry(48, 48),
      new THREE.MeshBasicMaterial({
        map: this.createHorizonGridTexture(stroke),
        transparent: true,
        opacity: 0.42,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: true
      })
    );
    grid.rotation.x = -Math.PI / 2;
    grid.position.y = -0.55;
    return grid;
  }

  makeStarField(count, hexColors) {
    const starGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = hexColors.map((h) => new THREE.Color(h));

    for (let i = 0; i < count; i++) {
      const r = 8 + Math.random() * 28;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.55 + 3.2;
      positions[i * 3 + 2] = r * Math.cos(phi) - 4;

      const c = palette[Math.floor(Math.random() * palette.length)];
      const shade = 0.45 + Math.random() * 0.55;
      colors[i * 3] = c.r * shade;
      colors[i * 3 + 1] = c.g * shade;
      colors[i * 3 + 2] = c.b * shade;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const stars = new THREE.Points(
      starGeo,
      new THREE.PointsMaterial({
        size: 0.07,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        sizeAttenuation: true
      })
    );
    stars.userData.kind = 'stars';
    return stars;
  }

  makeDust(color) {
    const dustCount = 180;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 16;
      dustPos[i * 3 + 1] = Math.random() * 6 + 0.3;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 2;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dust = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color,
        size: 0.045,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    dust.userData.kind = 'dust';
    return dust;
  }

  setBackdrop(id, instant = false) {
    if (!this.backdrops[id]) return;
    this.currentBackdrop = id;

    Object.entries(this.backdrops).forEach(([key, group]) => {
      group.visible = key === id;
    });

    const looks = {
      nebula: { fog: '#0a1024', ambient: 0x4a5d9a, hemiSky: 0xff7ad9, hemiGround: 0x0b3d4a, key: 0xfff1d6 },
      matrix: { fog: '#03140c', ambient: 0x143d28, hemiSky: 0x7CFFB2, hemiGround: 0x02150c, key: 0xc8ffd9 },
      sunset: { fog: '#1c0c14', ambient: 0x5a3048, hemiSky: 0xff8a65, hemiGround: 0x2a1018, key: 0xffd7a8 }
    };
    const look = looks[id];
    const fogCol = new THREE.Color(look.fog);
    const duration = instant ? 0 : 0.9;

    if (this.sceneManager) {
      gsap.to(this.scene.fog.color, { r: fogCol.r, g: fogCol.g, b: fogCol.b, duration });
      gsap.to(this.scene.background, { r: fogCol.r, g: fogCol.g, b: fogCol.b, duration });
      gsap.to(this.sceneManager.ambientLight.color, {
        r: new THREE.Color(look.ambient).r,
        g: new THREE.Color(look.ambient).g,
        b: new THREE.Color(look.ambient).b,
        duration
      });
      if (this.sceneManager.hemiLight) {
        gsap.to(this.sceneManager.hemiLight.color, {
          r: new THREE.Color(look.hemiSky).r,
          g: new THREE.Color(look.hemiSky).g,
          b: new THREE.Color(look.hemiSky).b,
          duration
        });
        gsap.to(this.sceneManager.hemiLight.groundColor, {
          r: new THREE.Color(look.hemiGround).r,
          g: new THREE.Color(look.hemiGround).g,
          b: new THREE.Color(look.hemiGround).b,
          duration
        });
      }
      gsap.to(this.sceneManager.keyLight.color, {
        r: new THREE.Color(look.key).r,
        g: new THREE.Color(look.key).g,
        b: new THREE.Color(look.key).b,
        duration
      });
    }
  }

  createSkyTexture({ stops, blobs, scanlines = false }) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const base = ctx.createLinearGradient(0, 0, 0, 512);
    base.addColorStop(0, stops[0]);
    base.addColorStop(0.45, stops[1]);
    base.addColorStop(1, stops[stops.length - 1]);
    if (stops.length > 3) {
      base.addColorStop(0.7, stops[2]);
    }
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, 1024, 512);

    blobs.forEach(([x, y, r, color]) => {
      const g = ctx.createRadialGradient(x, y, 8, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    });

    if (scanlines) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
      for (let y = 0; y < 512; y += 4) {
        ctx.fillRect(0, y, 1024, 1);
      }
    }

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 120; i++) {
      const s = Math.random() * 1.6;
      ctx.globalAlpha = 0.2 + Math.random() * 0.55;
      ctx.fillRect(Math.random() * 1024, Math.random() * 320, s, s);
    }
    ctx.globalAlpha = 1;

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }

  createHorizonGridTexture(stroke = 'rgba(0, 240, 255, 0.28)') {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1024, 1024);

    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    for (let i = 0; i <= 24; i++) {
      const p = (i / 24) * 1024;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 1024);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, p);
      ctx.lineTo(1024, p);
      ctx.stroke();
    }

    const fade = ctx.createRadialGradient(512, 512, 80, 512, 512, 500);
    fade.addColorStop(0, 'rgba(0,0,0,0)');
    fade.addColorStop(0.55, 'rgba(0,0,0,0.15)');
    fade.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = fade;
    ctx.fillRect(0, 0, 1024, 1024);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }

  outlinePlatformScreens(platformRoot) {
    platformRoot.updateMatrixWorld(true);
    let mesh = null;
    platformRoot.traverse((child) => {
      if (child.isMesh && !mesh) mesh = child;
    });
    if (!mesh) return;

    const screens = this.detectScreenPlanes(mesh);
    this.screenHelperGroup = new THREE.Group();
    this.screenHelperGroup.name = 'screen-outlines';
    this.platformGroup.add(this.screenHelperGroup);

    screens.forEach((screen) => {
      this.addDashedScreenMarker(screen);
    });
  }

  detectScreenPlanes(mesh) {
    const geo = mesh.geometry;
    const pos = geo.attributes.position;
    const idx = geo.index;
    if (!pos || !idx) return [];

    const worldBox = new THREE.Box3().setFromObject(mesh);
    const meshSize = worldBox.getSize(new THREE.Vector3());
    const s = Math.max(meshSize.x, meshSize.y, meshSize.z);
    const planarLimit = s * 0.1;
    const normalLimit = s * 0.014;
    const minArea = s * s * 0.0012;

    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const ab = new THREE.Vector3();
    const ac = new THREE.Vector3();
    const fn = new THREE.Vector3();
    const faces = [];

    for (let t = 0; t < idx.count / 3; t++) {
      a.fromBufferAttribute(pos, idx.getX(t * 3)).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(pos, idx.getX(t * 3 + 1)).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(pos, idx.getX(t * 3 + 2)).applyMatrix4(mesh.matrixWorld);
      fn.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
      const area = fn.length() * 0.5;
      if (area < 2e-5) continue;
      fn.normalize();
      if (fn.z < 0.25 || fn.y < -0.25) continue;
      const centroid = new THREE.Vector3().addVectors(a, b).add(c).multiplyScalar(1 / 3);
      faces.push({
        area,
        n: fn.clone(),
        c: centroid,
        pts: [a.clone(), b.clone(), c.clone()]
      });
    }

    faces.sort((u, v) => v.area - u.area);
    const used = new Array(faces.length).fill(false);
    const clusters = [];

    for (let i = 0; i < faces.length; i++) {
      if (used[i]) continue;
      const seed = faces[i];
      const members = [seed];
      used[i] = true;
      for (let j = i + 1; j < faces.length; j++) {
        if (used[j]) continue;
        const f = faces[j];
        if (seed.n.dot(f.n) < 0.9) continue;
        const to = f.c.clone().sub(seed.c);
        if (Math.abs(to.dot(seed.n)) > normalLimit) continue;
        const planar = Math.sqrt(Math.max(0, to.lengthSq() - seed.n.dot(to) ** 2));
        if (planar > planarLimit) continue;
        members.push(f);
        used[j] = true;
      }

      const area = members.reduce((sum, m) => sum + m.area, 0);
      if (area < minArea) continue;

      const n = new THREE.Vector3();
      members.forEach((m) => n.addScaledVector(m.n, m.area));
      n.normalize();
      const pts = [];
      members.forEach((m) => pts.push(...m.pts));
      const box = new THREE.Box3();
      pts.forEach((p) => box.expandByPoint(p));
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const dims = [size.x, size.y, size.z].sort((x, y) => y - x);
      const aspect = dims[0] / (dims[1] || 1);
      const thin = dims[2] / (dims[0] || 1);

      clusters.push({ area, n, pts, center, size, aspect, thin });
    }

    const backZ = worldBox.min.z + meshSize.z * 0.35;
    const withPlane = (cl) => {
      const ext = this.planeExtent(cl.pts, cl.n);
      return { ...cl, pw: ext.w, ph: ext.h };
    };

    const vertical = clusters
      .filter((cl) => cl.n.z > 0.8 && Math.abs(cl.n.y) < 0.3 && cl.aspect < 2.5 && cl.thin < 0.22)
      .map(withPlane)
      .sort((a, b) => b.area - a.area);

    const tilted = clusters
      .filter((cl) => cl.n.z > 0.4 && cl.n.y > 0.2 && cl.n.y < 0.85 && cl.aspect < 3.2 && cl.thin < 0.55)
      .map(withPlane)
      .sort((a, b) => b.area - a.area);

    const screens = [];

    const hudSeed = vertical.find((cl) => cl.center.z < backZ && cl.pw > 1.0 && cl.ph > 1.05)
      || vertical.find((cl) => cl.center.z < backZ)
      || vertical[0];

    if (hudSeed) {
      const hudPts = [];
      const hudN = new THREE.Vector3();
      vertical.forEach((cl) => {
        if (Math.abs(cl.center.z - hudSeed.center.z) > 0.16) return;
        hudPts.push(...cl.pts);
        hudN.addScaledVector(cl.n, cl.area);
      });
      hudN.normalize();
      screens.push({
        id: 'hologram',
        label: 'PANTALLA HUD',
        color: 0x00f0ff,
        n: hudN,
        pts: hudPts,
        pad: 0.96,
        pull: 0.07,
        expandLeft: 0.005,
        expandRight: 0.005,
        expandBottom: 0,
        rounded: true,
        cornerRadius: 45 / 960
      });
    }

    const hudCenter = screens[0]
      ? new THREE.Box3().setFromPoints(screens[0].pts).getCenter(new THREE.Vector3())
      : null;

    const terminal = tilted.find((cl) => {
      if (cl.center.y < s * 0.18) return false;
      if (!hudCenter) return true;
      return cl.center.distanceTo(hudCenter) > s * 0.08;
    }) || tilted[0];

    if (terminal) {
      screens.push({
        id: 'terminal',
        label: 'PANTALLA TERMINAL',
        color: 0xffaa00,
        n: terminal.n,
        pts: terminal.pts,
        pad: 0.92,
        pull: 0.08,
        expandLeft: 0.20,
        expandTop: 0.28,
        heightScale: 0.5
      });
    }

    return screens.slice(0, 2);
  }

  planeExtent(points, normal) {
    const n = normal.clone().normalize();
    const tmp = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = tmp.clone().cross(n).normalize();
    const v = n.clone().cross(u).normalize();
    const origin = new THREE.Vector3();
    points.forEach((p) => origin.add(p));
    origin.multiplyScalar(1 / Math.max(points.length, 1));
    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    points.forEach((p) => {
      const d = p.clone().sub(origin);
      minU = Math.min(minU, d.dot(u));
      maxU = Math.max(maxU, d.dot(u));
      minV = Math.min(minV, d.dot(v));
      maxV = Math.max(maxV, d.dot(v));
    });
    return { w: maxU - minU, h: maxV - minV };
  }

  screenRectFromPoints(points, normal, opts = {}) {
    const pad = opts.pad ?? 1;
    const pull = opts.pull ?? 0.05;
    const expandLeft = opts.expandLeft ?? 0;
    const expandRight = opts.expandRight ?? 0;
    const heightScale = opts.heightScale ?? 1;
    const expandTop = opts.expandTop ?? 0;
    const expandBottom = opts.expandBottom ?? 0;
    const n = normal.clone().normalize();
    const tmp = Math.abs(n.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
    const u = tmp.clone().cross(n).normalize();
    const v = n.clone().cross(u).normalize();
    const origin = new THREE.Vector3();
    points.forEach((p) => origin.add(p));
    origin.multiplyScalar(1 / Math.max(points.length, 1));

    let minU = Infinity;
    let maxU = -Infinity;
    let minV = Infinity;
    let maxV = -Infinity;
    points.forEach((p) => {
      const d = p.clone().sub(origin);
      const pu = d.dot(u);
      const pv = d.dot(v);
      minU = Math.min(minU, pu);
      maxU = Math.max(maxU, pu);
      minV = Math.min(minV, pv);
      maxV = Math.max(maxV, pv);
    });

    const cu = (minU + maxU) / 2;
    const cv = (minV + maxV) / 2;
    let hu = ((maxU - minU) / 2) * pad;
    let hv = ((maxV - minV) / 2) * pad * heightScale;
    const width = hu * 2;
    hu = (width * (1 + expandLeft + expandRight)) / 2;
    const shiftU = u.x >= 0
      ? ((expandRight - expandLeft) * width) / 2
      : ((expandLeft - expandRight) * width) / 2;
    const height = hv * 2;
    hv = (height * (1 + expandTop + expandBottom)) / 2;
    const shiftV = v.y >= 0
      ? ((expandTop - expandBottom) * height) / 2
      : ((expandBottom - expandTop) * height) / 2;
    const center = origin.clone()
      .addScaledVector(u, cu + shiftU)
      .addScaledVector(v, cv + shiftV)
      .addScaledVector(n, pull);

    const quaternion = new THREE.Quaternion().setFromRotationMatrix(
      new THREE.Matrix4().makeBasis(u, v, n)
    );

    return {
      center,
      quaternion,
      width: hu * 2,
      height: hv * 2,
      corners: [
        center.clone().addScaledVector(u, -hu).addScaledVector(v, -hv),
        center.clone().addScaledVector(u, hu).addScaledVector(v, -hv),
        center.clone().addScaledVector(u, hu).addScaledVector(v, hv),
        center.clone().addScaledVector(u, -hu).addScaledVector(v, hv)
      ]
    };
  }

  makeRoundedScreenGeometry(localCorners, radiusRatio = 0.14, segs = 10) {
    const bl = localCorners[0];
    const br = localCorners[1];
    const tl = localCorners[3];
    const uDir = br.clone().sub(bl);
    const vDir = tl.clone().sub(bl);
    const w = uDir.length();
    const h = vDir.length();
    if (w < 1e-5 || h < 1e-5) {
      return { geometry: new THREE.BufferGeometry(), outline: localCorners };
    }
    uDir.multiplyScalar(1 / w);
    vDir.multiplyScalar(1 / h);
    const r = Math.min(Math.min(w, h) * radiusRatio, w * 0.42, h * 0.42);
    const to3 = (x, y) => bl.clone().addScaledVector(uDir, x).addScaledVector(vDir, y);

    const pts2 = [];
    const pushArc = (cx, cy, a0, a1) => {
      for (let i = 0; i <= segs; i += 1) {
        const a = a0 + (a1 - a0) * (i / segs);
        pts2.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
      }
    };
    pushArc(r, r, Math.PI, Math.PI * 1.5);
    pushArc(w - r, r, Math.PI * 1.5, Math.PI * 2);
    pushArc(w - r, h - r, 0, Math.PI * 0.5);
    pushArc(r, h - r, Math.PI * 0.5, Math.PI);

    const outline = pts2.map(([x, y]) => to3(x, y));
    const positions = [];
    const uvs = [];
    const indices = [];
    const mid = to3(w * 0.5, h * 0.5);
    positions.push(mid.x, mid.y, mid.z);
    uvs.push(0.5, 0.5);
    outline.forEach((p, i) => {
      positions.push(p.x, p.y, p.z);
      uvs.push(pts2[i][0] / w, pts2[i][1] / h);
    });
    const count = outline.length;
    for (let i = 0; i < count; i += 1) {
      indices.push(0, i + 1, ((i + 1) % count) + 1);
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return { geometry, outline };
  }

  addDashedScreenMarker(screen) {
    const { corners, center } = this.screenRectFromPoints(screen.pts, screen.n, screen);
    const toLocal = (p) => this.platformGroup.worldToLocal(p.clone());
    const localCorners = corners.map(toLocal);
    const localCenter = toLocal(center);

    const rounded = screen.rounded === true;
    const roundedMesh = rounded
      ? this.makeRoundedScreenGeometry(localCorners, screen.cornerRadius ?? 0.14)
      : null;

    const loop = roundedMesh
      ? [...roundedMesh.outline, roundedMesh.outline[0]]
      : [...localCorners, localCorners[0]];
    const geom = new THREE.BufferGeometry().setFromPoints(loop);
    const mat = new THREE.LineDashedMaterial({
      color: screen.color,
      dashSize: 0.12,
      gapSize: 0.07,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false
    });
    const line = new THREE.Line(geom, mat);
    line.computeLineDistances();
    line.renderOrder = 20;
    line.name = `${screen.id}-outline`;
    this.screenHelperGroup.add(line);

    let panelGeo;
    if (roundedMesh) {
      panelGeo = roundedMesh.geometry;
    } else {
      const panelPos = new Float32Array(12);
      localCorners.forEach((p, i) => {
        panelPos[i * 3] = p.x;
        panelPos[i * 3 + 1] = p.y;
        panelPos[i * 3 + 2] = p.z;
      });
      panelGeo = new THREE.BufferGeometry();
      panelGeo.setAttribute('position', new THREE.BufferAttribute(panelPos, 3));
      panelGeo.setIndex([0, 1, 2, 0, 2, 3]);
      panelGeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([
        0, 0, 1, 0, 1, 1, 0, 1
      ]), 2));
      panelGeo.computeVertexNormals();
    }

    const panelTex = screen.id === 'terminal'
      ? this.createTerminalScreenTexture()
      : this.createHudScreenTexture(rounded);
    const panel = new THREE.Mesh(
      panelGeo,
      new THREE.MeshBasicMaterial({
        map: panelTex,
        transparent: true,
        opacity: 0.96,
        toneMapped: false,
        depthWrite: false,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4
      })
    );
    panel.renderOrder = 12;
    panel.name = `${screen.id}-panel`;
    this.screenHelperGroup.add(panel);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 128);
    ctx.font = 'bold 42px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(screen.label, 256, 64);
    ctx.fillStyle = `#${screen.color.toString(16).padStart(6, '0')}`;
    ctx.fillText(screen.label, 256, 64);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const label = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      depthTest: false
    }));
    label.scale.set(1.05, 0.26, 1);
    const top = localCorners.reduce((p, q) => (q.y > p.y ? q : p), localCorners[0]);
    label.position.copy(top).lerp(localCenter, 0.15);
    label.position.y += 0.12;
    label.renderOrder = 22;
    this.screenHelperGroup.add(label);
  }

  createHudScreenTexture(rounded = false) {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 960;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 1920, 960);
    if (rounded) {
      const radius = 45;
      ctx.beginPath();
      ctx.moveTo(radius, 0);
      ctx.arcTo(1920, 0, 1920, 960, radius);
      ctx.arcTo(1920, 960, 0, 960, radius);
      ctx.arcTo(0, 960, 0, 0, radius);
      ctx.arcTo(0, 0, 1920, 0, radius);
      ctx.closePath();
      ctx.clip();
    }
    const g = ctx.createLinearGradient(0, 0, 0, 960);
    g.addColorStop(0, '#041018');
    g.addColorStop(1, '#00c8e0');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1920, 960);
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    for (let y = 28; y < 960; y += 26) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1920, y);
      ctx.stroke();
    }
    ctx.fillStyle = '#7af7ff';
    ctx.font = '700 52px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('IT CREATIVE SYNERGY', 56, 78);
    ctx.fillStyle = '#b8fff8';
    ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('HUD  ·  HUB STATUS  ·  LIVE', 56, 124);
    const cards = [
      ['CORE', 'ONLINE'],
      ['NET', 'STABLE'],
      ['SYNC', '98%'],
      ['BOT', 'DOCKED']
    ];
    cards.forEach((card, i) => {
      const x = 56 + i * 460;
      ctx.fillStyle = 'rgba(4, 24, 36, 0.72)';
      ctx.fillRect(x, 168, 430, 210);
      ctx.strokeStyle = '#00f0ff';
      ctx.strokeRect(x, 168, 430, 210);
      ctx.fillStyle = '#67f0ff';
      ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(card[0], x + 28, 236);
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 44px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(card[1], x + 28, 310);
    });
    ctx.fillStyle = 'rgba(0, 240, 255, 0.16)';
    ctx.fillRect(56, 420, 1808, 470);
    ctx.fillStyle = '#e8ffff';
    ctx.font = '600 30px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ACTIVE MODULES', 96, 500);
    ctx.font = '500 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('NEBULA   ·   MATRIX   ·   SUNSET', 96, 560);
    ctx.fillText('Campus hub online  ·  Platform locked  ·  Terminal 01 linked', 96, 620);
    ctx.fillText('Raycast ready  ·  Atmosphere synced  ·  Graffiti unit docked', 96, 680);
    ctx.fillStyle = '#7af7ff';
    ctx.font = '600 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('STATUS: ALL SYSTEMS NOMINAL', 96, 760);
    ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('IT Creative Synergy  //  Global Innovation Hub', 96, 820);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  createTerminalScreenTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 420;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#070b08';
    ctx.fillRect(0, 0, 1024, 420);
    ctx.fillStyle = '#102418';
    ctx.fillRect(0, 0, 1024, 48);
    ctx.fillStyle = '#7dff9a';
    ctx.font = '700 24px "JetBrains Mono", "Courier New", monospace';
    ctx.fillText('TERMINAL 01  //  SYSTEM READY', 24, 32);
    ctx.fillStyle = '#3dff78';
    ctx.font = '500 20px "JetBrains Mono", "Courier New", monospace';
    const lines = [
      '> boot --campus it-creative-synergy',
      '> mount /platform/neon-cyber',
      '> load bot -- graffiti-unit',
      '> screens.map hud, terminal',
      '  [ok] renderer   three r160',
      '  [ok] lighting   neon / lime / amber',
      'root@campus:~$ _'
    ];
    lines.forEach((line, i) => {
      ctx.fillText(line, 28, 84 + i * 42);
    });
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  loadGltf(path) {
    return new Promise((resolve, reject) => {
      this.gltfLoader.load(path, resolve, undefined, reject);
    });
  }

  prepareModel(model, { roughness = 0.25, metalness = 0.2, boostEmissive = false } = {}) {
    model.frustumCulled = false;
    model.traverse((child) => {
      child.frustumCulled = false;
      if (!child.isMesh) return;
      child.castShadow = true;
      child.receiveShadow = true;
      const mats = Array.isArray(child.material) ? child.material : [child.material];
      mats.forEach((material) => {
        if (!material) return;
        if (material.roughness !== undefined) material.roughness = roughness;
        if (material.metalness !== undefined) material.metalness = metalness;
        if (boostEmissive && material.emissive && material.color) {
          const c = material.color;
          const chroma = Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b);
          if (chroma > 0.18) {
            material.emissive = c.clone().multiplyScalar(0.45);
            material.emissiveIntensity = Math.max(material.emissiveIntensity || 0, 0.85);
          }
        }
      });
    });
  }

  collectMeshes(root) {
    const meshes = [];
    root.traverse((child) => {
      if (child.isMesh) meshes.push(child);
    });
    return meshes;
  }

  findDeckY(root, x, z) {
    root.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const heightRatio = size.y / Math.max(size.x, size.z, 0.001);

    if (heightRatio < 0.55) {
      return box.max.y;
    }

    const maxDeckY = box.min.y + size.y * 0.48;
    const meshes = this.collectMeshes(root);
    const raycaster = new THREE.Raycaster();
    raycaster.far = 80;

    let bestY = null;
    const offsets = [
      [0, 0],
      [0.12, 0],
      [-0.12, 0],
      [0, 0.12],
      [0, -0.12]
    ];

    for (const [dx, dz] of offsets) {
      raycaster.set(
        new THREE.Vector3(x + dx, box.max.y + 4, z + dz),
        new THREE.Vector3(0, -1, 0)
      );
      const hits = raycaster.intersectObjects(meshes, true);
      for (const hit of hits) {
        let ny = 1;
        if (hit.face) {
          const n = hit.face.normal.clone();
          n.transformDirection(hit.object.matrixWorld);
          ny = n.y;
        }
        if (ny > 0.4 && hit.point.y <= maxDeckY && hit.point.y > box.min.y + 0.04) {
          if (bestY === null || hit.point.y > bestY) bestY = hit.point.y;
          break;
        }
      }
    }

    if (bestY === null) {
      bestY = box.min.y + size.y * 0.2;
    }
    return bestY;
  }

  fitAndGround(model, targetSize, mode = 'max') {
    const bbox = new THREE.Box3().setFromObject(model);
    const size = bbox.getSize(new THREE.Vector3());
    const dim = mode === 'width'
      ? Math.max(size.x, size.z)
      : Math.max(size.x, size.y, size.z);
    model.scale.setScalar(targetSize / (dim || 1));

    const scaled = new THREE.Box3().setFromObject(model);
    const center = scaled.getCenter(new THREE.Vector3());
    model.position.x -= center.x;
    model.position.z -= center.z;
    model.position.y -= scaled.min.y;
    return new THREE.Box3().setFromObject(model);
  }

  makeClickable(model, group, data) {
    model.traverse((child) => {
      if (!child.isMesh) return;
      this.interactiveObjects.push(child);
      child.userData = {
        ...data,
        onClick: () => {
          audioManager.playMemberClick();
          const worldPos = new THREE.Vector3();
          group.getWorldPosition(worldPos);
          worldPos.y += 1.2;
          this.sparks.trigger(worldPos, new THREE.Color(data.sparkColor || 0x00ffff), 40, 4.5);
          gsap.to(group.position, {
            y: this.robotBaseY + 0.28,
            yoyo: true,
            repeat: 1,
            duration: 0.22
          });
        }
      };
    });
  }

  frameMainHall() {
    if (!this.sceneManager || !this.platformGroup) return;

    const box = new THREE.Box3().setFromObject(this.platformGroup);
    if (this.robotGroup) box.expandByObject(this.robotGroup);

    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const dist = Math.max(size.x, size.y, size.z) * 1.45 + 2.2;

    this.sceneManager.cameraPos.set(center.x, center.y + size.y * 0.28 + 0.8, center.z + dist);
    this.sceneManager.currentTarget.set(center.x, center.y + size.y * 0.12, center.z);
  }

  async loadMainHallAssets() {
    this.platformGroup = new THREE.Group();
    this.scene.add(this.platformGroup);

    this.robotGroup = new THREE.Group();
    this.scene.add(this.robotGroup);

    try {
      const platformGltf = await this.loadGltf(assetUrl('/models/Meshy_AI_Neon_Cyber_Synergy_0828223202_texture.glb'));
      const platform = platformGltf.scene;
      this.prepareModel(platform, { roughness: 0.22, metalness: 0.4, boostEmissive: true });
      const platformBox = this.fitAndGround(platform, 7.2, 'width');
      this.platformMesh = platform;
      this.platformGroup.add(platform);
      this.platformGroup.updateMatrixWorld(true);
      this.outlinePlatformScreens(platform);

      const platformSize = platformBox.getSize(new THREE.Vector3());
      const botX = -platformSize.x * 0.24;
      const botZ = platformSize.z * 0.14;

      const botGltf = await this.loadGltf(assetUrl('/models/Meshy_AI_Graffiti_Bot_0828212914_texture.glb'));
      const bot = botGltf.scene;
      this.prepareModel(bot, { roughness: 0.22, metalness: 0.18, boostEmissive: true });
      this.fitAndGround(bot, Math.min(1.62, platformSize.y * 0.504), 'max');
      bot.rotation.y = 0.22;
      this.robotMesh = bot;
      this.robotGroup.add(bot);

      this.robotBaseY = this.findDeckY(this.platformGroup, botX, botZ);
      this.robotGroup.position.set(botX, this.robotBaseY, botZ);

      this.makeClickable(bot, this.robotGroup, {
        type: 'robot',
        name: 'Bot Guía de Innovación (Meshy 3D)',
        description: 'Avatar 3D sobre la plataforma Neon Cyber Synergy.',
        sparkColor: 0x00ffff
      });

      if (this.showBackgroundWall) {
        this.createBackgroundWallAndScreens(platformBox);
      }

      this.frameMainHall();
    } catch (error) {
      console.error('No se pudieron cargar los GLB de la sala principal:', error);
    }
  }

  createConnectingLightBridges() {
    const bridgeGeo = new THREE.BoxGeometry(1.6, 0.1, 4.0);
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x141a26,
      roughness: 0.4,
      metalness: 0.3
    });
    const bridgeMesh = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridgeMesh.position.set(0, -0.35, -1.2);
    this.scene.add(bridgeMesh);

    const railMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const railL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 4.0), railMat);
    railL.position.set(-0.75, -0.28, -1.2);
    const railR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 4.0), railMat);
    railR.position.set(0.75, -0.28, -1.2);
    this.scene.add(railL, railR);
  }

  // FLOATING PROJECTS CORE (PRESERVED & READY)
  createFloatingProjectsCore() {
    this.coreGroup = new THREE.Group();
    this.coreGroup.position.set(0, 0.4, -4.6);

    const baseGeo = new THREE.CylinderGeometry(3.6, 4.2, 1.2, 8);
    const baseMesh = new THREE.Mesh(baseGeo, this.matPlatformDark);
    baseMesh.position.y = -0.6;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.coreGroup.add(baseMesh);

    const topGeo = new THREE.CylinderGeometry(3.4, 3.4, 0.15, 8);
    const topMesh = new THREE.Mesh(topGeo, this.matPlatformLight);
    topMesh.position.y = 0.08;
    this.coreGroup.add(topMesh);

    const outerRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.08, 8, 32), this.matGlowCyan);
    outerRing.rotation.x = Math.PI / 2;
    outerRing.position.y = 0.18;
    this.coreGroup.add(outerRing);

    const emitterBaseGeo = new THREE.CylinderGeometry(1.2, 1.5, 0.5, 8);
    const emitterBase = new THREE.Mesh(emitterBaseGeo, this.matPlatformDark);
    emitterBase.position.y = 0.35;
    this.coreGroup.add(emitterBase);

    const beamRing = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.1, 8, 32), this.matGlowAmber);
    beamRing.rotation.x = Math.PI / 2;
    beamRing.position.y = 0.62;
    this.coreGroup.add(beamRing);

    const beamGeo = new THREE.ConeGeometry(1.4, 3.6, 16, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xffb703,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 2.4;
    this.coreGroup.add(beamMesh);

    const crystalGeo = new THREE.IcosahedronGeometry(0.85, 0);
    this.energyCrystal = new THREE.Mesh(crystalGeo, this.matGlowAmber);
    this.energyCrystal.position.y = 2.8;
    this.coreGroup.add(this.energyCrystal);

    this.coreLight = new THREE.PointLight(0xffaa00, 4.5, 9.0);
    this.coreLight.position.y = 2.8;
    this.coreGroup.add(this.coreLight);

    const projectsData = [
      {
        id: 'titan-k8s',
        title: 'Project Titan',
        subtitle: 'Kubernetes Cloud Mesh',
        tag: 'DEVOPS / CLOUD',
        color: '#00f0ff',
        url: 'https://github.com/topics/kubernetes',
        desc: 'Arquitectura de microservicios distribuida con auto-escalado horizontal.'
      },
      {
        id: 'neural-ai',
        title: 'NeuralNexus AI',
        subtitle: 'Multi-Agent Intelligence',
        tag: 'GENAI / PYTHON',
        color: '#ff0066',
        url: 'https://github.com/topics/artificial-intelligence',
        desc: 'Motor de agentes autónomos con Retrieval-Augmented Generation (RAG).'
      },
      {
        id: 'spatial-3d',
        title: 'Spatial WebGL Engine',
        subtitle: 'Three.js 3D Platform',
        tag: 'WEBGL / 3D',
        color: '#ffaa00',
        url: 'https://threejs.org/',
        desc: 'Experiencia interactiva 3D con shaders GLSL personalizados.'
      },
      {
        id: 'fin-pulse',
        title: 'FinPulse Broker',
        subtitle: 'Distributed Event Streamer',
        tag: 'BACKEND / GO',
        color: '#00ff88',
        url: 'https://github.com/topics/distributed-systems',
        desc: 'Pipeline de procesamiento de eventos en tiempo real con Apache Kafka.'
      },
      {
        id: 'security-shield',
        title: 'CyberShield Zero-Trust',
        subtitle: 'Identity & Access Mesh',
        tag: 'SECURITY / INFRA',
        color: '#a855f7',
        url: 'https://github.com/topics/security',
        desc: 'Sistema integral de autenticación biométrica y tokens efímeros.'
      },
      {
        id: 'omni-cloud',
        title: 'OmniCloud Hub',
        subtitle: 'Serverless Multi-Cloud CI/CD',
        tag: 'TERRAFORM / AWS',
        color: '#38bdf8',
        url: 'https://github.com/topics/devops',
        desc: 'Automatización de infraestructura declarativa con Terraform.'
      }
    ];

    const radius = 2.8;
    projectsData.forEach((pData, idx) => {
      const angle = (idx / projectsData.length) * Math.PI * 2;
      const pGroup = new THREE.Group();

      const cardGeo = new THREE.BoxGeometry(1.15, 0.82, 0.1);
      const cardTex = this.createTextTexture(pData.title, pData.tag, '#0d1322', pData.color, 512, 360);
      const cardMat = new THREE.MeshStandardMaterial({
        map: cardTex,
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color(pData.color),
        emissiveIntensity: 0.35
      });

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.castShadow = true;
      pGroup.add(cardMesh);

      const frameGeo = new THREE.BoxGeometry(1.22, 0.88, 0.07);
      const frameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pData.color) });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.z = -0.04;
      pGroup.add(frameMesh);

      pGroup.position.set(Math.cos(angle) * radius, 2.8 + (idx % 2) * 0.45, Math.sin(angle) * radius);
      pGroup.lookAt(0, 2.8, 0);
      pGroup.rotateY(Math.PI);

      this.coreGroup.add(pGroup);

      cardMesh.name = pData.id;
      cardMesh.userData = {
        type: 'project',
        name: pData.title,
        subtitle: pData.subtitle,
        tag: pData.tag,
        description: pData.desc,
        url: pData.url,
        color: pData.color,
        onClick: () => {
          audioManager.playProjectClick();
          const worldPos = new THREE.Vector3();
          cardMesh.getWorldPosition(worldPos);
          this.sparks.trigger(worldPos, new THREE.Color(pData.color), 35, 4.0);

          gsap.to(pGroup.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.15, yoyo: true, repeat: 1 });
          window.dispatchEvent(new CustomEvent('open-project-modal', { detail: pData }));
        }
      };
      this.interactiveObjects.push(cardMesh);

      this.orbitingProjects.push({
        group: pGroup,
        mesh: cardMesh,
        angle,
        radius,
        baseY: 2.8 + (idx % 2) * 0.45,
        speed: 0.32
      });
    });

    this.scene.add(this.coreGroup);
  }

  // BACKGROUND WALL & AMBIENT SCREENS
  createBackgroundWallAndScreens(platformBox = null) {
    this.wallGroup = new THREE.Group();
    const wallZ = platformBox ? platformBox.min.z - 1.8 : -6.2;
    const wallY = platformBox ? platformBox.min.y + 2.4 : 2.2;
    this.wallGroup.position.set(0, wallY, wallZ);

    const wallGeo = new THREE.BoxGeometry(14.0, 5.5, 0.4);
    const wallMesh = new THREE.Mesh(wallGeo, this.matDarkWall);
    this.wallGroup.add(wallMesh);

    const mapGeo = new THREE.PlaneGeometry(4.0, 2.2);
    const mapTex = this.createTextTexture('GLOBAL NETWORK', 'CONNECTED SERVERS: 24 NODES', '#09101d', '#00f0ff', 1024, 600);
    const mapMesh = new THREE.Mesh(mapGeo, new THREE.MeshBasicMaterial({ map: mapTex }));
    mapMesh.position.set(-3.8, 0.2, 0.25);
    this.wallGroup.add(mapMesh);

    const codeGeo = new THREE.PlaneGeometry(2.0, 2.2);
    const codeTex = this.createTextTexture('CODE STREAM', 'SYSTEM: ONLINE', '#09101d', '#00ff88', 512, 600);
    const codeMesh = new THREE.Mesh(codeGeo, new THREE.MeshBasicMaterial({ map: codeTex }));
    codeMesh.position.set(-0.5, 0.2, 0.25);
    this.wallGroup.add(codeMesh);

    const figmaTex = this.createTextTexture('Figma Design', 'UI/UX SYSTEM', '#18121f', '#ff0077', 512, 256);
    const figmaMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: figmaTex }));
    figmaMesh.position.set(2.4, 0.6, 0.25);

    const dockerTex = this.createTextTexture('Docker Sandbox', 'CONTAINERS', '#0d1829', '#0099ff', 512, 256);
    const dockerMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: dockerTex }));
    dockerMesh.position.set(4.2, 0.6, 0.25);

    this.wallGroup.add(figmaMesh, dockerMesh);

    // Particle Dust
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const posArr = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3 + 0] = (Math.random() - 0.5) * 10.0;
      posArr[i * 3 + 1] = Math.random() * 4.5 + 0.2;
      posArr[i * 3 + 2] = (Math.random() - 0.5) * 6.0;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x00f0ff,
      size: 0.05,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    this.particles = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particles);

    this.scene.add(this.wallGroup);
  }

  update(elapsedTime, deltaTime) {
    if (this.robotGroup && this.robotMesh) {
      this.robotGroup.position.y = this.robotBaseY;
    }

    if (this.energyCrystal && this.showProjectCore) {
      this.energyCrystal.rotation.x = elapsedTime * 0.9;
      this.energyCrystal.rotation.y = elapsedTime * 1.4;
      this.energyCrystal.position.y = 2.8 + Math.sin(elapsedTime * 2.5) * 0.1;
    }

    if (this.showProjectCore) {
      this.orbitingProjects.forEach(p => {
        p.angle += p.speed * deltaTime;
        p.group.position.x = Math.cos(p.angle) * p.radius;
        p.group.position.z = Math.sin(p.angle) * p.radius;
        p.group.position.y = p.baseY + Math.sin(elapsedTime * 1.8 + p.angle) * 0.15;
        p.group.lookAt(0, 2.8, 0);
        p.group.rotateY(Math.PI);
      });
    }

    const active = this.backdrops?.[this.currentBackdrop];
    if (active) {
      active.traverse((child) => {
        if (child.userData?.kind === 'stars') {
          child.rotation.y = elapsedTime * 0.012;
        }
        if (child.userData?.kind === 'dust') {
          child.rotation.y = elapsedTime * 0.03;
        }
      });
    }

    if (this.currentBackdrop === 'matrix' && this.matrixRain) {
      const pos = this.matrixRain.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - this.rainSpeeds[i] * deltaTime;
        if (y < -1) y = 11 + Math.random() * 2;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    if (this.holoGlow) {
      this.holoGlow.material.opacity = 0.14 + Math.sin(elapsedTime * 1.6) * 0.05;
    }

    this.sparks.update(deltaTime);
  }
}
