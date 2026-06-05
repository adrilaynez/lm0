// Transformer visualizer components will be exported from here
// as they are built across prompts 2-10.
export { ContextEnrichmentViz } from "./ContextEnrichmentViz";
export { ContextShiftsViz } from "./ContextShiftsViz";
export { DrawConnectionsViz } from "./DrawConnectionsViz";
export { FrozenVsContextualViz } from "./FrozenVsContextualViz";
export { IsolatedTokensViz } from "./IsolatedTokensViz";
export { LSTMBandageViz } from "./LSTMBandageViz";
export { MLPvsHumanViz } from "./MLPvsHumanViz";
export { PronounResolutionViz } from "./PronounResolutionViz";
export { RNNChainViz } from "./RNNChainViz";
export { SequentialVsParallelViz } from "./SequentialVsParallelViz";
export { TelephoneGameViz } from "./TelephoneGameViz";
export { WishlistCallbackViz } from "./WishlistCallbackViz";

/* §03 visualizers */
export { AttentionHeatmapViz } from "./AttentionHeatmapViz";
export { ContextChangesViz } from "./ContextChangesViz";
export { GuessPatternViz } from "./GuessPatternViz";
export { SpotlightViz } from "./SpotlightViz";
export { StaticVsDynamicViz } from "./StaticVsDynamicViz";

/* §04a visualizers */
export { DotProductCalculatorViz } from "./DotProductCalculatorViz";
export { EmbeddingToArrowViz } from "./EmbeddingToArrowViz";
/* DotProductArrowsViz merged into DotProductCalculatorViz v2 */
export { DotProductQuiz } from "./DotProductQuiz";
export { EmbeddingAttentionFailureViz } from "./EmbeddingAttentionFailureViz";
export { PairwiseScoringViz } from "./PairwiseScoringViz";
export { SelfSimilarityViz } from "./SelfSimilarityViz";

/* §04b-c visualizers */
export { BreakDiagonalViz } from "./BreakDiagonalViz";
export { ContextualWordViz } from "./ContextualWordViz";
export { EmbeddingToQKViz } from "./EmbeddingToQKViz";
export { MatrixProjectionViz } from "./MatrixProjectionViz";
export { QKMatrixViz } from "./QKMatrixViz";
export { QKSplitViz } from "./QKSplitViz";
export { QueryKeyLensesViz } from "./QueryKeyLensesViz";
export { QueryKeyRelationsViz } from "./QueryKeyRelationsViz";
export { QueryMeetsKeyViz } from "./QueryMeetsKeyViz";
export { QuerySearchViz } from "./QuerySearchViz";
export { SoftmaxAttentionViz } from "./SoftmaxAttentionViz";
export { ValueCompletesViz } from "./ValueCompletesViz";
export { WeightsOfWhatViz } from "./WeightsOfWhatViz";
export { WhyQKMattersViz } from "./WhyQKMattersViz";

/* §04d visualizers */
export { ContextAssemblyFilmViz } from "./ContextAssemblyFilmViz";
export { FullContextualAssemblyViz } from "./FullContextualAssemblyViz";
export { FullScoringPipelineViz } from "./FullScoringPipelineViz";
export { NumbersExplodeViz } from "./NumbersExplodeViz";
export { ScalingFixViz } from "./ScalingFixViz";
export { SoftmaxReturnsViz } from "./SoftmaxReturnsViz";
export { SoftRetrievalViz } from "./SoftRetrievalViz";

/* §05 multi-head visualizers */
export { HeadBudgetViz } from "./HeadBudgetViz";
export { HeadOrchestraViz } from "./HeadOrchestraViz";
export { HeadSpecializationViz } from "./HeadSpecializationViz";
export { MultiHeadArchitectureViz } from "./MultiHeadArchitectureViz";
export { MultiHeadIdeaViz } from "./MultiHeadIdeaViz";
export { MultiLensViewViz } from "./MultiLensViewViz";
export { OneHeadDilemmaViz } from "./OneHeadDilemmaViz";
export { WhichWordMattersViz } from "./WhichWordMattersViz";

/* §07 transformer block visualizers */
export { AttentionAloneFailsViz } from "./AttentionAloneFailsViz";
export { AttentionScoreViz } from "./AttentionScoreViz";
export { BatchVsLayerNormViz } from "./BatchVsLayerNormViz";
export { BeforeAfterBlockViz } from "./BeforeAfterBlockViz";
export { BlockBuilderViz } from "./BlockBuilderViz";
export { BlockComponentExplorerViz } from "./BlockComponentExplorerViz";
export { CommunicationVsProcessingViz } from "./CommunicationVsProcessingViz";
export { FFNCallbackViz } from "./FFNCallbackViz";
export { FFNDeepDiveViz } from "./FFNDeepDiveViz";
export { HighwayReturnsViz } from "./HighwayReturnsViz";
export { LayerNormViz } from "./LayerNormViz";
export { QKVProjectionViz } from "./QKVProjectionViz";
export { TransformerBlockExplorerViz } from "./TransformerBlockExplorerViz";
export { ValueDriftViz } from "./ValueDriftViz";

/* §06 positional encoding visualizers */
export { AddEmbeddingsViz } from "./AddEmbeddingsViz";
export { BlockBlueprintViz } from "./BlockBlueprintViz";
export { DataFlowViz } from "./DataFlowViz";
export { LearnedPositionEmbeddingsViz } from "./LearnedPositionEmbeddingsViz";
export { PositionalSimilarityViz } from "./PositionalSimilarityViz";
export { PositionInActionViz } from "./PositionInActionViz";
export { ShuffleDisasterViz } from "./ShuffleDisasterViz";
export { SimpleNumbersViz } from "./SimpleNumbersViz";
export { WaveFingerprintViz } from "./WaveFingerprintViz";

/* §07 full architecture visualizers (absorbed from old §08) */
export { ArchitectureTowerViz } from "./ArchitectureTowerViz";
export { DepthVsQualityViz } from "./DepthVsQualityViz";
export { LayerEvolutionViz } from "./LayerEvolutionViz";
export { LinearSoftmaxViz } from "./LinearSoftmaxViz";
export { TrainingDashboardViz } from "./TrainingDashboardViz";

/* §08-09 depth, overfitting & generation visualizers */
export { CharGenerationPlayground } from "./CharGenerationPlayground";
export { CharVsTokenViz } from "./CharVsTokenViz";
export { ContextWindowViz } from "./ContextWindowViz";
export { DepthGenerationViz } from "./DepthGenerationViz";
export { EvolutionTimelineViz } from "./EvolutionTimelineViz";
export { LayerLensViz } from "./LayerLensViz";
export { MemorizationRevealViz } from "./MemorizationRevealViz";
export { OverfittingDualCurveViz } from "./OverfittingDualCurveViz";

/* §09 training visualizers */
export { CausalMaskViz } from "./CausalMaskViz";
export { CheatingProblemViz } from "./CheatingProblemViz";
export { GrowingContextViz } from "./GrowingContextViz";
export { GrowingMasksViz } from "./GrowingMasksViz";
export { TrainingEfficiencyViz } from "./TrainingEfficiencyViz";

/* §10 bridge visualizers */
export { ArchitectureIdentityViz } from "./ArchitectureIdentityViz";
export { CompletionVsAssistantViz } from "./CompletionVsAssistantViz";
export { ConceptRecallViz } from "./ConceptRecallViz";
export { ShareJourneyViz } from "./ShareJourneyViz";
export { ThreeMysteriesViz } from "./ThreeMysteriesViz";
