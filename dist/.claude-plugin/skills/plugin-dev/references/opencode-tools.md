# OpenCode Custom Tools Guide

## Overview

OpenCode supports custom tools through TypeScript files using the `tool()` helper from `@opencode-ai/plugin`. This is a powerful feature unique to OpenCode that allows extending functionality with executable code.

## Tool Format

### Basic Structure

```typescript
import { tool } from "@opencode-ai/plugin"

export default tool({
  description: "Tool description",
  args: {
    param1: tool.schema.string().describe("Parameter description"),
    param2: tool.schema.number().describe("Number parameter"),
  },
  async execute(args, context) {
    // Tool implementation
    return result
  },
})
```

### Multiple Tools

Export multiple tools from one file:

```typescript
import { tool } from "@opencode-ai/plugin"

export const add = tool({
  description: "Add two numbers",
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a + args.b
  },
})

export const multiply = tool({
  description: "Multiply two numbers", 
  args: {
    a: tool.schema.number().describe("First number"),
    b: tool.schema.number().describe("Second number"),
  },
  async execute(args) {
    return args.a * args.b
  },
})

// Creates: math_add and math_multiply tools
```

## Schema Validation

### Zod Integration

OpenCode uses Zod for runtime validation:

```typescript
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"

export default tool({
  description: "Create user with validation",
  args: {
    email: z.string().email().describe("Valid email address"),
    age: z.number().min(18).describe("User age (18+)"),
    name: z.string().min(2).describe("Full name (min 2 chars)"),
  },
  async execute(args, context) {
    // Zod validates args before execution
    return `User: ${args.name}, Age: ${args.age}, Email: ${args.email}`
  },
})
```

### Advanced Schemas

```typescript
import { tool } from "@opencode-ai/plugin"
import { z } from "zod"

export default tool({
  description: "Complex configuration tool",
  args: {
    config: z.object({
      database: z.object({
        host: z.string().describe("Database host"),
        port: z.number().min(1).max(65535).describe("Database port"),
        ssl: z.boolean().describe("Use SSL connection"),
      }),
      features: z.array(z.enum(["analytics", "logging", "caching"])).describe("Enabled features"),
    }),
    options: z.record(z.string(), z.any()).describe("Additional options"),
  },
  async execute(args, context) {
    // Complex nested validation
    return `Config: ${JSON.stringify(args.config)}`
  },
})
```

## Context Access

### Available Context

Tools receive context about the current session:

```typescript
async execute(args, context) {
  const { agent, sessionID, messageID } = context
  
  console.log(`Running in ${agent} context`)
  console.log(`Session: ${sessionID}`)
  console.log(`Message: ${messageID}`)
  
  // Tool implementation
  return result
}
```

### Context Properties

| Property | Type | Description |
|----------|-------|-------------|
| **agent** | string | Current agent name |
| **sessionID** | string | Current session identifier |
| **messageID** | string | Current message identifier |

## Tool Categories

### File Operations

```typescript
export default tool({
  description: "Read and parse configuration file",
  args: {
    filePath: tool.schema.string().describe("Path to config file"),
  },
  async execute(args, context) {
    const content = await Bun.file(args.filePath).text()
    const config = JSON.parse(content)
    return config
  },
})
```

### System Integration

```typescript
export default tool({
  description: "Execute system command safely",
  args: {
    command: tool.schema.string().describe("Command to execute"),
    args: tool.schema.array(tool.schema.string()).describe("Command arguments"),
  },
  async execute(args, context) {
    // Safe command execution
    const allowedCommands = ['git', 'npm', 'ls']
    if (!allowedCommands.includes(args.command)) {
      throw new Error(`Command not allowed: ${args.command}`)
    }
    
    const result = await Bun.$([args.command, ...args.args]).text()
    return result.trim()
  },
})
```

### External API

```typescript
export default tool({
  description: "Query external API",
  args: {
    endpoint: tool.schema.string().describe("API endpoint"),
    query: tool.schema.string().describe("Query parameters"),
  },
  async execute(args, context) {
    const url = `https://api.example.com/${args.endpoint}`
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ query: args.query }),
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  },
})
```

### Database Operations

```typescript
export default tool({
  description: "Execute database query",
  args: {
    sql: tool.schema.string().describe("SQL query to execute"),
  },
  async execute(args, context) {
    // Database connection and query execution
    const result = await Bun.$`psql $DATABASE_URL -c "${args.sql}"`.text()
    return result
  },
})
```

## Best Practices

### Error Handling

```typescript
export default tool({
  description: "Robust file operations",
  args: {
    path: tool.schema.string().describe("File path"),
  },
  async execute(args, context) {
    try {
      const content = await Bun.file(args.path).text()
      return { success: true, content }
    } catch (error) {
      return { 
        success: false, 
        error: error.message,
        code: 'FILE_READ_ERROR'
      }
    }
  },
})
```

### Input Validation

```typescript
export default tool({
  description: "Secure file creation",
  args: {
    filename: tool.schema.string()
      .regex(/^[a-zA-Z0-9._-]+$/)
      .describe("Valid filename"),
    content: tool.schema.string().min(1).describe("File content"),
  },
  async execute(args, context) {
    // Sanitize filename
    const safeFilename = args.filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    
    // Validate content
    if (args.content.length > 10000) {
      throw new Error("Content too long (max 10k chars)")
    }
    
    await Bun.write(`${safeFilename}.txt`, args.content)
    return `Created: ${safeFilename}.txt`
  },
})
```

### Security

```typescript
export default tool({
  description: "Secure credential management",
  args: {
    service: tool.schema.string().describe("Service name"),
  },
  async execute(args, context) {
    // Never log credentials
    const credential = process.env[`${args.service.toUpperCase()}_API_KEY`]
    
    if (!credential) {
      throw new Error(`Credential not found for ${args.service}`)
    }
    
    // Use credential without exposing it
    const result = await fetch(`https://api.${args.service}.com/verify`, {
      headers: { 'Authorization': `Bearer ${credential}` }
    })
    
    return { service: args.service, status: 'verified' }
  },
})
```

## Integration with Plugin-Dev

### Tool Creator Agent

The `ferg/tool-creator` agent helps create custom tools:

```yaml
---
name: tool-creator
description: Use this agent when user asks to "create a tool", "build a custom tool", "make a tool that...", or needs TypeScript tool development assistance.
mode: subagent
---

You are a TypeScript tool development expert...
```

### Tool Generation Workflow

1. **Requirements Analysis**: Understand tool purpose
2. **Schema Design**: Create Zod validation
3. **Implementation**: Write TypeScript code
4. **Testing**: Verify tool functionality
5. **Documentation**: Add usage examples

## Tool Locations

### Project-Local

```
.opencode/tool/
├── my-tool.ts
├── database-query.ts
└── api-client.ts
```

### Global

```
~/.config/opencode/tool/
├── git-helper.ts
├── file-operations.ts
└── system-integration.ts
```

## Advanced Features

### Async Operations

```typescript
export default tool({
  description: "Async file processing",
  args: {
    files: tool.schema.array(tool.schema.string()).describe("Files to process"),
  },
  async execute(args, context) {
    const results = []
    
    for (const file of args.files) {
      const content = await Bun.file(file).text()
      const processed = await processContent(content)
      results.push({ file, processed })
    }
    
    return results
  },
})
```

### Streaming Results

```typescript
export default tool({
  description: "Stream large dataset",
  args: {
    source: tool.schema.string().describe("Data source URL"),
  },
  async execute(args, context) {
    const response = await fetch(args.source)
    
    // Stream processing for large data
    const reader = response.body?.getReader()
    if (!reader) return
    
    let processed = 0
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      // Process chunk
      processed += value.length
      
      // Yield progress
      yield { processed, total: response.headers.get('content-length') }
    }
  },
})
```

### Configuration Management

```typescript
export default tool({
  description: "Manage tool configuration",
  args: {
    action: tool.schema.enum(['get', 'set', 'list']).describe("Configuration action"),
    key: tool.schema.string().describe("Configuration key"),
    value: tool.schema.any().describe("Configuration value"),
  },
  async execute(args, context) {
    const configPath = '.tool-config.json'
    
    switch (args.action) {
      case 'get':
        const config = JSON.parse(await Bun.file(configPath).text())
        return config[args.key] || null
        
      case 'set':
        const config = JSON.parse(await Bun.file(configPath).text())
        config[args.key] = args.value
        await Bun.write(configPath, JSON.stringify(config, null, 2))
        return `Set ${args.key} = ${args.value}`
        
      case 'list':
        const config = JSON.parse(await Bun.file(configPath).text())
        return config
        
      default:
        throw new Error(`Invalid action: ${args.action}`)
    }
  },
})
```

## Testing

### Unit Testing

```typescript
import { describe, it, expect } from 'bun:test'
import myTool from './my-tool'

describe('myTool', () => {
  it('should validate input correctly', async () => {
    const result = await myTool.execute({
      param: 'valid-input'
    }, {})
    
    expect(result).toContain('success')
  })
  
  it('should reject invalid input', async () => {
    await expect(async () => 
      myTool.execute({ param: 'invalid-input' }, {})
    ).toThrow('Invalid input')
  })
})
```

### Integration Testing

```typescript
// Test tool in OpenCode context
import myTool from './my-tool'

// Mock OpenCode context
const mockContext = {
  agent: 'test',
  sessionID: 'test-session',
  messageID: 'test-message'
}

const result = await myTool.execute({ param: 'test' }, mockContext)
console.log('Tool result:', result)
```

Custom tools provide a powerful way to extend OpenCode with domain-specific functionality while maintaining type safety and validation.