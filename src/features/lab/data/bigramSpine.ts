/**
 * bigramSpine — the structured narrative of the Bigram chapter (the "spine").
 *
 * This is the SINGLE SOURCE OF TRUTH for *what each beat does and why it sits where it sits*. It is the
 * cure for the #1 failure ("a widget built pegado sin contexto"): every beat declares, explicitly, what the
 * reader knows entering it, the one new idea, the question that motivates it, and what it hands to the next
 * beat. Build a widget by reading its beat + the beats BEFORE it — never in isolation.
 *
 * Copy is NOT duplicated here: each beat points at its i18n namespace (`copyNs`, under `bigramNarrative.v2`
 * unless noted) so the prose stays single-sourced in `en.ts`/`es.ts`. This file carries the structure,
 * the cumulative state, and the widget spec; the dictionaries carry the words.
 *
 * Chapter goal: the reader feels they built a REAL language model from scratch, only by counting —
 * predict → count → the row → the table → sample → write — landing on the amnesia that opens the n-gram.
 * Humor (the heartless machine that still writes) runs throughout. Authorities: docs/bigram-motion-bible.md
 * (motion), bigram-narrative-guidelines.md (voice), src/features/lab/components/bigram/kit (the look).
 */

export type Temperature = "quiet" | "showpiece";
export type WidgetStatus = "done" | "rework" | "build" | "external"; // external = owned in another pass

export interface BeatWidget {
    /** Component name / file under components/ (or its kit usage). */
    component: string;
    /** The visual archetype — pick a distinct one per showpiece; do not render everything as bar/grid. */
    archetype: string;
    temperature: Temperature;
    /** Which kit primitives this widget should ASSEMBLE from (bigram/kit). */
    kitPieces: string[];
    /** The ONE unique mechanic, in words (everything else comes from the kit). */
    mechanic: string;
    /** The real data module/values it must use (never faked). */
    data: string;
    status: WidgetStatus;
}

export interface Beat {
    id: string;
    section: string;
    /** What the reader ALREADY knows entering this beat (the cumulative state). */
    priorKnowledge: string;
    /** The ONE new idea this beat adds. A widget must teach exactly this — no more, no less. */
    newIdea: string;
    /** The reader's "¿y si?" that this beat answers (and/or the question it leaves for the next). */
    question: string;
    /** What this beat hands to the next (its payoff == the next beat's premise). */
    setsUp: string;
    /** Emotional beat + where the humor lands. */
    tone: string;
    /** i18n namespace for this beat's prose (under bigramNarrative.v2 unless the string says otherwise). */
    copyNs: string;
    /** The interactive piece, if any (pure-prose beats omit it). */
    widget?: BeatWidget;
}

export const BIGRAM_SPINE: Beat[] = [
    {
        id: "hero",
        section: "Hero",
        priorKnowledge: "Nada. Primer contacto con el capítulo.",
        newIdea: "Vamos a enseñar a escribir a una máquina, desde cero, solo contando.",
        question: "¿Se puede enseñar a escribir a algo que nunca ha vivido?",
        setsUp: "La tensión: para una caja de cables, las palabras no significan nada.",
        tone: "Promesa tranquila y grande. Título enorme, subtítulo humano (no retórico).",
        copyNs: "bigramNarrative.v2.hero",
    },
    {
        id: "s1-intro",
        section: "§1 · El truco: predecir",
        priorKnowledge: "Solo la promesa del hero.",
        newIdea: "Aprendemos sin manual, viviendo; la máquina jamás vivió → parece imposible que escriba.",
        question: "¿Cómo le enseñas a escribir a una máquina que no entiende el mundo?",
        setsUp: "La necesidad de un experimento que rompa la imposibilidad.",
        tone: "Frame de infancia, cálido. Humor: «manzana» no es dulce ni roja para una caja de cables.",
        copyNs: "bigramNarrative.v2.intro",
    },
    {
        id: "s1-vis1",
        section: "§1 · El truco: predecir",
        priorKnowledge: "El problema imposible (la máquina no entiende nada).",
        newIdea: "Predecir NO requiere entender: rellenas «Fli fli fla, fli fli ___» sin saber qué significa.",
        question: "¿Y si predecir no necesitara comprender?",
        setsUp: "El reencuadre: los ingenieros cambiaron las reglas — predecir en vez de reflexionar.",
        tone: "Descubrimiento (lo nota el lector, no se lo cuentan). Keystone «fli fla». Remate seco.",
        copyNs: "bigramNarrative.v2.fillBlank",
        widget: {
            component: "FillTheBlank",
            archetype: "fill-in-the-blank game (3 screens)",
            temperature: "quiet",
            kitPieces: ["MarkedText (optional)", "CaptionLine", "PlayButton/GhostButton"],
            mechanic: "3 pantallas; la última quita el significado y deja solo la estructura (fli fla).",
            data: "frases fijas en i18n fillBlank.screens (array, import directo del dict)",
            status: "done",
        },
    },
    {
        id: "s1-vis1_5",
        section: "§1 · El truco: predecir",
        priorKnowledge: "Predecir no necesita entender; el campo cambió a predecir.",
        newIdea: "El objetivo concreto: das una letra y la máquina apuesta por la siguiente.",
        question: "Parece magia… ¿cómo se construye esto desde cero si no sabe leer?",
        setsUp: "El deseo de la mecánica → §2 (contar patrones).",
        tone: "Crea deseo. Sin órdenes: el hueco invita a teclear.",
        copyNs: "bigramNarrative.v2.goalIntro",
        widget: {
            component: "HeroAutoComplete",
            archetype: "type-a-letter → prediction preview",
            temperature: "quiet",
            kitPieces: ["HonestBar", "CountUpNumber", "CaptionLine"],
            mechanic: "tecleas una letra → muestra la apuesta por la siguiente (preview coherente).",
            data: "MATRIX_27 / bigramCorpus (real)",
            status: "rework", // light: soften imperative copy, coherent preview
        },
    },
    {
        id: "s2-lead",
        section: "§2 · A la caza del patrón (la t)",
        priorKnowledge: "El objetivo (predecir la siguiente letra) y el deseo de la mecánica.",
        newIdea: "El lenguaje no es caos: esconde un patrón (tras la q casi siempre u) que nadie te enseñó como regla.",
        question: "¿Cómo saca una máquina ese patrón?",
        setsUp: "Mirar una frase y fijarse en qué letra va con cuál.",
        tone: "Reconocimiento («tu cerebro lo absorbió leyendo»).",
        copyNs: "bigramNarrative.v2.s2",
    },
    {
        id: "s2-vis2",
        section: "§2 · A la caza del patrón (la t)",
        priorKnowledge: "El lenguaje esconde un patrón contable.",
        newIdea: "Recorres una frase de dos en dos; los pares que se REPITEN son el patrón.",
        question: "¿Qué par se repite más?",
        setsUp: "Centrarse en UNA letra para entenderlo a fondo: la «t».",
        tone: "Tranquilo, manipulación directa. Una frase ancla sencilla.",
        copyNs: "bigramNarrative.v2.s2",
        widget: {
            component: "PairHighlighter",
            archetype: "step-through pairs + repeat pills",
            temperature: "quiet",
            kitPieces: ["MarkedText", "CaptionLine", "PlayButton/GhostButton"],
            mechanic: "avanza par a par; los pares repetidos se tiñen (acento).",
            data: "ANCHOR_SENTENCE (bigramCorpora)",
            status: "rework", // light: adopt MarkedText from kit
        },
    },
    {
        id: "s2-vis3",
        section: "§2 · A la caza del patrón (la t)",
        priorKnowledge: "Buscar pares; foco en la «t».",
        newIdea: "La misma letra, distinto texto → distinta «mejor compañera». Con poco texto, el conteo MIENTE.",
        question: "¿Y si el texto fuera distinto? ¿Y si fuera enorme?",
        setsUp: "La necesidad de un texto gigante para aprender las reglas de verdad.",
        tone: "Descubrimiento por comparación (el ganador cambia al cambiar de pestaña).",
        copyNs: "bigramNarrative.v2.isolateT",
        widget: {
            component: "IsolateT",
            archetype: "scan one phrase, tally what follows «t», winner flips per tab",
            temperature: "quiet",
            kitPieces: ["MarkedText", "Tabs", "CaptionLine", "Readout/bars"],
            mechanic: "3 frases largas; escaneo gradual marcando cada «t» + su siguiente; el ganador cambia.",
            data: "3 frases verificadas (ganador h / ␣ / o)",
            status: "done",
        },
    },
    {
        id: "s2-vis4",
        section: "§2 · A la caza del patrón (la t)",
        priorKnowledge: "Un texto corto miente; hace falta uno enorme.",
        newIdea: "Leyendo un libro entero y contando, «lo que sigue a la t» se guarda en UNA fila de posición fija; gana «h». Eso es entrenar.",
        question: "¿Qué sale si lee de verdad muchísimo?",
        setsUp: "La FILA (posición fija) como objeto que luego se apila en la matriz; «datos de entrenamiento».",
        tone: "Showpiece tranquilo: leer en modo papiro, lento al principio, luego corre. Humor: aprende de Shakespeare → habla como hace 400 años.",
        copyNs: "bigramNarrative.v2.chaosOrder (+ s2.afterShakespeare, s2.honestyNote)",
        widget: {
            component: "RowTally",
            archetype: "papyrus reader → fixed 27-slot row (bars + heat)",
            temperature: "showpiece",
            kitPieces: ["ParchmentReader", "FixedAlphabetRow", "Readout", "MarkedText", "PlayButton/GhostButton", "CaptionLine"],
            mechanic: "lectura lenta marcando t+siguiente (papiro) → corre el libro → fila fija de 27 con barras+calor.",
            data: "SHAKESPEARE_TEXT (300K) + bigramShakespeare27 (t-row real)",
            status: "done",
        },
    },
    {
        id: "s2-markov",
        section: "§2 · A la caza del patrón (la t) · plegable",
        priorKnowledge: "Acaba de contar pares a mano (en su cabeza) y ver una tabla de probabilidades.",
        newIdea: "Esto ya se hizo en 1913 (Márkov, a mano, por una rabieta) — y de ahí salieron las cadenas de Márkov.",
        question: "—",
        setsUp: "Teaser de la «falta de memoria» (sin spoilear que es el fallo del §5).",
        tone: "Historia opcional, con humor («Andrés el Iracundo»). Larga, saltable.",
        copyNs: "bigramNarrative.v2.markov (paras[] — import directo del dict)",
    },
    {
        id: "s3-vis5",
        section: "§3 · Demasiado predecible (aún sobre la t)",
        priorKnowledge: "Tiene la fila de conteos de la «t»; «h» gana, el espacio va segundo.",
        newIdea: "Conteos brutos no sirven para escribir: se dividen por el total → probabilidades (suman 100%).",
        question: "¿Cómo paso de «7.071 veces» a una apuesta?",
        setsUp: "Porcentajes sobre la mesa → la decisión de cómo elegir.",
        tone: "Tranquilo. La MISMA fila, ahora normalizada, siempre presente.",
        copyNs: "bigramNarrative.v2.normalizationViz (+ s5.lead, s5.lead2, s5.afterNormalization)",
        widget: {
            component: "NormalizationVisualizer",
            archetype: "the persistent t-row → counts ÷ total → %",
            temperature: "quiet",
            kitPieces: ["FixedAlphabetRow/Readout", "Verdict", "CaptionLine"],
            mechanic: "la fila de la «t» (grande, persistente) se divide por su total → %.",
            data: "bigramShakespeare27 (t-row: total 19763)",
            status: "external", // terminado en otro chat — NO tocar sin confirmar
        },
    },
    {
        id: "s3-vis6",
        section: "§3 · Demasiado predecible (aún sobre la t)",
        priorKnowledge: "Tiene porcentajes por letra.",
        newIdea: "Elegir SIEMPRE el máximo → bucle robótico: «the the the» para siempre.",
        question: "¿Y si voy siempre a lo más probable?",
        setsUp: "La necesidad de azar (pero que respete los %).",
        tone: "Vive el fracaso. Humor: disco rayado.",
        copyNs: "bigramNarrative.v2.alwaysMaxLoop (+ s5.choosePrompt, s5.afterAlwaysMax)",
        widget: {
            component: "AlwaysMaxLoop",
            archetype: "typewriter that locks into «the the the»",
            temperature: "quiet",
            kitPieces: ["MarkedText", "CaptionLine", "PlayButton/GhostButton", "Readout"],
            mechanic: "genera por argmax desde «t» → t→h→e→␣→t… se atasca.",
            data: "bigramShakespeare27 (matriz colapsada → «the the the»)",
            status: "external",
        },
    },
    {
        id: "s3-vis7",
        section: "§3 · Demasiado predecible (aún sobre la t)",
        priorKnowledge: "El máximo siempre = bucle muerto.",
        newIdea: "Un dado trucado (muchas caras «h», pocas «o») respeta los % y rompe el bucle.",
        question: "¿Y si hacemos esto con TODAS las letras a la vez?",
        setsUp: "Generalizar de una fila a todas → la matriz (§4).",
        tone: "El arreglo: caos controlado. Tiene «sistema completo para la t».",
        copyNs: "bigramNarrative.v2.loadedDie (+ s5.dicePrompt, s5.toMatrix)",
        widget: {
            component: "LoadedDie",
            archetype: "weighted die/wheel → varied text",
            temperature: "quiet",
            kitPieces: ["CaptionLine", "PlayButton/GhostButton", "MarkedText"],
            mechanic: "muestrea de la fila respetando los % → casi siempre lo probable, a veces sorprende.",
            data: "bigramShakespeare27 (sampleRow)",
            status: "external",
        },
    },
    {
        id: "s4-vis8",
        section: "§4 · Nace la matriz",
        priorKnowledge: "Tiene el truco completo (contar → % → elegir con azar) para UNA letra.",
        newIdea: "Cada letra nueva crea una nueva fila de 27 columnas; apilarlas ES la matriz (el bigrama, natural).",
        question: "¿Cómo hago lo mismo para todas las letras?",
        setsUp: "La cuadrícula como «todas las filas a la vez» → hundir la flota.",
        tone: "Tranquilo, revelación de construcción. Metáfora hundir-la-flota.",
        copyNs: "bigramNarrative.v2.s3 (rowByRowReveal, rowByRowName)",
        widget: {
            component: "TinyMatrixExample",
            archetype: "stack a 27-col row per new letter → small grid",
            temperature: "quiet",
            kitPieces: ["FixedAlphabetRow/heat", "CaptionLine"],
            mechanic: "lee una frase mínima; cada letra nueva añade una fila de 27 → cuadrícula.",
            data: "frase corta (HOLA MUNDO-style) contada en vivo",
            status: "rework", // new letter → new 27-col row (lo que pidió el usuario)
        },
    },
    {
        id: "s4-vis9",
        section: "§4 · Nace la matriz",
        priorKnowledge: "Apilar filas = matriz; sabe leer una fila.",
        newIdea: "Leyendo Shakespeare, la matriz 27×27 crece y se calienta sola.",
        question: "¿Y si el mundo real no fuera solo minúsculas?",
        setsUp: "Mayúsculas, puntos, números → crecer a 92×92.",
        tone: "Showpiece: la matriz crece leyendo, sin parar (misma lengua de lectura que VIS4).",
        copyNs: "bigramNarrative.v2.growingMatrix (+ s4.charsetPrompt)",
        widget: {
            component: "GrowingMatrix27",
            archetype: "matrix that grows while reading (heatmap)",
            temperature: "showpiece",
            kitPieces: ["heat", "ParchmentReader (coherencia con VIS4)", "CaptionLine"],
            mechanic: "lee y va añadiendo filas/columnas; cada par calienta una casilla.",
            data: "bigramCorpus / MATRIX_27 (real)",
            status: "done",
        },
    },
    {
        id: "s4-vis10",
        section: "§4 · Nace la matriz",
        priorKnowledge: "Una matriz 27×27 caliente; el mundo real es más sucio.",
        newIdea: "La matriz 92×92 completa es el «código fuente» del lenguaje; las casillas vacías son reglas no escritas.",
        question: "¿Por qué hay zonas totalmente negras?",
        setsUp: "El detective: desierto de mayúsculas, rincón de la q, salto del punto → el modelo lo aprendió contando.",
        tone: "Showpiece detective. El lector se siente listo al descubrir las reglas.",
        copyNs: "bigramNarrative.v2.detective (+ s4.matrixGamePrompt)",
        widget: {
            component: "DetectiveMatrix",
            archetype: "huge zoomable heatmap + detective clues",
            temperature: "showpiece",
            kitPieces: ["heat", "CaptionLine"],
            mechanic: "matriz 92×92 con zoom/lente; clic → conteo real; pistas (desierto/q/punto).",
            data: "MATRIX_92 (real)",
            status: "rework", // dark contrast + zoom + size + verde (no rojo)
        },
    },
    {
        id: "s5-vis11",
        section: "§5 · ¡A escribir! y el techo",
        priorKnowledge: "Tiene la matriz completa (las reglas) + el dado.",
        newIdea: "Encender la máquina: salta de casilla en casilla y escribe sola. Parece un idioma de lejos, galimatías de cerca.",
        question: "¿Qué escribe?",
        setsUp: "El anticlímax honesto y la pregunta «¿por qué escribe tan mal?».",
        tone: "Clímax + anticlímax («niño de dos años con tres cafés… y es increíble»). Nombre «bigrama» en voz baja.",
        copyNs: "bigramNarrative.v2.s5 (writePrompt, playgroundPrompt) + disappointment + naming",
        widget: {
            component: "GenerationPlayground",
            archetype: "typewriter generating from the matrix",
            temperature: "showpiece",
            kitPieces: ["MarkedText", "PlayButton/GhostButton", "CaptionLine"],
            mechanic: "genera en LOCAL desde MATRIX_27 saltando con el dado (el backend está caído).",
            data: "MATRIX_27 (generación local)",
            status: "rework", // generar en local
        },
    },
    {
        id: "s5-shannon-fold",
        section: "§5 · plegable",
        priorKnowledge: "Acaba de medir/contar el lenguaje para escribir.",
        newIdea: "Shannon (1948) hizo justo esto para medir el lenguaje; fue de los primeros modelos.",
        question: "—",
        setsUp: "Contexto histórico, en su beat.",
        tone: "Historia opcional.",
        copyNs: "bigramNarrative.v2.shannon",
    },
    {
        id: "s5-blindness",
        section: "§5 · El defecto fatal",
        priorKnowledge: "La máquina escribe pero con galimatías; no sabe por qué.",
        newIdea: "Solo ve UNA letra atrás: «th», «sh», «wh» son lo mismo para ella. No se arregla con más datos; es el techo.",
        question: "¿Por qué no forma palabras con sentido?",
        setsUp: "La amnesia → la pregunta «¿y si viera más de una letra?».",
        tone: "Diagnóstico. Cierra el círculo (predijo sin entender, igual que tú con «fli fla»).",
        copyNs: "bigramNarrative.v2.s6 (lead, afterBlindness)",
        widget: {
            component: "ContextBlindnessDemo",
            archetype: "change the prefix, the prediction doesn't move",
            temperature: "quiet",
            kitPieces: ["MarkedText", "HonestBar", "CaptionLine"],
            mechanic: "cambias «th»/«sh»/«wh» y la predicción no cambia: solo mira la última letra.",
            data: "MATRIX_27 (real)",
            status: "done",
        },
    },
    {
        id: "s5-ladder",
        section: "§5 · Más contexto → n-gram",
        priorKnowledge: "El modelo es ciego: solo una letra atrás.",
        newIdea: "Con más contexto, mejor predicción — y eso ya es otro modelo (el n-gram).",
        question: "¿Y si le enseñamos a mirar dos, tres, cinco letras?",
        setsUp: "Puente al capítulo n-gram (la CTA).",
        tone: "Juega tú primero; lo notas tú. Puente esperanzador.",
        copyNs: "bigramNarrative.v2.s6 (ladderPrompt, afterLadder, ladderCoda)",
        widget: {
            component: "ShannonContextLadder",
            archetype: "guess-the-next with growing context",
            temperature: "quiet",
            kitPieces: ["MarkedText", "CaptionLine", "PlayButton/GhostButton"],
            mechanic: "adivinas con 1 letra (a ciegas) vs 4 (casi seguro): más contexto, mejor.",
            data: "texto real",
            status: "done",
        },
    },
];

/** Build the context packet a widget-builder must read before coding its beat (kills "pegado sin contexto"). */
export function contextPacket(beatId: string): { prior: Beat[]; current: Beat; next: Beat | null } | null {
    const i = BIGRAM_SPINE.findIndex((b) => b.id === beatId);
    if (i < 0) return null;
    return {
        prior: BIGRAM_SPINE.slice(0, i),
        current: BIGRAM_SPINE[i],
        next: BIGRAM_SPINE[i + 1] ?? null,
    };
}
