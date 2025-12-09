#!/usr/bin/env bun

/**
 * Test each locator individually to find the ResearchScope issue
 */

console.log('🔍 Testing Individual Locators');
console.log('===============================\n');

const { ResearchScope } = await import('./src/research/types.js');

async function testLocator(locatorName, LocatorClass) {
  try {
    console.log(`\n🎯 Testing ${locatorName}...`);
    
    const config = { maxConcurrency: 1, defaultTimeout: 5000 };
    const locator = new LocatorClass(config);
    
    // Test with both string and enum scope
    const testQuery = 'authentication';
    const testConstraints = { maxFiles: 3, maxDuration: 5000 };
    
    console.log('  Testing with string scope...');
    const result1 = await locator.discover(testQuery, 'codebase', testConstraints);
    console.log(`  ✅ String scope works: ${result1.files.length} files`);
    
    console.log('  Testing with enum scope...');
    const result2 = await locator.discover(testQuery, ResearchScope.CODEBASE, testConstraints);
    console.log(`  ✅ Enum scope works: ${result2.files.length} files`);
    
    return true;
  } catch (error) {
    console.error(`  ❌ ${locatorName} failed:`, error.message);
    return false;
  }
}

async function runTests() {
  const { CodebaseLocator, ResearchLocator, PatternFinder } = await import('./src/research/discovery.js');
  
  const tests = [
    ['CodebaseLocator', CodebaseLocator],
    ['ResearchLocator', ResearchLocator], 
    ['PatternFinder', PatternFinder]
  ];
  
  let passed = 0;
  let total = tests.length;
  
  for (const [name, LocatorClass] of tests) {
    const success = await testLocator(name, LocatorClass);
    if (success) passed++;
  }
  
  console.log(`\n📊 Test Results: ${passed}/${total} passed`);
  
  if (passed === total) {
    console.log('🎉 All locators work with ResearchScope enum!');
  } else {
    console.log('❌ Some locators have ResearchScope issues');
  }
}

runTests().catch(error => {
  console.error('💥 Test suite failed:', error);
});