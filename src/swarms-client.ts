/**
 * Swarms Framework Integration for Ferg Engineering System
 *
 * This module provides TypeScript integration with the Swarms multi-agent framework,
 * enabling swarm-based orchestration of commands, agents, and skills.
 */

export interface SwarmConfig {
    name: string;
    description?: string;
    agents: string[];
    swarm_type:
        | "MultiAgentRouter"
        | "SequentialWorkflow"
        | "AgentRearrange"
        | "ConcurrentWorkflow";
    flow?: string;
    max_loops?: number;
}

export interface Swarm {
    id: string;
    name: string;
    agents: string[];
    swarm_type: string;
    status: "created" | "running" | "completed" | "failed" | "active";
    created_at: string;
}

export interface TaskResult {
    task_id: string;
    swarm_id: string;
    status: "success" | "failed" | "timeout";
    output: string;
    execution_time: number;
    agent_used?: string;
    error?: string;
}

export interface SwarmHealth {
    status: "healthy" | "degraded" | "unhealthy";
    agents_available: number;
    active_swarms: number;
    uptime_seconds: number;
}

/**
 * TypeScript client for Swarms API integration
 */
export class SwarmsClient {
    protected baseUrl: string;
    protected apiKey?: string;

    constructor(
        options: {
            baseUrl?: string;
            apiKey?: string;
        } = {},
    ) {
        this.baseUrl = options.baseUrl || "http://localhost:8000";
        this.apiKey = options.apiKey;
    }

    protected async request<T>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        if (this.apiKey) {
            headers.Authorization = `Bearer ${this.apiKey}`;
        }

        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Swarms API error: ${response.status} ${error}`);
        }

        return response.json();
    }

    /**
     * Create a new swarm
     */
    async createSwarm(config: SwarmConfig): Promise<Swarm> {
        return this.request<Swarm>("/swarms", {
            method: "POST",
            body: JSON.stringify(config),
        });
    }

    /**
     * Get swarm details
     */
    async getSwarm(swarmId: string): Promise<Swarm> {
        return this.request<Swarm>(`/swarms/${swarmId}`);
    }

    /**
     * List all swarms
     */
    async listSwarms(): Promise<Swarm[]> {
        return this.request<Swarm[]>("/swarms");
    }

    /**
     * Run a task on a swarm
     */
    async runTask(
        swarmId: string,
        task: string,
        options: {
            timeout?: number;
            context?: Record<string, any>;
        } = {},
    ): Promise<TaskResult> {
        return this.request<TaskResult>(`/swarms/${swarmId}/run`, {
            method: "POST",
            body: JSON.stringify({
                task,
                ...options,
            }),
        });
    }

    /**
     * Get swarm health status
     */
    async getHealth(): Promise<SwarmHealth> {
        return this.request<SwarmHealth>("/health");
    }

    /**
     * Delete a swarm
     */
    async deleteSwarm(swarmId: string): Promise<void> {
        await this.request(`/swarms/${swarmId}`, {
            method: "DELETE",
        });
    }

    /**
     * Get available agents
     */
    async getAvailableAgents(): Promise<string[]> {
        return this.request<string[]>("/agents");
    }

    /**
     * Register a new agent
     */
    async registerAgent(agentConfig: {
        name: string;
        description: string;
        capabilities: string[];
        instructions: string;
    }): Promise<{ agent_id: string }> {
        return this.request<{ agent_id: string }>("/agents", {
            method: "POST",
            body: JSON.stringify(agentConfig),
        });
    }
}

/**
 * Singleton Swarms client instance
 */
let defaultClient: SwarmsClient | null = null;

export function getSwarmsClient(options?: {
    baseUrl?: string;
    apiKey?: string;
}): SwarmsClient {
    if (!defaultClient) {
        defaultClient = new SwarmsClient(options);
    }
    return defaultClient;
}

/**
 * Get TypeScript-only swarms client (no Python required)
 */
export function getTypeScriptSwarmsClient(options?: {
    timeout?: number;
    maxConcurrency?: number;
    model?: string;
}): SwarmsClient {
    // Import dynamically to avoid circular dependencies
    const {
        createTypeScriptSwarmsClient,
    } = require("./typescript-swarms-executor.js");
    return createTypeScriptSwarmsClient(options);
}

/**
 * Utility function to check if Swarms backend is available
 */
export async function checkSwarmsHealth(
    client?: SwarmsClient,
): Promise<boolean> {
    try {
        const swarmsClient = client || getSwarmsClient();
        const health = await swarmsClient.getHealth();
        return health.status === "healthy";
    } catch (error) {
        console.warn("Swarms backend not available:", error);
        return false;
    }
}
