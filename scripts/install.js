#!/usr/bin/env bun

/**
 * AI Engineering System Installation Script (OpenCode)
 *
 * Installs the pre-built OpenCode distribution (dist/.opencode + dist/skills)
 * into either:
 * - global: ~/.config/opencode (default)
 * - local:  ./.opencode (in the target project)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packageRoot = path.dirname(__dirname)

// Namespace configuration for OpenCode installations
const NAMESPACE_PREFIX = 'ai-eng'

function printUsage(exitCode = 1) {
  console.log('AI Engineering System Installer (OpenCode)')
  console.log('========================================\n')
  console.log('Usage:')
  console.log('  bun scripts/install.js             # Install globally to ~/.config/opencode (default)')
  console.log('  bun scripts/install.js --global    # Install globally to ~/.config/opencode')
  console.log('  bun scripts/install.js --local     # Install locally to ./.opencode (in current dir)')
  process.exit(exitCode)
}

function parseArgs(argv) {
  const args = argv.slice(2)
  const allowed = new Set(['--global', '--local', '--help', '-h'])

  for (const a of args) {
    if (!allowed.has(a)) {
      console.error(`Unknown flag: ${a}`)
      printUsage(1)
    }
  }

  if (args.includes('--help') || args.includes('-h')) {
    printUsage(0)
  }

  const wantsGlobal = args.includes('--global')
  const wantsLocal = args.includes('--local')

  if (wantsGlobal && wantsLocal) {
    console.error('Cannot use both --global and --local')
    printUsage(1)
  }

  if (!wantsGlobal && !wantsLocal) {
    return { mode: 'global' }
  }

  return { mode: wantsLocal ? 'local' : 'global' }
}

function copyRecursive(src, dest) {
  const stat = fs.statSync(src)

  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true })
    for (const entry of fs.readdirSync(src)) {
      copyRecursive(path.join(src, entry), path.join(dest, entry))
    }
    return
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function installOpenCode(targetDir, description) {
  console.log(`Installing to ${description}...`)

  const distOpenCodeRoot = path.join(packageRoot, 'dist', '.opencode')
  const distSkillsRoot = path.join(packageRoot, 'dist', 'skills')

  if (!fs.existsSync(distOpenCodeRoot)) {
    console.error('Error: dist/.opencode not found.')
    console.error('Run "bun run build" first (or install from a pre-built package).')
    process.exit(1)
  }

  // Copy OpenCode config
  const configSrc = path.join(distOpenCodeRoot, 'opencode.jsonc')
  if (fs.existsSync(configSrc)) {
    fs.mkdirSync(targetDir, { recursive: true })
    fs.copyFileSync(configSrc, path.join(targetDir, 'opencode.jsonc'))
  }

  // Copy plugin script
  const pluginSrc = path.join(distOpenCodeRoot, 'plugin', 'ai-eng-system.ts')
  if (fs.existsSync(pluginSrc)) {
    copyRecursive(pluginSrc, path.join(targetDir, 'plugin', 'ai-eng-system.ts'))
  }

  // Copy commands (recursively, in case we add subfolders later)
  const commandsSrc = path.join(distOpenCodeRoot, 'command', NAMESPACE_PREFIX)
  if (fs.existsSync(commandsSrc)) {
    copyRecursive(commandsSrc, path.join(targetDir, 'command', NAMESPACE_PREFIX))
  }

  // Copy agents (MUST be recursive; categories are subfolders)
  const agentsSrc = path.join(distOpenCodeRoot, 'agent', NAMESPACE_PREFIX)
  if (fs.existsSync(agentsSrc)) {
    copyRecursive(agentsSrc, path.join(targetDir, 'agent', NAMESPACE_PREFIX))
  }

  // Copy skills
  if (fs.existsSync(distSkillsRoot)) {
    copyRecursive(distSkillsRoot, path.join(targetDir, 'skills'))
  }

  console.log('Installation complete.')
  console.log(`Namespace: ${NAMESPACE_PREFIX}`)
}

const { mode } = parseArgs(process.argv)

if (mode === 'global') {
  const globalDir = path.join(process.env.HOME || '', '.config', 'opencode')
  installOpenCode(globalDir, 'global ~/.config/opencode')
} else {
  const localDir = path.join(process.cwd(), '.opencode')
  installOpenCode(localDir, 'local ./.opencode')
}
