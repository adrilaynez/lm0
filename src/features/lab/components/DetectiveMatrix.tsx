"use client";

import {
    memo,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import { useReducedMotion } from "framer-motion";

import {
    ALPHABET_PG as ALPHABET_92,
    MATRIX_PG as MATRIX_92,
    pgChar as displayChar,
} from "@/features/lab/data/bigramPaulGraham";
import { useI18n } from "@/i18n/context";

/**
 * DetectiveMatrix — VIS 10, the showpiece of the Bigram chapter (§ editorial-green).
 *
 * ONE concept made physical: *the full 92×92 transition table is the source code of a language, and
 * its dark cells are rules the machine discovered just by counting.* All 8,464 cells paint to one
 * canvas; on top we run a GitHub-contribution-style game: glide and a MAGNIFIER reads the true COUNT
 * ("«q» → «u» · 157 veces"); click and the whole row + column lock as a lit cross with the committed
 * answer; chase three named hidden rules (capital desert, q corner, full-stop jump), each lighting
 * ONLY its region while the rest of the board sinks away.
 *
 * THE COUNT IS THE HERO. The reader sees integers where they look — the lens paints the count inside
 * every magnified non-zero cell, the readout shows "X → Y · N veces" / "nunca". % is gone.
 *
 * HEAT (kept + recalibrated): mixed in oklab via a 64-step LUT sampled through a hidden probe (canvas
 * can't evaluate color-mix; getComputedStyle returns literal `oklab(…)` which mis-parses to near-black
 * — the old invisible-square bug). Indexed by log(COUNT), not raw P: the corpus is brutally skewed
 * (median nonzero P ≈ 1.3 %) so a linear-P ramp would leave the table black. A floor lifts every
 * non-zero cell so it reads in BOTH themes.
 *
 * HIGHLIGHT FIX: the old highlight only dimmed off-focus cells and relied on the focused cells' own
 * heat — but the q-row is itself near-empty, so "lighting it" changed nothing (the reported failure).
 * Now a focus draws a bright translucent BAND over the row/column/region (independent of heat) plus a
 * ring, so even an all-but-empty row is unmistakably the only lit thing.
 *
 * Token bridge re-reads on `[data-bigram-theme]` flips (MutationObserver). Self-mounting, memo,
 * reduced-motion safe (the matrix is static; lens + highlight are instant redraws).
 */

/* ════════════════════════════════════════════════════════════════════════
   Geometry — sized so the WHOLE widget fits a 1280×800 laptop viewport.
   ════════════════════════════════════════════════════════════════════════ */
const PADDING = 30; // outer gutter that holds the axis labels
const MAX_SIZE = 880; // the matrix is the hero — gigantic and central; the lens reads individual cells
const LUT_STEPS = 64; // resolution of the precomputed oklab heat ramp
const HEAT_FLOOR = 0.24; // every non-zero cell lifts to ≥ this fraction of the ramp (reads in light too)
const HEAT_GAMMA = 0.62; // eases the log-count above the floor

/* The count whose heat reads as "full" — picked so the everyday-bright pairs saturate while the few
   monster counts (e→space ≈ 7585) don't compress everything else into the floor. */
const HEAT_REF_COUNT = 700;

/* Lens (magnifier) */
const LENS_RADIUS = 84; // on-screen radius of the round magnifier
const LENS_SPAN = 9; // cells across the lens (odd → centered cell); 9 → ~18px cells, room for a count glyph

/* The flat tokens the canvas paints with (besides the heat LUT). Resolved once per theme to rgb. */
const PAINT_TOKENS = [
    "--bigram-bg-2", // empty cell (prob 0) — the detective's "dark"
    "--bigram-accent", // focus band / region ring + lit label
    "--bigram-accent-bright", // brightest heat (lens center marker)
    "--bigram-accent-ink", // uppercase axis label / count glyph
    "--bigram-ink-2", // lowercase axis label
    "--bigram-dim", // other (space / digits / punctuation) axis label
    "--bigram-sage", // the "never happens" mark for a locked empty cell
    "--bigram-elev", // lens chrome
    "--bigram-rule-2", // lens ring
    "--bigram-on-accent", // count glyph on a bright cell
] as const;

type PaintToken = (typeof PAINT_TOKENS)[number];
type RGB = [number, number, number];
type Palette = Record<PaintToken, RGB>;

/* The hidden rules the detective can chase. Each resolves to a SET of (row,col) cells.
   ORDER MATTERS: regionAt() returns the FIRST match, so the specific shapes (desert/q/period) come
   before the broad ones (space everywhere / number void). */
type RegionId =
    | "uppercaseDesert"
    | "qCorner"
    | "periodJump"
    | "spaceEverywhere"
    | "numberVoid";
const REGION_IDS: RegionId[] = [
    "uppercaseDesert",
    "qCorner",
    "periodJump",
    "spaceEverywhere",
    "numberVoid",
];

/* ════════════════════════════════════════════════════════════════════════
   Token bridge — resolve CSS custom properties + the oklab heat LUT to sRGB for canvas.
   ════════════════════════════════════════════════════════════════════════ */
interface Resolved {
    palette: Palette;
    /** Precomputed oklab heat ramp: LUT[i] = color-mix(in oklab, accent-bright (i/N*100)%, bg-2). */
    heatLut: RGB[];
    /** The mono font stack, fully resolved (the inner var() expanded) for canvas use. */
    monoFont: string;
}

/**
 * Resolve every paint token + the heat ramp under `scope` to sRGB rgb triples.
 *
 * Why a 1×1 canvas readback (not `getComputedStyle().color` parsing): the chapter's heat mixes in
 * OKLAB. In current Chrome, `getComputedStyle(el).color` returns that as a literal `oklab(L a b)`
 * string, NOT `rgb(...)`; naively parsing it reads L≈0.13 as an 8-bit channel → near-black (the old
 * invisible-square bug). Instead we let a `<canvas>` do the conversion: assigning ANY CSS color to
 * `ctx.fillStyle` and reading the pixel back yields a guaranteed sRGB triple. One source of truth.
 *
 * Font: `--bigram-font-mono` contains an inner `var(--font-jetbrains-mono)` which is INVALID in canvas
 * `ctx.font`; reading the computed value back expands it into a usable stack.
 */
function resolve(scope: HTMLElement): Resolved {
    const probe = document.createElement("span");
    probe.style.position = "absolute";
    probe.style.opacity = "0";
    probe.style.pointerEvents = "none";
    probe.style.fontFamily = "var(--bigram-font-mono)";
    scope.appendChild(probe);

    const scratch = document.createElement("canvas");
    scratch.width = 1;
    scratch.height = 1;
    const sctx = scratch.getContext("2d", { willReadFrequently: true });

    const toRGB = (cssColor: string): RGB => {
        probe.style.color = cssColor;
        const computed = getComputedStyle(probe).color;
        if (!sctx) return [0, 0, 0];
        sctx.clearRect(0, 0, 1, 1);
        sctx.fillStyle = "#000";
        sctx.fillStyle = computed; // canvas rasterizes oklab/lab/rgb → sRGB
        sctx.fillRect(0, 0, 1, 1);
        const d = sctx.getImageData(0, 0, 1, 1).data;
        return [d[0], d[1], d[2]];
    };

    const palette = {} as Palette;
    for (const token of PAINT_TOKENS) palette[token] = toRGB(`var(${token})`);

    const heatLut: RGB[] = [];
    for (let i = 0; i < LUT_STEPS; i++) {
        const pct = (i / (LUT_STEPS - 1)) * 100;
        heatLut.push(
            toRGB(
                `color-mix(in oklab, var(--bigram-accent-bright) ${pct}%, var(--bigram-bg-2))`,
            ),
        );
    }

    const monoFont =
        getComputedStyle(probe).fontFamily || "ui-monospace, monospace";
    scope.removeChild(probe);
    return { palette, heatLut, monoFont };
}

const css = ([r, g, b]: RGB) => `rgb(${r}, ${g}, ${b})`;
const rgba = ([r, g, b]: RGB, a: number) => `rgba(${r}, ${g}, ${b}, ${a})`;
const lerp = (a: RGB, b: RGB, t: number): RGB => [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
];

const LOG_REF = Math.log(HEAT_REF_COUNT + 1);

/**
 * The heat color for a raw integer `count`, via the precomputed oklab LUT.
 * Indexed by log(count) — the real corpus is brutally skewed, so a linear ramp would leave nearly the
 * whole table on the floor. Floor lift: any count ≥ 1 maps to ≥ HEAT_FLOOR of the ramp, so a weak-but-
 * real pair still reads in BOTH themes instead of vanishing into the cream/black empty tile.
 */
function heatRGB(count: number, lut: RGB[]): RGB {
    if (count <= 0) return lut[0];
    const norm = Math.min(1, Math.log(count + 1) / LOG_REF);
    const t = HEAT_FLOOR + (1 - HEAT_FLOOR) * Math.pow(norm, HEAT_GAMMA);
    const idx = Math.min(LUT_STEPS - 1, Math.round(t * (LUT_STEPS - 1)));
    return lut[idx];
}

/* ════════════════════════════════════════════════════════════════════════
   Region membership — derived ONCE from the real ALPHABET_92 indices.
   ════════════════════════════════════════════════════════════════════════ */
const isLower = (ch: string) => /[a-z]/.test(ch);
const isUpper = (ch: string) => /[A-Z]/.test(ch);

const isDigit = (ch: string) => /[0-9]/.test(ch);
const isLetter = (ch: string) => /[a-zA-Z]/.test(ch);

const REGION_GEOMETRY = (() => {
    const labels = ALPHABET_92;
    const lowerRows = new Set<number>();
    const upperCols = new Set<number>();
    labels.forEach((ch, i) => {
        if (isLower(ch)) lowerRows.add(i);
        if (isUpper(ch)) upperCols.add(i);
    });
    const qRow = labels.indexOf("q");
    const periodRow = labels.indexOf(".");
    const spaceRow = labels.indexOf(" ");

    const members: Record<RegionId, (r: number, c: number) => boolean> = {
        // The capital desert: every (lowercase row, uppercase col) cell.
        uppercaseDesert: (r, c) => lowerRows.has(r) && upperCols.has(c),
        // The q corner: the entire "q" row (one bright cell — u — the rest dark).
        qCorner: (r) => r === qRow,
        // The full-stop jump: the "." row, plus the space row → uppercase cols.
        periodJump: (r, c) =>
            r === periodRow || (r === spaceRow && upperCols.has(c)),
        // Space goes with everything: the entire space row AND space column.
        spaceEverywhere: (r, c) => r === spaceRow || c === spaceRow,
        // The number void: digit↔letter pairs almost never co-occur.
        numberVoid: (r, c) =>
            (isDigit(labels[r]) && isLetter(labels[c])) ||
            (isLetter(labels[r]) && isDigit(labels[c])),
    };
    return { members, lowerRows, upperCols, qRow, periodRow, spaceRow };
})();

/* regionAt — the FIRST region (in REGION_IDS order) whose predicate covers cell (r,c), else null. */
function regionAt(r: number, c: number): RegionId | null {
    for (const id of REGION_IDS) {
        if (REGION_GEOMETRY.members[id](r, c)) return id;
    }
    return null;
}

/* ════════════════════════════════════════════════════════════════════════
   Component
   ════════════════════════════════════════════════════════════════════════ */
export interface DetectiveMatrixProps {
    /** Parity with the chapter's opt-in accent convention. Already bigram-scoped. */
    accent?: "bigram";
}

export const DetectiveMatrix = memo(function DetectiveMatrix({
    accent = "bigram",
}: DetectiveMatrixProps = {}) {
    void accent; // parity with the chapter's opt-in convention; already bigram-scoped.
    const { t } = useI18n();
    const reduce = useReducedMotion();

    const counts = MATRIX_92.counts;
    const labels = MATRIX_92.viz.row_labels; // === col_labels === ALPHABET_92
    const n = labels.length;

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lensRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const resolvedRef = useRef<Resolved | null>(null);

    /* Live geometry shared by draw + hit-testing, recomputed on every draw. */
    const geomRef = useRef({ size: MAX_SIZE, cell: 1 });

    /* ── Interaction state ── */
    /* Cursor position (canvas-local px) + the cell under it + the board's on-screen size at that
       moment; drives the lens + readout. */
    const [cursor, setCursor] = useState<{
        x: number;
        y: number;
        r: number;
        c: number;
        size: number;
    } | null>(null);
    const [region, setRegion] = useState<RegionId | null>(null);
    /* The committed pick (set on click) — locks the whole row + column as a lit cross. */
    const [picked, setPicked] = useState<{ r: number; c: number } | null>(null);
    /* Quiet progress tracker — which named rules the detective has already brushed past or selected. */
    const [found, setFound] = useState<Set<RegionId>>(() => new Set());

    /* Idempotent: only ever grows the set, never thrashes state for an already-found rule. */
    const discover = useCallback((id: RegionId) => {
        setFound((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
    }, []);

    /* ════════════════════════════════════════════════════════════════════
       The base draw loop — paint the full heatmap once, then overlays.
       ════════════════════════════════════════════════════════════════════ */
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        const resolved = resolvedRef.current;
        if (!canvas || !container || !resolved) return;
        const { palette, heatLut, monoFont } = resolved;

        const dpr = window.devicePixelRatio || 1;
        const size = Math.min(container.clientWidth, MAX_SIZE);
        const cell = (size - PADDING * 2) / n;
        geomRef.current = { size, cell };

        canvas.width = size * dpr;
        canvas.height = size * dpr;
        canvas.style.width = `${size}px`;
        canvas.style.height = `${size}px`;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, size, size);

        const empty = heatLut[0];
        const accent = palette["--bigram-accent"];

        const regionMember = region ? REGION_GEOMETRY.members[region] : null;
        // A pick lights its whole row AND column (the GitHub-style cross).
        const inCross = (r: number, c: number) =>
            picked !== null && (r === picked.r || c === picked.c);
        const focusing = regionMember !== null || picked !== null;
        const isLit = (r: number, c: number) =>
            regionMember ? regionMember(r, c) : inCross(r, c);

        // 1 · paint the heat. When focusing, off-focus cells sink toward the empty tile so the focus
        //     reads as the only live area; lit cells keep full heat.
        for (let r = 0; r < n; r++) {
            for (let c = 0; c < n; c++) {
                const x = PADDING + c * cell;
                const y = PADDING + r * cell;
                const color = heatRGB(counts[r][c], heatLut);
                if (focusing && !isLit(r, c)) {
                    // 82% toward empty — a faint ghost remains so the board's structure is still felt.
                    ctx.fillStyle = css(lerp(color, empty, 0.82));
                } else {
                    ctx.fillStyle = css(color);
                }
                ctx.fillRect(x, y, cell, cell);
            }
        }

        // 2 · focus BAND — a bright translucent wash over the selected row/column/region. This is the
        //     fix for the broken highlight: it is INDEPENDENT of the cells' own heat, so even an almost-
        //     empty row (the q corner) is unmistakably selected.
        if (focusing) {
            ctx.fillStyle = rgba(accent, 0.16);
            if (picked) {
                ctx.fillRect(PADDING, PADDING + picked.r * cell, n * cell, cell); // row band
                ctx.fillRect(PADDING + picked.c * cell, PADDING, cell, n * cell); // col band
            } else if (regionMember) {
                for (let r = 0; r < n; r++) {
                    for (let c = 0; c < n; c++) {
                        if (regionMember(r, c)) {
                            ctx.fillRect(PADDING + c * cell, PADDING + r * cell, cell, cell);
                        }
                    }
                }
            }
        }

        // 3 · region outline — trace the focused shape so the rule reads as a contour.
        if (regionMember) {
            ctx.strokeStyle = rgba(accent, 0.95);
            ctx.lineWidth = Math.max(0.7, cell * 0.18);
            for (let r = 0; r < n; r++) {
                for (let c = 0; c < n; c++) {
                    if (regionMember(r, c)) {
                        ctx.strokeRect(
                            PADDING + c * cell + 0.5,
                            PADDING + r * cell + 0.5,
                            cell - 1,
                            cell - 1,
                        );
                    }
                }
            }
        }

        // 4 · the committed pick — the locked cross + a ring on the exact cell (sage if it never happens).
        if (picked) {
            const happened = counts[picked.r][picked.c] > 0;
            const ringColor = happened ? accent : palette["--bigram-sage"];
            // crisp guide lines down the row + column
            ctx.strokeStyle = rgba(ringColor, 0.55);
            ctx.lineWidth = Math.max(0.6, cell * 0.1);
            ctx.strokeRect(PADDING, PADDING + picked.r * cell + 0.5, n * cell, cell - 1);
            ctx.strokeRect(PADDING + picked.c * cell + 0.5, PADDING, cell - 1, n * cell);
            // the cell itself
            ctx.strokeStyle = rgba(ringColor, 1);
            ctx.lineWidth = Math.max(1.5, cell * 0.5);
            ctx.strokeRect(
                PADDING + picked.c * cell,
                PADDING + picked.r * cell,
                cell,
                cell,
            );
        }

        // 5 · axis labels — case-coded via tokens (the legible "capital desert").
        const labelFont = Math.min(cell * 0.94, 11);
        ctx.font = `${labelFont}px ${monoFont}`;

        const litRow = picked ? picked.r : region === "qCorner" ? REGION_GEOMETRY.qRow : -1;
        const litCol = picked ? picked.c : -1;
        const labelColor = (char: string, idx: number, axis: "row" | "col"): string => {
            const lit = axis === "row" ? idx === litRow : idx === litCol;
            if (lit) return rgba(accent, 1);
            if (isUpper(char)) return rgba(palette["--bigram-accent-ink"], 0.95);
            if (isLower(char)) return rgba(palette["--bigram-ink-2"], 0.85);
            return rgba(palette["--bigram-dim"], 0.78);
        };

        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        for (let c = 0; c < n; c++) {
            ctx.fillStyle = labelColor(labels[c], c, "col");
            ctx.fillText(displayChar(labels[c]), PADDING + c * cell + cell / 2, PADDING - 4);
        }
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        for (let r = 0; r < n; r++) {
            ctx.fillStyle = labelColor(labels[r], r, "row");
            ctx.fillText(displayChar(labels[r]), PADDING - 5, PADDING + r * cell + cell / 2);
        }
    }, [counts, n, labels, region, picked]);

    /* ════════════════════════════════════════════════════════════════════
       The lens — a round magnifier showing a 9×9 crop around the cursor, with
       the real COUNT painted inside every non-zero magnified cell (GitHub-heatmap style).
       ════════════════════════════════════════════════════════════════════ */
    const drawLens = useCallback(() => {
        const lens = lensRef.current;
        const resolved = resolvedRef.current;
        if (!lens || !resolved || !cursor) return;
        const { palette, heatLut, monoFont } = resolved;

        const dpr = window.devicePixelRatio || 1;
        const D = LENS_RADIUS * 2;
        lens.width = D * dpr;
        lens.height = D * dpr;
        lens.style.width = `${D}px`;
        lens.style.height = `${D}px`;

        const ctx = lens.getContext("2d");
        if (!ctx) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, D, D);

        // Circular clip.
        ctx.save();
        ctx.beginPath();
        ctx.arc(LENS_RADIUS, LENS_RADIUS, LENS_RADIUS, 0, Math.PI * 2);
        ctx.clip();

        ctx.fillStyle = css(heatLut[0]);
        ctx.fillRect(0, 0, D, D);

        const span = LENS_SPAN;
        const mag = D / span; // magnified cell size (~18.7px)
        const half = Math.floor(span / 2);
        const cr = cursor.r;
        const cc = cursor.c;
        const onAccent = palette["--bigram-on-accent"];
        const accentInk = palette["--bigram-accent-ink"];

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let dr = -half; dr <= half; dr++) {
            for (let dc = -half; dc <= half; dc++) {
                const r = cr + dr;
                const c = cc + dc;
                const x = (dc + half) * mag;
                const y = (dr + half) * mag;
                if (r < 0 || r >= n || c < 0 || c >= n) continue;
                const v = counts[r][c];
                ctx.fillStyle = css(heatRGB(v, heatLut));
                ctx.fillRect(x, y, mag - 1, mag - 1);
                // Paint the COUNT inside non-zero cells — the hero number, GitHub-style.
                if (v > 0) {
                    const label = v >= 1000 ? `${Math.round(v / 100) / 10}k` : `${v}`;
                    const fs =
                        label.length >= 4 ? mag * 0.34 : label.length === 3 ? mag * 0.4 : mag * 0.46;
                    ctx.font = `${fs}px ${monoFont}`;
                    // bright cells → ink-on-accent; faint cells → accent ink (legible on near-empty tile)
                    const norm = Math.min(1, Math.log(v + 1) / LOG_REF);
                    ctx.fillStyle = norm > 0.45 ? css(onAccent) : css(accentInk);
                    ctx.fillText(label, x + mag / 2, y + mag / 2 + 0.5);
                }
            }
        }

        // center crosshair box (the cell the cursor is on)
        const cx = half * mag;
        const cy = half * mag;
        ctx.strokeStyle = rgba(palette["--bigram-accent-bright"], 1);
        ctx.lineWidth = 2.5;
        ctx.strokeRect(cx + 1, cy + 1, mag - 2, mag - 2);

        ctx.restore();

        // ring
        ctx.beginPath();
        ctx.arc(LENS_RADIUS, LENS_RADIUS, LENS_RADIUS - 1, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(palette["--bigram-rule-2"], 1);
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [cursor, counts, n]);

    /* ── Theme bridge: resolve palette + LUT, re-resolve when [data-bigram-theme] flips ── */
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const scope =
            (container.closest("[data-bigram-theme]") as HTMLElement | null) ??
            container;

        const refresh = () => {
            resolvedRef.current = resolve(scope);
            draw();
            drawLens();
        };
        refresh();

        const observer = new MutationObserver(refresh);
        observer.observe(scope, {
            attributes: true,
            attributeFilter: ["data-bigram-theme"],
        });
        return () => observer.disconnect();
    }, [draw, drawLens]);

    /* ── Redraw base on resize + whenever interaction state changes ── */
    useEffect(() => {
        draw();
        const onResize = () => {
            draw();
            drawLens();
        };
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, [draw, drawLens]);

    /* ── Redraw the lens whenever the cursor moves ── */
    useEffect(() => {
        drawLens();
    }, [drawLens]);

    /* ── Hit-testing ── */
    const cellAt = useCallback(
        (clientX: number, clientY: number): { r: number; c: number } | null => {
            const canvas = canvasRef.current;
            if (!canvas) return null;
            const rect = canvas.getBoundingClientRect();
            const { cell } = geomRef.current;
            const c = Math.floor((clientX - rect.left - PADDING) / cell);
            const r = Math.floor((clientY - rect.top - PADDING) / cell);
            if (r < 0 || r >= n || c < 0 || c >= n) return null;
            return { r, c };
        },
        [n],
    );

    const onMove = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            const hit = cellAt(e.clientX, e.clientY);
            if (!hit) {
                setCursor(null);
                return;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            setCursor({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
                r: hit.r,
                c: hit.c,
                size: rect.width,
            });
            // Hovering a cell that belongs to a named rule quietly marks it discovered.
            const id = regionAt(hit.r, hit.c);
            if (id) discover(id);
        },
        [cellAt, discover],
    );

    const onClick = useCallback(
        (e: React.MouseEvent<HTMLCanvasElement>) => {
            const hit = cellAt(e.clientX, e.clientY);
            if (!hit) return;
            // click the same cell again to release the lock
            setPicked((cur) => (cur && cur.r === hit.r && cur.c === hit.c ? null : hit));
            setRegion(null);
        },
        [cellAt],
    );

    /* ── Region select / clear ── */
    const selectRegion = useCallback(
        (id: RegionId) => {
            setRegion((cur) => (cur === id ? null : id));
            setPicked(null);
            discover(id);
        },
        [discover],
    );

    const clearAll = useCallback(() => {
        setRegion(null);
        setPicked(null);
    }, []);

    const hasFocus = region !== null || picked !== null;

    /* ── The committed answer line for a clicked cell ── */
    const pickAnswer = useMemo(() => {
        if (!picked) return null;
        const row = displayChar(labels[picked.r]);
        const col = displayChar(labels[picked.c]);
        const count = counts[picked.r][picked.c];
        const key =
            count > 0
                ? "bigramNarrative.v2.detective.cellCount"
                : "bigramNarrative.v2.detective.cellNever";
        return { text: t(key, { row, col, n: count }), never: count === 0 };
    }, [picked, labels, counts, t]);

    /* ── Live readout for the cell under the lens — the COUNT is the hero. ── */
    const tip = useMemo(() => {
        if (!cursor) return null;
        const count = counts[cursor.r][cursor.c];
        const id = regionAt(cursor.r, cursor.c);
        return {
            row: displayChar(labels[cursor.r]),
            col: displayChar(labels[cursor.c]),
            count,
            zero: count <= 0,
            why: id ? t(`bigramNarrative.v2.detective.regions.${id}.hint`) : null,
        };
    }, [cursor, counts, labels, t]);

    const transitionEase = reduce ? "none" : "opacity .25s ease";

    /* What the persistent readout shows: the locked pick if any, else the hovered cell, else a hint. */
    const timesLabel = t("bigramNarrative.v2.detective.timesLabel");
    const neverLabel = t("bigramNarrative.v2.detective.never");
    const readout = useMemo(() => {
        const source = picked
            ? { r: picked.r, c: picked.c, locked: true as const }
            : cursor
              ? { r: cursor.r, c: cursor.c, locked: false as const }
              : null;
        if (!source) return null;
        const count = counts[source.r][source.c];
        return {
            row: displayChar(labels[source.r]),
            col: displayChar(labels[source.c]),
            count,
            zero: count <= 0,
            locked: source.locked,
        };
    }, [picked, cursor, counts, labels]);

    /* Lens placement: hug the cursor but stay inside the canvas box. */
    const lensPos = useMemo(() => {
        if (!cursor) return null;
        const size = cursor.size;
        const D = LENS_RADIUS * 2;
        let left = cursor.x + 20;
        let top = cursor.y - D - 14;
        if (left + D > size) left = cursor.x - D - 20;
        if (top < 0) top = cursor.y + 20;
        if (left < 0) left = 4;
        if (left + D > size) left = Math.max(4, size - D - 4);
        return { left, top };
    }, [cursor]);

    return (
        <div className="bw-detective">
            <style>{DETECTIVE_CSS}</style>

            {/* No eyebrow / intro here: the framing is now narrative BODY before this widget
                (detective.intro is rendered as a <P> in BigramNarrative). The visual is the hero. */}

            {/* ── Two columns on desktop: the matrix, and the detective panel ── */}
            <div className="bw-detective__layout">
                {/* The matrix — the focal point */}
                <div className="bw-detective__stage">
                    <div ref={containerRef} className="bw-detective__canvasWrap">
                        <canvas
                            ref={canvasRef}
                            className="bw-detective__canvas"
                            onMouseMove={onMove}
                            onMouseLeave={() => setCursor(null)}
                            onClick={onClick}
                            aria-label={t("bigramNarrative.v2.detective.label")}
                        />

                        {/* The magnifier lens */}
                        {cursor && lensPos && (
                            <div
                                className="bw-detective__lens"
                                style={{ left: lensPos.left, top: lensPos.top }}
                            >
                                <canvas ref={lensRef} className="bw-detective__lensCanvas" />
                                {tip && (
                                    <div className="bw-detective__lensTag">
                                        <div className="bw-detective__lensTagMain">
                                            <b>{tip.row}</b>
                                            <span className="bw-detective__lensArrow">→</span>
                                            <b>{tip.col}</b>
                                            <span
                                                className={
                                                    tip.zero
                                                        ? "bw-detective__lensCount bw-detective__lensCount--zero"
                                                        : "bw-detective__lensCount"
                                                }
                                            >
                                                {tip.zero ? neverLabel : `${tip.count} ${timesLabel}`}
                                            </span>
                                        </div>
                                        {tip.why && (
                                            <span className="bw-detective__lensWhy">
                                                {tip.why}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* The detective panel: hero readout, the quest, the clue chips, the explanation */}
                <div className="bw-detective__panel">
                    {/* Hero readout — the COUNT, where you look */}
                    <div className="bw-detective__readout" aria-live="polite">
                        {readout ? (
                            <>
                                <span className="bw-detective__pair">
                                    <b>{readout.row}</b>
                                    <span className="bw-detective__pairArrow">→</span>
                                    <b>{readout.col}</b>
                                </span>
                                {readout.zero ? (
                                    <span className="bw-detective__big bw-detective__big--never">
                                        {neverLabel}
                                    </span>
                                ) : (
                                    <span className="bw-detective__big">
                                        {readout.count.toLocaleString("es")}
                                        <span className="bw-detective__bigUnit">{timesLabel}</span>
                                    </span>
                                )}
                            </>
                        ) : (
                            <span className="bw-detective__readoutHint">
                                {t("bigramNarrative.v2.detective.inspectHint")}
                            </span>
                        )}
                    </div>

                    {/* The committed answer line (after a click) */}
                    <div className="bw-detective__answerSlot" aria-live="polite">
                        {pickAnswer && (
                            <p
                                className={
                                    pickAnswer.never
                                        ? "bw-detective__answer bw-detective__answer--never"
                                        : "bw-detective__answer"
                                }
                                style={{ transition: transitionEase }}
                            >
                                {pickAnswer.text}
                            </p>
                        )}
                    </div>

                    {/* The prompt — the detective's quest */}
                    <p className="bw-detective__prompt">
                        {t("bigramNarrative.v2.detective.prompt")}
                    </p>

                    {/* Region presets — chase a hidden rule */}
                    <div className="bw-detective__regions">
                        <span className="bw-detective__regionsLabel">
                            {t("bigramNarrative.v2.detective.regionsLabel")}
                        </span>
                        <div className="bw-detective__chips">
                            {REGION_IDS.map((id) => {
                                const on = region === id;
                                const isFound = found.has(id);
                                const cls = [
                                    "bw-detective__chip",
                                    on ? "bw-detective__chip--on" : "",
                                    isFound ? "bw-detective__chip--found" : "",
                                ]
                                    .filter(Boolean)
                                    .join(" ");
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        className={cls}
                                        aria-pressed={on}
                                        onClick={() => selectRegion(id)}
                                    >
                                        {isFound && (
                                            <span
                                                className="bw-detective__chipDot"
                                                aria-hidden="true"
                                            />
                                        )}
                                        {t(`bigramNarrative.v2.detective.regions.${id}.title`)}
                                    </button>
                                );
                            })}
                            {hasFocus && (
                                <button
                                    type="button"
                                    className="bw-detective__clear"
                                    onClick={clearAll}
                                >
                                    {t("bigramNarrative.v2.detective.clear")}
                                </button>
                            )}
                        </div>
                        <p className="bw-detective__tracker" aria-live="polite">
                            {t("bigramNarrative.v2.detective.rulesLabel")}
                            {" · "}
                            {t("bigramNarrative.v2.detective.rulesFound", {
                                n: found.size,
                                total: REGION_IDS.length,
                            })}
                        </p>
                    </div>

                    {/* The region's explanation */}
                    <div className="bw-detective__explainSlot" aria-live="polite">
                        {region && (
                            <div
                                className="bw-detective__explain"
                                style={{ transition: transitionEase }}
                            >
                                <h4 className="bw-detective__explainTitle">
                                    {t(`bigramNarrative.v2.detective.regions.${region}.title`)}
                                </h4>
                                <p className="bw-detective__explainBody">
                                    {t(`bigramNarrative.v2.detective.regions.${region}.body`)}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default DetectiveMatrix;

/* ════════════════════════════════════════════════════════════════════════
   Scoped styles — token-only, no literals. Light + dark both resolve through
   the chapter's [data-bigram-theme] scope.
   ════════════════════════════════════════════════════════════════════════ */
const DETECTIVE_CSS = `
.bw-detective {
    font-family: var(--bigram-font-serif);
    color: var(--bigram-body);
    max-width: 960px;
    margin: 0 auto;
}
.bw-detective__eyebrow {
    font-family: var(--bigram-font-mono);
    font-size: 11px;
    letter-spacing: .2em;
    text-transform: uppercase;
    color: var(--bigram-muted);
    text-align: center;
    margin: 0 0 8px;
}
.bw-detective__intro {
    font-family: var(--bigram-font-serif);
    font-size: 15.5px;
    line-height: 1.5;
    color: var(--bigram-body);
    max-width: 62ch;
    margin: 0 auto 20px;
    text-align: center;
    text-wrap: pretty;
}
.bw-detective__layout {
    /* The matrix is the hero: it sits on top, gigantic and centered; the detective panel
       (readout · quest · clue chips · explanation) stacks BELOW it and may run off-screen —
       what matters is the table, not cramming everything into one screen. */
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}
.bw-detective__stage {
    width: 100%;
    display: flex;
    justify-content: center;
}
.bw-detective__canvasWrap {
    position: relative;
    width: ${MAX_SIZE}px;
    max-width: 100%;
    display: flex;
    justify-content: center;
    border-radius: var(--bigram-r-lg);
    background: var(--bigram-bg-2);
    box-shadow: inset 0 1px 8px rgba(0,0,0,.28);
    padding: 10px;
}
.bw-detective__canvas {
    display: block;
    cursor: crosshair;
    border-radius: var(--bigram-r-md);
}
.bw-detective__lens {
    position: absolute;
    z-index: 20;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 7px;
}
.bw-detective__lensCanvas {
    display: block;
    border-radius: 50%;
    box-shadow:
        0 14px 34px -12px rgba(0,0,0,.6),
        0 0 0 1px var(--bigram-rule-2);
}
.bw-detective__lensTag {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 0;
    max-width: 25ch;
    padding: 9px 15px;
    border-radius: var(--bigram-r-lg);
    background: color-mix(in oklab, var(--bigram-elev) 90%, var(--bigram-accent) 10%);
    box-shadow:
        0 16px 34px -16px rgba(0,0,0,.62),
        inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 24%, var(--bigram-rule-2));
    font-family: var(--bigram-font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 13px;
    color: var(--bigram-muted);
}
.bw-detective__lensTagMain {
    display: inline-flex;
    align-items: baseline;
    gap: 7px;
    white-space: nowrap;
}
.bw-detective__lensWhy {
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid color-mix(in oklab, var(--bigram-accent) 26%, transparent);
    font-family: var(--bigram-font-serif);
    font-style: italic;
    font-size: 12.5px;
    font-weight: 400;
    line-height: 1.4;
    color: var(--bigram-accent-ink);
    text-align: center;
    text-wrap: pretty;
}
.bw-detective__lensTag b {
    color: var(--bigram-accent-ink);
    font-weight: 700;
    font-size: 14.5px;
}
.bw-detective__lensArrow {
    color: var(--bigram-dim);
    font-size: 11px;
}
.bw-detective__lensCount {
    color: var(--bigram-ink);
    font-weight: 700;
}
.bw-detective__lensCount--zero {
    color: var(--bigram-sage);
    font-weight: 700;
}

/* ── Detective panel — stacked BELOW the matrix, centered ── */
.bw-detective__panel {
    width: 100%;
    max-width: 620px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
}
.bw-detective__readout {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 14px;
    padding: 12px 22px;
    border-radius: var(--bigram-r-lg);
    background: var(--bigram-surface);
    box-shadow: inset 0 0 0 1px var(--bigram-rule-2);
    min-height: 56px;
}
.bw-detective__pair {
    display: inline-flex;
    align-items: baseline;
    gap: 6px;
    font-family: var(--bigram-font-mono);
    font-size: 15px;
    color: var(--bigram-muted);
}
.bw-detective__pair b {
    color: var(--bigram-accent-ink);
    font-weight: 700;
    font-size: 17px;
}
.bw-detective__pairArrow {
    color: var(--bigram-dim);
    font-size: 12px;
}
.bw-detective__big {
    font-family: var(--bigram-font-mono);
    font-variant-numeric: tabular-nums;
    font-size: 34px;
    font-weight: 700;
    line-height: 1.05;
    color: var(--bigram-accent-ink);
    display: inline-flex;
    align-items: baseline;
    gap: 7px;
}
.bw-detective__bigUnit {
    font-size: 13px;
    font-weight: 500;
    letter-spacing: .04em;
    color: var(--bigram-muted);
    text-transform: lowercase;
}
.bw-detective__big--never {
    color: var(--bigram-sage);
    font-size: 26px;
    letter-spacing: .01em;
}
.bw-detective__readoutHint {
    font-family: var(--bigram-font-serif);
    font-style: italic;
    font-size: 14px;
    line-height: 1.45;
    color: var(--bigram-muted);
    text-wrap: pretty;
}
.bw-detective__answerSlot {
    min-height: 22px;
    margin-top: 10px;
}
.bw-detective__answer {
    font-family: var(--bigram-font-mono);
    font-size: 13px;
    line-height: 1.45;
    color: var(--bigram-accent-ink);
    margin: 0;
    text-wrap: pretty;
}
.bw-detective__answer--never {
    color: var(--bigram-sage);
    font-weight: 600;
}
.bw-detective__prompt {
    font-family: var(--bigram-font-serif);
    font-style: italic;
    font-size: 15.5px;
    line-height: 1.5;
    color: var(--bigram-ink-2);
    margin: 18px 0 0;
    text-wrap: pretty;
}
.bw-detective__regions {
    display: flex;
    flex-direction: column;
    gap: 9px;
    margin-top: 16px;
}
.bw-detective__regionsLabel {
    font-family: var(--bigram-font-mono);
    font-size: 10.5px;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--bigram-muted);
}
.bw-detective__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 7px;
}
.bw-detective__chip {
    font-family: var(--bigram-font-mono);
    font-size: 12px;
    letter-spacing: .01em;
    padding: 8px 13px;
    border: 0;
    border-radius: var(--bigram-r-pill);
    cursor: pointer;
    color: var(--bigram-ink-2);
    background: var(--bigram-surface);
    box-shadow: inset 0 0 0 1px var(--bigram-rule-2);
    transition: background .2s ease, color .2s ease, box-shadow .2s ease;
}
.bw-detective__chip:hover {
    color: var(--bigram-accent-ink);
    box-shadow: inset 0 0 0 1px var(--bigram-accent);
}
.bw-detective__chip--on {
    color: var(--bigram-on-accent);
    background: var(--bigram-accent);
    box-shadow: 0 6px 16px -8px color-mix(in oklab, var(--bigram-accent) 70%, transparent);
}
.bw-detective__chip--on:hover {
    color: var(--bigram-on-accent);
    box-shadow: 0 6px 16px -8px color-mix(in oklab, var(--bigram-accent) 70%, transparent);
}
/* A rule already brushed past or selected — a calm accent edge + a small filled dot. */
.bw-detective__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
}
.bw-detective__chip--found:not(.bw-detective__chip--on) {
    color: var(--bigram-accent-ink);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 42%, transparent);
}
.bw-detective__chipDot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--bigram-accent);
    flex: none;
}
.bw-detective__chip--on .bw-detective__chipDot {
    background: var(--bigram-on-accent);
}
.bw-detective__tracker {
    font-family: var(--bigram-font-mono);
    font-size: 10.5px;
    letter-spacing: .04em;
    color: var(--bigram-muted);
    margin: 9px 0 0;
}
.bw-detective__clear {
    font-family: var(--bigram-font-mono);
    font-size: 11px;
    letter-spacing: .06em;
    padding: 8px 13px;
    border: 0;
    border-radius: var(--bigram-r-pill);
    cursor: pointer;
    color: var(--bigram-muted);
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--bigram-rule-2);
    transition: color .2s ease, box-shadow .2s ease;
}
.bw-detective__clear:hover {
    color: var(--bigram-ink-2);
    box-shadow: inset 0 0 0 1px var(--bigram-accent);
}
.bw-detective__explainSlot {
    margin-top: 14px;
}
.bw-detective__explain {
    padding: 14px 16px;
    border-radius: var(--bigram-r-lg);
    background: linear-gradient(135deg, var(--bigram-accent-soft), transparent 86%);
    box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--bigram-accent) 26%, transparent);
}
.bw-detective__explainTitle {
    font-family: var(--bigram-font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--bigram-accent-ink);
    margin: 0 0 5px;
}
.bw-detective__explainBody {
    font-family: var(--bigram-font-serif);
    font-size: 14px;
    line-height: 1.5;
    color: var(--bigram-body);
    margin: 0;
    text-wrap: pretty;
}
@media (max-width: 720px) {
    .bw-detective__panel {
        max-width: ${MAX_SIZE}px;
        flex-basis: 100%;
    }
}
@media (prefers-reduced-motion: reduce) {
    .bw-detective__chip,
    .bw-detective__clear,
    .bw-detective__answer,
    .bw-detective__explain { transition: none !important; }
}
`;
