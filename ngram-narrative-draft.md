# n-gram — borrador del cuento (Fase 2) · v3 (≈13 visualizadores) · NO es i18n todavía

Arquitectura "La fila" (`ngram-vision.md`). Voz cómplice, humor seco, descubrir-no-anunciar, sin jerga ni
mates, celebrar antes del muro, **un solo muro**, bookend. `[VIS: X]` = visualizador. **v3:** expandido a ~13
visualizadores focales (el usuario pidió MÁS); §4 en tono de ASOMBRO (3 widgets de *wonder*, no de fallo); §5
es el único muro; la pega de v1 (~7) → 1. Pasó la lectura ciega en v2; re-leer con la versión rica.

---

## Hero
- **eyebrow:** Capítulo 2 · La era del conteo
- **title:** Una memoria más larga
- **subtitle:** La máquina anterior solo recordaba la última letra que escribías. Vamos a darle más memoria. Se nos va a ir de las manos.

## §1 · Mirar más atrás

La máquina del capítulo anterior escribía sola, letra a letra, leyendo una tabla de cuentas. Tenía un punto
flaco: memoria de pez. En cuanto ponía una letra se olvidaba de lo demás, le quedaba esa, la última, y a
partir de ahí adivinaba.

Antes de arreglarlo, vale la pena verla fallar en cámara lenta.

`[VIS: AmnesiaReplay]` — *escribes y la máquina completa, segura y mal: «th», «sh» y «wh» la llevan al mismo
sitio porque las tres acaban en h. Tú ves de dónde viene cada una; ella no.*

Tú no lees así. Cuando llevas escrito «th», la t sigue en tu cabeza, y por eso hueles lo que viene. Para ella
«th», «sh» y «wh» son lo mismo: las tres acaban en h, y ahí se le acaba el mundo. Con una sola letra de
memoria, hay palabras que es imposible acertar, por mucho que se esfuerce.

Así que la pregunta cae sola: ¿y si la dejamos mirar más de una letra atrás?

`[VIS: WidenWindow]` — *una palabra difícil aparece letra a letra; apuestas la siguiente antes de verla; un
mando desliza cuánta memoria le das (1→4) y la apuesta pasa de volado a casi segura.*

Con una letra ibas a ciegas y lo notabas. Con tres o cuatro casi cantabas la respuesta antes de que saliera.
No cambió la máquina. Cambió cuánto la dejaste recordar.

Y la máquina de una sola letra, la del capítulo anterior, era solo la versión más pequeña de esto.

*Puente:* mirar atrás ayuda. ¿Pero cómo aprende a hacer eso una máquina que solo sabe contar?

## §2 · Construirla tú

No hay truco nuevo. Es el de siempre, contar, con un cambio de nada: una llave más larga. Antes guardaba una
fila por letra, la lista de lo que suele seguir a la t. Ahora hace falta una fila por cada pareja. Y esto no
te lo voy a contar. Lo vas a hacer tú.

`[VIS: SplitTheRow]` — *coges la fila de la «h» y la partes por la letra de antes: «ah», «th», «sh»… Cada
corte te cuesta un clic y el contador trepa 1 → 27 → 729 mientras lo haces; cada hija sale más afilada que la madre.*

Empezaste con una fila y acabaste con setecientas veintinueve, partiéndolas a mano. Nadie te dijo «esto es un
trigrama». Lo levantaste tú.

Y fíjate en una de esas hijas, la que sigue a «th». La fila de antes apostaba con la boca pequeña; esta no duda.

`[VIS: RowSharpens]` — *eliges una pareja y ves su fila como un cajón ordenado; tras «th» la e se lo lleva
casi todo. Puedes saltar de pareja en pareja y curiosear: «qu» casi siempre lleva a u, «zz» no lleva a casi nada.*

Lo bueno es que esto no se acaba aquí. Subir de nivel es repetir lo mismo: una llave todavía más larga.

`[VIS: GrowingTable]` — *entrenas un trigrama y la tabla aparece; subes a cuatro letras y la MISMA tabla se
hincha a la vista; a cinco, ya no cabe en la pantalla. Tú solo pulsas «otra letra» y la ves crecer.*

*Puente:* si cada nivel afila la apuesta, la pregunta cae sola. ¿Qué sale si la dejamos escribir de verdad?

## §3 · Lo que has construido

Antes de celebrar nada, abramos la tapa y miremos cómo escribe.

`[VIS: WriteFromMatrix]` — *una lente recorre la tabla gigante, se para en la fila de tu contexto, lee un
número, elige una letra, y vuelve a empezar una casilla más a la derecha. Una y otra vez.*

Ahí está, sin truco: busca tu contexto, lee un número, elige, y repite. No piensa. Lee.

Y ahora sí, la parte buena.

`[VIS: LookWhatYouBuilt]` — *cuatro máquinas idénticas salvo en una cosa: a cada una le dejas recordar una
letra más. Misma semilla, y a escribir las cuatro a la vez.*

La de una letra escupe sopa de letras; la de cuatro casi hila frases. Entre una y otra no metiste ni una
regla, ni una palabra de gramática. Solo un poco de pasado. Mira lo que has construido.

*Puente:* y ahí salta la tentación. Si cuatro va mejor que una, ¿por qué parar? ¿Por qué no diez? ¿Por qué no cien?

## §4 · Hasta dónde llega

Subamos, a ver hasta dónde aguanta.

`[VIS: ExplosionZoom]` — *subes la memoria y la tabla se aleja, se aleja, y no aparece el borde; un cartelito
te dice cuántas veces más grande es la tabla entera que lo que cabe en la pantalla: ×100, ×10.000, ×14 millones…*

Aquí pasa algo curioso. Cada letra de memoria que sumas multiplica la tabla por veintisiete, así que te
alejas, y te alejas, y el borde no llega. Es difícil hacerse a la idea de lo grande que se vuelve.

Crece tan rápido que cuesta imaginar de dónde sacarías texto para tanta fila.

`[VIS: BookFirehose]` — *abres el grifo y caen libros enteros, cada vez más rápido, hasta volverse un borrón;
el contador de letras leídas se dispara a millones, a miles de millones. Y aun así la tabla apenas se inmuta:
le cabe muchísimo más.*

Por muchos libros que eches, se los traga sin pestañear. Es así de inmensa.

*Puente:* descomunal. Y entonces la pones a prueba con una palabra cualquiera que aún no habías escrito.

## §5 · El hueco

`[VIS: MuteSlot]` — *escribe algo normal y la máquina apuesta segura. Cámbiale una sola letra, un dedazo, y la
apuesta se desploma a nada: ha caído en una casilla vacía y se queda muda. Asómate a la tabla alrededor de ese
hueco: casi todas las casillas vecinas están igual de vacías.*

Le das algo que ha visto mil veces y contesta segurísima. Le cambias una letra, una sola, y se queda en
blanco. Muda. Y al asomarte entiendes por qué: esa casilla vacía no es mala suerte, casi toda la tabla está
así, y tarde o temprano caes en un hueco. Lo raro es que los dos contextos se parecen como dos gotas de agua.
Para ti son casi el mismo. Para ella no: o tenía esa fila guardada, exacta, o no la tenía. Ese es el techo de verdad.

## §6 · El puente

Tiene un techo, sí. Pero antes de buscarle sustituto, mira de dónde vienes.

`[VIS: Progression]` — *tres muestras de la misma máquina a lo largo del capítulo: al principio, cabezazos
contra el teclado; con dos letras, sílabas; ahora, palabras de verdad. La misma idea, contar, creciendo.*

De dar cabezazos a escribir palabras, sin enseñarle ni una regla. Y esto no se quedó en un juguete de clase:
con esta misma idea funcionaron durante años los traductores, el reconocimiento de voz y el teclado de tu
móvil. Llevada al límite, con datos de sobra, escribe sorprendentemente bien. Tanto que casi cuela.

`[VIS: BigModelLimit]` — *un modelo grande, entrenado a fondo, suelta un párrafo casi convincente. Luego le
pides que coloque dos palabras, «gato» y «perro», cerca si se parecen o lejos si no. Las manda a dos rincones
opuestos.*

Y eso es lo raro, porque tú sí sabes que van juntos. Ahí está la grieta: la máquina no entendió nunca nada,
solo guardó trozos, y para ella cada contexto es una isla suelta; lo que aprende de uno no le vale para el
otro. ¿Y si pudiéramos enseñarle que las cosas parecidas se traten parecido? Dejaría de necesitar haberlo
visto todo.

> **Historia (plegable, opcional).** Contar trozos de texto gobernó casi cincuenta años: el reconocimiento de
> voz, los primeros traductores, el autocompletar de tu móvil de hace nada. La consigna de la época cabía en
> una frase: no hay mejor dato que más dato. Hasta que se topó con este muro.

## Puente / CTA
- **quote:** Contar nos trajo hasta aquí. Cruzar el muro pide dejar de contar.
- **hook:** Que las cosas que se parecen se traten parecido. De eso van las redes neuronales.
- **button:** Las redes neuronales
- **footer:** Lo has construido tú, solo contando.

---
*Notas: la Historia necesita una anécdota real con mimo (pendiente). Gates: lectura ciega v2 = PASS; anti-IA
v1 = limpio; v3 (rica) re-leer.*
