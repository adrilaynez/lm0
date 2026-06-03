"use client";

import { memo, useMemo, useState } from "react";

import { HonestBar } from "@/features/lab/components/ngram/HonestBar";
import { CaptionLine, GhostButton, MONO } from "@/features/lab/components/ngram/kit";
import { Verdict } from "@/features/lab/components/ngram/Verdict";
import { displayChar, scanContext } from "@/features/lab/data/ngramData";

/**
 * §6a · UnseenContext — it doesn't generalize (kit + ngramData, real counts).
 *
 * ONE idea: change one letter to something never seen and the model goes mute, even though you'd read both
 * the same. A real fragment the corpus saw → a confident bet; the same fragment with one letter off →
 * nothing at all. Both are real probes of the counts (scanContext): the seen one returns its true
 * followers, the typo returns null.
 *
 * Quiet. Real interaction (cycle examples). Self-mounting, reduced-motion safe (HonestBar handles it).
 */

interface Pair {
    real: string;   // a context the corpus has seen
    typo: string;   // the same length, one letter changed → never seen
    word: string;   // the word it belongs to (for recognition)
}

// verified against ngramData: `real` is seen & confident, `typo` is UNSEEN
const PAIRS: Pair[] = [
    { real: "natur", typo: "natus", word: "nature" },
    { real: "honou", typo: "honoz", word: "honour" },
    { real: "thing", typo: "thinq", word: "thing" },
];

function FragmentLine({ ctx, diff, muted }: { ctx: string; diff: number; muted?: boolean }) {
    return (
        <span style={{ fontFamily: MONO, fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, letterSpacing: ".02em" }}>
            {ctx.split("").map((ch, i) => (
                <span
                    key={i}
                    style={{ color: i === diff ? "var(--ngram-wrong)" : muted ? "var(--ngram-dim)" : "var(--ngram-ink)" }}
                >
                    {displayChar(ch)}
                </span>
            ))}
            <span style={{ color: "var(--ngram-dim)", margin: "0 8px" }}>→</span>
        </span>
    );
}

export const UnseenContext = memo(function UnseenContext({ accent }: { accent?: "ngram" }) {
    void accent;
    const [i, setI] = useState(0);
    const p = PAIRS[i];
    const diff = useMemo(() => {
        for (let j = 0; j < p.real.length; j++) if (p.real[j] !== p.typo[j]) return j;
        return -1;
    }, [p]);

    const seen = useMemo(() => scanContext(p.real), [p]);
    const top = seen ? seen.followers.slice(0, 3) : [];
    const best = top[0];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 26, width: "100%", maxWidth: 560, margin: "0 auto" }}>
            {/* seen → confident */}
            <div>
                <CaptionLine align="left" gap={8}>la máquina lo ha visto · «{p.word}»</CaptionLine>
                <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" }}>
                    <FragmentLine ctx={p.real} diff={-1} />
                    <span style={{ fontFamily: MONO, fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "var(--ngram-accent-bright)" }}>
                        {best ? displayChar(best.ch) : "?"}
                    </span>
                </div>
                <div style={{ marginTop: 10 }}>
                    {top.map((f, idx) => (
                        <HonestBar key={f.ch} src={p.real.slice(-1)} dst={f.ch} value={f.prob} top={idx === 0} countUp={false} glint={false} />
                    ))}
                </div>
            </div>

            {/* one letter off → mute */}
            <div>
                <CaptionLine align="left" gap={8}>una letra cambiada · jamás visto</CaptionLine>
                <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" }}>
                    <FragmentLine ctx={p.typo} diff={diff} muted />
                    <span style={{ fontFamily: MONO, fontSize: "clamp(20px, 3vw, 28px)", fontWeight: 700, color: "var(--ngram-dim)" }}>
                        ?
                    </span>
                </div>
                <div
                    style={{
                        marginTop: 10,
                        padding: "16px 18px",
                        borderRadius: "var(--ngram-r-md)",
                        border: "1px dashed color-mix(in oklab, var(--ngram-wrong) 40%, transparent)",
                        background: "var(--ngram-wrong-soft)",
                        fontFamily: MONO,
                        fontSize: 14,
                        color: "var(--ngram-wrong)",
                        textAlign: "center",
                    }}
                >
                    nada · este contexto no aparece ni una vez · 0 apuestas
                </div>
            </div>

            <Verdict
                label="el problema"
                main={<>Una letra de diferencia. Para ti, la misma palabra. Para la máquina, una es familiar y la otra <b>no existe</b>.</>}
                sub="no entiende «parecido»: o vio ese contexto exacto, o no vio nada"
            />

            <div style={{ display: "flex", justifyContent: "center" }}>
                <GhostButton onClick={() => { setI((v) => (v + 1) % PAIRS.length); }}>otro ejemplo</GhostButton>
            </div>
        </div>
    );
});

export default UnseenContext;
