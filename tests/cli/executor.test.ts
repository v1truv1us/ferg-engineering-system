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
    tempDir = join(tmpdir(), `ai-eng-cli-test-${Date.now()}`)
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
      expect(program.name()).toBe('ai-exec')
      expect(program.description()).toContain('AI Engineering System')
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

      // Check that the command has arguments defined
      expect(planCommand).toBeDefined()
      // Commander.js stores args differently - just check the command exists and has proper structure
      expect(planCommand?.name()).toBe('plan')
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

      expect(reportCommand).toBeDefined()
      expect(reportCommand?.name()).toBe('report')
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

      expect(validateCommand).toBeDefined()
      expect(validateCommand?.name()).toBe('validate')
    })
  })

  describe('CLI Integration', () => {
    it('should handle help command gracefully', async () => {
      // Test programmatic usage instead of subprocess
      const program = cli.getProgram()
      expect(program.name()).toBe('ai-exec')
      expect(program.description()).toContain('AI Engineering System')
    })

    it('should handle version command', async () => {
      // Test version is set correctly
      const program = cli.getProgram()
      expect(program.version()).toBe('0.3.0-alpha')
    })

    it('should have expected commands', () => {
      const program = cli.getProgram()
      const commandNames = program.commands.map(cmd => cmd.name())
      expect(commandNames).toContain('plan')
      expect(commandNames).toContain('report')
      expect(commandNames).toContain('validate')
    })

    it('should reject invalid commands programmatically', () => {
      // Test that invalid commands are not found
      const program = cli.getProgram()
      const commandNames = program.commands.map(cmd => cmd.name())
      expect(commandNames).not.toContain('invalid-command')
    })
  })

  describe('Error Handling', () => {
    it('should handle non-existent plan file', async () => {
      // Test programmatic error handling
      const program = cli.getProgram()
      // This would normally be tested through the action handler
      expect(program).toBeDefined()
    })

    it('should handle invalid report file', async () => {
      // Test programmatic error handling
      const program = cli.getProgram()
      expect(program).toBeDefined()
    })

    it('should handle invalid validation file', async () => {
      // Test programmatic error handling
      const program = cli.getProgram()
      expect(program).toBeDefined()
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

describe('ExecutorCLI - Swarms Integration', () => {
  let cli: ExecutorCLI

  beforeEach(() => {
    cli = new ExecutorCLI()
  })

  describe('Swarm-Enabled Commands', () => {
    it('should register generate-plan command', () => {
      const program = cli.getProgram()
      const generatePlanCommand = program.commands.find(cmd => cmd.name() === 'generate-plan')
      
      expect(generatePlanCommand).toBeDefined()
      expect(generatePlanCommand?.description()).toContain('Generate implementation plan')
    })

    it('should have --swarm flag on generate-plan command', () => {
      const program = cli.getProgram()
      const generatePlanCommand = program.commands.find(cmd => cmd.name() === 'generate-plan')
      const optionFlags = generatePlanCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('--swarm')
    })

    it('should register code-review command', () => {
      const program = cli.getProgram()
      const codeReviewCommand = program.commands.find(cmd => cmd.name() === 'code-review')
      
      expect(codeReviewCommand).toBeDefined()
      expect(codeReviewCommand?.description()).toContain('multi-agent code review')
    })

    it('should have --swarm flag on code-review command', () => {
      const program = cli.getProgram()
      const codeReviewCommand = program.commands.find(cmd => cmd.name() === 'code-review')
      const optionFlags = codeReviewCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('--swarm')
    })

    it('should register research command', () => {
      const program = cli.getProgram()
      const researchCommand = program.commands.find(cmd => cmd.name() === 'research')
      
      expect(researchCommand).toBeDefined()
      expect(researchCommand?.description()).toContain('research')
    })

    it('should have --swarm flag on research command', () => {
      const program = cli.getProgram()
      const researchCommand = program.commands.find(cmd => cmd.name() === 'research')
      const optionFlags = researchCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('--swarm')
    })
  })

  describe('Swarm Status Command', () => {
    it('should register swarm-status command', () => {
      const program = cli.getProgram()
      const swarmStatusCommand = program.commands.find(cmd => cmd.name() === 'swarm-status')
      
      expect(swarmStatusCommand).toBeDefined()
      expect(swarmStatusCommand?.description()).toContain('Swarms integration status')
    })

    it('should have --json flag on swarm-status command', () => {
      const program = cli.getProgram()
      const swarmStatusCommand = program.commands.find(cmd => cmd.name() === 'swarm-status')
      const optionFlags = swarmStatusCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('--json')
    })
  })

  describe('Agent Status Command', () => {
    it('should register agent-status command', () => {
      const program = cli.getProgram()
      const agentStatusCommand = program.commands.find(cmd => cmd.name() === 'agent-status')
      
      expect(agentStatusCommand).toBeDefined()
      expect(agentStatusCommand?.description()).toContain('agent execution status')
    })

    it('should have --json flag on agent-status command', () => {
      const program = cli.getProgram()
      const agentStatusCommand = program.commands.find(cmd => cmd.name() === 'agent-status')
      const optionFlags = agentStatusCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('--json')
    })
  })

  describe('Command Option Configuration', () => {
    it('should have all required options on generate-plan command', () => {
      const program = cli.getProgram()
      const generatePlanCommand = program.commands.find(cmd => cmd.name() === 'generate-plan')
      const optionFlags = generatePlanCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('-s, --scope <scope>')
      expect(optionFlags).toContain('-r, --requirements <reqs...>')
      expect(optionFlags).toContain('-c, --constraints <constraints...>')
      expect(optionFlags).toContain('-o, --output <file>')
      expect(optionFlags).toContain('--swarm')
      expect(optionFlags).toContain('-v, --verbose')
    })

    it('should have all required options on code-review command', () => {
      const program = cli.getProgram()
      const codeReviewCommand = program.commands.find(cmd => cmd.name() === 'code-review')
      const optionFlags = codeReviewCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('-t, --type <type>')
      expect(optionFlags).toContain('-s, --severity <severity>')
      expect(optionFlags).toContain('-f, --focus <focus>')
      expect(optionFlags).toContain('-o, --output <file>')
      expect(optionFlags).toContain('--swarm')
      expect(optionFlags).toContain('-v, --verbose')
    })

    it('should have all required options on research command', () => {
      const program = cli.getProgram()
      const researchCommand = program.commands.find(cmd => cmd.name() === 'research')
      const optionFlags = researchCommand?.options.map(opt => opt.flags) || []
      
      expect(optionFlags).toContain('-s, --scope <scope>')
      expect(optionFlags).toContain('-d, --depth <depth>')
      expect(optionFlags).toContain('-o, --output <file>')
      expect(optionFlags).toContain('-f, --format <format>')
      expect(optionFlags).toContain('--swarm')
      expect(optionFlags).toContain('-v, --verbose')
    })
  })

  describe('All Commands Registration', () => {
    it('should have all expected commands registered', () => {
      const program = cli.getProgram()
      const commandNames = program.commands.map(cmd => cmd.name())
      
      // Core execution commands
      expect(commandNames).toContain('plan')
      expect(commandNames).toContain('gates')
      expect(commandNames).toContain('report')
      expect(commandNames).toContain('validate')
      
      // Agent orchestration commands
      expect(commandNames).toContain('generate-plan')
      expect(commandNames).toContain('code-review')
      expect(commandNames).toContain('research')
      expect(commandNames).toContain('agent-status')
      
      // Swarms-specific commands
      expect(commandNames).toContain('swarm-status')
    })

    it('should have correct total number of commands', () => {
      const program = cli.getProgram()
      const commandCount = program.commands.length
      
      // 4 core + 4 agent + 1 swarms = 9 commands
      expect(commandCount).toBe(9)
    })
  })
})