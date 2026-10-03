import * as THREE from "three";

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** Normalised progress of p inside the window [a, b]. */
export const seg = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => t * t * (3 - 2 * t);

/** Solve a CSS-style cubic-bezier so 3D motion uses the same curve as the DOM. */
function cubicBezierEase(x1: number, y1: number, x2: number, y2: number) {
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const cx = 3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t - x;
      const dx = 3 * x1 * (1 - t) * (1 - t) + 6 * (x2 - x1) * t * (1 - t) + 3 * (1 - x2) * t * t;
      if (Math.abs(dx) < 1e-6) break;
      t = clamp01(t - cx / dx);
    }
    return 3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t;
  };
}
/** cubic-bezier(0.22, 1, 0.36, 1), the site-wide curve. */
export const ease = cubicBezierEase(0.22, 1, 0.36, 1);

/** Seeded PRNG so every load draws the same scene. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export function loadFonts(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts) return Promise.resolve();
  const none = () => [] as FontFace[];
  return Promise.all([
    document.fonts.load("300 80px 'Cormorant Garamond'").catch(none),
    document.fonts.load("500 24px 'JetBrains Mono Variable'").catch(none),
    document.fonts.load("400 26px 'Inter Variable'").catch(none),
  ]).then(() => undefined);
}

/** Soft round sprite generated in code. */
export function makeSprite(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.25, "rgba(255,255,255,0.55)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type SpacedCtx = CanvasRenderingContext2D & { letterSpacing: string };
function spacing(g: CanvasRenderingContext2D, px: number) {
  (g as SpacedCtx).letterSpacing = `${px}px`;
}

export function wrapLines(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export function makeLabelTexture(text: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.font = "500 22px 'JetBrains Mono Variable', ui-monospace, monospace";
  spacing(g, 6);
  g.fillStyle = "#c8a96a";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 128 + 3, 32);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function makeTagTexture(text: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 64;
  const g = c.getContext("2d")!;
  g.strokeStyle = "rgba(200,169,106,0.9)";
  g.lineWidth = 2;
  g.beginPath();
  g.roundRect(6, 10, 116, 44, 22);
  g.stroke();
  g.font = "500 24px 'JetBrains Mono Variable', ui-monospace, monospace";
  g.fillStyle = "#c8a96a";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(text, 64, 33);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The final answer card, drawn once into a canvas (1040 x 600). */
export function makeAnswerTexture(label: string, answer: string, support: string, conf: string): THREE.CanvasTexture {
  const W = 1040;
  const H = 600;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#1a1a1f";
  g.fillRect(0, 0, W, H);
  g.textBaseline = "top";

  g.font = "500 22px 'JetBrains Mono Variable', ui-monospace, monospace";
  spacing(g, 5);
  g.fillStyle = "#c8a96a";
  g.fillText(label.toUpperCase(), 56, 52);
  g.textAlign = "right";
  g.fillText(conf, W - 56, 52);
  g.textAlign = "left";
  spacing(g, 0);

  g.font = "300 84px 'Cormorant Garamond', Georgia, serif";
  g.fillStyle = "#f1ede4";
  const lines = wrapLines(g, answer, W - 112);
  lines.forEach((l, i) => g.fillText(l, 56, 130 + i * 92));

  const y = 130 + lines.length * 92 + 22;
  g.fillStyle = "rgba(255,255,255,0.12)";
  g.fillRect(56, y, W - 112, 1);

  g.font = "400 26px 'Inter Variable', Inter, system-ui, sans-serif";
  g.fillStyle = "rgba(241,237,228,0.66)";
  wrapLines(g, support, W - 112).forEach((l, i) => g.fillText(l, 56, y + 26 + i * 36));

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
