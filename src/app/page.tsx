"use client";
import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";

import { motion, useScroll, useTransform } from "framer-motion";

import { FadeInView } from "@/components/lab/FadeInView";
import {
  ArrowRight,
  ChevronDown,
  Cpu,
  Database,
  ExternalLink,
  FlaskConical,
  Github,
  Layers,
  Linkedin,
  Mail,
  Sigma,
  Sparkles,
} from "lucide-react";

import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { NebulaBackground } from "@/components/ui/nebula-background";
import { useI18n } from "@/i18n/context";

/* ─── Staggered Character Reveal ─── */
function AnimatedTitle({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  return (
    <motion.span className={className} aria-label={text}>
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 36, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            duration: 0.55,
            delay: delay + i * 0.02,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ─── Fade-Up Block ─── */
function FadeUp({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.85, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Scroll Reveal Block ─── */
function ScrollReveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <FadeInView margin="-80px" className={className}>
      {children}
    </FadeInView>
  );
}

/* ─── Animated Counter ─── */
function Counter({ value, suffix = "" }: { value: string; suffix?: string }) {
  return (
    <FadeInView as="span">
      {value}{suffix}
    </FadeInView>
  );
}

/* ─── Static Orb Background (GPU-friendly, no JS animation) ─── */
function FloatingOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      <div className="absolute left-1/2 top-1/4 -translate-x-1/2 h-[540px] w-[540px] rounded-full bg-violet-500/[0.06] blur-[100px]" />
      <div className="absolute right-1/4 bottom-1/4 h-[360px] w-[360px] rounded-full bg-cyan-500/[0.05] blur-[80px]" />
      <div className="absolute left-1/4 bottom-1/3 h-[260px] w-[260px] rounded-full bg-rose-500/[0.04] blur-[80px]" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════ */

export default function Home() {
  const { t } = useI18n();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.35]);
  const heroScale = useTransform(scrollYProgress, [0, 0.8], [1, 0.95]);

  return (
    <div className="flex flex-col min-h-screen relative">
      <NebulaBackground particleCount={25} baseColor="rgba(140, 140, 255, 0.06)" />

      {/* ────────── HERO ────────── */}
      <motion.section
        ref={heroRef}
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 text-center"
      >
        <FloatingOrbs />

        <div className="container max-w-6xl space-y-8 relative z-10">
          {/* Status Chip */}
          <FadeUp delay={0.1}>
            <span className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              {t("landing.hero.status")}
            </span>
          </FadeUp>

          {/* Name — single line, scales with viewport */}
          <div className="w-full text-center">
            <h1
              className="font-extrabold tracking-[-0.03em] leading-none text-white"
              style={{ fontSize: "clamp(2rem, 6.5vw, 5.5rem)" }}
            >
              <AnimatedTitle
                text={t("landing.hero.title")}
                delay={0.3}
                className="text-white"
              />
            </h1>
          </div>

          {/* Divider */}
          <FadeUp delay={1.0}>
            <div className="flex items-center justify-center gap-4">
              <div className="h-px w-12 bg-white/20" />
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-muted-foreground/40">{t("landing.hero.role")}</span>
              <div className="h-px w-12 bg-white/20" />
            </div>
          </FadeUp>

          {/* Tagline */}
          <FadeUp delay={1.15} className="space-y-2">
            <p className="mx-auto max-w-2xl text-lg md:text-xl text-muted-foreground/80 font-light leading-relaxed tracking-tight">
              {t("landing.hero.tagline1")}
            </p>
            <p className="mx-auto max-w-xl text-sm md:text-base text-muted-foreground/50 font-light">
              <span className="text-primary/80 font-medium">Mechanistic Interpretability</span> · {t("landing.hero.tagline2").split("·")[1]?.trim() || "High-Performance Engineering."}
            </p>
          </FadeUp>

          {/* CTA */}
          <FadeUp delay={1.4} className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Button
              size="lg"
              className="h-13 px-8 rounded-full text-sm font-medium shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-primary/25 hover:scale-[1.04] active:scale-[0.98]"
              asChild
            >
              <Link href="/projects">
                {t("landing.hero.cta.lab")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="h-13 px-8 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05] transition-all duration-300"
              asChild
            >
              <Link href="/notes">{t("landing.hero.cta.notes")}</Link>
            </Button>
          </FadeUp>
        </div>

        {/* Scroll Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ delay: 2.2, duration: 1.2 }}
          className="absolute bottom-10"
        >
          <motion.div animate={{ y: [0, 9, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* ────────── METRICS RIBBON ────────── */}
      <section className="relative z-10 border-y border-white/[0.06] bg-white/[0.01]">
        <div className="container mx-auto max-w-screen-xl px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/[0.06]">
            {[
              { value: "4", label: t("landing.metrics.research") },
              { value: "50+", label: t("landing.metrics.visualizations") },
              { value: "2", label: t("landing.metrics.languages") },
              { value: "∞", label: t("landing.metrics.curiosity") },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label}>
                <div className="py-10 px-6 text-center group">
                  <div className="text-3xl md:text-4xl font-bold text-foreground mb-1 transition-colors group-hover:text-primary">
                    <Counter value={stat.value} />
                  </div>
                  <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground/60">{stat.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ────────── ABOUT ────────── */}
      <section className="relative z-10 border-b border-white/[0.06]">
        <div className="container py-32 mx-auto max-w-screen-xl px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Image Column */}
            <ScrollReveal>
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/[0.06] shadow-2xl group">
                <Image
                  src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2070&auto=format&fit=crop"
                  alt="Abstract Mathematics Visualization"
                  fill
                  className="object-cover opacity-60 transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

                {/* Floating Status Card */}
                <FadeInView delay={0.25} className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="bg-background/80 rounded-xl border border-white/[0.08] p-5 shadow-2xl">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">{t("landing.about.building")}</span>
                    </div>
                    <p className="text-sm font-medium text-foreground">{t("landing.about.projectTitle")}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{t("landing.about.projectDesc")}</p>
                  </div>
                </FadeInView>

                {/* Corner Accent */}
                <div className="absolute top-4 right-4 flex gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-red-500/60" />
                  <div className="h-2 w-2 rounded-full bg-yellow-500/60" />
                  <div className="h-2 w-2 rounded-full bg-green-500/60" />
                </div>
              </div>
            </ScrollReveal>

            {/* Copy Column */}
            <ScrollReveal className="space-y-10">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-3 w-3" /> {t("landing.about.badge")}
                </div>
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                  {t("landing.about.bio.titlePrefix")}
                  <br className="hidden md:block" />
                  <span className="text-muted-foreground"> {t("landing.about.bio.titleSuffix")}</span>
                </h2>
              </div>

              <div className="space-y-5 text-[15px] leading-[1.8] text-muted-foreground">
                <p dangerouslySetInnerHTML={{ __html: t("landing.about.bio.p1") }} />
                <p dangerouslySetInnerHTML={{ __html: t("landing.about.bio.p2") }} />
                <p className="text-muted-foreground/60 border-l-2 border-primary/30 pl-4 italic">
                  {t("landing.about.bio.mission")}
                </p>
              </div>

              {/* Skills */}
              <div className="space-y-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40">{t("landing.skills.title")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Python", "TypeScript", "React", "Next.js", "PyTorch", "FastAPI",
                    t("landing.skills.linearAlgebra"), "LaTeX", "Git",
                  ].map((s) => (
                    <motion.span
                      key={s}
                      whileHover={{ scale: 1.06, backgroundColor: "rgba(255,255,255,0.08)" }}
                      className="rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-xs text-muted-foreground transition-colors cursor-default"
                    >
                      {s}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Links */}
              <div className="flex gap-3 pt-2">
                <Button variant="outline" size="sm" className="rounded-full border-white/[0.08] hover:bg-white/[0.04] text-xs h-9 px-5 group/btn" asChild>
                  <Link href="https://github.com/adrilaynez" target="_blank">
                    <Github className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" /> {t("landing.contact.githubShort")}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-white/[0.08] hover:bg-white/[0.04] text-xs h-9 px-5 group/btn" asChild>
                  <Link href="https://linkedin.com/in/adrianlaynez" target="_blank">
                    <Linkedin className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" /> {t("landing.contact.linkedin")}
                  </Link>
                </Button>
                <Button variant="outline" size="sm" className="rounded-full border-white/[0.08] hover:bg-white/[0.04] text-xs h-9 px-5 group/btn" asChild>
                  <Link href="mailto:contact@adrianlaynez.dev">
                    <Mail className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover/btn:rotate-12" /> {t("landing.contact.email")}
                  </Link>
                </Button>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ────────── SELECTED WORK ────────── */}
      <section className="relative z-10 border-b border-white/[0.06]">
        <div className="container py-32 mx-auto max-w-screen-xl px-6">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-20">
            <ScrollReveal className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-primary mb-4">
                <FlaskConical className="h-3 w-3" /> {t("landing.work.badge")}
              </div>
              <h3 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                {t("landing.work.titlePrefix")}
                <br className="hidden md:block" />
                <span className="text-muted-foreground"> {t("landing.work.titleSuffix")}</span>
              </h3>
              <p className="mt-5 text-muted-foreground text-[15px] leading-relaxed max-w-xl">
                {t("landing.work.description")}
              </p>
            </ScrollReveal>
            <ScrollReveal>
              <Button
                variant="outline"
                className="rounded-full border-white/[0.08] hover:bg-white/[0.04] h-10 px-6 text-xs group"
                asChild
              >
                <Link href="/projects">
                  {t("landing.work.viewAll")} <ExternalLink className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </Button>
            </ScrollReveal>
          </div>

          <BentoGrid className="max-w-5xl">
            {items.map((item, i) => (
              <BentoGridItem
                key={i}
                title={t(item.title)}
                description={t(item.description)}
                header={item.header}
                icon={item.icon}
                className={i === 0 || i === 3 ? "md:col-span-2" : ""}
              />
            ))}
          </BentoGrid>
        </div>
      </section>

      {/* ────────── CONTACT CTA ────────── */}
      <section className="relative z-10">
        <div className="container py-32 mx-auto max-w-3xl px-6 text-center">
          <ScrollReveal className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-mono uppercase tracking-[0.2em] text-primary">
              <Mail className="h-3 w-3" /> {t("landing.contact.badge")}
            </div>
            <h4 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              {t("landing.contact.titlePrefix")}
              <span className="text-muted-foreground"> {t("landing.contact.titleMiddle")}</span>
              <br />
              <span className="text-muted-foreground">{t("landing.contact.titleSuffix")}</span>
            </h4>
            <p className="text-muted-foreground text-[15px] leading-relaxed max-w-xl mx-auto">
              {t("landing.contact.description")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Button
                size="lg"
                className="h-13 px-8 rounded-full text-sm font-medium shadow-lg shadow-primary/10 transition-all duration-300 hover:shadow-primary/25 hover:scale-[1.04] active:scale-[0.98]"
                asChild
              >
                <Link href="mailto:contact@adrianlaynez.dev">
                  {t("landing.contact.email")} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="h-13 px-8 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/[0.05]"
                asChild
              >
                <Link href="https://github.com/adrilaynez" target="_blank">
                  <Github className="mr-2 h-4 w-4" /> {t("landing.contact.github")}
                </Link>
              </Button>
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}

/* ─── Bento Card Visual Headers ─── */
const GradientSkeleton = ({ from, to }: { from: string; to: string }) => (
  <div
    className={`flex flex-1 w-full h-full min-h-[6rem] rounded-xl border border-white/[0.04] transition-all duration-700 group-hover/bento:border-primary/20 overflow-hidden relative`}
  >
    <div className={`absolute inset-0 bg-gradient-to-br ${from} ${to} opacity-60 group-hover/bento:opacity-100 transition-opacity duration-700`} />
    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
  </div>
);

const items = [
  {
    title: "landing.work.items.nanoTransformer.title",
    description: "landing.work.items.nanoTransformer.desc",
    header: <GradientSkeleton from="from-violet-500/10" to="to-indigo-500/10" />,
    icon: <Cpu className="h-4 w-4 text-violet-400" />,
  },
  {
    title: "landing.work.items.cudaKernels.title",
    description: "landing.work.items.cudaKernels.desc",
    header: <GradientSkeleton from="from-cyan-500/10" to="to-blue-500/10" />,
    icon: <Layers className="h-4 w-4 text-cyan-400" />,
  },
  {
    title: "landing.work.items.autograd.title",
    description: "landing.work.items.autograd.desc",
    header: <GradientSkeleton from="from-amber-500/10" to="to-orange-500/10" />,
    icon: <Sigma className="h-4 w-4 text-amber-400" />,
  },
  {
    title: "landing.work.items.mathDl.title",
    description: "landing.work.items.mathDl.desc",
    header: <GradientSkeleton from="from-rose-500/10" to="to-pink-500/10" />,
    icon: <FlaskConical className="h-4 w-4 text-rose-400" />,
  },
  {
    title: "landing.work.items.distributed.title",
    description: "landing.work.items.distributed.desc",
    header: <GradientSkeleton from="from-emerald-500/10" to="to-teal-500/10" />,
    icon: <Database className="h-4 w-4 text-emerald-400" />,
  },
];
