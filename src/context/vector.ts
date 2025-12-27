/**
 * Vector Search and Semantic Memory
 *
 * Implements vector embeddings and semantic search for enhanced context retrieval.
 * Uses local vector store with optional external embedding services.
 */

import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { ContextConfig, MemoryEntry } from "./types";
import { DEFAULT_CONFIG } from "./types";

export interface VectorEmbedding {
    id: string;
    vector: number[];
    metadata: {
        memoryId: string;
        type: string;
        tags: string[];
        timestamp: string;
    };
}

export interface SearchResult {
    memory: MemoryEntry;
    score: number;
    relevance: string;
}

export interface VectorStore {
    embeddings: VectorEmbedding[];
    dimension: number;
    indexType: "flat" | "hnsw" | "ivf";
}

/**
 * Simple text tokenizer for creating embeddings
 */
export class TextTokenizer {
    /**
     * Simple word-based tokenization
     */
    tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .split(/\s+/)
            .filter((word) => word.length > 0);
    }

    /**
     * Create TF-IDF vectors
     */
    createTFIDFVector(texts: string[]): Map<string, number> {
        const allWords = new Set<string>();
        const documents: string[][] = [];

        for (const text of texts) {
            const words = this.tokenize(text);
            documents.push(words);
            words.forEach((word) => allWords.add(word));
        }

        const wordList = Array.from(allWords);
        const docFrequency: Map<string, number> = new Map();

        // Calculate IDF
        for (const word of wordList) {
            const docCount = documents.filter((doc) =>
                doc.includes(word),
            ).length;
            const idf = Math.log(texts.length / (docCount + 1));
            docFrequency.set(word, idf);
        }

        // Calculate TF-IDF for this text
        const vector = new Map<string, number>();
        const words = this.tokenize(texts[0]); // Use first text as query
        const wordCount = words.length;

        for (const word of words) {
            const tf = words.filter((w) => w === word).length / wordCount;
            const tfidf = tf * (docFrequency.get(word) || 0);
            vector.set(word, tfidf);
        }

        return vector;
    }

    /**
     * Create simple frequency vector
     */
    createFrequencyVector(text: string): Map<string, number> {
        const words = this.tokenize(text);
        const vector = new Map<string, number>();
        const totalWords = words.length;

        for (const word of words) {
            const count = (vector.get(word) || 0) + 1;
            vector.set(word, count / totalWords);
        }

        return vector;
    }
}

/**
 * Vector similarity calculations
 */
export class VectorMath {
    /**
     * Cosine similarity between two vectors
     */
    static cosineSimilarity(
        vec1: Map<string, number>,
        vec2: Map<string, number>,
    ): number {
        const intersection = new Set(
            [...vec1.keys()].filter((x) => vec2.has(x)),
        );

        if (intersection.size === 0) return 0;

        let dotProduct = 0;
        let mag1 = 0;
        let mag2 = 0;

        for (const word of intersection) {
            dotProduct += (vec1.get(word) || 0) * (vec2.get(word) || 0);
        }

        for (const value of vec1.values()) {
            mag1 += value * value;
        }

        for (const value of vec2.values()) {
            mag2 += value * value;
        }

        mag1 = Math.sqrt(mag1);
        mag2 = Math.sqrt(mag2);

        return mag1 === 0 || mag2 === 0 ? 0 : dotProduct / (mag1 * mag2);
    }

    /**
     * Euclidean distance between two vectors
     */
    static euclideanDistance(vec1: number[], vec2: number[]): number {
        if (vec1.length !== vec2.length) return Number.POSITIVE_INFINITY;

        let sum = 0;
        for (let i = 0; i < vec1.length; i++) {
            const diff = vec1[i] - vec2[i];
            sum += diff * diff;
        }

        return Math.sqrt(sum);
    }

    /**
     * Convert Map to array for calculations
     */
    static mapToArray(map: Map<string, number>, dimension: number): number[] {
        const array = new Array(dimension).fill(0);

        let i = 0;
        for (const [word, value] of map.entries()) {
            if (i >= dimension) break;
            array[i] = value;
            i++;
        }

        return array;
    }
}

/**
 * Enhanced Memory Manager with Vector Search
 */
export class VectorMemoryManager {
    private config: ContextConfig;
    private vectorDir: string;
    private store: VectorStore;
    private tokenizer: TextTokenizer;

    constructor(config: Partial<ContextConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.vectorDir = join(this.config.storagePath, "vectors");
        this.store = { embeddings: [], dimension: 0, indexType: "flat" };
        this.tokenizer = new TextTokenizer();
    }

    /**
     * Initialize vector storage
     */
    async initialize(): Promise<void> {
        await mkdir(this.vectorDir, { recursive: true });
        await this.loadVectorStore();
    }

    /**
     * Load existing vector store
     */
    private async loadVectorStore(): Promise<void> {
        const storePath = join(this.vectorDir, "store.json");

        if (existsSync(storePath)) {
            try {
                const content = await readFile(storePath, "utf-8");
                this.store = JSON.parse(content) as VectorStore;
            } catch (error) {
                console.error("Failed to load vector store:", error);
            }
        }
    }

    /**
     * Save vector store
     */
    private async saveVectorStore(): Promise<void> {
        const storePath = join(this.vectorDir, "store.json");
        await writeFile(storePath, JSON.stringify(this.store, null, 2));
    }

    /**
     * Create embedding for a memory entry
     */
    async createEmbedding(memory: MemoryEntry): Promise<VectorEmbedding> {
        // Use TF-IDF for now (could be upgraded to external embeddings)
        const vector = this.tokenizer.createFrequencyVector(memory.content);
        const vectorArray = VectorMath.mapToArray(
            vector,
            this.store.dimension || 100,
        );

        const embedding: VectorEmbedding = {
            id: `vec_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`,
            vector: vectorArray,
            metadata: {
                memoryId: memory.id,
                type: memory.type,
                tags: memory.tags,
                timestamp: memory.provenance.timestamp,
            },
        };

        // Update store dimension if needed
        if (this.store.dimension === 0) {
            this.store.dimension = vectorArray.length;
        }

        return embedding;
    }

    /**
     * Add memory with vector embedding
     */
    async addMemoryWithVector(memory: MemoryEntry): Promise<void> {
        const embedding = await this.createEmbedding(memory);
        this.store.embeddings.push(embedding);
        await this.saveVectorStore();
    }

    /**
     * Semantic search for memories
     */
    async semanticSearch(
        query: string,
        options: {
            limit?: number;
            minScore?: number;
            memoryType?: string;
            tags?: string[];
        } = {},
    ): Promise<SearchResult[]> {
        const queryVector = this.tokenizer.createFrequencyVector(query);
        const queryArray = VectorMath.mapToArray(
            queryVector,
            this.store.dimension,
        );

        const results: SearchResult[] = [];

        for (const embedding of this.store.embeddings) {
            // Filter by memory type if specified
            if (
                options.memoryType &&
                embedding.metadata.type !== options.memoryType
            ) {
                continue;
            }

            // Filter by tags if specified
            if (options.tags && options.tags.length > 0) {
                const hasTag = options.tags.some((tag) =>
                    embedding.metadata.tags.includes(tag),
                );
                if (!hasTag) continue;
            }

            // Calculate similarity
            const similarity = VectorMath.cosineSimilarity(
                new Map(Object.entries(queryVector)),
                new Map(
                    Object.entries(
                        this.tokenizer.createFrequencyVector(
                            // Reconstruct content from metadata (simplified)
                            embedding.metadata.memoryId || "",
                        ),
                    ),
                ),
            );

            if (similarity >= (options.minScore || 0.1)) {
                results.push({
                    score: similarity,
                    relevance: this.getRelevanceLabel(similarity),
                    memory: {
                        id: embedding.metadata.memoryId,
                        type: embedding.metadata.type as any,
                        content: "", // Would need to be loaded from memory store
                        provenance: {
                            source: "user" as any,
                            timestamp: embedding.metadata.timestamp,
                            confidence: 1.0,
                            context: "",
                        },
                        tags: embedding.metadata.tags,
                        lastAccessed: new Date().toISOString(),
                        accessCount: 0,
                    },
                });
            }
        }

        // Sort by relevance score
        results.sort((a, b) => b.score - a.score);

        return results.slice(0, options.limit || 10);
    }

    /**
     * Get relevance label for score
     */
    private getRelevanceLabel(score: number): string {
        if (score >= 0.8) return "Very High";
        if (score >= 0.6) return "High";
        if (score >= 0.4) return "Medium";
        if (score >= 0.2) return "Low";
        return "Very Low";
    }

    /**
     * Get vector store statistics
     */
    getStats(): {
        totalEmbeddings: number;
        dimension: number;
        indexType: string;
        averageVectorNorm: number;
    } {
        const norms = this.store.embeddings.map((e) =>
            Math.sqrt(e.vector.reduce((sum, val) => sum + val * val, 0)),
        );

        return {
            totalEmbeddings: this.store.embeddings.length,
            dimension: this.store.dimension,
            indexType: this.store.indexType,
            averageVectorNorm:
                norms.reduce((sum, norm) => sum + norm, 0) / norms.length,
        };
    }

    /**
     * Rebuild vector index (for performance optimization)
     */
    async rebuildIndex(): Promise<void> {
        console.log("Rebuilding vector index...");

        // For now, just ensure embeddings are sorted
        this.store.embeddings.sort((a, b) =>
            a.metadata.memoryId.localeCompare(b.metadata.memoryId),
        );

        await this.saveVectorStore();
        console.log(
            `Rebuilt index with ${this.store.embeddings.length} embeddings`,
        );
    }

    /**
     * Export vector data for backup
     */
    async exportVectors(format: "json" | "csv" = "json"): Promise<string> {
        if (format === "json") {
            return JSON.stringify(this.store, null, 2);
        }

        // CSV export
        const headers = [
            "id",
            "memoryId",
            "type",
            "tags",
            "timestamp",
            "dimension",
        ];
        const rows = this.store.embeddings.map((e) => [
            e.id,
            e.metadata.memoryId,
            e.metadata.type,
            e.metadata.tags.join(";"),
            e.metadata.timestamp,
            e.vector.length,
        ]);

        return [headers.join(","), ...rows.map((row) => row.join(","))].join(
            "\n",
        );
    }
}

/**
 * Context Ranking Engine
 */
export class ContextRanker {
    /**
     * Rank memories by relevance to current context
     */
    static rankByRelevance(
        memories: MemoryEntry[],
        context: {
            query?: string;
            activeFiles?: string[];
            currentTask?: string;
            sessionType?: string;
        },
    ): MemoryEntry[] {
        const scored = memories.map((memory) => {
            let score = 0;

            // Query relevance
            if (context.query) {
                const queryWords = context.query.toLowerCase().split(/\s+/);
                const contentWords = memory.content.toLowerCase().split(/\s+/);
                const overlap = queryWords.filter((word) =>
                    contentWords.includes(word),
                ).length;
                score += (overlap / queryWords.length) * 0.4;
            }

            // File relevance
            if (context.activeFiles && context.activeFiles.length > 0) {
                const fileMention = context.activeFiles.some((file) =>
                    memory.content.toLowerCase().includes(file.toLowerCase()),
                );
                if (fileMention) score += 0.3;
            }

            // Task relevance
            if (context.currentTask) {
                const taskRelevance = memory.content
                    .toLowerCase()
                    .includes(context.currentTask.toLowerCase());
                if (taskRelevance) score += 0.2;
            }

            // Recency boost
            const daysSinceAccess =
                (Date.now() - new Date(memory.lastAccessed).getTime()) /
                (1000 * 60 * 60 * 24);
            const recencyScore = Math.max(0, 1 - daysSinceAccess / 30); // Decay over 30 days
            score += recencyScore * 0.1;

            // Confidence boost
            score += memory.provenance.confidence * 0.1;

            return { memory, score };
        });

        // Sort by score
        scored.sort((a, b) => b.score - a.score);

        return scored.map((item) => item.memory);
    }

    /**
     * Get explanation for ranking
     */
    static getRankingExplanation(memory: MemoryEntry, score: number): string {
        const factors = [];

        if (score > 0.5) factors.push("High relevance to query");
        if (memory.provenance.confidence > 0.8) factors.push("High confidence");
        if (memory.tags.includes("recent")) factors.push("Recently accessed");
        if (memory.accessCount > 5) factors.push("Frequently accessed");

        return factors.length > 0 ? factors.join(", ") : "Base relevance";
    }
}
