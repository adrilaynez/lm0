import { ImageResponse } from "next/og";

// Default social/search preview image for every route (1200×630).
// Brand: cool cream paper + ink serif voice + a single phosphor-green accent.
export const alt = "LM0 — the birth of a language model";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#efece4",
        padding: "84px",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 26,
          letterSpacing: 8,
          color: "#8a8676",
          fontFamily: "monospace",
        }}
      >
        LM0 · THE BIRTH
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 96, color: "#2b2a26", fontWeight: 700 }}>
          The machine
        </div>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700 }}>
          <span style={{ color: "#2b2a26", fontStyle: "italic" }}>can&apos;t&nbsp;</span>
          <span style={{ color: "#2b2a26" }}>speak.</span>
        </div>
        <div style={{ display: "flex", fontSize: 34, color: "#6f6c61", marginTop: 28 }}>
          Give it a book and watch it learn — one idea at a time.
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", fontSize: 30, color: "#2b2a26", fontFamily: "monospace" }}>
          lm0.dev
        </div>
        <div
          style={{
            display: "flex",
            width: 130,
            height: 14,
            backgroundColor: "#2e7d46",
            borderRadius: 3,
          }}
        />
      </div>
    </div>,
    { ...size },
  );
}
