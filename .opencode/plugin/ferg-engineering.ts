import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"

export default (async (ctx) => {
  console.log("🔧 Ferg Engineering System loaded")
  
  return {
    // MCP Permission Management Tools
    tool: {
      "mcp-audit": tool({
        description: "Audit MCP tool permissions across all agents",
        args: {
          agent: tool.schema.string().describe("Optional: specific agent to check (default: all)"),
          format: tool.schema.enum(["table", "json", "summary"]).describe("Output format")
        },
        async execute(args, context) {
          // Read current configuration
          const configPath = `${ctx.directory}/.opencode/opencode.jsonc`
          const config = await Bun.file(configPath).text()
          const configJson = JSON.parse(config)
          
          if (args.format === "table") {
            // Generate permission matrix table
            const matrix = generatePermissionMatrix(configJson)
            return `## MCP Permission Matrix\n\n${matrix}`
          }
          
          if (args.format === "json") {
            return JSON.stringify(configJson, null, 2)
          }
          
          if (args.format === "summary") {
            const summary = generatePermissionSummary(configJson)
            return summary
          }
          
          return `Use --format table|json|summary for specific output`
        }
      }),
      
      "mcp-validate": tool({
        description: "Validate MCP configuration syntax and security",
        args: {
          config_file: tool.schema.string().describe("Path to config file (default: .opencode/opencode.jsonc)")
        },
        async execute(args, context) {
          const configPath = args.config_file || `${ctx.directory}/.opencode/opencode.jsonc`
          const config = await Bun.file(configPath).text()
          const configJson = JSON.parse(config)
          
          const validation = validateMCPConfig(configJson)
          return {
            valid: validation.valid,
            errors: validation.errors,
            warnings: validation.warnings,
            recommendations: validation.recommendations
          }
        }
      }),
      
      "mcp-update": tool({
        description: "Update MCP server configurations or agent permissions",
        args: {
          server: tool.schema.string().describe("MCP server name"),
          action: tool.schema.enum(["add", "remove", "update"]).describe("Action to perform"),
          agent: tool.schema.string().describe("Agent name (optional)"),
          tools: tool.schema.array(tool.schema.string()).describe("Tools to enable/disable"),
          enabled: tool.schema.boolean().describe("Enable/disable server")
        },
        async execute(args, context) {
          const configPath = `${ctx.directory}/.opencode/opencode.jsonc`
          const config = await Bun.file(configPath).text()
          const configJson = JSON.parse(config)
          
          if (args.action === "add") {
            return addMCPServer(configJson, args)
          }
          
          if (args.action === "remove") {
            return removeMCPServer(configJson, args)
          }
          
          if (args.action === "update") {
            return updateMCPServer(configJson, args)
          }
          
          if (args.agent) {
            return updateAgentPermissions(configJson, args)
          }
          
          // Save updated config
          await Bun.write(configPath, JSON.stringify(configJson, null, 2))
          
          return `MCP configuration updated successfully`
        }
      })
    },
    
    // Permission enforcement hook
    "tool.execute.before": async (input, output) => {
      const configPath = `${ctx.directory}/.opencode/opencode.jsonc`
      const config = await Bun.file(configPath).text()
      const configJson = JSON.parse(config)
      
      // Log MCP tool usage for auditing
      if (input.tool && input.tool.includes('_')) {
        console.log(`[MCP] ${input.agent || 'unknown'} → ${input.tool}`)
      }
      
      // Enforce permission checks
      const agentName = input.agent || 'default'
      const agentConfig = configJson.agent?.[agentName]
      
      if (agentConfig) {
        const allowedTools = agentConfig.tools || {}
        const deniedTools = configJson.tools || {}
        
        // Check if tool is allowed
        for (const [pattern, allowed] of Object.entries(allowedTools)) {
          if (allowed && matchesPattern(input.tool, pattern)) {
            return // Tool is allowed
          }
        }
        
        // Check if tool is denied
        for (const pattern of Object.keys(deniedTools)) {
          if (matchesPattern(input.tool, pattern)) {
            throw new Error(`Agent "${agentName}" is not authorized to use tool "${input.tool}"`)
          }
        }
      }
      
      // Block .env file access
      if (input.tool === "read" && output.args?.filePath?.includes(".env")) {
        throw new Error("Access denied: .env files are protected")
      }
    }
  }
}) satisfies Plugin

// Helper functions
function generatePermissionMatrix(config: any): string {
  const agents = config.agent || {}
  const tools = config.tools || {}
  
  let matrix = "| Agent | Coolify | Playwright | context7 | Socket | chrome-devtools | sentry | github | verbalized-sampling | cloudflare |\n"
  matrix += "|--------|----------|------------|----------|--------|-----------------|--------|----------------|------------|\n"
  
  for (const [agentName, agentConfig] of Object.entries(agents)) {
    const agentTools = agentConfig.tools || {}
    matrix += `| ${agentName} |`
    
    for (const server of ["Coolify", "Playwright", "context7", "Socket", "chrome-devtools", "sentry", "github", "verbalized-sampling", "cloudflare"]) {
      const allowed = agentTools[`${server}*`] === true ? "✅" : 
                   agentTools[`${server}*`] === false ? "❌" : "⚪"
      matrix += ` ${allowed} |`
    }
    
    matrix += " |\n"
  }
  
  return matrix
}

function validateMCPConfig(config: any): { valid: boolean, errors: string[], warnings: string[], recommendations: string[] } {
  const errors: string[] = []
  const warnings: string[] = []
  const recommendations: string[] = []
  
  // Check for hardcoded tokens
  const configStr = JSON.stringify(config)
  if (configStr.includes('"sktsec_') || configStr.includes('"ghp_') || configStr.includes('"ctx7sk-')) {
    errors.push("Hardcoded API tokens detected in configuration")
    recommendations.push("Move all tokens to environment variables using ${ENV_VAR} syntax")
  }
  
  // Check for missing environment variables
  if (configStr.includes('${') && !process.env.COOLIFY_ACCESS_TOKEN) {
    warnings.push("Environment variables referenced but may not be set")
    recommendations.push("Ensure all ${ENV_VAR} variables are properly set in shell environment")
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    recommendations
  }
}

function matchesPattern(tool: string, pattern: string): boolean {
  if (pattern === '*') return true
  if (pattern.endsWith('*')) {
    return tool.startsWith(pattern.slice(0, -1))
  }
  return tool === pattern
}

function addMCPServer(config: any, args: any): string {
  const serverName = args.server
  if (!config.mcp) config.mcp = {}
  if (!config.tools) config.tools = {}
  
  config.mcp[serverName] = {
    type: "local",
    command: ["npx", "-y", `${serverName}`],
    enabled: args.enabled ?? true
  }
  
  // Disable globally by default
  config.tools[`${serverName}*`] = false
  
  return `Added MCP server "${serverName}" to configuration`
}

function removeMCPServer(config: any, args: any): string {
  const serverName = args.server
  
  if (config.mcp?.[serverName]) {
    delete config.mcp[serverName]
  }
  
  if (config.tools?.[`${serverName}*`]) {
    delete config.tools[`${serverName}*`]
  }
  
  return `Removed MCP server "${serverName}" from configuration`
}

function updateMCPServer(config: any, args: any): string {
  const serverName = args.server
  
  if (config.mcp?.[serverName]) {
    if (args.enabled !== undefined) {
      config.mcp[serverName].enabled = args.enabled
    }
    if (args.command) {
      config.mcp[serverName].command = args.command
    }
    if (args.environment) {
      config.mcp[serverName].environment = args.environment
    }
  }
  
  return `Updated MCP server "${serverName}" configuration`
}

function updateAgentPermissions(config: any, args: any): string {
  const agentName = args.agent
  
  if (!config.agent) config.agent = {}
  if (!config.agent[agentName]) config.agent[agentName] = {}
  if (!config.agent[agentName].tools) config.agent[agentName].tools = {}
  
  if (args.tools) {
    config.agent[agentName].tools = args.tools
  }
  
  return `Updated permissions for agent "${agentName}"`
}
