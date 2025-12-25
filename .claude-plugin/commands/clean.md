---
name: ai-eng/clean
description: Remove AI-generated verbosity, slop patterns, and redundant content with preview and confirmation
agent: build
version: 1.0.0
inputs:
  - name: content
    type: string
    required: false
    description: Content to clean (direct string or file path)
  - name: type
    type: string
    required: false
    description: Cleanup type (slop|comments|docs|all)
    default: auto-detect
  - name: mode
    type: string
    required: false
    description: Aggressiveness level (conservative|moderate|aggressive)
    default: moderate
outputs:
  - name: cleaned_content
    type: string
    format: Text with removed patterns
    description: Content with AI verbosity removed
  - name: cleanup_report
    type: structured
    format: JSON
    description: Detailed report of patterns removed and metrics
---

# Clean Command

Router command for removing AI-generated verbosity and redundancy from various content types while preserving meaning and technical accuracy.

## Help

When `--help` is passed, display:

```
CLEAN COMMAND - Remove AI-generated verbosity

USAGE:
  /clean <content-or-file> [--type]   Auto-detect and clean content
  /clean <content> --slop             Remove AI conversational filler
  /clean <path> --comments            Optimize code comments (recursive)
  /clean <path> --docs                Clean documentation verbosity (recursive)

TYPES:
  --slop          AI filler: "Certainly!", "I'd be happy to help", hedging
  --comments      Code comments: redundant, verbose, obvious explanations
  --docs          Documentation: conversational tone, excessive politeness
  --all           Apply all cleanup techniques

OPTIONS:
  -t, --type <type>        Cleanup type (slop|comments|docs|all) [default: auto-detect]
  -m, --mode <mode>        Aggressiveness (conservative|moderate|aggressive) [default: moderate]
  -p, --preview            Show changes without applying
  -a, --apply              Apply confirmed changes
  -o, --output <file>      Save cleaned content to file
  -f, --force              Skip confirmation prompts
  -v, --verbose            Show detailed cleanup process
  --custom-patterns        Load custom pattern file
  --keep-list <phrases>     Comma-separated phrases to always preserve
  --help                   Show this help

EXAMPLES:
  /clean "Certainly! I'd be happy to help..." --slop --preview
  /clean src/ --comments --apply
  /clean docs/README.md --docs --mode=aggressive
  /clean ./docs --docs --recursive
```

## Types

| Type | Purpose | Target Content |
|------|---------|----------------|
| `slop` | Remove AI conversational filler | Any text with AI-generated patterns |
| `comments` | Optimize code comments | Source code files or directories |
| `docs` | Clean documentation verbosity | Documentation files or directories |
| `all` | Apply all cleanup techniques | Mixed content or comprehensive cleanup |

## Input Sources

### Standard Input
```bash
echo "Certainly! I'd be happy to help with that query..." | /clean slop --preview
```

### Files
```bash
/clean src/database.ts --comments --preview
/clean docs/README.md --docs --apply
/clean "Certainly! I'll help you with that..." --slop --output cleaned.txt
```

### Directories
```bash
/clean src/ --comments --recursive --apply --mode aggressive
/clean ./documentation --docs --preview --mode conservative
```

### Git Integration
```bash
/clean --staged --slop --preview      # Clean staged files
/clean --modified --comments --apply   # Clean modified files
/clean all --commit --preview         # Clean last commit message
```

## Configuration

### Custom Patterns
Create `.textcleanup.json` for project-specific patterns:
```json
{
  "preservePhrases": ["critical", "essential", "must-not-remove"],
  "removePhrases": ["basically", "simply", "just"],
  "projectSpecific": {
    "apiDocs": {
      "preserve": ["deprecation notice", "security warning"],
      "remove": ["getting started", "welcome to"]
    }
  }
}
```

### Mode Customization
```json
{
  "modes": {
    "conservative": {
      "slopRemovalRate": 0.6,
      "commentChangeRate": 0.3,
      "preserveThreshold": 0.9
    },
    "moderate": {
      "slopRemovalRate": 0.8,
      "commentChangeRate": 0.6,
      "preserveThreshold": 0.8
    },
    "aggressive": {
      "slopRemovalRate": 0.95,
      "commentChangeRate": 0.85,
      "preserveThreshold": 0.7
    }
  }
}
```

## Pattern Examples

### Slop Patterns Removed
- **Preambles**: "Certainly!", "Of course!", "I'd be happy to help!"
- **Hedging**: "It's worth noting that", "Generally speaking", "Typically"
- **Politeness**: "Please let me know if you need anything else", "I hope this helps!"
- **Transitions**: "Now, let's move on to", "With that said", "Building on the above"

### Comment Optimizations
- **Before**: `// This function calculates sum of two numbers`
- **After**: `// Calculate sum of two numbers efficiently`
- **Before**: `// The following code initializes database connection`
- **After**: `// Initialize database connection`

### Documentation Cleanup
- **Removed**: Conversational openings and excessive politeness
- **Preserved**: Technical details, examples, warnings, critical information
- **Improved**: Direct topic introduction and concise explanations

## Integration with Other Commands

| Command | Integration |
|---------|-------------|
| `/optimize` | Enhance cleaned content for better AI prompts |
| `/review` | Review cleanup effectiveness and suggest improvements |
| `/work` | Apply clean patterns during implementation tasks |

## Troubleshooting

### "Too aggressive cleanup"
1. Use `--mode conservative`
2. Add important phrases to `--keep-list`
3. Review preview before applying
4. Create project-specific custom patterns

### "Not enough cleanup"
1. Use `--mode aggressive`
2. Check if patterns need to be updated
3. Verify custom patterns aren't interfering
4. Run `--verbose` to see detailed analysis

### "Code breaks after cleanup"
1. Ensure comment modifications don't affect syntax
2. Check that preserved markers are intact
3. Validate with `--preview` before `--apply`
4. Use file backups and rollback if needed

## Success Criteria

Successful cleanup achieves:
- ✅ Meaning preservation score ≥ 0.9
- ✅ Technical accuracy 100% maintained
- ✅ 20-50% reduction in verbosity
- ✅ Readability maintained or improved
- ✅ All essential information preserved

---

## Expert Context

You are a senior technical editor with 15+ years of experience at companies like Google, Microsoft, and The New York Times. Your expertise is in removing verbosity while preserving technical accuracy and meaning. This cleanup task is critical to code and documentation quality.

## Cleanup Methodology

Take a deep breath and execute this cleanup systematically.

### Phase 1: Analysis & Detection (CRITICAL - Do First)

1. **Parse the Input**
   - Identify input type: direct content string, file, or directory
   - Detect content type: code comments, documentation, general text
   - If `--type` not specified, auto-detect from file extension and content
   - Read relevant pattern databases from `skills/text-cleanup/patterns/`

2. **Load Pattern Databases**
   - Read `slop-patterns.json` for AI filler patterns
   - Read `comment-patterns.json` for code comment optimization
   - Check for custom patterns in `.textcleanup.json` if present
   - Load mode-specific configuration (conservative|moderate|aggressive)

### Phase 2: Pattern Matching & Analysis

3. **Pattern Matching**
   - Scan content against all applicable patterns
   - Check each pattern's `removalStrategy` (complete|conditional|preserve)
   - For `conditional` patterns, evaluate context to determine safety
   - Apply `preserveList` phrases - NEVER remove these
   - Special handling for: TODO, FIXME, NOTE, WARNING markers
   - Check for preserve categories: legal_attribution, development_marker

4. **Mode-Based Filtering**
   - **Conservative** (preserveThreshold: 0.9): Remove only high-confidence patterns
   - **Moderate** (preserveThreshold: 0.8): Balance removal and clarity
   - **Aggressive** (preserveThreshold: 0.7): Maximum cleanup while maintaining accuracy

### Phase 3: Execution Strategy

#### If `--preview` Flag

Generate comprehensive preview with:
- Content analysis (word count, character count, detected patterns)
- List of patterns found with locations and actions
- Proposed changes summary
- Diff showing before/after

#### If `--apply` Flag (without `--preview`)

1. **Confirmation Required** (unless `--force`):
   - Show summary of proposed changes
   - Request user confirmation
   - If denied, exit without changes

2. **Apply Cleanup**:
   - Execute approved pattern removals
   - Apply comment optimizations where applicable
   - Preserve critical markers and legal notices
   - Maintain code syntax and structure
   - Create backups if needed

#### If Both `--preview` and `--apply`

1. Show preview
2. Request confirmation
3. If confirmed, apply changes

### Phase 4: Output Generation

Display results with:
- Per-file summary of patterns removed and character reduction
- Total summary of files processed, patterns removed, characters reduced
- Confirmation of 100% technical accuracy preserved

### Quality Assurance Checks

Before finalizing any cleanup, verify:
- [ ] All technical specifications unchanged
- [ ] No numeric values or formulas altered
- [ ] No logic or algorithm behavior changed
- [ ] All error handling preserved
- [ ] All warnings preserved
- [ ] TODO/FIXME markers intact
- [ ] Legal notices and copyright preserved
- [ ] Code compiles (if applicable)
- [ ] Meaning preservation score ≥ 0.9
- [ ] No syntax errors introduced

### Preservation Rules

#### NEVER Remove
- Technical specifications and constraints
- Numeric values, formulas, calculations
- Error conditions and edge cases
- Architectural decisions and rationale
- Security considerations
- Performance-critical information
- TODO, FIXME, NOTE, WARNING, HACK markers
- Copyright and license notices
- Author attributions
- Non-obvious behavior explanations

#### Always Remove When Safe
- Conversational padding without informational value
- Redundant explanations of obvious concepts
- Excessive politeness that adds no meaning
- Verbose transitions to unrelated topics
- Self-evident code comments
- "Certainly!", "Of course!", "I'd be happy to help!"
- Hedging language when statement is factual

#### Conditional Removal
- Hedging language when uncertainty is genuine
- Explanations valuable to beginners
- Historical context establishing background
- Meaningful transitions between sections

$ARGUMENTS
