/**
 * Synthesis phase handlers for research orchestration.
 * Generates comprehensive research reports with analysis results.
 */

import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import {
  SynthesisHandler,
  SynthesisReport,
  AnalysisResult,
  ResearchQuery,
  Evidence,
  Insight,
  Relationship,
  DetailedFinding,
  CodeReference,
  ArchitectureInsight,
  Recommendation,
  Risk,
  ConfidenceLevel,
  ResearchScope,
  ResearchDepth,
  ResearchExportFormat,
  ResearchExportOptions
} from './types.js';

/**
 * Synthesis Handler
 * Generates comprehensive research reports from analysis results
 */
export class SynthesisHandlerImpl implements SynthesisHandler {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async synthesize(query: ResearchQuery, analysisResults: AnalysisResult[]): Promise<SynthesisReport> {
    const startTime = Date.now();
    
    try {
      // 1. Collect all analysis data
      const allInsights = this.collectAllInsights(analysisResults);
      const allEvidence = this.collectAllEvidence(analysisResults);
      const allRelationships = this.collectAllRelationships(analysisResults);
      
      // 2. Generate synopsis
      const synopsis = this.generateSynopsis(query, allInsights, allEvidence);
      
      // 3. Generate summary
      const summary = this.generateSummary(query, allInsights, allEvidence);
      
      // 4. Generate detailed findings
      const findings = this.generateDetailedFindings(allInsights, allEvidence);
      
      // 5. Generate code references
      const codeReferences = this.generateCodeReferences(allEvidence);
      
      // 6. Generate architecture insights
      const architectureInsights = this.generateArchitectureInsights(allInsights, allRelationships);
      
      // 7. Generate recommendations
      const recommendations = this.generateRecommendations(findings, allInsights);
      
      // 8. Generate risks
      const risks = this.generateRisks(findings, allInsights);
      
      // 9. Generate open questions
      const openQuestions = this.generateOpenQuestions(query, allInsights, allEvidence);
      
      // 10. Calculate overall confidence
      const confidence = this.calculateOverallConfidence(allInsights, allEvidence);
      
      const executionTime = Date.now() - startTime;
      
      return {
        id: `report-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        query: query.query,
        synopsis,
        summary,
        findings,
        codeReferences,
        architectureInsights,
        recommendations,
        risks,
        openQuestions,
        confidence,
        agentsUsed: analysisResults.map(result => result.source),
        executionTime,
        generatedAt: new Date(),
        metadata: {
          totalFiles: this.countUniqueFiles(allEvidence),
          totalInsights: allInsights.length,
          totalEvidence: allEvidence.length,
          scope: query.scope,
          depth: query.depth
        }
      };
    } catch (error) {
      throw new Error(`Synthesis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private collectAllInsights(analysisResults: AnalysisResult[]): Insight[] {
    const insights: Insight[] = [];
    
    for (const result of analysisResults) {
      insights.push(...result.insights);
    }
    
    // Remove duplicates and sort by impact
    const uniqueInsights = insights.filter((insight, index, self) => 
      index === self.findIndex(i => i.title === insight.title && i.description === insight.description)
    );
    
    return uniqueInsights.sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  }

  private collectAllEvidence(analysisResults: AnalysisResult[]): Evidence[] {
    const evidence: Evidence[] = [];
    
    for (const result of analysisResults) {
      evidence.push(...result.evidence);
    }
    
    // Remove duplicates and sort by relevance
    const uniqueEvidence = evidence.filter((ev, index, self) => 
      index === self.findIndex(e => e.content === ev.content && e.file === ev.file)
    );
    
    return uniqueEvidence.sort((a, b) => b.relevance - a.relevance);
  }

  private collectAllRelationships(analysisResults: AnalysisResult[]): Relationship[] {
    const relationships: Relationship[] = [];
    
    for (const result of analysisResults) {
      relationships.push(...result.relationships);
    }
    
    // Remove duplicates and sort by strength
    const uniqueRelationships = relationships.filter((rel, index, self) => 
      index === self.findIndex(r => r.source === rel.source && r.target === rel.target)
    );
    
    return uniqueRelationships.sort((a, b) => b.strength - a.strength);
  }

  private generateSynopsis(query: ResearchQuery, insights: Insight[], evidence: Evidence[]): string {
    const highImpactInsights = insights.filter(i => i.impact === 'high');
    const totalFiles = this.countUniqueFiles(evidence);
    
    let synopsis = `Research analysis for "${query.query}" `;
    
    if (query.scope === ResearchScope.CODEBASE) {
      synopsis += `across the codebase `;
    } else if (query.scope === ResearchScope.DOCUMENTATION) {
      synopsis += `across documentation `;
    } else {
      synopsis += `across all available sources `;
    }
    
    synopsis += `revealed ${insights.length} key insights from ${totalFiles} files`;
    
    if (highImpactInsights.length > 0) {
      synopsis += `, with ${highImpactInsights.length} high-impact findings`;
    }
    
    synopsis += `. The analysis identified patterns in code structure, documentation quality, and architectural decisions that provide a comprehensive understanding of the current state.`;
    
    return synopsis;
  }

  private generateSummary(query: ResearchQuery, insights: Insight[], evidence: Evidence[]): string[] {
    const summary: string[] = [];
    
    // Overall findings summary
    summary.push(`Found ${insights.length} insights across ${evidence.length} evidence points`);
    
    // Categorize insights
    const insightsByCategory = this.groupInsightsByCategory(insights);
    const categories = Object.keys(insightsByCategory);
    
    if (categories.length > 0) {
      summary.push(`Key areas identified: ${categories.join(', ')}`);
    }
    
    // Impact summary
    const highImpactInsights = insights.filter(i => i.impact === 'high');
    const mediumImpactInsights = insights.filter(i => i.impact === 'medium');
    
    if (highImpactInsights.length > 0) {
      summary.push(`${highImpactInsights.length} high-impact findings require immediate attention`);
    }
    
    if (mediumImpactInsights.length > 0) {
      summary.push(`${mediumImpactInsights.length} medium-impact findings should be addressed in the near term`);
    }
    
    // Evidence quality summary
    const highConfidenceEvidence = evidence.filter(e => e.confidence === ConfidenceLevel.HIGH);
    if (highConfidenceEvidence.length > 0) {
      summary.push(`${highConfidenceEvidence.length} high-confidence evidence points support the findings`);
    }
    
    // Scope-specific summary
    if (query.scope === ResearchScope.CODEBASE) {
      const codeEvidence = evidence.filter(e => e.type === 'code');
      summary.push(`Analysis focused on ${codeEvidence.length} code elements across the codebase`);
    } else if (query.scope === ResearchScope.DOCUMENTATION) {
      const docEvidence = evidence.filter(e => e.type === 'documentation');
      summary.push(`Analysis reviewed ${docEvidence.length} documentation elements`);
    }
    
    return summary;
  }

  private generateDetailedFindings(insights: Insight[], evidence: Evidence[]): DetailedFinding[] {
    const findings: DetailedFinding[] = [];
    
    // Group insights by category
    const insightsByCategory = this.groupInsightsByCategory(insights);
    
    for (const [category, categoryInsights] of Object.entries(insightsByCategory)) {
      // Sort by impact
      const sortedInsights = categoryInsights.sort((a, b) => {
        const impactOrder = { high: 3, medium: 2, low: 1 };
        return impactOrder[b.impact] - impactOrder[a.impact];
      });
      
      // Create finding for each significant insight
      for (const insight of sortedInsights.slice(0, 5)) { // Limit to top 5 per category
        findings.push({
          id: `finding-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          category,
          title: insight.title,
          description: insight.description,
          evidence: insight.evidence,
          confidence: insight.confidence,
          impact: insight.impact,
          source: insight.type
        });
      }
    }
    
    return findings;
  }

  private generateCodeReferences(evidence: Evidence[]): CodeReference[] {
    const codeEvidence = evidence.filter(e => e.type === 'code' && e.file);
    const codeReferences: CodeReference[] = [];
    
    // Group by file
    const evidenceByFile = this.groupEvidenceByFile(codeEvidence);
    
    for (const [file, fileEvidence] of Object.entries(evidenceByFile)) {
      if (fileEvidence.length > 0) {
        // Get line range
        const lines = fileEvidence.map(e => e.line).filter(Boolean) as number[];
        const minLine = Math.min(...lines);
        const maxLine = Math.max(...lines);
        
        // Determine category based on evidence types
        const categories = [...new Set(fileEvidence.map(e => e.type))];
        const category = categories[0] || 'general';
        
        codeReferences.push({
          path: file,
          lines: lines.length === 1 ? lines[0] : [minLine, maxLine],
          description: this.generateCodeDescription(fileEvidence),
          relevance: Math.max(...fileEvidence.map(e => e.relevance)),
          category
        });
      }
    }
    
    return codeReferences.sort((a, b) => b.relevance - a.relevance);
  }

  private generateCodeDescription(evidence: Evidence[]): string {
    const types = [...new Set(evidence.map(e => e.type))];
    const count = evidence.length;
    
    if (types.includes('class-definition')) {
      return `Contains ${count} class definitions and related code elements`;
    } else if (types.includes('function-definition')) {
      return `Contains ${count} function definitions and implementations`;
    } else if (types.includes('import-statement')) {
      return `Contains ${count} import statements showing dependencies`;
    } else if (types.includes('technical-debt')) {
      return `Contains ${count} technical debt markers requiring attention`;
    } else {
      return `Contains ${count} significant code elements`;
    }
  }

  private generateArchitectureInsights(insights: Insight[], relationships: Relationship[]): ArchitectureInsight[] {
    const architectureInsights: ArchitectureInsight[] = [];
    
    // Find architectural insights from analysis
    const archInsights = insights.filter(i => 
      i.category === 'architecture' || 
      i.category === 'pattern-analysis' ||
      i.title.toLowerCase().includes('architecture') ||
      i.title.toLowerCase().includes('pattern')
    );
    
    for (const insight of archInsights.slice(0, 8)) { // Limit to top 8
      const relatedEvidence = insight.evidence.slice(0, 5); // Limit evidence
      const components = this.extractComponentsFromInsight(insight);
      
      architectureInsights.push({
          id: `arch-insight-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: this.mapInsightTypeToArchType(insight.type),
        title: insight.title,
        description: insight.description,
        components,
        impact: insight.impact,
        evidence: relatedEvidence
      });
    }
    
    // Add relationship-based insights
    const strongRelationships = relationships.filter(r => r.strength > 0.7);
    if (strongRelationships.length > 0) {
      architectureInsights.push({
          id: `arch-relationships-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'pattern',
        title: 'Strong architectural relationships detected',
        description: `Found ${strongRelationships.length} strong relationships between components, indicating well-structured architecture`,
        components: this.extractComponentsFromRelationships(strongRelationships),
        impact: 'medium',
        evidence: strongRelationships.slice(0, 3).flatMap(r => r.evidence)
      });
    }
    
    return architectureInsights;
  }

  private mapInsightTypeToArchType(insightType: string): 'pattern' | 'decision' | 'concern' | 'recommendation' {
    switch (insightType) {
      case 'pattern': return 'pattern';
      case 'decision': return 'decision';
      case 'finding': return 'concern';
      case 'relationship': return 'pattern';
      default: return 'concern';
    }
  }

  private extractComponentsFromInsight(insight: Insight): string[] {
    // Extract component names from evidence
    const components: string[] = [];
    
    // This is a simplified implementation
    // In practice, you'd parse the evidence to extract actual component names
    if (insight.description.includes('class')) {
      components.push('Classes');
    }
    if (insight.description.includes('function')) {
      components.push('Functions');
    }
    if (insight.description.includes('module')) {
      components.push('Modules');
    }
    if (insight.description.includes('service')) {
      components.push('Services');
    }
    
    return components.length > 0 ? components : ['General Components'];
  }

  private extractComponentsFromRelationships(relationships: Relationship[]): string[] {
    const components: string[] = [];
    
    for (const rel of relationships) {
      components.push(rel.source, rel.target);
    }
    
    return [...new Set(components)];
  }

  private generateRecommendations(findings: DetailedFinding[], insights: Insight[]): Recommendation[] {
    const recommendations: Recommendation[] = [];
    
    // Group findings by impact
    const highImpactFindings = findings.filter(f => f.impact === 'high');
    const mediumImpactFindings = findings.filter(f => f.impact === 'medium');
    
    // Generate immediate recommendations from high-impact findings
    for (const finding of highImpactFindings.slice(0, 5)) {
      recommendations.push({
          id: `rec-immediate-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'immediate',
        priority: 'critical',
        title: `Address: ${finding.title}`,
        description: `Immediate action required to resolve ${finding.title}`,
        rationale: `This high-impact finding in ${finding.category} requires immediate attention to prevent potential issues`,
        effort: this.estimateEffort(finding),
        impact: finding.impact,
        dependencies: []
      });
    }
    
    // Generate short-term recommendations from medium-impact findings
    for (const finding of mediumImpactFindings.slice(0, 3)) {
      recommendations.push({
          id: `rec-short-term-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'short-term',
        priority: 'medium',
        title: `Improve: ${finding.title}`,
        description: `Plan improvements for ${finding.title} in the next development cycle`,
        rationale: `This medium-impact finding should be addressed to improve overall quality`,
        effort: this.estimateEffort(finding),
        impact: finding.impact,
        dependencies: []
      });
    }
    
    // Generate architectural recommendations
    const archInsights = insights.filter(i => i.category === 'architecture');
    if (archInsights.length > 0) {
      recommendations.push({
          id: `rec-arch-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'long-term',
        priority: 'medium',
        title: 'Architectural improvements',
        description: 'Consider implementing architectural improvements based on identified patterns',
        rationale: 'Analysis revealed architectural patterns that could be optimized for better maintainability',
        effort: 'high',
        impact: 'high',
        dependencies: []
      });
    }
    
    return recommendations;
  }

  private estimateEffort(finding: DetailedFinding): 'low' | 'medium' | 'high' {
    // Simple effort estimation based on category and impact
    if (finding.category === 'technical-debt') return 'medium';
    if (finding.category === 'complexity-analysis') return 'high';
    if (finding.category === 'documentation-quality') return 'low';
    if (finding.impact === 'high') return 'medium';
    return 'low';
  }

  private generateRisks(findings: DetailedFinding[], insights: Insight[]): Risk[] {
    const risks: Risk[] = [];
    
    // Generate risks from high-impact findings
    const highImpactFindings = findings.filter(f => f.impact === 'high');
    
    for (const finding of highImpactFindings.slice(0, 3)) {
      const riskType = this.mapCategoryToRiskType(finding.category);
      
      risks.push({
          id: `risk-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: riskType,
        severity: finding.impact === 'high' ? 'critical' : 'high',
        title: `Risk: ${finding.title}`,
        description: `${finding.description} This poses a risk to system stability and maintainability`,
        probability: this.assessRiskProbability(finding),
        impact: finding.impact,
        mitigation: this.generateMitigation(finding),
        evidence: finding.evidence
      });
    }
    
    // Generate technical debt risks
    const debtFindings = findings.filter(f => f.category === 'technical-debt');
    if (debtFindings.length > 2) {
      risks.push({
          id: `risk-debt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'maintainability',
        severity: 'high',
        title: 'Accumulated technical debt',
        description: `Found ${debtFindings.length} technical debt items that could impact future development`,
        probability: 'medium',
        impact: 'high',
        mitigation: 'Implement regular refactoring sprints and address technical debt items systematically',
        evidence: debtFindings.slice(0, 3).map(f => f.id)
      });
    }
    
    return risks;
  }

  private mapCategoryToRiskType(category: string): 'technical' | 'architectural' | 'security' | 'performance' | 'maintainability' {
    switch (category) {
      case 'complexity-analysis': return 'maintainability';
      case 'technical-debt': return 'technical';
      case 'architecture': return 'architectural';
      case 'pattern-analysis': return 'architectural';
      case 'documentation-quality': return 'maintainability';
      default: return 'technical';
    }
  }

  private assessRiskProbability(finding: DetailedFinding): 'low' | 'medium' | 'high' {
    if (finding.confidence === ConfidenceLevel.HIGH) return 'high';
    if (finding.confidence === ConfidenceLevel.MEDIUM) return 'medium';
    return 'low';
  }

  private generateMitigation(finding: DetailedFinding): string {
    switch (finding.category) {
      case 'complexity-analysis':
        return 'Refactor complex components into smaller, more manageable pieces';
      case 'technical-debt':
        return 'Address technical debt items through planned refactoring efforts';
      case 'documentation-quality':
        return 'Improve documentation structure and add comprehensive explanations';
      case 'architecture':
        return 'Review and improve architectural patterns and decisions';
      default:
        return 'Investigate the finding and implement appropriate corrective actions';
    }
  }

  private generateOpenQuestions(query: ResearchQuery, insights: Insight[], evidence: Evidence[]): string[] {
    const questions: string[] = [];
    
    // Generate questions based on gaps in analysis
    if (insights.length === 0) {
      questions.push('Why were no significant insights found? Is the query too broad or the scope too limited?');
    }
    
    if (evidence.length < 10) {
      questions.push('Is there additional evidence that could be collected to support more comprehensive analysis?');
    }
    
    // Generate questions based on findings
    const categories = Object.keys(this.groupInsightsByCategory(insights));
    if (!categories.includes('architecture')) {
      questions.push('What architectural patterns and decisions should be further investigated?');
    }
    
    if (!categories.includes('performance')) {
      questions.push('Are there performance considerations that should be analyzed?');
    }
    
    // Generate scope-specific questions
    if (query.scope === ResearchScope.CODEBASE) {
      questions.push('How does the codebase structure align with industry best practices and standards?');
    } else if (query.scope === ResearchScope.DOCUMENTATION) {
      questions.push('How can the documentation be improved to better support development and maintenance?');
    }
    
    // Generate forward-looking questions
    questions.push('What steps should be taken to address the identified findings and risks?');
    questions.push('How can the research process be improved for future analyses?');
    
    return questions.slice(0, 5); // Limit to 5 questions
  }

  private calculateOverallConfidence(insights: Insight[], evidence: Evidence[]): ConfidenceLevel {
    if (insights.length === 0 && evidence.length === 0) return ConfidenceLevel.LOW;
    
    const insightScores = insights.map(i => this.confidenceToNumber(i.confidence));
    const evidenceScores = evidence.map(e => this.confidenceToNumber(e.confidence));
    
    const allScores = [...insightScores, ...evidenceScores];
    if (allScores.length === 0) return ConfidenceLevel.LOW;
    
    const averageScore = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    
    if (averageScore >= 0.8) return ConfidenceLevel.HIGH;
    if (averageScore >= 0.6) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  private confidenceToNumber(confidence: ConfidenceLevel): number {
    switch (confidence) {
      case ConfidenceLevel.HIGH: return 0.9;
      case ConfidenceLevel.MEDIUM: return 0.6;
      case ConfidenceLevel.LOW: return 0.3;
      default: return 0.1;
    }
  }

  private groupInsightsByCategory(insights: Insight[]): Record<string, Insight[]> {
    const grouped: Record<string, Insight[]> = {};
    
    for (const insight of insights) {
      if (!grouped[insight.category]) grouped[insight.category] = [];
      grouped[insight.category].push(insight);
    }
    
    return grouped;
  }

  private groupEvidenceByFile(evidence: Evidence[]): Record<string, Evidence[]> {
    const grouped: Record<string, Evidence[]> = {};
    
    for (const item of evidence) {
      if (item.file) {
        if (!grouped[item.file]) grouped[item.file] = [];
        grouped[item.file].push(item);
      }
    }
    
    return grouped;
  }

  private countUniqueFiles(evidence: Evidence[]): number {
    const files = new Set(evidence.filter(e => e.file).map(e => e.file));
    return files.size;
  }

  /**
   * Export research report to specified format
   */
  async exportReport(report: SynthesisReport, options: ResearchExportOptions): Promise<string> {
    const outputPath = options.outputPath || `research-report-${Date.now()}.${options.format}`;
    
    switch (options.format) {
      case ResearchExportFormat.MARKDOWN:
        return this.exportToMarkdown(report, outputPath, options);
      case ResearchExportFormat.JSON:
        return this.exportToJSON(report, outputPath, options);
      case ResearchExportFormat.HTML:
        return this.exportToHTML(report, outputPath, options);
      case ResearchExportFormat.PDF:
        throw new Error('PDF export not yet implemented');
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  private async exportToMarkdown(report: SynthesisReport, outputPath: string, options: ResearchExportOptions): Promise<string> {
    let content = this.generateMarkdownContent(report, options);
    
    try {
      await writeFile(outputPath, content, 'utf-8');
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to export markdown report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateMarkdownContent(report: SynthesisReport, options: ResearchExportOptions): string {
    let content = '';
    
    // YAML frontmatter
    content += '---\n';
    content += `id: ${report.id}\n`;
    content += `query: "${report.query}"\n`;
    content += `generated: ${report.generatedAt.toISOString()}\n`;
    content += `confidence: ${report.confidence}\n`;
    content += `scope: ${report.metadata.scope}\n`;
    content += `depth: ${report.metadata.depth}\n`;
    content += `agents: [${report.agentsUsed.join(', ')}]\n`;
    content += `executionTime: ${report.executionTime}ms\n`;
    content += '---\n\n';
    
    // Title and synopsis
    content += `# Research Report: ${report.query}\n\n`;
    content += `## Synopsis\n\n${report.synopsis}\n\n`;
    
    // Summary
    content += '## Summary\n\n';
    for (const point of report.summary) {
      content += `- ${point}\n`;
    }
    content += '\n';
    
    // Findings
    if (options.includeEvidence && report.findings.length > 0) {
      content += '## Key Findings\n\n';
      for (const finding of report.findings) {
        content += `### ${finding.title}\n\n`;
        content += `**Category:** ${finding.category}  \n`;
        content += `**Impact:** ${finding.impact}  \n`;
        content += `**Confidence:** ${finding.confidence}\n\n`;
        content += `${finding.description}\n\n`;
      }
    }
    
    // Code references
    if (options.includeCodeReferences && report.codeReferences.length > 0) {
      content += '## Code References\n\n';
      for (const ref of report.codeReferences.slice(0, 10)) { // Limit to 10
        content += `### ${ref.path}\n\n`;
        content += `**Lines:** ${typeof ref.lines === 'number' ? ref.lines : `${ref.lines[0]}-${ref.lines[1]}`}  \n`;
        content += `**Category:** ${ref.category}  \n`;
        content += `**Relevance:** ${ref.relevance.toFixed(2)}\n\n`;
        content += `${ref.description}\n\n`;
      }
    }
    
    // Architecture insights
    if (report.architectureInsights.length > 0) {
      content += '## Architecture Insights\n\n';
      for (const insight of report.architectureInsights) {
        content += `### ${insight.title}\n\n`;
        content += `**Type:** ${insight.type}  \n`;
        content += `**Impact:** ${insight.impact}\n\n`;
        content += `${insight.description}\n\n`;
      }
    }
    
    // Recommendations
    if (report.recommendations.length > 0) {
      content += '## Recommendations\n\n';
      for (const rec of report.recommendations) {
        content += `### ${rec.title}\n\n`;
        content += `**Type:** ${rec.type}  \n`;
        content += `**Priority:** ${rec.priority}  \n`;
        content += `**Effort:** ${rec.effort}  \n`;
        content += `**Impact:** ${rec.impact}\n\n`;
        content += `${rec.description}\n\n`;
        content += `**Rationale:** ${rec.rationale}\n\n`;
      }
    }
    
    // Risks
    if (report.risks.length > 0) {
      content += '## Risks\n\n';
      for (const risk of report.risks) {
        content += `### ${risk.title}\n\n`;
        content += `**Type:** ${risk.type}  \n`;
        content += `**Severity:** ${risk.severity}  \n`;
        content += `**Probability:** ${risk.probability}\n\n`;
        content += `${risk.description}\n\n`;
        if (risk.mitigation) {
          content += `**Mitigation:** ${risk.mitigation}\n\n`;
        }
      }
    }
    
    // Open questions
    if (report.openQuestions.length > 0) {
      content += '## Open Questions\n\n';
      for (const question of report.openQuestions) {
        content += `- ${question}\n`;
      }
      content += '\n';
    }
    
    // Metadata
    if (options.includeMetadata) {
      content += '## Metadata\n\n';
      content += `- **Total Files:** ${report.metadata.totalFiles}\n`;
      content += `- **Total Insights:** ${report.metadata.totalInsights}\n`;
      content += `- **Total Evidence:** ${report.metadata.totalEvidence}\n`;
      content += `- **Execution Time:** ${report.executionTime}ms\n`;
      content += `- **Agents Used:** ${report.agentsUsed.join(', ')}\n`;
    }
    
    return content;
  }

  private async exportToJSON(report: SynthesisReport, outputPath: string, options: ResearchExportOptions): Promise<string> {
    const jsonContent = JSON.stringify(report, null, 2);
    
    try {
      await writeFile(outputPath, jsonContent, 'utf-8');
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to export JSON report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async exportToHTML(report: SynthesisReport, outputPath: string, options: ResearchExportOptions): Promise<string> {
    const htmlContent = this.generateHTMLContent(report, options);
    
    try {
      await writeFile(outputPath, htmlContent, 'utf-8');
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to export HTML report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private generateHTMLContent(report: SynthesisReport, options: ResearchExportOptions): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Research Report: ${this.escapeHtml(report.query)}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
        .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .finding, .recommendation, .risk { border: 1px solid #ddd; padding: 15px; margin-bottom: 15px; border-radius: 5px; }
        .high-impact { border-left: 5px solid #d32f2f; }
        .medium-impact { border-left: 5px solid #f57c00; }
        .low-impact { border-left: 5px solid #388e3c; }
        .metadata { background-color: #f5f5f5; padding: 15px; border-radius: 5px; }
        code { background-color: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Research Report: ${this.escapeHtml(report.query)}</h1>
        <p><strong>Generated:</strong> ${report.generatedAt.toLocaleString()}</p>
        <p><strong>Confidence:</strong> ${report.confidence}</p>
        <p><strong>Synopsis:</strong> ${this.escapeHtml(report.synopsis)}</p>
    </div>
    
    <div class="section">
        <h2>Summary</h2>
        <ul>
            ${report.summary.map(point => `<li>${this.escapeHtml(point)}</li>`).join('')}
        </ul>
    </div>
    
    ${options.includeEvidence && report.findings.length > 0 ? `
    <div class="section">
        <h2>Key Findings</h2>
        ${report.findings.map(finding => `
            <div class="finding ${finding.impact}-impact">
                <h3>${this.escapeHtml(finding.title)}</h3>
                <p><strong>Category:</strong> ${this.escapeHtml(finding.category)} | 
                   <strong>Impact:</strong> ${finding.impact} | 
                   <strong>Confidence:</strong> ${finding.confidence}</p>
                <p>${this.escapeHtml(finding.description)}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${report.recommendations.length > 0 ? `
    <div class="section">
        <h2>Recommendations</h2>
        ${report.recommendations.map(rec => `
            <div class="recommendation">
                <h3>${this.escapeHtml(rec.title)}</h3>
                <p><strong>Type:</strong> ${rec.type} | 
                   <strong>Priority:</strong> ${rec.priority} | 
                   <strong>Effort:</strong> ${rec.effort}</p>
                <p>${this.escapeHtml(rec.description)}</p>
                <p><strong>Rationale:</strong> ${this.escapeHtml(rec.rationale)}</p>
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${report.risks.length > 0 ? `
    <div class="section">
        <h2>Risks</h2>
        ${report.risks.map(risk => `
            <div class="risk">
                <h3>${this.escapeHtml(risk.title)}</h3>
                <p><strong>Type:</strong> ${risk.type} | 
                   <strong>Severity:</strong> ${risk.severity} | 
                   <strong>Probability:</strong> ${risk.probability}</p>
                <p>${this.escapeHtml(risk.description)}</p>
                ${risk.mitigation ? `<p><strong>Mitigation:</strong> ${this.escapeHtml(risk.mitigation)}</p>` : ''}
            </div>
        `).join('')}
    </div>
    ` : ''}
    
    ${options.includeMetadata ? `
    <div class="section">
        <h2>Metadata</h2>
        <div class="metadata">
            <p><strong>Total Files:</strong> ${report.metadata.totalFiles}</p>
            <p><strong>Total Insights:</strong> ${report.metadata.totalInsights}</p>
            <p><strong>Total Evidence:</strong> ${report.metadata.totalEvidence}</p>
            <p><strong>Execution Time:</strong> ${report.executionTime}ms</p>
            <p><strong>Agents Used:</strong> ${report.agentsUsed.join(', ')}</p>
        </div>
    </div>
    ` : ''}
</body>
</html>
    `;
  }
}