/**
 * Core research orchestration engine for Ferg Engineering System.
 * Coordinates 3-phase research process: discovery, analysis, and synthesis.
 */

import { EventEmitter } from 'events';
import { AgentCoordinator } from '../agents/coordinator.js';
import { AgentTask, AgentTaskStatus, AgentType } from '../agents/types.js';
import {
  ResearchQuery,
  ResearchPhase,
  ResearchProgress,
  ResearchConfig,
  ResearchEvent,
  DiscoveryResult,
  AnalysisResult,
  SynthesisReport,
  ResearchError,
  ResearchMetrics
} from './types.js';
import { DiscoveryHandler } from './discovery.js';
import { AnalysisHandler } from './analysis.js';
import { SynthesisHandlerImpl } from './synthesis.js';

/**
 * Main research orchestrator class
 */
export class ResearchOrchestrator extends EventEmitter {
  private agentCoordinator: AgentCoordinator;
  private config: ResearchConfig;
  private discoveryHandler: DiscoveryHandler;
  private analysisHandler: AnalysisHandler;
  private synthesisHandler: SynthesisHandlerImpl;
  private startTime?: Date;
  private currentPhase: ResearchPhase = ResearchPhase.DISCOVERY;
  private progress: ResearchProgress;

  constructor(config: ResearchConfig) {
    super();
    this.config = config;
    
    // Initialize agent coordinator
    this.agentCoordinator = new AgentCoordinator({
      maxConcurrency: config.maxConcurrency,
      defaultTimeout: config.defaultTimeout,
      retryAttempts: 2,
      retryDelay: 1000,
      enableCaching: config.enableCaching,
      logLevel: config.logLevel
    });

    // Initialize handlers
    this.discoveryHandler = new DiscoveryHandler(config);
    this.analysisHandler = new AnalysisHandler(config);
    this.synthesisHandler = new SynthesisHandlerImpl(config);

    // Initialize progress tracking
    this.progress = {
      phase: ResearchPhase.DISCOVERY,
      currentStep: 'Initializing',
      totalSteps: 3, // discovery, analysis, synthesis
      completedSteps: 0,
      percentageComplete: 0,
      agentsCompleted: [],
      errors: []
    };

    // Set up event listeners
    this.setupEventListeners();
  }

  /**
   * Main research method - executes complete 3-phase workflow
   */
  public async research(query: ResearchQuery): Promise<SynthesisReport> {
    this.startTime = new Date();
    this.emitEvent('research_started', { query });
    
    try {
      // Validate query
      this.validateQuery(query);
      
      // Phase 1: Discovery (parallel)
      const discoveryResults = await this.executeDiscoveryPhase(query);
      
      // Phase 2: Analysis (sequential)
      const analysisResults = await this.executeAnalysisPhase(discoveryResults);
      
      // Phase 3: Synthesis
      const report = await this.executeSynthesisPhase(query, analysisResults);
      
      // Emit completion event
      this.emitEvent('research_completed', { 
        report,
        totalDuration: Date.now() - this.startTime.getTime()
      });
      
      return report;
      
    } catch (error) {
      const researchError: ResearchError = {
        id: this.generateId(),
        phase: this.currentPhase,
        error: error instanceof Error ? error.message : 'Unknown error',
        recoverable: false,
        suggestedAction: 'Check query parameters and try again',
        timestamp: new Date()
      };
      
      this.emitEvent('research_failed', { error: researchError });
      throw researchError;
    }
  }

  /**
   * Get current research progress
   */
  public getProgress(): ResearchProgress {
    return { ...this.progress };
  }

  /**
   * Get research metrics
   */
  public getMetrics(): ResearchMetrics | null {
    if (!this.startTime) return null;
    
    const duration = Date.now() - this.startTime.getTime();
    
    return {
      queryId: this.progress.currentStep,
      phaseMetrics: {
        [ResearchPhase.DISCOVERY]: {
          duration: duration * 0.3, // Estimate
          agentCount: 3,
          successCount: this.progress.agentsCompleted.filter(a => 
            a.includes('locator') || a.includes('finder')
          ).length,
          errorCount: this.progress.errors.filter(e => 
            e.phase === ResearchPhase.DISCOVERY
          ).length
        },
        [ResearchPhase.ANALYSIS]: {
          duration: duration * 0.4, // Estimate
          agentCount: 2,
          successCount: this.progress.agentsCompleted.filter(a => 
            a.includes('analyzer')
          ).length,
          errorCount: this.progress.errors.filter(e => 
            e.phase === ResearchPhase.ANALYSIS
          ).length
        },
        [ResearchPhase.SYNTHESIS]: {
          duration: duration * 0.3, // Estimate
          agentCount: 1,
          successCount: this.progress.agentsCompleted.filter(a => 
            a.includes('synthesis')
          ).length,
          errorCount: this.progress.errors.filter(e => 
            e.phase === ResearchPhase.SYNTHESIS
          ).length
        }
      },
      totalDuration: duration,
      agentMetrics: {},
      qualityMetrics: {
        evidenceCount: 0, // Will be updated during execution
        insightCount: 0,
        confidenceScore: 0.8,
        completenessScore: 0.9
      }
    };
  }

  /**
   * Reset orchestrator state
   */
  public reset(): void {
    this.currentPhase = ResearchPhase.DISCOVERY;
    this.progress = {
      phase: ResearchPhase.DISCOVERY,
      currentStep: 'Initializing',
      totalSteps: 3,
      completedSteps: 0,
      percentageComplete: 0,
      agentsCompleted: [],
      errors: []
    };
    this.startTime = undefined;
    this.agentCoordinator.reset();
  }

  /**
   * Execute discovery phase
   */
  private async executeDiscoveryPhase(query: ResearchQuery): Promise<DiscoveryResult[]> {
    this.currentPhase = ResearchPhase.DISCOVERY;
    this.updateProgress('Discovery Phase', 'Starting discovery agents');
    
    this.emitEvent('phase_started', { phase: ResearchPhase.DISCOVERY });
    
    try {
      // Execute discovery
      const results = await this.discoveryHandler.discover(
        query.query, 
        query.scope as string, 
        query.constraints
      );
      
      this.updateProgress('Discovery Phase', 'Discovery completed');
      this.emitEvent('phase_completed', { 
        phase: ResearchPhase.DISCOVERY, 
        results: results.length 
      });
      
      return results;
      
    } catch (error) {
      this.handleError(error as Error, ResearchPhase.DISCOVERY);
      throw error;
    }
  }

  /**
   * Execute analysis phase
   */
  private async executeAnalysisPhase(discoveryResults: DiscoveryResult[]): Promise<AnalysisResult[]> {
    this.currentPhase = ResearchPhase.ANALYSIS;
    this.updateProgress('Analysis Phase', 'Starting analysis agents');
    
    this.emitEvent('phase_started', { phase: ResearchPhase.ANALYSIS });
    
    try {
      // Execute analysis
      const results = await this.analysisHandler.executeAnalysis(discoveryResults, query);
      
      this.updateProgress('Analysis Phase', 'Analysis completed');
      this.emitEvent('phase_completed', { 
        phase: ResearchPhase.ANALYSIS, 
        results: results.length 
      });
      
      return results;
      
    } catch (error) {
      this.handleError(error as Error, ResearchPhase.ANALYSIS);
      throw error;
    }
  }

  /**
   * Execute synthesis phase
   */
  private async executeSynthesisPhase(query: ResearchQuery, analysisResults: AnalysisResult[]): Promise<SynthesisReport> {
    this.currentPhase = ResearchPhase.SYNTHESIS;
    this.updateProgress('Synthesis Phase', 'Generating research report');
    
    this.emitEvent('phase_started', { phase: ResearchPhase.SYNTHESIS });
    
    try {
      // Execute synthesis
      const report = await this.synthesisHandler.synthesize(query, analysisResults);
      
      this.updateProgress('Synthesis Phase', 'Research completed');
      this.emitEvent('phase_completed', { 
        phase: ResearchPhase.SYNTHESIS, 
        reportId: report.id 
      });
      
      return report;
      
    } catch (error) {
      this.handleError(error as Error, ResearchPhase.SYNTHESIS);
      throw error;
    }
  }

  /**
   * Validate research query
   */
  private validateQuery(query: ResearchQuery): void {
    if (!query.id) {
      throw new Error('Query must have an ID');
    }
    
    if (!query.query || query.query.trim().length === 0) {
      throw new Error('Query must have a non-empty query string');
    }
    
    const validScopes = Object.values(ResearchScope);
    if (!validScopes.includes(query.scope)) {
      throw new Error(`Invalid scope: ${query.scope}`);
    }
    
    const validDepths = Object.values(ResearchDepth);
    if (!validDepths.includes(query.depth)) {
      throw new Error(`Invalid depth: ${query.depth}`);
    }
  }

  /**
   * Update progress tracking
   */
  private updateProgress(step: string, description: string): void {
    this.progress.currentStep = description;
    
    // Update percentage based on current phase
    const phaseProgress = {
      [ResearchPhase.DISCOVERY]: 0.33,
      [ResearchPhase.ANALYSIS]: 0.67,
      [ResearchPhase.SYNTHESIS]: 1.0
    };
    
    this.progress.percentageComplete = phaseProgress[this.currentPhase] * 100;
    this.progress.phase = this.currentPhase;
    
    this.emit('progress_updated', this.progress);
  }

  /**
   * Handle errors during execution
   */
  private handleError(error: Error, phase: ResearchPhase): void {
    const researchError: ResearchError = {
      id: this.generateId(),
      phase,
      error: error.message,
      recoverable: !error.message.includes('timeout') && !error.message.includes('circular'),
      suggestedAction: this.getSuggestedAction(error.message),
      timestamp: new Date()
    };
    
    this.progress.errors.push(researchError.error);
    this.emitEvent('agent_failed', { error: researchError });
  }

  /**
   * Get suggested action for error
   */
  private getSuggestedAction(error: string): string {
    if (error.includes('timeout')) {
      return 'Increase timeout or reduce query scope';
    }
    if (error.includes('file not found')) {
      return 'Check file paths and permissions';
    }
    if (error.includes('circular dependency')) {
      return 'Review query for circular references';
    }
    return 'Check query parameters and try again';
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    this.agentCoordinator.on('agent_event', (event) => {
      if (event.type === 'task_completed') {
        this.progress.agentsCompleted.push(event.agentType);
      }
    });
  }

  /**
   * Emit research event
   */
  private emitEvent(type: ResearchEvent['type'], data?: Record<string, any>): void {
    const event: ResearchEvent = {
      type,
      timestamp: new Date(),
      phase: this.currentPhase,
      data
    };
    
    this.emit('research_event', event);
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `research-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  }
}