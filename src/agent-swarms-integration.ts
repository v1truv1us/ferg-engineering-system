/**
 * Agent Integration with Swarms Framework
 *
 * Maps existing Ferg Engineering agents to Swarms capabilities
 * and provides dynamic swarm creation based on task requirements.
 */

import { SwarmsClient, SwarmConfig, TaskResult } from './swarms-client.js';

export interface AgentCapability {
  name: string;
  description: string;
  confidence: number; // 0-1, how well agent handles this capability
}

export interface AgentManifest {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
  handoffs?: string[]; // Agents this agent can delegate to
  swarm_types: string[]; // Compatible swarm types
}

/**
 * Agent capability registry and swarm orchestration
 */
export class AgentSwarmsIntegration {
  private swarms: SwarmsClient;
  private agentRegistry: Map<string, AgentManifest> = new Map();

  constructor(swarmsClient?: SwarmsClient) {
    this.swarms = swarmsClient || new SwarmsClient();
    this.initializeAgentRegistry();
  }

  /**
   * Initialize agent registry from existing agent definitions
   */
  private initializeAgentRegistry(): void {
    // Map existing agents to capabilities based on their documented roles
    const agentMappings: Record<string, AgentManifest> = {
      'architect-advisor': {
        id: 'architect-advisor',
        name: 'Architect Advisor',
        description: 'System architecture and technical decision guidance',
        capabilities: [
          { name: 'architecture', description: 'System architecture design', confidence: 0.95 },
          { name: 'scalability', description: 'Scalability analysis and planning', confidence: 0.90 },
          { name: 'design', description: 'Technical design and trade-off analysis', confidence: 0.85 }
        ],
        handoffs: ['backend-architect', 'infrastructure-builder'],
        swarm_types: ['MultiAgentRouter', 'SequentialWorkflow']
      },

      'backend-architect': {
        id: 'backend-architect',
        name: 'Backend Architect',
        description: 'Backend system design and API architecture',
        capabilities: [
          { name: 'backend', description: 'Backend system design', confidence: 0.95 },
          { name: 'api-design', description: 'API design and architecture', confidence: 0.90 },
          { name: 'database', description: 'Database design and optimization', confidence: 0.85 }
        ],
        handoffs: ['architect-advisor', 'database-optimizer'],
        swarm_types: ['SequentialWorkflow', 'AgentRearrange']
      },

      'frontend-reviewer': {
        id: 'frontend-reviewer',
        name: 'Frontend Reviewer',
        description: 'Frontend code review and UI/UX assessment',
        capabilities: [
          { name: 'frontend', description: 'Frontend development', confidence: 0.95 },
          { name: 'ui', description: 'User interface design', confidence: 0.90 },
          { name: 'ux', description: 'User experience optimization', confidence: 0.85 },
          { name: 'accessibility', description: 'Accessibility compliance', confidence: 0.80 }
        ],
        handoffs: ['architect-advisor', 'performance-engineer'],
        swarm_types: ['MultiAgentRouter', 'ConcurrentWorkflow']
      },

      'code-reviewer': {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        description: 'Comprehensive code quality assessment',
        capabilities: [
          { name: 'code-quality', description: 'Code quality analysis', confidence: 0.95 },
          { name: 'best-practices', description: 'Coding best practices', confidence: 0.90 },
          { name: 'security', description: 'Security code review', confidence: 0.80 }
        ],
        handoffs: ['security-scanner', 'performance-engineer'],
        swarm_types: ['SequentialWorkflow', 'AgentRearrange']
      },

      'security-scanner': {
        id: 'security-scanner',
        name: 'Security Scanner',
        description: 'Security vulnerability detection and fixes',
        capabilities: [
          { name: 'security', description: 'Security analysis', confidence: 0.95 },
          { name: 'vulnerabilities', description: 'Vulnerability assessment', confidence: 0.90 },
          { name: 'compliance', description: 'Security compliance', confidence: 0.85 }
        ],
        handoffs: ['code-reviewer', 'architect-advisor'],
        swarm_types: ['MultiAgentRouter', 'SequentialWorkflow']
      },

      'performance-engineer': {
        id: 'performance-engineer',
        name: 'Performance Engineer',
        description: 'Application performance optimization',
        capabilities: [
          { name: 'performance', description: 'Performance analysis', confidence: 0.95 },
          { name: 'optimization', description: 'Performance optimization', confidence: 0.90 },
          { name: 'monitoring', description: 'Performance monitoring', confidence: 0.85 }
        ],
        handoffs: ['architect-advisor', 'infrastructure-builder'],
        swarm_types: ['AgentRearrange', 'SequentialWorkflow']
      },

      'full-stack-developer': {
        id: 'full-stack-developer',
        name: 'Full Stack Developer',
        description: 'End-to-end application development',
        capabilities: [
          { name: 'frontend', description: 'Frontend development', confidence: 0.80 },
          { name: 'backend', description: 'Backend development', confidence: 0.85 },
          { name: 'full-stack', description: 'Full-stack development', confidence: 0.90 }
        ],
        handoffs: ['code-reviewer', 'test-generator'],
        swarm_types: ['SequentialWorkflow', 'AgentRearrange']
      },

      'test-generator': {
        id: 'test-generator',
        name: 'Test Generator',
        description: 'Automated test suite generation',
        capabilities: [
          { name: 'testing', description: 'Test generation', confidence: 0.95 },
          { name: 'quality-assurance', description: 'Quality assurance', confidence: 0.90 },
          { name: 'automation', description: 'Test automation', confidence: 0.85 }
        ],
        handoffs: ['code-reviewer', 'performance-engineer'],
        swarm_types: ['ConcurrentWorkflow', 'SequentialWorkflow']
      },

      'deployment-engineer': {
        id: 'deployment-engineer',
        name: 'Deployment Engineer',
        description: 'CI/CD pipeline design and deployment automation',
        capabilities: [
          { name: 'deployment', description: 'Deployment automation', confidence: 0.95 },
          { name: 'devops', description: 'DevOps practices', confidence: 0.90 },
          { name: 'ci-cd', description: 'CI/CD pipeline design', confidence: 0.85 }
        ],
        handoffs: ['infrastructure-builder', 'monitoring-expert'],
        swarm_types: ['SequentialWorkflow', 'AgentRearrange']
      },

      'infrastructure-builder': {
        id: 'infrastructure-builder',
        name: 'Infrastructure Builder',
        description: 'Cloud infrastructure design and IaC',
        capabilities: [
          { name: 'infrastructure', description: 'Infrastructure design', confidence: 0.95 },
          { name: 'cloud', description: 'Cloud architecture', confidence: 0.90 },
          { name: 'iac', description: 'Infrastructure as Code', confidence: 0.85 }
        ],
        handoffs: ['architect-advisor', 'deployment-engineer'],
        swarm_types: ['SequentialWorkflow', 'MultiAgentRouter']
      },

      'monitoring-expert': {
        id: 'monitoring-expert',
        name: 'Monitoring Expert',
        description: 'Observability, alerting, and system monitoring',
        capabilities: [
          { name: 'monitoring', description: 'System monitoring', confidence: 0.95 },
          { name: 'observability', description: 'Observability setup', confidence: 0.90 },
          { name: 'alerting', description: 'Alert configuration', confidence: 0.85 }
        ],
        handoffs: ['performance-engineer', 'infrastructure-builder'],
        swarm_types: ['MultiAgentRouter', 'ConcurrentWorkflow']
      },

      'seo-specialist': {
        id: 'seo-specialist',
        name: 'SEO Specialist',
        description: 'Technical and on-page SEO expertise',
        capabilities: [
          { name: 'seo', description: 'SEO optimization', confidence: 0.95 },
          { name: 'technical-seo', description: 'Technical SEO', confidence: 0.90 },
          { name: 'content-optimization', description: 'Content optimization', confidence: 0.85 }
        ],
        handoffs: ['frontend-reviewer', 'architect-advisor'],
        swarm_types: ['MultiAgentRouter', 'SequentialWorkflow']
      },

      'prompt-optimizer': {
        id: 'prompt-optimizer',
        name: 'Prompt Optimizer',
        description: 'Prompt enhancement using research-backed techniques',
        capabilities: [
          { name: 'prompt-engineering', description: 'Prompt optimization', confidence: 0.95 },
          { name: 'ai-interaction', description: 'AI interaction optimization', confidence: 0.90 }
        ],
        handoffs: ['architect-advisor'],
        swarm_types: ['MultiAgentRouter']
      },

      'docs-writer': {
        id: 'docs-writer',
        name: 'Documentation Writer',
        description: 'Specialized documentation page writer with specific formatting rules',
        capabilities: [
          { name: 'documentation', description: 'Technical documentation writing', confidence: 0.95 },
          { name: 'content-creation', description: 'Content creation and formatting', confidence: 0.90 },
          { name: 'technical-writing', description: 'Technical writing and editing', confidence: 0.85 }
        ],
        handoffs: ['documentation-specialist', 'seo-specialist'],
        swarm_types: ['MultiAgentRouter', 'SequentialWorkflow']
      },

      'documentation-specialist': {
        id: 'documentation-specialist',
        name: 'Documentation Specialist',
        description: 'Comprehensive technical documentation generation and API docs',
        capabilities: [
          { name: 'documentation', description: 'Comprehensive documentation generation', confidence: 0.95 },
          { name: 'api-documentation', description: 'API documentation and guides', confidence: 0.90 },
          { name: 'technical-specs', description: 'Technical specifications and guides', confidence: 0.85 },
          { name: 'user-guides', description: 'User guides and tutorials', confidence: 0.80 }
        ],
        handoffs: ['docs-writer', 'architect-advisor', 'frontend-reviewer'],
        swarm_types: ['SequentialWorkflow', 'AgentRearrange']
      },

      // === Development & Coding (additional) ===
      'api-builder-enhanced': {
        id: 'api-builder-enhanced',
        name: 'API Builder Enhanced',
        description: 'REST/GraphQL API development with comprehensive documentation',
        capabilities: [
          { name: 'api-design', description: 'REST and GraphQL API design', confidence: 0.95 },
          { name: 'rest', description: 'RESTful API development', confidence: 0.90 },
          { name: 'graphql', description: 'GraphQL schema and resolver design', confidence: 0.85 },
          { name: 'documentation', description: 'OpenAPI/Swagger documentation', confidence: 0.85 }
        ],
        handoffs: ['backend-architect', 'database-optimizer', 'security-scanner'],
        swarm_types: ['SequentialWorkflow', 'AgentRearrange']
      },

      'database-optimizer': {
        id: 'database-optimizer',
        name: 'Database Optimizer',
        description: 'Database performance tuning and query optimization',
        capabilities: [
          { name: 'database', description: 'Database design and optimization', confidence: 0.95 },
          { name: 'query-optimization', description: 'SQL query performance tuning', confidence: 0.90 },
          { name: 'indexing', description: 'Index strategy and optimization', confidence: 0.90 },
          { name: 'data-modeling', description: 'Data model design', confidence: 0.85 }
        ],
        handoffs: ['backend-architect', 'performance-engineer'],
        swarm_types: ['SequentialWorkflow', 'MultiAgentRouter']
      },

      'java-pro': {
        id: 'java-pro',
        name: 'Java Pro',
        description: 'Java development with modern features and enterprise patterns',
        capabilities: [
          { name: 'java', description: 'Java development expertise', confidence: 0.95 },
          { name: 'spring', description: 'Spring Boot and Spring Framework', confidence: 0.90 },
          { name: 'enterprise', description: 'Enterprise Java patterns', confidence: 0.85 },
          { name: 'jvm', description: 'JVM optimization and tuning', confidence: 0.80 }
        ],
        handoffs: ['backend-architect', 'performance-engineer', 'test-generator'],
        swarm_types: ['SequentialWorkflow', 'AgentRearrange']
      },

      // === DevOps & Deployment (additional) ===
      'cost-optimizer': {
        id: 'cost-optimizer',
        name: 'Cost Optimizer',
        description: 'Cloud cost optimization and resource efficiency',
        capabilities: [
          { name: 'cost-optimization', description: 'Cloud cost analysis and reduction', confidence: 0.95 },
          { name: 'resource-efficiency', description: 'Resource utilization optimization', confidence: 0.90 },
          { name: 'cloud-economics', description: 'Cloud pricing and budgeting', confidence: 0.85 }
        ],
        handoffs: ['infrastructure-builder', 'architect-advisor'],
        swarm_types: ['MultiAgentRouter', 'SequentialWorkflow']
      },

      // === AI & Machine Learning ===
      'ai-engineer': {
        id: 'ai-engineer',
        name: 'AI Engineer',
        description: 'AI integration and LLM application development',
        capabilities: [
          { name: 'ai-integration', description: 'AI/ML system integration', confidence: 0.95 },
          { name: 'llm', description: 'Large Language Model applications', confidence: 0.90 },
          { name: 'rag', description: 'Retrieval-Augmented Generation', confidence: 0.85 },
          { name: 'embeddings', description: 'Vector embeddings and search', confidence: 0.85 }
        ],
        handoffs: ['prompt-optimizer', 'ml-engineer', 'architect-advisor'],
        swarm_types: ['MultiAgentRouter', 'SequentialWorkflow']
      },

      'ml-engineer': {
        id: 'ml-engineer',
        name: 'ML Engineer',
        description: 'Machine learning model development and deployment',
        capabilities: [
          { name: 'machine-learning', description: 'ML model development', confidence: 0.95 },
          { name: 'model-training', description: 'Model training and fine-tuning', confidence: 0.90 },
          { name: 'mlops', description: 'ML operations and deployment', confidence: 0.85 },
          { name: 'data-science', description: 'Data analysis and feature engineering', confidence: 0.80 }
        ],
        handoffs: ['ai-engineer', 'performance-engineer', 'infrastructure-builder'],
        swarm_types: ['SequentialWorkflow', 'AgentRearrange']
      },

      // === Plugin Development ===
      'agent-creator': {
        id: 'agent-creator',
        name: 'Agent Creator',
        description: 'AI-assisted agent generation and configuration',
        capabilities: [
          { name: 'agent-design', description: 'Agent architecture and design', confidence: 0.95 },
          { name: 'prompt-crafting', description: 'Agent prompt engineering', confidence: 0.90 },
          { name: 'capability-mapping', description: 'Agent capability definition', confidence: 0.85 }
        ],
        handoffs: ['plugin-validator', 'prompt-optimizer'],
        swarm_types: ['SequentialWorkflow', 'MultiAgentRouter']
      },

      'command-creator': {
        id: 'command-creator',
        name: 'Command Creator',
        description: 'AI-assisted command generation for CLI workflows',
        capabilities: [
          { name: 'command-design', description: 'CLI command architecture', confidence: 0.95 },
          { name: 'workflow-automation', description: 'Workflow automation patterns', confidence: 0.90 },
          { name: 'cli-ux', description: 'Command-line user experience', confidence: 0.85 }
        ],
        handoffs: ['plugin-validator', 'agent-creator'],
        swarm_types: ['SequentialWorkflow', 'MultiAgentRouter']
      },

      'skill-creator': {
        id: 'skill-creator',
        name: 'Skill Creator',
        description: 'AI-assisted skill creation for modular knowledge',
        capabilities: [
          { name: 'skill-design', description: 'Skill architecture and structure', confidence: 0.95 },
          { name: 'knowledge-modeling', description: 'Domain knowledge organization', confidence: 0.90 },
          { name: 'documentation', description: 'Skill documentation best practices', confidence: 0.85 }
        ],
        handoffs: ['plugin-validator', 'agent-creator'],
        swarm_types: ['SequentialWorkflow', 'MultiAgentRouter']
      },

      'tool-creator': {
        id: 'tool-creator',
        name: 'Tool Creator',
        description: 'AI-assisted custom tool creation',
        capabilities: [
          { name: 'tool-design', description: 'Tool API design', confidence: 0.95 },
          { name: 'integration', description: 'Tool integration patterns', confidence: 0.90 },
          { name: 'api-design', description: 'Tool interface design', confidence: 0.85 }
        ],
        handoffs: ['plugin-validator', 'api-builder-enhanced'],
        swarm_types: ['SequentialWorkflow', 'MultiAgentRouter']
      },

      'plugin-validator': {
        id: 'plugin-validator',
        name: 'Plugin Validator',
        description: 'Plugin structure validation and best practices enforcement',
        capabilities: [
          { name: 'validation', description: 'Plugin structure validation', confidence: 0.95 },
          { name: 'best-practices', description: 'Plugin best practices', confidence: 0.90 },
          { name: 'compatibility', description: 'Cross-platform compatibility', confidence: 0.85 }
        ],
        handoffs: ['agent-creator', 'command-creator', 'skill-creator', 'tool-creator'],
        swarm_types: ['MultiAgentRouter', 'ConcurrentWorkflow']
      }
    };

    // Register all agents
    Object.values(agentMappings).forEach(manifest => {
      this.agentRegistry.set(manifest.id, manifest);
    });
  }

  /**
   * Get agent manifest by ID
   */
  getAgentManifest(agentId: string): AgentManifest | undefined {
    return this.agentRegistry.get(agentId);
  }

  /**
   * Find agents with specific capabilities
   */
  findAgentsByCapabilities(requiredCapabilities: string[], minConfidence = 0.7): AgentManifest[] {
    const matchingAgents: AgentManifest[] = [];

    for (const agent of this.agentRegistry.values()) {
      const hasCapabilities = requiredCapabilities.every(requiredCap =>
        agent.capabilities.some(agentCap =>
          agentCap.name === requiredCap && agentCap.confidence >= minConfidence
        )
      );

      if (hasCapabilities) {
        matchingAgents.push(agent);
      }
    }

    return matchingAgents;
  }

  /**
   * Create a swarm optimized for specific capabilities
   */
  async createCapabilitySwarm(
    name: string,
    description: string,
    capabilities: string[],
    swarmType: 'MultiAgentRouter' | 'SequentialWorkflow' | 'AgentRearrange' = 'MultiAgentRouter'
  ): Promise<string> {
    const agents = this.findAgentsByCapabilities(capabilities);

    if (agents.length === 0) {
      throw new Error(`No agents found with capabilities: ${capabilities.join(', ')}`);
    }

    const agentIds = agents.map(a => a.id);

    const config: SwarmConfig = {
      name,
      description,
      agents: agentIds,
      swarm_type: swarmType
    };

    // Add flow for AgentRearrange type
    if (swarmType === 'AgentRearrange' && agents.length > 1) {
      config.flow = agentIds.join(' -> ');
    }

    const swarm = await this.swarms.createSwarm(config);
    return swarm.id;
  }

  /**
   * Execute a task using capability-based agent selection
   */
  async executeTaskWithCapabilities(
    task: string,
    capabilities: string[],
    options: {
      swarmType?: 'MultiAgentRouter' | 'SequentialWorkflow' | 'AgentRearrange';
      timeout?: number;
    } = {}
  ): Promise<TaskResult> {
    const swarmId = await this.createCapabilitySwarm(
      `CapabilitySwarm-${capabilities.join('-')}`,
      `Swarm for capabilities: ${capabilities.join(', ')}`,
      capabilities,
      options.swarmType
    );

    return this.swarms.runTask(swarmId, task, {
      timeout: options.timeout
    });
  }

  /**
   * Get all available agents
   */
  getAvailableAgents(): AgentManifest[] {
    return Array.from(this.agentRegistry.values());
  }

  /**
   * Get agent capabilities summary
   */
  getCapabilitiesSummary(): Record<string, number> {
    const summary: Record<string, number> = {};

    for (const agent of this.agentRegistry.values()) {
      for (const capability of agent.capabilities) {
        summary[capability.name] = (summary[capability.name] || 0) + 1;
      }
    }

    return summary;
  }
}

/**
 * Singleton instance for agent integration
 */
let defaultAgentIntegration: AgentSwarmsIntegration | null = null;

export function getAgentSwarmsIntegration(swarmsClient?: SwarmsClient): AgentSwarmsIntegration {
  if (!defaultAgentIntegration) {
    defaultAgentIntegration = new AgentSwarmsIntegration(swarmsClient);
  }
  return defaultAgentIntegration;
}