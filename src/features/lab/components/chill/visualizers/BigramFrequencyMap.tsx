"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/i18n/context";

const COLS = ["e", "t", "a", "o", "i", "n", "s", "r", "h", "l"];
const ROWS = ["t", "h", "a", "s", "i", "n", "o", "r", "e", "c"];
const PULSE_INTERVAL_MS = 1400;

type Hover = { row: number; col: number } | null;

interface CellDatum {
    row: number;
    col: number;
    pair: string;
    freq: number;
    alpha: number;
}

/**
 * Era I visualizer. 10×10 deterministic bigram frequency heatmap.
 * - Hover row+col headers + cell light up; non-row/non-col cells dim.
 * - One random cell pulses every 1.4s (paused while offscreen via IntersectionObserver).
 * - Frequencies use the same seed formula as the source HTML so visuals match.
 */
export function BigramFrequencyMap() {
    const { t } = useI18n();
    const gridRef = useRef<HTMLDivElement | null>(null);
    const [hover, setHover] = useState<Hover>(null);
    const [pulseIdx, setPulseIdx] = useState<number | null>(null);

    const cells = useMemo<CellDatum[]>(() => {
        const out: CellDatum[] = [];
        ROWS.forEach((r, i) => {
            COLS.forEach((c, j) => {
                const seed = (i * 17 + j * 31 + r.charCodeAt(0) + c.charCodeAt(0)) % 100;
                const common =
                    (r === "t" && c === "h") ||
                    (r === "h" && c === "e") ||
                    (r === "i" && c === "n") ||
                    (r === "e" && c === "r") ||
                    (r === "o" && c === "n") ||
                    (r === "a" && c === "n");
                const freq = common ? 70 + (seed % 30) : Math.max(5, seed - 10);
                const alpha = Math.max(0.08, Math.min(0.95, freq / 100)) * 0.45;
                out.push({ row: i, col: j, pair: `"${r}" → "${c}"`, freq, alpha });
            });
        });
        return out;
    }, []);

    // Ambient pulse — paused when offscreen.
    useEffect(() => {
        const el = gridRef.current;
        if (!el) return;

        let intervalId: number | undefined;
        const start = () => {
            if (intervalId !== undefined) return;
            intervalId = window.setInterval(() => {
                setPulseIdx(Math.floor(Math.random() * cells.length));
            }, PULSE_INTERVAL_MS);
        };
        const stop = () => {
            if (intervalId !== undefined) {
                window.clearInterval(intervalId);
                intervalId = undefined;
            }
        };

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
            },
            { threshold: 0.05 }
        );
        io.observe(el);

        return () => {
            io.disconnect();
            stop();
        };
    }, [cells.length]);

    const hint = hover
        ? (() => {
              const cell = cells[hover.row * COLS.length + hover.col];
              return (
                  <>
                      <span className="pair">{cell.pair}</span>
                      freq {cell.freq}
                  </>
              );
          })()
        : t("lab.landing.chill.eras.counting.terminalHintIdle");

    const hasHover = hover !== null;

    return (
        <div className="bigram-map">
            <div className="bigram-hint">{hint}</div>
            <div
                ref={gridRef}
                className={`bigram-grid${hasHover ? " has-hover" : ""}`}
                role="grid"
                aria-label="Bigram frequency heatmap"
                onMouseLeave={() => setHover(null)}
            >
                {/* empty corner */}
                <div />
                {/* column headers */}
                {COLS.map((c, j) => (
                    <div
                        key={`hdr-${j}`}
                        className={`hdr${hasHover && hover!.col === j ? " highlight" : ""}`}
                    >
                        {c}
                    </div>
                ))}
                {/* rows */}
                {ROWS.map((r, i) => (
                    <RowFragment
                        key={`row-${i}`}
                        rowChar={r}
                        rowIndex={i}
                        cells={cells}
                        hover={hover}
                        setHover={setHover}
                        pulseIdx={pulseIdx}
                    />
                ))}
            </div>
        </div>
    );
}

function RowFragment({
    rowChar,
    rowIndex,
    cells,
    hover,
    setHover,
    pulseIdx,
}: {
    rowChar: string;
    rowIndex: number;
    cells: CellDatum[];
    hover: Hover;
    setHover: (h: Hover) => void;
    pulseIdx: number | null;
}) {
    const hasHover = hover !== null;
    return (
        <>
            <div className={`lbl${hasHover && hover!.row === rowIndex ? " highlight" : ""}`}>{rowChar}</div>
            {COLS.map((_, j) => {
                const flatIdx = rowIndex * COLS.length + j;
                const cell = cells[flatIdx];
                const isHover = hasHover && hover!.row === rowIndex && hover!.col === j;
                const isRowHover = hasHover && hover!.row === rowIndex;
                const isColHover = hasHover && hover!.col === j;
                const isPulse = pulseIdx === flatIdx;
                const cls = [
                    "cell",
                    isHover ? "hover" : "",
                    isRowHover ? "row-hover" : "",
                    isColHover ? "col-hover" : "",
                    isPulse ? "pulse" : "",
                ]
                    .filter(Boolean)
                    .join(" ");
                return (
                    <div
                        key={`cell-${rowIndex}-${j}`}
                        className={cls}
                        style={{ ["--a" as string]: cell.alpha.toFixed(3) }}
                        onMouseEnter={() => setHover({ row: rowIndex, col: j })}
                        aria-label={`${cell.pair} frequency ${cell.freq}`}
                        role="gridcell"
                    />
                );
            })}
        </>
    );
}
