// home namespace (es). Slice of the original i18n dictionary — see src/i18n/README.md.
export const home = {
    home: {
        role: "Matemático & Desarrollador",
        tagline: "Explorando la intersección del análisis matemático, el código y la inteligencia artificial.",
        ctaProjects: "Ver Proyectos",
        aboutLink: "About",
        nav: {
            latentSpace: "My Latent Space",
            projects: "Proyectos",
            lab: "LM Lab",
            about: "About",
            contact: "Contacto",
        },
        about: {
            back: "Volver",
            p1: "Curso el doble grado en <strong>Matemáticas e Ingeniería Informática</strong> en la Universidad Complutense de Madrid. Investigo las redes neuronales desde su nivel más profundo: de la dinámica del gradiente a la optimización a bajo nivel.",
            p2: "Me especializo en <strong>interpretabilidad mecanística</strong> — aplicar ingeniería inversa a cómo las redes representan y procesan la información. En lugar de tratar los modelos como cajas negras, descompongo sus circuitos para entender <em>por qué funcionan</em>.",
            mission: "Mi misión: hacer transparentes los sistemas de IA mediante análisis matemático riguroso e ingeniería de bajo nivel.",
        },
    },
    landing: {
        hero: {
            status: "Sistema Online :: v2.2",
            role: "Investigación e Ingeniería",
            title: "ADRIAN LAYNEZ ORTIZ",
            tagline1: "Matemáticas e Informática.",
            tagline2: "Interpretabilidad Mecanística · Ingeniería de Alto Rendimiento.",
            cta: {
                lab: "Ver Laboratorio",
                notes: "Leer Notas",
            },
        },
        metrics: {
            research: "Secciones de Investigación",
            visualizations: "Visualizaciones Interactivas",
            languages: "Idiomas",
            curiosity: "Curiosidad",
        },
        about: {
            badge: "Sobre Mí",
            building: "Desarrollando",
            projectTitle: "Motor de Deep Learning — CUDA / C++",
            projectDesc: "Kernels personalizados para operaciones matriciales y retropropagación",
            bio: {
                titlePrefix: "Uniendo Matemáticas Abstractas",
                titleSuffix: "e Inteligencia Artificial",
                p1: "Estudio el Doble Grado en <strong class='text-foreground'>Matemáticas e Ingeniería Informática</strong> en la Universidad Complutense de Madrid. Mi investigación se centra en comprender las redes neuronales a su nivel más profundo — desde la dinámica de gradientes hasta la optimización a nivel de kernel.",
                p2: "Me especializo en <strong class='text-foreground'>Interpretabilidad Mecanística</strong> — la ciencia de realizar ingeniería inversa sobre cómo las redes neuronales representan y procesan la información internamente. En lugar de tratar los modelos como cajas negras, descompongo sus circuitos para entender <em class='text-foreground/80'>por qué funcionan</em>.",
                mission: "Mi misión: hacer los sistemas de IA transparentes a través de un análisis matemático riguroso e ingeniería de bajo nivel.",
            },
        },
        skills: {
            title: "Competencias Técnicas",
            linearAlgebra: "Álgebra Lineal",
            topology: "Topología",
            convexOpt: "Optimización Convexa",
        },
        work: {
            badge: "Trabajo Seleccionado",
            titlePrefix: "Ingeniería desde",
            titleSuffix: "Primeros Principios",
            description: "Cada proyecto comienza con una pregunta. Desde reimplementar papers seminales hasta escribir kernels de GPU desde cero, cada uno es un ejercicio de comprensión profunda.",
            viewAll: "Ver Todos los Proyectos",
            items: {
                nanoTransformer: {
                    title: "Nano-Transformer",
                    desc: "Reproducción desde cero de 'Attention Is All You Need' en PyTorch — Multi-Head Attention, Positional Encodings y LayerNorm implementados sin módulos preconstruidos.",
                },
                cudaKernels: {
                    title: "Kernels Matriciales CUDA",
                    desc: "Kernels de CUDA escritos a mano explorando la optimización SGEMM — desde implementaciones ingenuas hasta estrategias de memoria compartida en mosaico, comparadas con cuBLAS.",
                },
                autograd: {
                    title: "Motor Autograd",
                    desc: "Librería ligera de diferenciación automática en modo inverso. Construye dinámicamente grafos de computación y propaga gradientes mediante la regla de la cadena.",
                },
                mathDl: {
                    title: "Matemáticas del Deep Learning",
                    desc: "Artículos interactivos explorando la teoría rigurosa detrás de la IA moderna — análisis de convergencia SGD, el álgebra lineal de LoRA y geometría diferencial en variedades neuronales.",
                },
                distributed: {
                    title: "Inferencia Distribuida",
                    desc: "Exploraciones arquitectónicas en entrenamiento paralelo de datos, fragmentación de modelos y tuberías de inferencia optimizadas para redes neuronales a gran escala.",
                },
            },
        },
        contact: {
            badge: "Abierto a Oportunidades",
            titlePrefix: "Construyamos",
            titleMiddle: "Algo",
            titleSuffix: "Juntos",
            description: "Ya sea una colaboración de investigación, una oportunidad de pasantía o simplemente una conversación sobre las matemáticas de la inteligencia — me encantaría saber de ti.",
            email: "Contactar",
            github: "Perfil de GitHub",
            githubShort: "GitHub",
            linkedin: "LinkedIn",
        },
    }
};
