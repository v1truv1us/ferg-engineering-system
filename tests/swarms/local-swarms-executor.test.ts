/**
 * Tests for LocalSwarmsExecutor
 * Verifies local swarm execution without external server
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";

let previousSilentEnv: string | undefined;

beforeEach(() => {
    // Silence expected "Registered agent" logs during tests.
    previousSilentEnv = process.env.AI_ENG_SILENT;
    process.env.AI_ENG_SILENT = "1";
});

afterEach(() => {
    if (previousSilentEnv === undefined) {
        process.env.AI_ENG_SILENT = undefined;
    } else {
        process.env.AI_ENG_SILENT = previousSilentEnv;
    }

    previousSilentEnv = undefined;
});
import {
    LocalSwarmsExecutor,
    checkLocalSwarmsAvailable,
    createSwarmsClient,
} from "../../src/local-swarms-executor.js";
import { Swarm, type SwarmConfig } from "../../src/swarms-client.js";

describe("LocalSwarmsExecutor", () => {
    let executor: LocalSwarmsExecutor;

    beforeEach(() => {
        executor = new LocalSwarmsExecutor();
    });

    describe("Agent Registry", () => {
        it("should return all 26 agents", async () => {
            const agents = await executor.getAvailableAgents();
            expect(agents.length).toBe(26);
        });

        it("should include all Architecture & Planning agents", async () => {
            const agents = await executor.getAvailableAgents();

            expect(agents).toContain("architect-advisor");
            expect(agents).toContain("backend-architect");
            expect(agents).toContain("infrastructure-builder");
        });

        it("should include all Development & Coding agents", async () => {
            const agents = await executor.getAvailableAgents();

            expect(agents).toContain("frontend-reviewer");
            expect(agents).toContain("full-stack-developer");
            expect(agents).toContain("api-builder-enhanced");
            expect(agents).toContain("database-optimizer");
            expect(agents).toContain("java-pro");
        });

        it("should include all Quality & Testing agents", async () => {
            const agents = await executor.getAvailableAgents();

            expect(agents).toContain("code-reviewer");
            expect(agents).toContain("test-generator");
            expect(agents).toContain("security-scanner");
            expect(agents).toContain("performance-engineer");
        });

        it("should include all DevOps & Deployment agents", async () => {
            const agents = await executor.getAvailableAgents();

            expect(agents).toContain("deployment-engineer");
            expect(agents).toContain("monitoring-expert");
            expect(agents).toContain("cost-optimizer");
        });

        it("should include all AI & Machine Learning agents", async () => {
            const agents = await executor.getAvailableAgents();

            expect(agents).toContain("ai-engineer");
            expect(agents).toContain("ml-engineer");
        });

        it("should include all Content & SEO agents", async () => {
            const agents = await executor.getAvailableAgents();

            expect(agents).toContain("seo-specialist");
            expect(agents).toContain("prompt-optimizer");
        });

        it("should include all Plugin Development agents", async () => {
            const agents = await executor.getAvailableAgents();

            expect(agents).toContain("agent-creator");
            expect(agents).toContain("command-creator");
            expect(agents).toContain("skill-creator");
            expect(agents).toContain("tool-creator");
            expect(agents).toContain("plugin-validator");
        });
    });

    describe("Swarm Creation", () => {
        it("should create a swarm with valid config", async () => {
            const config: SwarmConfig = {
                name: "TestSwarm",
                description: "A test swarm",
                agents: ["code-reviewer", "security-scanner"],
                swarm_type: "MultiAgentRouter",
            };

            const swarm = await executor.createSwarm(config);

            expect(swarm.id).toBeDefined();
            expect(swarm.id).toContain("swarm_");
            expect(swarm.name).toBe("TestSwarm");
            expect(swarm.agents).toEqual(["code-reviewer", "security-scanner"]);
            expect(swarm.swarm_type).toBe("MultiAgentRouter");
            expect(swarm.status).toBe("created");
        });

        it("should create swarms with unique IDs", async () => {
            const config: SwarmConfig = {
                name: "TestSwarm",
                agents: ["code-reviewer"],
                swarm_type: "SequentialWorkflow",
            };

            const swarm1 = await executor.createSwarm(config);
            const swarm2 = await executor.createSwarm(config);

            expect(swarm1.id).not.toBe(swarm2.id);
        });

        it("should support all swarm types", async () => {
            const swarmTypes: Array<
                | "MultiAgentRouter"
                | "SequentialWorkflow"
                | "AgentRearrange"
                | "ConcurrentWorkflow"
            > = [
                "MultiAgentRouter",
                "SequentialWorkflow",
                "AgentRearrange",
                "ConcurrentWorkflow",
            ];

            for (const swarmType of swarmTypes) {
                const config: SwarmConfig = {
                    name: `Test${swarmType}`,
                    agents: ["code-reviewer"],
                    swarm_type: swarmType,
                };

                const swarm = await executor.createSwarm(config);
                expect(swarm.swarm_type).toBe(swarmType);
            }
        });
    });

    describe("Swarm Management", () => {
        it("should retrieve created swarm by ID", async () => {
            const config: SwarmConfig = {
                name: "RetrievableSwarm",
                agents: ["architect-advisor"],
                swarm_type: "MultiAgentRouter",
            };

            const created = await executor.createSwarm(config);
            const retrieved = await executor.getSwarm(created.id);

            expect(retrieved.id).toBe(created.id);
            expect(retrieved.name).toBe(created.name);
        });

        it("should throw error for non-existent swarm", async () => {
            await expect(executor.getSwarm("non-existent-id")).rejects.toThrow(
                "Swarm not found",
            );
        });

        it("should list all active swarms", async () => {
            // Create multiple swarms
            await executor.createSwarm({
                name: "Swarm1",
                agents: ["code-reviewer"],
                swarm_type: "MultiAgentRouter",
            });
            await executor.createSwarm({
                name: "Swarm2",
                agents: ["security-scanner"],
                swarm_type: "SequentialWorkflow",
            });

            const swarms = await executor.listSwarms();

            expect(swarms.length).toBeGreaterThanOrEqual(2);
        });

        it("should delete a swarm", async () => {
            const swarm = await executor.createSwarm({
                name: "DeleteableSwarm",
                agents: ["test-generator"],
                swarm_type: "MultiAgentRouter",
            });

            await executor.deleteSwarm(swarm.id);

            await expect(executor.getSwarm(swarm.id)).rejects.toThrow(
                "Swarm not found",
            );
        });
    });

    describe("Agent Registration", () => {
        it("should register a new agent", async () => {
            const result = await executor.registerAgent({
                name: "custom-agent",
                description: "A custom test agent",
                capabilities: ["testing", "custom"],
            });

            expect(result.agent_id).toBeDefined();
            expect(result.agent_id).toContain("agent_");
        });
    });

    describe("Health Check", () => {
        it("should return health status", async () => {
            const health = await executor.getHealth();

            expect(health).toBeDefined();
            // agents_available should always be 26 (our configured agents)
            expect(health.agents_available).toBe(26);
            expect(health.uptime_seconds).toBeGreaterThanOrEqual(0);
            // Status can be 'healthy' (Python available) or 'degraded' (Python not available)
            expect(["healthy", "degraded"]).toContain(health.status);
        });

        it("should track active swarms count", async () => {
            const initialHealth = await executor.getHealth();
            const initialCount = initialHealth.active_swarms;

            await executor.createSwarm({
                name: "CountTestSwarm",
                agents: ["code-reviewer"],
                swarm_type: "MultiAgentRouter",
            });

            const newHealth = await executor.getHealth();
            expect(newHealth.active_swarms).toBe(initialCount + 1);
        });
    });

    describe("Factory Function", () => {
        it("should create local executor in local mode", () => {
            const client = createSwarmsClient({ mode: "local" });
            expect(client).toBeInstanceOf(LocalSwarmsExecutor);
        });

        it("should default to local mode", () => {
            const client = createSwarmsClient();
            expect(client).toBeInstanceOf(LocalSwarmsExecutor);
        });

        it("should accept local options", () => {
            const client = createSwarmsClient({
                mode: "local",
                localOptions: {
                    pythonPath: "/usr/bin/python3",
                    timeout: 60000,
                },
            });
            expect(client).toBeInstanceOf(LocalSwarmsExecutor);
        });
    });

    describe("Availability Check", () => {
        it("should check local swarms availability", async () => {
            // This will return true/false based on Python availability
            const isAvailable = await checkLocalSwarmsAvailable();
            expect(typeof isAvailable).toBe("boolean");
        });
    });
});

describe("LocalSwarmsExecutor - Task Execution", () => {
    let executor: LocalSwarmsExecutor;
    let swarmId: string;

    beforeEach(async () => {
        executor = new LocalSwarmsExecutor({ timeout: 10000 });

        // Create a test swarm
        const swarm = await executor.createSwarm({
            name: "TaskTestSwarm",
            agents: ["code-reviewer", "security-scanner"],
            swarm_type: "MultiAgentRouter",
        });
        swarmId = swarm.id;
    });

    afterEach(async () => {
        try {
            await executor.deleteSwarm(swarmId);
        } catch {
            // Swarm may already be deleted
        }
    });

    it("should return task result structure", async () => {
        const result = await executor.runTask(swarmId, "Test task", {
            timeout: 5000,
        });

        expect(result).toBeDefined();
        expect(result.task_id).toBeDefined();
        expect(result.swarm_id).toBe(swarmId);
        expect(["success", "failed", "timeout"]).toContain(result.status);
        expect(typeof result.execution_time).toBe("number");
    });

    it("should update swarm status during execution", async () => {
        // Check initial status
        let swarm = await executor.getSwarm(swarmId);
        expect(swarm.status).toBe("created");

        // Run task (this will update status)
        await executor.runTask(swarmId, "Status test task", { timeout: 5000 });

        // Check final status
        swarm = await executor.getSwarm(swarmId);
        expect(["completed", "failed"]).toContain(swarm.status);
    });
});
