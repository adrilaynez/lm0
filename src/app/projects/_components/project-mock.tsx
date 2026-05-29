/* ============================================================
   Project thumbnail mocks — monochrome structure + accent data.
   Ported from the wireframe's SVG generators, made deterministic
   so SSR and client markup match (no Math.random).
   Fills come from globals.css (.proj-mk .mk-*) which read --proj-*
   for structure and --accent for data.
   ============================================================ */
import Image from "next/image";

import type { MockKind, Project } from "../projects-data";

const svgProps = {
  className: "proj-mk block h-full w-full",
  viewBox: "0 0 400 300",
  preserveAspectRatio: "xMidYMid slice",
} as const;

function Dash() {
  const cells = [];
  for (let y = 0; y < 7; y++) {
    for (let x = 0; x < 11; x++) {
      const op = (0.1 + ((x * 7 + y * 13) % 55) / 100).toFixed(2);
      cells.push(
        <rect key={`${x}-${y}`} className="mk-acc" x={96 + x * 26} y={40 + y * 26} width={21} height={21} fillOpacity={op} />
      );
    }
  }
  return (
    <svg {...svgProps}>
      <rect className="mk-bg" width={400} height={300} />
      <rect className="mk-ln" x={40} y={40} width={40} height={6} />
      <rect className="mk-ln" x={40} y={56} width={30} height={4} />
      <rect className="mk-ln" x={40} y={68} width={34} height={4} />
      <rect className="mk-ln" x={40} y={80} width={26} height={4} />
      <text x={40} y={280} fontSize={11} letterSpacing={2}>transition_matrix</text>
      {cells}
    </svg>
  );
}

function Term() {
  const L: [number, string][] = [
    [26, "mk-acc"], [60, "mk-tx"], [40, "mk-acc"], [72, "mk-tx"],
    [34, "mk-acc"], [88, "mk-tx"], [50, "mk-acc"], [30, "mk-tx"],
  ];
  let y = 48;
  const code = L.map(([w, c], i) => {
    const rect = <rect key={i} className={c} x={40} y={y} width={w} height={7} fillOpacity={c === "mk-acc" ? 0.5 : undefined} />;
    y += 17;
    return rect;
  });
  const bars = [];
  for (let i = 0; i < 4; i++) {
    bars.push(<rect key={`b${i}`} className="mk-ln" x={240} y={52 + i * 30} width={120} height={11} />);
    bars.push(<rect key={`a${i}`} className="mk-acc mk-pulse" x={240} y={52 + i * 30} width={50 + i * 18} height={11} />);
  }
  return (
    <svg {...svgProps}>
      <rect className="mk-bg" width={400} height={300} />
      <rect className="mk-pn" x={224} y={40} width={150} height={150} />
      {code}
      <rect className="mk-acc mk-blink" x={40} y={y} width={8} height={10} />
      {bars}
      <text x={40} y={280} fontSize={11} letterSpacing={2}>bench · tok/s</text>
    </svg>
  );
}

function App() {
  const cards = [];
  for (let i = 0; i < 3; i++) {
    cards.push(<rect key={`c${i}`} className="mk-pn" x={40 + i * 110} y={44} width={98} height={64} />);
    cards.push(<rect key={`ca${i}`} className="mk-acc" x={52 + i * 110} y={58} width={26} height={7} fillOpacity={0.8} />);
    cards.push(<rect key={`cl${i}`} className="mk-ln2" x={52 + i * 110} y={74} width={68} height={5} />);
    cards.push(<rect key={`cl2${i}`} className="mk-ln" x={52 + i * 110} y={86} width={46} height={5} />);
  }
  const rows = [];
  for (let i = 0; i < 4; i++) {
    rows.push(<rect key={`r${i}`} className="mk-pn" x={40} y={130 + i * 32} width={320} height={24} />);
    rows.push(<circle key={`rc${i}`} className="mk-acc" cx={58} cy={142 + i * 32} r={6} fillOpacity={0.4 + i * 0.15} />);
    rows.push(<rect key={`rl${i}`} className="mk-ln2" x={74} y={138 + i * 32} width={150 - i * 22} height={6} />);
  }
  return (
    <svg {...svgProps}>
      <rect className="mk-bg" width={400} height={300} />
      {cards}
      {rows}
    </svg>
  );
}

function Article() {
  const ws = [300, 286, 312, 264, 296, 250, 308, 276, 290, 258];
  return (
    <svg {...svgProps}>
      <rect className="mk-bg" width={400} height={300} />
      <rect className="mk-acc" x={56} y={48} width={70} height={10} fillOpacity={0.5} />
      <rect className="mk-ln2" x={56} y={74} width={240} height={14} />
      <rect className="mk-ln2" x={56} y={94} width={180} height={14} />
      {ws.map((w, i) => (
        <rect key={i} className="mk-ln" x={56} y={120 + i * 16} width={w} height={5} />
      ))}
      <text x={56} y={284} fontSize={11} letterSpacing={2}>latent-space · essay</text>
    </svg>
  );
}

const MOCKS: Record<MockKind, () => React.ReactElement> = {
  dash: Dash,
  term: Term,
  app: App,
  article: Article,
};

export function ProjectMock({ project }: { project: Project }) {
  if (project.image) {
    // SVGs (e.g. sova's animated demo) keep their SMIL animations only via a plain
    // <img>; next/image would route them through the optimizer (blocked for SVG).
    if (project.image.endsWith(".svg")) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.image}
          alt={project.name}
          className="absolute inset-0 h-full w-full object-contain p-4 md:p-6"
        />
      );
    }
    return (
      <Image
        src={project.image}
        alt={project.name}
        fill
        sizes="(max-width: 800px) 100vw, 50vw"
        className="object-cover object-top"
      />
    );
  }
  const Mock = MOCKS[project.mock] ?? App;
  return <Mock />;
}
