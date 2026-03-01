"use client";

import { motion } from "framer-motion";
import { Cpu, Lock } from "lucide-react";

import { LabShell } from "@/components/lab/LabShell";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function TransformerPage() {
    return (
        <LabShell>
            <div className="flex items-center justify-center min-h-[60vh]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <Card className="bg-black/40 border-white/[0.06] backdrop-blur-sm p-12 text-center max-w-md mx-auto">
                        <div className="flex items-center justify-center mb-6">
                            <div className="relative">
                                <Cpu className="h-12 w-12 text-amber-400/50" />
                                <Lock className="h-5 w-5 text-white/30 absolute -bottom-1 -right-1" />
                            </div>
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">
                            Transformer Explorer
                        </h2>
                        <p className="text-sm text-white/40 mb-4 leading-relaxed">
                            Attention-based transformer model explorer. Currently under
                            development — check back soon.
                        </p>
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px] font-mono uppercase tracking-widest">
                            Coming Soon
                        </Badge>
                    </Card>
                </motion.div>
            </div>
        </LabShell>
    );
}
