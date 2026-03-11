"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════════════════
   QuerySearchViz v2 — Canvas-based flagship Q·K attention visualizer
   
   Architecture:
   - React controls interaction + step triggers + state transitions
   - Canvas 2D renders all animation at 60fps via requestAnimationFrame
   - Built-in timeline engine choreographs tweens
   - 7-step interactive story: select → embedding → Q/K split →
     other tokens → similarity scan → softmax → attention arcs
   
   Colors: cyan-400 (#22d3ee) + amber (#fbbf24)
   Style: 3Blue1Brown deliberate motion, Apple minimalism
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Data ─── */
const WORDS = ["king", "wore", "the", "golden", "crown", "wisely"];

const EMBEDDINGS: number[][] = [
    [0.9, 0.3, 0.7, -0.2],
    [0.2, 0.8, -0.3, 0.6],
    [0.05, 0.05, 0.1, 0.02],
    [0.6, 0.1, 0.8, -0.1],
    [0.85, 0.1, 0.6, 0.3],
    [0.1, 0.7, -0.4, 0.5],
];

const Q_VEC: [number, number][] = [
    [0.9, 0.8],   // king: searches for royal objects
    [0.1, 0.9],   // wore: searches for objects
    [0.1, 0.1],   // the: barely searches
    [0.3, 0.9],   // golden: searches for noun
    [0.8, 0.3],   // crown: searches for royalty
    [-0.6, 0.8],  // wisely: searches for action
];
const K_VEC: [number, number][] = [
    [0.3, -0.4],  // king: royalty (not aligned with own Q)
    [-0.2, 0.5],  // wore: action
    [0.05, 0.05], // the: barely advertises
    [0.4, 0.6],   // golden: quality
    [0.85, 0.65], // crown: strongly royal object
    [-0.5, 0.3],  // wisely: manner
];

function dot2(a: [number, number], b: [number, number]): number {
    return +(a[0] * b[0] + a[1] * b[1]).toFixed(2);
}
function softmax(arr: number[]): number[] {
    const mx = Math.max(...arr);
    const ex = arr.map(v => Math.exp(v - mx));
    const s = ex.reduce((a, b) => a + b, 0);
    return ex.map(v => v / s);
}

const SCORES: number[][] = WORDS.map((_, qi) => WORDS.map((_, ki) => dot2(Q_VEC[qi], K_VEC[ki])));
const WEIGHTS: number[][] = SCORES.map((row, qi) => {
    const masked = row.map((v, ki) => ki === qi ? -Infinity : v);
    return softmax(masked);
});

const INTERP: Record<number, string> = {
    0: "\u201Cking\u201D searches for action and regality \u2014 \u201Ccrown\u201D answers loudest.",
    1: "\u201Cwore\u201D reaches for objects \u2014 \u201Cgolden\u201D and \u201Ccrown\u201D respond.",
    2: "\u201Cthe\u201D barely searches \u2014 its Query is too weak to focus.",
    3: "\u201Cgolden\u201D searches for the noun it describes \u2014 \u201Ccrown\u201D wins.",
    4: "\u201Ccrown\u201D reaches back for \u201Cking\u201D \u2014 its royal context.",
    5: "\u201Cwisely\u201D searches for the action \u2014 \u201Cwore\u201D answers.",
};

/* ─── Colors ─── */
const CYAN = { r: 34, g: 211, b: 238 };
const AMBER = { r: 251, g: 191, b: 36 };
const _rgba = (c: typeof CYAN, a: number) => `rgba(${c.r},${c.g},${c.b},${a})`;

/* ─── Easing ─── */
function easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutQuart(t: number): number {
    return 1 - Math.pow(1 - t, 4);
}

/* ─── Animation Timeline Engine ─── */
interface Tween {
    startTime: number;
    duration: number;
    from: number;
    to: number;
    easing: (t: number) => number;
    current: number;
    done: boolean;
}

class Timeline {
    private tweens: Map<string, Tween> = new Map();
    private startTime = 0;

    reset() {
        this.tweens.clear();
        this.startTime = performance.now();
    }

    add(key: string, from: number, to: number, duration: number, delay = 0, easing = easeInOutCubic) {
        this.tweens.set(key, {
            startTime: this.startTime + delay,
            duration,
            from,
            to,
            easing,
            current: from,
            done: false,
        });
    }

    get(key: string): number {
        const t = this.tweens.get(key);
        return t ? t.current : 0;
    }

    isDone(key: string): boolean {
        const t = this.tweens.get(key);
        return t ? t.done : true;
    }

    allDone(): boolean {
        for (const t of this.tweens.values()) {
            if (!t.done) return false;
        }
        return this.tweens.size > 0;
    }

    update(now: number) {
        for (const t of this.tweens.values()) {
            const elapsed = now - t.startTime;
            if (elapsed < 0) {
                t.current = t.from;
                continue;
            }
            const rawT = Math.min(elapsed / t.duration, 1);
            const easedT = t.easing(rawT);
            t.current = t.from + (t.to - t.from) * easedT;
            if (rawT >= 1) t.done = true;
        }
    }
}

/* ─── Particle system ─── */
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: typeof CYAN;
}

class ParticleSystem {
    particles: Particle[] = [];

    emit(x: number, y: number, count: number, color: typeof CYAN, spread = 2) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3 + Math.random() * spread;
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                maxLife: 40 + Math.random() * 40,
                size: 1 + Math.random() * 2,
                color,
            });
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.97;
            p.vy *= 0.97;
            p.life -= 1 / p.maxLife;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
    }

    draw(ctx: CanvasRenderingContext2D) {
        for (const p of this.particles) {
            const alpha = p.life * 0.6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = _rgba(p.color, alpha);
            ctx.fill();
            // Glow
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            ctx.fillStyle = _rgba(p.color, alpha * 0.15);
            ctx.fill();
        }
    }

    clear() {
        this.particles = [];
    }
}

/* ─── Canvas Drawing Helpers ─── */
function drawGlowCircle(
    ctx: CanvasRenderingContext2D,
    x: number, y: number, r: number,
    color: typeof CYAN, alpha: number
) {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, _rgba(color, alpha));
    grad.addColorStop(0.5, _rgba(color, alpha * 0.3));
    grad.addColorStop(1, _rgba(color, 0));
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
}

function drawArrow(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number, x2: number, y2: number,
    color: string, width: number, headSize: number, alpha: number, progress = 1
) {
    const dx = x2 - x1, dy = y2 - y1;
    const ex = x1 + dx * progress, ey = y1 + dy * progress;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1) return;
    const nx = dx / len, ny = dy / len;

    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();

    if (progress > 0.8 && headSize > 0) {
        const hx = ex, hy = ey;
        const bx = hx - nx * headSize, by = hy - ny * headSize;
        const px = -ny * headSize * 0.4, py = nx * headSize * 0.4;
        ctx.beginPath();
        ctx.moveTo(hx, hy);
        ctx.lineTo(bx + px, by + py);
        ctx.lineTo(bx - px, by - py);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

function drawCurvedArc(
    ctx: CanvasRenderingContext2D,
    x1: number, y1: number, x2: number, y2: number,
    color: string, width: number, alpha: number, progress: number,
    curvatureMultiplier = 0.35
) {
    const dx = x2 - x1, dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const curvature = Math.min(dist * curvatureMultiplier, 80);
    const cpX = (x1 + x2) / 2;
    const cpY = Math.min(y1, y2) - curvature;

    // De Casteljau split at t=progress for proper partial bezier
    const t = progress;
    const ax = x1 + (cpX - x1) * t;
    const ay = y1 + (cpY - y1) * t;
    const bx = cpX + (x2 - cpX) * t;
    const by = cpY + (y2 - cpY) * t;
    const endX = ax + (bx - ax) * t;
    const endY = ay + (by - ay) * t;

    ctx.globalAlpha = alpha * Math.min(progress * 2, 1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.quadraticCurveTo(ax, ay, endX, endY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.stroke();

    // Soft glow pass
    ctx.globalAlpha = alpha * Math.min(progress * 2, 1) * 0.15;
    ctx.lineWidth = width * 4;
    ctx.stroke();

    ctx.globalAlpha = 1;
}

/* ─── Step definitions ─── */
type Step =
    | "idle"        // Show sentence, prompt to click
    | "selected"    // Word highlighted, embedding shown
    | "embedding"   // Word dissolves to numbers
    | "projection"  // Embedding → Q and K through matrices
    | "scanning"    // Q visits each K sequentially
    | "scores"      // All scores shown, morphing to percentages
    | "attention";  // Bars become curved attention lines

const STEP_LABELS: Record<Step, string> = {
    idle: "Click any word to begin",
    selected: "This word wants to understand its context",
    embedding: "Every word is secretly a list of numbers",
    projection: "One embedding, two lenses: Query and Key",
    scanning: "The Query searches every Key...",
    scores: "Similarity scores reveal who matters most",
    attention: "Attention connects words by relevance",
};

/* ─── Main Component ─── */
export function QuerySearchViz() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const animRef = useRef<number>(0);
    const timelineRef = useRef(new Timeline());
    const particlesRef = useRef(new ParticleSystem());
    const stateRef = useRef({
        step: "idle" as Step,
        qi: -1,
        scanIdx: -1,
        scanTargets: [] as number[],
        scanScoresDone: [] as number[],
        scanDone: false,
        wordPositions: [] as { x: number; y: number }[],
        hoverIdx: -1,
        emittedArcParticles: new Set<number>(),
        canvasW: 0,
        canvasH: 0,
        dpr: 1,
        lastStepTime: 0,
    });

    const [step, setStep] = useState<Step>("idle");
    const [qi, setQi] = useState(-1);
    const [caption, setCaption] = useState(STEP_LABELS.idle);
    const [scanReady, setScanReady] = useState(false);

    /* ── Resize observer ── */
    const updateSize = useCallback(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;
        const rect = container.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        const w = Math.floor(rect.width);
        const h = 520;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        stateRef.current.canvasW = w;
        stateRef.current.canvasH = h;
        stateRef.current.dpr = dpr;
        computeWordPositions();
    }, []);

    const computeWordPositions = useCallback(() => {
        const s = stateRef.current;
        const W = s.canvasW;
        const totalGap = WORDS.length - 1;
        const totalTextWidth = WORDS.reduce((acc, w) => acc + w.length * 14 + 24, 0);
        const spacing = Math.min(16, (W - totalTextWidth) / totalGap);
        let x = (W - totalTextWidth - spacing * totalGap) / 2;
        const y = 52;
        s.wordPositions = WORDS.map((word) => {
            const wordW = word.length * 14 + 24;
            const cx = x + wordW / 2;
            x += wordW + spacing;
            return { x: cx, y };
        });
    }, []);

    useEffect(() => {
        updateSize();
        window.addEventListener("resize", updateSize);
        return () => window.removeEventListener("resize", updateSize);
    }, [updateSize]);

    /* ── Transition to next step ── */
    const goToStep = useCallback((nextStep: Step, wordIdx?: number) => {
        const s = stateRef.current;
        const tl = timelineRef.current;
        const ps = particlesRef.current;

        s.step = nextStep;
        s.lastStepTime = performance.now();
        tl.reset();

        if (wordIdx !== undefined) s.qi = wordIdx;

        switch (nextStep) {
            case "selected": {
                // Animate highlight: scale up selected, dim others
                tl.add("highlight", 0, 1, 600, 0, easeOutQuart);
                tl.add("dimOthers", 1, 0.25, 500, 100, easeInOutCubic);
                setCaption(STEP_LABELS.selected);
                // Auto-advance after 1.5s
                setTimeout(() => {
                    if (stateRef.current.step === "selected") goToStep("embedding");
                }, 1500);
                break;
            }
            case "embedding": {
                // Word dissolves into number column
                tl.add("wordFade", 1, 0, 800, 0, easeInOutCubic);
                tl.add("numbersAppear", 0, 1, 900, 400, easeOutQuart);
                tl.add("numbersAlign", 0, 1, 700, 900, easeInOutCubic);
                ps.emit(s.wordPositions[s.qi]?.x ?? 0, s.wordPositions[s.qi]?.y ?? 0, 12, CYAN, 1.5);
                setCaption(STEP_LABELS.embedding);
                // Auto-advance after 3s
                setTimeout(() => {
                    if (stateRef.current.step === "embedding") goToStep("projection");
                }, 3000);
                break;
            }
            case "projection": {
                // Embedding flows through Wq and Wk matrices
                tl.add("matrixAppear", 0, 1, 600, 0, easeOutQuart);
                tl.add("flowQ", 0, 1, 800, 400, easeInOutCubic);
                tl.add("flowK", 0, 1, 800, 600, easeInOutCubic);
                tl.add("qArrow", 0, 1, 700, 1000, easeOutQuart);
                tl.add("kArrow", 0, 1, 700, 1200, easeOutQuart);
                tl.add("labelsAppear", 0, 1, 500, 1600, easeOutQuart);
                setCaption(STEP_LABELS.projection);
                break;
            }
            case "scanning": {
                const targets = WORDS.map((_, i) => i).filter(i => i !== s.qi);
                s.scanTargets = targets;
                s.scanIdx = 0;
                s.scanScoresDone = [];
                s.scanDone = false;
                // Setup first comparison: K appears, then Q, then formula, then result
                tl.add("kVecAppear", 0, 1, 900, 0, easeOutQuart);
                tl.add("qVecAppear", 0, 1, 900, 500, easeOutQuart);
                tl.add("angleArc", 0, 1, 600, 1100, easeInOutCubic);
                tl.add("formulaAppear", 0, 1, 700, 1500, easeOutQuart);
                tl.add("resultAppear", 0, 1, 600, 2200, easeOutQuart);
                setScanReady(false);
                setTimeout(() => { if (stateRef.current.step === "scanning") setScanReady(true); }, 3000);
                setCaption(`Comparing Q(\u201C${WORDS[s.qi]}\u201D) with K(\u201C${WORDS[targets[0]]}\u201D)`);
                break;
            }
            case "scores": {
                // Scores morph into percentage bars
                tl.add("barsAppear", 0, 1, 800, 0, easeOutQuart);
                for (let i = 0; i < WORDS.length; i++) {
                    tl.add(`bar_${i}`, 0, 1, 600, 200 + i * 100, easeInOutCubic);
                }
                tl.add("percentages", 0, 1, 500, 800, easeOutQuart);
                setCaption(STEP_LABELS.scores);
                break;
            }
            case "attention": {
                if (!s.emittedArcParticles) s.emittedArcParticles = new Set();
                s.emittedArcParticles.clear();
                // Bars transform into curved attention arcs
                tl.add("barsToArcs", 0, 1, 1000, 0, easeInOutCubic);
                // Emit particles at source word for aha moment
                const srcP = s.wordPositions[s.qi];
                if (srcP) ps.emit(srcP.x, 52, 20, CYAN, 2);
                for (let i = 0; i < WORDS.length; i++) {
                    const w = WEIGHTS[s.qi]?.[i] ?? 0;
                    tl.add(`arc_${i}`, 0, 1, 800, 200 + i * 120, easeOutQuart);
                    if (w > 0.15) {
                        tl.add(`glowTarget_${i}`, 0, 1, 600, 600 + i * 100, easeOutQuart);
                    }
                }
                tl.add("interpretAppear", 0, 1, 600, 1200, easeOutQuart);
                setCaption(STEP_LABELS.attention);
                break;
            }
            default:
                setCaption(STEP_LABELS.idle);
                break;
        }

        setStep(nextStep);
    }, []);

    /* ── Advance to next scan comparison ── */
    const nextScan = useCallback(() => {
        const s = stateRef.current;
        const tl = timelineRef.current;
        if (s.step !== "scanning") return;

        const currentTarget = s.scanTargets[s.scanIdx];
        if (currentTarget !== undefined) s.scanScoresDone.push(currentTarget);
        s.scanIdx++;

        if (s.scanIdx >= s.scanTargets.length) {
            goToStep("scores");
            return;
        }

        tl.reset();
        tl.add("kVecAppear", 0, 1, 900, 0, easeOutQuart);
        tl.add("qVecAppear", 0, 1, 900, 500, easeOutQuart);
        tl.add("angleArc", 0, 1, 600, 1100, easeInOutCubic);
        tl.add("formulaAppear", 0, 1, 700, 1500, easeOutQuart);
        tl.add("resultAppear", 0, 1, 600, 2200, easeOutQuart);
        setScanReady(false);
        setTimeout(() => { if (stateRef.current.step === "scanning") setScanReady(true); }, 3000);
        const ti = s.scanTargets[s.scanIdx];
        setCaption(`Comparing Q(\u201C${WORDS[s.qi]}\u201D) with K(\u201C${WORDS[ti]}\u201D)`);
        setStep("scanning");
    }, [goToStep]);

    /* ── Visibility: pause rAF when off-screen ── */
    const visibleRef = useRef(true);
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new IntersectionObserver(([e]) => { visibleRef.current = e.isIntersecting; }, { threshold: 0.05 });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    /* ── Canvas render loop ── */
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const render = (now: number) => {
            if (!visibleRef.current) { animRef.current = requestAnimationFrame(render); return; }
            const s = stateRef.current;
            const tl = timelineRef.current;
            const ps = particlesRef.current;
            const { canvasW: W, canvasH: H, dpr } = s;

            tl.update(now);
            ps.update();

            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, W, H);

            // ─── Background subtle gradient ───
            const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
            bgGrad.addColorStop(0, "rgba(0,0,0,0)");
            bgGrad.addColorStop(0.5, "rgba(34,211,238,0.008)");
            bgGrad.addColorStop(1, "rgba(0,0,0,0)");
            ctx.fillStyle = bgGrad;
            ctx.fillRect(0, 0, W, H);

            // ─── Draw words (sentence) ───
            const wordY = 52;
            const isIdle = s.step === "idle";
            const isSelected = s.step === "selected" || s.step === "embedding" || s.step === "projection";
            const isScanning = s.step === "scanning";
            const isSorted = s.step === "scores";
            const isAttention = s.step === "attention";
            const highlight = tl.get("highlight");
            const dimOthers = tl.get("dimOthers");

            for (let i = 0; i < WORDS.length; i++) {
                const pos = s.wordPositions[i];
                if (!pos) continue;

                const isActive = i === s.qi;
                let alpha = 0.65;
                let scale = 1;
                let glowAlpha = 0;

                if (isIdle) {
                    alpha = i === s.hoverIdx ? 0.9 : 0.65;
                    // Subtle floating animation
                    const float = Math.sin(now / 2000 + i * 0.7) * 1.5;
                    ctx.save();
                    ctx.translate(pos.x, pos.y + float);
                } else if (isSelected || s.step === "scanning" || isSorted || isAttention) {
                    if (isActive) {
                        alpha = 0.9 + highlight * 0.1;
                        scale = 1 + highlight * 0.08;
                        glowAlpha = highlight * 0.4;
                    } else {
                        alpha = dimOthers > 0 ? dimOthers : 0.25;
                    }

                    // In attention step: SpotlightViz-style word illumination
                    if (isAttention && !isActive) {
                        const w = WEIGHTS[s.qi]?.[i] ?? 0;
                        const glowT = tl.get(`glowTarget_${i}`);
                        const isStrong = w > 0.15;
                        if (isStrong && glowT > 0) {
                            // Strong targets: bright text + large glow
                            alpha = 0.4 + w * glowT * 2.0;
                            glowAlpha = w * glowT * 0.6;
                        } else {
                            // Weak/no-match targets: very dim (SpotlightViz receded style)
                            alpha = 0.15;
                        }
                    }

                    // In scanning step, highlight current target word
                    if (isScanning && s.scanTargets && s.scanTargets.length > 0) {
                        const currentTarget = s.scanTargets[s.scanIdx];
                        if (i === currentTarget && !isActive) {
                            const kA = tl.get("kVecAppear");
                            alpha = 0.25 + kA * 0.5;
                            const score = SCORES[s.qi]?.[i] ?? 0;
                            if (score > 0.3) glowAlpha = kA * 0.3;
                        }
                        // Dim completed scan targets slightly less
                        if (s.scanScoresDone?.includes(i) && !isActive) {
                            alpha = 0.35;
                        }
                    }

                    ctx.save();
                    ctx.translate(pos.x, wordY);
                } else {
                    ctx.save();
                    ctx.translate(pos.x, wordY);
                }

                if (!isIdle) {
                    // skip translate for idle (already done)
                }

                // Word text
                if (s.step !== "embedding" || !isActive || tl.get("wordFade") > 0.01) {
                    const wordFade = (s.step === "embedding" && isActive) ? tl.get("wordFade") : 1;
                    ctx.font = `${scale > 1 ? "bold" : "600"} ${Math.round(16 * scale)}px "Inter", system-ui, sans-serif`;
                    ctx.textAlign = "center";
                    ctx.textBaseline = "middle";

                    if (isActive && glowAlpha > 0) {
                        ctx.shadowColor = _rgba(CYAN, glowAlpha);
                        ctx.shadowBlur = 20;
                    }

                    // Color
                    if (isActive && !isIdle) {
                        ctx.fillStyle = _rgba(CYAN, alpha * wordFade);
                    } else if (isAttention) {
                        const w = WEIGHTS[s.qi]?.[i] ?? 0;
                        const isAmber = w >= 0.25;
                        if (isAmber) {
                            ctx.fillStyle = `rgba(${AMBER.r},${AMBER.g},${AMBER.b},${alpha})`;
                        } else {
                            ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                        }
                    } else {
                        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                    }

                    ctx.fillText(WORDS[i], 0, 0);
                    ctx.shadowColor = "transparent";
                    ctx.shadowBlur = 0;

                    // Active underline
                    if (isActive && !isIdle && highlight > 0.5) {
                        const textW = ctx.measureText(WORDS[i]).width;
                        const lineAlpha = (highlight - 0.5) * 2 * 0.5;
                        const grad = ctx.createLinearGradient(-textW / 2, 0, textW / 2, 0);
                        grad.addColorStop(0, _rgba(CYAN, 0));
                        grad.addColorStop(0.5, _rgba(CYAN, lineAlpha));
                        grad.addColorStop(1, _rgba(CYAN, 0));
                        ctx.beginPath();
                        ctx.moveTo(-textW / 2, 12);
                        ctx.lineTo(textW / 2, 12);
                        ctx.strokeStyle = grad;
                        ctx.lineWidth = 1.5;
                        ctx.stroke();
                    }
                }

                ctx.restore();
            }

            // ─── Step-specific rendering ───

            if (s.step === "embedding" && s.qi >= 0) {
                const pos = s.wordPositions[s.qi];
                if (pos) {
                    const numAppear = tl.get("numbersAppear");
                    const numAlign = tl.get("numbersAlign");
                    const emb = EMBEDDINGS[s.qi];

                    if (numAppear > 0) {
                        const centerX = pos.x;
                        const centerY = wordY + 50 + numAlign * 30;

                        for (let d = 0; d < emb.length; d++) {
                            const spread = (1 - numAlign) * 40;
                            const angle = (d / emb.length) * Math.PI * 2 + (1 - numAlign) * 2;
                            const nx = centerX + Math.cos(angle) * spread;
                            const ny = centerY + d * 22 * numAlign + Math.sin(angle) * spread * (1 - numAlign);

                            const alpha = numAppear * (0.5 + numAlign * 0.3);
                            ctx.font = `600 13px "JetBrains Mono", "SF Mono", monospace`;
                            ctx.textAlign = "center";
                            ctx.textBaseline = "middle";
                            ctx.fillStyle = _rgba(CYAN, alpha);

                            const val = emb[d];
                            ctx.fillText((val >= 0 ? "+" : "") + val.toFixed(2), nx, ny);
                        }

                        // Label
                        if (numAlign > 0.5) {
                            const labelAlpha = (numAlign - 0.5) * 2 * 0.3;
                            ctx.font = `500 10px "Inter", system-ui, sans-serif`;
                            ctx.textAlign = "center";
                            ctx.fillStyle = `rgba(255,255,255,${labelAlpha})`;
                            ctx.fillText("embedding vector", centerX, centerY + emb.length * 22 + 15);
                        }

                        // Bracket
                        if (numAlign > 0.3) {
                            const bracketAlpha = (numAlign - 0.3) * 1.4 * 0.2;
                            const top = centerY - 8;
                            const bottom = centerY + (emb.length - 1) * 22 + 8;
                            ctx.strokeStyle = _rgba(CYAN, bracketAlpha);
                            ctx.lineWidth = 1;
                            // Left bracket
                            ctx.beginPath();
                            ctx.moveTo(centerX - 45, top);
                            ctx.lineTo(centerX - 50, top);
                            ctx.lineTo(centerX - 50, bottom);
                            ctx.lineTo(centerX - 45, bottom);
                            ctx.stroke();
                            // Right bracket
                            ctx.beginPath();
                            ctx.moveTo(centerX + 45, top);
                            ctx.lineTo(centerX + 50, top);
                            ctx.lineTo(centerX + 50, bottom);
                            ctx.lineTo(centerX + 45, bottom);
                            ctx.stroke();
                        }
                    }
                }
            }

            if (s.step === "projection" && s.qi >= 0) {
                const pos = s.wordPositions[s.qi];
                if (pos) {
                    const matAppear = tl.get("matrixAppear");
                    const flowQ = tl.get("flowQ");
                    const flowK = tl.get("flowK");
                    const qArr = tl.get("qArrow");
                    const kArr = tl.get("kArrow");
                    const labels = tl.get("labelsAppear");

                    // Center projection at canvas center
                    const centerX = W / 2;
                    const embY = wordY + 65;
                    const matY = embY + 115;
                    const outY = matY + 95;

                    // Embedding column (bigger, more visible)
                    const emb = EMBEDDINGS[s.qi];
                    for (let d = 0; d < emb.length; d++) {
                        ctx.font = `700 15px "JetBrains Mono", monospace`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = _rgba(CYAN, 0.55);
                        ctx.fillText((emb[d] >= 0 ? "+" : "") + emb[d].toFixed(2), centerX, embY + d * 26);
                    }

                    // Wq matrix block (left)
                    const qBoxX = centerX - 90;
                    const kBoxX = centerX + 90;
                    const boxW = 60, boxH = 36;

                    if (matAppear > 0) {
                        // Wq box
                        ctx.globalAlpha = matAppear;
                        ctx.fillStyle = "rgba(34,211,238,0.06)";
                        ctx.strokeStyle = _rgba(CYAN, 0.2);
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.roundRect(qBoxX - boxW / 2, matY - boxH / 2, boxW, boxH, 6);
                        ctx.fill();
                        ctx.stroke();
                        ctx.font = `700 13px "Inter", sans-serif`;
                        ctx.textAlign = "center";
                        ctx.textBaseline = "middle";
                        ctx.fillStyle = _rgba(CYAN, 0.6 * matAppear);
                        ctx.fillText("W_Q", qBoxX, matY);

                        // Wk box
                        ctx.fillStyle = "rgba(251,191,36,0.06)";
                        ctx.strokeStyle = _rgba(AMBER, 0.2);
                        ctx.beginPath();
                        ctx.roundRect(kBoxX - boxW / 2, matY - boxH / 2, boxW, boxH, 6);
                        ctx.fill();
                        ctx.stroke();
                        ctx.font = `700 13px "Inter", sans-serif`;
                        ctx.fillStyle = _rgba(AMBER, 0.6 * matAppear);
                        ctx.fillText("W_K", kBoxX, matY);
                        ctx.globalAlpha = 1;
                    }

                    // Flow lines: embedding → matrices
                    const embLastY = embY + (emb.length - 1) * 26 + 10;
                    if (flowQ > 0) {
                        drawArrow(ctx, centerX, embLastY, qBoxX, matY - boxH / 2 - 2,
                            _rgba(CYAN, 0.3), 1.5, 0, flowQ, flowQ);
                    }
                    if (flowK > 0) {
                        drawArrow(ctx, centerX, embLastY, kBoxX, matY - boxH / 2 - 2,
                            _rgba(AMBER, 0.3), 1.5, 0, flowK, flowK);
                    }

                    // Output Q vector
                    if (qArr > 0) {
                        const qv = Q_VEC[s.qi];
                        const arrowLen = 45;
                        const arrowX = qBoxX;
                        const arrowY = outY;
                        const tx = qv[0] * arrowLen, ty = -qv[1] * arrowLen;

                        // Connecting line from matrix to arrow origin
                        drawArrow(ctx, qBoxX, matY + boxH / 2, qBoxX, arrowY - arrowLen - 5,
                            _rgba(CYAN, 0.15), 1, 0, qArr, qArr);

                        // Arrow circle
                        ctx.beginPath();
                        ctx.arc(arrowX, arrowY, arrowLen + 3, 0, Math.PI * 2);
                        ctx.strokeStyle = _rgba(CYAN, 0.05 * qArr);
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        // Arrow
                        drawArrow(ctx, arrowX, arrowY, arrowX + tx * qArr, arrowY + ty * qArr,
                            _rgba(CYAN, 0.7), 2, 6, qArr, 1);

                        // Glow at arrow tip
                        if (qArr > 0.5) {
                            drawGlowCircle(ctx, arrowX + tx, arrowY + ty, 8, CYAN, (qArr - 0.5) * 0.4);
                        }

                        // Values
                        ctx.font = `600 11px "JetBrains Mono", monospace`;
                        ctx.textAlign = "center";
                        ctx.fillStyle = _rgba(CYAN, 0.5 * qArr);
                        ctx.fillText(`[${qv[0].toFixed(1)}, ${qv[1].toFixed(1)}]`, arrowX, arrowY + arrowLen + 16);
                    }

                    // Output K vector
                    if (kArr > 0) {
                        const kv = K_VEC[s.qi];
                        const arrowLen = 45;
                        const arrowX = kBoxX;
                        const arrowY = outY;
                        const tx = kv[0] * arrowLen, ty = -kv[1] * arrowLen;

                        drawArrow(ctx, kBoxX, matY + boxH / 2, kBoxX, arrowY - arrowLen - 5,
                            _rgba(AMBER, 0.15), 1, 0, kArr, kArr);

                        ctx.beginPath();
                        ctx.arc(arrowX, arrowY, arrowLen + 3, 0, Math.PI * 2);
                        ctx.strokeStyle = _rgba(AMBER, 0.05 * kArr);
                        ctx.lineWidth = 0.5;
                        ctx.stroke();

                        drawArrow(ctx, arrowX, arrowY, arrowX + tx * kArr, arrowY + ty * kArr,
                            `rgba(${AMBER.r},${AMBER.g},${AMBER.b},0.7)`, 2, 6, kArr, 1);

                        if (kArr > 0.5) {
                            drawGlowCircle(ctx, arrowX + tx, arrowY + ty, 8, AMBER, (kArr - 0.5) * 0.4);
                        }

                        ctx.font = `600 11px "JetBrains Mono", monospace`;
                        ctx.textAlign = "center";
                        ctx.fillStyle = _rgba(AMBER, 0.5 * kArr);
                        ctx.fillText(`[${kv[0].toFixed(1)}, ${kv[1].toFixed(1)}]`, arrowX, arrowY + arrowLen + 16);
                    }

                    // Labels (well below the vector values)
                    if (labels > 0) {
                        ctx.globalAlpha = labels;
                        ctx.font = `600 11px "Inter", sans-serif`;
                        ctx.textAlign = "center";

                        ctx.fillStyle = _rgba(CYAN, 0.4);
                        ctx.fillText("Query", qBoxX, outY + 45 + 34);

                        ctx.fillStyle = _rgba(AMBER, 0.4);
                        ctx.fillText("Key", kBoxX, outY + 45 + 34);
                        ctx.globalAlpha = 1;
                    }
                }
            }

            if (s.step === "scanning" && s.qi >= 0 && s.scanTargets && s.scanTargets.length > 0) {
                const ti = s.scanTargets[s.scanIdx];
                if (ti === undefined) { animRef.current = requestAnimationFrame(render); return; }

                const qv = Q_VEC[s.qi];
                const kv = K_VEC[ti];
                const score = SCORES[s.qi][ti];

                // ── 2D Vector comparison plot ──
                const plotCx = W / 2;
                const plotCy = 210;
                const plotR = 85;

                // Grid circles + axes
                ctx.strokeStyle = "rgba(255,255,255,0.04)";
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.arc(plotCx, plotCy, plotR, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(plotCx, plotCy, plotR * 0.5, 0, Math.PI * 2);
                ctx.stroke();
                // Axes
                ctx.strokeStyle = "rgba(255,255,255,0.06)";
                ctx.beginPath();
                ctx.moveTo(plotCx - plotR - 15, plotCy);
                ctx.lineTo(plotCx + plotR + 15, plotCy);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(plotCx, plotCy - plotR - 15);
                ctx.lineTo(plotCx, plotCy + plotR + 15);
                ctx.stroke();
                // Origin dot
                ctx.beginPath();
                ctx.arc(plotCx, plotCy, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255,255,255,0.15)";
                ctx.fill();

                // K vector (amber) — appears first
                const kAppear = tl.get("kVecAppear");
                if (kAppear > 0) {
                    const kx = plotCx + kv[0] * plotR * kAppear;
                    const ky = plotCy - kv[1] * plotR * kAppear;
                    drawArrow(ctx, plotCx, plotCy, kx, ky, _rgba(AMBER, 0.7 * kAppear), 2.5, 7, kAppear);
                    drawGlowCircle(ctx, kx, ky, 10, AMBER, 0.25 * kAppear);
                    // Label
                    const lox = kv[0] >= 0 ? 14 : -14;
                    const loy = kv[1] >= 0 ? -16 : 16;
                    ctx.font = `700 13px "Inter", sans-serif`;
                    ctx.textAlign = kv[0] >= 0 ? "left" : "right";
                    ctx.fillStyle = _rgba(AMBER, 0.65 * kAppear);
                    ctx.fillText(`K("${WORDS[ti]}")`, kx + lox, ky + loy);
                    ctx.font = `500 10px "JetBrains Mono", monospace`;
                    ctx.fillStyle = _rgba(AMBER, 0.35 * kAppear);
                    ctx.fillText(`[${kv[0].toFixed(1)}, ${kv[1].toFixed(1)}]`, kx + lox, ky + loy + 14);
                }

                // Q vector (cyan) — appears second
                const qAppear = tl.get("qVecAppear");
                if (qAppear > 0) {
                    const qx = plotCx + qv[0] * plotR * qAppear;
                    const qy = plotCy - qv[1] * plotR * qAppear;
                    drawArrow(ctx, plotCx, plotCy, qx, qy, _rgba(CYAN, 0.7 * qAppear), 2.5, 7, qAppear);
                    drawGlowCircle(ctx, qx, qy, 10, CYAN, 0.25 * qAppear);
                    const lox = qv[0] >= 0 ? 14 : -14;
                    const loy = qv[1] >= 0 ? -16 : 16;
                    ctx.font = `700 13px "Inter", sans-serif`;
                    ctx.textAlign = qv[0] >= 0 ? "left" : "right";
                    ctx.fillStyle = _rgba(CYAN, 0.65 * qAppear);
                    ctx.fillText(`Q("${WORDS[s.qi]}")`, qx + lox, qy + loy);
                    ctx.font = `500 10px "JetBrains Mono", monospace`;
                    ctx.fillStyle = _rgba(CYAN, 0.35 * qAppear);
                    ctx.fillText(`[${qv[0].toFixed(1)}, ${qv[1].toFixed(1)}]`, qx + lox, qy + loy + 14);
                }

                // Angle arc between vectors
                const angleP = tl.get("angleArc");
                if (angleP > 0 && kAppear > 0.8 && qAppear > 0.8) {
                    const qAngle = Math.atan2(-qv[1], qv[0]);
                    const kAngle = Math.atan2(-kv[1], kv[0]);
                    const minA = Math.min(qAngle, kAngle);
                    const maxA = Math.max(qAngle, kAngle);
                    ctx.beginPath();
                    ctx.arc(plotCx, plotCy, 28, minA, minA + (maxA - minA) * angleP);
                    ctx.strokeStyle = `rgba(255,255,255,${0.15 * angleP})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Dot product formula
                const formulaP = tl.get("formulaAppear");
                if (formulaP > 0) {
                    const formulaY = plotCy + plotR + 35;
                    ctx.font = `600 13px "Inter", sans-serif`;
                    ctx.textAlign = "center";
                    ctx.fillStyle = `rgba(255,255,255,${0.4 * formulaP})`;
                    ctx.fillText("Q \u00B7 K  =", plotCx, formulaY);

                    // Component-wise multiplication
                    const q = Q_VEC[s.qi];
                    const k = K_VEC[ti];
                    ctx.font = `500 12px "JetBrains Mono", monospace`;
                    ctx.fillStyle = `rgba(255,255,255,${0.25 * formulaP})`;
                    ctx.fillText(
                        `(${q[0].toFixed(1)})(${k[0].toFixed(1)}) + (${q[1].toFixed(1)})(${k[1].toFixed(1)})`,
                        plotCx, formulaY + 20
                    );
                }

                // Result score
                const resultP = tl.get("resultAppear");
                if (resultP > 0) {
                    const resultY = plotCy + plotR + 82;
                    const isHigh = Math.abs(score) > 0.3;
                    const scoreColor = isHigh ? AMBER : CYAN;
                    ctx.font = `700 28px "JetBrains Mono", monospace`;
                    ctx.textAlign = "center";
                    ctx.fillStyle = _rgba(scoreColor, 0.8 * resultP);
                    ctx.fillText(`= ${score >= 0 ? "+" : ""}${score.toFixed(2)}`, plotCx, resultY);
                    if (isHigh) drawGlowCircle(ctx, plotCx, resultY - 6, 40, AMBER, resultP * 0.12);
                    ctx.font = `italic 500 11px "Inter", sans-serif`;
                    ctx.fillStyle = _rgba(scoreColor, 0.3 * resultP);
                    ctx.fillText(isHigh ? "Strong match!" : "Weak match", plotCx, resultY + 24);
                }

                // Previously completed scores as pills under words
                if (s.scanScoresDone) {
                    for (const doneIdx of s.scanScoresDone) {
                        const pos = s.wordPositions[doneIdx];
                        if (!pos) continue;
                        const sc = SCORES[s.qi][doneIdx];
                        const isH = Math.abs(sc) > 0.3;
                        ctx.font = `600 10px "JetBrains Mono", monospace`;
                        ctx.textAlign = "center";
                        ctx.fillStyle = isH ? _rgba(AMBER, 0.45) : _rgba(CYAN, 0.3);
                        ctx.fillText(`${sc >= 0 ? "+" : ""}${sc.toFixed(2)}`, pos.x, wordY + 22);
                    }
                }

                // Highlight current target word in sentence
                const targetPos = s.wordPositions[ti];
                if (targetPos && kAppear > 0) {
                    drawGlowCircle(ctx, targetPos.x, wordY, 25, AMBER, 0.12 * kAppear);
                }

                // Progress indicator
                ctx.font = `500 10px "Inter", sans-serif`;
                ctx.textAlign = "center";
                ctx.fillStyle = "rgba(255,255,255,0.15)";
                ctx.fillText(
                    `Comparison ${s.scanIdx + 1} of ${s.scanTargets.length}`,
                    W / 2, H - 90
                );
            }

            if ((s.step === "scores" || s.step === "attention") && s.qi >= 0) {
                const barsAppear = tl.get("barsAppear");
                const barsToArcs = s.step === "attention" ? tl.get("barsToArcs") : 0;
                const pctAppear = tl.get("percentages");

                if (barsAppear > 0 || s.step === "attention") {
                    // Sort by score, exclude self
                    const sorted = WORDS.map((w, ki) => ({
                        ki, word: w,
                        score: SCORES[s.qi][ki],
                        weight: WEIGHTS[s.qi][ki],
                    })).filter(d => d.ki !== s.qi).sort((a, b) => b.score - a.score);

                    const barAreaY = wordY + 80;
                    const barH = 32;
                    const barGap = 6;
                    const maxBarW = Math.min(W * 0.5, 280);
                    const barStartX = W / 2 - maxBarW / 2 - 60;

                    const maxScore = Math.max(...sorted.map(item => Math.abs(item.score)));

                    for (let rank = 0; rank < sorted.length; rank++) {
                        const { word, score, weight } = sorted[rank];
                        const barP = tl.get(`bar_${rank}`);
                        const entryP = s.step === "scores" ? barsAppear : 1;
                        const y = barAreaY + rank * (barH + barGap);

                        if (s.step === "attention" && barsToArcs > 0.5) {
                            const fadeOut = Math.max(0, 1 - (barsToArcs - 0.5) * 2);
                            if (fadeOut < 0.01) continue;
                            ctx.globalAlpha = fadeOut;
                        }

                        // Word label
                        ctx.font = `700 14px "Inter", sans-serif`;
                        ctx.textAlign = "right";
                        const isAmber = weight > 0.2;
                        ctx.fillStyle = isAmber
                            ? _rgba(AMBER, 0.7 * entryP)
                            : _rgba(CYAN, 0.5 * entryP);
                        ctx.fillText(word, barStartX, y + barH / 2 + 4);

                        // Bar
                        const barX = barStartX + 12;
                        const barW = (Math.abs(score) / maxScore) * maxBarW * (barP > 0 ? barP : entryP);
                        const grad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
                        if (isAmber) {
                            grad.addColorStop(0, _rgba(AMBER, 0.5 * entryP));
                            grad.addColorStop(1, _rgba(AMBER, 0.15 * entryP));
                        } else {
                            grad.addColorStop(0, _rgba(CYAN, 0.4 * entryP));
                            grad.addColorStop(1, _rgba(CYAN, 0.1 * entryP));
                        }
                        ctx.beginPath();
                        ctx.roundRect(barX, y + barH / 2 - 3, barW, 6, 3);
                        ctx.fillStyle = grad;
                        ctx.fill();

                        // Score value
                        ctx.font = `700 12px "JetBrains Mono", monospace`;
                        ctx.textAlign = "left";
                        ctx.fillStyle = score > 0.5
                            ? _rgba(AMBER, 0.65 * entryP)
                            : score > 0.2
                                ? _rgba(CYAN, 0.55 * entryP)
                                : `rgba(255,255,255,${0.3 * entryP})`;
                        ctx.fillText(
                            (score >= 0 ? "+" : "") + score.toFixed(2),
                            barX + barW + 10, y + barH / 2 + 4
                        );

                        // Percentage
                        if (pctAppear > 0 || s.step === "attention") {
                            const pctAlpha = s.step === "attention" ? 1 : pctAppear;
                            ctx.font = `500 11px "JetBrains Mono", monospace`;
                            ctx.textAlign = "left";
                            ctx.fillStyle = `rgba(255,255,255,${0.2 * pctAlpha * entryP})`;
                            ctx.fillText(`${Math.round(weight * 100)}%`, barX + barW + 55, y + barH / 2 + 4);
                        }

                        ctx.globalAlpha = 1;
                    }
                }

                // ── Attention: SpotlightViz-style glows + ultra-thin arcs ──
                if (s.step === "attention") {
                    const arcsVisible = barsToArcs > 0.3;
                    if (arcsVisible) {
                        const srcPos = s.wordPositions[s.qi];
                        if (srcPos) {
                            // Only draw arcs for significant matches (top ones)
                            for (let i = 0; i < WORDS.length; i++) {
                                if (i === s.qi) continue;
                                const w = WEIGHTS[s.qi][i];
                                if (w < 0.12) continue; // only top matches get lines
                                const arcP = tl.get(`arc_${i}`);
                                const targetPos = s.wordPositions[i];
                                if (!targetPos || arcP <= 0) continue;

                                // Ultra-thin ghost arc (the LINE is subtle, the GLOW matters)
                                const isAmber = w >= 0.25;
                                const arcRgb = isAmber ? AMBER : CYAN;
                                const lineAlpha = Math.max(0.08, w * 0.4);
                                const lineWidth = 0.5 + w * 1.2;
                                drawCurvedArc(ctx, srcPos.x, wordY - 8, targetPos.x, wordY - 8,
                                    _rgba(arcRgb, lineAlpha), lineWidth, 0.8, arcP, 0.35);
                            }

                            // Word illumination (the MAIN visual — glow on matching words)
                            for (let i = 0; i < WORDS.length; i++) {
                                if (i === s.qi) continue;
                                const w = WEIGHTS[s.qi][i];
                                if (w < 0.05) continue;
                                const arcP = tl.get(`arc_${i}`);
                                const targetPos = s.wordPositions[i];
                                if (!targetPos || arcP <= 0) continue;

                                const isAmber = w >= 0.25;
                                const glowC = isAmber ? AMBER : CYAN;

                                // Large diffused background glow (SpotlightViz style)
                                if (arcP > 0.3) {
                                    const glowIntensity = w * arcP;
                                    const glowR = 20 + w * 50;
                                    const grad = ctx.createRadialGradient(
                                        targetPos.x, wordY, 0,
                                        targetPos.x, wordY, glowR
                                    );
                                    grad.addColorStop(0, _rgba(glowC, glowIntensity * 0.25));
                                    grad.addColorStop(0.5, _rgba(glowC, glowIntensity * 0.08));
                                    grad.addColorStop(1, "rgba(0,0,0,0)");
                                    ctx.fillStyle = grad;
                                    ctx.beginPath();
                                    ctx.arc(targetPos.x, wordY, glowR, 0, Math.PI * 2);
                                    ctx.fill();
                                }

                                // One-time particle burst for high-weight targets
                                if (arcP > 0.95 && w > 0.15 && !s.emittedArcParticles?.has(i)) {
                                    s.emittedArcParticles.add(i);
                                    ps.emit(targetPos.x, wordY, Math.round(4 + w * 10), glowC, 1.5);
                                }
                            }

                            // Source word glow
                            drawGlowCircle(ctx, srcPos.x, wordY, 30, CYAN, 0.15);
                        }
                    }

                    // Interpretation text
                    const interpP = tl.get("interpretAppear");
                    if (interpP > 0) {
                        ctx.font = `italic 400 13px "Inter", sans-serif`;
                        ctx.textAlign = "center";
                        ctx.fillStyle = `rgba(255,255,255,${0.25 * interpP})`;
                        const text = INTERP[s.qi] ?? "";
                        const maxW = Math.min(W - 40, 400);
                        const words = text.split(" ");
                        let line = "";
                        let lineY = H - 60;
                        for (const word of words) {
                            const test = line + (line ? " " : "") + word;
                            if (ctx.measureText(test).width > maxW && line) {
                                ctx.fillText(line, W / 2, lineY);
                                lineY += 18;
                                line = word;
                            } else {
                                line = test;
                            }
                        }
                        if (line) ctx.fillText(line, W / 2, lineY);
                    }
                }
            }

            // ─── Particles ───
            ps.draw(ctx);

            animRef.current = requestAnimationFrame(render);
        };

        animRef.current = requestAnimationFrame(render);
        return () => cancelAnimationFrame(animRef.current);
    }, []);

    /* ── Mouse interaction ── */
    const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const s = stateRef.current;

        // Check if clicked on a word
        for (let i = 0; i < WORDS.length; i++) {
            const pos = s.wordPositions[i];
            if (!pos) continue;
            const wordW = WORDS[i].length * 14 + 24;
            if (Math.abs(x - pos.x) < wordW / 2 && Math.abs(y - pos.y) < 20) {
                if (s.step === "idle" || i !== s.qi) {
                    setQi(i);
                    goToStep("selected", i);
                }
                return;
            }
        }
    }, [goToStep]);

    const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const s = stateRef.current;

        let newHover = -1;
        for (let i = 0; i < WORDS.length; i++) {
            const pos = s.wordPositions[i];
            if (!pos) continue;
            const wordW = WORDS[i].length * 14 + 24;
            if (Math.abs(x - pos.x) < wordW / 2 && Math.abs(y - pos.y) < 20) {
                newHover = i;
                break;
            }
        }
        s.hoverIdx = newHover;
        if (canvas) {
            canvas.style.cursor = newHover >= 0 ? "pointer" : "default";
        }
    }, []);

    /* ── Step navigation (React overlay) ── */
    const canAdvance = step === "projection" || step === "scores" || (step === "scanning" && scanReady);
    const canReplay = step === "attention";

    const getButtonText = () => {
        if (step === "projection") return "Search all Keys \u2192";
        if (step === "scanning") {
            const s = stateRef.current;
            if (s.scanIdx >= s.scanTargets.length - 1) return "See all scores \u2192";
            return "Next comparison \u2192";
        }
        return "See attention connections \u2192";
    };

    const advanceStep = useCallback(() => {
        const s = stateRef.current;
        if (s.step === "projection") goToStep("scanning");
        else if (s.step === "scanning") nextScan();
        else if (s.step === "scores") goToStep("attention");
    }, [goToStep, nextScan]);

    const replay = useCallback(() => {
        goToStep("selected", stateRef.current.qi);
    }, [goToStep]);

    const reset = useCallback(() => {
        stateRef.current.qi = -1;
        stateRef.current.step = "idle";
        setQi(-1);
        setStep("idle");
        setCaption(STEP_LABELS.idle);
        timelineRef.current.reset();
        particlesRef.current.clear();
    }, []);

    return (
        <div ref={containerRef} className="relative w-full" style={{ minHeight: 560 }}>
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                className="w-full block"
                onClick={handleCanvasClick}
                onMouseMove={handleCanvasMove}
                style={{ height: 520 }}
            />

            {/* React overlay: caption + controls */}
            <div className="absolute bottom-0 inset-x-0 pb-3 flex flex-col items-center gap-3 pointer-events-none">
                {/* Caption */}
                <AnimatePresence mode="wait">
                    <motion.p
                        key={caption}
                        className="text-[13px] sm:text-sm text-white/30 text-center max-w-md px-4 leading-relaxed"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                    >
                        {caption}
                    </motion.p>
                </AnimatePresence>

                {/* Controls */}
                <div className="flex items-center gap-3 pointer-events-auto">
                    {canAdvance && (
                        <motion.button
                            onClick={advanceStep}
                            className="rounded-full px-5 py-2 text-[12px] sm:text-[13px] font-semibold cursor-pointer"
                            style={{
                                background: "linear-gradient(90deg, rgba(34,211,238,0.1), rgba(34,211,238,0.04))",
                                border: "1px solid rgba(34,211,238,0.25)",
                                color: "rgba(34,211,238,0.7)",
                            }}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {getButtonText()}
                        </motion.button>
                    )}

                    {canReplay && (
                        <motion.button
                            onClick={replay}
                            className="text-[11px] text-white/20 hover:text-white/40 transition-colors cursor-pointer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.5 }}
                        >
                            {"\u21BA"} Replay
                        </motion.button>
                    )}

                    {step !== "idle" && (
                        <motion.button
                            onClick={reset}
                            className="text-[11px] text-white/15 hover:text-white/30 transition-colors cursor-pointer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            {"\u00D7"} Reset
                        </motion.button>
                    )}
                </div>
            </div>
        </div>
    );
}
