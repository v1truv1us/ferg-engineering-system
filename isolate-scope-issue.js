#!/usr/bin/env bun

/**
 * Isolate the ResearchScope issue by testing individual components
 */

console.log('🔍 Isolating ResearchScope Issue');
console.log('==================================\n');

// Test 1: Check if we can import and use ResearchScope directly
try {
  const { ResearchScope } = await import('./src/research/types.js');
  console.log('✅ ResearchScope imported successfully');
  console.log('   Values:', Object.values(ResearchScope));
  
  // Test direct usage
  const testScope = ResearchScope.CODEBASE;
  console.log('✅ Direct usage works:', testScope);
  
} catch (error) {
  console.error('❌ ResearchScope import failed:', error);
}

// Test 2: Test CodebaseLocator directly
try {
  const { CodebaseLocator } = await import('./src/research/discovery.js');
  console.log('✅ CodebaseLocator imported successfully');
  
  const config = { maxConcurrency: 2, defaultTimeout: 10000 };
  const locator = new CodebaseLocator(config);
  console.log('✅ CodebaseLocator created successfully');
  
  // Test discover method with minimal parameters
  const testQuery = 'test';
  const testScope = 'codebase';  // Use string instead of enum
  const testConstraints = { maxFiles: 5, maxDuration: 10000 };
  
  console.log('\n🎯 Testing CodebaseLocator.discover()...');
  console.log('   Query:', testQuery);
  console.log('   Scope:', testScope);
  console.log('   Constraints:', testConstraints);
  
  const result = await locator.discover(testQuery, testScope, testConstraints);
  
  console.log('✅ CodebaseLocator.discover() completed successfully');
  console.log('   Result source:', result.source);
  console.log('   Files found:', result.files.length);
  
  if (result.files.length > 0) {
    const firstFile = result.files[0];
    console.log('   Sample file:', firstFile.path);
    console.log('   Relevance:', firstFile.relevance);
  }
  
} catch (error) {
  console.error('❌ CodebaseLocator test failed:', error);
  console.error('Error type:', typeof error);
  console.error('Error details:', JSON.stringify(error, null, 2));
}

console.log('\n🎯 Isolation test complete');