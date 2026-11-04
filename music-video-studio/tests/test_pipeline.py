import json
from pathlib import Path

import pytest

from mvstudio.backend import FatalError, Reply, StudioError, Usage
from mvstudio.effort import QUALITIES, clamp, escalate, parse_plan
from mvstudio.pipeline import Studio
from mvstudio.project import Project, create_project
from mvstudio.team import HAIKU, OPUS, SONNET, STAGES, downstream_of


class ScriptedBackend:
    """Records every call; scores and failures are scripted per stage title."""

    def __init__(self, scores=None, fail=None, planner=None):
        self.scores = {k: list(v) for k, v in (scores or {}).items()}  # stage title -> scores in order
        self.fail = fail or {}  # stage title -> exception to raise when authoring
        self.planner = planner
        self.calls = []
        self.drafts = {}

    def complete(self, *, model, effort, system, prompt, schema=None):
        self.calls.append({"model": model, "effort": effort, "prompt": prompt, "schema": schema})
        if schema and "stages" in schema["properties"]:
            return Reply(self.planner or "{}", model, "end_turn", Usage(10, 10), 0.001)
        if schema and "score" in schema["properties"]:
            title = prompt.split('<draft title="', 1)[1].split('"', 1)[0]
            queue = self.scores.get(title, [])
            score = queue.pop(0) if queue else 10
            return Reply(json.dumps({"score": score, "strengths": ["s"], "issues": [f"issue at {score}"],
                                     "revision_notes": f"notes for {score}"}), model, "end_turn", Usage(), 0.01)
        title = prompt.split("# Your task: ", 1)[1].splitlines()[0]
        if title in self.fail:
            raise self.fail[title]
        n = self.drafts.get(title, 0) + 1
        self.drafts[title] = n
        return Reply(f"{title} draft {n}", model, "end_turn", Usage(100, 50), 0.02)

    def authored(self, title):
        return [c for c in self.calls if c["schema"] is None and f"# Your task: {title}\n" in c["prompt"]]


@pytest.fixture
def project(tmp_path: Path) -> Project:
    create_project(tmp_path / "song", "Test Song", "Test Artist", None)
    return Project(tmp_path / "song")


def run_all(project, backend, quality="masterpiece"):
    studio = Studio(project, backend, QUALITIES[quality], log=lambda _m: None)
    plan = studio.plan()
    return studio, studio.run(studio.select(), plan)


def test_effort_ladder_helpers():
    assert clamp("low", "high", "max") == "high"
    assert clamp("max", "low", "medium") == "medium"
    assert escalate("high", 1, "max") == "xhigh"
    assert escalate("xhigh", 3, "xhigh") == "xhigh"


def test_each_stage_uses_its_assigned_model(project):
    backend = ScriptedBackend()
    _, outcome = run_all(project, backend)
    assert set(outcome.values()) == {"done"}
    assert backend.authored("Director's Treatment")[0]["model"] == OPUS
    assert backend.authored("Storyboard")[0]["model"] == SONNET
    assert backend.authored("Song Map")[0]["model"] == HAIKU
    reviews = [c for c in backend.calls if c["schema"] and "score" in c["schema"]["properties"]]
    assert reviews and all(c["model"] == OPUS for c in reviews)


def test_rejected_draft_is_revised_at_higher_effort(project):
    backend = ScriptedBackend(scores={"Director's Treatment": [6, 9]})
    run_all(project, backend)
    calls = backend.authored("Director's Treatment")
    assert [c["effort"] for c in calls] == ["high", "xhigh"]
    assert "scored it 6/10" in calls[1]["prompt"] and "notes for 6" in calls[1]["prompt"]
    assert project.read_doc("02-treatment.md").strip() == "Director's Treatment draft 2"
    entry = project.state["stages"]["treatment"]
    assert entry["score"] == 9 and entry["rounds"] == 2


def test_best_draft_is_kept_when_revisions_never_reach_the_bar(project):
    backend = ScriptedBackend(scores={"Storyboard": [7, 5, 6, 6]})
    run_all(project, backend)
    calls = backend.authored("Storyboard")
    assert len(calls) == 4  # first draft + three revisions
    assert [c["effort"] for c in calls] == ["high", "xhigh", "xhigh", "xhigh"]  # capped at the role's max
    # Every revision works from the best draft so far (draft 1, scored 7).
    assert all("Storyboard draft 1" in c["prompt"] for c in calls[1:])
    assert project.read_doc("03-storyboard.md").strip() == "Storyboard draft 1"
    assert project.state["stages"]["storyboard"]["score"] == 7


def test_draft_mode_skips_critique(project):
    backend = ScriptedBackend()
    run_all(project, backend, quality="draft")
    assert not [c for c in backend.calls if c["schema"] and "score" in c["schema"]["properties"]]


def test_planner_choices_are_clamped_and_pins_win(project):
    planner = json.dumps({"stages": [
        {"stage": "treatment", "effort": "low", "reason": "simple"},
        {"stage": "storyboard", "effort": "max", "reason": "complex"},
        {"stage": "edit", "effort": "medium", "reason": "routine"},
    ]})
    plan = {p.stage: p for p in parse_plan(planner, QUALITIES["masterpiece"], {"edit": "low"})}
    assert plan["treatment"].effort == "high"  # masterpiece never goes below the director's default
    assert plan["storyboard"].effort == "xhigh"  # capped at the storyboard artist's max
    assert plan["edit"].effort == "low" and plan["edit"].source == "pinned"
    assert plan["youtube"].source == "default"


def test_unreadable_planner_reply_falls_back_to_defaults():
    plan = parse_plan("not json", QUALITIES["standard"], {})
    assert len(plan) == len(STAGES) and {p.source for p in plan} == {"default"}


def test_planner_result_is_cached_until_brief_changes(project):
    backend = ScriptedBackend()
    studio = Studio(project, backend, QUALITIES["standard"], log=lambda _m: None)
    studio.plan()
    studio.plan()
    assert len(backend.calls) == 1
    brief = project.path / "brief.toml"
    brief.write_text(brief.read_text().replace("Synthwave", "Dream pop"))
    studio = Studio(Project(project.path), backend, QUALITIES["standard"], log=lambda _m: None)
    studio.plan()
    assert len(backend.calls) == 2


def test_failed_stage_blocks_only_its_dependents(project):
    backend = ScriptedBackend(fail={"Edit Plan": StudioError("boom")})
    _, outcome = run_all(project, backend)
    assert outcome["edit"] == "failed"
    assert outcome["social"] == "blocked"  # needs the edit plan
    assert outcome["prompts"] == "done" and outcome["youtube"] == "done"
    assert project.state["stages"]["edit"]["status"] == "failed"


def test_rerun_resumes_only_unfinished_stages(project):
    backend = ScriptedBackend(fail={"Edit Plan": StudioError("boom")})
    run_all(project, backend)
    retry = ScriptedBackend()
    _, outcome = run_all(project, retry)
    assert set(outcome) == {"edit", "social", "checklist"}
    assert set(outcome.values()) == {"done"}


def test_spend_keeps_counting_when_stages_are_redone(project):
    studio, _ = run_all(project, ScriptedBackend())
    first = studio.total_cost()
    assert first > 0
    assert studio.select(from_stage="social") == ["social"]  # nothing depends on the social copy
    studio.run(["social"], studio.plan())
    assert studio.total_cost() == pytest.approx(first + 0.02)


def test_fatal_error_stops_the_run(project):
    backend = ScriptedBackend(fail={"Song Map": FatalError("bad key")})
    with pytest.raises(FatalError):
        run_all(project, backend)
    assert not backend.authored("Director's Treatment")


def test_from_redoes_stage_and_everything_after(project):
    run_all(project, ScriptedBackend())
    studio = Studio(project, ScriptedBackend(), QUALITIES["masterpiece"], log=lambda _m: None)
    assert studio.select(from_stage="prompts") == ["prompts", "checklist"]
    assert downstream_of("storyboard") == ["storyboard", "prompts", "edit", "youtube", "social", "checklist"]


def test_only_requires_dependencies(project):
    studio = Studio(project, ScriptedBackend(), QUALITIES["masterpiece"], log=lambda _m: None)
    with pytest.raises(StudioError):
        studio.select(only="storyboard")


def test_documents_build_on_teammates_work(project):
    backend = ScriptedBackend()
    studio, _ = run_all(project, backend)
    prompt = backend.authored("Generation Prompts")[0]["prompt"]
    assert "Director's Treatment draft 1" in prompt and "Storyboard draft 1" in prompt
    bible = studio.compile_bible()
    assert "# 2. Director's Treatment" in bible and "| 3. Storyboard | Storyboard Artist | Sonnet 5.5 |" in bible


def test_brief_and_lyrics_reach_every_model(project):
    studio = Studio(project, ScriptedBackend(), QUALITIES["draft"], log=lambda _m: None)
    assert "Test Song" in studio.system and "Midnight rivers, never fade" in studio.system
    assert "the artist singing on a rooftop at night" in studio.system
