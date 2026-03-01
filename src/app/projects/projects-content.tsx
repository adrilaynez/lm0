"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight,
    Boxes,
    Brain, FlaskConical, Sparkles
} from "lucide-react";

import { FadeInView } from "@/components/lab/FadeInView";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/i18n/context";

const projects: never[] = [];

export function ProjectsContent() {
    const { t } = useI18n();

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative py-24 px-4 overflow-hidden border-b border-border/40">
                <div className="absolute inset-0 -z-10 bg-background">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                </div>

                <div className="container mx-auto max-w-5xl">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                        <Badge variant="secondary" className="px-4 py-1 text-xs uppercase tracking-widest rounded-full border border-primary/20">
                            {t("projects.hero.badge")}
                        </Badge>
                    </motion.div>
                    <div className="relative group mt-8">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
                            className="text-5xl md:text-7xl font-black tracking-tight mb-6"
                        >
                            {t("projects.hero.titlePrefix")} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">
                                {t("projects.hero.titleSuffix")}
                            </span>
                        </motion.h1>
                    </div>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-xl text-muted-foreground max-w-2xl"
                    >
                        {t("projects.hero.description")}
                    </motion.p>
                </div>
            </section>

            {/* Main Content */}
            <section className="container py-16 mx-auto max-w-screen-xl px-4">
                {/* Flagship — LM-Lab */}
                <div className="mb-24">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-px bg-border flex-1"></div>
                        <span className="text-sm font-mono text-muted-foreground uppercase tracking-widest">{t("projects.flagship.badge")}</span>
                        <div className="h-px bg-border flex-1"></div>
                    </div>

                    <FadeInView>
                        <Card className="relative overflow-hidden border-emerald-500/20 bg-gradient-to-br from-black via-emerald-950/20 to-black group hover:border-emerald-500/30 transition-all duration-700">
                            {/* Animated background grid */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:32px_32px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                            {/* Floating orb */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-emerald-500/[0.06] blur-[100px] group-hover:bg-emerald-500/[0.12] transition-all duration-1000" />
                            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-violet-500/[0.04] blur-[80px] group-hover:bg-violet-500/[0.08] transition-all duration-1000" />

                            <div className="relative z-10 p-8 md:p-12">
                                {/* Top badges */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <Badge variant="default" className="bg-primary/20 text-primary border-primary/50 uppercase tracking-wider text-[10px]">
                                        {t("projects.flagship.featured")}
                                    </Badge>
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] uppercase tracking-wider">
                                        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        {t("projects.flagship.liveDemo")}
                                    </Badge>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-primary/60">{t("projects.flagship.badge")}</span>
                                    <h2 className="text-3xl md:text-4xl font-black tracking-tight text-white">
                                        {t("projects.flagship.title")}
                                    </h2>
                                </div>

                                {/* Description */}
                                <p className="text-base md:text-lg text-white/60 max-w-2xl mb-6 leading-relaxed">
                                    {t("projects.flagship.description")}
                                </p>

                                {/* Tech Stack */}
                                <div className="flex flex-wrap gap-1.5 mb-8">
                                    {["Python", "PyTorch", "FastAPI", "Next.js", "TypeScript", "Canvas API"].map(
                                        (tag) => (
                                            <Badge
                                                key={tag}
                                                variant="secondary"
                                                className="font-mono text-xs bg-white/[0.04] border-white/[0.06] text-white/50"
                                            >
                                                {tag}
                                            </Badge>
                                        )
                                    )}
                                </div>

                                {/* Feature highlights */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                    {[
                                        {
                                            icon: Brain,
                                            title: t("projects.flagship.highlights.inference.title"),
                                            desc: t("projects.flagship.highlights.inference.desc"),
                                        },
                                        {
                                            icon: Boxes,
                                            title: t("projects.flagship.highlights.matrix.title"),
                                            desc: t("projects.flagship.highlights.matrix.desc"),
                                        },
                                        {
                                            icon: Sparkles,
                                            title: t("projects.flagship.highlights.generation.title"),
                                            desc: t("projects.flagship.highlights.generation.desc"),
                                        },
                                    ].map((feat) => (
                                        <div
                                            key={feat.title}
                                            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.04] hover:border-emerald-500/20 transition-all duration-300 group/feat"
                                        >
                                            <feat.icon className="h-5 w-5 text-emerald-400/60 mb-2 group-hover/feat:text-emerald-400 transition-colors" />
                                            <h4 className="text-sm font-semibold text-white mb-1">
                                                {feat.title}
                                            </h4>
                                            <p className="text-xs text-white/40 leading-relaxed">
                                                {feat.desc}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* CTAs */}
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase tracking-widest h-11 px-6 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all duration-300"
                                        asChild
                                    >
                                        <Link href="/lab">
                                            <FlaskConical className="h-4 w-4 mr-2" />
                                            {t("projects.flagship.cta.explorer")}
                                            <ArrowRight className="h-3.5 w-3.5 ml-2" />
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-white/[0.08] hover:bg-white/[0.04] text-white/70 font-mono text-xs uppercase tracking-widest h-11 px-6 transition-all"
                                        asChild
                                    >
                                        <Link href="/lab">
                                            <Boxes className="h-4 w-4 mr-2" />
                                            {t("projects.flagship.cta.architecture")}
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="border-white/[0.08] hover:bg-white/[0.04] text-white/70 font-mono text-xs uppercase tracking-widest h-11 px-6 transition-all"
                                        asChild
                                    >
                                        <Link href="/lab">
                                            <Sparkles className="h-4 w-4 mr-2" />
                                            {t("projects.flagship.cta.demo")}
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </FadeInView>
                </div>

                {/* Coming Soon Section */}
                <section>
                    <FadeInView className="text-center py-16">
                        <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 text-xs font-mono uppercase tracking-widest text-primary mb-6">
                            <Sparkles className="h-3 w-3" />
                            {t("projects.experiments.comingSoon")}
                        </div>
                        <h2 className="text-2xl font-bold tracking-tight mb-4 text-muted-foreground">
                            {t("projects.experiments.title")}
                        </h2>
                        <p className="text-muted-foreground/60 max-w-md mx-auto text-sm">
                            {t("projects.experiments.comingSoonDesc")}
                        </p>
                    </FadeInView>
                </section>

            </section>
        </div>
    );
}
