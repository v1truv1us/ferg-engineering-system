---
name: ai-eng/clean-slop
description: Remove AI-generated conversational filler and slop patterns from text
agent: build
---

# Clean Slop Command

Specialized command for removing AI-generated conversational patterns, filler phrases, and verbosity from any text content while preserving technical accuracy and meaning.

## Usage

```bash
/clean slop <content-or-file> [options]
/clean slop "Certainly! I'd be happy to help with that..." --preview
```

## Slop Patterns Targeted

### Category 1: Conversational Preambles
- "Certainly!", "Of course!", "Absolutely!", "I'd be happy to help!"
- "Great question!", "That's a great question", "Sure thing!"
- "Definitely!", "Happy to help!", "I can certainly help with that"

### Category 2: Hedging Language
- "It's worth noting that", "Keep in mind that", "Generally speaking"
- "Typically", "In most cases", "As you may know"
- "It's important to understand", "Usually", "Often"
- "I believe", "It seems", "Probably"

### Category 3: Excessive Politeness
- "Please let me know if you need anything else"
- "Feel free to ask if you have questions", "I hope this helps!"
- "Don't hesitate to reach out", "Happy to help further"
- "Let me know if that works for you"

### Category 4: Verbose Transitions
- "Now, let's move on to", "With that said", "Having established that"
- "Building on the above", "As mentioned earlier", "Next, I'll"
- "Moving forward", "Additionally", "Furthermore", "Moreover"

### Category 5: Self-Explanatory Filler
- "I'm an AI assistant", "As an AI", "I don't have personal opinions"
- "I don't have feelings", "Based on my training"
- "From my perspective", "In my experience"

## Process

### Phase 1: Pattern Detection
1. **Token Analysis**: Split input into sentences and phrases
2. **Pattern Matching**: Compare against 58+ known slop patterns
3. **Context Analysis**: Determine if conversational content serves purpose
4. **Confidence Scoring**: Rate removal confidence for each match (0-1)

### Phase 2: Strategy Selection
Based on mode and context:
- **Conservative**: Remove only high-confidence matches (>0.9)
- **Moderate**: Remove medium+ confidence matches (>0.7)
- **Aggressive**: Remove all detected patterns (>0.5)

### Phase 3: Removal Application
1. **Preview Generation**: Show exactly what would be removed
2. **User Confirmation**: Request approval for changes
3. **Text Reconstruction**: Rebuild content without slop patterns
4. **Quality Validation**: Ensure meaning is preserved

## Output Examples

### Preview Mode
```
## Slop Cleanup Preview

### Content Analysis:
- Words: 127, Characters: 742, Sentences: 12
- Slop patterns detected: 6
- Confidence score: 0.87 (high)

### Slop Patterns Found:
1. "Certainly!" → [REMOVE] - Conversational preamable (0.95 confidence)
2. "I'd be happy to help" → [REMOVE] - Excessive politeness (0.91 confidence)
3. "Generally speaking" → [REMOVE] - Hedging qualifier (0.84 confidence)
4. "Additionally" → [REMOVE] - Verbose transition (0.79 confidence)
5. "I hope this helps!" → [REMOVE] - Conventional closing (0.93 confidence)
6. "As an AI" → [REMOVE] - Self-explanation (0.88 confidence)

### Proposed Changes:
- Total patterns removed: 6
- Estimated reduction: 28% words, 23% characters
- Meaning preservation score: 0.96 (excellent)
- Technical accuracy: 100% preserved

### Before/After Diff:
--- original.txt
+++ cleaned.txt
@@ -1,4 +1,2 @@
-Certainly! I'd be happy to help with that query. Generally speaking, 
- the best approach would be to use an index. Additionally, I hope this helps!
+
+The best approach uses an index.
```

### Apply Mode
```
Removing slop patterns... ✓ (6 patterns removed)
Reconstructing text flow... ✓
Preserving technical accuracy... ✓
Validating meaning preservation... ✓

Cleaned text saved to: cleaned-output.txt
Summary: 28% reduction, 100% technical accuracy preserved
```

## Options

- `-m, --mode <mode>`: Aggressiveness (conservative|moderate|aggressive) [default: moderate]
- `-p, --preview`: Show preview without applying changes
- `-a, --apply`: Apply confirmed changes
- `-o, --output <file>`: Save cleaned text to file
- `-f, --force`: Skip confirmation prompts
- `-v, --verbose`: Show detailed pattern matching analysis
- `-c, --confidence <threshold>`: Minimum confidence for removal [0.5-0.9] [default: 0.7]
- `--keep-list`: Comma-separated phrases to always preserve
- `--custom-patterns`: Load additional pattern file

## Context Awareness

### When to Preserve "Slop"
- **Educational Content**: Conversational tone aids learning
- **Onboarding Documentation**: Friendly tone helps new users
- **Support Communications**: Empathy important for user support
- **Examples**: Demonstrating conversational interactions

### When to Remove Aggressively
- **Technical Documentation**: Clarity over conversational tone
- **API Responses**: Efficiency and directness preferred
- **Code Comments**: Focus on technical context
- **Bug Reports**: Precision over politeness

## Quality Metrics

### Effectiveness Scores
```typescript
interface SlopCleanupResult {
  originalStats: {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
  };
  cleanedStats: {
    wordCount: number;
    characterCount: number;
    sentenceCount: number;
  };
  patternsRemoved: {
    preambles: number;
    hedging: number;
    politeness: number;
    transitions: number;
    selfExplanatory: number;
  };
  qualityScore: number; // 0-1, higher = better cleanup
  meaningPreservation: number; // 0-1, closer to 1 = better preservation
}
```

### Success Criteria
- Quality score ≥ 0.8
- Meaning preservation ≥ 0.9
- 15-40% reduction in verbosity
- 100% technical accuracy preserved

## Advanced Features

### Pattern Learning
Track successful removals to improve future matching:
```json
{
  "learnedPatterns": {
    "phrase": "To be honest with you",
    "context": "unnecessary_honesty",
    "confidence": 0.82,
    "removalSuccess": 0.94,
    "feedbackScore": 4.1
  }
}
```

### Custom Pattern Integration
Load project-specific patterns:
```json
{
  "projectPatterns": {
    "conversational": {
      "keep": ["Welcome!", "Thank you for choosing"],
      "remove": ["As you might expect", "Just to clarify"]
    }
  }
}
```

## Integration

### With Other Commands
- `/optimize`: Enhance cleaned prompts for better AI responses
- `/review`: Check cleanup effectiveness and suggest improvements
- `/work`: Apply slop cleanup during implementation tasks

### With Git Workflows
```bash
# Clean commit messages
git commit -m "$(git log -1 --pretty=%B | /clean slop --apply)"

# Clean PR descriptions
gh pr edit --body "$(gh pr view --json | jq -r '.body' | /clean slop --apply)"
```

## Troubleshooting

### "Not enough cleanup"
- Increase mode to aggressive
- Lower confidence threshold with `--confidence`
- Add custom patterns specific to your use case

### "Too much cleanup" 
- Switch to conservative mode
- Add important phrases to `--keep-list`
- Review preview before applying

### "Meaning was changed"
- Check confidence scores with `--verbose`
- Verify custom patterns aren't too broad
- Report pattern conflicts for improvement

Remove AI-generated verbosity systematically while maintaining technical integrity and conversational appropriateness.