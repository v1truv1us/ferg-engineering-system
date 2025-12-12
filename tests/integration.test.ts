#!/usr/bin/env bun

/**
 * Integration tests for ai-eng-system
 * 
 * Tests real-world scenarios and end-to-end workflows:
 * - Complete build process
 * - Plugin installation and usage
 * - Cross-platform compatibility
 * - Complex content structures
 * - Performance under load
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { readFile, writeFile, mkdir, rm, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename } from 'path'
import { tmpdir } from 'os'
import { execSync } from 'child_process'

const TEST_ROOT = join(tmpdir(), `ferg-integration-${Date.now()}`)
const ORIGINAL_ROOT = process.cwd()

describe('Ferg Engineering System - Integration Tests', () => {
  beforeAll(async () => {
    await mkdir(TEST_ROOT, { recursive: true })
    process.chdir(TEST_ROOT)
    
    // Copy original project structure to test directory
    await copyProjectStructure()
  })

  afterAll(async () => {
    process.chdir(ORIGINAL_ROOT)
    if (existsSync(TEST_ROOT)) {
      await rm(TEST_ROOT, { recursive: true })
    }
  })

  describe('Complete Build Workflow', () => {
    it('should build entire project successfully', () => {
      const result = execSync('bun run build', { encoding: 'utf-8', cwd: TEST_ROOT })
      
      expect(result).toContain('Building ai-eng-system')
      expect(result).toContain('Build complete')
      expect(result).toContain('Output: dist/')
    })

    it('should validate content without building', () => {
      const result = execSync('bun run build --validate', { encoding: 'utf-8', cwd: TEST_ROOT })
      
      expect(result).toContain('Validating content')
      expect(result).toContain('Validated')
    })

    it('should handle watch mode', async () => {
      // This is harder to test automatically, but we can test the setup
      const buildScript = await readFile(join(TEST_ROOT, 'build.ts'), 'utf-8')
      expect(buildScript).toContain('--watch')
      expect(buildScript).toContain('watch(CONTENT_DIR')
    })
  })

  describe('Plugin Structure Validation', () => {
    beforeEach(async () => {
      execSync('bun run build', { cwd: TEST_ROOT })
    })

    it('should create Claude Code plugin structure', async () => {
      const claudePluginDir = join(TEST_ROOT, 'dist', '.claude-plugin')
      
      // Check main components
      expect(existsSync(join(claudePluginDir, 'plugin.json'))).toBe(true)
      expect(existsSync(join(claudePluginDir, 'hooks.json'))).toBe(true)
      expect(existsSync(join(claudePluginDir, 'commands'))).toBe(true)
      expect(existsSync(join(claudePluginDir, 'agents'))).toBe(true)
      expect(existsSync(join(claudePluginDir, 'skills'))).toBe(true)
    })

    it('should create OpenCode plugin structure', async () => {
      const opencodeDir = join(TEST_ROOT, 'dist', '.opencode')
      
      // Check main components
      expect(existsSync(join(opencodeDir, 'command', 'ferg'))).toBe(true)
      expect(existsSync(join(opencodeDir, 'agent', 'ferg'))).toBe(true)
    })

    it('should copy skills to both platforms', async () => {
      const skillsDir = join(TEST_ROOT, 'dist', 'skills')
      const claudeSkillsDir = join(TEST_ROOT, 'dist', '.claude-plugin', 'skills')
      
      expect(existsSync(skillsDir)).toBe(true)
      expect(existsSync(claudeSkillsDir)).toBe(true)
      
      // Check specific skills
      expect(existsSync(join(skillsDir, 'plugin-dev', 'SKILL.md'))).toBe(true)
      expect(existsSync(join(claudeSkillsDir, 'plugin-dev', 'SKILL.md'))).toBe(true)
    })
  })

  describe('Content Transformation Accuracy', () => {
    beforeEach(async () => {
      execSync('bun run build', { cwd: TEST_ROOT })
    })

    it('should transform all commands correctly', async () => {
      const contentCommandsDir = join(TEST_ROOT, 'content', 'commands')
      const opencodeCommandsDir = join(TEST_ROOT, 'dist', '.opencode', 'command', 'ferg')
      const claudeCommandsDir = join(TEST_ROOT, 'dist', '.claude-plugin', 'commands')
      
      // Get all command files
      const { readdir } = await import('fs/promises')
      const commandFiles = await readdir(contentCommandsDir)
      
      for (const file of commandFiles) {
        if (file.endsWith('.md')) {
          // Check OpenCode transformation
          const opencodePath = join(opencodeCommandsDir, file)
          expect(existsSync(opencodePath)).toBe(true)
          
          const opencodeContent = await readFile(opencodePath, 'utf-8')
          expect(opencodeContent).toContain('| description |')
          
          // Check Claude Code preservation
          const claudePath = join(claudeCommandsDir, file)
          expect(existsSync(claudePath)).toBe(true)
          
          const claudeContent = await readFile(claudePath, 'utf-8')
          expect(claudeContent).toContain('---')
        }
      }
    })

    it('should transform all agents correctly', async () => {
      const contentAgentsDir = join(TEST_ROOT, 'content', 'agents')
      const opencodeAgentsDir = join(TEST_ROOT, 'dist', '.opencode', 'agent', 'ferg')
      const claudeAgentsDir = join(TEST_ROOT, 'dist', '.claude-plugin', 'agents')
      
      const { readdir } = await import('fs/promises')
      const agentFiles = await readdir(contentAgentsDir)
      
      for (const file of agentFiles) {
        if (file.endsWith('.md')) {
          // Check OpenCode transformation
          const opencodePath = join(opencodeAgentsDir, file)
          expect(existsSync(opencodePath)).toBe(true)
          
          const opencodeContent = await readFile(opencodePath, 'utf-8')
          expect(opencodeContent).toContain('| description | mode |')
          
          // Check Claude Code preservation
          const claudePath = join(claudeAgentsDir, file)
          expect(existsSync(claudePath)).toBe(true)
          
          const claudeContent = await readFile(claudePath, 'utf-8')
          expect(claudeContent).toContain('---')
        }
      }
    })
  })

  describe('Real-world Content Scenarios', () => {
    it('should handle complex frontmatter structures', async () => {
      // Create a command with complex frontmatter
      const complexCommand = `---
name: complex-command
description: A command with complex frontmatter
agent: build
subtask: true
model: sonnet
temperature: 0.3
tools:
  read: true
  write: true
  bash: true
  grep: true
permission:
  network: true
  filesystem: read-write
tags:
  - complex
  - testing
  - integration
---

# Complex Command

This command has complex frontmatter with nested structures.
`
      
      await mkdir(join(TEST_ROOT, 'content', 'commands'), { recursive: true })
      await writeFile(join(TEST_ROOT, 'content', 'commands', 'complex-command.md'), complexCommand)
      
      execSync('bun run build', { cwd: TEST_ROOT })
      
      // Check that it was processed correctly
      const claudePath = join(TEST_ROOT, 'dist', '.claude-plugin', 'commands', 'complex-command.md')
      const content = await readFile(claudePath, 'utf-8')
      
      expect(content).toContain('name: complex-command')
      expect(content).toContain('tools:')
      expect(content).toContain('read: true')
      expect(content).toContain('tags:')
    })

    it('should handle markdown with code blocks and tables', async () => {
      const markdownWithComplexContent = `---
name: markdown-complex
description: Command with complex markdown content
agent: build
---

# Complex Markdown

This content includes various markdown elements:

## Code Blocks

\`\`\`typescript
const example = {
  name: "test",
  value: 123
}
\`\`\`

## Tables

| Feature | Status | Priority |
|---------|--------|----------|
| Feature A | Done | High |
| Feature B | In Progress | Medium |
| Feature C | Planned | Low |

## Lists

1. First item
2. Second item
   - Nested item 1
   - Nested item 2
3. Third item

## Blockquotes

> This is a blockquote
> with multiple lines
`
      
      await writeFile(join(TEST_ROOT, 'content', 'commands', 'markdown-complex.md'), markdownWithComplexContent)
      
      execSync('bun run build', { cwd: TEST_ROOT })
      
      // Verify content preservation
      const claudePath = join(TEST_ROOT, 'dist', '.claude-plugin', 'commands', 'markdown-complex.md')
      const content = await readFile(claudePath, 'utf-8')
      
      expect(content).toContain('```typescript')
      expect(content).toContain('| Feature | Status |')
      expect(content).toContain('1. First item')
      expect(content).toContain('> This is a blockquote')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large number of files efficiently', async () => {
      // Create many test files
      const commandsDir = join(TEST_ROOT, 'content', 'commands')
      const agentsDir = join(TEST_ROOT, 'content', 'agents')
      
      await mkdir(commandsDir, { recursive: true })
      await mkdir(agentsDir, { recursive: true })
      
      // Create 50 commands and 50 agents
      for (let i = 0; i < 50; i++) {
        const command = `---
name: test-command-${i}
description: Test command number ${i}
agent: build
---

# Test Command ${i}

This is test command ${i}.
`
        await writeFile(join(commandsDir, `test-command-${i}.md`), command)
        
        const agent = `---
name: test-agent-${i}
description: Test agent number ${i}
mode: subagent
---

# Test Agent ${i}

This is test agent ${i}.
`
        await writeFile(join(agentsDir, `test-agent-${i}.md`), agent)
      }
      
      const startTime = Date.now()
      execSync('bun run build', { cwd: TEST_ROOT })
      const endTime = Date.now()
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(endTime - startTime).toBeLessThan(15000)
      
      // Verify all files were processed
      const distCommandsDir = join(TEST_ROOT, 'dist', '.claude-plugin', 'commands')
      const distAgentsDir = join(TEST_ROOT, 'dist', '.claude-plugin', 'agents')
      
      const { readdir } = await import('fs/promises')
      const commandFiles = await readdir(distCommandsDir)
      const agentFiles = await readdir(distAgentsDir)
      
      expect(commandFiles.length).toBeGreaterThanOrEqual(50)
      expect(agentFiles.length).toBeGreaterThanOrEqual(50)
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle missing required fields gracefully', async () => {
      const invalidCommand = `---
name: invalid-command
---

# Invalid Command

Missing description field.
`
      
      await writeFile(join(TEST_ROOT, 'content', 'commands', 'invalid-command.md'), invalidCommand)
      
      // Validation should catch this
      expect(() => {
        execSync('bun run build --validate', { cwd: TEST_ROOT })
      }).toThrow()
    })

    it('should handle malformed YAML', async () => {
      const malformedYaml = `---
name: malformed
description: invalid: yaml: structure: unclosed
---

# Malformed YAML
`
      
      await writeFile(join(TEST_ROOT, 'content', 'commands', 'malformed.md'), malformedYaml)
      
      // Should handle gracefully (implementation dependent)
      const result = execSync('bun run build', { encoding: 'utf-8', cwd: TEST_ROOT })
      expect(result).toBeDefined() // Should not crash
    })

    it('should handle empty files', async () => {
      await writeFile(join(TEST_ROOT, 'content', 'commands', 'empty.md'), '')
      
      // Should handle gracefully
      const result = execSync('bun run build', { encoding: 'utf-8', cwd: TEST_ROOT })
      expect(result).toBeDefined()
    })
  })

  describe('Plugin Metadata Accuracy', () => {
    beforeEach(async () => {
      execSync('bun run build', { cwd: TEST_ROOT })
    })

    it('should generate correct plugin.json', async () => {
      const pluginJsonPath = join(TEST_ROOT, 'dist', '.claude-plugin', 'plugin.json')
      const pluginJson = JSON.parse(await readFile(pluginJsonPath, 'utf-8'))
      
      expect(pluginJson.name).toBe('ferg-engineering')
      expect(pluginJson.description).toBe('Compounding engineering system for Claude Code')
      expect(pluginJson.author).toBe('v1truv1us')
      expect(pluginJson.license).toBe('MIT')
      
      // Version should match package.json
      const packageJson = JSON.parse(await readFile(join(TEST_ROOT, 'package.json'), 'utf-8'))
      expect(pluginJson.version).toBe(packageJson.version)
    })

    it('should generate correct hooks.json', async () => {
      const hooksJsonPath = join(TEST_ROOT, 'dist', '.claude-plugin', 'hooks.json')
      const hooksJson = JSON.parse(await readFile(hooksJsonPath, 'utf-8'))
      
      expect(hooksJson.hooks).toBeDefined()
      expect(hooksJson.hooks.SessionStart).toBeDefined()
      expect(hooksJson.hooks.SessionStart[0].description).toContain('Initialize ai-eng-system')
    })

    it('should copy marketplace.json if exists', async () => {
      const marketplaceJsonPath = join(TEST_ROOT, 'dist', '.claude-plugin', 'marketplace.json')
      
      // Should exist if original has it
      if (existsSync(join(TEST_ROOT, 'marketplace.json'))) {
        expect(existsSync(marketplaceJsonPath)).toBe(true)
      }
    })
  })
})

// Helper function to copy project structure
async function copyProjectStructure(): Promise<void> {
   const originalRoot = '/home/vitruvius/git/ai-eng-system'
  
  // Copy essential files and directories
  const essentialItems = [
    'package.json',
    'build.ts',
    'content/',
    'skills/',
    'marketplace.json'
  ]
  
  for (const item of essentialItems) {
    const sourcePath = join(originalRoot, item)
    const destPath = join(TEST_ROOT, item)
    
    if (existsSync(sourcePath)) {
      if (item.endsWith('/')) {
        // Copy directory recursively
        await copyDirectory(sourcePath, destPath)
      } else {
        // Copy file
        await copyFile(sourcePath, destPath)
      }
    }
  }
}

async function copyDirectory(src: string, dest: string): Promise<void> {
  const { readdir } = await import('fs/promises')

  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    
    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}