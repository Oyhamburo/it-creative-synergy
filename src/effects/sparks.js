import * as THREE from 'three';

export class SparkSystem {
  constructor(scene) {
    this.scene = scene;
    this.maxParticles = 500;
    this.activeSparks = [];

    const geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.maxParticles * 3);
    this.colors = new Float32Array(this.maxParticles * 3);
    this.sizes = new Float32Array(this.maxParticles);

    geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1));

    // Custom spark texture generated via 2D canvas
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(255, 255, 200, 0.9)');
    gradient.addColorStop(0.5, 'rgba(255, 180, 50, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.35,
      map: texture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexColors: true
    });

    this.points = new THREE.Points(geometry, material);
    this.scene.add(this.points);
  }

  trigger(position, color = new THREE.Color(1, 0.8, 0.2), count = 35, speed = 4.0) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const elevation = (Math.random() - 0.2) * Math.PI;
      const spd = (0.5 + Math.random() * 0.8) * speed;

      this.activeSparks.push({
        x: position.x,
        y: position.y,
        z: position.z,
        vx: Math.cos(angle) * Math.cos(elevation) * spd,
        vy: Math.sin(elevation) * spd + 1.5,
        vz: Math.sin(angle) * Math.cos(elevation) * spd,
        r: color.r,
        g: color.g,
        b: color.b,
        life: 1.0,
        decay: 0.8 + Math.random() * 0.8,
        size: 0.15 + Math.random() * 0.25
      });
    }
  }

  update(deltaTime) {
    if (this.activeSparks.length === 0) return;

    for (let i = this.activeSparks.length - 1; i >= 0; i--) {
      const s = this.activeSparks[i];
      s.x += s.vx * deltaTime;
      s.y += s.vy * deltaTime;
      s.z += s.vz * deltaTime;

      // Gravity & drag
      s.vy -= 4.0 * deltaTime;
      s.vx *= 0.98;
      s.vz *= 0.98;

      s.life -= s.decay * deltaTime;

      if (s.life <= 0) {
        this.activeSparks.splice(i, 1);
      }
    }

    const posAttr = this.points.geometry.attributes.position;
    const colAttr = this.points.geometry.attributes.color;

    const count = Math.min(this.activeSparks.length, this.maxParticles);
    for (let i = 0; i < count; i++) {
      const s = this.activeSparks[i];
      posAttr.setXYZ(i, s.x, s.y, s.z);
      colAttr.setXYZ(i, s.r * s.life, s.g * s.life, s.b * s.life);
    }

    // Hide remaining unused particle buffer
    for (let i = count; i < this.maxParticles; i++) {
      posAttr.setXYZ(i, 0, -9999, 0);
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }
}
