"""Talking to Claude: one request per call, with effort, caching and fallbacks.

`ClaudeBackend` calls the Anthropic API. `DryRunBackend` returns placeholder text so
you can try the whole pipeline without an API key or spending anything.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, field

from .team import HAIKU, OPUS, SONNET

# USD per million tokens (input, output, cache read). Cache writes bill at 1.25x input.
# Haiku 5.5's rates apply to prompts up to 100K tokens; studio prompts stay well under that.
PRICING = {
    OPUS: (4.00, 20.00, 0.20),
    SONNET: (2.00, 10.00, 0.20),
    HAIKU: (0.10, 0.50, 0.01),
}

# Models that accept the server-side `fallbacks: "default"` safety net on the Claude API.
FALLBACK_MODELS = {OPUS, SONNET}
FALLBACK_BETA = "server-side-fallback-2026-07-01"


@dataclass
class Usage:
    input_tokens: int = 0
    output_tokens: int = 0
    cache_read_tokens: int = 0
    cache_write_tokens: int = 0

    def add(self, other: "Usage") -> None:
        self.input_tokens += other.input_tokens
        self.output_tokens += other.output_tokens
        self.cache_read_tokens += other.cache_read_tokens
        self.cache_write_tokens += other.cache_write_tokens

    def to_dict(self) -> dict:
        return dict(self.__dict__)


def estimate_cost(model: str, usage: Usage) -> float:
    inp, out, cache_read = PRICING.get(model, PRICING[OPUS])
    return (
        usage.input_tokens * inp
        + usage.output_tokens * out
        + usage.cache_read_tokens * cache_read
        + usage.cache_write_tokens * inp * 1.25
    ) / 1_000_000


@dataclass
class Reply:
    text: str
    model: str  # the model that actually served the request
    stop_reason: str
    usage: Usage = field(default_factory=Usage)
    cost: float = 0.0
    seconds: float = 0.0

    @property
    def truncated(self) -> bool:
        return self.stop_reason == "max_tokens"


class StudioError(Exception):
    """A request failed in a way the pipeline should report, not crash on."""


class RefusalError(StudioError):
    pass


class FatalError(StudioError):
    """Nothing else will work either (bad credentials, model unavailable): stop the run."""


class ClaudeBackend:
    def __init__(self, client=None, use_fallbacks: bool = True, max_tokens: int = 64000):
        if client is None:
            import anthropic

            client = anthropic.Anthropic(max_retries=4)
        self.client = client
        self.use_fallbacks = use_fallbacks
        self.max_tokens = max_tokens

    def complete(self, *, model: str, effort: str, system: str, prompt: str, schema: dict | None = None) -> Reply:
        output_config: dict = {"effort": effort}
        if schema is not None:
            output_config["format"] = {"type": "json_schema", "schema": schema}

        request = dict(
            model=model,
            max_tokens=self.max_tokens,
            # The system prompt (studio rules + project brief) is identical for every stage,
            # so it is cached and re-read cheaply by each later request to the same model.
            system=[{"type": "text", "text": system, "cache_control": {"type": "ephemeral"}}],
            messages=[{"role": "user", "content": prompt}],
            thinking={"type": "adaptive"},
            output_config=output_config,
        )
        if self.use_fallbacks and model in FALLBACK_MODELS:
            # If a safety classifier declines, the API reruns the request on a suitable model.
            request["betas"] = [FALLBACK_BETA]
            request["fallbacks"] = "default"

        import anthropic

        started = time.monotonic()
        try:
            # Streaming keeps long, high-effort responses safe from HTTP timeouts.
            with self.client.beta.messages.stream(**request) as stream:
                message = stream.get_final_message()
        except TypeError as e:
            if "authentication" not in str(e).lower():
                raise
            raise FatalError(
                "No Anthropic credentials found. Set ANTHROPIC_API_KEY (or run `ant auth login`), "
                "or add --dry-run to try the pipeline without calling the API."
            ) from None
        except anthropic.AuthenticationError:
            raise FatalError(
                "The Anthropic API rejected the credentials. Set ANTHROPIC_API_KEY "
                "(or run `ant auth login`) and try again."
            ) from None
        except anthropic.PermissionDeniedError as e:
            raise FatalError(f"This API key can't use {model}: {e.message}") from None
        except anthropic.NotFoundError as e:
            raise FatalError(f"{model} isn't available to this API key: {e.message}") from None
        except anthropic.RateLimitError:
            raise StudioError(f"Rate limited on {model} even after retries; wait a minute and run again.") from None
        except anthropic.APIStatusError as e:
            raise StudioError(f"API error {e.status_code} from {model}: {e.message}") from None
        except anthropic.APIConnectionError:
            raise StudioError("Couldn't reach the Anthropic API; check your connection and run again.") from None
        seconds = time.monotonic() - started

        if message.stop_reason == "refusal":
            details = getattr(message, "stop_details", None)
            category = getattr(details, "category", None) if details else None
            raise RefusalError(f"{model} declined this request (category: {category or 'unspecified'}).")

        text = "".join(block.text for block in message.content if block.type == "text").strip()
        u = message.usage
        usage = Usage(
            input_tokens=u.input_tokens or 0,
            output_tokens=u.output_tokens or 0,
            cache_read_tokens=getattr(u, "cache_read_input_tokens", 0) or 0,
            cache_write_tokens=getattr(u, "cache_creation_input_tokens", 0) or 0,
        )
        served = message.model or model
        return Reply(
            text=text,
            model=served,
            stop_reason=message.stop_reason or "end_turn",
            usage=usage,
            cost=estimate_cost(served if served in PRICING else model, usage),
            seconds=seconds,
        )


class DryRunBackend:
    """Placeholder responses: shows the flow, the team and the effort plan for free."""

    def complete(self, *, model: str, effort: str, system: str, prompt: str, schema: dict | None = None) -> Reply:
        if schema is not None and "stages" in schema.get("properties", {}):
            keys = schema["properties"]["stages"]["items"]["properties"]["stage"]["enum"]
            text = json.dumps({"stages": [
                {"stage": k, "effort": "high", "reason": "Dry run: no real assessment."} for k in keys
            ]})
        elif schema is not None and "score" in schema.get("properties", {}):
            text = json.dumps({
                "score": 10, "strengths": ["Dry run."], "issues": [],
                "revision_notes": "Dry run: no real review.",
            })
        else:
            heading = next((line for line in prompt.splitlines() if line.startswith("## ")), "")
            text = (
                f"*Dry run: {model} at effort `{effort}` would write this document.*\n\n"
                f"{heading}\n\n(placeholder)"
            )
        return Reply(text=text, model=model, stop_reason="end_turn")
