"use client";

import { useState } from "react";

import { Info } from "lucide-react";

import { Link } from "@/i18n/navigation";
import type { Note } from "@/lib/mdx";
import { cn } from "@/lib/utils";

const WIKILINK_RE = /\[\[([a-z0-9-]+)\]\]/gi;
export function extractWikilinks(content: string): string[] {
  const found = new Set<string>();
  for (const match of content.matchAll(WIKILINK_RE)) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}

interface MindGraphProps {
  notes: Note[];
  currentSlug: string;
  className?: string;
  /** "landing" = taller SVG, depth-1 labels always visible. "detail" = default. */
  variant?: "landing" | "detail";
}

interface GraphNode {
  slug: string;
  title: string;
  depth: 0 | 1 | 2;
}

export function buildGraph(notes: Note[], currentSlug: string) {
  const bySlug = new Map(notes.map((n) => [n.slug.toLowerCase(), n]));
  const edges = new Map<string, Set<string>>();

  for (const note of notes) {
    const links = extractWikilinks(note.content);
    for (const target of links) {
      if (!bySlug.has(target)) continue;
      const a = note.slug.toLowerCase();
      if (!edges.has(a)) edges.set(a, new Set());
      if (!edges.has(target)) edges.set(target, new Set());
      edges.get(a)!.add(target);
      edges.get(target)!.add(a);
    }
  }

  const current = currentSlug.toLowerCase();
  const firstDegree = [...(edges.get(current) ?? [])];
  const secondDegree = new Set<string>();
  for (const neighbor of firstDegree) {
    for (const further of edges.get(neighbor) ?? []) {
      if (further !== current && !firstDegree.includes(further)) {
        secondDegree.add(further);
      }
    }
  }

  const nodes: GraphNode[] = [
    { slug: current, title: bySlug.get(current)?.title ?? current, depth: 0 },
    ...firstDegree.map<GraphNode>((s) => ({
      slug: s,
      title: bySlug.get(s)?.title ?? s,
      depth: 1,
    })),
    ...[...secondDegree].map<GraphNode>((s) => ({
      slug: s,
      title: bySlug.get(s)?.title ?? s,
      depth: 2,
    })),
  ];

  return { nodes, edges };
}

interface PositionedNode extends GraphNode {
  x: number;
  y: number;
  r: number;
}

export function MindGraph({ notes, currentSlug, className, variant = "detail" }: MindGraphProps) {
  const { nodes, edges } = buildGraph(notes, currentSlug);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  if (nodes.length <= 1) return null;

  const isLanding = variant === "landing";
  const W = isLanding ? 480 : 320;
  const H = isLanding ? 460 : 290;
  const cx = W / 2;
  const cy = H / 2;

  const firstDegree = nodes.filter((n) => n.depth === 1);
  const secondDegree = nodes.filter((n) => n.depth === 2);

  const positioned: PositionedNode[] = [];

  positioned.push({
    ...nodes.find((n) => n.depth === 0)!,
    x: cx,
    y: cy,
    r: isLanding ? 11 : 8,
  });

  const r1 = isLanding ? 140 : 88;
  firstDegree.forEach((n, i) => {
    const angle = (-Math.PI / 2) + (i * (2 * Math.PI)) / Math.max(firstDegree.length, 1);
    positioned.push({ ...n, x: cx + r1 * Math.cos(angle), y: cy + r1 * Math.sin(angle), r: 5 });
  });

  const r2 = isLanding ? 200 : 132;
  secondDegree.forEach((n, i) => {
    const angle = (-Math.PI / 2 + Math.PI / 6) + (i * (2 * Math.PI)) / Math.max(secondDegree.length, 1);
    positioned.push({ ...n, x: cx + r2 * Math.cos(angle), y: cy + r2 * Math.sin(angle), r: 3 });
  });

  const posBySlug = new Map(positioned.map((p) => [p.slug, p]));

  const drawnEdges: { a: PositionedNode; b: PositionedNode; key: string }[] = [];
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
      drawnEdges.push({ a, b, key });
    }
  }

  const current = currentSlug.toLowerCase();

  function isConnectedTo(slug: string, target: string) {
    return edges.get(slug)?.has(target) || edges.get(target)?.has(slug);
  }

  function getNodeOpacity(n: PositionedNode): number {
    if (!hoveredSlug) return 1;
    if (n.slug === hoveredSlug || n.slug === current) return 1;
    if (isConnectedTo(n.slug, hoveredSlug)) return 0.85;
    return 0.2;
  }

  function getEdgeStyle(a: PositionedNode, b: PositionedNode) {
    const isAdjToCurrent = a.slug === current || b.slug === current;
    const isAdjToHovered = hoveredSlug && (a.slug === hoveredSlug || b.slug === hoveredSlug);

    if (hoveredSlug) {
      if (isAdjToHovered) return { width: 1.4, opacity: 0.35, warm: true };
      return { width: 0.5, opacity: 0.04, warm: false };
    }
    if (isAdjToCurrent) return { width: 1.2, opacity: 0.22, warm: true };
    return { width: 0.6, opacity: 0.08, warm: false };
  }

  function getLabelOpacity(n: PositionedNode): number {
    if (n.depth === 0) return 1;
    if (!hoveredSlug) {
      if (isLanding && n.depth === 1) return 0.75;
      return n.depth === 1 ? 0.65 : 0.3;
    }
    if (n.slug === hoveredSlug || isConnectedTo(n.slug, hoveredSlug)) return 0.9;
    return 0.15;
  }

  function wrapLabel(title: string, isCurrent: boolean): string[] {
    const maxChars = isCurrent ? 18 : 14;
    const words = title.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      if ((cur + " " + w).trim().length > maxChars && cur) {
        lines.push(cur.trim());
        cur = w;
      } else {
        cur = (cur + " " + w).trim();
      }
    }
    if (cur) lines.push(cur.trim());
    return lines;
  }

  return (
    <section
      aria-label="Graph view"
      className={cn("flex w-full flex-col gap-2", className)}
    >
      <div className="flex items-center justify-between">
        <p className="font-mono text-[0.62rem] uppercase tracking-[0.22em] text-[var(--ls-accent)]">
          Thought Map
        </p>
        <div className="flex items-center gap-1.5 text-[var(--ls-fg-subtle)]">
          <Info aria-hidden className="size-3 cursor-help" />
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        {...(isLanding ? {} : { height: H })}
        role="img"
        aria-label="Thought map graph"
        className="overflow-visible"
        style={isLanding ? { aspectRatio: `${W} / ${H}`, height: "auto" } : undefined}
      >
        {/* Orbital rings (decorative) */}
        {isLanding && (
          <g aria-hidden style={{ pointerEvents: "none" }}>
            <circle
              cx={cx} cy={cy} r={r1}
              fill="none"
              stroke="var(--ls-accent)"
              strokeOpacity={0.07}
              strokeWidth={0.6}
              strokeDasharray="2 3"
            />
            {secondDegree.length > 0 && (
              <circle
                cx={cx} cy={cy} r={r2}
                fill="none"
                stroke="currentColor"
                className="text-[var(--ls-fg-subtle)]"
                strokeOpacity={0.08}
                strokeWidth={0.5}
                strokeDasharray="2 4"
              />
            )}
          </g>
        )}

        {/* Edges */}
        {drawnEdges.map(({ a, b, key }) => {
          const style = getEdgeStyle(a, b);
          return (
            <line
              key={key}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke={style.warm ? "var(--ls-accent)" : "currentColor"}
              strokeOpacity={style.opacity}
              strokeWidth={style.width}
              className={style.warm ? "" : "text-[var(--ls-fg-subtle)]"}
              style={{ transition: "stroke-opacity 0.25s, stroke-width 0.25s" }}
            />
          );
        })}

        {/* Nodes */}
        {positioned.map((n) => {
          const isCurrent = n.depth === 0;
          const isHovered = hoveredSlug === n.slug;
          const nodeOpacity = getNodeOpacity(n);
          const labelOpacity = getLabelOpacity(n);
          const lines = wrapLabel(n.title, isCurrent);
          const labelY = n.y + n.r + (isCurrent ? 14 : 11);
          const lineH = isCurrent ? 10 : 9;

          return (
            <g
              key={n.slug}
              style={{ opacity: nodeOpacity, transition: "opacity 0.2s" }}
              onMouseEnter={() => !isCurrent && setHoveredSlug(n.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
            >
              <Link href={`/latent-space/mind/${n.slug}`}>
                <title>{n.title}</title>

                {/* Outer glow */}
                {(isCurrent || isHovered) && (
                  <circle
                    cx={n.x} cy={n.y}
                    r={n.r + (isCurrent ? 10 : 7)}
                    fill="var(--ls-accent)"
                    opacity={isCurrent ? 0.15 : 0.1}
                    style={{ transition: "opacity 0.2s, r 0.2s" }}
                  />
                )}

                {/* Pulse ring for current */}
                {isCurrent && (
                  <circle
                    cx={n.x} cy={n.y}
                    r={n.r + 4}
                    fill="none"
                    stroke="var(--ls-accent)"
                    strokeWidth={0.8}
                    opacity={0.35}
                    className="animate-pulse"
                  />
                )}

                {/* Main node circle */}
                <circle
                  cx={n.x} cy={n.y} r={isHovered ? n.r + 1.5 : n.r}
                  fill={
                    isCurrent
                      ? "var(--ls-accent)"
                      : n.depth === 1
                        ? isHovered
                          ? "var(--ls-accent)"
                          : "color-mix(in oklch, var(--ls-accent) 55%, var(--ls-fg-subtle))"
                        : isHovered
                          ? "color-mix(in oklch, var(--ls-accent) 40%, var(--ls-fg-subtle))"
                          : "var(--ls-fg-subtle)"
                  }
                  opacity={isCurrent ? 1 : n.depth === 1 ? 0.7 : 0.45}
                  style={{ transition: "r 0.2s, fill 0.2s, opacity 0.2s", cursor: "pointer" }}
                />

                {/* White hot core for current node */}
                {isCurrent && (
                  <circle
                    cx={n.x} cy={n.y}
                    r={n.r * 0.35}
                    fill="white"
                    opacity={0.9}
                    style={{ pointerEvents: "none" }}
                  />
                )}

                {/* Labels */}
                {lines.map((line, li) => (
                  <text
                    key={li}
                    x={n.x}
                    y={labelY + li * lineH}
                    textAnchor="middle"
                    fontSize={isCurrent ? 9.5 : n.depth === 1 ? 8.5 : 7.5}
                    fontWeight={isCurrent ? 600 : isHovered ? 500 : 400}
                    fill={isCurrent ? "var(--ls-fg)" : "var(--ls-fg-muted)"}
                    opacity={labelOpacity}
                    style={{ transition: "opacity 0.2s, font-weight 0.2s", pointerEvents: "none" }}
                  >
                    {line}
                  </text>
                ))}
              </Link>
            </g>
          );
        })}
      </svg>

      <p className="flex items-center gap-3 font-mono text-[0.58rem] text-[var(--ls-fg-subtle)]">
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[var(--ls-accent)]" /> current
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-1.5 rounded-full opacity-70" style={{ background: "color-mix(in oklch, var(--ls-accent) 55%, var(--ls-fg-subtle))" }} /> linked
        </span>
        {secondDegree.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[var(--ls-fg-subtle)] opacity-45" /> mentioned
          </span>
        )}
      </p>
    </section>
  );
}
