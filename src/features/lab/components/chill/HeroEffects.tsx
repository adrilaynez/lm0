/**
 * Pure decorative overlays for the hero illustration:
 * stars (top third), 8 neon flicker rects positioned over signs in the artwork,
 * amber signature glow (bottom-right), red doorway glow, low fog drift, dust drift.
 * All elements are aria-hidden — they convey no information.
 */
export function ChillHeroEffects() {
    return (
        <>
            <div className="stars" aria-hidden="true" />
            <div className="neon neon-1" aria-hidden="true" />
            <div className="neon neon-2" aria-hidden="true" />
            <div className="neon neon-3" aria-hidden="true" />
            <div className="neon neon-4" aria-hidden="true" />
            <div className="neon neon-5" aria-hidden="true" />
            <div className="neon neon-6" aria-hidden="true" />
            <div className="neon neon-7" aria-hidden="true" />
            <div className="neon neon-8" aria-hidden="true" />
            <div className="neon-sig" aria-hidden="true" />
            <div className="door-glow" aria-hidden="true" />
            <div className="fog" aria-hidden="true" />
            <div className="dust" aria-hidden="true" />
        </>
    );
}
