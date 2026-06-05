// home namespace (en). Slice of the original i18n dictionary — see src/i18n/README.md.
export const home = {
    home: {
        role: "Mathematician & Developer",
        tagline: "Exploring the intersection of mathematical analysis, code, and artificial intelligence.",
        ctaProjects: "View Projects",
        aboutLink: "About",
        nav: {
            latentSpace: "My Latent Space",
            projects: "Projects",
            lab: "LM Lab",
            about: "About",
            contact: "Contact",
        },
        about: {
            back: "Back",
            p1: "I'm pursuing a double degree in <strong>Mathematics and Computer Science</strong> at the Universidad Complutense de Madrid. I research neural networks at their deepest level: from gradient dynamics to low-level optimization.",
            p2: "I specialize in <strong>Mechanistic Interpretability</strong> — reverse-engineering how networks represent and process information. Rather than treating models as black boxes, I decompose their circuits to understand <em>why they work</em>.",
            mission: "My mission: make AI systems transparent through rigorous mathematical analysis and low-level engineering.",
        },
    },
    landing: {
        hero: {
            status: "System Online :: v2.2",
            role: "Research & Engineering",
            title: "ADRIAN LAYNEZ ORTIZ",
            tagline1: "Mathematics & Computer Science.",
            tagline2: "Mechanistic Interpretability · High-Performance Engineering.",
            cta: {
                lab: "View Lab Work",
                notes: "Read Notes",
            },
        },
        metrics: {
            research: "Research Sections",
            visualizations: "Interactive Visualizations",
            languages: "Languages",
            curiosity: "Curiosity",
        },
        about: {
            badge: "About",
            building: "Currently Building",
            projectTitle: "Deep Learning Engine — CUDA / C++",
            projectDesc: "Custom kernels for matrix operations and backpropagation",
            bio: {
                titlePrefix: "Bridging Abstract Mathematics",
                titleSuffix: "& Machine Intelligence",
                p1: "I am pursuing a double degree in <strong class='text-foreground'>Mathematics and Computer Science</strong> at the Universidad Complutense de Madrid. My research focuses on understanding neural networks at their deepest level — from gradient dynamics to kernel-level optimization.",
                p2: "I specialize in <strong class='text-foreground'>Mechanistic Interpretability</strong> — the science of reverse-engineering how neural networks represent and process information internally. Rather than treating models as black boxes, I decompose their circuits to understand <em class='text-foreground/80'>why they work</em>.",
                mission: "My mission: make AI systems transparent through rigorous mathematical analysis and low-level engineering.",
            },
        },
        skills: {
            title: "Technical Proficiencies",
            linearAlgebra: "Linear Algebra",
            topology: "Topology",
            convexOpt: "Convex Optimization",
        },
        work: {
            badge: "Selected Work",
            titlePrefix: "Engineering from",
            titleSuffix: "First Principles",
            description: "Every project begins with a question. From reimplementing seminal papers to writing bare-metal GPU kernels, each one is an exercise in deep understanding.",
            viewAll: "View All Projects",
            items: {
                nanoTransformer: {
                    title: "Nano-Transformer",
                    desc: "Ground-up reproduction of 'Attention Is All You Need' in PyTorch — Multi-Head Attention, Positional Encodings, and LayerNorm implemented without pre-built Transformer modules.",
                },
                cudaKernels: {
                    title: "CUDA Matrix Kernels",
                    desc: "Handwritten CUDA kernels exploring SGEMM optimization — from naive implementations to tiled shared-memory strategies, benchmarked against cuBLAS.",
                },
                autograd: {
                    title: "Autograd Engine",
                    desc: "Lightweight reverse-mode automatic differentiation library. Dynamically constructs computation graphs and propagates gradients via the chain rule.",
                },
                mathDl: {
                    title: "The Mathematics of Deep Learning",
                    desc: "Interactive articles exploring the rigorous theory behind modern AI — SGD convergence analysis, the linear algebra of LoRA, and differential geometry on neural manifolds.",
                },
                distributed: {
                    title: "Distributed Inference",
                    desc: "Architectural explorations in data-parallel training, model sharding, and optimized inference pipelines for large-scale neural networks.",
                },
            },
        },
        contact: {
            badge: "Open to Opportunities",
            titlePrefix: "Let's Build",
            titleMiddle: "Something",
            titleSuffix: "Together",
            description: "Whether it's a research collaboration, an internship opportunity, or just a conversation about the mathematics of intelligence — I'd love to hear from you.",
            email: "Get in Touch",
            github: "GitHub Profile",
            githubShort: "GitHub",
            linkedin: "LinkedIn",
        },
    }
};
