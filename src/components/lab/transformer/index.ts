// Transformer visualizer components will be exported from here
// as they are built across prompts 2-10.
export { IsolatedTokensViz } from "./IsolatedTokensViz";
export { DrawConnectionsViz } from "./DrawConnectionsViz";
export { MLPvsHumanViz } from "./MLPvsHumanViz";
export { WishlistCallbackViz } from "./WishlistCallbackViz";
export { ContextShiftsViz } from "./ContextShiftsViz";
export { PronounResolutionViz } from "./PronounResolutionViz";
export { FrozenVsContextualViz } from "./FrozenVsContextualViz";
export { ContextEnrichmentViz } from "./ContextEnrichmentViz";
export { TelephoneGameViz } from "./TelephoneGameViz";
export { LSTMBandageViz } from "./LSTMBandageViz";
export { SequentialVsParallelViz } from "./SequentialVsParallelViz";
export { RNNChainViz } from "./RNNChainViz";

/* §03 visualizers */
export { SpotlightViz } from "./SpotlightViz";
export { ContextChangesViz } from "./ContextChangesViz";
export { GuessPatternViz } from "./GuessPatternViz";
export { StaticVsDynamicViz } from "./StaticVsDynamicViz";
export { AttentionHeatmapViz } from "./AttentionHeatmapViz";

/* §04a visualizers */
export { EmbeddingToArrowViz } from "./EmbeddingToArrowViz";
export { DotProductCalculatorViz } from "./DotProductCalculatorViz";
/* DotProductArrowsViz merged into DotProductCalculatorViz v2 */
export { PairwiseScoringViz } from "./PairwiseScoringViz";
export { SelfSimilarityViz } from "./SelfSimilarityViz";
export { DotProductQuiz } from "./DotProductQuiz";
export { EmbeddingAttentionFailureViz } from "./EmbeddingAttentionFailureViz";

/* §04b-c visualizers */
export { EmbeddingToQKViz } from "./EmbeddingToQKViz";
export { BreakDiagonalViz } from "./BreakDiagonalViz";
export { QKSplitViz } from "./QKSplitViz";
export { QKMatrixViz } from "./QKMatrixViz";
export { QueryKeyLensesViz } from "./QueryKeyLensesViz";
export { MatrixProjectionViz } from "./MatrixProjectionViz";
export { QueryMeetsKeyViz } from "./QueryMeetsKeyViz";
export { QueryKeyRelationsViz } from "./QueryKeyRelationsViz";
export { QuerySearchViz } from "./QuerySearchViz";
export { WhyQKMattersViz } from "./WhyQKMattersViz";
export { SoftmaxAttentionViz } from "./SoftmaxAttentionViz";
export { WeightsOfWhatViz } from "./WeightsOfWhatViz";
export { ValueCompletesViz } from "./ValueCompletesViz";
export { ContextualWordViz } from "./ContextualWordViz";

/* §04d visualizers */
export { NumbersExplodeViz } from "./NumbersExplodeViz";
export { ScalingFixViz } from "./ScalingFixViz";
export { SoftmaxReturnsViz } from "./SoftmaxReturnsViz";
export { FullScoringPipelineViz } from "./FullScoringPipelineViz";
export { SoftRetrievalViz } from "./SoftRetrievalViz";
export { ContextAssemblyFilmViz } from "./ContextAssemblyFilmViz";
export { FullContextualAssemblyViz } from "./FullContextualAssemblyViz";

/* §05 multi-head visualizers */
export { WhichWordMattersViz } from "./WhichWordMattersViz";
export { OneHeadDilemmaViz } from "./OneHeadDilemmaViz";
export { MultiHeadIdeaViz } from "./MultiHeadIdeaViz";
export { MultiLensViewViz } from "./MultiLensViewViz";
export { HeadSpecializationViz } from "./HeadSpecializationViz";
export { HeadOrchestraViz } from "./HeadOrchestraViz";
export { HeadBudgetViz } from "./HeadBudgetViz";
export { MultiHeadArchitectureViz } from "./MultiHeadArchitectureViz";

/* §07 transformer block visualizers */
export { CommunicationVsProcessingViz } from "./CommunicationVsProcessingViz";
export { AttentionAloneFailsViz } from "./AttentionAloneFailsViz";
export { FFNCallbackViz } from "./FFNCallbackViz";
export { FFNDeepDiveViz } from "./FFNDeepDiveViz";
export { HighwayReturnsViz } from "./HighwayReturnsViz";
export { LayerNormViz } from "./LayerNormViz";
export { ValueDriftViz } from "./ValueDriftViz";
export { BatchVsLayerNormViz } from "./BatchVsLayerNormViz";
export { BlockBuilderViz } from "./BlockBuilderViz";
export { BlockComponentExplorerViz } from "./BlockComponentExplorerViz";
export { QKVProjectionViz } from "./QKVProjectionViz";
export { AttentionScoreViz } from "./AttentionScoreViz";
export { TransformerBlockExplorerViz } from "./TransformerBlockExplorerViz";
export { BeforeAfterBlockViz } from "./BeforeAfterBlockViz";

/* §06 positional encoding visualizers */
export { ShuffleDisasterViz } from "./ShuffleDisasterViz";
export { SimpleNumbersViz } from "./SimpleNumbersViz";
export { LearnedPositionEmbeddingsViz } from "./LearnedPositionEmbeddingsViz";
export { WaveFingerprintViz } from "./WaveFingerprintViz";
export { PositionalSimilarityViz } from "./PositionalSimilarityViz";
export { AddEmbeddingsViz } from "./AddEmbeddingsViz";
export { PositionInActionViz } from "./PositionInActionViz";

export { DataFlowViz } from "./DataFlowViz";
export { BlockBlueprintViz } from "./BlockBlueprintViz";

/* §07 full architecture visualizers (absorbed from old §08) */
export { DepthVsQualityViz } from "./DepthVsQualityViz";
export { LayerEvolutionViz } from "./LayerEvolutionViz";
export { ArchitectureTowerViz } from "./ArchitectureTowerViz";
export { LinearSoftmaxViz } from "./LinearSoftmaxViz";

export { TrainingDashboardViz } from "./TrainingDashboardViz";

/* §08-09 depth, overfitting & generation visualizers */
export { LayerLensViz } from "./LayerLensViz";
export { DepthGenerationViz } from "./DepthGenerationViz";
export { OverfittingDualCurveViz } from "./OverfittingDualCurveViz";
export { CharGenerationPlayground } from "./CharGenerationPlayground";
export { MemorizationRevealViz } from "./MemorizationRevealViz";
export { ContextWindowViz } from "./ContextWindowViz";
export { CharVsTokenViz } from "./CharVsTokenViz";
export { EvolutionTimelineViz } from "./EvolutionTimelineViz";

/* §09 training visualizers */
export { CheatingProblemViz } from "./CheatingProblemViz";
export { CausalMaskViz } from "./CausalMaskViz";
export { GrowingMasksViz } from "./GrowingMasksViz";
export { TrainingEfficiencyViz } from "./TrainingEfficiencyViz";
export { GrowingContextViz } from "./GrowingContextViz";

/* §10 bridge visualizers */
export { ArchitectureIdentityViz } from "./ArchitectureIdentityViz";
export { CompletionVsAssistantViz } from "./CompletionVsAssistantViz";
export { ThreeMysteriesViz } from "./ThreeMysteriesViz";
export { ConceptRecallViz } from "./ConceptRecallViz";
export { ShareJourneyViz } from "./ShareJourneyViz";
