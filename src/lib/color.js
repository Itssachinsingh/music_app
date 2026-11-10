const DEFAULT_HUE = 262;

const hexToRgb = (hex) => {
  const n = parseInt(hex.replace("#", "").slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const rgbToHex = (r, g, b) =>
  "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");

const rgbToHsl = (r, g, b) => {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return [h, s, l];
};

const hslToRgb = (h, s, l) => {
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [f(0) * 255, f(8) * 255, f(4) * 255];
};

export const hexToHue = (hex) => {
  const [h, s] = rgbToHsl(...hexToRgb(hex || "#7c5cff"));
  return s < 0.08 ? DEFAULT_HUE : h;
};

// Push a colour into a vivid, readable range so it works as a glow on a dark UI
export const tune = (hex) => {
  let [h, s, l] = rgbToHsl(...hexToRgb(hex));
  if (s < 0.08) h = DEFAULT_HUE;
  s = Math.max(s, 0.62);
  l = Math.min(Math.max(l, 0.52), 0.66);
  return rgbToHex(...hslToRgb(h, s, l));
};

export const shiftHue = (hex, deg) => {
  const [h, s, l] = rgbToHsl(...hexToRgb(hex));
  return rgbToHex(...hslToRgb((h + deg + 360) % 360, s, l));
};

const cache = new Map();

// Weighted average that favours saturated, mid-bright pixels so the accent isn't muddy
export const extractColor = (src, fallback = "#7c5cff") => {
  if (!src) return Promise.resolve(tune(fallback));
  if (cache.has(src)) return Promise.resolve(cache.get(src));
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const size = 40;
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);
        let r = 0;
        let g = 0;
        let b = 0;
        let total = 0;
        for (let i = 0; i < data.length; i += 4) {
          const max = Math.max(data[i], data[i + 1], data[i + 2]);
          const min = Math.min(data[i], data[i + 1], data[i + 2]);
          const sat = max === 0 ? 0 : (max - min) / max;
          const light = max / 255;
          const w = sat * sat * (light > 0.18 && light < 0.96 ? 1 : 0.08) + 0.0005;
          r += data[i] * w;
          g += data[i + 1] * w;
          b += data[i + 2] * w;
          total += w;
        }
        const hex = tune(rgbToHex(r / total, g / total, b / total));
        cache.set(src, hex);
        resolve(hex);
      } catch {
        resolve(tune(fallback));
      }
    };
    img.onerror = () => resolve(tune(fallback));
    img.src = src;
  });
};
