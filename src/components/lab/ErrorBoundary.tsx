"use client";

import React from "react";

import { AlertTriangle, RotateCcw } from "lucide-react";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallbackMessage?: string;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="my-8 rounded-xl border border-red-500/20 bg-red-500/[0.04] p-6 overflow-hidden">
                    <div className="flex gap-4 items-start">
                        <div className="shrink-0 mt-0.5">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold text-red-400 mb-2">
                                {this.props.fallbackMessage || "Something went wrong in this visualization"}
                            </h3>
                            <p className="text-xs text-[var(--lab-text-muted)] mb-4">
                                Try refreshing the page or clicking the retry button below. If the problem persists, this may be a temporary issue.
                            </p>
                            {process.env.NODE_ENV === "development" && this.state.error && (
                                <details className="mb-4">
                                    <summary className="text-xs text-red-400/60 cursor-pointer hover:text-red-400/80 mb-2">
                                        Error details (dev only)
                                    </summary>
                                    <pre className="text-[10px] text-red-400/40 font-mono overflow-x-auto p-3 bg-black/20 rounded border border-red-500/10">
                                        {this.state.error.message}
                                        {"\n\n"}
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}
                            <button
                                onClick={this.handleReset}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all text-xs font-medium"
                            >
                                <RotateCcw className="w-3.5 h-3.5" />
                                Retry
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
