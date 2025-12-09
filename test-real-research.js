#!/usr/bin/env bun

/**
 * Test actual research workflow on this codebase
 */

import { ResearchOrchestrator } from './src/research/orchestrator.js';
import { ResearchScope, ResearchDepth } from './src/research/types.js';

console.log('🔍 Testing Research Workflow on Real Codebase');
console.log('==============================================\n');

async function testResearchWorkflow() {
  try {
    // Create orchestrator with real configuration
    const config = {
      maxConcurrency: 3,
      defaultTimeout: 30000,
      enableCaching: false,
      logLevel: 'info',
      outputFormat: 'markdown',
      outputPath: '/tmp/research-test-output.md'
    };
    
    const orchestrator = new ResearchOrchestrator(config);
    console.log('✅ Orchestrator created with real config');

    // Set up progress tracking
    orchestrator.on('progress', (progress) => {
      const percentage = (progress.completedSteps / progress.totalSteps * 100).toFixed(1);
      console.log(`📊 Progress: ${progress.currentPhase} - ${percentage}% (${progress.completedSteps}/${progress.totalSteps})`);
    });

    orchestrator.on('error', (error) => {
      console.error(`❌ Research error in ${error.phase}: ${error.error}`);
    });

    // Test with a simple, focused query
    const query = {
      id: `real-test-${Date.now()}`,
      query: 'authentication patterns',
      scope: ResearchScope.CODEBASE,
      depth: ResearchDepth.SHALLOW,  // Use shallow for quick test
      constraints: {
        maxFiles: 20,  // Limit to 20 files for quick test
        maxDuration: 30000,  // 30 second limit
        excludePatterns: ['node_modules', '.git', 'dist']
      }
    };

    console.log(`\n🎯 Starting research: "${query.query}"`);
    console.log(`📋 Scope: ${query.scope}`);
    console.log(`⚡ Depth: ${query.depth}`);
    console.log(`📁 File limit: ${query.constraints.maxFiles}`);
    
    const startTime = Date.now();
    
    // Execute research
    const result = await orchestrator.research(query);
    
    const duration = Date.now() - startTime;
    
    console.log('\n🎯 Research Results');
    console.log('==================');
    console.log(`⏱️  Total Duration: ${duration}ms`);
    console.log(`📊 Findings: ${result.findings.length}`);
    console.log(`💡 Recommendations: ${result.recommendations.length}`);
    console.log(`⚠️  Risks: ${result.risks.length}`);
    
    if (result.findings.length > 0) {
      console.log('\n🔍 Sample Findings:');
      result.findings.slice(0, 3).forEach((finding, i) => {
        console.log(`  ${i + 1}. ${finding.title}`);
        console.log(`     Impact: ${finding.impact}`);
        console.log(`     Confidence: ${(finding.confidence * 100).toFixed(1)}%`);
        if (finding.evidence && finding.evidence.length > 0) {
          console.log(`     Evidence: ${finding.evidence.length} sources`);
          finding.evidence.slice(0, 2).forEach(ev => {
            console.log(`       - ${ev.file}:${ev.line}`);
          });
        }
      });
    }

    if (result.recommendations.length > 0) {
      console.log('\n💡 Sample Recommendations:');
      result.recommendations.slice(0, 3).forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    // Test evidence quality
    console.log('\n🔍 Evidence Quality Check:');
    let totalEvidence = 0;
    let findingsWithEvidence = 0;
    
    result.findings.forEach(finding => {
      if (finding.evidence && finding.evidence.length > 0) {
        findingsWithEvidence++;
        totalEvidence += finding.evidence.length;
        
        // Check if evidence has file paths and line numbers
        finding.evidence.forEach(ev => {
          if (ev.file && ev.line) {
            console.log(`   ✅ Evidence with location: ${ev.file}:${ev.line}`);
          } else {
            console.log(`   ❌ Evidence missing location: ${JSON.stringify(ev)}`);
          }
        });
      }
    });
    
    console.log(`📊 Evidence Summary:`);
    console.log(`   Findings with evidence: ${findingsWithEvidence}/${result.findings.length}`);
    console.log(`   Total evidence items: ${totalEvidence}`);
    
    // Save results to test file
    const outputContent = `# Research Test Results

## Query
${result.query.query}

## Results Summary
- Duration: ${duration}ms
- Findings: ${result.findings.length}
- Recommendations: ${result.recommendations.length}
- Risks: ${result.risks.length}

## Findings
${result.findings.map(f => `- ${f.title} (${f.impact})`).join('\n')}

## Recommendations
${result.recommendations.map(r => `- ${r}`).join('\n')}
`;

    require('fs').writeFileSync('/tmp/research-test-output.md', outputContent);
    console.log(`\n📄 Results saved to: /tmp/research-test-output.md`);
    
    return {
      success: true,
      duration,
      findingsCount: result.findings.length,
      evidenceCount: totalEvidence,
      findingsWithEvidence
    };
    
  } catch (error) {
    console.error('❌ Research workflow test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testResearchWorkflow().then(result => {
  if (result.success) {
    console.log('\n🎉 Research Workflow Test PASSED!');
    console.log('=====================================');
    console.log(`✅ Duration: ${result.duration}ms`);
    console.log(`✅ Findings: ${result.findingsCount}`);
    console.log(`✅ Evidence items: ${result.evidenceCount}`);
    console.log(`✅ Findings with evidence: ${result.findingsWithEvidence}`);
  } else {
    console.log('\n❌ Research Workflow Test FAILED!');
    console.log('====================================');
    console.log(`Error: ${result.error}`);
  }
}).catch(error => {
  console.error('💥 Test script failed:', error);
});