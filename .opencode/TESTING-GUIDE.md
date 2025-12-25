# 🧪 OpenCode Plugin Testing Guide

## ✅ Installation Verified

Your **ai-eng-system** plugin is fully installed in `.opencode/` and ready to use!

### Quick Verification

Run the verification script:
```bash
./.opencode/verify-install.sh
```

### Test Commands

Try these commands to verify everything works:

#### 1. Planning Test
```bash
/ai-eng/plan "Add user authentication to the application"
```

Expected: Should create a detailed implementation plan with steps.

#### 2. Research Test
```bash
/ai-eng/research "How does the authentication system work in this codebase?"
```

Expected: Should conduct multi-phase research across the codebase.

#### 3. Code Review Test
```bash
/ai-eng/review "Review src/index.ts for quality issues"
```

Expected: Should provide comprehensive code review with multiple perspectives.

#### 4. Prompt Optimization Test
```bash
/ai-eng/optimize "Help me fix this slow database query"
```

Expected: Should enhance the prompt using research-backed techniques.

#### 5. Context Management Test
```bash
/ai-eng/context
```

Expected: Should display available context and allow retrieval.

### Test Agents

Agents are automatically used by commands, but you can also test specific agent categories:

#### AI Innovation
- `ai_engineer` - LLM application development
- `ml_engineer` - ML model deployment
- `prompt-optimizer` - Prompt enhancement

#### Development
- `api_builder_enhanced` - API development
- `backend_architect` - System design
- `full_stack_developer` - End-to-end features

#### Quality Testing
- `code_reviewer` - Code quality assessment
- `security_scanner` - Security vulnerability detection
- `test_generator` - Automated test generation

### Verification Checklist

- [ ] Commands directory exists (`.opencode/command/ai-eng/`)
- [ ] Agents directory exists (`.opencode/agent/ai-eng/`)
- [ ] 16 command files present
- [ ] 27 agent files present
- [ ] package.json configured with OpenCode SDK
- [ ] node_modules installed
- [ ] All YAML frontmatter validated
- [ ] Permissions validated for OpenCode compatibility

### Troubleshooting

#### Commands not appearing
1. Check that the `.opencode/` directory is in your project root
2. Run `bun run build` to rebuild the plugin
3. Restart your OpenCode session

#### Agents not loading
1. Verify agent files have correct frontmatter
2. Check that `mode: subagent` is set
3. Ensure `tools` object is properly formatted

#### Permission errors
1. Check that only valid permission keys are used: `edit`, `bash`, `webfetch`, `doom_loop`, `external_directory`
2. Ensure color format is hex: `#RRGGBB`
3. Rebuild with `bun run build`

### Full Command List

All 16 commands are available:

1. `/ai-eng/plan` - Create implementation plans
2. `/ai-eng/work` - Execute plans with tracking
3. `/ai-eng/review` - Multi-perspective code review
4. `/ai-eng/research` - Multi-phase research
5. `/ai-eng/seo` - SEO audit with Core Web Vitals
6. `/ai-eng/deploy` - Pre-deployment checklist
7. `/ai-eng/optimize` - Prompt enhancement
8. `/ai-eng/clean` - Remove AI verbosity
9. `/ai-eng/context` - Context management
10. `/ai-eng/create-plugin` - Create plugins
11. `/ai-eng/create-agent` - Create agents
12. `/ai-eng/create-command` - Create commands
13. `/ai-eng/create-skill` - Create skills
14. `/ai-eng/create-tool` - Create tools
15. `/ai-eng/compound` - Document solutions
16. `/ai-eng/recursive-init` - Initialize AGENTS.md

### Next Steps

1. ✅ Plugin installed and verified
2. 🧪 Test a simple command (like `/ai-eng/plan`)
3. 📖 Review the command output
4. 🚀 Start using the plugin for your development workflow

Happy coding! 🎉
