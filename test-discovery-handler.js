#!/usr/bin/env bun

/**
 * Test DiscoveryHandler directly to isolate ResearchScope issue
 */

console.log('🔍 Testing DiscoveryHandler Directly');
console.log('===================================\n');

try {
  const { DiscoveryHandler } = await import('./src/research/discovery.js');
  const { ResearchScope } = await import('./src/research/types.js');
  
  console.log('✅ Modules imported successfully');
  
  const config = { maxConcurrency: 2, defaultTimeout: 10000 };
  const handler = new DiscoveryHandler(config);
  
  console.log('✅ DiscoveryHandler created');
  
  // Test discover method directly
  const query = 'test';
  const scope = ResearchScope.CODEBASE;
  const constraints = { maxFiles: 5, maxDuration: 10000 };
  
  console.log('\n🎯 Testing DiscoveryHandler.discover() directly...');
  console.log('   Query:', query);
  console.log('   Scope:', scope);
  console.log('   Scope type:', typeof scope);
  
  const result = await handler.discover(query, scope, constraints);
  
  console.log('✅ DiscoveryHandler.discover() completed successfully');
  console.log('   Source:', result.source);
  console.log('   Files:', result.files.length);
  
} catch (error) {
  console.error('❌ DiscoveryHandler test failed:', error);
  console.error('Error type:', typeof error);
  console.error('Error details:', JSON.stringify(error, null, 2));
  
  if (error.message && error.message.includes('ResearchScope')) {
    console.error('\n🔍 ResearchScope issue detected in DiscoveryHandler');
  }
}