import type { ReactNode } from "react";

interface ChillTerminalProps {
    label: string;
    bodyVariant?: "map" | "canvas";
    children: ReactNode;
    footLeft?: string;
    footRight?: string;
}

/**
 * Glass terminal frame: head with a label, content area, footer with a dotted
 * connector. Used by all three era visualizers for visual parity.
 */
export function ChillTerminal({
    label,
    bodyVariant = "map",
    children,
    footLeft,
    footRight,
}: ChillTerminalProps) {
    return (
        <div className="terminal terminal--hero">
            <div className="terminal-head">
                <span>{label}</span>
            </div>
            <div className={`terminal-body terminal-body--${bodyVariant}`}>{children}</div>
            {(footLeft || footRight) && (
                <div className="terminal-foot">
                    <span>{footLeft}</span>
                    <span className="dots-line" aria-hidden="true">
                        ····························································
                    </span>
                    <span>{footRight}</span>
                </div>
            )}
        </div>
    );
}
