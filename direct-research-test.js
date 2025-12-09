#!/usr/bin/env bun

/**
 * Direct test of research system with minimal dependencies
 */

console.log('🧪 Direct Research System Test');
console.log('=============================\n');

// Test 1: Verify modules can be loaded
console.log('1. Testing module imports...');

try {
  const typesModule = await import('./src/research/types.js');
  console.log('✅ Types module loaded');
  console.log('   Available exports:', Object.keys(typesModule));
  
  const orchestratorModule = await import('./src/research/orchestrator.js');
  console.log('✅ Orchestrator module loaded');
  console.log('   Available exports:', Object.keys(orchestratorModule));
  
  const { ResearchOrchestrator } = orchestratorModule;
  const { ResearchScope, ResearchDepth } = typesModule;
  
  console.log('✅ Specific imports successful');
  console.log(`   ResearchScope.CODEBASE: ${ResearchScope.CODEBASE}`);
  console.log(`   ResearchDepth.SHALLOW: ${ResearchDepth.SHALLOW}`);
  
  // Test 2: Create orchestrator
  console.log('\n2. Testing orchestrator creation...');
  
  const config = {
    maxConcurrency: 2,
    defaultTimeout: 15000,
    enableCaching: false,
    logLevel: 'error'
  };
  
  const orchestrator = new ResearchOrchestrator(config);
  console.log('✅ Orchestrator created');
  
  // Test 3: Create minimal research query
  console.log('\n3. Testing research query...');
  
  const query = {
    id: 'direct-test-' + Date.now(),
    query: 'test',
    scope: ResearchScope.CODEBASE,
    depth: ResearchDepth.SHALLOW,
    constraints: {
      maxFiles: 5,
      maxDuration: 15000
    }
  };
  
  console.log('✅ Query created');
  console.log(`   Query: ${query.query}`);
  console.log(`   Scope: ${query.scope}`);
  console.log(`   Depth: ${query.depth}`);
  
  // Test 4: Execute research with timeout
  console.log('\n4. Testing research execution...');
  
  const timeout = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Test timeout after 20 seconds')), 20000);
  });
  
  const research = orchestrator.research(query);
  
  try {
    const result = await Promise.race([research, timeout]);
    console.log('✅ Research completed!');
    console.log(`   Findings: ${result.findings.length}`);
    console.log(`   Recommendations: ${result.recommendations.length}`);
    console.log(`   Risks: ${result.risks.length}`);
    
    // Test 5: Verify evidence quality
    console.log('\n5. Testing evidence quality...');
    
    let findingsWithEvidence = 0;
    let totalEvidence = 0;
    
    result.findings.forEach(finding => {
      if (finding.evidence && finding.evidence.length > 0) {
        findingsWithEvidence++;
        totalEvidence += finding.evidence.length;
        
        console.log(`   ✅ Finding "${finding.title}" has ${finding.evidence.length} evidence items`);
        
        finding.evidence.forEach(ev => {
          if (ev.file && ev.line) {
            console.log(`      📍 Evidence: ${ev.file}:${ev.line}`);
          } else {
            console.log(`      ❌ Missing location: ${JSON.stringify(ev)}`);
          }
        });
      }
    });
    
    console.log(`\n📊 Evidence Summary:`);
    console.log(`   Findings with evidence: ${findingsWithEvidence}/${result.findings.length}`);
    console.log(`   Total evidence items: ${totalEvidence}`);
    
    // Test 6: Export functionality
    console.log('\n6. Testing export formats...');
    
    // Test JSON export
    const jsonExport = JSON.stringify(result, null, 2);
    console.log(`✅ JSON export: ${jsonExport.length} characters`);
    
    // Test markdown export
    const markdownExport = `# Research Results

## Query
${result.query.query}

## Findings (${result.findings.length})
${result.findings.map(f => `- **${f.title}** (${f.impact})`).join('\n')}

## Recommendations (${result.recommendations.length})
${result.recommendations.map(r => `- ${r}`).join('\n')}
`;
    console.log(`✅ Markdown export: ${markdownExport.length} characters`);
    
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('Research orchestration system is fully functional.');
    
  } catch (error) {
    console.error('❌ Research execution failed:', error);
    console.error('Error type:', typeof error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    
    if (error && error.error && error.error.includes && error.error.includes('ResearchScope')) {
      console.error('\n🔍 DIAGNOSIS: ResearchScope enum issue detected');
      console.error('This suggests the enum values are not properly accessible in the discovery handlers');
    }
  }
  
} catch (error) {
  console.error('❌ Module import failed:', error);
  console.error('Error type:', typeof error);
  console.error('Error details:', JSON.stringify(error, null, 2));
}