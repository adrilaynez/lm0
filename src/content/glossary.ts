export interface GlossaryEntry {
    en: string;
    es: string;
}

export const glossary: Record<string, GlossaryEntry> = {
    // --- General ML ---
    "model": {
        en: "A mathematical function that learns patterns from data to make predictions.",
        es: "Una función matemática que aprende patrones de datos para hacer predicciones.",
    },
    "training": {
        en: "The process of adjusting a model's parameters so it makes better predictions.",
        es: "El proceso de ajustar los parámetros de un modelo para que haga mejores predicciones.",
    },
    "inference": {
        en: "Using a trained model to make predictions on new, unseen data.",
        es: "Usar un modelo entrenado para hacer predicciones con datos nuevos.",
    },
    "parameter": {
        en: "A value the model learns during training — weights and biases are parameters.",
        es: "Un valor que el modelo aprende durante el entrenamiento — los pesos y sesgos son parámetros.",
    },
    "loss": {
        en: "A number measuring how wrong the model's predictions are. Lower = better.",
        es: "Un número que mide cuán equivocadas son las predicciones del modelo. Menor = mejor.",
    },
    "loss function": {
        en: "The formula used to calculate how far the model's output is from the correct answer.",
        es: "La fórmula usada para calcular cuán lejos está la salida del modelo de la respuesta correcta.",
    },
    "overfitting": {
        en: "When a model memorizes training data instead of learning general patterns, performing poorly on new data.",
        es: "Cuando un modelo memoriza los datos de entrenamiento en vez de aprender patrones generales, funcionando mal con datos nuevos.",
    },
    "underfitting": {
        en: "When a model is too simple to capture the patterns in the data.",
        es: "Cuando un modelo es demasiado simple para capturar los patrones en los datos.",
    },
    "epoch": {
        en: "One complete pass through the entire training dataset.",
        es: "Una pasada completa por todo el conjunto de datos de entrenamiento.",
    },
    "batch": {
        en: "A small subset of training data processed together in one step.",
        es: "Un pequeño subconjunto de datos de entrenamiento procesados juntos en un paso.",
    },
    "learning rate": {
        en: "Controls how big each adjustment step is during training. Too high = unstable, too low = slow.",
        es: "Controla cuán grande es cada paso de ajuste durante el entrenamiento. Muy alto = inestable, muy bajo = lento.",
    },
    "hyperparameter": {
        en: "A setting you choose before training (like learning rate or layers) — not learned by the model itself.",
        es: "Un ajuste que eliges antes de entrenar (como tasa de aprendizaje o capas) — no lo aprende el modelo.",
    },

    // --- Neural Networks ---
    "neuron": {
        en: "A basic unit that takes inputs, multiplies by weights, adds bias, and passes through an activation function.",
        es: "Una unidad básica que toma entradas, multiplica por pesos, añade sesgo y pasa por una función de activación.",
    },
    "weight": {
        en: "A learnable number that determines how much influence an input has on the output.",
        es: "Un número aprendible que determina cuánta influencia tiene una entrada sobre la salida.",
    },
    "bias": {
        en: "A learnable constant added after the weighted sum, allowing the neuron to shift its output.",
        es: "Una constante aprendible añadida después de la suma ponderada, permitiendo al neurón desplazar su salida.",
    },
    "activation function": {
        en: "A function applied after the linear combination that introduces non-linearity (e.g., ReLU, sigmoid).",
        es: "Una función aplicada después de la combinación lineal que introduce no-linealidad (ej: ReLU, sigmoide).",
    },
    "gradient": {
        en: "The direction and rate of steepest change of the loss — tells the model which way to adjust.",
        es: "La dirección y tasa de cambio más pronunciada de la pérdida — indica al modelo hacia dónde ajustarse.",
    },
    "gradient descent": {
        en: "An optimization algorithm that adjusts parameters in the direction that reduces loss.",
        es: "Un algoritmo de optimización que ajusta los parámetros en la dirección que reduce la pérdida.",
    },
    "backpropagation": {
        en: "The algorithm that calculates gradients by propagating errors backward through the network.",
        es: "El algoritmo que calcula gradientes propagando errores hacia atrás a través de la red.",
    },
    "layer": {
        en: "A group of neurons at the same depth in the network. Deeper layers learn more abstract features.",
        es: "Un grupo de neuronas a la misma profundidad en la red. Las capas más profundas aprenden características más abstractas.",
    },
    "hidden layer": {
        en: "Any layer between the input and output layers, where the network learns internal representations.",
        es: "Cualquier capa entre las capas de entrada y salida, donde la red aprende representaciones internas.",
    },
    "ReLU": {
        en: "Rectified Linear Unit — outputs the input if positive, zero otherwise. The most popular activation function.",
        es: "Unidad Lineal Rectificada — devuelve la entrada si es positiva, cero en caso contrario. La función de activación más popular.",
    },
    "softmax": {
        en: "Converts a vector of numbers into probabilities that sum to 1. Used for classification.",
        es: "Convierte un vector de números en probabilidades que suman 1. Usado para clasificación.",
    },
    "cross-entropy": {
        en: "A loss function that measures how different the predicted probability distribution is from the true one.",
        es: "Una función de pérdida que mide cuán diferente es la distribución de probabilidad predicha de la real.",
    },

    // --- N-grams / Bigrams ---
    "bigram": {
        en: "A sequence of two consecutive characters or tokens. The simplest n-gram model.",
        es: "Una secuencia de dos caracteres o tokens consecutivos. El modelo n-grama más simple.",
    },
    "n-gram": {
        en: "A contiguous sequence of N items (characters, words). Used for statistical language modeling.",
        es: "Una secuencia contigua de N elementos (caracteres, palabras). Usado para modelado estadístico del lenguaje.",
    },
    "token": {
        en: "The smallest unit of text the model works with — could be a character, subword, or word.",
        es: "La unidad más pequeña de texto con la que trabaja el modelo — puede ser un carácter, subpalabra o palabra.",
    },
    "tokenization": {
        en: "Splitting text into tokens. Different methods (char, BPE, word) trade vocabulary size for sequence length.",
        es: "Dividir texto en tokens. Diferentes métodos (carácter, BPE, palabra) intercambian tamaño de vocabulario por longitud de secuencia.",
    },
    "probability distribution": {
        en: "A set of probabilities for all possible outcomes that sum to 1.",
        es: "Un conjunto de probabilidades para todos los resultados posibles que suman 1.",
    },
    "transition matrix": {
        en: "A table where each row shows the probability of each next character given the current one.",
        es: "Una tabla donde cada fila muestra la probabilidad de cada siguiente carácter dado el actual.",
    },
    "normalization": {
        en: "Dividing raw counts by their sum so they become valid probabilities (0 to 1, summing to 1).",
        es: "Dividir los conteos brutos por su suma para que se conviertan en probabilidades válidas (0 a 1, sumando 1).",
    },
    "context window": {
        en: "The number of previous tokens the model can 'see' when predicting the next one.",
        es: "El número de tokens previos que el modelo puede 'ver' al predecir el siguiente.",
    },
    "temperature": {
        en: "Controls randomness in generation. Low = predictable/repetitive, high = creative/chaotic.",
        es: "Controla la aleatoriedad en la generación. Baja = predecible/repetitiva, alta = creativa/caótica.",
    },
    "sampling": {
        en: "Choosing the next token randomly according to its predicted probability, rather than always picking the most likely.",
        es: "Elegir el siguiente token aleatoriamente según su probabilidad predicha, en lugar de siempre elegir el más probable.",
    },

    // --- MLP ---
    "MLP": {
        en: "Multi-Layer Perceptron — a neural network with one or more hidden layers of fully connected neurons.",
        es: "Perceptrón Multicapa — una red neuronal con una o más capas ocultas de neuronas completamente conectadas.",
    },
    "embedding": {
        en: "A dense vector representation of a token. Similar tokens get similar vectors, encoding meaning.",
        es: "Una representación vectorial densa de un token. Tokens similares obtienen vectores similares, codificando significado.",
    },
    "one-hot encoding": {
        en: "Representing a token as a vector of all zeros except a single 1 at the token's index.",
        es: "Representar un token como un vector de todos ceros excepto un solo 1 en el índice del token.",
    },
    "perceptron": {
        en: "The simplest neural network — a single neuron that computes a weighted sum plus bias.",
        es: "La red neuronal más simple — una sola neurona que calcula una suma ponderada más sesgo.",
    },
    "decision boundary": {
        en: "The line (or surface) that separates different classes in the input space.",
        es: "La línea (o superficie) que separa diferentes clases en el espacio de entrada.",
    },
    "non-linearity": {
        en: "A function that creates curves instead of straight lines, allowing the network to learn complex patterns.",
        es: "Una función que crea curvas en lugar de líneas rectas, permitiendo a la red aprender patrones complejos.",
    },
    "validation loss": {
        en: "Loss calculated on data the model hasn't trained on — the true measure of generalization.",
        es: "Pérdida calculada con datos con los que el modelo no ha entrenado — la verdadera medida de generalización.",
    },
};
