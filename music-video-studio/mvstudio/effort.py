"""Effort control: how hard each model thinks on each task.

Effort is the reasoning budget a model spends on a request. The studio sets it
in three layers:

1. Quality mode sets the allowed range for every role (draft keeps costs low,
   masterpiece never lets a role drop below its default).
2. The Effort Planner (Haiku) reads the brief and picks an effort for each
   stage inside that range, based on how demanding this project makes it.
   Pins in the brief's `[studio.effort]` table override the planner.
3. When the showrunner sends work back, each revision runs one effort level
   higher than the last, up to the role's maximum.
"""

from __future__ import annotations

import json
from dataclasses import dataclass

from .team import ROLES, STAGES, Role, model_name, stage_role

LEVELS = ["low", "medium", "high", "xhigh", "max"]


def level_index(level: str) -> int:
    try:
        return LEVELS.index(level)
    except ValueError:
        raise ValueError(f"unknown effort level {level!r}; use one of {', '.join(LEVELS)}") from None


def clamp(level: str, low: str, high: str) -> str:
    i = min(max(level_index(level), level_index(low)), level_index(high))
    return LEVELS[i]


def escalate(level: str, steps: int, ceiling: str) -> str:
    return LEVELS[min(level_index(level) + steps, level_index(ceiling))]


@dataclass(frozen=True)
class Quality:
    name: str
    description: str
    critique_stages: frozenset[str]
    threshold: int  # showrunner score needed to approve, out of 10
    max_revisions: int
    critic_effort: str

    def effort_range(self, role: Role) -> tuple[str, str]:
        if self.name == "draft":
            return role.min_effort, role.default_effort
        if self.name == "masterpiece":
            return role.default_effort, role.max_effort
        return role.min_effort, role.max_effort


_CRITIQUABLE = frozenset(s.key for s in STAGES if s.criteria)

QUALITIES: dict[str, Quality] = {
    "draft": Quality(
        "draft", "Fast and cheap first pass: no critique, efforts capped at each role's default.",
        frozenset(), 0, 0, "medium",
    ),
    "standard": Quality(
        "standard", "Treatment and storyboard are critiqued (score 8/10 needed, one revision).",
        frozenset({"treatment", "storyboard"}), 8, 1, "high",
    ),
    "masterpiece": Quality(
        "masterpiece",
        "Every major deliverable is critiqued (score 9/10 needed, up to three revisions, "
        "effort rises each round); efforts never drop below each role's default.",
        _CRITIQUABLE, 9, 3, "xhigh",
    ),
}


@dataclass
class StageEffort:
    stage: str
    effort: str
    reason: str
    source: str  # "planner", "pinned" or "default"


PLAN_SCHEMA = {
    "type": "object",
    "properties": {
        "stages": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "stage": {"type": "string", "enum": [s.key for s in STAGES]},
                    "effort": {"type": "string", "enum": LEVELS},
                    "reason": {"type": "string"},
                },
                "required": ["stage", "effort", "reason"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["stages"],
    "additionalProperties": False,
}


def planner_prompt(quality: Quality) -> str:
    """The planner's task. The brief itself is in the system prompt."""
    lines = []
    for stage in STAGES:
        role = stage_role(stage)
        low, high = quality.effort_range(role)
        lines.append(
            f"- `{stage.key}` ({role.title}, {model_name(role.model)}; allowed {low} to {high}): {stage.summary}"
        )
    stage_list = "\n".join(lines)
    return f"""\
Decide how hard each teammate should think on this music video project.

Effort is the reasoning budget a model spends. `low` is fast and cheap, right for \
straightforward work. `medium` suits routine production writing. `high` suits work that needs \
careful judgment. `xhigh` and `max` are for the hardest creative work, where quality matters \
most. Higher effort costs more and takes longer, so spend it where it will make the video better.

Judge how demanding this particular project makes each stage. For example: a narrative with \
several characters and locations makes the treatment, storyboard and prompts harder; a simple \
performance or lyric video makes them easier; a long song with many sections makes the \
storyboard and edit harder; a strict "avoid" list or must-include list needs more care.

Quality mode: **{quality.name}**: {quality.description}

Choose an effort inside each stage's allowed range, and give a short reason (one sentence).

Stages:
{stage_list}"""


def parse_plan(text: str, quality: Quality, pins: dict[str, str]) -> list[StageEffort]:
    """Turn the planner's JSON into a full plan, clamped to each stage's allowed range.

    Stages the planner skipped get their role default; pinned stages keep their pin.
    """
    chosen: dict[str, tuple[str, str]] = {}
    try:
        data = json.loads(text)
        for item in data.get("stages", []):
            if item.get("stage") in {s.key for s in STAGES} and item.get("effort") in LEVELS:
                chosen[item["stage"]] = (item["effort"], str(item.get("reason", "")).strip())
    except (json.JSONDecodeError, AttributeError, TypeError):
        chosen = {}

    plan = []
    for stage in STAGES:
        role = stage_role(stage)
        low, high = quality.effort_range(role)
        if stage.key in pins:
            plan.append(StageEffort(stage.key, pins[stage.key], "Pinned in brief.toml.", "pinned"))
        elif stage.key in chosen:
            effort, reason = chosen[stage.key]
            plan.append(StageEffort(stage.key, clamp(effort, low, high), reason, "planner"))
        else:
            plan.append(StageEffort(stage.key, clamp(role.default_effort, low, high), "Role default.", "default"))
    return plan


def default_plan(quality: Quality, pins: dict[str, str]) -> list[StageEffort]:
    return parse_plan("{}", quality, pins)


def validate_pins(pins: dict) -> dict[str, str]:
    valid_stages = [s.key for s in STAGES]
    out = {}
    for stage, level in pins.items():
        if stage not in valid_stages:
            raise ValueError(f"[studio.effort] names unknown stage {stage!r}; stages are {', '.join(valid_stages)}")
        if not isinstance(level, str):
            raise ValueError(f"[studio.effort] {stage} must be a string such as \"high\"")
        level_index(level)
        out[stage] = level
    return out


__all__ = [
    "LEVELS", "QUALITIES", "Quality", "StageEffort", "PLAN_SCHEMA", "ROLES",
    "clamp", "escalate", "planner_prompt", "parse_plan", "default_plan", "validate_pins",
]
