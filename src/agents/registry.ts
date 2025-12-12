/**
 * AgentRegistry - Loads and manages agent definitions from .claude-plugin/
 *
 * Key responsibilities:
 * 1. Parse agent markdown files with frontmatter
 * 2. Extract capabilities from description and tags
 * 3. Map intended_followups to handoff relationships
 * 4. Provide capability-based queries
 */

import { readFile, readdir } from 'fs/promises';
import { join, extname } from 'path';
import { AgentType, AgentDefinition } from './types.js';

export class AgentRegistry {
  private agents: Map<AgentType, AgentDefinition> = new Map();
  private capabilityIndex: Map<string, AgentType[]> = new Map();
  private handoffGraph: Map<AgentType, AgentType[]> = new Map();

  async loadFromDirectory(dir: string): Promise<void> {
    try {
      const files = await readdir(dir);
      const markdownFiles = files.filter(file =>
        extname(file).toLowerCase() === '.md'
      );

      for (const file of markdownFiles) {
        const filePath = join(dir, file);
        try {
          const agentDef = await this.parseAgentMarkdown(filePath);
          if (agentDef) {
            this.agents.set(agentDef.type, agentDef);
            this.indexCapabilities(agentDef);
            this.indexHandoffs(agentDef);
          }
        } catch (error) {
          // For test compatibility, re-throw errors instead of silently continuing
          throw error;
        }
      }
    } catch (error) {
      throw new Error(`Failed to load agents from directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async parseAgentMarkdown(filePath: string): Promise<AgentDefinition | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);

      if (!frontmatterMatch) {
        throw new Error('Invalid frontmatter format');
      }

      const frontmatter = frontmatterMatch[1];
      const prompt = frontmatterMatch[2].trim();

      // Parse YAML-like frontmatter
      const metadata = this.parseFrontmatter(frontmatter);

      const agentType = this.normalizeAgentType(metadata.name || '');

      // Ensure description exists and is a string
      let description = metadata.description || '';
      if (Array.isArray(description)) {
        description = description.join(' ');
      }

      return {
        type: agentType,
        name: metadata.name || '',
        description: description,
        mode: metadata.mode || 'subagent',
        temperature: metadata.temperature || 0.7,
        capabilities: this.extractCapabilities(description, metadata.tags || []),
        handoffs: this.parseHandoffs(metadata.intended_followups || ''),
        tags: metadata.tags || [],
        category: metadata.category || 'general',
        tools: metadata.tools || metadata.permission || {
          read: true,
          grep: true,
          glob: true,
          list: true,
          bash: false,
          edit: false,
          write: false,
          patch: false
        },
        promptPath: filePath,
        prompt: prompt
      };
    } catch (error) {
      console.error(`Error parsing ${filePath}:`, error);
      throw error; // Re-throw instead of returning null for tests
    }
  }

  private parseFrontmatter(frontmatter: string): Record<string, any> {
    const lines = frontmatter.split('\n');
    const result: Record<string, any> = {};
    let currentKey = '';
    let currentValue = '';
    let indentLevel = 0;
    let nestedObject: Record<string, any> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineIndent = line.length - line.trimStart().length;

      if (trimmed === '') continue;

      // Check for key: value pattern
      const keyValueMatch = trimmed.match(/^([^:]+):\s*(.*)$/);
      if (keyValueMatch) {
        // Save previous key-value if exists
        if (currentKey) {
          if (nestedObject) {
            nestedObject[currentKey] = this.parseValue(currentValue.trim());
          } else {
            result[currentKey] = this.parseValue(currentValue.trim());
          }
        }

        currentKey = keyValueMatch[1].trim();
        const valuePart = keyValueMatch[2].trim();

        // Reset nested object for top-level keys
        if (lineIndent === 0) {
          nestedObject = null;
        }

        // Check if this starts a nested object
        if (valuePart === '') {
          // Look ahead to see if this is a nested object
          let nestedLines = [];
          let j = i + 1;
          while (j < lines.length && (lines[j].trim() === '' || lines[j].match(/^\s+/))) {
            if (lines[j].trim() !== '') {
              nestedLines.push(lines[j]);
            }
            j++;
          }

          if (nestedLines.length > 0 && nestedLines[0].match(/^\s+[^-\s]/)) {
            // This is a nested object
            nestedObject = {};
            result[currentKey] = nestedObject;
            currentKey = '';
            currentValue = '';
            // Process nested lines
            for (const nestedLine of nestedLines) {
              const nestedMatch = nestedLine.trim().match(/^([^:]+):\s*(.*)$/);
              if (nestedMatch) {
                const [_, nestedKey, nestedValue] = nestedMatch;
                nestedObject[nestedKey.trim()] = this.parseValue(nestedValue.trim());
              }
            }
            i = j - 1; // Skip processed lines
            continue;
          } else {
            // This might be a list or multi-line value
            currentValue = '';
            indentLevel = lineIndent;
          }
        } else {
          currentValue = valuePart;
          indentLevel = lineIndent;
        }
      } else if (currentKey && lineIndent > indentLevel) {
        // Continuation of multi-line value
        currentValue += (currentValue ? '\n' : '') + line.trimStart();
      } else if (currentKey && lineIndent <= indentLevel && trimmed !== '') {
        // End of current value, save it
        if (nestedObject) {
          nestedObject[currentKey] = this.parseValue(currentValue.trim());
        } else {
          result[currentKey] = this.parseValue(currentValue.trim());
        }
        currentKey = '';
        currentValue = '';
      }
    }

    // Save final key-value
    if (currentKey) {
      if (nestedObject) {
        nestedObject[currentKey] = this.parseValue(currentValue.trim());
      } else {
        result[currentKey] = this.parseValue(currentValue.trim());
      }
    }

    return result;
  }

  private parseValue(value: string): any {
    // Handle boolean values
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Handle numbers
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return numValue;
    }

    // Handle arrays (comma-separated)
    if (value.includes(',')) {
      return value.split(',').map(s => s.trim()).filter(s => s);
    }

    return value;
  }

  private extractCapabilities(description: string, tags: string[]): string[] {
    const capabilities: string[] = [];

    // Extract from description
    const descLower = description.toLowerCase();

    const capabilityKeywords = [
      'code-review', 'code review', 'security', 'performance', 'architecture', 'frontend', 'backend',
      'testing', 'deployment', 'monitoring', 'optimization', 'ai', 'ml', 'seo',
      'database', 'api', 'infrastructure', 'devops', 'quality', 'analysis'
    ];

    for (const keyword of capabilityKeywords) {
      if (descLower.includes(keyword)) {
        capabilities.push(keyword.replace(' ', '-'));
      }
    }

    // Add from tags
    capabilities.push(...tags);

    // Remove duplicates
    return [...new Set(capabilities)];
  }

  private parseHandoffs(intendedFollowups: string | string[]): AgentType[] {
    const followups = Array.isArray(intendedFollowups)
      ? intendedFollowups
      : intendedFollowups.split(',').map(s => s.trim()).filter(s => s);

    return followups
      .map(followup => this.normalizeAgentType(followup))
      .filter(type => type !== null) as AgentType[];
  }

  private normalizeAgentType(name: string): AgentType {
    // Convert various formats to AgentType enum
    const normalized = name
      .toLowerCase()
      .replace(/_/g, '-')
      .replace(/[^a-z-]/g, '');

    // Try to match against enum values
    for (const value of Object.values(AgentType)) {
      if (value === normalized) {
        return value as AgentType;
      }
    }

    // Try partial matches for common variations
    const partialMatches: Record<string, AgentType> = {
      'fullstack': AgentType.FULL_STACK_DEVELOPER,
      'full-stack': AgentType.FULL_STACK_DEVELOPER,
      'api-builder': AgentType.API_BUILDER_ENHANCED,
      'java': AgentType.JAVA_PRO,
      'ml': AgentType.ML_ENGINEER,
      'machine-learning': AgentType.ML_ENGINEER,
      'ai': AgentType.AI_ENGINEER,
      'monitoring': AgentType.MONITORING_EXPERT,
      'deployment': AgentType.DEPLOYMENT_ENGINEER,
      'cost': AgentType.COST_OPTIMIZER,
      'database': AgentType.DATABASE_OPTIMIZER,
      'infrastructure': AgentType.INFRASTRUCTURE_BUILDER,
      'seo': AgentType.SEO_SPECIALIST,
      'prompt': AgentType.PROMPT_OPTIMIZER,
      'agent': AgentType.AGENT_CREATOR,
      'command': AgentType.COMMAND_CREATOR,
      'skill': AgentType.SKILL_CREATOR,
      'tool': AgentType.TOOL_CREATOR,
      'plugin': AgentType.PLUGIN_VALIDATOR
    };

    return partialMatches[normalized] || AgentType.CODE_REVIEWER; // fallback
  }

  private indexCapabilities(agent: AgentDefinition): void {
    for (const capability of agent.capabilities) {
      if (!this.capabilityIndex.has(capability)) {
        this.capabilityIndex.set(capability, []);
      }
      this.capabilityIndex.get(capability)!.push(agent.type);
    }
  }

  private indexHandoffs(agent: AgentDefinition): void {
    this.handoffGraph.set(agent.type, agent.handoffs);
  }

  get(type: AgentType): AgentDefinition | undefined {
    return this.agents.get(type);
  }

  getAllAgents(): AgentDefinition[] {
    return Array.from(this.agents.values());
  }

  findByCapability(capability: string): AgentType[] {
    return this.capabilityIndex.get(capability) || [];
  }

  findByCapabilities(capabilities: string[], minMatch = 1): AgentType[] {
    const agentScores = new Map<AgentType, number>();

    for (const capability of capabilities) {
      const agents = this.capabilityIndex.get(capability) || [];
      for (const agent of agents) {
        agentScores.set(agent, (agentScores.get(agent) || 0) + 1);
      }
    }

    return Array.from(agentScores.entries())
      .filter(([, score]) => score >= minMatch)
      .sort(([, a], [, b]) => b - a)
      .map(([agent]) => agent);
  }

  getHandoffs(type: AgentType): AgentType[] {
    return this.handoffGraph.get(type) || [];
  }

  isHandoffAllowed(from: AgentType, to: AgentType): boolean {
    const handoffs = this.handoffGraph.get(from) || [];
    return handoffs.includes(to);
  }

  getCapabilitySummary(): Record<string, number> {
    const summary: Record<string, number> = {};
    for (const [capability, agents] of this.capabilityIndex) {
      summary[capability] = agents.length;
    }
    return summary;
  }
}