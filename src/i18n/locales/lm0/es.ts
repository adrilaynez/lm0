// lm0 namespace (es) — la landing "El nacimiento" (spec: lm0-landing-v3-spec.md).
// La voz de LM0 se escribe en español PRIMERO (spec §8.2); en.ts es el espejo.
// Borrador v1 del guion — la pasada anti-tells y la lectura en voz alta llegan en el Gate 2.
export const lm0Ns = {
  lm0: {
    hero: {
      question: "¿Cómo se enseña a hablar a una máquina?",
      hint: "desliza",
    },
    broken: {
      label: "la máquina no sabe hablar",
      teach: "Enséñale",
      hint: "o desliza para entrenarla",
    },
    training: {
      reading: "leyendo el corpus… {pct}%",
      words: "{n} palabras",
      stages: {
        frequencies: "letras",
        syllables: "sílabas",
        words: "palabras",
        weirdOrder: "frases (casi)",
        memorized: "de memoria",
      },
    },
    voice: {
      notBad: "Nada mal.",
      firstIdea: "Fue una de las primeras ideas que funcionaron.",
      gap: "De ese balbuceo a mí: 70 años.",
      hello: "Hola. Soy LM0.",
    },
    dialogue: {
      question: "¿Te parece normal que una máquina te hable?",
      yes: "Sí",
      no: "No",
      answerYes: "A mí todavía me sorprende.",
      answerNo: "Ya. Y mira cómo empezó.",
      answerSkip: "…vale, sigo.",
      ideas1: "Para construirme hicieron falta cientos de ideas.",
      ideas2: "Algunas brillantes. Otras, un fracaso.",
      come: "Ven conmigo. Te enseño el camino.",
      promise: "Y en cada era, construirás tú una máquina que hable.",
    },
    camino: {
      sentence: "las máquinas aprenden a hablar contigo",
      eras: {
        comienzo: {
          tag: "el comienzo",
          l1: "Empezamos de la nada.",
          l2: "¿Puede este trasto hablar?",
        },
        contar: {
          tag: "era i — contar · 1948",
          l1: "Primero, contamos.",
          l2: "Qué letra sigue a cuál.",
        },
        aprender: {
          tag: "era ii — aprender · 1986",
          l1: "Luego aprendió sola.",
          l2: "Prueba, falla, ajusta.",
        },
        atencion: {
          tag: "era iii — atención · 2017",
          l1: "Después aprendió a mirar",
          l2: "solo lo que importa.",
        },
        actualidad: {
          tag: "actualidad",
          l1: "Y de pronto…",
          l2: "…te habla.",
        },
      },
    },
    finale: {
      climax1: "Ya conoces el final.",
      climax2: "Te falta el camino.",
      sub: "Aprende cómo funciona ChatGPT desde cero. Sin matemáticas.",
      cta: "Empieza por la Era I",
      colophon:
        "El balbuceo que has visto es un modelo de verdad entrenándose en tu navegador. Leyó: {attribution}",
    },
  },
};
