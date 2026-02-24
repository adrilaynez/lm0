"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import { useI18n } from "@/i18n/context";
import { useLabMode } from "@/context/LabModeContext";

const NGRAM_NAME_KEYS: Record<number, string> = {
    1: "models.ngram.controls.bigram",
    2: "models.ngram.controls.trigram",
    3: "models.ngram.controls.fourgram",
    4: "models.ngram.controls.fivegram",
};

const CONTEXT_LEVEL_KEYS: Record<number, string> = {
    1: "models.ngram.lab.contextLevels.1",
    2: "models.ngram.lab.contextLevels.2",
    3: "models.ngram.lab.contextLevels.3",
    4: "models.ngram.lab.contextLevels.4",
};

interface ContextControlProps {
    value: number;
    onChange: (value: number) => void;
    disabled?: boolean;
    min?: number;
}

export function ContextControl({ value, onChange, disabled, min = 1 }: ContextControlProps) {
    const { t } = useI18n();
    const { mode } = useLabMode();
    const isEdu = mode === "educational";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`rounded-2xl p-6 md:p-7 border transition-colors ${isEdu
                ? "bg-gradient-to-br from-amber-950/15 via-black/40 to-black/60 border-amber-500/15 shadow-[0_0_25px_-8px_rgba(245,158,11,0.15)]"
                : "bg-gradient-to-br from-cyan-950/10 via-black/40 to-black/60 border-cyan-500/15 shadow-[0_0_25px_-8px_rgba(6,182,212,0.15)]"
                }`}
        >
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${isEdu ? "bg-amber-500/15" : "bg-cyan-500/15"}`}>
                        <Layers className={`w-5 h-5 ${isEdu ? "text-amber-300" : "text-cyan-300"}`} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm tracking-tight">{t("models.ngram.controls.contextSize")}</h3>
                        <p className="text-white/40 text-xs mt-0.5">
                            {t("models.ngram.controls.contextDesc")}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Badge
                        variant="outline"
                        className={`font-mono text-lg px-3 py-1 ${isEdu
                            ? "text-amber-300 border-amber-500/30 bg-amber-500/10"
                            : "text-cyan-300 border-cyan-500/30 bg-cyan-500/10"
                            }`}
                    >
                        N = {value}
                    </Badge>
                </div>
            </div>

            <div className="px-2 mb-4">
                <Slider
                    value={[value]}
                    min={min}
                    max={4}
                    step={1}
                    onValueChange={(vals: number[]) => onChange(vals[0])}
                    disabled={disabled}
                    className="cursor-pointer"
                />
            </div>

            <div className="flex justify-between px-1 mb-4">
                {[1, 2, 3, 4].filter((n) => n >= min).map((n) => (
                    <button
                        key={n}
                        onClick={() => onChange(n)}
                        disabled={disabled}
                        className={`text-[10px] font-mono uppercase tracking-widest transition-all px-1 py-0.5 rounded ${n === value
                            ? isEdu
                                ? "text-amber-300 font-bold"
                                : "text-cyan-300 font-bold"
                            : "text-white/30 hover:text-white/50"
                            }`}
                    >
                        {t(NGRAM_NAME_KEYS[n])}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.p
                    key={value}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.25 }}
                    className={`text-xs leading-relaxed px-1 border-t pt-3 ${isEdu
                        ? "text-amber-200/50 border-amber-500/10"
                        : "text-cyan-200/40 border-cyan-500/10"
                        }`}
                >
                    {t(CONTEXT_LEVEL_KEYS[value])}
                </motion.p>
            </AnimatePresence>
        </motion.div>
    );
}
