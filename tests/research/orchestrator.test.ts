import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    mock,
    spyOn,
} from "bun:test";
import { DiscoveryHandler } from "../../src/research/discovery.js";
import { ResearchOrchestrator } from "../../src/research/orchestrator.js";
import {
    type ResearchConfig,
    ResearchDepth,
    ResearchPhase,
    ResearchQuery,
    ResearchScope,
} from "../../src/research/types.js";

describe("ResearchOrchestrator", () => {
    let orchestrator: ResearchOrchestrator;
    let config: ResearchConfig;

    beforeEach(() => {
        config = {
            maxConcurrency: 3,
            defaultTimeout: 30000,
            enableCaching: true,
            logLevel: "info",
            cacheExpiry: 300000,
            maxFileSize: 10485760,
            maxResults: 100,
            enableExternalSearch: false,
            externalSearchTimeout: 60000,
        };
        orchestrator = new ResearchOrchestrator(config);
    });

    afterEach(() => {
        orchestrator.reset();
    });

    describe("constructor", () => {
        it("should initialize with config", () => {
            expect(orchestrator).toBeDefined();
            expect(orchestrator.getProgress()).toBeDefined();
        });

        it("should set initial progress state", () => {
            const progress = orchestrator.getProgress();
            expect(progress.phase).toBe(ResearchPhase.DISCOVERY);
            expect(progress.completedSteps).toBe(0);
            expect(progress.percentageComplete).toBe(0);
        });
    });

    describe("getProgress method", () => {
        it("should return current progress state", () => {
            const progress = orchestrator.getProgress();
            expect(progress).toHaveProperty("phase");
            expect(progress).toHaveProperty("currentStep");
            expect(progress).toHaveProperty("percentageComplete");
            expect(progress).toHaveProperty("agentsCompleted");
            expect(progress).toHaveProperty("errors");
        });
    });

    describe("getMetrics method", () => {
        it("should return null when no research started", () => {
            const metrics = orchestrator.getMetrics();
            expect(metrics).toBeNull();
        });
    });

    describe("reset method", () => {
        it("should reset orchestrator state", () => {
            orchestrator.reset();

            const progress = orchestrator.getProgress();
            expect(progress.phase).toBe(ResearchPhase.DISCOVERY);
            expect(progress.completedSteps).toBe(0);
            expect(progress.percentageComplete).toBe(0);
            expect(progress.agentsCompleted).toHaveLength(0);
            expect(progress.errors).toHaveLength(0);
        });
    });

    describe("query validation", () => {
        it("should reject query with empty ID", async () => {
            const invalidQuery = {
                id: "",
                query: "Test query",
                scope: ResearchScope.CODEBASE,
                depth: ResearchDepth.MEDIUM,
            };

            const error = await orchestrator
                .research(invalidQuery)
                .catch((e) => e);
            expect(error).toBeDefined();
            expect(error.error).toContain("Query must have an ID");
        });

        it("should reject query with empty query string", async () => {
            const invalidQuery = {
                id: "test-1",
                query: "",
                scope: ResearchScope.CODEBASE,
                depth: ResearchDepth.MEDIUM,
            };

            const error = await orchestrator
                .research(invalidQuery)
                .catch((e) => e);
            expect(error).toBeDefined();
            expect(error.error).toContain(
                "Query must have a non-empty query string",
            );
        });
    });

    describe("event emission", () => {
        it("should emit events during research", async () => {
            const events: any[] = [];
            orchestrator.on("research_event", (event) => {
                events.push(event);
            });

            const validQuery = {
                id: "test-query-1",
                query: "Test query",
                scope: ResearchScope.CODEBASE,
                depth: ResearchDepth.SHALLOW,
            };

            // This will fail due to missing handlers, but should emit events
            try {
                await orchestrator.research(validQuery);
            } catch (error) {
                // Expected to fail
            }

            expect(events.length).toBeGreaterThan(0);
            expect(events.some((e) => e.type === "research_started")).toBe(
                true,
            );
        });
    });

    describe("error handling", () => {
        it("should handle research errors gracefully", async () => {
            const validQuery = {
                id: "test-query-1",
                query: "Test query",
                scope: ResearchScope.CODEBASE,
                depth: ResearchDepth.SHALLOW,
            };

            // Force an error in discovery; orchestrator should surface it as a ResearchError.
            const spy = spyOn(
                DiscoveryHandler.prototype,
                "discover",
            ).mockImplementation(async () => {
                throw new Error("Discovery failed");
            });

            try {
                await expect(
                    orchestrator.research(validQuery),
                ).rejects.toMatchObject({
                    phase: ResearchPhase.DISCOVERY,
                    error: "Discovery failed",
                });
            } finally {
                spy.mockRestore();
                mock.restore();
            }
        });
    });
});
