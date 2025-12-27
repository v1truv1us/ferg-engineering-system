import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "@opencode-ai/plugin";

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
 * Install AI Engineering System files to the project directory
 */
function installToProject(pluginDir: string, projectDir: string): void {
    // When running from dist/index.js, pluginDir is already the dist directory
    // When running from package root during development, pluginDir is the package root
    const isDistDir = fs.existsSync(path.join(pluginDir, ".opencode"));

    const distDir = isDistDir ? pluginDir : path.join(pluginDir, "dist");
    const distOpenCodeDir = path.join(distDir, ".opencode");
    const distSkillsDir = path.join(distDir, "skills");

    // Target directories
    const targetOpenCodeDir = path.join(projectDir, ".opencode");
    const NAMESPACE_PREFIX = "ai-eng";

    // Copy commands (namespaced under ai-eng/)
    const commandsSrc = path.join(distOpenCodeDir, "command", NAMESPACE_PREFIX);
    if (fs.existsSync(commandsSrc)) {
        const commandsDest = path.join(
            targetOpenCodeDir,
            "command",
            NAMESPACE_PREFIX,
        );
        copyRecursive(commandsSrc, commandsDest);
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
    }

    // Copy skills (to .opencode/skill/)
    // OpenCode expects skills at .opencode/skill/ (singular, per https://opencode.ai/docs/skills)
    const distSkillDir = path.join(distDir, ".opencode", "skill");
    if (fs.existsSync(distSkillDir)) {
        const skillDest = path.join(targetOpenCodeDir, "skill");
        copyRecursive(distSkillDir, skillDest);
    }
}

/**
 * AI Engineering System OpenCode Plugin
 *
 * When loaded, this plugin automatically installs:
 * - Commands to {projectDir}/.opencode/command/ai-eng/
 * - Agents to {projectDir}/.opencode/agent/ai-eng/
 * - Skills to {projectDir}/.opencode/skill/
 *
 * All files are copied from the plugin's dist/ directory to the project's
 * .opencode/ directory where opencode.jsonc is located.
 */
export const AiEngSystem: Plugin = async ({ directory }) => {
    // Get the plugin directory (where this package is installed)
    const pluginDir = path.dirname(new URL(import.meta.url).pathname);

    // Install files to the project directory
    try {
        installToProject(pluginDir, directory);
    } catch (error) {
        // Silent fail - if installation fails, it's not critical
        console.error(
            `[ai-eng-system] Installation warning: ${error instanceof Error ? error.message : String(error)}`,
        );
    }

    return {
        // No hooks needed - the plugin's value is in the installed files
    };
};
