import * as THREE from 'three';
import gsap from 'gsap';
import { SceneManager } from './sceneManager.js';
import { World } from './world/world.js';
import { audioManager } from './audio/audioManager.js';

class App {
  constructor() {
    this.canvas = document.querySelector('#webgl');
    this.sceneManager = new SceneManager(this.canvas);
    this.world = new World(
      this.sceneManager.scene,
      this.sceneManager.camera,
      this.sceneManager.renderer,
      this.sceneManager
    );

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(-999, -999);
    this.hoveredObject = null;

    this.clock = new THREE.Clock();
    this.lastTime = 0;
    this.frameCount = 0;
    this.lastFpsUpdate = 0;

    this.themes = [
      {
        name: 'Cyber Global Hub (Default)',
        bg: '#0b101c',
        ambient: 0x1a253c,
        key: 0xe2eeff
      },
      {
        name: 'Neon Cyberpunk',
        bg: '#140a24',
        ambient: 0x27143e,
        key: 0xff0077
      },
      {
        name: 'Deep Astral',
        bg: '#060d1a',
        ambient: 0x101a2e,
        key: 0x00f0ff
      },
      {
        name: 'Emerald Matrix',
        bg: '#061712',
        ambient: 0x0c291e,
        key: 0x00ff88
      }
    ];
    this.currentThemeIndex = 0;

    this.initUI();
    this.initModals();
    this.initHubPage();
    this.initRaycasting();
    this.startLoop();
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

    document.querySelectorAll('[data-backdrop]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.backdrop;
        audioManager.playUIClick();
        this.world.setBackdrop(id);
        document.querySelectorAll('[data-backdrop]').forEach((b) => {
          b.classList.toggle('active', b.dataset.backdrop === id);
        });
      });
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

  applyTheme(theme) {
    gsap.to(this.sceneManager.scene.fog.color, {
      r: new THREE.Color(theme.bg).r,
      g: new THREE.Color(theme.bg).g,
      b: new THREE.Color(theme.bg).b,
      duration: 1.2
    });

    gsap.to(this.sceneManager.scene.background, {
      r: new THREE.Color(theme.bg).r,
      g: new THREE.Color(theme.bg).g,
      b: new THREE.Color(theme.bg).b,
      duration: 1.2
    });

    gsap.to(this.sceneManager.ambientLight.color, {
      r: new THREE.Color(theme.ambient).r,
      g: new THREE.Color(theme.ambient).g,
      b: new THREE.Color(theme.ambient).b,
      duration: 1.2
    });

    gsap.to(this.sceneManager.keyLight.color, {
      r: new THREE.Color(theme.key).r,
      g: new THREE.Color(theme.key).g,
      b: new THREE.Color(theme.key).b,
      duration: 1.2
    });

    this.showTooltip({
      name: `Tema: ${theme.name}`,
      description: 'Iluminación ambiental sincronizada.',
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

    projectModal.addEventListener('click', (e) => {
      if (e.target === projectModal) {
        projectModal.classList.remove('open');
      }
    });
  }

  initRaycasting() {
    window.addEventListener('pointermove', (e) => {
      this.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    window.addEventListener('click', (e) => {
      if (
        e.target.closest('.ui-overlay')
        || e.target.closest('.modal-card')
        || e.target.closest('#hub-page')
        || e.target.closest('#term-page')
      ) {
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
          if (hitObj.userData.type !== 'hub' && hitObj.userData.type !== 'terminal') {
            this.showTooltip(hitObj.userData);
          }
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

  initHubPage() {
    this.hubPage = document.querySelector('#hub-page');
    this.termPage = document.querySelector('#term-page');
    this.termLog = document.querySelector('#term-log');
    this.portalKind = null;
    this.hubLocked = false;
    this.hubExiting = false;
    this.hubMorph = 0;
    this.world.onHudOpen = () => this.openScreenPage('hub');
    this.world.onTerminalOpen = () => this.openScreenPage('term');

    const termLines = [
      '> boot --campus it-creative-synergy',
      '> mount /platform/neon-cyber',
      '> load bot -- graffiti-unit',
      '> screens.map hud, terminal',
      '  [ok] renderer   three r174',
      '  [ok] lighting   neon / lime / amber',
      '  [ok] atmosphere nebula / matrix / sunset',
      '  [ok] hub        linked',
      'root@campus:~$ status',
      'CORE online · NET stable · SYNC 98% · BOT docked'
    ];
    this.termLog.textContent = termLines.join('\n');

    document.querySelector('#hub-page-back').addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playUIClick();
      this.exitHubPage();
    });
    document.querySelector('#term-page-back').addEventListener('click', (e) => {
      e.stopPropagation();
      audioManager.playUIClick();
      this.exitHubPage();
    });

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && (this.hubLocked || this.hubMorph > 0.2)) {
        this.exitHubPage();
      }
    });

    [this.hubPage, this.termPage].forEach((page) => {
      page.addEventListener('wheel', (e) => {
        if (this.hubLocked) return;
        this.sceneManager.onWheel(e);
      }, { passive: true });
    });
  }

  openScreenPage(kind) {
    if (this.hubLocked || this.hubExiting) return;
    audioManager.playUIClick();
    this.portalKind = kind;
    this.hubLocked = true;
    this.hubExiting = false;
    this.sceneManager.slowZoom = true;
    this.sceneManager.zoomLocked = true;
    this.sceneManager.targetZoomFactor = this.sceneManager.minZoom;
    this.activePage()?.setAttribute('aria-hidden', 'false');
  }

  activePage() {
    if (this.portalKind === 'term') return this.termPage;
    if (this.portalKind === 'hub') return this.hubPage;
    return null;
  }

  activeFocus() {
    return this.portalKind === 'term' ? this.world.terminalFocus : this.world.hudFocus;
  }

  activeRect(sm) {
    if (this.portalKind === 'term') {
      return this.world.getTerminalScreenRect(sm.camera, sm.width, sm.height);
    }
    return this.world.getHudScreenRect(sm.camera, sm.width, sm.height);
  }

  exitHubPage() {
    this.hubLocked = false;
    this.hubExiting = true;
    this.sceneManager.zoomLocked = false;
    this.sceneManager.slowZoom = true;
    this.sceneManager.targetZoomFactor = 1;
  }

  updateHubPage() {
    const sm = this.sceneManager;
    const page = this.activePage();
    if (!page) {
      this.world.setHudPortalProgress(0);
      this.world.setTerminalPortalProgress(0);
      return;
    }

    const zoomInT = sm.zoomInT || 0;
    const targetMorph = this.hubLocked ? 1 : 0;
    this.hubMorph += (targetMorph - this.hubMorph) * 0.04;
    const morph = this.hubMorph;
    this.world.setHudPortalProgress(this.portalKind === 'hub' ? morph : 0);
    this.world.setTerminalPortalProgress(this.portalKind === 'term' ? morph : 0);

    if (this.hubExiting && zoomInT < 0.12 && morph < 0.04) {
      this.hubExiting = false;
      this.portalKind = null;
      sm.slowZoom = false;
      this.hubPage.style.setProperty('--hub-op', '0');
      this.termPage.style.setProperty('--hub-op', '0');
      this.hubPage.classList.remove('is-live', 'is-full');
      this.termPage.classList.remove('is-live', 'is-full');
      document.body.classList.remove('hub-full');
      return;
    }

    const w = sm.width;
    const h = sm.height;
    const rect = this.activeRect(sm);
    const clamp = (n) => Math.max(0, Math.min(90, n));

    if (morph < 0.015 || (!rect && !this.hubLocked)) {
      page.style.setProperty('--hub-op', '0');
      page.classList.remove('is-live', 'is-full');
      document.body.classList.remove('hub-full');
      return;
    }

    const hudT = rect ? (rect.y / h) * 100 : 8;
    const hudL = rect ? (rect.x / w) * 100 : 12;
    const hudR = rect ? (1 - (rect.x + rect.w) / w) * 100 : 12;
    const hudB = rect ? (1 - (rect.y + rect.h) / h) * 100 : 18;

    page.style.setProperty('--hub-t', `${(clamp(hudT) * (1 - morph)).toFixed(3)}%`);
    page.style.setProperty('--hub-r', `${(clamp(hudR) * (1 - morph)).toFixed(3)}%`);
    page.style.setProperty('--hub-b', `${(clamp(hudB) * (1 - morph)).toFixed(3)}%`);
    page.style.setProperty('--hub-l', `${(clamp(hudL) * (1 - morph)).toFixed(3)}%`);
    page.style.setProperty('--hub-rad', `${(18 * (1 - morph)).toFixed(1)}px`);
    page.style.setProperty('--hub-op', String(Math.min(1, morph * 1.08)));
    page.classList.add('is-live');

    const other = page === this.hubPage ? this.termPage : this.hubPage;
    other.style.setProperty('--hub-op', '0');
    other.classList.remove('is-live', 'is-full');

    const isFull = morph > 0.985;
    page.classList.toggle('is-full', isFull);
    document.body.classList.toggle('hub-full', isFull);
    page.setAttribute('aria-hidden', morph < 0.06 ? 'true' : 'false');
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

      if (this.hubLocked) {
        document.body.style.cursor = 'default';
      } else if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';
      } else {
        document.body.style.cursor = 'default';
      }

      this.world.update(elapsedTime, deltaTime);
      this.sceneManager.update(deltaTime, {
        hudFocus: (this.hubLocked || this.hubMorph > 0.04) ? this.activeFocus() : null
      });
      this.updateHubPage();
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
