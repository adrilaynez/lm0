export interface Prediction {
    token: string;
    probability: number;
}

export interface TransitionMatrixViz {
    shape: number[];
    data: number[][];
    row_labels: string[];
    col_labels: string[];
}

export interface TrainingViz {
    loss_history: number[];
    final_loss: number;
    training_steps: number;
    batch_size: number;
    learning_rate: number;
    total_parameters: number;
    trainable_parameters: number;
    raw_text_size: number;
    train_data_size: number;
    val_data_size: number;
    unique_characters: number;
}

export interface ArchitectureViz {
    name: string;
    description: string;
    complexity: string;
    type: string;
    how_it_works: string[];
    strengths: string[];
    limitations: string[];
    use_cases: string[];
}

export interface VisualizationData {
    transition_matrix: TransitionMatrixViz;
    training: TrainingViz;
    architecture: ArchitectureViz;
}

export interface VisualizeResponse {
    model_id: string;
    model_name: string;
    input: {
        text: string;
        token_ids: number[];
    };
    predictions: Prediction[];
    full_distribution: number[];
    visualization: VisualizationData;
    historical_context?: HistoricalContext;
    metadata: {
        inference_time_ms: number;
        device: string;
        vocab_size: number;
    };
}

export interface GenerateResponse {
    model_id: string;
    generated_text: string;
    length: number;
    temperature: number;
    start_char: string;
    metadata: {
        inference_time_ms: number;
        device: string;
        vocab_size: number;
    };
}

export interface StepDetail {
    step: number;
    char: string;
    probability: number;
}

export interface StepwiseResponse {
    model_id: string;
    input_text: string;
    steps: StepDetail[];
    final_prediction: string;
    metadata: {
        inference_time_ms: number;
        device: string;
        vocab_size: number;
    };
}

// ============ N-Gram Visualization ============

export interface HistoricalContext {
    description: string;
    limitations: string[];
    modern_evolution: string;
}

export interface NGramTrainingInfo {
    total_tokens?: number | null;
    unique_chars?: number | null;
    unique_contexts?: number | null;
    context_space_size?: number | null;
    context_utilization?: number | null;
    sparsity?: number | null;
    transition_density?: number | null;
    loss_history?: number[];
    train_loss_history?: number[];
    val_loss_history?: number[];
    final_loss?: number | null;
    final_train_loss?: number | null;
    final_val_loss?: number | null;
    perplexity?: number | null;
    smoothing_alpha?: number | null;
    corpus_name?: string | null;
}

export interface NGramDiagnostics {
    vocab_size: number;
    context_size: number;
    estimated_context_space: number;
    sparsity?: number | null;
    observed_contexts?: number | null;
    context_utilization?: number | null;
    perplexity?: number | null;
    corpus_name?: string;
    smoothing_alpha?: number;
}

export interface ActiveSlice {
    context_tokens: string[] | null;
    matrix: TransitionMatrixViz | null;
    next_token_probs?: Record<string, number>; // legacy, may be absent
}

export interface NGramInferenceResponse {
    model_id: string;
    model_name: string;
    context_size: number;
    input: {
        text: string;
        token_ids: number[];
    };
    predictions: Prediction[];
    full_distribution: number[];
    visualization: {
        transition_matrix: TransitionMatrixViz | null;
        active_slice: ActiveSlice | null;
        context_distributions?: Record<string, {
            context: string;
            probabilities: number[];
            row_labels?: string[];
        }> | null;
        training: NGramTrainingInfo;
        diagnostics: NGramDiagnostics;
        architecture: ArchitectureViz;
        historical_context: HistoricalContext;
    };
    metadata: {
        inference_time_ms: number;
        device: string;
        vocab_size: number;
    };
}

export interface DatasetLookupResponse {
    query: string;
    count: number;
    examples: string[];
    source: string;
}

// ============ MLP Grid ============

export interface MLPGridConfig {
    config_id: string;
    embedding_dim: number;
    hidden_size: number;
    num_layers?: number;
    context_size: number;
    learning_rate: number;
    batch_size?: number;
    total_parameters: number;
    // final_loss = val_loss when available, else train_loss
    final_loss: number;
    final_val_loss?: number | null;
    final_train_loss?: number | null;
    perplexity: number;
    initial_loss?: number;
    initial_val_loss?: number | null;
    expected_uniform_loss?: number | null;
    generalization_gap?: number | null;
    train_time_sec?: number;
    score?: number | null;
    snapshot_steps?: string[];
    filename?: string;
}

export interface MLPGridResponse {
    configurations: MLPGridConfig[];
    total: number;
    configs?: MLPGridConfig[];
    dataset_info?: {
        name: string;
        vocab_size: number;
        total_tokens: number;
    };
}

export interface MLPTimelineMetricEntry {
    step: number;
    value: number;
}

export interface MLPTimelineMetricsLog {
    train_loss: MLPTimelineMetricEntry[];
    val_loss: MLPTimelineMetricEntry[];
    grad_norms: MLPTimelineMetricEntry[];
    dead_neurons: MLPTimelineMetricEntry[];
}

export interface MLPTimelineSnapshot {
    step: number;
    train_loss?: number;
    val_loss?: number;
    dead_neurons?: number;
    activation_stats?: Record<string, unknown>;
    weight_stats?: Record<string, unknown>;
    grad_norms?: Record<string, unknown>;
    grad_health?: Record<string, unknown>;
    generalization_gap?: number;
    samples?: string[];
}

export interface MLPTimelineResponse {
    model_id: string;
    config: Record<string, unknown>;
    metrics_log: MLPTimelineMetricsLog;
    snapshots: Record<string, MLPTimelineSnapshot>;
    metadata: {
        initial_loss?: number;
        expected_uniform_loss?: number;
        train_time_sec?: number;
        total_snapshots?: number;
        snapshot_steps?: string[];
    };
}

export interface MLPEmbeddingResponse {
    model_id: string;
    config: {
        emb_dim: number;
        hidden_size: number;
        learning_rate: number;
        context_size: number;
        batch_size: number;
    };
    vocab: string[];
    embedding_matrix: number[][];
    shape: [number, number];
    snapshot_step?: string;
}

export interface MLPEmbeddingQualityResponse {
    config_id: string;
    nearest_neighbors: Record<string, Array<{ token: string; similarity: number }>>;
}

export interface MLPGenerateResponse {
    model_id: string;
    config: Record<string, unknown>;
    generated_text: string;
    seed_text: string;
    temperature: number;
    length: number;
    metadata: {
        inference_time_ms: number;
        device: string;
        vocab_size: number;
    };
}

export interface MLPPredictResponse {
    config_id: string;
    input_text: string;
    predictions: Prediction[];
    full_distribution: number[];
}

export interface MLPTensorData {
    shape: number[];
    data: number[][];
    dtype: string;
}

export interface MLPInternalsResponse {
    model_id: string;
    config: Record<string, unknown>;
    input: { text: string; token_ids: number[] };
    predictions: Array<{ token: string; probability: number }>;
    internals: {
        hidden_activations?: MLPTensorData;
        hidden_preactivations?: MLPTensorData;
        activation_stats?: { mean: number; std: number; hist: number[] };
        dead_neurons?: number;
        weight_stats?: Record<string, { mean: number; std: number }>;
        [key: string]: unknown;
    };
    metadata: { inference_time_ms: number; device: string; vocab_size: number };
}
