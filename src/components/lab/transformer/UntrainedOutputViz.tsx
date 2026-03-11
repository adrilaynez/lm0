"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";

/*
  UntrainedOutputViz — §08 Beat 1

  Shows what an untrained Transformer produces: pure random noise.
  Typewriter animation reveals gibberish character by character.
  "Generate again" re-rolls with new random chars.

  Emotional goal: create motivation to train the model.
  The architecture is flawless — but the weights are random.
*/

/* ── Gibberish corpus — realistic untrained model output ── */
const SAMPLES = [
    "e mk_foQ FQ:uI  p Fef 8p aws7\n\nuO gkQ9.Hb- y*DG?]rX Lv3!N tBz@wY+5 ;Cj=1|dP~mA#i%Kp2 cS/Uf6E Ro ",
    "Tz4] !KqW*v8 LP#mY  dX.Re3_\nUo fN+1 J|bS@7 gCi;Ah~5=p(FQ2/Bx k9%Gw-6cVn0:DIt",
    "J |  5 *rL 2gK P mT_#9;Yz \nBv0Xf~8+NAe .dQw!3 SU1/6HCi(=%Ro7@-Fj:k4]",
    "v( Mq]5 _ Kg!7.J Tz*+2Y \nD ~0Hf|=P;9%FrBX3/bw#iL1 x@8c-Ne6 SpCA:Uo",
    "8 Bn]~3Rk|Y 7gQ! F 2;v=\nC *_Xp5+.d0J e@1/Uz%i LA (Tw-9mK#f:oS 64Hj",
    "!0G  q d 4K T|.7 Xf*p+~\nN 9Bz ;2wY Rv5H%1=Cm3/(e8-@iA#S_LjU6]:oFk",
];

const CHAR_DELAY_MS = 18;
const CURSOR_BLINK_MS = 530;

export function UntrainedOutputViz() {
    const [sampleIdx, setSampleIdx] = useState(0);
    const [visibleCount, setVisibleCount] = useState(0);
    const [isTyping, setIsTyping] = useState(true);
    const [cursorVisible, setCursorVisible] = useState(true);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const cursorRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const currentText = SAMPLES[sampleIdx % SAMPLES.length];

    /* ── Typewriter engine ── */
    useEffect(() => {
        if (!isTyping) return;
        if (visibleCount >= currentText.length) {
            setIsTyping(false);
            return;
        }
        timerRef.current = setTimeout(() => {
            setVisibleCount((c) => c + 1);
        }, CHAR_DELAY_MS);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [visibleCount, isTyping, currentText.length]);

    /* ── Cursor blink ── */
    useEffect(() => {
        cursorRef.current = setInterval(() => {
            setCursorVisible((v) => !v);
        }, CURSOR_BLINK_MS);
        return () => {
            if (cursorRef.current) clearInterval(cursorRef.current);
        };
    }, []);

    /* ── Generate again ── */
    const regenerate = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setSampleIdx((i) => i + 1);
        setVisibleCount(0);
        setIsTyping(true);
    }, []);

    /* ── Render chars ── */
    const displayed = currentText.slice(0, visibleCount);

    return (
        <div className="flex flex-col items-center gap-5 w-full">
            {/* Card */}
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative w-full max-w-[520px] rounded-2xl overflow-hidden"
                style={{
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255,255,255,0.06)",
                }}
            >
                {/* Terminal header */}
                <div className="flex items-center gap-2.5 px-4 py-2.5 border-b"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: "rgba(244,63,94,0.5)" }} />
                        <span className="w-2 h-2 rounded-full" style={{ background: "rgba(251,191,36,0.35)" }} />
                        <span className="w-2 h-2 rounded-full" style={{ background: "rgba(52,211,153,0.3)" }} />
                    </div>
                    <span className="text-[10px] font-mono tracking-widest uppercase"
                        style={{ color: "rgba(255,255,255,0.2)" }}>
                        gpt_4b_128d — step 0
                    </span>
                </div>

                {/* Text area */}
                <div className="px-5 py-4 min-h-[120px] relative">
                    <p className="font-mono text-[14px] leading-relaxed break-all whitespace-pre-wrap"
                        style={{ color: "rgba(255,255,255,0.5)" }}>
                        {displayed.split("").map((ch, i) => (
                            <motion.span
                                key={`${sampleIdx}-${i}`}
                                initial={{ opacity: 0, y: 2 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.05 }}
                            >
                                {ch}
                            </motion.span>
                        ))}
                        {/* Cursor */}
                        <span
                            className="inline-block w-[2px] h-[16px] ml-[1px] align-middle"
                            style={{
                                background: cursorVisible ? "rgba(251,191,36,0.6)" : "transparent",
                                transition: "background 0.1s",
                            }}
                        />
                    </p>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-5 py-3 border-t"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                    <AnimatePresence mode="wait">
                        {!isTyping && (
                            <motion.span
                                key="done"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[12px] font-medium"
                                style={{ color: "rgba(251,191,36,0.5)" }}
                            >
                                {currentText.length} characters of noise
                            </motion.span>
                        )}
                        {isTyping && (
                            <motion.span
                                key="typing"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="text-[12px]"
                                style={{ color: "rgba(255,255,255,0.15)" }}
                            >
                                generating…
                            </motion.span>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={regenerate}
                        className="text-[12px] font-medium tracking-wide px-3 py-1.5 rounded-lg transition-all duration-200"
                        style={{
                            color: "rgba(255,255,255,0.25)",
                            background: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.06)",
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.color = "rgba(251,191,36,0.6)";
                            e.currentTarget.style.borderColor = "rgba(251,191,36,0.15)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.color = "rgba(255,255,255,0.25)";
                            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                        }}
                    >
                        Generate again
                    </button>
                </div>
            </motion.div>

            {/* Caption */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-center text-[13px] font-medium max-w-[400px] leading-relaxed"
                style={{ color: "rgba(251,191,36,0.45)" }}
            >
                Pure noise. Every character is a random guess.
            </motion.p>
        </div>
    );
}
