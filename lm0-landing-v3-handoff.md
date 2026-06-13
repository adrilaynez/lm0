# LM0 Landing v3 — Estado y traspaso (2026-06-13)

> Documento de continuidad tras una sesión larga de diseño + implementación.
> Léelo junto a `lm0-landing-v3-spec.md` (la dirección) y este archivo (el estado real).

## Dónde estamos

- **Rama:** `redesign/lm0-landing-v3` (nace de `redesign/ngram-amber-v1`, que es la base viva del ngram WIP).
- **Último commit:** `55cda28` — "feat(lm0): the full landing — frozen design implemented end to end".
- **Estado:** la landing COMPLETA está construida, de punta a punta, en `/lab/lm0-preview` (ES + EN). 82 tests verdes, `tsc` limpio, eslint limpio, **build de producción verde**.
- **Pendiente:** validación del usuario scrolleando la página REAL (el navegador headless congela el rAF, así que el movimiento no se ha visto en vivo todavía). Ajustes finos tras esa pasada. Luego: fresh-eyes gates → swap a `/lab` → merge (ngram a main primero).

## Decisión de dirección (cómo llegamos aquí)

El usuario rechazó varias direcciones en orden hasta congelar una:
1. **Rechazado:** las 4 maquetas "premium IA 2025" (crema + serif + Mac beige) — "es un género, no una identidad".
2. **Rechazado:** dirección Zajno pura (papel gris-hielo + Mac) — "demasiada copia".
3. **Rechazado:** dirección "Expediente" (informe técnico mecanografiado, papel viejo) — "esto es horrible".
4. **CONGELADO:** museo-laboratorio con **acento propio** = papel CÁLIDO crema + grano, **fósforo verde** (no el azul de Zajno), una **máquina propia** (no un Mac: el render `public/lm0/maquina.webp`), instrumentos con datos reales, y la única escena oscura = DENTRO del cristal de la máquina (negro-verde + scanlines, nunca el ink-blue de Zajno).

**Imagen del ordenador:** el usuario la generó con su IA de imágenes y la dejó en Descargas; está convertida a `public/lm0/maquina.webp` (16 KB, 1200×869). Si quiere otra máquina, se reemplaza ese archivo y se reajusta `.lm0-screenbox` en el CSS.

**Lección de proceso registrada:** los bocetos en widgets de chat (mcp__visualize) servían para narrativa pero NO para vender "premium" (fuentes del sistema, 680px, sin grano real). El flujo que funcionó: el usuario genera mocks con su IA de imágenes → Claude implementa fielmente en código real. No volver a iterar estética solo en widgets.

## La página, beat a beat (diseño congelado)

Estructura técnica: wrapper `720vh` + stage `sticky 100vh` (CSS pinea, sin GSAP pin). Un solo `scrollSpine` (Lenis + GSAP ticker) → un `progressMap` puro → valores por-frame a CSS vars (`--lm0-raw`, `--lm0-dawn`), estado discreto al `stageStore`. 5 beats dentro del stage + finale en flujo normal.

**SEGMENTS** (`progressMap.ts`, suman 1): `hero .18 · training .34 · silence .06 · voice .16 · eras .26`.

0. **Boot** (al cargar, una vez, time-based, estilo Zajno): la pantalla de la máquina teclea `lm0-01 / iniciando sistema… ok / alfabeto: 27 símbolos… ok / memoria: 1 letra… ok / corpus: no encontrado / la máquina no sabe hablar`. Specs reales del modelo. Al terminar (`booted=true`) aparece el título.
1. **Hero (unificado):** eyebrow mono + pregunta Playfair minúscula GIGANTE + label + botón `enséñale →` (desaparece al usarlo, `data-used`). La máquina balbucea morralla REAL del modelo sin entrenar (teclea→mira→borra→reintenta). Auto-nudge: si nadie scrollea en 9s, Lenis desliza un poco.
2. **Training:** la máquina SUBE y se queda sola arriba. Termómetro vertical (1 línea + relleno verde + % en la punta), alimentado por chunks REALES (`feedToward`). Bajo la máquina: odómetro de palabras leídas. Lector tipo ParchmentReader (el pasaje del Quijote/Hamlet siguiendo la posición REAL de lectura, cabezal verde). En el cristal: `intento nº N — así habla ahora:` + tomas reales que se ALARGAN con el progreso (`takeLength(bucket)`).
3. **Silence:** la mejor toma memorizada (bucket 23) colgada + `hasta aquí llegó. nunca pasó de ahí.`
4. **Voice (acto oscuro, DENTRO del cristal):** el mundo se vuelve negro-verde + scanlines. lm0 escribe y BORRA por grupos con el cursor de bloque: grupo A (nada mal / fue una de las primeras ideas…) → borra → grupo B (de ese balbuceo… / …a mí: / 70 años — el número grande) → borra → grupo C (hola. soy lm0. / vengo de esa pequeña idea…) → borra → grupo D (durante setenta años… / que una máquina aprendiera sola / …mira.). Tiempos en `VoiceMonologue.tsx` (los `win` de cada grupo: [typeStart, typeEnd, eraseStart?, eraseEnd?]).
5. **Eras (acto oscuro, canvas):** lm0 narra a la izquierda (tag de era + 3 líneas) mientras las MISMAS motas se reagrupan a la derecha: letras sueltas → cuadrícula verde (contar) → red ámbar de racimos-de-puntos (aprender) → haces de atención violeta ponderados con pulso viajando por el más fuerte (atención) → todo colapsa en un cursor que teclea "las máquinas aprenden a hablar contigo." (actualidad). `ErasPanel.tsx`, `N=460` motas.
6. **Finale (flujo normal, vuelve la luz):** `ya conoces el final. / te falta el camino.` (Playfair itálica) + sub + **capítulos agrupados POR ERA** (no cards de era): bigram & n-gram bajo contar, redes & mlp bajo aprender, transformer bajo atención, gpt bloqueado bajo actualidad — cada columna con su acento de color (hairline izquierda). + **nota del creador leída por lm0** ("una nota de mi creador") + CTA `empezar por el principio →` hacia `/lab/bigram` + colofón friki (el balbuceo es un modelo real).

## Voces tipográficas (5, cero solapes)

Playfair (verdades grandes) · Geist (cuerpo) · JetBrains Mono (UI/labels/instrumentos) · **IBM Plex Mono = voz de lm0** (`--font-lm0`, SIEMPRE minúscula) · JetBrains verde fósforo (lo que dicen las máquinas). Todas cargadas en `src/app/[locale]/layout.tsx`.

## Honestidad (qué es real)

Real: el motor n-gram (`trainableModel.ts`), el balbuceo y sus escalones (rampa k 1→5, T 1.3→0.6), el % de corpus (chunks reales), las palabras leídas, los specs del boot, el olvido al scrollear atrás. Teatro (nunca afirmado en copy): velocidad del torrente, los tiempos de las fases, la fluidez de lm0 (su voz adulta es guion). Corpus: ES = Quijote (`de cuyo nombre no quiero acordarme`), EN = Hamlet (`to be, or not to be…`).

## ⚠️ PENDIENTE DE REVISIÓN DEL USUARIO (importante)

1. **La nota del creador es TEXTO DE RELLENO de Claude.** Está en `src/i18n/locales/lm0/{es,en}.ts` → `lm0.finale.noteBody`. El usuario DEBE reescribirla con su carta real ("esto lo hice para mis padres…").
2. **Posición de la pantalla sobre la imagen:** `.lm0-screenbox` en `lm0.css` (left 24.4% / top 20.4% / w 51.8% / h 48%). Si el texto verde no cae perfecto dentro del cristal del render, son esos 4 números.
3. **Validar el movimiento scrolleando de verdad** (adelante y atrás, ES y EN). No se ha visto en vivo.
4. Ajustes probables tras verlo: tiempos del monólogo (`VoiceMonologue.tsx` `win`), densidad de motas (`ErasPanel.tsx` `N`), largo del scroll (`lm0.css` `.lm0-wrapper height: 720vh`), velocidades del balbuceo.

## Mapa de archivos (todo bajo `src/features/lab/lm0/nacimiento/`)

- `NacimientoLanding.tsx` — raíz: spine, store, beats, nudge, fallback reduced-motion.
- `lm0.css` — todos los tokens `--lm0-*` y el diseño congelado (scope `[data-lm0]`).
- `engine/`: `progressMap.ts` (+test, fuente de verdad del scroll), `scrollSpine.ts` (Lenis+GSAP, port v2), `stageStore.ts` (useSyncExternalStore), `babbler.ts` (+test, motor de balbuceo determinista).
- `data/`: `corpus.es.ts` (Quijote), `corpus.en.ts` (Hamlet), `corpus.test.ts`, `blacklist.ts`, `script.ts` (escalera k/T), `corpusTypes.ts`.
- `components/`: `MachineFigure.tsx` (máquina + boot + cristal vivo), `HeroTitle.tsx`, `Instruments.tsx` (termómetro + lector + odómetro), `VoiceMonologue.tsx` (acto oscuro monólogo), `ErasPanel.tsx` (eras canvas), `ChromeBar.tsx`, `FinaleSection.tsx`, `TypedLine.tsx` (primitiva de tecleo).
- Ruta: `src/app/[locale]/lab/lm0-preview/{page.tsx (noindex), preview-client.tsx}`.
- i18n: `src/i18n/locales/lm0/{es,en}.ts` (namespace `lm0.*`).
- Imagen: `public/lm0/maquina.webp`.

## Reglas de seguridad que siguen vigentes

- Sesión paralela de ngram: NO tocar `src/features/lab/components/{ngram,bigram}/**`, `bench/page.tsx`, `ngram.*.mdx`, `locales/{ngram,bigram}/*`, `data/{trainableModel,ngramData}.ts`. `trainableModel.ts` se IMPORTA read-only.
- Commits con rutas explícitas, jamás `git add -A`.
- Ship order decidido: ngram se mergea a main PRIMERO; la v3 se rebasa encima. El swap de `/lab` (en `src/app/[locale]/lab/page.tsx`) es el ÚLTIMO commit; `lab-landing-client.tsx` queda intacto como rollback.

## Siguiente paso

El usuario scrollea `/lab/lm0-preview` en ES y EN, anota lo que chirría, y reescribe la nota del creador. Luego: ajustes finos → fresh-eyes gates (method-failure-book) → swap → merge.
