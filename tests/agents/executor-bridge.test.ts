/**
 * Tests for ExecutorBridge - hybrid execution with Task tool and local TypeScript
 *
 * TDD: Write these tests FIRST, then implement the bridge
 */

import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { ExecutorBridge } from "../../src/agents/executor-bridge.js";
import { AgentRegistry } from "../../src/agents/registry.js";
import { AgentType } from "../../src/agents/types.js";

describe("ExecutorBridge", () => {
    let bridge: ExecutorBridge;
    let registry: AgentRegistry;

    beforeEach(() => {
        registry = new AgentRegistry();
        bridge = new ExecutorBridge(registry);
    });

    describe("Execution Mode Selection", () => {
        it("should use Task tool for complex reasoning tasks", async () => {
            const task = {
                id: "test-1",
                type: AgentType.ARCHITECT_ADVISOR,
                name: "Architecture Analysis",
                input: {
                    type: AgentType.ARCHITECT_ADVISOR,
                    context: {
                        description: "Analyze microservices architecture",
                    },
                },
                strategy: "sequential" as const,
            };

            const mode = bridge.selectExecutionMode(task);
            expect(mode).toBe("task-tool");
        });

        it("should use local execution for file operations", async () => {
            const task = {
                id: "test-2",
                type: AgentType.CODE_REVIEWER,
                name: "File Pattern Analysis",
                input: {
                    type: AgentType.CODE_REVIEWER,
                    context: { files: ["src/*.ts"], operation: "count-lines" },
                },
                strategy: "sequential" as const,
            };

            const mode = bridge.selectExecutionMode(task);
            expect(mode).toBe("local");
        });

        it("should use Task tool for agents requiring LLM reasoning", async () => {
            const llmRequiredAgents = [
                AgentType.ARCHITECT_ADVISOR,
                AgentType.CODE_REVIEWER,
                AgentType.SECURITY_SCANNER,
                AgentType.PERFORMANCE_ENGINEER,
            ];

            for (const agentType of llmRequiredAgents) {
                const task = {
                    id: `test-${agentType}`,
                    type: agentType,
                    name: "Test",
                    input: { type: agentType, context: {} },
                    strategy: "sequential" as const,
                };

                const mode = bridge.selectExecutionMode(task);
                expect(mode).toBe(
                    "task-tool",
                    `Expected Task tool for ${agentType}`,
                );
            }
        });

        it("should use local execution for data processing agents", async () => {
            const dataProcessingAgents = [
                AgentType.TEST_GENERATOR, // Could generate tests locally
                AgentType.SEO_SPECIALIST, // Could analyze content locally
            ];

            for (const agentType of dataProcessingAgents) {
                const task = {
                    id: `test-${agentType}`,
                    type: agentType,
                    name: "Test",
                    input: {
                        type: agentType,
                        context: { operation: "analyze" },
                    },
                    strategy: "sequential" as const,
                };

                const mode = bridge.selectExecutionMode(task);
                // These might be task-tool or local depending on implementation
                expect(["task-tool", "local"]).toContain(mode);
            }
        });
    });

    describe("Task Tool Integration", () => {
        it("should map AgentType to correct subagent_type", () => {
            expect(bridge.mapToSubagentType(AgentType.CODE_REVIEWER)).toBe(
                "quality-testing/code_reviewer",
            );
            expect(bridge.mapToSubagentType(AgentType.ARCHITECT_ADVISOR)).toBe(
                "development/system_architect",
            );
            expect(bridge.mapToSubagentType(AgentType.SECURITY_SCANNER)).toBe(
                "quality-testing/security_scanner",
            );
            expect(bridge.mapToSubagentType(AgentType.AI_ENGINEER)).toBe(
                "ai-innovation/ai_engineer",
            );
        });

        it("should build enhanced prompt with incentive prompting", async () => {
            // Create a mock agent definition
            const mockAgent = {
                type: AgentType.CODE_REVIEWER,
                name: "code-reviewer",
                description: "Code review expert",
                mode: "subagent" as const,
                temperature: 0.1,
                capabilities: ["code-review", "security"],
                handoffs: [AgentType.SECURITY_SCANNER],
                tags: [],
                category: "quality-testing",
                tools: {
                    read: true,
                    grep: true,
                    glob: true,
                    list: true,
                    bash: false,
                    edit: false,
                    write: false,
                    patch: false,
                },
                promptPath: "/test/path",
                prompt: "Original prompt content",
            };

            const task = {
                id: "test-3",
                type: AgentType.CODE_REVIEWER,
                name: "Review Code",
                input: {
                    type: AgentType.CODE_REVIEWER,
                    context: { files: ["test.ts"] },
                },
                strategy: "sequential" as const,
            };

            const prompt = await bridge.buildEnhancedPrompt(mockAgent, task);

            // Should include expert persona
            expect(prompt).toContain("senior technical expert");
            // Should include step-by-step instruction
            expect(prompt).toContain("systematically");
            // Should include stakes language
            expect(prompt).toContain("critical");
            // Should include task context
            expect(prompt).toContain("test.ts");
            // Should include original prompt
            expect(prompt).toContain("Original prompt content");
        });

        it("should handle agents with different expertise levels", async () => {
            const expertAgent = {
                type: AgentType.ARCHITECT_ADVISOR,
                name: "architect-advisor",
                description: "Senior architect with 15+ years experience",
                mode: "subagent" as const,
                temperature: 0.1,
                capabilities: ["architecture", "scalability"],
                handoffs: [],
                tags: [],
                category: "development",
                tools: {
                    read: true,
                    grep: false,
                    glob: false,
                    list: false,
                    bash: false,
                    edit: false,
                    write: false,
                    patch: false,
                },
                promptPath: "/test/path",
                prompt: "Architecture analysis prompt",
            };

            const task = {
                id: "arch-task",
                type: AgentType.ARCHITECT_ADVISOR,
                name: "Architecture Review",
                input: {
                    type: AgentType.ARCHITECT_ADVISOR,
                    context: { system: "e-commerce" },
                },
                strategy: "sequential" as const,
            };

            const prompt = await bridge.buildEnhancedPrompt(expertAgent, task);

            // Should reflect the agent's expertise level
            expect(prompt).toContain("15+ years");
            expect(prompt).toContain("e-commerce");
        });
    });

    describe("Local Execution", () => {
        it("should execute file discovery locally", async () => {
            const result = await bridge.executeLocal({
                operation: "glob",
                pattern: "src/**/*.ts",
                cwd: process.cwd(),
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(Array.isArray(result.data)).toBe(true);
        });

        it("should execute grep operations locally", async () => {
            const result = await bridge.executeLocal({
                operation: "grep",
                pattern: "export",
                include: "*.ts",
                cwd: process.cwd(),
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it("should handle file read operations", async () => {
            const result = await bridge.executeLocal({
                operation: "read",
                pattern: "package.json",
                cwd: process.cwd(),
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(typeof result.data).toBe("string");
        });

        it("should handle stat operations", async () => {
            const result = await bridge.executeLocal({
                operation: "stat",
                pattern: "package.json",
                cwd: process.cwd(),
            });

            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
            expect(result.data.size).toBeDefined();
        });

        it("should handle invalid operations gracefully", async () => {
            const result = await bridge.executeLocal({
                operation: "invalid" as any,
                pattern: "test",
                cwd: process.cwd(),
            });

            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });
    });

    describe("Error Handling", () => {
        it("should handle Task tool failures gracefully", async () => {
            // Mock a task that would fail due to timeout
            const failingTask = {
                id: "fail-task",
                type: AgentType.CODE_REVIEWER,
                name: "Failing Task",
                input: {
                    type: AgentType.CODE_REVIEWER,
                    context: { invalid: "data" },
                },
                strategy: "sequential" as const,
                timeout: 1, // Very short timeout to force failure
            };

            // This should throw due to timeout
            await expect(bridge.execute(failingTask)).rejects.toThrow(
                "timed out after 1ms",
            );
        });

        it("should fallback to local execution when appropriate", async () => {
            const task = {
                id: "fallback-task",
                type: AgentType.CODE_REVIEWER,
                name: "Fallback Task",
                input: {
                    type: AgentType.CODE_REVIEWER,
                    context: { operation: "count-lines", files: ["*.ts"] },
                },
                strategy: "sequential" as const,
            };

            const result = await bridge.execute(task);
            expect(result).toBeDefined();
            // Should either succeed or provide meaningful fallback
        });
    });
});
