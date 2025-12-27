/**
 * Self-Improvement System for Agent Coordination
 *
 * Tracks agent performance, identifies improvement opportunities,
 * and implements enhancements to the system.
 */

import { EventEmitter } from "node:events";
import type { MemoryManager } from "../context/memory.js";
import type { AgentCoordinator } from "./coordinator.js";
import type { AgentRegistry } from "./registry.js";
import {
    type AgentExecution,
    AgentMetrics,
    type AgentType,
    ImprovementRecord,
} from "./types.js";

export interface PerformancePattern {
    agentType: AgentType;
    pattern:
        | "success-rate"
        | "execution-time"
        | "error-frequency"
        | "quality-score";
    trend: "improving" | "declining" | "stable";
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    evidence: string[];
    suggestedActions: string[];
}

export interface SystemImprovement {
    id: string;
    type:
        | "agent-prompt"
        | "capability"
        | "workflow"
        | "coordination"
        | "communication";
    target: AgentType | "system";
    title: string;
    description: string;
    impact: "low" | "medium" | "high";
    complexity: "low" | "medium" | "high";
    prerequisites: string[];
    implementation: string[];
    successMetrics: string[];
    status: "proposed" | "approved" | "implementing" | "completed" | "failed";
    createdAt: Date;
    implementedAt?: Date;
    effectiveness?: number;
}

/**
 * Self-Improvement Tracker
 * Monitors system performance and implements enhancements
 */
export class SelfImprovementTracker extends EventEmitter {
    private memoryManager: MemoryManager;
    private registry: AgentRegistry;
    private coordinator: AgentCoordinator;
    private improvements: Map<string, SystemImprovement> = new Map();
    private performanceHistory: Map<AgentType, AgentExecution[]> = new Map();

    constructor(
        memoryManager: MemoryManager,
        registry: AgentRegistry,
        coordinator: AgentCoordinator,
    ) {
        super();
        this.memoryManager = memoryManager;
        this.registry = registry;
        this.coordinator = coordinator;
        this.setupEventListeners();
    }

    /**
     * Record agent execution for performance analysis
     */
    async recordExecution(execution: AgentExecution): Promise<void> {
        const agentType = execution.agentType;

        if (!this.performanceHistory.has(agentType)) {
            this.performanceHistory.set(agentType, []);
        }

        this.performanceHistory.get(agentType)?.push(execution);

        // Keep only recent executions (last 100 per agent)
        const history = this.performanceHistory.get(agentType)!;
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }

        // Store in memory
        await this.memoryManager.addMemory(
            "episodic",
            `Agent execution: ${agentType} ${execution.success ? "succeeded" : "failed"} in ${execution.executionTime}ms`,
            {
                source: "agent",
                context: `Execution of ${agentType} for task ${execution.taskId}`,
                tags: [
                    "execution",
                    agentType,
                    execution.success ? "success" : "failure",
                ],
                confidence: 1.0,
            },
        );

        // Analyze for patterns
        await this.analyzePerformancePatterns(agentType);
    }

    /**
     * Analyze performance patterns and suggest improvements
     */
    async analyzePerformancePatterns(
        agentType?: AgentType,
    ): Promise<PerformancePattern[]> {
        const patterns: PerformancePattern[] = [];

        const agentsToAnalyze = agentType
            ? [agentType]
            : Array.from(this.performanceHistory.keys());

        for (const agent of agentsToAnalyze) {
            const executions = this.performanceHistory.get(agent) || [];
            if (executions.length < 5) continue; // Need minimum data

            // Analyze success rate trend
            const successRatePattern = this.analyzeSuccessRate(
                agent,
                executions,
            );
            if (successRatePattern) patterns.push(successRatePattern);

            // Analyze execution time trend
            const executionTimePattern = this.analyzeExecutionTime(
                agent,
                executions,
            );
            if (executionTimePattern) patterns.push(executionTimePattern);

            // Analyze error patterns
            const errorPattern = this.analyzeErrorPatterns(agent, executions);
            if (errorPattern) patterns.push(errorPattern);
        }

        // Generate improvement suggestions
        for (const pattern of patterns) {
            if (
                pattern.severity === "high" ||
                pattern.severity === "critical"
            ) {
                await this.generateImprovementSuggestion(pattern);
            }
        }

        return patterns;
    }

    /**
     * Generate improvement suggestion based on performance pattern
     */
    async generateImprovementSuggestion(
        pattern: PerformancePattern,
    ): Promise<string> {
        const improvementId = `improve_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        const improvement: SystemImprovement = {
            id: improvementId,
            type: this.mapPatternToImprovementType(pattern.pattern),
            target: pattern.agentType,
            title: `Improve ${pattern.pattern} for ${pattern.agentType}`,
            description: pattern.description,
            impact:
                pattern.severity === "critical"
                    ? "high"
                    : pattern.severity === "high"
                      ? "medium"
                      : "low",
            complexity: "medium",
            prerequisites: [`Access to ${pattern.agentType} configuration`],
            implementation: pattern.suggestedActions,
            successMetrics: [
                `Improve ${pattern.pattern} by ${pattern.trend === "declining" ? "reversing" : "maintaining"} trend`,
                "Monitor effectiveness for 30 days",
            ],
            status: "proposed",
            createdAt: new Date(),
        };

        this.improvements.set(improvementId, improvement);

        // Store in memory
        await this.memoryManager.addMemory(
            "declarative",
            `Improvement suggestion: ${improvement.title} - ${improvement.description}`,
            {
                source: "agent",
                context: `Performance analysis for ${pattern.agentType}`,
                tags: [
                    "improvement",
                    "suggestion",
                    pattern.agentType,
                    pattern.pattern,
                ],
                confidence: 0.8,
            },
        );

        this.emit("improvement_suggested", improvement);
        return improvementId;
    }

    /**
     * Implement an approved improvement
     */
    async implementImprovement(improvementId: string): Promise<boolean> {
        const improvement = this.improvements.get(improvementId);
        if (!improvement || improvement.status !== "approved") {
            return false;
        }

        improvement.status = "implementing";
        this.emit("improvement_started", improvement);

        try {
            // Implementation logic based on type
            const success = await this.executeImprovement(improvement);

            if (success) {
                improvement.status = "completed";
                improvement.implementedAt = new Date();
                this.emit("improvement_completed", improvement);
            } else {
                improvement.status = "failed";
                this.emit("improvement_failed", improvement);
            }

            return success;
        } catch (error) {
            improvement.status = "failed";
            this.emit("improvement_failed", { improvement, error });
            return false;
        }
    }

    /**
     * Get pending improvement suggestions
     */
    getPendingImprovements(): SystemImprovement[] {
        return Array.from(this.improvements.values()).filter(
            (imp) => imp.status === "proposed" || imp.status === "approved",
        );
    }

    /**
     * Get implemented improvements with effectiveness ratings
     */
    getImplementedImprovements(): SystemImprovement[] {
        return Array.from(this.improvements.values()).filter(
            (imp) =>
                imp.status === "completed" && imp.effectiveness !== undefined,
        );
    }

    /**
     * Measure effectiveness of implemented improvements
     */
    async measureEffectiveness(improvementId: string): Promise<number> {
        const improvement = this.improvements.get(improvementId);
        if (!improvement || !improvement.implementedAt) {
            return 0;
        }

        // Analyze performance before and after implementation
        const agentType = improvement.target as AgentType;
        const executions = this.performanceHistory.get(agentType) || [];

        const beforeImplement = executions.filter(
            (e) => e.timestamp < improvement.implementedAt!,
        );
        const afterImplement = executions.filter(
            (e) => e.timestamp >= improvement.implementedAt!,
        );

        if (beforeImplement.length < 3 || afterImplement.length < 3) {
            return 0; // Insufficient data
        }

        // Calculate effectiveness based on improvement type
        let effectiveness = 0;

        switch (improvement.type) {
            case "agent-prompt": {
                // Measure success rate improvement
                const beforeSuccess =
                    beforeImplement.filter((e) => e.success).length /
                    beforeImplement.length;
                const afterSuccess =
                    afterImplement.filter((e) => e.success).length /
                    afterImplement.length;
                effectiveness = Math.max(
                    0,
                    Math.min(1, (afterSuccess - beforeSuccess) * 2),
                );
                break;
            }

            case "capability": {
                // Measure execution time improvement
                const beforeAvgTime =
                    beforeImplement.reduce(
                        (sum, e) => sum + e.executionTime,
                        0,
                    ) / beforeImplement.length;
                const afterAvgTime =
                    afterImplement.reduce(
                        (sum, e) => sum + e.executionTime,
                        0,
                    ) / afterImplement.length;
                const timeImprovement =
                    (beforeAvgTime - afterAvgTime) / beforeAvgTime;
                effectiveness = Math.max(0, Math.min(1, timeImprovement));
                break;
            }

            default:
                effectiveness = 0.5; // Neutral for other types
        }

        improvement.effectiveness = effectiveness;
        return effectiveness;
    }

    private analyzeSuccessRate(
        agentType: AgentType,
        executions: AgentExecution[],
    ): PerformancePattern | null {
        const recent = executions.slice(-20); // Last 20 executions
        if (recent.length < 10) return null;

        const successRate =
            recent.filter((e) => e.success).length / recent.length;
        const older = executions.slice(-40, -20);
        const olderSuccessRate =
            older.length > 0
                ? older.filter((e) => e.success).length / older.length
                : successRate;

        const change = successRate - olderSuccessRate;
        const threshold = 0.1; // 10% change threshold

        if (Math.abs(change) < threshold) {
            return {
                agentType,
                pattern: "success-rate",
                trend: "stable",
                severity: "low",
                description: `${agentType} success rate is stable at ${(successRate * 100).toFixed(1)}%`,
                evidence: [
                    `Current: ${(successRate * 100).toFixed(1)}%`,
                    `Previous: ${(olderSuccessRate * 100).toFixed(1)}%`,
                ],
                suggestedActions: [
                    "Monitor continued stability",
                    "Consider optimization if rate drops below 80%",
                ],
            };
        }

        return {
            agentType,
            pattern: "success-rate",
            trend: change > 0 ? "improving" : "declining",
            severity: Math.abs(change) > 0.2 ? "high" : "medium",
            description: `${agentType} success rate is ${change > 0 ? "improving" : "declining"} (${(change * 100).toFixed(1)}% change)`,
            evidence: [
                `Current: ${(successRate * 100).toFixed(1)}%`,
                `Change: ${(change * 100).toFixed(1)}%`,
            ],
            suggestedActions:
                change > 0
                    ? [
                          "Identify factors contributing to improvement",
                          "Document successful patterns",
                      ]
                    : [
                          "Analyze failure causes",
                          "Consider prompt optimization",
                          "Review error handling",
                      ],
        };
    }

    private analyzeExecutionTime(
        agentType: AgentType,
        executions: AgentExecution[],
    ): PerformancePattern | null {
        const recent = executions.slice(-15).filter((e) => e.success);
        if (recent.length < 5) return null;

        const avgTime =
            recent.reduce((sum, e) => sum + e.executionTime, 0) / recent.length;
        const older = executions.slice(-30, -15).filter((e) => e.success);
        const olderAvgTime =
            older.length > 0
                ? older.reduce((sum, e) => sum + e.executionTime, 0) /
                  older.length
                : avgTime;

        const changePercent = (avgTime - olderAvgTime) / olderAvgTime;
        const threshold = 0.2; // 20% change threshold

        if (Math.abs(changePercent) < threshold) return null;

        return {
            agentType,
            pattern: "execution-time",
            trend: changePercent < 0 ? "improving" : "declining",
            severity: Math.abs(changePercent) > 0.5 ? "high" : "medium",
            description: `${agentType} execution time ${changePercent < 0 ? "improved" : "increased"} by ${(Math.abs(changePercent) * 100).toFixed(1)}%`,
            evidence: [
                `Current avg: ${avgTime.toFixed(0)}ms`,
                `Previous avg: ${olderAvgTime.toFixed(0)}ms`,
            ],
            suggestedActions:
                changePercent < 0
                    ? [
                          "Document optimization techniques",
                          "Apply to similar agents",
                      ]
                    : [
                          "Profile performance bottlenecks",
                          "Consider algorithm optimization",
                          "Review resource usage",
                      ],
        };
    }

    private analyzeErrorPatterns(
        agentType: AgentType,
        executions: AgentExecution[],
    ): PerformancePattern | null {
        const recent = executions.slice(-20);
        const errorRate =
            recent.filter((e) => !e.success).length / recent.length;

        if (errorRate < 0.1) return null; // Low error rate, no issue

        const errorMessages = recent
            .filter((e) => !e.success && e.error)
            .map((e) => e.error!)
            .reduce(
                (acc, error) => {
                    acc[error] = (acc[error] || 0) + 1;
                    return acc;
                },
                {} as Record<string, number>,
            );

        const topErrors = Object.entries(errorMessages)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);

        return {
            agentType,
            pattern: "error-frequency",
            trend: "declining", // High error rate indicates decline
            severity:
                errorRate > 0.3
                    ? "critical"
                    : errorRate > 0.2
                      ? "high"
                      : "medium",
            description: `${agentType} has ${(errorRate * 100).toFixed(1)}% error rate`,
            evidence: topErrors.map(
                ([error, count]) => `${error}: ${count} times`,
            ),
            suggestedActions: [
                "Analyze root causes of top errors",
                "Improve error handling and recovery",
                "Consider input validation improvements",
                "Review timeout and resource limits",
            ],
        };
    }

    private mapPatternToImprovementType(
        pattern: PerformancePattern["pattern"],
    ): SystemImprovement["type"] {
        switch (pattern) {
            case "success-rate":
                return "agent-prompt";
            case "execution-time":
                return "capability";
            case "error-frequency":
                return "workflow";
            case "quality-score":
                return "communication";
            default:
                return "agent-prompt";
        }
    }

    private async executeImprovement(
        improvement: SystemImprovement,
    ): Promise<boolean> {
        // Implementation logic based on improvement type
        switch (improvement.type) {
            case "agent-prompt":
                return await this.updateAgentPrompt(improvement);
            case "capability":
                return await this.addAgentCapability(improvement);
            case "workflow":
                return await this.optimizeWorkflow(improvement);
            case "coordination":
                return await this.improveCoordination(improvement);
            case "communication":
                return await this.enhanceCommunication(improvement);
            default:
                return false;
        }
    }

    private async updateAgentPrompt(
        improvement: SystemImprovement,
    ): Promise<boolean> {
        // Update agent prompt in registry and filesystem
        const agentType = improvement.target as AgentType;
        const agent = this.registry.get(agentType);

        if (!agent) return false;

        // Enhanced prompt with improvement
        const enhancedPrompt = `${agent.prompt}\n\n## Recent Improvements\n${improvement.description}\n${improvement.implementation.join("\n")}`;

        // Update in registry (in real implementation, also update filesystem)
        (agent as any).prompt = enhancedPrompt;

        return true;
    }

    private async addAgentCapability(
        improvement: SystemImprovement,
    ): Promise<boolean> {
        // Add capability to agent definition
        const agentType = improvement.target as AgentType;
        const agent = this.registry.get(agentType);

        if (!agent) return false;

        // Add new capability
        const newCapability = improvement.title
            .toLowerCase()
            .replace(/\s+/g, "-");
        if (!agent.capabilities.includes(newCapability)) {
            agent.capabilities.push(newCapability);
        }

        return true;
    }

    private async optimizeWorkflow(
        improvement: SystemImprovement,
    ): Promise<boolean> {
        // Update coordinator configuration or workflow
        // This would modify execution strategies, timeouts, etc.
        return true;
    }

    private async improveCoordination(
        improvement: SystemImprovement,
    ): Promise<boolean> {
        // Update coordination logic
        return true;
    }

    private async enhanceCommunication(
        improvement: SystemImprovement,
    ): Promise<boolean> {
        // Update communication patterns
        return true;
    }

    private setupEventListeners(): void {
        this.on("improvement_suggested", (improvement: SystemImprovement) => {
            console.log(
                `💡 Improvement suggested: ${improvement.title} (${improvement.impact} impact)`,
            );
        });

        this.on("improvement_completed", (improvement: SystemImprovement) => {
            console.log(`✅ Improvement implemented: ${improvement.title}`);
        });

        this.on("improvement_failed", (improvement: SystemImprovement) => {
            console.log(`❌ Improvement failed: ${improvement.title}`);
        });
    }

    /**
     * Get system improvement statistics
     */
    getStats(): {
        totalImprovements: number;
        completedImprovements: number;
        averageEffectiveness: number;
        pendingSuggestions: number;
    } {
        const allImprovements = Array.from(this.improvements.values());
        const completed = allImprovements.filter(
            (i) => i.status === "completed" && i.effectiveness !== undefined,
        );
        const avgEffectiveness =
            completed.length > 0
                ? completed.reduce(
                      (sum, i) => sum + (i.effectiveness || 0),
                      0,
                  ) / completed.length
                : 0;

        return {
            totalImprovements: allImprovements.length,
            completedImprovements: completed.length,
            averageEffectiveness: Math.round(avgEffectiveness * 100) / 100,
            pendingSuggestions: allImprovements.filter(
                (i) => i.status === "proposed",
            ).length,
        };
    }
}

/**
 * Singleton instance
 */
let defaultTracker: SelfImprovementTracker | null = null;

export function getSelfImprovementTracker(
    memoryManager?: MemoryManager,
    registry?: AgentRegistry,
    coordinator?: AgentCoordinator,
): SelfImprovementTracker {
    if (!defaultTracker && memoryManager && registry && coordinator) {
        defaultTracker = new SelfImprovementTracker(
            memoryManager,
            registry,
            coordinator,
        );
    }
    return defaultTracker!;
}
