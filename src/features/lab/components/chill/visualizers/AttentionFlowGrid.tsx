"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/i18n/context";

const TOKENS = ["the", "cat", "sat", "on", "the", "mat"];
const AUTO_CYCLE_MS = 1600;

type Hover = { row: number; col: number } | null;

interface AttnCell {
    row: number;
    col: number;
    pair: string;
    weight: number;
    alpha: number;
}

/**
 * Era III visualizer. 6×6 self-attention grid over a fixed sentence.
 * - Distance-based weights with a small bump for repeated tokens, normalized per row.
 * - Auto-cycles one query row at a time every 1.6s; cycle pauses on hover, resumes on leave.
 * - Pauses entirely when offscreen.
 */
export function AttentionFlowGrid() {
    const { t } = useI18n();
    const gridRef = useRef<HTMLDivElement | null>(null);
    const [hover, setHover] = useState<Hover>(null);
    const [activeRow, setActiveRow] = useState(0);
    const [autoOn, setAutoOn] = useState(false);

    const cells = useMemo<AttnCell[]>(() => {
        const out: AttnCell[] = [];
        TOKENS.forEach((qt, i) => {
            const raw = TOKENS.map((kt, j) => {
                const d = Math.abs(i - j);
                const base = Math.exp(-d * 0.55);
                const bump = qt === kt && i !== j ? 0.4 : 0;
                return base + bump;
            });
            const sum = raw.reduce((s, v) => s + v, 0);
            raw.forEach((v, j) => {
                const w = v / sum;
                const alpha = Math.max(0.06, Math.min(0.95, w * 1.6));
                out.push({
                    row: i,
                    col: j,
                    pair: `"${TOKENS[i]}" → "${TOKENS[j]}"`,
                    weight: w,
                    alpha,
                });
            });
        });
        return out;
    }, []);

    // Offscreen pause via IntersectionObserver
    useEffect(() => {
        const el = gridRef.current;
        if (!el) return;
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => setAutoOn(entry.isIntersecting));
            },
            { threshold: 0.05 }
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);

    // Auto row cycle (paused while user hovers OR while offscreen)
    useEffect(() => {
        if (!autoOn || hover !== null) return;
        const id = window.setInterval(() => {
            setActiveRow((r) => (r + 1) % TOKENS.length);
        }, AUTO_CYCLE_MS);
        return () => window.clearInterval(id);
    }, [autoOn, hover]);

    const hint = hover
        ? (() => {
              const cell = cells[hover.row * TOKENS.length + hover.col];
              return (
                  <>
                      <span className="pair">{cell.pair}</span>
                      weight {cell.weight.toFixed(2)}
                  </>
              );
          })()
        : t("lab.landing.chill.eras.attention.terminalHintIdle");

    const hasHover = hover !== null;
    const hasActive = !hasHover; // only show row-active highlight in auto mode

    return (
        <div className="bigram-map">
            <div className="bigram-hint">{hint}</div>
            <div
                ref={gridRef}
                className={`attn-grid${hasHover ? " has-hover" : ""}${hasActive ? " has-active" : ""}`}
                role="grid"
                aria-label="Self-attention weights heatmap"
                onMouseLeave={() => setHover(null)}
            >
                {/* empty corner */}
                <div />
                {/* column headers */}
                {TOKENS.map((c, j) => (
                    <div
                        key={`hdr-${j}`}
                        className={`hdr${hasHover && hover!.col === j ? " highlight" : ""}`}
                    >
                        {c}
                    </div>
                ))}
                {/* rows */}
                {TOKENS.map((rowTok, i) => (
                    <AttnRow
                        key={`row-${i}`}
                        rowTok={rowTok}
                        rowIndex={i}
                        cells={cells}
                        hover={hover}
                        setHover={setHover}
                        activeRow={activeRow}
                        showActive={hasActive}
                    />
                ))}
            </div>
        </div>
    );
}

function AttnRow({
    rowTok,
    rowIndex,
    cells,
    hover,
    setHover,
    activeRow,
    showActive,
}: {
    rowTok: string;
    rowIndex: number;
    cells: AttnCell[];
    hover: Hover;
    setHover: (h: Hover) => void;
    activeRow: number;
    showActive: boolean;
}) {
    const hasHover = hover !== null;
    const isRowActive = showActive && rowIndex === activeRow;
    return (
        <>
            <div
                className={[
                    "lbl",
                    hasHover && hover!.row === rowIndex ? "highlight" : "",
                    isRowActive ? "row-active" : "",
                ]
                    .filter(Boolean)
                    .join(" ")}
            >
                {rowTok}
            </div>
            {TOKENS.map((_, j) => {
                const flat = rowIndex * TOKENS.length + j;
                const cell = cells[flat];
                const isHover = hasHover && hover!.row === rowIndex && hover!.col === j;
                const isRowHover = hasHover && hover!.row === rowIndex;
                const isColHover = hasHover && hover!.col === j;
                const cls = [
                    "cell",
                    isHover ? "hover" : "",
                    isRowHover ? "row-hover" : "",
                    isColHover ? "col-hover" : "",
                    isRowActive ? "row-active" : "",
                ]
                    .filter(Boolean)
                    .join(" ");
                return (
                    <div
                        key={`cell-${rowIndex}-${j}`}
                        className={cls}
                        style={{ ["--a" as string]: cell.alpha.toFixed(3) }}
                        onMouseEnter={() => setHover({ row: rowIndex, col: j })}
                        aria-label={`${cell.pair} weight ${cell.weight.toFixed(2)}`}
                        role="gridcell"
                    />
                );
            })}
        </>
    );
}
