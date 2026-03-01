"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { motion } from "framer-motion";
import { Activity, ArrowLeft, Database, Lock, Network, Server, ShieldCheck, Terminal, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Mock Data Stream for Terminal
const LOG_ENTRIES = [
    "[SYSTEM] Initializing NEBULA core...",
    "[NET] Node discovery started. Found 847 active nodes.",
    "[WARN] High latency detected in Sector 7. Re-routing...",
    "[OK] Handshake complete. Secure channel established.",
    "[DB] Indexing shard #4922... Done (0.04ms).",
    "[AI] Model inference latency: 12ms. Optimization active.",
    "[SYSTEM] All systems nominal. Waiting for input...",
];

export default function NebulaPage() {
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i < LOG_ENTRIES.length) {
                setLogs(prev => [...prev, LOG_ENTRIES[i]]);
                i++;
            } else {
                // Loop randomly for "live" feel
                const randomLog = LOG_ENTRIES[Math.floor(Math.random() * LOG_ENTRIES.length)];
                setLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${randomLog.split("] ")[1]}`]);
            }
        }, 800);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-black text-green-500 font-mono selection:bg-green-500/30">

            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 border-b border-green-900/50 bg-black/80 backdrop-blur-sm p-4">
                <div className="container mx-auto flex justify-between items-center">
                    <Link href="/projects" className="flex items-center gap-2 text-sm hover:text-green-400 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> BACK TO LAB
                    </Link>
                    <div className="text-xs tracking-widest text-green-700 animate-pulse">
                        SECURE CONNECTION // ENCRYPTED
                    </div>
                </div>
            </nav>

            <main className="container mx-auto pt-24 pb-12 px-4">

                {/* Header */}
                <header className="mb-16 border-l-4 border-green-600 pl-6 py-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-green-400 border-green-800 bg-green-950/30">CONFIDENTIAL</Badge>
                            <Badge variant="outline" className="text-green-400 border-green-800 bg-green-950/30">v4.0.2-alpha</Badge>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white mb-4">
                            PROJECT <span className="text-green-500">NEBULA</span>
                        </h1>
                        <p className="text-xl text-green-400/80 max-w-2xl">
                            A decentralized, self-healing knowledge graph designed for autonomous AI agents.
                            Orchestrates millions of nodes with sub-millisecond latency.
                        </p>
                    </motion.div>
                </header>

                {/* Status Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: "Active Nodes", value: "8,492", icon: Network },
                        { label: "Query Latency", value: "12ms", icon: Zap },
                        { label: "Uptime", value: "99.999%", icon: Activity },
                        { label: "Security Level", value: "MAXIMUM", icon: ShieldCheck },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Card className="bg-black border border-green-900/50 p-4 hover:bg-green-950/10 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-green-700 uppercase">{stat.label}</span>
                                    <stat.icon className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-green-400">{stat.value}</div>
                            </Card>
                        </motion.div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Architecture Diagram Placeholder - In a real app this would be a canvas/interactive SVG */}
                        <Card className="bg-black border border-green-900/50 overflow-hidden relative min-h-[400px] flex items-center justify-center group">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-green-900/20 via-black to-black"></div>

                            {/* Simplified Nodes Visualization */}
                            <div className="relative z-10 grid grid-cols-3 gap-8 opacity-80 group-hover:scale-105 transition-transform duration-700">
                                <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center bg-black shadow-[0_0_15px_rgba(34,197,94,0.5)] animate-pulse">
                                    <Database className="w-6 h-6" />
                                </div>
                                <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center bg-black shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                                    <Server className="w-6 h-6" />
                                </div>
                                <div className="w-16 h-16 rounded-full border-2 border-green-500 flex items-center justify-center bg-black shadow-[0_0_15px_rgba(34,197,94,0.4)]">
                                    <Lock className="w-6 h-6" />
                                </div>
                                {/* Connecting Lines (CSS only for simplicity) */}
                                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-green-900 -z-10"></div>
                                <div className="absolute left-1/2 top-0 h-full w-0.5 bg-green-900 -z-10"></div>
                            </div>

                            <div className="absolute bottom-4 right-4 text-xs text-green-800 font-mono">
                                LIVE SYSTEM ARCHITECTURE VIEW
                            </div>
                        </Card>

                        {/* Technical Description */}
                        <div className="prose prose-invert prose-green max-w-none">
                            <h3 className="text-2xl font-bold text-white mb-4">The Challenge</h3>
                            <p className="text-green-300/80">
                                Modern AI agents require persistent memory that scales beyond context windows.
                                Traditional vector databases suffer from retrieval latency at scale.
                                Nebula solves this by implementing a <span className="text-white font-bold">distributed hash table (DHT)</span> combined with a
                                custom graph neural network for predictive pre-fetching.
                            </p>

                            <h3 className="text-2xl font-bold text-white mb-4 mt-8">Core Technologies</h3>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full"></div> Rust (Custom Runtime)</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full"></div> gRPC / Protobuf</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full"></div> Raft Consensus</li>
                                <li className="flex items-center gap-2"><div className="w-1 h-1 bg-green-500 rounded-full"></div> WebAssembly Modules</li>
                            </ul>
                        </div>
                    </div>

                    {/* Sidebar / Console */}
                    <div className="space-y-6">
                        <Card className="bg-black border border-green-900/50 p-4 h-[400px] flex flex-col font-mono text-xs">
                            <div className="flex items-center gap-2 mb-4 border-b border-green-900/50 pb-2">
                                <Terminal className="w-4 h-4" /> SYSTEM_LOGS
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <div className="absolute inset-0 overflow-y-auto space-y-1 scrollbar-hide">
                                    {logs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="text-green-400/70"
                                        >
                                            <span className="text-green-600 mr-2">{">"}</span>
                                            {log}
                                        </motion.div>
                                    ))}
                                </div>
                                {/* Scanline effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-900/5 pointer-events-none"></div>
                            </div>
                        </Card>

                        <div className="p-4 border border-green-900/30 rounded bg-green-950/5">
                            <h4 className="text-sm font-bold text-white mb-2">Access Level: RESTRICTED</h4>
                            <p className="text-xs text-green-400/60 mb-4">
                                Public access to the Nebula dashboard is currently limited to read-only mode for verified researchers.
                            </p>
                            <Button className="w-full bg-green-900/20 text-green-400 border border-green-800 hover:bg-green-900/40">
                                Request Access
                            </Button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
}
