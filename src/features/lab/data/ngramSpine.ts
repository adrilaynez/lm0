/**
 * ngramSpine — the structured narrative of the N-gram chapter (the "spine"). v3 · arquitectura "La fila".
 *
 * Mirror of `bigramSpine.ts`: the SINGLE SOURCE OF TRUTH for *what each beat does and why it sits where it
 * sits*. Cure for the #1 failure ("widget pegado sin contexto"): every beat declares what the reader knows
 * entering, the one new idea, the motivating question, and what it hands to the next. Build a widget by
 * reading its beat + the beats BEFORE it (`contextPacket`) — never in isolation.
 *
 * v3 (2026-06-03): rebuilt from the locked narrative (`ngram-narrative-draft.md`, PASS) + the candidate
 * architecture (`ngram-vision.md`). The chapter is one continuous morph of ONE recurring object — **THE ROW**
 * (`FixedAlphabetRow`): born (§1) → keyed/split (§2) → stacked into a table (§3) → exploded/zoomed (§4) →
 * a single empty slot kills it (§5) → bookend. ~12 focal visualizers; ONE celebration (§3), ONE wall (§5),
 * everything DISCOVERED. Copy is single-sourced in i18n (`ngramNarrative.v3.*`); this file carries structure.
 * Authorities: `method-failure-book.md` (gates), `narrative-guidelines.md` (voice), `src/features/lab/
 * components/ngram/kit` + its `AGENTS.md` (the look + build contract). Accent = AMBER under [data-ngram-theme].
 */

export type Temperature = "quiet" | "showpiece";
export type WidgetStatus = "done" | "rework" | "build" | "external";

export interface BeatWidget {
    /** Component name / file under components/ngram/. */
    component: string;
    /** The visual archetype — pick a distinct one; do not render everything as bar/grid. */
    archetype: string;
    temperature: Temperature;
    /** Which kit primitives this widget ASSEMBLES from (ngram/kit). */
    kitPieces: string[];
    /** The ONE unique mechanic, in words (everything else comes from the kit). */
    mechanic: string;
    /** The real data module/values it must use (never faked). */
    data: string;
    status: WidgetStatus;
    /** Is this a HERO widget? (full generation panel + judge panel; the chapter's load-bearing visuals.) */
    hero?: boolean;
}

export interface Beat {
    id: string;
    section: string;
    /** What the reader ALREADY knows entering this beat (cumulative state). */
    priorKnowledge: string;
    /** The ONE new idea this beat adds. The widget teaches exactly this — no more. */
    newIdea: string;
    /** The reader's "¿y si?" this beat answers and/or leaves for the next. */
    question: string;
    /** What this beat hands to the next (its payoff == the next beat's premise). */
    setsUp: string;
    /** Emotional beat + where humor/awe lands. */
    tone: string;
    /** i18n namespace for this beat's prose (under ngramNarrative.v3 unless noted). */
    copyNs: string;
    widget?: BeatWidget;
}

export const NGRAM_SPINE: Beat[] = [
    {
        id: "hero",
        section: "Hero",
        priorKnowledge: "Viene de bigram: contar pares, la matriz 27×27, generar leyendo cuentas, y la amnesia (solo una letra atrás).",
        newIdea: "Hay un arreglo evidente para la amnesia: darle más memoria, mirar más de una letra atrás.",
        question: "¿Y si la máquina pudiera recordar más de una letra?",
        setsUp: "La promesa: más memoria. Y el aviso de que se nos irá de las manos.",
        tone: "Promesa grande, humana. Título enorme.",
        copyNs: "ngramNarrative.v3.hero",
    },
    {
        id: "s1-amnesia",
        section: "§1 · Mirar más atrás",
        priorKnowledge: "El bigrama escribía leyendo una fila por letra; solo recordaba la última.",
        newIdea: "Con una sola letra de memoria, «th»/«sh»/«wh» son indistinguibles → hay palabras imposibles de acertar.",
        question: "¿Por qué falla, exactamente?",
        setsUp: "El agujero SENTIDO (no contado) → el deseo de más memoria.",
        tone: "Curiosidad + el fallo en cámara lenta. El usuario lo descubre, no se le anuncia (pilar 11).",
        copyNs: "ngramNarrative.v3.s1.amnesia",
        widget: {
            component: "AmnesiaReplay",
            archetype: "the bigram completing confidently-and-wrong because it only sees the last letter",
            temperature: "quiet",
            kitPieces: ["MarkedText", "FixedAlphabetRow", "HonestBar", "CaptionLine"],
            mechanic: "el lector ve «th»/«sh»/«wh» colapsar a la MISMA fila (la de «h»); la apuesta es idéntica para las tres → imposible distinguir.",
            data: "ngramData: la fila «h» (k=1) real sobre Shakespeare",
            status: "build",
        },
    },
    {
        id: "s1-widen",
        section: "§1 · Mirar más atrás",
        priorKnowledge: "Con una letra es imposible; el contexto «lo que llevas escrito» es más que la última letra.",
        newIdea: "Con 1 letra la apuesta es un volado; con 3-4 se vuelve casi segura. Más memoria = más certeza.",
        question: "¿Cuánto ayuda de verdad mirar más atrás?",
        setsUp: "La intuición «más contexto = más certeza» → ¿cómo lo logra una máquina que solo cuenta?",
        tone: "Descubrimiento. Juego de apuesta GENUINAMENTE difícil (palabra rara letra a letra; con poco contexto no se acierta). Pilar 10.",
        copyNs: "ngramNarrative.v3.s1.widen",
        widget: {
            component: "WidenWindow",
            archetype: "predict-the-next with a sliding memory window (1→4); the bet sharpens",
            temperature: "showpiece",
            kitPieces: ["MarkedText", "HonestBar", "Tabs", "Readout", "GhostButton"],
            mechanic: "palabra difícil revelada letra a letra; el lector apuesta antes; un mando 1→4 estrecha la distribución de plana a un pico. El HÉROE es el % que sube.",
            data: "ngramData contextDistribution n=1..4 (real); ejemplos verificados (virtue/calamity/purpose)",
            status: "build",
            hero: true,
        },
    },
    {
        id: "s2-split",
        section: "§2 · Construirla tú",
        priorKnowledge: "Más memoria ayuda; el método de bigram era contar y guardar una fila por letra.",
        newIdea: "El modelo mayor es el MISMO contar con una llave más larga: una fila por cada pareja. Y lo construye el lector, a mano.",
        question: "¿Cómo se guarda «lo que sigue a TH» en vez de «a H»?",
        setsUp: "Una tabla de 729 filas que el lector ha levantado → ¿cómo es de afilada cada fila?",
        tone: "BUILD, construir CUESTA (pilar 12). Descubre «hice un trigrama» sin que se lo digan. El nombre llega después.",
        copyNs: "ngramNarrative.v3.s2.split",
        widget: {
            component: "SplitTheRow",
            archetype: "one row fractures into 27 child rows as the reader splits it by the previous letter",
            temperature: "showpiece",
            kitPieces: ["FixedAlphabetRow", "heat", "Readout", "CountUpNumber", "MarkedText", "PlayButton/GhostButton"],
            mechanic: "el lector parte a mano la fila «h» por la letra de antes; cada corte cuesta un clic y recuenta real; el tally trepa 1→27→729; cada hija sale más afilada. El HÉROE es la pila multiplicándose bajo su mano.",
            data: "ngramData: counts k=2 (fila «h») y k=3 (filas «·h») reales",
            status: "build",
            hero: true,
        },
    },
    {
        id: "s2-sharpen",
        section: "§2 · Construirla tú",
        priorKnowledge: "Ya hay una fila por pareja (727+ filas), construidas por el lector.",
        newIdea: "Una llave más larga AFILA la apuesta: tras «h» viene de todo; tras «th» casi siempre «e». Jugable: investigar parejas.",
        question: "¿De verdad es más afilada? ¿qué pasa con otras parejas?",
        setsUp: "Si afila tanto por letra, ¿y si subimos otro nivel? → la tabla crece.",
        tone: "Tranquilo, manipulación directa, JUGABLE (lo mejor de v1 ContextCounter: investigar). Continuidad t/h de bigram.",
        copyNs: "ngramNarrative.v3.s2.sharpen",
        widget: {
            component: "RowSharpens",
            archetype: "pick a pair → see its stored row, razor-sharp; hop pairs to explore",
            temperature: "quiet",
            kitPieces: ["FixedAlphabetRow", "heat", "Tabs", "Readout", "CaptionLine"],
            mechanic: "el lector elige una pareja y ve su fila como un cajón ordenado; salta de pareja en pareja (qu→u, zz→nada). Reusa la base de v1 ContextCounter.",
            data: "ngramData contextRow k=3 (real)",
            status: "rework", // from v1 ContextCounter
        },
    },
    {
        id: "s2-grow",
        section: "§2 · Construirla tú",
        priorKnowledge: "Una fila por pareja afila la apuesta; subir de nivel es repetir lo mismo con una llave más larga.",
        newIdea: "Subir de nivel = la MISMA tabla, más grande. Trigrama→4-grama→5-grama: la tabla crece a la vista.",
        question: "¿Y si seguimos subiendo niveles?",
        setsUp: "Filas afiladas y una tabla que crece → dejémosla escribir.",
        tone: "Descubre que crece (A3.2). Antesala del crecimiento; el asombro de tamaño llega en §4.",
        copyNs: "ngramNarrative.v3.s2.grow",
        widget: {
            component: "GrowingTable",
            archetype: "same widget, bump the level → the stored table visibly inflates each step",
            temperature: "showpiece",
            kitPieces: ["FixedAlphabetRow", "heat", "CountUpNumber", "PlayButton", "CaptionLine"],
            mechanic: "el lector pulsa «otra letra»; la MISMA tabla se hincha (trigrama→4→5) hasta no caber; ve crecer la altura/recuento.",
            data: "ngramData diagnostics: observedContexts/filas reales por k=3..5",
            status: "build",
        },
    },
    {
        id: "s3-write",
        section: "§3 · Lo que has construido",
        priorKnowledge: "Hay una tabla grande de filas afiladas, construida por el lector.",
        newIdea: "Escribir = buscar tu contexto en la tabla, leer un número, elegir, repetir. No piensa: lee.",
        question: "¿Cómo escribe, exactamente, con esta tabla?",
        setsUp: "Desmitificada la generación → celebrar lo que se ha construido.",
        tone: "Tranquilo, «abrir la tapa». El flujo completo visible (como el describe de bigram). Pilar 5.",
        copyNs: "ngramNarrative.v3.s3.write",
        widget: {
            component: "WriteFromMatrix",
            archetype: "a lens travels the giant table, lands on the context row, reads a number, picks, repeats",
            temperature: "showpiece",
            kitPieces: ["FixedAlphabetRow", "MarkedText", "Readout", "heat", "PlayButton/GhostButton"],
            mechanic: "lente que recorre la tabla; se para en la fila del contexto, lee el número, elige, desliza la ventana y repite. El HÉROE es la lente saltando de fila. Paso a paso (Bar-v2 readable pacing).",
            data: "ngramData generateLocal + la fila real por paso",
            status: "build",
            hero: true,
        },
    },
    {
        id: "s3-battle",
        section: "§3 · Lo que has construido",
        priorKnowledge: "Sabe cómo escribe (leer de la tabla). Construyó tablas de varios tamaños.",
        newIdea: "Misma semilla, una letra más de memoria por columna: de sopa de letras a casi-frases. El salto se SIENTE.",
        question: "¿De verdad escribe mejor con más memoria?",
        setsUp: "El TRIUNFO. Y justo detrás la tentación «¿por qué no subir n para siempre?».",
        tone: "Showpiece, clímax. LA ÚNICA CELEBRACIÓN (pilar 13: celebrar antes del muro). «Mira lo que has construido».",
        copyNs: "ngramNarrative.v3.s3.battle",
        widget: {
            component: "LookWhatYouBuilt",
            archetype: "four columns (n=1..4) generate from the same seed, side by side",
            temperature: "showpiece",
            kitPieces: ["MarkedText", "PlayButton/GhostButton", "Tabs", "CaptionLine"],
            mechanic: "misma semilla, cuatro n; genera EN LOCAL con backoff; reveal escalonado tipo máquina de escribir; cada columna etiqueta su legibilidad.",
            data: "ngramData.generateLocal n=1..4 (local, real counts)",
            status: "rework", // from v1 NgramBattle (mostly there)
            hero: true,
        },
    },
    {
        id: "s4-zoom",
        section: "§4 · Hasta dónde llega",
        priorKnowledge: "Más memoria escribe mejor; el lector quiere subir n sin parar.",
        newIdea: "Cada letra ×27 las filas posibles → la tabla es ASTRONÓMICA. Asombro de tamaño, no fallo.",
        question: "¿Por qué no n=10, n=100 entonces?",
        setsUp: "Una tabla descomunal → ¿de dónde sale tanto texto para llenarla?",
        tone: "ASOMBRO PURO de tamaño (el gate prohíbe meter aquí el vacío: eso es §5). Vértigo, no derrota.",
        copyNs: "ngramNarrative.v3.s4.zoom",
        widget: {
            component: "ExplosionZoom",
            archetype: "recursive drill-down/zoom-out that never finds an edge; each cell holds the previous whole grid",
            temperature: "showpiece",
            kitPieces: ["heat", "Readout", "CaptionLine", "PlayButton/GhostButton"],
            mechanic: "el lector sube n y la cámara se aleja ×27 por paso; readout en TAMAÑO («la tabla entera es ×N lo que cabe en pantalla», NO «% que falta»). Madriguera: clic en una celda para bajar. El HÉROE es el descenso sin fondo.",
            data: "matemática real 27^(n-1) (vocab 27)",
            status: "build",
            hero: true,
        },
    },
    {
        id: "s4-firehose",
        section: "§4 · Hasta dónde llega",
        priorKnowledge: "La tabla es astronómicamente grande.",
        newIdea: "Es tan inmensa que por muchos libros que viertas apenas se inmuta. Sentir la CANTIDAD de texto.",
        question: "¿Y si le doy muchísimo más texto?",
        setsUp: "Una tabla descomunal y un océano de datos que no la mueve → ponla a prueba con algo nuevo.",
        tone: "Showpiece sensorial (A7.6/A10.3): libros consumiéndose, contador disparado. Asombro, no aún el muro.",
        copyNs: "ngramNarrative.v3.s4.firehose",
        widget: {
            component: "BookFirehose",
            archetype: "a torrent of real text pours/accelerates/blurs; the books-read counter rockets",
            temperature: "showpiece",
            kitPieces: ["ParchmentReader", "CountUpNumber", "Readout", "CaptionLine"],
            mechanic: "el lector abre el grifo; caen libros enteros cada vez más rápido (borrón), el contador de letras se dispara a miles de millones, y la tabla apenas se mueve: le cabe muchísimo más.",
            data: "ngramData tamaño real del corpus + 27^(n-1); ritmo de llenado honesto (etiquetado)",
            status: "build",
            hero: true,
        },
    },
    {
        id: "s5-mute",
        section: "§5 · El hueco",
        priorKnowledge: "La tabla es descomunal y ni un océano de texto la llena.",
        newIdea: "Casi toda está vacía; un contexto nuevo (o un typo, una letra de diferencia) cae en un hueco y la máquina se queda MUDA. No generaliza.",
        question: "¿Qué hace ante algo que no vio, aunque sea casi idéntico a algo que sí?",
        setsUp: "La máquina no entiende «parecido» → hace falta otra cosa (el puente).",
        tone: "EL ÚNICO MURO. El vacío se descubre AQUÍ (asomarse a los huecos) como CAUSA del mute. Bookend de §1 (la fila vuelve plana). Lo rompe el lector con sus manos.",
        copyNs: "ngramNarrative.v3.s5.mute",
        widget: {
            component: "MuteSlot",
            archetype: "confident bet craters to nothing when the reader changes one letter; peek → the table is mostly empty",
            temperature: "quiet",
            kitPieces: ["MarkedText", "HonestBar", "FixedAlphabetRow", "heat", "Verdict", "CaptionLine"],
            mechanic: "el lector escribe algo común (apuesta segura) y cambia una letra → cae en celda vacía → muda; al asomarse al vecindario ve casi todo negro (sparsity = la causa). Consolida unseen+typo+sparsity. Madriguera: pasar por los ceros.",
            data: "ngramData scanContext (visto/no visto) + diagnostics (sparsity) reales",
            status: "build",
            hero: true,
        },
    },
    {
        id: "s6-progress",
        section: "§6 · El puente",
        priorKnowledge: "El conteo con contexto tiene un techo: no generaliza.",
        newIdea: "Aun con su techo, has llegado lejísimos: de cabezazos al teclado a palabras de verdad, solo contando.",
        question: "—",
        setsUp: "Reconocer el logro antes de pasar el testigo (pilar 13/14).",
        tone: "Showpiece de progreso, esperanzador. Mira de dónde vienes.",
        copyNs: "ngramNarrative.v3.s6.progress",
        widget: {
            component: "Progression",
            archetype: "three samples of the same machine across the chapter: keyboard-mashing → syllables → words",
            temperature: "showpiece",
            kitPieces: ["MarkedText", "Tabs", "CaptionLine"],
            mechanic: "tres muestras reales de generación (n=1 / bigram / n=4) lado a lado en el tiempo: la misma idea, contar, creciendo.",
            data: "ngramData.generateLocal en tres niveles (real)",
            status: "build",
        },
    },
    {
        id: "s6-limit",
        section: "§6 · El puente",
        priorKnowledge: "El conteo llega a escribir bien, pero no generaliza.",
        newIdea: "Hasta un modelo grande trata «gato» y «perro» como islas sin relación. Le falta entender que se parecen.",
        question: "¿Y si la máquina entendiera que contextos parecidos se comportan parecido?",
        setsUp: "Eso ya no se consigue contando → redes neuronales (capítulo siguiente).",
        tone: "El límite mostrado CON la buena máquina (A11). La grieta se ve (no se cuenta), el lector reacciona. Puente.",
        copyNs: "ngramNarrative.v3.s6.limit",
        widget: {
            component: "BigModelLimit",
            archetype: "a strong model writes a near-convincing paragraph; then it places «cat»/«dog» as unrelated, far apart",
            temperature: "quiet",
            kitPieces: ["MarkedText/chips", "CaptionLine", "PlayButton/GhostButton"],
            mechanic: "muestra un párrafo decente y luego coloca palabras parecidas como IDs sin relación (lejos); un toggle insinúa cómo se AGRUPARÍAN si entendiera similitud. Sin spoilear embeddings.",
            data: "ejemplos conceptuales fijos (sin números inventados)",
            status: "rework", // from v1 SimilarityBridge
        },
    },
    {
        id: "s6-history-fold",
        section: "§6 · plegable",
        priorKnowledge: "Acaba de ver el techo del conteo con contexto.",
        newIdea: "No es un juguete: contar trozos reinó ~50 años (voz, traducción, el autocompletar del móvil) bajo «no hay mejor dato que más dato».",
        question: "—",
        setsUp: "Contexto histórico en su beat (premio, saltable). Máx 1 plegable.",
        tone: "Historia opcional, fascinante y cierta (con una anécdota real, pendiente de afinar).",
        copyNs: "ngramNarrative.v3.history",
    },
    {
        id: "cta",
        section: "CTA",
        priorKnowledge: "El conteo tocó techo: explota, se vacía, no generaliza.",
        newIdea: "El siguiente paso no cuenta: aprende a tratar parecido lo que se parece. Redes neuronales.",
        question: "¿Y si la máquina pudiera entender que dos contextos se parecen?",
        setsUp: "Puente al capítulo de redes neuronales (/lab/neural-networks).",
        tone: "Cierre con oficio (pilar 17). «La era del conteo ha terminado, la del aprendizaje empieza».",
        copyNs: "ngramNarrative.v3.cta",
    },
];

/** Build the context packet a widget-builder must read before coding its beat (kills "pegado sin contexto"). */
export function contextPacket(beatId: string): { prior: Beat[]; current: Beat; next: Beat | null } | null {
    const i = NGRAM_SPINE.findIndex((b) => b.id === beatId);
    if (i < 0) return null;
    return {
        prior: NGRAM_SPINE.slice(0, i),
        current: NGRAM_SPINE[i],
        next: NGRAM_SPINE[i + 1] ?? null,
    };
}
