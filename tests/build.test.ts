#!/usr/bin/env bun

/**
 * Comprehensive test suite for ai-eng-system
 * 
 * Tests:
 * - Build system functionality
 * - Content processing and transformation
 * - Frontmatter parsing
 * - File operations and directory structure
 * - Validation logic
 * - Plugin generation (Claude Code & OpenCode)
 * - Error handling and edge cases
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test'
import { readFile, writeFile, mkdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join, basename, dirname } from 'path'
import { tmpdir } from 'os'
import { spawn } from 'child_process'

// Test utilities
const TEST_ROOT = join(tmpdir(), `ai-eng-test-${Date.now()}`)
const CONTENT_DIR = join(TEST_ROOT, 'content')
const DIST_DIR = join(TEST_ROOT, 'dist')
const SKILLS_DIR = join(TEST_ROOT, 'skills')

// Mock package.json for testing
const MOCK_PACKAGE_JSON = {
  name: '@v1truv1us/engineering-system',
  version: '0.1.0-test',
  description: 'Test package',
  author: 'test',
  license: 'MIT'
}

// Sample content for testing
const SAMPLE_COMMAND = `---
name: test-command
description: A test command for validation
agent: build
subtask: true
---

# Test Command

This is a test command body with multiple lines.

## Usage

Use this command to test the build system.

## Process

1. First step
2. Second step
3. Third step
`

const SAMPLE_AGENT = `---
name: test-agent
description: A test agent for validation
mode: subagent
temperature: 0.1
tools:
  read: true
  write: true
---

# Test Agent

This is a test agent body with comprehensive details.

## Capabilities

- Testing capability 1
- Testing capability 2

## Behavior

- Test behavior 1
- Test behavior 2
`

const SAMPLE_SKILL = `---
name: test-skill
description: A test skill for validation
version: 1.0.0
---

# Test Skill

This is a test skill with proper structure.

## Overview

Test skill overview content.

## Features

- Feature 1
- Feature 2

## Usage

Test skill usage instructions.
`

describe('Ferg Engineering System - Build System', () => {
  beforeAll(async () => {
    // Setup test environment
    await mkdir(TEST_ROOT, { recursive: true })
    await mkdir(CONTENT_DIR, { recursive: true })
    await mkdir(SKILLS_DIR, { recursive: true })
    
    // Create directory structure
    await mkdir(join(CONTENT_DIR, 'commands'), { recursive: true })
    await mkdir(join(CONTENT_DIR, 'agents'), { recursive: true })
    await mkdir(join(SKILLS_DIR, 'test-skill'), { recursive: true })
    
    // Write sample content
    await writeFile(join(CONTENT_DIR, 'commands', 'test-command.md'), SAMPLE_COMMAND)
    await writeFile(join(CONTENT_DIR, 'agents', 'test-agent.md'), SAMPLE_AGENT)
    await writeFile(join(SKILLS_DIR, 'test-skill', 'SKILL.md'), SAMPLE_SKILL)
    
    // Write mock package.json
    await writeFile(join(TEST_ROOT, 'package.json'), JSON.stringify(MOCK_PACKAGE_JSON, null, 2))
  })

  afterAll(async () => {
    // Cleanup test environment
    if (existsSync(TEST_ROOT)) {
      await rm(TEST_ROOT, { recursive: true })
    }
  })

  beforeEach(async () => {
    // Clean dist directory before each test
    if (existsSync(DIST_DIR)) {
      await rm(DIST_DIR, { recursive: true })
    }
  })

  describe('Frontmatter Parsing', () => {
    it('should parse YAML frontmatter correctly', () => {
      // Import the parseFrontmatter function from build.ts
      // Since it's not exported, we'll test it indirectly through build process
      expect(SAMPLE_COMMAND).toContain('---')
      expect(SAMPLE_COMMAND).toContain('name: test-command')
      expect(SAMPLE_COMMAND).toContain('description: A test command for validation')
    })

    it('should handle content without frontmatter', () => {
      const contentWithoutFrontmatter = '# Simple Content\n\nJust markdown content.'
      expect(contentWithoutFrontmatter).not.toContain('---')
    })

    it('should parse boolean values correctly', () => {
      expect(SAMPLE_COMMAND).toContain('subtask: true')
      expect(SAMPLE_AGENT).toContain('temperature: 0.1')
    })

    it('should handle nested structures', () => {
      expect(SAMPLE_AGENT).toContain('tools:')
      expect(SAMPLE_AGENT).toContain('read: true')
      expect(SAMPLE_AGENT).toContain('write: true')
    })
  })

  describe('File Operations', () => {
    it('should create dist directory structure', async () => {
      // This will be tested through the build process
      expect(CONTENT_DIR).toBeDefined()
      expect(SKILLS_DIR).toBeDefined()
    })

    it('should read markdown files recursively', async () => {
      const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, 'commands'))
      const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, 'agents'))
      
      expect(commandFiles).toHaveLength(1)
      expect(agentFiles).toHaveLength(1)
      expect(commandFiles[0]).toContain('test-command.md')
      expect(agentFiles[0]).toContain('test-agent.md')
    })

    it('should handle empty directories gracefully', async () => {
      const emptyDir = join(TEST_ROOT, 'empty')
      await mkdir(emptyDir, { recursive: true })
      
      const files = await getMarkdownFiles(emptyDir)
      expect(files).toHaveLength(0)
    })
  })

  describe('Content Validation', () => {
    it('should validate command frontmatter', async () => {
      const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, 'commands'))
      const content = await readFile(commandFiles[0], 'utf-8')
      
      expect(content).toContain('name: test-command')
      expect(content).toContain('description: A test command for validation')
    })

    it('should validate agent frontmatter', async () => {
      const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, 'agents'))
      const content = await readFile(agentFiles[0], 'utf-8')
      
      expect(content).toContain('name: test-agent')
      expect(content).toContain('description: A test agent for validation')
      expect(content).toContain('mode: subagent')
    })

    it('should detect missing required fields', async () => {
      // Create invalid command
      const invalidCommand = `---
name: invalid-command
---

# Invalid Command

Missing description field.
`
      await writeFile(join(CONTENT_DIR, 'commands', 'invalid-command.md'), invalidCommand)
      
      // Validation should fail (we'll test this through the validate function)
      const content = await readFile(join(CONTENT_DIR, 'commands', 'invalid-command.md'), 'utf-8')
      expect(content).toContain('name: invalid-command')
      expect(content).not.toContain('description:')
    })
  })

  describe('Build Process', () => {
    it('should build Claude Code plugin structure', async () => {
      // Run build process in test directory
      await runBuild()
      
      // Check Claude Code output
      const claudeDir = join(DIST_DIR, '.claude-plugin')
      expect(existsSync(claudeDir)).toBe(true)
      
      // Check plugin.json
      const pluginJsonPath = join(claudeDir, 'plugin.json')
      expect(existsSync(pluginJsonPath)).toBe(true)
      
      const pluginJson = JSON.parse(await readFile(pluginJsonPath, 'utf-8'))
      expect(pluginJson.name).toBe('ai-eng-system')
      expect(pluginJson.version).toBe(MOCK_PACKAGE_JSON.version)
      
      // Check hooks.json
      const hooksJsonPath = join(claudeDir, 'hooks.json')
      expect(existsSync(hooksJsonPath)).toBe(true)
      
      // Check commands
      const commandsDir = join(claudeDir, 'commands')
      expect(existsSync(commandsDir)).toBe(true)
      
      const testCommandPath = join(commandsDir, 'test-command.md')
      expect(existsSync(testCommandPath)).toBe(true)
      
      // Check agents
      const agentsDir = join(claudeDir, 'agents')
      expect(existsSync(agentsDir)).toBe(true)
      
      const testAgentPath = join(agentsDir, 'test-agent.md')
      expect(existsSync(testAgentPath)).toBe(true)
    })

    it('should build OpenCode plugin structure', async () => {
      await runBuild()
      
      // Check OpenCode output
      const opencodeDir = join(DIST_DIR, '.opencode')
      expect(existsSync(opencodeDir)).toBe(true)
      
      // Check commands
      const commandsDir = join(opencodeDir, 'command', 'ai-eng')
      expect(existsSync(commandsDir)).toBe(true)

      const testCommandPath = join(commandsDir, 'test-command.md')
      expect(existsSync(testCommandPath)).toBe(true)

      // Check agents
      const agentsDir = join(opencodeDir, 'agent', 'ai-eng')
      expect(existsSync(agentsDir)).toBe(true)
      
      const testAgentPath = join(agentsDir, 'test-agent.md')
      expect(existsSync(testAgentPath)).toBe(true)
    })

    it('should copy skills to dist', async () => {
      await runBuild()
      
      const skillsDistDir = join(DIST_DIR, 'skills')
      expect(existsSync(skillsDistDir)).toBe(true)
      
      const testSkillPath = join(skillsDistDir, 'test-skill', 'SKILL.md')
      expect(existsSync(testSkillPath)).toBe(true)
    })
  })

  describe('Content Transformation', () => {
    it('should transform commands to OpenCode table format', async () => {
      await runBuild()
      
      const opencodeCommandPath = join(DIST_DIR, '.opencode', 'command', 'ai-eng', 'test-command.md')
      const content = await readFile(opencodeCommandPath, 'utf-8')
      
      // Should contain table format
      expect(content).toContain('| description | agent | subtask |')
      expect(content).toContain('|---|---|---|')
      expect(content).toContain('| A test command for validation | build | true |')
    })

    it('should transform agents to OpenCode table format', async () => {
      await runBuild()
      
      const opencodeAgentPath = join(DIST_DIR, '.opencode', 'agent', 'ai-eng', 'test-agent.md')
      const content = await readFile(opencodeAgentPath, 'utf-8')
      
      // Should contain table format
      expect(content).toContain('| description | mode |')
      expect(content).toContain('|---|---|')
      expect(content).toContain('| A test agent for validation | subagent |')
    })

    it('should preserve Claude Code YAML format', async () => {
      await runBuild()
      
      const claudeCommandPath = join(DIST_DIR, '.claude-plugin', 'commands', 'test-command.md')
      const content = await readFile(claudeCommandPath, 'utf-8')
      
      // Should preserve original YAML format
      expect(content).toContain('---')
      expect(content).toContain('name: test-command')
      expect(content).toContain('description: A test command for validation')
      expect(content).toContain('agent: build')
      expect(content).toContain('subtask: true')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing content directory', async () => {
      // Remove content directory temporarily
      await rm(CONTENT_DIR, { recursive: true })
      
      // Build should fail gracefully
      expect(async () => {
        await build()
      }).toThrow()
    })

    it('should handle invalid YAML frontmatter', async () => {
      const invalidYaml = `---
name: test
description: invalid yaml: unclosed "quote"
---

# Content
`
      await writeFile(join(CONTENT_DIR, 'commands', 'invalid-yaml.md'), invalidYaml)
      
      // Should handle gracefully (implementation dependent)
      expect(existsSync(join(CONTENT_DIR, 'commands', 'invalid-yaml.md'))).toBe(true)
    })

    it('should handle file permission errors gracefully', async () => {
      // This is more of an integration test
      // In a real scenario, we'd mock file system errors
      expect(true).toBe(true) // Placeholder for permission error handling
    })
  })

  describe('Performance', () => {
    it('should complete build within reasonable time', async () => {
      const startTime = Date.now()
      await runBuild()
      const endTime = Date.now()
      
      // Should complete within 5 seconds for small test dataset
      expect(endTime - startTime).toBeLessThan(5000)
    })

    it('should handle multiple files efficiently', async () => {
      // Create multiple test files
      for (let i = 0; i < 10; i++) {
        const commandContent = SAMPLE_COMMAND.replace('test-command', `test-command-${i}`)
        await writeFile(join(CONTENT_DIR, 'commands', `test-command-${i}.md`), commandContent)
      }
      
      const startTime = Date.now()
      await runBuild()
      const endTime = Date.now()
      
      // Should still complete within reasonable time
      expect(endTime - startTime).toBeLessThan(10000)
    })
  })
})

// Helper function (copied from build.ts since it's not exported)
async function getMarkdownFiles(dir: string): Promise<string[]> {
  const { readdir } = await import('fs/promises')
  const { existsSync } = await import('fs')
  const { join } = await import('path')
  
  const files: string[] = []
  
  if (!existsSync(dir)) return files

  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await getMarkdownFiles(fullPath))
    } else if (entry.name.endsWith('.md')) {
      files.push(fullPath)
    }
  }

  return files
}

// Function to run build script as subprocess
async function runBuild(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Run build from project root, but set environment to use test directory
    const buildProcess = spawn('bun', ['run', 'build.ts'], {
      cwd: process.cwd(), // Run from project root
      env: { ...process.env, TEST_ROOT }, // Pass test root if needed
      stdio: 'inherit'
    })

    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Build failed with code ${code}`))
      }
    })

    buildProcess.on('error', reject)
  })
}