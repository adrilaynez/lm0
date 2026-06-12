# N-gram · v7 — 3ª review del usuario (en vivo, 2026-06-10)

> **ESTADO: las 10 tareas ejecutadas** (2026-06-10, pasada nocturna). Detalle de lo hecho por widget en
> `ngram-changelog.md` → entrada v7. Añadidos en vivo a la tarea 1: filas del panel curioseables (hover) y
> click → la fila se abre debajo con el detalle completo de la tabla final (verificado: «ar» 2.237, «e» 473).

> Apuntes LITERALES de la review del usuario sobre los widgets del capítulo, capturados por tandas.
> **Aún sin resolver** — este documento es la lista de trabajo; se completará con las siguientes tandas
> antes de tocar código. (Contexto: RowSummer acababa de ser reconstruido en esta sesión — scan del libro
> + cascada + explorador 27×27 — y es la referencia de estilo que el usuario llama "como el de la ss1".)

---

## Tanda 1

### 1 · RowSummer (§2.2 · `ng-rowsummer`) — "mucho mucho MEJOR, casi lo que quería por fin"

Lo que pidió:
- **El inicio debe verse mejor.** "Que pudieras mirar esa tabla de la a, pulsar y ver" — el estado
  inicial/arranque de la familia «a» tiene que invitar: ver la tabla de la «a», pulsar, y verla hacerse.
- **Más progresivo.** "Que se llene poco a poco y luego te ponga 'leyéndola entera' y que vaya más rápido
  **pero no tan rápido**, al menos con la primera, la «a»" — el ritmo: llenado lento al principio,
  la fase "el resto del libro" más rápida pero todavía legible para la familia «a» (hoy el surge es
  demasiado brusco).
- **La tabla final "ESTÁ GENIAL GENIAL"** (el mapa 27×27 explorable se queda). Añadir:
  **"PON QUE CADA CUADRADITO ES UNA FILA Y EXPLÍCALO UN POCO"** — hacer explícito en el propio widget
  que cada celda = una fila de la tabla, con una pizca más de explicación (hoy hay un caption de una
  línea; quiere que esa idea se entienda mejor).

### 2 · CountingPairs (§2.1 · `ng-counting`) — la tabla que se crea, mucho mejor

- "La tabla que se crea, que esa **mucho mejor**" — el render de la tabla de parejas (filas `th→`,
  `he→`… con sus celdas) hay que elevarlo claramente.
- "Y la experiencia, **que se entienda mejor cómo se lee**" — guiar la lectura de la tabla:
  fila = pareja (clave de 2 letras), columna = letra siguiente, celda = cuenta. Hoy no se entiende
  bien cómo leerla mientras se construye.

### 3 · SplitTheRow (§2.2.5 · `ng-split`) — la superposición difuminada es regular

- "La superposición está bien **pero es un poco regular así difuminado**, haz que se vea mejor" —
  el momento en que el bloque de la «t» se superpone con la tabla del bigrama (hoy: dos capas
  difuminadas con los labels mezclados e ilegibles, "bigrama/BLOQUE DE LA T/TABLA COMPLETA" pisándose).
  La idea (mismo tamaño 27×27 = un bigrama entero) se queda; la ejecución visual del solape hay que
  rehacerla para que se vea NÍTIDA.

### 4 · GrowingTable (§2.3 · `ng-grow`) — que se VEA crecer de verdad

- "Que se vea **más estilo tabla como el de la ss1**" — el estilo del RowSummer nuevo (filas reales con
  heat-strips / el mapa de celdas) es la referencia; hoy GrowingTable es un panel borroso con un badge.
- "Que se vea el crecimiento de otra forma **mucho más visual**, que se vea que **de verdad crece**" —
  el salto 729 → ×27 → 19.683 hoy es un número que cambia; tiene que ser una imagen que crece de verdad
  delante de ti (magnitud mostrada, no numerada).
- "Quizás poner **N=2 como ejemplo** y luego N=3" — arrancar desde el N=2 (729, lo que el lector acaba
  de construir en RowSummer) y verlo multiplicarse a N=3 (19.683), no empezar ya en N=3 abstracto.
- "Y **que se vea más**" — el héroe más grande/dominante.

### 5 · WriteFromMatrix (§3.1 · `ng-write`) — la lógica es justo lo que quiere; el cómo-se-ve no

- "La lógica es genial, justo lo que quiero" — bucle localiza-fila → lee % → tira dado → escribe. Se queda.
- "Lo que no me mola es **cómo se ve**" — rehacer la presentación:
  - "**Que se viera cómo se coge de la matriz grande, de la ss1**" — conectar visualmente con LA tabla
    (el mapa/tabla estilo RowSummer): ver cómo se BUSCA la fila en el trigrama real (hoy el minimapa es
    una columnita abstracta con un slider, no parece la tabla que construiste).
  - "Cómo se busca en el trigrama ahí y **cómo va lanzando el dado** y tal" — el viaje completo
    tabla→fila→dado→letra visible como un recorrido sobre la matriz real.
  - "**Que se vea mejor la matriz** y eso" — la matriz tiene que verse como tal (estilo ss1), no como
    un scrollbar decorativo.

---

## Tanda 2

### 6 · ExplosionZoom (§4.1 · `ng-zoom`) — el crecimiento no se siente; sobran pasos

- Primer estado (bigrama, 27): "está bien, **bueno el marco está mal**, pero la idea bien" — revisar el
  marco/borde del primer estado (el cuadro amarillo grueso alrededor de la tabla).
- "**HAY MIL [pasos], no tiene sentido, no hace falta pasar por tantos**" — hoy son ~18 clics (+1 letra
  cada vez hasta el 20-grama); recortar la escalera a saltos significativos.
- "Hay un momento en el que **no parece que crece**" — al hacerse densa, la rejilla satura y cada paso se
  ve igual (la imagen idéntica para 10²⁰ y 10²⁷ = el fail de escala del method-book).
- Cómo: "crear esa sensación mostrando **en pequeño lo grande que es la tabla**, tipo 'estás viendo solo
  esto', **o cuánto porcentaje ves**, o algo así — pero mejorarla mucho" — un lente/indicador honesto de
  "lo que ves vs el total" que CAMBIE con cada salto.

### 7 · WordsExplosion (§5 · `ng-words`) — "VISUALIZADOR horrible"

- "Piensa cómo mostrar mejor esta idea, **más visual y mejor estéticamente**" — la comparación
  letras (19.683) vs palabras (125 billones) como dos barras no funciona. Rediseño completo del visual
  (la idea letras-vs-palabras se queda).

### 8 · EmptyVoid (§4.2 · `ng-void`) — spec directa del usuario

- Base: mezcla de EmptyMatrix + BookFirehose, "mucho mejorado"; rejilla 99 % gris.
- **Que NO sea automático**: poder **pulsar la tabla** y ver que está vacía + contador de "cuántas vacías
  has abierto" (como EmptyMatrix — **cópialo**).
- **Dos botones**: "Llenar" a saltos (1→2→5→10→100→1.000→1M→…→Internet) + un auto ("mira por ti").
- **Llenado más lento al inicio** · **tabla menos patrón** (que no se vea una textura regular).
- "Y mejorarlo mucho — la idea no está mal, es lo que quiero expresar, pero hacerlo MUCHO MUCHO mejor."

### 9 · QuantumElephant (§4.3 · `ng-elephant`) — estética floja

- "HACERLO mucho mejor estéticamente, **la idea está bien** pero estéticamente flojea mucho" — mantener
  el mecanismo (frase nunca vista → fila vacía → dado uniforme → basura); rehacer la presentación
  (la frase + hluirthar, el panel del porqué con los pasos 1-2-3, los bares uniformes).

### 10 · BigModelLimit (§5.1 · `ng-limit`) — explicar mejor el lado «gato»

- Estado actual: tabla 19.683 filas · «el perro duerme» visto muchas veces · «el gato duerme» nunca;
  fila vacía n.º 1284; duerme/ladra/corre/come 0 %; "no escribe «el gato ____» · sin datos · 0 %";
  «12.339 filas de distancia · sin puente»; el loro que recita «el perro» y jamás deduce «el gato».
- "**Mostrar qué pasa con gato**, porque explicarlo mejor y hacerlo más entendible" — el momento clave
  (la fila de «el gato» está VACÍA aunque la de «el perro» rebosa, y no hay puente entre filas vecinas)
  tiene que verse y entenderse, no solo leerse.

---

## Orden de ejecución (instrucción del usuario)

"Analiza cada una y ponte a hacer **una a una, lentamente**, sin fijarte en la siguiente, solo en la
actual, y **no avances hasta que esté perfecta**." → 1 RowSummer → 2 CountingPairs → 3 SplitTheRow →
4 GrowingTable → 5 WriteFromMatrix → 6 ExplosionZoom → 7 WordsExplosion → 8 EmptyVoid →
9 QuantumElephant → 10 BigModelLimit.
