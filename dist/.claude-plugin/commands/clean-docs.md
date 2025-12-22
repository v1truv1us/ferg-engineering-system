---
name: ai-eng/clean-docs  
description: Clean documentation by removing verbosity, conversational filler, and redundant explanations while maintaining technical clarity
agent: build
---

# Clean Docs Command

Specialized command for optimizing documentation by removing AI-generated verbosity, conversational tone, and redundant explanations while preserving technical accuracy, examples, warnings, and essential information.

## Usage

```bash
/clean docs <file-or-directory> [options]
```

## Documentation Issues Targeted

### Category 1: Conversational Filler
AI-generated conversational language in technical docs:
```markdown
# BEFORE:
Welcome to the documentation for our API! In this guide, we'll explore the comprehensive features available to you as a developer. Getting started with our platform is exciting, and I'm happy to walk you through everything you need to know.

# AFTER:
# API Documentation
Developer guide for platform features, setup, and usage.
```

### Category 2: Redundant Explanations
Explaining self-evident or obvious information:
```markdown
# BEFORE:
## Authentication
As the name suggests, this endpoint handles user authentication. This function validates user credentials and returns an authentication token. As you can see from the code examples below, the process involves three main steps.

# AFTER:
## Authentication  
Validates user credentials and returns authentication token using three-step process.
```

### Category 3: Excessive Verbose Transitions
Wordy transitions between sections:
```markdown
# BEFORE:
Having discussed the installation process, let's now move on to the configuration section. Building on the installation knowledge we've established, the next logical step is to examine the various configuration options available to you.

# AFTER:
## Configuration
Available options for customizing installation behavior.
```

### Category 4: Self-Referential Content
Unnecessary references to documentation itself:
```markdown
# BEFORE:
This document will walk you through the setup process. In this guide, you'll find step-by-step instructions for getting started.

# AFTER:
Setup guide with step-by-step installation instructions.
```

## Process

### Phase 1: Documentation Analysis
1. **Structure Identification**: Parse headings, code blocks, examples, warnings
2. **Content Classification**: Separate technical from conversational content
3. **Pattern Detection**: Match against verbosity patterns
4. **Context Assessment**: Determine necessity of explanations

### Phase 2: Cleanup Strategy
Based on mode and documentation type:

#### API Documentation
- **Preserve**: Endpoints, parameters, examples, authentication flows
- **Remove**: Conversational openings, excessive explanations, filler transitions
- **Enhance**: Quick reference tables, error codes, rate limits

#### Tutorial/Guide Content  
- **Preserve**: Learning objectives, step-by-step instructions, examples
- **Remove**: Redundant explanations, obvious statements, wordy transitions
- **Enhance**: Progress indicators, key takeaways, troubleshooting

#### Reference Documentation
- **Preserve**: Complete specifications, constraints, edge cases
- **Remove**: Conversational tone, self-evident explanations
- **Enhance**: Quick navigation, searchable content, code snippets

### Phase 3: Quality Preservation
- **Technical Accuracy**: All specifications remain unchanged
- **Example Integrity**: Code examples compile and work correctly
- **Warning Preservation**: Security, performance, and compatibility notes
- **Clarity Enhancement**: Improve readability without losing information

## Output Examples

### Preview Mode
```
## Documentation Cleanup Preview: README.md

### Analysis:
- Total sections: 12, Words: 2456, Characters: 15892
- Conversational filler detected: 8 instances
- Redundant explanations: 6 instances  
- Verbose transitions: 4 instances

### Changes Proposed:

#### Section: Introduction
- BEFORE: "Welcome to our project! I'm excited to help you get started..."
- AFTER: "Project overview and quick start guide"
- Reduction: 68% words, 72% characters

#### Section: Installation  
- BEFORE: "Having covered the prerequisites, let's now move on to the installation process. Building on what we've established..."
- AFTER: "Installation"
- Reduction: 83% words, 79% characters

#### Section: API Reference
- BEFORE: "The following code shows how to use the getUser endpoint..."
- AFTER: "```javascript\n// Get user by ID\ngetUser(id)\n```"
- Reduction: 91% words, 85% characters

### Impact Summary:
- Conversational filler: 8 removed
- Redundant explanations: 6 removed
- Verbose transitions: 4 removed
- Technical accuracy: 100% preserved
- Examples integrity: 100% maintained
- Overall reduction: 34% words, 31% characters
```

### Apply Mode
```
Cleaning README.md... ✓
- Removed 8 conversational filler instances
- Eliminated 6 redundant explanations
- Reduced 4 verbose transitions
- Preserved all technical specifications
- Maintained all code examples and warnings

Cleaning docs/api/endpoints.md... ✓
- Optimized 12 API endpoint descriptions
- Enhanced quick reference tables
- Preserved all error codes and examples
- Improved navigation and searchability

Summary:
✓ 2 documentation files processed
✓ 18 verbosity instances removed
✓ 29% average reduction in word count
✓ 100% technical accuracy preserved
✓ Enhanced readability and scannability
```

## Options

- `-m, --mode <mode>`: Aggressiveness (conservative|moderate|aggressive) [default: moderate]
- `-t, --type <type>`: Documentation type (api|tutorial|reference|guide|auto) [default: auto-detect]
- `-p, --preview`: Show preview without applying changes
- `-a, --apply`: Apply confirmed changes
- `-r, --recursive`: Process directory recursively
- `-o, --output <file>`: Save cleaned documentation to file
- `-f, --force`: Skip confirmation prompts
- `-v, --verbose`: Show detailed analysis
- `-k, --keep <list>`: Content types to always preserve
- `--preserve-examples`: Always keep code examples [default: true]
- `--preserve-warnings`: Always keep warning/critical notes [default: true]

## Mode Behaviors

### Conservative Mode
- Remove only obvious conversational filler (>0.9 confidence)
- Keep most explanatory content for beginners
- Preserve transitional phrases that aid understanding
- Prioritize completeness over brevity

### Moderate Mode
- Remove clear filler and redundancy (>0.7 confidence)
- Balance explanation removal with learning needs
- Optimize transitions while maintaining flow
- Reduce verbosity but preserve educational value

### Aggressive Mode
- Remove most verbosity patterns (>0.5 confidence)
- Maximum conciseness while preserving technical content
- Assume reader has some technical background
- Prioritize quick reference over tutorial explanations

## Content Type Detection

### API Documentation
**Indicators**: Endpoint descriptions, parameter tables, authentication flows
**Strategy**: Preserve all technical specs, remove conversational tone
**Example**: OpenAPI, Swagger, custom REST API docs

### Tutorial/Guide Content
**Indicators**: Step-by-step instructions, learning objectives, setup guides
**Strategy**: Keep educational explanations, remove obvious filler
**Example**: Getting started guides, tutorials, walkthroughs

### Reference Documentation
**Indicators**: Complete specifications, parameter references, function signatures
**Strategy**: Maximum conciseness, preserve all technical details
**Example**: Language docs, library references, technical specifications

## Quality Assurance

### Preservation Guarantees
- **Never** remove technical specifications or parameters
- **Never** alter code examples or modify functionality
- **Never** remove security warnings or performance notes
- **Never** change error messages or status codes
- **Always** preserve installation requirements and dependencies

### Validation Checks
- [ ] All code examples compile and work correctly
- [ ] Technical specifications remain unchanged
- [ ] Examples are complete and functional
- [ ] Navigation and structure maintained
- [ ] Learning objectives preserved (for tutorials)

## Advanced Features

### Enhancement Mode
Instead of just removing, enhance documentation:
```markdown
# BEFORE:
## Usage
Here's how you can use this function...

# AFTER:
## Usage
```javascript
quickExample()
detailedExample()
```

### Auto-Generated Features
Add helpful content automatically:
- Quick reference tables for API docs
- Navigation improvements (table of contents, breadcrumbs)
- Cross-references between related sections
- Troubleshooting sections for common issues

### Custom Pattern Integration
Support project-specific documentation patterns:
```json
{
  "projectPatterns": {
    "preservePhrases": ["beta notice", "breaking change", "deprecation warning"],
    "removePhrases": ["getting started with", "welcome to"],
    "sectionEnhancements": {
      "api": "add quick reference table",
      "tutorial": "add progress indicators"
    }
  }
}
```

## Integration

### With Development Workflow
```bash
# Clean docs before release
/clean docs docs/ --recursive --apply --mode aggressive

# Clean and regenerate API reference
/clean docs/api/ --apply && npm run build-docs

# Review cleanup effectiveness
/review docs/ --focus=documentation --verbose
```

### With Other Commands
- `/review`: Include documentation quality in code reviews
- `/optimize`: Enhance cleaned documentation for better comprehension
- `/work`: Apply doc cleanup during implementation tasks

## Success Metrics

Successful documentation cleanup achieves:
- **Readability**: Improved scannability and quick reference
- **Conciseness**: 20-40% reduction in filler content
- **Technical Accuracy**: 100% preservation of specifications
- **User Experience**: Faster information retrieval and learning
- **Maintainability**: Easier updates and version management

## Troubleshooting

### "Overly aggressive cleanup"
1. Switch to conservative or moderate mode
2. Add important phrases to `--keep` list
3. Use `--preserve-examples` and `--preserve-warnings`
4. Review preview before applying changes

### "Lost technical information"
1. Check custom patterns aren't too broad
2. Verify `--preserve-examples` and `--preserve-warnings` are enabled
3. Review changes in preview mode before applying
4. Use version control to rollback if needed

### "Documentation structure broken"
1. Ensure section headings and navigation are preserved
2. Verify code blocks and examples remain properly formatted
3. Check that cross-references still work
4. Test generated documentation tools still parse correctly

Systematically optimize documentation for clarity, conciseness, and effectiveness while preserving all essential technical information and examples.