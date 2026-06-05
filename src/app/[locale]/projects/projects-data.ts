/* ============================================================
   Projects — data source for the editorial "Híbrida" layout.
   Structural fields are language-agnostic; prose is Localized
   ({ en, es }) and picked at render time via useI18n().language.
   ES copy ported from the original wireframe; EN translated.
   ============================================================ */

export type Lang = "en" | "es";
export type Localized<T> = Record<Lang, T>;

export type ProjectStatus = "live" | "wip" | "essay";
export type MockKind = "term" | "dash" | "app" | "article";

export interface ProjectColor {
  a: string; // accent
  d: string; // accent-deep (hover)
  ink: string; // text on accent
}

export interface CodeSample {
  fn: string;
  lines: string[];
  out?: string[];
}

export interface Project {
  id: string; // also the URL slug
  name: string;
  year: string;
  status: ProjectStatus;
  featured: boolean;
  color: ProjectColor;
  mock: MockKind;
  image?: string; // /projects/<id>.png — overrides the SVG mock when present
  href?: string; // demo / live link
  repo?: string; // source code link

  tags: Localized<string[]>;
  kind: Localized<string>;
  statusLabel: Localized<string>;
  lead: Localized<string>;
  long: Localized<string>;
  desc: Localized<string>;

  detail: {
    tagline: Localized<string>;
    overview: Localized<string[]>;
    features: Localized<string[]>;
    steps: Localized<string[]>;
    facts: Localized<string[]>;
    spec: Localized<Record<string, string>>;
    code?: CodeSample;
  };
}

const GITHUB = "https://github.com/adrilaynez";

export const PROJECTS: Project[] = [
  {
    id: "lm-lab",
    name: "LM LAB",
    year: "2025",
    status: "live",
    featured: true,
    color: { a: "#34d399", d: "#10b981", ink: "#06120c" },
    mock: "dash",
    image: "/lab/chill/hero-facility.png",
    href: "/lab",
    repo: GITHUB,
    tags: { en: ["Next.js", "AI"], es: ["Next.js", "AI"] },
    kind: { en: "Interactive notebook", es: "Cuaderno interactivo" },
    statusLabel: { en: "live demo", es: "live demo" },
    lead: {
      en: "Learn how ChatGPT works — from the ground up.",
      es: "Aprende cómo funciona ChatGPT desde el principio.",
    },
    long: {
      en: "An interactive notebook that walks, chapter by chapter, through the ideas behind language models. Not a course or a tutorial: a tour of the concepts with visualizations you can touch — from the simplest bigram to attention and text generation.",
      es: "Un cuaderno interactivo que recorre, capítulo a capítulo, las ideas detrás de los modelos de lenguaje. No es un curso ni un tutorial: es un paseo por los conceptos con visualizaciones que puedes tocar — del bigrama más simple hasta la atención y la generación de texto.",
    },
    desc: {
      en: "Learn how ChatGPT works from the ground up. Not a course or a tutorial — a walk through the ideas behind language models.",
      es: "Aprende cómo funciona ChatGPT desde el principio. No es un curso ni un tutorial — un recorrido por las ideas detrás de los modelos de lenguaje.",
    },
    detail: {
      tagline: {
        en: "Learn how ChatGPT works — from the ground up.",
        es: "Aprende cómo funciona ChatGPT — desde el principio.",
      },
      overview: {
        en: [
          "<b>LM LAB</b> is an interactive notebook that walks through the ideas behind language models. Not a course or a tutorial: a tour of the concepts, chapter by chapter, with visualizations you can touch.",
          "From the simplest bigram to attention and text generation, each idea builds on the last.",
        ],
        es: [
          "<b>LM LAB</b> es un cuaderno interactivo que recorre las ideas detrás de los modelos de lenguaje. No es un curso ni un tutorial: es un paseo por los conceptos, capítulo a capítulo, con visualizaciones que puedes tocar.",
          "Desde el bigrama más simple hasta la atención y la generación de texto, cada idea se construye sobre la anterior.",
        ],
      },
      features: {
        en: ["Interactive visualizations", "5 guided chapters", "Live inference", "Bilingual (EN · ES)"],
        es: ["Visualizaciones interactivas", "5 capítulos guiados", "Inferencia en vivo", "Bilingüe (EN · ES)"],
      },
      steps: {
        en: [
          "<b>Read</b> each chapter at your own pace — concepts first, jargon later.",
          "<b>Play</b> with the demos: change inputs and watch the model react.",
          "<b>Connect</b> the ideas until you understand how it predicts the next word.",
        ],
        es: [
          "<b>Lee</b> cada capítulo a tu ritmo — conceptos primero, jerga después.",
          "<b>Juega</b> con las demos: cambia entradas y observa el modelo reaccionar.",
          "<b>Conecta</b> las ideas hasta entender cómo predice la siguiente palabra.",
        ],
      },
      facts: {
        en: ["5 chapters", "~45 min", "Next.js"],
        es: ["5 capítulos", "~45 min", "Next.js"],
      },
      spec: {
        en: { Type: "Interactive notebook", Chapters: "05", Duration: "~45 min", Stack: "Next.js", Language: "EN · ES" },
        es: { Tipo: "Cuaderno interactivo", Capítulos: "05", Duración: "~45 min", Stack: "Next.js", Idioma: "EN · ES" },
      },
    },
  },
  {
    id: "sova",
    name: "sova",
    year: "2025",
    status: "wip",
    featured: true,
    color: { a: "#a78bfa", d: "#8b6df0", ink: "#130a20" },
    mock: "term",
    image: "/projects/sova-demo.svg",
    repo: GITHUB,
    tags: { en: ["JFlex", "CUP", "WebAssembly"], es: ["JFlex", "CUP", "WebAssembly"] },
    kind: { en: "Language + compiler", es: "Lenguaje + compilador" },
    statusLabel: { en: "in progress", es: "en progreso" },
    lead: {
      en: "Write pseudocode in Spanish. Compile to WebAssembly.",
      es: "Escribe pseudocódigo en español. Compila a WebAssembly.",
    },
    long: {
      en: "A small, expressive language whose keywords read like Spanish pseudocode, with a full compiler that turns it into runnable WebAssembly. You write FUNCION, MIENTRAS, MOSTRAR… and get a .wasm module that runs in Node.js or the browser.",
      es: "Un lenguaje pequeño y expresivo cuyas palabras clave leen como pseudocódigo en español, con un compilador completo que lo convierte en WebAssembly ejecutable. Escribes FUNCION, MIENTRAS, MOSTRAR… y obtienes un módulo .wasm que corre en Node.js o en el navegador.",
    },
    desc: {
      en: "Write pseudocode in Spanish, compile to WebAssembly. A small, expressive language with a full compiler (lexer + LALR parser) that emits runnable .wasm.",
      es: "Escribe pseudocódigo en español, compila a WebAssembly. Un lenguaje pequeño y expresivo con un compilador completo (lexer + parser LALR) que genera .wasm ejecutable.",
    },
    detail: {
      tagline: {
        en: "Write pseudocode in Spanish. Compile to WebAssembly.",
        es: "Escribe pseudocódigo en español. Compila a WebAssembly.",
      },
      overview: {
        en: [
          "<b>sova</b> is a small, expressive programming language whose keywords read like Spanish pseudocode, and a full compiler that turns it into runnable <b>WebAssembly</b>.",
          "Built to teach and prototype: you write <span>FUNCION</span>, <span>MIENTRAS</span>, <span>MOSTRAR</span>… and get a <b>.wasm</b> module that runs in Node.js or the browser.",
        ],
        es: [
          "<b>sova</b> es un lenguaje de programación pequeño y expresivo cuyas palabras clave leen como pseudocódigo en español, y un compilador completo que lo convierte en <b>WebAssembly</b> ejecutable.",
          "Pensado para enseñar y prototipar: escribes <span>FUNCION</span>, <span>MIENTRAS</span>, <span>MOSTRAR</span>… y obtienes un módulo <b>.wasm</b> que corre en Node.js o en el navegador.",
        ],
      },
      features: {
        en: ["Static types", "Functions by value and reference", "Arrays and records", "Runs in Node.js and the browser"],
        es: ["Tipos estáticos", "Funciones por valor y referencia", "Arrays y registros", "Ejecución en Node.js y navegador"],
      },
      steps: {
        en: [
          "<b>Write</b> your algorithm in Spanish pseudocode.",
          "<b>Compile</b>: the lexer (JFlex) and LALR parser (CUP) emit WebAssembly.",
          "<b>Run</b> the <b>.wasm</b> with <span>node loader.js</span> or in the browser.",
        ],
        es: [
          "<b>Escribe</b> tu algoritmo en pseudocódigo español.",
          "<b>Compila</b>: el lexer (JFlex) y el parser LALR (CUP) generan WebAssembly.",
          "<b>Ejecuta</b> el <b>.wasm</b> con <span>node loader.js</span> o en el navegador.",
        ],
      },
      facts: {
        en: ["WebAssembly", "Lexer + Parser", "Node · Web"],
        es: ["WebAssembly", "Lexer + Parser", "Node · Web"],
      },
      spec: {
        en: { Language: "Spanish pseudocode", Target: "WebAssembly (.wasm)", Lexer: "JFlex", Parser: "CUP (LALR)", License: "MIT" },
        es: { Lenguaje: "Pseudocódigo ES", Objetivo: "WebAssembly (.wasm)", Lexer: "JFlex", Parser: "CUP (LALR)", Licencia: "MIT" },
      },
      code: {
        fn: "factorial.sova",
        lines: [
          '<span class="kw">FUNCION</span> MAIN() {',
          '  <span class="kw">ENT</span> n := 4;',
          '  <span class="kw">ENT</span> fact := 1;',
          '  <span class="kw">MIENTRAS</span> n &gt; 1 {',
          "    fact := fact * n;",
          "    n := n - 1;",
          "  }",
          '  <span class="kw">MOSTRAR</span>(fact);',
          "}",
        ],
        out: ["&gt; node loader.js", '<span class="out">24</span>'],
      },
    },
  },
  {
    id: "latent",
    name: "My Latent Space",
    year: "2025",
    status: "essay",
    featured: false,
    color: { a: "#f0884a", d: "#e0703a", ink: "#1a0f06" },
    mock: "article",
    href: "/latent-space",
    repo: GITHUB,
    tags: { en: ["Essays", "Notes"], es: ["Ensayos", "Notas"] },
    kind: { en: "Digital garden", es: "Jardín digital" },
    statusLabel: { en: "writing", es: "escritos" },
    lead: {
      en: "Notes, ideas and unfinished thinking.",
      es: "Notas, ideas y pensamiento sin terminar.",
    },
    long: {
      en: "A personal system for thinking out loud: exploring ideas, connecting concepts and mapping meaning. It has two modes — a map of connected thoughts and longer essays. It's messy, evolving and alive.",
      es: "Un sistema personal para pensar en voz alta: explorar ideas, conectar conceptos y cartografiar el significado. Tiene dos modos — un mapa de pensamientos conectados y ensayos más largos. Es desordenado, evoluciona y está vivo.",
    },
    desc: {
      en: "Notes, ideas and unfinished thinking. A personal system to explore concepts and map meaning.",
      es: "Notas, ideas y pensamiento sin terminar. Un sistema personal para explorar conceptos y cartografiar el significado.",
    },
    detail: {
      tagline: {
        en: "Notes, ideas and unfinished thinking.",
        es: "Notas, ideas y pensamiento sin terminar.",
      },
      overview: {
        en: [
          "<b>My Latent Space</b> is a personal system for thinking out loud: exploring ideas, connecting concepts and mapping meaning. It's messy, evolving and alive.",
          "Two modes: <b>Mind</b> (a map of connected thoughts) and <b>Essays</b> (longer writing).",
        ],
        es: [
          "<b>My Latent Space</b> es un sistema personal para pensar en voz alta: explorar ideas, conectar conceptos y cartografiar el significado. Es desordenado, evoluciona y está vivo.",
          "Dos modos: <b>Mind</b> (un mapa de pensamientos conectados) y <b>Essays</b> (escritos más largos).",
        ],
      },
      features: {
        en: ["Thought map", "Notes and essays", "Linked concepts", "Always evolving"],
        es: ["Mapa de pensamiento", "Notas y ensayos", "Conceptos enlazados", "Siempre en evolución"],
      },
      steps: {
        en: [
          "<b>Explore</b> the map: each node is an idea connected to others.",
          "<b>Read</b> the current threads — what I'm thinking about now.",
          "<b>Jump</b> between notes and ideas by following the links.",
        ],
        es: [
          "<b>Explora</b> el mapa: cada nodo es una idea conectada a otras.",
          "<b>Lee</b> los hilos actuales — lo que estoy pensando ahora.",
          "<b>Salta</b> entre notas e ideas siguiendo los enlaces.",
        ],
      },
      facts: {
        en: ["Mind · Essays", "Notes", "Evolving"],
        es: ["Mind · Essays", "Notas", "En evolución"],
      },
      spec: {
        en: { Type: "Digital garden", Modes: "Mind · Essays", Format: "Notes · Essays", Status: "Alive" },
        es: { Tipo: "Jardín digital", Modos: "Mind · Essays", Formato: "Notas · Ensayos", Estado: "Vivo" },
      },
    },
  },
  {
    id: "titan-engine",
    name: "titan-engine",
    year: "2025",
    status: "wip",
    featured: false,
    color: { a: "#5b9df5", d: "#3d82e8", ink: "#06101f" },
    mock: "term",
    repo: GITHUB,
    tags: { en: ["C++", "CUDA"], es: ["C++", "CUDA"] },
    kind: { en: "Inference engine", es: "Motor de inferencia" },
    statusLabel: { en: "in progress", es: "en progreso" },
    lead: {
      en: "High-performance LLM inference, in C++ and CUDA.",
      es: "Inferencia LLM de alto rendimiento, en C++ y CUDA.",
    },
    long: {
      en: "An inference engine for language models focused on performance: custom CUDA kernels, careful memory management and a lightweight C++ runtime. Dynamic batching and optimized token generation.",
      es: "Un motor de inferencia para modelos de lenguaje centrado en el rendimiento: kernels CUDA a medida, gestión de memoria cuidada y un runtime ligero en C++. Batching dinámico y generación de tokens optimizada.",
    },
    desc: {
      en: "High-performance LLM inference engine written in C++ and CUDA.",
      es: "Motor de inferencia LLM de alto rendimiento escrito en C++ y CUDA.",
    },
    detail: {
      tagline: {
        en: "High-performance LLM inference, in C++ and CUDA.",
        es: "Inferencia LLM de alto rendimiento, en C++ y CUDA.",
      },
      overview: {
        en: [
          "<b>titan-engine</b> is an inference engine for language models focused on performance: custom CUDA kernels, careful memory management and a lightweight C++ runtime.",
          "[Draft] Tell me more details and I'll fill out this sheet.",
        ],
        es: [
          "<b>titan-engine</b> es un motor de inferencia para modelos de lenguaje centrado en el rendimiento: kernels CUDA a medida, gestión de memoria cuidada y un runtime ligero en C++.",
          "[Borrador] Cuéntame más detalles y completo esta ficha.",
        ],
      },
      features: {
        en: ["CUDA kernels", "C++ runtime", "Memory management", "Dynamic batching"],
        es: ["Kernels CUDA", "Runtime en C++", "Gestión de memoria", "Batching dinámico"],
      },
      steps: {
        en: [
          "<b>Load</b> the model weights into GPU memory.",
          "<b>Schedule</b> the batch of inference requests.",
          "<b>Generate</b> tokens with optimized kernels.",
        ],
        es: [
          "<b>Carga</b> los pesos del modelo en memoria de GPU.",
          "<b>Programa</b> el batch de peticiones de inferencia.",
          "<b>Genera</b> tokens con kernels optimizados.",
        ],
      },
      facts: {
        en: ["C++ · CUDA", "Custom kernels", "In progress"],
        es: ["C++ · CUDA", "Kernels propios", "En progreso"],
      },
      spec: {
        en: { Type: "Inference engine", Language: "C++ · CUDA", Status: "In progress", Year: "2025" },
        es: { Tipo: "Motor de inferencia", Lenguaje: "C++ · CUDA", Estado: "En progreso", Año: "2025" },
      },
    },
  },
  {
    id: "fourier-draw",
    name: "fourier-draw",
    year: "2024",
    status: "live",
    featured: false,
    color: { a: "#38bdf8", d: "#0ea5e9", ink: "#04141f" },
    mock: "dash",
    repo: GITHUB,
    tags: { en: ["Canvas", "Math", "DFT"], es: ["Canvas", "Math", "DFT"] },
    kind: { en: "Mathematical visualization", es: "Visualización matemática" },
    statusLabel: { en: "live demo", es: "live demo" },
    lead: {
      en: "Draw any stroke. Rebuild it with epicycles.",
      es: "Dibuja cualquier trazo. Reconstrúyelo con epiciclos.",
    },
    long: {
      en: "A tool that decomposes any drawing into a Fourier series and rebuilds it with circles spinning on circles. You draw a stroke, the transform turns it into epicycles, and you watch the sum of sines and cosines recreate your line in real time.",
      es: "Una herramienta que descompone cualquier dibujo en una serie de Fourier y lo reconstruye con círculos girando sobre círculos. Dibujas un trazo, la transformada lo convierte en epiciclos y ves cómo la suma de senos y cosenos recrea tu línea en tiempo real.",
    },
    desc: {
      en: "Draw a stroke and watch it rebuilt with epicycles: the Fourier transform turned into an animation you can touch.",
      es: "Dibuja un trazo y míralo reconstruido con epiciclos: la transformada de Fourier convertida en una animación que puedes tocar.",
    },
    detail: {
      tagline: {
        en: "Draw any stroke. Rebuild it with epicycles.",
        es: "Dibuja cualquier trazo. Reconstrúyelo con epiciclos.",
      },
      overview: {
        en: [
          "<b>fourier-draw</b> decomposes any drawing into a Fourier series and rebuilds it with circles spinning on circles.",
          "You draw a stroke, the transform turns it into epicycles, and you watch the sum of sines and cosines recreate your line in real time.",
        ],
        es: [
          "<b>fourier-draw</b> descompone cualquier dibujo en una serie de Fourier y lo reconstruye con círculos girando sobre círculos.",
          "Dibujas un trazo, la transformada lo convierte en epiciclos y ves cómo la suma de senos y cosenos recrea tu línea en tiempo real.",
        ],
      },
      features: {
        en: ["DFT in the browser", "Adjustable number of terms", "Export the SVG", "No dependencies"],
        es: ["DFT en el navegador", "Número de términos ajustable", "Exporta el SVG", "Sin dependencias"],
      },
      steps: {
        en: [
          "<b>Draw</b> a closed shape with the mouse.",
          "<b>Compute</b>: the DFT extracts the stroke's frequencies.",
          "<b>Watch</b> the epicycles rebuild your drawing.",
        ],
        es: [
          "<b>Dibuja</b> una forma cerrada con el ratón.",
          "<b>Calcula</b>: la DFT extrae las frecuencias del trazo.",
          "<b>Observa</b> los epiciclos reconstruir tu dibujo.",
        ],
      },
      facts: {
        en: ["Canvas", "Live DFT", "~3 KB"],
        es: ["Canvas", "DFT en vivo", "~3 KB"],
      },
      spec: {
        en: { Type: "Visualization", Technique: "DFT", Stack: "Canvas 2D", Size: "~3 KB", Year: "2024" },
        es: { Tipo: "Visualización", Técnica: "DFT", Stack: "Canvas 2D", Tamaño: "~3 KB", Año: "2024" },
      },
    },
  },
  {
    id: "automata",
    name: "automata",
    year: "2024",
    status: "wip",
    featured: false,
    color: { a: "#f472b6", d: "#ec4899", ink: "#1f0613" },
    mock: "app",
    repo: GITHUB,
    tags: { en: ["WebGL", "Rust", "WASM"], es: ["WebGL", "Rust", "WASM"] },
    kind: { en: "Generative lab", es: "Laboratorio generativo" },
    statusLabel: { en: "in progress", es: "en progreso" },
    lead: {
      en: "Simple rules, complex behavior.",
      es: "Reglas simples, comportamiento complejo.",
    },
    long: {
      en: "A playground for cellular automata and artificial life: Game of Life, elementary rules and reaction-diffusion models, running on the GPU. Change the rules, paint the initial state and watch patterns emerge from chaos.",
      es: "Un patio de juegos para autómatas celulares y vida artificial: Game of Life, reglas elementales y modelos de reacción-difusión, corriendo sobre la GPU. Cambia las reglas, pinta el estado inicial y observa cómo emergen patrones del caos.",
    },
    desc: {
      en: "A playground for cellular automata and artificial life running on the GPU. Simple rules that generate complex behavior.",
      es: "Un patio de juegos para autómatas celulares y vida artificial corriendo sobre la GPU. Reglas simples que generan comportamiento complejo.",
    },
    detail: {
      tagline: {
        en: "Simple rules, complex behavior.",
        es: "Reglas simples, comportamiento complejo.",
      },
      overview: {
        en: [
          "<b>automata</b> is a playground for cellular automata and artificial life: Game of Life, elementary rules and reaction-diffusion, all on the GPU.",
          "Change the rules, paint the initial state and watch patterns emerge from chaos.",
        ],
        es: [
          "<b>automata</b> es un patio de juegos para autómatas celulares y vida artificial: Game of Life, reglas elementales y reacción-difusión, todo sobre la GPU.",
          "Cambia las reglas, pinta el estado inicial y observa cómo emergen patrones del caos.",
        ],
      },
      features: {
        en: ["GPU simulation", "Editable rules", "Reaction-diffusion", "Paintable initial state"],
        es: ["Simulación en GPU", "Reglas editables", "Reacción-difusión", "Estado inicial pintable"],
      },
      steps: {
        en: [
          "<b>Choose</b> a rule or write your own.",
          "<b>Paint</b> the initial state on the grid.",
          "<b>Run</b> the simulation at 60 fps and watch the patterns.",
        ],
        es: [
          "<b>Elige</b> una regla o escribe la tuya.",
          "<b>Pinta</b> el estado inicial sobre la rejilla.",
          "<b>Corre</b> la simulación a 60 fps y observa los patrones.",
        ],
      },
      facts: {
        en: ["WebGL", "Rust → WASM", "60 fps"],
        es: ["WebGL", "Rust → WASM", "60 fps"],
      },
      spec: {
        en: { Type: "Lab", Compute: "WebGL · GPU", Core: "Rust → WASM", Status: "In progress", Year: "2024" },
        es: { Tipo: "Laboratorio", Cómputo: "WebGL · GPU", Núcleo: "Rust → WASM", Estado: "En progreso", Año: "2024" },
      },
    },
  },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.id === slug);
}

export function getProjectSlugs(): string[] {
  return PROJECTS.map((p) => p.id);
}

export function getRelated(slug: string, n = 3): Project[] {
  return PROJECTS.filter((p) => p.id !== slug).slice(0, n);
}

export const FEATURED = PROJECTS.filter((p) => p.featured);
export const REST = PROJECTS.filter((p) => !p.featured);
