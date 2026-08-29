import * as THREE from 'three';
import gsap from 'gsap';

export class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.cameraPos = new THREE.Vector3(0.0, 2.6, 7.4);
    this.currentTarget = new THREE.Vector3(0.0, 1.15, 0.0);

    // Mouse wheel zoom parameters
    this.zoomFactor = 1.0;
    this.targetZoomFactor = 1.0;
    this.minZoom = 0.36;
    this.maxZoom = 2.2;
    this.zoomLocked = false;
    this.slowZoom = false;
    this.zoomInT = 0;

    this.initScene();
    this.initCamera();
    this.initLights();
    this.initRenderer();
    this.initListeners();
  }

  initScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#0a1024');
    this.scene.fog = new THREE.FogExp2('#0a1024', 0.011);
  }

  initCamera() {
    this.camera = new THREE.PerspectiveCamera(40, this.width / this.height, 0.1, 100);
    this.camera.position.copy(this.cameraPos);
    this.camera.lookAt(this.currentTarget);
  }

  initLights() {
    this.ambientLight = new THREE.AmbientLight(0x4a5d9a, 1.85);
    this.scene.add(this.ambientLight);

    this.hemiLight = new THREE.HemisphereLight(0xff7ad9, 0x0b3d4a, 1.35);
    this.scene.add(this.hemiLight);

    this.keyLight = new THREE.DirectionalLight(0xfff1d6, 3.4);
    this.keyLight.position.set(5.5, 11, 7.5);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.camera.near = 1;
    this.keyLight.shadow.camera.far = 36;
    this.keyLight.shadow.camera.left = -10;
    this.keyLight.shadow.camera.right = 10;
    this.keyLight.shadow.camera.top = 10;
    this.keyLight.shadow.camera.bottom = -10;
    this.keyLight.shadow.bias = -0.0003;
    this.keyLight.shadow.radius = 2.0;
    this.scene.add(this.keyLight);

    this.rimLight = new THREE.DirectionalLight(0x00f0ff, 2.4);
    this.rimLight.position.set(-7, 5, -5);
    this.scene.add(this.rimLight);

    this.fillPink = new THREE.PointLight(0xff2d95, 6.5, 14, 1.6);
    this.fillPink.position.set(-3.2, 2.4, 2.4);
    this.scene.add(this.fillPink);

    this.fillLime = new THREE.PointLight(0x5cff7a, 5.2, 13, 1.6);
    this.fillLime.position.set(3.4, 2.2, 1.8);
    this.scene.add(this.fillLime);

    this.fillAmber = new THREE.PointLight(0xffb703, 3.4, 10, 1.8);
    this.fillAmber.position.set(0.2, 3.4, 0.4);
    this.scene.add(this.fillAmber);
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
    this.renderer.toneMappingExposure = 1.48;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
  }

  initListeners() {
    window.addEventListener('resize', this.onResize.bind(this));
    window.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('wheel', this.onWheel.bind(this), { passive: true });
  }

  onMouseMove(e) {
    this.mouse.targetX = (e.clientX / this.width - 0.5) * 2;
    this.mouse.targetY = -(e.clientY / this.height - 0.5) * 2;
  }

  onWheel(e) {
    if (this.zoomLocked) return;
    this.targetZoomFactor += e.deltaY * 0.0015;
    this.targetZoomFactor = THREE.MathUtils.clamp(this.targetZoomFactor, this.minZoom, this.maxZoom);
  }

  onResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  update(deltaTime, focus = null) {
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    const zoomLerp = this.slowZoom ? 0.022 : 0.08;
    this.zoomFactor += (this.targetZoomFactor - this.zoomFactor) * zoomLerp;
    this.zoomInT = THREE.MathUtils.clamp(
      (1 - this.zoomFactor) / (1 - this.minZoom),
      0,
      1
    );

    const look = this.currentTarget.clone();
    const pFactor = 0.35 * (focus?.hudFocus ? (1 - this.zoomInT * 0.9) : 1);
    if (focus?.hudFocus && this.zoomInT > 0) {
      look.lerp(focus.hudFocus, this.zoomInT * 0.82);
    }

    const targetX = (this.cameraPos.x + this.mouse.x * pFactor) * this.zoomFactor;
    const targetY = (this.cameraPos.y + this.mouse.y * pFactor * 0.3) * this.zoomFactor;
    const targetZ = this.cameraPos.z * this.zoomFactor;

    this.camera.position.set(targetX, targetY, targetZ);
    this.camera.lookAt(look);
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
