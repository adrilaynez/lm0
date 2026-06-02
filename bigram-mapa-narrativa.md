# Bigram — narrativa definitiva del capítulo (lock)

> El capítulo entero, en orden, con la **dirección de prosa** y **cada visualizador marcado**. Esto es
> lo que se construye; nada de inventar diseño por el camino.
>
> **Leyenda:** ✅ vale (se deja) · 🔧 rehacer (se indica *cómo*) · ⬜ construir (no existe) · ❌ quitar
> (no vale / redundante).
>
> **Objetivo:** que el lector sienta que ha construido, él y desde cero, un modelo de lenguaje DE
> VERDAD — solo contando. Enseña: predecir → contar → la tabla → muestrear → escribir. Termina en **la
> amnesia** (solo ve una letra atrás), puerta al n-gram. Humor por todo (la máquina sin corazón que aún
> así escribe) para que se sienta una historia, no una asignatura.

---

## HERO
- Eyebrow: "Capítulo 1 · La era del conteo"
- **Título: El modelo bigrama** ✅ · **Subtítulo: Enseñando a una máquina a escribir.** ✅

---

## §1 · El truco: predecir   *(toda la intro va aquí)*

Prosa (infancia → problema imposible → experimento). ✅ *escrita*
> "Cuando somos pequeños, nadie nos da un manual… aprendemos viviendo." → "¿Cómo le enseñas a escribir
> a una máquina que jamás ha vivido un día? Para una caja de cables, «manzana» no significa nada…" →
> "Antes de construir nada, un pequeño experimento."

**VIS 1 · Minijuego rellenar (3 pantallas, keystone «Fli fli fla»).** ✅ **vale** (`FillTheBlank.tsx`).

Prosa (reframe + bajada a letras). ✅
> "A las máquinas no se les pudo enseñar a entender; se cambiaron las reglas: predecir." → "No palabras.
> Letras."

**VIS 1.5 · El objetivo (tecleas una letra → predice la siguiente).** 🔧 **rehacer ligero**
(`HeroAutoComplete.tsx`): suavizar la copy imperativa; que la predicción sea un preview coherente. Estética ya en tokens.

Prosa: "Parece magia. Por dentro, mates básicas. ¿Cómo lo construimos desde cero, si no sabe leer?" ✅

---

## §2 · A la caza del patrón (la letra t)

Prosa: el lenguaje esconde patrones (tras la q casi siempre una u; nadie te lo enseñó como regla).
¿Cómo los saca una máquina? Empecemos mirando una frase. 🔧 *revisar voz.*

**VIS 2 · Pares en una frase.** 🔧 **rehacer ligero** (`PairHighlighter.tsx`): recorre la frase par a
par, los que se repiten = el patrón. Mejor frase ancla.

Prosa: "Centrémonos en una letra: la t. Si solo tuviéramos esta frasecita, ¿qué diríamos que sigue a la
t? Cuidado: con tan poco texto, el conteo miente. Vamos a leer un libro entero."

**VIS 4 · La máquina lee → fila 1×27** (`RowTally.tsx`). 🔧 **REHACER** (esto es lo que viste flojo):
- **Lectura en PÁRRAFOS**, no una línea que corre. El texto de Shakespeare se ve como un bloque
  multilínea reconocible (como tu ss3: «First Citizen: / Before we proceed any further, hear me speak.
  / All: / Speak, speak.»), con un **cursor recorriéndolo** y un **ritmo LEGIBLE** (se ve que es
  Shakespeare), igual de calmado que la lectura de los otros widgets; luego acelera para el grueso.
- **Quitar el selector «prueba otra letra»** (no hace falta). Solo la t.
- **Tabla 1×27 LEGIBLE:** ahora las columnas y los números no se leen. Celdas más grandes / números más
  claros / menos densa. Color = mismo heatmap que la matriz, pero una fila.
- Mantener el arco: pares ordenados (pills) → «¿y si lo ordenamos mejor?» → la fila 1×27 con color y el
  número real grande del ganador (**t → h ≈ 26 000** en el libro entero). Datos reales.
- Payoff: "esto es **datos de entrenamiento**. Acabas de ver entrenar un modelo."

Prosa (honestidad): "Una pega: aprendió de Shakespeare; hablará como hace 400 años. Cambia el libro y
cambias la máquina." ✅ *(absorbe la idea de «otro texto, otra máquina» — sin widget aparte.)*

**Plegable · Markov (1913).** ✅ (en su beat, tras leer/contar).

---

## §3 · Demasiado predecible (todo aún sobre la t)

Prosa: "Ya sabe qué sigue a la t. Para escribir, convierte los conteos en porcentajes." ✅

**VIS 5 · De números a porcentajes.** 🔧 **rehacer ligero** (`NormalizationVisualizer.tsx`): los
conteos se dividen por el total → %. Pulir a la biblia.

Prosa: "Tenemos porcentajes. ¿Cómo elegimos? ¿La más probable siempre?"

**VIS 6 · El bucle del máximo (the the the).** ⬜ **construir** (`AlwaysMaxLoop.tsx`, partir de
`AlwaysMaxVsSampling`): elegir siempre el máximo → se atasca: «the the the». Vive el fracaso. (Humor:
disco rayado.)

Prosa: "Hace falta algo de azar."

**VIS 7 · El dado tramposo.** ⬜ **construir** (`LoadedDie.tsx`, la otra mitad): muchas caras «h», pocas
«o»; respeta los %, casi siempre lógico, a veces sorprende.

Prosa: "¿Y si hacemos esto con TODAS las letras a la vez?"

---

## §4 · Nace la matriz

**VIS 8 · Mini-matriz «HOLA MUNDO».** 🔧 **rehacer ligero** (`TinyMatrixExample.tsx`): cambiar vocab;
apila una fila por letra → cuadrícula.

Prosa: hundir la flota (izquierda = de dónde partes, arriba = a dónde vas, el cruce = el %). ✅

**VIS 9 · Matriz 27×27 que crece leyendo.** ✅ **vale** (`GrowingMatrix27.tsx`). *(Si rehago el modo
lectura de VIS 4 en párrafos, igualar aquí para coherencia.)*

Prosa: "El mundo real no es solo minúsculas: mayúsculas, puntos, números → crece a 92×92." ✅

**VIS 10 · Matriz 92×92 DETECTIVE.** 🔧 **REHACER** (`DetectiveMatrix.tsx`): en oscuro **no se ve**
(sale negra/rojiza), es **minúscula y sin zoom**. → más contraste de calor en oscuro (rampa brillante +
suelo mínimo para celdas con conteo), **más grande + zoom/lente**, verde accent (no rojo). Mantener la
capa detective (desierto de mayúsculas, rincón de la Q, salto del punto; clic→conteo real).

---

## §5 · ¡A escribir! y el techo

**VIS 11 · La máquina de escribir.** 🔧 **rehacer** (`GenerationPlayground.tsx`): generar **en local**
desde `MATRIX_27` (el backend está caído); salta de casilla en casilla con el dado. "Parece un idioma de
lejos, galimatías de cerca."

Prosa: anticlímax honesto ("¿8000 casillas para escribir como un niño de dos años con tres cafés? Sí, y
es increíble"). Nombre «bigrama» en voz baja (el título ya lo dice). ✅

**Plegable · Shannon (1948).** ✅

**VIS · El defecto fatal / la amnesia.** ✅ **vale** (`ContextBlindnessDemo.tsx`): solo ve una letra;
«th», «sh», «wh» son lo mismo para ella.

**VIS · Más contexto, mejor predicción (puente al n-gram).** ✅ **vale** (`ShannonContextLadder.tsx`).

**CTA · puente al n-gram.** ✅ (con craft).

---

## ❌ Widgets que se QUITAN (no valen / redundantes)
- ❌ `MindReadingHook` — sustituido por VIS 1.
- ❌ `ShakespeareRowCounter` — sustituido por VIS 4 (RowTally).
- ❌ `CorpusCountingIdea` — el «texto corto miente» lo absorbe RowTally (empieza ganando el espacio y la
  h adelanta al leer más). Sobra el selector de letra.
- ❌ `MatrixRowByRowBuilder` — sustituido por VIS 9.
- ❌ `TrainingTextComparison` — «otro texto, otra máquina» se cuenta en la nota de honestidad de §2.
- ❌ `StorageProblemVisualizer` — el crecimiento ya se ve en VIS 9.
- ❌ `TransitionMatrix` (modo juego viejo) en la narrativa — sustituido por DetectiveMatrix.
  *(El archivo se mantiene: lo usa el Lab Libre. No se toca.)*

## Resumen de trabajo
- 🔧 **Rehacer fuerte:** VIS 4 (párrafos + legible + sin selector + ritmo), VIS 10 (oscuro+zoom+tamaño),
  VIS 11 (generación local).
- ⬜ **Construir:** VIS 6 (bucle máximo), VIS 7 (dado).
- 🔧 **Ligero (pulir a la biblia):** VIS 1.5, VIS 2, VIS 5, VIS 8.
- ✅ **Valen:** Hero, intro, VIS 1, VIS 9, blindness, Shannon, plegables, CTA.
- ❌ **Quitar:** 7 widgets viejos (arriba).
