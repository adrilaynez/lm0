/**
 * ngramSpine — the structured narrative of the N-gram chapter (the "spine").
 *
 * Mirror of `bigramSpine.ts`: the SINGLE SOURCE OF TRUTH for *what each beat does and why it sits where
 * it sits*. It is the cure for the #1 failure ("a widget built pegado sin contexto"): every beat declares,
 * explicitly, what the reader knows entering it, the one new idea, the question that motivates it, and what
 * it hands to the next beat. Build a widget by reading its beat + the beats BEFORE it — never in isolation.
 *
 * Copy is NOT duplicated here: each beat points at its i18n namespace (`copyNs`, under `ngramNarrative.v2`
 * unless noted) so the prose stays single-sourced in `en.ts`/`es.ts`. This file carries the structure, the
 * cumulative state, and the widget spec; the dictionaries carry the words.
 *
 * Chapter goal: the reader, arriving from bigram's AMNESIA (the model only saw one letter back; «th»/«sh»/
 * «wh» looked identical), discovers that WIDENING THE CONTEXT WINDOW improves prediction — and then feels
 * the brutal price: the table explodes (~27^n), goes sparse (almost every context unseen), and never
 * generalizes (an unseen-but-near-identical context leaves the machine mute). That last failure is the
 * door to neural networks. Accent = AMBER, expressed with the SAME visual system as bigram (kit primitives,
 * tokens by role, typography, motion) under `[data-ngram-theme]`. Authorities: docs/bigram-motion-bible.md
 * (motion), narrative-guidelines.md (voice), src/features/lab/components/ngram/kit (the look).
 */

export type Temperature = "quiet" | "showpiece";
export type WidgetStatus = "done" | "rework" | "build" | "external"; // external = owned in another pass

export interface BeatWidget {
    /** Component name / file under components/ (or its kit usage). */
    component: string;
    /** The visual archetype — pick a distinct one per showpiece; do not render everything as bar/grid. */
    archetype: string;
    temperature: Temperature;
    /** Which kit primitives this widget should ASSEMBLE from (ngram/kit). */
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
    /** i18n namespace for this beat's prose (under ngramNarrative.v2 unless the string says otherwise). */
    copyNs: string;
    /** The interactive piece, if any (pure-prose beats omit it). */
    widget?: BeatWidget;
}

export const NGRAM_SPINE: Beat[] = [
    {
        id: "hero",
        section: "Hero",
        priorKnowledge: "Viene de bigram: contar pares, la matriz 27×27, el dado cargado, y la amnesia (sólo una letra atrás).",
        newIdea: "Hay un arreglo evidente para la amnesia: mirar más de una letra atrás. Eso es el n-grama (el bigrama era n=2).",
        question: "¿Y si la máquina pudiera mirar más de una letra atrás?",
        setsUp: "La promesa de ampliar la ventana de contexto.",
        tone: "Promesa grande que retoma el último golpe de bigram. Título enorme, subtítulo humano.",
        copyNs: "ngramNarrative.v2.hero",
    },
    {
        id: "s1-intro",
        section: "§1 · Mirar más atrás",
        priorKnowledge: "Bigram cerró en la amnesia: «th», «sh», «wh» le parecían iguales porque sólo veía la última letra.",
        newIdea: "El contexto es «lo que llevas escrito». Si le dejas mirar dos, tres, cuatro letras, deja de confundirlas.",
        question: "¿Y si en vez de la última letra mirara las dos o tres últimas?",
        setsUp: "El deseo de ver, en vivo, cuánto cambia la apuesta al darle más contexto.",
        tone: "Curiosidad. Callback honesto a «fli fla» (predijiste sin entender; la máquina también).",
        copyNs: "ngramNarrative.v2.intro",
    },
    {
        id: "s1-window",
        section: "§1 · Mirar más atrás",
        priorKnowledge: "El contexto puede ser más de una letra.",
        newIdea: "Con una sola letra la apuesta es casi un volado; con tres o cuatro, se vuelve casi segura.",
        question: "¿Cuánto ayuda de verdad mirar más atrás?",
        setsUp: "La intuición «más contexto = más certeza» → ¿cómo lo consigue la máquina, contando?",
        tone: "Descubrimiento. Juego de adivinar GENUINAMENTE difícil: una palabra rara letra a letra (con poca pista no se acierta; sólo el contexto tardío fuerza la respuesta). Pilar 10+11.",
        copyNs: "ngramNarrative.v2.window",
        widget: {
            component: "ContextWindow",
            archetype: "predict-the-next with a growing context window (1→4)",
            temperature: "quiet",
            kitPieces: ["ContextWindow", "HonestBar", "MarkedText", "CaptionLine", "PlayButton/GhostButton"],
            mechanic: "se revela el contexto letra a letra; con n=1 la distribución es plana (no se puede acertar), al ampliar a n=4 se concentra en una letra; el lector apuesta antes de revelar.",
            data: "SHAKESPEARE_TEXT (fragmento con palabra difícil) + ngramData counts n=1..4 (real)",
            status: "build",
        },
    },
    {
        id: "s2-lead",
        section: "§2 · Contar con contexto",
        priorKnowledge: "Más contexto ayuda; pero ¿cómo lo aprende la máquina?",
        newIdea: "Es el MISMO truco de bigram: contar. Sólo cambia la llave de la fila: ya no es la última letra, son las últimas dos.",
        question: "¿Cómo guarda «lo que sigue a TH» en vez de «lo que sigue a H»?",
        setsUp: "Contar tríos (o n-tuplas) en vez de pares.",
        tone: "Reconocimiento: el método ya lo conoce. No hay magia nueva, sólo una llave más larga.",
        copyNs: "ngramNarrative.v2.s2",
    },
    {
        id: "s2-counter",
        section: "§2 · Contar con contexto",
        priorKnowledge: "La fila ahora se indexa por el contexto (las últimas dos letras).",
        newIdea: "Con un contexto más largo la distribución se AFILA: tras «h» viene de todo; tras «th» casi siempre «e».",
        question: "¿De verdad es más afilada?",
        setsUp: "Si afila tanto la apuesta, la generación entera debería mejorar → la batalla.",
        tone: "Tranquilo, manipulación directa. Reusa la «t»/«h» que ya conoce de bigram (continuidad C2).",
        copyNs: "ngramNarrative.v2.counter",
        widget: {
            component: "ContextCounter",
            archetype: "read the book → row keyed by 2-char context; sharp vs the wide bigram row",
            temperature: "showpiece",
            kitPieces: ["ParchmentReader", "FixedAlphabetRow", "Readout", "heat", "MarkedText", "CaptionLine"],
            mechanic: "lee el libro contando «lo que sigue a TH»; la fila resultante es estrecha (una columna domina), frente a la fila ancha de «H» del bigrama.",
            data: "ngramData: counts n=2 (fila «h») vs n=3 (fila «th») reales sobre Shakespeare",
            status: "build",
        },
    },
    {
        id: "s3-battle",
        section: "§3 · El salto se siente",
        priorKnowledge: "Contexto más largo = distribución más afilada por letra.",
        newIdea: "Encendidas las cuatro a la vez (n=1..4), el texto pasa de galimatías a casi-palabras. El salto se SIENTE.",
        question: "¿Y si las dejamos escribir?",
        setsUp: "El triunfo, y justo detrás la pregunta «¿por qué no subir n para siempre?».",
        tone: "Showpiece, clímax. Humor: n=1 va con tres cafés; n=4 casi sobrio.",
        copyNs: "ngramNarrative.v2.battle",
        widget: {
            component: "NgramBattle",
            archetype: "four columns (n=1..4) generate from the same seed, side by side",
            temperature: "showpiece",
            kitPieces: ["MarkedText", "PlayButton/GhostButton", "Tabs", "CaptionLine"],
            mechanic: "misma semilla, cuatro n; genera EN LOCAL con backoff; reveal escalonado tipo máquina de escribir; cada columna etiqueta su legibilidad.",
            data: "ngramData.generateLocal(seed, len, temp, n) n=1..4 (local, real counts)",
            status: "rework", // from NgramGenerationBattle: local data + kit + amber
        },
    },
    {
        id: "s4-explosion",
        section: "§4 · El coste",
        priorKnowledge: "Más n = mejor; el lector quiere subir n sin límite.",
        newIdea: "Cada letra de contexto multiplica por 27 el número de filas posibles → ~27^n. La tabla explota.",
        question: "¿Por qué no n=10, n=100 entonces?",
        setsUp: "Una tabla gigantesca… pero ¿se llega a llenar?",
        tone: "Showpiece: empieza el muro. Un número que trepa hasta lo absurdo.",
        copyNs: "ngramNarrative.v2.explosion",
        widget: {
            component: "ContextExplosion",
            archetype: "the count of possible rows climbs 27 → 729 → 19,683 → 531,441 …",
            temperature: "showpiece",
            kitPieces: ["ExplosionGrid", "Readout", "CountUpNumber", "heat", "CaptionLine"],
            mechanic: "avanza n; el recuento de contextos posibles trepa con el idioma de conteo; una rejilla que se multiplica visualiza el ×27 por paso.",
            data: "matemática real 27^(n-1) (vocab 27 = espacio + a-z)",
            status: "build",
        },
    },
    {
        id: "s5-sparsity",
        section: "§5 · El muro",
        priorKnowledge: "La tabla posible es gigante (27^n).",
        newIdea: "De esos cientos de miles de contextos, casi ninguno aparece en el corpus. La tabla está casi vacía.",
        question: "¿Se llena esa tabla si lees muchísimo?",
        setsUp: "Si está vacía, ¿qué pasa con un contexto que nunca viste?",
        tone: "Showpiece detective; la decepción asoma. Números reales, honestos.",
        copyNs: "ngramNarrative.v2.sparsity",
        widget: {
            component: "SparsityView",
            archetype: "grid of possible contexts, overwhelmingly empty; observed vs space",
            temperature: "showpiece",
            kitPieces: ["heat", "FixedAlphabetRow/grid", "Readout", "CaptionLine"],
            mechanic: "rejilla de contextos posibles; los observados se encienden (calor real), el resto queda negro; hover → «visto N veces» o «nunca».",
            data: "ngramData diagnostics reales: observedContexts vs contextSpace (sparsity) para n=2..4",
            status: "build",
        },
    },
    {
        id: "s5-infinite",
        section: "§5 · El muro",
        priorKnowledge: "La tabla real está casi vacía (sparsity sobre el corpus).",
        newIdea: "No se arregla con más datos: para n alto, por mucho texto que leas, la tabla sigue casi vacía.",
        question: "¿Y si entreno con MUCHÍSIMO más texto, hasta llenarla?",
        setsUp: "El límite es de diseño, no de esfuerzo → la pregunta pasa a qué hace ante una casilla vacía.",
        tone: "Tranquilo, manipulación directa. La esperanza de «más datos» se apaga con honestidad (pilar 15).",
        copyNs: "ngramNarrative.v2.infinite",
        widget: {
            component: "InfiniteTable",
            archetype: "slider over training-data size → fill-% per n; high-n stays empty",
            temperature: "quiet",
            kitPieces: ["FixedAlphabetRow/bars", "Readout", "CaptionLine"],
            mechanic: "subes los datos (mil → millón → billón); n bajo se llena, n alto sigue casi vacío por mucho que subas.",
            data: "modelo de llenado honesto (coupon-collector), etiquetado como aproximación; 27^(n-1)",
            status: "rework", // from InfiniteTableThoughtExperiment: kit + amber
        },
    },
    {
        id: "s6-unseen",
        section: "§6 · No generaliza",
        priorKnowledge: "Casi todos los contextos posibles están vacíos, y ni con más datos se llenan.",
        newIdea: "Un contexto no visto, aunque sea casi idéntico a uno que sí vio, deja a la máquina muda. No generaliza.",
        question: "¿Y si el contexto es nuevo pero parecidísimo a uno conocido?",
        setsUp: "La máquina no entiende «parecido» → necesita algo que generalice.",
        tone: "Vive la decepción. Humor seco. Cierra el círculo: predijo sin entender, y ahora ni predice.",
        copyNs: "ngramNarrative.v2.unseen",
        widget: {
            component: "UnseenContext",
            archetype: "two near-identical contexts: one seen (confident), one unseen (mute)",
            temperature: "quiet",
            kitPieces: ["MarkedText", "HonestBar", "Verdict", "CaptionLine"],
            mechanic: "un contexto visto da apuesta segura; cambiar una sola letra a un contexto no visto deja la apuesta en nada (sin datos).",
            data: "ngramData real: el contexto existe / no existe en los conteos",
            status: "build",
        },
    },
    {
        id: "s6-typo",
        section: "§6 · No generaliza",
        priorKnowledge: "Un contexto no visto deja a la máquina muda (demo controlada de una letra cambiada).",
        newIdea: "No hace falta rebuscar: un typo cotidiano cualquiera también la rompe, y lo rompes TÚ en vivo.",
        question: "¿Y si lo que escribo no es una palabra rara sino solo un dedo torpe?",
        setsUp: "La decepción se vuelve visceral y propia → la raíz del fallo (no entiende «parecido»).",
        tone: "Vive el fracaso con las manos. Humor seco: rompes el modelo escribiendo cualquier cosa.",
        copyNs: "ngramNarrative.v2.typo",
        widget: {
            component: "TypoBreaker",
            archetype: "free text input → confidence craters on anything unseen",
            temperature: "quiet",
            kitPieces: ["MarkedText", "HonestBar", "CaptionLine"],
            mechanic: "escribes lo que quieras; algo común da confianza, un typo/palabra inventada la hunde a la del azar puro.",
            data: "ngramData real (subcadenas vistas / no vistas)",
            status: "rework", // from TypoWordBreaker: real data + kit
        },
    },
    {
        id: "s7-bridge",
        section: "§7 · El puente",
        priorKnowledge: "El n-grama no generaliza a contextos no vistos (ni los raros ni tus typos).",
        newIdea: "Para la máquina «cat» y «dog» son etiquetas sin relación; le falta entender que se parecen.",
        question: "¿Y si entendiera que contextos parecidos deberían comportarse parecido?",
        setsUp: "Eso es justo lo que hacen las redes neuronales → CTA al siguiente capítulo.",
        tone: "Puente esperanzador. Nueva curiosidad tras la decepción.",
        copyNs: "ngramNarrative.v2.bridge",
        widget: {
            component: "SimilarityBridge",
            archetype: "similar words as isolated IDs → toggle → they cluster",
            temperature: "quiet",
            kitPieces: ["MarkedText/chips", "CaptionLine", "PlayButton/GhostButton"],
            mechanic: "palabras parecidas mostradas como IDs aislados sin relación; un toggle revela cómo se AGRUPARÍAN si la máquina entendiera similitud.",
            data: "ejemplos conceptuales fijos (sin números inventados)",
            status: "rework", // from SimilarityBlindSpot: kit + amber
        },
    },
    {
        id: "s7-history-fold",
        section: "§7 · plegable",
        priorKnowledge: "Acaba de ver el techo del conteo con contexto.",
        newIdea: "Los n-gramas no son un juguete: reinaron de verdad (reconocimiento de voz / traducción) durante décadas con la filosofía «no hay mejor dato que más dato».",
        question: "—",
        setsUp: "Contexto histórico en su beat (premio, saltable).",
        tone: "Historia opcional, fascinante y cierta. Máx 1 plegable en el capítulo.",
        copyNs: "ngramNarrative.v2.history",
    },
    {
        id: "cta",
        section: "CTA",
        priorKnowledge: "El conteo tocó techo: explota, se vacía, no generaliza.",
        newIdea: "El siguiente paso no cuenta: aprende a representar el parecido. Redes neuronales.",
        question: "¿Y si la máquina pudiera entender que dos contextos se parecen?",
        setsUp: "Puente al capítulo de redes neuronales (/lab/neural-networks).",
        tone: "Cierre con oficio (pilar 17). Esperanza, no botón genérico.",
        copyNs: "ngramNarrative.v2.cta",
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
