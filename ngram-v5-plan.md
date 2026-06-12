# n-gram v5 — corrección de §1/§2/§3 + blindaje del método (review CIEGO)

> Tras la 2ª review del usuario (audio). v4 mejoró narrativa+escala+sparsity, pero §1 repite el final de
> bigram, §2 NO se entiende (la construcción es instantánea y abstracta) y §3 insta-escribe. Y el fallo de
> método sigue: **reviso los widgets PRECONDICIONADO por el texto de intro → parecen mejores de lo que son.**
> Plan antes de tocar (pedido explícito). Acento ámbar. Rama `redesign/ngram-amber-v1`. Sin commits hasta que
> el usuario lo pida.

## Coordinación (otro chat activo)
El otro chat ya **commiteó** (mi v4 está a salvo en commits) y ahora hace **next-intl + URLs `/es/` +
`app/[locale]/` + split i18n + scaffold projects + comentarios de intención**. Su zona: `src/i18n/**`,
`src/app/[locale]/**`, `next.config.mjs`, `@/i18n/navigation`, `content/projects/**`, bigram/nn/mlp MDX.
**MI zona (segura):** `src/features/lab/components/ngram/**` + la PROSA de `src/content/lab/ngram.{es,en}.mdx`
(preservando los comentarios `{/* … */}` de intención que ya añadieron). **No toco** i18n/app/next.config/
navigation/projects/bigram. Bench en `/lab/bench` (inglés sin prefijo).

---

## EL FALLO DE MÉTODO (lo más importante — que no vuelva a pasar)
El usuario lo clavó: *«como se pone el texto introductorio del visualizador de cómo funciona, tú ya te
preconcibes cómo funciona; el visualizador parece mejor de lo que es y luego no cumple su función. ¿Cómo
pasan bien los filtros de control?»*

- **Causa:** cuando reviso (o el agente ciego revisa) un widget, leo/conozco la prosa y el caption de
  intención → relleno los huecos con mi cabeza → el widget «se entiende»… pero solo porque YO ya sé qué
  enseña. En la página real, el lector que sí entiende es porque lo entiende por **el TEXTO**, no por el
  widget → el widget no cumple su función (mostrar > contar) y aun así pasa el filtro.
- **Fix (review CIEGO de verdad):** juzgar cada widget con **CERO** contexto — sin la narrativa, sin el
  caption del `<Figure label>`, sin el comentario de intención, sin saber en qué sección va. Solo la captura
  del widget aislado (`/lab/bench?w=…&bare=1`). Preguntas: «¿qué enseña esto? ¿cuál es la idea/el número
  héroe? ¿lo pillo en 5s SIN que nadie me diga nada?». **Si necesita la prosa de alrededor para entenderse →
  FALLA** (porque el lector lo «pillará» por el texto, no por el widget = show-don't-tell roto).
- **Doble llave:** el `label` del `<Figure>` y el comentario de intención **no** son parte del widget — son
  ayudas externas. El gate los IGNORA. El widget se sostiene solo o no se shipea.
- Va a `method-failure-book.md §9`.

---

## §1 · Mirar más atrás — DEMASIADO LARGA y repite bigram
- **Problema:** «solo le queda la última letra» (AmnesiaReplay) es literalmente el final de bigram
  (ContextBlindnessDemo). La sección entera re-deriva algo ya visto. Larga.
- **Fix:** TENSARLA. (a) recap BREVE del problema del bigram (recalcar, 1–2 frases, no re-demostrarlo entero);
  (b) **mostrar el destino / crear expectación** — «mira lo que vas a poder construir» (un teaser del modelo
  bueno escribiendo casi-frases) para enganchar; (c) WidenWindow se queda (es necesario: más memoria afila).
  AmnesiaReplay → callback rápido o se recorta; nada de re-explicar la ceguera del bigram a fondo.

## §2 · Construirla tú — NO SE ENTIENDE + construcción instantánea (el fallo gordo)
- «¿Cómo lo harías tú?» (prosa): bien.
- **SplitTheRow:** la fila de la «h» con coloritos no se lee. **Poner NÚMEROS + etiquetas de letra (a,b,c…)**
  para que se vea que es una FILA indexada por letra; que se pueda tocar/hover. Centrarse en la «h» y mostrar
  que la letra **de antes** puede ser a/espacio/b… → **27 parejas**. «esto es solo para la h.»
- **El salto a 729 no se entiende.** Reconstruir como **CONSTRUCCIÓN GRADUAL** (como bigram, poco a poco):
  hecho para la «h» (27 filas) → «ahora lo mismo para la a» → b → c… → se van **agrupando submatrices** hasta
  **729 = trigrama**. Que se SIENTA construir, no instantáneo. Opción: ver la matriz grande (729×27 ≈ 19.683).
- **QUITAR el mensaje de falso éxito** «la has construido sin que nadie te dijera cómo se llamaba» — el lector
  no ha construido nada (4 palabras, un clic). No se gana esa celebración. (En bigram se gana porque se
  construye todo el episodio.) La celebración real es §3 (ver escribir).
- **RowSharpens:** el usuario lo ve **repetición** (ya se vio que la pareja afila en §1/Split). **Cortar** del
  flujo (o fundir). El hover «investigar parejas» ya vive en SplitTheRow.
- **GrowingTable → CONSTRUCCIÓN del 4-grama:** no «la tabla crece» sino «construimos el 4-grama: lo mismo,
  pero cada una de las 729 ×27». Gradual, mismo gesto. (Terminología: «submatrices», no «pilas».)

## §3 · Lo que has construido
- Concepto «escribir = leer un número»: gusta.
- **WriteFromMatrix:** ahora **insta-escribe** (le das y aparece). Rehacer **paso a paso sobre la matriz
  GIGANTE**: enseña la matriz enorme → **busca/selecciona la fila** del contexto → **zoom** a esa fila →
  conviértela en **porcentajes** → **tira el dado** → escribe la letra → desliza la ventana → repite.
  (Exactamente el flujo de bigram `LetterByLetter`, pero con el LOOKUP en la matriz grande como héroe.)
- **LookWhatYouBuilt:** la columna de 1 letra sale con glifos «raros/mal escritos» (rotados, borrosos).
  **Quitar ese efecto** — texto normal (con 1 letra ya sale mal solo, no hace falta el truco visual).

## §4–§6 · «más o menos bien» → review CIEGO de todos
- Pasar el gate ciego (arriba) a TODOS los widgets (zoom, words, firehose, mute, empty, progress, limit) y a
  los §2/§3 rehechos. Lo que no se sostenga solo → rehacer. (El usuario: «algo está mal en cómo se conciben».)

---

## Orden de ejecución (autónomo, sin parar)
1. ✅ Este plan + `method-failure-book §9` (review ciego).
2. **§2 (lo gordo):** SplitTheRow v2 (números+letras, 27 parejas claras) → construcción gradual (h→a→b…→729)
   → GrowingTable v2 (construir 4-grama, ×27) → quitar falsa celebración → cortar RowSharpens del flujo.
3. **§3:** WriteFromMatrix paso-a-paso sobre matriz gigante; LookWhatYouBuilt sin glifos raros.
4. **§1:** tensar + teaser de expectación.
5. **Gate ciego** de todos los widgets (captura aislada, juzgar sin contexto, duro). Rehacer lo que falle.
6. tsc + eslint 0. Actualizar narrativa MDX (ES+EN, preservando comentarios de intención). Changelog. Sin commits.
