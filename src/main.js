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

    // 3. Project Chips in Bottom Bar
    document.querySelectorAll('.p-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const pId = chip.dataset.project;
        const projectObj = this.world.interactiveObjects.find(obj => obj.name === pId);
        if (projectObj && projectObj.userData && projectObj.userData.onClick) {
          projectObj.userData.onClick();
        }
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
