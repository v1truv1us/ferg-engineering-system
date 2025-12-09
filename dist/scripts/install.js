#!/usr/bin/env bun

/**
 * AI Engineering System Installation Script
 * Supports both global and local OpenCode installation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.dirname(__dirname);

// For installed packages, the .opencode directory is directly in package root
let sourceDir = path.join(packageRoot, '.opencode');
if (!fs.existsSync(sourceDir)) {
  // Try in dist subdirectory (for local development)
  sourceDir = path.join(packageRoot, 'dist', '.opencode');
}

// Namespace configuration for OpenCode installations
const NAMESPACE_PREFIX = "ai-eng";

// Parse command line arguments
const args = process.argv.slice(2);
const isGlobal = args.includes('--global');
const isLocal = args.includes('--local');

if (!isGlobal && !isLocal) {
  console.log('🔧 AI Engineering System Installer');
  console.log('=====================================\n');
  console.log('Usage:');
  console.log('  bun run install:global   # Install globally to ~/.config/opencode');
  console.log('  bun run install:local    # Install locally to .opencode/');
  console.log('\nOr use directly:');
  console.log('  bun scripts/install.js --global');
  console.log('  bun scripts/install.js --local');
  process.exit(1);
}

function installOpenCode(targetDir, description) {
  console.log(`🔧 Installing to ${description}...`);
  
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
      console.log(`   ✅ Command: /ai-eng/${cmd.replace('.md', '')}`);
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
      console.log(`   ✅ Agent: ai-eng/${agent.replace('.md', '')}`);
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
  console.log(`\nAvailable commands (use with /ai-eng/ prefix):`);
  console.log(`  /ai-eng/plan, /ai-eng/review, /ai-eng/optimize, /ai-eng/seo, /ai-eng/deploy, /ai-eng/compound, /ai-eng/recursive-init, /ai-eng/work`);
  console.log(`\nAvailable agents (use with ai-eng/ prefix):`);
  console.log(`  ai-eng/architect-advisor, ai-eng/frontend-reviewer, ai-eng/seo-specialist, ai-eng/prompt-optimizer`);
}

// Execute installation
if (isGlobal) {
  const globalDir = path.join(process.env.HOME || '', '.config', 'opencode');
  installOpenCode(globalDir, 'global ~/.config/opencode');
} else if (isLocal) {
  const localDir = path.join(process.cwd(), '.opencode');
  installOpenCode(localDir, 'local .opencode/');
}