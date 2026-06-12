"use client";

/**
 * TrainBigramLab — "entrena tu propio bigrama": the chapter's playground hero.
 *
 * The reader feeds it THEIR text (a paste, a whole book as .txt, or the sample corpus), WATCHES the
 * model read it — a slow teaching scan that accelerates until it devours millions of characters —
 * while the 27×27 table heats up live; then explores the table (hover → count, click → row
 * inspector), and finally writes with it in three modes:
 *   · solo        — the model streams letters on its own (temperature applies),
 *   · paso a paso — manual advance: the row → the loaded dice spinning over its segments → the letter,
 *   · tú eliges   — the READER is the dice: the row is clickable, zero-count slots refuse.
 *
 * Standalone for now (bench only — NOT in the narrative yet). Assembled from the bigram kit; the
 * matrix board reuses GrowingMatrix27's exact cell/axis/tooltip idiom. Engine: data/trainableModel.
 */

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import {
  CHAR_CAPS,
  charIdx,
  displayChar,
  type FoldReport,
  foldText,
  makeRng,
  rowTotal,
  sampleNext,
  sampleRow,
  type SampleStep,
  seedFrom,
  TRAIN_ALPHABET,
  TrainedModel,
  VOCAB,
} from "@/features/lab/data/trainableModel";
import { useI18n } from "@/i18n/context";

import {
  FixedAlphabetRow,
  GhostButton,
  heat,
  MONO,
  ParchmentReader,
  PlayButton,
  SERIF,
  STD,
  Tabs,
} from "./kit";

const ALPHA = TRAIN_ALPHABET;
const CAP = CHAR_CAPS[1];

/* Board geometry — GrowingMatrix27's exact numbers, so the table reads as THE chapter's matrix. */
const CELL = 18;
const GAP = 2;
const GUTTER = 22;
const PAD = 12;
const HEAT_FLOOR = 14;

/* The teaching scan: pairs fed slowly enough to follow, then the ramp devours the rest. */
const SLOW_STEPS = 14;
const SLOW_MS0 = 460; // first pair dwell
const SLOW_DECAY = 0.85;
const RAMP_X = 1.85; // speed multiplier…
const RAMP_EVERY = 560; // …applied this often (ms)
const RAMP_V0 = 40; // chars/s at ramp start
const SCAN_WIN = 200;
const GEN_CAP = 4000; // letters per writing session

type Stage = "feed" | "reading" | "ready";

/** % in the reader's locale — in es the decimal is a comma, so it never collides with the "." thousands. */
function fmtPct(x: number, lang: string): string {
  const s = x.toFixed(1);
  return lang === "es" ? s.replace(".", ",") : s;
}

export interface TrainBigramLabProps {
  accent?: "bigram";
}

export const TrainBigramLab = memo(function TrainBigramLab({
  accent = "bigram",
}: TrainBigramLabProps = {}) {
  void accent;
  const { t, language } = useI18n();
  const reduce = useReducedMotion();
  /* thousands grouping follows the reader's locale ("19.683" reads as a decimal in English). */
  const fmt = useCallback(
    (n: number) => Math.round(n).toLocaleString(language === "es" ? "es-ES" : "en-US"),
    [language],
  );

  /* ════════════════ training state ════════════════ */
  const [stage, setStage] = useState<Stage>("feed");
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [charCount, setCharCount] = useState(0);
  const countRaf = useRef(0);

  const streamRef = useRef("");
  const reportRef = useRef<FoldReport | null>(null);
  const modelRef = useRef<TrainedModel>(new TrainedModel(1));
  const rowTotRef = useRef<Float64Array>(new Float64Array(VOCAB));
  const headRef = useRef(0);
  const skipRef = useRef(false);

  /* reading visuals */
  const [, setTick] = useState(0); // bumps once per visual frame → board re-reads its refs
  const [head, setHead] = useState(0);
  const [lit, setLit] = useState<{ r: number; c: number; n: number } | null>(null);
  const [speedX, setSpeedX] = useState(0); // 0 = slow scan, >0 = ramp badge
  const [rowVers, setRowVers] = useState<number[]>(() => Array(VOCAB).fill(0));

  /* table exploration */
  const [hover, setHover] = useState<{ r: number; c: number } | null>(null);
  const [selRow, setSelRow] = useState(-1);
  const [selCol, setSelCol] = useState(-1);
  const [inspHover, setInspHover] = useState(-1);

  /* ready chrome */
  const [readyTab, setReadyTab] = useState(0); // 0 = la tabla · 1 = escribir

  /* ════════════════ writing state ════════════════ */
  const [mode, setMode] = useState(0); // 0 solo · 1 paso a paso · 2 tú eliges
  const [temp, setTemp] = useState(0.85);
  const [seedRaw, setSeedRaw] = useState("");
  const [genText, setGenText] = useState("");
  const [running, setRunning] = useState(false);
  const [lastStep, setLastStep] = useState<SampleStep | null>(null);
  const [copied, setCopied] = useState(false);
  /* paso a paso: the spinning loaded dice */
  const [spin, setSpin] = useState<{ pct: number; settled: boolean; target: number } | null>(null);
  const [pasoAuto, setPasoAuto] = useState(false);
  const spinTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const outRef = useRef<HTMLDivElement>(null);
  const genRef = useRef("");
  genRef.current = genText;

  const seedStream = useMemo(() => foldText(seedRaw, 400).stream, [seedRaw]);
  const written = seedStream + genText;
  const curChar = written.length > 0 ? written[written.length - 1] : " ";

  /* ════════════════ helpers ════════════════ */

  const refreshRowTotals = useCallback(() => {
    const m = modelRef.current;
    const tot = rowTotRef.current;
    for (let r = 0; r < VOCAB; r++) {
      const row = m.row(ALPHA[r]);
      tot[r] = row ? rowTotal(row) : 0;
    }
  }, []);

  const heatAt = useCallback((r: number, c: number): number => {
    const tot = rowTotRef.current[r];
    if (!tot) return 0;
    const row = modelRef.current.row(ALPHA[r]);
    return row ? row[c] / tot : 0;
  }, []);

  const countAt = useCallback((r: number, c: number): number => {
    const row = modelRef.current.row(ALPHA[r]);
    return row ? row[c] : 0;
  }, []);

  const bumpAllRows = useCallback(() => {
    setRowVers((v) => v.map((x) => x + 1));
  }, []);

  const onTaInput = useCallback(() => {
    cancelAnimationFrame(countRaf.current);
    countRaf.current = requestAnimationFrame(() => setCharCount(taRef.current?.value.length ?? 0));
  }, []);

  const loadSample = useCallback(async () => {
    const mod = await import("@/features/lab/data/shakespeareText");
    if (taRef.current) {
      taRef.current.value = mod.SHAKESPEARE_TEXT;
      setCharCount(mod.SHAKESPEARE_TEXT.length);
    }
  }, []);

  const onFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const text = await f.text();
    if (taRef.current) {
      taRef.current.value = text;
      setCharCount(text.length);
    }
    e.target.value = "";
  }, []);

  const clearText = useCallback(() => {
    if (taRef.current) taRef.current.value = "";
    setCharCount(0);
  }, []);

  const resetWriting = useCallback(() => {
    setGenText("");
    setRunning(false);
    setLastStep(null);
    setSpin(null);
    setPasoAuto(false);
    spinTimers.current.forEach(clearTimeout);
    spinTimers.current = [];
  }, []);

  /* ════════════════ the read (training) loop ════════════════ */

  const train = useCallback(() => {
    const raw = taRef.current?.value ?? "";
    const { stream, report } = foldText(raw, CAP);
    if (stream.length < 2) return;
    streamRef.current = stream;
    reportRef.current = report;
    modelRef.current = new TrainedModel(1);
    rowTotRef.current = new Float64Array(VOCAB);
    headRef.current = 1; // first NEXT char is index 1 (its context is index 0)
    skipRef.current = false;
    setHead(1);
    setLit(null);
    setSpeedX(0);
    setSelRow(-1);
    setSelCol(-1);
    setHover(null);
    setReadyTab(0);
    resetWriting();
    setRowVers(Array(VOCAB).fill(0));
    setStage("reading");
  }, [resetWriting]);

  useEffect(() => {
    if (stage !== "reading") return;
    const stream = streamRef.current;
    const model = modelRef.current;
    const len = stream.length;
    let cancelled = false;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    /* rAF while visible; setTimeout when the tab is hidden (rAF never fires there — without the
           fallback, backgrounding the tab would freeze the training forever). */
    const schedule = (fn: (now: number) => void) => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        timer = setTimeout(() => fn(performance.now()), 50);
      } else {
        raf = requestAnimationFrame(fn);
      }
    };

    const finish = () => {
      refreshRowTotals();
      bumpAllRows();
      setLit(null);
      setStage("ready");
    };

    /* reduced motion (or skip pressed before mount): no show — chunked silent training */
    const silently = () => {
      const chunkLoop = () => {
        if (cancelled) return;
        const from = headRef.current;
        const to = Math.min(len, from + 1_000_000);
        model.feedRange(stream, from, to);
        headRef.current = to;
        setHead(to);
        if (to < len) {
          schedule(chunkLoop);
        } else {
          finish();
        }
      };
      chunkLoop();
    };

    if (reduce) {
      silently();
      return () => {
        cancelled = true;
        cancelAnimationFrame(raf);
      };
    }

    /* phase 1 — the teaching scan: SLOW_STEPS pairs you can follow, each one visibly counted */
    let step = 0;
    let dwell = SLOW_MS0;
    const slowTick = () => {
      if (cancelled) return;
      if (skipRef.current) {
        silently();
        return;
      }
      const i = headRef.current;
      if (step >= SLOW_STEPS || i >= len) {
        startRamp();
        return;
      }
      model.feedRange(stream, i, i + 1);
      const r = charIdx(stream[i - 1]);
      const c = charIdx(stream[i]);
      rowTotRef.current[r] += 1;
      setLit({ r, c, n: model.row(stream[i - 1])?.[c] ?? 1 });
      setHead(i + 1);
      headRef.current = i + 1;
      setRowVers((v) => {
        const nv = v.slice();
        nv[r]++;
        return nv;
      });
      step++;
      dwell = Math.max(130, dwell * SLOW_DECAY);
      timer = setTimeout(slowTick, dwell);
    };

    /* phase 2 — the ramp: speed doubles until the text is devoured. Feeding happens every frame;
           the REPAINT (row versions, papiro, counters) is throttled to ~12/s so React isn't the
           bottleneck while the engine devours megabytes. */
    let speed = RAMP_V0;
    let lastT = 0;
    let lastBoost = 0;
    let lastPaint = 0;
    const startRamp = () => {
      setLit(null);
      lastT = performance.now();
      lastBoost = lastT;
      const frame = (now: number) => {
        if (cancelled) return;
        const dt = Math.min(100, now - lastT) / 1000;
        lastT = now;
        if (now - lastBoost > RAMP_EVERY) {
          speed = Math.min(2_400_000, speed * RAMP_X);
          lastBoost = now;
        }
        const chunk = skipRef.current ? 1_200_000 : Math.max(1, Math.round(speed * dt));
        const from = headRef.current;
        const to = Math.min(len, from + chunk);
        model.feedRange(stream, from, to);
        headRef.current = to;
        if (now - lastPaint > 80 || to >= len) {
          lastPaint = now;
          refreshRowTotals();
          setHead(to);
          setSpeedX(Math.max(1, Math.round(speed / RAMP_V0)));
          setTick((x) => x + 1);
          bumpAllRows();
        }
        if (to < len) {
          schedule(frame);
        } else {
          finish();
        }
      };
      schedule(frame);
    };

    timer = setTimeout(slowTick, 500);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [stage, reduce, refreshRowTotals, bumpAllRows]);

  /* ════════════════ writing: solo mode loop ════════════════ */

  useEffect(() => {
    if (!running || mode !== 0) return;
    if (reduce) {
      // reduced motion: the passage appears at once (deterministic)
      const rng = makeRng(seedFrom(seedStream + "|" + temp));
      let acc = "";
      let cur = seedStream || " ";
      for (let i = 0; i < 220; i++) {
        const s = sampleNext(modelRef.current, cur, temp, rng);
        if (!s) break;
        acc += s.ch;
        cur = s.ch;
      }
      setGenText((g) => g + acc);
      setRunning(false);
      return;
    }
    const id = setInterval(() => {
      const g = genRef.current;
      if (g.length >= GEN_CAP) {
        setRunning(false);
        return;
      }
      const ctx = (seedStream + g).slice(-1) || " ";
      const s = sampleNext(modelRef.current, ctx, temp, Math.random);
      if (!s) {
        setRunning(false);
        return;
      }
      setLastStep(s);
      setGenText(g + s.ch);
    }, 85);
    return () => clearInterval(id);
  }, [running, mode, temp, seedStream, reduce]);

  /* autoscroll the output */
  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [genText]);

  /* ════════════════ writing: paso a paso (the loaded dice) ════════════════ */

  const curRow = modelRef.current.row(curChar);
  const curTotal = curRow ? rowTotal(curRow) : 0;

  /** temperature-weighted share per slot (the dice's segments). */
  const diceSegs = useMemo(() => {
    if (!curRow || curTotal === 0) return null;
    const inv = 1 / Math.max(0.1, temp);
    const w = ALPHA.map((_, i) => (curRow[i] > 0 ? Math.pow(curRow[i] / curTotal, inv) : 0));
    const sum = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / sum);
  }, [curRow, curTotal, temp]);

  const stepOnce = useCallback(() => {
    if (spin && !spin.settled) return;
    const ctx = curChar;
    const s = sampleNext(modelRef.current, ctx, temp, Math.random);
    if (!s) return;
    if (reduce) {
      setLastStep(s);
      setGenText((g) => g + s.ch);
      return;
    }
    // marker target: the centre of the picked segment (in the T-weighted strip)
    const segs = diceSegs;
    let target = 50;
    if (segs) {
      let acc = 0;
      for (let i = 0; i < s.idx; i++) acc += segs[i];
      target = (acc + segs[s.idx] / 2) * 100;
    }
    spinTimers.current.forEach(clearTimeout);
    spinTimers.current = [];
    const STEPS = 13;
    const rng = Math.random;
    for (let i = 0; i < STEPS; i++) {
      const tmr = setTimeout(
        () => {
          const p = i / (STEPS - 1);
          const wild = rng() * 100;
          const pct = i === STEPS - 1 ? target : wild * (1 - p) + target * p;
          setSpin({ pct, settled: i === STEPS - 1, target });
          if (i === STEPS - 1) {
            setLastStep(s);
            setGenText((g) => g + s.ch);
          }
        },
        60 + i * (38 + i * 7),
      );
      spinTimers.current.push(tmr);
    }
  }, [curChar, temp, diceSegs, reduce, spin]);

  /* paso auto: one readable step every 1.7 s */
  useEffect(() => {
    if (!pasoAuto || mode !== 1) return;
    if (genText.length >= GEN_CAP) {
      setPasoAuto(false);
      return;
    }
    const id = setInterval(() => stepOnce(), 1700);
    return () => clearInterval(id);
  }, [pasoAuto, mode, stepOnce, genText.length]);

  useEffect(() => () => spinTimers.current.forEach(clearTimeout), []);

  /* ════════════════ writing: tú eliges ════════════════ */

  const pickLetter = useCallback(
    (i: number) => {
      if (!curRow || curRow[i] === 0) return;
      setLastStep({ ch: ALPHA[i], idx: i, usedCtx: curChar, usedK: 1 });
      setGenText((g) => g + ALPHA[i]);
      setInspHover(-1);
    },
    [curRow, curChar],
  );

  const rollForMe = useCallback(() => {
    if (!curRow) return;
    const i = sampleRow(curRow, temp, Math.random);
    if (i >= 0) pickLetter(i);
  }, [curRow, temp, pickLetter]);

  /* ════════════════ derived ════════════════ */

  const report = reportRef.current;
  const overCap = charCount > CAP;
  const stats = useMemo(() => {
    if (stage !== "ready") return null;
    let used = 0;
    for (const row of modelRef.current.counts.values())
      for (let i = 0; i < VOCAB; i++) if (row[i] > 0) used++;
    return { used, pairs: modelRef.current.totalNgrams };
  }, [stage]);

  const copyOut = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(written);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — the text stays selectable */
    }
  }, [written]);

  const gridWidth = GUTTER + VOCAB * CELL + (VOCAB + 1) * GAP + PAD * 2;
  const progress = streamRef.current.length > 0 ? head / streamRef.current.length : 0;
  const hoverCount = hover ? countAt(hover.r, hover.c) : 0;

  /* ════════════════════════════════ render ════════════════════════════════ */

  return (
    <div className="bw-tbl" style={{ maxWidth: 760, margin: "0 auto", fontFamily: SERIF }}>
      {/* ══════════ FEED — your text, as much as you want ══════════ */}
      {stage === "feed" && (
        <motion.div
          key="feed"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: STD }}
        >
          <p className="bw-tbl__lead">{t("trainBigramLab.lead")}</p>

          <textarea
            ref={taRef}
            className="bw-tbl__ta"
            placeholder={t("trainBigramLab.placeholder")}
            spellCheck={false}
            onInput={onTaInput}
            aria-label={t("trainBigramLab.placeholder")}
          />

          <div className="bw-tbl__feedrow">
            <div className="bw-tbl__feedactions">
              <GhostButton onClick={() => fileRef.current?.click()}>
                {t("trainBigramLab.upload")}
              </GhostButton>
              <GhostButton onClick={loadSample}>{t("trainBigramLab.sample")}</GhostButton>
              {charCount > 0 && (
                <GhostButton onClick={clearText}>{t("trainBigramLab.clear")}</GhostButton>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.text,text/plain"
                onChange={onFile}
                style={{ display: "none" }}
              />
            </div>
            <span className="bw-tbl__count" data-over={overCap ? "1" : "0"}>
              {overCap
                ? t("trainBigramLab.truncated", { cap: fmt(CAP) })
                : t("trainBigramLab.count", { n: fmt(charCount), cap: fmt(CAP) })}
            </span>
          </div>

          <div className="bw-tbl__trainrow">
            <PlayButton onClick={train} disabled={charCount < 2}>
              {t("trainBigramLab.train")}
            </PlayButton>
            {charCount > 1 && charCount < 600 && (
              <span className="bw-tbl__tiny">{t("trainBigramLab.tiny")}</span>
            )}
          </div>
        </motion.div>
      )}

      {/* ══════════ READING + READY·TABLA — the papiro, the climbing count, the board ══════════ */}
      {stage !== "feed" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* papiro while reading */}
          <AnimatePresence>
            {stage === "reading" && (
              <motion.div
                key="papiro"
                initial={reduce ? false : { opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.32, ease: STD }}
                style={{ width: "100%", maxWidth: 560, marginBottom: 22 }}
              >
                <ParchmentReader
                  text={streamRef.current}
                  windowStart={Math.max(0, head - 88)}
                  windowSize={SCAN_WIN}
                  head={head - 1}
                  hot1={lit ? head - 2 : -1}
                  hot2={lit ? head - 1 : -1}
                  progress={progress}
                  reading
                  markerLabel={t("trainBigramLab.readingMarker")}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ready chrome: tabs + retrain */}
          {stage === "ready" && (
            <div className="bw-tbl__readybar">
              <Tabs
                tabs={[t("trainBigramLab.tabTable"), t("trainBigramLab.tabWrite")]}
                active={readyTab}
                onChange={(i) => {
                  setReadyTab(i);
                  setRunning(false);
                  setPasoAuto(false);
                }}
                ariaLabel="vista"
              />
              <GhostButton onClick={() => setStage("feed")}>
                {t("trainBigramLab.retrain")}
              </GhostButton>
            </div>
          )}

          {(stage === "reading" || readyTab === 0) && (
            <>
              {/* live statistics bar */}
              <div className="bw-tbl__statbar" style={{ maxWidth: gridWidth }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span className="bw-tbl__statlabel">{t("trainBigramLab.pairsLabel")}</span>
                  <span className="bw-tbl__stattotal">
                    {fmt(stage === "ready" ? (stats?.pairs ?? 0) : modelRef.current.totalNgrams)}
                  </span>
                </div>
                <div style={{ minWidth: 132, textAlign: "right" }}>
                  <AnimatePresence mode="wait">
                    {stage === "reading" && lit ? (
                      <motion.span
                        key={`${lit.r}-${lit.c}-${lit.n}`}
                        initial={reduce ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="bw-tbl__fedpair"
                      >
                        <span className="bw-tbl__fedglyph">{displayChar(ALPHA[lit.r])}</span>
                        <span className="bw-tbl__fedarrow">→</span>
                        <span className="bw-tbl__fedglyph">{displayChar(ALPHA[lit.c])}</span>
                        <span className="bw-tbl__fedcount">{fmt(lit.n)}</span>
                      </motion.span>
                    ) : stage === "reading" && speedX > 1 ? (
                      <motion.span
                        key="speed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bw-tbl__speed"
                      >
                        ×{fmt(speedX)}
                      </motion.span>
                    ) : stage === "ready" && stats ? (
                      <motion.span
                        key="used"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bw-tbl__cellsused"
                      >
                        {t("trainBigramLab.cellsUsed", { used: fmt(stats.used) })}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              {/* THE BOARD — fixed alphabetical 27×27 */}
              <div
                style={{
                  position: "relative",
                  padding: PAD,
                  borderRadius: "var(--bigram-r-md)",
                  background: "var(--bigram-bg-2)",
                  boxShadow:
                    "inset 0 2px 12px color-mix(in oklab, var(--bigram-ink) 13%, transparent), inset 0 0 0 1px var(--bigram-rule)",
                  width: gridWidth,
                  maxWidth: "100%",
                }}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: `${GUTTER}px repeat(${VOCAB}, ${CELL}px)`,
                    gridAutoRows: `${CELL}px`,
                    columnGap: GAP,
                    rowGap: GAP,
                  }}
                >
                  <span style={{ width: GUTTER, height: CELL }} aria-hidden />
                  {ALPHA.map((ch, ci) => (
                    <AxisChar
                      key={`col-${ch}`}
                      ch={ch}
                      active={
                        (lit?.c === ci && stage === "reading") || hover?.c === ci || selCol === ci
                      }
                    />
                  ))}
                  {ALPHA.map((rch, r) => (
                    <RowFragment
                      key={`row-${rch}`}
                      rch={rch}
                      r={r}
                      settled={stage === "ready"}
                      rowActive={
                        (lit?.r === r && stage === "reading") || hover?.r === r || selRow === r
                      }
                      litCol={
                        lit?.r === r && stage === "reading" ? lit.c : selRow === r ? selCol : -1
                      }
                      hoverCol={hover?.r === r ? hover.c : -1}
                      version={rowVers[r] ?? 0}
                      heatAt={heatAt}
                      onHoverCell={(c) => setHover({ r, c })}
                      onClickCell={
                        stage === "ready"
                          ? (c) => {
                              setSelRow(r);
                              setSelCol(c);
                              setInspHover(-1);
                            }
                          : undefined
                      }
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {hover && (
                    <motion.div
                      key="tip"
                      initial={reduce ? false : { opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="bw-tbl__tip"
                    >
                      {hoverCount > 0
                        ? t("trainBigramLab.cellCount", {
                            row: displayChar(ALPHA[hover.r]),
                            col: displayChar(ALPHA[hover.c]),
                            n: fmt(hoverCount),
                          })
                        : t("trainBigramLab.cellNever", {
                            row: displayChar(ALPHA[hover.r]),
                            col: displayChar(ALPHA[hover.c]),
                          })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* reading: skip · ready: the fold report + the row inspector */}
              {stage === "reading" && (
                <div style={{ marginTop: 16 }}>
                  <GhostButton onClick={() => (skipRef.current = true)}>
                    {t("trainBigramLab.skip")}
                  </GhostButton>
                </div>
              )}

              {stage === "ready" && report && (
                <p className="bw-tbl__fold">
                  {t("trainBigramLab.foldReport", {
                    letters: fmt(report.letters),
                    accents: fmt(report.accentsFolded),
                    symbols: fmt(report.toSpace),
                  })}
                  {report.truncated
                    ? " · " + t("trainBigramLab.foldTruncated", { cap: fmt(CAP) })
                    : ""}
                </p>
              )}

              {/* row inspector — click a cell to pin its row */}
              <AnimatePresence>
                {stage === "ready" && selRow >= 0 && (
                  <motion.div
                    key={`insp-${selRow}`}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: STD }}
                    className="bw-tbl__insp"
                  >
                    <div className="bw-tbl__insphead">
                      <span className="bw-tbl__insplabel">
                        {t("trainBigramLab.rowLabel", { ch: displayChar(ALPHA[selRow]) })}
                      </span>
                      <span className="bw-tbl__insptotal">
                        {inspHover >= 0
                          ? t("trainBigramLab.rowSlot", {
                              ch: displayChar(ALPHA[inspHover]),
                              n: fmt(countAt(selRow, inspHover)),
                              pct: rowTotRef.current[selRow]
                                ? fmtPct(
                                    (countAt(selRow, inspHover) / rowTotRef.current[selRow]) * 100,
                                    language,
                                  )
                                : "0",
                            })
                          : selCol >= 0
                            ? countAt(selRow, selCol) > 0
                              ? t("trainBigramLab.cellCount", {
                                  row: displayChar(ALPHA[selRow]),
                                  col: displayChar(ALPHA[selCol]),
                                  n: fmt(countAt(selRow, selCol)),
                                })
                              : t("trainBigramLab.cellNever", {
                                  row: displayChar(ALPHA[selRow]),
                                  col: displayChar(ALPHA[selCol]),
                                })
                            : t("trainBigramLab.rowTotal", { n: fmt(rowTotRef.current[selRow]) })}
                      </span>
                    </div>
                    <FixedAlphabetRow
                      cols={ALPHA}
                      counts={Array.from(
                        modelRef.current.row(ALPHA[selRow]) ?? new Uint32Array(VOCAB),
                      )}
                      winner={(() => {
                        const row = modelRef.current.row(ALPHA[selRow]);
                        if (!row) return -1;
                        let b = 0;
                        for (let i = 1; i < VOCAB; i++) if (row[i] > row[b]) b = i;
                        return row[b] > 0 ? b : -1;
                      })()}
                      hoverIdx={inspHover}
                      onHover={(i) => setInspHover(i ?? -1)}
                      height={120}
                      maxWidth={620}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {stage === "ready" && selRow < 0 && (
                <p className="bw-tbl__hint">{t("trainBigramLab.tableHint")}</p>
              )}
            </>
          )}

          {/* ══════════ READY · ESCRIBIR ══════════ */}
          {stage === "ready" && readyTab === 1 && (
            <div style={{ width: "100%", maxWidth: 680 }}>
              {/* mode tabs + temperature */}
              <div className="bw-tbl__writebar">
                <Tabs
                  tabs={[
                    t("trainBigramLab.modeSolo"),
                    t("trainBigramLab.modePaso"),
                    t("trainBigramLab.modeManual"),
                  ]}
                  active={mode}
                  onChange={(i) => {
                    setMode(i);
                    setRunning(false);
                    setPasoAuto(false);
                    setSpin(null);
                  }}
                  ariaLabel="modo"
                />
              </div>

              <div className="bw-tbl__temprow">
                <span className="bw-tbl__templabel">{t("trainBigramLab.tempLabel")}</span>
                <span className="bw-tbl__tempend">{t("trainBigramLab.tempCold")}</span>
                <input
                  type="range"
                  className="bw-tbl__range"
                  min={0.1}
                  max={3}
                  step={0.05}
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value))}
                  aria-label={t("trainBigramLab.tempLabel")}
                />
                <span className="bw-tbl__tempend">{t("trainBigramLab.tempHot")}</span>
                <span className="bw-tbl__tempval">{temp.toFixed(2)}</span>
              </div>

              {/* seed — only before anything is written */}
              {genText.length === 0 && (
                <div className="bw-tbl__seedrow">
                  <span className="bw-tbl__templabel">{t("trainBigramLab.seedLabel")}</span>
                  <input
                    type="text"
                    className="bw-tbl__seedinput"
                    value={seedRaw}
                    maxLength={80}
                    placeholder="␣"
                    onChange={(e) => setSeedRaw(e.target.value)}
                    aria-label={t("trainBigramLab.seedLabel")}
                  />
                </div>
              )}

              {/* ── PASO A PASO machinery: the row + the loaded dice ── */}
              {mode === 1 && (
                <div className="bw-tbl__paso">
                  <div className="bw-tbl__pasohead">
                    <span className="bw-tbl__curchip">{displayChar(curChar)}</span>
                    <span className="bw-tbl__pasocap">
                      {spin && !spin.settled
                        ? t("trainBigramLab.stepSpin")
                        : lastStep && spin?.settled
                          ? t("trainBigramLab.stepLanded", { ch: displayChar(lastStep.ch) })
                          : t("trainBigramLab.stepRow", { ch: displayChar(curChar) })}
                    </span>
                  </div>
                  <FixedAlphabetRow
                    cols={ALPHA}
                    counts={Array.from(curRow ?? new Uint32Array(VOCAB))}
                    winner={spin?.settled && lastStep ? lastStep.idx : -1}
                    hoverIdx={inspHover}
                    onHover={(i) => setInspHover(i ?? -1)}
                    height={96}
                    maxWidth={620}
                  />
                  {/* the loaded dice: one strip, segments = T-weighted shares */}
                  {diceSegs && (
                    <div className="bw-tbl__dice">
                      {diceSegs.map((w, i) =>
                        w > 0 ? (
                          <span
                            key={i}
                            className="bw-tbl__seg"
                            data-hit={spin?.settled && lastStep?.idx === i ? "1" : "0"}
                            style={{
                              width: `${w * 100}%`,
                              background: heat(Math.min(1, w * 2.4), 10),
                            }}
                            title={`${displayChar(ALPHA[i])} · ${fmtPct(w * 100, language)}%`}
                          >
                            {w > 0.045 ? displayChar(ALPHA[i]) : ""}
                          </span>
                        ) : null,
                      )}
                      {spin && (
                        <span
                          className="bw-tbl__marker"
                          data-settled={spin.settled ? "1" : "0"}
                          style={{ left: `${spin.pct}%` }}
                          aria-hidden
                        />
                      )}
                    </div>
                  )}
                  <div className="bw-tbl__pasoctl">
                    <PlayButton
                      onClick={stepOnce}
                      disabled={(spin != null && !spin.settled) || curTotal === 0}
                    >
                      {t("trainBigramLab.next")}
                    </PlayButton>
                    <GhostButton onClick={() => setPasoAuto((a) => !a)}>
                      {pasoAuto ? t("trainBigramLab.autoStop") : t("trainBigramLab.auto")}
                    </GhostButton>
                  </div>
                </div>
              )}

              {/* ── TÚ ELIGES machinery: the clickable row ── */}
              {mode === 2 && (
                <div className="bw-tbl__paso">
                  <div className="bw-tbl__pasohead">
                    <span className="bw-tbl__curchip">{displayChar(curChar)}</span>
                    <span className="bw-tbl__pasocap">
                      {inspHover >= 0 && curRow
                        ? curRow[inspHover] > 0
                          ? t("trainBigramLab.pickSlot", {
                              ch: displayChar(ALPHA[inspHover]),
                              n: fmt(curRow[inspHover]),
                              pct: curTotal
                                ? fmtPct((curRow[inspHover] / curTotal) * 100, language)
                                : "0",
                            })
                          : t("trainBigramLab.pickZero", { ch: displayChar(ALPHA[inspHover]) })
                        : t("trainBigramLab.manualHint")}
                    </span>
                  </div>
                  <FixedAlphabetRow
                    cols={ALPHA}
                    counts={Array.from(curRow ?? new Uint32Array(VOCAB))}
                    winner={-1}
                    hoverIdx={inspHover}
                    onHover={(i) => setInspHover(i ?? -1)}
                    onSelect={pickLetter}
                    height={96}
                    maxWidth={620}
                  />
                  <div className="bw-tbl__pasoctl">
                    <GhostButton onClick={rollForMe}>{t("trainBigramLab.rollForMe")}</GhostButton>
                  </div>
                </div>
              )}

              {/* ── the output ── */}
              <div
                ref={outRef}
                className="bw-tbl__out"
                data-empty={written.trim().length === 0 ? "1" : "0"}
              >
                {written.length === 0 ? (
                  <span className="bw-tbl__outempty">{t("trainBigramLab.outEmpty")}</span>
                ) : (
                  <>
                    <span className="bw-tbl__outseed">
                      {genText.length > 0 ? seedStream : seedStream.slice(0, -1)}
                    </span>
                    <span>{genText.slice(0, -1)}</span>
                    <span className="bw-tbl__outlast">
                      {displayChar(written[written.length - 1])}
                    </span>
                  </>
                )}
              </div>

              <div className="bw-tbl__outbar">
                {mode === 0 && (
                  <PlayButton
                    onClick={() => setRunning((r) => !r)}
                    disabled={modelRef.current.totalNgrams === 0}
                  >
                    {running
                      ? t("trainBigramLab.pause")
                      : genText.length > 0
                        ? t("trainBigramLab.more")
                        : t("trainBigramLab.go")}
                  </PlayButton>
                )}
                <span className="bw-tbl__outcount">
                  {genText.length > 0
                    ? t("trainBigramLab.lettersWritten", { n: fmt(genText.length) })
                    : ""}
                  {lastStep && lastStep.usedK === 0 ? " · " + t("trainBigramLab.backoffNote") : ""}
                </span>
                <span style={{ flex: 1 }} />
                {genText.length > 0 && (
                  <>
                    <GhostButton onClick={copyOut}>
                      {copied ? t("trainBigramLab.copied") : t("trainBigramLab.copy")}
                    </GhostButton>
                    <GhostButton onClick={resetWriting}>{t("trainBigramLab.clearOut")}</GhostButton>
                  </>
                )}
              </div>

              {/* solo glimpse: the row being consulted right now */}
              {mode === 0 && genText.length > 0 && curRow && curTotal > 0 && (
                <div className="bw-tbl__glimpse">
                  <span className="bw-tbl__glimpselabel">{t("trainBigramLab.glimpseLabel")}</span>
                  <span className="bw-tbl__glimpsechip">{displayChar(curChar)}</span>
                  <span className="bw-tbl__glimpsearrow">→</span>
                  <div className="bw-tbl__glimpserow">
                    {topOfRow(curRow, 9).map(({ i, c }) => (
                      <span
                        key={i}
                        className="bw-tbl__glimpsecell"
                        data-hit={lastStep?.idx === i ? "1" : "0"}
                        style={{ background: heat(c / curTotal, 8) }}
                      >
                        {displayChar(ALPHA[i])}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
                .bw-tbl__lead { font-family: ${SERIF}; font-size: clamp(17px, 2.2vw, 21px); line-height: 1.5; color: var(--bigram-ink); margin: 4px auto 18px; max-width: 44ch; text-align: center; text-wrap: balance; }
                .bw-tbl__ta { display: block; width: 100%; min-height: 190px; resize: vertical; padding: 18px 20px; border: 1px solid var(--bigram-rule); border-radius: var(--bigram-r-md); background: var(--bigram-bg-2); color: var(--bigram-ink); font-family: ${MONO}; font-size: 13px; line-height: 1.7; box-shadow: inset 0 2px 12px color-mix(in oklab, var(--bigram-ink) 10%, transparent); outline: none; }
                .bw-tbl__ta:focus { border-color: color-mix(in oklab, var(--bigram-accent) 55%, var(--bigram-rule)); }
                .bw-tbl__ta::placeholder { color: var(--bigram-dim); font-style: italic; }
                .bw-tbl__feedrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
                .bw-tbl__feedactions { display: flex; gap: 8px; flex-wrap: wrap; }
                .bw-tbl__count { font-family: ${MONO}; font-size: 11px; letter-spacing: .04em; color: var(--bigram-dim); font-variant-numeric: tabular-nums; }
                .bw-tbl__count[data-over="1"] { color: var(--bigram-accent-ink); }
                .bw-tbl__trainrow { display: flex; align-items: center; gap: 14px; justify-content: center; margin-top: 22px; flex-wrap: wrap; }
                .bw-tbl__tiny { font-family: ${SERIF}; font-style: italic; font-size: 13.5px; color: var(--bigram-muted); }

                .bw-tbl__readybar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; width: 100%; max-width: 680px; margin-bottom: 20px; }
                .bw-tbl__statbar { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; margin-bottom: 10px; gap: 16px; }
                .bw-tbl__statlabel { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--bigram-muted); }
                .bw-tbl__stattotal { font-family: ${MONO}; font-size: clamp(26px, 3.6vw, 34px); font-weight: 700; line-height: 1; color: var(--bigram-accent-ink); font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
                .bw-tbl__fedpair { display: inline-flex; align-items: center; gap: 8px; font-family: ${MONO}; font-variant-numeric: tabular-nums; }
                .bw-tbl__fedglyph { font-size: 15px; font-weight: 700; color: var(--bigram-ink); min-width: 12px; text-align: center; }
                .bw-tbl__fedarrow { font-size: 13px; color: var(--bigram-muted); }
                .bw-tbl__fedcount { font-size: 16px; font-weight: 700; color: var(--bigram-accent-ink); margin-left: 4px; min-width: 40px; text-align: right; }
                .bw-tbl__speed { font-family: ${MONO}; font-size: 15px; font-weight: 700; letter-spacing: .04em; color: var(--bigram-accent-ink); font-variant-numeric: tabular-nums; }
                .bw-tbl__cellsused { font-family: ${MONO}; font-size: 11.5px; letter-spacing: .05em; color: var(--bigram-muted); font-variant-numeric: tabular-nums; }
                .bw-tbl__tip { position: absolute; top: -14px; left: 50%; transform: translate(-50%, -100%); padding: 6px 12px; border-radius: var(--bigram-r-sm); background: var(--bigram-surface); box-shadow: 0 8px 22px -10px color-mix(in oklab, var(--bigram-ink) 60%, transparent), inset 0 0 0 1px var(--bigram-rule); font-family: ${MONO}; font-size: 13px; font-weight: 600; color: var(--bigram-ink); white-space: nowrap; font-variant-numeric: tabular-nums; pointer-events: none; z-index: 4; }
                .bw-tbl__fold { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .05em; color: var(--bigram-dim); margin: 14px 0 0; text-align: center; font-variant-numeric: tabular-nums; max-width: 60ch; }
                .bw-tbl__hint { font-family: ${SERIF}; font-size: clamp(14px, 1.6vw, 16px); font-style: italic; color: var(--bigram-muted); margin: 14px 0 0; text-align: center; max-width: 52ch; }
                .bw-tbl__insp { width: 100%; max-width: 680px; margin-top: 20px; padding: 18px 20px 14px; border-radius: var(--bigram-r-md); background: color-mix(in oklab, var(--bigram-surface) 70%, var(--bigram-bg)); box-shadow: inset 0 0 0 1px var(--bigram-rule); }
                .bw-tbl__insphead { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
                .bw-tbl__insplabel { font-family: ${MONO}; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--bigram-muted); }
                .bw-tbl__insptotal { font-family: ${MONO}; font-size: 13px; font-weight: 600; color: var(--bigram-accent-ink); font-variant-numeric: tabular-nums; }

                .bw-tbl__writebar { display: flex; justify-content: center; margin-bottom: 14px; }
                .bw-tbl__temprow { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 10px; flex-wrap: wrap; }
                .bw-tbl__templabel { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--bigram-muted); }
                .bw-tbl__tempend { font-family: ${SERIF}; font-style: italic; font-size: 12.5px; color: var(--bigram-dim); }
                .bw-tbl__tempval { font-family: ${MONO}; font-size: 12px; font-weight: 700; color: var(--bigram-accent-ink); font-variant-numeric: tabular-nums; min-width: 36px; }
                .bw-tbl__range { -webkit-appearance: none; appearance: none; width: min(240px, 40vw); height: 4px; border-radius: 999px; background: linear-gradient(to right, color-mix(in oklab, var(--bigram-accent) 60%, var(--bigram-bg-2)), var(--bigram-accent-bright)); outline: none; cursor: pointer; }
                .bw-tbl__range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 999px; background: var(--bigram-accent); box-shadow: 0 1px 6px color-mix(in oklab, var(--bigram-ink) 35%, transparent), inset 0 0 0 2px var(--bigram-bg); cursor: grab; }
                .bw-tbl__range::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 999px; background: var(--bigram-accent); box-shadow: 0 1px 6px color-mix(in oklab, var(--bigram-ink) 35%, transparent), inset 0 0 0 2px var(--bigram-bg); cursor: grab; }
                .bw-tbl__seedrow { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 12px; }
                .bw-tbl__seedinput { font-family: ${MONO}; font-size: 13px; padding: 7px 12px; width: min(280px, 50vw); border: 1px solid var(--bigram-rule); border-radius: var(--bigram-r-sm); background: var(--bigram-bg-2); color: var(--bigram-ink); outline: none; }
                .bw-tbl__seedinput:focus { border-color: color-mix(in oklab, var(--bigram-accent) 55%, var(--bigram-rule)); }

                .bw-tbl__paso { width: 100%; padding: 18px 20px 16px; border-radius: var(--bigram-r-md); background: color-mix(in oklab, var(--bigram-surface) 70%, var(--bigram-bg)); box-shadow: inset 0 0 0 1px var(--bigram-rule); margin-bottom: 14px; }
                .bw-tbl__pasohead { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; min-height: 34px; }
                .bw-tbl__curchip { display: inline-flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 6px; border-radius: var(--bigram-r-sm); background: var(--bigram-accent); color: var(--bigram-on-accent); font-family: ${MONO}; font-size: 18px; font-weight: 700; }
                .bw-tbl__pasocap { font-family: ${MONO}; font-size: 12px; letter-spacing: .05em; color: var(--bigram-muted); font-variant-numeric: tabular-nums; }
                .bw-tbl__dice { position: relative; display: flex; width: 100%; max-width: 620px; height: 26px; margin: 14px auto 2px; border-radius: 999px; overflow: visible; }
                .bw-tbl__seg { display: inline-flex; align-items: center; justify-content: center; height: 100%; font-family: ${MONO}; font-size: 10px; font-weight: 700; color: var(--bigram-ink); overflow: hidden; white-space: nowrap; transition: box-shadow .15s ease; }
                .bw-tbl__seg:first-child { border-radius: 999px 0 0 999px; }
                .bw-tbl__seg:last-child { border-radius: 0 999px 999px 0; }
                .bw-tbl__seg[data-hit="1"] { box-shadow: inset 0 0 0 2px var(--bigram-accent-bright); }
                .bw-tbl__marker { position: absolute; top: -7px; width: 2px; height: 40px; background: var(--bigram-accent-ink); border-radius: 2px; transition: left .05s linear; }
                .bw-tbl__marker[data-settled="1"] { background: var(--bigram-accent-bright); width: 3px; transition: left .18s cubic-bezier(.2,.8,.2,1); }
                .bw-tbl__pasoctl { display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }

                .bw-tbl__out { width: 100%; min-height: 130px; max-height: 300px; overflow-y: auto; padding: 20px 24px; border-radius: var(--bigram-r-md); background: var(--bigram-bg-2); box-shadow: inset 0 2px 12px color-mix(in oklab, var(--bigram-ink) 10%, transparent), inset 0 0 0 1px var(--bigram-rule); font-family: ${SERIF}; font-size: clamp(18px, 2.2vw, 22px); line-height: 1.75; color: var(--bigram-ink); white-space: pre-wrap; word-break: break-word; }
                .bw-tbl__outempty { font-style: italic; color: var(--bigram-dim); font-size: 15px; }
                .bw-tbl__outseed { color: var(--bigram-muted); }
                .bw-tbl__outlast { color: var(--bigram-on-accent); background: var(--bigram-accent); border-radius: 3px; padding: 1px 3px; font-weight: 600; }
                .bw-tbl__outbar { display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
                .bw-tbl__outcount { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .05em; color: var(--bigram-dim); font-variant-numeric: tabular-nums; }
                .bw-tbl__glimpse { display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
                .bw-tbl__glimpselabel { font-family: ${MONO}; font-size: 10px; letter-spacing: .14em; text-transform: uppercase; color: var(--bigram-dim); margin-right: 2px; }
                .bw-tbl__glimpsechip { display: inline-flex; align-items: center; justify-content: center; min-width: 26px; height: 26px; border-radius: var(--bigram-r-sm); background: var(--bigram-accent); color: var(--bigram-on-accent); font-family: ${MONO}; font-size: 14px; font-weight: 700; }
                .bw-tbl__glimpsearrow { font-family: ${MONO}; font-size: 13px; color: var(--bigram-muted); }
                .bw-tbl__glimpserow { display: flex; gap: 4px; }
                .bw-tbl__glimpsecell { display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 4px; font-family: ${MONO}; font-size: 12px; font-weight: 600; color: var(--bigram-ink); transition: box-shadow .15s ease; }
                .bw-tbl__glimpsecell[data-hit="1"] { box-shadow: inset 0 0 0 2px var(--bigram-accent-bright); }

                @media (max-width: 700px) { .bw-tbl__statbar { flex-direction: column; align-items: flex-start; gap: 6px; } }
            `}</style>
    </div>
  );
});

export default TrainBigramLab;

/** top-N nonzero slots of a row, by count, in alphabet order of magnitude. */
function topOfRow(row: Uint32Array, n: number): { i: number; c: number }[] {
  const all: { i: number; c: number }[] = [];
  for (let i = 0; i < row.length; i++) if (row[i] > 0) all.push({ i, c: row[i] });
  all.sort((a, b) => b.c - a.c);
  return all.slice(0, n);
}

/* ════════════════════════════════════════════════════════════════════════
   Board pieces — GrowingMatrix27's exact cell/axis idiom (memoised rows, CSS-transition heat).
   ════════════════════════════════════════════════════════════════════════ */

const Cell = memo(function Cell({
  p,
  active,
  hovered,
  settled,
  onHover,
  onClick,
}: {
  p: number;
  active: boolean;
  hovered: boolean;
  settled: boolean;
  onHover: () => void;
  onClick?: () => void;
}) {
  return (
    <span
      onMouseEnter={onHover}
      onClick={onClick}
      style={{
        width: CELL,
        height: CELL,
        borderRadius: 3,
        background: heat(p, HEAT_FLOOR),
        cursor: onClick ? "pointer" : "default",
        boxShadow: active
          ? "0 0 0 2px var(--bigram-accent-bright)"
          : hovered
            ? "inset 0 0 0 1.5px var(--bigram-accent-ink)"
            : "none",
        transition: settled ? "box-shadow .12s ease" : "background .3s ease, box-shadow .15s ease",
      }}
    />
  );
});

const RowFragment = memo(function RowFragment({
  rch,
  r,
  settled,
  rowActive,
  litCol,
  hoverCol,
  onHoverCell,
  onClickCell,
  heatAt,
  version,
}: {
  rch: string;
  r: number;
  settled: boolean;
  rowActive: boolean;
  litCol: number;
  hoverCol: number;
  onHoverCell: (c: number) => void;
  onClickCell?: (c: number) => void;
  version: number;
  heatAt: (r: number, c: number) => number;
}) {
  void version;
  return (
    <>
      <AxisChar ch={rch} active={rowActive} rowHead />
      {Array.from({ length: VOCAB }, (_, c) => (
        <Cell
          key={c}
          p={heatAt(r, c)}
          active={litCol === c}
          hovered={hoverCol === c}
          settled={settled}
          onHover={() => onHoverCell(c)}
          onClick={onClickCell ? () => onClickCell(c) : undefined}
        />
      ))}
    </>
  );
});

const AxisChar = memo(function AxisChar({
  ch,
  active,
  rowHead = false,
}: {
  ch: string;
  active: boolean;
  rowHead?: boolean;
}) {
  return (
    <span
      aria-hidden
      style={{
        width: rowHead ? GUTTER : CELL,
        height: CELL,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: rowHead ? "flex-end" : "center",
        paddingRight: rowHead ? 4 : 0,
        fontFamily: MONO,
        fontSize: 10,
        fontWeight: active ? 700 : 500,
        lineHeight: 1,
        color: active ? "var(--bigram-accent-ink)" : "var(--bigram-ink-2)",
        transition: "color .2s ease, font-weight .2s ease",
      }}
    >
      {displayChar(ch)}
    </span>
  );
});
