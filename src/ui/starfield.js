/**
 * The view outside the window.
 *
 * One 2D canvas, one loop. The catalogue is real (see data/stars.js) and the
 * camera drifts at the true sidereal rate, so the field is where the sky
 * actually is and moves the way it actually moves.
 *
 * Everything that moves here dies with the FX toggle: with effects off the
 * canvas paints a single static frame and the loop stops. Constellations are
 * content, so they stay; twinkle is not, so it goes.
 */

import { FIELD } from "../config.js";
import { gmstHours } from "../data/astro.js";
import { FIGURES, LABELLED, LINES, STARS } from "../data/stars.js";

const RAD = Math.PI / 180;

/** Half the field of view, degrees. Wide enough to hold Orion to Gemini. */
const HALF_FOV = 55;

/** Drift of the anonymous field layers. Slow enough to read as depth. */
const DRIFT_PX_PER_SEC = 7;
/** The haze layer is further away, so it crawls. */
const HAZE_DRIFT_PX_PER_SEC = 3;

/**
 * The anonymous fill lives in SCREEN space, not on the sphere.
 *
 * Distributing it uniformly over the celestial sphere and then projecting
 * looks correct and photographs badly: a stereographic projection stretches
 * area away from the tangent point, so the same angular density lands far
 * fewer points per screen pixel at the edges than at the centre, and the
 * corners come out near-empty. The catalogue must be projected — those are
 * real positions — but the fill is invented, so it is generated directly on
 * a wrapping virtual plane a little larger than the viewport and is even by
 * construction. Regenerated on resize.
 */
const FILL_PAD = 48;
const FILL_COUNT = 1150;
const HAZE_COUNT = 320;

/** Real stars go dimmer than body text — the sky is behind the instruments. */
const INK_HOT = "#cfe8ff";
const INK_MID = "#e8e8e4";
const INK_COOL = "#ffdf80";

function ink(bv) {
  if (bv < 0.3) return INK_HOT;
  if (bv <= 0.9) return INK_MID;
  return INK_COOL;
}

/** Deterministic PRNG, so the field fill is identical on every load. */
function mulberry32(seed) {
  return function rand() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Faint background field. These are NOT catalogued stars and are never
 * labelled, never twinkle, and are drawn dimmer than everything real — they
 * exist so the sky has the density a real one has between the bright stars.
 *
 * Points are bucketed by alpha at build time so a frame sets `globalAlpha`
 * once per bucket rather than once per point: ~1500 points, ~a dozen state
 * changes.
 *
 * @param {number} w viewport width, CSS px
 * @param {number} h viewport height, CSS px
 * @param {number} seed so the two layers do not land on the same lattice
 * @param {number} count
 * @param {{ dim:number, magFrom:number, magSpan:number, big:number }} opts
 */
function buildFieldLayer(w, h, seed, count, opts) {
  const rand = mulberry32(seed);
  const periodX = w + FILL_PAD * 2;
  const periodY = h + FILL_PAD * 2;
  /** @type {Map<string, {alpha:number, size:number, xs:number[], ys:number[]}>} */
  const buckets = new Map();

  for (let i = 0; i < count; i++) {
    const mag = opts.magFrom + rand() * opts.magSpan;
    // Quantised to 0.02 so the spread survives but the bucket count does not
    // explode. The spread itself is the magnitude curve, unchanged.
    const alpha = Math.round(alphaFor(mag) * opts.dim * 50) / 50;
    const size = mag < opts.big ? 2 : 1;
    const key = `${alpha}:${size}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { alpha, size, xs: [], ys: [] };
      buckets.set(key, bucket);
    }
    bucket.xs.push(rand() * periodX);
    bucket.ys.push(rand() * periodY);
  }

  return {
    periodX,
    periodY,
    buckets: [...buckets.values()].map((b) => ({
      alpha: b.alpha,
      size: b.size,
      xs: Float32Array.from(b.xs),
      ys: Float32Array.from(b.ys),
    })),
  };
}

/** Wrap into [0, period). */
function wrap(v, period) {
  return ((v % period) + period) % period;
}

/**
 * Magnitude runs backwards: -1.5 is brilliant, 6 is barely there.
 * Hoisted out of `initStarfield` because the field layers need it at build
 * time, before there is a canvas.
 */
function alphaFor(mag) {
  return Math.max(0.12, Math.min(1, 1.15 - (mag + 1.5) / 7.5));
}

export function initStarfield(canvas) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return { destroy() {} };

  const byName = new Map(STARS.map((s, i) => [s[0], i]));

  /** Built in `resize()`, because both layers are sized to the viewport. */
  let fill = null;
  let haze = null;

  // Twinkle is per-star and out of phase, so the sky shimmers rather than
  // pulsing in unison.
  const twinkle = STARS.map((s, i) => ({
    on: s[3] < 3,
    // Golden-angle phases, so no two neighbours shimmer together.
    phase: (i * 2.399963) % (Math.PI * 2),
    freq: 0.6 + ((i * 37) % 100) / 140,
    // Dimmer stars scintillate harder, which is how it actually looks.
    amp: s[3] < 1.5 ? 0.12 : s[3] < 2 ? 0.18 : 0.24,
  }));

  const gmst0 = gmstHours();
  let dpr = 1;
  let w = 0;
  let h = 0;
  let cx = 0;
  let cy = 0;
  let scale = 1;

  let projected = [];
  let projectedFigures = [];
  let camRa = FIELD.ra;

  let pointer = { x: 0, y: 0 };
  let pointerLerp = { x: 0, y: 0 };
  let scrollY = 0;

  let meteor = null;
  let nextMeteorAt = performance.now() + 6000 + Math.random() * 12000;

  let raf = 0;
  let running = false;
  let lastDraw = 0;
  let lastProject = 0;

  const fxOn = () => document.documentElement.dataset.fx !== "off" && !reducedMotion();

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx = w / 2;
    cy = h / 2;
    // Stereographic radius at the field edge: r = 2·tan(c/2).
    scale = Math.hypot(w, h) / 2 / (2 * Math.tan((HALF_FOV * RAD) / 2));
    // The fill is screen-space, so it is rebuilt — deterministically — for
    // every viewport size rather than reprojected.
    fill = buildFieldLayer(w, h, 0x5eee1e, FILL_COUNT, {
      dim: 0.55,
      magFrom: 4.6,
      magSpan: 1.6,
      big: 4.9,
    });
    haze = buildFieldLayer(w, h, 0x1a7e04, HAZE_COUNT, {
      dim: 0.34,
      magFrom: 5.9,
      magSpan: 0.9,
      big: -99, // never
    });
    project();
  }

  function projectPoint(raDeg, decDeg, ra0, dec0) {
    const ra = raDeg * RAD;
    const dec = decDeg * RAD;
    const dRa = ra - ra0;
    const cosc =
      Math.sin(dec0) * Math.sin(dec) + Math.cos(dec0) * Math.cos(dec) * Math.cos(dRa);
    // Cull the far hemisphere; stereographic blows up towards the antipode.
    if (cosc < -0.1) return null;
    const k = 2 / (1 + cosc);
    const x = k * Math.cos(dec) * Math.sin(dRa);
    const y =
      k * (Math.cos(dec0) * Math.sin(dec) - Math.sin(dec0) * Math.cos(dec) * Math.cos(dRa));
    // East to the left, the way a sky chart is drawn.
    return { x: cx - x * scale, y: cy - y * scale };
  }

  /** Recompute screen positions. Cheap enough at 1 Hz; not per frame. */
  function project() {
    camRa = FIELD.ra + (gmstHours() - gmst0) * 15;
    const ra0 = camRa * RAD;
    const dec0 = FIELD.dec * RAD;

    projected = STARS.map((s) => projectPoint(s[1], s[2], ra0, dec0));
    projectedFigures = FIGURES.map((f) => projectPoint(f.ra, f.dec, ra0, dec0));
  }

  function starSize(mag) {
    if (mag < 1.5) return 3;
    if (mag <= 2.5) return 2;
    return 1;
  }

  /**
   * One anonymous layer: wrap into the virtual plane, then paint.
   * Everything is integer-snapped so a 1px point never resolves to a
   * two-pixel smear.
   */
  function drawFieldLayer(layer, offsetX, offsetY) {
    for (const bucket of layer.buckets) {
      ctx.globalAlpha = bucket.alpha;
      ctx.fillStyle = INK_MID;
      const { xs, ys, size } = bucket;
      for (let i = 0; i < xs.length; i++) {
        const x = wrap(xs[i] + offsetX, layer.periodX) - FILL_PAD;
        const y = wrap(ys[i] + offsetY, layer.periodY) - FILL_PAD;
        ctx.fillRect(x | 0, y | 0, size, size);
      }
    }
  }

  function draw(now) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    const live = fxOn();

    if (live) {
      pointerLerp.x += (pointer.x - pointerLerp.x) * 0.06;
      pointerLerp.y += (pointer.y - pointerLerp.y) * 0.06;
    } else {
      pointerLerp = { x: 0, y: 0 };
    }

    // Two depth groups. The real catalogue moves as one rigid sheet so the
    // constellation figures never distort; only the anonymous fill parallaxes
    // hard enough to read as distance.
    const farX = pointerLerp.x * 6;
    const farY = pointerLerp.y * 6 + scrollY * -0.045;
    const nearX = pointerLerp.x * 2.5;
    const nearY = pointerLerp.y * 2.5 + scrollY * -0.02;

    /* ── Field fill ─────────────────────────────────────────────────── */
    // The anonymous layers drift continuously and wrap, which is what makes
    // the sky read as moving rather than merely twinkling. The catalogue
    // below them does NOT drift — those stars are real, and they travel at
    // the sidereal rate or not at all.
    //
    // Both axes wrap. Scroll parallax alone can push the field a few hundred
    // pixels off the top of a long page, and a screen-space layer has no
    // sphere to fall back on.
    const seconds = now / 1000;
    // The haze crawls at less than half the fill's rate and takes half its
    // pointer parallax: further away, so it moves less. That difference is
    // the whole reason it is a separate layer.
    drawFieldLayer(
      haze,
      farX * 0.5 + (live ? seconds * HAZE_DRIFT_PX_PER_SEC : 0),
      farY * 0.5
    );
    drawFieldLayer(fill, farX + (live ? seconds * DRIFT_PX_PER_SEC : 0), farY);

    /* ── Catalogue layer ────────────────────────────────────────────── */
    ctx.save();
    ctx.translate(nearX, nearY);

    // Constellation figures, very quiet.
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(200, 220, 255, 0.08)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const [a, b] of LINES) {
      const pa = projected[byName.get(a)];
      const pb = projected[byName.get(b)];
      if (!pa || !pb) continue;
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
    }
    ctx.stroke();

    // Figure name plates.
    ctx.font = '9px "JetBrains Mono", monospace';
    ctx.fillStyle = "#8a8a85";
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < FIGURES.length; i++) {
      const p = projectedFigures[i];
      if (!p) continue;
      ctx.fillText(FIGURES[i].name, p.x, p.y);
    }

    // Stars.
    const t = now / 1000;
    for (let i = 0; i < projected.length; i++) {
      const p = projected[i];
      if (!p || p.x < -40 || p.x > w + 40 || p.y < -40 || p.y > h + 40) continue;
      const [name, , , mag, bv] = STARS[i];

      let a = alphaFor(mag);
      const tw = twinkle[i];
      if (live && tw.on) a += tw.amp * Math.sin(t * tw.freq * 2 + tw.phase);

      ctx.globalAlpha = Math.max(0.1, Math.min(1, a));
      ctx.fillStyle = ink(bv);

      const size = starSize(mag);
      const x = Math.round(p.x - size / 2);
      const y = Math.round(p.y - size / 2);
      ctx.fillRect(x, y, size, size);

      // The brightest few get diffraction spikes — the only ornament here.
      if (mag < 1.5) {
        ctx.globalAlpha *= 0.5;
        ctx.fillRect(Math.round(p.x) - 4, Math.round(p.y), 9, 1);
        ctx.fillRect(Math.round(p.x), Math.round(p.y) - 4, 1, 9);
      }

      if (LABELLED.has(name)) {
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#8a8a85";
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(name.toUpperCase(), p.x + 7, p.y + 3);
      }
    }

    /* ── Meteor ─────────────────────────────────────────────────────── */
    if (live) {
      if (!meteor && now >= nextMeteorAt) {
        const len = 120 + Math.random() * 80;
        const angle = (200 + Math.random() * 25) * RAD; // down and to the left
        meteor = {
          x: w * (0.35 + Math.random() * 0.5),
          y: h * (0.05 + Math.random() * 0.4),
          dx: Math.cos(angle),
          dy: -Math.sin(angle),
          len,
          start: now,
        };
      }
      if (meteor) {
        const p = (now - meteor.start) / 500;
        if (p >= 1) {
          meteor = null;
          nextMeteorAt = now + 14000 + Math.random() * 16000;
        } else {
          const travel = 260;
          const hx = meteor.x + meteor.dx * travel * p;
          const hy = meteor.y + meteor.dy * travel * p;
          const tx = hx - meteor.dx * meteor.len;
          const ty = hy - meteor.dy * meteor.len;
          const grad = ctx.createLinearGradient(tx, ty, hx, hy);
          grad.addColorStop(0, "rgba(207,232,255,0)");
          grad.addColorStop(1, `rgba(232,232,228,${(1 - p) * 0.9})`);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(hx, hy);
          ctx.stroke();
        }
      }
    }

    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function frame(now) {
    if (!running) return;
    // 30fps is indistinguishable for twinkle and halves the battery cost.
    // A live meteor gets full rate for the half second it exists.
    const interval = meteor ? 0 : 1000 / 30;
    if (now - lastDraw >= interval) {
      if (now - lastProject >= 1000) {
        project();
        lastProject = now;
      }
      draw(now);
      lastDraw = now;
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    lastDraw = 0;
    raf = requestAnimationFrame(frame);
  }

  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  /** Effects off: one static frame, then nothing. */
  function paintStatic() {
    stop();
    project();
    draw(performance.now());
  }

  let resizeTimer = 0;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      resize();
      if (!running) draw(performance.now());
    }, 150);
  }

  function onPointer(e) {
    pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
    pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
  }

  function onScroll() {
    scrollY = window.scrollY;
  }

  function onVisibility() {
    if (document.hidden) stop();
    else if (fxOn()) start();
  }

  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  resize();
  if (fxOn()) start();
  else paintStatic();

  return {
    /** Called by the FX toggle. */
    setFx(on) {
      if (on) start();
      else paintStatic();
    },
    destroy() {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    },
  };
}
