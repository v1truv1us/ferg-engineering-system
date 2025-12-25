#!/usr/bin/env bun
/**
 * Build script for ai-eng-system
 *
 * Canonical sources:
 * - content/commands/*.md
 * - content/agents/*.md
 * - skills/<skill-pack>/SKILL.md
 * - .opencode/opencode.jsonc + .opencode/plugin/ai-eng-system.ts (optional)
 *
 * Outputs:
 * - dist/.claude-plugin/   (for CI validation + tests)
 * - dist/.opencode/        (for OpenCode installs)
 * - dist/skills/           (shared skill packs)
 */

import { readdir, readFile, writeFile, mkdir, rm, copyFile } from "fs/promises";
import { existsSync, watch } from "fs";
import { join, basename, dirname } from "path";
import YAML from "yaml";
import { fileURLToPath } from "url";

const ROOT = process.env.TEST_ROOT ?? dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = join(ROOT, "content");
const SKILLS_DIR = join(ROOT, "skills");
const DIST_DIR = join(ROOT, "dist");

const CLAUDE_DIR = join(DIST_DIR, ".claude-plugin");
const DIST_OPENCODE_DIR = join(DIST_DIR, ".opencode");
const ROOT_OPENCODE_DIR = join(ROOT, ".opencode");

const NAMESPACE_PREFIX = "ai-eng";

// Valid OpenCode permission keys
// Reference: https://opencode.ai/docs/permissions
const VALID_OPENCODE_PERMISSION_KEYS = [
    "edit",
    "bash",
    "webfetch",
    "doom_loop",
    "external_directory",
];

// Named color to hex color mapping for OpenCode compatibility
// OpenCode requires hex format: ^#[0-9a-fA-F]{6}$
const NAMED_COLOR_TO_HEX: Record<string, string> = {
    cyan: "#00FFFF",
    blue: "#0000FF",
    green: "#00FF00",
    yellow: "#FFFF00",
    magenta: "#FF00FF",
    red: "#FF0000",
    orange: "#FFA500",
    purple: "#800080",
    pink: "#FFC0CB",
    lime: "#00FF00",
    olive: "#808000",
    maroon: "#800000",
    navy: "#000080",
    teal: "#008080",
    aqua: "#00FFFF",
    silver: "#C0C0C0",
    gray: "#808080",
    black: "#000000",
    white: "#FFFFFF",
};

// Skill name validation (from OpenCode docs: https://opencode.ai/docs/skills)
const SKILL_NAME_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const SKILL_NAME_MIN_LENGTH = 1;
const SKILL_NAME_MAX_LENGTH = 64;

type FrontmatterParseResult = {
    meta: Record<string, any>;
    body: string;
    hasFrontmatter: boolean;
};

function sanitizePathSegment(segment: unknown): string {
    const s = String(segment ?? "").trim();
    if (!s) return "general";
    return s
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

async function ensureDirForFile(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
}

async function getMarkdownFiles(dir: string): Promise<string[]> {
    const files: string[] = [];
    if (!existsSync(dir)) return files;

    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            // Skip node_modules to prevent infinite recursion
            if (entry.name === "node_modules" || entry.name === ".git") {
                continue;
            }
            files.push(...(await getMarkdownFiles(fullPath)));
        } else if (entry.isFile() && entry.name.endsWith(".md")) {
            files.push(fullPath);
        }
    }

    return files;
}

function parseFrontmatterStrict(
    markdown: string,
    filePathForErrors: string,
): FrontmatterParseResult {
    const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) return { meta: {}, body: markdown, hasFrontmatter: false };

    const [, raw, body] = match;

    try {
        const meta = (YAML.parse(raw) ?? {}) as Record<string, any>;
        return { meta, body, hasFrontmatter: true };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(
            `Invalid YAML frontmatter in ${filePathForErrors}: ${message}`,
        );
    }
}

function serializeFrontmatter(meta: Record<string, any>): string {
    return YAML.stringify(meta).trimEnd();
}

/**
 * Validate skill name matches OpenCode requirements
 * https://opencode.ai/docs/skills#validate-names
 */
function validateSkillName(name: string, filePath: string): void {
    if (name.length < SKILL_NAME_MIN_LENGTH || name.length > SKILL_NAME_MAX_LENGTH) {
        throw new Error(
            `Skill name '${name}' must be ${SKILL_NAME_MIN_LENGTH}-${SKILL_NAME_MAX_LENGTH} characters: ${filePath}`
        );
    }
    if (!SKILL_NAME_REGEX.test(name)) {
        throw new Error(
            `Skill name '${name}' must be lowercase alphanumeric with single hyphens (regex: ${SKILL_NAME_REGEX}): ${filePath}`
        );
    }
}

interface SkillInfo {
    name: string;
    sourceDir: string;  // Full path to skill directory
    skillFile: string;  // Full path to SKILL.md
}

/**
 * Discover all skills in the skills directory recursively
 * Returns skill info including validated names and paths
 */
async function discoverSkills(skillsRoot: string): Promise<SkillInfo[]> {
    const skills: SkillInfo[] = [];

    async function findSkillFiles(dir: string): Promise<string[]> {
        const files: string[] = [];
        if (!existsSync(dir)) return files;

        const entries = await readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...await findSkillFiles(fullPath));
            } else if (entry.name === "SKILL.md") {
                files.push(fullPath);
            }
        }

        return files;
    }

    const skillFiles = await findSkillFiles(skillsRoot);

    for (const skillFile of skillFiles) {
        const sourceDir = dirname(skillFile);
        const dirName = basename(sourceDir);

        // Read frontmatter to get skill name
        const content = await readFile(skillFile, "utf-8");
        const parsed = parseFrontmatterStrict(content, skillFile);
        const name = (parsed.meta.name || dirName) as string;

        // Validate name matches directory
        if (parsed.meta.name && parsed.meta.name !== dirName) {
            throw new Error(
                `Skill frontmatter name '${parsed.meta.name}' must match directory name '${dirName}': ${skillFile}`
            );
        }

        // Validate skill name format
        validateSkillName(name, skillFile);

        skills.push({ name, sourceDir, skillFile });
    }

    return skills;
}

/**
 * Copy skills with flattened structure
 * Takes nested skills from source and copies them flat to destination
 */
async function copySkillsFlat(skillsRoot: string, destDir: string): Promise<void> {
    const skills = await discoverSkills(skillsRoot);

    if (skills.length === 0) return;

    await mkdir(destDir, { recursive: true });

    // Check for duplicate skill names
    const seenNames = new Map<string, string>();
    for (const skill of skills) {
        if (seenNames.has(skill.name)) {
            throw new Error(
                `Duplicate skill name '${skill.name}' found in:\n  - ${seenNames.get(skill.name)}\n  - ${skill.sourceDir}`
            );
        }
        seenNames.set(skill.name, skill.sourceDir);
    }

    // Copy each skill to flat destination
    for (const skill of skills) {
        const destSkillDir = join(destDir, skill.name);
        await copyDirRecursive(skill.sourceDir, destSkillDir);
    }
}

function transformAgentMarkdownForOpenCode(
    markdown: string,
    filePathForErrors: string,
): { markdown: string; category: string } {
    const parsed = parseFrontmatterStrict(markdown, filePathForErrors);
    if (!parsed.hasFrontmatter) {
        return { markdown, category: "general" };
    }

    const meta = { ...parsed.meta };
    const category = sanitizePathSegment(meta.category);

    // OpenCode agent name should be path-derived; frontmatter `name` overrides it.
    delete meta.name;
    // category is only used for directory structure, not valid in OpenCode frontmatter
    delete meta.category;

    // Transform named colors to hex format for OpenCode compatibility
    // OpenCode requires hex format: ^#[0-9a-fA-F]{6}$
    if (meta.color && typeof meta.color === 'string') {
        const colorLower = meta.color.toLowerCase();
        if (!meta.color.startsWith('#') && NAMED_COLOR_TO_HEX[colorLower]) {
            meta.color = NAMED_COLOR_TO_HEX[colorLower];
        }
    }

    // Validate and clean permission field for OpenCode
    // OpenCode only supports: edit, bash, webfetch, doom_loop, external_directory in permission field
    if (meta.permission) {
        const cleanedPermission: Record<string, any> = {};

        for (const key of VALID_OPENCODE_PERMISSION_KEYS) {
            if (meta.permission[key] !== undefined) {
                cleanedPermission[key] = meta.permission[key];
            }
        }

        // Only include permission if it has valid keys
        if (Object.keys(cleanedPermission).length > 0) {
            meta.permission = cleanedPermission;
        } else {
            // Remove empty permission object
            delete meta.permission;
        }
    }

    const fm = serializeFrontmatter(meta);
    return {
        category,
        markdown: `---\n${fm}\n---\n${parsed.body}`,
    };
}

async function validateOpenCodeOutput(opencodeRoot: string): Promise<void> {
    const cmdRoot = join(opencodeRoot, "command", NAMESPACE_PREFIX);
    const agentRoot = join(opencodeRoot, "agent", NAMESPACE_PREFIX);
    const skillRoot = join(opencodeRoot, "skill");  // Note: singular

    const commandFiles = await getMarkdownFiles(cmdRoot);
    const agentFiles = await getMarkdownFiles(agentRoot);

    const errors: string[] = [];

    for (const fp of commandFiles) {
        const content = await readFile(fp, "utf-8");
        const { meta, body } = parseFrontmatterStrict(content, fp);

        if (!meta.description)
            errors.push(`OpenCode command missing description: ${fp}`);
        if (!body.trim()) errors.push(`OpenCode command has empty body: ${fp}`);
    }

    for (const fp of agentFiles) {
        const content = await readFile(fp, "utf-8");
        const { meta, body } = parseFrontmatterStrict(content, fp);

        if (meta.name)
            errors.push(
                `OpenCode agent frontmatter must not include name: ${fp}`,
            );
        if (!meta.description)
            errors.push(`OpenCode agent missing description: ${fp}`);
        if (!meta.mode) errors.push(`OpenCode agent missing mode: ${fp}`);
        if (!body.trim()) errors.push(`OpenCode agent has empty body: ${fp}`);

        // Validate color format (if present) - OpenCode requires hex format: ^#[0-9a-fA-F]{6}$
        if (meta.color && typeof meta.color === 'string') {
            const hexColorPattern = /^#[0-9a-fA-F]{6}$/;
            if (!hexColorPattern.test(meta.color)) {
                errors.push(`OpenCode agent has invalid hex color format '${meta.color}': ${fp}`);
            }
        }

        // Ensure nested directory structure exists: ai-eng/<category>/<agent>.md
        const rel = fp.slice(agentRoot.length + 1);
        const parts = rel.split("/");
        if (parts.length < 2)
            errors.push(
                `OpenCode agent must be nested under a category folder: ${fp}`,
            );
    }

    // Validate skills (if present)
    if (existsSync(skillRoot)) {
        const skillDirs = await readdir(skillRoot, { withFileTypes: true });
        for (const entry of skillDirs) {
            if (!entry.isDirectory()) continue;

            const skillMdPath = join(skillRoot, entry.name, "SKILL.md");
            if (!existsSync(skillMdPath)) {
                errors.push(`Skill directory missing SKILL.md: ${entry.name}/`);
                continue;
            }

            // Validate skill name
            try {
                validateSkillName(entry.name, skillMdPath);

                // Validate frontmatter name matches directory
                const content = await readFile(skillMdPath, "utf-8");
                const { meta } = parseFrontmatterStrict(content, skillMdPath);
                if (meta.name && meta.name !== entry.name) {
                    errors.push(
                        `Skill frontmatter name '${meta.name}' must match directory name '${entry.name}': ${skillMdPath}`
                    );
                }
            } catch (e) {
                errors.push(e instanceof Error ? e.message : String(e));
            }
        }
    }

    if (errors.length) {
        console.error("\n❌ OpenCode output validation failed:\n");
        for (const e of errors) console.error(` - ${e}`);
        throw new Error(
            `OpenCode validation failed with ${errors.length} error(s)`,
        );
    }
}

async function buildClaude(): Promise<void> {
    await mkdir(CLAUDE_DIR, { recursive: true });

    // Commands
    const claudeCommandsDir = join(CLAUDE_DIR, "commands");
    await mkdir(claudeCommandsDir, { recursive: true });
    const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"));
    for (const src of commandFiles) {
        await copyFile(src, join(claudeCommandsDir, basename(src)));
    }

    // Agents
    const claudeAgentsDir = join(CLAUDE_DIR, "agents");
    await mkdir(claudeAgentsDir, { recursive: true });
    const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"));
    for (const src of agentFiles) {
        await copyFile(src, join(claudeAgentsDir, basename(src)));
    }

    // Skills
    await copyDirRecursive(SKILLS_DIR, join(CLAUDE_DIR, "skills"));

    // plugin.json (for CI/tests; user installs happen from plugins/ai-eng-system)
    const packageJson = JSON.parse(
        await readFile(join(ROOT, "package.json"), "utf-8"),
    );
    const pluginJson = {
        name: "ai-eng-system",
        version: packageJson.version,
        description:
            "AI Engineering System with context engineering and research orchestration for Claude Code",
        author: "v1truv1us",
        license: "MIT",
        commands: commandFiles.map((f) => `./commands/${basename(f)}`),
    };

    await writeFile(
        join(CLAUDE_DIR, "plugin.json"),
        JSON.stringify(pluginJson, null, 2),
    );

    // hooks.json (for CI/tests)
    const hooksJson = {
        hooks: {
            SessionStart: [
                {
                    description: "Initialize ai-eng-system on session start",
                    hooks: [
                        {
                            type: "notification",
                            message:
                                "🔧 Ferg Engineering System loaded. Commands: /ai-eng/plan, /ai-eng/view, /ai-eng/seo, /ai-eng/work, /ai-eng/compound, /ai-eng/deploy, /ai-eng/optimize, /ai-eng/recursive-init, /ai-eng/create-plugin, /ai-eng/create-agent, /ai-eng/create-command, /ai-eng/create-skill, /ai-eng/create-tool, /ai-eng/research, /ai-eng/context",
                        },
                    ],
                },
            ],
        },
    };

    await writeFile(
        join(CLAUDE_DIR, "hooks.json"),
        JSON.stringify(hooksJson, null, 2),
    );

    // Optional: copy marketplace.json for dist validation convenience
    const marketplaceSrc = join(ROOT, ".claude-plugin", "marketplace.json");
    if (existsSync(marketplaceSrc)) {
        await copyFile(marketplaceSrc, join(CLAUDE_DIR, "marketplace.json"));
    }
}

async function buildOpenCode(): Promise<void> {
    // Build to both dist/.opencode/ (for npm package) and .opencode/ (for local dev)
    for (const targetDir of [DIST_OPENCODE_DIR, ROOT_OPENCODE_DIR]) {
        // Clean target directories before building to remove stale files
        const commandsDir = join(targetDir, "command", NAMESPACE_PREFIX);
        const agentsDir = join(targetDir, "agent", NAMESPACE_PREFIX);
        const skillsDir = join(targetDir, "skill");  // Note: singular, per OpenCode docs

        if (existsSync(commandsDir)) {
            await rm(commandsDir, { recursive: true, force: true });
        }
        if (existsSync(agentsDir)) {
            await rm(agentsDir, { recursive: true, force: true });
        }
        if (existsSync(skillsDir)) {
            await rm(skillsDir, { recursive: true, force: true });
        }

        await mkdir(commandsDir, { recursive: true });
        await mkdir(agentsDir, { recursive: true });

        // Commands: MD-first, copy as-is.
        const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"));
        for (const src of commandFiles) {
            await copyFile(src, join(commandsDir, basename(src)));
        }

        // Agents: MD-first but strip `name` and nest by category.
        const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"));
        for (const src of agentFiles) {
            const content = await readFile(src, "utf-8");
            const transformed = transformAgentMarkdownForOpenCode(content, src);

            const categoryDir = join(agentsDir, transformed.category);
            await mkdir(categoryDir, { recursive: true });
            await writeFile(join(categoryDir, basename(src)), transformed.markdown);
        }

        // Skills: Copy to .opencode/skill/ (singular, flat structure)
        // This is OpenCode's expected location: https://opencode.ai/docs/skills
        await copySkillsFlat(SKILLS_DIR, skillsDir);

        // Copy OpenCode config
        const opencodeConfigSrc = join(ROOT, ".opencode", "opencode.jsonc");
        if (existsSync(opencodeConfigSrc)) {
            await copyFile(opencodeConfigSrc, join(targetDir, "opencode.jsonc"));
        }
    }

    await validateOpenCodeOutput(DIST_OPENCODE_DIR);
}

async function copyDirRecursive(
    srcDir: string,
    destDir: string,
): Promise<void> {
    if (!existsSync(srcDir)) return;

    const entries = await readdir(srcDir, { withFileTypes: true });
    await mkdir(destDir, { recursive: true });

    for (const entry of entries) {
        const srcPath = join(srcDir, entry.name);
        const destPath = join(destDir, entry.name);

        if (entry.isDirectory()) {
            await copyDirRecursive(srcPath, destPath);
        } else if (entry.isFile()) {
            await ensureDirForFile(destPath);
            await copyFile(srcPath, destPath);
        }
    }
}

async function copySkillsToDist(): Promise<void> {
    await copyDirRecursive(SKILLS_DIR, join(DIST_DIR, "skills"));
}

async function buildNpmEntrypoint(): Promise<void> {
    // Build npm-loadable OpenCode plugin entrypoint.
    // Skip if src/index.ts doesn't exist (e.g., in test environments)
    const srcIndexPath = join(ROOT, "src", "index.ts");
    if (!existsSync(srcIndexPath)) {
        console.log("⚠️  Skipping npm entrypoint build (src/index.ts not found)");
        return;
    }

    const result = await Bun.build({
        entrypoints: [srcIndexPath],
        outdir: DIST_DIR,
        target: "node",
        format: "esm",
    });

    if (!result.success) {
        const messages = result.logs
            .map((l) => `${l.level}: ${l.message}`)
            .join("\n");
        throw new Error(`Failed to build npm entrypoint:\n${messages}`);
    }

    // Provide a minimal .d.ts so TS consumers resolve export.
    const dtsPath = join(DIST_DIR, "index.d.ts");
    await writeFile(
        dtsPath,
        [
            'import type { Plugin } from "@opencode-ai/plugin";',
            "",
            "export declare const AiEngSystem: Plugin;",
            "",
        ].join("\n"),
    );

    // Compatibility: some loaders attempt to import the package directory itself.
    // Bun supports directory imports when an index.js exists at the directory root.
    // Build/export a tiny shim at dist/../index.js that re-exports from dist/index.js.
    const rootIndexJsPath = join(DIST_DIR, "..", "index.js");
    await writeFile(
        rootIndexJsPath,
        [
            '// Auto-generated compatibility shim for directory imports',
            'export * from "./dist/index.js";',
            'export { AiEngSystem as default } from "./dist/index.js";',
            '',
        ].join("\n"),
    );

    const rootIndexDtsPath = join(DIST_DIR, "..", "index.d.ts");
    await writeFile(
        rootIndexDtsPath,
        [
            'export * from "./dist/index";',
            'export { AiEngSystem as default } from "./dist/index";',
            '',
        ].join("\n"),
    );
}

async function validateContentOnly(): Promise<void> {
    if (!existsSync(CONTENT_DIR))
        throw new Error("content/ directory not found");

    const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"));
    const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"));

    const errors: string[] = [];

    for (const fp of commandFiles) {
        const content = await readFile(fp, "utf-8");
        const { meta } = parseFrontmatterStrict(content, fp);
        if (!meta.name) errors.push(`${fp}: missing 'name' in frontmatter`);
        if (!meta.description)
            errors.push(`${fp}: missing 'description' in frontmatter`);
    }

    for (const fp of agentFiles) {
        const content = await readFile(fp, "utf-8");
        const { meta } = parseFrontmatterStrict(content, fp);
        if (!meta.name) errors.push(`${fp}: missing 'name' in frontmatter`);
        if (!meta.description)
            errors.push(`${fp}: missing 'description' in frontmatter`);
        if (!meta.mode) errors.push(`${fp}: missing 'mode' in frontmatter`);
    }

    if (errors.length) {
        console.error("\n❌ Validation failed:\n");
        for (const e of errors) console.error(` - ${e}`);
        throw new Error(`Validation failed with ${errors.length} error(s)`);
    }
}

/**
 * Validate all generated agent files for platform-specific requirements
 * - Claude Code: Should NOT have permission field
 * - OpenCode: Should only have valid permission keys (edit, bash, webfetch, doom_loop, external_directory)
 */
async function validateAgents(): Promise<void> {
    const errors: string[] = [];

    // Validate Claude Code agents (dist/.claude-plugin/agents/)
    const claudeAgentFiles = await getMarkdownFiles(CLAUDE_DIR);
    for (const fp of claudeAgentFiles) {
        const fileContent = await readFile(fp, "utf-8");
        const { meta } = parseFrontmatterStrict(fileContent, fp);

        if (meta.permission) {
            errors.push(`${fp}: Claude Code agents should not have permission field (use tools instead)`);
        }
    }

    // Validate OpenCode agents (dist/.opencode/agent/ and .opencode/agent/)
    const openCodeDirs = [DIST_OPENCODE_DIR, ROOT_OPENCODE_DIR];
    for (const opencodeRoot of openCodeDirs) {
        const agentDir = join(opencodeRoot, "agent", NAMESPACE_PREFIX);
        if (!existsSync(agentDir)) continue;

        const agentFiles = await getMarkdownFiles(agentDir);
        for (const fp of agentFiles) {
            const fileContent = await readFile(fp, "utf-8");
            const { meta } = parseFrontmatterStrict(fileContent, fp);

            if (meta.permission) {
                const validKeys = VALID_OPENCODE_PERMISSION_KEYS;
                for (const key of Object.keys(meta.permission)) {
                    if (!validKeys.includes(key)) {
                        errors.push(`${fp}: Invalid permission key '${key}' (only edit/bash/webfetch/doom_loop/external_directory allowed)`);
                    }
                }
            }
        }
    }

    if (errors.length) {
        console.error("\n❌ Agent validation failed:\n");
        for (const e of errors) console.error(` - ${e}`);
        throw new Error(`Agent validation failed with ${errors.length} error(s)`);
    }

    console.log("✅ All agents validated successfully");
}

async function buildAll(): Promise<void> {
    const start = Date.now();

    if (existsSync(DIST_DIR)) {
        await rm(DIST_DIR, { recursive: true, force: true });
    }
    await mkdir(DIST_DIR, { recursive: true });

    if (!existsSync(CONTENT_DIR)) {
        throw new Error("content/ directory not found");
    }

    await buildClaude();
    await buildOpenCode();
    await copySkillsToDist();
    await buildNpmEntrypoint();

    // Validate agents after build
    await validateAgents();

    const elapsed = Date.now() - start;
    console.log(`\n✅ Build complete in ${elapsed}ms -> ${DIST_DIR}`);
}

const args = process.argv.slice(2);

try {
    if (args.includes("--validate")) {
        await validateContentOnly();
        console.log("✅ Content validated");
    } else if (args.includes("--watch")) {
        console.log("👀 Watching for changes...");
        await buildAll();

        watch(
            CONTENT_DIR,
            { recursive: true },
            async (_eventType, filename) => {
                if (!filename?.endsWith(".md")) return;
                console.log(`\n📝 Changed: ${filename}`);
                await buildAll();
            },
        );
    } else {
        await buildAll();
    }
} catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ ${message}`);
    process.exit(1);
}
