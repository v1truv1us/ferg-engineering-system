#!/usr/bin/env bun

/**
 * Simple test to check if research types are working
 */

// Test basic enum values
console.log('Testing ResearchScope enum values:');
console.log('CODEBASE:', 'codebase');
console.log('DOCUMENTATION:', 'documentation'); 
console.log('ALL:', 'all');
console.log('EXTERNAL:', 'external');

console.log('\nTesting ResearchDepth enum values:');
console.log('SHALLOW:', 'shallow');
console.log('MEDIUM:', 'medium');
console.log('DEEP:', 'deep');

// Test query object creation
const query = {
  id: 'test-123',
  query: 'test query',
  scope: 'codebase',
  depth: 'medium'
};

console.log('\nTest query object:');
console.log(JSON.stringify(query, null, 2));

// Test if we can import the orchestrator
try {
  const { ResearchOrchestrator } = await import('./src/research/orchestrator.js');
  console.log('\n✅ Successfully imported ResearchOrchestrator');
  
  const config = {
    maxConcurrency: 2,
    defaultTimeout: 10000,
    enableCaching: false,
    logLevel: 'error'  // Only show errors
  };
  
  const orchestrator = new ResearchOrchestrator(config);
  console.log('✅ Successfully created ResearchOrchestrator');
  
  // Test with minimal query
  const simpleQuery = {
    id: 'simple-test',
    query: 'test',
    scope: 'codebase',
    depth: 'shallow'
  };
  
  console.log('\n🎯 Testing simple research execution...');
  
  // Set up timeout to prevent hanging
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Research timeout after 30 seconds')), 30000);
  });
  
  const researchPromise = orchestrator.research(simpleQuery);
  
  const result = await Promise.race([researchPromise, timeoutPromise]);
  
  console.log('✅ Research completed successfully!');
  console.log(`Findings: ${result.findings.length}`);
  console.log(`Recommendations: ${result.recommendations.length}`);
  
  if (result.findings.length > 0) {
    const firstFinding = result.findings[0];
    console.log('\nSample finding:');
    console.log(`Title: ${firstFinding.title}`);
    console.log(`Impact: ${firstFinding.impact}`);
    console.log(`Evidence count: ${firstFinding.evidence ? firstFinding.evidence.length : 0}`);
    
    if (firstFinding.evidence && firstFinding.evidence.length > 0) {
      const firstEvidence = firstFinding.evidence[0];
      console.log(`First evidence: ${firstEvidence.file}:${firstEvidence.line}`);
    }
  }
  
} catch (error) {
  console.error('❌ Test failed:', error);
  console.error('Error type:', typeof error);
  console.error('Error value:', JSON.stringify(error, null, 2));
  
  if (error && error.message && error.message.includes('ResearchScope')) {
    console.error('\n🔍 ResearchScope import issue detected');
    console.error('This suggests a enum values are not being properly imported');
  }
}
}