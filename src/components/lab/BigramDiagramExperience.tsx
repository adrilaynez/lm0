"use client";

import { useEffect,useMemo, useState } from "react";

import { Info } from "lucide-react";

import { BigramMatrixBuilder } from "@/components/lab/BigramMatrixBuilder";
import { TransitionMatrix } from "@/components/lab/TransitionMatrix";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useI18n } from "@/i18n/context";
import { cn } from "@/lib/utils";
import type { TrainingViz,TransitionMatrixViz } from "@/types/lmLab";

type DiagramMode = "story" | "lab";
type ProbabilityMethod = "normalize" | "softmax";

interface BigramDiagramExperienceProps {
    mode: DiagramMode;
    matrixData: TransitionMatrixViz | null;
    trainingData?: TrainingViz | null;
    onCellClick?: (row: string, col: string) => void;
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
    // const [storyStep, setStoryStep] = useState(0); // REMOVED
    const [selectedRow, setSelectedRow] = useState<string>("");
    const [method, setMethod] = useState<ProbabilityMethod>("normalize");
    const [temperature, setTemperature] = useState(1);
    const [sampledToken, setSampledToken] = useState<string | null>(null);
    const [sampleRoll, setSampleRoll] = useState<number | null>(null);

    useEffect(() => {
        if (matrixData?.row_labels.length) {
            setSelectedRow((prev) =>
                prev && matrixData.row_labels.includes(prev)
                    ? prev
                    : matrixData.row_labels[0]
            );
        }
    }, [matrixData]);

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
                count: educationalCounts[index] ?? 0,
                probability,
            }))
            .sort((a, b) => b.probability - a.probability);
    }, [matrixData, probabilities, educationalCounts]);

    const visibleCandidates = sortedCandidates.slice(0, 15);
    const hiddenMass = Math.max(
        0,
        sortedCandidates
            .slice(15)
            .reduce((acc, candidate) => acc + candidate.probability, 0)
    );
    const topCandidate = sortedCandidates[0] ?? null;

    const runSampling = () => {
        if (!matrixData || probabilities.length === 0) return;
        const { index, roll } = sampleIndex(probabilities);
        setSampledToken(matrixData.col_labels[index]);
        setSampleRoll(roll);
    };



    const renderMatrix = () => (
        <TransitionMatrix
            data={matrixData}
            onCellClick={onCellClick}
            datasetMeta={{
                corpusName: "Paul Graham essays (paulgraham.com)",
                rawTextSize: trainingData?.raw_text_size,
                trainDataSize: trainingData?.train_data_size,
                vocabSize: trainingData?.unique_characters,
            }}
        />
    );

    const renderProbabilityFlow = () => (
        <Card className="bg-slate-950/60 border border-emerald-500/20 p-4 md:p-5">
            <div className="flex flex-wrap items-center gap-2 mb-3">
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                    {t("models.bigram.matrix.probFlow.badge")}
                </Badge>
                {looksNormalized && (
                    <span className="text-[11px] text-amber-200/80">
                        {t("models.bigram.matrix.probFlow.alreadyNormalized")}
                    </span>
                )}
            </div>

            <p className="text-sm text-white/65 leading-relaxed mb-4">
                {t("models.bigram.matrix.probFlow.description")}
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">
                        {t("models.bigram.matrix.probFlow.step1")}
                    </p>
                    <label className="text-xs text-white/60 block mb-2">
                        {t("models.bigram.matrix.probFlow.currentToken")}
                    </label>
                    <div className="relative flex justify-center">
                        <div className="relative group">
                            <div className="absolute -inset-0.5 bg-emerald-500/20 rounded-lg blur opacity-30 group-hover:opacity-60 transition duration-200" />
                            <Input
                                value={selectedRow}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (!val) return;
                                    const char = val.slice(-1);
                                    if (matrixData?.row_labels.includes(char)) {
                                        setSelectedRow(char);
                                    }
                                }}
                                className="relative w-16 h-16 bg-slate-900 border-white/10 text-center font-mono text-3xl text-white focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all uppercase"
                                placeholder="?"
                            />
                            {selectedRow === " " && (
                                <span className="absolute inset-0 flex items-center justify-center text-white/20 pointer-events-none font-mono text-xs uppercase tracking-widest">
                                    SPACE
                                </span>
                            )}
                        </div>
                    </div>
                    <p className="text-[10px] text-white/40 mt-3 text-center font-mono">
                        {t("models.bigram.matrix.probFlow.typeToChange") || "Type to change context"}
                    </p>
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">
                        {t("models.bigram.matrix.probFlow.step2")}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={method === "normalize" ? "secondary" : "outline"}
                                        onClick={() => setMethod("normalize")}
                                    >
                                        {t("models.bigram.matrix.probFlow.normalize")}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-3 bg-zinc-900 border-zinc-800 text-zinc-300">
                                    <p className="font-bold text-emerald-400 mb-1">{t("models.bigram.matrix.probFlow.educational.normTitle")}</p>
                                    <p className="text-xs leading-relaxed">{t("models.bigram.matrix.probFlow.educational.normDesc")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={method === "softmax" ? "secondary" : "outline"}
                                        onClick={() => setMethod("softmax")}
                                    >
                                        {t("models.bigram.matrix.probFlow.softmax")}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs p-3 bg-zinc-900 border-zinc-800 text-zinc-300">
                                    <p className="font-bold text-indigo-400 mb-1">{t("models.bigram.matrix.probFlow.educational.softmaxTitle")}</p>
                                    <p className="text-xs leading-relaxed">{t("models.bigram.matrix.probFlow.educational.softmaxDesc")}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>

                    {method === "softmax" && (
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <label className="text-xs text-white/55">
                                    {t("models.bigram.matrix.probFlow.temperature")}: {temperature.toFixed(1)}
                                </label>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <Info className="w-3 h-3 text-white/40 hover:text-white/80 transition-colors" />
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-xs p-3 bg-zinc-900 border-zinc-800 text-zinc-300">
                                            <p className="font-bold text-amber-400 mb-1">{t("models.bigram.matrix.probFlow.educational.tempTitle")}</p>
                                            <p className="text-xs leading-relaxed">{t("models.bigram.matrix.probFlow.educational.tempDesc")}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <input
                                type="range"
                                min={0.5}
                                max={2}
                                step={0.1}
                                value={temperature}
                                onChange={(e) => setTemperature(Number(e.target.value))}
                                className="w-full accent-emerald-400"
                            />
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                    <p className="text-[11px] uppercase tracking-widest text-white/40 mb-2">
                        {t("models.bigram.matrix.probFlow.step3")}
                    </p>
                    <Button
                        type="button"
                        className="w-full mb-2"
                        onClick={runSampling}
                        disabled={!matrixData || probabilities.length === 0}
                    >
                        {t("models.bigram.matrix.probFlow.sample")}
                    </Button>
                    <p className="text-xs text-white/55">
                        {topCandidate
                            ? `${t("models.bigram.matrix.probFlow.topCandidate")}: '${topCandidate.token === " " ? "space" : topCandidate.token}' (${(topCandidate.probability * 100).toFixed(1)}%)`
                            : t("models.bigram.matrix.runInference")}
                    </p>
                    {sampledToken && (
                        <p className="text-xs text-emerald-200 mt-1">
                            {t("models.bigram.matrix.probFlow.sampled")}: '{sampledToken === " " ? "space" : sampledToken}'
                            {sampleRoll !== null && ` (${sampleRoll.toFixed(3)})`}
                        </p>
                    )}
                </div>
            </div>

            <ScrollArea className="h-[300px] w-full rounded-md border border-white/5 bg-black/20 p-4">
                <div className="space-y-2 pr-4">
                    {visibleCandidates.map((candidate) => (
                        <div key={candidate.token} className="flex items-center gap-3 group/item">
                            <span className="w-8 font-mono text-xs text-white/50 group-hover/item:text-white transition-colors">
                                '{candidate.token === " " ? "⎵" : candidate.token}'
                            </span>
                            <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                                <div
                                    className={cn(
                                        "h-full bg-gradient-to-r from-emerald-500/80 to-teal-400/80 transition-all",
                                        sampledToken === candidate.token && "from-amber-400 to-orange-300"
                                    )}
                                    style={{ width: `${Math.max(0, candidate.probability * 100)}%` }}
                                />
                            </div>
                            <span className="w-16 text-right text-xs text-white/40 group-hover/item:text-white/80 tabular-nums transition-colors">
                                {(candidate.probability * 100).toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <p className="text-xs text-white/50 leading-relaxed mt-4">
                {t("models.bigram.matrix.probFlow.stochasticNote")}
            </p>
        </Card>
    );

    if (mode === "lab") {
        return (
            <div className="space-y-6">
                <Card className="bg-emerald-950/30 border border-emerald-500/30 p-4">
                    <p className="text-sm text-emerald-100/85 leading-relaxed">
                        {t("models.bigram.matrix.labModeGuide")}
                    </p>
                </Card>
                {renderMatrix()}
                {renderProbabilityFlow()}
                <Card className="bg-rose-950/20 border border-rose-500/20 p-4">
                    <p className="text-sm text-rose-100/80 leading-relaxed">
                        {t("models.bigram.matrix.limitationGuide")}
                    </p>
                </Card>
            </div>
        );
    }

    // EDUCATIONAL / NARRATIVE MODE — original colored sections
    return (
        <div className="space-y-12">

            {/* 1. THE PROBLEM */}
            <section className="space-y-4">
                <div className="border-l-2 border-emerald-500 pl-4">
                    <h4 className="text-lg font-bold text-emerald-400">
                        {t("models.bigram.matrix.storySteps.problem.title")}
                    </h4>
                </div>
                <Card className="bg-emerald-950/20 border border-emerald-500/20 p-5 md:p-6">
                    <p className="text-sm md:text-base text-white/80 leading-relaxed">
                        {t("models.bigram.matrix.storySteps.problem.body")}
                    </p>
                </Card>
            </section>

            {/* 2. REPRESENTATION */}
            <section className="space-y-4">
                <div className="border-l-2 border-indigo-500 pl-4">
                    <h4 className="text-lg font-bold text-indigo-400">
                        {t("models.bigram.matrix.storySteps.representation.title")}
                    </h4>
                </div>
                <Card className="bg-indigo-500/[0.05] border border-indigo-500/20 p-5 md:p-6">
                    <p className="text-sm text-white/80 leading-relaxed mb-6 whitespace-pre-line">
                        {t("models.bigram.matrix.storySteps.representation.body")}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-indigo-500/20 bg-black/20 p-4">
                            <p className="font-bold text-indigo-300 mb-2">{t("models.bigram.matrix.representation.charTitle")}</p>
                            <p className="text-sm text-white/60 leading-relaxed">{t("models.bigram.matrix.representation.charBody")}</p>
                        </div>
                        <div className="rounded-xl border border-amber-500/20 bg-black/20 p-4">
                            <p className="font-bold text-amber-300 mb-2">{t("models.bigram.matrix.representation.wordTitle")}</p>
                            <p className="text-sm text-white/60 leading-relaxed">{t("models.bigram.matrix.representation.wordBody")}</p>
                        </div>
                    </div>
                </Card>
            </section>

            {/* 3. SOLUTION */}
            <section className="space-y-4">
                <div className="border-l-2 border-cyan-500 pl-4">
                    <h4 className="text-lg font-bold text-cyan-400">
                        {t("models.bigram.matrix.storySteps.solution.title")}
                    </h4>
                </div>
                <Card className="bg-cyan-950/20 border border-cyan-500/20 p-5 md:p-6">
                    <p className="text-sm text-white/80 leading-relaxed mb-4">
                        {t("models.bigram.matrix.storySteps.solution.body")}
                    </p>
                    <div className="bg-black/30 rounded-xl p-4 border border-white/5">
                        <p className="text-xs uppercase tracking-widest text-white/40 mb-3 font-semibold">{t("models.bigram.matrix.builderLabel")}</p>
                        <BigramMatrixBuilder />
                    </div>
                </Card>
            </section>

            {/* 4. THE MATRIX */}
            <section className="space-y-4">
                <div className="border-l-2 border-fuchsia-500 pl-4">
                    <h4 className="text-lg font-bold text-fuchsia-400">
                        {t("models.bigram.matrix.storySteps.matrix.title")}
                    </h4>
                </div>
                <Card className="bg-fuchsia-950/10 border border-fuchsia-500/20 p-5 md:p-6">
                    <p className="text-sm text-white/80 leading-relaxed mb-6">
                        {t("models.bigram.matrix.storySteps.matrix.body")}
                    </p>
                    {renderMatrix()}
                </Card>
            </section>

            {/* 5. PROBABILITIES */}
            <section className="space-y-4">
                <div className="border-l-2 border-emerald-500 pl-4">
                    <h4 className="text-lg font-bold text-emerald-400">
                        {t("models.bigram.matrix.storySteps.probabilities.title")}
                    </h4>
                </div>
                <div className="space-y-4">
                    <Card className="bg-emerald-950/10 border border-emerald-500/20 p-5 md:p-6">
                        <p className="text-sm text-white/80 leading-relaxed">
                            {t("models.bigram.matrix.storySteps.probabilities.body")}
                        </p>
                    </Card>
                    {renderProbabilityFlow()}
                </div>
            </section>

            {/* 6. LIMITATIONS */}
            <section className="space-y-4 pb-12">
                <div className="border-l-2 border-rose-500 pl-4">
                    <h4 className="text-lg font-bold text-rose-400">
                        {t("models.bigram.matrix.storySteps.limitation.title")}
                    </h4>
                </div>
                <Card className="bg-rose-950/20 border border-rose-500/20 p-5 md:p-6">
                    <p className="text-sm text-rose-100/90 leading-relaxed">
                        {t("models.bigram.matrix.storySteps.limitation.body")}
                    </p>
                </Card>
            </section>

        </div>
    );
}
