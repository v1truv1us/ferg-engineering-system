"""
Response Collector for LLM API Integration
Handles API calls, rate limiting, caching, and response storage.
"""

import asyncio
import json
import time
import hashlib
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
from dataclasses import dataclass
from abc import ABC, abstractmethod

import os
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from dotenv import load_dotenv

@dataclass
class APIConfig:
    """Configuration for LLM API access."""
    provider: str  # 'anthropic', 'openai', etc.
    api_key: str
    base_url: str
    model: str
    max_tokens: int = 4096
    temperature: float = 0.1
    timeout: int = 60

@dataclass
class RateLimit:
    """Rate limiting configuration."""
    requests_per_minute: int
    requests_per_hour: int
    burst_limit: int = 10

@dataclass
class ResponseMetadata:
    """Metadata for collected responses."""
    task_id: str
    prompt_type: str  # 'baseline' or 'enhanced'
    variant_id: str
    timestamp: str
    provider: str
    model: str
    tokens_used: Optional[int] = None
    cost_estimate: Optional[float] = None
    response_time_ms: Optional[int] = None
    cached: bool = False

class LLMProvider(ABC):
    """Abstract base class for LLM providers."""

    def __init__(self, config: APIConfig):
        self.config = config
        self.session = self._create_session()

    def _create_session(self) -> requests.Session:
        """Create HTTP session with retry strategy."""
        session = requests.Session()
        retry_strategy = Retry(
            total=3,
            status_forcelist=[429, 500, 502, 503, 504],
            backoff_factor=1
        )
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        return session

    @abstractmethod
    def call_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        """Make API call and return (response_text, metadata)."""
        pass

class AnthropicProvider(LLMProvider):
    """Anthropic Claude via Claude Code CLI."""

    def call_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        import subprocess

        # Create a temporary file with the prompt
        prompt_file = f"/tmp/claude_prompt_{hash(prompt) % 10000}.txt"
        with open(prompt_file, 'w') as f:
            f.write(prompt)

        start_time = time.time()

        try:
            # Use Claude Code to get response (non-interactive mode)
            cmd = ['claude', '-p', prompt]
            env = os.environ.copy()  # Pass through environment variables
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.config.timeout,
                env=env,
                cwd=os.getcwd()  # Run in current directory
            )

            response_time = int((time.time() - start_time) * 1000)

            if result.returncode != 0:
                raise Exception(f"Claude Code failed (exit code {result.returncode}): stdout='{result.stdout}', stderr='{result.stderr}'")

            response_text = result.stdout.strip()

            # Clean up
            try:
                os.remove(prompt_file)
            except:
                pass

            metadata = {
                'tokens_used': len(prompt.split()) + len(response_text.split()),
                'response_time_ms': response_time,
                'model': 'claude-code'
            }

            return response_text, metadata

        except subprocess.TimeoutExpired:
            raise Exception(f"Claude Code timed out after {self.config.timeout}s")
        except Exception as e:
            # Clean up on error
            try:
                os.remove(prompt_file)
            except:
                pass
            raise e

class OpenAIProvider(LLMProvider):
    """OpenAI GPT API provider."""

    def call_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'Content-Type': 'application/json'
        }

        data = {
            'model': self.config.model,
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': self.config.max_tokens,
            'temperature': self.config.temperature
        }

        start_time = time.time()
        response = self.session.post(
            f"{self.config.base_url}/chat/completions",
            headers=headers,
            json=data,
            timeout=self.config.timeout
        )
        response_time = int((time.time() - start_time) * 1000)

        if response.status_code != 200:
            raise Exception(f"API call failed: {response.status_code} - {response.text}")

        result = response.json()
        response_text = result['choices'][0]['message']['content']
        tokens_used = result.get('usage', {}).get('total_tokens', 0)

        metadata = {
            'tokens_used': tokens_used,
            'response_time_ms': response_time,
            'model': result.get('model', self.config.model)
        }

        return response_text, metadata

class OpenCodeProvider(LLMProvider):
    """OpenCode via OpenCode CLI."""

    def call_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        import subprocess

        start_time = time.time()

        try:
            # Use OpenCode CLI to get response
            cmd = ['opencode', 'run', prompt]
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=self.config.timeout,
                input='exit\n'  # Exit after getting response
            )

            response_time = int((time.time() - start_time) * 1000)

            if result.returncode != 0:
                raise Exception(f"OpenCode CLI failed: {result.stderr}")

            response_text = result.stdout.strip()

            metadata = {
                'tokens_used': len(prompt.split()) + len(response_text.split()),
                'response_time_ms': response_time,
                'model': 'opencode-cli'
            }

            return response_text, metadata

        except subprocess.TimeoutExpired:
            raise Exception(f"OpenCode CLI timed out after {self.config.timeout}s")

class DeepSeekProvider(LLMProvider):
    """DeepSeek API provider."""

    def call_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        headers = {
            'Authorization': f'Bearer {self.config.api_key}',
            'Content-Type': 'application/json'
        }

        data = {
            'model': self.config.model,
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': self.config.max_tokens,
            'temperature': self.config.temperature
        }

        start_time = time.time()
        response = self.session.post(
            f"{self.config.base_url}/chat/completions",
            headers=headers,
            json=data,
            timeout=self.config.timeout
        )
        response_time = int((time.time() - start_time) * 1000)

        if response.status_code != 200:
            raise Exception(f"API call failed: {response.status_code} - {response.text}")

        result = response.json()
        response_text = result['choices'][0]['message']['content']
        tokens_used = result.get('usage', {}).get('total_tokens', 0)

        metadata = {
            'tokens_used': tokens_used,
            'response_time_ms': response_time,
            'model': result.get('model', self.config.model)
        }

        return response_text, metadata

class GitHubProvider(LLMProvider):
    """GitHub Copilot via copilot-api proxy."""

    def call_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        headers = {
            'Content-Type': 'application/json'
        }

        data = {
            'model': self.config.model,
            'messages': [{'role': 'user', 'content': prompt}],
            'max_tokens': self.config.max_tokens,
            'temperature': self.config.temperature
        }

        start_time = time.time()
        response = self.session.post(
            f"{self.config.base_url}/chat/completions",
            headers=headers,
            json=data,
            timeout=self.config.timeout
        )
        response_time = int((time.time() - start_time) * 1000)

        if response.status_code != 200:
            raise Exception(f"GitHub Copilot API failed: {response.status_code} - {response.text}")

        result = response.json()
        response_text = result['choices'][0]['message']['content']
        tokens_used = result.get('usage', {}).get('total_tokens', 0)

        metadata = {
            'tokens_used': tokens_used,
            'response_time_ms': response_time,
            'model': result.get('model', self.config.model)
        }

        return response_text, metadata

class CursorProvider(LLMProvider):
    """Cursor AI (placeholder - CLI not yet available)."""

    def call_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        # Cursor doesn't currently have a CLI interface
        # This is a placeholder for when/if Cursor provides CLI access
        raise Exception("Cursor CLI not available. Cursor is primarily a GUI application. "
                       "Consider using Cursor's API if available, or wait for CLI support.")

class RateLimiter:
    """Simple rate limiter for API calls."""

    def __init__(self, rate_limit: RateLimit):
        self.rate_limit = rate_limit
        self.requests = []

    def can_make_request(self) -> bool:
        """Check if we can make another request."""
        now = time.time()

        # Remove old requests outside time windows
        self.requests = [t for t in self.requests if now - t < 3600]  # Keep last hour

        # Check rate limits
        recent_minute = [t for t in self.requests if now - t < 60]
        recent_hour = self.requests

        if len(recent_minute) >= self.rate_limit.requests_per_minute:
            return False
        if len(recent_hour) >= self.rate_limit.requests_per_hour:
            return False

        return True

    def record_request(self):
        """Record that a request was made."""
        self.requests.append(time.time())

    def wait_time(self) -> float:
        """Calculate how long to wait before next request."""
        if self.can_make_request():
            return 0.0

        now = time.time()
        recent_minute = [t for t in self.requests if now - t < 60]

        if len(recent_minute) >= self.rate_limit.requests_per_minute:
            oldest_recent = min(recent_minute)
            return 60 - (now - oldest_recent)

        return 1.0  # Default wait time

class ResponseCache:
    """Cache for API responses to avoid duplicate calls."""

    def __init__(self, cache_dir: str = ".cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)

    def get_cache_key(self, prompt: str, provider: str, model: str) -> str:
        """Generate cache key for prompt."""
        content = f"{provider}:{model}:{prompt}"
        return hashlib.sha256(content.encode()).hexdigest()

    def get_cached_response(self, cache_key: str) -> Optional[Dict[str, Any]]:
        """Get cached response if it exists."""
        cache_file = self.cache_dir / f"{cache_key}.json"
        if cache_file.exists():
            try:
                with open(cache_file, 'r') as f:
                    return json.load(f)
            except:
                return None
        return None

    def cache_response(self, cache_key: str, response_data: Dict[str, Any]):
        """Cache response data."""
        cache_file = self.cache_dir / f"{cache_key}.json"
        with open(cache_file, 'w') as f:
            json.dump(response_data, f, indent=2)

class MockProvider:
    """Mock provider for testing."""

    def __init__(self, config):
        self.config = config

    def call_api(self, prompt: str) -> Tuple[str, Dict[str, Any]]:
        """Return mock response."""
        import time
        response_text = getattr(self.config, 'mock_response', 'Mock response for testing')
        metadata = {
            'tokens_used': len(prompt.split()) + len(response_text.split()),
            'response_time_ms': 100,  # Mock response time
            'model': 'mock-model'
        }
        return response_text, metadata

class ResponseCollector:
    """Main response collector for validation framework."""

    def __init__(self, config: Dict[str, Any], dry_run: bool = False):
        self.config = config
        self.cache = ResponseCache()
        self.rate_limiter = RateLimiter(RateLimit(**config.get('rate_limit', {})))

        # Support both single API and multiple APIs
        if 'apis' in config:
            if dry_run:
                # Use mock providers for dry run
                self.providers = {api['provider']: self._create_provider({'provider': 'mock', 'mock_response': f'Dry run mock for {api["provider"]}'}) for api in config['apis']}
            else:
                self.providers = {api['provider']: self._create_provider(api) for api in config['apis']}
        elif 'api' in config:
            if dry_run:
                self.providers = {config['api']['provider']: self._create_provider({'provider': 'mock', 'mock_response': f'Dry run mock for {config["api"]["provider"]}'})}
            else:
                self.providers = {config['api']['provider']: self._create_provider(config['api'])}
        else:
            raise ValueError("Config must contain either 'api' or 'apis' key")

    def _create_provider(self, api_config: Dict[str, Any]) -> LLMProvider:
        """Create appropriate provider based on configuration."""
        # Load environment variables from .env file
        load_dotenv()

        # CLI-based providers don't need API keys (except OpenCode which may need external auth)
        # All authentication is handled by the respective CLI tools

        if api_config.get('provider') == 'mock':
            # Create a mock config object
            class MockConfig:
                def __init__(self, **kwargs):
                    for k, v in kwargs.items():
                        setattr(self, k, v)
            config = MockConfig(**api_config)
            return MockProvider(config)

        # Create config object, handling CLI providers that don't need API keys
        if api_config.get('provider') in ['anthropic', 'opencode']:
            # CLI-based providers
            class CLIConfig:
                def __init__(self, **kwargs):
                    for k, v in kwargs.items():
                        setattr(self, k, v)
            config = CLIConfig(**api_config)
        else:
            config = APIConfig(**api_config)

        if config.provider.lower() == 'anthropic':
            return AnthropicProvider(config)
        elif config.provider.lower() == 'openai':
            return OpenAIProvider(config)
        elif config.provider.lower() == 'opencode':
            return OpenCodeProvider(config)
        elif config.provider.lower() == 'deepseek':
            return DeepSeekProvider(config)
        elif config.provider.lower() == 'github':
            return GitHubProvider(config)
        elif config.provider.lower() == 'cursor':
            return CursorProvider(config)
        else:
            raise ValueError(f"Unsupported provider: {config.provider}")

    async def collect_response(
        self,
        task_id: str,
        prompt_type: str,
        variant_id: str,
        prompt: str,
        output_dir: str,
        provider_name: str = None,
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """Collect response for a single prompt."""

        # Select provider
        if provider_name and provider_name in self.providers:
            provider = self.providers[provider_name]
        elif len(self.providers) == 1:
            provider = list(self.providers.values())[0]
            provider_name = list(self.providers.keys())[0]
        else:
            raise ValueError(f"Multiple providers available but none specified. Available: {list(self.providers.keys())}")

        # Create cache key
        model_name = getattr(provider.config, 'model', 'mock-model')
        cache_key = self.cache.get_cache_key(prompt, provider_name, model_name)

        # Check cache first
        cached = self.cache.get_cached_response(cache_key)
        if cached and not dry_run:
            cached['cached'] = True
            return cached

        # Dry run mode
        if dry_run:
            response_data = {
                'task_id': task_id,
                'prompt_type': prompt_type,
                'variant_id': variant_id,
                'prompt': prompt,
                'response': f"[DRY RUN] Mock response for {task_id} - {prompt_type} variant",
                'metadata': ResponseMetadata(
                    task_id=task_id,
                    prompt_type=prompt_type,
                    variant_id=variant_id,
                    timestamp=time.time(),
                    provider='mock',
                    model='mock-model',
                    cached=False
                ).__dict__,
                'cached': False
            }
        else:
            # Wait for rate limit
            wait_time = self.rate_limiter.wait_time()
            if wait_time > 0:
                await asyncio.sleep(wait_time)

            # Make API call
            try:
                response_text, api_metadata = provider.call_api(prompt)
                self.rate_limiter.record_request()

                response_data = {
                    'task_id': task_id,
                    'prompt_type': prompt_type,
                    'variant_id': variant_id,
                    'prompt': prompt,
                    'response': response_text,
                    'metadata': ResponseMetadata(
                        task_id=task_id,
                        prompt_type=prompt_type,
                        variant_id=variant_id,
                        timestamp=time.time(),
                        provider=provider_name,
                        model=getattr(provider.config, 'model', 'mock-model'),
                        tokens_used=api_metadata.get('tokens_used'),
                        response_time_ms=api_metadata.get('response_time_ms'),
                        cached=False
                    ).__dict__,
                    'cached': False
                }

                # Cache the response
                self.cache.cache_response(cache_key, response_data)

            except Exception as e:
                response_data = {
                    'task_id': task_id,
                    'prompt_type': prompt_type,
                    'variant_id': variant_id,
                    'prompt': prompt,
                    'response': f"[ERROR] API call failed: {str(e)}",
                    'metadata': ResponseMetadata(
                        task_id=task_id,
                        prompt_type=prompt_type,
                        variant_id=variant_id,
                        timestamp=time.time(),
                        provider=provider_name,
                        model=getattr(provider.config, 'model', 'mock-model'),
                        cached=False
                    ).__dict__,
                    'error': str(e),
                    'cached': False
                }

        # Save to output directory
        output_path = Path(output_dir) / f"{task_id}_{prompt_type}_{variant_id}.json"
        output_path.parent.mkdir(parents=True, exist_ok=True)

        with open(output_path, 'w') as f:
            json.dump(response_data, f, indent=2, default=str)

        return response_data

    async def collect_responses_batch(
        self,
        requests: List[Dict[str, Any]],
        output_dir: str,
        dry_run: bool = False,
        concurrency: int = 1  # Reduced concurrency for CLI tools
    ) -> List[Dict[str, Any]]:
        """Collect responses for multiple prompts with concurrency control."""

        async def collect_single(request: Dict[str, Any]) -> Dict[str, Any]:
            return await self.collect_response(
                task_id=request['task_id'],
                prompt_type=request['prompt_type'],
                variant_id=request['variant_id'],
                prompt=request['prompt'],
                output_dir=output_dir,
                provider_name=request.get('provider'),
                dry_run=dry_run
            )

        # Use semaphore for concurrency control
        semaphore = asyncio.Semaphore(concurrency)

        async def limited_collect(request: Dict[str, Any]) -> Dict[str, Any]:
            async with semaphore:
                return await collect_single(request)

        # Execute all requests
        tasks = [limited_collect(request) for request in requests]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Handle exceptions
        processed_results = []
        for i, result in enumerate(results):
            if isinstance(result, Exception):
                print(f"Error collecting response {i}: {result}")
                # Return error response
                request = requests[i]
                processed_results.append({
                    'task_id': request['task_id'],
                    'prompt_type': request['prompt_type'],
                    'variant_id': request['variant_id'],
                    'error': str(result)
                })
            else:
                processed_results.append(result)

        return processed_results