import * as THREE from 'three';
import gsap from 'gsap';
import { SceneManager } from './sceneManager.js';
import { World } from './world/world.js';
import { audioManager } from './audio/audioManager.js';

class App {
  constructor() {
    this.canvas = document.querySelector('#webgl');
    this.sceneManager = new SceneManager(this.canvas);
    this.world = new World(this.sceneManager.scene, this.sceneManager.camera, this.sceneManager.renderer);

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);
    this.hoveredObject = null;

    this.clock = new THREE.Clock();
    this.lastTime = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    this.themes = [
      {
        name: 'Daylight Sunset (Default)',
        sky: '#9bb7d4',
        sun: '#fff3e0',
        ambient: 0xdde8fa,
        fill: 0xffbfa3
      },
      {
        name: 'Cyberpunk Neon',
        sky: '#160a28',
        sun: '#ff0077',
        ambient: 0x24143d,
        fill: 0x00f0ff
      },
      {
        name: 'Deep Tech Night',
        sky: '#09101f',
        sun: '#60a5fa',
        ambient: 0x141f36,
        fill: 0x38bdf8
      },
      {
        name: 'Emerald Matrix',
        sky: '#061712',
        sun: '#00ff88',
        ambient: 0x0e2e22,
        fill: 0x77ffaa
      }
    ];
    this.currentThemeIndex = 0;

    this.initUI();
    this.initModals();
    this.initRaycasting();
    this.initKeyboardNav();
    this.startLoop();

    // Start with initial message on the Bot Guía
    setTimeout(() => {
      this.updateStepperUI('welcome_bot');
    }, 100);
  }

  initUI() {
    // 1. Audio Mute Toggle
    const audioBtn = document.querySelector('#audio-toggle-btn');
    const iconSoundOn = document.querySelector('#icon-sound-on');
    const iconSoundOff = document.querySelector('#icon-sound-off');

    const handleFirstGesture = () => {
      audioManager.ensureContext();
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
    window.addEventListener('click', handleFirstGesture);
    window.addEventListener('keydown', handleFirstGesture);

    audioBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = audioManager.toggleMute();
      iconSoundOn.style.display = isMuted ? 'none' : 'block';
      iconSoundOff.style.display = isMuted ? 'block' : 'none';
      audioBtn.classList.toggle('active', !isMuted);
    });

    // 2. Navigation Buttons (Top Navbar & Bottom Dock)
    const allNavButtons = document.querySelectorAll('.nav-link-btn, .dock-btn');
    allNavButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const view = btn.dataset.view;
        this.navigateToView(view);
      });
    });

    // Brand Home Button
    document.querySelector('#brand-home-btn').addEventListener('click', () => {
      this.navigateToView('welcome_bot');
    });

    // Start Tour Button
    document.querySelector('#start-tour-btn').addEventListener('click', () => {
      this.navigateToView('welcome_bot');
    });

    // 3. Next / Prev Stage Stepper Buttons
    document.querySelector('#btn-next-stage').addEventListener('click', () => {
      const nextView = this.sceneManager.nextStage();
      this.navigateToView(nextView);
    });

    document.querySelector('#btn-prev-stage').addEventListener('click', () => {
      const prevView = this.sceneManager.prevStage();
      this.navigateToView(prevView);
    });

    // 4. Theme Switcher
    const themeBtn = document.querySelector('#theme-btn');
    themeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playUIClick();
      this.currentThemeIndex = (this.currentThemeIndex + 1) % this.themes.length;
      this.applyTheme(this.themes[this.currentThemeIndex]);
    });
  }

  initKeyboardNav() {
    window.addEventListener('keydown', (e) => {
      if (document.querySelector('.modal-backdrop.open')) return;

      if (e.key === 'ArrowRight' || e.key === 'KeyD') {
        const nextView = this.sceneManager.nextStage();
        this.navigateToView(nextView);
      } else if (e.key === 'ArrowLeft' || e.key === 'KeyA') {
        const prevView = this.sceneManager.prevStage();
        this.navigateToView(prevView);
      } else if (e.key === 'Digit1') {
        this.navigateToView('welcome_bot');
      } else if (e.key === 'Digit2') {
        this.navigateToView('tower');
      } else if (e.key === 'Digit3') {
        this.navigateToView('engine_room');
      } else if (e.key === 'Digit4') {
        this.navigateToView('idea_lab');
      } else if (e.key === 'Digit5') {
        this.navigateToView('team');
      } else if (e.key === 'Digit6') {
        this.navigateToView('skills');
      } else if (e.key === 'Digit0' || e.key === 'Space') {
        this.navigateToView('overview');
      }
    });
  }

  navigateToView(viewName) {
    audioManager.playTransition();
    this.sceneManager.switchViewpoint(viewName);

    // Sync active state on buttons
    document.querySelectorAll('.nav-link-btn, .dock-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === viewName);
    });

    this.updateStepperUI(viewName);
  }

  updateStepperUI(viewName) {
    const vp = this.sceneManager.viewpoints[viewName];
    if (!vp) return;

    const countElem = document.querySelector('#stepper-count');
    const titleElem = document.querySelector('#stepper-title');

    if (vp.step > 0) {
      countElem.textContent = `ESCENARIO ${vp.step} DE 6`;
      titleElem.textContent = vp.title.replace(/Escenario \d+: /, '');
    } else {
      countElem.textContent = 'PANORAMA COMPLETO';
      titleElem.textContent = 'Vista General del Campus';
    }

    this.showTooltip({
      name: vp.title,
      description: vp.subtitle,
      type: 'escenario'
    });
  }

  applyTheme(theme) {
    gsap.to(this.sceneManager.scene.fog.color, {
      r: new THREE.Color(theme.sky).r,
      g: new THREE.Color(theme.sky).g,
      b: new THREE.Color(theme.sky).b,
      duration: 1.2
    });

    gsap.to(this.sceneManager.scene.background, {
      r: new THREE.Color(theme.sky).r,
      g: new THREE.Color(theme.sky).g,
      b: new THREE.Color(theme.sky).b,
      duration: 1.2
    });

    gsap.to(this.sceneManager.sunLight.color, {
      r: new THREE.Color(theme.sun).r,
      g: new THREE.Color(theme.sun).g,
      b: new THREE.Color(theme.sun).b,
      duration: 1.2
    });

    gsap.to(this.sceneManager.ambientLight.color, {
      r: new THREE.Color(theme.ambient).r,
      g: new THREE.Color(theme.ambient).g,
      b: new THREE.Color(theme.ambient).b,
      duration: 1.2
    });

    gsap.to(this.sceneManager.fillLight.color, {
      r: new THREE.Color(theme.fill).r,
      g: new THREE.Color(theme.fill).g,
      b: new THREE.Color(theme.fill).b,
      duration: 1.2
    });

    this.showTooltip({
      name: `Tema: ${theme.name}`,
      description: 'Paleta cromática atmosférica sincronizada.',
      type: 'tema'
    });
  }

  initModals() {
    const projectModal = document.querySelector('#project-modal');
    const closeProjectModal = document.querySelector('#close-project-modal');
    const modalTag = document.querySelector('#modal-project-tag');
    const modalTitle = document.querySelector('#modal-project-title');
    const modalSubtitle = document.querySelector('#modal-project-subtitle');
    const modalDesc = document.querySelector('#modal-project-desc');
    const btnOpenProject = document.querySelector('#btn-open-project-window');

    let currentProjectUrl = 'https://github.com';

    window.addEventListener('open-project-modal', (e) => {
      const p = e.detail;
      modalTag.textContent = p.tag || 'PROYECTO';
      modalTitle.textContent = p.title || 'Proyecto';
      modalSubtitle.textContent = p.subtitle || '';
      modalDesc.textContent = p.description || '';
      currentProjectUrl = p.url || 'https://github.com';

      projectModal.classList.add('open');
    });

    btnOpenProject.addEventListener('click', () => {
      audioManager.playUIClick();
      window.open(currentProjectUrl, '_blank', 'noopener,noreferrer');
    });

    closeProjectModal.addEventListener('click', () => {
      projectModal.classList.remove('open');
    });

    const memberModal = document.querySelector('#member-modal');
    const closeMemberModal = document.querySelector('#close-member-modal');
    const memberAvatarInitials = document.querySelector('#member-avatar-initials');
    const modalMemberName = document.querySelector('#modal-member-name');
    const modalMemberRole = document.querySelector('#modal-member-role');
    const modalMemberBio = document.querySelector('#modal-member-bio');
    const modalMemberStack = document.querySelector('#modal-member-stack');

    window.addEventListener('open-member-modal', (e) => {
      const m = e.detail;
      memberAvatarInitials.textContent = m.name.charAt(0);
      modalMemberName.textContent = m.name;
      modalMemberRole.textContent = m.role;
      modalMemberBio.textContent = m.bio;
      modalMemberStack.textContent = m.stack;

      memberModal.classList.add('open');
    });

    closeMemberModal.addEventListener('click', () => {
      memberModal.classList.remove('open');
    });

    [projectModal, memberModal].forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.remove('open');
        }
      });
    });
  }

  initRaycasting() {
    window.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('click', (e) => {
      if (e.target.closest('.ui-overlay') || e.target.closest('.modal-card')) {
        return;
      }

      this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);
      const intersects = this.raycaster.intersectObjects(this.world.interactiveObjects, true);

      if (intersects.length > 0) {
        let hitObj = intersects[0].object;
        while (hitObj && !hitObj.userData.onClick && hitObj.parent) {
          hitObj = hitObj.parent;
        }

        if (hitObj && hitObj.userData && hitObj.userData.onClick) {
          hitObj.userData.onClick();
          this.showTooltip(hitObj.userData);
        }
      }
    });
  }

  showTooltip(data) {
    const tooltip = document.querySelector('#object-tooltip');
    const tag = document.querySelector('#tooltip-tag');
    const title = document.querySelector('#tooltip-title');
    const desc = document.querySelector('#tooltip-desc');

    tag.textContent = (data.type || 'MÓDULO 3D').toUpperCase();
    title.textContent = data.name || 'Elemento 3D';
    desc.textContent = data.description || '';

    tooltip.classList.add('visible');

    if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
    this.tooltipTimeout = setTimeout(() => {
      tooltip.classList.remove('visible');
    }, 4000);
  }

  updateFPS(currentTime) {
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= 1.0) {
      const fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate * 1000));
      const fpsElem = document.querySelector('#fps-counter');
      if (fpsElem) {
        fpsElem.textContent = `${Math.min(fps, 60)} FPS`;
      }
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }
  }

  startLoop() {
    const tick = () => {
      const elapsedTime = this.clock.getElapsedTime();
      const deltaTime = Math.min(elapsedTime - this.lastTime, 0.1);
      this.lastTime = elapsedTime;

      this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);
      const intersects = this.raycaster.intersectObjects(this.world.interactiveObjects, true);

      if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }

      this.world.update(elapsedTime, deltaTime);
      this.sceneManager.update(deltaTime);
      this.sceneManager.render();
      this.updateFPS(elapsedTime);

      requestAnimationFrame(tick);
    };

    tick();
  }
}

window.addEventListener('DOMContentLoaded', () => {
  new App();
});
