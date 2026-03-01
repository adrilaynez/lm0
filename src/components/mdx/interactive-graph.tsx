"use client";

import { useEffect,useState } from "react";

import { motion } from "framer-motion";

export const InteractiveGraph = () => {
    const [points, setPoints] = useState<{ x: number; y: number; z: number; id: number }[]>([]);

    useEffect(() => {
        // Generate random 3D-like points on a manifold
        const newPoints = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            z: Math.random() * 50,
        }));
        setPoints(newPoints);
    }, []);

    return (
        <div className="relative h-[400px] w-full overflow-hidden rounded-xl border border-border/50 bg-black/50 p-4">
            <div className="absolute inset-0 z-0 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10" />

            <div className="relative z-10 flex h-full items-center justify-center perspective-[1000px]">
                <div className="relative h-[200px] w-[200px] preserve-3d animate-[spin_20s_linear_infinite]">
                    {points.map((p) => (
                        <motion.div
                            key={p.id}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: p.id * 0.02 }}
                            className="absolute h-2 w-2 rounded-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                transform: `translateZ(${p.z}px)`,
                            }}
                        />
                    ))}
                    {/* Connection lines would go here in a fuller implementation */}
                    <div className="absolute inset-0 rounded-full border border-white/10" />
                    <div className="absolute inset-0 rotate-45 rounded-full border border-white/5" />
                </div>
            </div>

            <div className="absolute bottom-4 left-4 text-xs font-mono text-muted-foreground">
                FIG 1.2: LATENT MANIFOLD PROJECTION
            </div>
        </div>
    );
};
