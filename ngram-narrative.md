# N-gram — narrativa COMPLETA (mirror vivo, generado · NO editar a mano)

> Generado por `gen-ngram-prose.mjs` desde `NgramNarrative.tsx` (orden) + `es.ts` (texto).
> Léelo de corrido ANTES de tocar copy: busca duplicación, puentes flojos, arco. Regenéralo tras cada cambio.

- **hero.eyebrow** · Capítulo 2 · La era del conteo
- **hero.title** · Una ventana más
- **hero.titleAccent** · ancha
- **hero.subtitle** · El bigrama solo recordaba la última letra que escribías. Vamos a darle algo más de memoria.
- **hero.readTime** · 12 min · sigue contando

### ngram-01


### ngram-01

- **s1.recap1** · El bigrama se quedó a medias. Escribía bien, letra a letra, pero tenía la memoria de un pez: en cuanto ponía una letra se olvidaba de todo lo de antes y solo le quedaba esa, la última, para decidir la siguiente. Por eso «th», «sh» y «wh» le daban igual. Las tres acaban en h, y ahí se le acababa la historia.
- **s1.recap2** · Tú no lees así. Cuando llevas escrito «th» no arrancas de cero, todavía tienes la t metida en la cabeza, y el trozo de palabra entero, y por eso hueles lo que viene aunque nadie te enseñara la regla. Eso que arrastras tiene nombre, y lo vas a reconocer en cuanto lo veas: el contexto.
- **s1.ask** · Así que la pregunta se cae sola. ¿Y si le dejamos mirar más de una letra atrás?
  ▶▶ [VIS: ContextWindow]
- **s1.payoff1** · Con una sola letra de pista ibas a ciegas, y lo sabías. Con cuatro casi cantabas la respuesta antes de que apareciera. Lo único que cambió fue cuánto le dejaste recordar.
- **s1.payoff2** · Y resulta que eso tiene nombres, uno por cada tamaño de memoria. Mirar dos letras atrás ya tiene nombre: trigrama. Tres, 4-grama. Y así hacia arriba, hasta el n-grama, que mira n. Lo bonito es lo que significa hacia atrás: el bigrama nunca fue un modelo aparte, era el más pequeño de la familia, un n-grama con n igual a dos.
- **s1.pull** · El bigrama no era un modelo aparte. Era un n-grama diminuto.
- **s1.bridge** · Vale, mirar atrás ayuda. ¿Pero cómo aprende a hacer eso una máquina, si lo único que sabe hacer es contar?

──────────


### ngram-02


### ngram-02

- **s2.lead1** · Lo mejor es que no hay truco nuevo. Es el mismo de siempre, contar, y solo cambia una cosa de nada.
- **s2.lead2** · Antes la máquina guardaba una fila por cada letra, la lista de lo que suele venir después de la t. Ahora guarda una fila por cada pareja: lo que viene después de t-h, que no es lo mismo que lo que viene después de una h suelta cualquiera. La llave del cajón es más larga, eso es todo. Pero una llave más larga abre un cajón más concreto.
  ▶▶ [VIS: ContextCounter]
- **s2.payoff** · La fila de la t apostaba por la h, sí, pero con la boca pequeña: ganaba y aun así quedaba vida repartida por media docena de casillas más. La fila de t-h no tiene esas dudas. Después de «th», la «e» se lo come casi todo y al resto le deja las migajas.
- **s2.bridge** · Si cada letra extra afila tanto la apuesta, la pregunta es inevitable: ¿qué sale si la dejamos escribir de verdad, párrafos enteros, recordando dos letras, o tres, o cuatro?

──────────


### ngram-03


### ngram-03

- **s3.stage** · Lo justo es verlo en marcha. Cuatro máquinas idénticas salvo en una cosa: a cada una le dejamos recordar una letra más que a la de su izquierda. Misma semilla para todas, y a escribir.
  ▶▶ [VIS: NgramBattle]
- **s3.triumph1** · La de la izquierda escupe sopa de letras y la de la derecha casi hila frases, y entre una y otra no hay ni un solo truco nuevo, solo tres letras más de memoria. Acabas de hacer que una máquina escriba mejor sin enseñarle una palabra, ni una regla, ni nada. Solo le diste un poco de pasado.
- **s3.triumph2** · Y ahí salta la tentación. Si cuatro va mejor que uno, ¿por qué parar? ¿Por qué no diez letras de memoria? ¿Por qué no cien?

──────────


### ngram-04


### ngram-04

- **s4.lead1** · Aquí es donde la idea, que venía tan bien, se estampa contra un muro que no es de ingenio sino de aritmética pura.
- **s4.lead2** · La tabla del bigrama tenía una fila por letra. Veintisiete filas, algo que cabe en una hoja. El trigrama ya necesita una fila por cada pareja posible de letras, veintisiete por veintisiete: setecientas veintinueve. El 4-grama, una por cada trío: casi veinte mil. Cada letra de memoria que le sumas no añade unas pocas filas, multiplica la tabla entera por veintisiete.
  ▶▶ [VIS: ContextExplosion]
- **s4.after** · Diez letras de memoria no son diez veces más tabla. Son billones de filas.
- **s4.wordsTitle** · ¿y con palabras?
- **s4.words** · Y todo esto contando solo letras, que son veintisiete. Si la máquina fuera con palabras enteras, el abecedario pasaría a tener decenas de miles de piezas, y estos números de ahora parecerían de juguete.
- **s4.bridge** · Pero una tabla gigante, por gigante que sea, se puede guardar en algún disco. El problema de verdad es otro, y es bastante peor.

──────────


### ngram-05


### ngram-05

- **s5.lead1** · Una tabla de veinte mil filas no vale nada si está vacía.
- **s5.lead2** · Para rellenar la fila de t-h-e hace falta haber visto antes «the» en algún sitio, y eso pasa a cada paso, así que esa fila se llena sola. Pero la tabla guarda también un hueco para «zxq», y otro para «qjp», y para miles de combinaciones que no escribe nadie nunca. Ahí están, reservadas, esperando una visita que no llega.
- **s5.lead3** · Y cuanto más larga haces la memoria, más se llena la tabla de filas rarísimas que jamás vas a ver. Crece y se vacía a la vez.
  ▶▶ [VIS: SparsityView]
- **s5.afterSparsity** · Casi todo negro. Y esos huecos no son un fallo del dibujo, son combinaciones que no se usan jamás.
- **s5.moreDataAsk** · Llegados aquí casi todo el mundo piensa lo mismo: vale, pues le doy más texto. Más libros, más datos, lo que haga falta hasta llenarla.
  ▶▶ [VIS: InfiniteTable]
- **s5.afterInfinite** · No hay manera. Por mucho texto que le metas, las ventanas grandes siguen casi vacías, porque hay más combinaciones posibles que segundos lleva existiendo el universo. No es que falte esfuerzo. Es que no cabe.
- **s5.bridge** · Y aun así, lo peor no es la tabla vacía. Es lo que la máquina hace al toparse con una casilla en blanco.

──────────


### ngram-06


### ngram-06

- **s6.lead** · Le das un contexto que ha visto mil veces y contesta sin pestañear, segurísima. Le cambias una sola letra, una, por algo que no vio nunca, y se queda en blanco. En blanco de verdad, sin media palabra que ofrecer.
  ▶▶ [VIS: UnseenContext]
- **s6.after** · Y lo absurdo es que esos dos contextos se parecen como dos gotas de agua. Tú contestarías lo mismo a los dos sin pensarlo, porque para ti se parecen. Para la máquina no se parecen en nada: o vio esa fila clavada, letra por letra, o no la vio, y entre esas dos opciones no hay término medio.
- **s6.typoBridge** · Y no hace falta rebuscar palabras raras. Un dedo torpe sobra.
  ▶▶ [VIS: TypoBreaker]
- **s6.diagnosis** · El bigrama predecía sin entender una palabra de lo que hacía. Su versión grande, el n-grama, predice bastante mejor, pero entender, lo que se dice entender, sigue sin entender nada. La diferencia es que ahora lo disimula. Hasta que le cambias una letra.
- **s6.takeaway** · El n-grama no aprende reglas, memoriza trozos. Y lo que no memorizó no existe para él.
- **s6.bridge** · El fallo tiene una raíz concreta, y ponerle nombre es ya medio camino hacia el capítulo siguiente.

──────────


### ngram-07


### ngram-07

- **s7.lead** · Para la máquina, «gato» y «perro» no tienen nada que ver el uno con el otro. Son dos filas distintas de la tabla, dos etiquetas, dos números sin más, y dos números distintos se parecen entre sí lo mismo que dos teléfonos cualesquiera: nada.
  ▶▶ [VIS: SimilarityBridge]
- **s7.after1** · Si la máquina supiera que «gato» y «perro» van juntos, lo que aprende de uno le serviría para el otro de regalo, y no necesitaría haber visto cada contexto del mundo, solo unos cuantos parecidos. Dejaría de memorizar de carrerilla y empezaría a entender de verdad.
- **s7.after2** · Eso ya no se consigue contando. Hace falta otra cosa, y esa otra cosa es el capítulo que viene.
▸ (plegable · Historia)
- **history.kicker** · Historia · opcional
- **history.title** · Cuando contar gobernaba el mundo

──────────

- **cta.quote** · Contar nos trajo hasta aquí. Para cruzar el muro hay que dejar de contar.
- **cta.hook** · Hace falta una idea nueva: que las cosas que se parecen se traten parecido. De eso van las redes neuronales.
- **cta.button** · Las redes neuronales
- **cta.buttonDesc** · El salto de memorizar a entender.
- **footer.text** · Capítulo 2 de la era del conteo. Lo has construido tú, solo contando.
- **footer.brand** · LM-Lab
