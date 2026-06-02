"use client";

import { memo, useCallback, useMemo, useState } from "react";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Verdict } from "@/features/lab/components/bigram/Verdict";
import { BigramMatrixBuilder } from "@/features/lab/components/BigramMatrixBuilder";
import { TransitionMatrix } from "@/features/lab/components/TransitionMatrix";
import type { TrainingViz, TransitionMatrixViz } from "@/features/lab/types/lmLab";
import { useI18n } from "@/i18n/context";

/**
 * BigramDiagramExperience — the chapter's central visualization (v10, editorial-green).
 *
 * ONE idea, shown crystal-clear: *a row of raw counts becomes a probability distribution you can
 * sample from.* The full TransitionMatrix gives you the counts (delegated, accent="bigram"); the
 * Probability Flow figure below turns ONE row into a real distribution and lets the learner roll a
 * weighted die against it.
 *
 * Bigram-only widget (rendered solely at /lab/bigram, under the page's [data-bigram-theme] scope),
 * so it restyles directly with --bigram-* tokens. No hardcoded colors, no shadcn chrome, no traffic
 * dots. States read from fill + typography; motion is premium and reduced-motion safe. The flow
 * figure is the single focal point; the matrix and the framing notes are quiet around it.
 *
 * The math is preserved verbatim from the prior implementation (educational counts → normalize /
 * temperature-scaled softmax → weighted sampling). Only the surface is redesigned to v10.
 */

const MONO = "var(--font-jetbrains-mono)";
const SERIF = "var(--font-source-serif)";

/* Shared style fragments — keep the v10 vocabulary in one place (mono eyebrow label + hairline rule). */
const eyebrowLabel: React.CSSProperties = {
    fontFamily: MONO,
    fontSize: 11,
    letterSpacing: ".2em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
};
const hairline: React.CSSProperties = {
    flex: 1,
    height: 1,
    background: "var(--bigram-rule)",
};

type DiagramMode = "story" | "lab";
type ProbabilityMethod = "normalize" | "softmax";

interface BigramDiagramExperienceProps {
    mode: DiagramMode;
    matrixData: TransitionMatrixViz | null;
    trainingData?: TrainingViz | null;
    onCellClick?: (row: string, col: string) => void;
}

function glyph(ch: string): string {
    return ch === " " ? "␣" : ch;
}

/** "31.2 %" — one decimal, thin space before %, matching the chapter's number format. */
function pct(p: number): string {
    return `${(p * 100).toFixed(1)} %`;
}

function sampleIndex(probabilities: number[]): { index: number; roll: number } {
    const roll = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probabilities.length; i += 1) {
        cumulative += probabilities[i];
        if (roll <= cumulative) {
            return { index: i, roll };
        }
    }
    return { index: Math.max(0, probabilities.length - 1), roll };
}

export function BigramDiagramExperience({
    mode,
    matrixData,
    trainingData,
    onCellClick,
}: BigramDiagramExperienceProps) {
    const { t } = useI18n();

    const renderMatrix = () => (
        <TransitionMatrix
            data={matrixData}
            accent="bigram"
            onCellClick={onCellClick}
            datasetMeta={{
                corpusName: "Paul Graham essays (paulgraham.com)",
                rawTextSize: trainingData?.raw_text_size,
                trainDataSize: trainingData?.train_data_size,
                vocabSize: trainingData?.unique_characters,
            }}
        />
    );

    // Story mode is not currently mounted by any chapter (the page always passes mode="lab"); it
    // shares the lab core (matrix → flow → constraint) and prepends the narrative-builder step so the
    // prop contract is preserved without 250 lines of redesigned-but-dead scaffolding.
    const gap = mode === "story" ? 56 : 40;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap }}>
            {mode === "story" && (
                <div>
                    <StoryEyebrow label={t("models.bigram.matrix.storySteps.solution.title")} />
                    <p
                        style={{
                            fontFamily: SERIF,
                            fontSize: 18,
                            lineHeight: 1.6,
                            color: "var(--bigram-body)",
                            margin: "0 0 18px",
                            textWrap: "pretty",
                        }}
                    >
                        {t("models.bigram.matrix.storySteps.solution.body")}
                    </p>
                    <p
                        style={{
                            fontFamily: MONO,
                            fontSize: 11,
                            letterSpacing: ".2em",
                            textTransform: "uppercase",
                            color: "var(--bigram-muted)",
                            margin: "0 0 14px",
                        }}
                    >
                        {t("models.bigram.matrix.builderLabel")}
                    </p>
                    <BigramMatrixBuilder />
                </div>
            )}
            {renderMatrix()}
            <ProbabilityFlow matrixData={matrixData} />
            <ConstraintNote text={t("models.bigram.matrix.limitationGuide")} />
        </div>
    );
}

/* ════════════════════════════════════════════════════════════════════════
   PROBABILITY FLOW — the figure. ONE row of counts → a distribution → a roll.
   ════════════════════════════════════════════════════════════════════════ */

const ProbabilityFlow = memo(function ProbabilityFlow({
    matrixData,
}: {
    matrixData: TransitionMatrixViz | null;
}) {
    const { t, language } = useI18n();
    const reduce = useReducedMotion();
    // No dedicated "space" word key under probFlow (i18n owned elsewhere this round); derive it from
    // the active language, mirroring HeroAutoComplete's approach.
    const SPACE_WORD = language === "es" ? "espacio" : "space";

    // `pickedRow` is the learner's explicit choice (empty until they pick). The row actually shown is
    // DERIVED at render — falling back to the first available label — so no state is synced in an
    // effect (which the React-compiler lint rule forbids and which caused cascading renders).
    const [pickedRow, setPickedRow] = useState("");
    const [method, setMethod] = useState<ProbabilityMethod>("normalize");
    const [temperature, setTemperature] = useState(1);
    const [sampledToken, setSampledToken] = useState<string | null>(null);
    const [sampleRoll, setSampleRoll] = useState<number | null>(null);
    // bumped on each Sample so the winner row re-keys and its highlight replays
    const [sampleNonce, setSampleNonce] = useState(0);

    const selectedRow =
        pickedRow && matrixData?.row_labels.includes(pickedRow)
            ? pickedRow
            : (matrixData?.row_labels[0] ?? "");

    const rowIndex = useMemo(() => {
        if (!matrixData || !selectedRow) return -1;
        return matrixData.row_labels.indexOf(selectedRow);
    }, [matrixData, selectedRow]);

    const rowScores = useMemo(() => {
        if (!matrixData || rowIndex < 0) return [];
        return matrixData.data[rowIndex].map((value) =>
            Number.isFinite(value) ? Math.max(value, 0) : 0
        );
    }, [matrixData, rowIndex]);

    const scoreSum = useMemo(
        () => rowScores.reduce((acc, value) => acc + value, 0),
        [rowScores]
    );

    const looksNormalized =
        scoreSum > 0 &&
        Math.abs(scoreSum - 1) < 0.02 &&
        rowScores.every((value) => value <= 1.001);

    const educationalCounts = useMemo(() => {
        if (rowScores.length === 0) return [];
        // TODO(adrian): replace this proxy with real pre-normalized counts from backend.
        return looksNormalized ? rowScores.map((value) => value * 100) : rowScores;
    }, [looksNormalized, rowScores]);

    const normalizedProbs = useMemo(() => {
        const total = educationalCounts.reduce((acc, value) => acc + value, 0);
        if (total <= 0) return educationalCounts.map(() => 0);
        return educationalCounts.map((value) => value / total);
    }, [educationalCounts]);

    const softmaxProbs = useMemo(() => {
        if (educationalCounts.length === 0) return [];
        const safeT = Math.max(0.2, temperature);
        const max = Math.max(...educationalCounts);
        const exps = educationalCounts.map((value) =>
            Math.exp((value - max) / safeT)
        );
        const total = exps.reduce((acc, value) => acc + value, 0);
        if (total <= 0) return exps.map(() => 0);
        return exps.map((value) => value / total);
    }, [educationalCounts, temperature]);

    const probabilities = method === "softmax" ? softmaxProbs : normalizedProbs;

    const sortedCandidates = useMemo(() => {
        if (!matrixData) return [];
        return probabilities
            .map((probability, index) => ({
                token: matrixData.col_labels[index],
                probability,
            }))
            .sort((a, b) => b.probability - a.probability);
    }, [matrixData, probabilities]);

    const visibleCandidates = sortedCandidates.slice(0, 12);
    const maxProb = visibleCandidates.length > 0 ? visibleCandidates[0].probability : 1;
    const hiddenMass = Math.max(
        0,
        sortedCandidates.slice(12).reduce((acc, c) => acc + c.probability, 0)
    );
    const topCandidate = sortedCandidates[0] ?? null;

    const onPickRow = useCallback(
        (raw: string) => {
            if (!raw) return;
            const char = raw.slice(-1);
            if (matrixData?.row_labels.includes(char)) {
                setPickedRow(char);
                setSampledToken(null);
                setSampleRoll(null);
            }
        },
        [matrixData]
    );

    const runSampling = useCallback(() => {
        if (!matrixData || probabilities.length === 0) return;
        const { index, roll } = sampleIndex(probabilities);
        setSampledToken(matrixData.col_labels[index]);
        setSampleRoll(roll);
        setSampleNonce((n) => n + 1);
    }, [matrixData, probabilities]);

    const ready = !!matrixData && probabilities.length > 0;

    return (
        <figure style={{ margin: 0 }}>
            {/* eyebrow — mono uppercase label, hairline rule, no box (v10 figure label) */}
            <figcaption
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 22,
                }}
            >
                <span style={{ ...eyebrowLabel, color: "var(--bigram-accent-ink)" }}>
                    {t("models.bigram.matrix.probFlow.badge")}
                </span>
                <span style={hairline} />
                {looksNormalized && (
                    <span
                        style={{
                            fontFamily: MONO,
                            fontSize: 10.5,
                            letterSpacing: ".04em",
                            color: "var(--bigram-dim)",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {t("models.bigram.matrix.probFlow.alreadyNormalized")}
                    </span>
                )}
            </figcaption>

            {/* the demo plane — a single faint surface, the only "this is interactive" signal */}
            <div
                style={{
                    background:
                        "color-mix(in oklab, var(--bigram-surface) 55%, var(--bigram-bg))",
                    borderRadius: "var(--bigram-r-lg)",
                    padding: "clamp(20px, 4vw, 34px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 26,
                }}
            >
                {/* ── controls: context keycap · method segmented control · sample ── */}
                <div
                    style={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "flex-start",
                        gap: "clamp(20px, 4vw, 40px)",
                    }}
                >
                    {/* context keycap — the focal point */}
                    <div style={{ flex: "0 0 auto" }}>
                        <ControlLabel>
                            {t("models.bigram.matrix.probFlow.currentToken")}
                        </ControlLabel>
                        <Keycap value={selectedRow} onPick={onPickRow} reduce={!!reduce} />
                        <p
                            style={{
                                fontFamily: SERIF,
                                fontStyle: "italic",
                                fontSize: 13.5,
                                color: "var(--bigram-dim)",
                                margin: "12px 0 0",
                                textAlign: "center",
                                maxWidth: 132,
                            }}
                        >
                            {t("models.bigram.matrix.probFlow.typeToChange")}
                        </p>
                    </div>

                    {/* method + temperature */}
                    <div style={{ flex: "1 1 220px", minWidth: 220 }}>
                        <ControlLabel>
                            {t("models.bigram.matrix.probFlow.step2")}
                        </ControlLabel>
                        <Segmented
                            value={method}
                            reduce={!!reduce}
                            options={[
                                {
                                    id: "normalize",
                                    label: t("models.bigram.matrix.probFlow.normalize"),
                                },
                                {
                                    id: "softmax",
                                    label: t("models.bigram.matrix.probFlow.softmax"),
                                },
                            ]}
                            onChange={(id) => setMethod(id as ProbabilityMethod)}
                        />
                        <p
                            style={{
                                fontFamily: SERIF,
                                fontSize: 14,
                                lineHeight: 1.5,
                                color: "var(--bigram-muted)",
                                margin: "12px 0 0",
                                textWrap: "pretty",
                            }}
                        >
                            {method === "softmax"
                                ? t("models.bigram.matrix.probFlow.educational.softmaxDesc")
                                : t("models.bigram.matrix.probFlow.educational.normDesc")}
                        </p>

                        <AnimatePresence initial={false}>
                            {method === "softmax" && (
                                <motion.div
                                    initial={reduce ? false : { opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                                    transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                                    style={{ overflow: "hidden" }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "space-between",
                                            margin: "16px 0 6px",
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontFamily: MONO,
                                                fontSize: 11,
                                                letterSpacing: ".14em",
                                                textTransform: "uppercase",
                                                color: "var(--bigram-muted)",
                                            }}
                                        >
                                            {t("models.bigram.matrix.probFlow.temperature")}
                                        </span>
                                        <span
                                            style={{
                                                fontFamily: MONO,
                                                fontSize: 14,
                                                fontWeight: 600,
                                                color: "var(--bigram-accent)",
                                                fontVariantNumeric: "tabular-nums",
                                            }}
                                        >
                                            {temperature.toFixed(1)}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={0.5}
                                        max={2}
                                        step={0.1}
                                        value={temperature}
                                        onChange={(e) =>
                                            setTemperature(Number(e.target.value))
                                        }
                                        aria-label={t(
                                            "models.bigram.matrix.probFlow.temperature"
                                        )}
                                        className="bigram-flow-range"
                                        style={{ width: "100%" }}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* sample */}
                    <div style={{ flex: "0 0 auto", minWidth: 168 }}>
                        <ControlLabel>
                            {t("models.bigram.matrix.probFlow.step3")}
                        </ControlLabel>
                        <button
                            type="button"
                            onClick={runSampling}
                            disabled={!ready}
                            style={{
                                width: "100%",
                                fontFamily: MONO,
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: ".06em",
                                padding: "12px 18px",
                                border: 0,
                                borderRadius: "var(--bigram-r-sm)",
                                cursor: ready ? "pointer" : "default",
                                background: ready
                                    ? "var(--bigram-accent)"
                                    : "var(--bigram-bg-2)",
                                color: ready
                                    ? "var(--bigram-on-accent)"
                                    : "var(--bigram-dim)",
                                boxShadow: ready
                                    ? "0 6px 18px -8px color-mix(in oklab, var(--bigram-accent) 70%, transparent)"
                                    : "none",
                                transition: "background .2s ease",
                            }}
                        >
                            {t("models.bigram.matrix.probFlow.sample")}
                        </button>
                        <div
                            style={{
                                minHeight: 40,
                                marginTop: 12,
                                fontFamily: MONO,
                                fontSize: 12.5,
                                lineHeight: 1.5,
                                color: "var(--bigram-muted)",
                            }}
                        >
                            <AnimatePresence mode="wait">
                                {sampledToken ? (
                                    <motion.div
                                        key={`sampled-${sampleNonce}`}
                                        initial={reduce ? false : { opacity: 0, y: 4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.26 }}
                                    >
                                        <span style={{ color: "var(--bigram-dim)" }}>
                                            {t("models.bigram.matrix.probFlow.sampled")} ·{" "}
                                        </span>
                                        <span
                                            style={{
                                                color: "var(--bigram-accent)",
                                                fontWeight: 600,
                                            }}
                                        >
                                            {glyph(sampledToken)}
                                        </span>
                                        {sampleRoll !== null && (
                                            <span
                                                style={{
                                                    color: "var(--bigram-dim)",
                                                    fontVariantNumeric: "tabular-nums",
                                                }}
                                            >
                                                {"  ↺ "}
                                                {sampleRoll.toFixed(3)}
                                            </span>
                                        )}
                                    </motion.div>
                                ) : topCandidate ? (
                                    <motion.div
                                        key="top"
                                        initial={false}
                                        animate={{ opacity: 1 }}
                                    >
                                        <span style={{ color: "var(--bigram-dim)" }}>
                                            {t("models.bigram.matrix.probFlow.topCandidate")} ·{" "}
                                        </span>
                                        <span style={{ color: "var(--bigram-ink)" }}>
                                            {glyph(topCandidate.token)}
                                        </span>{" "}
                                        <span style={{ color: "var(--bigram-dim)" }}>
                                            {pct(topCandidate.probability)}
                                        </span>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>

                {/* ── the distribution: max-normalized honest stack, winner brightest ── */}
                <div>
                    {ready && selectedRow ? (
                        <>
                            <p
                                style={{
                                    fontFamily: MONO,
                                    fontWeight: 500,
                                    fontSize: 15,
                                    letterSpacing: ".005em",
                                    color: "var(--bigram-muted)",
                                    margin: "0 0 20px",
                                    textWrap: "pretty",
                                }}
                            >
                                {t("models.bigram.inference.axisLabel").replace(
                                    "{char}",
                                    selectedRow === " " ? SPACE_WORD : selectedRow
                                )}
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 14,
                                }}
                            >
                                {visibleCandidates.map((c, i) => (
                                    <DistRow
                                        key={`${selectedRow}:${c.token}`}
                                        token={c.token}
                                        prob={c.probability}
                                        max={maxProb}
                                        top={i === 0}
                                        sampled={sampledToken === c.token}
                                        delayMs={
                                            reduce
                                                ? 0
                                                : (visibleCandidates.length - 1 - i) * 55
                                        }
                                        reduce={!!reduce}
                                    />
                                ))}
                            </div>
                            {hiddenMass > 0.0005 && (
                                <p
                                    style={{
                                        fontFamily: MONO,
                                        fontSize: 11.5,
                                        color: "var(--bigram-dim)",
                                        margin: "16px 0 0",
                                        fontVariantNumeric: "tabular-nums",
                                    }}
                                >
                                    {/* inline copy: no dedicated i18n key (i18n owned elsewhere this round) */}
                                    + {pct(hiddenMass)}
                                </p>
                            )}

                            <AnimatePresence>
                                {topCandidate && (
                                    <motion.div
                                        key={`${selectedRow}-${method}`}
                                        initial={reduce ? false : { opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.4,
                                            delay: reduce ? 0 : 0.2,
                                            ease: [0.2, 0.8, 0.2, 1],
                                        }}
                                        style={{ marginTop: 26 }}
                                    >
                                        <Verdict
                                            label={t(
                                                "models.bigram.inference.verdictLabel"
                                            )}
                                            main={
                                                <VerdictLine
                                                    template={t(
                                                        "models.bigram.inference.verdictMain"
                                                    )}
                                                    src={
                                                        selectedRow === " "
                                                            ? SPACE_WORD
                                                            : selectedRow
                                                    }
                                                    best={
                                                        topCandidate.token === " "
                                                            ? SPACE_WORD
                                                            : topCandidate.token
                                                    }
                                                />
                                            }
                                            sub={t(
                                                "models.bigram.matrix.probFlow.stochasticNote"
                                            )}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : (
                        <p
                            style={{
                                fontFamily: SERIF,
                                fontStyle: "italic",
                                fontSize: 16,
                                color: "var(--bigram-muted)",
                                margin: 0,
                            }}
                        >
                            {t("models.bigram.matrix.runInference")}
                        </p>
                    )}
                </div>
            </div>

            {/* scoped range styling — token-driven, never leaks (no global selector reuse) */}
            <style>{`
                .bigram-flow-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: var(--bigram-r-pill); background: color-mix(in oklab, var(--bigram-ink) 14%, transparent); outline: none; }
                .bigram-flow-range::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: var(--bigram-accent); border: 0; cursor: pointer; box-shadow: 0 2px 6px -2px color-mix(in oklab, var(--bigram-accent) 80%, transparent); }
                .bigram-flow-range::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--bigram-accent); border: 0; cursor: pointer; }
            `}</style>
        </figure>
    );
});

/* ── one distribution row: max-normalized fill, winner brightest, sampled glows ── */
const DistRow = memo(function DistRow({
    token,
    prob,
    max,
    top,
    sampled,
    delayMs,
    reduce,
}: {
    token: string;
    prob: number;
    max: number;
    top: boolean;
    sampled: boolean;
    delayMs: number;
    reduce: boolean;
}) {
    const isSpace = token === " ";
    const targetW = Math.min(100, (prob / Math.max(max, 1e-6)) * 100);

    const fill = sampled
        ? "var(--bigram-accent-bright)"
        : top
          ? "var(--bigram-accent-bright)"
          : "var(--bigram-accent-2)";

    return (
        <div
            role="img"
            aria-label={`${isSpace ? "space" : token}, ${pct(prob)}`}
            style={{
                display: "grid",
                gridTemplateColumns: "56px 1fr auto",
                alignItems: "center",
                gap: 18,
            }}
        >
            <span
                style={{
                    fontFamily: MONO,
                    fontSize: isSpace ? 13 : 18,
                    fontWeight: top || sampled ? 700 : 600,
                    lineHeight: 1,
                    justifySelf: "end",
                    color: sampled
                        ? "var(--bigram-accent)"
                        : top
                          ? "var(--bigram-accent-ink)"
                          : "var(--bigram-ink)",
                    letterSpacing: isSpace ? ".03em" : undefined,
                }}
            >
                {glyph(token)}
            </span>

            <span
                style={{
                    position: "relative",
                    height: 9,
                    borderRadius: "var(--bigram-r-pill)",
                    overflow: "hidden",
                    background: "color-mix(in oklab, var(--bigram-ink) 8%, transparent)",
                    boxShadow: sampled
                        ? "0 0 0 2px color-mix(in oklab, var(--bigram-accent) 30%, transparent)"
                        : "none",
                    transition: "box-shadow .26s ease",
                }}
            >
                <motion.i
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${targetW}%` }}
                    transition={
                        reduce
                            ? { duration: 0 }
                            : {
                                  width: {
                                      duration: 0.58,
                                      delay: delayMs / 1000,
                                      ease: [0.2, 0.7, 0.2, 1],
                                  },
                              }
                    }
                    style={{
                        position: "absolute",
                        inset: "0 auto 0 0",
                        height: "100%",
                        borderRadius: "var(--bigram-r-pill)",
                        background: fill,
                        transition: "background .26s ease",
                    }}
                />
            </span>

            <span
                style={{
                    fontFamily: MONO,
                    fontSize: 13,
                    color: sampled
                        ? "var(--bigram-accent)"
                        : top
                          ? "var(--bigram-muted)"
                          : "var(--bigram-dim)",
                    fontWeight: sampled ? 600 : 400,
                    fontVariantNumeric: "tabular-nums",
                    justifySelf: "end",
                    minWidth: "3.8em",
                    textAlign: "right",
                    letterSpacing: ".01em",
                }}
            >
                {pct(prob)}
            </span>
        </div>
    );
});

/* ════════════════════════════════════════════════════════════════════════
   Small token-only primitives — keycap, segmented control, labels, notes.
   ════════════════════════════════════════════════════════════════════════ */

function ControlLabel({ children }: { children: React.ReactNode }) {
    return (
        <p style={{ ...eyebrowLabel, color: "var(--bigram-muted)", margin: "0 0 12px" }}>
            {children}
        </p>
    );
}

const Keycap = memo(function Keycap({
    value,
    onPick,
    reduce,
}: {
    value: string;
    onPick: (raw: string) => void;
    reduce: boolean;
}) {
    const [focused, setFocused] = useState(false);
    const isSpace = value === " ";

    return (
        <div
            style={{
                position: "relative",
                width: "clamp(76px, 18vw, 96px)",
                height: "clamp(76px, 18vw, 96px)",
            }}
        >
            <input
                type="text"
                maxLength={1}
                inputMode="text"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
                value={isSpace ? "" : value}
                onChange={(e) => onPick(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                aria-label="Context character"
                className="text-center focus:outline-none"
                style={{
                    width: "100%",
                    height: "100%",
                    fontFamily: MONO,
                    fontSize: "clamp(40px, 11vw, 52px)",
                    fontWeight: 600,
                    lineHeight: 1,
                    textTransform: "lowercase",
                    borderRadius: "var(--bigram-r-md)",
                    border: `2px solid ${focused ? "var(--bigram-accent)" : "var(--bigram-accent-2)"}`,
                    background: "var(--bigram-accent-soft)",
                    color: "var(--bigram-ink)",
                    caretColor: "var(--bigram-accent)",
                    boxShadow: focused ? "0 0 0 3px var(--bigram-accent-soft)" : "none",
                    transition: reduce
                        ? "none"
                        : "border-color .2s ease, box-shadow .2s ease",
                }}
            />
            {isSpace && (
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        display: "grid",
                        placeItems: "center",
                        pointerEvents: "none",
                        fontFamily: MONO,
                        fontSize: 12,
                        letterSpacing: ".18em",
                        textTransform: "uppercase",
                        color: "var(--bigram-dim)",
                    }}
                >
                    ␣
                </span>
            )}
        </div>
    );
});

const Segmented = memo(function Segmented({
    value,
    options,
    onChange,
    reduce,
}: {
    value: string;
    options: { id: string; label: string }[];
    onChange: (id: string) => void;
    reduce: boolean;
}) {
    return (
        <div
            role="radiogroup"
            style={{
                display: "inline-flex",
                gap: 4,
                padding: 5,
                borderRadius: "var(--bigram-r-md)",
                background: "var(--bigram-bg-2)",
                boxShadow: "inset 0 1px 4px rgba(0,0,0,.28)",
            }}
        >
            {options.map((opt) => {
                const active = value === opt.id;
                return (
                    <button
                        key={opt.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => onChange(opt.id)}
                        style={{
                            position: "relative",
                            minWidth: 96,
                            height: 38,
                            padding: "0 16px",
                            display: "grid",
                            placeItems: "center",
                            fontFamily: MONO,
                            fontSize: 12,
                            fontWeight: active ? 600 : 500,
                            letterSpacing: ".02em",
                            border: 0,
                            borderRadius: "var(--bigram-r-sm)",
                            cursor: "pointer",
                            background: "transparent",
                            color: active
                                ? "var(--bigram-on-accent)"
                                : "var(--bigram-muted)",
                            transition: "color .2s ease",
                        }}
                    >
                        {active && (
                            <motion.span
                                layoutId="bigram-flow-seg"
                                aria-hidden
                                transition={
                                    reduce
                                        ? { duration: 0 }
                                        : { type: "spring", stiffness: 520, damping: 38 }
                                }
                                style={{
                                    position: "absolute",
                                    inset: 0,
                                    borderRadius: "var(--bigram-r-sm)",
                                    background: "var(--bigram-accent)",
                                    boxShadow:
                                        "0 5px 14px -5px color-mix(in oklab, var(--bigram-accent) 65%, transparent)",
                                    zIndex: 0,
                                }}
                            />
                        )}
                        <span style={{ position: "relative", zIndex: 1 }}>{opt.label}</span>
                    </button>
                );
            })}
        </div>
    );
});

/** Quiet sage "constraint" note — the chapter's single-token limitation, in the insight voice. */
function ConstraintNote({ text }: { text: string }) {
    return (
        <div
            style={{
                padding: "16px 22px",
                borderRadius: "var(--bigram-r-md)",
                background: "linear-gradient(135deg, var(--bigram-sage-soft), transparent 82%)",
                boxShadow:
                    "inset 0 0 0 1px color-mix(in oklab, var(--bigram-sage) 28%, transparent)",
            }}
        >
            <p
                style={{
                    fontFamily: SERIF,
                    fontSize: 16.5,
                    lineHeight: 1.55,
                    color: "var(--bigram-body)",
                    margin: 0,
                    textWrap: "pretty",
                }}
            >
                {text}
            </p>
        </div>
    );
}

/** Story-mode eyebrow — mono uppercase label + hairline rule (v10 section vocabulary, no box). */
function StoryEyebrow({ label }: { label: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
            <span style={{ ...eyebrowLabel, color: "var(--bigram-accent-ink)" }}>
                {label}
            </span>
            <span style={hairline} />
        </div>
    );
}

/** Verdict sentence from an i18n template with {char}/{best} → accent bold spans. */
function VerdictLine({
    template,
    src,
    best,
}: {
    template: string;
    src: string;
    best: string;
}) {
    const parts = template.split(/(\{best\}|\{char\})/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part === "{char}") return <b key={i}>{src}</b>;
                if (part === "{best}") return <b key={i}>{best}</b>;
                return <span key={i}>{part}</span>;
            })}
        </>
    );
}
