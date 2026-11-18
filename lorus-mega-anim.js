const GOLD = "#e8c547";
const PURPLE = "#b57edc";
const CREAM = "#f4f0e6";

const PHASE_MS = {
  charge: 320,
  launch: 720,
  hero: 1650,
  outro: 780,
};

const COLORS = [GOLD, PURPLE, "#ffd966", "#9b6fd4", CREAM];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function rectCenter(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.running = false;
    this.raf = 0;
    this.mode = "burst";
    this.cx = 0;
    this.cy = 0;
    this.t = 0;
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

  burst(count = 70) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const sp = 2.5 + Math.random() * 7;
      this.particles.push({
        x: this.cx,
        y: this.cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.008 + Math.random() * 0.012,
        size: 2 + Math.random() * 4,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        spin: Math.random() * 0.2,
      });
    }
  }

  orbit(count = 36) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count;
      const dist = 55 + Math.random() * 45;
      this.particles.push({
        x: this.cx + Math.cos(a) * dist,
        y: this.cy + Math.sin(a) * dist,
        vx: 0,
        vy: 0,
        life: 1,
        decay: 0.004,
        size: 1.5 + Math.random() * 2.5,
        color: COLORS[i % 2 === 0 ? 0 : 1],
        orbit: true,
        angle: a,
        dist,
        speed: 0.04 + Math.random() * 0.03,
      });
    }
    this.mode = "orbit";
  }

  sparkles(count = 24) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: this.cx + (Math.random() - 0.5) * 140,
        y: this.cy + (Math.random() - 0.5) * 160,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.3 - Math.random() * 1.2,
        life: 1,
        decay: 0.006,
        size: 1 + Math.random() * 2,
        color: GOLD,
        sparkle: true,
      });
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.t = 0;
    const tick = () => {
      if (!this.running) return;
      this.t += 1;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        if (p.orbit) {
          p.angle += p.speed;
          p.x = this.cx + Math.cos(p.angle) * p.dist;
          p.y = this.cy + Math.sin(p.angle) * p.dist * 0.75;
        } else {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += p.sparkle ? 0.02 : 0.06;
          p.vx *= 0.992;
        }
        p.life -= p.decay;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        this.ctx.globalAlpha = Math.min(1, p.life);
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        if (p.sparkle && this.t % 6 < 3) {
          this.ctx.moveTo(p.x, p.y - p.size * 2);
          this.ctx.lineTo(p.x, p.y + p.size * 2);
          this.ctx.lineWidth = 1.2;
          this.ctx.strokeStyle = p.color;
          this.ctx.stroke();
        } else {
          this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
      this.ctx.globalAlpha = 1;
      if (this.particles.length > 0) this.raf = requestAnimationFrame(tick);
      else this.running = false;
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }
}

let playing = false;

export async function playMegaCharReveal({ name, imgEl, sheetEl, anim = "cosmic" }) {
  if (playing) return;
  playing = true;

  const stage = document.getElementById("lorus-mega-stage");
  const hero = stage?.querySelector(".lorus-mega-hero");
  const heroImg = stage?.querySelector(".lorus-mega-img");
  const heroName = stage?.querySelector(".lorus-mega-name");
  const canvas = stage?.querySelector(".lorus-mega-canvas");
  const flash = stage?.querySelector(".lorus-mega-flash");
  const sunburst = stage?.querySelector(".lorus-mega-sunburst");
  const badge = document.getElementById("lorus-mega-badge");
  const card = imgEl?.closest(".lorus-card");
  const isBrawl = anim === "brawl";

  if (!stage || !hero || !heroImg || !canvas || !imgEl || !sheetEl) {
    playing = false;
    return;
  }

  const reduced = prefersReducedMotion();

  stage.hidden = false;
  stage.classList.add("lorus-mega--active");
  if (isBrawl) stage.classList.add("lorus-mega--brawl");
  card?.classList.add("lorus-card--charging");
  sheetEl.classList.add("lorus-sheet--mega");
  if (isBrawl) sheetEl.classList.add("lorus-sheet--brawl");

  const field = new ParticleField(canvas);
  const onResize = () => field.resize();
  field.resize();
  window.addEventListener("resize", onResize);

  heroImg.src = imgEl.src;
  heroImg.alt = imgEl.alt;
  heroName.textContent = name || "";
  if (badge) {
    if (isBrawl) {
      badge.hidden = false;
      badge.textContent = "BRAWLER !";
    } else {
      badge.hidden = true;
    }
  }

  const sheetRect = sheetEl.getBoundingClientRect();
  const start = imgEl.getBoundingClientRect();
  const startC = rectCenter(start);
  const endC = { x: sheetRect.left + sheetRect.width / 2, y: sheetRect.top + sheetRect.height * 0.46 };

  const setHeroAt = (cx, cy, scale) => {
    hero.style.left = `${cx}px`;
    hero.style.top = `${cy}px`;
    hero.style.setProperty("--hero-scale", String(scale));
  };

  setHeroAt(startC.x, startC.y, 0.35);
  hero.className = "lorus-mega-hero lorus-mega-hero--launch";

  if (reduced) {
    setHeroAt(endC.x, endC.y, 1);
    hero.classList.add("lorus-mega-hero--show");
    await wait(600);
    stage.classList.remove("lorus-mega--active");
    stage.hidden = true;
    card?.classList.remove("lorus-card--charging");
    sheetEl.classList.remove("lorus-sheet--mega");
    window.removeEventListener("resize", onResize);
    playing = false;
    return;
  }

  await wait(PHASE_MS.charge);
  card?.classList.remove("lorus-card--charging");
  card?.classList.add("lorus-card--fired");

  setHeroAt(endC.x, endC.y, isBrawl ? 0.15 : 1);
  hero.className = isBrawl
    ? "lorus-mega-hero lorus-mega-hero--brawl-drop"
    : "lorus-mega-hero lorus-mega-hero--show";

  if (isBrawl) {
    sunburst?.classList.add("lorus-mega-sunburst--on");
    await wait(60);
    setHeroAt(endC.x, endC.y, 1);
    hero.className = "lorus-mega-hero lorus-mega-hero--brawl-show";
    field.burst(55);
  } else {
    field.burst(85);
  }
  field.start();
  flash?.classList.add("lorus-mega-flash--on");

  await wait(280);
  flash?.classList.remove("lorus-mega-flash--on");
  field.orbit(42);
  field.start();

  await wait(PHASE_MS.launch);
  field.sparkles(30);
  field.start();
  hero.classList.add(isBrawl ? "lorus-mega-hero--brawl-idle" : "lorus-mega-hero--pulse");

  await wait(PHASE_MS.hero);
  hero.classList.add("lorus-mega-hero--outro");

  await wait(420);
  setHeroAt(startC.x, startC.y, 0.4);
  hero.className = "lorus-mega-hero lorus-mega-hero--return";

  await wait(PHASE_MS.outro);
  field.stop();
  stage.classList.remove("lorus-mega--active", "lorus-mega--brawl");
  stage.hidden = true;
  sunburst?.classList.remove("lorus-mega-sunburst--on");
  if (badge) badge.hidden = true;
  hero.className = "lorus-mega-hero";
  heroImg.removeAttribute("src");
  card?.classList.remove("lorus-card--fired");
  sheetEl.classList.remove("lorus-sheet--mega", "lorus-sheet--brawl");
  window.removeEventListener("resize", onResize);
  playing = false;
}

export function isMegaAnimPlaying() {
  return playing;
}