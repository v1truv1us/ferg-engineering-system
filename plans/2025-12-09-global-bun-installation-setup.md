# Global Bun Installation Setup Plan

**Status**: Draft
**Created**: 2025-12-09
**Estimated Effort**: 4-6 hours
**Complexity**: Medium

## Overview
Set up the ai-eng-system for global installation via bun after publishing to GitHub npm registry. This involves fixing installation script bugs, testing the publishing workflow, configuring bun registry settings, and validating the end-to-end installation process.

## Success Criteria
- [ ] Package publishes successfully to GitHub npm registry
- [ ] `bun install -g @v1truv1us/ai-eng-system` works from any directory
- [ ] Installed package functions correctly in OpenCode
- [ ] README.md contains accurate bun installation instructions
- [ ] Installation process is tested and documented

## Architecture
Current setup already supports GitHub Package Registry publishing:
- `package.json` configured with `publishConfig.registry = "https://npm.pkg.github.com"`
- GitHub workflow `publish-gpr.yml` handles automated publishing
- Install script supports global installation to `~/.config/opencode`

The main issues to resolve:
1. Install script bug (missing NAMESPACE_PREFIX)
2. Bun registry configuration for GitHub packages
3. End-to-end testing of the installation flow

## Phase 1: Fix Installation Script

**Goal**: Resolve the NAMESPACE_PREFIX bug that prevents proper installation
**Duration**: 30 min

### Task 1.1: Fix NAMESPACE_PREFIX in install.js
- **ID**: FIX-INSTALL-SCRIPT
- **Depends On**: None
- **Files**:
  - `scripts/install.js` (modify)
- **Acceptance Criteria**:
  - [ ] NAMESPACE_PREFIX constant defined as "ai-eng"
  - [ ] Script runs without undefined variable errors
  - [ ] Installation completes successfully
- **Time**: 15 min
- **Complexity**: Low

### Task 1.2: Test local installation
- **ID**: TEST-LOCAL-INSTALL
- **Depends On**: FIX-INSTALL-SCRIPT
- **Files**:
  - `scripts/install.js` (test)
- **Acceptance Criteria**:
  - [ ] `bun run install:global` works
  - [ ] Files installed to correct ~/.config/opencode locations
  - [ ] OpenCode can access installed commands/agents
- **Time**: 15 min
- **Complexity**: Low

## Phase 2: Test Publishing Workflow

**Goal**: Ensure package publishes correctly to GitHub npm registry
**Duration**: 1 hour

### Task 2.1: Test local publishing
- **ID**: TEST-LOCAL-PUBLISH
- **Depends On**: None
- **Files**:
  - `package.json` (verify)
  - `.github/workflows/publish-gpr.yml` (verify)
- **Acceptance Criteria**:
  - [ ] Build completes successfully
  - [ ] Package contains all required files
  - [ ] Local publish to GPR works (dry-run)
- **Time**: 20 min
- **Complexity**: Medium

### Task 2.2: Trigger GitHub Actions publish
- **ID**: TRIGGER-GITHUB-PUBLISH
- **Depends On**: TEST-LOCAL-PUBLISH
- **Files**:
  - `.github/workflows/publish-gpr.yml` (trigger)
- **Acceptance Criteria**:
  - [ ] GitHub Actions workflow runs successfully
  - [ ] Package appears in GitHub Packages
  - [ ] Package version matches package.json
- **Time**: 20 min
- **Complexity**: Medium

### Task 2.3: Verify package contents
- **ID**: VERIFY-PACKAGE-CONTENTS
- **Depends On**: TRIGGER-GITHUB-PUBLISH
- **Files**:
  - Published package (verify)
- **Acceptance Criteria**:
  - [ ] All dist/ files included
  - [ ] scripts/install.js executable
  - [ ] package.json metadata correct
- **Time**: 20 min
- **Complexity**: Low

## Phase 3: Configure Bun Registry

**Goal**: Set up bun to install from GitHub npm registry
**Duration**: 45 min

### Task 3.1: Configure bun registry globally
- **ID**: CONFIGURE-BUN-REGISTRY
- **Depends On**: TRIGGER-GITHUB-PUBLISH
- **Files**:
  - `~/.bunfig.toml` (create/modify)
- **Acceptance Criteria**:
  - [ ] Bun configured to use GitHub registry for @v1truv1us scope
  - [ ] Authentication token configured
  - [ ] Registry configuration persists
- **Time**: 15 min
- **Complexity**: Medium

### Task 3.2: Test bun install command
- **ID**: TEST-BUN-INSTALL
- **Depends On**: CONFIGURE-BUN-REGISTRY
- **Files**:
  - None (command line)
- **Acceptance Criteria**:
  - [ ] `bun install -g @v1truv1us/ai-eng-system` succeeds
  - [ ] Package installs to bun global location
  - [ ] ai-eng-install command available globally
- **Time**: 15 min
- **Complexity**: Low

### Task 3.3: Test global installation script
- **ID**: TEST-GLOBAL-INSTALL-SCRIPT
- **Depends On**: TEST-BUN-INSTALL
- **Files**:
  - `~/.bun/bin/ai-eng-install` (verify)
- **Acceptance Criteria**:
  - [ ] `ai-eng-install --global` works
  - [ ] OpenCode plugins install correctly
  - [ ] Commands and agents accessible
- **Time**: 15 min
- **Complexity**: Low

## Phase 4: End-to-End Testing

**Goal**: Validate complete installation and functionality
**Duration**: 1 hour

### Task 4.1: Full workflow test
- **ID**: TEST-GLOBAL-INSTALL
- **Depends On**: TEST-GLOBAL-INSTALL-SCRIPT
- **Files**:
  - Test project directory (create)
- **Acceptance Criteria**:
  - [ ] Fresh environment installation works
  - [ ] All commands functional in OpenCode
  - [ ] Agents respond correctly
  - [ ] No permission or path errors
- **Time**: 30 min
- **Complexity**: Medium

### Task 4.2: Cross-platform validation
- **ID**: VALIDATE-CROSS-PLATFORM
- **Depends On**: TEST-GLOBAL-INSTALL
- **Files**:
  - Various test environments
- **Acceptance Criteria**:
  - [ ] Works on different operating systems
  - [ ] Handles different shell environments
  - [ ] Graceful error handling for edge cases
- **Time**: 30 min
- **Complexity**: Medium

## Phase 5: Documentation Update

**Goal**: Update documentation with verified instructions
**Duration**: 30 min

### Task 5.1: Update README installation section
- **ID**: UPDATE-README
- **Depends On**: TEST-GLOBAL-INSTALL
- **Files**:
  - `README.md` (modify)
- **Acceptance Criteria**:
  - [ ] Bun installation instructions accurate
  - [ ] Prerequisites clearly listed
  - [ ] Troubleshooting section added
  - [ ] Examples match tested workflow
- **Time**: 20 min
- **Complexity**: Low

### Task 5.2: Add troubleshooting guide
- **ID**: ADD-TROUBLESHOOTING
- **Depends On**: UPDATE-README
- **Files**:
  - `README.md` (modify)
- **Acceptance Criteria**:
  - [ ] Common issues documented
  - [ ] Registry authentication steps
  - [ ] Permission error solutions
  - [ ] Verification commands included
- **Time**: 10 min
- **Complexity**: Low

## Dependencies
- GitHub CLI authentication (already completed)
- Bun runtime installed
- OpenCode platform available for testing
- GitHub repository access

## Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| GitHub token expires during testing | High | Low | Use workflow_dispatch for testing, document token refresh process |
| Registry authentication fails | High | Medium | Test authentication separately, provide clear error messages |
| Bun global install conflicts with npm | Medium | Low | Test in isolated environment, document coexistence |
| Package version conflicts | Medium | Medium | Use semantic versioning, test version bumps |
| Platform-specific path issues | Medium | Low | Test on multiple platforms, add platform detection |

## Testing Plan
### Unit Tests
- [ ] Install script parameter validation
- [ ] Registry configuration parsing
- [ ] Path resolution logic

### Integration Tests
- [ ] End-to-end publish → install → use workflow
- [ ] Authentication token handling
- [ ] Cross-platform installation

### Manual Testing
- [ ] Fresh environment setup
- [ ] Error condition handling
- [ ] Update/installation workflow

## Rollback Plan
1. If publishing fails: Delete GitHub package version manually via web interface
2. If installation fails: Remove global bun installation with `bun uninstall -g @v1truv1us/ai-eng-system`
3. If script broken: Revert install.js changes and use local installation method

## References
- [GitHub Packages Documentation](https://docs.github.com/en/packages)
- [Bun Global Installation](https://bun.sh/docs/cli/install)
- [OpenCode Plugin System](https://opencode.dev/docs/plugins)
- Current README.md installation section