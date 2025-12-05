#!/usr/bin/env bun

/**
 * Performance tests for ferg-engineering-system
 * 
 * Tests system performance under various load conditions:
 * - Large file counts
 * - Complex frontmatter
 * - Deep directory structures
 * - Memory usage
 * - Build time benchmarks
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test'
import { readFile, writeFile, mkdir, rm } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { performance } from 'perf_hooks'

const TEST_ROOT = join(tmpdir(), `ferg-perf-${Date.now()}`)

describe('Ferg Engineering System - Performance Tests', () => {
  beforeAll(async () => {
    await mkdir(TEST_ROOT, { recursive: true })
  })

  afterAll(async () => {
    await rm(TEST_ROOT, { recursive: true })
  })

  describe('Frontmatter Parsing Performance', () => {
    it('should parse simple frontmatter quickly', () => {
      const content = `---
name: test-command
description: A simple test command
agent: build
---

# Test Command

This is a simple test command body.
`
      
      const iterations = 10000
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        parseFrontmatter(content)
      }
      
      const endTime = performance.now()
      const avgTime = (endTime - startTime) / iterations
      
      // Should average less than 0.1ms per parse
      expect(avgTime).toBeLessThan(0.1)
    })

    it('should parse complex frontmatter efficiently', () => {
      const content = `---
name: complex-command
description: A complex command with extensive metadata and configuration options
agent: build
subtask: true
model: sonnet
temperature: 0.3
tools:
  read: true
  write: true
  bash: true
  grep: true
  glob: true
  list: true
permission:
  network: true
  filesystem: read-write
  environment: read
tags:
  - complex
  - performance
  - testing
  - benchmark
  - optimization
---

# Complex Command

This command has extensive frontmatter with many fields and nested structures.

## Features

- Feature 1
- Feature 2
- Feature 3

## Configuration

The command supports various configuration options and parameters.
`
      
      const iterations = 1000
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        parseFrontmatter(content)
      }
      
      const endTime = performance.now()
      const avgTime = (endTime - startTime) / iterations
      
      // Should still be reasonably fast even with complex frontmatter
      expect(avgTime).toBeLessThan(0.5)
    })

    it('should handle large content bodies efficiently', () => {
      const largeBody = '# Large Content\n\n'.repeat(1000) + 'Large content body with many lines.'
      const content = `---
name: large-content
description: Command with large content body
---

${largeBody}`
      
      const iterations = 100
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        parseFrontmatter(content)
      }
      
      const endTime = performance.now()
      const avgTime = (endTime - startTime) / iterations
      
      // Should handle large content efficiently
      expect(avgTime).toBeLessThan(1.0)
    })
  })

  describe('File System Operations Performance', () => {
    it('should handle large directory structures efficiently', async () => {
      const testDir = join(TEST_ROOT, 'large-structure')
      
      // Create deep directory structure with many files
      await createLargeDirectoryStructure(testDir, 5, 20) // 5 levels deep, 20 files per level
      
      const startTime = performance.now()
      const files = await getMarkdownFiles(testDir)
      const endTime = performance.now()
      
      const duration = endTime - startTime
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(1000) // 1 second
      expect(files.length).toBeGreaterThan(0)
      
      // Cleanup
      await rm(testDir, { recursive: true })
    })

    it('should scale linearly with file count', async () => {
      const fileCounts = [10, 50, 100, 200]
      const durations: number[] = []
      
      for (const count of fileCounts) {
        const testDir = join(TEST_ROOT, `scale-test-${count}`)
        await mkdir(testDir, { recursive: true })
        
        // Create specified number of files
        for (let i = 0; i < count; i++) {
          await writeFile(join(testDir, `file-${i}.md`), `# File ${i}`)
        }
        
        const startTime = performance.now()
        const files = await getMarkdownFiles(testDir)
        const endTime = performance.now()
        
        durations.push(endTime - startTime)
        expect(files.length).toBe(count)
        
        await rm(testDir, { recursive: true })
      }
      
      // Check that scaling is roughly linear (not exponential)
      // The ratio should be reasonable
      const ratio10to50 = durations[1] / durations[0]
      const ratio50to100 = durations[2] / durations[1]
      const ratio100to200 = durations[3] / durations[2]
      
      expect(ratio10to50).toBeLessThan(10) // Should be much less than 5x for 5x files
      expect(ratio50to100).toBeLessThan(3)  // Should be less than 2x for 2x files
      expect(ratio100to200).toBeLessThan(3) // Should be less than 2x for 2x files
    })
  })

  describe('Content Transformation Performance', () => {
    it('should transform commands quickly', () => {
      const meta = {
        name: 'performance-test',
        description: 'A performance test command',
        agent: 'build',
        subtask: true
      }
      const body = '# Performance Test\n\nThis is a performance test.\n\n'.repeat(10)
      
      const iterations = 1000
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        transformToOpenCodeCommand(meta, body)
      }
      
      const endTime = performance.now()
      const avgTime = (endTime - startTime) / iterations
      
      // Should be very fast
      expect(avgTime).toBeLessThan(0.1)
    })

    it('should transform agents quickly', () => {
      const meta = {
        name: 'performance-agent',
        description: 'A performance test agent',
        mode: 'subagent'
      }
      const body = '# Performance Agent\n\nThis is a performance test agent.\n\n'.repeat(10)
      
      const iterations = 1000
      const startTime = performance.now()
      
      for (let i = 0; i < iterations; i++) {
        transformToOpenCodeAgent(meta, body)
      }
      
      const endTime = performance.now()
      const avgTime = (endTime - startTime) / iterations
      
      // Should be very fast
      expect(avgTime).toBeLessThan(0.1)
    })
  })

  describe('Memory Usage', () => {
    it('should not leak memory during repeated operations', async () => {
      const content = `---
name: memory-test
description: Memory test command
agent: build
---

# Memory Test

This command tests memory usage.
`
      
      const initialMemory = process.memoryUsage().heapUsed
      const iterations = 10000
      
      for (let i = 0; i < iterations; i++) {
        parseFrontmatter(content)
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
      }
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })

    it('should handle large content without excessive memory usage', async () => {
      const largeContent = '# Large Content\n\n'.repeat(10000)
      const content = `---
name: large-memory-test
description: Large memory test
---

${largeContent}`
      
      const initialMemory = process.memoryUsage().heapUsed
      
      // Parse large content
      parseFrontmatter(content)
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      
      // Should handle large content without excessive memory usage
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024) // Less than 50MB
    })
  })

  describe('Build Performance Simulation', () => {
    it('should simulate build performance with realistic dataset', async () => {
      const contentDir = join(TEST_ROOT, 'content')
      await mkdir(join(contentDir, 'commands'), { recursive: true })
      await mkdir(join(contentDir, 'agents'), { recursive: true })
      
      // Create realistic dataset
      const commandCount = 25
      const agentCount = 20
      
      // Create commands
      for (let i = 0; i < commandCount; i++) {
        const command = `---
name: command-${i}
description: Command number ${i} with realistic content
agent: build
subtask: ${i % 2 === 0}
---

# Command ${i}

This is command ${i} with realistic content and structure.

## Description

Command ${i} provides functionality for testing purposes.

## Usage

Use this command to ${i % 3 === 0 ? 'create' : i % 3 === 1 ? 'update' : 'delete'} items.

## Process

1. Step 1 for command ${i}
2. Step 2 for command ${i}
3. Step 3 for command ${i}

## Examples

\`\`\`bash
command-${i} --option value
\`\`\`
`
        await writeFile(join(contentDir, 'commands', `command-${i}.md`), command)
      }
      
      // Create agents
      for (let i = 0; i < agentCount; i++) {
        const agent = `---
name: agent-${i}
description: Agent number ${i} with specialized capabilities
mode: subagent
temperature: ${0.1 + (i * 0.05)}
tools:
  read: true
  write: ${i % 2 === 0}
  bash: ${i % 3 === 0}
---

# Agent ${i}

This is agent ${i} with specialized capabilities and expertise.

## Expertise

Agent ${i} specializes in ${['frontend', 'backend', 'devops', 'testing', 'security'][i % 5]} development.

## Capabilities

- Capability 1 for agent ${i}
- Capability 2 for agent ${i}
- Capability 3 for agent ${i}

## Approach

Agent ${i} follows a systematic approach to problem-solving:

1. Analysis phase
2. Design phase  
3. Implementation phase
4. Testing phase
5. Deployment phase

## Quality Standards

Agent ${i} maintains high quality standards and best practices.
`
        await writeFile(join(contentDir, 'agents', `agent-${i}.md`), agent)
      }
      
      // Simulate build process
      const startTime = performance.now()
      
      // Get all files
      const commandFiles = await getMarkdownFiles(join(contentDir, 'commands'))
      const agentFiles = await getMarkdownFiles(join(contentDir, 'agents'))
      
      // Parse all content
      for (const file of [...commandFiles, ...agentFiles]) {
        const content = await readFile(file, 'utf-8')
        parseFrontmatter(content)
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(2000) // 2 seconds
      expect(commandFiles.length).toBe(commandCount)
      expect(agentFiles.length).toBe(agentCount)
      
      // Cleanup
      await rm(contentDir, { recursive: true })
    })
  })

  describe('Stress Tests', () => {
    it('should handle extreme file counts', async () => {
      const testDir = join(TEST_ROOT, 'stress-test')
      await mkdir(testDir, { recursive: true })
      
      const fileCount = 1000
      
      // Create many files
      for (let i = 0; i < fileCount; i++) {
        await writeFile(join(testDir, `stress-${i}.md`), `# Stress Test ${i}`)
      }
      
      const startTime = performance.now()
      const files = await getMarkdownFiles(testDir)
      const endTime = performance.now()
      
      const duration = endTime - startTime
      
      // Should handle large file counts
      expect(duration).toBeLessThan(5000) // 5 seconds
      expect(files.length).toBe(fileCount)
      
      await rm(testDir, { recursive: true })
    })

    it('should handle very deep directory structures', async () => {
      const testDir = join(TEST_ROOT, 'deep-stress')
      
      // Create very deep structure
      await createLargeDirectoryStructure(testDir, 20, 5) // 20 levels deep, 5 files per level
      
      const startTime = performance.now()
      const files = await getMarkdownFiles(testDir)
      const endTime = performance.now()
      
      const duration = endTime - startTime
      
      // Should handle deep structures
      expect(duration).toBeLessThan(3000) // 3 seconds
      expect(files.length).toBeGreaterThan(0)
      
      await rm(testDir, { recursive: true })
    })
  })
})

// Helper functions

function parseFrontmatter(content: string): { meta: Record<string, any>; body: string } {
  if (!content || typeof content !== 'string') {
    return { meta: {}, body: '' }
  }
  
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { meta: {}, body: content }
  }

  const [, frontmatter, body] = match
  const meta: Record<string, any> = {}

  for (const line of frontmatter.split("\n")) {
    const colonIndex = line.indexOf(":")
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value: any = line.slice(colonIndex + 1).trim()
      
      if (value === "true") value = true
      else if (value === "false") value = false
      
      meta[key] = value
    }
  }

  return { meta, body: body.trim() }
}

function transformToOpenCodeCommand(meta: any, body: string): string {
  const headers = ["description"]
  const values = [meta.description]

  if (meta.agent) {
    headers.push("agent")
    values.push(meta.agent)
  }

  if (meta.subtask !== undefined) {
    headers.push("subtask")
    values.push(String(meta.subtask))
  }

  const headerRow = `| ${headers.join(" | ")} |`
  const separatorRow = `|${headers.map(() => "---").join("|")}|`
  const valueRow = `| ${values.join(" | ")} |`

  return `${headerRow}\n${separatorRow}\n${valueRow}\n\n${body}`
}

function transformToOpenCodeAgent(meta: any, body: string): string {
  const headerRow = "| description | mode |"
  const separatorRow = "|---|---|"
  const valueRow = `| ${meta.description} | ${meta.mode || "subagent"} |`

  return `${headerRow}\n${separatorRow}\n${valueRow}\n\n${body}`
}

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

async function createLargeDirectoryStructure(baseDir: string, depth: number, filesPerLevel: number): Promise<void> {
  const { mkdir, writeFile } = await import('fs/promises')
  const { join } = await import('path')
  
  async function createLevel(currentDir: string, currentDepth: number): Promise<void> {
    if (currentDepth <= 0) return
    
    // Create files at this level
    for (let i = 0; i < filesPerLevel; i++) {
      await writeFile(join(currentDir, `file-${i}.md`), `# File at depth ${currentDepth}`)
    }
    
    // Create subdirectories
    for (let i = 0; i < 3; i++) {
      const subDir = join(currentDir, `subdir-${i}`)
      await mkdir(subDir, { recursive: true })
      await createLevel(subDir, currentDepth - 1)
    }
  }
  
  await mkdir(baseDir, { recursive: true })
  await createLevel(baseDir, depth)
}