# Bigram — Biblia de movimiento

> El contrato de cohesión del capítulo. Todos los widgets (showpieces y pasos tranquilos) hablan esta
> misma lengua de movimiento, color y temperatura, para que el capítulo se sienta **una película**, no
> 16 demos. Si un widget se inventa su propio easing, su propio amarillo o su propio "tick", rompe el
> hechizo. Cohesión = pilares C1-C5 de la doctrina (`narrative-guidelines.md`).

Todo es **token-only** (`--bigram-*`, scope `[data-bigram-theme]`, claro + oscuro). Cero colores
literales. Todo **reduced-motion-safe**: cada animación tiene un estado final estático equivalente.

---

## 1 · Easings y duraciones (canónicos — no inventes otros)

```ts
const STD   = [0.2, 0.8, 0.2, 1] as const; // entradas, reveals, fades (el de toda la casa)
const SPRING_SNAP = { type: "spring", stiffness: 380, damping: 32 }; // FLIP, piezas que aterrizan
const SPRING_SOFT = { type: "spring", stiffness: 180, damping: 26 }; // flotar, recolocar suave
```
- **Reveal / fade-in:** `STD`, 0.42–0.6s. Entradas de texto y paneles.
- **Entrada en cascada (filas/celdas):** `STD`, stagger 28–60ms; nunca todas a la vez.
- **Snap a su sitio (FLIP, drop del dado, columna que nace):** `SPRING_SNAP`.
- **Micro-pop al cambiar un número:** `scale: [1, 1.3, 1]`, 0.42s, `STD`.
- **Escaneo que acelera:** usa `scanDelay(i, total)` de `bigramCorpus.ts` (lento al principio para
  saborear, borroso al final). No hagas tu propia curva.

Regla de oro: el motion **explica** (una transición, una causa→efecto), nunca decora. Si no aclara una
idea, fuera.

---

## 2 · Idiom de ESCANEO / lectura (VIS 3, 4, 9, 11)

Cuando la máquina "lee" texto carácter a carácter, siempre se ve igual:
- **Carácter activo (el cursor):** fondo `--bigram-accent`, tinta `--bigram-on-accent`. Es el foco.
- **El seguidor que se cuenta:** fondo `--bigram-accent-soft`, tinta `--bigram-accent-ink`.
- **Ya leído (pasado):** tinta `--bigram-dim`, se hunde. No compite.
- **Por leer (futuro):** tinta `--bigram-muted`.
- El cursor avanza con `scanDelay`; al hacer un "hit" (encuentra el par que cuenta), un pop suave en el
  contador correspondiente. Mono `--bigram-font-mono` para el texto escaneado.

---

## 3 · Idiom de CONTEO (count-tick)

Cualquier número que sube usa el mismo odómetro:
- rAF con easeOutCubic, `setState` solo dentro del rAF, **acotado** (`if (k<1) raf=requestAnimationFrame`),
  cleanup en unmount. (Patrón ya existente en `CharsetGrowthMatrix`/`ShakespeareRowCounter` — reúsalo.)
- Al cerrar el tick: pop `scale:[1,1.3,1]`.
- Mono tabular para los dígitos (`font-variant-numeric: tabular-nums`) para que no "bailen".
- **Nunca saltes** de un número a otro: el valor *trepa*.

---

## 4 · Idiom de CALOR (heatmap — VIS 8, 9, 10)

Una sola rampa de calor en todo el capítulo:
- Vacío (prob 0) → fondo `--bigram-bg` (cremita en claro, profundo en oscuro). Es el "negro" del detective.
- Caliente (prob alta) → `--bigram-accent-bright`. Interpola con `alpha = pow(p, 0.5)` (raíz, para que lo
  raro se vea sin lavar lo fuerte). Misma fórmula que la matriz buena original.
- Celda que se calienta en vivo: transición CSS `background .3s ease` — el calor **llega**, no salta.
- Etiquetas de eje: mayúscula `--bigram-accent-ink`, minúscula `--bigram-ink-2`, otros `--bigram-dim`
  (el case-coding hace legible el "desierto de mayúsculas").

---

## 5 · Temperatura: paso tranquilo vs SHOWPIECE (V1 de la doctrina)

**Paso tranquilo** (la mayoría: VIS 1.5, 2, 5, 6, 7, 8): sin titular grande, auto-caption discreto, **un
solo** foco, motion solo cuando el lector interactúa, como mucho UN momento fuerte. No grita. No tiene
panel "verdict" que corte el flujo (la conclusión la da el texto narrativo de al lado).

**Showpiece** (VIS 4, 9, 10, 11): se gana un **PLAY**, un arco multi-fase con clímax y un payoff
nombrado, motion **sostenido** (no solo on-interaction). Es el pico de la montaña rusa. Llega tras un
paso tranquilo y entrega a otro paso tranquilo (curva de temperatura C3).

Decide la temperatura **antes** de construir. Un paso tranquilo con motion de showpiece cansa; un
showpiece con frialdad de paso tranquilo decepciona.

---

## 6 · Color (semántica por token — nunca literal)

| Rol | Token |
|---|---|
| Interactivo / caliente / foco | `--bigram-accent`, `--bigram-accent-bright` |
| Fondo suave de acento (zonas, badges) | `--bigram-accent-soft` |
| Tinta sobre acento sólido | `--bigram-on-accent` |
| Voz "verdict"/confirmación (sage) | `--bigram-sage`, `--bigram-sage-soft` |
| Fracaso / celda que nunca pasa / bucle robótico | `--bigram-wrong`, `--bigram-wrong-soft` |
| Texto principal / secundario / tenue | `--bigram-ink`, `--bigram-ink-2`, `--bigram-dim` |
| Superficies hundidas / rules | `--bigram-bg-2`, `--bigram-surface`, `--bigram-rule(-2)` |
| Display / serif / mono | `--bigram-font-display` / `-serif` / `-mono` |

Canvas no lee CSS vars: léelas una vez con `getComputedStyle(el).getPropertyValue("--bigram-accent")`
a un ref y re-léelas al cambiar `data-bigram-theme` (MutationObserver sobre el atributo).

---

## 7 · Contrato reduced-motion

`useReducedMotion()` en todos. Si está activo:
- Showpieces saltan directo al **estado final** (tabla llena / matriz completa / texto generado) + su
  caption. Sin escaneo, sin FLIP, sin spins.
- Pasos tranquilos: las entradas son fades instantáneos; los counts aparecen ya en su valor.
- Nada de pérdida de información: el estado final estático enseña lo mismo que la animación.

---

## 8 · Continuidad (C2/C4 — el hilo)

- Un único hilo: la letra **t** → Shakespeare → la matriz → la generación. El mismo dato se arrastra de
  un widget al siguiente (la fila de la `t` que cuenta VIS 4 es la misma que normaliza VIS 5).
- Transiciones entre widgets = una pregunta "¿y si?" del lector que el siguiente responde. El widget no
  se presenta solo; contesta lo que el anterior dejó abierto.
- `displayChar(" ")` → `␣` en TODOS los widgets. El espacio siempre se ve igual.

---

## 9 · Estándar de construcción de un visualizador (las normas que faltaban)

> Por qué los primeros showpieces no daban la talla: se pidió **mecánica y motion** en vez de **la idea
> y la imagen final**; se delegó el **diseño** (qué es el visual) al que construye; no había barra de
> **legibilidad**, de **ritmo** ni **verificación en navegador**; y se premió "ambicioso / 300+ líneas"
> (más código = más motion de relleno). Resultado: espectáculo en vez de comprensión. Esto lo corrige.

Antes de escribir una sola línea de un visualizador, define **en este orden**:

1. **La IDEA en una frase + la IMAGEN FINAL** que el lector se lleva, descrita en palabras ("una fila
   de 27 celdas, número y color, la h la más brillante"). Si no puedes describir la imagen final, el
   spec no está listo. La imagen final manda; el motion es secundario.
2. **El visual EXACTO** (qué forma tiene), no la coreografía. **El diseño lo decides tú / el spec, no
   el que construye.** Nada de "sé ambicioso": la barra es **lo más simple que enseñe la idea con
   belleza**, no lo más elaborado.
3. **Legibilidad y uso (OBLIGATORIO).** Todo se LEE de un vistazo; los datos se pueden inspeccionar;
   tamaño suficiente; contraste real en el tema objetivo (**míralo**, no lo supongas); si es una matriz
   densa, se puede ampliar / leer una celda. Un número que no se lee no cuenta.
4. **Ritmo (OBLIGATORIO).** Rápido, sin tiempos muertos. Indica el tiempo objetivo ("el barrido entero
   en ~2 s", "los números llegan a miles en pocos segundos"). Si tarda 30 s en llegar a 30, está roto.
5. **Continuidad.** Reutiliza los idioms compartidos (rampa de calor, celda, escaneo, count-tick). Una
   *fila* debe parecer una *fila de la matriz*. Si dos widgets enseñan lo mismo con aspecto distinto,
   uno está mal.
6. **Simplicidad > ambición.** Menos motion, menos cromo, menos líneas. Motion solo donde **aclara**.
   Borrar hasta que duela.
7. **Datos reales y honestos.** Los números que suben son verdaderos (corpus real). Nada interpolado
   que finja contar.
8. **Verificación en navegador, por mí, antes de darlo por bueno.** Renderizar en `/lab/bigram`, **tema
   objetivo**, y juzgar: ¿se entiende la idea en 5 s? ¿se lee TODO? ¿es rápido? ¿parece de la misma
   familia que sus vecinos? El que construye **no puede mirar**; yo sí, y es **obligatorio** — `tsc`
   verde no es "hecho".

**Checklist de aceptación** (yo, en navegador): idea-en-5s ✓ · todo legible ✓ · rápido/sin tiempos
muertos ✓ · misma familia visual ✓ · datos reales ✓ · ambos temas ✓ · reduced-motion aterriza en el
estado final ✓.
