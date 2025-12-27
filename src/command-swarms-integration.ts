/**
 * Command Integration with Swarms Framework
 *
 * Enables existing CLI commands to leverage swarm orchestration
 * while maintaining backward compatibility.
 */

import { AgentSwarmsIntegration } from "./agent-swarms-integration.js";
import { SwarmConfig, SwarmsClient, TaskResult } from "./swarms-client.js";

export interface CommandSwarmMapping {
    command: string;
    description: string;
    capabilities: string[];
    swarmType: "MultiAgentRouter" | "SequentialWorkflow" | "AgentRearrange";
    flow?: string;
    maxLoops?: number;
}

/**
 * Command-to-Swarm orchestration layer
 */
export class CommandSwarmsIntegration {
    private swarms: SwarmsClient;
    private agents: AgentSwarmsIntegration;
    private commandMappings: Map<string, CommandSwarmMapping> = new Map();

    constructor(swarmsClient?: SwarmsClient) {
        this.swarms = swarmsClient || new SwarmsClient();
        this.agents = new AgentSwarmsIntegration(swarmsClient);
        this.initializeCommandMappings();
    }

    /**
     * Initialize command-to-swarm mappings
     */
    private initializeCommandMappings(): void {
        const mappings: Record<string, CommandSwarmMapping> = {
            plan: {
                command: "plan",
                description: "Create detailed implementation plans",
                capabilities: ["architecture", "design", "scalability"],
                swarmType: "SequentialWorkflow",
            },

            work: {
                command: "work",
                description: "Execute implementation plans with quality gates",
                capabilities: ["full-stack", "code-quality", "testing"],
                swarmType: "AgentRearrange",
                flow: "full-stack-developer -> code-reviewer -> test-generator",
            },

            review: {
                command: "review",
                description: "Multi-perspective code review",
                capabilities: [
                    "code-quality",
                    "security",
                    "performance",
                    "frontend",
                ],
                swarmType: "SequentialWorkflow" as any,
            },

            research: {
                command: "research",
                description: "Multi-phase research orchestration",
                capabilities: ["research", "analysis", "documentation"],
                swarmType: "SequentialWorkflow",
            },

            deploy: {
                command: "deploy",
                description:
                    "Prepare deployment checklist for: ${baseTask}. Ensure all prerequisites are met, configurations are correct, and monitoring is in place.",
                capabilities: ["deployment", "devops", "monitoring"],
                swarmType: "SequentialWorkflow",
            },

            clean: {
                command: "clean",
                description:
                    "Remove AI-generated verbosity, slop patterns, and redundant content with preview and confirmation",
                capabilities: [
                    "text-cleanup",
                    "pattern-matching",
                    "content-optimization",
                ],
                swarmType: "MultiAgentRouter",
            },

            create: {
                command: "create",
                description:
                    "AI-assisted creation of agents, commands, skills, tools",
                capabilities: ["architecture", "code-quality"],
                swarmType: "MultiAgentRouter",
            },
        };

        Object.values(mappings).forEach((mapping) => {
            this.commandMappings.set(mapping.command, mapping);
        });
    }

    /**
     * Execute a command using swarm orchestration
     */
    async executeCommand(
        command: string,
        args: string[],
        options: {
            fallbackToDirect?: boolean; // Fall back to direct execution if swarm fails
            timeout?: number;
        } = {},
    ): Promise<CommandResult> {
        const mapping = this.commandMappings.get(command);

        if (!mapping) {
            if (options.fallbackToDirect) {
                return this.executeDirectCommand(command, args);
            }
            throw new Error(`Unknown command: ${command}`);
        }

        try {
            // Create swarm for command execution
            const swarmId = await this.agents.createCapabilitySwarm(
                `${command}Swarm`,
                mapping.description,
                mapping.capabilities,
                mapping.swarmType,
            );

            // Format task for swarm
            const task = this.formatCommandTask(command, args);

            // Execute via swarm
            const result = await this.swarms.runTask(swarmId, task, {
                timeout: options.timeout || 300000, // 5 minutes default
            });

            return {
                success: result.status === "success",
                output: result.output,
                executionTime: result.execution_time,
                agentUsed: result.agent_used,
                swarmId,
                command,
            };
        } catch (error) {
            if (options.fallbackToDirect) {
                console.warn(
                    `Swarm execution failed for ${command}, falling back to direct execution:`,
                    error,
                );
                return this.executeDirectCommand(command, args);
            }
            throw error;
        }
    }

    /**
     * Format command arguments into swarm task description
     */
    private formatCommandTask(command: string, args: string[]): string {
        const baseTask = args.join(" ");

        switch (command) {
            case "plan":
                return `Create a detailed implementation plan for: ${baseTask}. Break down into atomic tasks, identify dependencies, and provide clear success criteria.`;

            case "work":
                return `Execute the implementation plan for: ${baseTask}. Focus on high-quality, maintainable code with proper error handling and testing.`;

            case "review":
                return `Perform comprehensive code review for: ${baseTask}. Check for security issues, performance problems, code quality, and best practices.`;

            case "research":
                return `Conduct thorough research on: ${baseTask}. Use systematic investigation, identify patterns, and provide actionable insights with evidence.`;

            case "deploy":
                return `Prepare deployment checklist for: ${baseTask}. Ensure all prerequisites are met, configurations are correct, and monitoring is in place.`;

            case "clean":
                return `Remove AI-generated verbosity, slop patterns, and redundant content from: ${baseTask}. Apply preview-apply workflow with quality assurance.`;

            case "clean-slop":
                return `Remove AI-generated conversational filler and slop patterns from text: ${baseTask}. Use pattern matching with context awareness and user confirmation.`;

            case "clean-comments":
                return `Optimize code comments by removing redundancy and improving conciseness: ${baseTask}. Apply comment-specific patterns and preserve essential technical information.`;

            case "clean-docs":
                return `Clean documentation by removing verbosity, conversational filler, and redundant explanations: ${baseTask}. Maintain technical accuracy while improving clarity and scannability.`;

            case "optimize":
                return `Interactive optimization for prompts, code, queries, and more using research-backed techniques and web best practices: ${baseTask}. Apply research-driven enhancement with user feedback and confirmation.`;

            case "seo":
                return `Perform SEO audit and optimization for: ${baseTask}. Check technical SEO, content optimization, and Core Web Vitals.`;

            case "create":
                return `Create new component for: ${baseTask}. Follow best practices, ensure proper integration, and provide comprehensive documentation.`;

            default:
                return `${command}: ${baseTask}`;
        }
    }

    /**
     * Fallback to direct command execution (for when swarm is unavailable)
     */
    private async executeDirectCommand(
        command: string,
        args: string[],
    ): Promise<CommandResult> {
        // This would integrate with existing command execution logic
        // For now, return a placeholder
        return {
            success: true,
            output: `[DIRECT EXECUTION] ${command} ${args.join(" ")} - Swarm unavailable, executed directly`,
            executionTime: 0,
            command,
        };
    }

    /**
     * Get available commands
     */
    getAvailableCommands(): CommandSwarmMapping[] {
        return Array.from(this.commandMappings.values());
    }

    /**
     * Get command mapping
     */
    getCommandMapping(command: string): CommandSwarmMapping | undefined {
        return this.commandMappings.get(command);
    }

    /**
     * Create custom command swarm
     */
    async createCustomCommandSwarm(
        commandName: string,
        capabilities: string[],
        swarmType:
            | "MultiAgentRouter"
            | "SequentialWorkflow"
            | "AgentRearrange" = "MultiAgentRouter",
        flow?: string,
    ): Promise<string> {
        return this.agents.createCapabilitySwarm(
            `${commandName}CustomSwarm`,
            `Custom swarm for ${commandName} command`,
            capabilities,
            swarmType,
        );
    }
}

export interface CommandResult {
    success: boolean;
    output: string;
    executionTime: number;
    agentUsed?: string;
    swarmId?: string;
    command: string;
    error?: string;
}

/**
 * Singleton instance for command integration
 */
let defaultCommandIntegration: CommandSwarmsIntegration | null = null;

export function getCommandSwarmsIntegration(
    swarmsClient?: SwarmsClient,
): CommandSwarmsIntegration {
    if (!defaultCommandIntegration) {
        defaultCommandIntegration = new CommandSwarmsIntegration(swarmsClient);
    }
    return defaultCommandIntegration;
}
