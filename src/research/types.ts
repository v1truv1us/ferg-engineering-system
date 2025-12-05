/**
 * Research orchestration types and interfaces for Ferg Engineering System.
 * Defines core abstractions for research workflows, discovery, analysis, and synthesis.
 */

import { ConfidenceLevel } from '../agents/types.js';

// Re-export for convenience
export { ConfidenceLevel };

/**
 * Research scope enumeration
 */
export enum ResearchScope {
  CODEBASE = 'codebase',
  DOCUMENTATION = 'documentation', 
  EXTERNAL = 'external',
  ALL = 'all'
}

/**
 * Research depth enumeration
 */
export enum ResearchDepth {
  SHALLOW = 'shallow',   // Quick scan, surface-level
  MEDIUM = 'medium',     // Standard analysis
  DEEP = 'deep'          // Comprehensive investigation
}

/**
 * Research phase enumeration
 */
export enum ResearchPhase {
  DISCOVERY = 'discovery',
  ANALYSIS = 'analysis',
  SYNTHESIS = 'synthesis'
}

/**
 * Research query interface
 */
export interface ResearchQuery {
  id: string;
  query: string;
  scope: ResearchScope;
  depth: ResearchDepth;
  constraints?: ResearchConstraints;
  context?: Record<string, any>;
  metadata?: {
    source?: string;
    ticket?: string;
    priority?: 'low' | 'medium' | 'high';
  };
}

/**
 * Research constraints interface
 */
export interface ResearchConstraints {
  maxFiles?: number;
  maxDepth?: number;
  includePatterns?: string[];
  excludePatterns?: string[];
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  fileTypes?: string[];
}

/**
 * File reference interface
 */
export interface FileReference {
  path: string;
  startLine?: number;
  endLine?: number;
  relevance: number; // 0-1 score
  snippet?: string;
  language?: string;
  size?: number;
  lastModified?: Date;
}

/**
 * Pattern match interface
 */
export interface PatternMatch {
  pattern: string;
  matches: FileReference[];
  frequency: number;
  confidence: ConfidenceLevel;
  category: string;
}

/**
 * Documentation reference interface
 */
export interface DocReference {
  path: string;
  title?: string;
  section?: string;
  relevance: number;
  snippet?: string;
  type: 'markdown' | 'text' | 'json' | 'yaml';
  lastModified?: Date;
}

/**
 * Discovery result interface
 */
export interface DiscoveryResult {
  source: 'codebase-locator' | 'research-locator' | 'pattern-finder';
  files: FileReference[];
  patterns: PatternMatch[];
  documentation: DocReference[];
  executionTime: number;
  confidence: ConfidenceLevel;
  metadata?: {
    filesSearched?: number;
    patternsMatched?: number;
    docsFound?: number;
  };
}

/**
 * Evidence interface
 */
export interface Evidence {
  id: string;
  type: 'code' | 'documentation' | 'pattern';
  source: string;
  content: string;
  file?: string;
  line?: number;
  confidence: ConfidenceLevel;
  relevance: number;
}

/**
 * Insight interface
 */
export interface Insight {
  id: string;
  type: 'finding' | 'relationship' | 'pattern' | 'decision';
  title: string;
  description: string;
  evidence: string[]; // Evidence IDs
  confidence: ConfidenceLevel;
  impact: 'low' | 'medium' | 'high';
  category: string;
}

/**
 * Relationship interface
 */
export interface Relationship {
  id: string;
  type: 'dependency' | 'similarity' | 'conflict' | 'enhancement';
  source: string;
  target: string;
  description: string;
  strength: number; // 0-1
  evidence: string[]; // Evidence IDs
}

/**
 * Analysis result interface
 */
export interface AnalysisResult {
  source: 'codebase-analyzer' | 'research-analyzer';
  insights: Insight[];
  evidence: Evidence[];
  relationships: Relationship[];
  confidence: ConfidenceLevel;
  executionTime: number;
  metadata?: {
    insightsGenerated?: number;
    evidenceCollected?: number;
    relationshipsFound?: number;
  };
}

/**
 * Code reference interface for reports
 */
export interface CodeReference {
  path: string;
  lines: string | [number, number];
  description: string;
  relevance: number;
  category: string;
}

/**
 * Architecture insight interface
 */
export interface ArchitectureInsight {
  id: string;
  type: 'pattern' | 'decision' | 'concern' | 'recommendation';
  title: string;
  description: string;
  components: string[];
  impact: string;
  evidence: string[]; // Evidence IDs
}

/**
 * Recommendation interface
 */
export interface Recommendation {
  id: string;
  type: 'immediate' | 'short-term' | 'long-term';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  rationale: string;
  effort: 'low' | 'medium' | 'high';
  impact: string;
  dependencies?: string[];
}

/**
 * Risk interface
 */
export interface Risk {
  id: string;
  type: 'technical' | 'architectural' | 'security' | 'performance' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: string;
  mitigation?: string;
  evidence?: string[]; // Evidence IDs
}

/**
 * Detailed finding interface
 */
export interface DetailedFinding {
  id: string;
  category: string;
  title: string;
  description: string;
  evidence: string[]; // Evidence IDs
  confidence: ConfidenceLevel;
  impact: 'low' | 'medium' | 'high';
  source: string;
}

/**
 * Synthesis report interface
 */
export interface SynthesisReport {
  id: string;
  query: string;
  synopsis: string;
  summary: string[];
  findings: DetailedFinding[];
  codeReferences: CodeReference[];
  architectureInsights: ArchitectureInsight[];
  recommendations: Recommendation[];
  risks: Risk[];
  openQuestions: string[];
  confidence: ConfidenceLevel;
  agentsUsed: string[];
  executionTime: number;
  generatedAt: Date;
  metadata: {
    totalFiles: number;
    totalInsights: number;
    totalEvidence: number;
    scope: ResearchScope;
    depth: ResearchDepth;
  };
}

/**
 * Research progress interface
 */
export interface ResearchProgress {
  phase: ResearchPhase;
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  percentageComplete: number;
  estimatedTimeRemaining?: number;
  currentAgent?: string;
  agentsCompleted: string[];
  errors: string[];
}

/**
 * Research configuration interface
 */
export interface ResearchConfig {
  maxConcurrency: number;
  defaultTimeout: number;
  enableCaching: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  cacheExpiry: number; // milliseconds
  maxFileSize: number; // bytes
  maxResults: number;
  enableExternalSearch: boolean;
  externalSearchTimeout: number;
}

/**
 * Research event types
 */
export interface ResearchEvent {
  type: 'research_started' | 'phase_started' | 'phase_completed' | 'agent_started' | 
        'agent_completed' | 'agent_failed' | 'research_completed' | 'research_failed';
  timestamp: Date;
  data?: Record<string, any>;
  phase?: ResearchPhase;
  agent?: string;
}

/**
 * Discovery agent interface
 */
export interface DiscoveryAgent {
  discover(query: string, scope: ResearchScope, constraints?: ResearchConstraints): Promise<DiscoveryResult>;
}

/**
 * Analysis agent interface
 */
export interface AnalysisAgent {
  analyze(discoveryResults: DiscoveryResult[], context?: any): Promise<AnalysisResult>;
}

/**
 * Synthesis handler interface
 */
export interface SynthesisHandler {
  synthesize(query: ResearchQuery, analysisResults: AnalysisResult[]): Promise<SynthesisReport>;
}

/**
 * Research statistics interface
 */
export interface ResearchStatistics {
  totalQueries: number;
  averageExecutionTime: number;
  successRate: number;
  averageConfidence: number;
  mostCommonScopes: Record<ResearchScope, number>;
  mostCommonDepths: Record<ResearchDepth, number>;
  agentPerformance: Record<string, {
    executionCount: number;
    averageTime: number;
    successRate: number;
  }>;
}

/**
 * Research cache entry interface
 */
export interface ResearchCacheEntry {
  key: string;
  query: ResearchQuery;
  result: DiscoveryResult | AnalysisResult | SynthesisReport;
  timestamp: Date;
  expiry: Date;
  hits: number;
}

/**
 * Research error interface
 */
export interface ResearchError {
  id: string;
  phase: ResearchPhase;
  agent?: string;
  error: string;
  recoverable: boolean;
  suggestedAction?: string;
  timestamp: Date;
}

/**
 * Research validation result interface
 */
export interface ResearchValidationResult {
  valid: boolean;
  errors: ResearchValidationError[];
  warnings: ResearchValidationWarning[];
}

/**
 * Research validation error interface
 */
export interface ResearchValidationError {
  type: 'invalid_query' | 'invalid_scope' | 'invalid_depth' | 'invalid_constraints';
  message: string;
  field?: string;
}

/**
 * Research validation warning interface
 */
export interface ResearchValidationWarning {
  type: 'broad_query' | 'shallow_depth' | 'missing_constraints';
  message: string;
  suggestion?: string;
}

/**
 * Research metrics interface
 */
export interface ResearchMetrics {
  queryId: string;
  phaseMetrics: Record<ResearchPhase, {
    duration: number;
    agentCount: number;
    successCount: number;
    errorCount: number;
  }>;
  totalDuration: number;
  agentMetrics: Record<string, {
    duration: number;
    success: boolean;
    confidence: ConfidenceLevel;
  }>;
  qualityMetrics: {
    evidenceCount: number;
    insightCount: number;
    confidenceScore: number;
    completenessScore: number;
  };
}

/**
 * Research export formats
 */
export enum ResearchExportFormat {
  MARKDOWN = 'markdown',
  JSON = 'json',
  PDF = 'pdf',
  HTML = 'html'
}

/**
 * Research export options interface
 */
export interface ResearchExportOptions {
  format: ResearchExportFormat;
  includeEvidence: boolean;
  includeCodeReferences: boolean;
  includeMetadata: boolean;
  outputPath?: string;
  template?: string;
}