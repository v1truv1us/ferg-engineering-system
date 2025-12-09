| description | agent | subtask |
|---|---|---|
| Guided end-to-end plugin creation workflow for OpenCode extensions. Creates plugins, commands, agents, skills, and custom tools with AI assistance. Follows systematic 8-phase process from discovery to documentation. | plan | false |

# Plugin Creation Workflow

Create a complete, high-quality OpenCode extension from initial concept to tested implementation. Follow a systematic approach: understand requirements, design components, clarify details, implement following best practices, validate, and test.

## Core Principles

- **Ask clarifying questions**: Identify all ambiguities about plugin purpose, triggering, scope, and components. Ask specific, concrete questions rather than making assumptions. Wait for user answers before proceeding with implementation.
- **Load relevant skills**: Use skills_plugin_dev to load plugin-dev knowledge when needed
- **Use specialized agents**: Leverage agent-creator, command-creator, skill-creator, tool-creator, and plugin-validator agents for AI-assisted development
- **Follow best practices**: Apply patterns from plugin-dev's own implementation
- **Progressive disclosure**: Create lean skills with references/examples
- **Use TodoWrite**: Track all progress throughout all phases

**Initial request:** $ARGUMENTS

---

## Phase 1: Discovery

**Goal**: Understand what plugin needs to be built and what problem it solves

**Actions**:
1. Create todo list with all 8 phases
2. If plugin purpose is clear from arguments:
   - Summarize understanding
   - Identify plugin type (integration, workflow, analysis, toolkit, etc.)
   - Determine target platform (OpenCode, Claude Code, or both)
3. If plugin purpose is unclear, ask user:
   - What problem does this plugin solve?
   - Who will use it and when?
   - What should it do?
   - Any similar plugins to reference?
   - Which platform(s) should it support?
4. Summarize understanding and confirm with user before proceeding

**Output**: Clear statement of plugin purpose and target users

---

## Phase 2: Component Planning

**Goal**: Determine what plugin components are needed

**MUST load plugin-dev skill** using skills_plugin_dev before this phase.

**Actions**:
1. Load plugin-dev skill to understand component types
2. Analyze plugin requirements and determine needed components:
   - **Plugins**: Does it need plugin-level hooks or events? (OpenCode only)
   - **Commands**: User-initiated actions? (deploy, configure, analyze)
   - **Agents**: Autonomous tasks? (validation, generation, analysis)
   - **Skills**: Specialized knowledge? (domain expertise, patterns)
   - **Custom Tools**: External integrations? (databases, APIs, utilities)
3. For each component type needed, identify:
   - How many of each type
   - What each one does
   - Rough triggering/usage patterns
4. Present component plan to user as table:
   ```
   | Component Type | Count | Purpose |
   |----------------|-------|---------|
   | Plugins         | 1     | OpenCode event hooks |
   | Commands       | 3     | Deploy, configure, validate |
   | Agents         | 2     | Autonomous validation, generation |
   | Skills         | 1     | Database optimization patterns |
   | Custom Tools   | 1     | PostgreSQL integration |
   ```
5. Get user confirmation or adjustments

**Output**: Confirmed list of components to create

---

## Phase 3: Detailed Design & Clarifying Questions

**Goal**: Specify each component in detail and resolve all ambiguities

**CRITICAL**: This is one of the most important phases. DO NOT SKIP.

**Actions**:
1. For each component in the plan, identify underspecified aspects:
   - **Plugins**: What events should it hook into? What permissions needed?
   - **Commands**: What arguments? What tools? Interactive or automated?
   - **Agents**: When to trigger (proactive/reactive)? What tools? Output format?
   - **Skills**: What triggers them? What knowledge do they provide? How detailed?
   - **Custom Tools**: What external services? Authentication? Data formats?
2. **Present all questions to user in organized sections** (one section per component type)
3. **Wait for answers before proceeding to implementation**

4. If user says "whatever you think is best", provide specific recommendations and get explicit confirmation

**Example questions for a skill**:
- What specific user queries should trigger this skill?
- Should it include utility scripts or just guidance?
- How detailed should the core SKILL.md be vs references/?
- Any real-world examples to include?

**Example questions for an agent**:
- Should this agent trigger proactively after certain actions, or only when explicitly requested?
- What tools does it need (read, write, bash, etc.)?
- What should the output format be?
- Any specific domain expertise required?

**Output**: Detailed specification for each component

---

## Phase 4: Structure Creation

**Goal**: Create plugin directory structure and manifest

**Actions**:
1. Determine plugin name (kebab-case, descriptive)
2. Choose plugin location:
   - Ask user: "Where should I create the plugin?"
   - Offer options: current directory, new directory, custom path
3. Create directory structure using bash:
   ```bash
   mkdir -p plugin-name/.opencode/{command,agent,tool,skills}
   mkdir -p plugin-name/.claude-plugin/{commands,agents,skills}
   ```
4. Create plugin.json manifest for Claude Code if needed:
   ```json
   {
     "name": "plugin-name",
     "version": "0.1.0",
     "description": "[brief description]",
     "commands": ["./commands/*"],
     "agents": ["./agents/*"],
     "skills": ["./skills/*"]
   }
   ```
5. Create plugin.ts for OpenCode if needed:
   ```typescript
   import { Plugin } from "@opencode-ai/plugin"
   export default (async ({ project, client, $, directory, worktree }) => {
     return {
       // Plugin hooks here
     }
   }) satisfies Plugin
   ```
6. Create README.md template
7. Initialize git repo if creating new directory

**Output**: Plugin directory structure created and ready for components

---

## Phase 5: Component Implementation

**Goal**: Create each component following best practices

**LOAD RELEVANT SKILLS** before implementing each component type:
- **Commands**: Load plugin-dev skill for command format guidance
- **Agents**: Load plugin-dev skill for agent creation patterns
- **Skills**: Load plugin-dev skill for skill structure guidance
- **Custom Tools**: Load plugin-dev skill for tool development patterns
- **Plugins**: Load plugin-dev skill for OpenCode plugin events

**Actions for each component**:

### For Commands:
1. Use @command-creator agent to generate each command
2. Save to appropriate location based on context
3. Validate command format

### For Agents:
1. Use @agent-creator agent to generate each agent
2. Save to appropriate location based on context
3. Validate agent format and triggering

### For Skills:
1. Use @skill-creator agent to generate each skill
2. Create proper directory structure with SKILL.md
3. Add references/examples as needed
4. Validate skill format

### For Custom Tools:
1. Use @tool-creator agent to generate each tool
2. Save to `.opencode/tool/` directory
3. Validate TypeScript compilation

### For Plugins (OpenCode only):
1. Create plugin.ts with appropriate hooks
2. Define event handlers for plugin functionality
3. Test plugin registration

**Progress tracking**: Update todos as each component is completed

**Output**: All plugin components implemented

---

## Phase 6: Validation & Quality Check

**Goal**: Ensure plugin meets quality standards and works correctly

**Actions**:
1. **Run plugin-validator agent**:
   - Use @plugin-validator to comprehensively validate plugin
   - Check: manifest, structure, naming, components, security
   - Review validation report

2. **Fix critical issues**:
   - Address any critical errors from validation
   - Fix any warnings that indicate real problems

3. **Review with skill-reviewer** (if plugin has skills):
   - For each skill, use @skill-reviewer agent to check:
     - Description quality, progressive disclosure, writing style
     - Apply recommendations

4. **Test component triggering** (if plugin has agents):
   - For each agent, verify triggering examples are clear
   - Check triggering conditions are specific
   - Test agent access and permissions

5. **Test command functionality**:
   - Verify commands appear in help and execute correctly
   - Test with various arguments
   - Check shell integration and file references

6. **Test skill loading** (if plugin has skills):
   - Verify skills load via opencode-skills plugin
   - Test skill triggering with example queries
   - Check progressive disclosure works

7. **Test custom tools** (if plugin has tools):
   - Verify tools compile without TypeScript errors
   - Test tool functionality with sample inputs
   - Check error handling and validation

8. **Present findings**:
   - Summary of validation results
   - Any remaining issues
   - Overall quality assessment

9. **Ask user**: "Validation complete. Issues found: [count critical], [count warnings]. Would you like me to fix them now, or proceed to testing?"

**Output**: Plugin validated and ready for testing

---

## Phase 7: Testing & Verification

**Goal**: Test that plugin works correctly in target environment

**Actions**:
1. **Installation instructions**:
   - Show user how to test locally:
     ```bash
     # For OpenCode project-local
     cd /path/to/plugin
     opencode  # Plugin loads automatically
     
     # For global installation
     ./setup-global.sh  # Installs to ~/.config/opencode/
     ```
   - Or copy to appropriate directory
   - Restart OpenCode to reload components

2. **Verification checklist** for user to perform:
   ```
   [ ] Commands appear in help and execute correctly
   [ ] Agents trigger on appropriate scenarios
   [ ] Skills load when triggered (if applicable)
   [ ] Custom tools register and function (if applicable)
   [ ] Plugin events work (if applicable)
   [ ] No errors in OpenCode logs
   ```

3. **Testing recommendations**:
   - For commands: Run with various arguments and edge cases
   - For agents: Create scenarios matching agent examples
   - For skills: Ask questions using trigger phrases from descriptions
   - For tools: Test with different input types and error conditions

4. **Ask user**: "I've prepared the plugin for testing. Would you like me to guide you through testing each component, or do you want to test it yourself?"

5. **If user wants guidance**, walk through testing each component with specific test cases

**Output**: Plugin tested and verified working

---

## Phase 8: Documentation & Next Steps

**Goal**: Ensure plugin is well-documented and ready for distribution

**Actions**:
1. **Verify README completeness**:
   - Check README has: overview, features, installation, prerequisites, usage
   - For custom tools: Document required environment variables
   - For skills: Document triggering phrases and examples
   - For agents: Document when to use and expected behavior

2. **Add marketplace entry** (if publishing):
   - Show user how to add to package.json for npm publishing
   - Help draft marketplace description
   - Suggest appropriate keywords and categories

3. **Create summary**:
   - Mark all todos complete
   - List what was created:
     - Plugin name and purpose
     - Components created (X skills, Y commands, Z agents, N tools)
     - Key files and their purposes
     - Total file count and structure
   - Next steps:
     - Testing recommendations
     - Publishing to npm (if desired)
     - Iteration based on usage

4. **Suggest improvements** (optional):
   - Additional components that could enhance plugin
   - Integration opportunities with existing ferg-engineering components
   - Testing strategies for robustness

**Output**: Complete, documented plugin ready for use or publication

---

## Important Notes

### Throughout All Phases

- **Use TodoWrite** to track progress at every phase
- **Load skills with skills_plugin_dev** when working on specific component types
- **Use specialized agents** (agent-creator, command-creator, skill-creator, tool-creator, plugin-validator)
- **Ask for user confirmation** at key decision points
- **Follow plugin-dev's own patterns** as reference examples
- **Apply best practices**:
  - Third-person descriptions for skills
  - Imperative form in skill bodies
  - Commands written FOR Claude
  - Strong trigger phrases
  - Progressive disclosure
  - Security-first (HTTPS, no hardcoded credentials)

### Key Decision Points (Wait for User)

1. After Phase 1: Confirm plugin purpose and target platform
2. After Phase 2: Approve component plan
3. After Phase 3: Proceed to implementation
4. After Phase 6: Fix issues or proceed to testing
5. After Phase 7: Continue to documentation

### Skills to Load by Phase

- **Phase 2**: plugin-dev (for component planning)
- **Phase 5**: command-development, agent-development, skill-development, tool-development (as needed)
- **Phase 6**: (agents will use skills automatically)

### Quality Standards

Every component must meet these standards:
- ✅ Follows plugin-dev's proven patterns
- ✅ Uses correct naming conventions
- ✅ Has strong trigger conditions (skills/agents)
- ✅ Includes working examples
- ✅ Properly documented
- ✅ Validated with utilities
- ✅ Tested in target environment

---

## Example Workflow

### User Request
"Create a plugin for managing database migrations"

### Phase 1: Discovery
- Understand: Migration management, database schema versioning
- Confirm: User wants to create, run, rollback migrations
- Target: OpenCode

### Phase 2: Component Planning
- Skills: 1 (migration best practices)
- Commands: 3 (create-migration, run-migrations, rollback)
- Agents: 1 (migration-validator)
- Custom Tools: 1 (database connection)

### Phase 3: Clarifying Questions
- Which databases? (PostgreSQL, MySQL, etc.)
- Migration file format? (SQL, code-based?)
- Should agent validate before applying?
- What database connection details needed?

### Phase 4-8: Implementation, Validation, Testing, Documentation

---

**Begin with Phase 1: Discovery**