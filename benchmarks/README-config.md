# Ferg Engineering System Validation Configuration

## API Configuration

### Anthropic Claude (Recommended)
```json
{
  "api": {
    "provider": "anthropic",
    "api_key": "your-anthropic-api-key-here",
    "base_url": "https://api.anthropic.com",
    "model": "claude-3-sonnet-20240229",
    "max_tokens": 4096,
    "temperature": 0.1,
    "timeout": 60
  }
}
```

### OpenAI GPT-4 (Alternative)
```json
{
  "api": {
    "provider": "openai",
    "api_key": "your-openai-api-key-here",
    "base_url": "https://api.openai.com/v1",
    "model": "gpt-4",
    "max_tokens": 4096,
    "temperature": 0.1,
    "timeout": 60
  }
}
```

## Rate Limiting

Adjust based on your API plan:

```json
{
  "rate_limit": {
    "requests_per_minute": 50,    // Anthropic Tier 1 limit
    "requests_per_hour": 1000,    // Anthropic Tier 1 limit
    "burst_limit": 10             // Allow some bursting
  }
}
```

## Cache Configuration

```json
{
  "cache": {
    "enabled": true,
    "cache_dir": ".cache"
  }
}
```

## Validation Parameters

```json
{
  "validation": {
    "alpha": 0.05,              // Significance level
    "power": 0.80,              // Desired statistical power
    "bootstrap_resamples": 9999, // Bootstrap iterations
    "min_sample_size": 3,       // Minimum samples for analysis
    "max_sample_size": 100      // Maximum samples to collect
  }
}
```

## Getting API Keys

### Anthropic
1. Go to https://console.anthropic.com/
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

### OpenAI
1. Go to https://platform.openai.com/api-keys
2. Create an account or sign in
3. Create a new API key
4. Copy the key to your `.env` file

## Environment Variables

Create a `.env` file in the benchmarks directory:

```bash
# For Anthropic
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# For OpenAI
OPENAI_API_KEY=your-openai-api-key-here
```

## Cost Estimation

### Anthropic Claude-3-Sonnet
- Input: $3.00 per million tokens
- Output: $15.00 per million tokens

### Sample Cost Calculation
For 12 tasks × 2 prompt types × 3 variants × 30 samples = 2,160 API calls:
- Average tokens per call: ~1,000 (500 input + 500 output)
- Total tokens: ~2.16 million
- Estimated cost: $6.48 - $32.40 (depending on provider)

## Testing Configuration

For dry-run testing, use mock API responses:

```json
{
  "api": {
    "provider": "mock",
    "mock_response": "This is a mock response for testing."
  }
}
```