import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AgentType, ConfidenceLevel } from "../../../src/agents/types";
import { SessionManager } from "../../../src/context/session";

describe("SessionManager", () => {
    let manager: SessionManager;
    let tempDir: string;

    beforeEach(async () => {
        tempDir = join(tmpdir(), `session-test-${Date.now()}`);
        manager = new SessionManager({ storagePath: tempDir });
        await manager.initialize();
    });

    afterEach(async () => {
        // Cleanup if needed
    });

    describe("Session Creation", () => {
        it("should create a new session with default metadata", async () => {
            const session = await manager.startSession();

            expect(session.id).toBeDefined();
            expect(session.metadata.title).toBe("");
            expect(session.metadata.createdAt).toBeInstanceOf(Date);
            expect(session.workbench.activeFiles).toEqual([]);
            expect(session.workbench.pendingTasks).toEqual([]);
            expect(session.workbench.decisions).toEqual([]);
        });

        it("should create a session with custom metadata", async () => {
            const metadata = {
                title: "Test Session",
                description: "A test session",
            };

            const session = await manager.startSession(metadata);

            expect(session.metadata.title).toBe("Test Session");
            expect(session.metadata.description).toBe("A test session");
        });
    });

    describe("ContextEnvelope", () => {
        it("should build context envelope with session state", async () => {
            const session = await manager.startSession({
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

            const envelope = manager.buildContextEnvelope("req-123", 0);

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
            await manager.startSession({ title: "Test Session" });

            const previousResults = [
                {
                    agentType: "code-reviewer" as AgentType,
                    output: { review: "Good code" },
                    confidence: "high" as ConfidenceLevel,
                },
            ];

            const taskContext = { priority: "high", deadline: "2025-12-20" };

            const envelope = manager.buildContextEnvelope(
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
            const session = await manager.startSession({
                title: "Test Session",
            });

            // Add many files to test limiting
            session.workbench.activeFiles = Array.from(
                { length: 15 },
                (_, i) => `file${i}.ts`,
            );

            const envelope = manager.buildContextEnvelope("req-789", 0);
            const serialized = manager.serializeContextEnvelope(envelope);

            expect(serialized).toContain("req-789");
            expect(envelope.session.activeFiles).toHaveLength(10); // Limited to 10
        });

        it("should throw error when no active session", () => {
            expect(() => {
                manager.buildContextEnvelope("req-999", 0);
            }).toThrow("No active session for context envelope");
        });
    });
});
