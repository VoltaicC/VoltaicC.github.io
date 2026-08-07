(() => {
  "use strict";

  // ---------------------------------------------------------------------
  // Canvas + DPR-aware sizing (keeps things crisp on any resolution/aspect,
  // including ultrawide 21:9 and beyond).
  // ---------------------------------------------------------------------
  const canvas = document.getElementById("bg");
  const ctx = canvas.getContext("2d", { alpha: false });

  let W = 0, H = 0, DPR = 1;

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    network.resize(W, H);
    flow.resize(W, H);
  }

  // ---------------------------------------------------------------------
  // Shared settings (overridden by Wallpaper Engine properties, see bottom)
  // ---------------------------------------------------------------------
  const settings = {
    mode: "cycle",       // "cycle" | "network" | "flow"
    speed: 1,
    density: 1,
    logoOpacity: 0.06,
    accent: [138, 148, 255], // soft periwinkle, derived from brand navy #262161
    cycleSeconds: 26,
  };

  const BRAND_NAVY = [38, 33, 97];

  function rgba(rgb, a) {
    return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a})`;
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }

  // ---------------------------------------------------------------------
  // Background gradient (drawn every frame behind whichever scene is active)
  // ---------------------------------------------------------------------
  function drawBackdrop() {
    // Base vertical gradient guarantees an even tone edge-to-edge regardless
    // of aspect ratio (a radial alone crushes to near-black in the corners
    // of ultrawide screens).
    const base = ctx.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, "#0d1338");
    base.addColorStop(1, "#05060f");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);

    // Soft focal glow layered on top, sized off the diagonal so it scales
    // sensibly on both narrow and ultrawide viewports.
    const radius = Math.hypot(W, H) * 0.55;
    const glow = ctx.createRadialGradient(
      W * 0.5, H * 0.42, 0,
      W * 0.5, H * 0.42, radius
    );
    glow.addColorStop(0, "rgba(70, 78, 170, 0.30)");
    glow.addColorStop(1, "rgba(70, 78, 170, 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);
  }

  // ---------------------------------------------------------------------
  // Brand watermark — loads the real logo mark from assets/logo-mark.svg and
  // draws it to canvas, so any edits to that file are reflected here. Drawn
  // dead-center and perfectly static; the network/flow scenes carry all the
  // motion in the wallpaper.
  // ---------------------------------------------------------------------
  const markImage = new Image();
  let markReady = false;
  let markAspect = 1;
  markImage.onload = () => {
    markReady = true;
    markAspect = markImage.naturalWidth / markImage.naturalHeight;
  };
  markImage.src = "assets/logo-mark.svg";

  function drawWatermark(t, opacity) {
    if (opacity <= 0.001 || !markReady) return;
    const size = Math.min(W, H) * 0.46;
    const w = markAspect >= 1 ? size : size * markAspect;
    const h = markAspect >= 1 ? size / markAspect : size;
    const cx = W / 2;
    const cy = H / 2;

    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.drawImage(markImage, cx - w / 2, cy - h / 2, w, h);
    ctx.restore();
  }

  // ---------------------------------------------------------------------
  // Scene 1: Pulsing Network Grid
  // ---------------------------------------------------------------------
  const network = {
    nodes: [],
    edges: [],
    pulses: [],
    spawnTimer: 0,

    resize(w, h) {
      const area = w * h;
      const count = clamp(Math.round((area / 34000) * settings.density), 26, 150);
      this.nodes = [];
      for (let i = 0; i < count; i++) {
        this.nodes.push({
          x: rand(0.03, 0.97) * w,
          y: rand(0.03, 0.97) * h,
          phase: rand(0, Math.PI * 2),
          r: rand(1.4, 2.6),
        });
      }
      // Connect each node to its nearest few neighbours within range.
      const maxDist = Math.max(w, h) * 0.16;
      this.edges = [];
      for (let i = 0; i < this.nodes.length; i++) {
        const distances = [];
        for (let j = 0; j < this.nodes.length; j++) {
          if (i === j) continue;
          const dx = this.nodes[i].x - this.nodes[j].x;
          const dy = this.nodes[i].y - this.nodes[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < maxDist) distances.push([d, j]);
        }
        distances.sort((a, b) => a[0] - b[0]);
        const linkCount = Math.min(2, distances.length);
        for (let k = 0; k < linkCount; k++) {
          const j = distances[k][1];
          const key = i < j ? `${i}_${j}` : `${j}_${i}`;
          if (!this._seen) this._seen = new Set();
          if (!this._seen.has(key)) {
            this._seen.add(key);
            this.edges.push({ a: i, b: j });
          }
        }
      }
      this._seen = null;
      this.pulses = [];
    },

    update(dt, t) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0 && this.edges.length) {
        this.spawnTimer = rand(0.25, 0.7) / settings.speed;
        const e = this.edges[(Math.random() * this.edges.length) | 0];
        const forward = Math.random() < 0.5;
        this.pulses.push({
          a: forward ? e.a : e.b,
          b: forward ? e.b : e.a,
          t: 0,
          speed: rand(0.5, 0.9) * settings.speed,
        });
      }
      for (let i = this.pulses.length - 1; i >= 0; i--) {
        const p = this.pulses[i];
        p.t += dt * p.speed;
        if (p.t >= 1) this.pulses.splice(i, 1);
      }
    },

    draw(t, alpha) {
      if (alpha <= 0.001) return;
      const nodes = this.nodes;

      ctx.lineWidth = 1;
      ctx.strokeStyle = rgba(BRAND_NAVY.map((c) => Math.min(255, c + 90)), 0.14 * alpha);
      for (const e of this.edges) {
        const a = nodes[e.a], b = nodes[e.b];
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      for (const n of nodes) {
        const twinkle = 0.55 + Math.sin(t * 0.6 + n.phase) * 0.25;
        ctx.beginPath();
        ctx.fillStyle = rgba([200, 205, 255], twinkle * 0.55 * alpha);
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (const p of this.pulses) {
        const a = nodes[p.a], b = nodes[p.b];
        if (!a || !b) continue;
        const x = lerp(a.x, b.x, p.t);
        const y = lerp(a.y, b.y, p.t);
        const fade = Math.sin(p.t * Math.PI);
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 10);
        grad.addColorStop(0, rgba(settings.accent, 0.9 * fade * alpha));
        grad.addColorStop(1, rgba(settings.accent, 0));
        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = rgba([255, 255, 255], 0.9 * fade * alpha);
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  };

  // ---------------------------------------------------------------------
  // Scene 2: Flowing Data Migration
  // ---------------------------------------------------------------------
  const flow = {
    lanes: [],

    resize(w, h) {
      const count = clamp(Math.round((h / 34) * settings.density), 10, 34);
      this.lanes = [];
      for (let i = 0; i < count; i++) {
        const baseY = ((i + 0.5) / count) * h;
        const particles = [];
        const pCount = Math.max(1, Math.round(rand(1, 3)));
        for (let k = 0; k < pCount; k++) {
          particles.push({ x: rand(0, w), trail: [] });
        }
        this.lanes.push({
          baseY,
          amp: rand(6, 18),
          freq: rand(0.6, 1.4),
          phase: rand(0, Math.PI * 2),
          dir: Math.random() < 0.5 ? 1 : -1,
          speed: rand(40, 110),
          particles,
        });
      }
    },

    laneY(lane, x, w) {
      return lane.baseY + Math.sin((x / w) * Math.PI * 2 * lane.freq + lane.phase) * lane.amp;
    },

    update(dt, t) {
      for (const lane of this.lanes) {
        for (const p of lane.particles) {
          p.x += lane.dir * lane.speed * settings.speed * dt;
          if (lane.dir > 0 && p.x > W + 40) p.x = -40;
          if (lane.dir < 0 && p.x < -40) p.x = W + 40;
          p.trail.unshift(p.x);
          if (p.trail.length > 14) p.trail.length = 14;
        }
      }
    },

    draw(t, alpha) {
      if (alpha <= 0.001) return;

      // faint lane guide lines
      ctx.lineWidth = 1;
      for (const lane of this.lanes) {
        ctx.beginPath();
        ctx.strokeStyle = rgba(BRAND_NAVY.map((c) => Math.min(255, c + 70)), 0.10 * alpha);
        for (let x = 0; x <= W; x += 24) {
          const y = this.laneY(lane, x, W);
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      for (const lane of this.lanes) {
        for (const p of lane.particles) {
          for (let i = 0; i < p.trail.length; i++) {
            const tx = p.trail[i];
            const ty = this.laneY(lane, tx, W);
            const f = 1 - i / p.trail.length;
            ctx.beginPath();
            ctx.fillStyle = i === 0
              ? rgba([255, 255, 255], 0.9 * alpha)
              : rgba(settings.accent, f * 0.55 * alpha);
            ctx.arc(tx, ty, i === 0 ? 2.4 : 1.6 * f, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    },
  };

  // ---------------------------------------------------------------------
  // Mode / crossfade orchestration
  // ---------------------------------------------------------------------
  const scenes = { network, flow };
  let activeName = "network";
  let nextName = null;
  let transitionT = 0;
  const TRANSITION_TIME = 1.6;
  let cycleTimer = settings.cycleSeconds;

  function beginTransition(target) {
    if (target === activeName || nextName) return;
    nextName = target;
    transitionT = 0;
  }

  function applyModeSetting() {
    if (settings.mode === "network" || settings.mode === "flow") {
      if (!nextName) beginTransition(settings.mode);
    }
    cycleTimer = settings.cycleSeconds;
  }

  function manualCycle() {
    const order = ["network", "flow"];
    const cur = nextName || activeName;
    const target = order[(order.indexOf(cur) + 1) % order.length];
    settings.mode = target;
    beginTransition(target);
    showHintFlash(target === "network" ? "Pulsing Network Grid" : "Flowing Data Migration");
  }

  const hintEl = document.getElementById("hint");
  let hintTimer = null;
  function showHintFlash(label) {
    if (!hintEl) return;
    hintEl.textContent = label + "  (M — switch mode)";
    hintEl.style.opacity = "1";
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => { hintEl.style.opacity = "0.35"; }, 1800);
  }

  // ---------------------------------------------------------------------
  // Main loop
  // ---------------------------------------------------------------------
  let last = performance.now();
  let clock = 0;

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    clock += dt;

    if (settings.mode === "cycle") {
      cycleTimer -= dt;
      if (cycleTimer <= 0 && !nextName) {
        beginTransition(activeName === "network" ? "flow" : "network");
        cycleTimer = settings.cycleSeconds;
      }
    }

    network.update(dt, clock);
    flow.update(dt, clock);

    let activeAlpha = 1, nextAlpha = 0;
    if (nextName) {
      transitionT += dt / TRANSITION_TIME;
      if (transitionT >= 1) {
        activeName = nextName;
        nextName = null;
        transitionT = 0;
        activeAlpha = 1;
        nextAlpha = 0;
      } else {
        activeAlpha = 1 - transitionT;
        nextAlpha = transitionT;
      }
    }

    drawBackdrop();
    scenes[activeName].draw(clock, activeAlpha);
    if (nextName) scenes[nextName].draw(clock, nextAlpha);
    drawWatermark(clock, settings.logoOpacity);

    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("keydown", (e) => {
    if (e.key === "m" || e.key === "M") manualCycle();
  });

  resize();
  requestAnimationFrame(frame);

  // ---------------------------------------------------------------------
  // Wallpaper Engine property hook.
  // Wallpaper Engine calls window.wallpaperPropertyListener.applyUserProperties
  // with the values configured in the in-app "Properties" panel (see project.json).
  // ---------------------------------------------------------------------
  window.wallpaperPropertyListener = {
    applyUserProperties(props) {
      if (props.mode) {
        settings.mode = props.mode.value;
        applyModeSetting();
      }
      if (props.speed) settings.speed = parseFloat(props.speed.value);
      if (props.density) {
        settings.density = parseFloat(props.density.value);
        network.resize(W, H);
        flow.resize(W, H);
      }
      if (props.logoopacity) settings.logoOpacity = parseFloat(props.logoopacity.value) / 100;
      if (props.accentcolor) {
        settings.accent = props.accentcolor.value.split(" ").map(Number);
      }
      if (props.cornerlogoscale) {
        document.documentElement.style.setProperty(
          "--corner-logo-scale",
          parseFloat(props.cornerlogoscale.value) / 100
        );
      }
      if (props.cornerlogovpos) {
        document.documentElement.style.setProperty(
          "--corner-logo-vpos",
          parseFloat(props.cornerlogovpos.value)
        );
      }
      if (hintEl && typeof window.wallpaperRegisterAudioListener === "function") {
        hintEl.style.display = "none"; // running inside Wallpaper Engine, hide dev hint
      }
    },
  };

  if (typeof window.wallpaperRegisterAudioListener === "function" && hintEl) {
    hintEl.style.display = "none";
  }
})();
