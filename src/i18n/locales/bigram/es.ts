// bigram namespace (es). Slice of the original i18n dictionary — see src/i18n/README.md.
export const bigram = {
  bigramNarrative: {
    hero: {
      eyebrow: "Capítulo 1 · La Era del Conteo",
      titlePrefix: "El Modelo",
      titleSuffix: "Bigrama",
      description:
        "En 1948, Claude Shannon hizo una apuesta: se podía predecir la siguiente letra de una frase simplemente contando qué letras suelen seguir a cuáles. Sin gramática. Sin comprensión. Solo conteo. En este capítulo, vas a poner esa apuesta a prueba.",
      autoCompleteHint: "Este modelo predice un carácter a la vez. Prueba a escribir.",
      readTime: "~10 min de lectura · 6 demos interactivas",
    },
    problem: {
      title: "Adivina la Letra que Falta",
      lead: "Empecemos con un juego. Ves una frase con una letra que falta — ¿puedes adivinar cuál es?",
      p1: "Acabas de hacer algo increíble: has ",
      p1Highlight: "predicho la siguiente letra",
      p2: " sin pensarlo. Tu cerebro usó las letras anteriores — el contexto — para hacer una suposición educada.",
      p3: "Pero esta es la pregunta que lo empezó todo:",
      quote: "¿Cómo podríamos enseñar a una máquina a hacer lo mismo?",
      p4: 'Un ordenador no puede "entender" el lenguaje. No puede leer. No sabe qué son las ',
      h1: "palabras",
      h2: "gramática",
      h3: "significado",
      p5: ". Solo conoce números. Así que necesitamos una estrategia tan simple que hasta una calculadora podría hacerla. Inventemos una juntos.",
      connector: ", o ",
      label: "El Desafío",
      heroAutoIntro:
        "Antes de empezar — prueba esto. Escribe cualquier letra abajo y mira qué pasa.",
      heroAutoLabel: "Interactivo · Escribe una Letra",
      heroAutoHint:
        "Esta mini-demo predice el siguiente carácter basándose en una sola letra. ¿Cómo lo sabe?",
      heroAutoBridge:
        "Acabas de ver una predicción. La máquina miró una letra y adivinó qué viene después. ¿Pero cómo? Vamos a descubrirlo.",
    },
    coreIdea: {
      label: "La Idea Más Simple",
      title: "¿Y Si Solo Contamos?",
      lead: "¿Y si hay un patrón oculto en cada texto jamás escrito? Veamos si puedes descubrirlo.",
      p1: "¿Y si miramos mucho texto y hacemos una sola pregunta: ",
      h1: "¿qué letra suele venir después de esta?",
      p2: " Eso es todo. Sin comprensión. Sin reglas gramaticales. Solo contar pares. Si 'e' sigue a 'h' 3.000 veces y 'a' sigue a 'h' 800 veces, entonces después de 'h' apostaríamos por 'e'. Acabamos de inventar algo — los lingüistas lo llaman bigrama.",
      discoveryBridge:
        "¿Te diste cuenta? Algunos pares aparecen una y otra vez — 'th', 'he', 'in', 'er'. No son aleatorios. Cada idioma tiene combinaciones de letras favoritas. ¿Y si los contáramos todos?",
      spaceCalloutTitle: "El Espacio También Es un Carácter",
      spaceCalloutText:
        "Quizás notaste espacios entre los pares. En este modelo, el espacio (␣) es simplemente otra letra del vocabulario — ayuda al modelo a aprender dónde empiezan y terminan las palabras.",
      namingBridge:
        "Lo que acabas de descubrir tiene nombre. Los lingüistas llaman a un par de dos caracteres consecutivos un ",
      namingEnd: ". La idea es vergonzosamente simple: contar pares y adivinar según los conteos.",
      formalTitle: "Más profundo: el nombre, la fórmula y la historia",
      formalP1:
        "El prefijo 'bi-' significa dos, y '-grama' viene del griego gramma (letra). Un bigrama es literalmente una unidad de dos letras. En NLP, el término se extiende a cualquier par de tokens consecutivos — caracteres, palabras o subpalabras. Andrey Markov formalizó este enfoque en 1913 cuando analizó las transiciones de letras en el Eugenio Oneguin de Pushkin — uno de los primeros modelos de lenguaje basados en datos de la historia.",
      etymologyBridge: "Ahora la matemática. La fórmula resulta ser exactamente lo que intuirías:",
      formulaCaption: "Probabilidad del carácter cₙ dado el carácter anterior cₙ₋₁",
      formalP2:
        "En castellano llano: cuenta cuántas veces ese par específico apareció en el texto de entrenamiento y divide por cuántas veces apareció el primer carácter en total. Esa proporción es la probabilidad.",
      formalP3:
        "Esto es una Estimación de Máxima Verosimilitud (MLE) — la forma más simple de convertir conteos en probabilidades. La misma matemática aparece en los pronósticos del tiempo ('llovíó 30 de 100 martes, así que P(lluvia|martes) = 30%') y los promedios de bateo. Nada exquisito.",
      caption: "El supuesto del Bigrama: la siguiente letra depende solo de la actual.",
      p3: "Es casi vergonzosamente simple. Pero funciona mejor de lo que esperarías.",
      calloutTitle: '¿Por qué "Bigrama"?',
      calloutP1: '"Bi" significa ',
      calloutH1: "dos",
      calloutP2:
        ". Un bigrama es un par de dos caracteres — el actual y el siguiente. El modelo mira pares, los cuenta, y usa esos conteos para adivinar. Ese es todo el algoritmo.",
    },
    mechanics: {
      label: "El Panorama Completo",
      title: "La Tabla de Transición",
      lead: "Tienes cientos de pares contados. ¿Pero dónde los guardas todos?",
      storageIntro:
        "Piénsalo: cada carácter del vocabulario podría ir seguido de cualquier otro carácter. Eso significa que para cada carácter inicial, necesitas un espacio para cada posible siguiente carácter. ¿Cuántos espacios son en total?",
      discoveryBridge:
        "Cada par tiene exactamente dos partes — la letra actual y la siguiente. ¿Y si los organizáramos en una cuadrícula?",
      bridgeQuote:
        "Filas = letra actual. Columnas = letra siguiente. Cada celda = cuántas veces vimos ese par.",
      bridgeP3: "Empecemos con algo pequeño — solo 5 caracteres — y veamos cómo queda esta tabla:",
      p1: "Obtendrías una tabla gigante — una ",
      h1: "matriz de transición",
      p2: ". Las filas son el carácter actual, las columnas el siguiente, y cada celda guarda cuántas veces apareció ese par. Es como una hoja de trucos completa para predecir letras.",
      p3: "La visualización de abajo muestra esta tabla entrenada con texto real. Las celdas más brillantes significan pares más frecuentes — patrones que el modelo descubrió contando.",
      fullMatrixBridge:
        "Ahora ampliemos la vista. La tabla 5×5 de arriba cubre solo un puñado de caracteres. La tabla real de abajo cubre los 96 caracteres ASCII imprimibles — entrenada con miles de oraciones. Las celdas más brillantes significan que el modelo vio ese par con más frecuencia.",
      dataSourceTitle: "¿De dónde vienen estos datos?",
      dataSourceP1:
        "Esta tabla se construyó escaneando un corpus de texto real (un ensayo de Paul Graham) carácter por carácter, contando cada par que encontró.",
      dataSourceP2:
        "Por ejemplo, el texto contiene 'the' muchas veces, así que las celdas para 't→h' y 'h→e' son brillantes — esas transiciones son muy comunes.",
      dataSourceP3:
        "El resultado: una tabla de 96×96 donde cada uno de los 96 caracteres imprimibles tiene su propia fila, mostrando qué suele seguirle.",
      builderBridge:
        "Ahora es tu turno. Escribe cualquier texto abajo y observa cómo cada par de caracteres suma exactamente +1 a su celda. Al final, habrás construido una tabla de transición completa desde cero.",
      builderLabel: "Interactivo · Construye la Tabla Tú Mismo",
      builderHint: "Escribe tu propio texto y observa cómo se llena la tabla par a par.",
      tinyMatrixCountTooltip: "Después de {row}, {col} apareció {count} veces",
      calloutTitle: "Leyendo la Tabla",
      calloutP1:
        'Cada fila es un carácter "actual". Cada columna es un carácter "siguiente". Celdas brillantes = pares comunes. Celdas oscuras = raros o nunca vistos. Fíjate cómo algunas filas tienen favoritos claros mientras otras están más repartidas.',
      tinyMatrixLabel: "Matriz 5×5 simplificada · ['t', 'h', 'e', 'a', '·']",
      tinyMatrixHint:
        "Pasa el cursor por cualquier celda para ver la probabilidad exacta. Filas = carácter actual, Columnas = siguiente carácter.",
      tinyMatrixHover: "Pasa el cursor por una celda para ver su probabilidad",
      tinyMatrixColLabel: "siguiente carácter →",
      tinyMatrixRowLabel: "carácter actual →",
      tinyMatrixPlay: "Construir la cuadrícula",
      tinyMatrixReplay: "Otra vez",
      tinyMatrixBuilding:
        "Cada letra nueva estrena su propia fila. Apílalas y aparece la cuadrícula.",
      tinyMatrixGrid:
        "Izquierda: de qué letra partes. Arriba: a cuál vas. La casilla donde se cruzan: cuántas veces pasó.",
      tinyMatrixHigh: "frecuente",
      tinyMatrixLow: "poco frecuente",
      tinyMatrixRare: "muy raro / nunca",
      tinyMatrixTooltip: "Después de {row}, {col} aparece el {pct} de las veces",
      fullMatrixHint:
        "Celdas más brillantes = pares más frecuentes. Haz clic en cualquier celda para inspeccionarla.",
      sectionBridge:
        "Construiste la tabla. Contiene todo lo que el modelo sabe sobre qué letras siguen a cuáles. Pero los conteos brutos no son predicciones — ¿cómo los convertimos en probabilidades reales?",
    },
    history: {
      title: "Breve Historia del Conteo de Letras",
      summary:
        "De los experimentos de Márkov con vocales a la teoría de la información de Shannon — contar pares tiene una historia sorprendentemente profunda.",
      subtitle: "Línea Temporal de la Era del Conteo",
      p1: "El matemático ruso Andréi Márkov analizó 20.000 letras de Eugene Onegin de Pushkin, rastreando cómo vocales y consonantes se seguían unas a otras. Demostró que las secuencias de letras no eran aleatorias — tenían estructura. Este fue el nacimiento de la cadena de Márkov.",
      p2: "Claude Shannon publicó 'Una Teoría Matemática de la Comunicación' — uno de los artículos más influyentes jamás escritos. Usó predicción a nivel de caracteres (exactamente lo que acabamos de construir) para medir el contenido informativo del inglés. Sus tablas de bigramas fueron los primeros modelos de lenguaje.",
      p3: "Investigadores de IBM y Bell Labs construyeron los primeros modelos de lenguaje computacionales para reconocimiento de voz. Contaron pares de palabras (bigramas) y tripletes (trigramas) en grandes corpus de texto. La idea era idéntica a la nuestra — solo que a nivel de palabras en vez de caracteres.",
      p4: "Yoshua Bengio demostró que las redes neuronales podían aprender mejores modelos de lenguaje que el conteo. Este fue el principio del fin de la era del conteo — pero la intuición detrás de los bigramas (predecir desde el contexto) vive en cada modelo de lenguaje moderno, incluyendo GPT.",
    },
    normalization: {
      label: "De Conteos a Probabilidades",
      title: "Convertir Conteos en Probabilidades",
      lead: "Tenemos conteos — pero ¿cómo convertimos \"h→e apareció 3.481 veces\" en \"hay un 32% de probabilidad de que 'e' venga después de 'h'\"?",
      p1: "Simple: ",
      h1: "dividimos cada conteo por el total de la fila",
      p2: ". Si 'h' fue seguida por cualquier carácter 10.800 veces en total, y 'h→e' apareció 3.481 veces, entonces la probabilidad es 3.481 ÷ 10.800 ≈ 32%. Ahora cada fila suma 100%.",
      vizHint:
        "Elige un carácter y recorre el proceso de normalización — de conteos brutos a porcentajes.",
      p3: "El modelo ahora puede hacer predicciones concretas: \"Después de 'h', hay un 32% de probabilidad de que la siguiente letra sea 'e', 15% de que sea 'a', etc.\"",
      queryVizBridge:
        "Juntemos todo. Elige un carácter abajo y recorre el pipeline completo de predicción: busca la fila, ve los conteos, normaliza a probabilidades y lanza el dado ponderado.",
      plainEnglishTitle: "La Regla",
      plainEnglish:
        "Probabilidad de la siguiente letra = cuántas veces apareció este par ÷ cuántas veces apareció esta letra inicial antes de cualquier otra.",
      p4: "Pruébalo abajo. Escribe cualquier carácter y mira qué predice el modelo que viene después — basándose ",
      h2: "únicamente en el último carácter",
      p5: " que escribiste.",
    },
    normalizationViz: {
      theRowLabel: "La fila de la «t»",
      context: "Después de '{char}', ¿cuáles son las probabilidades de cada siguiente carácter?",
      step1Title: "Paso 1: Conteos Brutos",
      step1Desc:
        "Cuántas veces apareció cada carácter después de '{char}' en el texto de entrenamiento",
      charHeader: "Car",
      frequencyHeader: "Frecuencia",
      countHeader: "Conteo",
      totalLabel: "Total de transiciones desde '{char}':",
      step2Title: "Paso 2: Dividir por el Total",
      step2Desc: "Cada conteo dividido por la suma de todos los conteos en la fila",
      step2Formula: "conteo({char}→{next})",
      step2Total: "total",
      step3Title: "Paso 3: Probabilidades",
      step3Desc: "Cada conteo dividido por {total} da la probabilidad",
      probabilityHeader: "Probabilidad",
      pctHeader: "%",
      sumLabel: "Suma de probabilidades:",
      nextStep: "Siguiente Paso",
      reset: "Reiniciar",
    },
    queryViz: {
      label: "Interactivo · Cómo Predice un Bigrama",
      hint: "Recorre cada paso del proceso de predicción — desde la selección del carácter hasta el lanzamiento del dado.",
      step0Label: "Elegir",
      step1Label: "Buscar",
      step2Label: "Conteos",
      step3Label: "Normalizar",
      step4Label: "Predecir",
      pickChar:
        "Elige un carácter para consultar al modelo — vamos a trazar exactamente cómo predice.",
      lookingUp: "Buscando la fila '{char}' en la tabla de transición…",
      rawCountsIntro:
        "Aquí están los conteos brutos de lo que sigue a '{char}' en el texto de entrenamiento:",
      totalRaw: "Total: {total} apariciones",
      normalizeIntro:
        "Ahora dividimos cada conteo por el total para obtener probabilidades — esto es la normalización.",
      predictionIntro:
        "El modelo dice: después de '{char}', el siguiente carácter más probable es…",
      topPrediction: "Predicción principal",
      diceExplain:
        "Pero el modelo no siempre elige el más probable. Lanza un dado ponderado — los caracteres con mayor probabilidad tienen más chances de ganar.",
      rollDice: "Lanzar el dado",
      rolled: "Después de '{char}', el modelo escribió '{next}'",
      tryAnother: "Probar otro carácter",
      next: "Siguiente",
    },
    sampling: {
      label: "Dejémosle Escribir",
      title: "Dejar que el Modelo Escriba",
      lead: "Nuestra tabla está lista. Ahora hagamos algo divertido: dejar que el modelo escriba texto por su cuenta.",
      p1: "El proceso es simple — lo llamamos ",
      h1: "escribir letra por letra",
      p2: ": elige una letra inicial, busca su fila en la tabla, lanza un dado ponderado para elegir la siguiente letra, y usa esa letra como nuevo punto de partida. Repetir.",
      calloutTitle: "Temperatura",
      calloutP1: "El parámetro de ",
      calloutH1: "temperatura",
      calloutP2: ' controla cuán "creativa" es la generación. A ',
      calloutH2: "temperaturas bajas",
      calloutP3: ", el modelo casi siempre elige el token más probable. A ",
      calloutH3: "temperaturas altas",
      calloutP4:
        ", muestrea más uniformemente — produciendo resultados sorprendentes y a menudo sin sentido.",
      softmaxTitle: "Por dentro: Softmax y temperatura",
      softmaxIntuition:
        "La intuición: los conteos más grandes deben recibir probabilidades más altas, y las probabilidades deben sumar 1. Softmax hace exactamente eso — amplifica diferencias y normaliza, todo en un paso.",
      softmaxP1:
        "Formalmente: softmax toma cualquier lista de números (llamados logits) y los comprime en probabilidades que suman 1, preservando el orden relativo. La exponencial garantiza que todos los valores sean positivos; dividir por la suma los normaliza.",
      softmaxFormulaCaption:
        "Cada salida es la exponencial de la entrada dividida por la suma de todas las exponenciales",
      softmaxP2:
        "La temperatura es un solo número T que divide cada logit antes de aplicar softmax. Cuando T < 1, las diferencias se amplifican (el modelo se vuelve más seguro). Cuando T > 1, las diferencias se reducen (el modelo se vuelve más aleatorio). Con T → 0 siempre elige el token más probable; con T → ∞ cada token es igualmente probable.",
      softmaxTempCaption:
        "Softmax con escala de temperatura — T controla la 'nitidez' de la distribución",
      softmaxP3:
        "Softmax aparece en todas partes de la IA moderna: capas de atención en Transformers, cabezas de clasificación en redes neuronales, y políticas de aprendizaje por refuerzo. La versión que acabas de ver en el bigrama es el caso más simple — pero la matemática es idéntica a la que usa GPT-4.",
      playgroundBridge:
        "Ahora démosle al modelo una letra inicial y dejémosle escribir. El playground de abajo tiene un control de temperatura — prueba bajo para seguro y predecible, alto para caos y sorpresa.",
      playgroundLabel: "Playground de Generación",
      playgroundHint: "Ajusta la temperatura y observa cómo cambia el texto generado.",
      samplingMechanismLabel: "Interactivo · El Dado Ponderado",
      samplingMechanismHint:
        "Haz clic en 'Lanzar' para ver cómo el modelo elige aleatoriamente el siguiente carácter según las probabilidades.",
      p3: "Genera texto y fíjate en algo: un modelo con ",
      h2: "solo una letra de memoria",
      p4: " produce galimatías que de algún modo suena a letras. Los pares son correctos pero las palabras están mal. ¿Por qué?",
    },
    counting: {
      title: "Construyendo la Tabla",
      lead: "Veamos exactamente cómo funciona contar pares, paso a paso.",
      builderTitle: "Contador de Pares",
      builderDesc: "Observa cómo cada par de caracteres suma +1 a la tabla.",
      p1: "La operación es casi demasiado simple: recorre un texto un carácter a la vez. Por cada par de caracteres consecutivos (actual → siguiente), suma uno al contador. Eso es todo. Después de escanear suficiente texto, estos conteos revelan qué caracteres tienden a seguir a cuáles — y con qué fuerza.",
      p2: "El constructor de abajo hace esto concreto. Observa cómo cada par en el texto añade exactamente un conteo a su celda. Al final, habrás construido un registro completo de cada transición en el texto.",
      calloutTitle: "¿Por qué funciona el conteo?",
      calloutText:
        "Con suficiente texto, las frecuencias observadas se acercan mucho a las probabilidades reales del lenguaje. Cuantos más datos tengas, más fiable será tu tabla.",
    },
    matrix: {
      title: "La tabla de transición",
      lead: "Filas = letra actual, columnas = siguiente.",
      desc: "Constrúyela paso a paso, luego ve el panorama completo.",
    },
    probabilities: {
      title: "De conteos a probabilidades",
      lead: "Divide cada conteo por el total de la fila para obtener porcentajes.",
      desc: "El modelo busca la fila del último carácter y elige el siguiente.",
      inferenceIntro:
        "Recorre el proceso de inferencia paso a paso abajo: elige un carácter, mira su fila de conteos, normaliza a porcentajes, y muestrea el siguiente carácter. Fíjate cómo cambia la distribución dependiendo de lo que vino antes.",
      overlayTitle: "Conteos → Probabilidades → Predicción",
      overlayDesc: "Elige un carácter, normaliza su fila, mira qué viene después.",
      step1: "1) Conteos brutos",
      step2: "2) Normalizar",
      step3: "3) Lanzar el dado",
      currentToken: "Letra actual",
      typeChar: "Escribe un carácter",
      normalizeSimple: "División simple",
      softmax: "Softmax",
      sampleNext: "Lanzar el dado",
      mostLikely: "Más probable:",
      remaining: "Restante:",
      stochastic:
        "Cada lanzamiento es aleatorio — el modelo elige basándose en probabilidades, no en certeza.",
    },
    limitations: {
      title: "Limitaciones",
      lead: "Una letra de memoria. Es todo lo que tiene.",
      desc: "Sin contexto. Por eso necesitamos N-gramas y redes neuronales.",
    },
    predictionExample: {
      label: "Véalo en Acción",
      title: "Una Predicción, Paso a Paso",
      lead: "Antes de entrar en detalles, veamos al modelo hacer una sola predicción. Elige cualquier carácter.",
      inputLabel: "entrada",
      lookupLabel: "el modelo busca",
      step1: "Elige un carácter",
      step2: "Fila '{char}' en la tabla",
      step3: "Mejores predicciones",
      hint: "Haz clic en cualquier carácter para ver qué predice el modelo.",
    },
    predictionChallenge: {
      label: "Tu Turno",
      title: "¿Puedes Ganar al Modelo?",
      lead: "Antes de explicarte cómo funciona una máquina, predice tú. Usa tu instinto sobre el idioma.",
      prompt: "¿Qué letra crees que viene después?",
      okLabel: "✓ Tu instinto acertó",
      almostLabel: "Casi — lo más natural es «{answer}»",
      tally: "Tu instinto",
      figureOf: "de",
      resultLabel: "Ver resultado",
      advanceLabel: "Siguiente",
      restart: "↻ Probar otra vez",
      thesis:
        "Sin reglas ni gramática, usaste el contexto — las letras anteriores — para adivinar la siguiente. La pregunta que abre este capítulo: ¿cómo le enseñamos esto a una máquina?",
      headlineTiers: {
        perfect: "Predijiste como un <em>lector nativo</em>.",
        close: "Tu instinto sigue el idioma <em>muy de cerca</em>.",
        half: "Ya predices la siguiente letra <em>sin darte cuenta</em>.",
        low: "El idioma esconde sus patrones — <em>vuelve a probar</em>.",
      },
      explanations: {
        0: "Después de «th», la «e» aparece casi la mitad de las veces — forma «the», la palabra más común del inglés.",
        1: "La «q» arrastra a la «u» casi siempre. En inglés es prácticamente una regla, no una probabilidad.",
        2: "«in», «ing», «ion»… después de la «i», la «n» es la continuación más frecuente, con diferencia.",
        3: "Tras un espacio empieza palabra nueva, y muchísimas arrancan por «t»: the, to, that, this…",
        4: "La «e» suele cerrar palabra. Lo más natural después de ella no es otra letra: es un espacio.",
      },
    },
    pairHighlighter: {
      pairFound: "Par encontrado: {first} → {second}",
      countsLabel: "Conteo de Pares",
      replay: "Repetir",
      tryOwn: "Prueba tu propia frase",
      placeholder: "Escribe una frase…",
      go: "Ir",
      figureLabel: "Interactivo · ¿Puedes Encontrar el Patrón?",
      figureHint:
        "Haz clic en cada paso para ver cómo se cuentan los pares de caracteres. ¿Cuáles se repiten?",
      summaryUnique: "Pares únicos:",
      summaryTotal: "Total de transiciones:",
      stepPrompt:
        "Miremos el texto de abajo. Vamos a recorrerlo par a par — haz clic en el botón para revelar el primer par.",
      startButton: "Empezar a Contar",
      nextStep: "Siguiente Par",
      currentPairLabel: "Par actual",
      firstTime: "primera vez",
      seenRepeats: "visto {n}× · ¡se repite!",
      patternLabel: "El patrón",
      patternRepeats: "estos pares aparecen más de una vez:",
      patternUnique: "casi todo es único aquí — prueba una frase más larga para verlo emerger.",
      countAll: "Contar el resto",
    },
    corpusCounting: {
      figureLabel: "Interactivo · Contando Patrones en Texto Real",
      figureHint:
        "Elige un carácter y observa cómo el modelo escanea texto real para contar qué le sigue. Pausa en cualquier momento para avanzar manualmente.",
      selectChar: "Elige un carácter inicial",
      corpusLabel: "Texto de entrenamiento",
      countsLabel: "Pares encontrados",
      scanning: "Escaneando…",
      found: "Encontrados {count} pares que empiezan con '{char}'",
      totalLabel: "Total de pares",
      reveal: "Eso es todo. Cuenta qué letras siguen a cuáles. Ese es todo el algoritmo.",
      replay: "Escanear de nuevo",
      hint: "Elige un carácter arriba para empezar a escanear el texto.",
      empty: "No se encontraron pares para este carácter.",
      stepExplain: "Coincidencia {pos} de {total}",
      pauseBtn: "Pausar",
      nextBtn: "Siguiente →",
      verdictLabel: "La apuesta del modelo",
      verdictMain: 'Después de "{char}", lo más probable es "{best}".',
      verdictSub: "{n} de {total} veces · {pct}",
    },
    samplingMechanism: {
      after: "Después de",
      probabilitySpace: "Espacio de probabilidad (0 → 1)",
      roll: "Lanzar el dado",
      rollAgain: "Lanzar de nuevo",
      rolled: "Resultado",
      history: "Elegidos:",
    },
    pipelineDemo: {
      figureLabel: "Interactivo · Pipeline de Predicción",
      figureHint: "Escribe cualquier carácter y observa cómo el modelo busca su fila en la tabla.",
      step1: "Entrada",
      step2: "Búsqueda",
      step3: "Predicción",
      inputLabel: "Escribe un carácter",
      placeholder: "ej. t",
      lookup: "Buscar",
      lookingUp: "Buscando fila en la tabla de transición…",
      resultsLabel: "Predicciones principales",
      afterChar: "Después de",
      insight:
        "Estas probabilidades vienen directamente de la tabla de transición — cada una refleja cuán frecuente fue este par en el texto de entrenamiento.",
    },
    storageProblem: {
      figureLabel: "Interactivo · El Problema de Almacenamiento",
      figureHint:
        "Elige caracteres y observa cómo explota el número de pares que necesitarías rastrear.",
      pickPrompt: "Elige un carácter — ¿qué puede seguirlo?",
      afterChar: "Después de '{char}', el texto de entrenamiento muestra estos seguidores:",
      moreFollowers: "más posibles",
      needSlots: "Solo '{char}' necesita {count} espacios — uno por cada posible seguidor.",
      charsExplored: "{count} caracteres explorados",
      slotsTotal: "{total} espacios necesarios hasta ahora",
      growingRealization:
        "Solo has explorado {count} caracteres y ya necesitas {slots} espacios. Para los {total} caracteres, son {total} pares que rastrear. ¿Cómo organizarías todo esto?",
      howToOrganize: "¿Cómo lo organizaría?",
      insightTitle: "Una Tabla 2D — Filas × Columnas",
      insightDesc:
        "Pon cada carácter en ambos ejes. Cada fila es un carácter inicial, cada columna es el siguiente carácter. La celda donde se cruzan contiene el conteo. Eso es todo — una tabla de transición.",
      fullSize: "Tabla completa: {size} × {size} = {total} celdas",
    },
    contextBlindness: {
      pickPrompt: "Elige un prefijo. ¿Qué predice el modelo a continuación?",
      modelSees: "El modelo solo ve",
      invisible: "es invisible",
      topPredictions: "Predicciones principales",
      tryOthers: "Prueba los otros prefijos también…",
      prompt: "¿Qué predice el modelo después de cada uno de estos?",
      revealButton: "¿Son diferentes?",
      whyButton: "¿Pero por qué?",
      identical: "¡Los tres son idénticos!",
      calloutTitle: "Amnesia de Una Letra",
      explanation:
        "El bigrama solo ve la última letra 'h'. La 't', 's' y 'w' antes de ella son completamente invisibles. No importa cuántos datos le des, nunca podrá distinguirlos. Ese es el defecto fatal.",
      figureLabel: "Interactivo · El Defecto Fatal",
      figureHint:
        "Elige un prefijo, observa lo que ve el modelo — y descubre el devastador punto ciego.",
    },
    cliffhanger: {
      label: "El Defecto Fatal",
      title: "La Amnesia de Una Letra",
      lead: "Construiste un predictor de texto funcional desde cero. Cuenta pares, los normaliza en probabilidades, lanza un dado ponderado y escribe texto. Eso es real. Pero hay una debilidad devastadora escondida a plena vista.",
      celebrationBridge:
        "Tómate un momento para apreciar lo que has hecho: partiendo de nada más que texto crudo, construiste un sistema que aprende patrones de letras, hace predicciones y genera texto nuevo. Cada modelo de lenguaje — incluyendo GPT — empezó desde esta misma intuición. Pero ahora observa qué pasa cuando lo empujamos.",
      p1: "Pregúntale al modelo qué viene después de 'th'. No sabe nada de 't' — solo ve 'h'. Así que da exactamente la misma predicción que para 'sh' o 'wh'. El contexto antes de 'h' es invisible. Perdido para siempre. Pruébalo tú mismo:",
      blindnessP1:
        "El modelo no es solo olvidadizo — es estructuralmente ciego. No importa cuántos datos de entrenamiento le demos, el bigrama nunca distinguirá 'th' de 'sh' de 'wh'. Esto no es un error que podamos corregir con más datos. Es un techo integrado en la arquitectura.",
      hookLine: "¿Y si dejamos que el modelo recuerde más de una letra? Eso lo cambia todo.",
    },
    keyTakeaways: {
      bigram:
        "Un modelo bigrama predice el siguiente carácter contando con qué frecuencia aparece cada par en el texto de entrenamiento. La forma más simple de modelado de lenguaje — solo contar y adivinar.",
      normalization:
        "Convertir conteos brutos en porcentajes (0% a 100%) es lo que permite al modelo hacer predicciones reales. Cada fila suma 100% — una distribución de probabilidad válida.",
      fatalFlaw:
        "Un bigrama solo ve una letra de contexto. Esa es su limitación fundamental — y exactamente por qué necesitamos n-gramas y redes neuronales.",
    },
    cta: {
      title: "¿Qué Viene Después?",
      freeLabButton: "Abrir Lab Libre",
      freeLabDesc:
        "Salta la historia. Acceso completo a todas las herramientas, parámetros y visualizaciones.",
      nextTitle: "Siguiente: ¿Y Si Recordamos Más?",
      nextDesc:
        "El bigrama olvida todo excepto la última letra. ¿Y si le dejamos ver dos? ¿Tres? ¿Cinco? Bienvenido al modelo N-gram.",
    },
    footer: {
      text: "Siguiente capítulo: el modelo N-gram — qué pasa cuando le das más memoria a un contador.",
      brand: "LM-Lab · La Era del Conteo",
    },
    /* ═══════════════════════════════════════════════════════════════════
           v2 · Reconstrucción de la narrativa (bigram-blueprint.md)
           Copy ES verbatim del blueprint. Voz: 2ª persona, frases cortas, cero
           condescendencia, casi sin guiones largos. Las claves antiguas de
           bigramNarrative.* siguen vivas (las consume el BigramNarrative.tsx
           actual) hasta que la Fase 2 recablee la página. Estructura nueva,
           sin colisiones, por sección del arco (hero + §1–§6).
           ═══════════════════════════════════════════════════════════════════ */
    v2: {
      /* ─── HERO · §0 Escribir es adivinar ─── */
      hero: {
        eyebrow: "Capítulo 1 · La era del conteo",
        title: "El modelo bigrama",
        subtitle: "Enseñando a escribir a una máquina, desde cero y solo contando.",
        predict: {
          hintLabel: "tu palabra",
          exactNote: "Ya estaba en tu cabeza antes de decidir pensarla.",
          alsoNote: "La tuya también encaja.",
          commonHint: "Aquí casi todo el mundo pone «{word}».",
          again: "Otra",
          idea: "Eso es predecir: saber qué viene después sin pensarlo, porque lo has visto mil veces. Lo haces sin parar. Una máquina que escriba no necesita nada más.",
          rounds: [
            { lead: "Más vale tarde que", accept: ["nunca"], real: "nunca" },
            {
              lead: "El gato subió despacio al",
              accept: ["tejado", "arbol", "techo", "sofa", "mueble", "muro", "tronco", "armario"],
              real: "tejado",
            },
            { lead: "Y fueron felices y comieron", accept: ["perdices"], real: "perdices" },
          ],
        },
        readTime: "~12 min de lectura · 6 movimientos",
      },

      /* ═══ FASE A · nuevo arco (intro infancia + fli-fla + showpieces) ═══ */

      /* ─── §0 · Intro: enseñar a escribir a algo que nunca vivió ─── */
      intro: {
        p1: "Cuando somos pequeños, nadie nos da un manual para aprender a hablar. Aprendemos viviendo: escuchamos a la gente, relacionamos un tono de voz con una cara que sonríe y, poco a poco, entendemos el significado de las cosas.",
        p2: "Pero, ¿cómo le enseñas a escribir a una máquina que jamás ha vivido un solo día? Para una caja de cables y silicio, la palabra «manzana» no es dulce ni roja. No significa nada. Si no puede entender el mundo, parece imposible que escriba sobre él.",
        p3: "Así que, antes de construir nada, un pequeño experimento.",
      },

      /* ─── VIS 1 · FillTheBlank (3 pantallas, keystone fli-fla) ─── */
      fillBlank: {
        label: "Termina la frase en tu cabeza",
        hintLabel: "tu palabra",
        again: "Otra",
        tryAgain: "Casi. Una pista:",
        reveal: "Ver la respuesta",
        screens: [
          {
            lead: "En un lugar de la",
            accept: ["mancha"],
            real: "Mancha",
            hint: "Una región de España. La tierra de Don Quijote.",
            note: "Esa la tenías sin pensar.",
          },
          {
            lead: "El perro ladra, el pájaro pía y el gato",
            accept: ["maulla", "maúlla", "miau", "mia"],
            real: "maúlla",
            hint: "¿Qué sonido hace un gato?",
            note: "Esa la has sacado de la lógica de la frase.",
          },
          {
            lead: "Fli fli fla, fli fli fla, fli fli",
            accept: ["fla"],
            real: "fla",
            hint: "No significa nada. Fíjate solo en el ritmo: fli fli fla, fli fli…",
            note: "Y esta última no significa nada. «Fli fli fla» no es ningún idioma. No la has entendido: has visto el patrón y has seguido. En eso consiste todo el truco.",
          },
        ],
        afterPlay:
          "Seguramente has rellenado todos los huecos sin mucho esfuerzo. Pero fíjate en el último: no tenías ni idea de qué significaba «Fli fli fla». Solo miraste lo que había escrito antes, intuiste la lógica y adivinaste lo que tocaba a continuación.",
        reframe:
          "Acabas de descubrir el truco. Como los ingenieros no podían enseñar a las máquinas a entender el mundo como nosotros, cambiaron las reglas del juego. En lugar de enseñarles a reflexionar, les enseñaron a predecir.",
        toLetters:
          "Hoy en día, los grandes modelos hacen esto con frases enteras. Pero para entender de verdad la magia que hay detrás, vamos a lo más básico de todo: predecir cuál es la siguiente letra.",
      },

      /* ─── VIS 1.5 · El objetivo (HeroAutoComplete reuse) ─── */
      goalIntro: {
        lead: "Nuestro objetivo final es conseguir construir exactamente esto: le das una letra y apuesta por la que viene después.",
        after:
          "Parece magia, pero en el fondo solo son matemáticas muy básicas. Ahora la gran pregunta es: ¿cómo conseguimos construir esto desde cero, si la máquina no sabe leer?",
      },

      /* ─── VIS 4 · Caos y Orden (showpiece) ─── */
      isolateT: {
        label: "Interactivo · La «t» en distintos textos",
        tab: "Texto",
        followsLabel: "Lo que sigue a la «t»",
        spaceWord: "el espacio",
        start: "Leer este texto",
        autocomplete: "Ver el total",
        replay: "Otra vez",
        idleHint: "Cuenta qué letra sigue a cada «t» de este texto.",
        verdict: "Aquí, tras la «t», gana {best}. Cambia de texto y cambia la regla.",
      },
      chaosOrder: {
        label: "La máquina lee",
        playLabel: "Leer el libro entero",
        readingHint: "Cada «t» que pasa, miramos la letra de justo después y le sumamos uno.",
        chaosHint: "Eso es lo único que hace, una «t» tras otra. ¿La soltamos con el libro entero?",
        orderLabel: "Leer el resto",
        orderingHint: "Una fila: una casilla por cada letra que podría seguir.",
        scanningHint: "Ahora el resto del libro, sin frenar. Mira cómo suben los números.",
        readingNow: "Leyendo el libro",
        rowLabel: "Después de «{char}»",
        replay: "Leer otra vez",
        pickLetter: "Prueba otra letra",
        inspectHint: "Pasa el ratón por una casilla para ver cuántas veces pasó.",
        rowIsTable:
          "La barra más alta, de lejos, es la «h»: tras una «t» casi siempre viene una «h», y lo averiguó ella sola. La segunda es el espacio, porque muchísimas palabras acaban en «t». Y los huecos cuentan lo mismo: tras una «t» casi nunca hay otra «t», ni una «z», ni una «q».",
        payoff:
          "Esto que acabas de ver — darle un montón de texto y dejar que cuente — tiene nombre. Se llama datos de entrenamiento. Acabas de ver entrenar un modelo.",
      },

      /* ─── VIS 9 · Matriz 27×27 que crece (showpiece) ─── */
      growingMatrix: {
        label: "Una fila por letra",
        playLabel: "Construirla",
        lead: "Una fila bastó para la «t». Apila una fila por cada letra y la cuadrícula aparece sola.",
        scanningHint:
          "Sigue leyendo. Cada letra nueva añade una fila y una columna; cada par calienta una casilla.",
        gridCaption:
          "Fila: la letra de la que partes. Columna: la que podría seguir. Casilla: cuántas veces lo vimos.",
        twist:
          "Y mira lo que ha salido. Nadie le dictó una sola regla, pero ahí están: las casillas encendidas son las parejas que el idioma repite, las apagadas las que casi nunca ocurren. La máquina las descubrió sola, solo contando.",
        growToFull: "Crecer al tamaño real",
        totalLabel: "Pares contados",
        cellCount: "«{row}» → «{col}»: {n}",
        hoverHint: "Cada casilla guarda cuántas veces pasó ese par.",
      },

      /* ─── VIS 10 · Matriz detective (showpiece) ─── */
      detective: {
        label: "La tabla entera",
        intro:
          "Esta es la tabla entera, de verdad. Parece un caos de luces, pero es el manual de un idioma escrito en números. Cada casilla encendida es una regla; cada hueco negro, una pareja que casi nunca pasa. Y ninguna se la enseñó nadie.",
        prompt: "Busca una casilla que nunca pasa.",
        searchHint: "Resaltar un carácter",
        cellCount: "«{row}» → «{col}» pasó {n} veces.",
        cellNever: "«{row}» → «{col}» no pasó nunca. Ni una vez.",
        timesLabel: "veces",
        never: "nunca",
        inspectHint: "El ratón revela el conteo; el clic fija la fila y la columna.",
        rulesLabel: "Reglas del lenguaje",
        rulesFound: "{n}/{total} encontradas",
        regionsLabel: "O persigue una regla escondida:",
        regions: {
          uppercaseDesert: {
            title: "El desierto de las mayúsculas",
            body: "Una mayúscula casi nunca sigue a una minúscula. Las mayúsculas viven al principio de palabra, no en medio.",
            hint: "una mayúscula no aparece en mitad de una palabra",
          },
          qCorner: {
            title: "El rincón de la q",
            body: "Tras la «q», casi siempre «u». Casi todo lo demás de esa fila está a oscuras.",
            hint: "tras la «q» casi siempre va una «u»",
          },
          periodJump: {
            title: "El salto del punto",
            body: "Tras un punto viene un espacio, y tras ese espacio, una mayúscula. El ritmo de una frase nueva.",
            hint: "tras un punto casi siempre viene un espacio",
          },
          spaceEverywhere: {
            title: "El espacio va con todo",
            body: "El espacio es la casilla más sociable: casi cualquier letra puede ir antes o después de un espacio. Por eso su fila y su columna están casi llenas.",
            hint: "el espacio se junta con casi cualquier letra",
          },
          numberVoid: {
            title: "El vacío de los números",
            body: "Los números viven aparte. Casi nunca se pegan a una letra: escribimos «2023» o «3.14», pero rara vez «a7» o «k9».",
            hint: "un número casi nunca va pegado a una letra",
          },
        },
        clear: "Quitar",
      },

      sectionNames: {
        s01: "El truco: predecir",
        s02: "A la caza del patrón",
        s03: "Demasiado predecible",
        s04: "Nace la matriz",
        s05: "¡Vamos a escribir!",
        s06: "El defecto fatal y ver más",
      },
      sectionKickers: {
        s1: "Predecir letras",
        s2: "El patrón",
        s3: "Cómo elegir",
        s4: "La matriz",
        s5: "Escribir solo",
        s6: "El techo",
      },

      /* ─── §1 · Tú ya predices ─── */
      s1: {
        label: "El truco: predecir",
        lead: "Aquí está hacia dónde vamos: una máquina que, con una sola letra, apuesta por la siguiente. Lo mismo que acabas de hacer, en pequeño.",
        afterChallenge:
          "¿Lo ves? Casi siempre aciertas. Y no porque sepas inglés de cine, sino porque tu cabeza ha visto esas combinaciones miles de veces. Tras la «q» va la «u». Tras «th», casi siempre una «e». Nadie te lo enseñó como regla. Lo viste tanto que se te quedó.",
        bridgeToMachine:
          "Tú haces esto con palabras enteras. A la máquina se lo vamos a enseñar más pequeño todavía: letra a letra. Y sobre texto en inglés, que es el que le daremos. Mira, esto ya lo hace:",
        heroAutoPrompt: "Escribe una letra y mira qué cree que viene después.",
        afterHeroAuto:
          "Funciona. Pero no entiende nada. ¿Cómo sabe que tras la «t» suele ir una «h»? Nosotros no le hemos enseñado todavía. Vamos a construirlo desde cero.",
      },

      /* ─── PredictionChallenge (rework, 3-4 rondas calibradas) ─── */
      predictionChallenge: {
        label: "Tu turno",
        prompt: "¿Qué letra crees que viene después?",
        okLabel: "✓ Tu instinto acertó",
        almostLabel: "Casi. Lo más natural es «{answer}»",
        tally: "Tu instinto",
        figureOf: "de",
        resultLabel: "Ver resultado",
        advanceLabel: "Siguiente",
        restart: "↻ Probar otra vez",
        headlineTiers: {
          perfect: "Predijiste como un <em>lector nativo</em>.",
          close: "Tu instinto sigue el idioma <em>muy de cerca</em>.",
          half: "Ya predices la siguiente letra <em>sin darte cuenta</em>.",
          low: "El idioma esconde sus patrones. <em>Vuelve a probar.</em>",
        },
        // 4 rondas calibradas (~70% acierto). Cada ronda: contexto visible + respuesta natural.
        rounds: [
          {
            context: "th",
            answer: "e",
            explanation:
              "Tras «th», la «e» aparece casi la mitad de las veces. Forma «the», la palabra más común del inglés.",
          },
          {
            context: "q",
            answer: "u",
            explanation:
              "La «q» arrastra a la «u» casi siempre. En inglés es prácticamente una regla, no una probabilidad.",
          },
          {
            context: "wh",
            answer: "a",
            explanation:
              "«what», «when», «where»… tras «wh», la «a» y la «e» se reparten el protagonismo.",
          },
          {
            context: "in",
            answer: "g",
            explanation:
              "«ing» está por todas partes: running, talking, going. Tras «in», la «g» es la continuación estrella.",
          },
        ],
      },

      /* ─── HeroAutoComplete (rework: marco "tu cerebro también lo hace") ─── */
      heroAutoComplete: {
        label: "Interactivo · El predictor",
        prompt: "Prueba con una letra. Apuesta por la que viene después.",
        hint: "Cualquier letra vale.",
        after: "Después de «{input}», lo más probable",
        bridge: "Funciona. Pero no entiende nada. ¿Cómo sabe que tras la «t» suele ir una «h»?",
      },

      /* ─── §2 · Enseñemos a contar ─── */
      s2: {
        label: "A la caza del patrón",
        lead: "Nuestro idioma no es un caos. Si aporreas el teclado al azar sale algo como «asdfghjkl», y no significa nada. Escribimos siguiendo una estructura invisible: nadie te explicó que tras la «q» casi siempre va una «u», ni que es rarísimo ver tres consonantes seguidas. Tu cerebro lo fue asimilando a base de leer y escuchar.",
        pairPrompt:
          "Como el lenguaje ya esconde ese patrón, solo necesitamos que la máquina lea textos y se fije en quién va de la mano de quién. Empecemos con una frase sencilla.",
        afterPair:
          "Ya hemos visto cómo busca parejitas de letras. Para entenderlo a fondo, vamos a fijarnos en una sola: la «t». Le daremos distintas frases y veremos qué letra decide que es su mejor compañera.",
        focusTPrompt: "Cambia el texto y observa qué letra gana después de la «t».",
        afterCorpusCounting:
          "Según el texto que le des, aprende una regla distinta, y con tan poco texto el conteo miente. Si le damos textos muy cortos, su visión del mundo es limitada y sesgada. Para aprender las reglas de verdad, necesita muchísima más información: un texto gigante.",
        bookPrompt:
          "Así que vamos a ponernos serios. Vamos a hacer que nuestra máquina lea a Shakespeare entero.",
        afterShakespeare:
          "Esa fila es todo lo que hay sobre la «t» en todo Shakespeare. La máquina ha sacado ella sola todas sus relaciones, solo contando.",
        honestyNote:
          "A este proceso —darle un texto gigantesco para que lo lea, lo cuente y construya sus propias tablas de reglas— se le llama texto de entrenamiento. Acabas de ver, en primera persona, cómo se entrena un modelo. (Una pega: ha aprendido de Shakespeare, así que hablará como hace 400 años. Cambia el libro y cambias la máquina.)",
      },

      /* ─── PairHighlighter (rework: "encuentra el patrón") ─── */
      pairHighlighter: {
        label: "Interactivo · Encuentra el patrón",
        hint: "Recorre la frase par a par. ¿Cuáles se repiten?",
        pairFound: "Par encontrado: {first} → {second}",
        countsLabel: "Conteo de pares",
        stepPrompt: "Pasa por la frase de dos en dos. Pulsa para revelar el primer par.",
        startButton: "Empezar a contar",
        nextStep: "Siguiente par",
        countAll: "Contar el resto",
        currentPairLabel: "Par actual",
        firstTime: "primera vez",
        seenRepeats: "visto {n}× · se repite",
        patternLabel: "El patrón",
        patternRepeats: "estos pares aparecen más de una vez:",
        patternUnique: "casi todo es único aquí. Prueba una frase más larga para verlo aparecer.",
        summaryUnique: "Pares únicos:",
        summaryTotal: "Total de transiciones:",
        replay: "Repetir",
        tryOwn: "Prueba tu propia frase",
        placeholder: "Escribe una frase…",
        go: "Ir",
      },

      /* ─── CorpusCountingIdea (foco t) ─── */
      corpusCounting: {
        label: "Interactivo · Cuenta las «t»",
        hint: "Mira cómo escaneamos la frase contando qué letra sigue a cada «t».",
        focusChar: "t",
        selectChar: "Letra de partida",
        corpusLabel: "La frase",
        countsLabel: "Lo que sigue a la «t»",
        scanning: "Escaneando…",
        found: "Encontradas {count} «t»",
        totalLabel: "Total",
        reveal: "Con tan poco texto, el conteo miente. Lo que más sale tras la «t» es un espacio.",
        replay: "Escanear de nuevo",
        pauseBtn: "Pausar",
        nextBtn: "Siguiente →",
        verdictLabel: "Lo que dice esta frase",
        verdictMain: "Tras «t», aquí gana «{best}».",
        verdictSub: "{n} de {total} veces",
      },

      /* ─── ShakespeareRowCounter (new) ─── */
      shakespeareRow: {
        label: "Interactivo · La «t» de Shakespeare",
        hint: "Cuenta las «t» de un libro entero. Empieza a mano, luego acelera.",
        prompt: "Vamos a contar las «t» de Shakespeare. Todas.",
        messyHint: "Llevamos {count} pares contados a mano. Esto se vuelve un lío.",
        organizeCta: "¿Y si lo anotamos en una tabla?",
        rowLabel: "Después de «t» →",
        countingManually: "Contando a mano…",
        fillingTable: "Llenando la tabla…",
        fullCorpus: "Shakespeare completo",
        verdict: "Con suficiente texto, tras la «t» gana la «h».",
        verdictSub: "{best} con {pct} de las veces",
      },

      /* ─── §3 · Nace la matriz ─── */
      s3: {
        label: "Nace la matriz",
        lead: "Tenemos una fila para la «t». ¿Y la «a»? ¿Y la «h»? ¿Y todas las demás?",
        rowByRowReveal:
          "Apila una fila por cada letra y mira lo que sale: una cuadrícula. Cada fila es la letra de la que partes. Cada columna, la que podría venir después. Cada casilla, cuántas veces lo vimos.",
        rowByRowName:
          "Acabas de construir algo con nombre propio: una <strong>tabla de transición</strong>.",
        tinyPrompt: "Coge una fila cualquiera. Por sí sola ya es una mini-predicción.",
        sizePrompt:
          "Una cosa. Si cada letra necesita una fila, y cada fila una casilla por cada letra posible… son muchísimas casillas. ¿Cuántas exactamente? Cuenta.",
      },

      /* ─── MatrixRowByRowBuilder (new) ─── */
      rowByRow: {
        label: "Interactivo · Apila las filas",
        hint: "Añade una fila por letra hasta formar la cuadrícula. Luego llénala con Shakespeare.",
        startRow: "Fila de la «t»",
        addRowCta: "Añadir la siguiente letra",
        addAllCta: "Añadir todas",
        fillCta: "Llénala con Shakespeare",
        rowAxisLabel: "letra de partida ↓",
        colAxisLabel: "letra siguiente →",
        filling: "Llenando con Shakespeare…",
        coda: "Una fila por letra. Eso es una tabla de transición.",
        verdict: "Cada fila es una letra de partida. Cada columna, la que podría seguir.",
      },

      /* ─── StorageProblemVisualizer (marco "qué grande se hace") ─── */
      storage: {
        label: "Interactivo · Cuenta las casillas",
        hint: "Elige letras y mira cómo se dispara el número de casillas.",
        pickPrompt: "Elige una letra. ¿Qué puede seguirla?",
        afterChar: "Tras «{char}», estas son las que pueden seguir:",
        needSlots: "Solo «{char}» ya necesita {count} casillas, una por cada posible siguiente.",
        charsExplored: "{count} letras exploradas",
        slotsTotal: "{total} casillas hasta ahora",
        growingRealization:
          "Has explorado {count} letras y ya van {slots} casillas. Para las {total} letras, son {total} filas por {total} columnas. Mira lo enorme que se hace.",
        fullSize: "Tabla completa: {size} × {size} = {total} casillas",
      },

      /* ─── §4 · ¿De dónde sale lo que aprende? ─── */
      s4: {
        label: "¿De dónde sale lo que aprende?",
        lead: "Acuérdate de Shakespeare. ¿Y si en vez de él le damos otro texto? ¿Aprende lo mismo?",
        afterComparison:
          "No aprende lo mismo. El modelo es un espejo del texto que le diste. A ese texto lo llamamos el <strong>texto de entrenamiento</strong>. Cámbialo y cambias quién es la máquina.",
        charsetPrompt:
          "Y eso es solo un rincón del idioma: minúsculas. Faltan las mayúsculas, los puntos, las comas, los números. Cuéntalos todos y la tabla crece hasta su tamaño real, con muchísimas más reglas escondidas dentro.",
        afterCharset:
          "Cada carácter nuevo es otra fila y otra columna. La tabla crece, y crece, y crece.",
        matrixGamePrompt:
          "Esta es la tabla de verdad, entera. Ya la entiendes de cero: filas, columnas, casillas. Ahora juega con ella. Fíjate: hay huecos en negro. Casillas que nunca pasan. ¿Por qué?",
      },

      /* ─── TrainingTextComparison (new) ─── */
      trainingComparison: {
        label: "Interactivo · Dos textos, dos máquinas",
        hint: "Elige una letra y compara su fila en los dos textos.",
        corpusA: "Shakespeare",
        corpusB: "Texto moderno",
        pickCharPrompt: "Elige una letra para comparar sus filas.",
        rowFor: "Fila de «{char}»",
        idle: "Elige una letra arriba.",
        toggleLabel: "Cambiar de texto",
        verdict: "Mismo algoritmo, otro texto, otra máquina.",
        diffHint: "Fíjate en las diferencias: el texto que le das decide qué aprende.",
      },

      /* ─── CharsetGrowthMatrix (new) ─── */
      charsetGrowth: {
        label: "Interactivo · La tabla crece",
        hint: "Añade tipos de carácter y mira crecer la tabla.",
        steps: [
          { id: "lower", label: "Minúsculas", note: "26 letras + el espacio", size: 27 },
          { id: "upper", label: "+ Mayúsculas", note: "ahora también A–Z", size: 53 },
          { id: "digits", label: "+ Números", note: "del 0 al 9", size: 63 },
          { id: "punct", label: "+ Signos", note: "comas, puntos, paréntesis…", size: 92 },
        ],
        dimensionsLabel: "{size} × {size} casillas",
        addNextCta: "Añadir el siguiente tipo",
        takeaway: "Cuanto más quieras predecir, más grande la tabla.",
      },

      /* ─── TransitionMatrix (rework: juego de curiosidad) ─── */
      matrixGame: {
        label: "Interactivo · La tabla real",
        hint: "Hay huecos en negro: casillas que nunca pasan. Haz clic para descubrir por qué.",
        blackCellPrompt: "Encuentra una casilla que nunca pasa.",
        cellAfter: "Después de «{row}»",
        cellNext: "«{col}»",
        curiosities: {
          upperAfterLower:
            "Una mayúscula casi nunca sigue a una minúscula. Las mayúsculas viven al principio de palabra.",
          qWithoutU: "Tras la «q», casi siempre «u». Casi todo lo demás es hueco negro.",
          digitAfterLetter:
            "Letras y números rara vez se tocan. Por eso casi toda esa zona está vacía.",
          spaceAfterSpace:
            "Dos espacios seguidos casi no pasan. Una palabra, un espacio, otra palabra.",
        },
        clickToDismiss: "Clic para cerrar",
      },

      /* ─── Plegable · Markov (1913) ─── */
      markov: {
        kicker: "Historia · lectura larga · opcional",
        title: "Un señor, un libro y mucha paciencia",
        paras: [
          "Esto que tu máquina acaba de hacer en un milisegundo, contar parejitas de letras, no es ningún invento moderno. La primera vez que alguien lo hizo no había ordenadores, ni internet, ni la menor intención de hacer tecnología. Ocurrió, literalmente, por una rabieta.",
          "Rusia, 1913. Un matemático muy respetado y muy devoto, Pável Nekrásov, anunció que había demostrado con números la existencia del libre albedrío. Su razonamiento: la estadística solo funciona cuando los sucesos son independientes, como las tiradas de un dado, donde una no afecta a la siguiente. Como las personas decidimos por libre albedrío, concluía, que la sociedad fuera predecible solo podía explicarse por un plan divino.",
          "Aquí entra nuestro protagonista: Andréi Márkov. Brillante, ateo de los de bandera y con un genio tan corto que sus alumnos lo apodaban «Andrés el Iracundo» (llegó a pedir por escrito que lo borraran de los registros de la Iglesia). Que alguien usara sus queridas matemáticas para hacer teología le pareció un insulto personal, y se lo tomó como tal.",
          "Para desmontar a su rival necesitaba demostrar que la estadística también funciona cuando los sucesos no son independientes; cuando un paso obliga al siguiente. ¿Y qué hay más encadenado que el lenguaje? Si aparece una «q», la siguiente letra no es libre: está casi obligada a ser una «u».",
          "Así que Márkov agarró un ejemplar de «Eugenio Oneguin», la novela en verso de Pushkin, le quitó los espacios y la puntuación, y se puso a contar a mano sus primeras 20.000 letras. Las repartió en bloques de cien y pasó meses anotando cuántas veces una vocal seguía a una consonante, y al revés. Buscaba el patrón invisible.",
          "Al final construyó, con papel y lápiz, una tabla de probabilidades como la que tú tienes justo arriba, y demostró que aunque cada letra dependía de la anterior, el texto entero se equilibraba en porcentajes fijos. De paso, sin pretenderlo, acababa de inventar las cadenas que hoy llevan su nombre.",
          "Su regla más curiosa es la que llamó «falta de memoria»: para apostar por el siguiente paso, solo importa dónde estás ahora mismo; lo de antes se borra. Es una idea con muchas más consecuencias de las que parece a primera vista.",
        ],
      },

      /* ─── §5 · De conteos a escribir ─── */
      s5: {
        label: "Demasiado predecible",
        lead: "Ahora la máquina ya sabe que, tras la «t», la «h» aparece a montones y la «o» mucho menos. Pero un puñado de conteos sueltos no sirve para escribir: 7.071 no significa nada si no sabes sobre cuántos. Hay que convertir esos números en probabilidades.",
        lead2:
          "Y es una división de toda la vida: coges la fila de la «t», sumas todo lo que hay en ella y miras qué porción se lleva cada compañera.",
        afterNormalization:
          "Ahí está: la misma fila, ahora en porcentajes que suman 100%. La «h» se queda con un 36%, el espacio con un 29%, la «o» con un 10%… Eso son las apuestas de la máquina.",
        choosePrompt:
          "Y ahora la pregunta del millón: con esas apuestas sobre la mesa, ¿qué letra elige? Lo seguro sería quedarse siempre con la más alta. Veamos qué pasa.",
        afterAlwaysMax:
          "Siempre la «h». La opción segura resulta también la más muerta: así, tras la «t» nunca aparecería nada distinto, una «h» detrás de otra. Para escribir con algo de vida hace falta una pizca de azar; pero no uno cualquiera.",
        dicePrompt:
          "La idea de los ingenieros fue un dado. Eso sí, un dado trucado: con un montón de caras de «h», bastantes de espacio, alguna de «o» y casi ninguna de las raras. Así casi siempre cae lo probable, pero de vez en cuando sorprende. Tíralo tú y verás.",
        toMatrix:
          "¡Fíjate! Ya tenemos el truco completo para la «t»: contarla, sacarle porcentajes y elegir con una chispa de azar. Y aquí la pregunta se cae sola: ¿y si hacemos esto mismo con todas las letras a la vez?",
        writePrompt:
          "La tabla ya guarda todas las reglas que sigue el idioma. Y elegir una letra ya sabemos: se mira su fila y se tira el dado. Aquí está ese paso a cámara lenta, y cada letra que cae es el punto de partida de la siguiente.",
        toFullSpeed:
          "Lo has visto a cámara lenta. A toda velocidad es esto: una letra tras otra, sin frenos, salen frases enteras de un tirón.",
        playgroundPrompt: "Una letra basta para arrancar. A partir de ahí, escribe sola.",
      },

      /* ─── Normalización (bridges) ─── */
      normalization: {
        label: "De conteos a porcentajes",
        hint: "Elige una letra y convierte sus conteos en porcentajes.",
      },

      /* ─── AlwaysMaxVsSampling (new, integra el dado) ─── */
      alwaysMax: {
        label: "Interactivo · ¿Siempre la más probable?",
        hint: "Prueba los dos modos sobre la misma fila.",
        maxModeLabel: "Siempre el máximo",
        sampleModeLabel: "Dado ponderado",
        maxResult: "Siempre el máximo: te atascas en la misma letra para siempre.",
        sampleResult: "Dado ponderado: respeta los porcentajes y sale variedad.",
        rollCta: "Tirar el dado",
        regenerateCta: "Generar de nuevo",
        toggleCta: "Cambiar de modo",
        diceTrack: "0 → 1",
        verdict: "Hace falta azar, pero del que respeta los porcentajes.",
      },

      /* ─── VIS 6 · Siempre el máximo sobre la «t» → siempre «h» ─── */
      alwaysMaxLoop: {
        label: "Interactivo · Siempre la más probable",
        caption: "Estas son las apuestas de la «t». ¿Y si elegimos siempre la más alta?",
        pickLabel: "Después de la «t» elige:",
        play: "Elegir siempre el máximo",
        result:
          "Siempre la «h». Da igual cuántas veces: con este método, tras la «t» jamás sale otra cosa. Predecible y aburridísimo.",
        restart: "Otra vez",
      },

      /* ─── VIS 7 · El dado trucado sobre la «t» ─── */
      loadedDie: {
        label: "Interactivo · El dado trucado",
        caption:
          "El dado saca un número del 0 al 100 y cae sobre la barra. La «h» ocupa el tramo más ancho, así que casi siempre toca «h»… pero no siempre.",
        pickLabel: "Después de la «t» sale:",
        lands: "saca {n} →",
        play: "Tirar el dado",
        rollAgain: "Tirar otra vez",
        restart: "Empezar de nuevo",
        rolling: "Rodando…",
        result:
          "¿Lo ves? Casi siempre «h», pero de vez en cuando un espacio, una «o», una «e»… El dado respeta los porcentajes, y ese puntito de azar le da vida.",
      },

      /* ─── VIS 10.5 · Letra a letra, paso a paso (puente §4→§5) ─── */
      letterStep: {
        label: "Interactivo · Letra a letra",
        lead: "Una letra escrita. Para elegir la siguiente, la máquina repite siempre el mismo gesto. Vamos a verlo a cámara lenta.",
        seedPrompt: "Empieza por una letra y deja que siga sola.",
        wordLabel: "Lo que lleva escrito",
        lookCaption:
          "Miramos su fila: lo que vino después de esta letra, contado en todo el libro.",
        countCaption: "Cada casilla guarda un número: cuántas veces apareció esa pareja.",
        calcCaption: "Dividimos por el total y los conteos se vuelven porcentajes.",
        rollCaption: "El dado saca un número del 0 al 100 y cae donde manda el porcentaje.",
        appendCaption:
          "La letra que toca se une a lo escrito… y ahora es ella la que empieza el siguiente paso.",
        rollReadout: "saca {n} →",
        stepLook: "Mirar",
        stepCount: "Contar",
        stepCalc: "Repartir",
        stepRoll: "Tirar",
        stepAppend: "Escribir",
        next: "Siguiente letra",
        startStep: "Empezar el paso",
        nextPhase: "Siguiente",
        nextLetter: "La siguiente letra",
        auto: "Seguir solo",
        pause: "Parar",
        replay: "Empezar de nuevo",
        coda: "Eso es todo. Una letra mira su fila, tira el dado y se queda la siguiente. Repítelo sin parar y la máquina escribe sola.",
      },

      /* ─── TableWriter (VIS11) · la máquina de escribir a toda velocidad ─── */
      tableWriter: {
        label: "Interactivo · La máquina escribe",
        lead: "Ya vimos un paso a cámara lenta. Quítale los frenos y déjala correr: una letra mira su fila, tira el dado, se queda la siguiente, y vuelta a empezar.",
        seedPrompt: "Elige por dónde empieza.",
        wordLabel: "Lo que va saliendo",
        glimpseLabel: "De dónde sale cada letra",
        glimpseFrom: "tras",
        write: "Escribir",
        again: "Otra vez",
        coda: "De lejos casi parece un idioma. De cerca, balbuceo. Y aun así no hay magia: cada letra sale de mirar la fila de la anterior y tirar el dado. Nada más.",
      },

      /* ─── El nombre · revelación espectacular ─── */
      naming: {
        buildup:
          "Y ahí lo tienes: una máquina que escribe sola. Nadie le enseñó ortografía, ni gramática, ni una sola regla. Solo contó parejas de letras en un montón de texto, y de ahí salió todo. Lo has levantado tú, desde cero.",
        revealLead: "Y eso que has levantado tiene un nombre:",
        revealWord: "modelo de bigramas",
        revealCoda:
          "El modelo de lenguaje más simple que existe. Y es el primer ladrillo de todo lo demás. ChatGPT incluido.",
      },

      /* ─── Plegable · Shannon (1948) ─── */
      shannon: {
        kicker: "Historia · lectura larga · opcional",
        title: "El hombre que midió el lenguaje",
        p1: "En 1948, un ingeniero llamado Claude Shannon publicó un artículo que, literalmente, encendió la era digital. Lo curioso es que no intentaba crear una inteligencia artificial ni enseñar a escribir a una máquina. Su problema era mucho más terrenal: trabajaba en los Laboratorios Bell y buscaba cómo comprimir datos para meter más llamadas y telegramas por un mismo cable.",
        p2: "Se dio cuenta de algo fascinante: el lenguaje humano es tremendamente predecible, o como él lo llamó, redundante. Si te escribo «Ques», tu cabeza no necesita la «o» final para saber la palabra. Esa «o» no aporta casi nada nuevo, porque ya estabas seguro de que venía.",
        p3: "Para medir cuánta «información de verdad» lleva un idioma, Shannon hizo justo lo que tú acabas de hacer: calculó las probabilidades de las letras sobre montañas de texto y dejó que las matemáticas escribieran solas, con sus tablas y una chispa de azar.",
        quoteIntro:
          "Usando un modelo de bigramas —mirando solo la letra anterior, igual que tu máquina—, esto fue lo que salió en su estudio de 1948:",
        quote:
          "ON IE ANTSOUTINYS ARE T INCTORE ST BE S DEAMY ACHIN D ILONASIVE TUCOWE AT TEASONARE FUSO TIZIN ANDY TOBE SEACE CTISBE",
        p4: "Exacto: el mismo balbuceo con buen acento que acaba de soltar tu modelo. Letras que encajan de dos en dos, pero incapaces de formar palabras con sentido, porque la máquina no tiene memoria suficiente.",
        p5: "Con ese experimento Shannon fundó la Teoría de la Información, le dio al mundo el concepto de «bit» y demostró por primera vez que el lenguaje humano se podía traducir a pura estadística. Las tablas de pares que has construido aquí son la réplica exacta del primer modelo de lenguaje de la historia. Has reinventado en una tarde el ladrillo sobre el que se sostiene todo el internet moderno.",
      },

      /* ─── La decepción · "vaya mierda" ─── */
      disappointment: {
        text: "Y ahora la mala noticia. Si lo lees otra vez, casi suena a un idioma de verdad: las letras encajan… pero no son palabras. Un balbuceo con buen acento. Lo hemos conseguido, escribe sola. Pero vaya mierda, ¿no? ¿Por qué escribe tan mal?",
      },

      /* ─── §6 · El defecto fatal y ver más ─── */
      s6: {
        label: "¡Vamos a escribir!",
        heading: "El techo del bigrama",
        lead: "Antes de arreglarlo, entendamos por qué escribe tan mal. ¿Qué viene tras «th»? A la máquina la «t» le da igual: solo mira la «h». Para ella, «th», «sh» y «wh» son exactamente lo mismo.",
        afterBlindness:
          "No es que sea olvidadiza. Es ciega de nacimiento. Por mucho texto que le des, jamás distinguirá «th» de «sh». No es un fallo que se arregle con más datos. Es el techo del modelo.",
        ladderPrompt:
          "¿Y si pudiera ver más de una letra? El turno es tuyo: una palabra se va revelando letra a letra y tú apuestas por la siguiente.",
        afterLadder:
          "¿Lo notaste? Con una letra ibas a ciegas. Con casi toda la palabra delante, casi seguro. Más contexto, mejor predicción. Eso es justo lo que a nuestro modelo le falta: solo ve una pieza hacia atrás. Igual que tú con la «hola»: reacciona a lo último que oyó, sin enterarse del resto.",
        ladderCoda:
          "¿Y si le enseñamos a mirar dos letras? ¿Tres? ¿Cinco? Eso ya es otro modelo. Y es el siguiente.",
      },

      /* ─── ContextBlindnessDemo (bridges) ─── */
      contextBlindness: {
        label: "Interactivo · El defecto fatal",
        hint: "Cambia el prefijo y mira si la predicción se mueve.",
        pickPrompt: "Elige un prefijo. ¿Qué predice la máquina después?",
        modelSees: "La máquina solo ve",
        invisible: "es invisible",
        identical: "Los tres dan lo mismo.",
      },

      /* ─── ShannonContextLadder · adivina la palabra letra a letra («cupido») ─── */
      shannonLadder: {
        certaintyLabel: "Certeza",
        progressLabel: "Aciertos",
        roundLabel: "Ronda {n} de {total}",
        nextLetter: "Otra letra",
        seeWord: "Ver la palabra",
        again: "Otra vez",
        word: "cupido",
        verdictLabel: "El puente",
        // Una palabra se revela letra a letra. Las distribuciones son orientativas, no conteos
        // reales; lo honesto es que se ESTRECHAN. Con poco contexto fallas; al final, casi seguro.
        rounds: [
          {
            prefix: "c",
            answer: "u",
            hint: "Con una letra no hay forma: ca, co, cu, ce, ci… todas siguen vivas.",
          },
          {
            prefix: "cu",
            answer: "p",
            hint: "Dos letras y sigue muy abierto: cua, cue, cui, cum, cup, cur…",
          },
          {
            prefix: "cup",
            answer: "i",
            hint: "La trampa: cupo y cupón tiran de la «o». Pero esta vez la palabra gira hacia «i».",
          },
          {
            prefix: "cupi",
            answer: "d",
            hint: "Ahora se cierra: la «d» destaca clarísima sobre el resto.",
          },
          {
            prefix: "cupid",
            answer: "o",
            hint: "Con casi toda la palabra delante, la «o» es casi un hecho.",
          },
        ],
        verdict:
          "Con una letra ibas a ciegas. Con casi toda la palabra, casi seguro. Eso es justo lo que al bigrama le falta.",
      },

      /* ─── CTA rehecha · puente al n-gram ─── */
      cta: {
        primaryKicker: "Capítulo siguiente",
        primaryChapter: "02 · N-gramas",
        primaryTitle: "El modelo solo recuerda la última letra. Vamos a darle memoria.",
        primaryDesc:
          "Una letra de contexto no basta. ¿Y si mira dos? ¿Tres? Eso ya es el modelo N-gram.",
        primaryCue: "Continuar",
        primaryHref: "/lab/ngram",
        secondaryLabel: "Abrir Lab Libre",
        secondaryDesc: "Salta la historia. Todas las herramientas, sin guion.",
      },
    },
  },
  /* "Entrena tu propio bigrama" — the playground hero (bench-only for now). */
  trainBigramLab: {
    lead: "Vamos a entrenar un bigrama con tu propio texto. Cuanto más le des, mejor escribirá.",
    placeholder: "aquí cabe un libro entero…",
    upload: "subir un .txt",
    sample: "Shakespeare de ejemplo",
    clear: "vaciar",
    count: "{n} caracteres · hasta {cap}",
    truncated: "más del tope: se usarán los primeros {cap} caracteres",
    tiny: "con tan poco texto saldrá tartamudo — vale igual",
    train: "entrenar",
    readingMarker: "leyendo tu texto",
    pairsLabel: "parejas contadas",
    skip: "saltar al final",
    cellsUsed: "{used} de 729 celdas con datos",
    cellCount: "«{row}» → «{col}» · {n}",
    cellNever: "«{row}» → «{col}» · nunca",
    foldReport: "{letters} letras · {accents} acentos planchados (á→a) · {symbols} signos→␣",
    foldTruncated: "recortado a {cap}",
    tabTable: "la tabla",
    tabWrite: "escribir",
    retrain: "otro texto",
    tableHint:
      "cada fila es una letra y cada columna quién la sigue; al tocar una celda se abre su fila",
    rowLabel: "después de «{ch}»",
    rowTotal: "{n} veces en total",
    rowSlot: "«{ch}» · {n} veces · {pct}%",
    modeSolo: "solo",
    modePaso: "paso a paso",
    modeManual: "tú eliges",
    tempLabel: "temperatura",
    tempCold: "fiel",
    tempHot: "caos",
    seedLabel: "empezar desde",
    go: "escribir",
    pause: "pausa",
    more: "seguir",
    lettersWritten: "{n} letras",
    backoffNote: "fila vacía → letra suelta",
    copy: "copiar",
    copied: "copiado",
    clearOut: "borrar",
    next: "siguiente letra",
    auto: "auto",
    autoStop: "parar",
    stepRow: "la fila de «{ch}»",
    stepSpin: "el dado cargado gira…",
    stepLanded: "sale «{ch}»",
    manualHint: "el dado eres tú: cualquiera de las encendidas vale; las apagadas, jamás",
    pickSlot: "«{ch}» · {n} veces · {pct}%",
    pickZero: "«{ch}» · 0 veces — el modelo no puede elegirla",
    rollForMe: "que tire el dado por mí",
    outEmpty: "lo que escriba aparecerá aquí…",
    glimpseLabel: "la fila que consulta",
  },
  bigramBuilder: {
    placeholder: "Escribe tu propio texto…",
    editText: "editar texto",
    apply: "Aplicar",
    cancel: "Cancelar",
    start: "Empezar a Construir",
    complete: "✓ Tabla completa — cada par ha sido contado.",
  },
  bigramWidgets: {
    nnComparison: {
      title: "Interactivo · Bigrama vs. Red Neuronal",
      bigramTitle: "Probabilidades del Bigrama (contando)",
      neuralTitle: "Pesos de la Red Neuronal (aprendido)",
      stats: {
        steps: "Pasos de entrenamiento:",
        distance: "Distancia:",
        match: "✓ Los pesos neuronales coinciden estrechamente con las probabilidades del bigrama",
      },
      buttons: {
        train: "Entrenar 1 Paso",
        auto: "Auto-Entrenar ×20",
        reset: "Reiniciar",
      },
      caption:
        "La red neuronal aprende pesos que convergen a las mismas probabilidades de transición que el modelo bigrama calcula al contar.",
      progression: "Instantáneas:",
      live: "En vivo",
      emotionalMoment:
        "Estos números aleatorios, entrenados con nada más que descenso de gradiente, aprendieron exactamente lo que el conteo nos dio.",
    },
    textToNumbers: {
      placeholder: "Escribe algo…",
      empty: "Empieza a escribir para ver los códigos de los caracteres…",
      tooltip: "código:",
    },
    pairHighlighter: {
      hint: "Pasa el ratón sobre un carácter para ver su par bigrama",
    },
    memoryLimit: {
      modelSees: "El modelo solo ve",
      invisible: "es invisible",
      topPredictions: "Predicciones principales después de 'h'",
      tryOthers: "Prueba a cambiar entre th, sh, wh — ¿son diferentes las predicciones?",
      allIdentical: "Las tres dan predicciones idénticas.",
      explanation:
        "El bigrama solo ve 'h'. La letra anterior — t, s o w — es completamente invisible. Tres significados diferentes, una adivinanza ciega.",
    },
    matrixOverlay: {
      dismiss: "Haz clic para descartar",
      after: "Después de",
      mostCommon: "el carácter siguiente más común es",
      tryHovering: "— intenta pasar el ratón sobre la fila",
      inMatrix: "en la matriz de abajo.",
      clickToDismiss: "clic para descartar",
    },
    heroAutoComplete: {
      placeholder: "e",
      after: "Después de “{input}”, probable sigue",
      hint: "Escribe un carácter para ver predicciones",
    },
    softmax: {
      title: "Temperatura Softmax · Conceptual",
      description:
        "La temperatura rediseña la distribución de probabilidad sin cambiar el ranking de los tokens. La temperatura baja agudiza la distribución; la temperatura alta la aplana.",
      label: "Temperatura",
      deterministic: "Determinista",
      neutral: "Neutral",
      chaotic: "Caótico",
      mode: {
        deterministic: {
          label: "Determinista",
          sub: "Siempre elige el token superior. Sin creatividad.",
        },
        conservative: {
          label: "Conservador",
          sub: "Principalmente elige los tokens superiores con variedad ocasional.",
        },
        neutral: {
          label: "Neutral",
          sub: "Muestreo estándar — equilibrio entre calidad y diversidad.",
        },
        creative: {
          label: "Creativo",
          sub: "Explora opciones menos probables. Salida más sorprendente.",
        },
        chaotic: { label: "Caótico", sub: "Casi uniforme — elige casi cualquier token al azar." },
      },
      presets: {
        deterministic: "Determinista",
        balanced: "Equilibrado",
        neutral: "Neutral",
        creative: "Creativo",
      },
      stats: {
        topToken: "Token superior",
        entropy: "Entropía",
        spread: "Dispersión",
        max: "del máx",
      },
      note: "La temperatura no cambia el conocimiento del modelo — solo cuán aleatoriamente muestrea de lo que sabe. El ranking de tokens sigue siendo el mismo; solo cambia la nitidez de la distribución.",
    },
  },
};
