/**
 * Tests for AgentSwarmsIntegration
 * Verifies all 24 agents are properly mapped with capabilities
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import { 
  AgentSwarmsIntegration, 
  AgentManifest,
  getAgentSwarmsIntegration 
} from '../../src/agent-swarms-integration.js';

describe('AgentSwarmsIntegration', () => {
  let integration: AgentSwarmsIntegration;

  beforeEach(() => {
    integration = new AgentSwarmsIntegration();
  });

  describe('Agent Registry', () => {
    it('should have all 26 agents registered', () => {
      const agents = integration.getAvailableAgents();
      expect(agents.length).toBe(26);
    });

    it('should have all Architecture & Planning agents', () => {
      const architectureAgents = [
        'architect-advisor',
        'backend-architect', 
        'infrastructure-builder'
      ];

      architectureAgents.forEach(agentId => {
        const agent = integration.getAgentManifest(agentId);
        expect(agent).toBeDefined();
        expect(agent!.id).toBe(agentId);
      });
    });

    it('should have all Development & Coding agents', () => {
      const devAgents = [
        'frontend-reviewer',
        'full-stack-developer',
        'api-builder-enhanced',
        'database-optimizer',
        'java-pro'
      ];

      devAgents.forEach(agentId => {
        const agent = integration.getAgentManifest(agentId);
        expect(agent).toBeDefined();
        expect(agent!.id).toBe(agentId);
      });
    });

    it('should have all Quality & Testing agents', () => {
      const qaAgents = [
        'code-reviewer',
        'test-generator',
        'security-scanner',
        'performance-engineer'
      ];

      qaAgents.forEach(agentId => {
        const agent = integration.getAgentManifest(agentId);
        expect(agent).toBeDefined();
        expect(agent!.id).toBe(agentId);
      });
    });

    it('should have all DevOps & Deployment agents', () => {
      const devopsAgents = [
        'deployment-engineer',
        'monitoring-expert',
        'cost-optimizer'
      ];

      devopsAgents.forEach(agentId => {
        const agent = integration.getAgentManifest(agentId);
        expect(agent).toBeDefined();
        expect(agent!.id).toBe(agentId);
      });
    });

    it('should have all AI & Machine Learning agents', () => {
      const aiAgents = [
        'ai-engineer',
        'ml-engineer'
      ];

      aiAgents.forEach(agentId => {
        const agent = integration.getAgentManifest(agentId);
        expect(agent).toBeDefined();
        expect(agent!.id).toBe(agentId);
      });
    });

    it('should have all Content & SEO agents', () => {
      const contentAgents = [
        'seo-specialist',
        'prompt-optimizer',
        'docs-writer',
        'documentation-specialist'
      ];

      contentAgents.forEach(agentId => {
        const agent = integration.getAgentManifest(agentId);
        expect(agent).toBeDefined();
        expect(agent!.id).toBe(agentId);
      });
    });

    it('should have all Plugin Development agents', () => {
      const pluginAgents = [
        'agent-creator',
        'command-creator',
        'skill-creator',
        'tool-creator',
        'plugin-validator'
      ];

      pluginAgents.forEach(agentId => {
        const agent = integration.getAgentManifest(agentId);
        expect(agent).toBeDefined();
        expect(agent!.id).toBe(agentId);
      });
    });
  });

  describe('Agent Capabilities', () => {
    it('each agent should have at least one capability', () => {
      const agents = integration.getAvailableAgents();
      
      agents.forEach(agent => {
        expect(agent.capabilities.length).toBeGreaterThan(0);
      });
    });

    it('each capability should have confidence between 0 and 1', () => {
      const agents = integration.getAvailableAgents();
      
      agents.forEach(agent => {
        agent.capabilities.forEach(capability => {
          expect(capability.confidence).toBeGreaterThanOrEqual(0);
          expect(capability.confidence).toBeLessThanOrEqual(1);
        });
      });
    });

    it('each agent should have valid swarm types', () => {
      const validSwarmTypes = ['MultiAgentRouter', 'SequentialWorkflow', 'AgentRearrange', 'ConcurrentWorkflow'];
      const agents = integration.getAvailableAgents();
      
      agents.forEach(agent => {
        expect(agent.swarm_types.length).toBeGreaterThan(0);
        agent.swarm_types.forEach(swarmType => {
          expect(validSwarmTypes).toContain(swarmType);
        });
      });
    });

    it('api-builder-enhanced should have REST and GraphQL capabilities', () => {
      const agent = integration.getAgentManifest('api-builder-enhanced');
      expect(agent).toBeDefined();
      
      const capabilityNames = agent!.capabilities.map(c => c.name);
      expect(capabilityNames).toContain('api-design');
      expect(capabilityNames).toContain('rest');
      expect(capabilityNames).toContain('graphql');
    });

    it('database-optimizer should have query optimization capabilities', () => {
      const agent = integration.getAgentManifest('database-optimizer');
      expect(agent).toBeDefined();
      
      const capabilityNames = agent!.capabilities.map(c => c.name);
      expect(capabilityNames).toContain('database');
      expect(capabilityNames).toContain('query-optimization');
    });

    it('ai-engineer should have LLM and RAG capabilities', () => {
      const agent = integration.getAgentManifest('ai-engineer');
      expect(agent).toBeDefined();
      
      const capabilityNames = agent!.capabilities.map(c => c.name);
      expect(capabilityNames).toContain('llm');
      expect(capabilityNames).toContain('rag');
    });
  });

  describe('Agent Handoffs', () => {
    it('each agent should have at least one handoff', () => {
      const agents = integration.getAvailableAgents();
      
      agents.forEach(agent => {
        expect(agent.handoffs).toBeDefined();
        expect(agent.handoffs!.length).toBeGreaterThan(0);
      });
    });

    it('handoffs should reference valid agent IDs', () => {
      const agents = integration.getAvailableAgents();
      const agentIds = agents.map(a => a.id);
      
      agents.forEach(agent => {
        if (agent.handoffs) {
          agent.handoffs.forEach(handoff => {
            expect(agentIds).toContain(handoff);
          });
        }
      });
    });

    it('plugin agents should handoff to plugin-validator', () => {
      const pluginAgents = ['agent-creator', 'command-creator', 'skill-creator', 'tool-creator'];
      
      pluginAgents.forEach(agentId => {
        const agent = integration.getAgentManifest(agentId);
        expect(agent).toBeDefined();
        expect(agent!.handoffs).toContain('plugin-validator');
      });
    });
  });

  describe('Capability-Based Search', () => {
    it('should find agents with architecture capability', () => {
      const agents = integration.findAgentsByCapabilities(['architecture']);
      
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some(a => a.id === 'architect-advisor')).toBe(true);
    });

    it('should find agents with security capability', () => {
      const agents = integration.findAgentsByCapabilities(['security']);
      
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some(a => a.id === 'security-scanner')).toBe(true);
    });

    it('should find agents with multiple capabilities', () => {
      const agents = integration.findAgentsByCapabilities(['frontend', 'ui']);
      
      expect(agents.length).toBeGreaterThan(0);
      expect(agents.some(a => a.id === 'frontend-reviewer')).toBe(true);
    });

    it('should filter by minimum confidence', () => {
      // High confidence threshold - should return fewer agents
      const highConfAgents = integration.findAgentsByCapabilities(['architecture'], 0.9);
      
      // Lower confidence threshold - should return more agents
      const lowConfAgents = integration.findAgentsByCapabilities(['architecture'], 0.5);
      
      expect(highConfAgents.length).toBeLessThanOrEqual(lowConfAgents.length);
    });

    it('should return empty array for non-existent capabilities', () => {
      const agents = integration.findAgentsByCapabilities(['non-existent-capability']);
      expect(agents).toEqual([]);
    });
  });

  describe('Capabilities Summary', () => {
    it('should return aggregated capability counts', () => {
      const summary = integration.getCapabilitiesSummary();
      
      expect(Object.keys(summary).length).toBeGreaterThan(0);
      
      // Common capabilities should appear multiple times
      expect(summary['architecture']).toBeGreaterThanOrEqual(1);
      expect(summary['security']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return same instance from getAgentSwarmsIntegration', () => {
      const instance1 = getAgentSwarmsIntegration();
      const instance2 = getAgentSwarmsIntegration();
      
      expect(instance1).toBe(instance2);
    });
  });
});
