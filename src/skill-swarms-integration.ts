/**
 * Skill Integration with Swarms Framework
 *
 * Converts existing skills into swarm-compatible tools
 * and enables skill orchestration within swarms.
 */

import { AgentSwarmsIntegration } from "./agent-swarms-integration.js";
import { SwarmConfig, SwarmsClient, type TaskResult } from "./swarms-client.js";

export interface SkillDefinition {
    name: string;
    description: string;
    version: string;
    capabilities: string[];
    parameters: SkillParameter[];
    tags: string[];
}

export interface SkillParameter {
    name: string;
    type: "string" | "number" | "boolean" | "object";
    description: string;
    required: boolean;
    default?: any;
}

export interface SwarmTool {
    name: string;
    description: string;
    parameters: SkillParameter[];
    execute: (params: Record<string, any>) => Promise<any>;
}

/**
 * Skill-to-Swarm tool conversion and orchestration
 */
export class SkillSwarmsIntegration {
    private swarms: SwarmsClient;
    private agents: AgentSwarmsIntegration;
    private skillRegistry: Map<string, SkillDefinition> = new Map();

    constructor(swarmsClient?: SwarmsClient) {
        this.swarms = swarmsClient || new SwarmsClient();
        this.agents = new AgentSwarmsIntegration(swarmsClient);
        this.initializeSkillRegistry();
    }

    /**
     * Initialize skill registry from existing skill definitions
     */
    private initializeSkillRegistry(): void {
        const skillMappings: Record<string, SkillDefinition> = {
            "comprehensive-research": {
                name: "Comprehensive Research",
                description: "Multi-phase research orchestration skill",
                version: "1.0.0",
                capabilities: [
                    "research",
                    "analysis",
                    "documentation",
                    "discovery",
                ],
                parameters: [
                    {
                        name: "query",
                        type: "string",
                        description: "Research query to investigate",
                        required: true,
                    },
                    {
                        name: "scope",
                        type: "string",
                        description:
                            "Scope of research (codebase, external, both)",
                        required: false,
                        default: "codebase",
                    },
                    {
                        name: "depth",
                        type: "string",
                        description: "Research depth (shallow, medium, deep)",
                        required: false,
                        default: "medium",
                    },
                ],
                tags: ["research", "analysis", "documentation"],
            },

            "coolify-deploy": {
                name: "Coolify Deployment",
                description: "Coolify deployment best practices and automation",
                version: "1.0.0",
                capabilities: [
                    "deployment",
                    "devops",
                    "infrastructure",
                    "monitoring",
                ],
                parameters: [
                    {
                        name: "environment",
                        type: "string",
                        description:
                            "Deployment environment (staging, production)",
                        required: true,
                    },
                    {
                        name: "service",
                        type: "string",
                        description: "Service to deploy",
                        required: true,
                    },
                    {
                        name: "version",
                        type: "string",
                        description: "Version to deploy",
                        required: false,
                    },
                ],
                tags: ["deployment", "devops", "coolify"],
            },

            "git-worktree": {
                name: "Git Worktree Management",
                description: "Git worktree workflow management",
                version: "1.0.0",
                capabilities: [
                    "git",
                    "workflow",
                    "branching",
                    "version-control",
                ],
                parameters: [
                    {
                        name: "action",
                        type: "string",
                        description:
                            "Action to perform (create, list, remove, switch)",
                        required: true,
                    },
                    {
                        name: "branch",
                        type: "string",
                        description: "Branch name for worktree operations",
                        required: false,
                    },
                    {
                        name: "path",
                        type: "string",
                        description: "Path for worktree",
                        required: false,
                    },
                ],
                tags: ["git", "workflow", "version-control"],
            },

            "incentive-prompting": {
                name: "Incentive Prompting",
                description:
                    "Research-backed prompting techniques for improved AI response quality",
                version: "1.0.0",
                capabilities: [
                    "prompt-engineering",
                    "ai-interaction",
                    "optimization",
                ],
                parameters: [
                    {
                        name: "task",
                        type: "string",
                        description: "Task to optimize prompting for",
                        required: true,
                    },
                    {
                        name: "technique",
                        type: "string",
                        description: "Prompting technique to apply",
                        required: false,
                        default: "expert-persona",
                    },
                    {
                        name: "domain",
                        type: "string",
                        description: "Domain expertise to apply",
                        required: false,
                    },
                ],
                tags: ["prompting", "ai", "optimization"],
            },

            "plugin-dev": {
                name: "Plugin Development",
                description:
                    "Plugin development knowledge base and best practices",
                version: "1.0.0",
                capabilities: [
                    "plugin-development",
                    "extension-tools",
                    "integration",
                ],
                parameters: [
                    {
                        name: "platform",
                        type: "string",
                        description: "Target platform (claude-code, opencode)",
                        required: true,
                    },
                    {
                        name: "component",
                        type: "string",
                        description:
                            "Component type (agent, command, skill, tool)",
                        required: true,
                    },
                    {
                        name: "template",
                        type: "boolean",
                        description: "Generate template code",
                        required: false,
                        default: false,
                    },
                ],
                tags: ["plugin-dev", "extension", "development"],
            },
        };

        Object.values(skillMappings).forEach((skill) => {
            this.skillRegistry.set(
                skill.name.toLowerCase().replace(/\s+/g, "-"),
                skill,
            );
        });
    }

    /**
     * Convert skill to swarm tool
     */
    skillToTool(skillName: string): SwarmTool | null {
        const skill = this.skillRegistry.get(skillName);
        if (!skill) return null;

        return {
            name: skill.name,
            description: skill.description,
            parameters: skill.parameters,
            execute: async (params: Record<string, any>) => {
                // This would integrate with existing skill execution
                // For now, return a placeholder implementation
                return await this.executeSkill(skillName, params);
            },
        };
    }

    /**
     * Execute skill (placeholder - would integrate with existing skill system)
     */
    private async executeSkill(
        skillName: string,
        params: Record<string, any>,
    ): Promise<any> {
        // Placeholder implementation
        // In real implementation, this would call the actual skill execution logic
        console.log(`Executing skill: ${skillName} with params:`, params);

        switch (skillName) {
            case "comprehensive-research":
                return {
                    phases: ["discovery", "analysis", "synthesis"],
                    findings: `Research completed for: ${params.query}`,
                    recommendations: ["Action item 1", "Action item 2"],
                };

            case "coolify-deploy":
                return {
                    environment: params.environment,
                    service: params.service,
                    status: "deployment_checklist_generated",
                    checklist: [
                        "Verify environment variables",
                        "Check database migrations",
                        "Validate monitoring setup",
                    ],
                };

            case "git-worktree":
                return {
                    action: params.action,
                    branch: params.branch,
                    status: "worktree_operation_completed",
                    result: `Worktree ${params.action} successful`,
                };

            default:
                return { status: "completed", skill: skillName, params };
        }
    }

    /**
     * Create swarm with skill-enhanced agents
     */
    async createSkillSwarm(
        skillName: string,
        task: string,
        additionalCapabilities: string[] = [],
    ): Promise<TaskResult> {
        const skill = this.skillRegistry.get(skillName);
        if (!skill) {
            throw new Error(`Unknown skill: ${skillName}`);
        }

        // Combine skill capabilities with additional requirements
        const allCapabilities = [
            ...skill.capabilities,
            ...additionalCapabilities,
        ];

        // Create swarm with agents that have these capabilities
        const swarmId = await this.agents.createCapabilitySwarm(
            `${skillName}Swarm`,
            `Swarm enhanced with ${skillName} skill`,
            allCapabilities,
            "MultiAgentRouter",
        );

        // Format task to leverage the skill
        const enhancedTask = `${task}\n\nLeverage ${skillName} skill capabilities: ${skill.capabilities.join(", ")}`;

        return this.swarms.runTask(swarmId, enhancedTask);
    }

    /**
     * Get all available skills
     */
    getAvailableSkills(): SkillDefinition[] {
        return Array.from(this.skillRegistry.values());
    }

    /**
     * Get skill definition
     */
    getSkillDefinition(skillName: string): SkillDefinition | undefined {
        return this.skillRegistry.get(skillName);
    }

    /**
     * Create custom skill swarm
     */
    async createCustomSkillSwarm(
        skills: string[],
        task: string,
        swarmType:
            | "MultiAgentRouter"
            | "SequentialWorkflow"
            | "AgentRearrange" = "MultiAgentRouter",
    ): Promise<TaskResult> {
        // Collect all capabilities from requested skills
        const allCapabilities: string[] = [];
        const skillNames: string[] = [];

        for (const skillName of skills) {
            const skill = this.skillRegistry.get(skillName);
            if (skill) {
                allCapabilities.push(...skill.capabilities);
                skillNames.push(skill.name);
            }
        }

        if (allCapabilities.length === 0) {
            throw new Error(`No valid skills found: ${skills.join(", ")}`);
        }

        // Remove duplicates
        const uniqueCapabilities = [...new Set(allCapabilities)];

        const swarmId = await this.agents.createCapabilitySwarm(
            `SkillSwarm-${skills.join("-")}`,
            `Swarm with skills: ${skillNames.join(", ")}`,
            uniqueCapabilities,
            swarmType,
        );

        const enhancedTask = `${task}\n\nAvailable skills: ${skillNames.join(", ")}`;

        return this.swarms.runTask(swarmId, enhancedTask);
    }
}

/**
 * Singleton instance for skill integration
 */
let defaultSkillIntegration: SkillSwarmsIntegration | null = null;

export function getSkillSwarmsIntegration(
    swarmsClient?: SwarmsClient,
): SkillSwarmsIntegration {
    if (!defaultSkillIntegration) {
        defaultSkillIntegration = new SkillSwarmsIntegration(swarmsClient);
    }
    return defaultSkillIntegration;
}
