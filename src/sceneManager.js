import * as THREE from 'three';
import gsap from 'gsap';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isTransitioning = false;

    // 6 Main Stages + Panoramic Overview
    this.viewpoints = {
      welcome_bot: {
        id: 'welcome_bot',
        step: 1,
        title: 'Escenario 1: Bot Guía & Welcome Hub',
        subtitle: 'Punto de partida y bienvenida al campus de innovación',
        pos: new THREE.Vector3(-1.0, 2.2, 8.2),
        target: new THREE.Vector3(-1.3, 1.2, 5.2)
      },
      tower: {
        id: 'tower',
        step: 2,
        title: 'Escenario 2: Torre Central de Proyectos',
        subtitle: 'Hologramas de proyectos activos en órbita continua',
        pos: new THREE.Vector3(0.0, 4.2, 6.2),
        target: new THREE.Vector3(0.0, 2.2, 0.0)
      },
      engine_room: {
        id: 'engine_room',
        step: 3,
        title: 'Escenario 3: Room 1 | The Engine Room',
        subtitle: 'Infraestructura cloud, datacenters y telemetría DevOps',
        pos: new THREE.Vector3(-7.5, 4.0, 1.8),
        target: new THREE.Vector3(-7.5, 2.0, -2.5)
      },
      idea_lab: {
        id: 'idea_lab',
        step: 4,
        title: 'Escenario 4: Room 2 | The Idea Lab',
        subtitle: 'Laboratorio de prototipos rápidos y conceptos de IA',
        pos: new THREE.Vector3(3.2, 4.2, -1.8),
        target: new THREE.Vector3(3.2, 2.0, -5.5)
      },
      team: {
        id: 'team',
        step: 5,
        title: 'Escenario 5: Room 3 | The Team Square',
        subtitle: 'Conoce al equipo: Nahuel, Ramiro y Jeremias',
        pos: new THREE.Vector3(5.8, 3.4, 6.5),
        target: new THREE.Vector3(5.8, 1.4, 2.5)
      },
      skills: {
        id: 'skills',
        step: 6,
        title: 'Escenario 6: Room 4 | Skill Tree',
        subtitle: 'Nuestras tecnologías y especialidades técnicas',
        pos: new THREE.Vector3(10.2, 4.4, -1.8),
        target: new THREE.Vector3(10.2, 2.4, -5.5)
      },
      overview: {
        id: 'overview',
        step: 0,
        title: 'Vista General del Campus',
        subtitle: 'Mapa completo interactivo en perspectiva isométrica',
        pos: new THREE.Vector3(0.0, 15.0, 19.5),
        target: new THREE.Vector3(0.0, 1.5, 0.0)
      }
    };

    // Sequence of tour stages
    this.stageOrder = ['welcome_bot', 'tower', 'engine_room', 'idea_lab', 'team', 'skills'];

    // Start directly at the Guide Bot!
    this.currentViewpoint = 'welcome_bot';
    this.currentTarget = this.viewpoints.welcome_bot.target.clone();

    this.initScene();
    this.initCamera();
    this.initLights();
    this.initRenderer();
    this.initListeners();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#9bb7d4');
    this.scene.fog = new THREE.FogExp2('#9bb7d4', 0.022);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 150);
    this.camera.position.copy(this.viewpoints.welcome_bot.pos);
    this.camera.lookAt(this.currentTarget);
  }

  initLights() {
    // Soft Ambient
    this.ambientLight = new THREE.AmbientLight(0xdde8fa, 1.5);
    this.scene.add(this.ambientLight);

    // Warm Sun Key Light
    this.sunLight = new THREE.DirectionalLight(0xfff3e0, 2.4);
    this.sunLight.position.set(15, 25, 18);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 1;
    this.sunLight.shadow.camera.far = 70;
    this.sunLight.shadow.camera.left = -22;
    this.sunLight.shadow.camera.right = 22;
    this.sunLight.shadow.camera.top = 22;
    this.sunLight.shadow.camera.bottom = -22;
    this.sunLight.shadow.bias = -0.0004;
    this.sunLight.shadow.radius = 2.5;
    this.scene.add(this.sunLight);

    // Fill Light
    this.fillLight = new THREE.DirectionalLight(0xffbfa3, 1.1);
    this.fillLight.position.set(-15, 8, -12);
    this.scene.add(this.fillLight);

    // Dynamic Spotlight for active stage emphasis
    this.stageSpotlight = new THREE.SpotLight(0x00f0ff, 4.0, 18.0, Math.PI / 4, 0.5, 1.0);
    this.stageSpotlight.position.set(-1.0, 7.0, 7.0);
    this.stageSpotlight.target.position.copy(this.currentTarget);
    this.scene.add(this.stageSpotlight);
    this.scene.add(this.stageSpotlight.target);
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  initListeners() {
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / this.width - 0.5) * 2;
    this.mouse.targetY = -(e.clientY / this.height - 0.5) * 2;
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  switchViewpoint(viewName) {
    if (!this.viewpoints[viewName] || this.isTransitioning) return;
    this.currentViewpoint = viewName;
    this.isTransitioning = true;

    const vp = this.viewpoints[viewName];

    // Move stage spotlight target
    gsap.to(this.stageSpotlight.target.position, {
      x: vp.target.x,
      y: vp.target.y,
      z: vp.target.z,
      duration: 1.4
    });
    gsap.to(this.stageSpotlight.position, {
      x: vp.target.x,
      y: vp.target.y + 6.0,
      z: vp.target.z + 3.0,
      duration: 1.4
    });

    const tl = gsap.timeline({
      onComplete: () => {
        this.isTransitioning = false;
      }
    });

    tl.to(this.camera.position, {
      x: vp.pos.x,
      y: vp.pos.y,
      z: vp.pos.z,
      duration: 1.4,
      ease: 'power3.inOut'
    }, 0);

    tl.to(this.currentTarget, {
      x: vp.target.x,
      y: vp.target.y,
      z: vp.target.z,
      duration: 1.4,
      ease: 'power3.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.currentTarget);
      }
    }, 0);
  }

  nextStage() {
    const currentIndex = this.stageOrder.indexOf(this.currentViewpoint);
    const nextIndex = (currentIndex + 1) % this.stageOrder.length;
    return this.stageOrder[nextIndex];
  }

  prevStage() {
    const currentIndex = this.stageOrder.indexOf(this.currentViewpoint);
    const prevIndex = (currentIndex - 1 + this.stageOrder.length) % this.stageOrder.length;
    return this.stageOrder[prevIndex];
  }

  update(deltaTime) {
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    if (!this.isTransitioning) {
      const pFactor = 0.35;
      const targetPos = this.viewpoints[this.currentViewpoint].pos;
      this.camera.position.x += (targetPos.x + this.mouse.x * pFactor - this.camera.position.x) * 0.05;
      this.camera.position.y += (targetPos.y + this.mouse.y * pFactor * 0.5 - this.camera.position.y) * 0.05;
      this.camera.lookAt(this.currentTarget);
    }
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
