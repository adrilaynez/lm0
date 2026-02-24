"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    FlaskConical,
    Loader2,
    WifiOff,
    RefreshCw,
    User,
    Check,
    Sun,
    Moon,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { useI18n } from "@/i18n/context";
import { LabModeProvider } from "@/context/LabModeContext";
import { useBackendHealth } from "@/hooks/useBackendHealth";
import { useUser } from "@/context/UserContext";
import { ReadingProgressBar } from "@/components/lab/ReadingProgressBar";
import { useLabTheme } from "@/hooks/useLabTheme";
import { useProgressTracker } from "@/hooks/useProgressTracker";
import FeedbackButton from "@/components/lab/FeedbackButton";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { KeyboardShortcutsPanel } from "@/components/lab/KeyboardShortcutsPanel";

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
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--lab-card)] border border-[var(--lab-border)] text-[11px] font-bold text-[var(--lab-text-muted)] group-hover:text-[var(--lab-text)] transition-colors">
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
    const pathname = usePathname();
    const { t } = useI18n();
    const { status, showBanner, retry } = useBackendHealth();
    const { theme, toggle: toggleTheme } = useLabTheme();

    const pageId = pathname?.replace("/lab/", "").replace(/\//g, "-") || "lab";
    const { currentSection } = useProgressTracker(pageId);

    const [showBackToTop, setShowBackToTop] = useState(false);
    useEffect(() => {
        const onScroll = () => setShowBackToTop(window.scrollY > 600);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);
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

    const readingAccent = pathname?.startsWith("/lab/bigram")
        ? "emerald"
        : pathname?.startsWith("/lab/ngram")
            ? "amber"
            : pathname?.startsWith("/lab/mlp")
                ? "violet"
                : "rose";

    const models = [
        { id: "bigram", label: t("lab.bigram"), href: "/lab/bigram", ready: true },
        { id: "ngram", label: t("lab.ngram"), href: "/lab/ngram", ready: true },
        { id: "neural-networks", label: t("lab.neuralNetworks"), href: "/lab/neural-networks", ready: true },
        { id: "mlp", label: t("lab.mlp"), href: "/lab/mlp", ready: true },
        { id: "transformer", label: t("lab.transformer"), href: "/lab/transformer", ready: false },
    ];

    return (
        <div data-lab-theme={theme} className="min-h-screen bg-[var(--lab-bg)] text-[var(--lab-text)] font-sans">
            <ReadingProgressBar accent={readingAccent} />
            {/* Top Bar */}
            <header className="sticky top-0 z-50 border-b border-[var(--lab-border)] bg-[var(--lab-header-bg)] backdrop-blur-sm">
                <div className="container mx-auto flex items-center justify-between h-14 px-4 md:px-8 max-w-screen-2xl">
                    {/* Left */}
                    <div className="flex items-center gap-4">
                        <Link
                            href="/lab"
                            className="flex items-center gap-2 text-xs text-[var(--lab-text-muted)] hover:text-[var(--lab-text)] transition-colors font-mono"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">{t("lab.shell.allModels")}</span>
                        </Link>

                        <div className="h-4 w-px bg-[var(--lab-border)]" />

                        <div className="flex items-center gap-2">
                            <FlaskConical className="h-4 w-4 text-emerald-400" />
                            <span className="font-bold text-sm tracking-tight text-[var(--lab-text)]">LM-Lab</span>
                            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[9px] font-mono uppercase tracking-widest">
                                v1.0
                            </Badge>
                        </div>
                    </div>

                    {/* Center — Model Tabs */}
                    <nav className="flex items-center gap-1">
                        {models.map((model) => {
                            const isActive = pathname?.startsWith(model.href);
                            return (
                                <Link
                                    key={model.id}
                                    href={model.href}
                                    className={cn(
                                        "relative px-4 py-2 text-xs font-mono uppercase tracking-widest transition-colors rounded-md",
                                        isActive
                                            ? "text-[var(--lab-text)]"
                                            : model.ready
                                                ? "text-[var(--lab-text-muted)] hover:text-[var(--lab-text)]"
                                                : "text-[var(--lab-text-subtle)] pointer-events-none"
                                    )}
                                >
                                    {model.label}
                                    {!model.ready && (
                                        <Badge className="ml-1.5 bg-[var(--lab-card)] text-[var(--lab-text-subtle)] border-[var(--lab-border)] text-[8px] font-mono py-0 px-1">
                                            Soon
                                        </Badge>
                                    )}
                                    {isActive && (
                                        <motion.div
                                            layoutId="labTab"
                                            className="absolute inset-0 bg-[var(--lab-surface)] rounded-md -z-10"
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="flex items-center gap-3">
                        <LanguageToggle />
                        <button
                            onClick={toggleTheme}
                            className="p-1.5 rounded-md hover:bg-[var(--lab-surface)] transition-colors text-[var(--lab-text-subtle)] hover:text-[var(--lab-text-muted)]"
                            aria-label="Toggle lab theme"
                        >
                            {theme === "dark" ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                        </button>
                        <div className="h-4 w-px bg-[var(--lab-border)]" />
                        <AvatarPopover />
                    </div>
                </div>
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
