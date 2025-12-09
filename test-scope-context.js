#!/usr/bin/env bun

/**
 * Test to check if ResearchScope enum is accessible in locator context
 */

console.log('🔍 Testing ResearchScope in Locator Context');
console.log('==========================================\n');

// Test by creating a locator instance and calling its methods
try {
  // Import the modules
  const typesModule = await import('./src/research/types.js');
  const { CodebaseLocator } = await import('./src/research/discovery.js');
  
  console.log('✅ Modules imported');
  console.log('   ResearchScope available:', 'ResearchScope' in typesModule);
  console.log('   ResearchScope values:', Object.keys(typesModule).filter(k => k.includes('Scope')));
  
  // Create a locator instance
  const config = { maxConcurrency: 1, defaultTimeout: 5000 };
  const locator = new CodebaseLocator(config);
  
  console.log('✅ CodebaseLocator created');
  
  // Test the method that's failing
  console.log('\n🎯 Testing the failing method...');
  
  // Create a test scope parameter
  const testScope = typesModule.ResearchScope.CODEBASE;
  console.log('   Test scope value:', testScope);
  console.log('   Test scope type:', typeof testScope);
  
  // Call the method with explicit parameters
  const result = await locator.discover(
    'test query',           // query: string
    testScope,              // scope: ResearchScope
    { maxFiles: 3 }         // constraints
  );
  
  console.log('✅ Method call successful');
  console.log('   Result source:', result.source);
  console.log('   Files found:', result.files.length);
  
} catch (error) {
  console.error('❌ Test failed:', error);
  console.error('Error message:', error.message);
  console.error('Error stack:', error.stack);
}