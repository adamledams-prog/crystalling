import { placeHubCharacter } from "../hub/roster.js";

const GOLD = "#e8c547";

const COLORS = [GOLD, "#b57edc", "#ffd966", "#9b6fd4", "#f4f0e6"];

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function getHubCenter(hubFelt) {
  const r = hubFelt.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height * 0.48 };
}

function getStageEls() {
  const stage = document.getElementById("hub-arena-stage");
  if (!stage) return null;
  return {
    stage,
    hero: stage.querySelector(".lorus-mega-hero"),
    heroImg: stage.querySelector(".lorus-mega-img"),
    spriteEl: stage.querySelector(".lorus-mega-spr"),
    heroName: stage.querySelector(".lorus-mega-name"),
    canvas: stage.querySelector(".lorus-mega-canvas"),
    flash: stage.querySelector(".lorus-mega-flash"),
    sunburst: stage.querySelector(".lorus-mega-sunburst"),
    badge: document.getElementById("lorus-mega-badge"),
    drone: document.getElementById("lorus-mega-drone"),
    video: document.getElementById("lorus-mega-video"),
  };
}

function resetRevealVideo(video) {
  if (!video) return;
  video.pause();
  video.removeAttribute("src");
  video.load();
  video.hidden = true;
  video.classList.remove("lorus-mega-video--show");
  video.style.cssText = "";
}

function waitForVideoEnd(video) {
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener("ended", onEnd);
      video.removeEventListener("error", onErr);
    };
    const onEnd = () => {
      done();
      resolve();
    };
    const onErr = () => {
      done();
      reject(new Error("video playback failed"));
    };
    video.addEventListener("ended", onEnd);
    video.addEventListener("error", onErr);
  });
}

class ParticleField {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.particles = [];
    this.running = false;
    this.raf = 0;
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

  burst(count = 50) {
    for (let i = 0; i < count; i++) {
      const a = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const sp = 2.5 + Math.random() * 7;
      this.particles.push({
        x: this.cx,
        y: this.cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 1,
        decay: 0.01 + Math.random() * 0.012,
        size: 2 + Math.random() * 4,
        color: COLORS[(Math.random() * COLORS.length) | 0],
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
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06;
        p.vx *= 0.992;
        p.life -= p.decay;
        if (p.life <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
        this.ctx.globalAlpha = Math.min(1, p.life);
        this.ctx.fillStyle = p.color;
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
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

function resetDrone(drone) {
  if (!drone) return;
  drone.hidden = true;
  drone.classList.remove("lorus-mega-drone--orbit", "lorus-mega-drone--throw");
  drone.style.cssText = "";
  drone.getAnimations().forEach((a) => a.cancel());
}

function clearPixelSprite(heroImg, spriteEl) {
  if (spriteEl) {
    spriteEl.hidden = true;
    spriteEl.classList.remove("lorus-mega-spr--run");
    spriteEl.style.backgroundImage = "";
  }
  if (heroImg) heroImg.hidden = false;
}

function hideStage(els) {
  const { stage, hero, heroImg, spriteEl, drone, sunburst, badge, flash, video } = els;
  stage.classList.remove("lorus-mega--active", "lorus-mega--brawl");
  stage.hidden = true;
  sunburst?.classList.remove("lorus-mega-sunburst--on");
  if (badge) badge.hidden = true;
  flash?.classList.remove("lorus-mega-flash--on", "lorus-mega-flash--solaris");
  resetDrone(drone);
  resetRevealVideo(video);
  if (hero) hero.className = "lorus-mega-hero";
  if (hero) hero.hidden = false;
  clearPixelSprite(heroImg, spriteEl);
  heroImg?.removeAttribute("src");
}

async function playSolarisDroneThrow({ hero, heroImg, spriteEl, drone, endC, flash, field, fullSrc }) {
  clearPixelSprite(heroImg, spriteEl);
  heroImg.src = fullSrc || "./images/persos/solaris-vaalor.png";
  heroImg.hidden = false;
  hero.classList.add("lorus-mega-hero--solaris-windup");

  const leftX = endC.x - 78;
  const leftY = endC.y - 8;
  const handX = endC.x + 32;
  const handY = endC.y - 22;
  const screenX = window.innerWidth / 2;
  const screenY = window.innerHeight * 0.42;

  drone.hidden = false;
  drone.style.left = `${leftX}px`;
  drone.style.top = `${leftY}px`;
  drone.classList.add("lorus-mega-drone--orbit");

  await wait(520);
  drone.classList.remove("lorus-mega-drone--orbit");

  const grab = drone.animate(
    [
      { left: `${leftX}px`, top: `${leftY}px`, transform: "translate(-50%, -50%) scale(1)" },
      { left: `${handX}px`, top: `${handY}px`, transform: "translate(-50%, -50%) scale(1.15)" },
    ],
    { duration: 420, easing: "cubic-bezier(0.33, 1.15, 0.48, 1)", fill: "forwards" }
  );
  await grab.finished;

  hero.classList.remove("lorus-mega-hero--solaris-windup");
  hero.classList.add("lorus-mega-hero--solaris-throw");

  field.burst(40);
  field.start();

  const launch = drone.animate(
    [
      {
        left: `${handX}px`,
        top: `${handY}px`,
        transform: "translate(-50%, -50%) scale(1.1)",
        filter: "drop-shadow(0 0 8px rgba(232,197,71,0.8))",
      },
      {
        left: `${screenX}px`,
        top: `${screenY}px`,
        transform: "translate(-50%, -50%) scale(5.5)",
        filter: "drop-shadow(0 0 28px rgba(181,126,220,0.95))",
      },
    ],
    { duration: 780, easing: "cubic-bezier(0.15, 0.85, 0.25, 1)", fill: "forwards" }
  );

  await wait(320);
  flash?.classList.add("lorus-mega-flash--on", "lorus-mega-flash--solaris");
  await launch.finished;
  await wait(180);
  flash?.classList.remove("lorus-mega-flash--on", "lorus-mega-flash--solaris");

  const fade = drone.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, fill: "forwards" });
  await fade.finished;
  resetDrone(drone);
  hero.classList.remove("lorus-mega-hero--solaris-throw");
}

async function playSolarisOnHub({ hubFelt, fullSrc, name }) {
  const els = getStageEls();
  if (!els?.hero || !els.heroImg || !els.canvas || !els.drone || !hubFelt) return;

  const endC = getHubCenter(hubFelt);
  els.stage.hidden = false;
  els.stage.classList.add("lorus-mega--active");
  if (els.heroName) els.heroName.textContent = name || "";

  els.hero.style.left = `${endC.x}px`;
  els.hero.style.top = `${endC.y}px`;
  els.hero.style.setProperty("--hero-scale", "1");
  els.hero.className = "lorus-mega-hero lorus-mega-hero--show";

  const field = new ParticleField(els.canvas);
  const onResize = () => field.resize();
  field.resize();
  window.addEventListener("resize", onResize);

  await playSolarisDroneThrow({
    hero: els.hero,
    heroImg: els.heroImg,
    spriteEl: els.spriteEl,
    drone: els.drone,
    endC,
    flash: els.flash,
    field,
    fullSrc,
  });

  field.stop();
  window.removeEventListener("resize", onResize);
  hideStage(els);
  placeHubCharacter({ src: fullSrc || "./images/persos/solaris-vaalor.png", name });
}

async function playReginaldScepterOnHub({ hubFelt, fullSrc, name, revealVideo }) {
  const els = getStageEls();
  if (!els?.stage || !hubFelt) return;

  const endC = getHubCenter(hubFelt);
  const videoSrc =
    revealVideo || "./images/persos/reginald-scepter-toss.webm";
  const portraitSrc = fullSrc || "./images/persos/reginald-roi.png";

  els.stage.hidden = false;
  els.stage.classList.add("lorus-mega--active", "lorus-mega--brawl");
  els.sunburst?.classList.add("lorus-mega-sunburst--on");
  if (els.badge) els.badge.hidden = false;

  if (els.video) {
    els.hero.hidden = true;
    clearPixelSprite(els.heroImg, els.spriteEl);
    resetRevealVideo(els.video);

    els.video.hidden = false;
    els.video.classList.add("lorus-mega-video--show");
    els.video.style.left = `${endC.x}px`;
    els.video.style.top = `${endC.y}px`;
    els.video.src = videoSrc;
    els.video.currentTime = 0;

    try {
      const playPromise = els.video.play();
      if (playPromise) await playPromise;
      await waitForVideoEnd(els.video);
    } catch {
      /* réseau / decode : on retombe sur le perso statique */
    }
  } else {
    await wait(1200);
  }

  els.flash?.classList.remove("lorus-mega-flash--on");
  els.sunburst?.classList.remove("lorus-mega-sunburst--on");
  hideStage(els);
  placeHubCharacter({ src: portraitSrc, name });
}

export async function playMegaCharReveal({
  id,
  classe,
  name,
  hubFelt,
  onCloseLorus,
  fullSrc,
}) {
  if (playing) return;
  if (!hubFelt) hubFelt = document.querySelector(".hub-felt");
  if (!hubFelt) return;

  onCloseLorus?.();
  placeHubCharacter({ id, classe, src: fullSrc, name });
}

export function isMegaAnimPlaying() {
  return playing;
}