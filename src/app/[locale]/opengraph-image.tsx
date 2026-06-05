import { ImageResponse } from "next/og";

// Site-level social card, used when a page doesn't define its own. Kept font-safe
// (next/og's built-in font) so it never breaks the build.
export const alt = "Adrián Laynez — Research & Engineering";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    background: "#0a0a0a",
                    color: "#fafafa",
                    padding: "80px",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        fontSize: 26,
                        letterSpacing: 8,
                        textTransform: "uppercase",
                        color: "#34d399",
                    }}
                >
                    LM-Lab · adrianlaynez.dev
                </div>
                <div
                    style={{
                        display: "flex",
                        marginTop: 28,
                        fontSize: 84,
                        fontWeight: 700,
                        lineHeight: 1.05,
                    }}
                >
                    Adrián Laynez
                </div>
                <div
                    style={{
                        display: "flex",
                        marginTop: 24,
                        fontSize: 36,
                        color: "#a1a1aa",
                        maxWidth: 900,
                    }}
                >
                    Interactive essays on how language models work — from counting pairs to attention.
                </div>
                <div
                    style={{
                        display: "flex",
                        marginTop: 48,
                        width: 160,
                        height: 6,
                        background: "#34d399",
                    }}
                />
            </div>
        ),
        { ...size },
    );
}
