/**
 * Type definitions for the Ferg Engineering System execution engine.
 * Provides comprehensive type safety for plan parsing, task execution, and quality gates.
 */

export interface Plan {
  /** Plan metadata and configuration */
  metadata: PlanMetadata;
  /** Array of tasks to be executed */
  tasks: Task[];
  /** Quality gate configurations */
  qualityGates?: QualityGateConfig[];
}

export interface PlanMetadata {
  /** Unique plan identifier */
  id: string;
  /** Human-readable plan name */
  name: string;
  /** Plan description */
  description?: string;
  /** Plan version */
  version: string;
  /** Author information */
  author?: string;
  /** Creation timestamp */
  created?: string;
  /** Last modified timestamp */
  modified?: string;
  /** Plan tags */
  tags?: string[];
}

export interface Task {
  /** Unique task identifier */
  id: string;
  /** Human-readable task name */
  name: string;
  /** Task description */
  description?: string;
  /** Task type determines execution behavior */
  type: TaskType;
  /** Command to execute */
  command: string;
  /** Working directory for command execution */
  workingDirectory?: string;
  /** Environment variables for the task */
  environment?: Record<string, string>;
  /** Task dependencies that must complete first */
  dependsOn?: string[];
  /** Timeout in seconds */
  timeout?: number;
  /** Retry configuration */
  retry?: RetryConfig;
  /** Task status during execution */
  status?: TaskStatus;
  /** Execution results */
  result?: TaskResult;
}

export enum TaskType {
  /** Execute shell command */
  SHELL = 'shell',
  /** Run linting checks */
  LINT = 'lint',
  /** Type checking */
  TYPES = 'types',
  /** Run tests */
  TESTS = 'tests',
  /** Build project */
  BUILD = 'build',
  /** Integration tests */
  INTEGRATION = 'integration',
  /** Deployment */
  DEPLOY = 'deploy'
}

export enum TaskStatus {
  /** Task not yet started */
  PENDING = 'pending',
  /** Task currently running */
  RUNNING = 'running',
  /** Task completed successfully */
  COMPLETED = 'completed',
  /** Task failed */
  FAILED = 'failed',
  /** Task skipped due to dependency failure */
  SKIPPED = 'skipped'
}

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Delay between retries in seconds */
  delay: number;
  /** Backoff multiplier for exponential backoff */
  backoffMultiplier?: number;
}

export interface TaskResult {
  /** Task identifier */
  id: string;
  /** Task execution status */
  status: TaskStatus;
  /** Exit code from command execution */
  exitCode: number;
  /** Standard output */
  stdout: string;
  /** Standard error */
  stderr: string;
  /** Execution duration in milliseconds */
  duration: number;
  /** Start timestamp */
  startTime: Date;
  /** End timestamp */
  endTime: Date;
  /** Error message if failed */
  error?: string;
}

export interface QualityGateConfig {
  /** Quality gate identifier */
  id: string;
  /** Gate name */
  name: string;
  /** Gate description */
  description?: string;
  /** Gate type determines validation behavior */
  type: QualityGateType;
  /** Whether this gate is required */
  required: boolean;
  /** Gate-specific configuration */
  config?: Record<string, any>;
  /** Task ID associated with this gate */
  taskId?: string;
}

export enum QualityGateType {
  /** Code linting and formatting */
  LINT = 'lint',
  /** TypeScript compilation */
  TYPES = 'types',
  /** Unit test execution */
  TESTS = 'tests',
  /** Build process */
  BUILD = 'build',
  /** Integration testing */
  INTEGRATION = 'integration',
  /** Deployment validation */
  DEPLOY = 'deploy'
}

export interface QualityGateResult {
  /** Quality gate identifier */
  gateId: string;
  /** Gate execution status */
  status: TaskStatus;
  /** Pass/fail result */
  passed: boolean;
  /** Execution duration in milliseconds */
  duration: number;
  /** Result message */
  message: string;
  /** Detailed results */
  details?: any;
  /** Execution timestamp */
  timestamp: Date;
}

export interface ExecutionReport {
  /** Plan identifier */
  planId: string;
  /** Overall execution status */
  status: TaskStatus;
  /** Execution start time */
  startTime: Date;
  /** Execution end time */
  endTime: Date;
  /** Total execution duration in milliseconds */
  totalDuration: number;
  /** Task execution results */
  taskResults: TaskResult[];
  /** Quality gate results */
  qualityGateResults: QualityGateResult[];
  /** Summary statistics */
  summary: ExecutionSummary;
}

export interface ExecutionSummary {
  /** Total number of tasks */
  totalTasks: number;
  /** Number of completed tasks */
  completedTasks: number;
  /** Number of failed tasks */
  failedTasks: number;
  /** Number of skipped tasks */
  skippedTasks: number;
  /** Total number of quality gates */
  totalGates: number;
  /** Number of passed quality gates */
  passedGates: number;
  /** Number of failed quality gates */
  failedGates: number;
}

export interface ExecutionOptions {
  /** Enable dry run mode (no actual execution) */
  dryRun?: boolean;
  /** Continue execution on task failures */
  continueOnError?: boolean;
  /** Maximum concurrent tasks */
  maxConcurrency?: number;
  /** Verbose output */
  verbose?: boolean;
  /** Custom working directory */
  workingDirectory?: string;
  /** Custom environment variables */
  environment?: Record<string, string>;
}

export interface ValidationError {
  /** Error type */
  type: ValidationErrorType;
  /** Error message */
  message: string;
  /** Path to the problematic field */
  path?: string;
  /** Invalid value */
  value?: any;
}

export enum ValidationErrorType {
  /** Required field missing */
  REQUIRED = 'required',
  /** Invalid value type */
  TYPE = 'type',
  /** Value outside allowed range */
  RANGE = 'range',
  /** Invalid format */
  FORMAT = 'format',
  /** Circular dependency detected */
  CIRCULAR_DEPENDENCY = 'circular_dependency',
  /** Duplicate identifier */
  DUPLICATE_ID = 'duplicate_id',
  /** Unknown dependency */
  UNKNOWN_DEPENDENCY = 'unknown_dependency'
}