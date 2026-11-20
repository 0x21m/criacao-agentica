// Cópia traduzida para pt-BR de src/components/ui/market-card.tsx (frase da variação, rótulos ARIA e
// decimal com vírgula). Gerada para o template resumo-do-dia; o original continua intacto.
"use client";

// Market Card by Louis Studios.
// 200 more hand-made React components at https://studios.lou15.com/?ref=21st-code

import * as React from "react";

/*
  Market Card, Louis Studios.

  A dark stat card lit from the left by a blue glow: a big headline figure, a short label, a
  caption, and a chart line that rises across the card. The part of the line up to the marker is
  white, the rest is a quiet grey; a ring rides the line with a small delta chip above it and a
  dashed guide below it. The glow lives behind the "past" part of the chart, so when the marker
  moves the light travels with it.

  The glow is a smooth field (a scalar map on a small bicubic grid) pushed through a colour ramp that
  is derived from one accent colour, rendered at half resolution on the CPU and drawn into the card;
  the line, under-fill, shadow, guide and marker are drawn on a DPR-sharp 2D canvas; all text is
  real DOM text. Digits roll like an odometer. Everything animates from one rAF loop that pauses
  offscreen and in hidden tabs.
*/

/** Props for {@link MarketCard}. */
export interface MarketCardProps {
  /**
   * The series drawn as a smooth curve, oldest first, evenly spaced across the right part of the
   * card. The first and last values are the lead-in and lead-out: the curve is scaled to the values
   * between them, so the ends may bleed off the card the way the line enters from the bottom edge.
   * The marker can rest on any point that sits inside the card.
   */
  data?: number[];
  /**
   * The headline figure as fixed text, for example "$12B". Digits in it count up on mount. Ignored
   * when `format` is given.
   */
  value?: string;
  /**
   * Turns the value under the marker into the headline figure, for example
   * `(v) => "$" + v.toFixed(1) + "B"`. When set, the figure follows the marker and its digits roll.
   */
  format?: (value: number) => string;
  /** The small label at the top left of the card. */
  label?: string;
  /**
   * The text after the bold change in the caption, for example "from the previous quarter.". The
   * bold part ("-2.4% decrease") is written for you from the change at the marker.
   */
  deltaLabel?: string;
  /** What the chip and caption compare the marked point against: the previous point or the first one. */
  deltaMode?: "previous" | "first";
  /** Controlled marker position, a point index into `data`. Pair it with `onIndexChange`. */
  index?: number;
  /** Where the marker rests when uncontrolled. Defaults to the point six tenths along the series. */
  defaultIndex?: number;
  /** Called with the point index when the marker is set by click, tap, drag or keyboard. Hovering only previews. */
  onIndexChange?: (index: number) => void;
  /** The glow colour. The light blue, deep blue and navy tints of the glow and rim are derived from it in code. */
  accent?: string;
  /** The card surface colour. */
  cardColor?: string;
  /** Colour of the figure, label, caption, menu dots and guide line. */
  textColor?: string;
  /** Colour of the chart line up to the marker. The rest of the line is a faint tint of `textColor`. */
  lineColor?: string;
  /** Colour of the marker ring and the chip when the change is negative. */
  downColor?: string;
  /** Colour of the marker ring and the chip when the change is zero or positive. */
  upColor?: string;
  /** The backdrop behind the card. Use "transparent" to place the card on your own background. */
  background?: string;
  /** Draws the faint grid that glows in two corners of the backdrop. */
  grid?: boolean;
  /** How much of the container's width the card spans, 0.3 to 1 (in wide containers the height limits it). The card keeps its proportions and stays centred. */
  fill?: number;
  /** Lets pointer, touch and the arrow keys move the marker. When false the card is a still display. */
  interactive?: boolean;
  /** Set false to animate the data out (the line retracts, the glow sinks, the digits roll away) and true to play the intro again. */
  revealed?: boolean;
  /** Shows the three dot menu at the top right. */
  menu?: boolean;
  /** Called when the menu dots are pressed. When set, the dots become a real button. */
  onMenu?: () => void;
  /** Font stack for all text on the card. */
  font?: string;
  /** Extra content layered over the card, positioned by you (the layer covers the card and is a positioning context). */
  children?: React.ReactNode;
  /** Class name for the root element. */
  className?: string;
  /** Inline style for the root element. */
  style?: React.CSSProperties;
}

/* ------------------------------------------------------------------------------------------ */
/* Geometry, all in card units (the card is 499 by 203 units and scales as one).               */
/* ------------------------------------------------------------------------------------------ */

const CW = 499;
const CH = 203;
const RADIUS = 27;
/** In wide containers the card is limited to this share of the height. */
const FILL_TALL = 0.86;
const DEFAULT_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif';
const DEFAULT_DATA = [10.57, 11.2, 11.84, 11.83, 11.49, 11.35, 11.75, 12.24, 12.3, 12, 11.76, 12.05, 12.67, 12.83, 12.47, 11.78];

/** Chart box: first and last point x, and the y of the highest and lowest inner value (fractions of the card). */
const X0F = 0.455411;
const X1F = 1.014863;
const YTOPF = 0.444408;
const YBOTF = 0.898283;
/** Catmull-Rom tangent scale traced from the reference curve. */
const TENSION = 1.2;
const LINE_W = 6.4;
const RING_R = 7;
const RING_W = 4;

/** Text layout (card units, baselines). SF metrics put the baseline 0.8555 em below the top of a 1 em line box. */
const BASE = 0.8555;
const PAD_X = 26.5;
const LABEL_SIZE = 18.4;
const LABEL_BASE = 33;
const FIG_SIZE = 92;
const FIG_BASE = 137.5;
/** Figure tracking (em) and the extra kerning (em) between a currency sign and the first digit. */
const FIG_TRACK = -0.0217;
const FIG_CURRENCY_KERN = 0.027;
/**
 * With the default (SF) stack the figure's 1 gets the footed form of the reference face: a bar on
 * the baseline centred under the stem (em, from the glyph origin), and the extra advance it needs.
 */
const ONE_FOOT = { left: 0.0435, width: 0.467, height: 0.087, extra: 0.114 };
const CAP_SIZE = 12.1;
const CAP_LH = 13.4;
const CAP_BASE = 170.5;
const CHIP_SIZE = 11;
const CHIP_H = 23;
const CHIP_GAP = 27.5;

/* The glow field: t over the card, sampled on an 18 by 8 bicubic grid spanning x 0..marker, y 0..H. */
const GX = 18;
const GY = 8;
const GLOW_T = [
  0.2, -0.052, -0.017, -0.038, 0.07, 0.249, 0.487, 0.647, 0.886, 1.019, 0.998, 1.008, 1.005, 1.004, 1.001, 1.002, 0.999, 0.999,
  0.012, 0.096, 0.12, 0.171, 0.243, 0.31, 0.573, 0.7, 0.85, 0.933, 0.948, 0.95, 0.957, 0.966, 0.979, 0.99, 0.996, 0.999,
  0.133, 0.126, 0.154, 0.171, 0.234, 0.261, 0.415, 0.619, 0.699, 0.772, 0.793, 0.81, 0.83, 0.865, 0.913, 0.949, 0.981, 0.997,
  0.072, 0.103, 0.128, 0.162, 0.212, 0.27, 0.357, 0.487, 0.576, 0.61, 0.619, 0.637, 0.672, 0.718, 0.79, 0.89, 0.947, 0.978,
  0.088, 0.089, 0.108, 0.136, 0.175, 0.218, 0.278, 0.35, 0.413, 0.461, 0.456, 0.495, 0.547, 0.612, 0.694, 0.815, 0.914, 0.98,
  0.098, 0.087, 0.097, 0.111, 0.133, 0.159, 0.188, 0.22, 0.254, 0.29, 0.325, 0.386, 0.498, 0.544, 0.668, 0.722, 0.787, 1.016,
  0.042, 0.076, 0.073, 0.075, 0.078, 0.086, 0.101, 0.149, 0.186, 0.23, 0.27, 0.439, 0.517, 0.567, 0.667, 0.726, 0.861, 1.032,
  0.12, -0.029, 0.017, -0.004, 0.004, 0, -0.008, -0.017, -0.013, 0.046, 0.121, 0.369, 0.442, 0.595, 0.659, 0.736, 0.809, 0.931,
];
/**
 * The glow ramp as offsets from the accent in HSL: [hue shift in degrees, saturation factor,
 * lightness factor]. Stop 0 is the light blue at the left edge, stop 4 is the accent itself, the
 * last stop is navy; past it the ramp fades into the card surface.
 */
const RAMP = [
  [-18.9, 1.328, 1.248], [-13.8, 1.357, 1.165], [-6.9, 1.315, 1.15], [-2.4, 1.27, 1.08], [0, 1.08, 0.98], [1.5, 0.93, 0.9],
  [3.5, 0.86, 0.8], [4, 0.751, 0.657], [5.3, 0.731, 0.478], [4.6, 0.624, 0.362], [8.6, 0.434, 0.279],
];
/** Rim light along the left edge: the lightest glow tint added on top, its strength and width in units. */
const RIM_GAIN = 0.3;
const RIM_W = 9;
/** Share of the top sheen that also lights the glow. */
const SHEEN_PAST = 0.45;
/** Surface sheen: top and bottom inner light (white alpha and falloff in units), right edge glow. */
const SHEEN_TOP = 0.1075;
const SHEEN_TOP_W = 31;
const SHEEN_BOT = 0.061;
const SHEEN_BOT_W = 12;
const SHEEN_RIGHT = 0.034;
const SHEEN_RIGHT_W = 16;
/** Under-fill: darkening below the line, rising from 0.735 of the marker x to the marker. */
const UNDER_FROM = 0.735;
const UNDER_MAX = 0.8;

/** Intro timeline (seconds). */
const T_END = 2.05;
const BREATH_PERIOD = 5.4;
const HALO_PERIOD = 2.7;

/* ------------------------------------------------------------------------------------------ */
/* Colour helpers.                                                                              */
/* ------------------------------------------------------------------------------------------ */

type RGB = [number, number, number];

function parseColor(input: string, fallback: RGB): RGB {
  const s = (input || "").trim().toLowerCase();
  let m = /^#([0-9a-f]{3,8})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  m = /^rgba?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map((v) => (v.endsWith("%") ? (parseFloat(v) * 2.55) : parseFloat(v)));
    if (p.length >= 3 && p.slice(0, 3).every((v) => isFinite(v))) return [p[0], p[1], p[2]];
  }
  m = /^hsla?\(([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map((v) => parseFloat(v));
    if (p.length >= 3 && p.slice(0, 3).every((v) => isFinite(v))) return hslToRgb(p[0], p[1] / 100, p[2] / 100);
  }
  return fallback;
}

function rgbToHsl([r, g, b]: RGB): [number, number, number] {
  const R = r / 255, G = g / 255, B = b / 255;
  const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
  const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn;
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  let h = mx === R ? (G - B) / d + (G < B ? 6 : 0) : mx === G ? (B - R) / d + 2 : (R - G) / d + 4;
  return [h * 60, s, l];
}

function hslToRgb(h: number, s: number, l: number): RGB {
  h = ((h % 360) + 360) % 360;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
}

const mixRgb = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${+a.toFixed(4)})`;
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const backOut = (t: number) => {
  const c1 = 1.5, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/* ------------------------------------------------------------------------------------------ */
/* Curve: Catmull-Rom with tangent scale, as cubic Bezier segments.                             */
/* ------------------------------------------------------------------------------------------ */

interface Curve {
  pts: { x: number; y: number }[];
  bez: { x1: number; y1: number; x2: number; y2: number }[];
  lens: number[]; // cumulative arc length at each point
  total: number;
  lo: number; // first index the marker may use
  hi: number; // last index the marker may use
}

function buildCurve(data: number[]): Curve {
  const n = data.length;
  const inner = n > 3 ? data.slice(1, -1) : data;
  let mn = Math.min(...inner), mx = Math.max(...inner);
  if (!(mx > mn)) { mn -= 1; mx += 1; }
  const x0 = X0F * CW, x1 = X1F * CW;
  const yt = YTOPF * CH, yb = YBOTF * CH;
  const pts = data.map((v, i) => ({
    x: n > 1 ? x0 + ((x1 - x0) * i) / (n - 1) : (x0 + x1) / 2,
    y: yb - ((v - mn) / (mx - mn)) * (yb - yt),
  }));
  const tan = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    const k = i === 0 || i === n - 1 ? TENSION : TENSION / 2;
    return { x: (b.x - a.x) * k, y: (b.y - a.y) * k };
  });
  const bez = [] as Curve["bez"];
  const lens = [0];
  for (let i = 0; i < n - 1; i++) {
    const p = pts[i], q = pts[i + 1];
    const b = { x1: p.x + tan[i].x / 3, y1: p.y + tan[i].y / 3, x2: q.x - tan[i + 1].x / 3, y2: q.y - tan[i + 1].y / 3 };
    bez.push(b);
    let L = 0, px = p.x, py = p.y;
    for (let s = 1; s <= 24; s++) {
      const [x, y] = bezAt(p.x, p.y, b, q.x, q.y, s / 24);
      L += Math.hypot(x - px, y - py);
      px = x; py = y;
    }
    lens.push(lens[i] + L);
  }
  const margin = RING_R + RING_W / 2 + 2;
  let lo = 0, hi = n - 1;
  const inside = (p: { x: number; y: number }) => p.x >= margin && p.x <= CW - margin && p.y >= margin && p.y <= CH - margin;
  while (lo < n - 1 && !inside(pts[lo])) lo++;
  while (hi > lo && !inside(pts[hi])) hi--;
  return { pts, bez, lens, total: lens[n - 1] || 0, lo, hi };
}

function bezAt(px: number, py: number, b: { x1: number; y1: number; x2: number; y2: number }, qx: number, qy: number, t: number): [number, number] {
  const u = 1 - t;
  const a = u * u * u, c = 3 * u * u * t, d = 3 * u * t * t, e = t * t * t;
  return [a * px + c * b.x1 + d * b.x2 + e * qx, a * py + c * b.y1 + d * b.y2 + e * qy];
}

/** Point on the curve at a fractional point index. */
function curveAt(c: Curve, f: number): [number, number] {
  const n = c.pts.length;
  if (n === 1) return [c.pts[0].x, c.pts[0].y];
  const i = clamp(Math.floor(f), 0, n - 2);
  const t = clamp(f - i, 0, 1);
  const p = c.pts[i], q = c.pts[i + 1];
  return bezAt(p.x, p.y, c.bez[i], q.x, q.y, t);
}

/** Arc length at a fractional index (approximate within a segment). */
function arcAt(c: Curve, f: number): number {
  const n = c.pts.length;
  if (n < 2) return 0;
  const i = clamp(Math.floor(f), 0, n - 2);
  const t = clamp(f - i, 0, 1);
  return c.lens[i] + (c.lens[i + 1] - c.lens[i]) * t;
}

function tracePath(ctx: CanvasRenderingContext2D, c: Curve) {
  const p = c.pts;
  ctx.beginPath();
  ctx.moveTo(p[0].x, p[0].y);
  for (let i = 0; i < p.length - 1; i++) ctx.bezierCurveTo(c.bez[i].x1, c.bez[i].y1, c.bez[i].x2, c.bez[i].y2, p[i + 1].x, p[i + 1].y);
}

/* ------------------------------------------------------------------------------------------ */
/* Glow field.                                                                                  */
/* ------------------------------------------------------------------------------------------ */

function crWeights(t: number, out: Float32Array, o: number) {
  const t2 = t * t, t3 = t2 * t;
  out[o] = -0.5 * t3 + t2 - 0.5 * t;
  out[o + 1] = 1.5 * t3 - 2.5 * t2 + 1;
  out[o + 2] = -1.5 * t3 + 2 * t2 + 0.5 * t;
  out[o + 3] = 0.5 * t3 - 0.5 * t2;
}

class Field {
  w = 0;
  h = 0;
  img: ImageData | null = null;
  tmap = new Float32Array(0);
  mxCached = -1;
  lut = new Float32Array(0); // 512 * 3, t in 0..0.9
  surf = new Float32Array(0); // h * 3 surface colour per row (before right sheen)
  rimAdd: RGB = [0, 0, 0]; // ls:keep
  sheen = new Float32Array(0); // top sheen share over the glow, per row
  colRight = new Float32Array(0);
  colRim = new Float32Array(0);
  key = "";

  resize(w: number, h: number) {
    if (w === this.w && h === this.h) return;
    this.w = w;
    this.h = h;
    this.img = new ImageData(w, h);
    this.tmap = new Float32Array(w * h);
    this.mxCached = -1;
    this.key = "";
  }

  palette(accent: RGB, card: RGB) {
    const key = accent.join(",") + "|" + card.join(",") + "|" + this.h;
    if (key === this.key) return;
    this.key = key;
    const [h, s, l] = rgbToHsl(accent);
    const stops = RAMP.map(([dh, ks, kl]) => hslToRgb(h + dh, s * ks, l * kl));
    const N = 512;
    this.lut = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const f = (i / (N - 1)) * (stops.length - 1);
      const j = Math.min(stops.length - 2, Math.floor(f));
      const c = mixRgb(stops[j], stops[j + 1], f - j);
      this.lut[i * 3] = c[0];
      this.lut[i * 3 + 1] = c[1];
      this.lut[i * 3 + 2] = c[2];
    }
    this.surf = new Float32Array(this.h * 3);
    for (let y = 0; y < this.h; y++) {
      const cy = ((y + 0.5) / this.h) * CH;
      const a = SHEEN_TOP * Math.exp(-cy / SHEEN_TOP_W) + SHEEN_BOT * Math.exp(-(CH - cy) / SHEEN_BOT_W);
      for (let k = 0; k < 3; k++) this.surf[y * 3 + k] = card[k] + (255 - card[k]) * a;
    }
    const rim = stops[0];
    this.rimAdd = [rim[0] * RIM_GAIN, rim[1] * RIM_GAIN, rim[2] * RIM_GAIN];
    this.sheen = new Float32Array(this.h);
    for (let y = 0; y < this.h; y++) {
      const cy = ((y + 0.5) / this.h) * CH;
      this.sheen[y] = SHEEN_PAST * SHEEN_TOP * Math.exp(-cy / SHEEN_TOP_W);
    }
    this.mxCached = -1;
  }

  /** Recompute the t map for a marker x (card units). */
  layout(mx: number) {
    if (Math.abs(mx - this.mxCached) < 0.02) return;
    this.mxCached = mx;
    const { w, h, tmap } = this;
    const wx = new Float32Array(w * 4);
    const ix = new Int32Array(w);
    for (let x = 0; x < w; x++) {
      const cx = ((x + 0.5) / w) * CW;
      const gx = clamp(cx / Math.max(mx, 1), 0, 1) * (GX - 1);
      const i = Math.min(GX - 2, Math.floor(gx));
      ix[x] = i;
      crWeights(gx - i, wx, x * 4);
    }
    const wy = new Float32Array(4);
    for (let y = 0; y < h; y++) {
      const gy = (((y + 0.5) / h) * CH / CH) * (GY - 1);
      const j = Math.min(GY - 2, Math.floor(gy));
      crWeights(gy - j, wy, 0);
      const rows = [Math.max(0, j - 1), j, j + 1, Math.min(GY - 1, j + 2)];
      for (let x = 0; x < w; x++) {
        const i = ix[x];
        const c0 = Math.max(0, i - 1), c1 = i, c2 = i + 1, c3 = Math.min(GX - 1, i + 2);
        const o = x * 4;
        let t = 0;
        for (let b = 0; b < 4; b++) {
          const r = rows[b] * GX;
          t += wy[b] * (wx[o] * GLOW_T[r + c0] + wx[o + 1] * GLOW_T[r + c1] + wx[o + 2] * GLOW_T[r + c2] + wx[o + 3] * GLOW_T[r + c3]);
        }
        tmap[y * w + x] = t;
      }
    }
  }

  /** Colour the field. glow 0..1 is the intro level, breath scales t slightly. */
  paint(mx: number, glow: number, breath: number, seedFrame: number) {
    const { w, h, tmap, lut, surf, img } = this;
    if (!img) return;
    const d = img.data;
    const rim = this.rimAdd;
    const lift = (1 - glow) * 1.15;
    const tb = 1 + breath;
    let seed = (seedFrame * 2654435761) >>> 0;
    if (this.colRight.length !== w) {
      this.colRight = new Float32Array(w);
      this.colRim = new Float32Array(w);
      for (let x = 0; x < w; x++) {
        const cx = ((x + 0.5) / w) * CW;
        this.colRight[x] = SHEEN_RIGHT * Math.exp(-(CW - cx) / SHEEN_RIGHT_W);
        this.colRim[x] = Math.exp(-cx / RIM_W);
      }
    }
    const colRight = this.colRight, colRim = this.colRim;
    for (let y = 0; y < h; y++) {
      const sr = surf[y * 3], sg = surf[y * 3 + 1], sb = surf[y * 3 + 2];
      const sh = this.sheen[y];
      for (let x = 0; x < w; x++) {
        const right = colRight[x];
        const s0 = sr + (255 - sr) * right, s1 = sg + (255 - sg) * right, s2 = sb + (255 - sb) * right;
        // coverage of the past region in this field pixel
        const px0 = (x / w) * CW, px1 = ((x + 1) / w) * CW;
        const cov = clamp01((mx - px0) / (px1 - px0));
        let r = s0, g = s1, b = s2;
        if (cov > 0) {
          let t = tmap[y * w + x] * tb + lift;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          let pr: number, pg: number, pb: number;
          if (t < 0.9) {
            const k = Math.round((t / 0.9) * 511) * 3;
            pr = lut[k]; pg = lut[k + 1]; pb = lut[k + 2];
            pr += (255 - pr) * sh; pg += (255 - pg) * sh; pb += (255 - pb) * sh;
          } else {
            const f = (t - 0.9) / 0.1;
            const k = 511 * 3;
            const sf = sh * (1 - f);
            pr = lut[k] + (255 - lut[k]) * sf;
            pg = lut[k + 1] + (255 - lut[k + 1]) * sf;
            pb = lut[k + 2] + (255 - lut[k + 2]) * sf;
            pr += (s0 - pr) * f; pg += (s1 - pg) * f; pb += (s2 - pb) * f;
          }
          const e = colRim[x] * glow;
          pr += rim[0] * e; pg += rim[1] * e; pb += rim[2] * e;
          r = s0 + (pr - s0) * cov;
          g = s1 + (pg - s1) * cov;
          b = s2 + (pb - s2) * cov;
        }
        seed = (seed * 1664525 + 1013904223) >>> 0;
        const n = (seed / 4294967296 - 0.5) * 1.2;
        const o = (y * w + x) * 4;
        d[o] = r + n;
        d[o + 1] = g + n;
        d[o + 2] = b + n;
        d[o + 3] = 255;
      }
    }
  }
}

/* ------------------------------------------------------------------------------------------ */
/* Odometer text: digits roll in columns, everything else is static.                            */
/*                                                                                              */
/* Every frame keeps to three rules so the figure only ever shows whole, clean glyphs:          */
/*  - a rolling column is as wide as the blend of the two digits it shows, and both are centred */
/*    in it, so a wide digit never spills over a narrow neighbour;                              */
/*  - a digit fades with its distance from the rest line, so nothing lingers as a sliver at the */
/*    top or bottom of the roll window (the 1's foot included);                                 */
/*  - a character that enters or leaves is only visible while its slot is (almost) full width:  */
/*    an entering slot opens before its glyph fades in, a leaving glyph fades out before its    */
/*    slot closes, and a change of direction mid-way continues from what is on screen.          */
/* ------------------------------------------------------------------------------------------ */

interface Col {
  el: HTMLSpanElement;
  stack: HTMLSpanElement | null;
  cells: HTMLSpanElement[];
  ch: string;
  digit: number; // target digit, -1 for static
  p: number; // current position in digit units
  v: number;
  w: number; // current width px
  mode: number; // 0 settled, 1 rolling in, -1 rolling out
  t: number; // progress of the roll in or out
  base: number; // target slot width px
  slotW: number; // eased slot width px (static characters)
  next: string | null; // the kept character after this one (kerning partner)
  kNext: string | null | undefined; // the partner the width offset below was taken against
  kOff: number; // decaying width offset that keeps a digit column continuous when its partner changes
  lo: number; // lowest visible cell of the stack, -1 before the first frame
  fade: number; // current enter/leave opacity
  grow: number; // current enter/leave width share
  lift: number; // current enter/leave lift (em)
  a0: number; // fade, grow and lift captured when a leave starts, so it continues from the screen
  g0: number;
  l0: number;
  key: string; // place-value key that pairs this column with a character of the next text
}

const ROLL_IO = 0.42; // seconds for a character to enter or leave
/** A digit's opacity from its distance (in rows) to the rest line of its column. */
const rowAlpha = (d: number) => 1 - smooth(0.4, 0.64, Math.abs(d));

/**
 * A key per character that names its place: digits by their power of ten within their number
 * (with one "." the number's decimal point, other "." and "," as grouping), separators by the
 * digits to their right, and every other character by itself and the number it follows.
 */
function placeKeys(chars: string[]): string[] {
  const keys: string[] = new Array(chars.length);
  const isD = (c: string | undefined) => c !== undefined && c >= "0" && c <= "9";
  let run = 0;
  for (let i = 0; i < chars.length;) {
    if (!isD(chars[i])) { keys[i] = run + ":" + chars[i]; i++; continue; }
    let j = i;
    while (j < chars.length && (isD(chars[j]) || ((chars[j] === "." || chars[j] === ",") && isD(chars[j + 1])))) j++;
    const dots: number[] = [];
    for (let k = i; k < j; k++) if (chars[k] === ".") dots.push(k);
    const point = dots.length === 1 ? dots[0] : j;
    let place = 0;
    for (let k = Math.min(point, j) - 1; k >= i; k--) {
      if (isD(chars[k])) keys[k] = run + "i" + place++;
      else keys[k] = run + "g" + place;
    }
    let frac = 0;
    for (let k = point; k < j; k++) keys[k] = k === point ? run + "." : isD(chars[k]) ? run + "f" + ++frac : run + "h" + frac;
    run++;
    i = j;
  }
  return keys;
}

class Roller {
  root: HTMLElement;
  cols: Col[] = [];
  text = "";
  font = "";
  size = 0;
  track = 0;
  widths: Record<string, number> = {};
  measure: CanvasRenderingContext2D | null = null;

  /** Extra kerning (em) between a currency sign and the digit after it. */
  currencyKern: number;
  /** Draw the footed 1 (only meaningful for the default font). */
  footed = false;
  /** Measured pair kerning, keyed by the two characters. */
  kerns: Record<string, number> = {};

  constructor(root: HTMLElement, currencyKern = 0) {
    this.root = root;
    this.currencyKern = currencyKern;
  }

  private adv(text: string) {
    if (this.widths[text] === undefined) {
      if (!this.measure) this.measure = document.createElement("canvas").getContext("2d");
      const m = this.measure;
      if (m) {
        m.font = this.font;
        try { (m as CanvasRenderingContext2D & { fontKerning?: string }).fontKerning = "normal"; } catch { /* older engines */ }
        this.widths[text] = m.measureText(text).width;
      } else this.widths[text] = this.size * 0.6 * text.length;
    }
    return this.widths[text];
  }

  /**
   * The slot a character occupies: its natural advance, the tracking, the font's own kerning
   * against the next character, and a tighter pair for a currency sign before a digit.
   */
  private slot(ch: string, next: string | null) {
    let w = this.adv(ch) + this.track + (this.footed && ch === "1" ? ONE_FOOT.extra * this.size : 0);
    if (next !== null) {
      const key = ch + next;
      if (this.kerns[key] === undefined) this.kerns[key] = this.adv(key) - this.adv(ch) - this.adv(next);
      w += this.kerns[key];
      if (/[$£€¥₹#]/.test(ch) && next >= "0" && next <= "9") w += this.currencyKern * this.size;
    }
    return w;
  }

  /** Width of a digit column showing cell `lo` and the one below it `fr` of the way through. */
  private rollW(lo: number, fr: number, next: string | null) {
    const a = this.slot(String(lo % 10), next);
    return fr > 0 ? a + (this.slot(String((lo + 1) % 10), next) - a) * fr : a;
  }

  setFoot(on: boolean) {
    if (on === this.footed) return;
    this.footed = on;
    this.root.querySelectorAll<HTMLElement>("[data-foot]").forEach((f) => { f.style.display = on ? "block" : "none"; });
    this.widths = {};
    this.layout(true);
  }

  setFont(font: string, size: number, track: number) {
    if (font === this.font && size === this.size && track === this.track) return;
    this.font = font;
    this.size = size;
    this.track = track;
    this.widths = {};
    this.kerns = {};
    this.layout(true);
  }

  /** Target slot and kerning partner for every column, from its own character and the next one that stays. */
  private layout(snap: boolean) {
    const kept = this.cols.filter((c) => c.mode !== -1);
    kept.forEach((c, i) => { c.next = i + 1 < kept.length ? kept[i + 1].ch : null; });
    for (const c of this.cols) {
      if (c.mode === -1) c.next = null;
      c.base = this.slot(c.ch, c.next);
      if (snap) {
        c.slotW = c.base;
        c.kNext = c.next;
        c.kOff = 0;
        const w = c.slotW * (c.mode === 1 ? 0 : 1);
        c.w = w;
        c.el.style.width = w + "px";
      }
    }
  }

  private makeCol(ch: string, p: number): Col {
    const el = document.createElement("span");
    el.style.display = "inline-block";
    el.style.position = "relative";
    el.style.height = "1em";
    el.style.lineHeight = "1em";
    el.style.verticalAlign = "top";
    el.style.whiteSpace = "pre";
    el.setAttribute("aria-hidden", "true");
    const isDigit = ch >= "0" && ch <= "9";
    let stack: HTMLSpanElement | null = null;
    const cells: HTMLSpanElement[] = [];
    if (isDigit) {
      // The window fades the roll out above and below the line. It reaches a fifth of an em past the
      // line box on both sides, so a leaving digit has faded as a whole (rowAlpha) before the
      // window could crop it down to a sliver such as the 1's foot. It is wider than the slot only
      // so a centred glyph's side bearings are never cut while the slot eases between two widths.
      const win = document.createElement("span");
      win.style.position = "absolute";
      win.style.left = "-0.3em";
      win.style.right = "-0.3em";
      win.style.top = "-0.2em";
      win.style.height = "1.35em";
      win.style.lineHeight = "1em";
      win.style.overflow = "hidden";
      win.style.display = "block";
      const mask = "linear-gradient(180deg, transparent 0%, #000 24%, #000 81%, transparent 98%)"; // ls:keep
      win.style.maskImage = mask;
      win.style.setProperty("-webkit-mask-image", mask);
      win.style.maskRepeat = "no-repeat";
      win.style.setProperty("-webkit-mask-repeat", "no-repeat");
      el.appendChild(win);
      stack = document.createElement("span");
      stack.style.position = "absolute";
      stack.style.left = "0.3em";
      stack.style.top = "0.2em";
      stack.style.display = "block";
      stack.style.lineHeight = "1em";
      stack.style.willChange = "transform";
      for (let k = 0; k <= 10; k++) {
        const d = document.createElement("span");
        d.style.display = "block";
        d.style.height = "1em";
        d.style.lineHeight = "1em";
        d.style.opacity = "0";
        if (k % 10 === 1) {
          // The foot rides on the glyph's own baseline: a zero-size inline box sits exactly on
          // the line's baseline in any font, size or zoom, and the bar hangs up from it.
          const anchor = document.createElement("span");
          anchor.style.display = "inline-block";
          anchor.style.position = "relative";
          anchor.style.width = "0";
          anchor.style.height = "0";
          anchor.style.verticalAlign = "baseline";
          const foot = document.createElement("span");
          foot.dataset.foot = "1";
          foot.style.position = "absolute";
          foot.style.left = `${ONE_FOOT.left}em`;
          foot.style.bottom = "0";
          foot.style.width = `${ONE_FOOT.width}em`;
          foot.style.height = `${ONE_FOOT.height}em`;
          foot.style.background = "currentColor";
          foot.style.display = this.footed ? "block" : "none";
          anchor.appendChild(foot);
          d.appendChild(anchor);
        }
        d.appendChild(document.createTextNode(String(k % 10)));
        cells.push(d);
        stack.appendChild(d);
      }
      win.appendChild(stack);
    } else {
      el.textContent = ch;
    }
    return {
      el, stack, cells, ch, digit: isDigit ? +ch : -1, p, v: 0, w: 0, mode: 0, t: 1, base: 0, slotW: 0,
      next: null, kNext: undefined, kOff: 0, lo: -1, fade: 1, grow: 1, lift: 0, a0: 1, g0: 1, l0: 0, key: ch,
    };
  }

  set(text: string, instant: boolean) {
    if (text === this.text) return;
    this.text = text;
    const chars = Array.from(text);
    const keys = placeKeys(chars);
    if (instant || !this.cols.some((c) => c.mode !== -1)) {
      this.root.textContent = "";
      this.cols = chars.map((ch, i) => {
        const c = this.makeCol(ch, ch >= "0" && ch <= "9" ? +ch : -1);
        c.key = keys[i];
        this.root.appendChild(c.el);
        return c;
      });
      this.layout(true);
      return;
    }
    // Pair the old columns with the new characters by place value (ones with ones, tenths with
    // tenths, the sign with the sign), so "$9.8B" to "$10.4B" rolls 9 to 0 and slides a 1 in,
    // and "$12B" to "$12.3B" opens ".3" after the 2. Paired digits roll; the rest leave or enter.
    const live = this.cols.filter((c) => c.mode !== -1);
    const n = live.length, m = chars.length;
    const L: number[][] = [];
    for (let i = 0; i <= n; i++) L.push(new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i--) for (let k = m - 1; k >= 0; k--) {
      L[i][k] = live[i].key === keys[k] ? L[i + 1][k + 1] + 1 : Math.max(L[i + 1][k], L[i][k + 1]);
    }
    const pairOf = new Map<number, Col>();
    const kept = new Set<Col>();
    for (let i = 0, k = 0; i < n && k < m;) {
      if (live[i].key === keys[k]) { pairOf.set(k, live[i]); kept.add(live[i]); i++; k++; }
      else if (L[i + 1][k] >= L[i][k + 1]) i++;
      else k++;
    }
    for (const c of live) {
      if (kept.has(c)) continue;
      // a leave starts from what is on screen, so a character caught mid-entry never pops
      c.a0 = c.fade; c.g0 = c.grow; c.l0 = c.lift; c.mode = -1; c.t = 0;
    }
    const entering: Col[] = [];
    for (let k = m - 1, anchor: HTMLElement | null = null; k >= 0; k--) {
      const ch = chars[k];
      const old = pairOf.get(k);
      if (old) {
        old.ch = ch;
        if (old.digit >= 0) old.digit = +ch;
        anchor = old.el;
        continue;
      }
      const c = this.makeCol(ch, ch >= "0" && ch <= "9" ? +ch : -1);
      c.key = keys[k];
      c.mode = 1;
      c.t = 0;
      c.fade = 0;
      c.grow = 0;
      c.el.style.width = "0px";
      c.el.style.opacity = "0";
      this.root.insertBefore(c.el, anchor);
      anchor = c.el;
      entering.push(c);
    }
    // columns in screen order, so every kept column kerns against the one really beside it
    const byEl = new Map<Element, Col>();
    for (const c of [...this.cols, ...entering]) byEl.set(c.el, c);
    this.cols = Array.from(this.root.children).map((e) => byEl.get(e)).filter((c): c is Col => !!c);
    this.layout(false);
    for (const c of entering) { c.slotW = c.base; c.kNext = c.next; }
  }

  /**
   * Advance the springs. intro 0..1 drives the count-up: columns start whole laps below their digit
   * and roll up into place, staggered from the left.
   */
  step(dt: number, intro: number, instant: boolean) {
    const kept = this.cols.filter((c) => c.mode !== -1);
    const digits = kept.filter((c) => c.digit >= 0).length;
    let di = 0;
    const done: Col[] = [];
    const settle = instant ? 1 : 1 - Math.exp(-dt * 9);
    for (const c of this.cols) {
      // roll in or out of the text
      if (c.mode !== 0) {
        c.t = instant ? 1 : Math.min(1, c.t + dt / ROLL_IO);
        if (c.mode === 1) {
          // the slot opens first; the glyph rises in once there is room for it
          const u = easeOut(clamp01((c.t - 0.4) / 0.6));
          c.grow = easeInOut(clamp01(c.t / 0.55));
          c.fade = u;
          c.lift = 0.3 * (1 - u);
          if (c.t >= 1) { c.mode = 0; c.grow = 1; c.fade = 1; c.lift = 0; }
        } else {
          // the glyph rises out first; the slot closes once it is gone
          const u = easeOut(clamp01(c.t / 0.45));
          c.fade = c.a0 * (1 - u);
          c.grow = c.g0 * (1 - easeInOut(clamp01((c.t - 0.3) / 0.7)));
          c.lift = c.l0 + (-0.3 - c.l0) * u;
          if (c.t >= 1) done.push(c);
        }
        c.el.style.transform = `translate3d(0, ${c.lift.toFixed(4)}em, 0)`;
      } else if (c.el.style.transform) c.el.style.transform = "";
      let alpha: number;
      let full: number;
      if (c.digit < 0) {
        // ease the slot toward its target (only moves when the character or its partner changes)
        c.slotW = c.slotW + (c.base - c.slotW) * settle;
        if (Math.abs(c.slotW - c.base) < 0.01) c.slotW = c.base;
        full = c.slotW;
        alpha = clamp01(intro * 1.6 - 0.1);
        const w = full * c.grow;
        const indent = (w - full) / 2;
        const ind = Math.abs(indent) < 0.01 ? "" : indent.toFixed(2) + "px";
        if (c.el.style.textIndent !== ind) c.el.style.textIndent = ind;
      } else {
        if (c.mode !== -1) {
          const goal = c.digit + Math.round((c.p - c.digit) / 10) * 10;
          if (instant) { c.p = goal; c.v = 0; }
          else {
            const k = 160, damp = 2 * Math.sqrt(k);
            // substeps keep the critically damped spring from ringing on a long frame
            const n = Math.max(1, Math.ceil(dt / 0.0175));
            const h = dt / n;
            for (let q = 0; q < n; q++) {
              c.v += (-(c.p - goal) * k - c.v * damp) * h;
              c.p += c.v * h;
            }
            if (Math.abs(c.p - goal) < 1e-4 && Math.abs(c.v) < 1e-3) { c.p = goal; c.v = 0; }
          }
        }
        // count-up offset
        const stag = digits > 1 ? (Math.min(di, digits - 1) / (digits - 1)) * 0.22 : 0;
        const local = clamp01((intro - stag) / (1 - 0.22));
        const shown = c.p - (1 - easeOutQuart(local)) * 12;
        let pm = ((shown % 10) + 10) % 10;
        if (pm > 9.99995) pm = 0;
        let lo = Math.floor(pm);
        let fr = pm - lo;
        if (fr > 0.99995) { lo = (lo + 1) % 10; fr = 0; pm = lo; }
        // the column is as wide as the two digits it shows, blended by the roll
        const raw = this.rollW(lo, fr, c.next);
        if (c.next !== c.kNext) {
          if (c.kNext !== undefined && !instant) c.kOff += this.rollW(lo, fr, c.kNext) - raw;
          c.kNext = c.next;
        }
        c.kOff = instant ? 0 : c.kOff * (1 - settle);
        if (Math.abs(c.kOff) < 0.01) c.kOff = 0;
        full = raw + c.kOff;
        const colW = full * c.grow;
        if (c.stack) {
          c.stack.style.transform = `translate3d(0, ${(-pm).toFixed(4)}em, 0)`;
          if (c.lo !== lo) {
            if (c.lo >= 0) { c.cells[c.lo].style.opacity = "0"; c.cells[c.lo + 1].style.opacity = "0"; }
            c.lo = lo;
          }
          for (let k = lo; k <= lo + 1; k++) {
            const d = k - pm;
            const cell = c.cells[k];
            const x = (colW - this.slot(String(k % 10), c.next)) / 2;
            const a = rowAlpha(d);
            cell.style.opacity = a > 0.002 ? a.toFixed(3) : "0";
            cell.style.transform = Math.abs(x) < 0.01 ? "" : `translate3d(${x.toFixed(2)}px, 0, 0)`;
          }
        }
        alpha = clamp01(local * 2.2);
        if (c.mode !== -1) di++;
      }
      const w = full * c.grow;
      if (Math.abs(w - c.w) > 0.01) { c.w = w; c.el.style.width = w + "px"; }
      c.el.style.opacity = String(alpha * c.fade);
    }
    if (done.length) {
      for (const c of done) c.el.remove();
      this.cols = this.cols.filter((c) => !done.includes(c));
    }
  }
}

/* ------------------------------------------------------------------------------------------ */
/* Helpers.                                                                                     */
/* ------------------------------------------------------------------------------------------ */

function usePrefersReducedMotion() {
  const [r, setR] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setR(q.matches);
    on();
    q.addEventListener?.("change", on);
    return () => q.removeEventListener?.("change", on);
  }, []);
  return r;
}

function deltaOf(data: number[], i: number, mode: "previous" | "first") {
  const ref = mode === "first" ? data[0] : data[Math.max(0, i - 1)];
  const v = data[i];
  if (!isFinite(ref) || ref === 0 || !isFinite(v)) return 0;
  return ((v - ref) / Math.abs(ref)) * 100;
}

function fmtDelta(d: number) {
  const r = Math.round(d * 10) / 10;
  if (r === 0) return "0,0%";
  return (r < 0 ? "−" : "+") + Math.abs(r).toFixed(1).replace(".", ",") + "%";
}

let grainUrl: string | null = null;
function grain(): string {
  if (grainUrl !== null) return grainUrl;
  grainUrl = "";
  try {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d");
    if (g) {
      const im = g.createImageData(160, 160);
      let s = 1234567;
      for (let i = 0; i < im.data.length; i += 4) {
        s = (s * 1664525 + 1013904223) >>> 0;
        const v = s >>> 24;
        im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
        im.data[i + 3] = 255;
      }
      g.putImageData(im, 0, 0);
      grainUrl = c.toDataURL();
    }
  } catch {
    grainUrl = "";
  }
  return grainUrl;
}

/* ------------------------------------------------------------------------------------------ */
/* Component.                                                                                   */
/* ------------------------------------------------------------------------------------------ */

export function MarketCard({
  data = DEFAULT_DATA,
  value = "$12B",
  format,
  label = "Market Size",
  deltaLabel,
  deltaMode = "previous",
  index,
  defaultIndex,
  onIndexChange,
  accent = "#4358e2",
  cardColor = "#111111",
  textColor = "#ffffff",
  lineColor = "#ffffff",
  downColor = "#e65a3a", // ls:keep
  upColor = "#3ecf8e", // ls:keep
  background = "#0c0c0c",
  grid = true,
  fill = 0.9,
  interactive = true,
  revealed = true,
  menu = true,
  onMenu,
  font = DEFAULT_FONT,
  children,
  className,
  style,
}: MarketCardProps) {
  const reduced = usePrefersReducedMotion();
  const series = React.useMemo(() => (Array.isArray(data) && data.length >= 2 ? data.map((v) => (isFinite(v) ? v : 0)) : DEFAULT_DATA), [data]);
  const curve = React.useMemo(() => buildCurve(series), [series]);
  const restDefault = defaultIndex ?? Math.round((series.length - 1) * 0.6);
  const [selfIndex, setSelfIndex] = React.useState(() => clamp(Math.round(restDefault), curve.lo, curve.hi));
  const selected = clamp(Math.round(index ?? selfIndex), curve.lo, curve.hi);
  const [shown, setShown] = React.useState(selected);
  const [size, setSize] = React.useState({ w: 0, h: 0 });
  const [focusVisible, setFocusVisible] = React.useState(false);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const fieldRef = React.useRef<HTMLCanvasElement>(null);
  const mainRef = React.useRef<HTMLCanvasElement>(null);
  const figRef = React.useRef<HTMLDivElement>(null);
  const chipRef = React.useRef<HTMLDivElement>(null);
  const chipTextRef = React.useRef<HTMLSpanElement>(null);
  const labelRef = React.useRef<HTMLDivElement>(null);
  const capRef = React.useRef<HTMLDivElement>(null);
  const kickRef = React.useRef<() => void>(() => {});

  const accentRgb = parseColor(accent, [67, 88, 226]);
  const cardRgb = parseColor(cardColor, [17, 17, 17]);
  const textRgb = parseColor(textColor, [255, 255, 255]);
  const lineRgb = parseColor(lineColor, [255, 255, 255]);
  const downRgb = parseColor(downColor, [230, 90, 58]); // ls:keep
  const upRgb = parseColor(upColor, [62, 207, 142]); // ls:keep

  const delta = deltaOf(series, shown, deltaMode);
  const deltaText = fmtDelta(delta);
  const negative = Math.round(delta * 10) < 0;
  const deltaRgb = negative ? downRgb : upRgb;
  const figure = format ? format(series[shown]) : value;
  const tail = deltaLabel ?? (deltaMode === "first" ? "desde o início." : "em relação ao ponto anterior.");
  const word = Math.round(delta * 10) === 0 ? "sem variação" : negative ? "de queda" : "de alta";

  /* Live values for the loop. */
  const live = React.useRef({
    curve, series, selected, hover: null as number | null, reduced, revealed, interactive,
    accentRgb, cardRgb, textRgb, lineRgb, deltaRgb, figure, deltaText, focusVisible, size, font, menu,
  });
  live.current = {
    ...live.current, curve, series, selected, reduced, revealed, interactive,
    accentRgb, cardRgb, textRgb, lineRgb, deltaRgb, figure, deltaText, focusVisible, size, font, menu,
  };

  /* Size. */
  React.useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      setSize((s) => (Math.abs(s.w - r.width) < 0.5 && Math.abs(s.h - r.height) < 0.5 ? s : { w: r.width, h: r.height }));
    };
    read();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", read);
      return () => window.removeEventListener("resize", read);
    }
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const f = clamp(fill, 0.3, 1);
  const availW = Math.max(0, size.w - 24);
  const cw = Math.max(0, Math.min(size.w * f, availW, size.h * Math.min(f, FILL_TALL) * (CW / CH)));
  const ch = (cw * CH) / CW;
  const s = cw / CW;
  const left = (size.w - cw) / 2;
  const top = (size.h - ch) / 2;
  const labelPx = Math.max(11, LABEL_SIZE * s);
  const figPx = FIG_SIZE * s;
  const capPx = Math.max(11, CAP_SIZE * s);
  const capLh = capPx * (CAP_LH / CAP_SIZE);
  const chipPx = Math.max(11, CHIP_SIZE * s);

  /* Keep the shown index in step with the marker (set from the loop). */
  const shownRef = React.useRef(shown);
  shownRef.current = shown;

  /* The loop. */
  React.useEffect(() => {
    const root = rootRef.current, fieldCv = fieldRef.current, mainCv = mainRef.current, figEl = figRef.current, chipEl = chipRef.current, chipTxt = chipTextRef.current;
    if (!root || !fieldCv || !mainCv || !figEl || !chipEl || !chipTxt) return;
    const fctx = fieldCv.getContext("2d");
    const ctx = mainCv.getContext("2d");
    if (!fctx || !ctx) return;
    const field = new Field();
    const fig = new Roller(figEl, FIG_CURRENCY_KERN);
    const chipRoll = new Roller(chipTxt);
    const st = {
      idx: live.current.selected as number,
      vel: 0,
      rt: live.current.reduced ? T_END : 0,
      last: -1,
      start: performance.now(),
      raf: 0,
      visible: true,
      frame: 0,
      cw: 0,
      lastShown: shownRef.current,
    };

    const frame = () => {
      st.raf = 0;
      const L = live.current;
      const now = performance.now();
      const dt = st.last < 0 ? 0 : clamp((now - st.last) / 1000, 0, 0.05);
      st.last = now;
      st.frame++;
      const reduced = L.reduced;
      const time = (now - st.start) / 1000;

      // reveal timeline
      if (reduced) st.rt = L.revealed ? T_END : 0;
      else if (L.revealed) st.rt = Math.min(T_END, st.rt + dt);
      else st.rt = Math.max(0, st.rt - dt * 1.7);
      const rt = st.rt;

      // marker spring (fractional point index)
      const c = L.curve;
      const target = clamp(L.hover ?? L.selected, c.lo, c.hi);
      if (reduced) { st.idx = target; st.vel = 0; }
      else {
        const k = 90, damp = 2 * Math.sqrt(k) * 1.02;
        st.vel += (-(st.idx - target) * k - st.vel * damp) * dt;
        st.idx += st.vel * dt;
        if (Math.abs(st.idx - target) < 1e-4 && Math.abs(st.vel) < 1e-3) { st.idx = target; st.vel = 0; }
      }
      st.idx = clamp(st.idx, c.lo, c.hi);
      const di = clamp(Math.round(st.idx), c.lo, c.hi);
      if (di !== st.lastShown) {
        st.lastShown = di;
        setShown(di);
      }

      // sizes
      const { w: W, h: H } = L.size;
      const f2 = clamp(fill, 0.3, 1);
      const cw = Math.max(0, Math.min(W * f2, Math.max(0, W - 24), H * Math.min(f2, FILL_TALL) * (CW / CH)));
      if (cw < 10) return;
      const s = cw / CW;
      const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
      const pw = Math.round(cw * dpr), ph = Math.round(((cw * CH) / CW) * dpr);
      if (mainCv.width !== pw || mainCv.height !== ph) { mainCv.width = pw; mainCv.height = ph; }
      const fw = clamp(Math.round(cw / 2), 100, 340), fh = Math.max(8, Math.round((fw * CH) / CW));
      if (fieldCv.width !== fw || fieldCv.height !== fh) { fieldCv.width = fw; fieldCv.height = fh; }
      field.resize(fw, fh);
      field.palette(L.accentRgb, L.cardRgb);

      // intro parts
      const glow = easeInOut(seg(rt, 0.12, 1.75));
      const draw = easeInOut(seg(rt, 0.22, 1.62));
      const [mxu, myu] = curveAt(c, st.idx);
      const markerArc = arcAt(c, st.idx) / (c.total || 1);
      const drawArc = draw * 1.0;
      const ringIn = reduced ? 1 : backOut(seg(rt, 0.22 + 1.4 * markerArc * 0.92, 0.22 + 1.4 * markerArc * 0.92 + 0.4));
      const chipIn = reduced ? 1 : seg(rt, 1.42, 1.92);
      const guideIn = reduced ? 1 : easeOut(seg(rt, 1.3, 1.9));
      const textIn = seg(rt, 0.05, 0.75);
      const capIn = seg(rt, 0.75, 1.4);
      const figIn = seg(rt, 0.15, 1.75);
      const breath = reduced ? 0 : 0.028 * Math.sin((time / BREATH_PERIOD) * Math.PI * 2) * glow;

      // field (glow follows the marker x)
      field.layout(mxu);
      field.paint(mxu, glow, breath, reduced ? 1 : st.frame);
      if (field.img) fctx.putImageData(field.img, 0, 0);

      // main canvas
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, pw, ph);
      ctx.setTransform(dpr * s, 0, 0, dpr * s, 0, 0);
      const total = c.total;
      const shownLen = total * drawArc;
      const pastLen = Math.min(shownLen, arcAt(c, st.idx));
      const tx = L.textRgb;

      if (shownLen > 0.5) {
        // clip helpers
        const pastClip = () => { ctx.beginPath(); ctx.rect(-50, -50, mxu + 50, CH + 100); ctx.clip(); };
        const futureClip = () => { ctx.beginPath(); ctx.rect(mxu, -50, CW + 100, CH + 100); ctx.clip(); };

        // under-fill: darkens the glow under the line toward the marker
        const ux0 = UNDER_FROM * mxu;
        const dark = mixRgb([0, 0, 0], L.accentRgb, 0.06); // ls:keep
        if (glow > 0.001) {
          ctx.save();
          pastClip();
          ctx.beginPath();
          ctx.rect(-10, -10, Math.min(mxu, 1e4) + 10, CH + 20);
          ctx.clip();
          tracePath(ctx, c);
          const last = c.pts[c.pts.length - 1];
          ctx.lineTo(last.x, CH + 40);
          ctx.lineTo(c.pts[0].x, CH + 40);
          ctx.closePath();
          const g = ctx.createLinearGradient(ux0, 0, mxu, 0);
          for (let i = 0; i <= 8; i++) {
            const t = i / 8;
            g.addColorStop(t, css(dark, UNDER_MAX * t * t * (3 - 2 * t) * glow * clamp01(draw * 1.4 - 0.2)));
          }
          ctx.fillStyle = g;
          ctx.fill();
          ctx.restore();
        }

        // future line (faint)
        ctx.save();
        futureClip();
        tracePath(ctx, c);
        ctx.lineWidth = LINE_W;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash([shownLen, total + 10]);
        ctx.strokeStyle = css(tx, 0.095);
        ctx.stroke();
        ctx.restore();

        // past line with its shadow
        if (pastLen > 0.5) {
          ctx.save();
          pastClip();
          tracePath(ctx, c);
          ctx.lineWidth = LINE_W;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.setLineDash([pastLen, total + 10]);
          ctx.shadowColor = css(mixRgb([0, 0, 0], L.accentRgb, 0.1), 0.95); // ls:keep
          ctx.shadowBlur = 8 * s * dpr;
          ctx.shadowOffsetY = 6 * s * dpr;
          ctx.strokeStyle = css(L.lineRgb, 1);
          ctx.stroke();
          ctx.shadowColor = "rgba(0, 0, 0, 0)"; // ls:keep
          ctx.stroke();
          ctx.restore();
        }
      }

      // guide
      if (guideIn > 0.001 && ringIn > 0.01) {
        const y0 = myu + RING_R + RING_W / 2 + 3.4;
        const y1 = y0 + (CH - y0) * guideIn;
        if (y1 > y0) {
          ctx.save();
          const g = ctx.createLinearGradient(0, y0, 0, CH);
          g.addColorStop(0, css(tx, 0.2));
          g.addColorStop(1, css(tx, 0.3));
          ctx.strokeStyle = g;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5.6, 3.1]);
          ctx.beginPath();
          ctx.moveTo(mxu, y0);
          ctx.lineTo(mxu, y1);
          ctx.stroke();
          ctx.restore();
        }
      }

      // marker
      if (ringIn > 0.001) {
        const dc = L.deltaRgb;
        const sc = Math.max(0, ringIn);
        // halo pulse
        if (!reduced && rt >= T_END - 0.01) {
          const ph = ((time % HALO_PERIOD) + HALO_PERIOD) % HALO_PERIOD / HALO_PERIOD;
          const a = ph < 0.62 ? Math.sin((ph / 0.62) * Math.PI) : 0;
          if (a > 0.001) {
            const rr = RING_R + 2 + easeOut(ph / 0.62) * 11;
            const g = ctx.createRadialGradient(mxu, myu, RING_R, mxu, myu, rr + 4);
            g.addColorStop(0, css(dc, 0));
            g.addColorStop(0.7, css(dc, 0.22 * a));
            g.addColorStop(1, css(dc, 0));
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(mxu, myu, rr + 4, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.save();
        ctx.translate(mxu, myu);
        ctx.scale(sc, sc);
        // soft dark halo hugging the ring
        ctx.beginPath();
        ctx.arc(0, 0, RING_R + RING_W / 2 + 0.6, 0, Math.PI * 2);
        ctx.fillStyle = css(mixRgb([0, 0, 0], dc, 0.22), 0.85); // ls:keep
        ctx.fill();
        ctx.beginPath();
        ctx.arc(0, 0, RING_R, 0, Math.PI * 2);
        ctx.fillStyle = css(mixRgb(L.cardRgb, dc, 0.06), 1);
        ctx.fill();
        ctx.lineWidth = RING_W;
        ctx.strokeStyle = css(dc, 1);
        ctx.stroke();
        if (L.focusVisible) {
          ctx.beginPath();
          ctx.arc(0, 0, RING_R + RING_W / 2 + 4.5, 0, Math.PI * 2);
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = css(mixRgb(L.accentRgb, [255, 255, 255], 0.45), 0.95);
          ctx.stroke();
        }
        ctx.restore();
      }

      // chip
      {
        const chipW = chipEl.offsetWidth, chipH = chipEl.offsetHeight;
        // keep clear of the figure and the menu: try above (nudged sideways), then below
        const avoid: { l: number; t: number; r: number; b: number }[] = [];
        const cardBox = mainCv.getBoundingClientRect();
        const figBox = figEl.getBoundingClientRect();
        if (figBox.width > 0) avoid.push({ l: figBox.left - cardBox.left - 4, t: figBox.top - cardBox.top, r: figBox.right - cardBox.left + 6, b: figBox.bottom - cardBox.top });
        if (L.menu) avoid.push({ l: (470.5 - 10) * s, t: 12 * s, r: (470.5 + 10) * s, b: 50 * s });
        const hits = (x: number, y: number) => avoid.some((a) => x < a.r && x + chipW > a.l && y < a.b && y + chipH > a.t);
        const cxFor = (dx: number) => clamp(mxu * s - chipW / 2 + dx, 6, cw - chipW - 6);
        const reach = Math.max(0, chipW / 2 - 9);
        let cx = cxFor(0);
        let cy = (myu - CHIP_GAP) * s - chipH;
        let below = cy < 4;
        if (!below && hits(cx, cy)) {
          let found = false;
          for (let k = 1; k <= 8 && !found; k++) {
            for (const sg of [1, -1]) {
              const x = cxFor((sg * k * reach) / 8);
              if (Math.abs(x + chipW / 2 - mxu * s) <= reach + 0.5 && !hits(x, cy)) { cx = x; found = true; break; }
            }
          }
          if (!found) below = true;
        }
        if (below) { cy = (myu + CHIP_GAP) * s; cx = cxFor(0); }
        const pop = reduced ? 1 : backOut(chipIn);
        chipEl.style.transform = `translate3d(${cx.toFixed(2)}px, ${cy.toFixed(2)}px, 0) scale(${(0.6 + 0.4 * pop).toFixed(4)})`;
        chipEl.style.transformOrigin = `${(mxu * s - cx).toFixed(1)}px ${below ? 0 : chipH}px`;
        chipEl.style.opacity = String(clamp01(chipIn * 1.8));
        const tailEl = chipEl.querySelector("svg");
        if (tailEl) {
          const th = tailEl.getBoundingClientRect().height / Math.max(0.001, 0.6 + 0.4 * pop);
          tailEl.style.bottom = below ? "auto" : `${(-th + 1.5).toFixed(2)}px`;
          tailEl.style.top = below ? `${(-th + 1.5).toFixed(2)}px` : "auto";
          tailEl.style.transform = below ? "translateX(-50%) rotate(180deg)" : "translateX(-50%)";
          const tx2 = clamp(mxu * s - cx, 8, chipW - 8);
          tailEl.style.left = `${tx2.toFixed(2)}px`;
        }
      }

      // text
      const lab = labelRef.current, cap = capRef.current;
      if (lab) {
        lab.style.opacity = String(easeOut(textIn));
        lab.style.transform = `translate3d(0, ${((1 - easeOut(textIn)) * 6 * s).toFixed(2)}px, 0)`;
      }
      if (cap) {
        cap.style.opacity = String(easeOut(capIn));
        cap.style.transform = `translate3d(0, ${((1 - easeOut(capIn)) * 6 * s).toFixed(2)}px, 0)`;
      }
      const figFont = `500 ${(FIG_SIZE * s).toFixed(3)}px ${L.font}`;
      fig.setFoot(L.font === DEFAULT_FONT);
      fig.setFont(figFont, FIG_SIZE * s, FIG_TRACK * FIG_SIZE * s);
      fig.set(L.figure, reduced);
      fig.step(dt, reduced ? 1 : figIn, reduced);
      const chipPx2 = Math.max(11, CHIP_SIZE * s);
      chipRoll.setFont(`500 ${chipPx2.toFixed(3)}px ${L.font}`, chipPx2, 0);
      chipRoll.set(L.deltaText, reduced);
      chipRoll.step(dt, 1, reduced);

      // keep going while visible
      if (st.visible && !document.hidden) st.raf = requestAnimationFrame(frame);
    };
    const kick = () => {
      if (!st.raf && st.visible && !document.hidden) { st.last = -1; st.raf = requestAnimationFrame(frame); }
    };
    kickRef.current = kick;
    let io: IntersectionObserver | null = null;
    if (typeof IntersectionObserver !== "undefined") {
      io = new IntersectionObserver((es) => {
        st.visible = es.some((e) => e.isIntersecting);
        if (st.visible) kick();
      });
      io.observe(root);
    }
    const onVis = () => { if (!document.hidden) kick(); };
    document.addEventListener("visibilitychange", onVis);
    kick();
    return () => {
      if (st.raf) cancelAnimationFrame(st.raf);
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      kickRef.current = () => {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // any prop change wakes the loop
  React.useEffect(() => { kickRef.current(); });

  /* Interaction. */
  const select = React.useCallback((i: number) => {
    const c = live.current.curve;
    const j = clamp(Math.round(i), c.lo, c.hi);
    if (index === undefined) setSelfIndex(j);
    onIndexChange?.(j);
  }, [index, onIndexChange]);


  const pointerToIndex = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const card = s > 0 ? (e.clientX - r.left + hitLeft) / s : 0;
    const c = live.current.curve;
    const n = c.pts.length;
    const x0 = c.pts[0].x, x1 = c.pts[n - 1].x;
    const f = n > 1 ? ((card - x0) / (x1 - x0)) * (n - 1) : 0;
    // gentle magnet toward whole points
    const base = Math.round(f), d = f - base;
    const snapped = base + Math.sign(d) * Math.pow(Math.abs(d) * 2, 2.2) / 2;
    return clamp(snapped, c.lo, c.hi);
  };
  const dragging = React.useRef(false);
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (e.pointerType === "mouse" || dragging.current) {
      live.current.hover = pointerToIndex(e);
      kickRef.current();
    }
  };
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    dragging.current = true;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    live.current.hover = pointerToIndex(e);
    kickRef.current();
  };
  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!interactive) return;
    if (dragging.current) {
      dragging.current = false;
      select(pointerToIndex(e));
      if (e.pointerType !== "mouse") live.current.hover = null;
    }
    kickRef.current();
  };
  const onPointerLeave = () => {
    if (dragging.current) return;
    live.current.hover = null;
    kickRef.current();
  };
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const c = live.current.curve;
    let j = selected;
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") j = selected - 1;
    else if (e.key === "ArrowRight" || e.key === "ArrowUp") j = selected + 1;
    else if (e.key === "PageDown") j = selected - 3;
    else if (e.key === "PageUp") j = selected + 3;
    else if (e.key === "Home") j = c.lo;
    else if (e.key === "End") j = c.hi;
    else return;
    e.preventDefault();
    live.current.hover = null;
    select(j);
  };

  const fontStack = font;
  const tx = textRgb;
  const chipBg = mixRgb([0, 0, 0], deltaRgb, 0.19); // ls:keep
  const grainBg = typeof document !== "undefined" ? grain() : "";
  const cell = Math.min(size.w, size.h) * 0.0761;
  const m = Math.min(size.w, size.h);
  const hitLeft = (curve.pts[curve.lo].x - 16) * s;
  const labelTop = (LABEL_BASE * s) - BASE * labelPx;
  const figTop = FIG_BASE * s - BASE * figPx;
  const capTop = CAP_BASE * s - capLh / 2 - 0.3555 * capPx;
  const valueText = `${label} ${figure}, ${deltaText} ${word} ${tail}`;

  return (
    <div
      ref={rootRef}
      className={className}
      style={{ position: "relative", width: "100%", height: "100%", minHeight: 360, overflow: "hidden", background, fontFamily: fontStack, ...style }}
    >
      {grid && size.w > 0 ? (
        <>
          <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `radial-gradient(${m * 0.36}px ${m * 0.26}px at 100% 0%, rgba(255, 255, 255, 0.085), rgba(255, 255, 255, 0.018) 55%, rgba(255, 255, 255, 0) 100%), radial-gradient(${m * 0.26}px ${m * 0.19}px at 0% 100%, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.012) 55%, rgba(255, 255, 255, 0) 100%), radial-gradient(${m * 0.5}px ${m * 0.4}px at 0% 100%, rgba(0, 0, 0, 0) 22%, rgba(0, 0, 0, 0.28) 45%, rgba(0, 0, 0, 0.2) 62%, rgba(0, 0, 0, 0) 100%)` }} />
          <div
            aria-hidden
            style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              backgroundImage: "linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, rgba(255, 255, 255, 0) 1px), linear-gradient(180deg, rgba(255, 255, 255, 0.07) 1px, rgba(255, 255, 255, 0) 1px)",
              backgroundSize: `${cell}px ${cell}px`,
              backgroundPosition: `${size.w / 2 - cell * 6}px ${size.h / 2 - cell * 6}px`,
              maskImage: `radial-gradient(${m * 0.42}px ${m * 0.3}px at 100% 0%, #000, rgba(0, 0, 0, 0.35) 45%, transparent 100%), radial-gradient(${m * 0.32}px ${m * 0.22}px at 0% 100%, #000, rgba(0, 0, 0, 0.35) 45%, transparent 100%)`, // ls:keep
              WebkitMaskImage: `radial-gradient(${m * 0.42}px ${m * 0.3}px at 100% 0%, #000, rgba(0, 0, 0, 0.35) 45%, transparent 100%), radial-gradient(${m * 0.32}px ${m * 0.22}px at 0% 100%, #000, rgba(0, 0, 0, 0.35) 45%, transparent 100%)`, // ls:keep
            }}
          />
        </>
      ) : null}

      <div
        style={{
          position: "absolute", left, top, width: cw, height: ch, borderRadius: RADIUS * s, overflow: "hidden",
          background: cardColor,
          boxShadow: `0 0 0 1px rgba(0, 0, 0, 0.85), 0 ${18 * s}px ${48 * s}px rgba(0, 0, 0, 0.45)`,
          isolation: "isolate", visibility: cw > 0 ? "visible" : "hidden",
        }}
      >
        <canvas ref={fieldRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
        {grainBg ? <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: `url(${grainBg})`, backgroundSize: `${160 / 2}px`, opacity: 0.045, mixBlendMode: "overlay", pointerEvents: "none" }} /> : null}
        <canvas ref={mainRef} aria-hidden style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />

        <div ref={labelRef} style={{ position: "absolute", left: PAD_X * s, top: labelTop, fontSize: labelPx, lineHeight: "1em", fontWeight: 380, letterSpacing: "-0.012em", color: css(tx, 0.68), whiteSpace: "nowrap", pointerEvents: "none" }}>
          {label}
        </div>

        <div aria-hidden style={{ position: "absolute", left: PAD_X * s - 0.045 * figPx, top: figTop, fontSize: figPx, lineHeight: "1em", fontWeight: 500, color: css(tx, 1), whiteSpace: "nowrap", pointerEvents: "none", display: "flex", fontFeatureSettings: '"kern" 0' }}>
          <div ref={figRef} style={{ position: "relative", display: "flex", height: "1em" }} />
        </div>

        <div ref={capRef} style={{ position: "absolute", left: PAD_X * s, top: capTop, width: Math.max(150 * s, Math.min(capPx * 13.5, (225 - PAD_X) * s)), fontSize: capPx, lineHeight: `${capLh}px`, letterSpacing: "-0.03em", color: css(tx, 0.56), pointerEvents: "none" }}>
          <span style={{ color: css(tx, 1), fontWeight: 520 }}>{deltaText} {word}</span> {tail}
        </div>

        {menu ? (
          onMenu ? (
            <button
              type="button"
              aria-label="Mais opções"
              onClick={onMenu}
              style={{ position: "absolute", left: (470.5 - 12) * s, top: (31.3 - 18) * s, width: 24 * s, height: 36 * s, padding: 0, border: 0, background: "transparent", cursor: "pointer", borderRadius: 8 * s, outlineColor: css(mixRgb(accentRgb, [255, 255, 255], 0.45), 1) }}
            >
              <Dots s={s} color={css(tx, 1)} offsetX={12} offsetY={18} />
            </button>
          ) : (
            <div aria-hidden style={{ position: "absolute", left: (470.5 - 12) * s, top: (31.3 - 18) * s, width: 24 * s, height: 36 * s, pointerEvents: "none" }}>
              <Dots s={s} color={css(tx, 1)} offsetX={12} offsetY={18} />
            </div>
          )
        ) : null}

        <div
          ref={chipRef}
          aria-hidden
          style={{
            position: "absolute", left: 0, top: 0, height: Math.max(CHIP_H * s, chipPx * 1.95), padding: `0 ${Math.max(5.2 * s, chipPx * 0.5)}px`,
            display: "flex", alignItems: "center", borderRadius: 4.5 * s, background: css(chipBg, 1),
            boxShadow: `inset 0 0 0 1px ${css(mixRgb(deltaRgb, [255, 255, 255], 0.55), 0.2)}`,
            color: css(deltaRgb, 1), fontSize: chipPx, fontWeight: 500, letterSpacing: "0", pointerEvents: "none", opacity: 0, willChange: "transform",
          }}
        >
          <span ref={chipTextRef} style={{ position: "relative", display: "flex", height: "1em", lineHeight: "1em" }} />
          <ChipTail s={s} bg={css(chipBg, 1)} edge={css(mixRgb(deltaRgb, [255, 255, 255], 0.55), 0.2)} />
        </div>

        <div
          role="slider"
          tabIndex={interactive ? 0 : -1}
          aria-label={`Gráfico de ${label}`}
          aria-valuemin={curve.lo}
          aria-valuemax={curve.hi}
          aria-valuenow={selected}
          aria-valuetext={valueText}
          aria-disabled={interactive ? undefined : true}
          onPointerMove={onPointerMove}
          onPointerDown={onPointerDown}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerLeave}
          onPointerLeave={onPointerLeave}
          onKeyDown={onKeyDown}
          onFocus={(e) => { let v = true; try { v = e.currentTarget.matches(":focus-visible"); } catch { /* ignore */ } setFocusVisible(v); }}
          onBlur={() => setFocusVisible(false)}
          style={{ position: "absolute", left: hitLeft, top: 0, right: 0, bottom: 0, outline: "none", cursor: interactive ? "crosshair" : "default", touchAction: "pan-y", WebkitTapHighlightColor: "transparent" }}
        />

        <span style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap" }}>
          {figure}
        </span>

        {children ? <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}><div style={{ position: "absolute", inset: 0, pointerEvents: "auto" }}>{children}</div></div> : null}

        <div aria-hidden style={{ position: "absolute", inset: 0, borderRadius: "inherit", boxShadow: `inset 0 0 0 ${Math.max(1, 1.2 * s)}px rgba(132, 134, 142, 0.33)`, pointerEvents: "none" }} />
      </div>
    </div>
  );
}

function Dots({ s, color, offsetX, offsetY }: { s: number; color: string; offsetX: number; offsetY: number }) {
  const r = 2.3 * s;
  return (
    <svg width={24 * s} height={36 * s} viewBox={`0 0 ${24 * s} ${36 * s}`} style={{ display: "block" }} aria-hidden>
      {[22.8, 31.3, 39.9].map((y) => (
        <circle key={y} cx={offsetX * s} cy={(y - 31.3 + offsetY) * s} r={r} fill={color} />
      ))}
    </svg>
  );
}

function ChipTail({ s, bg, edge }: { s: number; bg: string; edge: string }) {
  const w = 7 * s, h = 3.6 * s;
  return (
    <svg width={w} height={h + 1} viewBox={`0 0 ${w} ${h + 1}`} aria-hidden style={{ position: "absolute", left: "50%", bottom: -h + 0.5, transform: "translateX(-50%)", overflow: "visible" }}>
      <path d={`M0 0 L${w / 2} ${h} L${w} 0 Z`} fill={bg} />
      <path d={`M0 0 L${w / 2} ${h} L${w} 0`} fill="none" stroke={edge} strokeWidth={1} />
    </svg>
  );
}

export default MarketCard;
