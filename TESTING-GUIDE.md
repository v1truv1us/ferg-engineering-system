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
├── command/ferg/          # All ferg commands
├── agent/ferg/            # All ferg agents
├── skills/                # Ferg skills
└── opencode.jsonc         # Configuration
```

### Installed Components

**Commands** (15 total):
- ✅ `/ferg/plan` - Create implementation plans
- ✅ `/ferg/work` - Execute plans with quality gates
- ✅ `/ferg/review` - Code review
- ✅ `/ferg/research` - Multi-phase research
- ✅ `/ferg/context` - Context management
- ✅ `/ferg/optimize` - Performance optimization
- ✅ `/ferg/deploy` - Deployment workflow
- ✅ `/ferg/seo` - SEO optimization
- ✅ `/ferg/compound` - Compound operations
- ✅ `/ferg/recursive-init` - Initialize across directories
- ✅ `/ferg/create-agent` - Create new agents
- ✅ `/ferg/create-command` - Create new commands
- ✅ `/ferg/create-skill` - Create new skills
- ✅ `/ferg/create-tool` - Create new tools
- ✅ `/ferg/create-plugin` - Create new plugins

**Agents** (24 total):
- ✅ ferg/architect-advisor
- ✅ ferg/frontend-reviewer
- ✅ ferg/prompt-optimizer
- ✅ ferg/seo-specialist
- ✅ ferg/java-pro
- ✅ ferg/database_optimizer
- ✅ ferg/code_reviewer
- ✅ ferg/infrastructure_builder
- ✅ ferg/backend_architect
- ✅ ferg/api_builder_enhanced
- ✅ ferg/full_stack_developer
- ✅ ferg/deployment_engineer
- ✅ ferg/monitoring_expert
- ✅ ferg/cost_optimizer
- ✅ ferg/test_generator
- ✅ ferg/performance_engineer
- ✅ ferg/ml_engineer
- ✅ ferg/security_scanner
- ✅ ferg/ai_engineer
- ✅ ferg/agent-creator
- ✅ ferg/command-creator
- ✅ ferg/skill-creator
- ✅ ferg/tool-creator
- ✅ ferg/plugin-validator

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
/ferg/
```
**Expected**: Auto-complete shows all ferg commands

#### Test 1.2: Test /ferg/plan Command
```bash
/ferg/plan "Add dark mode toggle to settings"
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

#### Test 1.3: Test /ferg/work Command
```bash
/ferg/work --dry-run plans/[latest-plan].md
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

#### Test 1.4: Test /ferg/research Command
```bash
/ferg/research "How does the context system work?"
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

#### Test 1.5: Test /ferg/review Command
```bash
/ferg/review "https://github.com/v1truv1us/ferg-engineering-system/pull/2"
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
/ferg/plan "Implement user authentication system"
```
- Creates: `plans/2025-12-05-user-authentication.md`

**Step 2: Review the Plan**
- Check atomic task breakdown
- Verify dependencies
- Confirm time estimates

**Step 3: Dry-Run the Work**
```bash
/ferg/work plans/2025-12-05-user-authentication.md --dry-run
```
- Shows execution plan
- Confirms all tasks are clear

**Step 4: Validate Plan**
```bash
/ferg/work plans/2025-12-05-user-authentication.md --validate-only
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
/ferg/research "Best practices for API design"
```

**Step 2: Use Research in Planning**
```bash
/ferg/plan "Design REST API based on research findings"
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
ferg/architect-advisor
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
ferg/code_reviewer
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
ferg/prompt-optimizer
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
/ferg/plan "Build a real-time notification system"
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
/ferg/work plans/[plan].md
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
/ferg/work --continue
```
**Expected**: Resumes from last incomplete task

**Test 2: Validate-Only Mode**
```bash
/ferg/work plans/[plan].md --validate-only
```
**Expected**: Validates without implementing

**Test 3: Dry-Run Mode**
```bash
/ferg/work plans/[plan].md --dry-run
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
ls -la ~/.config/opencode/command/ferg/
```
**Expected**: All 15 commands have .md files

#### Test 6.2: Agent Documentation
```bash
# Check that agents are documented
ls -la ~/.config/opencode/agent/ferg/
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
- [ ] `/ferg/plan` creates a plan
- [ ] `/ferg/work --dry-run` shows tasks
- [ ] `/ferg/research` returns findings
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
- [ ] /ferg/plan - PASS/FAIL
- [ ] /ferg/work - PASS/FAIL
- [ ] /ferg/research - PASS/FAIL
- [ ] /ferg/review - PASS/FAIL

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
