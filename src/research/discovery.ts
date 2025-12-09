/**
 * Discovery phase handlers for research orchestration.
 * Implements parallel discovery with 3 specialized agents.
 */

import { glob } from 'glob';
import { readFile, stat } from 'fs/promises';
import { join, extname } from 'path';
import {
  DiscoveryAgent,
  DiscoveryResult,
  FileReference,
  DocReference,
  PatternMatch,
  ResearchQuery,
  ResearchScope,
  ResearchConstraints,
  ConfidenceLevel
} from './types.js';

/**
 * Codebase Locator Agent
 * Finds relevant files and directories in the codebase
 */
export class CodebaseLocator implements DiscoveryAgent {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async discover(query: ResearchQuery): Promise<DiscoveryResult> {
    const startTime = Date.now();
    
    try {
      // 1. Parse query into search patterns
      const patterns = this.parseQueryToPatterns(query.query);
      
      // 2. Execute file discovery
      const files = await this.findFiles(patterns, query.constraints);
      
      // 3. Score relevance
      const scoredFiles = await this.scoreRelevance(files, query);
      
      // 4. Extract snippets for top matches
      const filesWithSnippets = await this.extractSnippets(scoredFiles, query);
      
      const executionTime = Date.now() - startTime;
      
      return {
        source: 'codebase-locator',
        files: filesWithSnippets,
        patterns: [],
        documentation: [],
        executionTime,
        confidence: this.calculateConfidence(filesWithSnippets, query),
        metadata: {
          filesSearched: files.length,
          patternsMatched: patterns.length
        }
      };
    } catch (error) {
      throw new Error(`Codebase locator failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseQueryToPatterns(query: ResearchQuery): string[] {
    // Extract keywords and create file patterns
    const keywords = query.query.toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 5); // Limit to top 5 keywords
    
    const patterns = [
      // Source code files
      '**/*.{ts,js,tsx,jsx}',
      '**/*.{py,java,cpp,c,h,hpp}',
      '**/*.{go,rs,php,rb}',
      // Configuration files
      '**/*.{json,yaml,yml,toml,ini}',
      '**/*.{md,txt,mdx}',
      // Build files
      '**/{package.json,tsconfig.json,webpack.config.*,rollup.config.*,vite.config.*}'
    ];
    
    return patterns;
  }

  private async findFiles(patterns: string[], constraints?: ResearchConstraints): Promise<FileReference[]> {
    const allFiles: FileReference[] = [];
    
    for (const pattern of patterns) {
      const files = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**', '**/coverage/**'],
        nodir: true
      });
      
      for (const filePath of files) {
        try {
          const stats = await stat(filePath);
          const fileRef: FileReference = {
            path: filePath,
            relevance: 0.5, // Default relevance
            language: this.detectLanguage(filePath),
            size: stats.size,
            lastModified: stats.mtime
          };
          
          // Apply constraints
          if (this.meetsConstraints(fileRef, constraints)) {
            allFiles.push(fileRef);
          }
        } catch (error) {
          // Skip files that can't be accessed
          continue;
        }
      }
    }
    
    // Remove duplicates and sort by relevance
    const uniqueFiles = Array.from(
      new Map(allFiles.map(f => [f.path, f] as [string, FileReference])).values()
    );
    
    return uniqueFiles.slice(0, constraints?.maxFiles || 100);
  }

  private async scoreRelevance(files: FileReference[], query: string): Promise<FileReference[]> {
    const keywords = query.toLowerCase().split(/\s+/);
    
    return files.map(file => {
      let relevance = 0.5; // Base relevance
      
      // Boost relevance based on filename
      const fileName = file.path.split('/').pop()?.toLowerCase() || '';
      for (const keyword of keywords) {
        if (fileName.includes(keyword)) {
          relevance += 0.2;
        }
      }
      
      // Boost relevance based on language
      if (this.isSourceCode(file.language)) {
        relevance += 0.1;
      }
      
      // Boost relevance based on recent modification
      const daysSinceModified = (Date.now() - (file.lastModified?.getTime() || 0)) / (1000 * 60 * 60 * 24);
      if (daysSinceModified < 30) {
        relevance += 0.1;
      }
      
      return {
        ...file,
        relevance: Math.min(relevance, 1.0)
      };
    }).sort((a, b) => b.relevance - a.relevance);
  }

  private async extractSnippets(files: FileReference[]): Promise<FileReference[]> {
    const topFiles = files.slice(0, 10); // Extract snippets for top 10 files
    
    for (const file of topFiles) {
      try {
        const content = await readFile(file.path, 'utf-8');
        const lines = content.split('\n');
        
        // Extract relevant snippet (first 200 chars or 5 lines)
        const snippet = lines.slice(0, 5).join('\n').substring(0, 200);
        file.snippet = snippet;
        
        // Add line numbers for snippet
        if (snippet.length > 0) {
          file.startLine = 1;
          file.endLine = Math.min(5, lines.length);
        }
      } catch (error) {
        // Skip files that can't be read
        file.snippet = undefined;
      }
    }
    
    return files;
  }

  private detectLanguage(filePath: string): string {
    const ext = extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.hpp': 'cpp',
      '.h': 'c',
      '.go': 'go',
      '.rs': 'rust',
      '.php': 'php',
      '.rb': 'ruby',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.mdx': 'markdown'
    };
    
    return languageMap[ext] || 'unknown';
  }

  private isSourceCode(language: string): boolean {
    const sourceLanguages = [
      'typescript', 'javascript', 'python', 'java', 
      'cpp', 'c', 'go', 'rust', 'php', 'ruby'
    ];
    return sourceLanguages.includes(language);
  }

  private meetsConstraints(file: FileReference, constraints?: ResearchConstraints): boolean {
    if (!constraints) return true;
    
    // File size constraint
    if (constraints.maxFileSize && file.size && file.size > constraints.maxFileSize) {
      return false;
    }
    
    // File type constraint
    if (constraints.fileTypes && file.language) {
      return constraints.fileTypes.includes(file.language);
    }
    
    return true;
  }

  private calculateConfidence(files: FileReference[], query: ResearchQuery): ConfidenceLevel {
    if (files.length === 0) return ConfidenceLevel.LOW;
    
    const avgRelevance = files.reduce((sum, file) => sum + file.relevance, 0) / files.length;
    
    if (avgRelevance > 0.8) return ConfidenceLevel.HIGH;
    if (avgRelevance > 0.6) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }
}

/**
 * Research Locator Agent
 * Finds documentation, decisions, and notes
 */
export class ResearchLocator implements DiscoveryAgent {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async discover(query: ResearchQuery): Promise<DiscoveryResult> {
    const startTime = Date.now();
    
    try {
      // 1. Find documentation files
      const docs = await this.findDocumentation(query.constraints);
      
      // 2. Parse and index content
      const indexedDocs = await this.indexDocuments(docs);
      
      // 3. Search for query matches
      const matches = this.searchIndex(indexedDocs, query);
      
      const executionTime = Date.now() - startTime;
      
      return {
        source: 'research-locator',
        files: [],
        patterns: [],
        documentation: matches,
        executionTime,
        confidence: this.calculateConfidence(matches, query.query),
        metadata: {
          docsFound: matches.length
        }
      };
    } catch (error) {
      throw new Error(`Research locator failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async findDocumentation(constraints?: ResearchConstraints): Promise<DocReference[]> {
    const docPatterns = [
      '**/*.md',
      '**/*.mdx',
      '**/README*',
      '**/CHANGELOG*',
      '**/CONTRIBUTING*',
      '**/docs/**/*',
      '**/*.txt',
      '**/*.yaml',
      '**/*.yml'
    ];
    
    const allDocs: DocReference[] = [];
    
    for (const pattern of docPatterns) {
      const files = await glob(pattern, {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        nodir: true
      });
      
      for (const filePath of files) {
        try {
          const stats = await stat(filePath);
          const docRef: DocReference = {
            path: filePath,
            relevance: 0.5,
            type: this.detectDocType(filePath),
            lastModified: stats.mtime
          };
          
          if (this.meetsDocConstraints(docRef, constraints)) {
            allDocs.push(docRef);
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    return Array.from(
      new Map(allDocs.map(d => [d.path, d] as [string, DocReference])).values()
    );
  }

  private async indexDocuments(docs: DocReference[]): Promise<DocReference[]> {
    // Add title and section information by reading file headers
    for (const doc of docs) {
      try {
        const content = await readFile(doc.path, 'utf-8');
        
        // Extract title from first # header or filename
        const titleMatch = content.match(/^#\s+(.+)$/m);
        if (titleMatch) {
          doc.title = titleMatch[1].trim();
        } else {
          doc.title = doc.path.split('/').pop()?.replace(/\.(md|mdx|txt)$/, '') || 'Untitled';
        }
        
        // Extract section (first ## header)
        const sectionMatch = content.match(/^##\s+(.+)$/m);
        if (sectionMatch) {
          doc.section = sectionMatch[1].trim();
        }
        
      } catch (error) {
        // Keep default values if file can't be read
      }
    }
    
    return docs;
  }

  private searchIndex(docs: DocReference[], query: string): DocReference[] {
    const keywords = query.toLowerCase().split(/\s+/);
    
    return docs
      .map(doc => {
        let relevance = 0.5;
        
        // Search in title
        if (doc.title) {
          for (const keyword of keywords) {
            if (doc.title.toLowerCase().includes(keyword)) {
              relevance += 0.3;
            }
          }
        }
        
        // Search in section
        if (doc.section) {
          for (const keyword of keywords) {
            if (doc.section.toLowerCase().includes(keyword)) {
              relevance += 0.2;
            }
          }
        }
        
        // Boost relevance based on doc type
        if (doc.type === 'markdown') {
          relevance += 0.1;
        }
        
        return {
          ...doc,
          relevance: Math.min(relevance, 1.0)
        };
      })
      .filter(doc => doc.relevance > 0.3) // Filter low relevance
      .sort((a, b) => b.relevance - a.relevance);
  }

  private detectDocType(filePath: string): 'markdown' | 'text' | 'json' | 'yaml' {
    const ext = extname(filePath).toLowerCase();
    
    if (['.md', '.mdx'].includes(ext)) return 'markdown';
    if (['.txt'].includes(ext)) return 'text';
    if (['.json'].includes(ext)) return 'json';
    if (['.yaml', '.yml'].includes(ext)) return 'yaml';
    
    return 'text';
  }

  private meetsDocConstraints(doc: DocReference, constraints?: ResearchConstraints): boolean {
    if (!constraints) return true;
    
    // Date range constraint
    if (constraints.dateRange && doc.lastModified) {
      if (constraints.dateRange.from && doc.lastModified < constraints.dateRange.from) {
        return false;
      }
      if (constraints.dateRange.to && doc.lastModified > constraints.dateRange.to) {
        return false;
      }
    }
    
    return true;
  }

  private calculateConfidence(docs: DocReference[], query: ResearchQuery): ConfidenceLevel {
    if (docs.length === 0) return ConfidenceLevel.LOW;
    
    const avgRelevance = docs.reduce((sum, doc) => sum + doc.relevance, 0) / docs.length;
    
    if (avgRelevance > 0.7) return ConfidenceLevel.HIGH;
    if (avgRelevance > 0.5) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }
}

/**
 * Pattern Finder Agent
 * Identifies recurring implementation patterns
 */
export class PatternFinder implements DiscoveryAgent {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async discover(query: ResearchQuery): Promise<DiscoveryResult> {
    const startTime = Date.now();
    
    try {
      // 1. Identify target patterns from query
      const targetPatterns = this.identifyPatterns(query.query);
      
      // 2. Search for similar implementations
      const matches = await this.findSimilarCode(targetPatterns, query.constraints);
      
      // 3. Analyze usage patterns
      const usagePatterns = this.analyzeUsage(matches);
      
      const executionTime = Date.now() - startTime;
      
      return {
        source: 'pattern-finder',
        files: [],
        patterns: usagePatterns,
        documentation: [],
        executionTime,
        confidence: this.calculateConfidence(usagePatterns, query.query),
        metadata: {
          patternsMatched: usagePatterns.length
        }
      };
    } catch (error) {
      throw new Error(`Pattern finder failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private identifyPatterns(query: ResearchQuery): string[] {
    // Extract potential patterns from query
    const patterns: string[] = [];
    
    // Common implementation patterns
    const commonPatterns = [
      'class', 'function', 'interface', 'component', 'service',
      'repository', 'factory', 'singleton', 'observer', 'decorator',
      'middleware', 'router', 'controller', 'model', 'view',
      'async', 'await', 'promise', 'callback', 'event',
      'config', 'settings', 'options', 'parameters'
    ];
    
    const queryLower = query.query.toLowerCase();
    for (const pattern of commonPatterns) {
      if (queryLower.includes(pattern)) {
        patterns.push(pattern);
      }
    }
    
    return patterns.slice(0, 5); // Limit to top 5 patterns
  }

  private async findSimilarCode(patterns: string[], constraints?: ResearchConstraints): Promise<PatternMatch[]> {
    const matches: PatternMatch[] = [];
    
    for (const pattern of patterns) {
      const codeFiles = await glob('**/*.{ts,js,tsx,jsx,py,java,cpp,c,h,hpp}', {
        ignore: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
        nodir: true
      });
      
      const patternFiles: FileReference[] = [];
      
      for (const filePath of codeFiles) {
        try {
          const content = await readFile(filePath, 'utf-8');
          
          // Simple pattern matching (could be enhanced with AST parsing)
          if (this.containsPattern(content, pattern)) {
            const fileRef: FileReference = {
              path: filePath,
              relevance: 0.7,
              language: this.detectLanguage(filePath)
            };
            patternFiles.push(fileRef);
          }
        } catch (error) {
          continue;
        }
      }
      
      if (patternFiles.length > 0) {
        matches.push({
          pattern,
          matches: patternFiles,
          frequency: patternFiles.length,
          confidence: this.calculatePatternConfidence(patternFiles),
          category: this.categorizePattern(pattern)
        });
      }
    }
    
    return matches;
  }

  private containsPattern(content: string, pattern: string): boolean {
    // Simple keyword matching (could be enhanced with regex or AST)
    const contentLower = content.toLowerCase();
    const patternLower = pattern.toLowerCase();
    
    return contentLower.includes(patternLower) ||
           contentLower.includes(`${pattern}s`) ||
           contentLower.includes(`${pattern}Class`) ||
           contentLower.includes(`${pattern}Function`);
  }

  private analyzeUsage(matches: PatternMatch[]): PatternMatch[] {
    // Analyze and categorize patterns
    return matches.map(match => ({
      ...match,
      category: this.categorizePattern(match.pattern),
      confidence: this.calculatePatternConfidence(match.matches)
    }));
  }

  private categorizePattern(pattern: string): string {
    const categories: Record<string, string[]> = {
      'structural': ['class', 'interface', 'component', 'service'],
      'creational': ['factory', 'singleton', 'builder'],
      'behavioral': ['observer', 'decorator', 'middleware', 'strategy'],
      'architectural': ['repository', 'controller', 'model', 'view'],
      'functional': ['function', 'async', 'await', 'promise', 'callback'],
      'config': ['config', 'settings', 'options', 'parameters']
    };
    
    for (const [category, patterns] of Object.entries(categories)) {
      if (patterns.includes(pattern)) {
        return category;
      }
    }
    
    return 'other';
  }

  private calculatePatternConfidence(matches: FileReference[]): ConfidenceLevel {
    if (matches.length === 0) return ConfidenceLevel.LOW;
    if (matches.length > 5) return ConfidenceLevel.HIGH;
    if (matches.length > 2) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }

  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'cpp': 'cpp',
      'c': 'c',
      'hpp': 'cpp',
      'h': 'c'
    };
    
    return languageMap[ext] || 'unknown';
  }

  private calculateConfidence(patterns: PatternMatch[], query: ResearchQuery): ConfidenceLevel {
    if (patterns.length === 0) return ConfidenceLevel.LOW;
    
    const totalMatches = patterns.reduce((sum, p) => sum + p.frequency, 0);
    
    if (totalMatches > 10) return ConfidenceLevel.HIGH;
    if (totalMatches > 5) return ConfidenceLevel.MEDIUM;
    return ConfidenceLevel.LOW;
  }
}

/**
 * Discovery Handler
 * Coordinates parallel execution of all discovery agents
 */
export class DiscoveryHandler {
  private config: any;
  private locators: DiscoveryAgent[];

  constructor(config: any) {
    this.config = config;
    this.locators = [
      new CodebaseLocator(config),
      new ResearchLocator(config),
      new PatternFinder(config)
    ];
  }

  async discover(query: ResearchQuery): Promise<DiscoveryResult[]> {
    const startTime = Date.now();
    
    try {
      // Execute all locators in parallel
      const results = await Promise.allSettled(
        this.locators.map(locator => 
          this.executeWithTimeout(locator.discover(query.query, query.scope, query.constraints))
        )
      );
      
      // Process results
      const successfulResults = results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<DiscoveryResult>).value);
      
      const failedResults = results
        .filter(r => r.status === 'rejected')
        .map(r => (r as PromiseRejectedResult).reason);
      
      // Log failures
      if (failedResults.length > 0) {
        console.warn(`Some discovery agents failed:`, failedResults);
      }
      
      // Deduplicate results
      const merged = this.deduplicateResults(successfulResults);
      
      const executionTime = Date.now() - startTime;
      
      return merged;
      
    } catch (error) {
      throw new Error(`Discovery handler failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async executeWithTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error('Discovery timeout')), timeoutMs)
      )
    ]);
  }

  private deduplicateResults(results: DiscoveryResult[]): DiscoveryResult[] {
    // Simple deduplication based on file paths and documentation paths
    const seenFiles = new Set<string>();
    const seenDocs = new Set<string>();
    const seenPatterns = new Set<string>();
    
    const deduplicated: DiscoveryResult[] = [];
    
    for (const result of results) {
      const uniqueFiles = result.files.filter(f => !seenFiles.has(f.path));
      const uniqueDocs = result.documentation.filter(d => !seenDocs.has(d.path));
      const uniquePatterns = result.patterns.filter(p => !seenPatterns.has(p.pattern));
      
      // Add to seen sets
      uniqueFiles.forEach(f => seenFiles.add(f.path));
      uniqueDocs.forEach(d => seenDocs.add(d.path));
      uniquePatterns.forEach(p => seenPatterns.add(p.pattern));
      
      if (uniqueFiles.length > 0 || uniqueDocs.length > 0 || uniquePatterns.length > 0) {
        deduplicated.push({
          ...result,
          files: uniqueFiles,
          documentation: uniqueDocs,
          patterns: uniquePatterns
        });
      }
    }
    
    return deduplicated;
  }
}