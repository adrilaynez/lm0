"use client";

import type { Note } from "@/lib/mdx";

import { buildGraph } from "./mind-graph";

interface ThreadMiniGraphProps {
  notes: Note[];
  currentSlug: string;
}

interface PositionedMini {
  slug: string;
  x: number;
  y: number;
  depth: 0 | 1 | 2;
}

export function ThreadMiniGraph({ notes, currentSlug }: ThreadMiniGraphProps) {
  const { nodes, edges } = buildGraph(notes, currentSlug);

  const W = 140;
  const H = 70;
  const cx = W / 2;
  const cy = H / 2;

  const current = nodes.find((n) => n.depth === 0);
  if (!current) return null;

  const firstDegree = nodes.filter((n) => n.depth === 1);
  const secondDegree = nodes.filter((n) => n.depth === 2).slice(0, 8);

  const r1 = 18;
  const r2 = 30;

  const positioned: PositionedMini[] = [{ slug: current.slug, x: cx, y: cy, depth: 0 }];

  firstDegree.forEach((n, i) => {
    const angle = (-Math.PI / 2) + (i * (2 * Math.PI)) / Math.max(firstDegree.length, 1);
    positioned.push({ slug: n.slug, x: cx + r1 * Math.cos(angle), y: cy + r1 * Math.sin(angle), depth: 1 });
  });

  secondDegree.forEach((n, i) => {
    const angle = (-Math.PI / 2 + Math.PI / 6) + (i * (2 * Math.PI)) / Math.max(secondDegree.length, 1);
    positioned.push({ slug: n.slug, x: cx + r2 * Math.cos(angle), y: cy + r2 * Math.sin(angle), depth: 2 });
  });

  const posBySlug = new Map(positioned.map((p) => [p.slug, p]));

  const drawnEdges: { a: PositionedMini; b: PositionedMini; key: string; warm: boolean }[] = [];
  const seen = new Set<string>();
  for (const [from, neighbors] of edges) {
    const a = posBySlug.get(from);
    if (!a) continue;
    for (const to of neighbors) {
      const key = [from, to].sort().join("--");
      if (seen.has(key)) continue;
      const b = posBySlug.get(to);
      if (!b) continue;
      seen.add(key);
      const warm = a.depth === 0 || b.depth === 0;
      drawnEdges.push({ a, b, key, warm });
    }
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height={H}
      aria-hidden
      className="overflow-visible"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Faint orbital ring */}
      <circle
        cx={cx} cy={cy} r={r1}
        fill="none"
        stroke="var(--ls-accent)"
        strokeOpacity={0.07}
        strokeWidth={0.4}
        strokeDasharray="1.2 2"
      />

      {/* Real edges */}
      {drawnEdges.map(({ a, b, key, warm }) => (
        <line
          key={key}
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke={warm ? "var(--ls-accent)" : "currentColor"}
          strokeOpacity={warm ? 0.32 : 0.14}
          strokeWidth={warm ? 0.7 : 0.4}
          className={warm ? "" : "text-[var(--ls-fg-subtle)]"}
        />
      ))}

      {/* Depth-2 nodes */}
      {positioned.filter((p) => p.depth === 2).map((p) => (
        <circle
          key={p.slug}
          cx={p.x} cy={p.y} r={1.1}
          fill="var(--ls-fg-subtle)"
          opacity={0.5}
        />
      ))}

      {/* Depth-1 nodes */}
      {positioned.filter((p) => p.depth === 1).map((p) => (
        <circle
          key={p.slug}
          cx={p.x} cy={p.y} r={1.9}
          fill="color-mix(in oklch, var(--ls-accent) 55%, var(--ls-fg-subtle))"
          opacity={0.8}
        />
      ))}

      {/* Center: glow + orange disk + white hot core */}
      <circle cx={cx} cy={cy} r={6} fill="var(--ls-accent)" opacity={0.14} />
      <circle cx={cx} cy={cy} r={3.4} fill="var(--ls-accent)" />
      <circle cx={cx} cy={cy} r={1.1} fill="white" opacity={0.85} />
    </svg>
  );
}
