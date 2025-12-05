/**
 * CLI integration for the Ferg Engineering System execution engine.
 * Provides command-line interface for plan execution and quality gates.
 */

import { Command } from 'commander';
import { readFileSync } from 'fs';
import { PlanParser } from '../execution/plan-parser.js';
import { TaskExecutor } from '../execution/task-executor.js';
import { QualityGateRunner } from '../execution/quality-gates.js';
import { 
  ExecutionOptions, 
  ExecutionReport, 
  TaskStatus,
  QualityGateResult 
} from '../execution/types.js';

export class ExecutorCLI {
  private program: Command;

  constructor() {
    this.program = new Command();
    this.setupCommands();
  }

  /**
   * Get the configured CLI program
   */
  public getProgram(): Command {
    return this.program;
  }

  private setupCommands(): void {
    this.program
      .name('ferg-exec')
      .description('Ferg Engineering System Execution Engine')
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
}