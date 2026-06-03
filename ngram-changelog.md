# N-gram — log de cambios y aprendizajes

> Historial vivo de la reconstrucción del capítulo N-gram (rama `redesign/ngram-amber-v1`): qué se cambió,
> **por qué**, y sobre todo **qué NO funcionó**. Espejo de `bigram-changelog.md`. Se actualiza con cada iteración.

---

## Decisiones clave (qué se decidió y por qué)

- **Método: narrativa primero.** Corrección del usuario antes de tocar widgets: escribir la narrativa
  perfecta (`ngram-mapa-narrativa.md`) y SÓLO entonces derivar visualizadores. **Mostrar, no contar:**
  maximizar nº de visualizadores enfocados, minimizar texto. Los visualizadores normalmente faltan, no
  sobran. (Memoria `lab-chapters-maximize-visualizers`.)
- **Reusar > borrar.** El plan inicial borraba ~14 widgets y consolidaba en 7. Rechazado. Política nueva:
  REUSAR/REHACER los widgets cuya idea/lógica es buena (re-skin al kit + ámbar, faked→datos reales). Rebuild
  sólo si la mecánica está mal. NO borrar prácticamente nada. Resultado: narrativa con 9 widgets de enseñanza
  del kit + free-lab con TODO su set instrumento, todo re-skin a ámbar.
- **EL BACKEND ESTÁ BIEN (2ª corrección del usuario).** El backend funciona y es genial. Depender del backend
  NUNCA es razón para borrar/rebuild-a-local/tratar como roto. NO se elimina nada por el backend. Reparto por
  modos: narrativa = widgets del kit con datos LOCALES reales (paridad con el bench, igual que la narrativa de
  bigram va en local — NO porque el backend sea malo); free-lab = todo el set con backend, re-skin a ámbar.
  `lmLabClient.ts` intacto. (Memoria `backend-is-fine-never-delete-for-it`.)
- **Acento ámbar con el sistema de bigram.** No es un look nuevo: son los MISMOS roles de token, primitivas
  del kit, tipografía y motion que bigram, sólo que el acento es ámbar/amarillo en vez de verde editorial.
  Espejo `--ngram-*` ↔ `--bigram-*`, scoped bajo `[data-ngram-theme]`. Aditivo: no toca bigram/lab/shadcn.
- **Arquitectura espejo de bigram (2 capas token-driven bajo `[data-ngram-theme]`):**
  1. Cromo editorial = rama `accent="ngram"` ADITIVA en `narrative-primitives.tsx` (espejo de `"bigram"`).
  2. Widgets = fork `src/features/lab/components/ngram/kit/` (idéntico al de bigram, tokens `--ngram-*`).
- **Datos locales reales (sin backend).** `ngramData.ts` cuenta n=1..4 sobre `SHAKESPEARE_TEXT` (300K) con
  mapas dispersos, misma normalización que bigram (lower → no-[a-z]→espacio → colapsar espacios). Validado
  contra `MATRIX_27_COUNTS` (golden n=2). El bench no tiene backend; todos los widgets funcionan con números
  verdaderos. (El backend `lmLabClient.ts` se MANTIENE: lo usa mlp.)
- **Arco:** curiosidad → triunfo → triunfo mayor → muro → decepción → nueva curiosidad. El triunfo (§3
  batalla) se celebra ANTES del muro (§4 explosión), pilar 13. Bookends: abre con la amnesia de bigram,
  cierra con «predice sin entender» (callback al «fli fla»).
- **CTA → `/lab/neural-networks`** (capítulo 3 confirmado en `lab/page.tsx`). Correcto ya; se re-skin a ámbar.
- **«n-grama» se gana en §1** tras sentir el juego de la ventana (descubrir-no-definir). En el hero NO
  aparece la jerga; el título es la idea («Una ventana más ancha»). El bigrama se reencuadra como n=2.

---

## Notas de build pendientes (de la revisión de la narrativa)
- **§1 ContextWindow:** etiquetar «1/2/3/4 letras de memoria», NO «bigrama/trigrama/4-grama» (esos nombres
  se ganan en la prosa del payoff, después del widget). El juego de adivinar debe ser GENUINAMENTE difícil
  (pilar 10): caso donde con 1 letra no se acierta y solo el contexto tardío lo fuerza.
- **Voz:** convertir imperativos al portar copy («Pregúntale…» → «Le preguntas…»). Cero órdenes al lector.
- **§6a vs §6b:** mantener como escalada, no repetición (demo controlada de 1 letra cambiada → rómpelo tú
  con cualquier typo). Cada uno con su puente.
- **§4b (palabras):** decidir en build callout vs toggle char/palabra en ContextExplosion.

## Qué NO funcionaba en el n-gram actual (para no repetir ❌)
- ❌ **Caos multi-acento dentro del capítulo:** ámbar, cyan, esmeralda, violeta, índigo y rojo conviviendo
  (viola «un acento por capítulo»). Stepwise en cyan, InferenceConsole/Generation en esmeralda, sparsity en
  rojo, comparison en violeta. → todo a ámbar `--ngram-*`.
- ❌ **Datos inventados:** casi todos los widgets educativos con porcentajes a mano (th→e 85% hardcodeado,
  FILL_DATA simulado, etc.). → datos reales de `ngramData`.
- ❌ **§1 nombra el dominio e inventa:** `ContextWindowVisualizer` usa «I want to eat pizza» (nombra el
  dominio) y predicciones faked, y el juego es trivial (se acierta a la primera). → rebuild con texto real,
  sin nombrar dominio, juego difícil.
- ⚠️ **Dashboard density:** varios widgets son volcados de métricas (PerformanceSummary, ComparisonDashboard,
  SparsityIndicator, LossChart, TechnicalExplanation) — multi-card, multi-color. NO se borran (el backend que
  los alimenta está bien): se MANTIENEN en el free-lab como instrumento, re-skin a ámbar y sin multi-acento.
  La NARRATIVA, en cambio, enseña por interacción (widgets del kit), no por tablas de métricas.
- ❌ **Traffic-lights rojo-ámbar-verde** en heatmaps/severidad (CombinatoricExplosionTable, SparsityHeatmap,
  InfiniteTable). → rampa de calor única ámbar del kit.
- ⚠️ **Redundancia de generadores/explosión/vacío:** en la NARRATIVA, 1 generador (batalla, semilla editable),
  1 explosión, 2 de muro (sparsity real + datos-infinitos, ideas distintas). Los demás se quedan en el free-lab.
- ⚠️ **Texto de error en inglés hardcodeado** en NgramGenerationBattle («Server may still be starting up»).
  → i18n; la versión de la narrativa usa generación local (paridad con el bench).
- ⚠️ **i18n con naming stale:** NgramStepwisePrediction usa claves `models.bigram.stepwise.*`. → renombrar a
  claves ngram (no se borra el widget; se re-skin a ámbar y se queda en el free-lab).

## Fase B (pre-pass compartido) — hecho
- **Tokens `--ngram-*`** en globals.css: bridge `@theme inline` (set completo de roles) + bloques
  `[data-ngram-theme="dark|light"]` (base cálida + acento ámbar) + grain + scrollbar + numeric. Aditivo.
- **Rama `accent="ngram"`** en `narrative-primitives.tsx` (espejo exacto de `"bigram"`, clases literales
  `*-ngram-*`; las ramas bigram quedan byte-idénticas = cero regresión). + `KeyTakeaway` (NgramTakeaway sage).
- **Kit fork** `ngram/kit/` (10 archivos) + `ngram/{HonestBar,PairChip,Verdict}` vía script one-shot
  (`--bigram-`→`--ngram-`, clases `bw-`→`nw-` para no colisionar el `<style>` global). eslint verde.
- **`ngramData.ts`**: conteo local n=1..4 sobre `SHAKESPEARE_TEXT` (300.000 chars, con mayúsculas), mapas
  dispersos, normalización = **lowercase → no-[a-z]→espacio → colapsar espacios**. ✅ VALIDADO: la regla
  lowercase da **0 discrepancias** vs `MATRIX_27_COUNTS` (t→h = 7071). Helpers: contextDistribution,
  topFollowers, contextRow, predictAt, diagnostics (contextSpace 27^k, observedContexts, sparsity),
  generateLocal (con backoff + temperatura), validateAgainstBigram.

## Estado por visualizador (se actualiza en build)
| § | Widget | Origen | Estado |
|---|---|---|---|
| §1 | ContextWindow | ContextWindowVisualizer | ⬜ rebuild |
| §2 | ContextCounter | NgramMiniTransitionTable (+ideas) | ⬜ rework/rebuild |
| §3 | NgramBattle | NgramGenerationBattle | ⬜ rework (local) |
| §4 | ContextExplosion | ExponentialGrowthAnimator (+FiveGram) | ⬜ rework |
| §5a | SparsityView | SparsityHeatmap | ⬜ rework |
| §5b | InfiniteTable | InfiniteTableThoughtExperiment | ⬜ rework |
| §6a | UnseenContext | GeneralizationFailureDemo | ⬜ rework |
| §6b | TypoBreaker | TypoWordBreaker | ⬜ rework |
| §7 | SimilarityBridge | SimilarityBlindSpot | ⬜ rework |
| §7 | Historia (plegable) | StatisticalEraTimeline? | ⬜ decidir |
