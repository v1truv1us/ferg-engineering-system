/**
 * Analysis phase handlers for research orchestration.
 * Implements sequential analysis with 2 specialized agents.
 */

import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import {
  AnalysisAgent,
  AnalysisResult,
  DiscoveryResult,
  Evidence,
  Insight,
  Relationship,
  FileReference,
  PatternMatch,
  DocReference,
  ConfidenceLevel,
  ResearchQuery
} from './types.js';

/**
 * Codebase Analyzer Agent
 * Analyzes code files for insights and relationships
 */
export class CodebaseAnalyzer implements AnalysisAgent {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async analyze(discoveryResults: DiscoveryResult[], context?: any): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // 1. Collect all files from discovery results
      const allFiles = this.collectAllFiles(discoveryResults);
      
      // 2. Extract evidence from files
      const evidence = await this.extractEvidence(allFiles);
      
      // 3. Generate insights from evidence
      const insights = await this.generateInsights(evidence, discoveryResults);
      
      // 4. Identify relationships
      const relationships = await this.identifyRelationships(insights, evidence);
      
      const executionTime = Date.now() - startTime;
      
      return {
        source: 'codebase-analyzer',
        insights,
        evidence,
        relationships,
        confidence: this.calculateOverallConfidence(insights, evidence),
        executionTime,
        metadata: {
          insightsGenerated: insights.length,
          evidenceCollected: evidence.length,
          relationshipsFound: relationships.length
        }
      };
    } catch (error) {
      throw new Error(`Codebase analyzer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private collectAllFiles(discoveryResults: DiscoveryResult[]): FileReference[] {
    const files: FileReference[] = [];
    
    for (const result of discoveryResults) {
      files.push(...result.files);
    }
    
    // Remove duplicates and sort by relevance
    const uniqueFiles = files.filter((file, index, self) => 
      index === self.findIndex(f => f.path === file.path)
    );
    
    return uniqueFiles.sort((a, b) => b.relevance - a.relevance);
  }

  private async extractEvidence(files: FileReference[]): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    
    for (const file of files.slice(0, 20)) { // Limit to top 20 files
      try {
        const content = await readFile(file.path, 'utf-8');
        const fileEvidence = this.analyzeFileForEvidence(file, content);
        evidence.push(...fileEvidence);
      } catch (error) {
        // Skip files that can't be read
        continue;
      }
    }
    
    return evidence;
  }

  private analyzeFileForEvidence(file: FileReference, content: string): Evidence[] {
    const evidence: Evidence[] = [];
    const lines = content.split('\n');
    
    // Look for key patterns
    const patterns = [
      { regex: /class\s+(\w+)/g, type: 'class-definition' },
      { regex: /function\s+(\w+)/g, type: 'function-definition' },
      { regex: /interface\s+(\w+)/g, type: 'interface-definition' },
      { regex: /import.*from\s+['"]([^'"]+)['"]/g, type: 'import-statement' },
      { regex: /export\s+(default\s+)?(class|function|interface|const|let|var)\s+(\w+)/g, type: 'export-statement' },
      { regex: /\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK/g, type: 'technical-debt' },
      { regex: /\/\*\*[\s\S]*?\*\//g, type: 'documentation-block' }
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const snippet = this.getSnippet(lines, lineNumber - 1, 3);
        
        evidence.push({
          id: `evidence-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: 'code',
          source: 'codebase-analyzer',
          content: match[0],
          file: file.path,
          line: lineNumber,
          confidence: this.assessEvidenceConfidence(match[0], pattern.type),
          relevance: file.relevance
        });
      }
    }
    
    return evidence;
  }

  private getSnippet(lines: string[], centerLine: number, context: number): string {
    const start = Math.max(0, centerLine - context);
    const end = Math.min(lines.length, centerLine + context + 1);
    return lines.slice(start, end).join('\n');
  }

  private assessEvidenceConfidence(content: string, type: string): ConfidenceLevel {
    // Simple confidence assessment based on content and type
    if (type.includes('definition') && content.length > 10) {
      return ConfidenceLevel.HIGH;
    } else if (type.includes('statement') && content.length > 5) {
      return ConfidenceLevel.MEDIUM;
    } else if (type.includes('debt')) {
      return ConfidenceLevel.HIGH; // Technical debt markers are usually reliable
    } else {
      return ConfidenceLevel.LOW;
    }
  }

  private async generateInsights(evidence: Evidence[], discoveryResults: DiscoveryResult[]): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // Group evidence by type and location
    const evidenceByType = this.groupEvidenceByType(evidence);
    const evidenceByFile = this.groupEvidenceByFile(evidence);
    
    // Generate insights from patterns
    insights.push(...this.generatePatternInsights(evidenceByType));
    
    // Generate insights from file analysis
    insights.push(...this.generateFileInsights(evidenceByFile));
    
    // Generate architectural insights
    insights.push(...this.generateArchitecturalInsights(evidence, discoveryResults));
    
    return insights;
  }

  private groupEvidenceByType(evidence: Evidence[]): Record<string, Evidence[]> {
    const grouped: Record<string, Evidence[]> = {};
    
    for (const item of evidence) {
      const key = `${item.type}-${item.source}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
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

  private generatePatternInsights(evidenceByType: Record<string, Evidence[]>): Insight[] {
    const insights: Insight[] = [];
    
    for (const [type, items] of Object.entries(evidenceByType)) {
      if (items.length >= 5) {
        insights.push({
          id: `insight-pattern-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: 'pattern',
          title: `High frequency of ${type}`,
          description: `Found ${items.length} instances of ${type} across the codebase`,
          evidence: items.map(e => e.id),
          confidence: ConfidenceLevel.HIGH,
          impact: items.length > 10 ? 'high' : 'medium',
          category: 'pattern-analysis'
        });
      }
    }
    
    return insights;
  }

  private generateFileInsights(evidenceByFile: Record<string, Evidence[]>): Insight[] {
    const insights: Insight[] = [];
    
    for (const [file, items] of Object.entries(evidenceByFile)) {
      // Check for complex files
      if (items.length > 20) {
        insights.push({
          id: `insight-complexity-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: 'finding',
          title: `Complex file detected: ${file}`,
          description: `File contains ${items.length} significant code elements, may need refactoring`,
          evidence: items.slice(0, 10).map(e => e.id), // Limit evidence
          confidence: ConfidenceLevel.MEDIUM,
          impact: 'medium',
          category: 'complexity-analysis'
        });
      }
      
      // Check for technical debt
      const debtItems = items.filter(e => e.content.includes('TODO') || e.content.includes('FIXME'));
      if (debtItems.length > 0) {
        insights.push({
          id: `insight-debt-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: 'finding',
          title: `Technical debt markers in ${file}`,
          description: `Found ${debtItems.length} TODO/FIXME comments indicating technical debt`,
          evidence: debtItems.map(e => e.id),
          confidence: ConfidenceLevel.HIGH,
          impact: debtItems.length > 3 ? 'high' : 'medium',
          category: 'technical-debt'
        });
      }
    }
    
    return insights;
  }

  private generateArchitecturalInsights(evidence: Evidence[], discoveryResults: DiscoveryResult[]): Insight[] {
    const insights: Insight[] = [];
    
    // Analyze import patterns
    const imports = evidence.filter(e => e.type === 'import-statement');
    const importSources = this.analyzeImportSources(imports);
    
    if (importSources.external > importSources.internal * 2) {
      insights.push({
        id: `insight-external-deps-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'decision',
        title: 'High external dependency usage',
        description: `Codebase relies heavily on external dependencies (${importSources.external} vs ${importSources.internal} internal)`,
        evidence: imports.slice(0, 5).map(e => e.id),
        confidence: ConfidenceLevel.MEDIUM,
        impact: 'medium',
        category: 'architecture'
      });
    }
    
    return insights;
  }

  private analyzeImportSources(imports: Evidence[]): { internal: number; external: number } {
    let internal = 0;
    let external = 0;
    
    for (const imp of imports) {
      if (imp.content.startsWith('./') || imp.content.startsWith('../') || imp.content.startsWith('/')) {
        internal++;
      } else {
        external++;
      }
    }
    
    return { internal, external };
  }

  private async identifyRelationships(insights: Insight[], evidence: Evidence[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    
    // Find relationships between insights
    for (let i = 0; i < insights.length; i++) {
      for (let j = i + 1; j < insights.length; j++) {
        const insight1 = insights[i];
        const insight2 = insights[j];
        
        // Check for shared evidence
        const sharedEvidence = insight1.evidence.filter(e => insight2.evidence.includes(e));
        if (sharedEvidence.length > 0) {
          relationships.push({
            id: `rel-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            type: 'similarity',
            source: insight1.id,
            target: insight2.id,
            description: `Insights share ${sharedEvidence.length} pieces of evidence`,
            strength: sharedEvidence.length / Math.max(insight1.evidence.length, insight2.evidence.length),
            evidence: sharedEvidence
          });
        }
        
        // Check for category relationships
        if (insight1.category === insight2.category && insight1.category !== 'pattern-analysis') {
          relationships.push({
            id: `rel-category-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            type: 'enhancement',
            source: insight1.id,
            target: insight2.id,
            description: `Both insights relate to ${insight1.category}`,
            strength: 0.7,
            evidence: [...insight1.evidence.slice(0, 2), ...insight2.evidence.slice(0, 2)]
          });
        }
      }
    }
    
    return relationships;
  }

  private calculateOverallConfidence(insights: Insight[], evidence: Evidence[]): ConfidenceLevel {
    if (insights.length === 0) return ConfidenceLevel.LOW;
    
    const insightConfidence = insights.reduce((sum, insight) => {
      const confidenceValue = this.confidenceToNumber(insight.confidence);
      return sum + confidenceValue;
    }, 0) / insights.length;
    
    const evidenceConfidence = evidence.reduce((sum, ev) => {
      const confidenceValue = this.confidenceToNumber(ev.confidence);
      return sum + confidenceValue;
    }, 0) / evidence.length;
    
    const overallConfidence = (insightConfidence + evidenceConfidence) / 2;
    
    if (overallConfidence >= 0.8) return ConfidenceLevel.HIGH;
    if (overallConfidence >= 0.6) return ConfidenceLevel.MEDIUM;
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
}

/**
 * Research Analyzer Agent
 * Analyzes documentation and patterns for insights
 */
export class ResearchAnalyzer implements AnalysisAgent {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async analyze(discoveryResults: DiscoveryResult[], context?: any): Promise<AnalysisResult> {
    const startTime = Date.now();
    
    try {
      // 1. Collect all documentation from discovery results
      const allDocs = this.collectAllDocumentation(discoveryResults);
      
      // 2. Extract evidence from documentation
      const evidence = await this.extractDocumentationEvidence(allDocs);
      
      // 3. Analyze patterns
      const patternEvidence = await this.analyzePatterns(discoveryResults);
      evidence.push(...patternEvidence);
      
      // 4. Generate insights from documentation
      const insights = await this.generateDocumentationInsights(evidence, discoveryResults);
      
      // 5. Identify relationships
      const relationships = await this.identifyDocumentationRelationships(insights, evidence);
      
      const executionTime = Date.now() - startTime;
      
      return {
        source: 'research-analyzer',
        insights,
        evidence,
        relationships,
        confidence: this.calculateOverallConfidence(insights, evidence),
        executionTime,
        metadata: {
          insightsGenerated: insights.length,
          evidenceCollected: evidence.length,
          relationshipsFound: relationships.length
        }
      };
    } catch (error) {
      throw new Error(`Research analyzer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private collectAllDocumentation(discoveryResults: DiscoveryResult[]): DocReference[] {
    const docs: DocReference[] = [];
    
    for (const result of discoveryResults) {
      docs.push(...result.documentation);
    }
    
    // Remove duplicates and sort by relevance
    const uniqueDocs = docs.filter((doc, index, self) => 
      index === self.findIndex(d => d.path === doc.path)
    );
    
    return uniqueDocs.sort((a, b) => b.relevance - a.relevance);
  }

  private async extractDocumentationEvidence(docs: DocReference[]): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    
    for (const doc of docs.slice(0, 15)) { // Limit to top 15 docs
      try {
        const content = await readFile(doc.path, 'utf-8');
        const docEvidence = this.analyzeDocumentationForEvidence(doc, content);
        evidence.push(...docEvidence);
      } catch (error) {
        // Skip docs that can't be read
        continue;
      }
    }
    
    return evidence;
  }

  private analyzeDocumentationForEvidence(doc: DocReference, content: string): Evidence[] {
    const evidence: Evidence[] = [];
    const lines = content.split('\n');
    
    // Look for documentation patterns
    const patterns = [
      { regex: /#+\s+(.+)/g, type: 'heading', confidence: ConfidenceLevel.HIGH },
      { regex: /```[\s\S]*?```/g, type: 'code-block', confidence: ConfidenceLevel.HIGH },
      { regex: /\[([^\]]+)\]\(([^)]+)\)/g, type: 'link', confidence: ConfidenceLevel.MEDIUM },
      { regex: /`([^`]+)`/g, type: 'inline-code', confidence: ConfidenceLevel.MEDIUM },
      { regex: /TODO|FIXME|NOTE|WARNING/g, type: 'attention-marker', confidence: ConfidenceLevel.HIGH },
      { regex: /\*\*([^*]+)\*\*/g, type: 'emphasis', confidence: ConfidenceLevel.LOW }
    ];
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        evidence.push({
          id: `evidence-doc-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: 'documentation',
          source: 'research-analyzer',
          content: match[0],
          file: doc.path,
          line: lineNumber,
          confidence: pattern.confidence,
          relevance: doc.relevance
        });
      }
    }
    
    return evidence;
  }

  private async analyzePatterns(discoveryResults: DiscoveryResult[]): Promise<Evidence[]> {
    const evidence: Evidence[] = [];
    
    for (const result of discoveryResults) {
      for (const pattern of result.patterns) {
        evidence.push({
          id: `evidence-pattern-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: 'pattern',
          source: 'research-analyzer',
          content: `Pattern: ${pattern.pattern} (found ${pattern.frequency} times)`,
          confidence: pattern.confidence,
          relevance: pattern.matches.length > 0 ? Math.max(...pattern.matches.map(m => m.relevance)) : 0.5
        });
      }
    }
    
    return evidence;
  }

  private async generateDocumentationInsights(evidence: Evidence[], discoveryResults: DiscoveryResult[]): Promise<Insight[]> {
    const insights: Insight[] = [];
    
    // Group evidence by file
    const evidenceByFile = this.groupEvidenceByFile(evidence);
    
    // Generate documentation insights
    insights.push(...this.generateDocumentationQualityInsights(evidenceByFile));
    
    // Generate pattern insights
    insights.push(...this.generatePatternAnalysisInsights(evidence));
    
    // Generate completeness insights
    insights.push(...this.generateCompletenessInsights(evidence, discoveryResults));
    
    return insights;
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

  private generateDocumentationQualityInsights(evidenceByFile: Record<string, Evidence[]>): Insight[] {
    const insights: Insight[] = [];
    
    for (const [file, items] of Object.entries(evidenceByFile)) {
      const headings = items.filter(e => e.content.includes('#'));
      const codeBlocks = items.filter(e => e.content.includes('```'));
      const links = items.filter(e => e.content.includes('[') && e.content.includes(']('));
      
      // Assess documentation quality
      if (headings.length === 0 && items.length > 5) {
        insights.push({
          id: `insight-doc-structure-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: 'finding',
          title: `Poor documentation structure in ${file}`,
          description: `Document lacks proper headings despite having ${items.length} elements`,
          evidence: items.slice(0, 5).map(e => e.id),
          confidence: ConfidenceLevel.MEDIUM,
          impact: 'medium',
          category: 'documentation-quality'
        });
      }
      
      if (codeBlocks.length > 0 && headings.length === 0) {
        insights.push({
          id: `insight-code-explanation-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
          type: 'finding',
          title: `Code without explanation in ${file}`,
          description: `Document contains ${codeBlocks.length} code blocks but lacks explanatory headings`,
          evidence: codeBlocks.slice(0, 3).map(e => e.id),
          confidence: ConfidenceLevel.HIGH,
          impact: 'medium',
          category: 'documentation-quality'
        });
      }
    }
    
    return insights;
  }

  private generatePatternAnalysisInsights(evidence: Evidence[]): Insight[] {
    const insights: Insight[] = [];
    
    const patternEvidence = evidence.filter(e => e.type === 'pattern');
    const highFrequencyPatterns = patternEvidence.filter(e => {
      if (!e.content.includes('found')) return false;
      const match = e.content.match(/found (\d+) times/);
      return match ? parseInt(match[1]) > 5 : false;
    });
    
    if (highFrequencyPatterns.length > 0) {
      insights.push({
        id: `insight-high-freq-patterns-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'pattern',
        title: 'High-frequency patterns detected',
        description: `Found ${highFrequencyPatterns.length} patterns that occur more than 5 times`,
        evidence: highFrequencyPatterns.map(e => e.id),
        confidence: ConfidenceLevel.HIGH,
        impact: 'high',
        category: 'pattern-analysis'
      });
    }
    
    return insights;
  }

  private generateCompletenessInsights(evidence: Evidence[], discoveryResults: DiscoveryResult[]): Insight[] {
    const insights: Insight[] = [];
    
    const docEvidence = evidence.filter(e => e.type === 'documentation');
    const patternEvidence = evidence.filter(e => e.type === 'pattern');
    
    // Check if documentation matches code patterns
    if (patternEvidence.length > docEvidence.length * 2) {
      insights.push({
        id: `insight-doc-coverage-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
        type: 'finding',
        title: 'Insufficient documentation coverage',
        description: `Found ${patternEvidence.length} patterns but only ${docEvidence.length} documentation elements`,
        evidence: [...patternEvidence.slice(0, 3), ...docEvidence.slice(0, 3)],
        confidence: ConfidenceLevel.MEDIUM,
        impact: 'high',
        category: 'documentation-coverage'
      });
    }
    
    return insights;
  }

  private async identifyDocumentationRelationships(insights: Insight[], evidence: Evidence[]): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    
    // Find relationships based on category
    const insightsByCategory = this.groupInsightsByCategory(insights);
    
    for (const [category, categoryInsights] of Object.entries(insightsByCategory)) {
      if (categoryInsights.length > 1) {
        for (let i = 0; i < categoryInsights.length; i++) {
          for (let j = i + 1; j < categoryInsights.length; j++) {
            relationships.push({
              id: `rel-doc-category-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
              type: 'similarity',
              source: categoryInsights[i].id,
              target: categoryInsights[j].id,
              description: `Both insights relate to ${category}`,
              strength: 0.8,
              evidence: [...categoryInsights[i].evidence.slice(0, 2), ...categoryInsights[j].evidence.slice(0, 2)]
            });
          }
        }
      }
    }
    
    return relationships;
  }

  private groupInsightsByCategory(insights: Insight[]): Record<string, Insight[]> {
    const grouped: Record<string, Insight[]> = {};
    
    for (const insight of insights) {
      if (!grouped[insight.category]) grouped[insight.category] = [];
      grouped[insight.category].push(insight);
    }
    
    return grouped;
  }

  private calculateOverallConfidence(insights: Insight[], evidence: Evidence[]): ConfidenceLevel {
    if (insights.length === 0) return ConfidenceLevel.LOW;
    
    const insightConfidence = insights.reduce((sum, insight) => {
      const confidenceValue = this.confidenceToNumber(insight.confidence);
      return sum + confidenceValue;
    }, 0) / insights.length;
    
    const evidenceConfidence = evidence.reduce((sum, ev) => {
      const confidenceValue = this.confidenceToNumber(ev.confidence);
      return sum + confidenceValue;
    }, 0) / evidence.length;
    
    const overallConfidence = (insightConfidence + evidenceConfidence) / 2;
    
    if (overallConfidence >= 0.8) return ConfidenceLevel.HIGH;
    if (overallConfidence >= 0.6) return ConfidenceLevel.MEDIUM;
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
}

/**
 * Analysis Handler
 * Coordinates sequential analysis with both analyzers
 */
export class AnalysisHandler {
  private codebaseAnalyzer: CodebaseAnalyzer;
  private researchAnalyzer: ResearchAnalyzer;
  private config: any;

  constructor(config: any) {
    this.config = config;
    this.codebaseAnalyzer = new CodebaseAnalyzer(config);
    this.researchAnalyzer = new ResearchAnalyzer(config);
  }

  async executeAnalysis(discoveryResults: DiscoveryResult[], query?: ResearchQuery): Promise<{
    codebaseAnalysis: AnalysisResult;
    researchAnalysis: AnalysisResult;
    combinedInsights: Insight[];
    combinedEvidence: Evidence[];
    combinedRelationships: Relationship[];
  }> {
    try {
      // Execute codebase analysis first
      const codebaseAnalysis = await this.codebaseAnalyzer.analyze(discoveryResults, query);
      
      // Execute research analysis with codebase context
      const researchAnalysis = await this.researchAnalyzer.analyze(discoveryResults, {
        ...query,
        codebaseContext: codebaseAnalysis
      });
      
      // Combine results
      const combinedInsights = [...codebaseAnalysis.insights, ...researchAnalysis.insights];
      const combinedEvidence = [...codebaseAnalysis.evidence, ...researchAnalysis.evidence];
      const combinedRelationships = [...codebaseAnalysis.relationships, ...researchAnalysis.relationships];
      
      return {
        codebaseAnalysis,
        researchAnalysis,
        combinedInsights,
        combinedEvidence,
        combinedRelationships
      };
    } catch (error) {
      throw new Error(`Analysis execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  getAnalysisMetrics(results: {
    codebaseAnalysis: AnalysisResult;
    researchAnalysis: AnalysisResult;
    combinedInsights: Insight[];
    combinedEvidence: Evidence[];
    combinedRelationships: Relationship[];
  }): {
    totalInsights: number;
    totalEvidence: number;
    totalRelationships: number;
    averageConfidence: number;
    executionTime: number;
  } {
    const { codebaseAnalysis, researchAnalysis, combinedInsights, combinedEvidence, combinedRelationships } = results;
    
    const totalInsights = combinedInsights.length;
    const totalEvidence = combinedEvidence.length;
    const totalRelationships = combinedRelationships.length;
    
    const averageConfidence = this.calculateAverageConfidence(combinedInsights, combinedEvidence);
    const executionTime = codebaseAnalysis.executionTime + researchAnalysis.executionTime;
    
    return {
      totalInsights,
      totalEvidence,
      totalRelationships,
      averageConfidence,
      executionTime
    };
  }

  private calculateAverageConfidence(insights: Insight[], evidence: Evidence[]): number {
    const insightScores = insights.map(i => this.confidenceToNumber(i.confidence));
    const evidenceScores = evidence.map(e => this.confidenceToNumber(e.confidence));
    
    const allScores = [...insightScores, ...evidenceScores];
    return allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
  }

  private confidenceToNumber(confidence: ConfidenceLevel): number {
    switch (confidence) {
      case ConfidenceLevel.HIGH: return 0.9;
      case ConfidenceLevel.MEDIUM: return 0.6;
      case ConfidenceLevel.LOW: return 0.3;
      default: return 0.1;
    }
  }
}