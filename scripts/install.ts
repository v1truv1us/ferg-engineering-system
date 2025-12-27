#!/usr/bin/env node

/**
 * AI Engineering System Post-Install Script
 *
 * Runs when package is installed via npm/bun.
 * Installs commands, agents, and skills to the project's .opencode directory.
 *
 * Usage:
 * - Automatic: Runs during npm install
 * - Manual: bun run install
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.dirname(__dirname);

const NAMESPACE_PREFIX = "ai-eng";

/**
 * Find the nearest opencode.jsonc by traversing up from current directory
 */
function findOpenCodeConfig(startDir: string): string | null {
    let currentDir = startDir;
    const root = path.parse(startDir).root;

    while (currentDir !== root) {
        const configPath = path.join(currentDir, "opencode.jsonc");
        if (fs.existsSync(configPath)) {
            return configPath;
        }
        currentDir = path.dirname(currentDir);
    }

    return null;
}

/**
 * Copy a directory recursively
 */
function copyRecursive(src: string, dest: string): void {
    const stat = fs.statSync(src);

    if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        const entries = fs.readdirSync(src);
        for (const entry of entries) {
            copyRecursive(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
    }
}

/**
 * Install AI Engineering System files
 */
function install(targetDir: string, silent = false): void {
    if (!silent) {
        console.log(`🔧 Installing AI Engineering System to ${targetDir}`);
    }

    const distDir = path.join(packageRoot, "dist");
    const distOpenCodeDir = path.join(distDir, ".opencode");
    const distSkillsDir = path.join(distDir, "skills");

    // Target directories
    const targetOpenCodeDir = path.join(targetDir, ".opencode");

    // Verify dist directory exists
    if (!fs.existsSync(distOpenCodeDir)) {
        if (!silent) {
            console.error(
                '❌ Error: dist/.opencode not found. Run "bun run build" first.',
            );
        }
        process.exit(1);
    }

    // Copy opencode.jsonc config if it exists (only if not already present)
    const configSrc = path.join(distOpenCodeDir, "opencode.jsonc");
    const configDest = path.join(targetDir, "opencode.jsonc");
    if (fs.existsSync(configSrc) && !fs.existsSync(configDest)) {
        fs.copyFileSync(configSrc, configDest);
        if (!silent) console.log("  ✓ opencode.jsonc");
    }

    // Copy commands (namespaced under ai-eng/)
    const commandsSrc = path.join(distOpenCodeDir, "command", NAMESPACE_PREFIX);
    if (fs.existsSync(commandsSrc)) {
        const commandsDest = path.join(
            targetOpenCodeDir,
            "command",
            NAMESPACE_PREFIX,
        );
        copyRecursive(commandsSrc, commandsDest);

        const commandCount = fs
            .readdirSync(commandsSrc)
            .filter((f) => f.endsWith(".md")).length;
        if (!silent)
            console.log(
                `  ✓ command/${NAMESPACE_PREFIX}/ (${commandCount} commands)`,
            );
    }

    // Copy agents (namespaced under ai-eng/)
    const agentsSrc = path.join(distOpenCodeDir, "agent", NAMESPACE_PREFIX);
    if (fs.existsSync(agentsSrc)) {
        const agentsDest = path.join(
            targetOpenCodeDir,
            "agent",
            NAMESPACE_PREFIX,
        );
        copyRecursive(agentsSrc, agentsDest);

        function countMarkdownFiles(dir: string): number {
            let count = 0;
            const entries = fs.readdirSync(dir);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                const stat = fs.statSync(fullPath);
                if (stat.isDirectory()) {
                    count += countMarkdownFiles(fullPath);
                } else if (entry.endsWith(".md")) {
                    count++;
                }
            }
            return count;
        }
        const agentCount = countMarkdownFiles(agentsSrc);
        if (!silent)
            console.log(
                `  ✓ agent/${NAMESPACE_PREFIX}/ (${agentCount} agents)`,
            );
    }

    // Copy skills (to .opencode/skill/)
    // OpenCode expects skills at .opencode/skill/ (singular, per https://opencode.ai/docs/skills)
    const distSkillDir = path.join(distDir, ".opencode", "skill");
    if (fs.existsSync(distSkillDir)) {
        const skillDest = path.join(targetOpenCodeDir, "skill");
        copyRecursive(distSkillDir, skillDest);

        // Count skills
        const skillDirs = fs.readdirSync(distSkillDir);
        const skillCount = skillDirs.length;
        if (!silent) console.log(`  ✓ skill/ (${skillCount} skills)`);
    }

    if (!silent) {
        console.log("\n✅ Installation complete!");
        console.log(`   Namespace: ${NAMESPACE_PREFIX}`);
    }
}

/**
 * Entry point
 */
function main(): void {
    const isPostInstall = process.env.npm_lifecycle_event === "postinstall";

    if (isPostInstall) {
        // During npm install, find opencode.jsonc and install there
        const cwd = process.cwd();
        const configPath = findOpenCodeConfig(cwd);

        if (!configPath) {
            // Silent exit - no OpenCode project found
            return;
        }

        const targetDir = path.dirname(configPath);
        install(targetDir, true); // Silent mode
    } else {
        // Manual invocation
        const cwd = process.cwd();
        const configPath = findOpenCodeConfig(cwd);

        if (!configPath) {
            console.error(
                "❌ Error: opencode.jsonc not found in current directory or parent directories",
            );
            console.error(
                "   Please run this script from a project containing opencode.jsonc",
            );
            process.exit(1);
        }

        const targetDir = path.dirname(configPath);
        install(targetDir, false); // Verbose mode
    }
}

main();
