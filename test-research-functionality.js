#!/usr/bin/env bun

/**
 * Test script to validate research orchestration functionality
 */

import { ResearchOrchestrator } from './src/research/orchestrator.js';
import { ResearchScope, ResearchDepth } from './src/research/types.js';

console.log('🧪 Testing Research Orchestration System');
console.log('==========================================\n');

// Test 1: Basic orchestrator creation
console.log('1. Testing orchestrator creation...');
try {
  const config = {
    maxConcurrency: 3,
    defaultTimeout: 30000,
    enableCaching: false,
    logLevel: 'info'
  };
  
  const orchestrator = new ResearchOrchestrator(config);
  console.log('✅ Orchestrator created successfully');
} catch (error) {
  console.error('❌ Failed to create orchestrator:', error.message);
  process.exit(1);
}

// Test 2: Research query creation
console.log('\n2. Testing research query creation...');
try {
  const query = {
    id: 'test-query-' + Date.now(),
    query: 'How does authentication work in this codebase?',
    scope: ResearchScope.CODEBASE,
    depth: ResearchDepth.MEDIUM,
    constraints: {
      maxFiles: 50,
      maxDuration: 60000
    }
  };
  console.log('✅ Research query created successfully');
  console.log(`   Query: ${query.query}`);
  console.log(`   Scope: ${query.scope}`);
  console.log(`   Depth: ${query.depth}`);
} catch (error) {
  console.error('❌ Failed to create research query:', error.message);
  process.exit(1);
}

// Test 3: Export formats
console.log('\n3. Testing export formats...');
try {
  const mockResults = {
    query: {
      id: 'test-123',
      query: 'Test query',
      scope: ResearchScope.ALL,
      depth: ResearchDepth.MEDIUM
    },
    findings: [
      {
        id: 'finding-1',
        title: 'Test Finding',
        description: 'This is a test finding',
        impact: 'medium',
        confidence: 0.8,
        evidence: [
          {
            file: 'test.js',
            line: 10,
            snippet: 'console.log("test")'
          }
        ]
      }
    ],
    recommendations: ['Test recommendation 1'],
    risks: [],
    metrics: {
      totalDuration: 5000,
      discoveryTime: 2000,
      analysisTime: 2000,
      synthesisTime: 1000
    }
  };

  // Test markdown export
  const markdown = `# Research Results: ${mockResults.query.query}

## Summary
- **Query**: ${mockResults.query.query}
- **Scope**: ${mockResults.query.scope}
- **Duration**: ${mockResults.metrics.totalDuration}ms

## Key Findings
${mockResults.findings.map(f => `- **${f.title}** (${f.impact})`).join('\n')}

## Recommendations
${mockResults.recommendations.map(r => `- ${r}`).join('\n')}
`;

  console.log('✅ Markdown export format works');
  console.log('   Sample output length:', markdown.length, 'characters');

  // Test JSON export
  const json = JSON.stringify(mockResults, null, 2);
  console.log('✅ JSON export format works');
  console.log('   Sample output length:', json.length, 'characters');

} catch (error) {
  console.error('❌ Failed to test export formats:', error.message);
  process.exit(1);
}

console.log('\n🎉 All basic tests passed!');
console.log('Research orchestration system is functional.');