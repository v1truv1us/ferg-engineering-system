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

import { readdir, readFile, writeFile, mkdir, rm, copyFile } from "fs/promises"
import { existsSync, watch } from "fs"
import { join, basename, dirname } from "path"
import YAML from "yaml"

const ROOT = process.env.TEST_ROOT ?? import.meta.dir
const CONTENT_DIR = join(ROOT, "content")
const SKILLS_DIR = join(ROOT, "skills")
const DIST_DIR = join(ROOT, "dist")

const CLAUDE_DIR = join(DIST_DIR, ".claude-plugin")
const OPENCODE_DIR = join(DIST_DIR, ".opencode")

const NAMESPACE_PREFIX = "ai-eng"

type FrontmatterParseResult = { meta: Record<string, any>; body: string; hasFrontmatter: boolean }

function sanitizePathSegment(segment: unknown): string {
  const s = String(segment ?? "").trim()
  if (!s) return "general"
  return s
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "")
}

async function ensureDirForFile(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
}

async function getMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  if (!existsSync(dir)) return files

  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await getMarkdownFiles(fullPath)))
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(fullPath)
    }
  }

  return files
}

async function copyDirRecursive(srcDir: string, destDir: string): Promise<void> {
  if (!existsSync(srcDir)) return

  const entries = await readdir(srcDir, { withFileTypes: true })
  await mkdir(destDir, { recursive: true })

  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name)
    const destPath = join(destDir, entry.name)

    if (entry.isDirectory()) {
      await copyDirRecursive(srcPath, destPath)
    } else if (entry.isFile()) {
      await ensureDirForFile(destPath)
      await copyFile(srcPath, destPath)
    }
  }
}

function parseFrontmatterStrict(markdown: string, filePathForErrors: string): FrontmatterParseResult {
  const match = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: markdown, hasFrontmatter: false }

  const [, raw, body] = match

  try {
    const meta = (YAML.parse(raw) ?? {}) as Record<string, any>
    return { meta, body, hasFrontmatter: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid YAML frontmatter in ${filePathForErrors}: ${message}`)
  }
}

function serializeFrontmatter(meta: Record<string, any>): string {
  return YAML.stringify(meta).trimEnd()
}

function transformAgentMarkdownForOpenCode(markdown: string, filePathForErrors: string): { markdown: string; category: string } {
  const parsed = parseFrontmatterStrict(markdown, filePathForErrors)
  if (!parsed.hasFrontmatter) {
    return { markdown, category: "general" }
  }

  const meta = { ...parsed.meta }
  const category = sanitizePathSegment(meta.category)

  // OpenCode agent name should be path-derived; frontmatter `name` overrides it.
  delete meta.name

  const fm = serializeFrontmatter(meta)
  return {
    category,
    markdown: `---\n${fm}\n---\n${parsed.body}`,
  }
}

async function validateOpenCodeOutput(opencodeRoot: string): Promise<void> {
  const cmdRoot = join(opencodeRoot, "command", NAMESPACE_PREFIX)
  const agentRoot = join(opencodeRoot, "agent", NAMESPACE_PREFIX)

  const commandFiles = await getMarkdownFiles(cmdRoot)
  const agentFiles = await getMarkdownFiles(agentRoot)

  const errors: string[] = []

  for (const fp of commandFiles) {
    const content = await readFile(fp, "utf-8")
    const { meta, body } = parseFrontmatterStrict(content, fp)

    if (!meta.description) errors.push(`OpenCode command missing description: ${fp}`)
    if (!body.trim()) errors.push(`OpenCode command has empty body: ${fp}`)
  }

  for (const fp of agentFiles) {
    const content = await readFile(fp, "utf-8")
    const { meta, body } = parseFrontmatterStrict(content, fp)

    if (meta.name) errors.push(`OpenCode agent frontmatter must not include name: ${fp}`)
    if (!meta.description) errors.push(`OpenCode agent missing description: ${fp}`)
    if (!meta.mode) errors.push(`OpenCode agent missing mode: ${fp}`)
    if (!body.trim()) errors.push(`OpenCode agent has empty body: ${fp}`)

    // Ensure nested directory structure exists: ai-eng/<category>/<agent>.md
    const rel = fp.slice(agentRoot.length + 1)
    const parts = rel.split("/")
    if (parts.length < 2) errors.push(`OpenCode agent must be nested under a category folder: ${fp}`)
  }

  if (errors.length) {
    console.error("\n❌ OpenCode output validation failed:\n")
    for (const e of errors) console.error(` - ${e}`)
    throw new Error(`OpenCode validation failed with ${errors.length} error(s)`)
  }
}

async function buildClaude(): Promise<void> {
  await mkdir(CLAUDE_DIR, { recursive: true })

  // Commands
  const claudeCommandsDir = join(CLAUDE_DIR, "commands")
  await mkdir(claudeCommandsDir, { recursive: true })
  const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"))
  for (const src of commandFiles) {
    await copyFile(src, join(claudeCommandsDir, basename(src)))
  }

  // Agents
  const claudeAgentsDir = join(CLAUDE_DIR, "agents")
  await mkdir(claudeAgentsDir, { recursive: true })
  const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"))
  for (const src of agentFiles) {
    await copyFile(src, join(claudeAgentsDir, basename(src)))
  }

  // Skills
  await copyDirRecursive(SKILLS_DIR, join(CLAUDE_DIR, "skills"))

  // plugin.json (for CI/tests; user installs happen from plugins/ai-eng-system)
  const packageJson = JSON.parse(await readFile(join(ROOT, "package.json"), "utf-8"))
  const pluginJson = {
    name: "ai-eng-system",
    version: packageJson.version,
    description: "AI Engineering System with context engineering and research orchestration for Claude Code",
    author: "v1truv1us",
    license: "MIT",
    commands: commandFiles.map((f) => `./commands/${basename(f)}`),
  }

  await writeFile(join(CLAUDE_DIR, "plugin.json"), JSON.stringify(pluginJson, null, 2))

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
                "🔧 Ferg Engineering System loaded. Commands: /ai-eng/plan, /ai-eng/review, /ai-eng/seo, /ai-eng/work, /ai-eng/compound, /ai-eng/deploy, /ai-eng/optimize, /ai-eng/recursive-init, /ai-eng/create-plugin, /ai-eng/create-agent, /ai-eng/create-command, /ai-eng/create-skill, /ai-eng/create-tool, /ai-eng/research, /ai-eng/context",
            },
          ],
        },
      ],
    },
  }

  await writeFile(join(CLAUDE_DIR, "hooks.json"), JSON.stringify(hooksJson, null, 2))

  // Optional: copy marketplace.json for dist validation convenience
  const marketplaceSrc = join(ROOT, ".claude-plugin", "marketplace.json")
  if (existsSync(marketplaceSrc)) {
    await copyFile(marketplaceSrc, join(CLAUDE_DIR, "marketplace.json"))
  }
}

async function buildOpenCode(): Promise<void> {
  const commandsDir = join(OPENCODE_DIR, "command", NAMESPACE_PREFIX)
  const agentsDir = join(OPENCODE_DIR, "agent", NAMESPACE_PREFIX)

  await mkdir(commandsDir, { recursive: true })
  await mkdir(agentsDir, { recursive: true })

  // Commands: MD-first, copy as-is.
  const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"))
  for (const src of commandFiles) {
    await copyFile(src, join(commandsDir, basename(src)))
  }

  // Agents: MD-first but strip `name` and nest by category.
  const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"))
  for (const src of agentFiles) {
    const content = await readFile(src, "utf-8")
    const transformed = transformAgentMarkdownForOpenCode(content, src)

    const categoryDir = join(agentsDir, transformed.category)
    await mkdir(categoryDir, { recursive: true })
    await writeFile(join(categoryDir, basename(src)), transformed.markdown)
  }

  // Copy OpenCode config + plugin if present.
  const opencodeConfigSrc = join(ROOT, ".opencode", "opencode.jsonc")
  if (existsSync(opencodeConfigSrc)) {
    await copyFile(opencodeConfigSrc, join(OPENCODE_DIR, "opencode.jsonc"))
  }

  const opencodePluginSrc = join(ROOT, ".opencode", "plugin", "ai-eng-system.ts")
  if (existsSync(opencodePluginSrc)) {
    const pluginDest = join(OPENCODE_DIR, "plugin", "ai-eng-system.ts")
    await ensureDirForFile(pluginDest)
    await copyFile(opencodePluginSrc, pluginDest)
  }

  await validateOpenCodeOutput(OPENCODE_DIR)
}

async function copySkillsToDist(): Promise<void> {
  await copyDirRecursive(SKILLS_DIR, join(DIST_DIR, "skills"))
}

async function validateContentOnly(): Promise<void> {
  if (!existsSync(CONTENT_DIR)) throw new Error("content/ directory not found")

  const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"))
  const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"))

  const errors: string[] = []

  for (const fp of commandFiles) {
    const content = await readFile(fp, "utf-8")
    const { meta } = parseFrontmatterStrict(content, fp)
    if (!meta.name) errors.push(`${fp}: missing 'name' in frontmatter`)
    if (!meta.description) errors.push(`${fp}: missing 'description' in frontmatter`)
  }

  for (const fp of agentFiles) {
    const content = await readFile(fp, "utf-8")
    const { meta } = parseFrontmatterStrict(content, fp)
    if (!meta.name) errors.push(`${fp}: missing 'name' in frontmatter`)
    if (!meta.description) errors.push(`${fp}: missing 'description' in frontmatter`)
    if (!meta.mode) errors.push(`${fp}: missing 'mode' in frontmatter`)
  }

  if (errors.length) {
    console.error("\n❌ Validation failed:\n")
    for (const e of errors) console.error(` - ${e}`)
    throw new Error(`Validation failed with ${errors.length} error(s)`)
  }
}

async function buildAll(): Promise<void> {
  const start = Date.now()

  if (existsSync(DIST_DIR)) {
    await rm(DIST_DIR, { recursive: true, force: true })
  }
  await mkdir(DIST_DIR, { recursive: true })

  if (!existsSync(CONTENT_DIR)) {
    throw new Error("content/ directory not found")
  }

  await buildClaude()
  await buildOpenCode()
  await copySkillsToDist()

  const elapsed = Date.now() - start
  console.log(`\n✅ Build complete in ${elapsed}ms -> ${DIST_DIR}`)
}

const args = process.argv.slice(2)

try {
  if (args.includes("--validate")) {
    await validateContentOnly()
    console.log("✅ Content validated")
  } else if (args.includes("--watch")) {
    console.log("👀 Watching for changes...")
    await buildAll()

    watch(CONTENT_DIR, { recursive: true }, async (_eventType, filename) => {
      if (!filename?.endsWith(".md")) return
      console.log(`\n📝 Changed: ${filename}`)
      await buildAll()
    })
  } else {
    await buildAll()
  }
} catch (err) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`\n❌ ${message}`)
  process.exit(1)
}
