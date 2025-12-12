# Auto-Publish Setup Implementation Plan

**Status**: Draft
**Created**: 2025-12-12
**Estimated Effort**: 2-3 hours
**Complexity**: Medium

## Overview
Set up automatic publishing of the ai-eng-system package when version changes are pushed to the main branch. This includes updating CI/CD workflows, fixing authentication issues, and ensuring proper version management.

## Success Criteria
- [ ] Auto-publish triggers on main branch pushes with version changes
- [ ] Package publishes successfully to both NPM and GitHub Packages
- [ ] Git tags and releases are created automatically
- [ ] Marketplace notifications work correctly
- [ ] No manual intervention required for patch releases

## Architecture
Current workflow structure:
```
Push to main → Version Check → Build → Test → Publish → Tag → Release → Notify Marketplace
```

## Phase 1: Workflow Configuration

**Goal**: Update GitHub Actions workflows to trigger on main branch
**Duration**: 45 min

### Task 1.1: Update auto-publish.yml trigger branch
- **ID**: AUTO-001-A
- **Depends On**: None
- **Files**:
  - `.github/workflows/auto-publish.yml` (modify)
- **Acceptance Criteria**:
  - [ ] Workflow triggers on push to main branch
  - [ ] Version comparison logic works correctly
  - [ ] Authentication uses proper tokens
- **Time**: 15 min
- **Complexity**: Low

### Task 1.2: Fix package name references in workflows
- **ID**: AUTO-001-B
- **Depends On**: AUTO-001-A
- **Files**:
  - `.github/workflows/auto-publish.yml` (modify)
- **Acceptance Criteria**:
  - [ ] Package name updated from `@ferg-cod3s/engineering-system` to `@v1truv1us/ai-eng-system`
  - [ ] Registry URLs are correct
- **Time**: 15 min
- **Complexity**: Low

### Task 1.3: Verify workflow permissions and environments
- **ID**: AUTO-001-C
- **Depends On**: AUTO-001-B
- **Files**:
  - `.github/workflows/auto-publish.yml` (modify)
- **Acceptance Criteria**:
  - [ ] OIDC permissions are correctly configured
  - [ ] Environment protection rules are appropriate
  - [ ] GitHub token permissions allow tagging and releasing
- **Time**: 15 min
- **Complexity**: Low

## Phase 2: Authentication Setup

**Goal**: Ensure proper authentication for both NPM and GitHub Packages publishing
**Duration**: 60 min

### Task 2.1: Configure NPM publishing authentication
- **ID**: AUTO-002-A
- **Depends On**: AUTO-001-C
- **Files**:
  - `.github/workflows/auto-publish.yml` (modify)
- **Acceptance Criteria**:
  - [ ] OIDC authentication configured for NPM registry
  - [ ] Provenance information included in packages
  - [ ] No hardcoded tokens in workflow files
- **Time**: 20 min
- **Complexity**: Medium

### Task 2.2: Configure GitHub Packages publishing
- **ID**: AUTO-002-B
- **Depends On**: AUTO-002-A
- **Files**:
  - `.github/workflows/publish-gpr.yml` (modify)
- **Acceptance Criteria**:
  - [ ] GitHub Packages registry URL configured
  - [ ] Proper scope set for @v1truv1us packages
  - [ ] GITHUB_TOKEN has correct permissions
- **Time**: 20 min
- **Complexity**: Medium

### Task 2.3: Test authentication setup
- **ID**: AUTO-002-C
- **Depends On**: AUTO-002-B
- **Files**:
  - None (manual testing)
- **Acceptance Criteria**:
  - [ ] Workflow can authenticate to both registries
  - [ ] Package publishing succeeds in dry-run mode
  - [ ] Error messages are clear if authentication fails
- **Time**: 20 min
- **Complexity**: Medium

## Phase 3: Version Management

**Goal**: Ensure version bumping and tagging works correctly
**Duration**: 45 min

### Task 3.1: Update version checking logic
- **ID**: AUTO-003-A
- **Depends On**: AUTO-002-C
- **Files**:
  - `.github/workflows/auto-publish.yml` (modify)
- **Acceptance Criteria**:
  - [ ] Version comparison handles pre-release versions correctly
  - [ ] Only publishes when version has actually changed
  - [ ] Handles version rollbacks gracefully
- **Time**: 15 min
- **Complexity**: Medium

### Task 3.2: Implement automatic git tagging
- **ID**: AUTO-003-B
- **Depends On**: AUTO-003-A
- **Files**:
  - `.github/workflows/auto-publish.yml` (modify)
- **Acceptance Criteria**:
  - [ ] Git tags created with proper format (v1.2.3)
  - [ ] Tag messages include version information
  - [ ] Tags are pushed to remote repository
- **Time**: 15 min
- **Complexity**: Low

### Task 3.3: Configure release creation
- **ID**: AUTO-003-C
- **Depends On**: AUTO-003-B
- **Files**:
  - `.github/workflows/auto-publish.yml` (modify)
- **Acceptance Criteria**:
  - [ ] GitHub releases created automatically
  - [ ] Release notes pulled from CHANGELOG.md or RELEASE files
  - [ ] Release marked as stable (not pre-release)
- **Time**: 15 min
- **Complexity**: Medium

## Phase 4: Testing and Validation

**Goal**: Test the complete auto-publish pipeline
**Duration**: 60 min

### Task 4.1: Create test version bump
- **ID**: AUTO-004-A
- **Depends On**: AUTO-003-C
- **Files**:
  - `package.json` (modify)
- **Acceptance Criteria**:
  - [ ] Version incremented appropriately (patch level for testing)
  - [ ] CHANGELOG.md updated with test entry
  - [ ] Commit ready for testing
- **Time**: 15 min
- **Complexity**: Low

### Task 4.2: Test auto-publish workflow
- **ID**: AUTO-004-B
- **Depends On**: AUTO-004-A
- **Files**:
  - None (GitHub Actions testing)
- **Acceptance Criteria**:
  - [ ] Workflow triggers on push to main
  - [ ] Build completes successfully
  - [ ] Package publishes to both registries
  - [ ] Git tag and release created
- **Time**: 30 min
- **Complexity**: High

### Task 4.3: Verify marketplace notification
- **ID**: AUTO-004-C
- **Depends On**: AUTO-004-B
- **Files**:
  - `.github/workflows/notify-marketplace.yml` (verify)
- **Acceptance Criteria**:
  - [ ] Marketplace repository receives notification
  - [ ] Notification includes correct version and release information
  - [ ] No authentication issues with marketplace dispatch
- **Time**: 15 min
- **Complexity**: Medium

## Dependencies
- GitHub repository with proper permissions
- NPM account with publishing rights
- GitHub Packages enabled for the repository
- Marketplace repository for notifications (ferg-cod3s/ferg-marketplace)

## Risks
| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Authentication failures | High | Medium | Test OIDC setup thoroughly, have fallback manual publish workflow |
| Version conflicts | Medium | Low | Implement version checking logic, prevent duplicate publishes |
| Marketplace notification fails | Low | Low | Make notification non-blocking, add retry logic |
| Build failures on CI | High | Medium | Ensure all dependencies are properly configured, test build locally first |

## Testing Plan
### Unit Tests
- [ ] Version comparison logic works correctly
- [ ] Package name resolution is accurate

### Integration Tests
- [ ] Full workflow runs end-to-end
- [ ] Authentication works in CI environment
- [ ] Publishing succeeds to both registries

### Manual Testing
- [ ] Push version bump to main branch
- [ ] Verify package appears on NPM
- [ ] Verify package appears on GitHub Packages
- [ ] Check that GitHub release is created
- [ ] Confirm marketplace notification is sent

## Rollback Plan
1. If auto-publish fails, use manual publish workflows
2. Delete incorrect tags/releases if created
3. Revert version bump if needed
4. Update marketplace manually if notification fails

## References
- [GitHub Actions OIDC documentation](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
- [NPM publishing with provenance](https://docs.npmjs.com/generating-provenance-statements)
- [GitHub Packages publishing](https://docs.github.com/en/packages/learn-github-packages/publishing-a-package)