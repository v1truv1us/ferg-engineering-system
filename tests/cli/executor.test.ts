#!/usr/bin/env bun

/**
 * Tests for the CLI executor module
 * Tests command-line interface functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'bun:test'
import { ExecutorCLI } from '../../src/cli/executor'
import { spawn } from 'child_process'
import { writeFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'

describe('ExecutorCLI', () => {
  let cli: ExecutorCLI
  let tempDir: string

  beforeEach(() => {
    cli = new ExecutorCLI()
    tempDir = join(tmpdir(), `ferg-cli-test-${Date.now()}`)
  })

  afterEach(() => {
    // Cleanup temp files if they exist
    const tempPlan = join(tempDir, 'test-plan.yaml')
    if (existsSync(tempPlan)) {
      unlinkSync(tempPlan)
    }
  })

  describe('CLI Initialization', () => {
    it('should create CLI instance successfully', () => {
      expect(cli).toBeDefined()
      expect(cli.getProgram()).toBeDefined()
    })

    it('should have correct program configuration', () => {
      const program = cli.getProgram()
      expect(program.name()).toBe('ferg-exec')
      expect(program.description()).toContain('Ferg Engineering System')
    })

    it('should register all required commands', () => {
      const program = cli.getProgram()
      const commands = program.commands.map(cmd => cmd.name())
      
      expect(commands).toContain('plan')
      expect(commands).toContain('gates')
      expect(commands).toContain('report')
      expect(commands).toContain('validate')
    })
  })

  describe('Plan Command', () => {
    it('should have correct plan command configuration', () => {
      const program = cli.getProgram()
      const planCommand = program.commands.find(cmd => cmd.name() === 'plan')
      
      expect(planCommand).toBeDefined()
      expect(planCommand?.description()).toContain('Execute a plan file')
      expect(planCommand?.options.length).toBeGreaterThan(0)
    })

    it('should accept required file argument', () => {
      const program = cli.getProgram()
      const planCommand = program.commands.find(cmd => cmd.name() === 'plan')
      
      expect(planCommand?.args.length).toBe(1)
      expect(planCommand?.args[0].name).toBe('file')
    })

    it('should support all expected options', () => {
      const program = cli.getProgram()
      const planCommand = program.commands.find(cmd => cmd.name() === 'plan')
      const optionFlags = planCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('-d, --dry-run')
      expect(optionFlags).toContain('-c, --continue-on-error')
      expect(optionFlags).toContain('-v, --verbose')
      expect(optionFlags).toContain('-w, --working-directory <dir>')
      expect(optionFlags).toContain('--report <file>')
    })
  })

  describe('Gates Command', () => {
    it('should have correct gates command configuration', () => {
      const program = cli.getProgram()
      const gatesCommand = program.commands.find(cmd => cmd.name() === 'gates')
      
      expect(gatesCommand).toBeDefined()
      expect(gatesCommand?.description()).toContain('Run quality gates')
    })

    it('should support gates-specific options', () => {
      const program = cli.getProgram()
      const gatesCommand = program.commands.find(cmd => cmd.name() === 'gates')
      const optionFlags = gatesCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('-c, --config <file>')
      expect(optionFlags).toContain('-d, --dry-run')
      expect(optionFlags).toContain('-v, --verbose')
      expect(optionFlags).toContain('--report <file>')
    })
  })

  describe('Report Command', () => {
    it('should have correct report command configuration', () => {
      const program = cli.getProgram()
      const reportCommand = program.commands.find(cmd => cmd.name() === 'report')
      
      expect(reportCommand).toBeDefined()
      expect(reportCommand?.description()).toContain('Generate and display execution report')
    })

    it('should accept report file argument', () => {
      const program = cli.getProgram()
      const reportCommand = program.commands.find(cmd => cmd.name() === 'report')
      
      expect(reportCommand?.args.length).toBe(1)
      expect(reportCommand?.args[0].name).toBe('file')
    })

    it('should support format option', () => {
      const program = cli.getProgram()
      const reportCommand = program.commands.find(cmd => cmd.name() === 'report')
      const optionFlags = reportCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('--format <format>')
    })
  })

  describe('Validate Command', () => {
    it('should have correct validate command configuration', () => {
      const program = cli.getProgram()
      const validateCommand = program.commands.find(cmd => cmd.name() === 'validate')
      
      expect(validateCommand).toBeDefined()
      expect(validateCommand?.description()).toContain('Validate plan file')
    })

    it('should accept validation file argument', () => {
      const program = cli.getProgram()
      const validateCommand = program.commands.find(cmd => cmd.name() === 'validate')
      
      expect(validateCommand?.args.length).toBe(1)
      expect(validateCommand?.args[0].name).toBe('file')
    })
  })

  describe('CLI Integration', () => {
    it('should handle help command gracefully', async () => {
      const result = await runCLICommand(['--help'])
      expect(result.code).toBe(0)
      expect(result.stdout).toContain('Ferg Engineering System')
      expect(result.stdout).toContain('Commands:')
    })

    it('should handle version command', async () => {
      const result = await runCLICommand(['--version'])
      expect(result.code).toBe(0)
      expect(result.stdout).toContain('0.3.0-alpha')
    })

    it('should show error for invalid command', async () => {
      const result = await runCLICommand(['invalid-command'])
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('error: unknown command')
    })

    it('should handle missing required arguments', async () => {
      const result = await runCLICommand(['plan'])
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('error: missing required argument')
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent plan file', async () => {
      const result = await runCLICommand(['plan', 'non-existent.yaml'])
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Error executing plan')
    })

    it('should handle invalid report file', async () => {
      const result = await runCLICommand(['report', 'non-existent.json'])
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Error reading report')
    })

    it('should handle invalid validation file', async () => {
      const result = await runCLICommand(['validate', 'non-existent.yaml'])
      expect(result.code).toBe(1)
      expect(result.stderr).toContain('Plan validation failed')
    })
  })
})

// Helper function to run CLI commands
async function runCLICommand(args: string[]): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve) => {
    const child = spawn('bun', ['run', 'src/cli/executor.ts', ...args], {
      stdio: 'pipe',
      shell: true,
      cwd: process.cwd()
    })

    let stdout = ''
    let stderr = ''

    child.stdout?.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr?.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({ stdout, stderr, code: code || 0 })
    })

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill()
      resolve({ stdout: '', stderr: 'Command timed out', code: 1 })
    }, 10000)
  })
}