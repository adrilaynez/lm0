"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "framer-motion";
import {
    Check,
    ChevronUp,
    FlaskConical,
    Globe,
    Loader2,
    Moon,
    RefreshCw,
    Sun,
    WifiOff,
} from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ScrollProvider, useScrollY } from "@/context/ScrollContext";
import { accentOf,ChapterSwitcher } from "@/features/lab/components/ChapterSwitcher";
import FeedbackButton from "@/features/lab/components/FeedbackButton";
import { KeyboardShortcutsPanel } from "@/features/lab/components/KeyboardShortcutsPanel";
import { ReadingProgressBar } from "@/features/lab/components/ReadingProgressBar";
import { useUser } from "@/features/lab/context/UserContext";
import { useBackendHealth } from "@/features/lab/hooks/useBackendHealth";
import { useKeyboardShortcuts } from "@/features/lab/hooks/useKeyboardShortcuts";
import { useLabTheme } from "@/features/lab/hooks/useLabTheme";
import { useProgressTracker } from "@/features/lab/hooks/useProgressTracker";
import { useI18n } from "@/i18n/context";
import { Link, usePathname } from "@/i18n/navigation";

/* ─── Avatar + Name Popover ─── */

function AvatarPopover() {
    const { displayName, setDisplayName } = useUser();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(displayName);
    const popoverRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Sync draft when displayName changes externally
    useEffect(() => { setDraft(displayName); }, [displayName]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    const save = () => {
        setDisplayName(draft);
        setOpen(false);
    };

    const initial = displayName ? displayName.charAt(0).toUpperCase() : "?";

    return (
        <div className="relative">
            <button
                ref={buttonRef}
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 group"
                aria-label="User profile"
            >
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[var(--ctl-bg)] text-[12px] font-bold text-[var(--lab-text-muted)] shadow-[inset_0_0_0_1px_var(--ctl-border),0_1px_2px_rgba(0,0,0,0.05)] transition-[color,box-shadow,transform] duration-200 group-hover:text-[var(--lab-text)] group-hover:-translate-y-px group-hover:shadow-[inset_0_0_0_1px_var(--ctl-accent),0_1px_2px_rgba(0,0,0,0.05)]">
                    {initial}
                </span>
                {displayName && (
                    <span className="hidden sm:block text-[11px] text-[var(--lab-text-subtle)] font-mono">
                        Hi, {displayName}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        ref={popoverRef}
                        initial={{ opacity: 0, y: -4, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[var(--lab-border)] bg-[var(--lab-viz-bg)] shadow-xl z-50 p-3"
                    >
                        <label className="block text-[10px] font-mono uppercase tracking-widest text-[var(--lab-text-subtle)] mb-2">
                            Display name
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setOpen(false); }}
                                placeholder="Your name"
                                maxLength={30}
                                className="flex-1 bg-[var(--lab-card)] border border-[var(--lab-border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--lab-text-muted)] placeholder:text-[var(--lab-text-subtle)] focus:outline-none focus:border-emerald-500/40 font-mono"
                                autoFocus
                            />
                            <button
                                onClick={save}
                                className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-colors"
                                aria-label="Save name"
                            >
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

/* ─── LabShell ─── */

export function LabShell({ children }: { children: React.ReactNode }) {
    return (
        <ScrollProvider>
            <LabShellInner>{children}</LabShellInner>
        </ScrollProvider>
    );
}

function LabShellInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { t, language, setLanguage } = useI18n();
    const { status, showBanner, retry } = useBackendHealth();
    const { theme, toggle: toggleTheme } = useLabTheme();

    const pageId = pathname?.replace("/lab/", "").replace(/\//g, "-") || "lab";
    const { currentSection } = useProgressTracker(pageId);

    const scrollY = useScrollY();
    const showBackToTop = scrollY > 600;
    const scrollToTop = useCallback(() => window.scrollTo({ top: 0, behavior: "smooth" }), []);

    const [showShortcuts, setShowShortcuts] = useState(false);

    const navigateSection = useCallback((dir: "prev" | "next") => {
        const sections = Array.from(document.querySelectorAll<HTMLElement>("section[id]"));
        if (!sections.length) return;
        const idx = sections.findIndex((s) => s.id === currentSection);
        const target = dir === "next"
            ? sections[Math.min(idx + 1, sections.length - 1)]
            : sections[Math.max(idx - 1, 0)];
        target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, [currentSection]);

    useKeyboardShortcuts({
        onHelp: () => setShowShortcuts((v) => !v),
        onPrevSection: () => navigateSection("prev"),
        onNextSection: () => navigateSection("next"),
        onEscape: () => setShowShortcuts(false),
    });

    const isBigram = pathname?.startsWith("/lab/bigram") ?? false;
    const readingAccent = isBigram
        ? "bigram"
        : pathname?.startsWith("/lab/ngram")
            ? "amber"
            : pathname?.startsWith("/lab/mlp")
                ? "violet"
                : pathname?.startsWith("/lab/transformer")
                    ? "cyan"
                    : "rose";

    const models = [
        { id: "bigram", label: t("lab.bigram"), href: "/lab/bigram", ready: true },
        { id: "ngram", label: t("lab.ngram"), href: "/lab/ngram", ready: true },
        { id: "neural-networks", label: t("lab.neuralNetworks"), href: "/lab/neural-networks", ready: true },
        { id: "mlp", label: t("lab.mlp"), href: "/lab/mlp", ready: true },
        { id: "transformer", label: t("lab.transformer"), href: "/lab/transformer", ready: true },
    ];

    // Active chapter accent (theme-aware literal) — tints the brand mark + dot.
    const activeIdx = models.findIndex((m) => pathname?.startsWith(m.href));
    const activeHex = accentOf(activeIdx >= 0 ? models[activeIdx].id : null, theme);

    return (
        <div
            data-lab-theme={theme}
            data-bigram-theme={isBigram ? theme : undefined}
            className="min-h-screen bg-[var(--lab-bg)] text-[var(--lab-text)] font-sans"
            // On the bigram chapter the whole shell frame uses the editorial content bg
            // (not the near-black --lab-bg), so no dark/light frame shows around the content.
            style={isBigram ? { backgroundColor: "var(--bigram-bg)" } : undefined}
        >
            {/* Bigram (editorial-green) reading bar lives in the shared lab chrome, which is OUTSIDE
                the page's [data-bigram-theme] wrapper. Scope it here (only on the bigram path) so the
                fixed bar can resolve --bigram-accent; additive — never touches --lab-* or other chapters. */}
            {/* Top scroll-progress bar removed on the bigram chapter (replaced by the
                left side rail); kept for the other chapters. */}
            {!isBigram && <ReadingProgressBar accent={readingAccent} />}
            {/* Top Bar — editorial chrome. The `data-bigram-theme` scope is added only on
                the bigram path (additive; never touches --lab-*), kept for parity with the
                reading bar; the accent itself is driven by theme-aware literals (activeHex). */}
            <header
                data-bigram-theme={isBigram ? theme : undefined}
                className="sticky top-0 z-50 border-b border-[var(--lab-border)] bg-[var(--lab-header-bg)] backdrop-blur-md"
                // On the bigram chapter the chrome blends into the editorial content bg
                // (v8 topbar idiom: translucent page bg) instead of the generic --lab-* chrome,
                // so the header matches the content in BOTH themes (cream / teal-slate).
                style={isBigram ? { backgroundColor: "color-mix(in oklab, var(--bigram-bg) 92%, transparent)" } : undefined}
            >
                <TooltipProvider delayDuration={300}>
                    <div className="relative container mx-auto flex items-center justify-between h-[72px] px-4 md:px-8 max-w-screen-2xl">
                        {/* Left — brand (links back to the lab index) */}
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href="/lab"
                                    aria-label={t("lab.shell.allModels")}
                                    className="flex items-center gap-2"
                                >
                                    <FlaskConical className="h-4 w-4 shrink-0 transition-colors" style={{ color: activeHex }} />
                                    <span className="font-bold text-[15px] tracking-tight text-[var(--lab-text)]">
                                        LM<span style={{ color: activeHex }}>·</span>LAB
                                    </span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{t("lab.shell.allModels")}</TooltipContent>
                        </Tooltip>

                        {/* Center — single chapter switcher (the one focal point).
                            Absolutely centered on md+; normal flow on mobile to avoid overlap. */}
                        <div className="md:absolute md:left-1/2 md:-translate-x-1/2">
                            <ChapterSwitcher
                                models={models}
                                pathname={pathname}
                                theme={theme}
                                chapterWord={t("lab.shell.chapter")}
                                menuLabel={t("lab.shell.chapterMenu")}
                            />
                        </div>

                        {/* Right — control cluster. Elevated v8 .icon-btn style: faint
                            surface fill + hairline border, hover lifts to the chapter accent
                            (--ctl-accent). Theme toggle swaps sun/moon with a rotate+fade. */}
                        <div
                            className="flex items-center gap-2"
                            style={{
                                "--ctl-accent": activeHex,
                                // v8 light --surface (warm off-white, not stark #fff) + --rule-2 hairline.
                                "--ctl-bg": theme === "light" ? "#faf5e8" : "rgba(255,255,255,0.05)",
                                "--ctl-border": theme === "light" ? "#d2c6a8" : "rgba(255,255,255,0.08)",
                            } as React.CSSProperties}
                        >
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={() => setLanguage(language === "en" ? "es" : "en")}
                                        className="flex h-10 items-center gap-1.5 rounded-xl bg-[var(--ctl-bg)] px-2.5 text-[var(--lab-text-muted)] shadow-[inset_0_0_0_1px_var(--ctl-border),0_1px_2px_rgba(0,0,0,0.05)] transition-[color,box-shadow,transform] duration-200 hover:-translate-y-px hover:text-[var(--ctl-accent)] hover:shadow-[inset_0_0_0_1px_var(--ctl-accent),0_1px_2px_rgba(0,0,0,0.05)]"
                                        aria-label={t("common.toggleLanguage")}
                                    >
                                        <Globe className="h-4 w-4" />
                                        <span className="font-mono text-[11px] font-semibold uppercase tracking-wider">
                                            {language}
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">{t("common.toggleLanguage")}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={toggleTheme}
                                        className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-[var(--ctl-bg)] text-[var(--lab-text-muted)] shadow-[inset_0_0_0_1px_var(--ctl-border),0_1px_2px_rgba(0,0,0,0.05)] transition-[color,box-shadow,transform] duration-200 hover:-translate-y-px hover:text-[var(--ctl-accent)] hover:shadow-[inset_0_0_0_1px_var(--ctl-accent),0_1px_2px_rgba(0,0,0,0.05)]"
                                        aria-label={t("lab.shell.toggleTheme")}
                                    >
                                        {/* Sun (dark) + Moon (light) stacked; cross-fade + rotate on
                                            toggle via CSS transitions on inline style (deterministic,
                                            unaffected by the Radix Slot wrapper). */}
                                        <span
                                            className="grid place-items-center [grid-area:1/1] transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
                                            style={{
                                                opacity: theme === "dark" ? 1 : 0,
                                                transform: theme === "dark" ? "rotate(0deg) scale(1)" : "rotate(-90deg) scale(0.5)",
                                            }}
                                        >
                                            <Sun className="h-4 w-4" />
                                        </span>
                                        <span
                                            className="grid place-items-center [grid-area:1/1] transition-[opacity,transform] duration-[320ms] ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none"
                                            style={{
                                                opacity: theme === "dark" ? 0 : 1,
                                                transform: theme === "dark" ? "rotate(90deg) scale(0.5)" : "rotate(0deg) scale(1)",
                                            }}
                                        >
                                            <Moon className="h-4 w-4" />
                                        </span>
                                    </button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">{t("lab.shell.toggleTheme")}</TooltipContent>
                            </Tooltip>
                            <AvatarPopover />
                        </div>
                    </div>
                </TooltipProvider>
            </header>

            {/* Backend status banner */}
            <AnimatePresence>
                {showBanner && status === "connecting" && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-mono">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Waking up server… this usually takes ~20 seconds</span>
                        </div>
                    </motion.div>
                )}
                {status === "offline" && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="flex items-center justify-center gap-3 px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-red-300 text-xs font-mono">
                            <WifiOff className="w-3.5 h-3.5" />
                            <span>Server unreachable</span>
                            <button
                                onClick={retry}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-500/15 border border-red-500/25 hover:bg-red-500/25 transition-colors text-red-200"
                            >
                                <RefreshCw className="w-3 h-3" />
                                Retry
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Content */}
            <main className="container mx-auto max-w-screen-2xl px-4 md:px-8 py-6 md:py-8">
                {children}
            </main>

            {/* Back to top */}
            <AnimatePresence>
                {showBackToTop && (
                    <motion.button
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        onClick={scrollToTop}
                        className="fixed bottom-6 right-20 z-50 p-2.5 rounded-full bg-[var(--lab-card)] border border-[var(--lab-border)] text-[var(--lab-text-muted)] opacity-50 hover:opacity-100 hover:scale-110 transition-all duration-200 shadow-lg"
                        aria-label="Back to top"
                    >
                        <ChevronUp className="w-4 h-4" />
                    </motion.button>
                )}
            </AnimatePresence>

            <FeedbackButton pageId={pageId} sectionId={currentSection} />
            <KeyboardShortcutsPanel open={showShortcuts} onClose={() => setShowShortcuts(false)} />
        </div>
    );
}
