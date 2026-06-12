# LM0 Landing v3 — "El nacimiento" · Spec definitivo

**Fecha:** 2026-06-12 · **Estado:** dirección cerrada, lista para prototipo (Gate 1).
**Sustituye la DIRECCIÓN de `lm0-landing-spec.md` (v2, mundo 3D cenital).** La v2 queda APARCADA, no
borrada: la rama `redesign/lm0-landing-v2` y `src/features/lab/lm0/` se conservan como rollback.
Las lecciones técnicas (§9) y recetas de reuso (§7) del spec v2 **siguen vigentes** y se referencian aquí.

---

## 0. La idea en una frase

El visitante encuentra una máquina que no sabe hablar, **la entrena él mismo** (un modelo real, en su
navegador), la ve mejorar por escalones reales hasta su mejor balbuceo — y entonces una voz del presente
toma el relevo: **"De ese balbuceo a mí: 70 años."** LM0, el narrador que representa toda la historia de
los modelos de lenguaje, le enseña el camino por encima y le entrega los capítulos:
**"Ya conoces el final. Te falta el camino."**

**Posicionamiento:** una reconstrucción histórica interactiva de cómo la humanidad enseñó a hablar a las
máquinas. **Listón:** Awwwards SOTD. Pedagogía primero: la landing vende preguntas; los capítulos son
dueños de las respuestas.

## 1. Los personajes

- **El visitante** — tiene un papel, no un asiento: entrena la primera máquina con su scroll.
- **La máquina bebé** — un n-gram char-level REAL (`src/features/lab/data/trainableModel.ts`),
  tecnología de la Era I. Sin cara: su cuerpo es un caret.
- **LM0** — el narrador. NO es la máquina entrenada. NO es una mascota. No tiene cara ni ojos.
  Es una voz que representa los 70 años enteros y solo aparece cuando tiene algo importante que decir
  (~14 líneas en toda la página). Su único avatar es el caret de bloque ▌.

## 2. Sistema de voces tipográficas (5 papeles, 0 solapes)

| Papel | Fuente | Tratamiento |
|---|---|---|
| Verdades editoriales | Playfair (la de los capítulos) | serif grande; itálica en los clímax |
| Cuerpo / UI editorial | Geist sans | normal |
| Interfaz, labels, tags | JetBrains Mono | como en el resto del sitio |
| **LM0** | **IBM Plex Mono** (nueva, `--font-lm0`) | crema, teclea con ritmo humano, caret ▌, cursiva para apartes |
| **Máquinas** (output de modelos) | JetBrains Mono | **verde fósforo, minúsculas**, escupe de golpe, caret de bloque verde |

- **Dos clímax tipográficos** y solo dos: "Hola. Soy LM0." (mono) y
  "Ya conoces el final. Te falta el camino." (Playfair itálica).
- **LM0 fuera de la landing — cameos en capítulos** (componente compartido `Lm0Voice`):
  1-3 apariciones por capítulo máximo; habla de memoria y emoción, **nunca de mecánica**;
  color neutro crema, **jamás el acento del capítulo** (respeta la identidad por capítulo de CLAUDE.md);
  mejores momentos: apertura, tras construir algo el lector, el muro de la era, el pase al siguiente.

## 3. La experiencia, beat a beat

0. **Loader** mínimo, con intención, skippeable.
1. **La pregunta (hero).** h1 serif: *"¿Cómo se enseña a hablar a una máquina?"* + hint DESLIZA.
   Sin ilustración, sin foto IA. El motor y el corpus cargan en silencio durante este beat.
2. **La máquina rota.** Un caret respira en la oscuridad; teclea morralla ("ghrt aueh rwte"), la mira,
   la borra, reintenta (ciclo ≤4 s). Label: "LA MÁQUINA NO SABE HABLAR". Botón **"Enséñale →"**
   (azúcar: el scroll siempre funciona también).
3. **El entrenamiento.** Un renglón de texto real — Quijote (ES) / Alicia o Shakespeare (EN) — fluye
   hacia el caret y desaparece dentro de él.
   - **Marcha 1:** palabra a palabra; la palabra que llega se ilumina y es tragada con un pulso;
     el contador cuenta 1, 2, 3…
   - "leyendo el corpus… N%" — el % refleja **chunks reales alimentados al modelo**
     (throttle dirigido; JAMÁS un timer).
   - **Marchas 2-3:** aceleración exponencial, filas múltiples, palabras → trazos de luz; el contador
     crece de cuerpo hasta miles de millones (dramatización de escala; el balbuceo es real).
   - **Los escalones — REALES, del motor (k 1→5, temperatura ↓):** frecuencias → sílabas inventadas →
     palabras sueltas → orden raro → frase memorizada. Por idioma: proto-español / proto-inglés
     (el char-level absorbe la fonotáctica gratis).
   - El fondo **amanece** sutilmente con el conocimiento. Luz = conocimiento.
4. **Silencio.** Todo se detiene; su mejor frase queda colgada (~1 s). **Beat protegido.**
5. **El momento.** LM0 (Plex, crema, tecleado): *"Nada mal."* → *"Fue una de las primeras ideas que
   funcionaron."* → *"De ese balbuceo a mí: 70 años."* → **"Hola. Soy LM0."** (última línea mayor).
6. **El diálogo.** La ÚNICA pregunta de LM0: *"¿Te parece normal que una máquina te hable?"* Sí / No
   (meseta suave: si el visitante scrollea de largo, autopick con guiño — el scroll nunca se bloquea).
   Respuesta distinta según elección. Después: *"Para construirme hicieron falta cientos de ideas.
   Algunas brillantes. Otras, un fracaso."* → *"Ven conmigo. Te enseño el camino."* →
   **"Y en cada era, construirás tú una máquina que hable."**
7. **El camino (sección narrativa).** UN solo material que se transmuta — las letras del entrenamiento:
   desparramadas → **tabla** que se enciende (verde · CONTAR · 1948) → **nodos e hilos**
   (ámbar · APRENDER · 1986) → **arcos de atención** sobre "las máquinas aprenden a hablar contigo"
   (violeta · ATENCIÓN · 2017) → convergen en **un caret que te habla** (ACTUALIDAD).
   LM0 narra a la izquierda: tag de era + 2 líneas tecleadas. Cada era cierra con pregunta implícita.
8. **El final.** Playfair itálica: **"Ya conoces el final. Te falta el camino."** +
   "Aprende cómo funciona ChatGPT desde cero. Sin matemáticas." + cards de eras/capítulos
   (los 5 reales + el bloqueado) + CTA **"Empieza por la Era I →"** + **la carta del creador**
   (la máquina te recibe, el humano te despide) + colofón friki:
   *"el balbuceo que has visto es un modelo real entrenándose en tu navegador"*.

## 4. Leyes de dirección (no negociables)

1. **Nada aparece de la nada** — un solo material que se transforma de principio a fin.
2. **Outputs sí, mecanismos no** — la landing enseña lo que las máquinas HACÍAN, nunca POR QUÉ.
   Los porqués son de los capítulos (anti-spoiler).
3. **LM0 habla poco** (~14 líneas) y nunca explica técnica.
4. **El silencio pre-"Hola" es sagrado.**
5. **Documental, no improvisación:** todo texto de máquina en pantalla es output real del motor;
   las tomas se dirigen (seed, temperatura, momento de muestreo, re-roll con lista negra).
6. **El % de corpus = datos realmente ingeridos.** Jamás una barra con timer.
7. **El scroll nunca se bloquea** (mesetas suaves + autopick con guiño).
8. **Móvil se diseña, no se encoge** (este concepto es vertical-nativo).

## 5. Honestidad — qué es real y qué es teatro

- **Real:** el modelo y sus counts, el balbuceo y sus escalones (rampa k/temperatura), el % de chunks,
  el olvido al scrollear hacia atrás.
- **Teatro (sin afirmarlo nunca en copy):** el contador de millones, la velocidad del torrente,
  la fluidez de LM0, los tiempos de cada fase.

## 6. Pipeline técnico

**Stack: DOM + Canvas 2D + Lenis + GSAP ScrollTrigger. SIN Three.js.**
(Escalada a WebGL instanciado — `ogl`, ligero — SOLO si el Gate 3 pide más densidad de partículas.
Decisión por gate, nunca por capricho.)

- **Spine de scroll (heredado de v2, YA validado):** `lenis.on('scroll', ScrollTrigger.update)`;
  `gsap.ticker.add(t => lenis.raf(t*1000))`; `lagSmoothing(0)`; contenedor alto (~500vh) +
  stage `position: sticky` (sin pin); ScrollTrigger solo-progreso; mesetas = smoothstep en el
  progressMap. **Las lecciones §9 del spec v2 aplican íntegras** (fonts.ready→refresh, dispose
  defensivo, ventana tapada congela rAF, etc.).
- **Arquitectura de fases:** `progressMap.ts` puro — progress → {beat, locals}. Única fuente de
  verdad, scrub-reversible por construcción. React lee snapshots (reutilizar el patrón
  `stageStore` de la v2).
- **Texto SIEMPRE en DOM** (h1, líneas de LM0, escalones del balbuceo, finale): nítido, SEO,
  seleccionable. El canvas pinta solo: río, partículas, glow, amanecer. Un único componente
  **`TypedLine`** (cadencia variable — tartamudeo→fluidez —, caret, click-completa; dos modos:
  por tiempo en micro-momentos, por progreso bajo scrub; `prefers-reduced-motion` → instantáneo).
- **El motor:** `trainableModel.ts` + `corpus/{es,en}.ts` (≤30 KB gz por idioma, dominio público).
  `useBabbler(locale)`: `feedRange` por buckets de progreso; k y temperatura en rampa;
  `seedFrom(bucket, intento)` → determinista al scrub; filtro re-roll con lista negra.
  Métricas en pantalla: solo el contador de palabras (loss: descartada — vive en el capítulo MLP).
- **Partículas (el camino):** Canvas 2D, ≤3k puntos, draws batcheados por color, DPR cap 2,
  capas estáticas en offscreen canvas (amanecer), render dentro de `gsap.ticker`,
  pausa con pestaña oculta.
- **Tipografía:** `next/font` añade IBM Plex Mono (`--font-lm0`, latin + italic);
  `document.fonts.ready` → `ScrollTrigger.refresh()`.
- **Bilingüe:** namespace `lab.landing.lm0.*` con paridad ES/EN tipada; corpus y balbuceo por locale.
- **A11y / SEO / perf:** reduced-motion → versión estática completa (todo el texto + 4 figuras fijas
  de la transmutación); h1 = la pregunta del hero; Lighthouse ≥ 90; presupuesto 60 fps en portátil
  medio; el motor carga durante el hero (5-10 s gratis).
- **Móvil:** vertical nativo — LM0 arriba / visual abajo en el camino; río más corto; menos partículas.
- **Tema:** dark-native (el amanecer ES su arco de luz). Pendiente (preguntar en Gate 2):
  variante clara después de clavar la oscura, o landing dark-only.
- **Dónde vive:** `src/features/lab/lm0/nacimiento/` (la v2 3D queda intacta). Preview en
  `/lab/lm0-preview` (no indexada). Al validar todo: swap one-line en `/lab`
  (`lab-landing-client.tsx` se conserva como rollback hasta entonces).

## 7. Qué lo pone a nivel Awwwards (la lista del jurado)

- **Una idea central ejecutada sin fisuras** — el jurado premia concepto + craft, no cantidad de efectos.
- **Micro-detalle:** cadencia de tecleo variable (el ritmo comunica el aprendizaje); el trago físico
  de cada palabra; contador con `tabular-nums` creciendo de cuerpo con los órdenes de magnitud;
  grano + viñeta sutilísimos; easings custom afinados a mano.
- **Interactividad con significado:** entrenas de verdad; sí/no con respuesta propia;
  scroll = aprendizaje; scroll atrás = olvido real.
- **Performance impecable** (lo revisan): cero jank, carga diferida, móvil fluido.
- **Sonido: OFF en v1.** (Clics de tecleo sutilísimos = candidato v2; decidir tarde, off por defecto.)
- OG image + título: "LM0 — ¿Cómo se enseña a hablar a una máquina?"

## 8. Orden de build con GATES (valida el usuario, nunca el constructor — method-failure-book)

0. **Pre:** corpus ES/EN curados + `useBabbler` con tests snapshot de los escalones por bucket.
1. **Gate 1 — el nacimiento se siente.** Beats 1-4 con motor real, fuentes reales, scroll real.
   El usuario scrollea: ¿el balbuceo mejorando engancha? **No se construye nada más hasta el sí.**
2. **Gate 2 — la voz emociona.** Beats 5-6 con el sistema tipográfico completo en vivo.
   Guion ES primero + pasada anti-tells (memoria `prose-anti-ai-tells`) + leerlo en voz alta.
3. **Gate 3 — la transmutación asombra.** Beat 7. Fresh-eyes ciego (captura + "¿qué historia te
   contó?") + panel de 3 lentes (niño / esteta / profesor). Aquí se decide Canvas 2D vs `ogl`.
4. Final + cards + carta + colofón; móvil; reduced-motion; SEO; modo claro (si procede).
5. Fresh-eyes total, lint/tsc/vitest, **PROJECT-LOG** ("started" al arrancar Gate 1, "finished" al
   swap), swap a `/lab`.

## 9. Riesgos y mitigaciones

- **El balbuceo no engancha** → Gate 1 lo primero de todo, antes de construir nada caro.
- **La voz suena a IA o cursi** → guion ES primero, anti-tells, en voz alta; pocas líneas, muy escritas.
- **Pacing táctil** → probar las mesetas y el sí/no en móvil real ya en Gate 1.
- **Flash de fuentes** → next/font + fonts.ready→refresh (lección v2).
- **Hay otra sesión trabajando en el repo (ngram/caps)** → todo lo nuevo en archivos nuevos;
  jamás `git add -A`; solo rutas explícitas (lección v2 §9).
