/**
 * Multi-agent code review executor for the Ferg Engineering System.
 * Coordinates multiple specialized agents to perform comprehensive code reviews.
 */

import { AgentCoordinator } from './coordinator.js';
import { 
  AgentType, 
  AgentTask, 
  AggregationStrategy,
  CodeReviewInput,
  CodeReviewOutput,
  CodeReviewFinding,
  AgentTaskStatus,
  ConfidenceLevel,
  ExecutionStrategy
} from './types.js';

export class CodeReviewExecutor {
  private coordinator: AgentCoordinator;

  constructor(coordinator: AgentCoordinator) {
    this.coordinator = coordinator;
  }

  /**
   * Execute a comprehensive code review using multiple agents
   */
  public async executeCodeReview(input: CodeReviewInput): Promise<CodeReviewOutput> {
    const startTime = Date.now();

    try {
      // Create review tasks for different aspects
      const tasks = this.createReviewTasks(input);
      
      // Execute tasks in parallel for efficiency
      const results = await this.coordinator.executeTasks(tasks, {
        type: 'parallel',
        weights: {
          [AgentType.CODE_REVIEWER]: 0.3,
          [AgentType.SECURITY_SCANNER]: 0.25,
          [AgentType.PERFORMANCE_ENGINEER]: 0.2,
          [AgentType.FRONTEND_REVIEWER]: 0.25
        },
        conflictResolution: 'highest_confidence'
      });

      // Aggregate findings from all agents
      const findings = this.aggregateFindings(results);
      
      // Generate summary and recommendations
      const summary = this.generateSummary(findings);
      const recommendations = this.generateRecommendations(findings, results);
      const overallScore = this.calculateOverallScore(findings);

      const executionTime = Date.now() - startTime;

      return {
        findings,
        summary,
        recommendations,
        overallScore
      };

    } catch (error) {
      throw new Error(`Code review execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute a focused code review for specific aspects
   */
  public async executeFocusedReview(
    input: CodeReviewInput, 
    focus: 'security' | 'performance' | 'frontend' | 'general'
  ): Promise<CodeReviewOutput> {
    const focusedInput = {
      ...input,
      reviewType: focus === 'general' ? 'full' : focus
    };

    return this.executeCodeReview(focusedInput);
  }

  /**
   * Execute incremental code review for changed files
   */
  public async executeIncrementalReview(
    input: CodeReviewInput,
    baseBranch?: string
  ): Promise<CodeReviewOutput> {
    const incrementalInput = {
      ...input,
      reviewType: 'incremental' as const,
      context: {
        ...input.context,
        baseBranch,
        incremental: true
      }
    };

    return this.executeCodeReview(incrementalInput);
  }

  /**
   * Create review tasks for different code aspects
   */
  private createReviewTasks(input: CodeReviewInput): AgentTask[] {
    const tasks: AgentTask[] = [];
    const baseContext = {
      files: input.files,
      reviewType: input.reviewType,
      severity: input.severity,
      context: input.context
    };

    // General code review task
    tasks.push({
      id: 'review-general',
      type: AgentType.CODE_REVIEWER,
      name: 'General Code Review',
      description: 'Review code quality, style, and best practices',
      input: {
        type: AgentType.CODE_REVIEWER,
        context: {
          ...baseContext,
          focus: 'general',
          checks: ['style', 'best-practices', 'maintainability', 'documentation']
        },
        parameters: {
          strictMode: input.severity === 'critical',
          includeSuggestions: true
        }
      },
      strategy: ExecutionStrategy.SEQUENTIAL,
      timeout: 15000
    });

    // Security review task
    if (this.shouldIncludeSecurityReview(input)) {
      tasks.push({
        id: 'review-security',
        type: AgentType.SECURITY_SCANNER,
        name: 'Security Review',
        description: 'Review code for security vulnerabilities and issues',
        input: {
          type: AgentType.SECURITY_SCANNER,
          context: {
            ...baseContext,
            focus: 'security',
            checks: ['vulnerabilities', 'authentication', 'authorization', 'data-validation']
          },
          parameters: {
            severity: input.severity,
            scanDepth: 'deep'
          }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        timeout: 12000
      });
    }

    // Performance review task
    if (this.shouldIncludePerformanceReview(input)) {
      tasks.push({
        id: 'review-performance',
        type: AgentType.PERFORMANCE_ENGINEER,
        name: 'Performance Review',
        description: 'Review code for performance issues and optimizations',
        input: {
          type: AgentType.PERFORMANCE_ENGINEER,
          context: {
            ...baseContext,
            focus: 'performance',
            checks: ['complexity', 'memory-usage', 'algorithm-efficiency', 'bottlenecks']
          },
          parameters: {
            threshold: input.severity === 'critical' ? 'strict' : 'moderate',
            includeOptimizations: true
          }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        timeout: 10000
      });
    }

    // Frontend review task
    if (this.shouldIncludeFrontendReview(input)) {
      tasks.push({
        id: 'review-frontend',
        type: AgentType.FRONTEND_REVIEWER,
        name: 'Frontend Review',
        description: 'Review frontend code for UX, accessibility, and best practices',
        input: {
          type: AgentType.FRONTEND_REVIEWER,
          context: {
            ...baseContext,
            focus: 'frontend',
            checks: ['accessibility', 'responsive-design', 'user-experience', 'browser-compatibility']
          },
          parameters: {
            includeAccessibility: true,
            includeResponsive: true,
            browserTargets: ['chrome', 'firefox', 'safari', 'edge']
          }
        },
        strategy: ExecutionStrategy.SEQUENTIAL,
        timeout: 12000
      });
    }

    return tasks;
  }

  /**
   * Aggregate findings from multiple agents
   */
  private aggregateFindings(results: any[]): CodeReviewFinding[] {
    const allFindings: CodeReviewFinding[] = [];
    const seen = new Set<string>();

    for (const result of results) {
      if (result.status === AgentTaskStatus.COMPLETED && result.output?.success) {
        const agentFindings = result.output?.result?.findings || [];
        
        for (const finding of agentFindings) {
          // Create a unique key to deduplicate findings
          const key = `${finding.file}:${finding.line}:${finding.message}`;
          
          if (!seen.has(key)) {
            seen.add(key);
            allFindings.push({
              file: finding.file,
              line: finding.line,
              severity: finding.severity || 'medium',
              category: finding.category || 'general',
              message: finding.message,
              suggestion: finding.suggestion,
              confidence: finding.confidence || ConfidenceLevel.MEDIUM,
              agent: result.type
            });
          }
        }
      }
    }

    // Sort findings by severity and file
    return allFindings.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const severityDiff = (severityOrder[b.severity as keyof typeof severityOrder] || 0) - 
                         (severityOrder[a.severity as keyof typeof severityOrder] || 0);
      
      if (severityDiff !== 0) return severityDiff;
      
      return a.file.localeCompare(b.file) || a.line - b.line;
    });
  }

  /**
   * Generate summary of findings
   */
  private generateSummary(findings: CodeReviewFinding[]): {
    total: number;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  } {
    const summary = {
      total: findings.length,
      bySeverity: {} as Record<string, number>,
      byCategory: {} as Record<string, number>
    };

    for (const finding of findings) {
      // Count by severity
      summary.bySeverity[finding.severity] = (summary.bySeverity[finding.severity] || 0) + 1;
      
      // Count by category
      summary.byCategory[finding.category] = (summary.byCategory[finding.category] || 0) + 1;
    }

    return summary;
  }

  /**
   * Generate recommendations based on findings
   */
  private generateRecommendations(findings: CodeReviewFinding[], results: any[]): string[] {
    const recommendations: string[] = [];
    
    // Add recommendations from individual agents
    for (const result of results) {
      if (result.status === AgentTaskStatus.COMPLETED && result.output?.result?.recommendations) {
        recommendations.push(...result.output.result.recommendations);
      }
    }

    // Add recommendations based on aggregated findings
    const criticalFindings = findings.filter(f => f.severity === 'critical');
    const highFindings = findings.filter(f => f.severity === 'high');

    if (criticalFindings.length > 0) {
      recommendations.push(`Address ${criticalFindings.length} critical security/stability issues immediately`);
    }

    if (highFindings.length > 0) {
      recommendations.push(`Prioritize fixing ${highFindings.length} high-priority issues`);
    }

    // Add general recommendations
    if (findings.length > 10) {
      recommendations.push('Consider breaking down this review into smaller, focused reviews');
    }

    const securityFindings = findings.filter(f => f.category === 'security');
    if (securityFindings.length > 0) {
      recommendations.push('Schedule a dedicated security review to address all security concerns');
    }

    const performanceFindings = findings.filter(f => f.category === 'performance');
    if (performanceFindings.length > 0) {
      recommendations.push('Consider performance testing to validate optimization improvements');
    }

    // Remove duplicates and return
    return [...new Set(recommendations)];
  }

  /**
   * Calculate overall code quality score
   */
  private calculateOverallScore(findings: CodeReviewFinding[]): number {
    if (findings.length === 0) {
      return 100; // Perfect score if no findings
    }

    let score = 100;
    
    // Deduct points based on severity
    for (const finding of findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    }

    // Apply confidence weighting
    const avgConfidence = findings.reduce((sum, f) => {
      const confValue = this.getConfidenceValue(f.confidence);
      return sum + confValue;
    }, 0) / findings.length;

    score = score * avgConfidence;

    // Ensure score is within bounds
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Determine if security review should be included
   */
  private shouldIncludeSecurityReview(input: CodeReviewInput): boolean {
    return input.reviewType === 'full' || 
           input.reviewType === 'security' ||
           input.severity === 'critical';
  }

  /**
   * Determine if performance review should be included
   */
  private shouldIncludePerformanceReview(input: CodeReviewInput): boolean {
    return input.reviewType === 'full' || 
           input.reviewType === 'performance';
  }

  /**
   * Determine if frontend review should be included
   */
  private shouldIncludeFrontendReview(input: CodeReviewInput): boolean {
    return input.reviewType === 'full' || 
           input.reviewType === 'frontend' ||
           this.hasFrontendFiles(input.files);
  }

  /**
   * Check if files list contains frontend files
   */
  private hasFrontendFiles(files: string[]): boolean {
    const frontendExtensions = ['.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.html', '.css', '.scss', '.less'];
    return files.some(file => 
      frontendExtensions.some(ext => file.endsWith(ext))
    );
  }

  /**
   * Convert confidence level to numeric value
   */
  private getConfidenceValue(confidence: ConfidenceLevel): number {
    switch (confidence) {
      case ConfidenceLevel.VERY_HIGH: return 1.0;
      case ConfidenceLevel.HIGH: return 0.9;
      case ConfidenceLevel.MEDIUM: return 0.7;
      case ConfidenceLevel.LOW: return 0.5;
      default: return 0.7;
    }
  }
}