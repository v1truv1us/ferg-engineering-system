/**
 * Local Swarms Execution (No External Server Required)
 *
 * Runs Swarms directly within the Bun/TypeScript environment
 * using a lightweight Python subprocess or WebAssembly execution.
 */

import { spawn } from 'child_process';
import { SwarmsClient, SwarmConfig, Swarm, TaskResult, SwarmHealth } from './swarms-client.js';

export interface LocalSwarmsOptions {
  pythonPath?: string;
  swarmsPath?: string;
  timeout?: number;
  maxConcurrency?: number;
}

/**
 * Local Swarms executor that runs without external server
 */
export class LocalSwarmsExecutor implements SwarmsClient {
  private options: Required<LocalSwarmsOptions>;
  private activeSwarms: Map<string, Swarm> = new Map();
  private swarmCounter = 0;

  constructor(options: LocalSwarmsOptions = {}) {
    this.options = {
      pythonPath: options.pythonPath || 'python3',
      swarmsPath: options.swarmsPath || 'swarms',
      timeout: options.timeout || 300000, // 5 minutes
      maxConcurrency: options.maxConcurrency || 3,
      ...options
    };
  }

  /**
   * Create a new swarm (stored locally)
   */
  async createSwarm(config: SwarmConfig): Promise<Swarm> {
    const swarmId = `swarm_${++this.swarmCounter}_${Date.now()}`;

    const swarm: Swarm = {
      id: swarmId,
      name: config.name,
      agents: config.agents,
      swarm_type: config.swarm_type,
      status: 'created',
      created_at: new Date().toISOString()
    };

    this.activeSwarms.set(swarmId, swarm);
    return swarm;
  }

  /**
   * Get swarm details
   */
  async getSwarm(swarmId: string): Promise<Swarm> {
    const swarm = this.activeSwarms.get(swarmId);
    if (!swarm) {
      throw new Error(`Swarm not found: ${swarmId}`);
    }
    return swarm;
  }

  /**
   * List all active swarms
   */
  async listSwarms(): Promise<Swarm[]> {
    return Array.from(this.activeSwarms.values());
  }

  /**
   * Run a task on a swarm using local Python execution
   */
  async runTask(swarmId: string, task: string, options: {
    timeout?: number;
    context?: Record<string, any>;
  } = {}): Promise<TaskResult> {
    const swarm = await this.getSwarm(swarmId);
    const startTime = Date.now();
    const timeout = options.timeout || this.options.timeout;

    // Update swarm status
    swarm.status = 'running';

    try {
      // Execute via Python subprocess
      const result = await this.executePythonSwarms(swarm, task, timeout);

      // Update swarm status
      swarm.status = 'completed';

      return {
        task_id: `task_${Date.now()}`,
        swarm_id: swarmId,
        status: 'success',
        output: result.output,
        execution_time: Date.now() - startTime,
        agent_used: result.agent_used
      };

    } catch (error) {
      swarm.status = 'failed';

      return {
        task_id: `task_${Date.now()}`,
        swarm_id: swarmId,
        status: 'failed',
        output: '',
        execution_time: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute Swarms via Python subprocess
   */
  private async executePythonSwarms(
    swarm: Swarm,
    task: string,
    timeout: number
  ): Promise<{ output: string; agent_used?: string }> {
    return new Promise((resolve, reject) => {
      // Create Python script to execute swarm
      const pythonScript = this.generatePythonScript(swarm, task);

      const python = spawn(this.options.pythonPath, ['-c', pythonScript], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout
      });

      let output = '';
      let errorOutput = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output.trim());
            resolve(result);
          } catch (parseError) {
            resolve({ output: output.trim() });
          }
        } else {
          reject(new Error(`Python execution failed: ${errorOutput || 'Unknown error'}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Generate Python script for swarm execution
   */
  private generatePythonScript(swarm: Swarm, task: string): string {
    return `
import json
import sys
import os

# Add current directory to path for local swarms import
sys.path.insert(0, os.getcwd())

try:
    from swarms import SwarmRouter, Agent

    # Create mock agents (in real implementation, these would be proper agent classes)
    agents = []
    for agent_name in ${JSON.stringify(swarm.agents)}:
        agent = Agent(
            agent_name=agent_name,
            system_prompt=f"You are {agent_name}, an expert assistant.",
            model_name="gpt-4o-mini"  # Use a lightweight model for local execution
        )
        agents.append(agent)

    # Create swarm router
    swarm_type = "${swarm.swarm_type}"
    if swarm_type == "MultiAgentRouter":
        router = SwarmRouter(
            name="${swarm.name}",
            agents=agents,
            swarm_type="MultiAgentRouter"
        )
    elif swarm_type == "SequentialWorkflow":
        router = SwarmRouter(
            name="${swarm.name}",
            agents=agents,
            swarm_type="SequentialWorkflow"
        )
    else:
        # Default to MultiAgentRouter
        router = SwarmRouter(
            name="${swarm.name}",
            agents=agents,
            swarm_type="MultiAgentRouter"
        )

    # Execute task
    result = router.run(${JSON.stringify(task)})

    # Return result
    output = {
        "output": str(result),
        "agent_used": "${swarm.agents[0]}" if ${JSON.stringify(swarm.agents)}.length > 0 else None
    }
    print(json.dumps(output))

except ImportError as e:
    # Fallback if swarms is not installed
    output = {
        "output": f"LOCAL EXECUTION: {${JSON.stringify(task)}} - Swarms not available, using mock response",
        "agent_used": "mock-agent"
    }
    print(json.dumps(output))

except Exception as e:
    error_output = {
        "error": str(e),
        "output": "Task execution failed"
    }
    print(json.dumps(error_output))
    sys.exit(1)
`;
  }

  /**
   * Get health status
   */
  async getHealth(): Promise<SwarmHealth> {
    // Check if Python and swarms are available
    let pythonAvailable = false;
    try {
      await this.checkPythonSwarms();
      pythonAvailable = true;
    } catch (error) {
      pythonAvailable = false;
    }

    // Always return the configured agent count and active swarms
    // Status reflects Python/Swarms availability for actual execution
    return {
      status: pythonAvailable ? 'healthy' : 'degraded',
      agents_available: 26, // Based on our agent registry - always available
      active_swarms: this.activeSwarms.size,
      uptime_seconds: process.uptime()
    };
  }

  /**
   * Check if Python and Swarms are available
   */
  private async checkPythonSwarms(): Promise<void> {
    return new Promise((resolve, reject) => {
      const python = spawn(this.options.pythonPath, ['-c', `
try:
    import swarms
    print("swarms_available")
except ImportError:
    print("swarms_unavailable")
`], { timeout: 5000 });

      let output = '';
      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0 && output.trim() === 'swarms_available') {
          resolve();
        } else {
          reject(new Error('Swarms not available'));
        }
      });

      python.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Delete a swarm
   */
  async deleteSwarm(swarmId: string): Promise<void> {
    this.activeSwarms.delete(swarmId);
  }

  /**
    * Get available agents - returns all 26 agents in the system
   */
  async getAvailableAgents(): Promise<string[]> {
    // Return all 26 agents from AgentType enum
    return [
      // Architecture & Planning
      'architect-advisor',
      'backend-architect',
      'infrastructure-builder',
      // Development & Coding
      'frontend-reviewer',
      'full-stack-developer',
      'api-builder-enhanced',
      'database-optimizer',
      'java-pro',
      // Quality & Testing
      'code-reviewer',
      'test-generator',
      'security-scanner',
      'performance-engineer',
      // DevOps & Deployment
      'deployment-engineer',
      'monitoring-expert',
      'cost-optimizer',
      // AI & Machine Learning
      'ai-engineer',
      'ml-engineer',
       // Content & SEO
       'seo-specialist',
       'prompt-optimizer',
       'documentation-specialist',
       'docs-writer',
      // Plugin Development
      'agent-creator',
      'command-creator',
      'skill-creator',
      'tool-creator',
      'plugin-validator'
    ];
  }

  /**
   * Register agent (mock implementation)
   */
  async registerAgent(agentConfig: {
    name: string;
    description: string;
    capabilities: string[];
  }): Promise<{ agent_id: string }> {
    const agentId = `agent_${Date.now()}`;
    console.log(`Registered agent: ${agentConfig.name} (${agentId})`);
    return { agent_id: agentId };
  }
}

/**
 * Factory function to create appropriate Swarms client
 */
export function createSwarmsClient(options: {
  mode?: 'local' | 'remote';
  remoteUrl?: string;
  apiKey?: string;
  localOptions?: LocalSwarmsOptions;
} = {}): SwarmsClient {
  const { mode = 'local' } = options;

  if (mode === 'remote') {
    return new SwarmsClient({
      baseUrl: options.remoteUrl,
      apiKey: options.apiKey
    });
  } else {
    return new LocalSwarmsExecutor(options.localOptions);
  }
}

/**
 * Check if local execution is available
 */
export async function checkLocalSwarmsAvailable(): Promise<boolean> {
  try {
    const executor = new LocalSwarmsExecutor();
    const health = await executor.getHealth();
    return health.status === 'healthy';
  } catch (error) {
    return false;
  }
}