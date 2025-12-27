/**
 * Tests to verify all 24 agents are defined in types
 */

import { describe, expect, it } from "bun:test";
import { AgentType } from "../../src/agents/types.js";

describe("AgentType Enum Completeness", () => {
    const expectedAgents = [
        // Architecture & Planning
        "architect-advisor",
        "backend-architect",
        "infrastructure-builder",
        // Development & Coding
        "frontend-reviewer",
        "full-stack-developer",
        "api-builder-enhanced",
        "database-optimizer",
        "java-pro",
        // Quality & Testing
        "code-reviewer",
        "test-generator",
        "security-scanner",
        "performance-engineer",
        // DevOps & Deployment
        "deployment-engineer",
        "monitoring-expert",
        "cost-optimizer",
        // AI & Machine Learning
        "ai-engineer",
        "ml-engineer",
        // Content & SEO
        "seo-specialist",
        "prompt-optimizer",
        // Plugin Development
        "agent-creator",
        "command-creator",
        "skill-creator",
        "tool-creator",
        "plugin-validator",
    ];

    it("should have all 24 agents defined in AgentType enum", () => {
        const enumValues = Object.values(AgentType);

        expect(enumValues.length).toBe(24);

        for (const agent of expectedAgents) {
            const found = enumValues.some(
                (v) => v === agent || v.replace(/_/g, "-") === agent,
            );
            expect(found).toBe(true, `Missing agent: ${agent}`);
        }
    });

    it("should have consistent naming (kebab-case)", () => {
        for (const value of Object.values(AgentType)) {
            expect(value).toMatch(
                /^[a-z]+(-[a-z]+)*$/,
                `Invalid format: ${value}`,
            );
        }
    });

    it("should not have duplicate values", () => {
        const enumValues = Object.values(AgentType);
        const uniqueValues = new Set(enumValues);
        expect(uniqueValues.size).toBe(enumValues.length);
    });
});
