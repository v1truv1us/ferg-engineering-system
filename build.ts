#!/usr/bin/env bun
/**
 * Build script for ai-eng-system
 * 
 * Transforms canonical content from content/ into platform-specific formats:
 * - dist/.claude-plugin/ for Claude Code
 * - dist/.opencode/ for OpenCode
 * 
 * Usage:
 *   bun run build.ts           # Build all platforms
 *   bun run build.ts --watch   # Watch mode
 *   bun run build.ts --validate # Validate only, no output
 */

import { readdir, readFile, writeFile, mkdir, rm, copyFile } from "fs/promises"
import { existsSync } from "fs"
import { join, basename, dirname } from "path"
import { watch } from "fs"

const ROOT = import.meta.dir
const CONTENT_DIR = join(ROOT, "content")
const DIST_DIR = join(ROOT, "dist")
const SKILLS_DIR = join(ROOT, "skills")

// Platform output directories
const CLAUDE_DIR = join(DIST_DIR, ".claude-plugin")
const OPENCODE_DIR = join(DIST_DIR, ".opencode")

// Namespace configuration for OpenCode installations
const NAMESPACE_PREFIX = "ai-eng"

interface CommandMeta {
  name: string
  description: string
  agent?: string
  mode?: string
  subtask?: boolean
}

interface AgentMeta {
  name: string
  description: string
  mode: string
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): { meta: Record<string, any>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) {
    return { meta: {}, body: content }
  }

  const [, frontmatter, body] = match
  const meta: Record<string, any> = {}

  for (const line of frontmatter.split("\n")) {
    const colonIndex = line.indexOf(":")
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim()
      let value: any = line.slice(colonIndex + 1).trim()
      
      // Parse booleans
      if (value === "true") value = true
      else if (value === "false") value = false
      
      meta[key] = value
    }
  }

  return { meta, body: body.trim() }
}

/**
 * Transform command to OpenCode table format
 */
function transformToOpenCodeCommand(meta: CommandMeta, body: string): string {
  const headers = ["description"]
  const values = [meta.description]

  if (meta.agent) {
    headers.push("agent")
    values.push(meta.agent)
  }

  if (meta.subtask !== undefined) {
    headers.push("subtask")
    values.push(String(meta.subtask))
  }

  const headerRow = `| ${headers.join(" | ")} |`
  const separatorRow = `|${headers.map(() => "---").join("|")}|`
  const valueRow = `| ${values.join(" | ")} |`

  return `${headerRow}\n${separatorRow}\n${valueRow}\n\n${body}`
}

/**
 * Transform agent to OpenCode table format
 */
function transformToOpenCodeAgent(meta: AgentMeta, body: string): string {
  const headerRow = "| description | mode |"
  const separatorRow = "|---|---|"
  const valueRow = `| ${meta.description} | ${meta.mode || "subagent"} |`

  return `${headerRow}\n${separatorRow}\n${valueRow}\n\n${body}`
}

/**
 * Get all markdown files recursively
 */
async function getMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = []
  
  if (!existsSync(dir)) return files

  const entries = await readdir(dir, { withFileTypes: true })
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await getMarkdownFiles(fullPath))
    } else if (entry.name.endsWith(".md")) {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Build Claude Code agents
 */
async function buildClaudeAgents(): Promise<void> {
  const agentsDir = join(CLAUDE_DIR, "agents")
  await mkdir(agentsDir, { recursive: true })
  
  const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"))
  for (const file of agentFiles) {
    await copyFile(file, join(agentsDir, basename(file)))
  }
}

/**
 * Copy directory recursively
 */
const copyRecursive = async (src: string, dest: string) => {
  const entries = await readdir(src, { withFileTypes: true })
  await mkdir(dest, { recursive: true })
  
  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)
    
    if (entry.isDirectory()) {
      await copyRecursive(srcPath, destPath)
    } else {
      await copyFile(srcPath, destPath)
    }
  }
}

/**
 * Build Claude Code skills
 */
async function buildClaudeSkills(): Promise<void> {
  const skillsDir = join(CLAUDE_DIR, "skills")
  await mkdir(skillsDir, { recursive: true })
  
  // Copy skills to dist/.claude-plugin/skills/
  await copyRecursive(SKILLS_DIR, join(CLAUDE_DIR, "skills"))
}

/**
 * Build Claude Code plugin.json and hooks
 */
async function buildClaudePlugin(): Promise<void> {
  // Read version from package.json
  const packageJson = JSON.parse(await readFile(join(ROOT, "package.json"), "utf-8"))

  // Get command files first to include in plugin.json
  const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"))
  const commands = commandFiles.map(file => `./commands/${basename(file)}`)

  const pluginJson = {
    name: "ai-eng-system",
    description: "AI Engineering System for Claude Code",
    author: "v1truv1us",
    license: "MIT",
    commands: commands
  }

  await writeFile(
    join(CLAUDE_DIR, "plugin.json"),
    JSON.stringify(pluginJson, null, 2)
  )

  // Create hooks.json for session notifications
  const hooksJson = {
    hooks: {
      SessionStart: [
        {
          description: "Initialize ai-eng-system on session start",
          hooks: [
            {
              type: "notification",
              message: "Ferg Engineering System loaded. Commands: /plan, /review, /seo, /work, /compound, /deploy, /optimize, /recursive-init"
            }
          ]
        }
      ]
    }
  }

  await writeFile(
    join(CLAUDE_DIR, "hooks.json"),
    JSON.stringify(hooksJson, null, 2)
  )

  // Copy commands (Claude uses YAML frontmatter format directly)
  const commandsDir = join(CLAUDE_DIR, "commands")
  await mkdir(commandsDir, { recursive: true })

  for (const file of commandFiles) {
    const content = await readFile(file, "utf-8")
    const dest = join(commandsDir, basename(file))
    await writeFile(dest, content)
  }

  // Copy marketplace.json if it exists
  const marketplaceJsonPath = join(ROOT, "marketplace.json")
  if (existsSync(marketplaceJsonPath)) {
    await copyFile(marketplaceJsonPath, join(CLAUDE_DIR, "marketplace.json"))
    console.log(`   ✓ marketplace.json`)
  }

  console.log(`   ✓ ${commandFiles.length} commands`)
  console.log(`   ✓ plugin.json`)
}

/**
 * Build OpenCode output
 */
async function buildOpenCode(): Promise<void> {
  console.log("📦 Building OpenCode plugin...")

  const commandsDir = join(OPENCODE_DIR, "command", NAMESPACE_PREFIX)
  const agentsDir = join(OPENCODE_DIR, "agent", NAMESPACE_PREFIX)

  await mkdir(commandsDir, { recursive: true })
  await mkdir(agentsDir, { recursive: true })

  // Transform and write commands
  const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"))
  for (const file of commandFiles) {
    const content = await readFile(file, "utf-8")
    const { meta, body } = parseFrontmatter(content)
    const transformed = transformToOpenCodeCommand(meta, body)
    const dest = join(commandsDir, basename(file))
    await writeFile(dest, transformed)
  }
  console.log(`   ✓ ${commandFiles.length} commands`)

  // Transform and write agents
  const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"))
  for (const file of agentFiles) {
    const content = await readFile(file, "utf-8")
    const { meta, body } = parseFrontmatter(content)
    const transformed = transformToOpenCodeAgent(meta as AgentMeta, body)
    const dest = join(agentsDir, basename(file))
    await writeFile(dest, transformed)
  }
  console.log(`   ✓ ${agentFiles.length} agents`)

  // Copy OpenCode configuration
  const opencodeConfigSrc = join(ROOT, ".opencode", "opencode.jsonc")
  const opencodeConfigDest = join(OPENCODE_DIR, "opencode.jsonc")
  if (existsSync(opencodeConfigSrc)) {
    await copyFile(opencodeConfigSrc, opencodeConfigDest)
    console.log(`   ✓ configuration copied`)
  } else {
    console.log(`   ⚠️  configuration not found`)
  }
}

/**
 * Copy skills (shared between platforms)
 */
async function copySkills(): Promise<void> {
  console.log("📦 Copying skills...")
  
  const destDir = join(DIST_DIR, "skills")
  
  if (existsSync(SKILLS_DIR)) {
    await mkdir(destDir, { recursive: true })
    await copyRecursive(SKILLS_DIR, destDir)
  }
  
  console.log(`   ✓ skills copied`)
}

/**
 * Main build function
 */
async function build(): Promise<void> {
  const startTime = Date.now()

  console.log("\n🚀 Building ai-eng-system...\n")

  // Clean dist
  if (existsSync(DIST_DIR)) {
    await rm(DIST_DIR, { recursive: true })
  }
  await mkdir(DIST_DIR, { recursive: true })

  // Check if content directory exists
  if (!existsSync(CONTENT_DIR)) {
    console.error("❌ Error: content/ directory not found")
    console.error("   Run migration first or create content/ manually")
    process.exit(1)
  }

  // Copy package files
  await copyFile(join(ROOT, 'package.json'), join(DIST_DIR, 'package.json'))
  await copyFile(join(ROOT, 'README.md'), join(DIST_DIR, 'README.md'))
  await copyFile(join(ROOT, 'LICENSE'), join(DIST_DIR, 'LICENSE'))

  // Copy scripts directory
  const scriptsSrc = join(ROOT, 'scripts')
  const scriptsDest = join(DIST_DIR, 'scripts')
  if (existsSync(scriptsSrc)) {
    await mkdir(scriptsDest, { recursive: true })
    await copyRecursive(scriptsSrc, scriptsDest)
  }

  // Build all platforms
  await buildClaudeAgents()
  await buildClaudeSkills()
  await buildClaudePlugin()
  await buildOpenCode()
  await copySkills()

  const elapsed = Date.now() - startTime
  console.log(`\n✅ Build complete in ${elapsed}ms`)
  console.log(`   Output: ${DIST_DIR}/`)
}

/**
 * Validate content without building
 */
async function validate(): Promise<void> {
  console.log("\n🔍 Validating content...\n")

  if (!existsSync(CONTENT_DIR)) {
    console.error("❌ content/ directory not found")
    process.exit(1)
  }

  const commandFiles = await getMarkdownFiles(join(CONTENT_DIR, "commands"))
  const agentFiles = await getMarkdownFiles(join(CONTENT_DIR, "agents"))

  let errors = 0

  for (const file of commandFiles) {
    const content = await readFile(file, "utf-8")
    const { meta } = parseFrontmatter(content)
    
    if (!meta.name) {
      console.error(`❌ ${file}: missing 'name' in frontmatter`)
      errors++
    }
    if (!meta.description) {
      console.error(`❌ ${file}: missing 'description' in frontmatter`)
      errors++
    }
  }

  for (const file of agentFiles) {
    const content = await readFile(file, "utf-8")
    const { meta } = parseFrontmatter(content)
    
    if (!meta.name) {
      console.error(`❌ ${file}: missing 'name' in frontmatter`)
      errors++
    }
    if (!meta.description) {
      console.error(`❌ ${file}: missing 'description' in frontmatter`)
      errors++
    }
  }

  if (errors > 0) {
    console.error(`\n❌ Validation failed with ${errors} error(s)`)
    process.exit(1)
  }

  console.log(`✅ Validated ${commandFiles.length} commands, ${agentFiles.length} agents`)
}

// CLI
const args = process.argv.slice(2)

if (args.includes("--validate")) {
  await validate()
} else if (args.includes("--watch")) {
  console.log("👀 Watching for changes...")
  await build()
  
  watch(CONTENT_DIR, { recursive: true }, async (event, filename) => {
    if (filename?.endsWith(".md")) {
      console.log(`\n📝 Changed: ${filename}`)
      await build()
    }
  })
} else {
  await build()
}

// Export functions for testing
export { build, validate }
