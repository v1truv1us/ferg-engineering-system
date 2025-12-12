/**
 * Context Retrieval Engine
 * 
 * Intelligent context assembly with push/pull patterns.
 * Combines session state, memories, and skills into optimized context.
 */

import type {
  ContextTrigger,
  AssembledContext,
  MemoryEntry,
  ContextConfig,
  DEFAULT_CONFIG
} from "./types"
import { SessionManager } from "./session"
import { MemoryManager } from "./memory"
import { ProgressiveSkillLoader } from "./progressive"
import { VectorMemoryManager, VectorMath, ContextRanker } from "./vector"

export class ContextRetriever {
  private config: ContextConfig
  private sessionManager: SessionManager
  private memoryManager: MemoryManager
  private skillLoader: ProgressiveSkillLoader
  private vectorManager: VectorMemoryManager
  private contextCache: Map<string, { context: AssembledContext; expires: number }> = new Map()

  /**
   * Initialize vector manager
   */
  async initializeVectorManager(): Promise<void> {
    await this.vectorManager.initialize()
  }

  constructor(
    sessionManager: SessionManager,
    memoryManager: MemoryManager,
    skillLoader: ProgressiveSkillLoader,
    config: Partial<ContextConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.sessionManager = sessionManager
    this.memoryManager = memoryManager
    this.skillLoader = skillLoader
    this.vectorManager = new VectorMemoryManager(config)
  }

  /**
   * Infer context from user queries automatically
   */
  private async inferContextFromQuery(query: string): Promise<void> {
    if (!this.config.enableAutoInference) return

    // Extract preferences from questions like "should I use X or Y?"
    const preferencePatterns = [
      /(?:should I|do you recommend|what about) ([\w\s]+) (?:or|vs|versus) ([\w\s]+)\?/i,
      /I (?:prefer|like|want to use) ([\w\s]+)/i,
      /(?:never|always|usually) ([\w\s]+)/i
    ]

    for (const pattern of preferencePatterns) {
      const match = query.match(pattern)
      if (match) {
        const preference = match[1] || match[0]
        await this.memoryManager.addMemory("declarative",
          `User preference: ${preference}`,
          {
            source: "inferred",
            context: `Inferred from query: "${query}"`,
            tags: ["preference", "inferred"]
          }
        )
        break
      }
    }
  }

  /**
   * Infer context from conversation patterns
   */
  private async inferContextFromConversation(message: string, response: string): Promise<void> {
    if (!this.config.enableAutoInference) return

    // Extract technical decisions
    const decisionPatterns = [
      /(?:we decided|let's use|we're going with|chosen) ([\w\s]+(?:framework|library|tool|approach|pattern))/i,
      /(?:implementing|building|creating) ([\w\s]+) using ([\w\s]+)/i
    ]

    for (const pattern of decisionPatterns) {
      const match = message.match(pattern) || response.match(pattern)
      if (match) {
        const technology = match[1]
        await this.memoryManager.addMemory("procedural",
          `Using ${technology} for implementation`,
          {
            source: "inferred",
            context: `Conversation context: "${message.substring(0, 100)}..."`,
            tags: ["technology", "decision", "inferred"]
          }
        )
        break
      }
    }

    // Extract problem-solving patterns
    if (message.includes("error") || message.includes("bug") || message.includes("issue")) {
      await this.memoryManager.addMemory("episodic",
        `Encountered issue: ${message.substring(0, 200)}...`,
        {
          source: "inferred",
          context: "Problem-solving conversation",
          tags: ["debugging", "issue", "inferred"]
        }
      )
    }
  }

  /**
   * Infer context from code changes
   */
  private async inferContextFromCode(filePath: string, changes: string): Promise<void> {
    if (!this.config.enableAutoInference) return

    // Extract framework/library usage patterns
    const frameworkPatterns = {
      "react": /import.*from ['"]react['"]/i,
      "vue": /import.*from ['"]vue['"]/i,
      "angular": /import.*from ['"]@angular['"]/i,
      "express": /const.*=.*require\(['"]express['"]\)/i,
      "fastify": /const.*=.*require\(['"]fastify['"]\)/i,
      "typescript": /interface|type.*=.*\{/
    }

    for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
      if (pattern.test(changes)) {
        await this.memoryManager.addMemory("declarative",
          `Project uses ${framework}`,
          {
            source: "inferred",
            context: `Detected in ${filePath}`,
            tags: ["framework", "technology", "inferred"]
          }
        )
      }
    }

    // Extract architectural patterns
    if (changes.includes("middleware") || changes.includes("router")) {
      await this.memoryManager.addMemory("procedural",
        "Using middleware/router pattern",
        {
          source: "inferred",
          context: `Code pattern in ${filePath}`,
          tags: ["architecture", "pattern", "inferred"]
        }
      )
    }
  }

  /**
   * Assemble context based on triggers
   */
  async assemble(triggers: ContextTrigger[]): Promise<AssembledContext> {
    const startTime = Date.now()
    const memories: MemoryEntry[] = []
    const skills = []
    let tokenEstimate = 0

    // Process each trigger
    for (const trigger of triggers) {
      switch (trigger.type) {
        case "session_start":
          // Load session context
          break

        case "file_open":
          // Load relevant memories for file
          const filePath = trigger.data.path as string
          
          // Use semantic search for file-related memories
          const fileMemories = await this.vectorManager.semanticSearch(filePath, {
            limit: 5,
            minScore: 0.3,
            memoryType: "procedural"
          })
          
          // Also do traditional search
          const traditionalMemories = this.memoryManager.searchMemories(filePath, {
            minConfidence: 0.6
          })
          
          memories.push(...fileMemories, ...traditionalMemories)
          break

        case "command":
          // Load memories related to command
          const command = trigger.data.command as string
          
// Semantic search for command-related memories
          const semanticMemories = await this.vectorManager.semanticSearch(command, {
            limit: 3,
            minScore: 0.4,
            memoryType: "procedural"
          })
          
          // Traditional search
          const commandMemories = this.memoryManager.searchMemories(command, {
            minConfidence: 0.5
          })
          
          memories.push(...semanticMemories, ...commandMemories)
          break

        case "query":
          // Search memories for query with enhanced ranking
          const query = trigger.data.query as string

          // Auto-infer context from query patterns
          await this.inferContextFromQuery(query)
          break

        case "conversation_turn":
          // Analyze conversation for implicit context
          const message = trigger.data.message as string
          const response = trigger.data.response as string

          await this.inferContextFromConversation(message, response)
          break

        case "file_edit":
          // Learn from code patterns and changes
          const filePath = trigger.data.filePath as string
          const changes = trigger.data.changes as string

          await this.inferContextFromCode(filePath, changes)
          
          // Get all memories for ranking
          const allMemories = this.memoryManager.getAllMemories()
          const context = {
            query,
            activeFiles: this.sessionManager.getActiveFiles(),
            currentTask: this.sessionManager.getContext<string>("currentTask"),
            sessionType: this.sessionManager.getSession()?.metadata.mode
          }
          
          // Rank memories by relevance
          const rankedMemories = ContextRanker.rankByRelevance(allMemories, context)
          memories.push(...rankedMemories.slice(0, 10))
          break

        case "task":
          // Load memories related to task type
          const taskType = trigger.data.taskType as string
          const taskMemories = this.memoryManager.searchMemories(taskType, {
            tags: ["task"],
            minConfidence: 0.5
          })
          memories.push(...taskMemories)
          break
      }
    }

    // Deduplicate memories
    const uniqueMemories = Array.from(
      new Map(memories.map(m => [m.id, m])).values()
    )

    // Calculate token estimate
    for (const memory of uniqueMemories) {
      tokenEstimate += Math.ceil(memory.content.length / 4)
    }

    const duration = Date.now() - startTime

    return {
      session: this.sessionManager.getSession() || undefined,
      memories: uniqueMemories,
      skills,
      tokenEstimate,
      meta: {
        assembledAt: new Date().toISOString(),
        triggers: triggers.map(t => t.type),
        duration
      }
    }
  }
    }

    // Deduplicate memories
    const uniqueMemories = Array.from(
      new Map(memories.map(m => [m.id, m])).values()
    )

    // Calculate token estimate
    for (const memory of uniqueMemories) {
      tokenEstimate += Math.ceil(memory.content.length / 4)
    }

    const duration = Date.now() - startTime

    return {
      session: this.sessionManager.getSession() || undefined,
      memories: uniqueMemories,
      skills,
      tokenEstimate,
      meta: {
        assembledAt: new Date().toISOString(),
        triggers: triggers.map(t => t.type),
        duration
      }
    }
  }

  /**
   * Push context: proactively load context on events
   */
  async pushContext(event: string, data?: Record<string, unknown>): Promise<AssembledContext> {
    const triggers: ContextTrigger[] = []

    switch (event) {
      case "session_start":
        triggers.push({
          type: "session_start",
          pattern: "push",
          data: data || {}
        })
        break

      case "file_open":
        triggers.push({
          type: "file_open",
          pattern: "push",
          data: data || {}
        })
        break

      case "command_run":
        triggers.push({
          type: "command",
          pattern: "push",
          data: data || {}
        })
        break
    }

    const cacheKey = this.generateCacheKey(triggers)
    const cached = await this.getCachedContext(cacheKey)
    
    if (cached) {
      return cached
    }

    const context = await this.assemble(triggers)
    this.cacheContext(cacheKey, context)
    
    return context
  }

  /**
   * Pull context: on-demand retrieval
   */
  async pullContext(query: string): Promise<AssembledContext> {
    const triggers: ContextTrigger[] = [
      {
        type: "query",
        pattern: "pull",
        data: { query }
      }
    ]

    const cacheKey = this.generateCacheKey(triggers)
    const cached = await this.getCachedContext(cacheKey)
    
    if (cached) {
      return cached
    }

    const context = await this.assemble(triggers)
    this.cacheContext(cacheKey, context)
    
    return context
  }

  /**
   * Get context summary for inclusion in prompts
   */
  async getContextSummary(maxMemories: number = 5): Promise<string> {
    const session = this.sessionManager.getSession()
    const memories = this.memoryManager.getAllMemories().slice(0, maxMemories)

    const lines = [
      "## Context Summary",
      ""
    ]

    if (Session) {
      lines.push("### Session")
      lines.push(this.sessionManager.getSessionSummary())
      lines.push("")
    }

    if (memories.length > 0) {
      lines.push("### Relevant Memories")
      for (const mem of memories) {
        lines.push(`- [${mem.type}] ${mem.content.substring(0, 100)}...`)
      }
      lines.push("")
    }

    lines.push("### Memory Statistics")
    lines.push(this.memoryManager.getSummary(3))

    return lines.join("\n")
  }

  /**
   * Get cached context or create new one
   */
  private async getCachedContext(
    cacheKey: string,
    ttlMs: number = 300000 // 5 minutes
  ): Promise<AssembledContext | null> {
    const cached = this.contextCache.get(cacheKey)
    
    if (cached && Date.now() < cached.expires) {
      // Update access time for memories
      for (const memory of cached.context.memories) {
        await this.memoryManager.accessMemory(memory.id)
      }
      
      return cached.context
    }

    return null
  }

  /**
   * Cache context with TTL
   */
  private cacheContext(
    cacheKey: string,
    context: AssembledContext,
    ttlMs: number = 300000 // 5 minutes
  ): void {
    this.contextCache.set(cacheKey, {
      context,
      expires: Date.now() + ttlMs
    })
  }

  /**
   * Generate cache key from triggers
   */
  private generateCacheKey(triggers: ContextTrigger[]): string {
    const sorted = [...triggers].sort((a, b) => a.type.localeCompare(b.type))
    return JSON.stringify(sorted.map(t => ({
      type: t.type,
      data: t.data
    })))
  }

  /**
   * Estimate context size
   */
  estimateContextSize(context: AssembledContext): {
    sessions: number
    memories: number
    skills: number
    total: number
  } {
    return {
      sessions: context.session ? 500 : 0,
      memories: context.memories.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0),
      skills: context.skills.reduce((sum, s) => sum + s.tokenEstimate, 0),
      total: context.tokenEstimate
    }
  }
}

/**
 * Create a context retriever with all managers initialized
 */
export async function createContextRetriever(
  config?: Partial<ContextConfig>
): Promise<ContextRetriever> {
  // Load configuration (merges defaults + project config + passed config)
  const { loadConfig } = await import("./types")
  const finalConfig = await loadConfig(config)

  const sessionManager = new SessionManager(finalConfig)
  const memoryManager = new MemoryManager(finalConfig)
  const skillLoader = new ProgressiveSkillLoader(finalConfig.storagePath)

  await sessionManager.initialize()
  await memoryManager.initialize()

  const retriever = new ContextRetriever(sessionManager, memoryManager, skillLoader, finalConfig)

  // Initialize vector manager
  await retriever.initializeVectorManager()

  return retriever
}
