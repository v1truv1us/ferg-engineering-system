---
name: ai-eng/clean
description: Remove AI-generated verbosity, slop patterns, and redundant content with preview and confirmation
agent: build
---

# Clean Command

Router command for removing AI-generated verbosity and redundancy from various content types while preserving meaning and technical accuracy.

## Usage

```bash
/clean <content-or-file> --type=<type> [options]
/clean slop <content> [options]                # Shortcut for --type=slop
/clean comments <file-or-dir> [options]        # Shortcut for --type=comments  
/clean docs <file-or-dir> [options]            # Shortcut for --type=docs
```

## Types

| Type | Purpose | Target Content |
|------|---------|----------------|
| `slop` | Remove AI conversational filler | Any text with AI-generated patterns |
| `comments` | Optimize code comments | Source code files or directories |
| `docs` | Clean documentation verbosity | Documentation files or directories |
| `all` | Apply all cleanup techniques | Mixed content or comprehensive cleanup |

## Options

- `-t, --type <type>`: Cleanup type (slop|comments|docs|all) [default: auto-detect]
- `-m, --mode <mode>`: Aggressiveness (conservative|moderate|aggressive) [default: moderate]
- `-p, --preview`: Show preview of changes without applying
- `-a, --apply`: Apply confirmed changes
- `-o, --output <file>`: Save cleaned content to file
- `-f, --force`: Skip confirmation prompts
- `-v, --verbose`: Show detailed cleanup process
- `--custom-patterns`: Load custom pattern file
- `--keep-list`: Comma-separated phrases to always preserve

## Input Sources

### Standard Input
```bash
echo "Certainly! I'd be happy to help with that query..." | /clean slop --preview
```

### Files
```bash
/clean comments src/database.ts --preview
/clean docs README.md --apply
/clean slop "Certainly! I'll help you with that..." --output cleaned.txt
```

### Directories
```bash
/clean comments src/ --recursive --apply --mode aggressive
/clean docs ./documentation --preview --mode conservative
```

### Git Integration
```bash
/clean slop --staged --preview      # Clean staged files
/clean comments --modified --apply   # Clean modified files
/clean all --commit --preview         # Clean last commit message
```

## Cleanup Process

### Phase 1: Analysis
1. **Content Detection**: Auto-detect content type if not specified
2. **Pattern Matching**: Scan against comprehensive pattern database
3. **Context Assessment**: Determine safe removal targets
4. **Confidence Scoring**: Rate each potential removal

### Phase 2: Strategy Selection
Based on mode and content:
- **Conservative**: Only remove certain, unnecessary patterns
- **Moderate**: Balance removal with clarity preservation  
- **Aggressive**: Maximum cleanup while maintaining accuracy

### Phase 3: Execution
- **Preview Mode**: Show diff and statistics
- **User Confirmation**: Request approval for changes
- **Apply Mode**: Execute approved modifications
- **Quality Validation**: Verify meaning preservation

## Output Format

### Preview Mode Output
```
## Clean Preview: Slop Removal

### Content Analysis:
- Type: AI-generated text
- Words: 156, Characters: 892
- Detected patterns: 8 slop, 2 redundancies

### Patterns Found:
1. "Certainly!" → [REMOVE] - Conversational preamable
2. "I'd be happy to help" → [REMOVE] - Excessive politeness  
3. "It's worth noting that" → [REMOVE] - Hedging qualifier
4. "Generally speaking" → [REMOVE] - Verbose transition
...

### Proposed Changes:
- Slop patterns: 8 removed
- Redundant phrases: 2 removed
- Estimated reduction: 34% words, 28% characters
- Meaning preservation score: 0.96 (excellent)
- Technical accuracy: 100% preserved

### Diff:
--- before.txt
+++ after.txt
@@ -1,4 +1,2 @@
-Certainly! I'd be happy to help with that query.
+I'll help with that query.
```

### Apply Mode Output
```
Cleaning src/database.ts... ✓
- Removed 5 redundant comments
- Updated 3 verbose explanations
- Preserved all TODOs and architectural notes
- Total reduction: 127 characters

Cleaning README.md... ✓  
- Removed 3 slop patterns
- Eliminated 1 verbose transition
- Preserved technical examples
- Total reduction: 89 characters

Summary:
✓ 2 files processed
✓ 8 patterns removed
✓ 216 characters reduced
✓ 100% technical accuracy preserved
```

## Pattern Examples

### Slop Patterns Removed
- **Preambles**: "Certainly!", "Of course!", "I'd be happy to help!"
- **Hedging**: "It's worth noting that", "Generally speaking", "Typically"
- **Politeness**: "Please let me know if you need anything else", "I hope this helps!"
- **Transitions**: "Now, let's move on to", "With that said", "Building on the above"

### Comment Optimizations
- **Before**: `// This function calculates the sum of two numbers`
- **After**: `// Calculate sum of two numbers efficiently`
- **Before**: `// The following code initializes the database connection`
- **After**: `// Initialize database connection`

### Documentation Cleanup
- **Removed**: Conversational openings and excessive politeness
- **Preserved**: Technical details, examples, warnings, critical information
- **Improved**: Direct topic introduction and concise explanations

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

## Integration with Other Commands

| Command | Integration |
|---------|-------------|
| `/optimize` | Enhance cleaned content for better AI prompts |
| `/review` | Review cleanup effectiveness and suggest improvements |
| `/work` | Apply clean patterns during implementation tasks |

## Quality Assurance

### Preservation Guarantees
- **Never** remove technical specifications
- **Never** alter numeric values or formulas
- **Never** change logic or algorithm behavior
- **Never** remove error handling or warnings
- **Always** preserve critical documentation

### Validation Checks
- [ ] Technical content unchanged
- [ ] No meaning distortion detected
- [ ] Readability maintained or improved
- [ ] Code compiles and functions correctly
- [ ] Documentation still serves its purpose

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

The clean command provides systematic, context-aware content cleanup with comprehensive safety checks and user control over aggressiveness level.