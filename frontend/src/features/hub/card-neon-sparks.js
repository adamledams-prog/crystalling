export const CARD_SPARK_COLORS = ["#ffffff", "#e8c547", "#b57edc", "#5ce1e6", "#ff6eb4", "#9dff6a"];

export function cardReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export class CardSparkField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.parts = [];
    this.raf = 0;
    this.running = false;
    this.cx = 0;
    this.cy = 0;
    this.accent = "#b57edc";
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
    this.cy = r.height * 0.46;
  }

  burst(count = 64) {
    this.parts = [];
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.25;
      const sp = 2 + Math.random() * 9;
      this.parts.push({
        x: this.cx,
        y: this.cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.014 + Math.random() * 0.016,
        size: 1 + Math.random() * 2.8,
        color: i % 3 === 0 ? this.accent : CARD_SPARK_COLORS[i % CARD_SPARK_COLORS.length],
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
      p.vx *= 0.988;
      p.vy += 0.035;
      p.vx *= 0.987;
      p.vy *= 0.987;
      p.life -= p.decay;
      if (p.life <= 0) {
        parts.splice(i, 1);
        continue;
      }
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.min(1, p.life * 1.15);
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    if (parts.length > 0) this.raf = requestAnimationFrame(this.tick);
    else if (this.ambientId) this.raf = requestAnimationFrame(this.tick);
    else this.running = false;
  };

  start(accent) {
    this.stop();
    this.accent = accent || "#b57edc";
    this.resize();
    this.burst(cardReducedMotion() ? 22 : 78);
    this.running = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
  }

  startAmbient(accent = "#b57edc") {
    this.stop();
    this.accent = accent;
    this.resize();
    const rm = cardReducedMotion();
    this.burst(rm ? 12 : 48);
    this.running = true;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(this.tick);
    if (!rm) {
      this.ambientId = window.setInterval(() => {
        this.burstAgain(rm ? 6 : 18);
      }, 2400);
    }
  }

  burstAgain(count = 48) {
    const n = cardReducedMotion() ? Math.min(count, 16) : count;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 3 + Math.random() * 11;
      this.parts.push({
        x: this.cx,
        y: this.cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.016 + Math.random() * 0.02,
        size: 1.5 + Math.random() * 3.5,
        color: i % 2 === 0 ? this.accent : CARD_SPARK_COLORS[i % CARD_SPARK_COLORS.length],
      });
    }
    if (!this.running) {
      this.running = true;
      cancelAnimationFrame(this.raf);
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  burstTrailRight(count = 44) {
    const n = cardReducedMotion() ? Math.min(count, 12) : count;
    for (let i = 0; i < n; i++) {
      const sp = 6 + Math.random() * 16;
      this.parts.push({
        x: this.cx + (Math.random() - 0.5) * 40,
        y: this.cy + (Math.random() - 0.5) * 52,
        vx: sp * (0.72 + Math.random() * 0.5),
        vy: (Math.random() - 0.5) * sp * 0.38,
        life: 1,
        decay: 0.013 + Math.random() * 0.015,
        size: 1.5 + Math.random() * 3,
        color: i % 2 === 0 ? this.accent : CARD_SPARK_COLORS[i % CARD_SPARK_COLORS.length],
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
    const w = this.canvas.clientWidth || 800;
    const h = this.canvas.clientHeight || 600;
    this.ctx?.clearRect(0, 0, w, h);
  }
}