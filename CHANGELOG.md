# Changelog

All notable changes to the Ferg Engineering System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **documentation-specialist Agent**: Comprehensive technical documentation generation
  - Senior technical documentation specialist with 15+ years experience
  - Generates API docs, user guides, technical specifications, and reference materials
  - Analyzes codebases to create accurate, user-friendly documentation
  - Proactive documentation needs identification for code changes and new features
- Updated agent registry to include all 26 specialized agents
- Fixed swarm integration tests to reflect correct agent count

## [0.3.1] - 2025-12-12

### Added
- **docs-writer Agent**: Specialized documentation page writer
  - Expert technical documentation writer with 15+ years experience
  - Specific formatting rules: 1-3 word titles, 5-10 word descriptions
  - Text chunks ≤2 sentences, sections separated by ---
  - Imperative section titles, JS/TS code formatting (no semicolons/commas)
  - Complements documentation-specialist for individual page writing
- Documentation update plan and comprehensive fixes
- CHANGELOG.md for version tracking

### Fixed
- Repository references updated from `ferg-cod3s` to `v1truv1us`
- Package names corrected to `@v1truv1us/ai-eng-system`
- Command counts updated to reflect 15 total commands
- Agent counts updated to reflect 25 total agents (added docs-writer)
- Namespace references updated to `ai-eng/`
- Build commands updated from `npm` to `bun`

## [0.3.0-rc1] - 2025-01-05

### Added
- **Research Orchestration System**: Multi-phase research with parallel discovery
  - 3-phase workflow: Discovery → Analysis → Synthesis
  - Parallel agent execution for maximum efficiency
  - Evidence-based reporting with file:line references
  - Configurable scope (codebase/documentation/external/all) and depth (shallow/medium/deep)
- **24 Specialized Agents**: Complete agent ecosystem
  - Architecture & Planning: architect-advisor, backend-architect, infrastructure-builder
  - Development & Coding: frontend-reviewer, full-stack-developer, api-builder-enhanced, database-optimizer, java-pro
  - Quality & Testing: code-reviewer, test-generator, security-scanner, performance-engineer
  - DevOps & Deployment: deployment-engineer, monitoring-expert, cost-optimizer
  - AI & ML: ai-engineer, ml-engineer
  - Content & SEO: seo-specialist, prompt-optimizer
  - Plugin Development: agent-creator, command-creator, skill-creator, tool-creator, plugin-validator
- **Enhanced /research Command**: Comprehensive research capabilities
- **4 Skill Packages**: DevOps, prompting, research, and plugin-dev skills

### Changed
- Research command mode changed from `build` to `plan` (read-only operation)
- Test framework migrated from Vitest to bun:test
- Default research depth changed from `shallow` to `medium`

### Technical
- Parallel agent coordination with 3 concurrent discovery agents
- Evidence-based reporting system with confidence scoring
- Caching system with 1-hour TTL for research queries
- Memory-efficient file processing with streaming support

## [0.2.1] - 2025-12-09

### Fixed
- Package version updated to reflect current state
- Documentation consistency improvements

## [0.2.0] - 2025-12-05

### Added
- **Enhanced /plan Command**: Atomic task decomposition with 5-phase planning
  - Discovery phase with codebase analysis
  - Task decomposition into 15-60 minute chunks
  - Risk assessment with impact × likelihood matrix
  - Testing strategy definition
  - SEO and performance considerations
- **Enhanced /work Command**: Systematic execution with quality gates
  - 4-phase execution: Setup → Task Loop → Validation → Documentation
  - 6 sequential quality gates: Lint → Types → Tests → Build → Integration → Deploy
  - Todo management and progress tracking
  - Multiple execution modes: --continue, --validate-only, --dry-run
- **Comprehensive Testing**: 80%+ test coverage
  - Unit tests, integration tests, performance tests
  - Build validation and error handling
- **Documentation System**: Complete documentation infrastructure
  - COMMAND-ENHANCEMENTS.md with detailed command references
  - TESTING.md with comprehensive test suite documentation
  - TEST-SUMMARY.md with test reports and metrics

### Changed
- Command architecture enhanced with atomic task management
- Quality assurance pipeline with 6-gate validation
- Documentation structure with cross-referenced guides

## [0.1.0] - 2025-12-05

### Added
- **Context Engineering System**: Core context management
- **Initial Agent Coordination**: plan, build, review agent modes
- **Basic Command Set**: /plan, /review, /seo, /work, /compound, /deploy
- **Skill System**: DevOps and prompting skills
- **Documentation Framework**: AGENTS.md hierarchy system

## [0.0.2] - 2025-11-30

### Added
- Initial release with core functionality
- Basic agent and command structure
- Documentation system foundation

## [0.0.1] - 2025-11-30

### Added
- Beta release
- Core system architecture
- Initial command and agent definitions