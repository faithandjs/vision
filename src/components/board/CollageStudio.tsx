"use client";
import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  LuCheck,
  LuChevronDown,
  LuDownload,
  LuLoaderCircle,
  LuMonitor,
  LuSlidersHorizontal,
  LuSmartphone,
  LuTablet,
} from "react-icons/lu";
import { useToast } from "@/context/ToastProvider";
import { usePersistentObject } from "@/hooks/usePersistentState";
import {
  COLLAGE_FORMATS,
  DEFAULT_COLLAGE_OPTIONS,
  LIMITS,
  collageFileName,
  contains,
  loadCollageFonts,
  loadCollageImage,
  renderCollage,
  sanitizeCollageOptions,
  type CollageFonts,
  type CollageFormat,
  type CollageLayout,
  type CollageOptions,
} from "@/lib/collage";
import type { Board } from "@/lib/types";

const FORMAT_ICONS = { desktop: LuMonitor, phone: LuSmartphone, ipad: LuTablet } as const;
const SWATCHES = ["#f1e8c7", "#ffffff", "#9ca764", "#e9d3c8", "#262a1a", "#111111"];

/**
 * The Collage view: the board rendered as a classic vision-board image,
 * with a bottom dock to customize and download it.
 */
export default function CollageStudio({ board, onOpenCard }: { board: Board; onOpenCard: (index: number) => void }) {
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<CollageLayout | null>(null);
  const [stored, setStored] = usePersistentObject<CollageOptions>("vb-collage", DEFAULT_COLLAGE_OPTIONS);
  const o = useMemo(() => sanitizeCollageOptions(stored), [stored]);
  const update = (patch: Partial<CollageOptions>) => setStored({ ...o, ...patch });
  // Style panel starts open on wide screens and closed on phones, until the user toggles it.
  const isWide = useMediaQuery("(min-width: 768px)");
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null);
  const expanded = userExpanded ?? isWide;
  const [hovering, setHovering] = useState(false);

  // Load fonts + images once per set of image URLs.
  const srcKey = board.data.map((c) => c.image.src).join("\n");
  const [assets, setAssets] = useState<{
    key: string;
    fonts: CollageFonts;
    images: (HTMLImageElement | null)[];
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    const srcs = srcKey ? srcKey.split("\n") : [];
    Promise.all([loadCollageFonts(), Promise.all(srcs.map(loadCollageImage))]).then(([fonts, images]) => {
      if (!cancelled) setAssets({ key: srcKey, fonts, images });
    });
    return () => {
      cancelled = true;
    };
  }, [srcKey]);

  const ready = assets?.key === srcKey;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!ready || !canvas || !assets) return;
    layoutRef.current = renderCollage(canvas, board, assets.images, o, assets.fonts);
  }, [ready, assets, board, o]);

  const missing = ready ? assets!.images.filter((img, i) => !img && board.data[i]?.image.src).length : 0;

  // Map a pointer position on the scaled canvas to a photo (ignoring the title card).
  const tileAt = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout) return -1;
    const r = canvas.getBoundingClientRect();
    const x = ((e.clientX - r.left) * canvas.width) / r.width;
    const y = ((e.clientY - r.top) * canvas.height) / r.height;
    if (layout.plaque && contains(layout.plaque, x, y)) return -1;
    return layout.tiles.findIndex((t) => contains(t, x, y));
  };

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      canvas.toBlob((blob) => {
        if (!blob) return toast("Couldn't create the image.", "error");
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = collageFileName(board.title, o.format);
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        toast("Collage downloaded.");
      }, "image/png");
    } catch {
      toast("Couldn't create the image.", "error");
    }
  };

  const { w, h } = COLLAGE_FORMATS[o.format];
  const hasCard = o.showTitle || (o.showTheme && !!board.theme);

  return (
    <>
      <div className="relative grid place-items-center pb-4">
        <canvas
          ref={canvasRef}
          role="img"
          aria-label={`Vision board collage of ${board.data.length} images`}
          onClick={(e) => {
            const i = tileAt(e);
            if (i >= 0) onOpenCard(i);
          }}
          onMouseMove={(e) => setHovering(tileAt(e) >= 0)}
          onMouseLeave={() => setHovering(false)}
          style={{ aspectRatio: `${w} / ${h}` }}
          className={
            "h-auto w-auto max-w-full rounded-2xl shadow-2xl shadow-black/20 transition-opacity duration-300 " +
            // Leave room for the header above and the dock below.
            (expanded ? "max-h-[calc(100dvh-27rem)] min-h-64 " : "max-h-[calc(100dvh-17rem)] ") +
            (ready ? "opacity-100" : "opacity-0") +
            (hovering ? " cursor-pointer" : "")
          }
        />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-sm text-muted">
            <span className="flex items-center gap-2">
              <LuLoaderCircle size={16} className="animate-spin" /> Arranging your board…
            </span>
          </div>
        )}
        {missing > 0 && (
          <p className="mt-3 text-xs text-muted">
            {missing} {missing === 1 ? "image" : "images"} couldn&apos;t be loaded and{" "}
            {missing === 1 ? "was" : "were"} left blank.
          </p>
        )}
      </div>

      {/* Spacer so the fixed dock never covers the image */}
      <div aria-hidden className={expanded ? "h-72 sm:h-48" : "h-24"} />

      <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-3">
        <div className="mx-auto max-h-[55dvh] max-w-6xl overflow-y-auto rounded-3xl border border-line bg-surface/90 p-3 shadow-2xl shadow-black/15 backdrop-blur-xl sm:p-4">
          {/* Row 1: size, what to show, download */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Segmented
              label="Wallpaper size"
              value={o.format}
              onChange={(format) => update({ format })}
              options={(Object.keys(COLLAGE_FORMATS) as CollageFormat[]).map((f) => ({
                value: f,
                label: COLLAGE_FORMATS[f].label,
                Icon: FORMAT_ICONS[f],
              }))}
            />
            <Divider />
            <div role="group" aria-label="Show on image" className="flex flex-wrap gap-1.5">
              <Chip pressed={o.showTitle} onClick={() => update({ showTitle: !o.showTitle })}>
                Board title
              </Chip>
              <Chip
                pressed={o.showTheme}
                disabled={!board.theme}
                onClick={() => update({ showTheme: !o.showTheme })}
              >
                Theme
              </Chip>
              <Chip pressed={o.showLabels} onClick={() => update({ showLabels: !o.showLabels })}>
                Card titles
              </Chip>
              <Chip pressed={o.borders} onClick={() => update({ borders: !o.borders })}>
                Borders
              </Chip>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={() => setUserExpanded(!expanded)}
                aria-expanded={expanded}
                className="btn-ghost text-muted"
              >
                <LuSlidersHorizontal size={15} />
                Style
                <LuChevronDown size={14} className={"transition " + (expanded ? "" : "rotate-180")} />
              </button>
              <button onClick={download} disabled={!ready} className="btn-accent">
                <LuDownload size={15} /> Download
                <span className="hidden text-xs opacity-70 lg:inline">
                  {w}×{h}
                </span>
              </button>
            </div>
          </div>

          {/* Row 2: styling */}
          {expanded && (
            <div className="mt-3 grid gap-4 border-t border-line pt-3 md:grid-cols-2">
              <fieldset disabled={!o.borders} className="space-y-2.5 disabled:opacity-45">
                <legend className="eyebrow mb-2">Border</legend>
                <Swatches label="Border color" value={o.borderColor} onChange={(borderColor) => update({ borderColor })} />
                <Slider
                  label="Thickness"
                  value={o.borderWidth}
                  {...LIMITS.borderWidth}
                  suffix="px"
                  onChange={(borderWidth) => update({ borderWidth })}
                />
              </fieldset>
              <fieldset disabled={!hasCard} className="space-y-2.5 disabled:opacity-45">
                <legend className="eyebrow mb-2">Title card</legend>
                <Swatches label="Title card color" value={o.cardColor} onChange={(cardColor) => update({ cardColor })} />
                <Slider
                  label="Opacity"
                  value={o.cardOpacity}
                  {...LIMITS.cardOpacity}
                  suffix="%"
                  onChange={(cardOpacity) => update({ cardOpacity })}
                />
                <Slider
                  label="Size"
                  value={o.cardSize}
                  {...LIMITS.cardSize}
                  suffix="%"
                  onChange={(cardSize) => update({ cardSize })}
                />
              </fieldset>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (cb) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", cb);
      return () => mql.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

function Divider() {
  return <span aria-hidden className="hidden h-6 w-px bg-line md:block" />;
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; Icon: React.ComponentType<{ size?: number }> }[];
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-full border border-line bg-surface p-1">
      {options.map(({ value: v, label: l, Icon }) => {
        const active = v === value;
        return (
          <button
            key={v}
            role="radio"
            aria-checked={active}
            onClick={() => onChange(v)}
            className={
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition " +
              (active ? "bg-ink text-bg shadow-sm" : "text-muted hover:text-ink")
            }
          >
            <Icon size={15} /> {l}
          </button>
        );
      })}
    </div>
  );
}

function Chip({
  pressed,
  disabled,
  onClick,
  children,
}: {
  pressed: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={
        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:pointer-events-none disabled:opacity-40 " +
        (pressed
          ? "border-accent bg-accent/25 text-ink"
          : "border-line bg-surface text-muted hover:border-accent hover:text-ink")
      }
    >
      <span
        className={
          "grid size-4 place-items-center rounded-full transition " +
          (pressed ? "bg-accent-deep text-surface" : "border border-muted/50")
        }
      >
        {pressed && <LuCheck size={11} strokeWidth={3} />}
      </span>
      {children}
    </button>
  );
}

function Swatches({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const custom = !SWATCHES.includes(value.toLowerCase());
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-sm text-muted">Color</span>
      {SWATCHES.map((c) => {
        const active = value.toLowerCase() === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={c}
            onClick={() => onChange(c)}
            style={{ background: c }}
            className={
              "size-7 rounded-full border border-muted/50 transition hover:scale-110 " +
              (active ? "ring-2 ring-accent-deep ring-offset-2 ring-offset-surface" : "")
            }
          />
        );
      })}
      <label
        htmlFor={id}
        title="Custom color"
        className={
          "relative size-7 cursor-pointer overflow-hidden rounded-full border border-muted/50 transition hover:scale-110 " +
          (custom ? "ring-2 ring-accent-deep ring-offset-2 ring-offset-surface" : "")
        }
        style={{
          background: custom ? value : "conic-gradient(#e66, #ec6, #6c6, #6ce, #66e, #e6e, #e66)",
        }}
      >
        <span className="sr-only">Custom color</span>
        <input
          id={id}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <label htmlFor={id} className="w-20 shrink-0 text-sm text-muted">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer accent-accent-deep"
      />
      <span className="w-12 text-right text-sm text-muted tabular-nums">
        {value}
        {suffix}
      </span>
    </div>
  );
}
