# Bigram — log de cambios y aprendizajes

> Historial vivo de la reconstrucción del capítulo Bigram: qué se cambió, **por qué**, y sobre todo
> **qué NO funcionó** (para no repetirlo en n-gram/MLP). Se actualiza con cada iteración.

---

## Decisiones clave (qué se cambió y por qué)

- **Arco reordenado.** Antes: contar → matriz → muestreo. Ahora: contar la «t» → **% + dado sobre la
  «t»** → matriz → escribir. *Por qué:* muestrear de una matriz 92×92 que acabas de conocer es
  abstracto; resolver UNA letra entera primero lo hace tangible (unidad mínima completa antes de
  escalar).
- **Datos reales.** Módulo `bigramCorpus.ts` + `shakespeareText.ts` (tinyShakespeare real, 300 KB) →
  los conteos que suben son verdaderos (t→h gana de verdad), no falseados. *Por qué:* el usuario detecta
  al instante los números inventados.
- **Hero:** título grande "El modelo *bigrama*" + subtítulo simple. *Por qué:* el título tiene que
  enganchar fuerte; el subtítulo debe ser humano, no retórico.
- **Intro dentro del §1.** Toda la historia de infancia vive en "01 · El truco: predecir".
- **Label de sección:** «01» + dos palabras (kicker) + barra; en el side rail el kicker aparece al pasar
  el ratón. *Por qué:* el título grande ya está; el sub-número no debe repetirlo, pero «01» a secas es
  demasiado pobre.
- **Voz:** español primero, sin mencionar idiomas, sin órdenes al lector, sin guiones-muletilla, sin el
  patrón AI de tres frases cortas en paralelo. Humor honesto por todo el capítulo.
- **Método de visualizadores corregido** (biblia §9): idea + imagen final ANTES que la mecánica;
  legibilidad y ritmo como requisitos duros; verificar en navegador; simplicidad > ambición; el diseño
  no se delega.

---

## Sesión — §2 a nivel «enamora» (VIS3 + VIS4 + plegable Markov)

> Objetivo fijado por el usuario: **dejar §1 y §2 perfectos** y que ese sea el nivel de referencia para
> §3-§5 (que haré yo solo). Estos son los cambios de esta tanda.

- **VIS 3 · IsolateT — idioma de marcado idéntico a VIS 2.** El usuario: *«fíjate cómo se marca una y la
  siguiente, quiero que sea idéntico en todas»* + *«frases mucho más largas»* + *«que se cuente poco a
  poco»*. Reescrito: misma marca que PairHighlighter (la letra actual = chip relleno *hot1*; la siguiente
  = tinte suave con anillo *hot2*). **3 frases largas verificadas** (ganador h / ␣ / o, comprobado con el
  mismo `norm` del widget). Auto-escaneo gradual (46 ms entre letras, 300 ms de pausa en cada «t»). Línea
  «PAR ACTUAL t→x · primera vez / se repite».
- **VIS 3 · legibilidad (2ª iteración).** El usuario: *«se sigue sin leer como debería»* (las letras
  grandes partían palabras: «i / t»). Arreglo: agrupado **por palabras** (cada palabra es una unidad
  `nowrap`, los espacios son los únicos puntos de salto), tamaño bajado a `clamp(17,2.2vw,23)`. Ahora se
  lee como una frase. Refactor a componente interno `Scanner` con `key={tab}` (remonta al cambiar de
  texto → sin reset de estado dentro de un efecto; cumple `react-hooks/set-state-in-effect`).
- **VIS 4 · RowTally — modo papiro + arranque más corto.** El usuario: *«ponlo en modo papiro como se lee
  el otro»* + *«que no dure tanto en contar al principio»* + *«la tabla era una basura»*. Cambios:
  - **Un solo lector pergamino** para todo (antes: letras gigantes al principio). En el escaneo lento se
    encienden la «t» (*hot1*) y su siguiente (*hot2*) dentro del párrafo; luego corre. Superficie con
    borde + sombra interior (sensación de hoja).
  - **Arranque más corto:** `SCAN_HITS` 30 → **12**, retardos más rápidos (pausa «t» 200→100 ms).
  - **Resultado legible:** **barras verticales ordenadas** (las más altas primero, ganador brillante) +
    **fila de calor horizontal** de 27 casillas con eje a-z (anticipa la matriz). Marca «Leyendo el
    libro» + hairline de progreso.
  - **Análisis después de Shakespeare** (`afterShakespeare`, datos reales del corpus de 300 K): la barra
    más alta es «h»; la 2ª, el espacio (palabras que acaban en «t»); huecos = pares que casi nunca pasan
    (t, z, q). Enseña a *leer* la fila. Humor honesto («sin corazón ni intuición»).
- **VIS 4 · RowTally — la FILA de posición fija (no barras ordenadas).** El usuario: *«la barra no va
  bien del todo… lo que quería mostrar era una fila de la transición, ponerlo en una fila para almacenar
  los datos donde siempre está en la misma posición»*. Las barras ordenadas (reordenaban por tamaño)
  contradecían justo eso. Cambio: **27 columnas en orden fijo** (espacio, a-z) — barras + casillas de
  calor + etiquetas comparten la misma rejilla y se alinean ranura a ranura. La barra de cada letra
  **nunca se mueve de su sitio**; las vacías (b, j, k, q…) se ven vacías en su posición. Hover en
  cualquier ranura → el readout muestra esa letra y su número. Mensaje final reescrito: *«27 casillas
  fijas, cada letra siempre en el mismo sitio… así se guarda lo que viene tras la t en una sola fila»*.
  Es la fila de la matriz (almacenamiento de posición fija), que luego se apila.
- **VIS 4 · números que suben sobre las barras + caption + prosa.** El usuario: *«mete los números para
  que se vea cómo avanza»* + *«ese texto [la caption] es un basurón»* + *«debería salir info sobre la
  lista»* + *«la prosa siguiente, mejor redactada, siguiendo las políticas»*. Cambios:
  - Cada barra lleva su **número, que sube en su sitio** (montado sobre la punta de la barra, formato
    compacto «7.1k» para que no desborde la columna de 21 px; solo en barras con altura ≥5 % para no
    saturar). Se ve crecer h hasta 7.071.
  - **Caption del done reescrita** (era la de «27 casillas fijas»): ahora es el análisis corto de la
    fila (la más alta es «h», la 2ª el espacio, los huecos t/z/q son regla).
  - **Prosa narrativa posterior** (`afterShakespeare`) reescrita siguiendo `narrative-guidelines` (voz
    cómplice, sin imperativos, sin «fácil/obvio», pocos guiones): «esa fila es lo que la máquina sabe
    sobre la t… las casillas vacías son las esquinas que el idioma no pisa…».
- **VIS 3 · sin auto-play: botón Empezar + Autocompletar.** El usuario: *«que no aparezca [se reproduzca]
  si no estás ahí; un botón de empezar y uno de autocompletar»*. El `Scanner` ya no escanea al montar:
  arranca en **idle** (texto tenue + «Leer este texto» / «Ver el total»); «Empezar» anima el conteo,
  «Autocompletar» salta al total, y al terminar aparece «↻ Otra vez». Reduced-motion entra directo en
  done. Cumple `set-state-in-effect` (el efecto solo limpia el timer al desmontar).
- **Prosa `afterShakespeare` — varias pasadas anti-AI.** El usuario rechazó dos versiones por sonar a
  máquina (la larga poética y la del «Esa fila es todo lo que la máquina sabe… las sacó ella sola, solo
  contando» con punto y coma equilibrado). Versión final, con su propio encuadre pedido: *«Esa fila es
  todo lo que hay sobre la «t» en todo Shakespeare. La máquina ha sacado ella sola todas sus
  relaciones, solo contando.»* (mencionar a Shakespeare está bien: es el autor, no el idioma).
- **Plegable Markov — etiqueta «Historia» + aviso de largo.** `ExpandableSection` admite un `kicker`
  (eyebrow mono). El de Markov: «Historia · lectura larga · opcional», para que se vea que es una
  historia extensa y saltable antes de abrirla.
- **Plegable Markov — historia completa.** El usuario aportó una versión rica (Nekrásov vs Márkov,
  «Andrés el Iracundo», Eugenio Oneguin, contar 20.000 letras a mano). Reescrito a **7 párrafos** que
  encajan con la narrativa, con humor y **sin spoilers**: el cierre sobre la «falta de memoria» se deja
  como *teaser* («una idea con muchas más consecuencias de las que parece»), sin revelar que es el fallo
  fatal del §5. `markov.body` → `markov.paras` (array) en en/es; render `MarkovStory` por idioma.



- ❌ **Showpieces hechos por agentes "a ciegas".** Specs centrados en coreografía/motion → salió
  espectáculo en vez de comprensión, monótono, ilegible. *Arreglo:* el estándar nuevo (idea/legible/
  rápido/verificado-en-navegador).
- ❌ **VIS 4 v1 "Caos y Orden" (pares flotando).** Gimmick, lento (30 s para llegar a 30), no
  estructurado, no se veía que era Shakespeare. *Arreglo:* `RowTally` — pares ordenados → tabla 1×27 con
  número + color, rápido, sobre el libro entero. Lectura en **párrafos** (texto literal).
- ❌ **VIS 4 v2 (RowTally) primera pasada.** Columnas ilegibles, selector de letra innecesario,
  demasiado rápido, lectura en una línea que corre. *Arreglo:* párrafos, sin selector, números más
  grandes.
- ❌ **Subtítulo del hero, varias iteraciones:**
  - "type your word → coincide" (juego pasivo) → flojo.
  - "Vamos a construir una máquina que escribe… copiándote" → afirmaba el plan, sin gancho.
  - "Nunca ha vivido. No entiende nada. Y aun así…" → **patrón AI** (tres frases en paralelo).
  - "…parece imposible. Resulta que solo hace falta contar." → seguía sin gustar.
  - ✅ "Enseñando a escribir a una máquina, desde cero y solo contando." → simple, aceptado.
- ❌ **Frase "No vamos a predecir palabras: vamos a predecir letras."** Cortaba el ritmo. *Arreglo:*
  "…vamos a lo más básico de todo: predecir cuál es la siguiente letra."
- ❌ **Label de sección = título completo** (redundante con el Heading) → luego «01» a secas (demasiado
  pobre) → ✅ «01» + kicker de 2 palabras + barra.
- ❌ **Matriz detective en oscuro:** casi negra, minúscula, sin zoom. *(Pendiente de rehacer:
  contraste + zoom + tamaño.)*

---

## Sesión — §3 (porcentajes, máximo, dado) + §5 fila + §4 flag

- **§3 VIS 6 + VIS 7 — solo la «t», con porcentajes (barra horizontal acumulada).** El usuario rechazó la
  fila de 27 ranuras y el «the the the» multi-letra: §3 aún no generaliza. Ambos operan **solo sobre la
  fila de la «t»** mostrando los **%** como **una barra horizontal** (cada cara con tamaño según su %).
  VIS 6 = siempre el máximo → siempre «h» (aburrido). VIS 7 = **lo tiras tú**: el dado saca un número
  0–100 y cae sobre la barra; el tramo que cubre ese número es la letra (h ocupa 0–36 → casi siempre «h»,
  pero no siempre). Datos: `bigramShakespeare27.ts` (fila «t» idéntica a VIS 4).
- **VIS 5 — la fila como en Shakespeare.** Hero: de strip top-8 a **27 columnas en orden fijo + fila de
  calor + eje a-z**, mismo CSS que VIS 4 (barras finas, ganador `accent-bright`, número compacto sobre las
  altas que cambia conteo→% por paso).
- **§4 VIS 9 — REHACER (flageado).** El usuario: *«como Shakespeare, copiar ese visualizador pero con una
  matriz 27×27 en vez de una fila, y progresivo igual»*. Objetivo: reusar el **lector papiro + relleno
  progresivo que acelera** de `RowTally`, calentando la **matriz 27×27 completa** casilla a casilla.
  Marcado `status="rework"` en `BigramNarrative`.

---

## Estado por visualizador

| VIS | Componente | Estado |
|---|---|---|
| 1 · minijuego fli-fla | `FillTheBlank` | ✅ + ayuda-si-fallas |
| 1.5 · el objetivo | `HeroAutoComplete` | reuso (pulir copy) |
| 2 · pares | `PairHighlighter` | reuso (pulir) |
| 3 · la «t» en varios textos | `IsolateT` | ✅ marcado idéntico a VIS2 + frases largas + por-palabras legible |
| 4 · leer el libro → barras + calor | `RowTally` | ✅ modo papiro, arranque corto, barras+fila calor, análisis |
| 5 · % | `NormalizationVisualizer` | reuso (pulir) |
| 6/7 · máximo «ttttt» + dado | `AlwaysMaxVsSampling` | reuso (separar en 2 beats) |
| 8 · mini-matriz HOLA MUNDO | `TinyMatrixExample` | reuso (vocab) |
| 9 · matriz 27×27 que crece | `GrowingMatrix27` | ✅ |
| 10 · matriz 92×92 detective | `DetectiveMatrix` | 🔧 oscuro + zoom + tamaño |
| 11 · máquina de escribir | `GenerationPlayground` | 🔧 generar en local |
| — · amnesia | `ContextBlindnessDemo` | ✅ se mantiene |
| — · más contexto → n-gram | `ShannonContextLadder` | ✅ se mantiene |

**Quitados (redundantes):** MindReadingHook, ShakespeareRowCounter, MatrixRowByRowBuilder,
TrainingTextComparison, StorageProblemVisualizer, CorpusCountingIdea, TransitionMatrix-juego viejo.
