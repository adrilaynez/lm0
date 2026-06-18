# LM0 Landing v3 — Estado y traspaso (2026-06-13)

> Documento de continuidad tras una sesión larga de diseño + implementación.
> Léelo junto a `lm0-landing-v3-spec.md` (la dirección) y este archivo (el estado real).

## Sesión "TRAINING rediseñado — máquina protagonista + cinta scroll-driven" (2026-06-18) — HECHO (83 tests / tsc / eslint verdes, geometría verificada por preview)

Rediseño SOLO de la sección de entrenamiento/lectura del corpus a nivel Awwwards (plan:
`~/.claude/plans/happy-splashing-waffle.md`; iterado con feedback del usuario en 3 rondas). North star:
"una máquina grande bajo cristal de laboratorio aprendiendo a hablar; el corpus la alimenta como una cinta;
instrumentación casi secreta en los bordes". Criterio real = **test de 5s** (un extraño dice qué intenta
escribir la máquina y si ha mejorado), no los vh.

- **Máquina protagonista:** deja de recogerse a `scale 0.58` → `base = 1 - 0.20*tIn` = **scale 0.80**,
  `machShift -17→-21vh` (`NacimientoLanding.tsx onProgress`). Verificado por geometría: **imagen 50vh de
  alto, CRT 25.5vh** (dominante + legible) a 1280×800 y 1280×720, sin solapes. El `width` global de
  `.lm0-machine` NO se tocó → el hero queda idéntico al píxel.
- **CRT = boca:** sin cambios de contenido (solo etiqueta de intento + toma + caret).
- **Lector reescrito = CINTA de alimentación** (`Instruments.tsx`, clases `.lm0-tape*`): ventana de 3 filas
  con `mask-image`, texto REAL del Quijote (no el stream plegado), spans leído/activo/futuro, la cinta sube
  word-line a word-line (transform por `offsetTop` real, patrón de `NoteReveal`). Palabra activa = verde
  fósforo; futuro muy apagado. **SUPERSEDE** la mecánica vieja "frase fija + cabezal por tiempo + scroll
  cambia frase" — por petición explícita del usuario; es scroll-driven, NO el teleprompter automático que
  le molestó.
- **Sync scroll-lectura granular + causal + HONESTA:** una sola magnitud continua `read01 =
  smooth01(st.local)` conduce cinta + contador + %. Poco scroll = pocas palabras (`TAPE_CHARS=1800`,
  tunable). "letras leídas"/% = avance REAL del corpus ingerido (nunca timer; `feedToward` sigue
  alimentando el modelo real). La CAPACIDAD (k, stage, toma del CRT) sigue a **escalones** → "alimentación
  continua, capacidad escalonada". Reversible al scroll atrás.
- **Datos = 4 esquinas únicas (sin duplicar) + 1 línea de pie:** TL `lm0·n-grama` · TR
  `don quijote·cervantes` · BL `alfabeto: 27 símbolos` · BR `temp: N.N` (real, baja al aprender); `intento`
  vive SOLO en el CRT, `k` baja al pie. Pie = `k=N · aprendiendo {stage} ━●── {pct}% leído · queda el
  {rest}%` (`.lm0-botline`, fusiona la barra + el k). Esquinas a baja opacidad (`*0.7`). Borrado el bloque
  CSS muerto `.lm0-hud`.
- **Duración:** training alargado vía `SEGMENTS` **hero 0.15→0.10, training 0.28→0.33** MANTENIENDO
  `hero+training=0.43` → la frontera training/silence queda EXACTA en `raw 0.43`, así el acto oscuro
  (ScreenHack dive 0.47–0.60, voice, eras, power-off) queda **byte-idéntico** (sin tocarlo; test
  `progressMap.test.ts` blinda el invariante 0.43). El wrapper (960vh) NO se tocó. **Tradeoff:** +18% de
  scroll raw para training; un aumento MAYOR exigiría re-timear el acto oscuro (evitado adrede). La sensación
  de "mucho más" la da sobre todo la granularidad de la cinta.
- **i18n nuevas** (es/en): `training.teleAlphabet/teleTemp/tapeTag/barLeftK/barProgress`. Claves viejas
  (`barLeft/barRight/barAttempt/reading/words`) quedan sin uso (borrables).
- **Pendiente de validar EN MOVIMIENTO en primer plano** (el headless no conduce Lenis → la cinta granular
  y la toma del CRT en training solo se ven scrolleando en el Chrome real). Geometría + poblado de datos
  verificados por preview. Tunables: `TAPE_CHARS` (1800), `machScale` (0.80–0.92), share hero/training.

## Sesión "hackeo + lm0 hablando" (2026-06-18) — HECHO (tsc/eslint/prettier/44 tests verdes)

Plan: `~/.claude/plans/vas-a-ser-el-proud-kernighan.md`. Dos focos: la transición del **hackeo** y el **monólogo de lm0**.

- **Narrativa de lm0 reescrita (workflow generate→judge→synthesize, 8 ángulos → panel 4 lentes → síntesis + pulido anti-tells).** El monólogo pasa de 4 a **7 grupos**, más cálido/de bienvenida (audiencia = padres no técnicos): reconocimiento → puente 70 años → "hola. soy lm0." → **el testigo** ("he visto nacer cada idea / y cada avance lo sentí como mío") → "lo das por hecho / no lo fue" → el camino (cientos de ideas) → la promesa ("ven conmigo / en cada era construirás tú una máquina que habla / mira."). Claves i18n nuevas `lm0.voice.g1l1…g7l4` (ES+EN), fallback reduced-motion actualizado. Solo 2 clímax [HUGE]: `setenta años.` (vm-num) y `hola. soy lm0.` (vm-big). El "construir por era" es **solo promesa hablada** (el constructor interactivo es trabajo aparte).
- **Hackeo: que dure, se note y no se pueda saltar.** (A1) Reponderadas las fases en `ScreenHack.tsx`: el verde/binario se retrasan (flood `smoothstep(0.62,0.95)`, binario `0.6→0.8`, canvas op `0.58→0.74`) → la **fase de "pantalla rota" sin verde** es ahora la primera y dominante (~69vh vs ~28vh; verificado en preview: a raw 0.545 `sw=0.614, green=0`). (A2) Presupuesto de scroll ampliado: `SEGMENTS` = hero .15 / training .28 / **silence .13** / **voice .23** / eras .21, wrapper **720→960vh** (eras/training mantienen su largo absoluto). Ventana del dive: `smoothstep(0.47,0.60)`. (A3) **Reactivo a la velocidad** (dRaw auto-computado por frame): un flick rápido hace que la pantalla se rompa MÁS (cap rgbOff 28 / disp 120) + **shimmer** temporal para que esté viva en reposo. **Sin** meseta/hold de scroll (no se bloquea nunca).
- **Tipografía del monólogo (`.lm0-voicebox`):** glow de fósforo cream en todo el texto; "hola. soy lm0." a **2.4em weight 500** con bloom fuerte (el mayor de la página); `setenta años.` a 2.15em; `line-height 1.95`, `letter-spacing 0.01em`, `max-width 680px`, caret con glow; guardas `@media (max-height:720px)` y `@media (max-width:600px)` para que el saludo **nunca haga wrap** en móvil (verificado a 375px).
- **Nuevo CSS var `--lm0-green`** (separado de `--lm0-sw`): el bed verde `.lm0-screenworld` se retrasa tras la fase rota; `--lm0-sw` sigue moviendo máquina+scanlines.
- **Pendiente de validar EN MOVIMIENTO en primer plano:** el preview headless **congela rAF** (canvas del hackeo + tecleo del monólogo no animan ahí; sí se verificó la geometría/CSS y las curvas de timing por scroll). Tunables: la ventana del dive y los `win` de los 7 grupos en `VoiceMonologue.tsx`.

## Sesión "premium pass" (2026-06-13 tarde/noche) — HECHO y verificado

Rediseño grande aprobado (plan en `~/.claude/plans/serialized-napping-zebra.md`). Completado y verificado (tsc/eslint/i18n verdes; visual por el Chrome del usuario vía MCP — la herramienta de preview headless da capturas glitcheadas/congeladas, así que el layout se valida por **geometría exacta** (`getBoundingClientRect`) y el visual por screenshot del Chrome real):

- **Render frío del Mac:** `public/lm0/maquina-cool.webp` (enfriado de `maquina3.webp` con `.lm0-caps/cool.mjs`: `modulate saturation 0.5`). Recortado con `.lm0-caps/knockout.mjs` (flood-fill + croma + dilatación). Rollback: `maquina3.webp`, `maquina.webp`.
- **Hero:** quitada la lámina/`.lm0-frame` (al usuario no le gustaba); masthead `lm0 · el nacimiento` arriba; **pregunta a 2 líneas** (`.lm0-headline width 540px`, más ancha que el Mac); **Mac más grande** (`min(48vh,...)`); sizing por altura → no se sale ni en 700px. Fuente del titular = **Fraunces**.
- **Training (premium):** termómetro fuera. Esquina TR `don quijote · corpus`. **HUD abajo‑izquierda** (`.lm0-hud`): `n-grama`, barra **CORPUS** (% real) y barra **CONOCIMIENTO** (sube con bucket; etiqueta de etapa: letras→sílabas→palabras→frases→de memoria), `k = N · contexto`. Odómetro en **LETRAS** (`feed.fedTo`, no palabras). Lector del Quijote en **card** (`.lm0-reader-card`). Transición hero→training con escalonado (delays) + la máquina sube a `top:6vh scale(0.9)`.
- **Acto oscuro (la gran mejora conceptual):** `.lm0-screenworld` = mundo **verde‑negro** (gradiente + glow fósforo) que llena el viewport en voice/eras + scanlines (`.lm0-scan`) + grano (`.lm0-grain`). La máquina hace **ZOOM hacia su pantalla** (`scale(2.7)`, `transform-origin: 50% 33%`) y se desvanece → "el ordenador desaparece, estamos dentro de su pantalla".

## Sesión continuación (post-compact, 2026-06-13 noche) — TRANSICIONES + FINALE ss4 HECHOS y verificados

- **Transiciones Apple-smooth = HECHO** (era la queja #1). La máquina + mundo‑pantalla + scanlines + instrumentos del training ya NO usan CSS transitions por `data-beat`: van **scrub-linked por frame** desde `raw` vía CSS vars escritas en `onProgress` (`--lm0-mach-shift/scale/op`, `--lm0-sw`, `--lm0-train`). Ventanas: hero→training `smooth01((r-0.13)/(0.21-0.13))`, dive `smooth01((r-0.55)/(0.625-0.55))`. Verificado el plumbing en Chrome (en hero: shift 0, scale 1, op 1; interpola solo al scrollear). Training tiene además marco inset (`.lm0-tframe`) + label inferior (`.lm0-tlabel` "entrenando — leyendo el corpus").
- **FINALE ss4 = HECHO y verificado por screenshot del Chrome real (estático, flujo normal — captura fiable).** `FinaleSection.tsx` reescrita en DOS movimientos:
  - **OSCURO** (sigue el acto, mundo verde‑negro + grano + scanlines): climax `ya conoces el final / te falta el camino` (serif cream) + sub · **"el viaje"** = `EraTimeline.tsx` (timeline horizontal de 5 puntos por era — cero/hoy neutros, contar verde, aprender ámbar, atención violeta — línea con gradiente que fluye por las eras + nombres/años; revela on-view por IntersectionObserver → `data-revealed`, dots/línea animan con stagger via `--i`) + cierre `cada idea nace de la anterior. ninguna se salta.` · **"los capítulos"** = `ChapterCards.tsx` (6 tarjetas 3×2: 01 bigram · 02 n-gram · 03 redes · 04 mlp · 05 transformer · 06 gpt-locked) con **glyph SVG propio por capítulo** (`ChapterGlyph.tsx`: bigram=barras de frecuencia, ngram=ventana de celdas→predicción, nn=red de nodos, mlp=capas apiladas, transformer=haces de atención, gpt=candado dim) coloreado por era (`--ch`), microcopy que brilla y sube en **hover** + glyph con bloom/pulso en hover. NUNCA importan los visualizadores de ngram/bigram — son marcas propias de LM0.
  - **LUZ** (epílogo cálido, vuelve la luz con seam en gradiente): **nota del creador reescrita como lm0** (ya NO es relleno; 3ª persona "mi creador", sin "hola soy adri") + CTA `empezar por el principio →` + **footer** scoped (`hecho por una sola persona · adrian laynez · código en github` con links a github.com/adrilaynez) + colofón (`finale.colophon`, modelo real).
  - i18n nuevas: `finale.journeyTitle/chaptersTitle/journeyClose`, `finale.tl.{cero,contar,aprender,atencion,hoy,start,now}`, `finale.ch{Bigram,Ngram,Nn,Mlp,Transformer,Gpt}Sub`, `finale.chOpen`, `finale.footerMade/footerAuthor/footerSource`, `noteBody` reescrita. Paridad es/en verde.
  - **Verificación**: el rAF se CONGELA con la pestaña en background (Windows) → los screenshots con transición en curso dan timeout y la timeline no revela sola. Truco usado: forzar el end-state con `<style>` `!important transition:none` para pintar un frame estático. En primer plano revela sola con la animación. La timeline ya tiene guard de `prefers-reduced-motion` (dots/línea visibles sin animar).

### Epílogo del finale REHECHO (feedback del usuario sobre la nota/CTA/footer/seam)

El usuario dijo: la transición oscuro→luz "muy floja", la nota "floja", el CTA y el footer "horrible"; quería la nota **contada por lm0, revelándose con scroll pero SIN borrarse**, y mirar "cómo lo hacen las páginas más top". Me dio su **carta real** (fuente en memoria `lm0-creator-note-source.md`). Resuelto con un **workflow** (3 borradores de la nota por ángulo + research/diseño + síntesis-juez):

- **Nota = `NoteReveal.tsx`** (componente nuevo, autónomo): track alto + stage sticky; un rAF lee el rect (scroll Lenis nativo) → `--spoken` fraccional; cada línea revela por CSS (`--reveal`/`--age` desde `--spoken`+`--i`), **acumula** (no se borra), la más reciente es la más brillante, las viejas receden suave. **Cabezal de lm0** sobre la línea hablada, posicionado por el `offsetTop` REAL de la línea (a prueba de wrapping — el cálculo por `line-h` fijo fallaba con líneas de 2 filas). Copy: 12 segmentos en voz de lm0 (3ª persona, sin "hola soy adri") que cuentan la carta real + explican la página + 3 eras + "se construye poco a poco" + Karpathy + sugerencias abajo-dcha. En i18n como `lm0.finale.noteLines` (array string[]; se lee con `useTranslations().raw()`, NO con el shim `t()` que solo da strings; el test de paridad trata string[] como hoja).
- **CTA premium = `.lm0-cta`**: imán JS (transform) + barrido de relleno verde (era-contar) + flecha que desliza; el JS posee `transform`, el CSS el resto (no pelean). Reduced-motion seguro.
- **Footer editorial = `.lm0-footer`**: colofón en itálica como línea-héroe (atribución subrayada en verde) + hairline + 3 celdas baseline (hecho por·adrian laynez / icono github·código en github / ideas·sugerencias ↘ abajo a la derecha).
- **Seam = "amanecer"**: `.lm0-finale-dawn` (banda fija full-bleed 82vh) verde-negro → ámbar/ember → arena → marfil (sin gris muerto), con el MISMO glow cálido del hero; grano/scanlines del bloque oscuro enmascarados para disolverse en el seam. El bg del bloque claro es marfil sólido (el gradiente NO va en el bloque-largo, que con el track de la nota mediría >300vh).
- Verificado por screenshot del Chrome real en ES (nota revelada, cabezal alineado, seam, CTA normal+hover, footer). tsc/eslint/paridad i18n verdes. **Tunable**: el alto del track de la nota = `N*22+56` vh (~320vh) → si en primer plano se siente largo, bajar el multiplicador en `NoteReveal.tsx`.

## ⚠️ PRIORITARIO POST-COMPACT (último mensaje del usuario, se fue a estudiar, NO vuelve — continuar SOLO sin parar)

> Estado: el punto **1 (transiciones)** y el punto **2 (training estilo Pulsar: marco + label)** ya HECHOS arriba. El **finale ss4 + el epílogo rehecho** (nota contada por lm0 + CTA + footer + seam) HECHOS. Sigue pendiente: interludios (Fase 2), pulir card del Quijote (punto 3), validar todo el recorrido EN MOVIMIENTO en primer plano (el rAF se congela en background).

Verificación: usar el **Chrome real del usuario vía MCP** (`mcp__Claude_in_Chrome__*`, browser ya conectado deviceId `f9bc8b93-...`, tab de `/es/lab/lm0-preview`). La preview headless da capturas glitcheadas/congeladas. El layout se valida por **geometría** (`javascript_tool` → `getBoundingClientRect`); el visual por **screenshot del Chrome** (con la ventana en primer plano el rAF corre a 60fps; en background se congela → boot lento y el canvas de eras congela el renderer). Dev server: `preview_start name:web` en :3000 (si "another server running", `Get-NetTCPConnection -LocalPort 3000` → Stop-Process, luego start).

1. **TRANSICIONES = "APPLE FEEL", ahora HORRIBLES (0 smooth).** Las dos: **hero→training** y **training→lm0 (acto oscuro)**. Causa raíz: la máquina se mueve por **CSS transitions disparadas al cambiar `data-beat`** (discreto, "salta y anima"), NO está ligado al scroll. **FIX (en marcha):** conducir el transform de la máquina **por frame desde `raw`** (scrub-linked, mantequilla) con CSS vars escritas en `onProgress` (NacimientoLanding): `--lm0-mach-shift` (vh, 0→-24 en hero→training), `--lm0-mach-scale` (1→0.92 training→2.7 dive), `--lm0-mach-op` (1→0 en dive), `--lm0-sw` (screenworld 0→1 en dive). `.lm0-machine { top:50%; transform: translate(-50%, calc(-50% + var(--lm0-mach-shift,0px))) scale(var(--lm0-mach-scale,1)); transform-origin:50% 33%; opacity:var(--lm0-mach-op,1); }` y QUITAR las reglas `[data-beat=training/silence/voice/eras] .lm0-machine` de top/transform. Ventanas raw: TRAIN_IN ≈ [0.13,0.21], DIVE ≈ [0.55,0.625] (voice empieza en 0.58). Usar `smooth01`. Igualmente conviene scrub-ear opacidades de instrumentos para que no "aparezcan de golpe".
2. **Training estilo la REFERENCIA "Pulsar"** (el usuario la re-mandó como objetivo): la ss2 debe "entrar en modo entrenamiento" con un **MARCO inset** (solo training) + **4 stats en las esquinas** (estilo `( valor )` / label) + **label inferior centrado** (tipo "ENTRENANDO — LEYENDO EL CORPUS"). Stats LM0 para las esquinas: `( k = N )` contexto · `( don quijote )` corpus · `( NN% )` del corpus leído · `( N letras )` / conocimiento-etapa. La barra de corpus puede ir como hairline en el borde inferior del marco. (Tengo ya el HUD abajo-izq + las 2 barras corpus/conocimiento — el usuario quiere MÁS el formato 4-esquinas+marco de la referencia; reconciliar: marco + 4 esquinas + barras integradas.) "No se siente tan premium la actual" → subir nivel.
3. **El texto del Quijote / su marco está "regular".** Mejorar la card del lector (`.lm0-reader-card`): tipografía, contención, premium.

## Pendiente (siguiente sesión — el plan lo detalla)

- **Interludios de lm0** (Fase 2 del plan): que lm0 narre desde el inicio (intro antes de training, durante, después "nada mal", y enmarcando el acto oscuro). Reestructura de SEGMENTS (beats `intro`/`afterTraining`) + componente `Lm0Narration` + interacción "genera otra frase". Copy borrador en el plan; pulir (anti-AI-tells).
- **Finale ss4** (Fase 5): sobre OSCURO — timeline de eras con puntos + tarjetas de capítulo con mini‑visualizadores + hover; nota del creador reescrita como lm0 (borrador en el plan); CTA mejorado; footer estilo sitio. Referencias del usuario en el plan.
- **Copy** (Fase 6) + validación final de todo el recorrido (con la ventana en primer plano para que el rAF no se congele).
- Nota: `lm0.hero.specAlphabet/specCorpus` quedaron sin uso (el footnote se quitó); reusables o borrables.

## Dónde estamos

- **Rama:** `redesign/lm0-landing-v3` (nace de `redesign/ngram-amber-v1`, base viva del ngram WIP).
- **Último commit:** `37796e8` — el HEAD avanza con cada ajuste; mira `git log` para el más reciente.
- **Estado:** landing COMPLETA en `/lab/lm0-preview` (ES + EN). 82 tests verdes, `tsc`/eslint limpios, build prod verde. Tras el commit `55cda28` (landing entera) hubo ~12 commits de **pulido del HERO + el lector** pedidos por el usuario en vivo (ver abajo).
- **Pendiente:** (1) la **nota del creador** sigue siendo relleno de Claude → `i18n/locales/lm0/*.ts` clave `lm0.finale.noteBody` (el usuario debe poner su carta real); (2) **validar en vivo el acto oscuro + eras + finale** scrolleando (solo se ha pulido el hero/training; el navegador headless congela el rAF y Lenis no se puede conducir desde fuera, así que esas escenas no se han visto en movimiento); (3) luego: fresh-eyes gates → swap a `/lab` → merge (ngram a main primero).

## Pulido del hero/lector (2026-06-13, sesión de mañana — sobre `55cda28`)

Iteraciones en vivo con el usuario (cada una su commit). Estado final:
- **HERO PREMIUM EDITORIAL (rediseño 2026-06-13 tarde — "pieza de exposición, no landing de SaaS").**
  Inspiración: referencia "Pulsar" (NO copiar) → principios: titular que SUSURRA, Mac protagonista
  fotográfico, monocromo con un solo acento (el fósforo dentro del cristal), mucho aire, marco-lámina.
  Composición vertical: **marco-lámina inset** (`.lm0-frame`, hairline sutil 4 caras, hero-only — bound­ea
  el espacio en pantallas grandes como paspartú) · **masthead** arriba (`lm0` izq · `el nacimiento` der,
  `.lm0-masthead`, mono caps, marca en minúscula vía `text-transform:none`) · **el Mac** centrado
  (protagonista) · **la pregunta SUSURRADA debajo** (`¿cómo se enseña a hablar a una máquina?`, `.lm0-display`
  en **Fraunces** weight ~370, `máquina?` itálica, grafito `--lm0-graphite`, la MITAD de tamaño que el viejo
  Playfair 800) · sub `la máquina no sabe hablar — todavía` · cue `desliza ↓`. La barra de progreso abajo
  cierra el marco. SIN botón CTA. Claves i18n hero: `eyebrow/question/questionAccent/label/hint`.
- **Fuente del titular = Fraunces** (variable, ejes opsz/SOFT/WONK + itálica), añadida en `layout.tsx` como
  `--font-fraunces` (el análogo libre más premium a Canela/Editorial New; el usuario dejó elegir).
- **El render del Mac = `public/lm0/maquina2.webp`** (Mac compacto beige CÁLIDO, pantalla NEGRA, frontal
  recto — el usuario lo generó con su IA; elegido sobre 2 variantes de pantalla verde porque la pantalla
  debe arrancar negra: el verde lo dibuja nuestro código). Venía sobre fondo blanco → recorte a transparente
  con **flood-fill + compuerta de croma** (`.lm0-caps/knockout.mjs`: el beige es cromático y se conserva, el
  fondo/sombra neutros se van). El viejo `maquina.webp` (CRT apaisado) queda de ROLLBACK.
- **Tamaño/posición Mac:** `width: clamp(400px, min(60vh, 66vw), 880px)`, centrado (`top:50%`,
  `translate(-50%,-50%)`); en training/silence baja a `top:5vh`. El render nuevo es **casi cuadrado** (≠ el
  apaisado viejo), por eso se escala distinto. Imagen+pantalla+glow envueltas en **`.lm0-screenframe`**
  (tamaño imagen) para que `.lm0-screenbox` se posicione en % de la IMAGEN, no de `.lm0-machine` (que crece
  con el herofoot). **`.lm0-screenbox` re-medido para maquina2.webp = left 12.5% / top 13% / 62% × 40%**
  (medir con `.lm0-caps/measure.mjs` = bbox del componente oscuro mayor; si cambia el render, re-medir).
- **CLAVE del layout:** pregunta+sub+cue van **DENTRO de `.lm0-machine`** colgando bajo la pantalla
  (`.lm0-herofoot`, como el odómetro/muro), solo en hero → pegados al Mac, se mueven con él, nunca chocan
  con la barra. **La pregunta va DEBAJO del Mac, no encima** (un Mac grande + titular encima NO caben en
  800px; la referencia premium también lo pone debajo). En grande el usuario eligió **"déjalo aireado"**
  (el marco basta; NO añadir etiquetas en las esquinas).
- **EL LECTOR (corpus reader) — comportamiento final, costó MUCHO acordarlo** (`Instruments.tsx`):
  UNA frase estática a la vez; el cabezal la recorre SOLO (por tiempo, `HEAD_CPS`) y al llegar al final SE
  PARA y no hace nada; un poco de SCROLL cambia a una frase COMPLETAMENTE nueva (paso discreto,
  `PHRASE_STEPS = 12`) y el cabezal reinicia desde el principio. NO bucle, NO ventana que fluye, NO
  scroll-flow. Las frases salen de `phrasesFor()` (sentencias del corpus, ~175 chars). El bloque está
  bloqueado a 3 filas en CSS (`.lm0-reader-text` height 6em + overflow hidden), fuente `clamp(0.72,...,0.82rem)`,
  ancho `min(660px, 84vw)`. **Si el usuario pide tocar el lector, NO lo conviertas en teleprompter ni en
  bucle automático — ese fue el malentendido que lo enfadó. Es: frase fija + cabezal que la barre y para +
  scroll = frase nueva.**

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
1. **Hero (mínimo):** wordmark `lm0` (masthead arriba) + máquina centrada balbuceando morralla REAL del modelo sin entrenar (teclea→mira→borra→reintenta) + frase `la máquina no sabe hablar. / todavía.` y hint `desliza para entrenarla ↓` colgando bajo la máquina (`.lm0-herofoot`). Sin eyebrow/pregunta/CTA. Auto-nudge: si nadie scrollea en 9s, Lenis desliza un poco.
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
