"""Runs the real ClaudeBackend against a local fake of the Messages streaming API."""

import json
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

import anthropic
import pytest

from mvstudio.backend import FALLBACK_BETA, ClaudeBackend, FatalError, RefusalError
from mvstudio.team import HAIKU, OPUS


def sse(model: str, text: str, stop_reason: str = "end_turn") -> bytes:
    events = [
        ("message_start", {"type": "message_start", "message": {
            "id": "msg_test", "type": "message", "role": "assistant", "model": model, "content": [],
            "stop_reason": None, "stop_sequence": None,
            "usage": {"input_tokens": 1200, "output_tokens": 1, "cache_read_input_tokens": 800,
                      "cache_creation_input_tokens": 0}}}),
        ("content_block_start", {"type": "content_block_start", "index": 0,
                                 "content_block": {"type": "text", "text": ""}}),
        ("content_block_delta", {"type": "content_block_delta", "index": 0,
                                 "delta": {"type": "text_delta", "text": text}}),
        ("content_block_stop", {"type": "content_block_stop", "index": 0}),
        ("message_delta", {"type": "message_delta", "delta": {"stop_reason": stop_reason, "stop_sequence": None},
                           "usage": {"output_tokens": 500}}),
        ("message_stop", {"type": "message_stop"}),
    ]
    return "".join(f"event: {name}\ndata: {json.dumps(data)}\n\n" for name, data in events).encode()


@pytest.fixture
def fake_api():
    state = {"requests": [], "reply_text": "## Logline\nA test.", "stop_reason": "end_turn", "status": 200}

    class Handler(BaseHTTPRequestHandler):
        def do_POST(self):
            body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
            state["requests"].append({"path": self.path, "headers": dict(self.headers), "body": body})
            if state["status"] != 200:
                payload = json.dumps({"type": "error", "error": {"type": "authentication_error",
                                                                 "message": "invalid x-api-key"}}).encode()
                self.send_response(state["status"])
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()
                self.wfile.write(payload)
                return
            payload = sse(body["model"], state["reply_text"], state["stop_reason"])
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def log_message(self, *args):
            pass

    server = HTTPServer(("127.0.0.1", 0), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    client = anthropic.Anthropic(api_key="test-key", base_url=f"http://127.0.0.1:{server.server_port}",
                                 max_retries=0)
    yield ClaudeBackend(client=client), state
    server.shutdown()


def test_request_shape_for_opus(fake_api):
    backend, state = fake_api
    reply = backend.complete(model=OPUS, effort="xhigh", system="SYSTEM", prompt="PROMPT")
    req = state["requests"][0]
    body = req["body"]
    assert req["path"].startswith("/v1/messages")
    assert body["model"] == OPUS and body["stream"] is True
    assert body["output_config"] == {"effort": "xhigh"}
    assert body["thinking"] == {"type": "adaptive"}
    assert body["system"][0]["cache_control"] == {"type": "ephemeral"}
    assert body["fallbacks"] == "default"
    assert FALLBACK_BETA in req["headers"].get("anthropic-beta", "")
    assert "temperature" not in body
    assert reply.text == "## Logline\nA test."
    assert reply.usage.input_tokens == 1200 and reply.usage.output_tokens == 500
    assert reply.usage.cache_read_tokens == 800
    assert reply.cost == pytest.approx((1200 * 4 + 500 * 20 + 800 * 0.2) / 1e6)


def test_haiku_gets_no_fallbacks_and_structured_output(fake_api):
    backend, state = fake_api
    schema = {"type": "object", "properties": {"x": {"type": "string"}}, "required": ["x"],
              "additionalProperties": False}
    backend.complete(model=HAIKU, effort="low", system="S", prompt="P", schema=schema)
    body = state["requests"][0]["body"]
    assert "fallbacks" not in body
    assert body["output_config"] == {"effort": "low", "format": {"type": "json_schema", "schema": schema}}


def test_refusal_raises(fake_api):
    backend, state = fake_api
    state["stop_reason"] = "refusal"
    with pytest.raises(RefusalError):
        backend.complete(model=OPUS, effort="high", system="S", prompt="P")


def test_bad_credentials_are_fatal(fake_api):
    backend, state = fake_api
    state["status"] = 401
    with pytest.raises(FatalError):
        backend.complete(model=OPUS, effort="high", system="S", prompt="P")
