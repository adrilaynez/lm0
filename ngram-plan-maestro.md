# N-GRAM — Plan maestro de reestructuración (rama `redesign/ngram-amber-v1`)

> Plan de ejecución autónomo. Replica EXACTAMENTE el método con que se rehízo bigram: auditar →
> narrativa perfecta → decidir keep/rework/rebuild/delete por widget → reconstruir todo con la estética
> actual (kit de bigram) en **ámbar** + barra de calidad actual. La lógica de muchos widgets ya es
> correcta; cambia la ESTÉTICA y la NARRATIVA. Acento = ámbar/amarillo expresado con el MISMO sistema
> visual de bigram (mismos roles de token, mismas primitivas del kit, misma tipografía y motion).
>
> Autoridades (precedencia): `CLAUDE.md` > dueño del tema (`bigram-design-spec.md` tokens,
> `bigram-motion-bible.md` motion, `narrative-guidelines.md` narrativa, `kit/AGENTS.md` build) > nada de
> `docs/archive`. Este plan NO sobreescribe esas autoridades; las aplica a n-gram.

> ### ⚠️ METODOLOGÍA (corrección del usuario, 2026-06 — manda sobre el resto del plan)
> **Narrativa PRIMERO, visualizadores después.** Escribir la narrativa perfecta en un .md
> (`ngram-mapa-narrativa.md`), y SÓLO entonces, beat a beat, preguntar "¿qué puede MOSTRAR un visualizador
> aquí?" y tirar a AÑADIR uno. **Mostrar, no contar.** Maximizar el nº de visualizadores enfocados,
> minimizar el texto: los visualizadores normalmente FALTAN, no sobran. **Reusar/rehacer** los widgets
> actuales cuya lógica/idea es buena (re-skin al kit + ámbar, faked→datos reales) en vez de reconstruir.
> Rebuild sólo si la mecánica está mal. **Borrar SÓLO** duplicados genuinos (dos widgets con la idea
> idéntica) y cromo de dashboard puro (volcados de métricas de backend, charts de loss). NUNCA borrar un
> widget que enseña algo sólo por consolidar. Ante la duda de si dos solapan: quédate ambos si cada uno
> enseña una micro-idea distinta con su propio puente "¿y si?". Ver memoria
> `lab-chapters-maximize-visualizers`. Revisar TODO sección por sección, mil veces, poco a poco, con mimo.

---

## 0. Estado / hallazgos de la auditoría (hecho)

**Arquitectura de bigram (lo que vamos a espejar):** dos capas token-driven bajo `[data-bigram-theme]`:
1. **Cromo editorial** = `narrative-primitives.tsx` con `accent="bigram"` (Section, Heading, Lead, P,
   Callout, PullQuote, FigureWrapper, SectionLabel, Subheading, FormulaBlock, SectionBreak). Es ADITIVO:
   cada primitiva tiene una rama `if (accent === "bigram")` con tokens `--bigram-*`.
2. **Widgets** = `src/features/lab/components/bigram/kit/` (MarkedText, ParchmentReader, FixedAlphabetRow,
   heat, Readout, CountUpNumber, Tabs, PlayButton/GhostButton, CaptionLine, tokens.ts) + `../HonestBar`,
   `../PairChip`, `../Verdict`. Un widget = primitivas del kit + su ÚNICA mecánica.

La página bigram (`/lab/bigram`) tiene 2 modos: educativo (`BigramNarrative.tsx`, EL capítulo) y free-lab
(playground). El wrapper pone `data-bigram-theme={theme}` + `bg-bigram-bg`. CTA → `/lab/ngram`.

**Estado actual de n-gram (lo que reestructuramos):**
- 2 modos: educativo (`NgramNarrative.tsx`) + free-lab (`page.tsx`, dashboard backend-dependiente).
- Cromo: usa `narrative-primitives` con `accent="amber"` → rama VIEJA `--lab-*` + ámbar hardcodeado
  (NO es la rama editorial token-driven como bigram). Hay que añadir una rama `accent="ngram"`.
- Sin tokens `--ngram-*`. Colores hardcodeados + caos multi-acento (ámbar, cyan, esmeralda, violeta,
  índigo, rojo conviven dentro del capítulo — viola "un acento por capítulo").
- Sin `ngramSpine.ts`. Depende de BACKEND (`visualizeNgram`/`generateNgram` en `lmLabClient.ts`).
- Datos faked en casi todos los widgets educativos (porcentajes a mano). El §1 nombra el dominio
  ("I want to eat pizza") y da predicciones inventadas → viola voz + datos reales + "predicción difícil".
- Muchos widgets dashboard-y / charts por defecto / traffic-lights rojo-ámbar-verde (anti-ruido ❌).
- Redundancia fuerte: 3 generadores; 3-4 widgets de "explosión 27^n"; 3 widgets de "tabla vacía/sparsity";
  2 de "fallo con input no visto".

**Orden de capítulos (confirmado en `src/app/lab/page.tsx`):** bigram(1) → **ngram(2)** →
neural-networks(3) → mlp(4) → transformer(5/6). ⇒ **CTA de n-gram → `/lab/neural-networks`** (correcto ya).

**Datos locales (confirmado):** reusar `SHAKESPEARE_TEXT` (300 KB, `shakespeareText.ts`), patrón
`buildCounts` de `bigramCorpus.ts`, alfabeto `ALPHA_27` (space + a-z), y `MATRIX_27_COUNTS`
(`bigramShakespeare27.ts`) como GOLDEN para validar n=2. Contar n=1..4 en el cliente es <20 ms con
mapas dispersos `Map<context, Map<next, count>>`. NO precomputar JSON, NO matrices densas para n≥3.

---

## 1. La narrativa n-gram (la UNA gran idea + arco)

El lector LLEGA de bigram sabiendo: contar pares, la matriz 27×27, el dado cargado, y la AMNESIA (el
bigrama sólo ve UNA letra atrás; th/sh/wh le parecen iguales). N-gram arranca desde esa amnesia.

**UNA gran idea:** ampliar la ventana de contexto (mirar más letras atrás) mejora la predicción… pero
tiene un coste brutal (explosión combinatoria → sparsity → no generaliza).

**Arco emocional:** curiosidad → triunfo → triunfo mayor → muro → decepción → nueva curiosidad.

**Escalera "¿y si?":**
- Gancho: ¿y si la máquina pudiera mirar más de una letra atrás? (bigram = n=2; contexto = "lo que llevas escrito").
- Triunfo: con más contexto la generación se vuelve legible (battle n=1/2/3/4). Se SIENTE el salto.
- El coste: cada letra de contexto multiplica las filas → ~27^n. La tabla crece exponencial.
- El muro: con tablas gigantes, la mayoría de contextos NUNCA se vieron → sparsity. Casi todo vacío.
- Decepción: un contexto no visto (aunque casi idéntico a uno visto) deja a la máquina muda. No generaliza.
- Nueva curiosidad: necesitamos algo que GENERALICE (contextos parecidos → comportamiento parecido) →
  redes neuronales. CTA con oficio.

Voz: descubrir>definir; nunca nombrar idioma/dominio; nunca ordenar al lector; humor seco honesto; frases
cortas; casi sin em-dashes; el fallo se VIVE. Español primero (`es.ts`) → port a `en.ts` en sync.
Encuadre en la PROSA del cuerpo, nunca dentro del widget (gate "minimal in-widget text").

---

## 2. Lineup de widgets (PRELIMINAR — se FINALIZA tras escribir `ngram-mapa-narrativa.md`)

> Esta tabla NO se cierra hasta haber escrito la narrativa completa. Por defecto: REUSAR/REHACER, no borrar.
> Leyenda: ✅ keep · 🔧 rework (re-skin kit ámbar + faked→real, misma mecánica) · ♻️ rebuild (mecánica nueva) · ❌ delete.

| Beat | Widget | Enseña (1 idea) | Origen actual | Veredicto prelim. |
|---|---|---|---|---|
| §1a · ventana | **ContextWindow** (juego adivinar, contexto creciente, REAL + difícil) | más contexto → mejor apuesta (se SIENTE) | `ContextWindowVisualizer` (inline, faked) | ♻️ rebuild (datos reales, juego difícil) |
| §2 · contar | **ContextCounter** (lee el libro; fila por contexto de 2 letras; afilada vs ancha) | mismo truco, llave más larga → distribución afilada | `NgramMiniTransitionTable` (+ idea `ConcreteImprovement`/`CountingComparison`) | 🔧 rework / ♻️ rebuild (datos reales) |
| §3 · batalla | **NgramBattle** (n=1..4 generan a la vez, LOCAL) | más contexto → texto legible (clímax) | `NgramGenerationBattle` | 🔧 rework (local + kit + ámbar) |
| §4a · explosión | **ContextExplosion** (nº de filas trepa 27→729→19.683…) | cada letra de contexto ×27 (~27^n) | `ExponentialGrowthAnimator` (+ `NgramFiveGramScale`) | 🔧 rework (kit ámbar) |
| §4b · palabras (¿?) | **WordExplosion** o callout | con palabras el coste es catastrófico (vocab enorme) | `CombinatoricExplosionTable` | 🔧 rework o ❌ (decidir en prosa) |
| §5a · vacío | **SparsityView** (tabla n=4 casi vacía; conteos reales) | la mayoría de contextos nunca se vieron | `SparsityHeatmap` | 🔧 rework / ♻️ rebuild (datos reales) |
| §5b · más datos no salva | **InfiniteTable** (slider de datos; n alto sigue vacío) | ni con datos infinitos se llena | `InfiniteTableThoughtExperiment` | 🔧 rework (kit ámbar) |
| §6a · no visto | **UnseenContext** (visto→seguro; cambia 1 letra→mudo) | no generaliza a contextos no vistos | `GeneralizationFailureDemo` | 🔧 rework (datos reales) |
| §6b · rómpelo tú | **TypoBreaker** (escribe cualquier cosa → confianza se hunde) | tu typo cotidiano también lo rompe (interacción) | `TypoWordBreaker` | 🔧 rework (datos reales, kit) |
| §7 · puente | **SimilarityBridge** (trata "cat"/"dog" como IDs sin relación) | falta entender similitud → redes neuronales | `SimilarityBlindSpot` | 🔧 rework (kit ámbar) |
| §7 · historia | **plegable** (Shannon n-grama 1951 / IBM "more data") | premio histórico (máx 1-2) | `StatisticalEraTimeline`? | 🔧 rework o ⬜ build |
| CTA | — (cinematic → neural-networks) | nueva curiosidad | CTA actual (rosa) | 🔧 rework (ámbar, oficio) |

**❌ DELETE candidatos (cromo dashboard / backend / verdaderos dupes — NO widgets de enseñanza):**
`NgramComparisonDashboard`, `NgramSparsityIndicator`, `NgramPerformanceSummary`, `NgramLossChart`,
`NgramTechnicalExplanation` (fichas/volcados de métricas backend), `NgramStepwisePrediction` (cyan, backend,
redundante con battle), `NgramContextDrilldown` (backend; su idea la cubre ContextCounter),
`NgramInteractiveGenerator` (3er generador redundante; "tú prueba" se integra en la batalla). Posibles merges
(decidir en prosa, NO borrar a la ligera): `GrowingTablesComparison` (mezcla 2 ideas → cubiertas por
ContextExplosion+Sparsity), `NgramFiveGramScale`/`CombinatoricExplosionTable` (caben en ContextExplosion),
`CountingComparisonWidget`/`ConcreteImprovementExample` (caben en ContextCounter). Antes de borrar: verificar
que NINGÚN otro capítulo los importa (`mlp` usa `generateNgram` del cliente, no estos componentes;
`lmLabClient.ts` se MANTIENE).

**Free-lab mode (`page.tsx`):** playground limpio, ámbar, scoped `[data-ngram-theme]`, SIN backend, reusando
los widgets nuevos del kit. Así caen los dashboard widgets sin romper la página. (Espeja bigram.)

---

## 3. FASES DE EJECUCIÓN (paso a paso) — con estado

### FASE A — Auditoría + NARRATIVA + artefactos autoridad  ✅
- [x] Leer todas las autoridades de bigram.
- [x] Auditar todos los widgets actuales (3 agentes) + página + narrativa + datos/backend.
- [x] **`ngram-mapa-narrativa.md`** = narrativa completa (prosa es) + visualizadores marcados. FLOW GATE pasado.
- [x] `src/features/lab/data/ngramSpine.ts` (14 beats, 9 widgets) acorde a la narrativa.
- [x] `ngram-changelog.md` (bitácora viva).
- [x] `src/features/lab/components/ngram/kit/AGENTS.md` (contrato de build, adaptado).

### FASE B — Pre-pass de archivos compartidos (SECUENCIAL, sólo aquí se tocan compartidos)  ⬜
- [ ] **Tokens `--ngram-*`** en `globals.css`: espejo rol-por-rol de `--ngram-*` ↔ `--bigram-*`, acento
      ámbar/amarillo (oscuro + claro), bajo `[data-ngram-theme="dark|light"]`. + bridge `@theme inline`
      `--color-ngram-*`. + `--ngram-font-display/serif/mono` = mismas fuentes. ADITIVO, no tocar `--bigram-*`/`--lab-*`/shadcn.
- [ ] **Rama `accent="ngram"`** en `narrative-primitives.tsx` (espejo de la rama `"bigram"`, tokens `--ngram-*`):
      `NarrativeAccent`, mapas de color, SectionLabel, Heading, Subheading, Lead, P, Highlight, Callout,
      FormulaBlock, PullQuote, SectionBreak, FigureWrapper. + `accent="ngram"` en `LabSectionHeader`/`SectionDivider`/`KeyTakeaway` si se usan. PURAMENTE ADITIVO.
- [ ] **Kit fork** `src/features/lab/components/ngram/kit/` (idéntico a bigram/kit, tokens `--ngram-*`):
      tokens.ts, MarkedText, CaptionLine, Buttons, Tabs, CountUpNumber, Readout, FixedAlphabetRow,
      ParchmentReader, index.ts. + `ngram/HonestBar`, `ngram/PairChip`, `ngram/Verdict`. + primitivas NUEVAS
      reusables: **ContextWindow** (ventana deslizante de n letras sobre texto), **ExplosionGrid** (rejilla/
      número que explota). Documentar en kit/AGENTS.md. Resuelto bajo `[data-ngram-theme]`.
- [ ] **Datos locales reales** `src/features/lab/data/ngramData.ts`: `normalize(text)` (lower → no-[a-z]→
      espacio → colapsar espacios, igual que bigram), `countContexts(n)` disperso, helpers
      (topFollowers/probs/argmax/sample/diagnostics: observedContexts, contextSpace=27^(n-1), sparsity),
      `generateLocal(seed,len,temp,n)` con backoff, validación n=2 vs `MATRIX_27_COUNTS`. Sobre `SHAKESPEARE_TEXT`.
- [ ] **i18n**: añadir TODAS las claves nuevas en `es.ts` Y `en.ts` (en sync). No inventar claves sin uso.
- [ ] **Bench**: registrar un slug por cada widget n-gram (en orden de capítulo) en `src/app/lab/bench/page.tsx`
      (añadir soporte `[data-ngram-theme]` o un segundo bench / detectar capítulo por slug).
- [ ] **gen-ngram-prose.mjs** (clon de gen-bigram-prose) → `ngram-narrative.md`.

### FASE C — Construir/rehacer cada widget (uno por beat, del kit, datos reales, validado en bench)  ⬜
Por CADA widget: contrato de build de `kit/AGENTS.md` (contexto del beat → imagen final → ensamblar del
kit → datos reales → validar en bench ambos temas + reduced-motion → coherencia → tsc+eslint 0). Puertas
duras Bar v2 TODAS. Paralelizar con agentes de archivos DISJUNTOS (1 .tsx/agente); compartidos ya hechos en B.
- [ ] §1 ContextWindow  - [ ] §2 ContextCounter  - [ ] §3 NgramBattle  - [ ] §4 ContextExplosion
- [ ] §5 SparsityView  - [ ] §6 UnseenContext  - [ ] §7 SimilarityBridge

### FASE D — Componer página + cierre  ⬜
- [ ] Reescribir `NgramNarrative.tsx` (educativo) con el nuevo arco + widgets + scope `[data-ngram-theme]`
      + lazy-load + CTA. Reescribir `page.tsx` (free-lab) lean ámbar local.
- [ ] Borrar de verdad los ❌ + limpiar imports/claves i18n muertas.
- [ ] Regenerar `ngram-narrative.md` y correr FLOW GATE punta a punta (arco sube, puentes "¿y si?", cero
      duplicación, descubrir-no-definir entre beats, anclaje, poda, ritmo/variedad).
- [ ] Pase de crítico severo contra TODOS los manuales. Corregir.
- [ ] Verificación final en navegador (ambos temas + reduced-motion): capítulo se entiende, cada widget
      en ~5s, ritmo sin tiempos muertos, familia ámbar coherente con bigram, datos reales.
- [ ] REGRESIÓN: bigram (verde) y transformers (cyan) NO cambian. Cambios de color scoped.
- [ ] `tsc --noEmit` + `eslint --fix` = 0 errores en todo el repo.
- [ ] Mantener `ngram-changelog.md` al día.

---

## 4. Reglas permanentes (no romper)
NO neón · NO dashboards · NO charts por defecto · NO exceso de bordes/cards · NO traffic-lights en figuras.
SIEMPRE tokens (ámbar `--ngram-*` / chrome `--lab-*`), nunca hardcode. Estados por relleno y tipografía,
no apilando bordes. En la duda, quita. "Lo mejor del mundo para aprender IA": pedagogía primero, una idea
por pantalla, simple por fuera, sofisticado por dentro. Trabajar sin parar; no pedir confirmación.
