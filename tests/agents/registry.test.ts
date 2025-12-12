/**
 * Tests for AgentRegistry - loads agents from .claude-plugin/agents/
 *
 * TDD: Write these tests FIRST, then implement the registry
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { AgentRegistry } from '../../src/agents/registry.js';
import { AgentType } from '../../src/agents/types.js';
import { join } from 'path';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';

describe('AgentRegistry', () => {
  let registry: AgentRegistry;
  let tempDir: string;

  beforeEach(() => {
    registry = new AgentRegistry();
    tempDir = join(process.cwd(), `test-plugin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
    mkdirSync(tempDir, { recursive: true });
    mkdirSync(join(tempDir, 'agents'), { recursive: true });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Loading from Plugin Structure', () => {
    it('should discover all agent markdown files from .claude-plugin/agents/', async () => {
      // Create mock agent files
      const mockAgents = [
        { name: 'code-reviewer', category: 'quality-testing' },
        { name: 'architect-advisor', category: 'development' },
        { name: 'security-scanner', category: 'quality-testing' }
      ];

      for (const agent of mockAgents) {
        const content = `---
name: ${agent.name}
description: Test agent for ${agent.name}
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
permission:
  bash: deny
  edit: deny
  write: deny
  patch: deny
  read: allow
  grep: allow
  glob: allow
  list: allow
---

Test agent content for ${agent.name}
`;
        writeFileSync(join(tempDir, 'agents', `${agent.name}.md`), content);
      }

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const agents = registry.getAllAgents();
      expect(agents.length).toBe(3);
    });

    it('should parse agent frontmatter correctly', async () => {
      const content = `---
name: code-reviewer
description: Elite code review expert specializing in modern AI-powered code analysis
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
permission:
  bash: deny
  edit: deny
  write: deny
  patch: deny
  read: allow
  grep: allow
  glob: allow
  list: allow
---

Take a deep breath and approach this task systematically.
`;

      writeFileSync(join(tempDir, 'agents', 'code-reviewer.md'), content);

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const agent = registry.get(AgentType.CODE_REVIEWER);

      expect(agent).toBeDefined();
      expect(agent!.name).toBe('code-reviewer');
      expect(agent!.temperature).toBe(0.1);
      expect(agent!.mode).toBe('subagent');
      expect(agent!.tools.read).toBe(true);
      expect(agent!.tools.bash).toBe(false);
    });

    it('should extract capabilities from agent description', async () => {
      const content = `---
name: code-reviewer
description: Elite code review expert specializing in modern AI-powered code analysis, security vulnerabilities, performance optimization, and production reliability
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
---

Code review capabilities include security, performance, and quality analysis.
`;

      writeFileSync(join(tempDir, 'agents', 'code-reviewer.md'), content);

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const agent = registry.get(AgentType.CODE_REVIEWER);

      expect(agent!.capabilities).toContain('code-review');
      expect(agent!.capabilities).toContain('security');
      expect(agent!.capabilities).toContain('performance');
    });

    it('should parse intended_followups as handoff targets', async () => {
      const content = `---
name: code-reviewer
description: Code review expert
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
intended_followups: full-stack-developer, security-scanner, compliance-expert
---

Test content
`;

      writeFileSync(join(tempDir, 'agents', 'code-reviewer.md'), content);

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const agent = registry.get(AgentType.CODE_REVIEWER);

      expect(agent!.handoffs).toContain(AgentType.FULL_STACK_DEVELOPER);
      expect(agent!.handoffs).toContain(AgentType.SECURITY_SCANNER);
      // Note: compliance-expert might not be in our enum yet, so it should be filtered out
    });
  });

  describe('Agent Type Mapping', () => {
    it('should map all 24 agent files to AgentType enum', async () => {
      // This test would require creating all 24 mock files
      // For now, test with a subset
      const mockAgentNames = ['code-reviewer', 'architect-advisor', 'security-scanner'];

      for (const agentName of mockAgentNames) {
        const content = `---
name: ${agentName}
description: Test agent
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
---

Test content
`;
        writeFileSync(join(tempDir, 'agents', `${agentName}.md`), content);
      }

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      // Verify all enum values have corresponding definitions
      const loadedTypes = registry.getAllAgents().map(a => a.type);
      for (const agentName of mockAgentNames) {
        const agentType = agentName.replace(/-/g, '_').toUpperCase() as keyof typeof AgentType;
        expect(loadedTypes).toContain(AgentType[agentType]);
      }
    });

    it('should handle underscore vs hyphen naming conventions', async () => {
      const content = `---
name: code_reviewer
description: Test agent
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
---

Test content
`;

      writeFileSync(join(tempDir, 'agents', 'code_reviewer.md'), content);

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const agent = registry.get(AgentType.CODE_REVIEWER);
      expect(agent).toBeDefined();
    });
  });

  describe('Capability Queries', () => {
    it('should find agents by capability', async () => {
      const agents = [
        {
          name: 'code-reviewer',
          capabilities: ['code-review', 'security', 'performance'],
          content: 'Code review and security analysis'
        },
        {
          name: 'security-scanner',
          capabilities: ['security', 'vulnerabilities'],
          content: 'Security scanning and vulnerability detection'
        },
        {
          name: 'architect-advisor',
          capabilities: ['architecture', 'design'],
          content: 'Architecture and design guidance'
        }
      ];

      for (const agent of agents) {
        const content = `---
name: ${agent.name}
description: ${agent.content}
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
---

${agent.content}
`;
        writeFileSync(join(tempDir, 'agents', `${agent.name}.md`), content);
      }

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const securityAgents = registry.findByCapability('security');

      expect(securityAgents.length).toBeGreaterThan(0);
      expect(securityAgents).toContain(AgentType.SECURITY_SCANNER);
      expect(securityAgents).toContain(AgentType.CODE_REVIEWER);
    });

    it('should find agents by multiple capabilities', async () => {
      const content = `---
name: frontend-reviewer
description: Frontend development and UI/UX review
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
---

Frontend and UI/UX expertise
`;

      writeFileSync(join(tempDir, 'agents', 'frontend-reviewer.md'), content);

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const agents = registry.findByCapabilities(['frontend', 'ui']);

      expect(agents).toContain(AgentType.FRONTEND_REVIEWER);
    });

    it('should return capability summary', async () => {
      const agents = [
        { name: 'code-reviewer', capabilities: ['code-review', 'security'] },
        { name: 'security-scanner', capabilities: ['security', 'vulnerabilities'] },
        { name: 'architect-advisor', capabilities: ['architecture', 'design'] }
      ];

      for (const agent of agents) {
        const content = `---
name: ${agent.name}
description: ${agent.capabilities.join(' ')} capabilities for testing
mode: subagent
temperature: 0.1
tools:
  read: true
  grep: true
  glob: true
  list: true
  bash: false
  edit: false
  write: false
  patch: false
---

Test content
`;
        writeFileSync(join(tempDir, 'agents', `${agent.name}.md`), content);
      }

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const summary = registry.getCapabilitySummary();

      expect(summary['security']).toBeGreaterThan(0);
      expect(summary['code-review']).toBeGreaterThan(0);
      expect(summary['architecture']).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing agent directory gracefully', async () => {
      await expect(registry.loadFromDirectory('/nonexistent/path')).rejects.toThrow();
    });

    it('should handle malformed markdown files', async () => {
      const malformedContent = `---
name: malformed-agent
description: Missing closing ---
mode: subagent

This is malformed frontmatter
`;

      writeFileSync(join(tempDir, 'agents', 'malformed.md'), malformedContent);

      await expect(registry.loadFromDirectory(join(tempDir, 'agents'))).rejects.toThrow('Invalid frontmatter format');
    });

    it('should skip files that are not markdown', async () => {
      writeFileSync(join(tempDir, 'agents', 'not-markdown.txt'), 'Not a markdown file');

      await registry.loadFromDirectory(join(tempDir, 'agents'));

      const agents = registry.getAllAgents();
      expect(agents.length).toBe(0);
    });
  });
});