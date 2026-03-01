"use client";
import React, { memo, useEffect, useRef } from "react";

interface NebulaProps {
    className?: string;
    particleCount?: number;
    baseColor?: string;
}

interface Particle {
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
}

const MAX_PARTICLES = 30;

export const NebulaBackground: React.FC<NebulaProps> = memo(({
    className = "",
    particleCount = 60,
    baseColor = "rgba(140, 140, 255, 0.08)",
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let particles: Particle[] = [];
        let animationFrameId: number;
        const effectiveCount = Math.min(particleCount, MAX_PARTICLES);

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            canvas.style.width = `${window.innerWidth}px`;
            canvas.style.height = `${window.innerHeight}px`;
            ctx.scale(dpr, dpr);
            initParticles();
        };

        const createParticle = (): Particle => ({
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
            size: Math.random() * 1.5 + 0.3,
            speedX: (Math.random() - 0.5) * 0.2,
            speedY: (Math.random() - 0.5) * 0.2,
            opacity: Math.random() * 0.3 + 0.05,
        });

        const initParticles = () => {
            particles = Array.from({ length: effectiveCount }, createParticle);
        };

        const w = () => window.innerWidth;
        const h = () => window.innerHeight;

        const animate = () => {
            if (!ctx || !canvas) return;
            const width = w();
            const height = h();
            ctx.clearRect(0, 0, width, height);

            for (const p of particles) {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x < 0) p.x = width;
                if (p.x > width) p.x = 0;
                if (p.y < 0) p.y = height;
                if (p.y > height) p.y = 0;

                ctx.globalAlpha = p.opacity;
                ctx.fillStyle = baseColor;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1;
            animationFrameId = requestAnimationFrame(animate);
        };

        let running = true;

        const onVisibility = () => {
            if (document.hidden) {
                running = false;
                cancelAnimationFrame(animationFrameId);
            } else {
                if (!running) {
                    running = true;
                    animationFrameId = requestAnimationFrame(animate);
                }
            }
        };

        window.addEventListener("resize", resizeCanvas);
        document.addEventListener("visibilitychange", onVisibility);
        resizeCanvas();
        animate();

        return () => {
            running = false;
            window.removeEventListener("resize", resizeCanvas);
            document.removeEventListener("visibilitychange", onVisibility);
            cancelAnimationFrame(animationFrameId);
        };
    }, [baseColor, particleCount]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 w-full h-full pointer-events-none z-0 ${className}`}
        />
    );
});
