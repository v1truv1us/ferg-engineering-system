# Phase 2 Implementation Plan: Experimental Testing Phase

**Plan ID**: PHASE-2-EXPERIMENTAL-TESTING
**Title**: Experimental Testing Phase - Run Validation Framework
**Duration**: 2 weeks (10 working days)
**Status**: Draft
**Created**: 2025-12-06
**Target Release**: v0.3.0
**Predecessor**: Phase 1 Validation Framework Infrastructure

---

## Overview

Phase 2 executes the validation framework we built in Phase 1 to collect empirical data about the effectiveness of incentive-based prompting techniques. This phase will provide the statistical evidence needed to validate or adjust our claims about +45% quality improvement and +115% improvement on hard tasks.

### Goals
1. Complete the validation framework harness components
2. Run initial validation experiments with dry-run mode
3. Execute full validation experiments with real LLM calls
4. Generate comprehensive statistical reports
5. Validate or adjust our research-backed claims

### Success Criteria
- [ ] Complete validation framework harness (collector, analyzer, runner)
- [ ] Successfully run dry-run validation experiments
- [ ] Execute full validation with real LLM calls (30-50 samples per condition)
- [ ] Generate statistical reports with proper analysis
- [ ] Measure actual vs claimed improvements for all techniques
- [ ] Update documentation with empirical results

---

## Architecture Overview

```
Phase 2 Execution Flow:
┌─────────────────────────────────────────────────────────────┐
│                    Phase 2: Experimental Testing             │
├─────────────────────────────────────────────────────────────┤
│  1. Complete Harness → 2. Dry Run Tests → 3. Full Experiments │
│     (collector, analyzer,   (no API calls)     (real LLM calls) │
│      runner, reports)                                         │
├─────────────────────────────────────────────────────────────┤
│  4. Statistical Analysis → 5. Report Generation → 6. Claim Validation │
│     (Wilcoxon, bootstrap,    (markdown reports)     (update docs) │
│      effect sizes)                                           │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 2A: Complete Validation Harness (Days 1-2)

### TASK-P2.1.1: Create Response Collector
**ID**: TASK-P2.1.1
**Title**: Implement Response Collector for LLM API Integration
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 45 min
**Dependencies**: Phase 1 evaluation system

**Files**:
- `benchmarks/harness/collector.py` (create)

**Description**:
Implement the response collector that handles LLM API calls, manages rate limits, and stores responses with metadata.

**Features**:
- Abstract LLM API interface (supports multiple providers)
- Rate limiting and retry logic
- Response caching to avoid duplicate calls
- Error handling for API failures
- Metadata collection (timestamps, token usage, etc.)

**Acceptance Criteria**:
- [ ] Can make API calls to LLM providers
- [ ] Handles rate limits and retries gracefully
- [ ] Stores responses in structured JSON format
- [ ] Includes comprehensive metadata
- [ ] Supports dry-run mode (no API calls)

---

### TASK-P2.1.2: Create Statistical Analyzer
**ID**: TASK-P2.1.2
**Title**: Implement Statistical Analysis Engine
**Priority**: HIGH
**Complexity**: High
**Time Estimate**: 60 min
**Dependencies**: TASK-P2.1.1

**Files**:
- `benchmarks/harness/analyzer.py` (create)

**Description**:
Implement the statistical analysis engine with all research-backed methods from our validation framework.

**Features**:
- Wilcoxon signed-rank test for paired comparisons
- BCa bootstrap confidence intervals (9999 resamples)
- Cohen's d and Hedges' g effect size calculations
- Holm-Bonferroni multiple comparison corrections
- Power analysis for sample size validation

**Acceptance Criteria**:
- [ ] Wilcoxon test implementation with proper p-values
- [ ] Bootstrap CI calculation (BCa method)
- [ ] Effect size calculations (Cohen's d, Hedges' g)
- [ ] Multiple comparison corrections
- [ ] Handles edge cases (small samples, ties, etc.)

---

### TASK-P2.1.3: Create Main Validation Runner
**ID**: TASK-P2.1.3
**Title**: Implement Main Validation Runner Script
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 45 min
**Dependencies**: TASK-P2.1.2

**Files**:
- `benchmarks/run_validation.py` (create)
- `benchmarks/harness/runner.py` (create)

**Description**:
Create the main execution script that orchestrates the complete validation workflow.

**Features**:
- Command-line interface with options
- Workflow orchestration (collection → evaluation → analysis → reporting)
- Progress reporting and logging
- Configuration management
- Error handling and recovery

**CLI Interface**:
```bash
# Full validation run
python benchmarks/run_validation.py

# Dry run (no API calls)
python benchmarks/run_validation.py --dry-run

# Specific category only
python benchmarks/run_validation.py --category code-review

# Skip collection (use existing responses)
python benchmarks/run_validation.py --skip-collection

# Custom sample size
python benchmarks/run_validation.py --samples 50
```

**Acceptance Criteria**:
- [ ] Complete end-to-end workflow execution
- [ ] CLI arguments parsed correctly
- [ ] Progress reporting during execution
- [ ] Results saved to `benchmarks/results/`
- [ ] Exit codes indicate success/failure

---

### TASK-P2.1.4: Create Validation Report Template
**ID**: TASK-P2.1.4
**Title**: Implement Markdown Report Generation
**Priority**: MEDIUM
**Complexity**: Low
**Time Estimate**: 30 min
**Dependencies**: TASK-P2.1.3

**Files**:
- `benchmarks/harness/report_template.md` (create)

**Description**:
Create the markdown template for comprehensive validation reports.

**Report Sections**:
1. Executive Summary (measured vs claimed improvements)
2. Methodology (sample sizes, statistical tests used)
3. Technique-by-technique results
4. Statistical details (p-values, confidence intervals, effect sizes)
5. Detailed results tables
6. Recommendations and next steps

**Acceptance Criteria**:
- [ ] Template uses Jinja2/Mustache syntax
- [ ] All required metrics included
- [ ] Clear visualization of results
- [ ] Professional formatting
- [ ] Includes timestamps and metadata

---

## Phase 2B: Dry-Run Testing (Days 3-4)

### TASK-P2.2.1: Setup Test Environment
**ID**: TASK-P2.2.1
**Title**: Configure Test Environment and Dependencies
**Priority**: HIGH
**Complexity**: Low
**Time Estimate**: 30 min
**Dependencies**: TASK-P2.1.4

**Files**:
- `benchmarks/requirements.txt` (create)
- `benchmarks/config.example.json` (create)
- `benchmarks/.env.example` (create)

**Description**:
Set up the Python environment and configuration for running validation experiments.

**Dependencies**:
- scipy>=1.10.0 (statistical analysis)
- numpy>=1.24.0 (array operations)
- requests (API calls)
- python-dotenv (environment variables)
- jinja2 (template rendering)

**Acceptance Criteria**:
- [ ] Python virtual environment configured
- [ ] All dependencies installed
- [ ] Configuration files created
- [ ] Environment variables documented

---

### TASK-P2.2.2: Run Dry-Run Validation
**ID**: TASK-P2.2.2
**Title**: Execute Dry-Run Validation Experiments
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 60 min
**Dependencies**: TASK-P2.2.1

**Files**:
- `benchmarks/results/dry-run/` (output directory)

**Description**:
Run the complete validation workflow in dry-run mode to test the framework without making API calls.

**Test Scenarios**:
1. Single task validation (CR-001)
2. Category validation (all code-review tasks)
3. Full validation (all 12 tasks)
4. Error handling and edge cases

**Acceptance Criteria**:
- [ ] Dry-run completes without errors
- [ ] Mock data generated for all components
- [ ] Statistical analysis runs on mock data
- [ ] Reports generated successfully
- [ ] All workflow steps validated

---

### TASK-P2.2.3: Validate Framework Integration
**ID**: TASK-P2.2.3
**Title**: Test Framework Component Integration
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 45 min
**Dependencies**: TASK-P2.2.2

**Files**:
- `benchmarks/tests/integration/` (create test files)

**Description**:
Test that all framework components work together correctly.

**Integration Tests**:
- Task loading → Prompt generation → Response collection
- Response collection → Evaluation → Statistical analysis
- Statistical analysis → Report generation
- End-to-end workflow with mock data

**Acceptance Criteria**:
- [ ] All component interfaces work correctly
- [ ] Data flows properly between components
- [ ] Error handling works across components
- [ ] Performance acceptable for full runs

---

## Phase 2C: Full Validation Experiments (Days 5-8)

### TASK-P2.3.1: Configure LLM API Access
**ID**: TASK-P2.3.1
**Title**: Setup LLM API Access and Rate Limiting
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 30 min
**Dependencies**: TASK-P2.2.3

**Files**:
- `benchmarks/config.json` (create)
- `benchmarks/.env` (create)

**Description**:
Configure access to LLM APIs for running real validation experiments.

**API Configuration**:
- Primary: Claude API (Anthropic)
- Fallback: OpenAI GPT-4
- Rate limiting: Respect API limits
- Cost tracking: Monitor token usage
- Error handling: API failures and retries

**Acceptance Criteria**:
- [ ] API credentials configured securely
- [ ] Rate limiting implemented
- [ ] Cost tracking enabled
- [ ] Fallback providers configured

---

### TASK-P2.3.2: Run Pilot Experiment
**ID**: TASK-P2.3.2
**Title**: Execute Pilot Validation Experiment
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 45 min
**Dependencies**: TASK-P2.3.1

**Files**:
- `benchmarks/results/pilot/` (output directory)

**Description**:
Run a small-scale pilot experiment to validate the framework with real API calls.

**Pilot Scope**:
- 1 task per category (4 tasks total)
- 5 samples per condition (20 total API calls)
- Full workflow: collection → evaluation → analysis → reporting

**Acceptance Criteria**:
- [ ] Real API calls successful
- [ ] Data collection works correctly
- [ ] Evaluation produces valid scores
- [ ] Statistical analysis runs
- [ ] Reports generated successfully

---

### TASK-P2.3.3: Execute Full Validation Suite
**ID**: TASK-P2.3.3
**Title**: Run Complete Validation Experiment Suite
**Priority**: HIGH
**Complexity**: High
**Time Estimate**: 180 min
**Dependencies**: TASK-P2.3.2

**Files**:
- `benchmarks/results/full-experiment/` (output directory)

**Description**:
Execute the complete validation experiment suite with statistical power requirements.

**Full Experiment Scope**:
- All 12 benchmark tasks
- 30-50 samples per condition (360-600 API calls)
- All 4 prompting techniques tested
- Multi-prompt variants for robustness

**Acceptance Criteria**:
- [ ] All tasks completed successfully
- [ ] Sufficient sample size for statistical power
- [ ] Data quality validated
- [ ] No API failures or data loss
- [ ] Complete dataset for analysis

---

### TASK-P2.3.4: Generate Statistical Reports
**ID**: TASK-P2.3.4
**Title**: Create Comprehensive Statistical Analysis Reports
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 60 min
**Dependencies**: TASK-P2.3.3

**Files**:
- `benchmarks/results/reports/` (output directory)

**Description**:
Generate comprehensive statistical reports with all required metrics.

**Report Requirements**:
- Measured vs claimed improvements for each technique
- Statistical significance (p-values)
- Effect sizes (Cohen's d)
- Confidence intervals (95% BCa bootstrap)
- Power analysis validation
- Technique-by-technique breakdowns

**Acceptance Criteria**:
- [ ] All statistical tests completed
- [ ] Effect sizes calculated and interpreted
- [ ] Confidence intervals reported
- [ ] Clear conclusions about each claim
- [ ] Professional report formatting

---

## Phase 2D: Results Analysis & Documentation (Days 9-10)

### TASK-P2.4.1: Analyze Experimental Results
**ID**: TASK-P2.4.1
**Title**: Analyze Validation Results and Draw Conclusions
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 60 min
**Dependencies**: TASK-P2.3.4

**Files**:
- `docs/research/2025-12-06-validation-results-analysis.md` (create)

**Description**:
Analyze the experimental results and determine which claims are validated.

**Analysis Framework**:
1. **Technique Performance**: Which techniques show significant improvements?
2. **Claim Validation**: Which of our research-backed claims hold up?
3. **Effect Size Interpretation**: How large are the measured improvements?
4. **Task Category Differences**: Do techniques work better for certain task types?
5. **Statistical Robustness**: Are results statistically significant and practically meaningful?

**Acceptance Criteria**:
- [ ] Clear validation status for each claim
- [ ] Effect size interpretations
- [ ] Recommendations for technique usage
- [ ] Suggestions for further research

---

### TASK-P2.4.2: Update Documentation with Results
**ID**: TASK-P2.4.2
**Title**: Update Project Documentation with Empirical Results
**Priority**: HIGH
**Complexity**: Medium
**Time Estimate**: 45 min
**Dependencies**: TASK-P2.4.1

**Files**:
- `AGENTS.md` (modify)
- `README.md` (modify)
- `skills/prompting/incentive-prompting/SKILL.md` (modify)

**Description**:
Update all documentation to reflect empirical validation results.

**Updates Required**:
- Add empirical validation status to claims
- Include measured effect sizes
- Update caveats based on results
- Add usage recommendations
- Reference validation methodology

**Acceptance Criteria**:
- [ ] All claims updated with validation status
- [ ] Empirical results clearly documented
- [ ] Usage guidance based on results
- [ ] References to validation methodology

---

### TASK-P2.4.3: Create Validation Dashboard
**ID**: TASK-P2.4.3
**Title**: Build Simple Validation Results Dashboard
**Priority**: MEDIUM
**Complexity**: Low
**Time Estimate**: 30 min
**Dependencies**: TASK-P2.4.2

**Files**:
- `benchmarks/dashboard.html` (create)
- `benchmarks/dashboard.py` (create)

**Description**:
Create a simple HTML dashboard to visualize validation results.

**Dashboard Features**:
- Technique performance comparison
- Claim validation status
- Effect size visualizations
- Statistical significance indicators
- Export functionality

**Acceptance Criteria**:
- [ ] Dashboard loads and displays results
- [ ] Clear visualization of key metrics
- [ ] Interactive elements work
- [ ] Can be viewed in browser

---

### TASK-P2.4.4: Prepare Phase 3 Recommendations
**ID**: TASK-P2.4.4
**Title**: Document Recommendations for Phase 3 Development
**Priority**: MEDIUM
**Complexity**: Low
**Time Estimate**: 30 min
**Dependencies**: TASK-P2.4.3

**Files**:
- `plans/2025-12-07-phase3-recommendations.md` (create)

**Description**:
Document recommendations for Phase 3 based on validation results.

**Recommendations Areas**:
1. **Technique Refinement**: Which techniques to emphasize or modify?
2. **Framework Improvements**: What to enhance in the validation framework?
3. **Documentation Updates**: How to present validated claims?
4. **Future Research**: What additional validation is needed?

**Acceptance Criteria**:
- [ ] Clear recommendations documented
- [ ] Prioritized by impact and feasibility
- [ ] Timeline estimates included
- [ ] Success metrics defined

---

## Dependencies

### External Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| scipy | >=1.10.0 | Statistical analysis |
| numpy | >=1.24.0 | Array operations |
| requests | >=2.28.0 | API calls |
| python-dotenv | >=1.0.0 | Environment variables |
| jinja2 | >=3.1.0 | Template rendering |
| anthropic | >=0.5.0 | Claude API client |
| openai | >=1.0.0 | OpenAI API client |

### Internal Dependencies
| Component | Dependency |
|-----------|------------|
| Response Collector | LLM API access configured |
| Statistical Analyzer | Experimental data collected |
| Main Runner | All components integrated |
| Report Generation | Statistical analysis complete |

---

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API rate limits exceeded | High | Medium | Implement exponential backoff, batch processing |
| API costs exceed budget | Medium | Low | Cost tracking, budget alerts, sample size optimization |
| Statistical analysis errors | High | Low | Comprehensive testing, peer review of methodology |
| Data quality issues | High | Medium | Validation checks, data integrity monitoring |
| Experimental bias | Medium | Medium | Randomization, blinding where possible, multiple runs |
| Model version changes | Low | Low | Document model versions, re-run validation quarterly |

---

## Testing Plan

### Unit Tests
- [ ] Response collector API integration
- [ ] Statistical analysis functions
- [ ] Report generation templates
- [ ] Configuration parsing

### Integration Tests
- [ ] End-to-end dry-run workflow
- [ ] API call handling and retries
- [ ] Data flow between components
- [ ] Report generation from mock data

### Manual Testing
- [ ] Pilot experiment execution
- [ ] Full experiment monitoring
- [ ] Result validation and sanity checks
- [ ] Dashboard functionality

---

## Rollback Plan

If Phase 2 encounters issues:
1. `benchmarks/results/` directory contains all experimental data
2. API credentials can be revoked if needed
3. Framework code can be reverted to Phase 1 state
4. Documentation updates can be rolled back
5. No changes to core system functionality

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sample Size | 30-50 per condition | Count of completed evaluations |
| Statistical Power | ≥80% | Power analysis on collected data |
| API Success Rate | ≥95% | Successful API calls / total attempts |
| Data Quality | 100% | Valid JSON responses with required fields |
| Claim Validation | ≥50% claims validated | Measured vs claimed improvement comparison |

---

## Task Summary

| ID | Title | Time | Complexity | Dependencies |
|----|-------|------|------------|--------------|
| P2.1.1 | Create Response Collector | 45m | Medium | Phase 1 complete |
| P2.1.2 | Create Statistical Analyzer | 60m | High | P2.1.1 |
| P2.1.3 | Create Main Runner | 45m | Medium | P2.1.2 |
| P2.1.4 | Create Report Template | 30m | Low | P2.1.3 |
| P2.2.1 | Setup Test Environment | 30m | Low | P2.1.4 |
| P2.2.2 | Run Dry-Run Validation | 60m | Medium | P2.2.1 |
| P2.2.3 | Validate Framework Integration | 45m | Medium | P2.2.2 |
| P2.3.1 | Configure LLM API Access | 30m | Medium | P2.2.3 |
| P2.3.2 | Run Pilot Experiment | 45m | Medium | P2.3.1 |
| P2.3.3 | Execute Full Validation Suite | 180m | High | P2.3.2 |
| P2.3.4 | Generate Statistical Reports | 60m | Medium | P2.3.3 |
| P2.4.1 | Analyze Experimental Results | 60m | Medium | P2.3.4 |
| P2.4.2 | Update Documentation | 45m | Medium | P2.4.1 |
| P2.4.3 | Create Validation Dashboard | 30m | Low | P2.4.2 |
| P2.4.4 | Prepare Phase 3 Recommendations | 30m | Low | P2.4.3 |

**Total Estimated Time**: ~14 hours (2 weeks with buffer)

---

## Parallel Execution Opportunities

These task groups can be worked on concurrently:

**Track A (Framework Completion)**: P2.1.1 → P2.1.2 → P2.1.3 → P2.1.4
**Track B (Environment Setup)**: P2.2.1 (parallel with Track A)
**Track C (Testing)**: P2.2.2 → P2.2.3
**Track D (Experiments)**: P2.3.1 → P2.3.2 → P2.3.3 → P2.3.4
**Track E (Analysis)**: P2.4.1 → P2.4.2 → P2.4.3 → P2.4.4

---

## References

- Research: `docs/research/2025-12-06-validation-framework-research.md`
- Statistical Methods: `docs/research/2025-12-06-quality-benchmarking-statistical-validation.md`
- Framework: `plans/2025-12-06-validation-framework-phase1.md`
- Techniques: `skills/prompting/incentive-prompting/SKILL.md`

---

*Plan created: December 6, 2025*
*Estimated effort: 14 hours (~2 weeks)*
*Complexity: Medium-High*
*Risk: Medium (API costs, experimental complexity)*