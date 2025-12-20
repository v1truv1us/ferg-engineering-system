#!/usr/bin/env bun

/**
 * Ferg Engineering System Installation Script
 * Supports both global and local OpenCode installation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.dirname(__dirname);

// Namespace configuration for OpenCode installations
const NAMESPACE_PREFIX = "ai-eng";

// Parse command line arguments
const args = process.argv.slice(2);

// Global install by default when no args, or with --global
const isGlobal = args.length === 0 || args.includes('--global');

// Local install only with --local
const isLocal = args.includes('--local');

// Fail on unknown flags (help for everything else)
if (args.length > 2) {
  console.log('🔧 Ferg Engineering System Installer');
  console.log('=====================================\n');
  console.log('Usage:');
  console.log('  bun run install:global   # Install globally to ~/.config/opencode (default)');
  console.log('  bun run install:local    # Install locally to .opencode/');
  console.log('\nOr use directly:');
  console.log('  bun scripts/install.js --global');
  console.log('  bun scripts/install.js --local');
  console.log('\nDefault is global when no flags provided');
  process.exit(1);
}

function installOpenCode(targetDir, description) {
  console.log(`🔧 Installing to ${description}...`);
  
  const sourceDir = path.join(packageRoot, 'dist', '.opencode');
  
  if (!fs.existsSync(sourceDir)) {
    console.log('❌ Error: dist/.opencode not found.');
    console.log('   Run "bun run build" first or install from pre-built package.');
    process.exit(1);
  }
  
  // Create target directories
  const commandDir = path.join(targetDir, 'command', NAMESPACE_PREFIX);
  const agentDir = path.join(targetDir, 'agent', NAMESPACE_PREFIX);
  const pluginDir = path.join(targetDir, 'plugin');
  const skillsDir = path.join(targetDir, 'skills');
  
  fs.mkdirSync(commandDir, { recursive: true });
  fs.mkdirSync(agentDir, { recursive: true });
  fs.mkdirSync(pluginDir, { recursive: true });
  fs.mkdirSync(skillsDir, { recursive: true });
  
  // Copy commands
  const commandsSource = path.join(sourceDir, 'command', NAMESPACE_PREFIX);
  if (fs.existsSync(commandsSource)) {
    const commands = fs.readdirSync(commandsSource);
    commands.forEach(cmd => {
      const src = path.join(commandsSource, cmd);
      const dest = path.join(commandDir, cmd);
      fs.copyFileSync(src, dest);
      console.log(`   ✅ Command: /${NAMESPACE_PREFIX}/${cmd.replace('.md', '')}`);
    });
  }
  
  // Copy agents
  const agentsSource = path.join(sourceDir, 'agent', NAMESPACE_PREFIX);
  if (fs.existsSync(agentsSource)) {
    const agents = fs.readdirSync(agentsSource);
    agents.forEach(agent => {
      const src = path.join(agentsSource, agent);
      const dest = path.join(agentDir, agent);
      fs.copyFileSync(src, dest);
      console.log(`   ✅ Agent: ${NAMESPACE_PREFIX}/${agent.replace('.md', '')}`);
    });
  }
  
  // Copy plugin
  const pluginSource = path.join(sourceDir, 'plugin', 'ai-eng-system.ts');
  if (fs.existsSync(pluginSource)) {
    const dest = path.join(pluginDir, 'ai-eng-system.ts');
    fs.copyFileSync(pluginSource, dest);
    console.log(`   ✅ Plugin script`);
  }
  
  // Copy skills
  const skillsSource = path.join(packageRoot, 'dist', 'skills');
  if (fs.existsSync(skillsSource)) {
    const copyRecursive = (src, dest) => {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(item => {
          copyRecursive(path.join(src, item), path.join(dest, item));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };
    copyRecursive(skillsSource, skillsDir);
    console.log(`   ✅ Skills`);
  }
  
  console.log(`\n✅ Installation complete!`);
  console.log(`\nAvailable commands (use with /${NAMESPACE_PREFIX}/ prefix):`);
  console.log(`  /${NAMESPACE_PREFIX}/plan, /${NAMESPACE_PREFIX}/review, /${NAMESPACE_PREFIX}/optimize, /${NAMESPACE_PREFIX}/seo, /${NAMESPACE_PREFIX}/deploy, /${NAMESPACE_PREFIX}/compound, /${NAMESPACE_PREFIX}/recursive-init, /${NAMESPACE_PREFIX}/work`);
  console.log(`\nAvailable agents (use with ${NAMESPACE_PREFIX}/ prefix):`);
  console.log(`  ${NAMESPACE_PREFIX}/architect-advisor, ${NAMESPACE_PREFIX}/frontend-reviewer, ${NAMESPACE_PREFIX}/seo-specialist, ${NAMESPACE_PREFIX}/prompt-optimizer`);
}

// Execute installation
if (isGlobal) {
  const globalDir = path.join(process.env.HOME || '', '.config', 'opencode');
  installOpenCode(globalDir, 'global ~/.config/opencode');
} else if (isLocal) {
  const localDir = path.join(process.cwd(), '.opencode');
  installOpenCode(localDir, 'local .opencode/');
}