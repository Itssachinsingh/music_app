import React, { useEffect, useRef } from "react";
import { hexToHue } from "../lib/color";

const TAU = Math.PI * 2;

// Log-spaced bands so the bass doesn't hog half the bars
const sampleBands = (freq, out, t) => {
  if (!freq) {
    for (let i = 0; i < out.length; i++) out[i] = 0.05 + 0.04 * Math.sin(t / 650 + i * 0.4);
    return;
  }
  const min = 2;
  const max = Math.min(freq.length - 1, 420);
  for (let i = 0; i < out.length; i++) {
    const a = Math.floor(min * (max / min) ** (i / out.length));
    const b = Math.max(a + 1, Math.floor(min * (max / min) ** ((i + 1) / out.length)));
    let sum = 0;
    for (let k = a; k < b; k++) sum += freq[k];
    out[i] = Math.min(1, (sum / (b - a) / 255) * (1 + (i / out.length) * 0.9));
  }
};

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, Math.max(0, Math.min(r, w / 2, h / 2)));
  else ctx.rect(x, y, w, h);
};

const spawn = (list, cx, cy, r, hue, count, speed) => {
  for (let i = 0; i < count && list.length < 420; i++) {
    const a = Math.random() * TAU;
    const v = (0.8 + Math.random() * 3.2) * speed;
    list.push({
      x: cx + Math.cos(a) * r,
      y: cy + Math.sin(a) * r,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 1,
      size: 0.8 + Math.random() * 2.4,
      hue: hue + Math.random() * 70,
    });
  }
};

const drawParticles = (ctx, list, boost) => {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.x += p.vx * (1 + boost * 2.5);
    p.y += p.vy * (1 + boost * 2.5);
    p.life -= 0.011;
    if (p.life <= 0) {
      list.splice(i, 1);
      continue;
    }
    ctx.fillStyle = `hsla(${p.hue}, 100%, 72%, ${p.life})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life + 0.4, 0, TAU);
    ctx.fill();
  }
};

function drawOrb(ctx, center, bands, wave, L, hue, t, particles, beat) {
  const { x: cx, y: cy, r: R } = center;
  const n = bands.length;
  const total = n * 2;
  const inner = R + 10;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(2, ((TAU * inner) / total) * 0.48);
  const spin = t * 0.00007;
  for (let i = 0; i < total; i++) {
    const k = i < n ? i : total - 1 - i;
    const v = bands[k];
    const len = 3 + v ** 1.5 * R * 1.15;
    const a = spin + (i / total) * TAU - Math.PI / 2;
    const c = Math.cos(a);
    const s = Math.sin(a);
    ctx.strokeStyle = `hsla(${hue + k * 1.3}, 95%, ${55 + v * 25}%, ${0.3 + v * 0.7})`;
    ctx.beginPath();
    ctx.moveTo(c * inner, s * inner);
    ctx.lineTo(c * (inner + len), s * (inner + len));
    ctx.stroke();
  }

  // Waveform halo orbiting outside the bars
  const steps = 180;
  const haloR = inner + R * 0.95;
  ctx.beginPath();
  for (let k = 0; k <= steps; k++) {
    const a = (k / steps) * TAU - spin * 2;
    const sample = wave
      ? (wave[Math.floor(((k % steps) / steps) * wave.length)] - 128) / 128
      : Math.sin(a * 6 + t / 500) * 0.04;
    const r = haloR + sample * R * 0.4;
    if (k === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.strokeStyle = `hsla(${hue + 50}, 100%, 72%, ${0.25 + L.energy * 0.6})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();

  if (beat) spawn(particles, cx, cy, inner, hue, 34, 1.2);
  else if (Math.random() < L.energy) spawn(particles, cx, cy, inner, hue, 1, 0.8);
  drawParticles(ctx, particles, L.pulse);
}

function drawBars(ctx, w, h, bands, L, hue, peaks) {
  const n = bands.length;
  const total = n * 2;
  const slot = w / total;
  const gap = Math.max(2, slot * 0.28);
  const bw = slot - gap;
  if (bw <= 0) return;
  const base = h * 0.66;
  const maxH = h * 0.42;

  const grad = ctx.createLinearGradient(0, base - maxH, 0, base);
  grad.addColorStop(0, `hsl(${hue + 70}, 100%, 72%)`);
  grad.addColorStop(0.5, `hsl(${hue + 30}, 95%, 60%)`);
  grad.addColorStop(1, `hsl(${hue}, 90%, 52%)`);

  for (let k = 0; k < n; k++) peaks[k] = Math.max(peaks[k] - 0.005, bands[k]);

  for (let i = 0; i < total; i++) {
    const k = i < n ? n - 1 - i : i - n; // mirrored: lows in the middle
    const v = bands[k];
    const bh = 3 + v ** 1.3 * maxH;
    const x = i * slot + gap / 2;
    ctx.fillStyle = grad;
    ctx.globalAlpha = 1;
    roundRect(ctx, x, base - bh, bw, bh, bw / 2);
    ctx.fill();
    ctx.globalAlpha = 0.16;
    roundRect(ctx, x, base + 6, bw, bh * 0.45, bw / 2);
    ctx.fill();

    const ph = 3 + peaks[k] ** 1.3 * maxH;
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = `hsl(${hue + 70}, 100%, 86%)`;
    ctx.fillRect(x, base - ph - 7, bw, 2);
  }
  ctx.globalAlpha = 1;
}

function drawWave(ctx, w, h, wave, L, hue, t) {
  const mid = h * 0.5;
  for (let layer = 0; layer < 3; layer++) {
    const amp = h * (0.3 - layer * 0.07) * (0.55 + L.energy);
    ctx.beginPath();
    for (let x = 0; x <= w; x += 4) {
      const sample = wave ? (wave[Math.floor((x / w) * (wave.length - 1))] - 128) / 128 : 0;
      const drift = Math.sin(x * 0.006 + t * 0.0012 * (layer + 1) + layer * 2) * (0.07 + L.mid * 0.28);
      const y = mid + (sample * (1 - layer * 0.2) + drift) * amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    // Fake glow: a wide faint stroke under a thin bright one (shadowBlur is very slow)
    const width = 3 - layer * 0.8;
    ctx.strokeStyle = `hsl(${hue + layer * 38}, 100%, ${60 + layer * 8}%)`;
    ctx.globalAlpha = 0.14 + L.pulse * 0.12;
    ctx.lineWidth = width * 5;
    ctx.stroke();
    ctx.globalAlpha = 0.95 - layer * 0.25;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawMini(ctx, w, h, bands, hue) {
  const n = bands.length;
  const gap = 2;
  const bw = (w - gap * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    const v = bands[i];
    const bh = Math.max(2, v ** 1.2 * h);
    ctx.fillStyle = `hsl(${hue + i * 4}, 95%, ${55 + v * 25}%)`;
    roundRect(ctx, i * (bw + gap), h - bh, bw, bh, 1.5);
    ctx.fill();
  }
}

const Visualizer = ({ levels, mode = "orb", accent, anchor, className = "" }) => {
  const canvasRef = useRef(null);
  const hueRef = useRef(262);
  hueRef.current = hexToHue(accent);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    // The full-screen canvas is soft and glowy, so it doesn't need retina resolution;
    // capping it cuts the pixels pushed per frame by up to ~2.5x
    const dpr = Math.min(window.devicePixelRatio || 1, mode === "mini" ? 2 : 1.25);
    let w = 0;
    let h = 0;
    let orbCenter = null;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Measured here, never per frame, so drawing doesn't force a layout. The disc
      // only scales/rotates about its centre, so its centre and base size are stable.
      const el = anchor?.current;
      if (el) {
        const a = el.getBoundingClientRect();
        orbCenter = { x: a.left - rect.left + a.width / 2, y: a.top - rect.top + a.height / 2, r: el.offsetWidth / 2 };
      }
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    if (anchor?.current) ro.observe(anchor.current);
    resize();

    const bands = new Float32Array(mode === "mini" ? 14 : 64);
    const peaks = new Float32Array(bands.length);
    const particles = [];
    let seenBeats = levels.current.beats;
    let raf;

    const frame = (t) => {
      const L = levels.current;
      const idle = !L.freq || L.energy < 0.004;
      sampleBands(idle ? null : L.freq, bands, t);
      const hue = hueRef.current;

      if (mode === "mini") {
        ctx.clearRect(0, 0, w, h);
        drawMini(ctx, w, h, bands, hue);
      } else {
        // Fade the previous frame instead of clearing it, leaving light trails
        ctx.globalCompositeOperation = "destination-out";
        ctx.fillStyle = `rgba(0,0,0,${mode === "wave" ? 0.22 : 0.38})`;
        ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = "lighter";

        const beat = L.beats !== seenBeats;
        seenBeats = L.beats;
        if (mode === "orb") {
          const base = orbCenter || { x: w / 2, y: h / 2, r: Math.min(w, h) * 0.2 };
          // Match the disc's CSS bass scale
          const center = { ...base, r: base.r * (1 + L.bass * 0.08) };
          drawOrb(ctx, center, bands, idle ? null : L.wave, L, hue, t, particles, beat);
        } else if (mode === "bars") {
          drawBars(ctx, w, h, bands, L, hue, peaks);
        } else {
          drawWave(ctx, w, h, idle ? null : L.wave, L, hue, t);
        }
        ctx.globalCompositeOperation = "source-over";
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [levels, mode, anchor]);

  return <canvas ref={canvasRef} className={`visualizer ${className}`} aria-hidden="true" />;
};

export default Visualizer;
