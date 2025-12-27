/**
 * Agent orchestration types and interfaces for the Ferg Engineering System.
 * Defines the core abstractions for agent coordination and execution.
 */

/**
 * Represents different types of agents available in the system
 */
export enum AgentType {
    // Architecture & Planning
    ARCHITECT_ADVISOR = "architect-advisor",
    BACKEND_ARCHITECT = "backend-architect",
    INFRASTRUCTURE_BUILDER = "infrastructure-builder",

    // Development & Coding
    FRONTEND_REVIEWER = "frontend-reviewer",
    FULL_STACK_DEVELOPER = "full-stack-developer",
    API_BUILDER_ENHANCED = "api-builder-enhanced",
    DATABASE_OPTIMIZER = "database-optimizer",
    JAVA_PRO = "java-pro",

    // Quality & Testing
    CODE_REVIEWER = "code-reviewer",
    TEST_GENERATOR = "test-generator",
    SECURITY_SCANNER = "security-scanner",
    PERFORMANCE_ENGINEER = "performance-engineer",

    // DevOps & Deployment
    DEPLOYMENT_ENGINEER = "deployment-engineer",
    MONITORING_EXPERT = "monitoring-expert",
    COST_OPTIMIZER = "cost-optimizer",

    // AI & Machine Learning
    AI_ENGINEER = "ai-engineer",
    ML_ENGINEER = "ml-engineer",

    // Content & SEO
    SEO_SPECIALIST = "seo-specialist",
    PROMPT_OPTIMIZER = "prompt-optimizer",

    // Plugin Development
    AGENT_CREATOR = "agent-creator",
    COMMAND_CREATOR = "command-creator",
    SKILL_CREATOR = "skill-creator",
    TOOL_CREATOR = "tool-creator",
    PLUGIN_VALIDATOR = "plugin-validator",
}

/**
 * Execution strategies for agent coordination
 */
export enum ExecutionStrategy {
    PARALLEL = "parallel",
    SEQUENTIAL = "sequential",
    CONDITIONAL = "conditional",
}

/**
 * Confidence level for agent results
 */
export enum ConfidenceLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high",
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
    /** Optional command for compatibility with Task interface */
    command?: string;
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
    PENDING = "pending",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    TIMEOUT = "timeout",
    SKIPPED = "skipped",
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
    logLevel: "debug" | "info" | "warn" | "error";
}

/**
 * Result aggregation strategy
 */
export interface AggregationStrategy {
    type:
        | "merge"
        | "vote"
        | "weighted"
        | "priority"
        | "parallel"
        | "sequential";
    weights?: Partial<Record<AgentType, number>>;
    priority?: AgentType[];
    conflictResolution?: "highest_confidence" | "most_recent" | "manual";
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
    reviewType: "full" | "incremental" | "security" | "performance";
    severity: "low" | "medium" | "high" | "critical";
    context?: Record<string, any>;
}

export interface CodeReviewFinding {
    file: string;
    line: number;
    severity: "low" | "medium" | "high" | "critical";
    category: string;
    message: string;
    suggestion?: string;
    confidence: ConfidenceLevel;
    agent?: string;
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
    type:
        | "task_started"
        | "task_completed"
        | "task_failed"
        | "task_timeout"
        | "aggregation_started"
        | "aggregation_completed";
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

/**
 * Agent definition loaded from .claude-plugin/agents/
 */
export interface AgentDefinition {
    type: AgentType;
    name: string;
    description: string;
    mode: "subagent" | "tool";
    temperature: number;
    capabilities: string[];
    handoffs: AgentType[];
    tags: string[];
    category: string;
    tools: {
        read: boolean;
        grep: boolean;
        glob: boolean;
        list: boolean;
        bash: boolean;
        edit: boolean;
        write: boolean;
        patch: boolean;
    };
    promptPath: string;
    prompt: string;
}

/**
 * Agent execution record for persistence
 */
export interface AgentExecution {
    taskId: string;
    agentType: AgentType;
    input?: Record<string, any>;
    output?: Record<string, any>;
    success: boolean;
    confidence?: ConfidenceLevel;
    executionTime: number;
    timestamp: Date;
    error?: string;
}

/**
 * Improvement record for self-improvement system
 */
export interface ImprovementRecord {
    id: string;
    type: "agent_prompt" | "capability" | "handoff" | "workflow";
    target: AgentType | string;
    description: string;
    evidence: string[];
    suggestedAt: Date;
    implementedAt?: Date;
    effectivenessScore?: number;
}

/**
 * Handoff record for inter-agent communication
 */
export interface HandoffRecord {
    id: string;
    fromAgent: AgentType;
    toAgent: AgentType;
    reason: string;
    context?: Record<string, any>;
    success: boolean;
    timestamp: Date;
}

/**
 * Execution mode for hybrid Task tool + local execution
 */
export type ExecutionMode = "task-tool" | "local" | "hybrid";

/**
 * Routing decision for capability-based agent selection
 */
export interface RoutingDecision {
    primaryAgent: AgentType;
    supportingAgents: AgentType[];
    executionStrategy: "parallel" | "sequential" | "conditional";
    executionMode: ExecutionMode;
    handoffPlan: HandoffPlan[];
}

/**
 * Handoff plan for inter-agent delegation
 */
export interface HandoffPlan {
    fromAgent: AgentType;
    toAgent: AgentType;
    condition: string;
    contextTransfer: string[];
}

/**
 * Review result from quality feedback loop
 */
export interface ReviewResult {
    approved: boolean;
    feedback: string;
    suggestedImprovements: string[];
    confidence: ConfidenceLevel;
}

/**
 * Memory entry for context envelope
 */
export interface MemoryEntry {
    id: string;
    type: "declarative" | "procedural" | "episodic";
    content: string;
    provenance: {
        source: "user" | "agent" | "inferred";
        timestamp: string;
        confidence: number;
        context: string;
        sessionId?: string;
    };
    tags: string[];
    lastAccessed: string;
    accessCount: number;
}

/**
 * Context envelope for passing state between agents
 */
export interface ContextEnvelope {
    // Session state
    session: {
        id: string;
        parentID?: string; // Parent session ID for nested subagent calls
        activeFiles: string[];
        pendingTasks: any[]; // Task objects from context/types
        decisions: any[]; // Decision objects from context/types
    };

    // Relevant memories
    memories: {
        declarative: MemoryEntry[]; // Facts, patterns
        procedural: MemoryEntry[]; // Workflows, procedures
        episodic: MemoryEntry[]; // Past events
    };

    // Previous agent results (for handoffs)
    previousResults: {
        agentType: AgentType | string;
        output: any;
        confidence: ConfidenceLevel | string;
    }[];

    // Task-specific context
    taskContext: Record<string, any>;

    // Metadata
    meta: {
        requestId: string;
        timestamp: Date;
        depth: number; // How many handoffs deep
        mergedFrom?: number; // Number of envelopes merged
        mergeStrategy?: string; // Strategy used for merging
    };
}

/**
 * Local operation for file-based tasks
 */
export interface LocalOperation {
    operation: "glob" | "grep" | "read" | "stat";
    pattern?: string;
    include?: string;
    cwd?: string;
    options?: Record<string, any>;
}

/**
 * Result of local operation execution
 */
export interface LocalResult {
    success: boolean;
    data?: any;
    error?: string;
    executionTime: number;
}
