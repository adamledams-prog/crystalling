export const LORUS_SPARK_COLORS = ["#00ffff", "#ff00ff", "#ffff00", "#7bff00", "#ffffff", "#ff6eb4"];

export function lorusReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export class LorusSparkBurst {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.parts = [];
    this.raf = 0;
    this.running = false;
    this.cx = 0;
    this.cy = 0;
    this.ambientId = 0;
  }

  resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const r = parent.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.floor(r.width * dpr);
    this.canvas.height = Math.floor(r.height * dpr);
    this.canvas.style.width = `${r.width}px`;
    this.canvas.style.height = `${r.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.cx = r.width / 2;
    this.cy = r.height / 2;
  }

  burst(count = 72) {
    this.parts = [];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const sp = 3 + Math.random() * 11;
      this.parts.push({
        x: this.cx,
        y: this.cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.012 + Math.random() * 0.018,
        size: 1.5 + Math.random() * 3.5,
        color: LORUS_SPARK_COLORS[i % LORUS_SPARK_COLORS.length],
      });
    }
  }

  tick = () => {
    if (!this.running) return;
    const { ctx, parts } = this;
    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 600;
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "lighter";
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.985;
      p.vy += 0.04;
      p.vx *= 0.986;
      p.vy *= 0.986;
      p.life -= p.decay;
      if (p.life <= 0) {
        parts.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life * 1.2);
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size * 0.6;
      ctx.globalAlpha = p.life * 0.85;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * 3, p.y - p.vy * 3);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (parts.length > 0) this.raf = requestAnimationFrame(this.tick);
    else if (this.ambientId) this.raf = requestAnimationFrame(this.tick);
    else this.running = false;
  };

  start() {
    this.stop();
    this.resize();
    this.burst(lorusReducedMotion() ? 24 : 88);
    this.running = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  }

  startAmbient() {
    this.stop();
    this.resize();
    const rm = lorusReducedMotion();
    this.burst(rm ? 14 : 52);
    this.running = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
    if (!rm) {
      this.ambientId = window.setInterval(() => {
        this.burstAgain(rm ? 6 : 20);
      }, 2400);
    }
  }

  burstAgain(count = 48) {
    const n = lorusReducedMotion() ? Math.min(count, 18) : count;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 4 + Math.random() * 12;
      this.parts.push({
        x: this.cx,
        y: this.cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.018 + Math.random() * 0.02,
        size: 2 + Math.random() * 4,
        color: LORUS_SPARK_COLORS[Math.floor(Math.random() * LORUS_SPARK_COLORS.length)],
      });
    }
    if (!this.running) {
      this.running = true;
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  burstTrailRight(count = 44) {
    const n = lorusReducedMotion() ? Math.min(count, 14) : count;
    for (let i = 0; i < n; i++) {
      const sp = 7 + Math.random() * 18;
      const vy = (Math.random() - 0.5) * sp * 0.42;
      this.parts.push({
        x: this.cx + (Math.random() - 0.5) * 48,
        y: this.cy + (Math.random() - 0.5) * 56,
        vx: sp * (0.7 + Math.random() * 0.55),
        vy,
        life: 1,
        decay: 0.014 + Math.random() * 0.016,
        size: 2 + Math.random() * 3.5,
        color: LORUS_SPARK_COLORS[Math.floor(Math.random() * LORUS_SPARK_COLORS.length)],
      });
    }
    if (!this.running) {
      this.running = true;
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  stop() {
    this.running = false;
    if (this.ambientId) {
      clearInterval(this.ambientId);
      this.ambientId = 0;
    }
    cancelAnimationFrame(this.raf);
    this.parts = [];
    this.ctx?.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}