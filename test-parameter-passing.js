#!/usr/bin/env bun

/**
 * Test the exact parameter passing that DiscoveryHandler uses
 */

console.log('🔍 Testing DiscoveryHandler Parameter Passing');
console.log('=============================================\n');

try {
  const { DiscoveryHandler } = await import('./src/research/discovery.ts');
  const { ResearchScope } = await import('./src/research/types.ts');
  
  console.log('✅ Modules imported');
  
  const config = { maxConcurrency: 2, defaultTimeout: 10000 };
  const handler = new DiscoveryHandler(config);
  
  // Create a query object like orchestrator does
  const query = {
    id: 'test-123',
    query: 'test',
    scope: ResearchScope.CODEBASE,
    constraints: { maxFiles: 3, maxDuration: 10000 }
  };
  
  console.log('✅ Query object created');
  console.log('   query.query:', query.query);
  console.log('   query.scope:', query.scope);
  console.log('   query.constraints:', query.constraints);
  
  // Call discover method exactly like DiscoveryHandler does
  console.log('\n🎯 Calling handler.discover(query)...');
  
  const result = await handler.discover(query);
  
  console.log('✅ DiscoveryHandler.discover() completed');
  console.log('   Result source:', result.source);
  console.log('   Files found:', result.files ? result.files.length : 'undefined');
  console.log('   Documentation:', result.documentation ? result.documentation.length : 'undefined');
  console.log('   Patterns:', result.patterns ? result.patterns.length : 'undefined');
  
} catch (error) {
  console.error('❌ Test failed:', error);
  console.error('Error message:', error.message);
  
  if (error.message && error.message.includes('ResearchScope is not defined')) {
    console.error('\n🔍 FOUND THE ISSUE! ResearchScope is not accessible in locator methods');
    console.error('This suggests the enum value is not being passed correctly');
  }
}