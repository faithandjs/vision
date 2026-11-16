import type { Board } from "./types";

export type CollageFormat = "desktop" | "phone" | "ipad";

export const COLLAGE_FORMATS: Record<CollageFormat, { w: number; h: number; label: string }> = {
  desktop: { w: 2560, h: 1440, label: "Desktop" },
  phone: { w: 1179, h: 2556, label: "Phone" },
  ipad: { w: 2048, h: 2732, label: "iPad" },
};

export interface CollageOptions {
  format: CollageFormat;
  showTitle: boolean;
  showTheme: boolean;
  showLabels: boolean;
  borders: boolean;
  /** Gap between photos, in px at 1080p scale. */
  borderWidth: number;
  borderColor: string;
  cardColor: string;
  /** Title card background opacity, 0–100. */
  cardOpacity: number;
  /** Title card scale, percent. */
  cardSize: number;
}

export const DEFAULT_COLLAGE_OPTIONS: CollageOptions = {
  format: "desktop",
  showTitle: true,
  showTheme: true,
  showLabels: true,
  borders: true,
  borderWidth: 14,
  borderColor: "#f1e8c7",
  cardColor: "#f9f4e3",
  cardOpacity: 100,
  cardSize: 100,
};

export const LIMITS = {
  borderWidth: { min: 4, max: 48 },
  cardOpacity: { min: 0, max: 100 },
  cardSize: { min: 60, max: 140 },
};

const isHex = (v: unknown): v is string => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v);
const clamp = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const bool = (v: unknown, fallback: boolean) => (typeof v === "boolean" ? v : fallback);

/** Stored options come from localStorage, so treat them as untrusted. */
export function sanitizeCollageOptions(o: Partial<CollageOptions>): CollageOptions {
  const d = DEFAULT_COLLAGE_OPTIONS;
  return {
    format: o.format && o.format in COLLAGE_FORMATS ? o.format : d.format,
    showTitle: bool(o.showTitle, d.showTitle),
    showTheme: bool(o.showTheme, d.showTheme),
    showLabels: bool(o.showLabels, d.showLabels),
    borders: bool(o.borders, d.borders),
    borderWidth: clamp(o.borderWidth, LIMITS.borderWidth.min, LIMITS.borderWidth.max, d.borderWidth),
    borderColor: isHex(o.borderColor) ? o.borderColor : d.borderColor,
    cardColor: isHex(o.cardColor) ? o.cardColor : d.cardColor,
    cardOpacity: clamp(o.cardOpacity, LIMITS.cardOpacity.min, LIMITS.cardOpacity.max, d.cardOpacity),
    cardSize: clamp(o.cardSize, LIMITS.cardSize.min, LIMITS.cardSize.max, d.cardSize),
  };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CollageLayout {
  tiles: Rect[];
  plaque: Rect | null;
}

export interface CollageFonts {
  serif: string;
  sans: string;
}

// ---------- assets ----------

function attempt(url: string) {
  return new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // required to export the canvas afterwards
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/** Loads an image the canvas can export: directly if the host allows CORS, else via our relay. */
export async function loadCollageImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return (await attempt(src)) ?? (await attempt(`/api/image?url=${encodeURIComponent(src)}`));
}

/** Resolves the app's next/font families and makes sure they're loaded for canvas use. */
export async function loadCollageFonts(): Promise<CollageFonts> {
  const root = getComputedStyle(document.documentElement);
  const serif = root.getPropertyValue("--font-serif").trim() || "Georgia, serif";
  const sans = root.getPropertyValue("--font-inter").trim() || "system-ui, sans-serif";
  await Promise.all([
    document.fonts.load(`100px ${serif}`),
    document.fonts.load(`italic 40px ${serif}`),
    document.fonts.load(`500 20px ${sans}`),
  ]).catch(() => {});
  return { serif, sans };
}

// ---------- helpers ----------

const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
export const contains = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

function rgb(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (hex: string, a: number) => `rgba(${rgb(hex).join(",")},${a})`;
function luminance(hex: string) {
  const [r, g, b] = rgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
/** Readable text colors for a given background. */
const textOn = (hex: string) =>
  luminance(hex) > 0.35 ? { ink: "#262a1a", muted: "#5e5d49" } : { ink: "#f9f4e3", muted: "#ddd6bb" };

/** Rows of tiles that fill the canvas, with gentle size variation so it reads as a collage, not a grid. */
function layoutTiles(n: number, W: number, H: number, gap: number): Rect[] {
  if (n === 0) return [];
  const rows = Math.min(n, Math.max(1, Math.round(Math.sqrt((n * H) / W))));
  const base = Math.floor(n / rows);
  const extra = n % rows;
  const counts = Array.from({ length: rows }, (_, i) => base + (i < extra ? 1 : 0));
  const rowWeights = counts.map((_, i) => 1 + 0.2 * Math.sin(i * 2.3 + 0.7));
  const rowTotal = rowWeights.reduce((a, b) => a + b, 0);
  const usableH = H - gap * (rows + 1);

  const rects: Rect[] = [];
  let y = gap;
  let k = 0;
  counts.forEach((count, r) => {
    const h = (usableH * rowWeights[r]) / rowTotal;
    const weights = Array.from({ length: count }, (_, j) => 1 + 0.4 * Math.sin((k + j) * 1.9 + r));
    const total = weights.reduce((a, b) => a + b, 0);
    const usableW = W - gap * (count + 1);
    let x = gap;
    weights.forEach((wt) => {
      const w = (usableW * wt) / total;
      rects.push({ x, y, w, h });
      x += w + gap;
    });
    k += count;
    y += h + gap;
  });
  return rects;
}

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, radius);
}

function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, r: Rect, radius: number) {
  ctx.save();
  roundRect(ctx, r, radius);
  ctx.clip();
  const s = Math.max(r.w / img.naturalWidth, r.h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.drawImage(img, r.x + (r.w - dw) / 2, r.y + (r.h - dh) / 2, dw, dh);
  ctx.restore();
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// ---------- render ----------

/** Draws the collage and returns where everything landed (for click hit-testing). */
export function renderCollage(
  canvas: HTMLCanvasElement,
  board: Board,
  images: (HTMLImageElement | null)[],
  o: CollageOptions,
  fonts: CollageFonts,
): CollageLayout {
  const { w: W, h: H } = COLLAGE_FORMATS[o.format];
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const { serif } = fonts;

  const unit = Math.min(W, H) / 1080; // scale everything to the canvas
  const gap = o.borders ? o.borderWidth * unit : 0;
  const radius = o.borders ? Math.min(12, o.borderWidth) * unit : 0;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = o.borderColor;
  ctx.fillRect(0, 0, W, H);

  // ---- title card geometry (computed first so labels can avoid it)
  const title = o.showTitle ? board.title || "My vision board" : "";
  const theme = o.showTheme ? board.theme : "";
  let plaque: Rect | null = null;
  let titleLines: string[] = [];
  let themeLines: string[] = [];
  const s = (o.cardSize / 100) * unit;
  const plaqueW = (o.format === "desktop" ? W * 0.42 : W * 0.78) * (o.cardSize / 100);
  const innerW = plaqueW - 110 * s;
  let titleSize = 110 * s;
  const themeSize = 36 * s;

  if (title || theme) {
    if (title) {
      do {
        ctx.font = `${titleSize}px ${serif}`;
        titleLines = wrap(ctx, title, innerW);
        titleSize -= 4 * s;
      } while (titleLines.length > 2 && titleSize > 44 * s);
      titleSize += 4 * s;
    }
    if (theme) {
      ctx.font = `italic ${themeSize}px ${serif}`;
      themeLines = wrap(ctx, theme, innerW).slice(0, 4);
    }
    const contentH =
      titleLines.length * titleSize * 1.05 +
      (titleLines.length && themeLines.length ? 28 * s : 0) +
      themeLines.length * themeSize * 1.3;
    const plaqueH = contentH + 100 * s;
    plaque = { x: (W - plaqueW) / 2, y: (H - plaqueH) / 2, w: plaqueW, h: plaqueH };
  }

  // ---- photos
  const tiles = layoutTiles(board.data.length, W, H, gap);
  tiles.forEach((rect, i) => {
    const img = images[i];
    if (img) drawCover(ctx, img, rect, radius);
    else {
      ctx.fillStyle = rgba("#262a1a", 0.12);
      roundRect(ctx, rect, radius);
      ctx.fill();
    }
  });

  // ---- card title labels, like words cut from a magazine
  if (o.showLabels) {
    const labelText = textOn(o.cardColor).ink;
    tiles.forEach((rect, i) => {
      const text0 = board.data[i].title;
      if (!text0) return;
      ctx.font = `${30 * unit}px ${serif}`;
      const padX = 14 * unit;
      const inset = 18 * unit;
      let text = text0;
      while (ctx.measureText(text).width > rect.w - inset * 2 - padX * 2 && text.length > 1)
        text = text.slice(0, -2) + "…";
      const lw = ctx.measureText(text).width + padX * 2;
      const lh = 44 * unit;
      const lx = rect.x + inset;
      // Bottom-left by default; move to the top if the title card would cover it.
      let ly = rect.y + rect.h - lh - inset;
      if (plaque && overlaps({ x: lx, y: ly, w: lw, h: lh }, plaque)) ly = rect.y + inset;
      if (plaque && overlaps({ x: lx, y: ly, w: lw, h: lh }, plaque)) return;
      ctx.save();
      ctx.translate(lx + lw / 2, ly + lh / 2);
      ctx.rotate(((i % 3) - 1) * 0.02);
      ctx.shadowColor = "rgba(0,0,0,0.25)";
      ctx.shadowBlur = 10 * unit;
      ctx.shadowOffsetY = 3 * unit;
      ctx.fillStyle = o.cardColor;
      ctx.fillRect(-lw / 2, -lh / 2, lw, lh);
      ctx.shadowColor = "transparent";
      ctx.fillStyle = labelText;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 0, 2 * unit);
      ctx.restore();
    });
  }

  // ---- title card
  if (plaque) {
    const alpha = o.cardOpacity / 100;
    ctx.save();
    if (alpha > 0) {
      ctx.shadowColor = `rgba(38,42,26,${0.35 * alpha})`;
      ctx.shadowBlur = 50 * s;
      ctx.shadowOffsetY = 14 * s;
      ctx.fillStyle = rgba(o.cardColor, alpha);
      roundRect(ctx, plaque, 28 * s);
      ctx.fill();
    }
    ctx.restore();
    if (alpha >= 0.3) {
      ctx.strokeStyle = rgba("#9ca764", alpha);
      ctx.lineWidth = 2 * s;
      const inset = 14 * s;
      roundRect(
        ctx,
        { x: plaque.x + inset, y: plaque.y + inset, w: plaque.w - inset * 2, h: plaque.h - inset * 2 },
        18 * s,
      );
      ctx.stroke();
    }

    // Mostly see-through card: white text with a shadow so it reads over photos.
    const seeThrough = alpha < 0.5;
    const colors = seeThrough ? { ink: "#ffffff", muted: "#f3efe0" } : textOn(o.cardColor);
    ctx.save();
    if (seeThrough) {
      ctx.shadowColor = "rgba(0,0,0,0.6)";
      ctx.shadowBlur = 16 * s;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const cx = W / 2;
    let y = plaque.y + 50 * s;

    if (titleLines.length) {
      ctx.fillStyle = colors.ink;
      ctx.font = `${titleSize}px ${serif}`;
      const lh = titleSize * 1.05;
      for (const line of titleLines) {
        y += lh;
        ctx.fillText(line, cx, y - lh * 0.2);
      }
    }
    if (themeLines.length) {
      if (titleLines.length) y += 28 * s;
      ctx.fillStyle = colors.muted;
      ctx.font = `italic ${themeSize}px ${serif}`;
      const lh = themeSize * 1.3;
      for (const line of themeLines) {
        y += lh;
        ctx.fillText(line, cx, y - lh * 0.25);
      }
    }
    ctx.restore();
  }

  return { tiles, plaque };
}

export const collageFileName = (title: string, format: CollageFormat) =>
  `${(title || "vision board")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${format}.png`;
