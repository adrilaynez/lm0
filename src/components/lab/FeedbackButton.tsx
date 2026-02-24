"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Loader2, CheckCircle2, Paperclip, Trash2 } from "lucide-react";
import { useFeedback } from "@/hooks/useFeedback";
import { useUser } from "@/context/UserContext";

interface FeedbackButtonProps {
    pageId: string;
    sectionId: string;
}

/** Convert a File to base64 string (without the data:... prefix) */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result;
            if (typeof result === "string" && result.includes(",")) {
                resolve(result.split(",")[1]);
            } else {
                reject(new Error("Failed to read file"));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

export default function FeedbackButton({ pageId, sectionId }: FeedbackButtonProps) {
    const [open, setOpen] = useState(false);
    const [comment, setComment] = useState("");
    const [title, setTitle] = useState("");
    const [name, setName] = useState("");
    const [feedbackType, setFeedbackType] = useState<"bug" | "idea" | "question">("idea");
    const [userImage, setUserImage] = useState<string | null>(null);
    const [userImagePreview, setUserImagePreview] = useState<string | null>(null);
    const { displayName } = useUser();
    const { submit, isSubmitting, error, success, isRateLimited } = useFeedback({ pageId, sectionId });
    const modalRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pre-fill name from context
    useEffect(() => {
        if (displayName) setName(displayName);
    }, [displayName]);

    // Focus textarea on open
    useEffect(() => {
        if (open && textareaRef.current) {
            setTimeout(() => textareaRef.current?.focus(), 200);
        }
    }, [open]);

    // Close on Esc
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open]);

    // Click outside
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        const id = setTimeout(() => document.addEventListener("mousedown", onClick), 100);
        return () => {
            clearTimeout(id);
            document.removeEventListener("mousedown", onClick);
        };
    }, [open]);

    // Auto-dismiss after success
    useEffect(() => {
        if (success) {
            const id = setTimeout(() => {
                setOpen(false);
                setComment("");
                setTitle("");
                setUserImage(null);
                setUserImagePreview(null);
                setFeedbackType("idea");
            }, 2000);
            return () => clearTimeout(id);
        }
    }, [success]);

    // Handle paste events for images
    useEffect(() => {
        if (!open) return;
        const onPaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (const item of Array.from(items)) {
                if (item.type.startsWith("image/")) {
                    e.preventDefault();
                    const file = item.getAsFile();
                    if (!file) continue;
                    fileToBase64(file).then((b64) => {
                        setUserImage(b64);
                        setUserImagePreview(`data:${file.type};base64,${b64}`);
                    }).catch(() => { });
                    break;
                }
            }
        };
        window.addEventListener("paste", onPaste);
        return () => window.removeEventListener("paste", onPaste);
    }, [open]);

    // Open handler
    const handleOpen = useCallback(() => {
        setOpen(true);
    }, []);

    // File upload handler
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const b64 = await fileToBase64(file);
            setUserImage(b64);
            setUserImagePreview(`data:${file.type};base64,${b64}`);
        } catch {
            // Ignore file read errors
        }
        // Reset input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const handleClearImage = useCallback(() => {
        setUserImage(null);
        setUserImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!comment.trim()) return;

        await submit({
            comment: comment.trim(),
            title: title.trim() || undefined,
            name: name.trim() || undefined,
            screenshotB64: undefined,
            userScreenshotB64: userImage || undefined,
            feedbackType,
        });
    }, [comment, title, name, userImage, feedbackType, submit]);

    return (
        <>
            {/* Floating button */}
            <motion.button
                data-feedback
                onClick={handleOpen}
                className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-[var(--lab-card)] border border-[var(--lab-border)] text-[var(--lab-text-muted)] opacity-40 hover:opacity-100 hover:scale-110 transition-all duration-200 shadow-lg"
                whileTap={{ scale: 0.9 }}
                aria-label="Send feedback"
            >
                <MessageSquare className="w-5 h-5" />
            </motion.button>

            {/* Modal overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        data-feedback
                        className="fixed inset-0 z-[60] flex items-end justify-end p-4 sm:p-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        {/* Backdrop */}
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

                        {/* Panel */}
                        <motion.div
                            ref={modalRef}
                            className="relative w-full max-w-sm rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-bg)] shadow-2xl overflow-hidden"
                            initial={{ y: 80, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 80, opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--lab-border)]">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4 text-[var(--lab-text-muted)]" />
                                    <span className="text-sm font-semibold text-[var(--lab-text)]">Feedback</span>
                                </div>
                                <button
                                    onClick={() => setOpen(false)}
                                    className="p-1 rounded-lg hover:bg-[var(--lab-card)] text-[var(--lab-text-muted)] transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="px-5 py-4 space-y-3">
                                {success ? (
                                    <div className="flex flex-col items-center gap-3 py-6">
                                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                                        <p className="text-sm text-[var(--lab-text-muted)]">Thanks for your feedback!</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Name */}
                                        <div>
                                            <label className="text-xs font-medium text-[var(--lab-text-muted)] mb-1 block">
                                                Name (optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={name}
                                                onChange={(e) => setName(e.target.value)}
                                                className="w-full px-3 py-2 rounded-lg bg-[var(--lab-card)] border border-[var(--lab-border)] text-sm text-[var(--lab-text)] placeholder:text-[var(--lab-text-subtle)] outline-none focus:border-emerald-500/40 transition-colors"
                                                placeholder="Anonymous"
                                            />
                                        </div>

                                        {/* Type */}
                                        <div>
                                            <label className="text-xs font-medium text-[var(--lab-text-muted)] mb-1 block">
                                                Type
                                            </label>
                                            <div className="flex gap-2">
                                                {(['bug', 'idea', 'question'] as const).map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setFeedbackType(type)}
                                                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${feedbackType === type
                                                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                            : 'bg-[var(--lab-card)] border-[var(--lab-border)] text-[var(--lab-text-muted)] hover:border-[var(--lab-text-subtle)]'
                                                            } border`}
                                                    >
                                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <div>
                                            <label className="text-xs font-medium text-[var(--lab-text-muted)] mb-1 block">
                                                Title (optional)
                                            </label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                maxLength={200}
                                                className="w-full px-3 py-2 rounded-lg bg-[var(--lab-card)] border border-[var(--lab-border)] text-sm text-[var(--lab-text)] placeholder:text-[var(--lab-text-subtle)] outline-none focus:border-emerald-500/40 transition-colors"
                                                placeholder="Brief summary"
                                            />
                                        </div>

                                        {/* Comment */}
                                        <div>
                                            <label className="text-xs font-medium text-[var(--lab-text-muted)] mb-1 block">
                                                Comment
                                            </label>
                                            <textarea
                                                ref={textareaRef}
                                                value={comment}
                                                onChange={(e) => setComment(e.target.value)}
                                                rows={3}
                                                maxLength={2000}
                                                className="w-full px-3 py-2 rounded-lg bg-[var(--lab-card)] border border-[var(--lab-border)] text-sm text-[var(--lab-text)] placeholder:text-[var(--lab-text-subtle)] outline-none focus:border-emerald-500/40 transition-colors resize-none"
                                                placeholder="What could be improved?"
                                            />
                                        </div>

                                        {/* User screenshot attach */}
                                        <div className="space-y-2">
                                            {userImagePreview ? (
                                                <div className="space-y-2">
                                                    <div className="relative rounded-lg overflow-hidden border border-emerald-500/20 bg-black/20">
                                                        <img
                                                            src={userImagePreview}
                                                            alt="Attached screenshot"
                                                            className="w-full h-auto max-h-48 object-contain"
                                                        />
                                                        <button
                                                            onClick={handleClearImage}
                                                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/90 hover:bg-red-500 text-white transition-colors"
                                                            aria-label="Remove image"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                                        <Paperclip className="w-3 h-3 text-emerald-400" />
                                                        <span className="text-xs text-emerald-400">Screenshot attached</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => fileInputRef.current?.click()}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--lab-card)] border border-[var(--lab-border)] text-xs text-[var(--lab-text-muted)] hover:border-emerald-500/30 hover:text-emerald-400 transition-colors"
                                                    >
                                                        <Paperclip className="w-3 h-3" />
                                                        Attach image
                                                    </button>
                                                    <span className="text-[10px] text-[var(--lab-text-subtle)] italic">
                                                        or paste (Ctrl+V)
                                                    </span>
                                                </div>
                                            )}
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="hidden"
                                            />
                                        </div>

                                        {/* Error */}
                                        {error && (
                                            <p className="text-xs text-red-400">{String(error)}</p>
                                        )}

                                        {/* Rate limit warning */}
                                        {isRateLimited && (
                                            <p className="text-xs text-amber-400">Please wait 30 seconds before submitting again.</p>
                                        )}

                                        {/* Submit */}
                                        <button
                                            onClick={handleSubmit}
                                            disabled={isSubmitting || !comment.trim() || isRateLimited}
                                            className="w-full py-2.5 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-sm font-medium text-emerald-400 hover:bg-emerald-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Sending…
                                                </>
                                            ) : (
                                                "Send feedback"
                                            )}
                                        </button>
                                    </>
                                )}
                            </div>

                            {/* Section indicator */}
                            <div className="px-5 py-2 border-t border-[var(--lab-border)]">
                                <p className="text-[10px] text-[var(--lab-text-subtle)] font-mono truncate">
                                    {pageId} / {sectionId || "general"}
                                </p>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
