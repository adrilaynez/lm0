"use client";

import { useEffect, useRef } from "react";

const LAYERS = [5, 5, 5, 3];
const EDGES_PER_NODE = 2;       // sparse forward connectivity
const CYCLE_MS = 10_000;        // full traversal time — slow / contemplative
const SIGMA = 0.45;             // gaussian width (active band)
const ACCENT_RGB = "224, 182, 111"; // amber — Era II accent

interface NodeRec {
    x: number;
    y: number;
    layer: number;
    idx: number;
    connects: number[];
}

/**
 * Era II visualizer. Canvas-based forward-pass wave through a sparse 4-layer
 * MLP. Same algorithm as the source HTML: gaussian activation peaks per layer,
 * edge glow peaks between layers, cyclic over CYCLE_MS. Pauses offscreen.
 */
export function MLPForwardWave() {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const wrapRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const wrap = wrapRef.current;
        if (!canvas || !wrap) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let nodes: NodeRec[] = [];
        let waveT = 0;
        let lastTs = 0;
        let raf = 0;
        let running = false;

        const resize = () => {
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = wrap.clientWidth;
            height = 400;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);

            const padX = 60;
            const padY = 44;
            const usableW = width - padX * 2;
            const usableH = height - padY * 2;

            nodes = [];
            LAYERS.forEach((count, li) => {
                const x = padX + usableW * (LAYERS.length === 1 ? 0.5 : li / (LAYERS.length - 1));
                for (let i = 0; i < count; i++) {
                    const y = padY + usableH * (count === 1 ? 0.5 : i / (count - 1));
                    const node: NodeRec = { x, y, layer: li, idx: i, connects: [] };
                    if (li < LAYERS.length - 1) {
                        const nextCount = LAYERS[li + 1];
                        const picks = new Set<number>();
                        const targetEdges = Math.min(EDGES_PER_NODE, nextCount);
                        while (picks.size < targetEdges) picks.add(Math.floor(Math.random() * nextCount));
                        node.connects = Array.from(picks);
                    }
                    nodes.push(node);
                }
            });
        };

        const nodeActivation = (layerIdx: number) => {
            const len = LAYERS.length;
            const rawD = waveT - layerIdx;
            const d = Math.min(Math.abs(rawD), Math.abs(rawD - len), Math.abs(rawD + len));
            return Math.exp(-(d * d) / (2 * SIGMA * SIGMA));
        };

        const edgeActivation = (fromLayer: number) => {
            const mid = fromLayer + 0.5;
            const len = LAYERS.length;
            const rawD = waveT - mid;
            const d = Math.min(Math.abs(rawD), Math.abs(rawD - len), Math.abs(rawD + len));
            return Math.exp(-(d * d) / (2 * 0.35 * 0.35));
        };

        const tick = (now: number) => {
            if (!running) return;
            if (!width) {
                raf = window.requestAnimationFrame(tick);
                return;
            }
            const dt = lastTs ? Math.min(now - lastTs, 64) : 16;
            lastTs = now;
            const speed = LAYERS.length / CYCLE_MS;
            waveT = (waveT + speed * dt) % LAYERS.length;

            ctx.clearRect(0, 0, width, height);

            // edges
            for (const a of nodes) {
                if (a.layer === LAYERS.length - 1 || a.connects.length === 0) continue;
                const eAct = edgeActivation(a.layer);
                const nextLayerNodes = nodes.filter((n) => n.layer === a.layer + 1);
                for (const bIdx of a.connects) {
                    const b = nextLayerNodes[bIdx];
                    if (!b) continue;
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${(0.06 + eAct * 0.7).toFixed(3)})`;
                    ctx.lineWidth = 1 + eAct * 1.0;
                    ctx.stroke();
                }
            }

            // nodes
            for (const n of nodes) {
                const act = nodeActivation(n.layer);
                const isOut = n.layer === LAYERS.length - 1;
                const outerR = isOut ? 12 : 10;
                const innerR = isOut ? 4.5 : 3.5;

                ctx.beginPath();
                ctx.arc(n.x, n.y, outerR, 0, Math.PI * 2);
                ctx.lineWidth = 1.2 + act * 1.6;
                ctx.strokeStyle = `rgba(${ACCENT_RGB}, ${(0.15 + act * 0.85).toFixed(3)})`;
                if (act > 0.4) {
                    ctx.shadowColor = `rgba(${ACCENT_RGB}, 0.7)`;
                    ctx.shadowBlur = 14 * act;
                }
                ctx.stroke();
                ctx.shadowBlur = 0;

                ctx.beginPath();
                ctx.arc(n.x, n.y, innerR, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${ACCENT_RGB}, ${(0.22 + act * 0.78).toFixed(3)})`;
                ctx.fill();
            }

            raf = window.requestAnimationFrame(tick);
        };

        const start = () => {
            if (running) return;
            running = true;
            lastTs = 0;
            raf = window.requestAnimationFrame(tick);
        };
        const stop = () => {
            running = false;
            if (raf) {
                window.cancelAnimationFrame(raf);
                raf = 0;
            }
        };

        resize();
        window.addEventListener("resize", resize);

        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => (entry.isIntersecting ? start() : stop()));
            },
            { threshold: 0.05 }
        );
        io.observe(canvas);

        return () => {
            window.removeEventListener("resize", resize);
            io.disconnect();
            stop();
        };
    }, []);

    return (
        <div ref={wrapRef} style={{ width: "100%" }}>
            <canvas ref={canvasRef} aria-label="MLP forward-pass wave" role="img" />
        </div>
    );
}
