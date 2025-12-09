/**
 * Types for the validation framework benchmark system
 */

export interface BenchmarkTask {
  /** Unique task identifier (e.g., CR-001, AR-002) */
  id: string;
  
  /** Task category for grouping */
  category: TaskCategory;
  
  /** Human-readable task title */
  title: string;
  
  /** Detailed task description for the AI */
  task: string;
  
  /** Additional context or background information */
  context?: string;
  
  /** Code snippet to analyze (if applicable) */
  code?: string;
  
  /** Programming language for code field */
  language?: ProgrammingLanguage;
  
  /** Specific elements that should be included in response */
  expected_elements: string[];
  
  /** Task difficulty level */
  difficulty: Difficulty;
  
  /** Which prompting techniques this task validates */
  validates_techniques: PromptingTechnique[];
  
  /** Estimated time for human to complete (minutes) */
  estimated_time?: number;
  
  /** Tags for categorization and filtering */
  tags?: string[];
}

export type TaskCategory = 'code-review' | 'architecture' | 'hard-problems' | 'creative';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type ProgrammingLanguage = 
  | 'javascript' 
  | 'typescript' 
  | 'python' 
  | 'java' 
  | 'go' 
  | 'sql' 
  | 'yaml' 
  | 'json';

export type PromptingTechnique = 
  | 'expert-persona'
  | 'step-by-step'
  | 'stakes-language'
  | 'challenge-framing'
  | 'self-evaluation';

export interface EvaluationResult {
  /** Task identifier */
  task_id: string;
  
  /** Baseline response */
  baseline_response: string;
  
  /** Enhanced response */
  enhanced_response: string;
  
  /** G-Eval scores */
  evaluation: GEvalResult;
  
  /** Timestamp of evaluation */
  timestamp: string;
}

export interface GEvalResult {
  /** Individual dimension scores */
  accuracy: DimensionScore;
  completeness: DimensionScore;
  clarity: DimensionScore;
  actionability: DimensionScore;
  relevance: DimensionScore;
  
  /** Overall comparison result */
  overall: OverallScore;
}

export interface DimensionScore {
  /** Score from 1-5 */
  score: number;
  
  /** Reasoning for the score */
  reasoning: string;
}

export interface OverallScore {
  /** Baseline average score */
  baseline_score: number;
  
  /** Enhanced average score */
  enhanced_score: number;
  
  /** Which response won */
  winner: 'baseline' | 'enhanced' | 'tie';
}

export interface StatisticalResult {
  /** Sample size per condition */
  sample_size: number;
  
  /** Mean improvement percentage */
  mean_improvement: number;
  
  /** 95% confidence interval */
  confidence_interval: [number, number];
  
  /** Effect size (Cohen's d) */
  cohens_d: number;
  
  /** P-value from statistical test */
  p_value: number;
  
  /** Statistical significance */
  significant: boolean;
  
  /** Test used */
  test_used: string;
}

export interface ValidationReport {
  /** Report generation timestamp */
  generated_at: string;
  
  /** Tasks evaluated */
  tasks_evaluated: number;
  
  /** Results by technique */
  technique_results: TechniqueResult[];
  
  /** Overall statistical summary */
  statistical_summary: StatisticalResult;
  
  /** Measured vs claimed comparison */
  claims_validation: ClaimsValidation;
}

export interface TechniqueResult {
  /** Technique name */
  technique: PromptingTechnique;
  
  /** Claimed improvement from research */
  claimed_improvement: number;
  
  /** Measured improvement */
  measured_improvement: number;
  
  /** Statistical significance */
  significant: boolean;
  
  /** Effect size */
  effect_size: number;
  
  /** Validated or not */
  validated: boolean;
}

export interface ClaimsValidation {
  /** Overall claims validated */
  overall_validated: boolean;
  
  /** Individual technique validation */
  techniques: {
    [key in PromptingTechnique]: {
      claimed: number;
      measured: number;
      validated: boolean;
    };
  };
  
  /** Recommendations based on results */
  recommendations: string[];
}

export interface PromptVariant {
  /** Variant identifier */
  id: string;
  
  /** Variant type */
  type: VariantType;
  
  /** Generated prompt text */
  prompt: string;
  
  /** Metadata about generation */
  metadata: {
    original_template: string;
    modifications: string[];
  };
}

export type VariantType = 
  | 'original'
  | 'rephrased'
  | 'formal'
  | 'informal'
  | 'different-format';

export interface CollectionConfig {
  /** Whether to make actual API calls */
  dry_run: boolean;
  
  /** Number of prompt variants to generate */
  num_variants: number;
  
  /** Specific categories to process */
  categories?: TaskCategory[];
  
  /** Output directory for results */
  output_dir: string;
}