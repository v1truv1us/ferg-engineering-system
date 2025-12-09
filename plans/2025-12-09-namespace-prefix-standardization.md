# Namespace Prefix Standardization Implementation Plan

**Status**: Complete
**Created**: 2025-12-09
**Estimated Effort**: 4-6 hours
**Complexity**: Medium

## Overview

The codebase currently has inconsistent namespace prefixes (`ferg/` vs `ai-eng/`) across different installation scripts and documentation. This creates confusion for users and potential conflicts when multiple installation methods are used. This plan standardizes on a single prefix and updates all references consistently.

## Success Criteria
- [ ] All installation scripts use the same namespace prefix
- [ ] Documentation accurately reflects the chosen prefix
- [ ] Build process produces consistent output
- [ ] No breaking changes for existing installations
- [ ] Clear migration path documented

## Architecture

```
ferg-engineering-system/
├── build.ts                    # Central prefix configuration
├── scripts/install.js          # References build config
├── setup-global.sh             # Uses standardized prefix
├── setup-selective.sh          # Uses standardized prefix
├── verify-install.sh           # Checks standardized prefix
├── docs/                       # Accurate documentation
└── skills/plugin-dev/SKILL.md  # Updated examples
```

## Phase 1: Configuration Standardization

**Goal**: Establish single source of truth for namespace prefix
**Duration**: 1 hour

### Task 1.1: Add Prefix Configuration to Build System
- **ID**: NS-001-A
- **Depends On**: None
- **Files**:
  - `build.ts` (modify - add NAMESPACE_PREFIX constant)
- **Acceptance Criteria**:
  - [ ] NAMESPACE_PREFIX constant defined at top of build.ts
  - [ ] All hardcoded "ai-eng" references use the constant
  - [ ] Build still produces correct output
- **Time**: 20 min
- **Complexity**: Low

### Task 1.2: Update Installation Scripts
- **ID**: NS-001-B
- **Depends On**: NS-001-A
- **Files**:
  - `scripts/install.js` (modify - use build config)
  - `setup-global.sh` (modify - use standardized prefix)
  - `setup-selective.sh` (modify - change from "ferg" to chosen prefix)
- **Acceptance Criteria**:
  - [ ] All scripts reference the same prefix
  - [ ] Scripts can be run without errors
  - [ ] Installation directories match expected structure
- **Time**: 30 min
- **Complexity**: Medium

### Task 1.3: Update Verification Script
- **ID**: NS-001-C
- **Depends On**: NS-001-B
- **Files**:
  - `verify-install.sh` (modify - check correct prefix)
- **Acceptance Criteria**:
  - [ ] Script checks for the standardized prefix
  - [ ] Error messages are clear and helpful
  - [ ] Verification works for both global and local installs
- **Time**: 15 min
- **Complexity**: Low

## Phase 2: Documentation Updates

**Goal**: Ensure all documentation reflects the standardized prefix
**Duration**: 2 hours

### Task 2.1: Update Plugin Development Skill Documentation
- **ID**: NS-002-A
- **Depends On**: None
- **Files**:
  - `skills/plugin-dev/SKILL.md` (modify - update all ferg/ references)
- **Acceptance Criteria**:
  - [ ] All command examples use correct prefix
  - [ ] All agent references use correct prefix
  - [ ] Directory structure examples are accurate
- **Time**: 45 min
- **Complexity**: Medium

### Task 2.2: Update Installation Documentation
- **ID**: NS-002-B
- **Depends On**: NS-002-A
- **Files**:
  - `INSTALLATION.md` (modify - update namespace references)
  - `README.md` (modify - update usage examples)
- **Acceptance Criteria**:
  - [ ] Installation instructions are consistent
  - [ ] Usage examples match actual behavior
  - [ ] No conflicting information between docs
- **Time**: 30 min
- **Complexity**: Low

### Task 2.3: Update Build and Development Documentation
- **ID**: NS-002-C
- **Depends On**: NS-002-B
- **Files**:
  - `build.ts` (modify - add comments about prefix)
  - `IMPLEMENTATION-GUIDE.md` (modify if exists)
  - `PHASE-1-IMPLEMENTATION.md` (modify if exists)
- **Acceptance Criteria**:
  - [ ] Build process documentation is clear
  - [ ] Developer onboarding includes prefix information
  - [ ] Future contributors understand the standardization
- **Time**: 30 min
- **Complexity**: Low

## Phase 3: Testing and Validation

**Goal**: Ensure changes work correctly and don't break existing functionality
**Duration**: 1.5 hours

### Task 3.1: Test Build Process
- **ID**: NS-003-A
- **Depends On**: NS-001-A
- **Files**:
  - `dist/.opencode/` (validate output)
- **Acceptance Criteria**:
  - [ ] Build completes successfully
  - [ ] Output directories use correct prefix
  - [ ] All expected files are generated
- **Time**: 20 min
- **Complexity**: Low

### Task 3.2: Test Installation Scripts
- **ID**: NS-003-B
- **Depends On**: NS-001-B, NS-001-C
- **Files**:
  - Test installation directories
- **Acceptance Criteria**:
  - [ ] Global installation works
  - [ ] Local installation works
  - [ ] Verification script passes
  - [ ] No conflicts with existing installations
- **Time**: 30 min
- **Complexity**: Medium

### Task 3.3: Validate Documentation Accuracy
- **ID**: NS-003-C
- **Depends On**: NS-002-A, NS-002-B, NS-002-C
- **Files**:
  - All modified documentation files
- **Acceptance Criteria**:
  - [ ] All command examples work
  - [ ] All agent references are correct
  - [ ] Installation instructions produce expected results
- **Time**: 30 min
- **Complexity**: Low

## Phase 4: Migration Support

**Goal**: Provide clear path for users with existing mixed installations
**Duration**: 1 hour

### Task 4.1: Create Migration Documentation
- **ID**: NS-004-A
- **Depends On**: None
- **Files**:
  - `MIGRATION.md` (create - new file)
- **Acceptance Criteria**:
  - [ ] Clear steps for users with mixed installations
  - [ ] Instructions for cleaning up duplicate agents
  - [ ] Verification steps after migration
- **Time**: 30 min
- **Complexity**: Medium

### Task 4.2: Add Migration Script
- **ID**: NS-004-B
- **Depends On**: NS-004-A
- **Files**:
  - `scripts/migrate-namespaces.sh` (create - new file)
- **Acceptance Criteria**:
  - [ ] Script detects mixed installations
  - [ ] Safe migration without data loss
  - [ ] Rollback capability
- **Time**: 30 min
- **Complexity**: High

## Dependencies
- Node.js/Bun runtime for build process
- Shell environment for installation scripts
- Access to `~/.config/opencode` for global installations

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Breaking existing installations | High | Medium | Test migration path thoroughly, provide rollback |
| Documentation drift | Medium | Low | Add validation in build process |
| User confusion during transition | Medium | High | Clear migration documentation and communication |
| Build process complexity | Low | Low | Keep prefix configuration simple |

## Testing Plan

### Unit Tests
- [ ] Build process produces correct directory structure
- [ ] Installation scripts create expected files
- [ ] Verification script detects correct installations

### Integration Tests
- [ ] Full installation workflow (build → install → verify)
- [ ] Multiple installation methods don't conflict
- [ ] Migration script handles edge cases

### Manual Testing
- [ ] Install on clean system
- [ ] Test commands and agents work
- [ ] Verify no conflicts with existing Claude plugins

## Rollback Plan

If issues arise:
1. Revert build.ts changes to use hardcoded prefix
2. Update scripts to match reverted prefix
3. Rebuild and redeploy packages
4. Communicate rollback to users

## Implementation Complete ✅

**Date Completed**: 2025-12-09
**All phases completed successfully**:
- ✅ Configuration standardization in build system
- ✅ Installation script updates
- ✅ Documentation updates
- ✅ Testing and validation
- ✅ Migration support created

**Key Changes Made**:
- Added `NAMESPACE_PREFIX = "ai-eng"` constant to `build.ts`
- Updated all installation scripts to use standardized prefix
- Updated documentation and skills to reference `ai-eng/` namespace
- Created migration script for existing `ferg/` installations
- Rebuilt all generated files

**Verification Results**:
- Build process produces correct `ai-eng/` directory structure
- Installation scripts work correctly
- Verification script confirms proper namespace usage
- No breaking changes for new installations

## References
- `docs/research/2025-12-09-namespace-prefix-analysis.md` - Root cause analysis
- `build.ts` - Current build implementation
- `scripts/install.js` - Current installation logic
- `scripts/migrate-namespaces.sh` - Migration script for existing users
- `skills/plugin-dev/SKILL.md` - Current documentation examples