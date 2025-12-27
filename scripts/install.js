#!/usr/bin/env node

// scripts/install.ts
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const packageRoot = path.dirname(__dirname2);
const NAMESPACE_PREFIX = "ai-eng";
function findOpenCodeConfig(startDir) {
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
function copyRecursive(src, dest) {
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
function install(targetDir, silent = false) {
    if (!silent) {
        console.log(
            `\uD83D\uDD27 Installing AI Engineering System to ${targetDir}`,
        );
    }
    const distDir = path.join(packageRoot, "dist");
    const distOpenCodeDir = path.join(distDir, ".opencode");
    const distSkillsDir = path.join(distDir, "skills");
    const targetOpenCodeDir = path.join(targetDir, ".opencode");
    if (!fs.existsSync(distOpenCodeDir)) {
        if (!silent) {
            console.error(
                '❌ Error: dist/.opencode not found. Run "bun run build" first.',
            );
        }
        process.exit(1);
    }
    const configSrc = path.join(distOpenCodeDir, "opencode.jsonc");
    const configDest = path.join(targetDir, "opencode.jsonc");
    if (fs.existsSync(configSrc) && !fs.existsSync(configDest)) {
        fs.copyFileSync(configSrc, configDest);
        if (!silent) console.log("  ✓ opencode.jsonc");
    }
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
    const agentsSrc = path.join(distOpenCodeDir, "agent", NAMESPACE_PREFIX);
    if (fs.existsSync(agentsSrc)) {
        const countMarkdownFiles = (dir) => {
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
        };
        const agentsDest = path.join(
            targetOpenCodeDir,
            "agent",
            NAMESPACE_PREFIX,
        );
        copyRecursive(agentsSrc, agentsDest);
        const agentCount = countMarkdownFiles(agentsSrc);
        if (!silent)
            console.log(
                `  ✓ agent/${NAMESPACE_PREFIX}/ (${agentCount} agents)`,
            );
    }
    if (fs.existsSync(distSkillsDir)) {
        const skillsDest = path.join(targetOpenCodeDir, "skills");
        copyRecursive(distSkillsDir, skillsDest);
        if (!silent) console.log("  ✓ skills/");
    }
    if (!silent) {
        console.log(`
✅ Installation complete!`);
        console.log(`   Namespace: ${NAMESPACE_PREFIX}`);
    }
}
function main() {
    const isPostInstall = process.env.npm_lifecycle_event === "postinstall";
    if (isPostInstall) {
        const cwd = process.cwd();
        const configPath = findOpenCodeConfig(cwd);
        if (!configPath) {
            return;
        }
        const targetDir = path.dirname(configPath);
        install(targetDir, true);
    } else {
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
        install(targetDir, false);
    }
}
main();
