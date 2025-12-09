# G-Eval Evaluation Prompt Template

This template implements the G-Eval methodology (Liu et al., 2023) for LLM-as-judge evaluation with chain-of-thought reasoning. Achieves 0.514 Spearman correlation with human judgment.

## Template Structure

```markdown
You are evaluating an AI assistant's response quality.

**Task:** {{task}}

**Baseline Response:**
```
{{baseline_response}}
```

**Enhanced Response:**
```
{{enhanced_response}}
```

## Evaluation Dimensions

Evaluate on these dimensions (1-5 scale each):

### 1. Accuracy
**Definition:** Factual correctness and precision of information provided
**Consider:**
- Are facts and statements correct?
- Is technical information accurate?
- Are code examples valid and functional?
- Are there any hallucinations or fabricated information?

### 2. Completeness
**Definition:** Coverage of required elements and thoroughness of analysis
**Consider:**
- Does the response address all aspects of the task?
- Are important details or considerations missing?
- Is the analysis comprehensive and thorough?

### 3. Clarity
**Definition:** Readability, organization, and structure of the response
**Consider:**
- Is the response well-organized and easy to follow?
- Is the language clear and unambiguous?
- Are complex ideas explained step-by-step?
- Is there appropriate use of formatting (lists, code blocks, etc.)?

### 4. Actionability
**Definition:** Practical usefulness and implementability of recommendations
**Consider:**
- Are the recommendations specific and actionable?
- Can the user actually implement the suggestions?
- Are the solutions practical for real-world constraints?
- Are potential risks or limitations acknowledged?

### 5. Relevance
**Definition:** Focus on user's actual needs and task requirements
**Consider:**
- Does the response directly address the user's stated problem?
- Is the analysis relevant to the user's context?
- Are unnecessary tangents or irrelevant details included?
- Is the level of detail appropriate for the task complexity?

## Evaluation Process

For each dimension:

1. **Think step-by-step** about strengths and weaknesses
2. **Provide specific evidence** from the response
3. **Assign a score (1-5)** with clear justification
4. **Rate your confidence** in the score (0-1)

## Output Format

```json
{
  "accuracy": {
    "score": N,
    "reasoning": "Step-by-step analysis of accuracy...",
    "evidence": ["Specific quote from response", "Another quote showing issue"]
  },
  "completeness": {
    "score": N,
    "reasoning": "Step-by-step analysis of completeness...",
    "evidence": ["Missing element X", "Incomplete coverage of Y"]
  },
  "clarity": {
    "score": N,
    "reasoning": "Step-by-step analysis of clarity...",
    "evidence": ["Well-structured explanation", "Confusing paragraph found"]
  },
  "actionability": {
    "score": N,
    "reasoning": "Step-by-step analysis of actionability...",
    "evidence": ["Actionable recommendation", "Vague suggestion"]
  },
  "relevance": {
    "score": N,
    "reasoning": "Step-by-step analysis of relevance...",
    "evidence": ["Directly addresses task", "Includes irrelevant details"]
  },
  "overall": {
    "baseline_score": N,
    "enhanced_score": N,
    "winner": "baseline|enhanced|tie",
    "confidence": 0.N
  }
}
```

## Instructions

1. **Be thorough and objective** - Evaluate both responses fairly based on the criteria
2. **Provide evidence** - Quote specific parts of the responses to support your scores
3. **Explain reasoning** - Show your step-by-step thought process for each dimension
4. **Be consistent** - Use the same evaluation standards across all dimensions
5. **Consider context** - Take into account the task requirements and expected elements

## Quality Standards

- **Score 1**: Excellent - Exceeds expectations, comprehensive and insightful
- **Score 2**: Good - Meets expectations well with minor room for improvement
- **Score 3**: Average - Meets basic requirements but has significant flaws
- **Score 4**: Poor - Fails to meet basic requirements
- **Score 5**: Very Poor - Completely inadequate response

## Final Summary

After individual dimension evaluation, provide:
1. **Overall winner determination** with clear rationale
2. **Key differences** between baseline and enhanced responses
3. **Recommendations** for improvement if applicable

---

## Usage

This template should be populated with:
- `{{task}}`: The task description from the benchmark
- `{{baseline_response}}`: The baseline AI response
- `{{enhanced_response}}`: The enhanced AI response (with incentive techniques)

The evaluator will analyze both responses and determine which one is superior based on the defined dimensions.