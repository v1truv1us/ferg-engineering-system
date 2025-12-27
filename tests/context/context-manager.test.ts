#!/usr/bin/env bun

/**
 * Tests for the context engineering module (current architecture)
 *
 * These tests validate the modern primitives:
 * - SessionManager (persistent workbench)
 * - MemoryManager (typed memories)
 * - VectorMemoryManager (local semantic index)
 * - ContextRetriever (push/pull context assembly)
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import type { AgentType, ConfidenceLevel } from "../../src/agents/types";
import { MemoryManager } from "../../src/context/memory";
import { ProgressiveSkillLoader } from "../../src/context/progressive";
import { ContextRetriever } from "../../src/context/retrieval";
import { SessionManager } from "../../src/context/session";
import { VectorMemoryManager } from "../../src/context/vector";

function makeTempDir(): string {
    // randomUUID is available in Bun
    const id = crypto.randomUUID();
    return join(tmpdir(), `ai-eng-context-test-${id}`);
}

describe("Context Engineering (current)", () => {
    let tempDir: string;
    let previousSilentEnv: string | undefined;

    beforeEach(() => {
        previousSilentEnv = process.env.AI_ENG_SILENT;
        process.env.AI_ENG_SILENT = "1";

        tempDir = makeTempDir();
        mkdirSync(tempDir, { recursive: true });
    });

    afterEach(() => {
        if (existsSync(tempDir)) {
            rmSync(tempDir, { recursive: true, force: true });
        }

        if (previousSilentEnv === undefined) {
            process.env.AI_ENG_SILENT = undefined;
        } else {
            process.env.AI_ENG_SILENT = previousSilentEnv;
        }

        previousSilentEnv = undefined;
    });

    describe("SessionManager", () => {
        it("initializes and starts a session (persisted)", async () => {
            const sessionManager = new SessionManager({ storagePath: tempDir });
            await sessionManager.initialize();

            const session1 = await sessionManager.startSession({
                project: "test-project",
                mode: "build",
                platform: "opencode",
            });

            expect(session1.id).toBeDefined();
            expect(session1.metadata.project).toBe("test-project");
            expect(sessionManager.getSession()?.id).toBe(session1.id);

            // Starting again should restore current session rather than creating a new one
            const session2 = await sessionManager.startSession({
                mode: "review",
            });
            expect(session2.id).toBe(session1.id);
            expect(session2.metadata.mode).toBe("review");
        });

        it("stores and retrieves workbench context", async () => {
            const sessionManager = new SessionManager({ storagePath: tempDir });
            await sessionManager.initialize();
            await sessionManager.startSession({ project: "test-project" });

            await sessionManager.setContext("currentTask", "code-review");
            await sessionManager.setContext("files", ["a.ts", "b.ts"]);

            expect(sessionManager.getContext("currentTask")).toBe(
                "code-review",
            );
            expect(sessionManager.getContext<string[]>("files")).toEqual([
                "a.ts",
                "b.ts",
            ]);
        });
    });

    describe("MemoryManager", () => {
        it("adds and searches memories", async () => {
            const memoryManager = new MemoryManager({ storagePath: tempDir });
            await memoryManager.initialize();

            const m1 = await memoryManager.addMemory(
                "procedural",
                "JavaScript programming patterns",
                {
                    tags: ["javascript", "patterns"],
                },
            );
            await memoryManager.addMemory(
                "procedural",
                "Python programming basics",
                {
                    tags: ["python"],
                },
            );

            const results = memoryManager.searchMemories("JavaScript");
            expect(results.map((r) => r.id)).toContain(m1.id);
            expect(results[0].content).toContain("JavaScript");
        });

        it("deletes memories", async () => {
            const memoryManager = new MemoryManager({ storagePath: tempDir });
            await memoryManager.initialize();

            const m = await memoryManager.addMemory(
                "declarative",
                "Will be deleted",
            );
            expect(
                memoryManager.getAllMemories().some((x) => x.id === m.id),
            ).toBe(true);

            const deleted = await memoryManager.deleteMemory(m.id);
            expect(deleted).toBe(true);
            expect(
                memoryManager.getAllMemories().some((x) => x.id === m.id),
            ).toBe(false);
        });
    });

    describe("VectorMemoryManager", () => {
        it("creates and stores embeddings for memories", async () => {
            const memoryManager = new MemoryManager({ storagePath: tempDir });
            await memoryManager.initialize();

            const vectorManager = new VectorMemoryManager({
                storagePath: tempDir,
            });
            await vectorManager.initialize();

            const m = await memoryManager.addMemory(
                "procedural",
                "Vector searchable memory",
                {
                    tags: ["vector"],
                },
            );

            await vectorManager.addMemoryWithVector(m);

            const stats = vectorManager.getStats();
            expect(stats.totalEmbeddings).toBe(1);
            expect(stats.dimension).toBeGreaterThan(0);

            const exported = await vectorManager.exportVectors("json");
            const parsed = JSON.parse(exported);
            expect(parsed.embeddings).toHaveLength(1);
            expect(parsed.embeddings[0].metadata.memoryId).toBe(m.id);
        });
    });

    describe("ContextRetriever", () => {
        it("pullContext returns relevant memories (traditional search)", async () => {
            const sessionManager = new SessionManager({ storagePath: tempDir });
            const memoryManager = new MemoryManager({ storagePath: tempDir });
            const skillLoader = new ProgressiveSkillLoader(
                join(process.cwd(), "skills"),
            );

            await sessionManager.initialize();
            await memoryManager.initialize();

            await sessionManager.startSession({
                project: "test-project",
                mode: "build",
            });

            const m = await memoryManager.addMemory(
                "procedural",
                "JavaScript async patterns",
                {
                    tags: ["javascript", "async"],
                },
            );

            const retriever = new ContextRetriever(
                sessionManager,
                memoryManager,
                skillLoader,
                {
                    storagePath: tempDir,
                },
            );
            await retriever.initializeVectorManager();

            const ctx = await retriever.pullContext("JavaScript");
            expect(ctx.memories.some((mem) => mem.id === m.id)).toBe(true);
            expect(
                ctx.memories.some((mem) => mem.content.includes("JavaScript")),
            ).toBe(true);
            expect(ctx.meta.triggers).toContain("query");
        });

        it("cached pullContext increments access count via accessMemory", async () => {
            const sessionManager = new SessionManager({ storagePath: tempDir });
            const memoryManager = new MemoryManager({ storagePath: tempDir });
            const skillLoader = new ProgressiveSkillLoader(
                join(process.cwd(), "skills"),
            );

            await sessionManager.initialize();
            await memoryManager.initialize();
            await sessionManager.startSession({ project: "test-project" });

            const m = await memoryManager.addMemory(
                "procedural",
                "Cache access test",
                {
                    tags: ["cache"],
                },
            );

            const retriever = new ContextRetriever(
                sessionManager,
                memoryManager,
                skillLoader,
                {
                    storagePath: tempDir,
                },
            );
            await retriever.initializeVectorManager();

            await retriever.pullContext("Cache");

            // Second call should be cached and trigger accessMemory() in getCachedContext.
            await retriever.pullContext("Cache");

            const updated = memoryManager
                .getAllMemories()
                .find((x) => x.id === m.id);
            expect(updated).toBeDefined();
            expect(updated?.accessCount).toBeGreaterThanOrEqual(1);
        });
    });

    describe("ContextEnvelope", () => {
        let sessionManager: SessionManager;

        beforeEach(async () => {
            sessionManager = new SessionManager({ storagePath: tempDir });
            await sessionManager.initialize();
        });

        it("should build context envelope with session state", async () => {
            const session = await sessionManager.startSession({
                title: "Test Session",
            });
            session.workbench.activeFiles = ["file1.ts", "file2.ts"];
            session.workbench.pendingTasks = [
                { id: "task1", description: "Test task", status: "pending" },
            ];
            session.workbench.decisions = [
                {
                    id: "dec1",
                    description: "Test decision",
                    rationale: "Test rationale",
                },
            ];

            const envelope = sessionManager.buildContextEnvelope("req-123", 0);

            expect(envelope.session.id).toBe(session.id);
            expect(envelope.session.activeFiles).toEqual([
                "file1.ts",
                "file2.ts",
            ]);
            expect(envelope.session.pendingTasks).toHaveLength(1);
            expect(envelope.session.decisions).toHaveLength(1);
            expect(envelope.meta.requestId).toBe("req-123");
            expect(envelope.meta.depth).toBe(0);
            expect(envelope.previousResults).toEqual([]);
            expect(envelope.taskContext).toEqual({});
        });

        it("should include previous results and task context", async () => {
            await sessionManager.startSession({ title: "Test Session" });

            const previousResults = [
                {
                    agentType: "code-reviewer" as AgentType,
                    output: { review: "Good code" },
                    confidence: "high" as ConfidenceLevel,
                },
            ];

            const taskContext = { priority: "high", deadline: "2025-12-20" };

            const envelope = sessionManager.buildContextEnvelope(
                "req-456",
                1,
                previousResults,
                taskContext,
            );

            expect(envelope.previousResults).toEqual(previousResults);
            expect(envelope.taskContext).toEqual(taskContext);
            expect(envelope.meta.depth).toBe(1);
        });

        it("should serialize envelope with size limits", async () => {
            const session = await sessionManager.startSession({
                title: "Test Session",
            });

            // Add many files to test limiting
            session.workbench.activeFiles = Array.from(
                { length: 15 },
                (_, i) => `file${i}.ts`,
            );

            const envelope = sessionManager.buildContextEnvelope("req-789", 0);
            const serialized =
                sessionManager.serializeContextEnvelope(envelope);

            expect(serialized).toContain("req-789");
            expect(envelope.session.activeFiles).toHaveLength(10); // Limited to 10
        });

        it("should throw error when no active session", () => {
            expect(() => {
                sessionManager.buildContextEnvelope("req-999", 0);
            }).toThrow("No active session for context envelope");
        });

        it("should merge context envelopes with conflict resolution", async () => {
            await sessionManager.startSession({ title: "Test Session" });

            const envelope1: ContextEnvelope = {
                session: {
                    id: "session-1",
                    activeFiles: [],
                    pendingTasks: [],
                    decisions: [],
                },
                memories: { declarative: [], procedural: [], episodic: [] },
                previousResults: [
                    {
                        agentType: "reviewer",
                        output: "Good",
                        confidence: "high",
                    },
                ],
                taskContext: { priority: "high", status: "in-progress" },
                meta: { requestId: "req-1", timestamp: new Date(), depth: 0 },
            };

            const envelope2: ContextEnvelope = {
                session: {
                    id: "session-1",
                    activeFiles: [],
                    pendingTasks: [],
                    decisions: [],
                },
                memories: { declarative: [], procedural: [], episodic: [] },
                previousResults: [
                    {
                        agentType: "scanner",
                        output: "Clean",
                        confidence: "medium",
                    },
                ],
                taskContext: { priority: "low", status: "completed" }, // Conflicts with envelope1
                meta: { requestId: "req-2", timestamp: new Date(), depth: 0 },
            };

            const merged = sessionManager.mergeContextEnvelopes(
                [envelope1, envelope2],
                "last-wins",
            );

            expect(merged.previousResults).toHaveLength(2); // Both results kept
            expect(merged.taskContext.priority).toBe("low"); // Last-wins strategy
            expect(merged.taskContext.status).toBe("completed");
            expect(merged.meta.mergedFrom).toBe(2);
        });

        it("should resolve conflicts using consensus strategy", async () => {
            await sessionManager.startSession({ title: "Test Session" });

            const envelope1: ContextEnvelope = {
                session: {
                    id: "session-1",
                    activeFiles: [],
                    pendingTasks: [],
                    decisions: [],
                },
                memories: { declarative: [], procedural: [], episodic: [] },
                previousResults: [],
                taskContext: { priority: "high" },
                meta: { requestId: "req-1", timestamp: new Date(), depth: 0 },
            };

            const envelope2: ContextEnvelope = {
                session: {
                    id: "session-1",
                    activeFiles: [],
                    pendingTasks: [],
                    decisions: [],
                },
                memories: { declarative: [], procedural: [], episodic: [] },
                previousResults: [],
                taskContext: { priority: "high" }, // Same value
                meta: { requestId: "req-2", timestamp: new Date(), depth: 0 },
            };

            const envelope3: ContextEnvelope = {
                session: {
                    id: "session-1",
                    activeFiles: [],
                    pendingTasks: [],
                    decisions: [],
                },
                memories: { declarative: [], procedural: [], episodic: [] },
                previousResults: [],
                taskContext: { priority: "low" }, // Different value
                meta: { requestId: "req-3", timestamp: new Date(), depth: 0 },
            };

            const merged = sessionManager.mergeContextEnvelopes(
                [envelope1, envelope2, envelope3],
                "consensus",
            );

            expect(merged.taskContext.priority).toBe("high"); // Consensus: 2 high vs 1 low
        });

        it("should record and retrieve handoff audit records", async () => {
            const session = await sessionManager.startSession({
                title: "Test Session",
            });
            const correlationId = sessionManager.generateCorrelationId();

            sessionManager.recordHandoff(
                correlationId,
                "code-reviewer",
                "security-scanner",
                1024,
                true,
                "Routine check",
            );

            const auditTrail = sessionManager.getAuditTrail(correlationId);
            expect(auditTrail).toHaveLength(1);
            expect(auditTrail[0].fromAgent).toBe("code-reviewer");
            expect(auditTrail[0].toAgent).toBe("security-scanner");
            expect(auditTrail[0].success).toBe(true);
            expect(auditTrail[0].sessionId).toBe(session.id);
        });

        it("should maintain audit log with size limits", async () => {
            await sessionManager.startSession({ title: "Test Session" });

            // Add more than 100 records
            for (let i = 0; i < 105; i++) {
                const correlationId = `test-${i}`;
                sessionManager.recordHandoff(
                    correlationId,
                    `agent-${i}`,
                    `agent-${i + 1}`,
                    100,
                    true,
                );
            }

            const allRecords = sessionManager.getAllAuditRecords();
            expect(allRecords.length).toBeLessThanOrEqual(100);
        });

        it("should generate unique correlation IDs", () => {
            const id1 = sessionManager.generateCorrelationId();
            const id2 = sessionManager.generateCorrelationId();

            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^corr-\d+-/);
            expect(id2).toMatch(/^corr-\d+-/);
        });
    });
});
