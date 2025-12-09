# AI Provider Corrections Implementation Plan

**Status**: Draft
**Created**: 2025-12-06
**Estimated Effort**: 4-6 hours
**Complexity**: Medium

## Overview

Correct the AI provider implementations to achieve 100% accuracy by removing incorrect providers, fixing metadata inconsistencies, and validating integration approaches. This ensures the validation framework tests only legitimate AI coding assistants with proper CLI/API access.

## Success Criteria

- [ ] All AI providers are legitimate coding assistants with CLI/API access
- [ ] No GUI-only tools included in provider list
- [ ] Metadata is consistent across all configuration files
- [ ] Provider implementations match documented integration methods
- [ ] Framework passes validation with real provider responses

## Architecture

Current provider architecture remains intact - the changes are primarily cleanup and correction of provider selection and metadata.

```
Provider System (Unchanged)
├── LLMProvider (abstract base)
├── AnthropicProvider (CLI: claude -p) ← Keep
├── OpenCodeProvider (CLI: opencode run) ← Keep
├── GitHubProvider (HTTP: copilot-api) ← Keep
└── CursorProvider (placeholder) ← Remove
```

## Phase 1: Provider Cleanup

**Goal**: Remove incorrect providers and validate remaining ones
**Duration**: 1-2 hours

### Task 1.1: Remove Cursor Provider

- **ID**: PROV-001-A
- **Depends On**: None
- **Files**:
  - `benchmarks/config.json` (modify)
  - `benchmarks/harness/collector.py` (modify)
- **Acceptance Criteria**:
  - [ ] Cursor provider removed from config.json
  - [ ] CursorProvider class removed from collector.py
  - [ ] Factory method no longer references cursor
  - [ ] No references to cursor in codebase
- **Time**: 15 min
- **Complexity**: Low

### Task 1.2: Validate GitHub Copilot Integration

- **ID**: PROV-001-B
- **Depends On**: None
- **Files**:
  - `benchmarks/harness/collector.py` (review)
  - Research documentation (review)
- **Acceptance Criteria**:
  - [ ] Confirm copilot-api proxy is legitimate approach
  - [ ] Verify localhost:4141 endpoint is correct
  - [ ] Document alternative approaches if proxy is unreliable
- **Time**: 30 min
- **Complexity**: Low

## Phase 2: Metadata Standardization

**Goal**: Fix inconsistent repository URLs, author info, and package names
**Duration**: 1-2 hours

### Task 2.1: Standardize Repository URLs

- **ID**: META-002-A
- **Depends On**: None
- **Files**:
  - `package.json` (modify)
  - `.claude-plugin/plugin.json` (modify)
  - `README.md` (verify)
  - `PLUGIN.md` (verify)
- **Acceptance Criteria**:
  - [ ] All files reference same canonical repository URL
  - [ ] Choose between v1truv1us vs ferg-cod3s consistently
  - [ ] Update any outdated URLs
- **Time**: 20 min
- **Complexity**: Low

### Task 2.2: Unify Author Information

- **ID**: META-002-B
- **Depends On**: META-002-A
- **Files**:
  - `package.json` (modify)
  - `.claude-plugin/plugin.json` (modify)
  - `README.md` (verify)
- **Acceptance Criteria**:
  - [ ] Consistent author name across all files
  - [ ] Consistent email address across all files
  - [ ] Consistent author URL if applicable
- **Time**: 15 min
- **Complexity**: Low

### Task 2.3: Fix Package Name References

- **ID**: META-002-C
- **Depends On**: META-002-A
- **Files**:
  - `README.md` (modify)
  - `PLUGIN.md` (modify)
  - Documentation files (verify)
- **Acceptance Criteria**:
  - [ ] Installation commands match actual package.json names
  - [ ] NPX commands are correct
  - [ ] No references to non-existent packages
- **Time**: 20 min
- **Complexity**: Low

## Phase 3: Provider Validation

**Goal**: Ensure all remaining providers work correctly
**Duration**: 1-2 hours

### Task 3.1: Test Anthropic Provider

- **ID**: VALID-003-A
- **Depends On**: None
- **Files**:
  - `benchmarks/harness/collector.py` (test)
- **Acceptance Criteria**:
  - [ ] Claude Code CLI responds to test prompts
  - [ ] Error handling works for missing API keys
  - [ ] Temporary file cleanup functions properly
- **Time**: 20 min
- **Complexity**: Medium

### Task 3.2: Test OpenCode Provider

- **ID**: VALID-003-B
- **Depends On**: None
- **Files**:
  - `benchmarks/harness/collector.py` (test)
- **Acceptance Criteria**:
  - [ ] OpenCode CLI responds to test prompts
  - [ ] Subprocess execution handles timeouts
  - [ ] Response parsing works correctly
- **Time**: 20 min
- **Complexity**: Medium

### Task 3.3: Test GitHub Provider

- **ID**: VALID-003-C
- **Depends On**: None
- **Files**:
  - `benchmarks/harness/collector.py` (test)
- **Acceptance Criteria**:
  - [ ] HTTP requests work when proxy is running
  - [ ] Proper error handling for connection failures
  - [ ] JSON response parsing functions
- **Time**: 20 min
- **Complexity**: Medium

## Phase 4: Documentation Updates

**Goal**: Update docs to reflect corrected provider list
**Duration**: 30-60 min

### Task 4.1: Update README Provider List

- **ID**: DOCS-004-A
- **Depends On**: PROV-001-A
- **Files**:
  - `README.md` (modify)
- **Acceptance Criteria**:
  - [ ] Remove Cursor from supported platforms
  - [ ] Update provider comparison table
  - [ ] Ensure installation instructions are accurate
- **Time**: 15 min
- **Complexity**: Low

### Task 4.2: Update Configuration Documentation

- **ID**: DOCS-004-B
- **Depends On**: META-002-C
- **Files**:
  - `benchmarks/README-config.md` (verify)
  - `INSTALLATION.md` (verify)
- **Acceptance Criteria**:
  - [ ] Configuration docs match actual setup
  - [ ] Provider list is accurate
  - [ ] No references to removed providers
- **Time**: 15 min
- **Complexity**: Low

## Dependencies

- Claude Code CLI must be installed and authenticated
- OpenCode CLI must be installed
- GitHub copilot-api proxy (optional for GitHub provider)
- Node.js/npm for package management

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CLI tools not installed | High | Medium | Add runtime checks for tool availability |
| API authentication issues | High | Medium | Test with mock responses first |
| Repository URL confusion | Medium | Low | Use single canonical URL everywhere |
| Breaking existing installations | Medium | Low | Test installation scripts thoroughly |

## Testing Plan

### Unit Tests
- [ ] Provider factory method creates correct instances
- [ ] Each provider handles missing dependencies gracefully
- [ ] Configuration loading works with corrected metadata

### Integration Tests
- [ ] Full validation pipeline runs with corrected providers
- [ ] CLI tools respond correctly to test prompts
- [ ] Error handling works for network/API failures

### Manual Testing
- [ ] Install system with corrected metadata
- [ ] Run validation with each provider individually
- [ ] Verify no broken references to removed providers

## Rollback Plan

If issues arise:
1. Revert provider removal by restoring CursorProvider
2. Use git revert for metadata changes
3. Restore backup of config files
4. Test with mock providers to isolate issues

## References

- `docs/research/2025-12-06-ai-provider-sources-validation.md` - Research findings
- `benchmarks/harness/collector.py` - Current provider implementations
- `README.md` - Current documentation
- `package.json` - Package metadata