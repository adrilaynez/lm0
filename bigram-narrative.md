# Bigram — narrativa COMPLETA (mirror vivo, generado · NO editar a mano)

> Generado por `gen-bigram-prose.mjs` desde `BigramNarrative.tsx` (orden) + `es.ts` (texto).
> Léelo de corrido ANTES de tocar copy: busca duplicación, puentes flojos, arco. Regenéralo tras cada cambio.


### bigram-01

- **sectionKickers.s1** · Predecir letras

### bigram-01

- **s1.label** · El truco: predecir
- **intro.p1** · Cuando somos pequeños, nadie nos da un manual para aprender a hablar. Aprendemos viviendo: escuchamos a la gente, relacionamos un tono de voz con una cara que sonríe y, poco a poco, entendemos el significado de las cosas.
- **intro.p2** · Pero, ¿cómo le enseñas a escribir a una máquina que jamás ha vivido un solo día? Para una caja de cables y silicio, la palabra «manzana» no es dulce ni roja. No significa nada. Si no puede entender el mundo, parece imposible que escriba sobre él.
- **intro.p3** · Así que, antes de construir nada, un pequeño experimento.
  ▶▶ [VIS: FillTheBlank]
- **fillBlank.afterPlay** · Seguramente has rellenado todos los huecos sin mucho esfuerzo. Pero fíjate en el último: no tenías ni idea de qué significaba «Fli fli fla». Solo miraste lo que había escrito antes, intuiste la lógica y adivinaste lo que tocaba a continuación.
- **fillBlank.reframe** · Acabas de descubrir el truco. Como los ingenieros no podían enseñar a las máquinas a entender el mundo como nosotros, cambiaron las reglas del juego. En lugar de enseñarles a reflexionar, les enseñaron a predecir.
- **fillBlank.toLetters** · Hoy en día, los grandes modelos hacen esto con frases enteras. Pero para entender de verdad la magia que hay detrás, vamos a lo más básico de todo: predecir cuál es la siguiente letra.
- **goalIntro.lead** · Nuestro objetivo final es conseguir construir exactamente esto: le das una letra y apuesta por la que viene después.
  ▶▶ [VIS: HeroAutoComplete]
- **goalIntro.after** · Parece magia, pero en el fondo solo son matemáticas muy básicas. Ahora la gran pregunta es: ¿cómo conseguimos construir esto desde cero, si la máquina no sabe leer?

──────────


### bigram-02

- **sectionKickers.s2** · El patrón

### bigram-02

- **s2.label** · A la caza del patrón
- **s2.lead** · Nuestro idioma no es un caos. Si aporreas el teclado al azar sale algo como «asdfghjkl», y no significa nada. Escribimos siguiendo una estructura invisible: nadie te explicó que tras la «q» casi siempre va una «u», ni que es rarísimo ver tres consonantes seguidas. Tu cerebro lo fue asimilando a base de leer y escuchar.
- **s2.pairPrompt** · Como el lenguaje ya esconde ese patrón, solo necesitamos que la máquina lea textos y se fije en quién va de la mano de quién. Empecemos con una frase sencilla.
  ▶▶ [VIS: PairHighlighter]
- **s2.afterPair** · Ya hemos visto cómo busca parejitas de letras. Para entenderlo a fondo, vamos a fijarnos en una sola: la «t». Le daremos distintas frases y veremos qué letra decide que es su mejor compañera.
- **s2.focusTPrompt** · Cambia el texto y observa qué letra gana después de la «t».
  ▶▶ [VIS: IsolateT]
- **s2.afterCorpusCounting** · Según el texto que le des, aprende una regla distinta, y con tan poco texto el conteo miente. Si le damos textos muy cortos, su visión del mundo es limitada y sesgada. Para aprender las reglas de verdad, necesita muchísima más información: un texto gigante.
- **s2.bookPrompt** · Así que vamos a ponernos serios. Vamos a hacer que nuestra máquina lea a Shakespeare entero.
  ▶▶ [VIS: RowTally]
- **s2.afterShakespeare** · Esa fila es todo lo que hay sobre la «t» en todo Shakespeare. La máquina ha sacado ella sola todas sus relaciones, solo contando.
- **s2.honestyNote** · A este proceso —darle un texto gigantesco para que lo lea, lo cuente y construya sus propias tablas de reglas— se le llama texto de entrenamiento. Acabas de ver, en primera persona, cómo se entrena un modelo. (Una pega: ha aprendido de Shakespeare, así que hablará como hace 400 años. Cambia el libro y cambias la máquina.)
▸ (plegable)
- **markov.title** · Un señor, un libro y mucha paciencia
- **markov.kicker** · Historia · lectura larga · opcional
  ▶▶ [VIS: MarkovStory]

──────────


### bigram-03

- **sectionKickers.s3** · Cómo elegir

### bigram-03

- **s5.label** · Demasiado predecible
- **s5.lead** · Ahora la máquina ya sabe que, tras la «t», la «h» aparece a montones y la «o» mucho menos. Pero un puñado de conteos sueltos no sirve para escribir: 7.071 no significa nada si no sabes sobre cuántos. Hay que convertir esos números en probabilidades.
- **s5.lead2** · Y es una división de toda la vida: coges la fila de la «t», sumas todo lo que hay en ella y miras qué porción se lleva cada compañera.
  ▶▶ [VIS: NormalizationVisualizer]
- **s5.afterNormalization** · Ahí está: la misma fila, ahora en porcentajes que suman 100%. La «h» se queda con un 36%, el espacio con un 29%, la «o» con un 10%… Eso son las apuestas de la máquina.
- **s5.choosePrompt** · Y ahora la pregunta del millón: con esas apuestas sobre la mesa, ¿qué letra elige? Lo seguro sería quedarse siempre con la más alta. Veamos qué pasa.
  ▶▶ [VIS: AlwaysMaxLoop]
- **s5.afterAlwaysMax** · Siempre la «h». La opción segura resulta también la más muerta: así, tras la «t» nunca aparecería nada distinto, una «h» detrás de otra. Para escribir con algo de vida hace falta una pizca de azar; pero no uno cualquiera.
- **s5.dicePrompt** · La idea de los ingenieros fue un dado. Eso sí, un dado trucado: con un montón de caras de «h», bastantes de espacio, alguna de «o» y casi ninguna de las raras. Así casi siempre cae lo probable, pero de vez en cuando sorprende. Tíralo tú y verás.
  ▶▶ [VIS: LoadedDie]
- **s5.toMatrix** · ¡Fíjate! Ya tenemos el truco completo para la «t»: contarla, sacarle porcentajes y elegir con una chispa de azar. Y aquí la pregunta se cae sola: ¿y si hacemos esto mismo con todas las letras a la vez?

──────────


### bigram-04

- **sectionKickers.s4** · La matriz

### bigram-04

- **s3.label** · Nace la matriz
- **s3.lead** · Tenemos una fila para la «t». ¿Y la «a»? ¿Y la «h»? ¿Y todas las demás?
  ▶▶ [VIS: TinyMatrixExample]
- **s3.rowByRowReveal** · Apila una fila por cada letra y mira lo que sale: una cuadrícula. Cada fila es la letra de la que partes. Cada columna, la que podría venir después. Cada casilla, cuántas veces lo vimos.
- **s3.rowByRowName** · Acabas de construir algo con nombre propio: una tabla de transición.
  ▶▶ [VIS: GrowingMatrix27]
- **s4.charsetPrompt** · Y eso es solo un rincón del idioma: minúsculas. Faltan las mayúsculas, los puntos, las comas, los números. Cuéntalos todos y la tabla crece hasta su tamaño real, con muchísimas más reglas escondidas dentro.
- **detective.intro** · Esta es la tabla entera, de verdad. Parece un caos de luces, pero es el manual de un idioma escrito en números. Cada casilla encendida es una regla; cada hueco negro, una pareja que casi nunca pasa. Y ninguna se la enseñó nadie.
  ▶▶ [VIS: DetectiveMatrix]

──────────


### bigram-05

- **sectionKickers.s5** · Escribir solo

### bigram-05

- **s6.label** · ¡Vamos a escribir!
- **s5.writePrompt** · La tabla ya guarda todas las reglas que sigue el idioma. Y elegir una letra ya sabemos: se mira su fila y se tira el dado. Aquí está ese paso a cámara lenta, y cada letra que cae es el punto de partida de la siguiente.
  ▶▶ [VIS: LetterByLetter]
- **naming.buildup** · Y ahí lo tienes: una máquina que escribe sola. Nadie le enseñó ortografía, ni gramática, ni una sola regla. Solo contó parejas de letras en un montón de texto, y de ahí salió todo. Lo has levantado tú, desde cero.
- **s5.toFullSpeed** · Lo has visto a cámara lenta. A toda velocidad es esto: una letra tras otra, sin frenos, salen frases enteras de un tirón.
  ▶▶ [VIS: TableWriter]
- **disappointment.text** · Y ahora la mala noticia. Si lo lees otra vez, casi suena a un idioma de verdad: las letras encajan… pero no son palabras. Un balbuceo con buen acento. Lo hemos conseguido, escribe sola. Pero vaya mierda, ¿no? ¿Por qué escribe tan mal?
- **naming.revealLead** · Y eso que has levantado tiene un nombre:
- **naming.revealWord** · modelo de bigramas
- **naming.revealCoda** · El modelo de lenguaje más simple que existe. Y es el primer ladrillo de todo lo demás. ChatGPT incluido.
▸ (plegable)
- **shannon.title** · El hombre que midió el lenguaje
- **shannon.kicker** · Historia · lectura larga · opcional
- **shannon.p1** · En 1948, un ingeniero llamado Claude Shannon publicó un artículo que, literalmente, encendió la era digital. Lo curioso es que no intentaba crear una inteligencia artificial ni enseñar a escribir a una máquina. Su problema era mucho más terrenal: trabajaba en los Laboratorios Bell y buscaba cómo comprimir datos para meter más llamadas y telegramas por un mismo cable.
- **shannon.p2** · Se dio cuenta de algo fascinante: el lenguaje humano es tremendamente predecible, o como él lo llamó, redundante. Si te escribo «Ques», tu cabeza no necesita la «o» final para saber la palabra. Esa «o» no aporta casi nada nuevo, porque ya estabas seguro de que venía.
- **shannon.p3** · Para medir cuánta «información de verdad» lleva un idioma, Shannon hizo justo lo que tú acabas de hacer: calculó las probabilidades de las letras sobre montañas de texto y dejó que las matemáticas escribieran solas, con sus tablas y una chispa de azar.
- **shannon.quoteIntro** · Usando un modelo de bigramas —mirando solo la letra anterior, igual que tu máquina—, esto fue lo que salió en su estudio de 1948:
- **shannon.quote** · ON IE ANTSOUTINYS ARE T INCTORE ST BE S DEAMY ACHIN D ILONASIVE TUCOWE AT TEASONARE FUSO TIZIN ANDY TOBE SEACE CTISBE
- **shannon.p4** · Exacto: el mismo balbuceo con buen acento que acaba de soltar tu modelo. Letras que encajan de dos en dos, pero incapaces de formar palabras con sentido, porque la máquina no tiene memoria suficiente.
- **shannon.p5** · Con ese experimento Shannon fundó la Teoría de la Información, le dio al mundo el concepto de «bit» y demostró por primera vez que el lenguaje humano se podía traducir a pura estadística. Las tablas de pares que has construido aquí son la réplica exacta del primer modelo de lenguaje de la historia. Has reinventado en una tarde el ladrillo sobre el que se sostiene todo el internet moderno.

──────────


### bigram-06

- **sectionKickers.s6** · El techo

### bigram-06

- **s6.heading** · El techo del bigrama
- **s6.lead** · Antes de arreglarlo, entendamos por qué escribe tan mal. ¿Qué viene tras «th»? A la máquina la «t» le da igual: solo mira la «h». Para ella, «th», «sh» y «wh» son exactamente lo mismo.
  ▶▶ [VIS: ContextBlindnessDemo]
- **s6.afterBlindness** · No es que sea olvidadiza. Es ciega de nacimiento. Por mucho texto que le des, jamás distinguirá «th» de «sh». No es un fallo que se arregle con más datos. Es el techo del modelo.
- **s6.ladderPrompt** · ¿Y si pudiera ver más de una letra? El turno es tuyo: una palabra se va revelando letra a letra y tú apuestas por la siguiente.
  ▶▶ [VIS: ShannonContextLadder]
- **s6.afterLadder** · ¿Lo notaste? Con una letra ibas a ciegas. Con casi toda la palabra delante, casi seguro. Más contexto, mejor predicción. Eso es justo lo que a nuestro modelo le falta: solo ve una pieza hacia atrás. Igual que tú con la «hola»: reacciona a lo último que oyó, sin enterarse del resto.
- **s6.ladderCoda** · ¿Y si le enseñamos a mirar dos letras? ¿Tres? ¿Cinco? Eso ya es otro modelo. Y es el siguiente.

──────────

- **cta.primaryHref** · /lab/ngram
- **cta.primaryKicker** · Capítulo siguiente
- **cta.primaryChapter** · 02 · N-gramas
- **cta.primaryTitle** · El modelo solo recuerda la última letra. Vamos a darle memoria.
- **cta.primaryDesc** · Una letra de contexto no basta. ¿Y si mira dos? ¿Tres? Eso ya es el modelo N-gram.
- **cta.primaryCue** · Continuar
- **cta.secondaryLabel** · Abrir Lab Libre
- **cta.secondaryDesc** · Salta la historia. Todas las herramientas, sin guion.
