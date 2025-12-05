# Phase 3 Usage Guide

**Version**: v0.3.0-rc1  
**Date**: 2025-01-05  
**Status**: Complete  

## Overview

Phase 3 introduces a comprehensive research orchestration system that coordinates multiple specialized agents through a 3-phase workflow: parallel discovery, sequential analysis, and intelligent synthesis. This system enables systematic investigation of codebases, documentation, and external sources with evidence-based reporting.

## Quick Start

### Basic Research

```bash
# Research authentication implementation
bun run research "authentication implementation"

# Research with specific scope
bun run research "user management" --scope=codebase

# Deep research with documentation focus
bun run research "API design decisions" --scope=documentation --depth=deep
```

### CLI Options

| Option | Description | Default |
|---------|-------------|---------|
| `query` | Research question or topic | Required |
| `--scope` | Research scope (codebase\|documentation\|all) | all |
| `--depth` | Research depth (shallow\|medium\|deep) | medium |
| `--output` | Custom output path for report | auto-generated |
| `--format` | Export format (markdown\|json\|html) | markdown |
| `--no-cache` | Disable research caching | false |
| `--verbose` | Enable verbose output | false |

## Research Methodology

### Phase 1: Parallel Discovery

Three specialized agents run concurrently:

1. **Codebase Locator** - Finds relevant files, components, and directories
2. **Research Locator** - Discovers documentation, decisions, and notes  
3. **Pattern Finder** - Identifies recurring implementation patterns

### Phase 2: Sequential Analysis

Two analyzers process discovery results:

1. **Codebase Analyzer** - Deep code analysis with file:line evidence
2. **Research Analyzer** - Documentation and decision analysis

### Phase 3: Synthesis

Comprehensive report generation with:
- Synopsis and executive summary
- Detailed findings with evidence
- Code references with line numbers
- Architecture insights and relationships
- Actionable recommendations
- Risk assessment and mitigation
- Open questions for further investigation

## Output Formats

### Markdown (Default)

```yaml
---
date: 2025-01-05
researcher: Assistant
topic: 'authentication implementation'
tags: [research, security, authentication]
status: complete
confidence: high
agents_used: [codebase-analyzer, research-analyzer]
---

## Synopsis
Research analysis for "authentication implementation" across codebase revealed 12 key insights from 8 files...

## Summary
- Found 12 insights across 24 evidence points
- Key areas identified: security, architecture, pattern-analysis
- 3 high-impact findings require immediate attention
- 8 high-confidence evidence points support findings
```

### JSON

```json
{
  "id": "report-1736108800000-abc123",
  "query": "authentication implementation",
  "synopsis": "...",
  "findings": [...],
  "codeReferences": [...],
  "recommendations": [...],
  "confidence": "high",
  "metadata": {
    "totalFiles": 8,
    "totalInsights": 12,
    "totalEvidence": 24
  }
}
```

### HTML

Interactive HTML report with:
- Expandable sections
- Color-coded impact levels
- Clickable code references
- Printable formatting

## Configuration

### Research Configuration

```typescript
const config = {
  maxConcurrency: 3,        // Max parallel agents
  defaultTimeout: 30000,     // 30 seconds per phase
  enableCaching: true,       // Cache discovery results
  logLevel: 'info',         // Logging verbosity
  cacheExpiry: 3600000,     // 1 hour cache TTL
  maxFileSize: 10485760,    // 10MB file limit
  maxResults: 100,          // Max results per agent
  enableExternalSearch: false, // External web search
  externalSearchTimeout: 10000 // 10 seconds external timeout
};
```

### Environment Variables

```bash
# Research cache directory
export RESEARCH_CACHE_DIR="./.research-cache"

# External search API key (if enabled)
export EXTERNAL_SEARCH_API_KEY="your-api-key"

# Default research depth
export DEFAULT_RESEARCH_DEPTH="medium"
```

## Advanced Usage

### Ticket-Based Research

```bash
# Research from ticket file
bun run research --ticket="docs/tickets/AUTH-123.md"

# Ticket file format
---
title: "Implement OAuth2 authentication"
description: "Add OAuth2 provider support"
priority: high
context:
  current_auth: "basic JWT"
  requirements: ["state", "PKCE", "refresh_token"]
---
```

### Custom Output Paths

```bash
# Save to specific directory
bun run research "microservices architecture" --output="docs/research/2025-01-microservices.md"

# Export to JSON
bun run research "performance analysis" --format=json --output="reports/perf-analysis.json"
```

### Verbose Mode

```bash
# Detailed progress tracking
bun run research "database schema" --verbose

# Output includes:
# - Phase start/completion events
# - Agent execution times
# - Evidence collection progress
# - Confidence calculations
```

## Integration Examples

### With Build Pipeline

```yaml
# .github/workflows/research.yml
name: Research Analysis
on: [push, pull_request]

jobs:
  research:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - name: Run Research Analysis
        run: bun run research "architecture changes" --format=json --output=reports/
      - name: Upload Reports
        uses: actions/upload-artifact@v3
        with:
          name: research-reports
          path: reports/
```

### With Documentation Generation

```bash
# Generate research docs for all major components
components=("auth" "database" "api" "ui")

for component in "${components[@]}"; do
  bun run research "$component implementation" \
    --scope=all \
    --depth=deep \
    --output="docs/research/${component}-analysis.md"
done
```

## Performance Tips

### For Large Codebases

```bash
# Use shallow depth for quick overview
bun run research "recent changes" --depth=shallow --scope=codebase

# Limit to specific directories
cd src/components
bun run research "component patterns" --scope=codebase
```

### For Documentation Research

```bash
# Focus on decisions and architecture
bun run research "API design decisions" --scope=documentation --depth=deep

# Include historical context
bun run research "evolution of auth system" --scope=all --depth=deep --verbose
```

## Troubleshooting

### Common Issues

**Issue**: Research takes too long
```bash
# Solution: Use shallower depth or specific scope
bun run research "quick overview" --depth=shallow --scope=codebase
```

**Issue**: Too many irrelevant results
```bash
# Solution: Be more specific in query
bun run research "JWT token validation" --scope=codebase
# Instead of: bun run research "authentication"
```

**Issue**: Cache causing stale results
```bash
# Solution: Clear cache or disable
bun run research "fresh analysis" --no-cache
# Or manually: rm -rf .research-cache/*
```

### Debug Mode

```bash
# Enable detailed logging
export RESEARCH_LOG_LEVEL=debug
bun run research "debug topic" --verbose
```

## API Reference

### Programmatic Usage

```typescript
import { ResearchOrchestrator } from './src/research/orchestrator.js';

const orchestrator = new ResearchOrchestrator({
  maxConcurrency: 3,
  enableCaching: true,
  logLevel: 'info'
});

const report = await orchestrator.research({
  id: 'research-001',
  query: 'authentication patterns',
  scope: 'all',
  depth: 'medium'
});

console.log(`Found ${report.metadata.totalInsights} insights`);
console.log(`Confidence: ${report.confidence}`);
```

### Event Listening

```typescript
orchestrator.on('research_started', (data) => {
  console.log(`Research started: ${data.query.query}`);
});

orchestrator.on('phase_completed', (data) => {
  console.log(`Phase ${data.phase} completed in ${data.executionTime}ms`);
});

orchestrator.on('research_completed', (data) => {
  console.log(`Research complete: ${data.report.metadata.totalInsights} insights`);
});
```

## Migration from v0.2

### Breaking Changes

- Research command now uses `plan` agent mode instead of `build`
- Test framework migrated from Vitest to bun:test
- Configuration options expanded with new caching and timeout settings

### Upgrade Steps

```bash
# 1. Update dependencies
bun install

# 2. Update existing research calls
# Old: bun run research "topic" --agent=build
# New: bun run research "topic" (uses plan mode automatically)

# 3. Update test imports
# Old: import { describe, it, expect } from 'vitest';
# New: import { describe, it, expect } from 'bun:test';
```

## Support

For issues or questions about Phase 3 research orchestration:

1. Check this guide for troubleshooting steps
2. Review generated reports for confidence levels and evidence
3. Use verbose mode for detailed execution information
4. Check GitHub issues for known problems

## Next Steps

Phase 3 research orchestration provides the foundation for:

- **Phase 4**: Enhanced external search integration
- **Phase 5**: Real-time collaboration features  
- **Phase 6**: Advanced AI-powered insights
- **Phase 7**: Custom research templates and automation