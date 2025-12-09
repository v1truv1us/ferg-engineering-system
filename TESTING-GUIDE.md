# Ferg Engineering System - Testing Guide

**Installation Date**: December 5, 2025  
**Version**: 0.2.0  
**Platform**: OpenCode (Global Installation)  
**Status**: ✅ Installed and Ready

---

## 📋 Installation Verification

### Installation Location
```
~/.config/opencode/
├── command/ai-eng/          # All ferg commands
├── agent/ai-eng/            # All ferg agents
├── skills/                # Ferg skills
└── opencode.jsonc         # Configuration
```

### Installed Components

**Commands** (15 total):
- ✅ `/ai-eng/plan` - Create implementation plans
- ✅ `/ai-eng/work` - Execute plans with quality gates
- ✅ `/ai-eng/review` - Code review
- ✅ `/ai-eng/research` - Multi-phase research
- ✅ `/ai-eng/context` - Context management
- ✅ `/ai-eng/optimize` - Performance optimization
- ✅ `/ai-eng/deploy` - Deployment workflow
- ✅ `/ai-eng/seo` - SEO optimization
- ✅ `/ai-eng/compound` - Compound operations
- ✅ `/ai-eng/recursive-init` - Initialize across directories
- ✅ `/ai-eng/create-agent` - Create new agents
- ✅ `/ai-eng/create-command` - Create new commands
- ✅ `/ai-eng/create-skill` - Create new skills
- ✅ `/ai-eng/create-tool` - Create new tools
- ✅ `/ai-eng/create-plugin` - Create new plugins

**Agents** (24 total):
- ✅ ai-eng/architect-advisor
- ✅ ai-eng/frontend-reviewer
- ✅ ai-eng/prompt-optimizer
- ✅ ai-eng/seo-specialist
- ✅ ai-eng/java-pro
- ✅ ai-eng/database_optimizer
- ✅ ai-eng/code_reviewer
- ✅ ai-eng/infrastructure_builder
- ✅ ai-eng/backend_architect
- ✅ ai-eng/api_builder_enhanced
- ✅ ai-eng/full_stack_developer
- ✅ ai-eng/deployment_engineer
- ✅ ai-eng/monitoring_expert
- ✅ ai-eng/cost_optimizer
- ✅ ai-eng/test_generator
- ✅ ai-eng/performance_engineer
- ✅ ai-eng/ml_engineer
- ✅ ai-eng/security_scanner
- ✅ ai-eng/ai_engineer
- ✅ ai-eng/agent-creator
- ✅ ai-eng/command-creator
- ✅ ai-eng/skill-creator
- ✅ ai-eng/tool-creator
- ✅ ai-eng/plugin-validator

**Skills**:
- ✅ devops/coolify-deploy
- ✅ devops/git-worktree
- ✅ prompting/incentive-prompting
- ✅ research/comprehensive-research
- ✅ plugin-dev

---

## 🧪 Testing Breakdown

### Phase 1: Basic Command Testing (5-10 minutes)

Test that all commands are accessible and respond correctly.

#### Test 1.1: List Available Commands
```bash
# In OpenCode, try typing:
/ai-eng/
```
**Expected**: Auto-complete shows all ferg commands

#### Test 1.2: Test /ai-eng/plan Command
```bash
/ai-eng/plan "Add dark mode toggle to settings"
```
**Expected Output**:
- Creates a plan file in `plans/` directory
- Plan includes atomic tasks with:
  - Task IDs (FEAT-001-A, FEAT-001-B, etc.)
  - Dependencies
  - File paths
  - Acceptance criteria
  - Time estimates
  - Complexity levels

**Verification Checklist**:
- [ ] Plan file created
- [ ] Contains 5-phase planning structure
- [ ] Tasks are atomic (15-60 min chunks)
- [ ] Dependencies are explicit
- [ ] File paths are specific

#### Test 1.3: Test /ai-eng/work Command
```bash
/ai-eng/work --dry-run plans/[latest-plan].md
```
**Expected Output**:
- Shows execution plan without making changes
- Lists all tasks in order
- Shows dependencies
- Estimates total time

**Verification Checklist**:
- [ ] Dry-run shows all tasks
- [ ] Dependencies are correct
- [ ] Time estimates are shown
- [ ] No actual changes made

#### Test 1.4: Test /ai-eng/research Command
```bash
/ai-eng/research "How does the context system work?"
```
**Expected Output**:
- Multi-phase research with:
  - Discovery phase results
  - Analysis phase findings
  - Synthesis with evidence

**Verification Checklist**:
- [ ] Research completes successfully
- [ ] Results are evidence-based
- [ ] Multiple sources referenced
- [ ] Findings are actionable

#### Test 1.5: Test /ai-eng/review Command
```bash
/ai-eng/review "https://github.com/v1truv1us/ferg-engineering-system/pull/2"
```
**Expected Output**:
- Code review with:
  - Quality assessment
  - Suggestions
  - Risk analysis

**Verification Checklist**:
- [ ] Review completes
- [ ] Feedback is constructive
- [ ] Issues are identified
- [ ] Suggestions are actionable

---

### Phase 2: Command Integration Testing (10-15 minutes)

Test that commands work together in a workflow.

#### Test 2.1: Full Workflow - Plan → Work → Review

**Step 1: Create a Plan**
```bash
/ai-eng/plan "Implement user authentication system"
```
- Creates: `plans/2025-12-05-user-authentication.md`

**Step 2: Review the Plan**
- Check atomic task breakdown
- Verify dependencies
- Confirm time estimates

**Step 3: Dry-Run the Work**
```bash
/ai-eng/work plans/2025-12-05-user-authentication.md --dry-run
```
- Shows execution plan
- Confirms all tasks are clear

**Step 4: Validate Plan**
```bash
/ai-eng/work plans/2025-12-05-user-authentication.md --validate-only
```
- Checks file paths exist
- Verifies dependencies are resolvable
- Identifies potential issues

**Verification Checklist**:
- [ ] Plan created successfully
- [ ] Work command recognizes plan
- [ ] Dry-run shows correct tasks
- [ ] Validation passes
- [ ] All commands integrate smoothly

#### Test 2.2: Research → Plan Integration

**Step 1: Research a Topic**
```bash
/ai-eng/research "Best practices for API design"
```

**Step 2: Use Research in Planning**
```bash
/ai-eng/plan "Design REST API based on research findings"
```

**Verification Checklist**:
- [ ] Research provides useful context
- [ ] Plan incorporates research findings
- [ ] Plan references research sources
- [ ] Workflow is seamless

---

### Phase 3: Agent Testing (10-15 minutes)

Test that specialized agents work correctly.

#### Test 3.1: Architect Advisor
```bash
# In OpenCode, use the agent:
ai-eng/architect-advisor
```
**Task**: "Should we use microservices or monolith for our API?"

**Expected Output**:
- Architecture analysis
- Trade-off discussion
- Recommendation with rationale

**Verification Checklist**:
- [ ] Agent responds with expertise
- [ ] Analysis is thorough
- [ ] Trade-offs are discussed
- [ ] Recommendation is justified

#### Test 3.2: Code Reviewer
```bash
ai-eng/code_reviewer
```
**Task**: "Review this TypeScript code for quality"

**Expected Output**:
- Code quality assessment
- Security issues identified
- Performance suggestions
- Best practices recommendations

**Verification Checklist**:
- [ ] Review is comprehensive
- [ ] Issues are specific
- [ ] Suggestions are actionable
- [ ] Feedback is constructive

#### Test 3.3: Prompt Optimizer
```bash
ai-eng/prompt-optimizer
```
**Task**: "Enhance this prompt: 'Help me fix this slow database query'"

**Expected Output**:
- Enhanced prompt with:
  - Expert persona
  - Stakes language
  - Structured approach
  - Self-evaluation

**Verification Checklist**:
- [ ] Prompt is enhanced
- [ ] Techniques are applied
- [ ] Quality is improved
- [ ] Output is actionable

---

### Phase 4: Quality Gates Testing (10-15 minutes)

Test that quality gates work as expected.

#### Test 4.1: Linting Gate
```bash
bun run lint
```
**Expected**: No errors or warnings

#### Test 4.2: Type Checking Gate
```bash
bun run type-check
```
**Expected**: No TypeScript errors

#### Test 4.3: Build Gate
```bash
bun run build
```
**Expected**: Build succeeds in <200ms

#### Test 4.4: Test Gate
```bash
bun run test
```
**Expected**: All tests pass

**Verification Checklist**:
- [ ] All gates pass
- [ ] No errors or warnings
- [ ] Build is fast
- [ ] Tests are comprehensive

---

### Phase 5: Feature-Specific Testing (15-20 minutes)

Test new features in v0.2.0.

#### Test 5.1: Atomic Task Decomposition

**Test**: Create a plan and verify atomic tasks

```bash
/ai-eng/plan "Build a real-time notification system"
```

**Verify Each Task**:
- [ ] Task ID is unique (FEAT-001-A format)
- [ ] Task title is action-oriented
- [ ] Dependencies are explicit
- [ ] Files are specific paths
- [ ] Acceptance criteria are checkboxes
- [ ] Time estimate is 15-60 minutes
- [ ] Complexity is Low/Medium/High

#### Test 5.2: Quality Gates in Work Command

**Test**: Execute a plan and verify gates

```bash
/ai-eng/work plans/[plan].md
```

**Verify Gates Execute in Order**:
1. [ ] Linting runs first
2. [ ] Type checking runs second
3. [ ] Unit tests run third
4. [ ] Build runs fourth
5. [ ] Integration tests run fifth
6. [ ] Full suite runs last

**Verify Gate Behavior**:
- [ ] Gates stop on failure
- [ ] Error messages are clear
- [ ] Recovery instructions provided
- [ ] No shortcuts allowed

#### Test 5.3: Multiple Execution Modes

**Test 1: Continue Mode**
```bash
/ai-eng/work --continue
```
**Expected**: Resumes from last incomplete task

**Test 2: Validate-Only Mode**
```bash
/ai-eng/work plans/[plan].md --validate-only
```
**Expected**: Validates without implementing

**Test 3: Dry-Run Mode**
```bash
/ai-eng/work plans/[plan].md --dry-run
```
**Expected**: Shows what would be done

**Verification Checklist**:
- [ ] All modes work correctly
- [ ] Continue resumes properly
- [ ] Validate-only doesn't modify files
- [ ] Dry-run is accurate

---

### Phase 6: Documentation Testing (5-10 minutes)

Verify documentation is complete and accurate.

#### Test 6.1: Command Documentation
```bash
# Check that each command has documentation
ls -la ~/.config/opencode/command/ai-eng/
```
**Expected**: All 15 commands have .md files

#### Test 6.2: Agent Documentation
```bash
# Check that agents are documented
ls -la ~/.config/opencode/agent/ai-eng/
```
**Expected**: All 24 agents have .md files

#### Test 6.3: Skill Documentation
```bash
# Check that skills are documented
ls -la ~/.config/opencode/skills/
```
**Expected**: All skills have documentation

**Verification Checklist**:
- [ ] All commands documented
- [ ] All agents documented
- [ ] All skills documented
- [ ] Documentation is comprehensive
- [ ] Examples are provided

---

## 🎯 Testing Checklist

### Quick Test (5 minutes)
- [ ] `/ai-eng/plan` creates a plan
- [ ] `/ai-eng/work --dry-run` shows tasks
- [ ] `/ai-eng/research` returns findings
- [ ] Commands are accessible

### Standard Test (30 minutes)
- [ ] All commands work
- [ ] All agents respond
- [ ] Workflow integrates
- [ ] Quality gates pass
- [ ] Documentation is complete

### Comprehensive Test (60 minutes)
- [ ] All phases completed
- [ ] All features tested
- [ ] All agents verified
- [ ] All gates validated
- [ ] All documentation verified

---

## 📊 Test Results Template

Use this template to document your test results:

```markdown
# Test Results - [Date]

## Phase 1: Basic Commands
- [ ] /ai-eng/plan - PASS/FAIL
- [ ] /ai-eng/work - PASS/FAIL
- [ ] /ai-eng/research - PASS/FAIL
- [ ] /ai-eng/review - PASS/FAIL

## Phase 2: Integration
- [ ] Plan → Work workflow - PASS/FAIL
- [ ] Research → Plan workflow - PASS/FAIL

## Phase 3: Agents
- [ ] architect-advisor - PASS/FAIL
- [ ] code_reviewer - PASS/FAIL
- [ ] prompt-optimizer - PASS/FAIL

## Phase 4: Quality Gates
- [ ] Linting - PASS/FAIL
- [ ] Type checking - PASS/FAIL
- [ ] Build - PASS/FAIL
- [ ] Tests - PASS/FAIL

## Phase 5: Features
- [ ] Atomic tasks - PASS/FAIL
- [ ] Quality gates - PASS/FAIL
- [ ] Execution modes - PASS/FAIL

## Phase 6: Documentation
- [ ] Commands documented - PASS/FAIL
- [ ] Agents documented - PASS/FAIL
- [ ] Skills documented - PASS/FAIL

## Overall Status
- **Total Tests**: XX
- **Passed**: XX
- **Failed**: XX
- **Success Rate**: XX%

## Issues Found
(List any issues discovered during testing)

## Recommendations
(List any improvements or recommendations)
```

---

## 🚀 Next Steps After Testing

1. **If All Tests Pass**:
   - ✅ System is ready for production use
   - ✅ Can start using commands in real projects
   - ✅ Can integrate with team workflows

2. **If Some Tests Fail**:
   - 🔧 Document the failures
   - 🔧 Check error messages
   - 🔧 Verify installation
   - 🔧 Report issues on GitHub

3. **Optimization**:
   - 📈 Track command execution times
   - 📈 Identify slow operations
   - 📈 Optimize as needed

---

## 📞 Support & Resources

### Documentation
- **COMMAND-ENHANCEMENTS.md** - Command details
- **RELEASE-v0.2.0.md** - Release notes
- **content/commands/plan.md** - Plan command
- **content/commands/work.md** - Work command

### GitHub
- **Repository**: https://github.com/v1truv1us/ferg-engineering-system
- **Issues**: https://github.com/v1truv1us/ferg-engineering-system/issues
- **Releases**: https://github.com/v1truv1us/ferg-engineering-system/releases

### Getting Help
1. Check documentation first
2. Review example workflows
3. Check GitHub issues
4. Open a new issue with details

---

## ✅ Installation Verification Summary

**Installation Status**: ✅ COMPLETE

**Installed Components**:
- ✅ 15 Commands
- ✅ 24 Agents
- ✅ 5 Skills
- ✅ Full Documentation

**Ready to Test**: YES

**Recommended Test Duration**: 60 minutes (comprehensive)

**Quick Test Duration**: 5 minutes (basic verification)

---

**Happy testing!** 🚀
