# Trazabilidad del feedback del usuario → método (n-gram)

Auditoría EXHAUSTIVA de todo lo que el usuario pidió (fuente: el plan
`~/.claude/plans/s-se-ha-borrado-valiant-bengio.md`, PARTES A/A11/F + fragmentos del audio), con el estado de
cada punto. Sirve para responder a "¿qué cosas no se han usado o chocan con el modelo actual?".

**Leyenda de estado:**
- ✅ **EN MÉTODO** — ya es regla en los manuales (con dónde).
- 🟦 **CONTENIDO → PLAN** — no es regla de manual; es decisión concreta de n-gram, vive en el plan (PART
  C2/C3/C4) y se ejecuta en Fase 2/3 *aplicando* el método. NO se ha perdido.
- ❗ **ERA HUECO → AÑADIDO** — me lo había dejado; ahora añadido (con dónde).
- ⚠️ **TENSIÓN** — choca o roza con otra regla del método; abajo la resolución.

---

## 1 · PART A — feedback punto por punto

### A1 · Estructura
| # | Punto | Estado |
|---|---|---|
| A1.1 | No 3-4 secciones solo-de-fallo ("crítica, crítica") | ✅ pilar 13 «no apiles fracasos» + FLOW GATE «no apilar fracasos» |
| A1.2 | Trigrama se da hecho; construir gradual (empezar por la T) | ✅ principio: pilar 12 «construir cuesta» · 🟦 concreto: §2 TrigramBuilder (PART C2/C3) |
| A1.3 | Construir instantáneo → debe COSTAR | ✅ pilar 12 |
| A1.4 | Acabar la máquina + CELEBRAR antes de criticar | ✅ pilar 13 (orden del arco) |

### A2 · Descubrir, nunca contar
| # | Punto | Estado |
|---|---|---|
| A2.1 | Nada por sabido; todo descubierto | ✅ pilar 11 + FLOW GATE «descubrir a nivel de arco» |
| A2.2 | Para padres/niño, sin mates ni jerga | ✅ pilar 4 (ya existía) |
| A2.3 | Encuentra los fallos él; peonza de Inception | ✅ pilar 10 (añadido) |
| A2.4 | Pistas ocultas; intenta la SOLUCIÓN antes de revelar | ❗ ERA HUECO → pilar 10 (añadido) |
| A2.5 | Incluso el fallo del bigrama lo descubre él | ✅ pilar 10/11 |

### A3 · La construcción se SIENTE (gradual)
| # | Punto | Estado |
|---|---|---|
| A3.1 | Construir trigrama poco a poco (T→pareja→27→un bigrama por letra→la matriz crece) | ✅ principio pilar 12 + gate de ESCALA · 🟦 concreto §2 (PART C2) |
| A3.2 | Entrenar→mejora→4-grama→tabla crece→5-grama Shakespeare gigante | ✅ gate de ESCALA · 🟦 concreto §3 (PART C2) |
| A3.3 | Imaginar 10/20-grama → descubre SOLO el tamaño exponencial | ✅ ESCALA + descubrimiento · 🟦 concreto §3/§4 |

### A4 · Arco emocional (orden)
| # | Punto | Estado |
|---|---|---|
| A4 | construir→celebrar→empujar→descubrir el muro→puente | ✅ pilar 13 + ❗ **mapa de arco EMOCIONAL como artefacto** (añadido, 2b·d2) |

### A5 / A6 · Tono e historia
| # | Punto | Estado |
|---|---|---|
| A5 | Divertido, humor, no asusta | ✅ pilar 2 (ya existía) |
| A6 | Historia REAL (50 años, autocompletar del móvil, anécdota) | 🟦 CONTENIDO → Fase 2 (manual ya soporta «Historia» foldout: pilar 19 / P9) |

### A7 · Crítica por visualizador
| # | Punto | Estado |
|---|---|---|
| A7.1 | ContextWindow: el % es el HÉROE; menos elementos; jerarquía | ✅ gate héroe/5s/jerarquía (2.5) · 🟦 rework concreto Fase 3 |
| A7.2 | ContextCounter: algo de texto explicativo; jerarquía de color | ✅ 5s reframe + jerarquía · 🟦 Fase 3 |
| A7.3 | NgramBattle: construir 1→2→3→4, no n=4 de golpe | 🟦 CONTENIDO Fase 3 |
| A7.4 | ContextExplosion: la tabla debe CRECER + zoom/átomo | ✅ gate de ESCALA (principio) · 🟦 Fase 3 |
| A7.5 | SparsityView: mostrar el tamaño otra vez (zoom) | ✅ gate de ESCALA · 🟦 Fase 3 |
| A7.6 | InfiniteTable: % deben subir (trillón) + consumo de libros | 🟦 CONTENIDO Fase 3 |
| A7.7 | §6: demasiados widgets de fallo (~7) → reducir/consolidar | ❗ ERA HUECO → dedup de WIDGETS (añadido a FLOW GATE) |
| A7.8 | Interactivo>estático; explorar (huecos vacíos); legibilidad #1; no todos increíbles pero todos se entienden | ✅ Bar-v2 interacción + **rabbit-hole** (añadido) + **5s reframe** + **rigor proporcional** (añadido) |

### A8 / A9 · Agente empoderado + endurecer método
| # | Punto | Estado |
|---|---|---|
| A8 | Agente con poder: 5 direcciones, jerarquía/estética, última palabra, no copiar bigram | ✅ contrato paso 2.5 |
| A9 | Endurecer método generalizable, robusto, permanente; documentar por qué falló §1/§2/orden | ✅ `method-failure-book.md` + edits en los 4 manuales + memoria |

### A10 · Varios
| # | Punto | Estado |
|---|---|---|
| A10.1 | Generación = leer un número de la matriz gigante (flujo completo) | 🟦 CONTENIDO Fase 3 (reusar LetterByLetter/TableWriter) |
| A10.2 | Metáfora tamaño/zoom (átomo); posible mecánica compartida | ✅ principio = gate de ESCALA · 🟦 mecánica nueva = Fase 3 |
| A10.3 | Consumo de libros (sentir la cantidad de texto) | 🟦 CONTENIDO Fase 3 |
| A10.4 | Nada de muros; variar (widgets/callouts/cajas); "para un TikTok"; más widgets donde la idea es compleja | ✅ pilar 19 (ya existía) · ⚠️ ver TENSIÓN-1 con dedup |
| A10.5 | Puente espectacular; gato/perro; leer capítulos siguientes; progresión final + modelo grande | ✅ leer-siguiente-capítulo = pilar 15 (añadido) · 🟦 puente concreto + modelo grande = Fase 2 |
| A10.6 | Menos tecnicismos; humor; gratificación; "te ha costado" | ✅ pilar 4/2/12 |

### A11 · Adicionales
| # | Punto | Estado |
|---|---|---|
| A11 | Jerarquía + trucos de estética como HERRAMIENTA para explicar | ✅ paso 2.5 |
| A11 | Leer capítulos siguientes antes del puente | ❗ ERA HUECO → pilar 15 (añadido) |
| A11 | Vale un widget "showpiece porque impresiona" (Shakespeare) | ✅ ya soportado (motion budget en CLAUDE.md; `temperature: showpiece`) · ⚠️ ver TENSIÓN-3 |
| A11 | Modelo mental "trigrama = un bigrama por cada primera letra" | 🟦 CONTENIDO Fase 2/3 |
| A11 | Al final, modelo GRANDE que escribe genial; los fallos se ven CON esa máquina | 🟦 CONTENIDO Fase 2/3 |
| A11 | Método GENERACIONAL: auditar capítulos posteriores | ❗ ERA HUECO → `method-failure-book.md` §5 «Generational» (añadido) |
| A11 | Interacción extra para explorar (pasar por huecos vacíos, jugar) | ✅ rabbit-hole gate (añadido) |
| A11 | El usuario llega SIN saber nada; ponerse en su piel siempre | ✅ pilar 4 + principio de ojos-frescos |

---

## 2 · PART F — los 10 mecanismos (todos EN MÉTODO)
1 narrativa-primero ✅ (Paso 0 / 2b) · 2 discovery test ✅ (FLOW GATE) · 3 ojos-frescos ✅ (gate clave) ·
4 5 direcciones+héroe ✅ (2.5) · 5 escala ✅ · 6 construir-cuesta ✅ (pilar 12) · 7 panel de jueces ✅ ·
8 bucle rebuild ✅ · 9 libro de fallos ✅ · 10 estudio estética/jerarquía ✅ (2.5).

---

## 3 · ❗ Huecos que me había dejado (ahora cerrados)
1. **A2.4** pistas ocultas / intentar la solución antes de revelar → pilar 10.
2. **A11** leer capítulos siguientes antes del puente → pilar 15.
3. **A4** mapa de arco EMOCIONAL como artefacto aparte → blueprint 2b·d2.
4. **A7.7** dedup de WIDGETS (no solo prosa) → FLOW GATE.
5. **A8/legibilidad** reencuadre del 5s (saber qué hacer + el héroe, no entender todo) → gates + checklist.
6. **A7.8** orden de prioridades del widget (idea→visual→interactivo→rabbit-hole) + rigor proporcional → 2.5 + QUALITY PASSES.
7. **A11** método generacional (auditar capítulos posteriores) → failure-book §5.
8. (de mi crítica, aprobado) ojos-frescos para la NARRATIVA · spike del widget más arriesgado · rúbrica de framing.

---

## 4 · ⚠️ Tensiones con el método actual (y cómo se resuelven)
- **TENSIÓN-1 · "más visualizadores" (A10.4) vs "una idea → un widget" (dedup).** Resolución: el dedup mata
  dos widgets que enseñan la MISMA idea (unseen+typo, sparsity+infinite). A10.4 pide más widgets para ideas
  DISTINTAS o facetas nuevas. No chocan: una idea = un widget; ideas distintas = más widgets. *Regla:* el
  segundo widget vive solo si añade una faceta nueva de verdad.
- **TENSIÓN-2 · "best in the world / rabbit hole" vs "no todos tienen que ser increíbles" (A7.8).**
  Resolución: SUELO (innegociable) = expresar la idea genial, visual-first, entendible. TECHO (opcional) =
  rabbit-hole. + **rigor proporcional**: panel completo solo en 2-3 widgets héroe. Los simples: que se
  entiendan, no que deslumbren.
- **TENSIÓN-3 · showpiece/awe (Shakespeare) vs "confident minimalism / no noise" (CLAUDE).** Resolución:
  CLAUDE ya dice "el presupuesto de motion NO está limitado; el límite es la limpieza visual, no el número de
  animaciones". Un showpiece vale si ENSEÑA y además impresiona; sigue sin neón/dashboard/cromo extra.
- **TENSIÓN-4 · "5s claro" (viejo) vs ideas complejas que tardan más.** Resuelto con el reencuadre: en 5s
  sabes QUÉ HACER y QUÉ IMPORTA; el concepto completo puede desplegarse llevándote de la mano. Ya no choca.

Ninguna tensión queda sin resolver.

---

## 5 · 🟦 Contenido aplazado a Fase 2/3 (NO perdido — vive en el plan)
El arco de 5 secciones (PART C2); el plan por widget keep/rework/new (PART C3); reuso de patrones bigram
(PART C4); y los concretos: TrigramBuilder gradual, generación leyendo de la matriz, zoom-átomo como mecánica,
consumo de libros, historia real, modelo grande final, modelo mental del trigrama, battle 1→2→3→4,
InfiniteTable hasta el trillón. Todo eso se DISEÑA y CONSTRUYE en Fase 2/3, pasando por los gates de arriba.

---

## 6 · Estrés del método (¿volvería a fallar?) — 3 agentes red-team independientes

Tres agentes (ninguno construyó el método) lo atacaron desde tres ángulos (presión / ejecutor literal /
cobertura). **Convergieron en un mismo veredicto**, y es duro:

> **Los gates "independientes" no dejaban EVIDENCIA → un aprobado auto-evaluado es indistinguible de uno
> real. Es RC-0 reencarnado un nivel más arriba.** Y el gate que más importa —la NARRATIVA, donde v1 más
> falló— estaba nombrado pero **sin secuenciar ni operativizar**. Tal cual, v2 podía salir con nueve widgets
> legibles colgados de un arco plano, contado-no-descubierto y con los fallos apilados: **el mismo fallo, un
> piso más arriba.**

Hallazgos concretos (deduplicados) → **fix aplicado** (todo en `method-failure-book.md` §4b/§4c):
1. Gates sin artefacto (ojos-frescos/panel/rebuild) = "lo hice, pasó" infalsificable → **cada gate deja un
   archivo en `<capítulo>-gates/` + gate de existencia-de-artefacto** (sin archivo = no hecho).
2. Ceguera no operativizada → **recipe del sub-agente ciego** (solo la captura + premisa genérica; nunca la
   lección/héroe; devuelve el «héroe» y debe coincidir con el spec).
3. Ojos-frescos de NARRATIVA sin secuenciar → **paso numerado** (tras el mirror, ANTES de widgets), con
   artefacto + la **pregunta de construcción** («¿lo construí o me lo dieron?») → cierra el arco (§2) y el
   coste de construcción (RC-3), las dos causas que seguían auto-evaluadas.
4. "Rigor proporcional" como agujero (el builder elige qué es "héroe" para esquivar el panel) → **los 2-3
   héroes se DECLARAN en el blueprint de antemano**; los simples igual pasan el ojos-frescos barato.
5. Contradicciones sin árbitro → **árbitros** (maximizar-widgets vs una-idea-un-widget; suelo vs techo;
   fork-del-kit vs no-copiar-bigram).
6. Sin escalera maestra (dos numeraciones solapadas) + faltaban integración, regresión y definition-of-done
   del capítulo → **una sola escalera maestra (§4c)** que anida el bucle por-widget y añade esos pasos.

**Veredicto:** ANTES de este fix, el método **habría vuelto a fallar** (gates sin dientes = jugables, y la
narrativa sin gate real). CON el fix (artefactos obligatorios + ojos-frescos de narrativa secuenciado +
héroes declarados + escalera maestra), el modo de fallo conocido queda cerrado. Riesgo residual honesto: los
conteos de n alto más allá de la validación n=2 dependen de honestidad (mitigar validando contra `ngramData`).
