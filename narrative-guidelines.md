# Directrices de Narrativa — todos los capítulos

Dirección permanente para *cómo se cuenta* un capítulo (Bigram, N-gram, MLP, Redes Neuronales,
Transformers). Acompaña a `CLAUDE.md` (producto y diseño) y a los specs de diseño por capítulo
(p. ej. `bigram-design-spec.md`, que fija tokens y visual). Esto fija la **narrativa y la
pedagogía**: qué tono, qué orden, qué se muestra y qué se calla. No cambia por tarea ni por capítulo.

> Si el diseño es "simple por fuera, sofisticado por dentro", la narrativa es
> "se siente descubierto por ti, está orquestado al milímetro".

Este documento es **chapter-agnostic**. Para no repetir la crítica a mano en cada capítulo:
1. Lee los **pilares** y la **voz**.
2. Audita el capítulo con el **Protocolo de crítica** (§ más abajo) — produce un análisis y un
   manifiesto de visualizadores.
3. Reescribe siguiendo los pilares; pasa la **checklist** por cada sección.
4. Diagnostica recaídas con los **patrones de fallo** (§ Diagnóstico).

---

## Qué buscas, en una frase

> **Una historia que engancha y hace gracia, donde el usuario —sin saber nada de mates ni de
> programación— re-inventa él mismo el modelo, partiendo de cómo funciona su propio cerebro, sin
> que nada se le dé jamás como definición.**

El capítulo no *explica* el modelo: hace que el lector lo *descubra* y, al final, le pone nombre a
algo que ya entendía.

---

## Los pilares

**1 · Engancha desde la primera línea.** Cada sección abre con tensión (pregunta, sorpresa, reto).
Si un párrafo no genera ganas de leer el siguiente, sobra.

**2 · Diviértete, y haz reír.** El humor rompe el hielo con lo complejo. Voz de amigo listo y
divertido, nunca de profesor. Una reacción honesta ("conseguimos escribir, pero… vaya desastre")
hace que lo difícil no asuste.

**3 · Que lo descubra el usuario; nunca se lo des hecho.** Nada como definición. Ve, prueba, falla,
nota el patrón — y *solo entonces* se nombra. El orden es **siempre sentir → nombrar**.

**4 · Cero conocimiento asumido.** Lo entiende alguien sin programación ni matemáticas. No se asume
qué es un modelo, una probabilidad, una predicción, un vector, una capa… Si una frase exige saber
algo de antes, se reescribe desde la intuición.

**5 · Si se puede mostrar, no se cuenta.** Lo explicable con un visualizador interactivo se explica
así. El texto monta el escenario y hace la pregunta; el visualizador da la respuesta que el usuario
descubre tocando.

**6 · Primero el porqué, luego el cómo.** Antes de enseñar cómo funciona algo, el usuario tiene que
*querer* saberlo. Cada sección abre recordando qué problema resolvemos.

**7 · Del cerebro a la máquina.** Empieza por la intuición humana y luego transfiérela. (¿Por qué
respondes "hola" a "hola"? ¿Cómo sabes que tras "q" va "u"?) El cerebro es el puente; la máquina, la
copia. **Clave:** en el momento del cerebro no metas todavía la mecánica (conteo, pesos…), solo la
intuición.

**8 · "¿Y si…?" es el motor.** Cada transición entre ideas es una pregunta *del usuario*, no un
anuncio del narrador. Cada "¿y si?" lo responde el siguiente visualizador. Define la **escalera de
"¿y si?"** *antes* de escribir una sección — es su esqueleto.

**9 · Gánate cada palabra.** Ningún término técnico aparece antes de que el usuario haya *sentido*
la cosa que nombra. Una palabra técnica "a secas" es un fallo.

**10 · Predecir antes de revelar.** Antes de que un visualizador enseñe la respuesta, el usuario
adivina. Patrón: **adivina → revela → "¿lo viste venir?"**. Diséñalo psicológicamente para que
acierte y se sienta listo: pocas rondas (3-4), y que no sea siempre correcto a la primera (ni nunca).
Y el caso **tiene que ser de verdad difícil**: si el objetivo es "más contexto → mejor predicción", elige
un ejemplo donde con poco contexto **no se pueda acertar** y solo el contexto tardío fuerce la respuesta
(p. ej. una palabra rara de escribir, revelada letra a letra: «c… cu… cup… cupid… → o»). Un ejemplo que se
clava a la primera no demuestra nada — mata la lección.

**11 · Muestra el fracaso a propósito.** Deja que lo malo pase para que el usuario sienta por qué
hace falta algo mejor. El fracaso *vivido* motiva la solución mejor que cualquier advertencia.

**12 · Del lío al orden: que la estructura se invente, no se imponga.** Las estructuras (una fila,
una tabla, una matriz, un vector) aparecen como solución a un caos que el usuario *siente* primero.

**13 · El arco emocional pesa tanto como el lógico.** Beats: **curiosidad → pequeña victoria →
victoria mayor → triunfo → decepción → nueva curiosidad.** Diseña la montaña rusa, no solo el temario.
Orden importa: **celebra el logro ANTES del anticlímax honesto** (—lo has construido tú, desde cero— *y luego*
—pero mira qué mal escribe—), no al revés. Primero que sienta que lo logró; luego la pega que abre lo siguiente.

**14 · Cierra el círculo (bookends y callbacks).** La idea con la que abres vuelve al final.
Recuperar el gancho inicial da sensación de *historia completa*.

**15 · Honestidad sobre los límites.** No escondas las simplificaciones: conviértelas en el siguiente
"¿y si?". Admitir el límite abre la siguiente puerta y enseña pensamiento crítico de regalo.

**16 · Coherencia del ejemplo y del dato.** Un único hilo conductor (una frase ancla que reaparece)
y claridad constante sobre **qué dato/corpus** estamos mirando en cada momento.

**17 · Craft hasta en los botones.** Transiciones, CTAs y micro-animaciones son narrativa. Un botón
feo de "siguiente capítulo" rompe el hechizo igual que un párrafo malo.

**18 · Rehacer, no parchear.** Si un visualizador no sirve a la idea, se rehace desde cero. Un parche
sobre algo que nunca fue lo que buscabas sigue sin serlo.

**19 · Ritmo y variedad del cuerpo — el texto no es un muro.** El cuerpo no puede ser párrafo tras
párrafo. Donde haya varios seguidos, **córtalos** y **varía el elemento**:
- **Plegables de HISTORIA (1-2 por capítulo, máx.):** historias verídicas y fascinantes ancladas a su beat
  (Markov contando letras a mano; Shannon en 1948 midiendo el lenguaje y soltando el MISMO galimatías que tu
  modelo). Kicker **«Historia»**, opt-in, nunca esconden lo jugoso del flujo principal. Son un **premio**, no
  relleno — por eso el tope de 2. Vale la pena **buscar activamente** historias así de buenas para cada capítulo.
- **Callouts / cajas** (primitiva `KeyTakeaway`, sage) para una idea clave o un dato que merece marco propio.
- **Una frase destacada en grande** (como el nombre «modelo de bigramas») para un momento.
- Un **visualizador** o un **pull-quote** entre bloques.
Regla: si ves 3+ párrafos seguidos sin nada que rompa, mete un elemento distinto o poda. El widget tampoco
lleva su propio texto de encuadre (eso es cuerpo) — ver el gate "texto mínimo en el widget" en `kit/AGENTS.md`.

---

## La voz

- **Cómplice, no docente.** Habla *contigo* (segunda persona), no *sobre el tema*.
- **Curiosa de verdad.** El narrador se sorprende con el usuario, no desde arriba.
- **Humor seco y breve.** Una pulla cada cierto tiempo, nunca forzada.
- **Frases cortas.** El ritmo es parte del enganche. Una idea por frase.
- **Sin condescendencia.** "Fácil", "obvio", "simplemente", "claramente" están **prohibidas**.
  También la condescendencia implícita ("tómate un momento para apreciar", "mejor de lo que esperarías").
- **Honesta con lo feo.** Cuando algo sale mal, lo dice ("vaya desastre").
- **Puntuación humana (es).** El guion largo `—` se usa con cuentagotas. Por defecto: punto, coma o
  dos puntos. Racimos de guiones = delator de tono IA. Evita la frase-de-manual y la pregunta
  retórica profesoral ("¿Cómo podríamos enseñar a una máquina a…?").

### No suenes a IA — los 7 delatores (es)

La voz tiene que parecer de un amigo listo, no de un modelo. Estos son los tics que delatan a una IA;
evítalos siempre. (Después de escribir prosa importante, manda un agente a auditarla contra esta lista.)

1. **Ritmo de metralleta (fobia a las comas).** No escribas todo en frases cortas sujeto-verbo-predicado.
   Punto. Otra. Punto. Eso es un metrónomo y cansa. **Mezcla**: una frase larga que desarrolla una idea y
   se deja llevar un poco, y de golpe una de tres palabras para rematar. Musicalidad, no uniformidad. (Esto
   matiza el pilar de «frases cortas»: corto para el GOLPE, largo para desarrollar; no corto para todo.)
2. **Bisagras de metal (conectores obvios).** No abras frases ni párrafos con «Además, Por lo tanto, Sin
   embargo, En este sentido, Cabe destacar, Es por ello que…». Enlaza las ideas de forma natural, sin
   anunciar la relación lógica.
3. **Azúcar sintético (sobredosis de adjetivos).** Nada de adjetivos/adverbios rimbombantes. No «un método
   verdaderamente innovador y fascinante», sino «un método distinto». Prohibidos crucial, esencial,
   transformador, épico, fascinante (de relleno).
4. **Gancho de patio de colegio.** Jamás «Imagina un mundo donde…», «¿Alguna vez te has preguntado cómo…?»,
   «En el acelerado mundo digital de hoy…».
5. **La moraleja obligatoria.** No cierres cada párrafo con una frase-resumen que da la lección («Así queda
   demostrado que…»). Suelta la información, punto y aparte, sigue.
6. **Estructura de hamburguesa.** Nada de intro que parafrasea + lista de 3-5 puntos en negrita + cierre. Lo
   humano es más lineal y un poco caótico, salta de una idea a otra sin seccionarlo todo.
7. **Síndrome del copywriter (marketing americano).** Nada de «Descubre cómo lograrlo», «Eleva tu proyecto al
   siguiente nivel», «Adéntrate en el mundo de…». Explica sin vender. Conversación, no anuncio.

---

## Checklist de calidad narrativa

Pásala por **cada sección** antes de darla por buena.

- [ ] **Gancho** — ¿abre con tensión que da ganas de seguir?
- [ ] **Porqué antes que cómo** — ¿queda claro qué problema resolvemos antes de mecanizarlo?
- [ ] **Descubrimiento** — ¿hay un momento donde el usuario adivina/prueba antes de la respuesta?
- [ ] **Gana la palabra** — ¿cada término aparece *después* de la experiencia que lo hace obvio?
- [ ] **Cero asumido** — ¿lo seguiría alguien sin mates/programación sin atascarse?
- [ ] **Transición "¿y si?"** — ¿el salto a la idea siguiente es una pregunta del usuario?
- [ ] **Voz** — ¿hay voz humana? ¿Nada de "fácil/obvio/simplemente"? ¿Pocos guiones largos?
- [ ] **Mostrar > contar** — ¿lo mostrable se está mostrando, no narrando en prosa?
- [ ] **Fracaso visible** — ¿se ve el límite o el fallo que motiva el siguiente paso?
- [ ] **Dato claro** — ¿sé en todo momento qué corpus/ejemplo estoy mirando?
- [ ] **Cierre** — ¿el final conecta con el gancho inicial o engancha al siguiente capítulo?
- [ ] **Cada visualizador se gana su sitio** — ¿responde a una pregunta que el usuario *acaba* de hacerse?
- [ ] **Poda** — ¿se puede borrar algún párrafo sin perder nada? Si sí, bórralo.

### Puerta de FLUJO (a nivel de sección — el paso que más se olvida)

La checklist de arriba es **por beat**. No basta: el fallo más común no es una frase mala, es el **flujo** —
puentes flojos o **duplicados** (la misma idea presentada dos o tres veces en secciones distintas), arco
emocional plano, beats que no se pasan el testigo. La copy vive repartida en claves i18n, así que **nadie lee
el capítulo de corrido**. Por eso, antes de tocar copy: **regenera y lee un MIRROR vivo del capítulo entero**
(toda la prosa en orden de render + marcadores de widget, resuelta desde i18n). Para Bigram:
`node gen-bigram-prose.mjs` → `bigram-narrative.md` (persistente, no se borra; regéneralo tras cada cambio).
Léelo ENTERO, no solo tu sección — el concepto que vas a añadir suele estar YA introducido en un beat
anterior. Entonces exige:

- [ ] **El arco sube** (pilar 13): curiosidad → logro → logro mayor → triunfo → decepción honesta → nueva curiosidad.
- [ ] **Cada beat puentea al siguiente** con un "¿y si?" del lector (pilar 8). Ninguna sección arranca en seco.
- [ ] **Cero duplicación.** Dos párrafos que dicen lo mismo (p. ej. el `twist` de un widget y el párrafo
      siguiente anunciando ambos "el mundo real tiene mayúsculas") → fusiona o borra uno. Fallo duro.
- [ ] **Descubrir-no-definir se mantiene ENTRE beats** (un término nunca se usa antes del beat que lo gana).
- [ ] **Coherencia de anclaje** (pilar 16): el lector nunca se pregunta "¿qué texto miro ahora?".

Reescribe en el `.md` hasta que fluya; solo entonces porta a `es.ts`/`en.ts` (en sincronía). No borres el `.md`:
es el mirror persistente (regenéralo con `node gen-bigram-prose.mjs` tras cada cambio).
Regla: *si editaste una clave i18n sin leer antes la prosa de su sección entera, lo hiciste mal.*

---

## Diagnóstico — patrones de fallo (cómo detectar una narrativa rota)

Estos son los modos de fallo recurrentes. Cada uno tiene un **olor** (cómo lo detectas leyendo el
código/copy) y una **cura** (antes → después). Salieron del capítulo Bigram, pero son universales.

**P1 · Define antes de mostrar.** *Olor:* un término técnico o una fórmula aparece y luego se
explica. *Cura:* mueve el nombre a *después* del visualizador que lo hace obvio.
> Antes: "Esto es un **bigrama**: un par de caracteres. P(c_n│c_{n-1})…"
> Después: *(el usuario empareja letras en un visualizador)* → "Acabas de inventar algo. Tiene nombre: bigrama."

**P2 · Tono IA / frase de manual.** *Olor:* preguntas retóricas profesorales ("¿Cómo podríamos
enseñar a una máquina a hacer lo mismo?"), enumeraciones sobre-andamiadas ("No puede leer. No sabe
qué son las palabras. Solo conoce números."). *Cura:* entra in media res, confía en el lector.
> Antes: "Un ordenador no puede entender el lenguaje. No puede leer…"
> Después: "Las máquinas solo ven números. Así que vamos a hacer algo tonto: contar."

**P3 · Guion largo como muletilla.** *Olor:* en español, `—` cada pocas palabras; racimos de 2-4
seguidos. *Cura:* sustituye por punto / coma / dos puntos. *Métrica:* cuenta los `—` del capítulo;
si superan ~1 cada 200 palabras, está roto.

**P4 · Condescendencia implícita.** *Olor:* "tómate un momento para apreciar", "funciona mejor de
lo que esperarías", "como puedes ver". *Cura:* describe el logro, no ordenes admirarlo.

**P5 · Falta el porqué.** *Olor:* el capítulo arranca en la mecánica (Shannon, contar, pesos) sin
que el usuario *quiera* esa mecánica. *Cura:* abre con el problema humano (escribir = predecir) y el
puente cerebro→máquina.

**P6 · Visualizadores huérfanos.** *Olor:* un widget excelente sin pregunta previa ni transición
"¿y si?" que lo pida; es una demo, no un descubrimiento. *Cura:* dale una pregunta antes y una
consecuencia después; si no la tiene, va fuera (pilar "se gana su sitio").

**P7 · Estructura impuesta.** *Olor:* la tabla/matriz/vector aparece "ya hecha". *Cura:* primero el
caos (contar 30 pares a mano), luego "¿y si lo organizamos?" → nace la estructura (pilar 12).

**P8 · El fracaso no se vive.** *Olor:* se *cuenta* que algo falla en vez de dejar que falle.
*Cura:* dramatízalo en un visualizador (elegir siempre el máximo → repite para siempre → "vaya mierda").

**P9 · Historia/teoría escondida en una cajita.** *Olor:* lo más jugoso (la historia de Markov) en
un sidebar colapsable. *Cura:* téjelo en su momento emocional dentro de la narrativa.

**P10 · Puente débil + CTA pobre.** *Olor:* el salto al siguiente capítulo es un botón genérico
("Next Chapter") sin pregunta que tire. *Cura:* un puente narrativo ("¿y si viera más de una pieza?")
y un CTA con craft (pilar 17).

**P11 · Parche sobre lo que nunca sirvió.** *Olor:* retocar un visualizador que ya no representa la
idea. *Cura:* rehacer de cero (pilar 18).

---

## Protocolo de crítica por capítulo (reutilizable)

Para auditar cualquier capítulo (N-gram, MLP, …) sin rehacer la crítica a mano:

1. **Mapea el flujo.** Lista, en orden, cada sección, su copy y cada visualizador (componente +
   archivo). ¿Cuál es el concepto único de cada sección?
2. **Define la escalera "¿y si?" ideal** del capítulo (pilar 8) y su **beat emocional** (pilar 13).
   Esto es la vara: la estructura *correcta*.
3. **Audita la copy.** Extrae las cadenas i18n del capítulo. Cuenta los guiones largos. Marca las
   líneas con tono IA (P2), condescendencia (P4), define-antes-de-mostrar (P1). Señala 1-2 líneas
   *buenas* como referencia de voz.
4. **Puntúa cada visualizador** contra los pilares 3, 5, 6, 7, 8, 10, 11. Veredicto explícito:
   **KEEP / REWORK (qué exactamente) / DELETE / REBUILD**. ¿Se gana su sitio? ¿Tiene pregunta antes
   y consecuencia después?
5. **Produce el manifiesto:** tabla de visualizadores (keep/rework/delete/new) + lista de elementos
   nuevos no-visualizador (interludios históricos, CTA, gancho del porqué).
6. **Escribe el blueprint:** nuevo arco con copy reescrita (español primero) + spec por widget.
7. **Construye** con archivos disjuntos y **valida en navegador** (ambos temas + reduced-motion)
   antes de dar nada por hecho.

Salida esperada del protocolo: un `<chapter>-analisis-critico.md`, una actualización del manifiesto,
y un `<chapter>-blueprint.md`. (Para Bigram esa auditoría ya está hecha: vive en la **spine**
`src/features/lab/data/bigramSpine.ts` + los componentes §1/§2; no hay ficheros sueltos
`bigram-analisis-critico.md`/`bigram-blueprint.md`.)

---

## Anti-patrones (resumen)

- Definir antes de mostrar · jerga sin ganar · transiciones "Ahora veamos…" (anuncio, no pregunta).
- Asumir que sabe qué es un modelo / probabilidad / predicción / vector / capa.
- Visualizadores que *demuestran* en vez de dejar *descubrir*.
- Retos largos, o donde siempre se acierta a la primera (aburre) o nunca (frustra).
- Historia metida en una cajita aparte cuando podría vivir en su momento emocional.
- Cambiar de frase-ejemplo o de metáfora sin motivo.
- Parchear un visualizador que nunca fue lo que buscabas.
- "Fácil", "obvio", "simplemente", "claramente". Guion largo como muletilla. Frase de manual.

---

## Apéndice por capítulo

Cada capítulo **posee un acento** y no lo mezcla (ver `CLAUDE.md`). La narrativa es la misma
filosofía; cambian el ejemplo ancla, el acento y el modelo concreto.

| Capítulo | Acento | Spec de diseño | Ejemplo ancla sugerido |
|---|---|---|---|
| Bigram | editorial-green (`--bigram-*`) | `bigram-design-spec.md` | `the cat was t…` / Shakespeare |
| N-gram | su propio acento | (su spec) | continúa el hilo del bigrama |
| MLP | su propio acento | (su spec) | — |
| Redes Neuronales | su propio acento | (su spec) | — |
| Transformers | cyan (`--lab-*`) | (su spec) | — |

> Nota: el "prototipo v10" del Bigram **no** es fuente de verdad — fue solo idea estética, ya
> implementada en los componentes. La fuente de verdad de cada reestructuración es su **blueprint** (para
Bigram, la **spine** `src/features/lab/data/bigramSpine.ts`).
