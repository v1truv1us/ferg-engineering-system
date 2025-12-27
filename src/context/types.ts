/**
 * Context Engineering Type Definitions
 *
 * Core types for session management, memory system, and progressive disclosure.
 * Based on research from Google's Context Engineering and Claude Skills patterns.
 */

// ============================================================================
// Session Types
// ============================================================================

export interface Session {
    id: string;
    parentID?: string; // Parent session ID for nested subagent calls
    createdAt: string; // ISO date string
    lastActive: string; // ISO date string
    workbench: SessionWorkbench;
    metadata: SessionMetadata;
}

export interface SessionWorkbench {
    /** Currently active/open files in the session */
    activeFiles: string[];
    /** Pending tasks tracked in this session */
    pendingTasks: Task[];
    /** Architectural/design decisions made */
    decisions: Decision[];
    /** Arbitrary context data */
    context: Record<string, unknown>;
}

export interface SessionMetadata {
    /** Project name or path */
    project: string;
    /** Git branch if applicable */
    branch?: string;
    /** Current working mode */
    mode?: "plan" | "build" | "review";
    /** Platform being used */
    platform?: "claude-code" | "opencode";
}

export interface Task {
    id: string;
    content: string;
    status: "pending" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high";
    createdAt: string;
    completedAt?: string;
}

export interface Decision {
    id: string;
    title: string;
    description: string;
    rationale: string;
    alternatives?: string[];
    createdAt: string;
    tags: string[];
}

// ============================================================================
// Memory Types
// ============================================================================

export type MemoryType = "declarative" | "procedural" | "episodic";
export type MemorySource = "user" | "agent" | "inferred";

export interface MemoryEntry {
    id: string;
    type: MemoryType;
    content: string;
    provenance: MemoryProvenance;
    tags: string[];
    lastAccessed: string;
    accessCount: number;
}

export interface MemoryProvenance {
    /** Where this memory came from */
    source: MemorySource;
    /** When this was recorded */
    timestamp: string;
    /** Confidence level 0-1 (decays over time for inferred) */
    confidence: number;
    /** Context in which this was learned */
    context: string;
    /** Related session ID if applicable */
    sessionId?: string;
}

export interface MemoryStore {
    /** Facts, patterns, preferences */
    declarative: MemoryEntry[];
    /** Workflows, procedures, habits */
    procedural: MemoryEntry[];
    /** Conversation summaries, past events */
    episodic: MemoryEntry[];
}

// ============================================================================
// Progressive Disclosure Types
// ============================================================================

export type SkillTier = 1 | 2 | 3;

export interface SkillMetadata {
    name: string;
    description: string;
    tier: SkillTier;
    capabilities: string[];
    path: string;
}

export interface SkillContent {
    metadata: SkillMetadata;
    /** Tier 1: Always loaded overview */
    overview: string;
    /** Tier 2: Loaded on activation */
    instructions?: string;
    /** Tier 3: Loaded on specific need */
    resources?: string;
}

export interface LoadedSkill {
    metadata: SkillMetadata;
    loadedTiers: SkillTier[];
    content: string;
    tokenEstimate: number;
}

// ============================================================================
// Context Retrieval Types
// ============================================================================

export type RetrievalPattern = "push" | "pull" | "hybrid";

export interface ContextTrigger {
    type:
        | "session_start"
        | "file_open"
        | "command"
        | "query"
        | "task"
        | "conversation_turn"
        | "file_edit";
    pattern: RetrievalPattern;
    data: Record<string, unknown>;
}

export interface AssembledContext {
    /** Session state */
    session?: Session;
    /** Relevant memories */
    memories: MemoryEntry[];
    /** Loaded skills */
    skills: LoadedSkill[];
    /** Total token estimate */
    tokenEstimate: number;
    /** Assembly metadata */
    meta: {
        assembledAt: string;
        triggers: string[];
        duration: number;
    };
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface ContextExportConfig {
    /** Enable exporting human-readable command envelopes. */
    enabled?: boolean;
    /** Markdown export settings */
    markdown?: {
        /** Output directory for markdown exports */
        outputDir?: string;
    };
}

export interface ContextConfig {
    /** Path to context storage directory */
    storagePath: string;
    /** Maximum memories to keep per type */
    maxMemoriesPerType: number;
    /** Days before archiving old sessions */
    sessionArchiveDays: number;
    /** Confidence decay rate for inferred memories (per day) */
    confidenceDecayRate: number;
    /** Enable vector embeddings (requires external API) */
    enableEmbeddings: boolean;
    /** Default skill tier to load */
    defaultSkillTier: SkillTier;
    /** Enable automatic context inference from conversations and actions */
    enableAutoInference: boolean;
    /** Optional human-readable exports */
    export?: ContextExportConfig;
}

export const DEFAULT_CONFIG: ContextConfig = {
    storagePath: ".ai-context",
    maxMemoriesPerType: 100,
    sessionArchiveDays: 30,
    confidenceDecayRate: 0.05,
    enableEmbeddings: false,
    defaultSkillTier: 1,
    enableAutoInference: true, // Enable automatic inference by default
    export: {
        enabled: false,
        markdown: {
            outputDir: ".ai-context/exports",
        },
    },
};

/**
 * Load configuration from .ai-context/config.json if it exists
 */
function mergeContextConfig(
    base: ContextConfig,
    overrides?: Partial<ContextConfig>,
): ContextConfig {
    const merged: ContextConfig = {
        ...base,
        ...overrides,
        export: {
            ...base.export,
            ...overrides?.export,
            markdown: {
                ...base.export?.markdown,
                ...overrides?.export?.markdown,
            },
        },
    };

    return merged;
}

export async function loadConfig(
    customConfig?: Partial<ContextConfig>,
): Promise<ContextConfig> {
    // Merge defaults + passed config first (so storagePath can influence where config.json is).
    const baseConfig = mergeContextConfig(DEFAULT_CONFIG, customConfig);

    try {
        // Try to load project-specific config
        const { readFile } = await import("node:fs/promises");
        const { existsSync } = await import("node:fs");
        const { join } = await import("node:path");

        const configPath = join(baseConfig.storagePath, "config.json");
        if (existsSync(configPath)) {
            const configContent = await readFile(configPath, "utf-8");
            const projectConfig = JSON.parse(
                configContent,
            ) as Partial<ContextConfig>;
            return mergeContextConfig(baseConfig, projectConfig);
        }
    } catch (error) {
        // Ignore config loading errors, use defaults
        const silent =
            process.env.AI_ENG_SILENT === "1" ||
            process.env.AI_ENG_SILENT === "true" ||
            process.env.NODE_ENV === "test" ||
            process.env.BUN_TEST === "1" ||
            process.env.BUN_TEST === "true";

        if (!silent) {
            console.warn(
                "Could not load context config, using defaults:",
                error,
            );
        }
    }

    return baseConfig;
}

// ============================================================================
// Command Envelope Types
// ============================================================================

export type CommandExecutionStatus = "success" | "failure";

export interface CommandContextEnvelope {
    /** Unique id for this envelope */
    id: string;
    /** ISO timestamp */
    createdAt: string;
    /** CLI command name (e.g. 'plan', 'research') */
    commandName: string;
    /** Success/failure */
    status: CommandExecutionStatus;
    /** Duration in milliseconds */
    durationMs: number;

    /** Best-effort inputs/options/args summary */
    inputs?: Record<string, unknown>;

    /** Human-readable short summary of what happened */
    outputSummary?: string;

    /** Best-effort list of files the command wrote/modified (may be empty) */
    filesTouched?: string[];

    /** Decisions captured during execution */
    decisions?: string[];

    /** Tags for retrieval */
    tags: string[];

    /** Optional session identifier */
    sessionId?: string;

    /** Optional project identifier (path/repo name) */
    project?: string;

    /** Error details (only when status === 'failure') */
    error?: {
        message: string;
        name?: string;
        stack?: string;
    };
}

export function createCommandEnvelope(input: {
    commandName: string;
    status: CommandExecutionStatus;
    startTimeMs: number;
    endTimeMs: number;
    inputs?: Record<string, unknown>;
    outputSummary?: string;
    filesTouched?: string[];
    decisions?: string[];
    tags?: string[];
    sessionId?: string;
    project?: string;
    error?: unknown;
}): CommandContextEnvelope {
    const createdAt = new Date().toISOString();
    const id = `env_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;

    let errorPayload: CommandContextEnvelope["error"];
    if (input.error instanceof Error) {
        errorPayload = {
            message: input.error.message,
            name: input.error.name,
            stack: input.error.stack,
        };
    } else if (input.error) {
        errorPayload = {
            message: String(input.error),
        };
    }

    return {
        id,
        createdAt,
        commandName: input.commandName,
        status: input.status,
        durationMs: Math.max(0, input.endTimeMs - input.startTimeMs),
        inputs: input.inputs,
        outputSummary: input.outputSummary,
        filesTouched: input.filesTouched || [],
        decisions: input.decisions || [],
        tags: Array.from(
            new Set([
                "command-envelope",
                `command:${input.commandName}`,
                ...(input.tags || []),
            ]),
        ),
        sessionId: input.sessionId,
        project: input.project,
        error: input.status === "failure" ? errorPayload : undefined,
    };
}

// ============================================================================
// Event Types
// ============================================================================

export type ContextEvent =
    | { type: "session_created"; session: Session }
    | { type: "session_restored"; session: Session }
    | { type: "session_updated"; session: Session }
    | { type: "memory_added"; entry: MemoryEntry }
    | { type: "memory_accessed"; entry: MemoryEntry }
    | { type: "skill_loaded"; skill: LoadedSkill }
    | { type: "context_assembled"; context: AssembledContext };

export type ContextEventHandler = (event: ContextEvent) => void | Promise<void>;
