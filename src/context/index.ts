/**
 * Context Engineering System
 *
 * Main entry point for the context engineering implementation.
 * Provides session management, memory system, progressive disclosure,
 * and intelligent context retrieval.
 *
 * Based on:
 * - Google's Context Engineering research (Aakash Gupta)
 * - Claude Skills Progressive Disclosure Architecture (Rick Hightower)
 * - MBZUAI Principled Prompting research
 */

// Type exports
export type {
    Session,
    SessionWorkbench,
    SessionMetadata,
    Task,
    Decision,
    MemoryEntry,
    MemoryType,
    MemorySource,
    MemoryStore,
    SkillMetadata,
    SkillContent,
    LoadedSkill,
    SkillTier,
    ContextTrigger,
    AssembledContext,
    ContextConfig,
    CommandContextEnvelope,
    CommandExecutionStatus,
    ContextEvent,
    ContextEventHandler,
} from "./types";

export { DEFAULT_CONFIG, loadConfig, createCommandEnvelope } from "./types";

// Session Manager
export { SessionManager, getSessionManager } from "./session";

// Memory Manager
export { MemoryManager, getMemoryManager } from "./memory";

// Progressive Disclosure
export {
    ProgressiveSkillLoader,
    createSkillLoader,
    TIER_STRATEGIES,
} from "./progressive";

// Context Retrieval
export {
    ContextRetriever,
    createContextRetriever,
} from "./retrieval";

// Vector Search
export {
    VectorMemoryManager,
    VectorMath,
    TextTokenizer,
    ContextRanker,
    type VectorEmbedding,
    type VectorStore,
    type SearchResult,
} from "./vector";

// Exporters
export { MarkdownContextExporter, type ContextExporter } from "./exporters";

/**
 * Initialize the complete context engineering system
 */
export async function initializeContextSystem(
    config?: Partial<import("./types").ContextConfig>,
) {
    const { createContextRetriever } = await import("./retrieval");
    return createContextRetriever(config);
}

/**
 * Quick access to singleton managers
 */
export function getContextManagers(
    config?: Partial<import("./types").ContextConfig>,
) {
    const { getSessionManager } = require("./session");
    const { getMemoryManager } = require("./memory");

    return {
        session: getSessionManager(config),
        memory: getMemoryManager(config),
    };
}
