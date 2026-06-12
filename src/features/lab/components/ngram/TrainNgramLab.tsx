"use client";

/**
 * TrainNgramLab — "entrena tu propio n-grama": the chapter's playground hero.
 *
 * Same journey as TrainBigramLab but with k letters of memory (k = 1…5, bigrama → 6-grama), chosen
 * BEFORE training. The table can't be drawn whole any more — that's the chapter's lesson — so the
 * exploration is sparse and honest:
 *   · while reading: the count of DISTINCT rows discovered climbs, and a coverage bar shows how
 *     little of the 27^k possible rows your text actually touched (the scale IS the picture);
 *   · the table tab: search any k-letter row (or pick a frequent one / a random one) and inspect it
 *     as a FixedAlphabetRow — including the honest "fila vacía" dead end;
 *   · writing: solo / paso a paso (loaded dice over the row's T-weighted segments) / tú eliges
 *     (clickable row), with VISIBLE backoff when the current context was never seen.
 *
 * Standalone for now (bench only — NOT in the narrative yet). Assembled from the ngram kit; engine:
 * data/trainableModel (counts level k + backoff levels 1 and 0).
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

/* The teaching scan + the ramp — same temperature as the bigram twin. */
const SLOW_STEPS = 12;
const SLOW_MS0 = 520;
const SLOW_DECAY = 0.85;
const RAMP_X = 1.85;
const RAMP_EVERY = 560;
const RAMP_V0 = 40;
const SCAN_WIN = 200;
const GEN_CAP = 4000;

type Stage = "feed" | "reading" | "ready";

/** % in the reader's locale; tiny values keep significant digits instead of rounding to 0. */
function fmtPct(x: number, lang: string): string {
  if (x <= 0) return "0";
  const s = x >= 1 ? x.toFixed(1) : x.toPrecision(2);
  return lang === "es" ? s.replace(".", ",") : s;
}

export interface TrainNgramLabProps {
  accent?: "ngram";
}

export const TrainNgramLab = memo(function TrainNgramLab({
  accent = "ngram",
}: TrainNgramLabProps = {}) {
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
  const [k, setK] = useState(3);
  const cap = CHAR_CAPS[k];
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [charCount, setCharCount] = useState(0);
  const countRaf = useRef(0);

  const streamRef = useRef("");
  const reportRef = useRef<FoldReport | null>(null);
  const modelRef = useRef<TrainedModel>(new TrainedModel(3));
  const headRef = useRef(0);
  const skipRef = useRef(false);

  /* reading visuals */
  const [head, setHead] = useState(0);
  const [observed, setObserved] = useState(0);
  const [lit, setLit] = useState<{ ctx: string; next: string; n: number } | null>(null);
  const [recentCtx, setRecentCtx] = useState<string[]>([]);
  const [speedX, setSpeedX] = useState(0);

  /* ready chrome */
  const [readyTab, setReadyTab] = useState(0);

  /* table exploration */
  const [searchRaw, setSearchRaw] = useState("");
  const [searchHover, setSearchHover] = useState(-1);

  /* ════════════════ writing state ════════════════ */
  const [mode, setMode] = useState(0);
  const [temp, setTemp] = useState(0.85);
  const [seedRaw, setSeedRaw] = useState("");
  const [genText, setGenText] = useState("");
  const [running, setRunning] = useState(false);
  const [lastStep, setLastStep] = useState<SampleStep | null>(null);
  const [copied, setCopied] = useState(false);
  const [spin, setSpin] = useState<{ pct: number; settled: boolean } | null>(null);
  const [pasoAuto, setPasoAuto] = useState(false);
  const [inspHover, setInspHover] = useState(-1);
  const spinTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const outRef = useRef<HTMLDivElement>(null);
  const genRef = useRef("");
  genRef.current = genText;

  const seedStream = useMemo(() => foldText(seedRaw, 400).stream, [seedRaw]);
  const written = seedStream + genText;
  const kUsed = modelRef.current.k;

  /* ════════════════ helpers ════════════════ */

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

  /** The row the model would ACTUALLY consult for the current text — with honest backoff. */
  const effective = useCallback(
    (ctxFull: string): { row: Uint32Array | null; ctx: string; usedK: number } => {
      const m = modelRef.current;
      const kk = m.k;
      if (ctxFull.length >= kk) {
        const ctx = ctxFull.slice(-kk);
        const row = m.row(ctx);
        if (row) return { row, ctx, usedK: kk };
      }
      if (kk > 1 && ctxFull.length >= 1) {
        const c1 = ctxFull.slice(-1);
        const row1 = m.counts1.get(c1) ?? null;
        if (row1) return { row: row1, ctx: c1, usedK: 1 };
      }
      return { row: m.counts0, ctx: "", usedK: 0 };
    },
    [],
  );

  /* ════════════════ the read (training) loop ════════════════ */

  const train = useCallback(() => {
    const raw = taRef.current?.value ?? "";
    const { stream, report } = foldText(raw, cap);
    if (stream.length < k + 1) return;
    streamRef.current = stream;
    reportRef.current = report;
    modelRef.current = new TrainedModel(k);
    headRef.current = k;
    skipRef.current = false;
    setHead(k);
    setObserved(0);
    setLit(null);
    setRecentCtx([]);
    setSpeedX(0);
    setReadyTab(0);
    setSearchRaw("");
    resetWriting();
    setStage("reading");
  }, [cap, k, resetWriting]);

  useEffect(() => {
    if (stage !== "reading") return;
    const stream = streamRef.current;
    const model = modelRef.current;
    const kk = model.k;
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
      setObserved(model.observedContexts);
      setLit(null);
      setStage("ready");
    };

    const silently = () => {
      const chunkLoop = () => {
        if (cancelled) return;
        const from = headRef.current;
        const to = Math.min(len, from + 800_000);
        model.feedRange(stream, from, to);
        headRef.current = to;
        setHead(to);
        setObserved(model.observedContexts);
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

    /* phase 1 — the teaching scan: a k-letter window + its next letter, slow enough to follow */
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
      const ctx = stream.slice(i - kk, i);
      const next = stream[i];
      setLit({ ctx, next, n: model.row(ctx)?.[charIdx(next)] ?? 1 });
      setRecentCtx((rc) => (rc.includes(ctx) ? rc : [...rc.slice(-9), ctx]));
      setObserved(model.observedContexts);
      setHead(i + 1);
      headRef.current = i + 1;
      step++;
      dwell = Math.max(150, dwell * SLOW_DECAY);
      timer = setTimeout(slowTick, dwell);
    };

    /* phase 2 — the ramp. Feeding happens every frame; the repaint is throttled to ~12/s. */
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
          speed = Math.min(2_000_000, speed * RAMP_X);
          lastBoost = now;
        }
        const chunk = skipRef.current ? 900_000 : Math.max(1, Math.round(speed * dt));
        const from = headRef.current;
        const to = Math.min(len, from + chunk);
        model.feedRange(stream, from, to);
        headRef.current = to;
        if (now - lastPaint > 80 || to >= len) {
          lastPaint = now;
          setHead(to);
          setObserved(model.observedContexts);
          setSpeedX(Math.max(1, Math.round(speed / RAMP_V0)));
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
  }, [stage, reduce]);

  /* ════════════════ writing loops (mirror of the bigram twin) ════════════════ */

  useEffect(() => {
    if (!running || mode !== 0) return;
    if (reduce) {
      const rng = makeRng(seedFrom(seedStream + "|" + temp + "|" + kUsed));
      let acc = "";
      for (let i = 0; i < 220; i++) {
        const ctx = (seedStream + acc).slice(-kUsed);
        const s = sampleNext(modelRef.current, ctx, temp, rng);
        if (!s) break;
        acc += s.ch;
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
      const ctx = (seedStream + g).slice(-kUsed);
      const s = sampleNext(modelRef.current, ctx, temp, Math.random);
      if (!s) {
        setRunning(false);
        return;
      }
      setLastStep(s);
      setGenText(g + s.ch);
    }, 85);
    return () => clearInterval(id);
  }, [running, mode, temp, seedStream, reduce, kUsed]);

  useEffect(() => {
    const el = outRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [genText]);

  /* the row being consulted for the NEXT letter (with backoff) */
  const eff = effective(written);
  const effTotal = eff.row ? rowTotal(eff.row) : 0;

  const diceSegs = useMemo(() => {
    if (!eff.row || effTotal === 0) return null;
    const inv = 1 / Math.max(0.1, temp);
    const w = ALPHA.map((_, i) => (eff.row![i] > 0 ? Math.pow(eff.row![i] / effTotal, inv) : 0));
    const sum = w.reduce((a, b) => a + b, 0);
    return w.map((x) => x / sum);
  }, [eff.row, effTotal, temp]);

  const stepOnce = useCallback(() => {
    if (spin && !spin.settled) return;
    const ctx = (seedStream + genRef.current).slice(-kUsed);
    const s = sampleNext(modelRef.current, ctx, temp, Math.random);
    if (!s) return;
    if (reduce) {
      setLastStep(s);
      setGenText((g) => g + s.ch);
      return;
    }
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
    for (let i = 0; i < STEPS; i++) {
      const tmr = setTimeout(
        () => {
          const p = i / (STEPS - 1);
          const wild = Math.random() * 100;
          const pct = i === STEPS - 1 ? target : wild * (1 - p) + target * p;
          setSpin({ pct, settled: i === STEPS - 1 });
          if (i === STEPS - 1) {
            setLastStep(s);
            setGenText((g) => g + s.ch);
          }
        },
        60 + i * (38 + i * 7),
      );
      spinTimers.current.push(tmr);
    }
  }, [temp, diceSegs, reduce, spin, seedStream, kUsed]);

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

  const pickLetter = useCallback(
    (i: number) => {
      if (!eff.row || eff.row[i] === 0) return;
      setLastStep({ ch: ALPHA[i], idx: i, usedCtx: eff.ctx, usedK: eff.usedK });
      setGenText((g) => g + ALPHA[i]);
      setInspHover(-1);
    },
    [eff],
  );

  const rollForMe = useCallback(() => {
    if (!eff.row) return;
    const i = sampleRow(eff.row, temp, Math.random);
    if (i >= 0) pickLetter(i);
  }, [eff, temp, pickLetter]);

  /* ════════════════ derived ════════════════ */

  const report = reportRef.current;
  const overCap = charCount > cap;
  const space = Math.pow(VOCAB, kUsed);
  const coverage = stage !== "feed" ? observed / space : 0;

  /* table search */
  const searchCtx = useMemo(() => {
    const folded = foldText(searchRaw, 60).stream;
    return folded.slice(-kUsed);
  }, [searchRaw, kUsed]);
  const searchRow = searchCtx.length === kUsed ? modelRef.current.row(searchCtx) : null;
  const searchTotal = searchRow ? rowTotal(searchRow) : 0;
  const topCtx = useMemo(
    () => (stage === "ready" ? modelRef.current.topContexts(18) : []),
    [stage],
  );

  const randomCtx = useCallback(() => {
    const c = modelRef.current.randomContext(Math.random);
    if (c) setSearchRaw(c);
  }, []);

  const seedRandom = useCallback(() => {
    const tc = modelRef.current.topContexts(12);
    if (tc.length) setSeedRaw(tc[Math.floor(Math.random() * tc.length)].ctx);
  }, []);

  const copyOut = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(written);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* clipboard unavailable — the text stays selectable */
    }
  }, [written]);

  const progress = streamRef.current.length > 0 ? head / streamRef.current.length : 0;

  /* the visible context chips (what the model is LOOKING at for the next letter) */
  const ctxShown = written.slice(-kUsed);

  /* ════════════════════════════════ render ════════════════════════════════ */

  return (
    <div className="nw-tnl" style={{ maxWidth: 760, margin: "0 auto", fontFamily: SERIF }}>
      {/* ══════════ FEED ══════════ */}
      {stage === "feed" && (
        <motion.div
          key="feed"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: STD }}
        >
          <p className="nw-tnl__lead">{t("trainNgramLab.lead")}</p>

          <textarea
            ref={taRef}
            className="nw-tnl__ta"
            placeholder={t("trainNgramLab.placeholder")}
            spellCheck={false}
            onInput={onTaInput}
            aria-label={t("trainNgramLab.placeholder")}
          />

          <div className="nw-tnl__feedrow">
            <div className="nw-tnl__feedactions">
              <GhostButton onClick={() => fileRef.current?.click()}>
                {t("trainNgramLab.upload")}
              </GhostButton>
              <GhostButton onClick={loadSample}>{t("trainNgramLab.sample")}</GhostButton>
              {charCount > 0 && (
                <GhostButton onClick={clearText}>{t("trainNgramLab.clear")}</GhostButton>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.md,.text,text/plain"
                onChange={onFile}
                style={{ display: "none" }}
              />
            </div>
            <span className="nw-tnl__count" data-over={overCap ? "1" : "0"}>
              {overCap
                ? t("trainNgramLab.truncated", { cap: fmt(cap) })
                : t("trainNgramLab.count", { n: fmt(charCount), cap: fmt(cap) })}
            </span>
          </div>

          {/* memory selector — k letters, named by its n-gram */}
          <div className="nw-tnl__memrow">
            <span className="nw-tnl__memlabel">{t("trainNgramLab.memLabel")}</span>
            <div className="nw-tnl__mempills" role="group" aria-label={t("trainNgramLab.memLabel")}>
              {[1, 2, 3, 4, 5].map((kk) => (
                <button
                  key={kk}
                  type="button"
                  className="nw-tnl__mempill"
                  data-on={k === kk ? "1" : "0"}
                  onClick={() => setK(kk)}
                >
                  <span className="nw-tnl__memnum">{kk}</span>
                  <span className="nw-tnl__memname">{t(`trainNgramLab.kName${kk}`)}</span>
                </button>
              ))}
            </div>
            <span className="nw-tnl__memspace">
              {t("trainNgramLab.memSpace", { rows: fmt(Math.pow(VOCAB, k)) })}
            </span>
          </div>

          <div className="nw-tnl__trainrow">
            <PlayButton onClick={train} disabled={charCount < k + 1}>
              {t("trainNgramLab.train")}
            </PlayButton>
            {charCount > k && charCount < 600 && (
              <span className="nw-tnl__tiny">{t("trainNgramLab.tiny")}</span>
            )}
          </div>
        </motion.div>
      )}

      {/* ══════════ READING + READY ══════════ */}
      {stage !== "feed" && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
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
                  hot1={lit ? head - 1 : -1}
                  hot2={lit ? head - 2 : -1}
                  hot2Span={kUsed}
                  progress={progress}
                  reading
                  markerLabel={t("trainNgramLab.readingMarker")}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {stage === "ready" && (
            <div className="nw-tnl__readybar">
              <Tabs
                tabs={[t("trainNgramLab.tabTable"), t("trainNgramLab.tabWrite")]}
                active={readyTab}
                onChange={(i) => {
                  setReadyTab(i);
                  setRunning(false);
                  setPasoAuto(false);
                }}
                ariaLabel="vista"
              />
              <GhostButton onClick={() => setStage("feed")}>
                {t("trainNgramLab.retrain")}
              </GhostButton>
            </div>
          )}

          {/* ── THE SHELF — distinct rows discovered + the honest coverage bar ── */}
          {(stage === "reading" || readyTab === 0) && (
            <div style={{ width: "100%", maxWidth: 640 }}>
              <div className="nw-tnl__statbar">
                <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <span className="nw-tnl__statlabel">
                    {t("trainNgramLab.rowsLabel", { name: t(`trainNgramLab.kName${kUsed}`) })}
                  </span>
                  <span className="nw-tnl__stattotal">{fmt(observed)}</span>
                </div>
                <div style={{ minWidth: 132, textAlign: "right" }}>
                  <AnimatePresence mode="wait">
                    {stage === "reading" && lit ? (
                      <motion.span
                        key={`${lit.ctx}-${lit.next}-${lit.n}`}
                        initial={reduce ? false : { opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.18 }}
                        className="nw-tnl__fedpair"
                      >
                        <span className="nw-tnl__fedctx">
                          {lit.ctx.split("").map((c, i) => (
                            <span key={i} className="nw-tnl__ctxch">
                              {displayChar(c)}
                            </span>
                          ))}
                        </span>
                        <span className="nw-tnl__fedarrow">→</span>
                        <span className="nw-tnl__fednext">{displayChar(lit.next)}</span>
                        <span className="nw-tnl__fedcount">{fmt(lit.n)}</span>
                      </motion.span>
                    ) : stage === "reading" && speedX > 1 ? (
                      <motion.span
                        key="speed"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="nw-tnl__speed"
                      >
                        ×{fmt(speedX)}
                      </motion.span>
                    ) : stage === "ready" ? (
                      <motion.span
                        key="read"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="nw-tnl__windows"
                      >
                        {t("trainNgramLab.windowsRead", { n: fmt(modelRef.current.totalNgrams) })}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              {/* coverage — the bar IS the scale */}
              <div className="nw-tnl__cov">
                <div className="nw-tnl__covbar" aria-hidden>
                  <span
                    className="nw-tnl__covfill"
                    style={{
                      width: `${Math.min(100, Math.max(coverage * 100, observed > 0 ? 0.4 : 0))}%`,
                    }}
                  />
                </div>
                <div className="nw-tnl__covline">
                  <span>
                    {t("trainNgramLab.coverage", {
                      obs: fmt(observed),
                      space: fmt(space),
                      pct: fmtPct(coverage * 100, language),
                    })}
                  </span>
                  <span className="nw-tnl__covpow">
                    27<sup>{kUsed}</sup>
                  </span>
                </div>
              </div>

              {/* the slow scan's discovered-rows ticker */}
              {stage === "reading" && recentCtx.length > 0 && speedX <= 1 && (
                <div className="nw-tnl__ticker">
                  {recentCtx.map((c) => (
                    <span key={c} className="nw-tnl__tickerchip">
                      {c.split("").map((ch, i) => (
                        <span key={i}>{displayChar(ch)}</span>
                      ))}
                    </span>
                  ))}
                </div>
              )}

              {stage === "reading" && (
                <div style={{ marginTop: 16, textAlign: "center" }}>
                  <GhostButton onClick={() => (skipRef.current = true)}>
                    {t("trainNgramLab.skip")}
                  </GhostButton>
                </div>
              )}

              {/* ── READY · TABLA: the sparse explorer ── */}
              {stage === "ready" && (
                <>
                  {report && (
                    <p className="nw-tnl__fold">
                      {t("trainNgramLab.foldReport", {
                        letters: fmt(report.letters),
                        accents: fmt(report.accentsFolded),
                        symbols: fmt(report.toSpace),
                      })}
                      {report.truncated
                        ? " · " + t("trainNgramLab.foldTruncated", { cap: fmt(cap) })
                        : ""}
                    </p>
                  )}

                  <div className="nw-tnl__search">
                    <div className="nw-tnl__searchrow">
                      <span className="nw-tnl__memlabel">
                        {t("trainNgramLab.searchLabel", { k: kUsed })}
                      </span>
                      <input
                        type="text"
                        className="nw-tnl__searchinput"
                        value={searchRaw}
                        onChange={(e) => setSearchRaw(e.target.value)}
                        placeholder={"·".repeat(kUsed)}
                        aria-label={t("trainNgramLab.searchLabel", { k: kUsed })}
                      />
                      <span className="nw-tnl__searchfold">
                        {searchCtx.length > 0 &&
                          searchCtx.split("").map((c, i) => (
                            <span
                              key={i}
                              className="nw-tnl__ctxch"
                              data-dim={searchCtx.length < kUsed ? "1" : "0"}
                            >
                              {displayChar(c)}
                            </span>
                          ))}
                      </span>
                      <GhostButton onClick={randomCtx}>{t("trainNgramLab.randomRow")}</GhostButton>
                    </div>

                    {/* the looked-up row */}
                    {searchCtx.length === kUsed && (
                      <div className="nw-tnl__rowpanel">
                        {searchRow && searchTotal > 0 ? (
                          <>
                            <div className="nw-tnl__rowhead">
                              <span className="nw-tnl__insplabel">
                                {t("trainNgramLab.rowAfter", {
                                  ctx: searchCtx.split("").map(displayChar).join(""),
                                })}
                              </span>
                              <span className="nw-tnl__insptotal">
                                {searchHover >= 0
                                  ? t("trainNgramLab.rowSlot", {
                                      ch: displayChar(ALPHA[searchHover]),
                                      n: fmt(searchRow[searchHover]),
                                      pct: fmtPct(
                                        (searchRow[searchHover] / searchTotal) * 100,
                                        language,
                                      ),
                                    })
                                  : t("trainNgramLab.rowTotal", { n: fmt(searchTotal) })}
                              </span>
                            </div>
                            <FixedAlphabetRow
                              cols={ALPHA}
                              counts={Array.from(searchRow)}
                              winner={(() => {
                                let b = 0;
                                for (let i = 1; i < VOCAB; i++)
                                  if (searchRow[i] > searchRow[b]) b = i;
                                return searchRow[b] > 0 ? b : -1;
                              })()}
                              hoverIdx={searchHover}
                              onHover={(i) => setSearchHover(i ?? -1)}
                              height={110}
                              maxWidth={620}
                            />
                          </>
                        ) : (
                          <p className="nw-tnl__empty">
                            {t("trainNgramLab.rowEmpty", {
                              ctx: searchCtx.split("").map(displayChar).join(""),
                            })}
                          </p>
                        )}
                      </div>
                    )}

                    {/* the heaviest rows — tap to inspect */}
                    {topCtx.length > 0 && (
                      <div className="nw-tnl__top">
                        <span className="nw-tnl__memlabel">{t("trainNgramLab.topLabel")}</span>
                        <div className="nw-tnl__topchips">
                          {topCtx.map(({ ctx, total }) => (
                            <button
                              key={ctx}
                              type="button"
                              className="nw-tnl__topchip"
                              data-on={ctx === searchCtx ? "1" : "0"}
                              onClick={() => setSearchRaw(ctx)}
                              title={fmt(total)}
                            >
                              {ctx.split("").map((c, i) => (
                                <span key={i}>{displayChar(c)}</span>
                              ))}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {/* ══════════ READY · ESCRIBIR ══════════ */}
          {stage === "ready" && readyTab === 1 && (
            <div style={{ width: "100%", maxWidth: 680 }}>
              <div className="nw-tnl__writebar">
                <Tabs
                  tabs={[
                    t("trainNgramLab.modeSolo"),
                    t("trainNgramLab.modePaso"),
                    t("trainNgramLab.modeManual"),
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

              <div className="nw-tnl__temprow">
                <span className="nw-tnl__templabel">{t("trainNgramLab.tempLabel")}</span>
                <span className="nw-tnl__tempend">{t("trainNgramLab.tempCold")}</span>
                <input
                  type="range"
                  className="nw-tnl__range"
                  min={0.1}
                  max={3}
                  step={0.05}
                  value={temp}
                  onChange={(e) => setTemp(parseFloat(e.target.value))}
                  aria-label={t("trainNgramLab.tempLabel")}
                />
                <span className="nw-tnl__tempend">{t("trainNgramLab.tempHot")}</span>
                <span className="nw-tnl__tempval">{temp.toFixed(2)}</span>
              </div>

              {genText.length === 0 && (
                <div className="nw-tnl__seedrow">
                  <span className="nw-tnl__templabel">{t("trainNgramLab.seedLabel")}</span>
                  <input
                    type="text"
                    className="nw-tnl__seedinput"
                    value={seedRaw}
                    maxLength={120}
                    placeholder={"·".repeat(kUsed)}
                    onChange={(e) => setSeedRaw(e.target.value)}
                    aria-label={t("trainNgramLab.seedLabel")}
                  />
                  <GhostButton onClick={seedRandom}>{t("trainNgramLab.seedRandom")}</GhostButton>
                </div>
              )}

              {/* the context the model is looking at + honest backoff note */}
              <div className="nw-tnl__ctxline">
                <span className="nw-tnl__memlabel">{t("trainNgramLab.ctxLabel")}</span>
                <span className="nw-tnl__ctxchips">
                  {ctxShown.length === 0 ? (
                    <span className="nw-tnl__ctxnone">—</span>
                  ) : (
                    ctxShown.split("").map((c, i) => (
                      <span
                        key={i}
                        className="nw-tnl__ctxch"
                        data-dim={
                          eff.usedK < kUsed && i < ctxShown.length - Math.max(eff.usedK, 0)
                            ? "1"
                            : "0"
                        }
                      >
                        {displayChar(c)}
                      </span>
                    ))
                  )}
                </span>
                {eff.usedK < kUsed && written.length >= kUsed && (
                  <span className="nw-tnl__backoff">
                    {t("trainNgramLab.backoff", { k: eff.usedK })}
                  </span>
                )}
              </div>

              {/* PASO A PASO */}
              {mode === 1 && (
                <div className="nw-tnl__paso">
                  <div className="nw-tnl__pasohead">
                    <span className="nw-tnl__pasocap">
                      {spin && !spin.settled
                        ? t("trainNgramLab.stepSpin")
                        : lastStep && spin?.settled
                          ? t("trainNgramLab.stepLanded", { ch: displayChar(lastStep.ch) })
                          : t("trainNgramLab.stepRow", {
                              ctx: eff.ctx.length
                                ? eff.ctx.split("").map(displayChar).join("")
                                : "·",
                            })}
                    </span>
                  </div>
                  <FixedAlphabetRow
                    cols={ALPHA}
                    counts={Array.from(eff.row ?? new Uint32Array(VOCAB))}
                    winner={spin?.settled && lastStep ? lastStep.idx : -1}
                    hoverIdx={inspHover}
                    onHover={(i) => setInspHover(i ?? -1)}
                    height={96}
                    maxWidth={620}
                  />
                  {diceSegs && (
                    <div className="nw-tnl__dice">
                      {diceSegs.map((w, i) =>
                        w > 0 ? (
                          <span
                            key={i}
                            className="nw-tnl__seg"
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
                          className="nw-tnl__marker"
                          data-settled={spin.settled ? "1" : "0"}
                          style={{ left: `${spin.pct}%` }}
                          aria-hidden
                        />
                      )}
                    </div>
                  )}
                  <div className="nw-tnl__pasoctl">
                    <PlayButton
                      onClick={stepOnce}
                      disabled={(spin != null && !spin.settled) || effTotal === 0}
                    >
                      {t("trainNgramLab.next")}
                    </PlayButton>
                    <GhostButton onClick={() => setPasoAuto((a) => !a)}>
                      {pasoAuto ? t("trainNgramLab.autoStop") : t("trainNgramLab.auto")}
                    </GhostButton>
                  </div>
                </div>
              )}

              {/* TÚ ELIGES */}
              {mode === 2 && (
                <div className="nw-tnl__paso">
                  <div className="nw-tnl__pasohead">
                    <span className="nw-tnl__pasocap">
                      {inspHover >= 0 && eff.row
                        ? eff.row[inspHover] > 0
                          ? t("trainNgramLab.pickSlot", {
                              ch: displayChar(ALPHA[inspHover]),
                              n: fmt(eff.row[inspHover]),
                              pct: effTotal
                                ? fmtPct((eff.row[inspHover] / effTotal) * 100, language)
                                : "0",
                            })
                          : t("trainNgramLab.pickZero", { ch: displayChar(ALPHA[inspHover]) })
                        : t("trainNgramLab.manualHint")}
                    </span>
                  </div>
                  <FixedAlphabetRow
                    cols={ALPHA}
                    counts={Array.from(eff.row ?? new Uint32Array(VOCAB))}
                    winner={-1}
                    hoverIdx={inspHover}
                    onHover={(i) => setInspHover(i ?? -1)}
                    onSelect={pickLetter}
                    height={96}
                    maxWidth={620}
                  />
                  <div className="nw-tnl__pasoctl">
                    <GhostButton onClick={rollForMe}>{t("trainNgramLab.rollForMe")}</GhostButton>
                  </div>
                </div>
              )}

              {/* output */}
              <div ref={outRef} className="nw-tnl__out">
                {written.length === 0 ? (
                  <span className="nw-tnl__outempty">{t("trainNgramLab.outEmpty")}</span>
                ) : (
                  <>
                    <span className="nw-tnl__outseed">
                      {genText.length > 0 ? seedStream : seedStream.slice(0, -1)}
                    </span>
                    <span>{genText.slice(0, -1)}</span>
                    <span className="nw-tnl__outlast">
                      {displayChar(written[written.length - 1])}
                    </span>
                  </>
                )}
              </div>

              <div className="nw-tnl__outbar">
                {mode === 0 && (
                  <PlayButton
                    onClick={() => setRunning((r) => !r)}
                    disabled={modelRef.current.totalNgrams === 0}
                  >
                    {running
                      ? t("trainNgramLab.pause")
                      : genText.length > 0
                        ? t("trainNgramLab.more")
                        : t("trainNgramLab.go")}
                  </PlayButton>
                )}
                <span className="nw-tnl__outcount">
                  {genText.length > 0
                    ? t("trainNgramLab.lettersWritten", { n: fmt(genText.length) })
                    : ""}
                </span>
                <span style={{ flex: 1 }} />
                {genText.length > 0 && (
                  <>
                    <GhostButton onClick={copyOut}>
                      {copied ? t("trainNgramLab.copied") : t("trainNgramLab.copy")}
                    </GhostButton>
                    <GhostButton onClick={resetWriting}>{t("trainNgramLab.clearOut")}</GhostButton>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
                .nw-tnl__lead { font-family: ${SERIF}; font-size: clamp(17px, 2.2vw, 21px); line-height: 1.5; color: var(--ngram-ink); margin: 4px auto 18px; max-width: 46ch; text-align: center; text-wrap: balance; }
                .nw-tnl__ta { display: block; width: 100%; min-height: 190px; resize: vertical; padding: 18px 20px; border: 1px solid var(--ngram-rule); border-radius: var(--ngram-r-md); background: var(--ngram-bg-2); color: var(--ngram-ink); font-family: ${MONO}; font-size: 13px; line-height: 1.7; box-shadow: inset 0 2px 12px color-mix(in oklab, var(--ngram-ink) 10%, transparent); outline: none; }
                .nw-tnl__ta:focus { border-color: color-mix(in oklab, var(--ngram-accent) 55%, var(--ngram-rule)); }
                .nw-tnl__ta::placeholder { color: var(--ngram-dim); font-style: italic; }
                .nw-tnl__feedrow { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
                .nw-tnl__feedactions { display: flex; gap: 8px; flex-wrap: wrap; }
                .nw-tnl__count { font-family: ${MONO}; font-size: 11px; letter-spacing: .04em; color: var(--ngram-dim); font-variant-numeric: tabular-nums; }
                .nw-tnl__count[data-over="1"] { color: var(--ngram-accent-ink); }
                .nw-tnl__memrow { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; margin-top: 22px; }
                .nw-tnl__memlabel { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-tnl__mempills { display: flex; gap: 6px; }
                .nw-tnl__mempill { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 7px 12px 6px; border: 0; border-radius: var(--ngram-r-sm); cursor: pointer; background: color-mix(in oklab, var(--ngram-ink) 6%, transparent); color: var(--ngram-muted); transition: background .2s ease, color .2s ease, transform .15s ease; }
                .nw-tnl__mempill:hover { transform: translateY(-1px); }
                .nw-tnl__mempill[data-on="1"] { background: var(--ngram-accent); color: var(--ngram-on-accent); }
                .nw-tnl__memnum { font-family: ${MONO}; font-size: 16px; font-weight: 700; line-height: 1; }
                .nw-tnl__memname { font-family: ${MONO}; font-size: 8.5px; letter-spacing: .08em; text-transform: uppercase; opacity: .85; }
                .nw-tnl__memspace { font-family: ${MONO}; font-size: 11px; color: var(--ngram-dim); font-variant-numeric: tabular-nums; }
                .nw-tnl__trainrow { display: flex; align-items: center; gap: 14px; justify-content: center; margin-top: 22px; flex-wrap: wrap; }
                .nw-tnl__tiny { font-family: ${SERIF}; font-style: italic; font-size: 13.5px; color: var(--ngram-muted); }

                .nw-tnl__readybar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; width: 100%; max-width: 680px; margin-bottom: 20px; }
                .nw-tnl__statbar { display: flex; align-items: flex-end; justify-content: space-between; width: 100%; margin-bottom: 12px; gap: 16px; }
                .nw-tnl__statlabel { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-tnl__stattotal { font-family: ${MONO}; font-size: clamp(28px, 4vw, 38px); font-weight: 700; line-height: 1; color: var(--ngram-accent-ink); font-variant-numeric: tabular-nums; letter-spacing: -.01em; }
                .nw-tnl__fedpair { display: inline-flex; align-items: center; gap: 8px; font-family: ${MONO}; font-variant-numeric: tabular-nums; }
                .nw-tnl__fedctx { display: inline-flex; gap: 2px; }
                .nw-tnl__ctxch { display: inline-flex; align-items: center; justify-content: center; min-width: 17px; height: 22px; padding: 0 2px; border-radius: 4px; background: var(--ngram-accent-soft); color: var(--ngram-accent-ink); font-family: ${MONO}; font-size: 13px; font-weight: 700; box-shadow: inset 0 0 0 1px color-mix(in oklab, var(--ngram-accent) 30%, transparent); }
                .nw-tnl__ctxch[data-dim="1"] { opacity: .35; box-shadow: none; background: color-mix(in oklab, var(--ngram-ink) 7%, transparent); color: var(--ngram-dim); }
                .nw-tnl__fedarrow { font-size: 13px; color: var(--ngram-muted); }
                .nw-tnl__fednext { display: inline-flex; align-items: center; justify-content: center; min-width: 22px; height: 22px; border-radius: 4px; background: var(--ngram-accent); color: var(--ngram-on-accent); font-family: ${MONO}; font-size: 13px; font-weight: 700; }
                .nw-tnl__fedcount { font-size: 15px; font-weight: 700; color: var(--ngram-accent-ink); margin-left: 4px; }
                .nw-tnl__speed { font-family: ${MONO}; font-size: 15px; font-weight: 700; letter-spacing: .04em; color: var(--ngram-accent-ink); font-variant-numeric: tabular-nums; }
                .nw-tnl__windows { font-family: ${MONO}; font-size: 11px; letter-spacing: .05em; color: var(--ngram-muted); font-variant-numeric: tabular-nums; }

                .nw-tnl__cov { width: 100%; }
                .nw-tnl__covbar { width: 100%; height: 14px; border-radius: 999px; background: var(--ngram-bg-2); box-shadow: inset 0 0 0 1px var(--ngram-rule), inset 0 2px 7px color-mix(in oklab, var(--ngram-ink) 10%, transparent); overflow: hidden; }
                .nw-tnl__covfill { display: block; height: 100%; min-width: 0; border-radius: 999px; background: linear-gradient(to right, var(--ngram-accent), var(--ngram-accent-bright)); transition: width .25s ease; }
                .nw-tnl__covline { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-top: 7px; font-family: ${MONO}; font-size: 11px; color: var(--ngram-muted); font-variant-numeric: tabular-nums; }
                .nw-tnl__covpow { color: var(--ngram-dim); }
                .nw-tnl__ticker { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 16px; min-height: 24px; }
                .nw-tnl__tickerchip { display: inline-flex; gap: 1px; padding: 3px 7px; border-radius: var(--ngram-r-sm); background: color-mix(in oklab, var(--ngram-accent) 10%, transparent); font-family: ${MONO}; font-size: 12px; font-weight: 600; color: var(--ngram-accent-ink); animation: nwTnlIn .3s ease; }
                @keyframes nwTnlIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }

                .nw-tnl__fold { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .05em; color: var(--ngram-dim); margin: 14px 0 0; text-align: center; font-variant-numeric: tabular-nums; }
                .nw-tnl__search { margin-top: 22px; }
                .nw-tnl__searchrow { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; }
                .nw-tnl__searchinput { font-family: ${MONO}; font-size: 15px; letter-spacing: .2em; padding: 8px 14px; width: 130px; text-align: center; border: 1px solid var(--ngram-rule); border-radius: var(--ngram-r-sm); background: var(--ngram-bg-2); color: var(--ngram-ink); outline: none; }
                .nw-tnl__searchinput:focus { border-color: color-mix(in oklab, var(--ngram-accent) 55%, var(--ngram-rule)); }
                .nw-tnl__searchfold { display: inline-flex; gap: 2px; min-width: 60px; }
                .nw-tnl__rowpanel { margin-top: 16px; padding: 16px 18px 12px; border-radius: var(--ngram-r-md); background: color-mix(in oklab, var(--ngram-surface) 70%, var(--ngram-bg)); box-shadow: inset 0 0 0 1px var(--ngram-rule); }
                .nw-tnl__rowhead { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
                .nw-tnl__insplabel { font-family: ${MONO}; font-size: 11px; letter-spacing: .16em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-tnl__insptotal { font-family: ${MONO}; font-size: 13px; font-weight: 600; color: var(--ngram-accent-ink); font-variant-numeric: tabular-nums; }
                .nw-tnl__empty { font-family: ${SERIF}; font-style: italic; font-size: 15px; color: var(--ngram-muted); text-align: center; margin: 8px 0; }
                .nw-tnl__top { margin-top: 18px; text-align: center; }
                .nw-tnl__topchips { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; margin-top: 9px; }
                .nw-tnl__topchip { display: inline-flex; gap: 1px; padding: 5px 9px; border: 0; border-radius: var(--ngram-r-pill); cursor: pointer; background: color-mix(in oklab, var(--ngram-ink) 6%, transparent); color: var(--ngram-muted); font-family: ${MONO}; font-size: 12.5px; font-weight: 600; transition: background .2s ease, color .2s ease; }
                .nw-tnl__topchip:hover { background: color-mix(in oklab, var(--ngram-accent) 16%, transparent); color: var(--ngram-accent-ink); }
                .nw-tnl__topchip[data-on="1"] { background: var(--ngram-accent); color: var(--ngram-on-accent); }

                .nw-tnl__writebar { display: flex; justify-content: center; margin-bottom: 14px; }
                .nw-tnl__temprow { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 10px; flex-wrap: wrap; }
                .nw-tnl__templabel { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: var(--ngram-muted); }
                .nw-tnl__tempend { font-family: ${SERIF}; font-style: italic; font-size: 12.5px; color: var(--ngram-dim); }
                .nw-tnl__tempval { font-family: ${MONO}; font-size: 12px; font-weight: 700; color: var(--ngram-accent-ink); font-variant-numeric: tabular-nums; min-width: 36px; }
                .nw-tnl__range { -webkit-appearance: none; appearance: none; width: min(240px, 40vw); height: 4px; border-radius: 999px; background: linear-gradient(to right, color-mix(in oklab, var(--ngram-accent) 60%, var(--ngram-bg-2)), var(--ngram-accent-bright)); outline: none; cursor: pointer; }
                .nw-tnl__range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 999px; background: var(--ngram-accent); box-shadow: 0 1px 6px color-mix(in oklab, var(--ngram-ink) 35%, transparent), inset 0 0 0 2px var(--ngram-bg); cursor: grab; }
                .nw-tnl__range::-moz-range-thumb { width: 16px; height: 16px; border: 0; border-radius: 999px; background: var(--ngram-accent); box-shadow: 0 1px 6px color-mix(in oklab, var(--ngram-ink) 35%, transparent), inset 0 0 0 2px var(--ngram-bg); cursor: grab; }
                .nw-tnl__seedrow { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 12px; flex-wrap: wrap; }
                .nw-tnl__seedinput { font-family: ${MONO}; font-size: 13px; padding: 7px 12px; width: min(240px, 44vw); border: 1px solid var(--ngram-rule); border-radius: var(--ngram-r-sm); background: var(--ngram-bg-2); color: var(--ngram-ink); outline: none; }
                .nw-tnl__seedinput:focus { border-color: color-mix(in oklab, var(--ngram-accent) 55%, var(--ngram-rule)); }
                .nw-tnl__ctxline { display: flex; align-items: center; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px; min-height: 26px; }
                .nw-tnl__ctxchips { display: inline-flex; gap: 2px; }
                .nw-tnl__ctxnone { font-family: ${MONO}; color: var(--ngram-dim); }
                .nw-tnl__backoff { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .05em; color: var(--ngram-wrong, var(--ngram-accent-ink)); }

                .nw-tnl__paso { width: 100%; padding: 18px 20px 16px; border-radius: var(--ngram-r-md); background: color-mix(in oklab, var(--ngram-surface) 70%, var(--ngram-bg)); box-shadow: inset 0 0 0 1px var(--ngram-rule); margin-bottom: 14px; }
                .nw-tnl__pasohead { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; min-height: 24px; justify-content: center; }
                .nw-tnl__pasocap { font-family: ${MONO}; font-size: 12px; letter-spacing: .05em; color: var(--ngram-muted); font-variant-numeric: tabular-nums; }
                .nw-tnl__dice { position: relative; display: flex; width: 100%; max-width: 620px; height: 26px; margin: 14px auto 2px; border-radius: 999px; }
                .nw-tnl__seg { display: inline-flex; align-items: center; justify-content: center; height: 100%; font-family: ${MONO}; font-size: 10px; font-weight: 700; color: var(--ngram-ink); overflow: hidden; white-space: nowrap; transition: box-shadow .15s ease; }
                .nw-tnl__seg:first-child { border-radius: 999px 0 0 999px; }
                .nw-tnl__seg:last-child { border-radius: 0 999px 999px 0; }
                .nw-tnl__seg[data-hit="1"] { box-shadow: inset 0 0 0 2px var(--ngram-accent-bright); }
                .nw-tnl__marker { position: absolute; top: -7px; width: 2px; height: 40px; background: var(--ngram-accent-ink); border-radius: 2px; transition: left .05s linear; }
                .nw-tnl__marker[data-settled="1"] { background: var(--ngram-accent-bright); width: 3px; transition: left .18s cubic-bezier(.2,.8,.2,1); }
                .nw-tnl__pasoctl { display: flex; align-items: center; gap: 10px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }

                .nw-tnl__out { width: 100%; min-height: 130px; max-height: 300px; overflow-y: auto; padding: 20px 24px; border-radius: var(--ngram-r-md); background: var(--ngram-bg-2); box-shadow: inset 0 2px 12px color-mix(in oklab, var(--ngram-ink) 10%, transparent), inset 0 0 0 1px var(--ngram-rule); font-family: ${SERIF}; font-size: clamp(18px, 2.2vw, 22px); line-height: 1.75; color: var(--ngram-ink); white-space: pre-wrap; word-break: break-word; }
                .nw-tnl__outempty { font-style: italic; color: var(--ngram-dim); font-size: 15px; }
                .nw-tnl__outseed { color: var(--ngram-muted); }
                .nw-tnl__outlast { color: var(--ngram-on-accent); background: var(--ngram-accent); border-radius: 3px; padding: 1px 3px; font-weight: 600; }
                .nw-tnl__outbar { display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
                .nw-tnl__outcount { font-family: ${MONO}; font-size: 10.5px; letter-spacing: .05em; color: var(--ngram-dim); font-variant-numeric: tabular-nums; }

                @media (max-width: 700px) { .nw-tnl__statbar { flex-direction: column; align-items: flex-start; gap: 6px; } }
            `}</style>
    </div>
  );
});

export default TrainNgramLab;
