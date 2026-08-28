import * as THREE from 'three';
import gsap from 'gsap';
import { audioManager } from '../audio/audioManager.js';
import { SparkSystem } from '../effects/sparks.js';

export class World {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    this.interactiveObjects = [];
    this.orbitingProjects = [];
    this.teamMembers = [];
    this.skills = [];
    this.dataPackets = [];
    this.clouds = [];

    this.sparks = new SparkSystem(this.scene);

    this.init();
  }

  init() {
    this.createMaterials();
    this.createPlatformsAndBridges();
    this.createWelcomeHub();
    this.createCentralProjectTower();
    this.createRoom1EngineRoom();
    this.createRoom2IdeaLab();
    this.createRoom3TeamSquare();
    this.createRoom4SkillTree();
    this.createBackgroundClouds();
  }

  createMaterials() {
    // Dark Sleek Tech Platforms
    this.matPlatformDark = new THREE.MeshStandardMaterial({
      color: 0x181e2b,
      roughness: 0.4,
      metalness: 0.35,
      flatShading: false
    });

    this.matPlatformTop = new THREE.MeshStandardMaterial({
      color: 0x222a3d,
      roughness: 0.3,
      metalness: 0.2
    });

    // Glossy Robot White Ceramic
    this.matRobotWhite = new THREE.MeshPhysicalMaterial({
      color: 0xf4f7fb,
      roughness: 0.15,
      metalness: 0.05,
      clearcoat: 0.9,
      clearcoatRoughness: 0.1
    });

    // Dark Gunmetal / Titanium Mechanics
    this.matGunmetal = new THREE.MeshStandardMaterial({
      color: 0x262b36,
      roughness: 0.35,
      metalness: 0.85
    });

    // Brushed Aluminum for Terminal
    this.matBrushedAlu = new THREE.MeshStandardMaterial({
      color: 0x9aa4b2,
      roughness: 0.3,
      metalness: 0.7
    });

    // Glowing Visor & Lasers
    this.matGlowCyan = new THREE.MeshStandardMaterial({
      color: 0x00f5ff,
      emissive: 0x00e1ff,
      emissiveIntensity: 3.2,
      roughness: 0.1
    });

    this.matGlowAmber = new THREE.MeshStandardMaterial({
      color: 0xffaa00,
      emissive: 0xff8800,
      emissiveIntensity: 2.5,
      roughness: 0.1
    });

    // Holographic Glass Slab
    this.matHoloGlass = new THREE.MeshPhysicalMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.45,
      roughness: 0.05,
      metalness: 0.1,
      transmission: 0.85,
      ior: 1.5
    });

    this.matWarmWall = new THREE.MeshStandardMaterial({
      color: 0xf39c6b,
      roughness: 0.5,
      metalness: 0.05
    });

    this.matWood = new THREE.MeshStandardMaterial({
      color: 0x7c5335,
      roughness: 0.7,
      flatShading: true
    });

    this.matFoliage = new THREE.MeshStandardMaterial({
      color: 0x44bd32,
      roughness: 0.4,
      emissive: 0x228811,
      emissiveIntensity: 0.3,
      flatShading: true
    });

    this.matCloud = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.05,
      flatShading: true
    });
  }

  // Helper to generate dynamic canvas textures
  createTextTexture(text, subtitle = '', bg = '#161c2d', color = '#00ffff', width = 512, height = 256) {
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
    ctx.font = 'bold 32px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, subtitle ? height / 2 - 22 : height / 2);

    if (subtitle) {
      ctx.fillStyle = color;
      ctx.font = '600 19px "JetBrains Mono", monospace';
      ctx.fillText(subtitle, width / 2, height / 2 + 28);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // Perforated Illuminated Grid Floor Texture
  createGridFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#121722';
    ctx.fillRect(0, 0, 512, 512);

    // Glowing cyan dots / honeycomb mesh
    ctx.fillStyle = '#00e5ff';
    for (let x = 8; x < 512; x += 16) {
      for (let y = 8; y < 512; y += 16) {
        ctx.beginPath();
        ctx.arc(x, y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  createPlatformsAndBridges() {
    const bridgePositions = [
      { start: new THREE.Vector3(-4.5, 0.4, -1.8), end: new THREE.Vector3(-1.8, 0.6, -0.4) },
      { start: new THREE.Vector3(2.5, 0.4, -3.2), end: new THREE.Vector3(0.8, 0.6, -1.2) },
      { start: new THREE.Vector3(3.8, 0.4, 2.0), end: new THREE.Vector3(1.4, 0.6, 0.6) },
      { start: new THREE.Vector3(-0.2, 0.4, 4.2), end: new THREE.Vector3(0.0, 0.6, 1.8) }
    ];

    bridgePositions.forEach(b => {
      const curve = new THREE.LineCurve3(b.start, b.end);
      const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.35, 8, false);
      const tubeMesh = new THREE.Mesh(tubeGeo, this.matPlatformDark);
      tubeMesh.castShadow = true;
      tubeMesh.receiveShadow = true;
      this.scene.add(tubeMesh);

      const innerGeo = new THREE.TubeGeometry(curve, 20, 0.15, 8, false);
      const innerMesh = new THREE.Mesh(innerGeo, this.matGlowCyan);
      this.scene.add(innerMesh);

      for (let p = 0; p < 3; p++) {
        const pGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const pMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const pMesh = new THREE.Mesh(pGeo, pMat);
        this.scene.add(pMesh);

        this.dataPackets.push({
          mesh: pMesh,
          curve: curve,
          progress: (p / 3) + Math.random() * 0.2,
          speed: 0.35 + Math.random() * 0.15
        });
      }
    });
  }

  // 1. FRONT ROOM: WELCOME HUB, GUIDE BOT & TERMINAL 01 (MATCHING REFERENCE IMAGES)
  createWelcomeHub() {
    this.welcomeGroup = new THREE.Group();
    this.welcomeGroup.position.set(-0.5, 0, 5.2);

    // Dark Base Platform
    const baseGeo = new THREE.BoxGeometry(6.6, 1.0, 4.4);
    const baseMesh = new THREE.Mesh(baseGeo, this.matPlatformDark);
    baseMesh.position.y = -0.5;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.welcomeGroup.add(baseMesh);

    // Illuminated Honeycomb Tech Grid Floor Plate
    const gridTex = this.createGridFloorTexture();
    const gridMat = new THREE.MeshStandardMaterial({
      color: 0x88d5ff,
      map: gridTex,
      emissive: 0x004466,
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.4
    });

    const gridGeo = new THREE.BoxGeometry(5.8, 0.1, 3.6);
    const gridMesh = new THREE.Mesh(gridGeo, gridMat);
    gridMesh.position.y = 0.05;
    gridMesh.receiveShadow = true;
    this.welcomeGroup.add(gridMesh);

    // Glowing Cyan Linear Light Strips on floor edges
    const stripMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
    const stripL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 3.5), stripMat);
    stripL.position.set(-2.85, 0.11, 0);
    const stripR = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 3.5), stripMat);
    stripR.position.set(2.85, 0.11, 0);
    const stripF = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.06, 0.08), stripMat);
    stripF.position.set(0, 0.11, 1.75);
    this.welcomeGroup.add(stripL, stripR, stripF);

    // --- DETAILED GUIDE BOT (MATCHING media_1787951236192.png) ---
    this.robotGroup = new THREE.Group();
    this.robotGroup.position.set(-1.35, 0.1, 0.35);

    // 1. Head (Spherical glossy ceramic head)
    const headGeo = new THREE.SphereGeometry(0.48, 32, 32);
    this.robotHead = new THREE.Mesh(headGeo, this.matRobotWhite);
    this.robotHead.position.y = 1.38;
    this.robotHead.castShadow = true;

    // Head Ear Caps
    const earGeo = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 16);
    const earL = new THREE.Mesh(earGeo, this.matGunmetal);
    earL.rotation.z = Math.PI / 2;
    earL.position.set(-0.46, 0, 0);
    const earR = new THREE.Mesh(earGeo, this.matGunmetal);
    earR.rotation.z = Math.PI / 2;
    earR.position.set(0.46, 0, 0);
    this.robotHead.add(earL, earR);

    // Horizontal Wide Cyan Visor (Glowing Eye Strip)
    const visorBezelGeo = new THREE.BoxGeometry(0.58, 0.18, 0.16);
    const visorBezel = new THREE.Mesh(visorBezelGeo, this.matGunmetal);
    visorBezel.position.set(0, -0.02, 0.38);

    const visorCoreGeo = new THREE.BoxGeometry(0.52, 0.12, 0.18);
    const visorCore = new THREE.Mesh(visorCoreGeo, this.matGlowCyan);
    visorCore.position.set(0, -0.02, 0.39);
    this.robotHead.add(visorBezel, visorCore);

    // Antenna on top
    const antStem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.22), this.matGunmetal);
    antStem.position.set(0, 0.52, 0);
    const antCap = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), this.matGlowCyan);
    antCap.position.set(0, 0.65, 0);
    this.robotHead.add(antStem, antCap);

    // 2. Neck Joint
    const neckMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.15, 16), this.matGunmetal);
    neckMesh.position.y = 0.96;

    // 3. Torso (Segmented cute armored body)
    const torsoGeo = new THREE.CylinderGeometry(0.34, 0.42, 0.6, 20);
    const torsoMesh = new THREE.Mesh(torsoGeo, this.matRobotWhite);
    torsoMesh.position.y = 0.72;
    torsoMesh.castShadow = true;

    // Chest Plate seam
    const chestPlate = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.22, 0.12), this.matRobotWhite);
    chestPlate.position.set(0, 0.8, 0.32);
    torsoMesh.add(chestPlate);

    // 4. Arms with articulated shoulder balls
    const shoulderGeo = new THREE.SphereGeometry(0.12, 12, 12);
    const armSegmentGeo = new THREE.CylinderGeometry(0.075, 0.085, 0.35, 12);
    const handGeo = new THREE.SphereGeometry(0.09, 8, 8);

    // Left Arm (Interactive Waving Arm)
    this.robotLeftArm = new THREE.Group();
    this.robotLeftArm.position.set(-0.48, 0.88, 0.05);

    const leftShoulder = new THREE.Mesh(shoulderGeo, this.matGunmetal);
    const leftArmMesh = new THREE.Mesh(armSegmentGeo, this.matRobotWhite);
    leftArmMesh.position.set(-0.1, -0.22, 0.1);
    leftArmMesh.rotation.z = 0.4;
    leftArmMesh.rotation.x = -0.5;
    const leftHand = new THREE.Mesh(handGeo, this.matGunmetal);
    leftHand.position.set(-0.2, -0.42, 0.2);

    this.robotLeftArm.add(leftShoulder, leftArmMesh, leftHand);

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.48, 0.88, 0.05);
    const rightShoulder = new THREE.Mesh(shoulderGeo, this.matGunmetal);
    const rightArmMesh = new THREE.Mesh(armSegmentGeo, this.matRobotWhite);
    rightArmMesh.position.set(0.08, -0.22, 0.05);
    rightArmMesh.rotation.z = -0.2;
    const rightHand = new THREE.Mesh(handGeo, this.matGunmetal);
    rightHand.position.set(0.14, -0.42, 0.1);
    rightArmGroup.add(rightShoulder, rightArmMesh, rightHand);

    // 5. Legs & Feet
    const legGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.35, 12);
    const footGeo = new THREE.BoxGeometry(0.2, 0.12, 0.3);

    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.18, 0.35, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.matRobotWhite);
    const leftFoot = new THREE.Mesh(footGeo, this.matRobotWhite);
    leftFoot.position.set(0, -0.2, 0.06);
    leftLegGroup.add(leftLegMesh, leftFoot);

    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.18, 0.35, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.matRobotWhite);
    const rightFoot = new THREE.Mesh(footGeo, this.matRobotWhite);
    rightFoot.position.set(0, -0.2, 0.06);
    rightLegGroup.add(rightLegMesh, rightFoot);

    this.robotGroup.add(
      this.robotHead,
      neckMesh,
      torsoMesh,
      this.robotLeftArm,
      rightArmGroup,
      leftLegGroup,
      rightLegGroup
    );
    this.welcomeGroup.add(this.robotGroup);

    // Interactive Robot Click
    this.robotHead.userData = {
      type: 'robot',
      name: 'Bot Guía de Innovación',
      description: '¡Bienvenido! Soy tu guía por el campus. Puedes recorrer los 6 escenarios con las flechas o el menú.',
      onClick: () => {
        audioManager.playMemberClick();
        this.sparks.trigger(this.robotGroup.position.clone().add(new THREE.Vector3(-0.5, 1.5, 5.2)), new THREE.Color(0x00ffff), 35, 4.5);
        gsap.to(this.robotGroup.position, { y: 0.45, yoyo: true, repeat: 1, duration: 0.22 });
      }
    };
    this.interactiveObjects.push(this.robotHead);

    // --- TERMINAL 01 KIOSK & HOLOGRAPHIC PROJECTION (MATCHING media_1787951214070.png) ---
    const kioskGroup = new THREE.Group();
    kioskGroup.position.set(0.85, 0.1, 0.5);

    // Kiosk Body (Brushed Titanium / Aluminum)
    const kioskBodyGeo = new THREE.BoxGeometry(1.25, 0.95, 0.75);
    const kioskBody = new THREE.Mesh(kioskBodyGeo, this.matBrushedAlu);
    kioskBody.position.y = 0.48;
    kioskBody.castShadow = true;
    kioskGroup.add(kioskBody);

    // Angled Screen Display
    const screenFrameGeo = new THREE.BoxGeometry(1.15, 0.65, 0.06);
    const screenFrame = new THREE.Mesh(screenFrameGeo, this.matGunmetal);
    screenFrame.position.set(0, 0.98, 0.1);
    screenFrame.rotation.x = -0.45;

    const screenTex = this.createTextTexture('TERMINAL 01', 'STATUS: SYSTEM ONLINE', '#09101d', '#00ffff', 512, 256);
    const screenMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.55), new THREE.MeshBasicMaterial({ map: screenTex }));
    screenMesh.position.z = 0.04;
    screenFrame.add(screenMesh);
    kioskGroup.add(screenFrame);

    // Holographic Glass Projector Plate ("IT CREATIVE SYNERGY - WELCOME TO THE GLOBAL HUB")
    const holoCanvas = document.createElement('canvas');
    holoCanvas.width = 1024;
    holoCanvas.height = 512;
    const hCtx = holoCanvas.getContext('2d');

    // Translucent gradient glass background
    hCtx.fillStyle = 'rgba(6, 18, 38, 0.75)';
    hCtx.beginPath();
    hCtx.roundRect(0, 0, 1024, 512, 32);
    hCtx.fill();

    hCtx.strokeStyle = 'rgba(0, 240, 255, 0.8)';
    hCtx.lineWidth = 8;
    hCtx.beginPath();
    hCtx.roundRect(6, 6, 1012, 498, 28);
    hCtx.stroke();

    hCtx.fillStyle = '#ffffff';
    hCtx.font = 'bold 54px "Plus Jakarta Sans", sans-serif';
    hCtx.textAlign = 'center';
    hCtx.fillText('IT CREATIVE SYNERGY', 512, 220);

    hCtx.fillStyle = '#00f0ff';
    hCtx.font = '600 32px "JetBrains Mono", monospace';
    hCtx.fillText('WELCOME TO THE GLOBAL HUB', 512, 310);

    const holoTex = new THREE.CanvasTexture(holoCanvas);
    holoTex.colorSpace = THREE.SRGBColorSpace;

    const holoGlassGeo = new THREE.PlaneGeometry(2.6, 1.3);
    const holoGlassMat = new THREE.MeshPhysicalMaterial({
      map: holoTex,
      transparent: true,
      opacity: 0.92,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.3,
      side: THREE.DoubleSide
    });

    const holoGlassMesh = new THREE.Mesh(holoGlassGeo, holoGlassMat);
    holoGlassMesh.position.set(0.6, 1.85, -0.4);
    holoGlassMesh.rotation.y = -0.15;
    kioskGroup.add(holoGlassMesh);

    this.welcomeGroup.add(kioskGroup);

    // Background Holographic Round Table
    const holoTableGroup = new THREE.Group();
    holoTableGroup.position.set(-0.2, 0.1, -1.2);

    const tableBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.0, 0.5, 8), this.matPlatformDark);
    tableBase.position.y = 0.25;

    const tableRing = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.06, 8, 32), this.matGlowCyan);
    tableRing.rotation.x = Math.PI / 2;
    tableRing.position.y = 0.52;

    holoTableGroup.add(tableBase, tableRing);
    this.welcomeGroup.add(holoTableGroup);

    this.scene.add(this.welcomeGroup);
  }

  // 2. CENTRAL HUB: FLOATING PROJECTS CORE TOWER
  createCentralProjectTower() {
    this.towerGroup = new THREE.Group();
    this.towerGroup.position.set(0, 0.2, 0);

    const baseGeo = new THREE.CylinderGeometry(2.4, 2.8, 1.4, 8);
    const baseMesh = new THREE.Mesh(baseGeo, this.matPlatformDark);
    baseMesh.position.y = 0.2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    this.towerGroup.add(baseMesh);

    const ringGeo = new THREE.TorusGeometry(2.1, 0.12, 8, 32);
    const ringMesh = new THREE.Mesh(ringGeo, this.matGlowCyan);
    ringMesh.rotation.x = Math.PI / 2;
    ringMesh.position.y = 0.92;
    this.towerGroup.add(ringMesh);

    const coreGeo = new THREE.OctahedronGeometry(0.75, 0);
    this.energyCore = new THREE.Mesh(coreGeo, this.matGlowAmber);
    this.energyCore.position.y = 2.1;
    this.towerGroup.add(this.energyCore);

    this.towerLight = new THREE.PointLight(0xffaa00, 3.5, 8.0);
    this.towerLight.position.y = 2.1;
    this.towerGroup.add(this.towerLight);

    const projectsData = [
      {
        id: 'titan-k8s',
        title: 'Project Titan',
        subtitle: 'Kubernetes Cloud Mesh',
        tag: 'DEVOPS / CLOUD',
        color: '#00f0ff',
        url: 'https://github.com/topics/kubernetes',
        desc: 'Arquitectura de microservicios distribuida con auto-escalado horizontal, balanceo de carga y observabilidad Prometheus/Grafana.'
      },
      {
        id: 'neural-ai',
        title: 'NeuralNexus AI',
        subtitle: 'Multi-Agent Intelligence',
        tag: 'GENAI / PYTHON',
        color: '#ff0066',
        url: 'https://github.com/topics/artificial-intelligence',
        desc: 'Motor de agentes autónomos con Retrieval-Augmented Generation (RAG), vector databases y flujos conversacionales multimodales.'
      },
      {
        id: 'spatial-3d',
        title: 'Spatial WebGL Engine',
        subtitle: 'Three.js 3D Platform',
        tag: 'WEBGL / 3D',
        color: '#ffaa00',
        url: 'https://threejs.org/',
        desc: 'Experiencia interactiva 3D con shaders GLSL personalizados, iluminación PBR, física en tiempo real y audio espacial Web Audio.'
      },
      {
        id: 'fin-pulse',
        title: 'FinPulse Broker',
        subtitle: 'Distributed Event Streamer',
        tag: 'BACKEND / GO',
        color: '#00ff88',
        url: 'https://github.com/topics/distributed-systems',
        desc: 'Pipeline de procesamiento de eventos en tiempo real tolerante a fallos con Apache Kafka, Redis y latencia submilisegundo.'
      },
      {
        id: 'security-shield',
        title: 'CyberShield Zero-Trust',
        subtitle: 'Identity & Access Mesh',
        tag: 'SECURITY / INFRA',
        color: '#a855f7',
        url: 'https://github.com/topics/security',
        desc: 'Sistema integral de autenticación biométrica, tokens efímeros, mTLS y protección de endpoints para infraestructuras críticas.'
      },
      {
        id: 'omni-cloud',
        title: 'OmniCloud Hub',
        subtitle: 'Serverless Multi-Cloud CI/CD',
        tag: 'TERRAFORM / AWS',
        color: '#38bdf8',
        url: 'https://github.com/topics/devops',
        desc: 'Automatización de infraestructura declarativa con Terraform, despliegues sin interrupción (Zero-Downtime) y gobernanza multicloud.'
      }
    ];

    const radius = 3.4;
    projectsData.forEach((pData, idx) => {
      const angle = (idx / projectsData.length) * Math.PI * 2;
      const pGroup = new THREE.Group();

      const cardGeo = new THREE.BoxGeometry(1.25, 0.9, 0.12);
      const cardTex = this.createTextTexture(pData.title, pData.tag, '#111827', pData.color, 512, 360);
      const cardMat = new THREE.MeshStandardMaterial({
        map: cardTex,
        roughness: 0.2,
        metalness: 0.1,
        emissive: new THREE.Color(pData.color),
        emissiveIntensity: 0.25
      });

      const cardMesh = new THREE.Mesh(cardGeo, cardMat);
      cardMesh.castShadow = true;
      pGroup.add(cardMesh);

      const frameGeo = new THREE.BoxGeometry(1.32, 0.97, 0.08);
      const frameMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(pData.color) });
      const frameMesh = new THREE.Mesh(frameGeo, frameMat);
      frameMesh.position.z = -0.04;
      pGroup.add(frameMesh);

      pGroup.position.set(Math.cos(angle) * radius, 2.2 + (idx % 2) * 0.6, Math.sin(angle) * radius);
      pGroup.lookAt(0, 2.4, 0);
      pGroup.rotateY(Math.PI);

      this.towerGroup.add(pGroup);

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
        baseY: 2.2 + (idx % 2) * 0.6,
        speed: 0.25
      });
    });

    this.scene.add(this.towerGroup);
  }

  // 3. ROOM 1: THE ENGINE ROOM (INFRASTRUCTURE & CLOUD ARCHITECTURE)
  createRoom1EngineRoom() {
    this.room1Group = new THREE.Group();
    this.room1Group.position.set(-7.5, 0, -2.5);

    const baseGeo = new THREE.BoxGeometry(6.4, 1.2, 5.8);
    const baseMesh = new THREE.Mesh(baseGeo, this.matPlatformDark);
    baseMesh.position.y = -0.6;
    baseMesh.castShadow = true;
    this.room1Group.add(baseMesh);

    const topGeo = new THREE.BoxGeometry(6.2, 0.15, 5.6);
    const topMesh = new THREE.Mesh(topGeo, this.matPlatformTop);
    topMesh.position.y = 0.05;
    this.room1Group.add(topMesh);

    const bannerTex = this.createTextTexture('ROOM 1 | THE ENGINE ROOM', 'INFRASTRUCTURE & CLOUD ARCHITECTURE', '#0f172a', '#00f0ff', 1024, 256);
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 1.0), new THREE.MeshBasicMaterial({ map: bannerTex }));
    bannerMesh.position.set(0, 4.4, -2.65);
    this.room1Group.add(bannerMesh);

    const wallGeo = new THREE.BoxGeometry(6.0, 3.8, 0.4);
    const wallMesh = new THREE.Mesh(wallGeo, this.matPlatformDark);
    wallMesh.position.set(0, 2.0, -2.7);
    wallMesh.castShadow = true;
    this.room1Group.add(wallMesh);

    const mapGeo = new THREE.PlaneGeometry(3.6, 2.2);
    const mapTex = this.createTextTexture('GLOBAL CLOUD INFRA', 'ACTIVE REGIONS: US-EAST, EU-WEST, SA-EAST', '#09101f', '#00ffff', 1024, 600);
    const mapMesh = new THREE.Mesh(mapGeo, new THREE.MeshBasicMaterial({ map: mapTex }));
    mapMesh.position.set(-1.0, 2.4, -2.45);
    this.room1Group.add(mapMesh);

    const chartGeo = new THREE.PlaneGeometry(1.6, 2.2);
    const chartTex = this.createTextTexture('METRICS', 'CPU: 18% | UPTIME: 99.99%', '#09101f', '#00ff88', 512, 600);
    const chartMesh = new THREE.Mesh(chartGeo, new THREE.MeshBasicMaterial({ map: chartTex }));
    chartMesh.position.set(1.9, 2.4, -2.45);
    this.room1Group.add(chartMesh);

    const turbineGroup = new THREE.Group();
    turbineGroup.position.set(1.4, 0.85, 0.4);
    const turbineCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.4, 16), this.matPlatformDark);
    turbineCyl.rotation.z = Math.PI / 2;
    turbineCyl.castShadow = true;
    const intakeMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.42, 16), this.matGlowCyan);
    intakeMesh.rotation.z = Math.PI / 2;
    turbineGroup.add(turbineCyl, intakeMesh);
    this.room1Group.add(turbineGroup);

    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.05, 8, 24), this.matGlowCyan);
    holoRing.position.set(-1.4, 0.3, 0.8);
    holoRing.rotation.x = Math.PI / 2;
    this.room1Group.add(holoRing);

    ['Dev', 'Infra', 'Cloud'].forEach((name, i) => {
      const btnMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.25, 12), this.matPlatformTop);
      btnMesh.position.set(-2.0 + i * 0.7, 0.2, 1.8);
      this.room1Group.add(btnMesh);

      btnMesh.userData = {
        type: 'infra_node',
        name: `Módulo de Infraestructura: ${name}`,
        description: `Orquestación de clusters y automatización de despliegues para el entorno ${name}.`,
        onClick: () => {
          audioManager.playSkillClick();
          this.sparks.trigger(btnMesh.position.clone().add(this.room1Group.position), new THREE.Color(0x00f0ff), 20, 3.5);
          gsap.to(btnMesh.position, { y: 0.1, yoyo: true, repeat: 1, duration: 0.15 });
        }
      };
      this.interactiveObjects.push(btnMesh);
    });

    this.scene.add(this.room1Group);
  }

  // 4. ROOM 2: THE IDEA LAB (MINI-PROJECTS & CONCEPTS)
  createRoom2IdeaLab() {
    this.room2Group = new THREE.Group();
    this.room2Group.position.set(3.2, 0, -5.5);

    const baseGeo = new THREE.BoxGeometry(5.4, 1.2, 5.0);
    const baseMesh = new THREE.Mesh(baseGeo, this.matPlatformDark);
    baseMesh.position.y = -0.6;
    baseMesh.castShadow = true;
    this.room2Group.add(baseMesh);

    const topGeo = new THREE.BoxGeometry(5.2, 0.15, 4.8);
    const topMesh = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ color: 0xefd3b5, roughness: 0.6 }));
    topMesh.position.y = 0.05;
    this.room2Group.add(topMesh);

    const bannerTex = this.createTextTexture('ROOM 2 | THE IDEA LAB', 'MINI-PROJECTS & CONCEPTS', '#2b1a11', '#ffaa00', 1024, 256);
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.9), new THREE.MeshBasicMaterial({ map: bannerTex }));
    bannerMesh.position.set(0, 3.8, -2.35);
    this.room2Group.add(bannerMesh);

    const wallGeo = new THREE.BoxGeometry(5.0, 3.2, 0.3);
    const wallMesh = new THREE.Mesh(wallGeo, this.matWarmWall);
    wallMesh.position.set(0, 1.6, -2.4);
    wallMesh.castShadow = true;
    this.room2Group.add(wallMesh);

    const bulbGroup = new THREE.Group();
    bulbGroup.position.set(-1.5, 2.5, -2.1);
    const bulbSphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), this.matGlowAmber);
    const bulbBase = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.2, 8), this.matPlatformDark);
    bulbBase.position.y = -0.3;
    bulbGroup.add(bulbSphere, bulbBase);
    this.room2Group.add(bulbGroup);

    bulbSphere.userData = {
      type: 'idea',
      name: 'Generador de Ideas e Innovación',
      description: 'Incubadora de prototipos rápidos, algoritmos experimentales y microservicios.',
      onClick: () => {
        audioManager.playProjectClick();
        this.sparks.trigger(bulbSphere.position.clone().add(this.room2Group.position), new THREE.Color(0xffbb00), 30, 4.0);
        gsap.to(bulbGroup.scale, { x: 1.4, y: 1.4, z: 1.4, yoyo: true, repeat: 1, duration: 0.15 });
      }
    };
    this.interactiveObjects.push(bulbSphere);

    const miniApps = [
      { name: 'AI Assistant', tag: 'PYTHON / RAG', x: -0.5, y: 2.4 },
      { name: 'React App', tag: 'VITE / TAILWIND', x: 1.2, y: 2.4 },
      { name: 'Figma Design', tag: 'UI / UX MESH', x: -0.5, y: 1.3 },
      { name: 'Docker Sandbox', tag: 'CONTAINERS', x: 1.2, y: 1.3 }
    ];

    miniApps.forEach(app => {
      const appGeo = new THREE.BoxGeometry(1.2, 0.75, 0.08);
      const appTex = this.createTextTexture(app.name, app.tag, '#211710', '#ff9900', 512, 320);
      const appMesh = new THREE.Mesh(appGeo, new THREE.MeshStandardMaterial({ map: appTex, roughness: 0.3 }));
      appMesh.position.set(app.x, app.y, -2.2);
      this.room2Group.add(appMesh);

      appMesh.userData = {
        type: 'concept',
        name: `Prototipo: ${app.name}`,
        description: `Concepto funcional desarrollado en el Idea Lab con enfoque en ${app.tag}.`,
        onClick: () => {
          audioManager.playSkillClick();
          this.sparks.trigger(appMesh.position.clone().add(this.room2Group.position), new THREE.Color(0xffaa22), 20, 3.0);
        }
      };
      this.interactiveObjects.push(appMesh);
    });

    this.scene.add(this.room2Group);
  }

  // 5. ROOM 3: THE TEAM SQUARE (MEET THE TEAM - NAHUEL, RAMIRO, JEREMIAS)
  createRoom3TeamSquare() {
    this.room3Group = new THREE.Group();
    this.room3Group.position.set(5.8, 0, 2.5);

    const baseGeo = new THREE.BoxGeometry(6.4, 1.2, 5.6);
    const baseMesh = new THREE.Mesh(baseGeo, this.matPlatformDark);
    baseMesh.position.y = -0.6;
    baseMesh.castShadow = true;
    this.room3Group.add(baseMesh);

    const topGeo = new THREE.BoxGeometry(6.2, 0.15, 5.4);
    const topMesh = new THREE.Mesh(topGeo, this.matPlatformLight);
    topMesh.position.y = 0.05;
    this.room3Group.add(topMesh);

    const bannerTex = this.createTextTexture('ROOM 3 | THE TEAM SQUARE', 'MEET THE TEAM: NAHUEL, RAMIRO & JEREMIAS', '#141a2e', '#00f0ff', 1024, 256);
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 0.95), new THREE.MeshBasicMaterial({ map: bannerTex }));
    bannerMesh.position.set(0, 3.6, -2.5);
    this.room3Group.add(bannerMesh);

    const membersData = [
      {
        id: 'nahuel',
        name: 'Nahuel',
        role: 'Tech Lead & DevOps',
        stack: 'Kubernetes • Terraform • AWS • CI/CD',
        color: 0x00f0ff,
        hex: '#00f0ff',
        bio: 'Especialista en arquitectura cloud escalable, diseño de infraestructuras críticas y despliegues automatizados con tolerancia a fallos.',
        x: -1.7,
        z: 0.2
      },
      {
        id: 'ramiro',
        name: 'Ramiro',
        role: 'Full-Stack & Systems',
        stack: 'Node.js • Go • Python • PostgreSQL',
        color: 0xffaa00,
        hex: '#ffaa00',
        bio: 'Ingeniero especializado en backends de alto rendimiento, microservicios distribuidos y arquitecturas resilientes con APIs de baja latencia.',
        x: 0.0,
        z: -0.4
      },
      {
        id: 'jeremias',
        name: 'Jeremias',
        role: '3D WebGL & Frontend',
        stack: 'Three.js • GLSL • React • WebGL',
        color: 0xff0066,
        hex: '#ff0066',
        bio: 'Desarrollador enfocado en experiencias inmersivas 3D, computación gráfica en tiempo real y aplicaciones web interactivas de alto impacto.',
        x: 1.7,
        z: 0.2
      }
    ];

    membersData.forEach(member => {
      const avatarGroup = new THREE.Group();
      avatarGroup.position.set(member.x, 0.1, member.z);

      const headMat = new THREE.MeshStandardMaterial({ color: 0xf5d0b5, roughness: 0.5 });
      const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), headMat);
      headMesh.position.y = 1.35;
      headMesh.castShadow = true;

      const hairMat = new THREE.MeshStandardMaterial({ color: 0x2d1e18, roughness: 0.7, flatShading: true });
      const hairMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(0.34, 0), hairMat);
      hairMesh.position.set(0, 1.48, -0.05);

      const bodyMat = new THREE.MeshStandardMaterial({ color: member.color, roughness: 0.4 });
      const bodyMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.32, 0.65, 12), bodyMat);
      bodyMesh.position.y = 0.85;
      bodyMesh.castShadow = true;

      const pantsMat = new THREE.MeshStandardMaterial({ color: 0x263238, roughness: 0.6 });
      const leftLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), pantsMat);
      leftLeg.position.set(-0.14, 0.28, 0);
      const rightLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.5, 8), pantsMat);
      rightLeg.position.set(0.14, 0.28, 0);

      const tagGeo = new THREE.PlaneGeometry(1.3, 0.45);
      const tagTex = this.createTextTexture(member.name, member.role, '#0b1120', member.hex, 512, 180);
      const tagMesh = new THREE.Mesh(tagGeo, new THREE.MeshBasicMaterial({ map: tagTex }));
      tagMesh.position.set(0, 1.85, 0.1);

      avatarGroup.add(headMesh, hairMesh, bodyMesh, leftLeg, rightLeg, tagMesh);
      this.room3Group.add(avatarGroup);

      const onClickMember = () => {
        audioManager.playMemberClick();
        const worldPos = new THREE.Vector3();
        headMesh.getWorldPosition(worldPos);
        this.sparks.trigger(worldPos, new THREE.Color(member.color), 30, 4.0);
        gsap.to(avatarGroup.position, { y: 0.5, yoyo: true, repeat: 1, duration: 0.25 });
        gsap.to(avatarGroup.rotation, { y: avatarGroup.rotation.y + Math.PI * 2, duration: 0.6, ease: 'power2.out' });
        window.dispatchEvent(new CustomEvent('open-member-modal', { detail: member }));
      };

      headMesh.userData = {
        type: 'team',
        name: `${member.name} (${member.role})`,
        description: `${member.bio} Stack: ${member.stack}`,
        onClick: onClickMember
      };
      bodyMesh.userData = headMesh.userData;

      this.interactiveObjects.push(headMesh, bodyMesh);
      this.teamMembers.push({ group: avatarGroup, data: member });
    });

    this.scene.add(this.room3Group);
  }

  // 6. ROOM 4: SKILL TREE (OUR TECHNOLOGIES)
  createRoom4SkillTree() {
    this.room4Group = new THREE.Group();
    this.room4Group.position.set(10.2, 0, -5.5);

    const baseGeo = new THREE.BoxGeometry(5.6, 1.2, 5.2);
    const baseMesh = new THREE.Mesh(baseGeo, this.matPlatformDark);
    baseMesh.position.y = -0.6;
    baseMesh.castShadow = true;
    this.room4Group.add(baseMesh);

    const topGeo = new THREE.BoxGeometry(5.4, 0.15, 5.0);
    const topMesh = new THREE.Mesh(topGeo, this.matPlatformTop);
    topMesh.position.y = 0.05;
    this.room4Group.add(topMesh);

    const bannerTex = this.createTextTexture('ROOM 4 | SKILL TREE', 'OUR TECHNOLOGIES & STACK', '#0d1f19', '#00ff88', 1024, 256);
    const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.9), new THREE.MeshBasicMaterial({ map: bannerTex }));
    bannerMesh.position.set(0, 4.4, -2.4);
    this.room4Group.add(bannerMesh);

    const pedRing = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.08, 8, 24), this.matGlowCyan);
    pedRing.rotation.x = Math.PI / 2;
    pedRing.position.y = 0.15;
    this.room4Group.add(pedRing);

    const treeTrunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 2.4, 8);
    const treeTrunk = new THREE.Mesh(treeTrunkGeo, this.matWood);
    treeTrunk.position.y = 1.25;
    treeTrunk.castShadow = true;
    this.room4Group.add(treeTrunk);

    const branchCoords = [
      { x: -0.9, y: 2.2, z: 0.2, r: 0.75 },
      { x: 0.9, y: 2.4, z: -0.2, r: 0.8 },
      { x: 0.0, y: 2.9, z: 0.0, r: 1.1 },
      { x: -0.6, y: 2.7, z: -0.6, r: 0.7 },
      { x: 0.6, y: 2.6, z: 0.6, r: 0.7 }
    ];

    branchCoords.forEach(b => {
      const fGeo = new THREE.DodecahedronGeometry(b.r, 0);
      const fMesh = new THREE.Mesh(fGeo, this.matFoliage);
      fMesh.position.set(b.x, b.y, b.z);
      fMesh.castShadow = true;
      this.room4Group.add(fMesh);
    });

    const skillList = [
      { name: 'JavaScript', code: 'JS', color: '#f7df1e', x: -1.6, y: 3.2, z: 0.3, level: 'Senior / 99%' },
      { name: 'TypeScript', code: 'TS', color: '#3178c6', x: -1.2, y: 2.1, z: 0.8, level: 'Senior / 95%' },
      { name: 'Python', code: 'Py', color: '#3776ab', x: -0.5, y: 3.7, z: -0.3, level: 'Advanced / 92%' },
      { name: 'React', code: 'React', color: '#61dafb', x: 0.6, y: 3.6, z: 0.4, level: 'Master / 98%' },
      { name: 'Three.js', code: '3D', color: '#00f0ff', x: 1.5, y: 3.1, z: -0.2, level: 'Expert / 95%' },
      { name: 'Node.js', code: 'Node', color: '#339933', x: 1.3, y: 2.1, z: 0.7, level: 'Senior / 94%' },
      { name: 'AWS Cloud', code: 'AWS', color: '#ff9900', x: -0.8, y: 1.4, z: 1.4, level: 'Architect / 92%' },
      { name: 'Docker', code: 'Docker', color: '#2496ed', x: 0.8, y: 1.4, z: 1.4, level: 'DevOps / 96%' }
    ];

    skillList.forEach(sk => {
      const skGeo = new THREE.BoxGeometry(0.65, 0.65, 0.1);
      const skTex = this.createTextTexture(sk.code, '', '#101726', sk.color, 256, 256);
      const skMat = new THREE.MeshStandardMaterial({
        map: skTex,
        roughness: 0.2,
        emissive: new THREE.Color(sk.color),
        emissiveIntensity: 0.3
      });

      const skMesh = new THREE.Mesh(skGeo, skMat);
      skMesh.position.set(sk.x, sk.y, sk.z);
      skMesh.castShadow = true;
      this.room4Group.add(skMesh);

      skMesh.userData = {
        type: 'skill',
        name: `Tecnología: ${sk.name}`,
        description: `Nivel de Dominio: ${sk.level}.`,
        onClick: () => {
          audioManager.playSkillClick();
          const worldPos = new THREE.Vector3();
          skMesh.getWorldPosition(worldPos);
          this.sparks.trigger(worldPos, new THREE.Color(sk.color), 25, 3.5);
          gsap.to(skMesh.scale, { x: 1.4, y: 1.4, z: 1.4, yoyo: true, repeat: 1, duration: 0.15 });
        }
      };
      this.interactiveObjects.push(skMesh);

      this.skills.push({ mesh: skMesh, baseY: sk.y, speed: 1.2 + Math.random() * 0.5 });
    });

    this.scene.add(this.room4Group);
  }

  // 7. BACKGROUND CLOUDS
  createBackgroundClouds() {
    const cloudCoords = [
      { x: -16, y: 7, z: -18, scale: 2.2 },
      { x: 18, y: 9, z: -15, scale: 2.6 },
      { x: -22, y: 5, z: 6, scale: 1.8 },
      { x: 20, y: 6, z: 12, scale: 2.0 },
      { x: 2, y: 12, z: -25, scale: 3.2 }
    ];

    cloudCoords.forEach(c => {
      const cloudGroup = new THREE.Group();
      cloudGroup.position.set(c.x, c.y, c.z);
      cloudGroup.scale.setScalar(c.scale);

      for (let i = 0; i < 5; i++) {
        const r = 0.8 + Math.random() * 0.7;
        const sphereMesh = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), this.matCloud);
        sphereMesh.position.set(
          (i - 2) * 0.9 + (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.4,
          (Math.random() - 0.5) * 0.6
        );
        cloudGroup.add(sphereMesh);
      }

      this.scene.add(cloudGroup);
      this.clouds.push({ group: cloudGroup, baseX: c.x, speed: 0.15 + Math.random() * 0.1 });
    });
  }

  update(elapsedTime, deltaTime) {
    // 1. Robot Mascot Gentle Waving & Breathing
    if (this.robotLeftArm) {
      this.robotLeftArm.rotation.z = 0.35 + Math.sin(elapsedTime * 3.2) * 0.25;
      this.robotLeftArm.rotation.x = -0.4 + Math.cos(elapsedTime * 2.0) * 0.15;
    }
    if (this.robotHead) {
      this.robotHead.position.y = 1.38 + Math.sin(elapsedTime * 2.0) * 0.025;
      this.robotHead.rotation.y = Math.sin(elapsedTime * 1.2) * 0.15;
    }

    // 2. Rotate Projects around Core
    this.orbitingProjects.forEach(p => {
      p.angle += p.speed * deltaTime;
      p.group.position.x = Math.cos(p.angle) * p.radius;
      p.group.position.z = Math.sin(p.angle) * p.radius;
      p.group.position.y = p.baseY + Math.sin(elapsedTime * 1.5 + p.angle) * 0.15;
      p.group.lookAt(0, 2.2, 0);
      p.group.rotateY(Math.PI);
    });

    // 3. Rotate Energy Core
    if (this.energyCore) {
      this.energyCore.rotation.x = elapsedTime * 0.8;
      this.energyCore.rotation.y = elapsedTime * 1.2;
    }

    // 4. Data Packets
    this.dataPackets.forEach(dp => {
      dp.progress = (dp.progress + dp.speed * deltaTime) % 1.0;
      const point = dp.curve.getPointAt(dp.progress);
      dp.mesh.position.copy(point);
    });

    // 5. Bob Skills
    this.skills.forEach(sk => {
      sk.mesh.position.y = sk.baseY + Math.sin(elapsedTime * sk.speed) * 0.08;
      sk.mesh.rotation.y = Math.sin(elapsedTime * 0.8) * 0.15;
    });

    // 6. Drift Clouds
    this.clouds.forEach(cl => {
      cl.group.position.x = cl.baseX + Math.sin(elapsedTime * cl.speed) * 1.2;
    });

    // 7. Sparks
    this.sparks.update(deltaTime);
  }
}
