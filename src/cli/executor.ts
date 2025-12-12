/**
 * CLI integration for the Ferg Engineering System execution engine.
 * Provides command-line interface for plan execution and quality gates.
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { PlanParser } from '../execution/plan-parser.js';
import { TaskExecutor } from '../execution/task-executor.js';
import { QualityGateRunner } from '../execution/quality-gates.js';
import { AgentCoordinator } from '../agents/coordinator.js';
import { PlanGenerator } from '../agents/plan-generator.js';
import { CodeReviewExecutor } from '../agents/code-review-executor.js';
import { 
  ExecutionOptions, 
  ExecutionReport, 
  TaskStatus,
  QualityGateResult 
} from '../execution/types.js';
import { 
  AgentCoordinatorConfig,
  PlanGenerationInput,
  CodeReviewInput
} from '../agents/types.js';
import { ResearchOrchestrator } from '../research/orchestrator.js';
import {
  ResearchQuery,
  ResearchScope,
  ResearchDepth,
  ResearchConfig
} from '../research/types.js';
import { CommandSwarmsIntegration, getCommandSwarmsIntegration, CommandResult } from '../command-swarms-integration.js';
import { createSwarmsClient, checkLocalSwarmsAvailable } from '../local-swarms-executor.js';

export class ExecutorCLI {
  private program: Command;
  private agentCoordinator: AgentCoordinator;
  private planGenerator: PlanGenerator;
  private codeReviewExecutor: CodeReviewExecutor;
  private researchOrchestrator: ResearchOrchestrator;
  private commandSwarmsIntegration: CommandSwarmsIntegration | null = null;
  private swarmsAvailable: boolean = false;

  constructor() {
    // Initialize agent components
    const agentConfig: AgentCoordinatorConfig = {
      maxConcurrency: 3,
      defaultTimeout: 30000,
      retryAttempts: 2,
      retryDelay: 1000,
      enableCaching: true,
      logLevel: 'info'
    };
    
    this.agentCoordinator = new AgentCoordinator(agentConfig);
    this.planGenerator = new PlanGenerator(this.agentCoordinator);
    this.codeReviewExecutor = new CodeReviewExecutor(this.agentCoordinator);
    
    // Initialize research orchestrator
    const researchConfig: ResearchConfig = {
      maxConcurrency: 3,
      defaultTimeout: 30000,
      enableCaching: true,
      logLevel: 'info',
      cacheExpiry: 3600000, // 1 hour
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxResults: 100,
      enableExternalSearch: false,
      externalSearchTimeout: 10000
    };
    this.researchOrchestrator = new ResearchOrchestrator(researchConfig);
    
    // Initialize Swarms integration (lazy - check availability on demand)
    this.initializeSwarmsIntegration();
    
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Get the configured CLI program
   */
  public getProgram(): Command {
    return this.program;
  }

  /**
   * Initialize Swarms integration (async, non-blocking)
   */
  private async initializeSwarmsIntegration(): Promise<void> {
    try {
      this.swarmsAvailable = await checkLocalSwarmsAvailable();
      if (this.swarmsAvailable) {
        const swarmsClient = createSwarmsClient({ mode: 'local' });
        this.commandSwarmsIntegration = getCommandSwarmsIntegration(swarmsClient as any);
        console.log('🐝 Swarms integration available (local mode)');
      }
    } catch (error) {
      // Swarms not available, fall back to legacy coordinator
      this.swarmsAvailable = false;
    }
  }

  /**
   * Execute command via Swarms if available and requested
   */
  private async executeViaSwarms(
    command: string,
    args: string[],
    options: { timeout?: number } = {}
  ): Promise<CommandResult | null> {
    if (!this.commandSwarmsIntegration) {
      return null;
    }

    try {
      return await this.commandSwarmsIntegration.executeCommand(command, args, {
        fallbackToDirect: true,
        timeout: options.timeout || 300000
      });
    } catch (error) {
      console.warn(`Swarms execution failed, falling back to legacy: ${error}`);
      return null;
    }
  }

  private setupCommands(): void {
    this.program
      .name('ai-exec')
      .description('AI Engineering System Execution Engine')
      .version('0.3.0-alpha');

    // Plan execution command
    this.program
      .command('plan')
      .description('Execute a plan file')
      .argument('<file>', 'Plan file to execute')
      .option('-d, --dry-run', 'Simulate execution without running commands')
      .option('-c, --continue-on-error', 'Continue execution after task failures')
      .option('-v, --verbose', 'Enable verbose output')
      .option('-w, --working-directory <dir>', 'Set working directory')
      .option('--report <file>', 'Save execution report to file')
      .action(this.executePlanCommand.bind(this));

    // Quality gates command
    this.program
      .command('gates')
      .description('Run quality gates')
      .option('-c, --config <file>', 'Quality gates configuration file')
      .option('-d, --dry-run', 'Simulate gate execution')
      .option('-v, --verbose', 'Enable verbose output')
      .option('--report <file>', 'Save gate results to file')
      .action(this.executeGatesCommand.bind(this));

    // Report command
    this.program
      .command('report')
      .description('Generate and display execution report')
      .argument('<file>', 'Report file to display')
      .option('--format <format>', 'Output format (json|table)', 'table')
      .action(this.reportCommand.bind(this));

    // Validate command
    this.program
      .command('validate')
      .description('Validate plan file syntax and structure')
      .argument('<file>', 'Plan file to validate')
      .option('-v, --verbose', 'Enable verbose output')
      .action(this.validateCommand.bind(this));

    // Agent orchestration commands
    this.program
      .command('generate-plan')
      .description('Generate implementation plan from description')
      .argument('<description>', 'Natural language description of what to implement')
      .option('-s, --scope <scope>', 'Plan scope (architecture|implementation|review|full)', 'full')
      .option('-r, --requirements <reqs...>', 'List of requirements')
      .option('-c, --constraints <constraints...>', 'List of constraints')
      .option('-o, --output <file>', 'Output plan file', 'generated-plan.yaml')
      .option('--swarm', 'Use Swarms orchestration instead of legacy coordinator')
      .option('-v, --verbose', 'Enable verbose output')
      .action(this.generatePlanCommand.bind(this));

    this.program
      .command('code-review')
      .description('Execute multi-agent code review')
      .argument('<files...>', 'Files to review')
      .option('-t, --type <type>', 'Review type (full|incremental|security|performance|frontend)', 'full')
      .option('-s, --severity <severity>', 'Minimum severity level (low|medium|high|critical)', 'medium')
      .option('-f, --focus <focus>', 'Focused review (security|performance|frontend|general)')
      .option('-o, --output <file>', 'Output report file', 'code-review-report.json')
      .option('--swarm', 'Use Swarms orchestration instead of legacy coordinator')
      .option('-v, --verbose', 'Enable verbose output')
      .action(this.codeReviewCommand.bind(this));
    
    // Research command
    this.program
      .command('research')
      .description('Execute comprehensive multi-phase research analysis')
      .argument('[query]', 'Research question or topic', '')
      .option('-s, --scope <scope>', 'Research scope (codebase|documentation|all)', 'all')
      .option('-d, --depth <depth>', 'Research depth (shallow|medium|deep)', 'medium')
      .option('-o, --output <file>', 'Output file path', '')
      .option('-f, --format <format>', 'Export format (markdown|json|html)', 'markdown')
      .option('--no-cache', 'Disable research caching', false)
      .option('--swarm', 'Use Swarms orchestration instead of legacy coordinator')
      .option('-v, --verbose', 'Enable verbose output', false)
      .action(this.executeResearchCommand.bind(this));
    
    this.program
      .command('agent-status')
      .description('Show agent execution status and metrics')
      .option('--json', 'Output in JSON format')
      .action(this.agentStatusCommand.bind(this));

    // Swarms status command
    this.program
      .command('swarm-status')
      .description('Show Swarms integration status and available agents')
      .option('--json', 'Output in JSON format')
      .action(this.swarmStatusCommand.bind(this));
  }

  private async executePlanCommand(
    file: string, 
    options: any
  ): Promise<void> {
    try {
      console.log(`🚀 Executing plan: ${file}`);
      
      const executionOptions: ExecutionOptions = {
        dryRun: options.dryRun || false,
        continueOnError: options.continueOnError || false,
        verbose: options.verbose || false,
        workingDirectory: options.workingDirectory
      };

      // Parse plan
      const parser = new PlanParser();
      const plan = parser.parseFile(file);
      
      console.log(`📋 Plan: ${plan.metadata.name} v${plan.metadata.version}`);
      console.log(`📝 Description: ${plan.metadata.description || 'No description'}`);
      console.log(`🔧 Tasks: ${plan.tasks.length}`);
      
      if (plan.qualityGates && plan.qualityGates.length > 0) {
        console.log(`✅ Quality Gates: ${plan.qualityGates.length}`);
      }

      // Execute tasks
      const executor = new TaskExecutor(executionOptions);
      executor.setAgentCoordinator(this.agentCoordinator);
      const startTime = new Date();
      
      const taskResults = await executor.executePlan(plan);
      const endTime = new Date();
      
      // Execute quality gates if defined
      let qualityGateResults: QualityGateResult[] = [];
      if (plan.qualityGates && plan.qualityGates.length > 0) {
        console.log('\\n🔍 Running quality gates...');
        const gateRunner = new QualityGateRunner(executionOptions);
        qualityGateResults = await gateRunner.executeQualityGates(plan.qualityGates);
      }

      // Generate report
      const report: ExecutionReport = {
        planId: plan.metadata.id,
        status: this.calculateOverallStatus(taskResults, qualityGateResults),
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        taskResults,
        qualityGateResults,
        summary: this.generateSummary(taskResults, qualityGateResults)
      };

      // Display results
      this.displayExecutionReport(report);
      
      // Save report if requested
      if (options.report) {
        this.saveReport(report, options.report);
      }

      // Exit with appropriate code
      const exitCode = report.status === TaskStatus.COMPLETED ? 0 : 1;
      process.exit(exitCode);
      
    } catch (error) {
      console.error('❌ Error executing plan:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async executeGatesCommand(options: any): Promise<void> {
    try {
      console.log('🔍 Running quality gates...');
      
      const executionOptions: ExecutionOptions = {
        dryRun: options.dryRun || false,
        verbose: options.verbose || false
      };

      let gates;
      
      if (options.config) {
        // Load custom gates configuration
        const configContent = readFileSync(options.config, 'utf8');
        gates = JSON.parse(configContent);
      } else {
        // Use default gates
        gates = QualityGateRunner.getDefaultGates();
      }

      const gateRunner = new QualityGateRunner(executionOptions);
      const results = await gateRunner.executeQualityGates(gates);
      
      this.displayGateResults(results);
      
      // Save results if requested
      if (options.report) {
        this.saveGateResults(results, options.report);
      }

      // Exit with appropriate code
      const failedGates = results.filter(r => !r.passed);
      const exitCode = failedGates.length === 0 ? 0 : 1;
      process.exit(exitCode);
      
    } catch (error) {
      console.error('❌ Error running quality gates:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async reportCommand(file: string, options: any): Promise<void> {
    try {
      const reportContent = readFileSync(file, 'utf8');
      const report: ExecutionReport = JSON.parse(reportContent);
      
      if (options.format === 'json') {
        console.log(JSON.stringify(report, null, 2));
      } else {
        this.displayExecutionReport(report);
      }
    } catch (error) {
      console.error('❌ Error reading report:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private async validateCommand(file: string, options: any): Promise<void> {
    try {
      console.log(`🔍 Validating plan: ${file}`);
      
      const parser = new PlanParser();
      const plan = parser.parseFile(file);
      
      console.log('✅ Plan validation successful!');
      console.log(`📋 Plan: ${plan.metadata.name} v${plan.metadata.version}`);
      console.log(`🔧 Tasks: ${plan.tasks.length}`);
      console.log(`✅ Quality Gates: ${plan.qualityGates?.length || 0}`);
      
      if (options.verbose) {
        const warnings = parser.getWarnings();
        if (warnings.length > 0) {
          console.log('\\n⚠️  Warnings:');
          warnings.forEach(warning => console.log(`  - ${warning}`));
        }
      }
      
    } catch (error) {
      console.error('❌ Plan validation failed:', error instanceof Error ? error.message : 'Unknown error');
      process.exit(1);
    }
  }

  private calculateOverallStatus(
    taskResults: any[], 
    qualityGateResults: QualityGateResult[]
  ): TaskStatus {
    const failedTasks = taskResults.filter(t => t.status === TaskStatus.FAILED);
    const failedGates = qualityGateResults.filter(g => !g.passed);
    
    if (failedTasks.length > 0 || failedGates.length > 0) {
      return TaskStatus.FAILED;
    }
    
    return TaskStatus.COMPLETED;
  }

  private generateSummary(taskResults: any[], qualityGateResults: QualityGateResult[]) {
    const completedTasks = taskResults.filter(t => t.status === TaskStatus.COMPLETED);
    const failedTasks = taskResults.filter(t => t.status === TaskStatus.FAILED);
    const skippedTasks = taskResults.filter(t => t.status === TaskStatus.SKIPPED);
    const passedGates = qualityGateResults.filter(g => g.passed);
    const failedGates = qualityGateResults.filter(g => !g.passed);

    return {
      totalTasks: taskResults.length,
      completedTasks: completedTasks.length,
      failedTasks: failedTasks.length,
      skippedTasks: skippedTasks.length,
      totalGates: qualityGateResults.length,
      passedGates: passedGates.length,
      failedGates: failedGates.length
    };
  }

  private displayExecutionReport(report: ExecutionReport): void {
    console.log('\\n📊 Execution Report');
    console.log('==================');
    console.log(`📋 Plan: ${report.planId}`);
    console.log(`📊 Status: ${report.status}`);
    console.log(`⏱️  Duration: ${report.totalDuration}ms`);
    console.log(`🕐 Started: ${report.startTime.toISOString()}`);
    console.log(`🕐 Ended: ${report.endTime.toISOString()}`);
    
    console.log('\\n🔧 Tasks Summary:');
    console.log(`  Total: ${report.summary.totalTasks}`);
    console.log(`  ✅ Completed: ${report.summary.completedTasks}`);
    console.log(`  ❌ Failed: ${report.summary.failedTasks}`);
    console.log(`  ⏭️  Skipped: ${report.summary.skippedTasks}`);
    
    if (report.summary.totalGates > 0) {
      console.log('\\n✅ Quality Gates Summary:');
      console.log(`  Total: ${report.summary.totalGates}`);
      console.log(`  ✅ Passed: ${report.summary.passedGates}`);
      console.log(`  ❌ Failed: ${report.summary.failedGates}`);
    }
  }

  private displayGateResults(results: QualityGateResult[]): void {
    console.log('\\n🔍 Quality Gates Results');
    console.log('========================');
    
    for (const result of results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.gateId}: ${result.message} (${result.duration}ms)`);
    }
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    console.log(`\\nSummary: ${passed} passed, ${failed} failed`);
  }

  private saveReport(report: ExecutionReport, filename: string): void {
    const content = JSON.stringify(report, null, 2);
    require('fs').writeFileSync(filename, content);
    console.log(`📄 Report saved to: ${filename}`);
  }

  private saveGateResults(results: QualityGateResult[], filename: string): void {
    const content = JSON.stringify(results, null, 2);
    require('fs').writeFileSync(filename, content);
    console.log(`📄 Gate results saved to: ${filename}`);
  }

  private async generatePlanCommand(
    description: string,
    options: any
  ): Promise<void> {
    try {
      console.log(`🤖 Generating plan from: ${description}`);
      
      // Try Swarms execution if requested
      if (options.swarm && this.commandSwarmsIntegration) {
        console.log('🐝 Using Swarms orchestration...');
        const swarmResult = await this.executeViaSwarms('plan', [description], {
          timeout: 300000
        });
        
        if (swarmResult && swarmResult.success) {
          console.log('✅ Swarm execution completed');
          console.log(swarmResult.output);
          
          if (swarmResult.agentUsed) {
            console.log(`\n🤖 Agent used: ${swarmResult.agentUsed}`);
          }
          if (swarmResult.executionTime) {
            console.log(`⏱️  Execution time: ${swarmResult.executionTime}ms`);
          }
          
          // Save output if requested
          if (options.output && swarmResult.output) {
            require('fs').writeFileSync(options.output, swarmResult.output);
            console.log(`\n📄 Plan saved to: ${options.output}`);
          }
          return;
        }
        
        console.log('⚠️  Swarm execution returned no result, falling back to legacy...');
      }
      
      // Legacy execution path
      const input: PlanGenerationInput = {
        description,
        scope: options.scope,
        requirements: options.requirements || [],
        constraints: options.constraints || [],
        context: {}
      };

      const result = await this.planGenerator.generatePlan(input);
      
      console.log(`📋 Generated Plan: ${result.plan.name}`);
      console.log(`📝 Description: ${result.plan.description}`);
      console.log(`🔧 Tasks: ${result.plan.tasks.length}`);
      console.log(`🎯 Confidence: ${result.confidence}`);
      
      if (options.verbose) {
        console.log(`\n🧠 Reasoning: ${result.reasoning}`);
        console.log(`\n💡 Suggestions:`);
        result.suggestions.forEach((suggestion, i) => {
          console.log(`  ${i + 1}. ${suggestion}`);
        });
      }

      // Save plan if requested
      if (options.output) {
        const yaml = require('yaml');
        const content = yaml.stringify(result.plan);
        require('fs').writeFileSync(options.output, content);
        console.log(`\n📄 Plan saved to: ${options.output}`);
      }

    } catch (error) {
      console.error(`❌ Plan generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  private async codeReviewCommand(
    files: string[],
    options: any
  ): Promise<void> {
    try {
      console.log(`🔍 Starting code review for: ${files.join(', ')}`);
      
      // Try Swarms execution if requested
      if (options.swarm && this.commandSwarmsIntegration) {
        console.log('🐝 Using Swarms orchestration...');
        const swarmResult = await this.executeViaSwarms('review', files, {
          timeout: 300000
        });
        
        if (swarmResult && swarmResult.success) {
          console.log('✅ Swarm code review completed');
          console.log(swarmResult.output);
          
          if (swarmResult.agentUsed) {
            console.log(`\n🤖 Agent used: ${swarmResult.agentUsed}`);
          }
          if (swarmResult.executionTime) {
            console.log(`⏱️  Execution time: ${swarmResult.executionTime}ms`);
          }
          
          // Save output if requested
          if (options.output && swarmResult.output) {
            require('fs').writeFileSync(options.output, swarmResult.output);
            console.log(`\n📄 Report saved to: ${options.output}`);
          }
          return;
        }
        
        console.log('⚠️  Swarm execution returned no result, falling back to legacy...');
      }
      
      // Legacy execution path
      const input: CodeReviewInput = {
        files,
        reviewType: options.type || 'full',
        severity: options.severity || 'medium',
        context: {}
      };

      let result;
      if (options.focus) {
        result = await this.codeReviewExecutor.executeFocusedReview(input, options.focus);
        console.log(`🎯 Focused review (${options.focus}):`);
      } else {
        result = await this.codeReviewExecutor.executeCodeReview(input);
        console.log(`🔍 Full review:`);
      }

      console.log(`📊 Findings: ${result.findings.length}`);
      console.log(`📈 Overall Score: ${result.overallScore}/100`);
      
      // Group findings by severity
      const bySeverity = result.summary.bySeverity;
      Object.entries(bySeverity).forEach(([severity, count]) => {
        console.log(`  ${severity}: ${count}`);
      });

      if (options.verbose) {
        console.log(`\n📝 Detailed Findings:`);
        result.findings.forEach((finding, i) => {
          console.log(`  ${i + 1}. ${finding.file}:${finding.line} - ${finding.message}`);
          if (finding.suggestion) {
            console.log(`     💡 ${finding.suggestion}`);
          }
        });
      }

      console.log(`\n💡 Recommendations:`);
      result.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });

      // Save report if requested
      if (options.output) {
        const content = JSON.stringify(result, null, 2);
        require('fs').writeFileSync(options.output, content);
        console.log(`\n📄 Report saved to: ${options.output}`);
      }

    } catch (error) {
      console.error(`❌ Code review failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  private async agentStatusCommand(options: any): Promise<void> {
    try {
      const progress = this.agentCoordinator.getProgress();
      const metrics = this.agentCoordinator.getMetrics();

      if (options.json) {
        const status = {
          progress,
          metrics: Object.fromEntries(metrics || [])
        };
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log('🤖 Agent Status');
        console.log('================');
        
        if (progress) {
          console.log(`📊 Progress:`);
          console.log(`  Total Tasks: ${progress.totalTasks}`);
          console.log(`  Completed: ${progress.completedTasks}`);
          console.log(`  Failed: ${progress.failedTasks}`);
          console.log(`  Running: ${progress.runningTasks}`);
          console.log(`  Progress: ${progress.percentageComplete.toFixed(1)}%`);
        }

        if (metrics && metrics.size > 0) {
          console.log(`\n📈 Metrics:`);
          metrics.forEach((metric, agentType) => {
            console.log(`  ${agentType}:`);
            console.log(`    Executions: ${metric.executionCount}`);
            console.log(`    Success Rate: ${(metric.successRate * 100).toFixed(1)}%`);
            console.log(`    Avg Time: ${metric.averageExecutionTime.toFixed(0)}ms`);
            console.log(`    Confidence: ${metric.averageConfidence.toFixed(2)}`);
          });
        }
      }

    } catch (error) {
      console.error(`❌ Failed to get agent status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  private async executeResearchCommand(
    query: string,
    options: any
  ): Promise<void> {
    try {
      console.log(`🔍 Starting research: ${query || '(interactive mode)'}`);
      
      // Try Swarms execution if requested
      if (options.swarm && this.commandSwarmsIntegration) {
        console.log('🐝 Using Swarms orchestration...');
        const swarmResult = await this.executeViaSwarms('research', [query], {
          timeout: 600000 // 10 minutes for research
        });
        
        if (swarmResult && swarmResult.success) {
          console.log('✅ Swarm research completed');
          console.log(swarmResult.output);
          
          if (swarmResult.agentUsed) {
            console.log(`\n🤖 Agent used: ${swarmResult.agentUsed}`);
          }
          if (swarmResult.executionTime) {
            console.log(`⏱️  Execution time: ${swarmResult.executionTime}ms`);
          }
          
          // Save output if requested
          if (options.output && swarmResult.output) {
            require('fs').writeFileSync(options.output, swarmResult.output);
            console.log(`\n📄 Results saved to: ${options.output}`);
          }
          return;
        }
        
        console.log('⚠️  Swarm execution returned no result, falling back to legacy...');
      }
      
      // Legacy execution path
      // Parse scope and depth from options
      const scope = options.scope === 'codebase' ? ResearchScope.CODEBASE :
                   options.scope === 'documentation' ? ResearchScope.DOCUMENTATION :
                   options.scope === 'external' ? ResearchScope.EXTERNAL :
                   ResearchScope.ALL;
      
      const depth = options.depth === 'shallow' ? ResearchDepth.SHALLOW :
                   options.depth === 'medium' ? ResearchDepth.MEDIUM :
                   options.depth === 'deep' ? ResearchDepth.DEEP :
                   ResearchDepth.MEDIUM;

      const researchQuery: ResearchQuery = {
        id: `research-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        query,
        scope,
        depth,
        constraints: {
          maxFiles: options.maxFiles || 100,
          maxDuration: options.maxDuration || 300000, // 5 minutes
          excludePatterns: options.exclude || []
        },
        context: {
          verbose: options.verbose || false,
          cacheEnabled: options.cache !== false
        }
      };

      const config: ResearchConfig = {
        maxConcurrency: 3,
        defaultTimeout: 30000,
        enableCaching: options.cache !== false,
        logLevel: options.verbose ? 'debug' : 'info',
        outputFormat: options.format || 'markdown',
        outputPath: options.output || ''
      };

      const orchestrator = new ResearchOrchestrator(config);
      
      // Set up progress tracking
      orchestrator.on('progress', (progress: ResearchProgress) => {
        const percentage = (progress.completedSteps / progress.totalSteps * 100).toFixed(1);
        console.log(`📊 Progress: ${progress.currentPhase} - ${percentage}% (${progress.completedSteps}/${progress.totalSteps})`);
      });

      orchestrator.on('error', (error: ResearchError) => {
        console.error(`❌ Research error in ${error.phase}: ${error.error}`);
      });

      // Execute research
      const result = await orchestrator.research(researchQuery);
      
      // Display results
      console.log('\n🎯 Research Results');
      console.log('==================');
      console.log(`📋 Query: ${result.query.query}`);
      console.log(`🔍 Scope: ${result.query.scope}`);
      console.log(`⚡ Depth: ${result.query.depth}`);
      console.log(`⏱️  Duration: ${result.metrics.totalDuration}ms`);
      
      if (result.findings.length > 0) {
        console.log(`\n🔍 Key Findings (${result.findings.length}):`);
        result.findings.forEach((finding, i) => {
          console.log(`  ${i + 1}. ${finding.title} (${finding.impact})`);
          if (finding.evidence && finding.evidence.length > 0) {
            console.log(`     Evidence: ${finding.evidence.length} sources`);
          }
        });
      }

      if (result.recommendations.length > 0) {
        console.log(`\n💡 Recommendations (${result.recommendations.length}):`);
        result.recommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. ${rec}`);
        });
      }

      if (result.risks.length > 0) {
        console.log(`\n⚠️  Risks Identified (${result.risks.length}):`);
        result.risks.forEach((risk, i) => {
          console.log(`  ${i + 1}. ${risk.description} (${risk.severity})`);
        });
      }

      // Save results if requested
      if (options.output) {
        const content = options.format === 'json' ? 
          JSON.stringify(result, null, 2) : 
          result.summary;
        
        require('fs').writeFileSync(options.output, content);
        console.log(`\n📄 Results saved to: ${options.output}`);
      }

    } catch (error) {
      console.error(`❌ Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }

  private async swarmStatusCommand(options: any): Promise<void> {
    try {
      // Check Swarms availability
      const isAvailable = await checkLocalSwarmsAvailable();
      
      if (options.json) {
        const status = {
          available: isAvailable,
          mode: isAvailable ? 'local' : 'unavailable',
          agents: isAvailable && this.commandSwarmsIntegration 
            ? await (createSwarmsClient({ mode: 'local' }) as any).getAvailableAgents()
            : [],
          commands: isAvailable && this.commandSwarmsIntegration
            ? this.commandSwarmsIntegration.getAvailableCommands().map(c => c.command)
            : []
        };
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log('🐝 Swarms Integration Status');
        console.log('============================');
        
        if (isAvailable) {
          console.log('✅ Status: Available (local mode)');
          
          // Get available agents
          const executor = createSwarmsClient({ mode: 'local' }) as any;
          const agents = await executor.getAvailableAgents();
          
          console.log(`\n🤖 Available Agents (${agents.length}):`);
          
          // Group agents by category
          const categories: Record<string, string[]> = {
            'Architecture & Planning': ['architect-advisor', 'backend-architect', 'infrastructure-builder'],
            'Development & Coding': ['frontend-reviewer', 'full-stack-developer', 'api-builder-enhanced', 'database-optimizer', 'java-pro'],
            'Quality & Testing': ['code-reviewer', 'test-generator', 'security-scanner', 'performance-engineer'],
            'DevOps & Deployment': ['deployment-engineer', 'monitoring-expert', 'cost-optimizer'],
            'AI & Machine Learning': ['ai-engineer', 'ml-engineer'],
            'Content & SEO': ['seo-specialist', 'prompt-optimizer'],
            'Plugin Development': ['agent-creator', 'command-creator', 'skill-creator', 'tool-creator', 'plugin-validator']
          };
          
          for (const [category, categoryAgents] of Object.entries(categories)) {
            const available = categoryAgents.filter(a => agents.includes(a));
            if (available.length > 0) {
              console.log(`\n  ${category}:`);
              available.forEach(a => console.log(`    • ${a}`));
            }
          }
          
          // Show available commands
          if (this.commandSwarmsIntegration) {
            const commands = this.commandSwarmsIntegration.getAvailableCommands();
            console.log(`\n📋 Swarm-Enabled Commands (${commands.length}):`);
            commands.forEach(cmd => {
              console.log(`  • ${cmd.command}: ${cmd.description}`);
              console.log(`    Swarm Type: ${cmd.swarmType}`);
              console.log(`    Capabilities: ${cmd.capabilities.join(', ')}`);
            });
          }
          
          console.log('\n💡 Usage:');
          console.log('  Add --swarm flag to commands to use Swarms orchestration:');
          console.log('  ai-exec generate-plan "Build a todo app" --swarm');
          console.log('  ai-exec code-review src/*.ts --swarm');
          console.log('  ai-exec research "How does auth work?" --swarm');
          
        } else {
          console.log('❌ Status: Unavailable');
          console.log('\n⚠️  Swarms Python library not detected.');
          console.log('   To enable Swarms integration:');
          console.log('   pip install swarms');
          console.log('\n   Once installed, Swarms will be auto-detected on next run.');
        }
      }

    } catch (error) {
      console.error(`❌ Failed to get swarm status: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  }
}