# Train-your-own — plan (Bigram Lab + N-gram Lab)

> Estado: **CONSTRUIDO Y VALIDADO** (2026-06-10). Slugs `bg-train` / `ng-train` en `/lab/bench`.
> Validación: flujo completo conducido en navegador real (las 3 modalidades de escritura, tabla, búsqueda,
> backoff), 32 capturas de estado en ambos temas (carpeta `_caps/`, sin trackear), stress 3 MB·k=5 → ~2 s
> de entrenamiento y 60 fps después, revisión fresh-eyes ciega con artefactos en
> `bigram-gates/train-bigram-lab.fresh-eyes.md` y `ngram-gates/train-ngram-lab.fresh-eyes.md`.
> Dos widgets hero standalone ("entrena tu propio modelo"), POR AHORA solo en `/lab/bench` (NO entran en
> la narrativa todavía — decisión del usuario). Cuando entren, pasarán el gate-ladder completo de
> `method-failure-book.md` (incl. el watch-item de la barra de cobertura del ngram).

## La idea (una frase por widget)

- **TrainBigramLab** — pegas TU texto (o un libro entero), VES al modelo leerlo letra a letra y acelerar
  hasta devorarlo, la tabla 27×27 se calienta en vivo, la exploras, y luego escribes con ella: solo,
  paso a paso con el dado cargado, o eligiendo tú mismo cada letra desde la fila.
- **TrainNgramLab** — lo mismo con memoria k=1…5 (bigrama → 6-grama): ves el estante de contextos crecer,
  descubres la dispersión (tu tabla cubre el 0,00x% de las filas posibles — y aun así escribe), buscas
  filas, y generas con temperatura, backoff visible y modo manual.

## Decisiones tomadas (con razón)

1. **Alfabeto: 27 símbolos (␣ + a–z), con plegado inteligente.** Igual que ambos capítulos (la tabla que el
   lector ya conoce). Mejora sobre `normalizeNgram`: NFD + strip de diacríticos (á→a, ñ→n) para que el
   español no se agujeree; MAYÚS→minús; dígitos/signos→espacio; colapsar espacios. Se muestra un **informe
   de plegado honesto** ("se simplificaron N caracteres"). El modo "alfabeto completo con mayúsculas y
   números" se descartó para v1: multiplica la tabla (~70×70), rompe la continuidad con los capítulos y
   no enseña nada nuevo que el plegado honesto no cuente. (El usuario dio permiso explícito para esta
   simplificación si "es demasiado".)
2. **Tamaño máximo de texto: enorme, con tope por memoria.** Conteo O(n) troceado en rAF (nunca bloquea).
   Topes honestos por k (mostrados en la UI): k=1–2 → 12.000.000 chars; k=3 → 8.000.000; k=4 → 5.000.000;
   k=5 → 2.000.000 (el límite real es el nº de contextos distintos en RAM: `Map<string, Uint32Array(27)>`
   ≈ 300 B/contexto). Texto más largo → se trunca con aviso, no se rechaza.
3. **Entrada de texto:** textarea NO controlado (pegar 5 MB no relagea React) + subir `.txt/.md` via
   FileReader + chip "Shakespeare (~300k)" de ejemplo (ya en repo) + contador de chars en vivo.
4. **La lectura ES el entrenamiento (el show).** Arranque lento (≈14 pasos marcando par/contexto en el
   papiro + celda/contexto encendiéndose), luego aceleración exponencial (×2 cada ~700 ms, badge "×4.096")
   hasta cientos de miles de chars/tick; contador girando, tabla calentándose en olas. Ghost "saltar al
   final". Reduced-motion: entrena en slices sin show y salta a listo.
5. **N máximo del n-grama: k=5 (6-grama), con tope de texto.** k=6+ explota la RAM del navegador
   (≥2M contextos × 300 B). k se elige ANTES de entrenar; reentrenar con otra k re-lanza el show (ver el
   reentrenamiento es pedagogía, no fricción).
6. **Generación: tres modos (Tabs), mismos en ambos widgets.**
   - **Solo** — stream automático ~90 ms/letra con pausa/seguir (idiom TableWriter).
   - **Paso a paso** — avance MANUAL ("siguiente letra"): fila como FixedAlphabetRow con barras →
     dado cargado animado (ruleta de segmentos = probs, idiom WriteFromMatrix) → letra cae al texto.
     Gate Bar-v2 "readable pacing": primera pasada manual.
   - **Tú eliges** — el usuario ES el dado: fila clicable (hover → cuenta y %), clic = elegir la
     siguiente letra. Mecánica aprendida con las manos.
7. **Temperatura:** slider 0,1–3,0 (defecto 0,85), `p^(1/T)` renormalizado; T≤0,1 = argmax. Etiquetas
   honestas ("fiel" ←→ "caos"). En ambos widgets.
8. **N-gram: dispersión como lección central de la tabla.** Contadores vivos (contextos distintos vs 27^k),
   barra de cobertura que ES la escala (no un número solo — gate "show scale"), buscador de fila (escribe
   k letras → su FixedAlphabetRow o "fila vacía — nunca lo vio"), top-24 contextos clicables, fila al azar.
9. **Backoff visible.** Si el contexto actual no existe (semilla del usuario), en paso-a-paso se muestra
   "fila vacía → recorto memoria a k−1" y se reintenta; en Solo es automático. Honestidad ante el
   callejón sin salida, como `generateLocal`.
10. **Semilla:** bigram arranca en ␣ (o última letra de una semilla opcional); ngram pide ≥0 chars y si el
    contexto resultante no se vio, backoff visible (o chip "contexto frecuente al azar").

## Arquitectura

- `src/features/lab/data/trainableModel.ts` — motor puro compartido (sin React):
  `normalizeTrain(text) → {stream, foldedCount}`, `TrainedModel(k)` con `feed(chunk)` streaming
  (carry de k chars), `row(ctx)`, `total(ctx)`, `sample(ctx, T, rng) → {ch, backoffUsed}`,
  `topContexts(n)`, `stats()`, `CHAR_CAPS[k]`, RNG LCG determinista (reduced-motion/replays).
- `src/features/lab/components/bigram/TrainBigramLab.tsx` — clases `bw-tbl__*`, kit bigram, verde editorial.
- `src/features/lab/components/ngram/TrainNgramLab.tsx` — clases `nw-tnl__*`, kit ngram, ámbar.
  (Sub-piezas como la ruleta del dado se duplican por capítulo — los kits son gemelos a propósito;
  no se crea dependencia cruzada entre capítulos.)
- Máquina de estados por widget: `feed → reading → ready`, y en ready pestañas `tabla | escribir`
  (+ ghost "entrenar con otro texto" → feed). Modos de escritura: pestañas `solo | paso a paso | tú eliges`.
- i18n: `bigramNarrative.trainLab.*` (locales/bigram) y `ngram.widgets.trainLab.*` (locales/ngram),
  es+en en sync. Sin strings hardcodeados.
- Bench: slugs `bg-train` y `ng-train`.

## Layout por fase (ambos widgets, mismo esqueleto)

- **FEED** — CaptionLine funcional («ENTRENA TU PROPIO BIGRAMA / N-GRAMA») · textarea papiro grande ·
  fila de acciones (subir .txt · Shakespeare · borrar) · contador "1.234.567 caracteres · tope 12M" ·
  [ngram: selector de memoria k 1–5 con "= 6-grama" y tope por k] · PlayButton «Entrenar».
- **READING** — papiro (stream normalizado: "así ve tu texto el modelo") con hot1/hot2 · línea Readout
  (leído / total · pares contados · badge ×velocidad) · hero vivo: bigram = matriz 27×27 calentándose;
  ngram = contador de contextos distintos + ticker de últimos contextos descubiertos + barra de cobertura ·
  Ghost «saltar al final».
- **READY·TABLA** — bigram: matriz 27×27 GRANDE (hover → «t»→«h» · N; clic → fija fila + inspector
  FixedAlphabetRow + top-3) + strip de stats (chars · pares · celdas usadas/729) + informe de plegado.
  ngram: stats de dispersión + barra-escala + buscador de fila + top contextos + fila al azar.
- **READY·ESCRIBIR** — Tabs de modo · slider de temperatura · [semilla] · salida serif grande creciente
  (última letra hot1, autoscroll, botón copiar) · controles del modo.

## Validación (esta noche)

1. `tsc --noEmit` + `eslint --fix` en los 3 archivos nuevos → 0 errores.
2. Bench light+dark por widget: feed → entrenar Shakespeare → tabla (hover/clic) → escribir en los 3
   modos → reentrenar. Screenshots de cada estado.
3. Texto gigante: inyectar ~2–5 MB via `preview_eval`, comprobar que la UI no se congela y el tope actúa.
4. Reduced-motion: salta el show, llega a ready sin perder info.
5. Revisión fresh-eyes ligera (agente ciego con screenshots, sin contarle la lección) + fixes.
   El gate-ladder COMPLETO (panel de 3 jueces + artefactos en `*-gates/`) queda para cuando entren
   en la narrativa.
6. PROJECT-LOG: entrada "started/finished — playground entrena-tu-propio bigram/ngram".
