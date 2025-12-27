/**
 * Memory System
 *
 * Implements declarative, procedural, and episodic memory with provenance tracking.
 * Memories persist across sessions and include confidence scores that decay over time.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
    CommandContextEnvelope,
    ContextConfig,
    MemoryEntry,
    MemorySource,
    MemoryStore,
    MemoryType,
} from "./types";
import { DEFAULT_CONFIG } from "./types";

export class MemoryManager {
    private config: ContextConfig;
    private memoryDir: string;
    private store: MemoryStore = {
        declarative: [],
        procedural: [],
        episodic: [],
    };

    constructor(config: Partial<ContextConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.memoryDir = join(this.config.storagePath, "memory");
    }

    /**
     * Initialize the memory manager and load existing memories
     */
    async initialize(): Promise<void> {
        await mkdir(this.memoryDir, { recursive: true });
        await this.loadMemories();
    }

    /**
     * Load all memories from disk
     */
    private async loadMemories(): Promise<void> {
        const types: MemoryType[] = ["declarative", "procedural", "episodic"];

        for (const type of types) {
            const path = join(this.memoryDir, `${type}.json`);
            if (existsSync(path)) {
                try {
                    const content = await readFile(path, "utf-8");
                    this.store[type] = JSON.parse(content) as MemoryEntry[];
                    // Apply confidence decay
                    this.store[type] = this.store[type].map((entry) =>
                        this.applyConfidenceDecay(entry),
                    );
                } catch (error) {
                    console.error(`Failed to load ${type} memories:`, error);
                }
            }
        }
    }

    /**
     * Save all memories to disk
     */
    private async saveMemories(): Promise<void> {
        const types: MemoryType[] = ["declarative", "procedural", "episodic"];

        for (const type of types) {
            const path = join(this.memoryDir, `${type}.json`);
            await writeFile(path, JSON.stringify(this.store[type], null, 2));
        }
    }

    /**
     * Add a memory entry
     */
    async addMemory(
        type: MemoryType,
        content: string,
        options?: {
            source?: MemorySource;
            context?: string;
            sessionId?: string;
            tags?: string[];
            confidence?: number;
        },
    ): Promise<MemoryEntry> {
        const now = new Date().toISOString();
        const entry: MemoryEntry = {
            id: `mem_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
            type,
            content,
            provenance: {
                source: options?.source || "user",
                timestamp: now,
                confidence:
                    options?.confidence ??
                    (options?.source === "inferred" ? 0.7 : 1.0),
                context: options?.context || "",
                sessionId: options?.sessionId,
            },
            tags: options?.tags || [],
            lastAccessed: now,
            accessCount: 0,
        };

        this.store[type].push(entry);

        // Enforce max memories per type
        if (this.store[type].length > this.config.maxMemoriesPerType) {
            // Remove oldest, least accessed entries
            this.store[type].sort((a, b) => {
                const scoreA =
                    a.accessCount /
                    (Date.now() - new Date(a.lastAccessed).getTime());
                const scoreB =
                    b.accessCount /
                    (Date.now() - new Date(b.lastAccessed).getTime());
                return scoreA - scoreB;
            });
            this.store[type] = this.store[type].slice(
                -this.config.maxMemoriesPerType,
            );
        }

        await this.saveMemories();
        return entry;
    }

    /**
     * Update a memory entry
     */
    async updateMemory(
        id: string,
        updates: Partial<Omit<MemoryEntry, "id" | "provenance">>,
    ): Promise<MemoryEntry | null> {
        for (const type of Object.keys(this.store) as MemoryType[]) {
            const entry = this.store[type].find((e) => e.id === id);
            if (entry) {
                Object.assign(entry, updates);
                entry.lastAccessed = new Date().toISOString();
                await this.saveMemories();
                return entry;
            }
        }
        return null;
    }

    /**
     * Access a memory (updates access count and timestamp)
     */
    async accessMemory(id: string): Promise<MemoryEntry | null> {
        for (const type of Object.keys(this.store) as MemoryType[]) {
            const entry = this.store[type].find((e) => e.id === id);
            if (entry) {
                entry.lastAccessed = new Date().toISOString();
                entry.accessCount++;
                await this.saveMemories();
                return entry;
            }
        }
        return null;
    }

    /**
     * Delete a memory entry
     */
    async deleteMemory(id: string): Promise<boolean> {
        for (const type of Object.keys(this.store) as MemoryType[]) {
            const index = this.store[type].findIndex((e) => e.id === id);
            if (index > -1) {
                this.store[type].splice(index, 1);
                await this.saveMemories();
                return true;
            }
        }
        return false;
    }

    /**
     * Store a command execution envelope as episodic memory.
     */
    async storeCommandEnvelope(
        envelope: CommandContextEnvelope,
        options?: {
            source?: MemorySource;
            confidence?: number;
            context?: string;
        },
    ): Promise<MemoryEntry> {
        return this.addMemory("episodic", JSON.stringify(envelope, null, 2), {
            source: options?.source ?? "agent",
            confidence: options?.confidence ?? 1.0,
            context:
                options?.context ?? `Command envelope: ${envelope.commandName}`,
            sessionId: envelope.sessionId,
            tags: envelope.tags,
        });
    }

    /**
     * Get the most recently added command envelope.
     */
    getLatestCommandEnvelope(filter?: {
        commandName?: string;
        sessionId?: string;
    }): CommandContextEnvelope | null {
        const episodic = this.getMemoriesByType("episodic");

        const candidates = episodic
            .filter((entry) => entry.tags.includes("command-envelope"))
            .filter((entry) =>
                filter?.commandName
                    ? entry.tags.includes(`command:${filter.commandName}`)
                    : true,
            )
            .filter((entry) =>
                filter?.sessionId
                    ? entry.provenance.sessionId === filter.sessionId
                    : true,
            )
            .sort(
                (a, b) =>
                    new Date(b.provenance.timestamp).getTime() -
                    new Date(a.provenance.timestamp).getTime(),
            );

        const latest = candidates[0];
        if (!latest) return null;

        try {
            return JSON.parse(latest.content) as CommandContextEnvelope;
        } catch {
            return null;
        }
    }

    /**
     * Search memories by content or tags
     */
    searchMemories(
        query: string,
        options?: {
            type?: MemoryType;
            tags?: string[];
            minConfidence?: number;
        },
    ): MemoryEntry[] {
        const queryLower = query.toLowerCase();
        const results: MemoryEntry[] = [];

        const types = options?.type
            ? [options.type]
            : (Object.keys(this.store) as MemoryType[]);

        for (const type of types) {
            results.push(
                ...this.store[type].filter((entry) => {
                    // Content match
                    if (!entry.content.toLowerCase().includes(queryLower)) {
                        return false;
                    }

                    // Tag match
                    if (options?.tags && options.tags.length > 0) {
                        if (
                            !options.tags.some((tag) =>
                                entry.tags.includes(tag),
                            )
                        ) {
                            return false;
                        }
                    }

                    // Confidence threshold
                    if (
                        options?.minConfidence &&
                        entry.provenance.confidence < options.minConfidence
                    ) {
                        return false;
                    }

                    return true;
                }),
            );
        }

        // Sort by relevance (access count, confidence, recency)
        results.sort((a, b) => {
            const scoreA = a.accessCount * a.provenance.confidence;
            const scoreB = b.accessCount * b.provenance.confidence;
            if (scoreA !== scoreB) return scoreB - scoreA;

            const timeA = new Date(a.lastAccessed).getTime();
            const timeB = new Date(b.lastAccessed).getTime();
            return timeB - timeA;
        });

        return results;
    }

    /**
     * Get memories by type
     */
    getMemoriesByType(type: MemoryType): MemoryEntry[] {
        return this.store[type];
    }

    /**
     * Get all memories
     */
    getAllMemories(): MemoryEntry[] {
        return [
            ...this.store.declarative,
            ...this.store.procedural,
            ...this.store.episodic,
        ];
    }

    /**
     * Get memory statistics
     */
    getStats(): {
        total: number;
        byType: Record<MemoryType, number>;
        avgConfidence: number;
        oldestMemory: string | null;
        newestMemory: string | null;
    } {
        const all = this.getAllMemories();
        const byType: Record<MemoryType, number> = {
            declarative: this.store.declarative.length,
            procedural: this.store.procedural.length,
            episodic: this.store.episodic.length,
        };

        const avgConfidence =
            all.length > 0
                ? all.reduce((sum, m) => sum + m.provenance.confidence, 0) /
                  all.length
                : 0;

        const sorted = [...all].sort(
            (a, b) =>
                new Date(a.provenance.timestamp).getTime() -
                new Date(b.provenance.timestamp).getTime(),
        );

        return {
            total: all.length,
            byType,
            avgConfidence: Math.round(avgConfidence * 100) / 100,
            oldestMemory: sorted[0]?.id || null,
            newestMemory: sorted[sorted.length - 1]?.id || null,
        };
    }

    /**
     * Apply confidence decay to a memory based on age
     * Inferred memories decay faster than user-provided ones
     */
    private applyConfidenceDecay(entry: MemoryEntry): MemoryEntry {
        const now = new Date();
        const created = new Date(entry.provenance.timestamp);
        const daysSinceCreation =
            (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

        if (entry.provenance.source === "inferred") {
            // Inferred memories decay faster
            const decayFactor =
                (1 - this.config.confidenceDecayRate) ** daysSinceCreation;
            entry.provenance.confidence *= decayFactor;
        } else if (entry.provenance.source === "agent") {
            // Agent memories decay slower
            const decayFactor =
                (1 - this.config.confidenceDecayRate * 0.5) **
                daysSinceCreation;
            entry.provenance.confidence *= decayFactor;
        }
        // User memories don't decay

        return entry;
    }

    /**
     * Archive old memories (move to episodic summary)
     */
    async archiveOldMemories(daysThreshold = 30): Promise<number> {
        const now = new Date();
        let archived = 0;

        for (const type of ["declarative", "procedural"] as MemoryType[]) {
            const toArchive = this.store[type].filter((entry) => {
                const created = new Date(entry.provenance.timestamp);
                const daysSinceCreation =
                    (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
                return (
                    daysSinceCreation > daysThreshold && entry.accessCount < 3
                );
            });

            for (const entry of toArchive) {
                // Create episodic summary
                const summary = `[${type}] ${entry.content.substring(0, 100)}... (archived from ${entry.provenance.timestamp})`;
                await this.addMemory("episodic", summary, {
                    source: "inferred",
                    context: `Archived from ${type}`,
                    tags: ["archived", type],
                });

                // Remove from original type
                const index = this.store[type].indexOf(entry);
                if (index > -1) {
                    this.store[type].splice(index, 1);
                    archived++;
                }
            }
        }

        if (archived > 0) {
            await this.saveMemories();
        }

        return archived;
    }

    /**
     * Get a summary of memories for context assembly
     */
    getSummary(maxItems = 5): string {
        const stats = this.getStats();
        const lines = [
            "## Memory System",
            `Total memories: ${stats.total}`,
            `- Declarative: ${stats.byType.declarative}`,
            `- Procedural: ${stats.byType.procedural}`,
            `- Episodic: ${stats.byType.episodic}`,
            `Average confidence: ${stats.avgConfidence}`,
            "",
        ];

        // Add recent high-confidence memories
        const recent = this.getAllMemories()
            .sort(
                (a, b) =>
                    new Date(b.lastAccessed).getTime() -
                    new Date(a.lastAccessed).getTime(),
            )
            .filter((m) => m.provenance.confidence > 0.7)
            .slice(0, maxItems);

        if (recent.length > 0) {
            lines.push("### Recent High-Confidence Memories");
            for (const mem of recent) {
                lines.push(
                    `- [${mem.type}] ${mem.content.substring(0, 80)}...`,
                );
            }
        }

        return lines.join("\n");
    }
}

// Singleton instance for convenience
let defaultManager: MemoryManager | null = null;

export function getMemoryManager(
    config?: Partial<ContextConfig>,
): MemoryManager {
    if (!defaultManager) {
        defaultManager = new MemoryManager(config);
    }
    return defaultManager;
}
