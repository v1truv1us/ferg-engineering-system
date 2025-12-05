/**
 * Agent orchestration types and interfaces for the Ferg Engineering System.
 * Defines the core abstractions for agent coordination and execution.
 */

/**
 * Represents different types of agents available in the system
 */
export enum AgentType {
  ARCHITECT_ADVISOR = 'architect-advisor',
  FRONTEND_REVIEWER = 'frontend-reviewer', 
  SEO_SPECIALIST = 'seo-specialist',
  PROMPT_OPTIMIZER = 'prompt-optimizer',
  CODE_REVIEWER = 'code-reviewer',
  BACKEND_ARCHITECT = 'backend-architect',
  SECURITY_SCANNER = 'security-scanner',
  PERFORMANCE_ENGINEER = 'performance-engineer'
}

/**
 * Execution strategies for agent coordination
 */
export enum ExecutionStrategy {
  PARALLEL = 'parallel',
  SEQUENTIAL = 'sequential',
  CONDITIONAL = 'conditional'
}

/**
 * Confidence level for agent results
 */
export enum ConfidenceLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  VERY_HIGH = 'very_high'
}

/**
 * Base interface for all agent inputs
 */
export interface AgentInput {
  type: AgentType;
  context: Record<string, any>;
  parameters?: Record<string, any>;
  timeout?: number;
}

/**
 * Base interface for all agent outputs
 */
export interface AgentOutput {
  type: AgentType;
  success: boolean;
  result: Record<string, any>;
  confidence: ConfidenceLevel;
  reasoning?: string;
  executionTime: number;
  error?: string;
}

/**
 * Represents a single agent task in an execution plan
 */
export interface AgentTask {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  input: AgentInput;
  strategy: ExecutionStrategy;
  dependsOn?: string[];
  timeout?: number;
  retry?: {
    maxAttempts: number;
    delay: number;
    backoffMultiplier: number;
  };
}

/**
 * Result of executing an agent task
 */
export interface AgentTaskResult {
  id: string;
  type: AgentType;
  status: AgentTaskStatus;
  output?: AgentOutput;
  executionTime: number;
  startTime: Date;
  endTime: Date;
  error?: string;
}

/**
 * Status of an agent task
 */
export enum AgentTaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TIMEOUT = 'timeout',
  SKIPPED = 'skipped'
}

/**
 * Configuration for agent coordination
 */
export interface AgentCoordinatorConfig {
  maxConcurrency: number;
  defaultTimeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCaching: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Result aggregation strategy
 */
export interface AggregationStrategy {
  type: 'merge' | 'vote' | 'weighted' | 'priority';
  weights?: Record<AgentType, number>;
  priority?: AgentType[];
  conflictResolution?: 'highest_confidence' | 'most_recent' | 'manual';
}

/**
 * Plan generation specific types
 */
export interface PlanGenerationInput {
  description: string;
  scope?: string;
  requirements?: string[];
  constraints?: string[];
  context?: Record<string, any>;
}

export interface PlanGenerationOutput {
  plan: {
    name: string;
    description: string;
    tasks: AgentTask[];
    dependencies: string[][];
  };
  confidence: ConfidenceLevel;
  reasoning: string;
  suggestions: string[];
}

/**
 * Code review specific types
 */
export interface CodeReviewInput {
  files: string[];
  reviewType: 'full' | 'incremental' | 'security' | 'performance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface CodeReviewFinding {
  file: string;
  line: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  message: string;
  suggestion?: string;
  confidence: ConfidenceLevel;
}

export interface CodeReviewOutput {
  findings: CodeReviewFinding[];
  summary: {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  };
  recommendations: string[];
  overallScore: number; // 0-100
}

/**
 * Agent execution context
 */
export interface AgentExecutionContext {
  planId: string;
  taskId: string;
  workingDirectory: string;
  environment: Record<string, string>;
  metadata: Record<string, any>;
}

/**
 * Event types for agent coordination
 */
export interface AgentEvent {
  type: 'task_started' | 'task_completed' | 'task_failed' | 'task_timeout' | 'aggregation_started' | 'aggregation_completed';
  taskId: string;
  agentType: AgentType;
  timestamp: Date;
  data?: Record<string, any>;
}

/**
 * Progress tracking for agent orchestration
 */
export interface AgentProgress {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  runningTasks: number;
  currentTask?: string;
  estimatedTimeRemaining?: number;
  percentageComplete: number;
}

/**
 * Error handling types
 */
export interface AgentError {
  taskId: string;
  agentType: AgentType;
  error: string;
  recoverable: boolean;
  suggestedAction?: string;
  timestamp: Date;
}

/**
 * Performance metrics for agent execution
 */
export interface AgentMetrics {
  agentType: AgentType;
  executionCount: number;
  averageExecutionTime: number;
  successRate: number;
  averageConfidence: number;
  lastExecutionTime: Date;
}