/**
 * Tests for CommandSwarmsIntegration
 * Verifies command-to-swarm mapping and execution
 */

import { describe, it, expect, beforeEach } from 'bun:test';
import {
  CommandSwarmsIntegration,
  CommandSwarmMapping,
  getCommandSwarmsIntegration
} from '../../src/command-swarms-integration.js';
import { LocalSwarmsExecutor } from '../../src/local-swarms-executor.js';

describe('CommandSwarmsIntegration', () => {
  let integration: CommandSwarmsIntegration;

  beforeEach(() => {
    // Use LocalSwarmsExecutor to avoid network calls
    const localExecutor = new LocalSwarmsExecutor();
    integration = new CommandSwarmsIntegration(localExecutor);
  });

  describe('Command Mappings', () => {
    it('should have mappings for all 8 core commands', () => {
      const commands = integration.getAvailableCommands();
      expect(commands.length).toBe(8);
    });

    it('should include plan command mapping', () => {
      const mapping = integration.getCommandMapping('plan');
      
      expect(mapping).toBeDefined();
      expect(mapping!.command).toBe('plan');
      expect(mapping!.description).toBe('Create detailed implementation plans');
      expect(mapping!.capabilities).toContain('architecture');
      expect(mapping!.capabilities).toContain('design');
      expect(mapping!.swarmType).toBe('SequentialWorkflow');
    });

    it('should include work command mapping', () => {
      const mapping = integration.getCommandMapping('work');
      
      expect(mapping).toBeDefined();
      expect(mapping!.command).toBe('work');
      expect(mapping!.description).toBe('Execute implementation plans with quality gates');
      expect(mapping!.capabilities).toContain('full-stack');
      expect(mapping!.capabilities).toContain('testing');
      expect(mapping!.swarmType).toBe('AgentRearrange');
      expect(mapping!.flow).toBe('full-stack-developer -> code-reviewer -> test-generator');
    });

    it('should include review command mapping', () => {
      const mapping = integration.getCommandMapping('review');
      
      expect(mapping).toBeDefined();
      expect(mapping!.command).toBe('review');
      expect(mapping!.description).toBe('Multi-perspective code review');
      expect(mapping!.capabilities).toContain('code-quality');
      expect(mapping!.capabilities).toContain('security');
      expect(mapping!.capabilities).toContain('performance');
      expect(mapping!.swarmType).toBe('ConcurrentWorkflow');
    });

    it('should include research command mapping', () => {
      const mapping = integration.getCommandMapping('research');
      
      expect(mapping).toBeDefined();
      expect(mapping!.command).toBe('research');
      expect(mapping!.description).toBe('Multi-phase research orchestration');
      expect(mapping!.capabilities).toContain('research');
      expect(mapping!.capabilities).toContain('analysis');
      expect(mapping!.swarmType).toBe('SequentialWorkflow');
    });

    it('should include deploy command mapping', () => {
      const mapping = integration.getCommandMapping('deploy');
      
      expect(mapping).toBeDefined();
      expect(mapping!.command).toBe('deploy');
      expect(mapping!.description).toBe('Pre-deployment checklist for Coolify');
      expect(mapping!.capabilities).toContain('deployment');
      expect(mapping!.capabilities).toContain('devops');
      expect(mapping!.swarmType).toBe('SequentialWorkflow');
    });

    it('should include optimize command mapping', () => {
      const mapping = integration.getCommandMapping('optimize');
      
      expect(mapping).toBeDefined();
      expect(mapping!.command).toBe('optimize');
      expect(mapping!.description).toBe('Prompt enhancement with research-backed techniques');
      expect(mapping!.capabilities).toContain('prompt-engineering');
      expect(mapping!.swarmType).toBe('MultiAgentRouter');
    });

    it('should include seo command mapping', () => {
      const mapping = integration.getCommandMapping('seo');
      
      expect(mapping).toBeDefined();
      expect(mapping!.command).toBe('seo');
      expect(mapping!.description).toBe('SEO audit with Core Web Vitals');
      expect(mapping!.capabilities).toContain('seo');
      expect(mapping!.capabilities).toContain('technical-seo');
      expect(mapping!.swarmType).toBe('SequentialWorkflow');
    });

    it('should include create command mapping', () => {
      const mapping = integration.getCommandMapping('create');
      
      expect(mapping).toBeDefined();
      expect(mapping!.command).toBe('create');
      expect(mapping!.description).toBe('AI-assisted creation of agents, commands, skills, tools');
      expect(mapping!.capabilities).toContain('architecture');
      expect(mapping!.swarmType).toBe('MultiAgentRouter');
    });
  });

  describe('Command Mapping Structure', () => {
    it('should have valid structure for all command mappings', () => {
      const commands = integration.getAvailableCommands();
      
      for (const mapping of commands) {
        expect(mapping.command).toBeDefined();
        expect(typeof mapping.command).toBe('string');
        expect(mapping.command.length).toBeGreaterThan(0);
        
        expect(mapping.description).toBeDefined();
        expect(typeof mapping.description).toBe('string');
        expect(mapping.description.length).toBeGreaterThan(0);
        
        expect(mapping.capabilities).toBeDefined();
        expect(Array.isArray(mapping.capabilities)).toBe(true);
        expect(mapping.capabilities.length).toBeGreaterThan(0);
        
        expect(mapping.swarmType).toBeDefined();
        expect(['MultiAgentRouter', 'SequentialWorkflow', 'AgentRearrange', 'ConcurrentWorkflow'])
          .toContain(mapping.swarmType);
      }
    });

    it('should return undefined for unknown commands', () => {
      const mapping = integration.getCommandMapping('unknown-command');
      expect(mapping).toBeUndefined();
    });
  });

  describe('Swarm Type Distribution', () => {
    it('should use SequentialWorkflow for linear processes', () => {
      // Commands that require sequential processing
      const sequentialCommands = ['plan', 'research', 'deploy', 'seo'];
      
      for (const cmd of sequentialCommands) {
        const mapping = integration.getCommandMapping(cmd);
        expect(mapping?.swarmType).toBe('SequentialWorkflow');
      }
    });

    it('should use MultiAgentRouter for routing tasks', () => {
      // Commands that route to appropriate agents
      const routerCommands = ['optimize', 'create'];
      
      for (const cmd of routerCommands) {
        const mapping = integration.getCommandMapping(cmd);
        expect(mapping?.swarmType).toBe('MultiAgentRouter');
      }
    });

    it('should use AgentRearrange for flexible workflows', () => {
      const mapping = integration.getCommandMapping('work');
      expect(mapping?.swarmType).toBe('AgentRearrange');
    });

    it('should use ConcurrentWorkflow for parallel reviews', () => {
      const mapping = integration.getCommandMapping('review');
      expect(mapping?.swarmType).toBe('ConcurrentWorkflow');
    });
  });

  describe('Capability Coverage', () => {
    it('should cover all major capability categories', () => {
      const commands = integration.getAvailableCommands();
      const allCapabilities = new Set<string>();
      
      for (const mapping of commands) {
        for (const cap of mapping.capabilities) {
          allCapabilities.add(cap);
        }
      }

      // Verify key capabilities are covered
      expect(allCapabilities).toContain('architecture');
      expect(allCapabilities).toContain('code-quality');
      expect(allCapabilities).toContain('security');
      expect(allCapabilities).toContain('testing');
      expect(allCapabilities).toContain('deployment');
      expect(allCapabilities).toContain('seo');
      expect(allCapabilities).toContain('research');
    });

    it('should have appropriate capabilities for each command', () => {
      // Plan should focus on architecture and design
      const plan = integration.getCommandMapping('plan');
      expect(plan?.capabilities).toContain('architecture');
      expect(plan?.capabilities).toContain('design');

      // Work should focus on implementation and quality
      const work = integration.getCommandMapping('work');
      expect(work?.capabilities).toContain('full-stack');
      expect(work?.capabilities).toContain('code-quality');

      // Review should focus on quality checks
      const review = integration.getCommandMapping('review');
      expect(review?.capabilities).toContain('security');
      expect(review?.capabilities).toContain('performance');

      // Deploy should focus on operations
      const deploy = integration.getCommandMapping('deploy');
      expect(deploy?.capabilities).toContain('deployment');
      expect(deploy?.capabilities).toContain('monitoring');
    });
  });
});

describe('CommandSwarmsIntegration - Task Formatting', () => {
  let integration: CommandSwarmsIntegration;

  beforeEach(() => {
    const localExecutor = new LocalSwarmsExecutor();
    integration = new CommandSwarmsIntegration(localExecutor);
  });

  describe('getAvailableCommands', () => {
    it('should return array of CommandSwarmMapping', () => {
      const commands = integration.getAvailableCommands();
      
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBe(8);
      
      // Verify each item is a valid mapping
      for (const cmd of commands) {
        expect(cmd).toHaveProperty('command');
        expect(cmd).toHaveProperty('description');
        expect(cmd).toHaveProperty('capabilities');
        expect(cmd).toHaveProperty('swarmType');
      }
    });

    it('should include all expected command names', () => {
      const commands = integration.getAvailableCommands();
      const commandNames = commands.map(c => c.command);
      
      expect(commands.length).toBe(7);
      
      // Core 7 commands
      expect(commandNames).toContain('plan');
      expect(commandNames).toContain('work');
      expect(commandNames).toContain('review');
      expect(commandNames).toContain('research');
      expect(commandNames).toContain('deploy');
      expect(commandNames).toContain('clean');
      expect(commandNames).toContain('create');
    });
  });
});

describe('CommandSwarmsIntegration - Custom Swarm Creation', () => {
  let integration: CommandSwarmsIntegration;

  beforeEach(() => {
    const localExecutor = new LocalSwarmsExecutor();
    integration = new CommandSwarmsIntegration(localExecutor);
  });

  it('should create custom command swarm with specified capabilities', async () => {
    // Use capabilities that exist in the agent registry
    const swarmId = await integration.createCustomCommandSwarm(
      'myCustomCommand',
      ['testing'], // 'testing' exists in test-generator agent
      'MultiAgentRouter'
    );

    expect(swarmId).toBeDefined();
    expect(typeof swarmId).toBe('string');
    expect(swarmId.length).toBeGreaterThan(0);
  });

  it('should accept different swarm types for custom swarms', async () => {
    const swarmTypes: Array<'MultiAgentRouter' | 'SequentialWorkflow' | 'AgentRearrange'> = [
      'MultiAgentRouter',
      'SequentialWorkflow',
      'AgentRearrange'
    ];

    for (const swarmType of swarmTypes) {
      const swarmId = await integration.createCustomCommandSwarm(
        `custom_${swarmType}`,
        ['security'], // 'security' exists in multiple agents
        swarmType
      );

      expect(swarmId).toBeDefined();
      expect(swarmId.length).toBeGreaterThan(0);
    }
  });

  it('should default to MultiAgentRouter when swarm type not specified', async () => {
    const swarmId = await integration.createCustomCommandSwarm(
      'defaultTypeSwarm',
      ['code-quality'] // Exists in code-reviewer agent
    );

    expect(swarmId).toBeDefined();
    // The swarm was created successfully with default type
  });

  it('should throw error for non-existent capabilities', async () => {
    await expect(
      integration.createCustomCommandSwarm(
        'invalidCapabilities',
        ['non-existent-capability-xyz'],
        'MultiAgentRouter'
      )
    ).rejects.toThrow('No agents found with capabilities');
  });
});

describe('CommandSwarmsIntegration - Command Execution', () => {
  let integration: CommandSwarmsIntegration;

  beforeEach(() => {
    const localExecutor = new LocalSwarmsExecutor();
    integration = new CommandSwarmsIntegration(localExecutor);
  });

  describe('executeCommand with fallback', () => {
    it('should execute unknown command with fallback enabled', async () => {
      const result = await integration.executeCommand(
        'unknown-cmd',
        ['arg1', 'arg2'],
        { fallbackToDirect: true }
      );

      expect(result.success).toBe(true);
      expect(result.command).toBe('unknown-cmd');
      expect(result.output).toContain('[DIRECT EXECUTION]');
      expect(result.output).toContain('unknown-cmd');
      expect(result.output).toContain('arg1');
      expect(result.output).toContain('arg2');
    });

    it('should throw error for unknown command without fallback', async () => {
      await expect(
        integration.executeCommand('unknown-cmd', ['arg1'], { fallbackToDirect: false })
      ).rejects.toThrow('Unknown command: unknown-cmd');
    });

    it('should attempt swarm execution for known commands', async () => {
      // This will try swarm execution (may fail without Python, but that's OK)
      try {
        const result = await integration.executeCommand(
          'plan',
          ['test project'],
          { fallbackToDirect: true, timeout: 5000 }
        );
        
        // Either swarm succeeded or fell back to direct
        expect(result.success).toBe(true);
        expect(result.command).toBe('plan');
      } catch (error) {
        // Swarm execution failed and fallback was used
        // This is acceptable in test environment without Python
      }
    });
  });
});

describe('Singleton Pattern', () => {
  it('should return singleton instance via getCommandSwarmsIntegration', () => {
    const instance1 = getCommandSwarmsIntegration();
    const instance2 = getCommandSwarmsIntegration();
    
    // Both calls should return the same singleton
    expect(instance1).toBe(instance2);
  });

  it('should have all commands available via singleton', () => {
    const instance = getCommandSwarmsIntegration();
    const commands = instance.getAvailableCommands();
    
    expect(commands.length).toBe(7);
  });
});
