"""The studio: runs the team over a project, in parallel where the work allows.

Flow for each stage:
  author writes (at the planned effort)
  -> showrunner scores it against the stage's criteria (quality modes that critique)
  -> below the bar: the author revises the best draft so far, one effort level higher
  -> repeat until approved or out of revision rounds; the best-scoring draft is kept.

Stages run as soon as the documents they depend on are done, so independent work
(for example the generation prompts, the edit plan and the YouTube package) happens
at the same time on different models.
"""

from __future__ import annotations

import json
import threading
import time
from concurrent.futures import FIRST_COMPLETED, Future, ThreadPoolExecutor, wait
from dataclasses import asdict, dataclass

from .backend import FatalError, Reply, StudioError
from .effort import PLAN_SCHEMA, Quality, StageEffort, clamp, default_plan, escalate, parse_plan, planner_prompt
from .project import Project, now
from .team import ROLES, STAGE_BY_KEY, STAGES, SYSTEM_PROMPT, Stage, downstream_of, model_name, stage_role

REVIEW_SCHEMA = {
    "type": "object",
    "properties": {
        "score": {"type": "integer"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "issues": {"type": "array", "items": {"type": "string"}},
        "revision_notes": {"type": "string"},
    },
    "required": ["score", "strengths", "issues", "revision_notes"],
    "additionalProperties": False,
}


@dataclass
class Review:
    score: int | None
    strengths: list[str]
    issues: list[str]
    revision_notes: str

    @classmethod
    def parse(cls, text: str) -> "Review":
        try:
            data = json.loads(text)
            score = max(1, min(10, int(data["score"])))
            return cls(score, list(data.get("strengths", [])), list(data.get("issues", [])),
                       str(data.get("revision_notes", "")))
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            return cls(None, [], [], "")


def _bullets(items: list[str]) -> str:
    return "\n".join(f"- {item}" for item in items) if items else "- (none)"


def _duration(seconds: float) -> str:
    seconds = int(round(seconds))
    return f"{seconds // 60}m{seconds % 60:02d}s" if seconds >= 60 else f"{seconds}s"


class Studio:
    def __init__(self, project: Project, backend, quality: Quality, parallel: int = 3, log=print):
        self.project = project
        self.backend = backend
        self.quality = quality
        self.parallel = max(1, parallel)
        self._log = log
        self._log_lock = threading.Lock()
        self._fatal: FatalError | None = None
        self.system = f"{SYSTEM_PROMPT}\n\n{project.brief_markdown()}"

    def log(self, message: str) -> None:
        with self._log_lock:
            self._log(message)

    # ------------------------------------------------------------------ effort plan

    def plan(self, replan: bool = False, use_planner: bool = True) -> list[StageEffort]:
        """Decide each stage's starting effort. Cached in state.json until the brief changes."""
        pins = self.project.effort_pins
        fingerprint = {"quality": self.quality.name, "pins": pins, "brief": self.system}
        cached = self.project.state.get("plan")
        if cached and not replan and cached.get("fingerprint") == fingerprint:
            return [StageEffort(**s) for s in cached["stages"]]

        if not use_planner:
            return default_plan(self.quality, pins)

        planner = ROLES["planner"]
        self.log(f"  ▶ {planner.title} · {model_name(planner.model)} · effort {planner.default_effort} "
                 f"→ reading the brief to set each task's effort")
        try:
            reply = self.backend.complete(
                model=planner.model, effort=planner.default_effort, system=self.system,
                prompt=planner_prompt(self.quality), schema=PLAN_SCHEMA,
            )
        except FatalError:
            raise
        except StudioError as e:
            self.log(f"  ! Effort planner failed ({e}); using each role's default effort this time.")
            return default_plan(self.quality, pins)
        plan = parse_plan(reply.text, self.quality, pins)
        self.project.state["plan"] = {
            "fingerprint": fingerprint,
            "created": now(),
            "stages": [asdict(s) for s in plan],
        }
        self.project.add_spend(reply.cost)
        return plan

    # ------------------------------------------------------------------ prompts

    def _context(self, stage: Stage) -> str:
        docs = []
        for dep_key in stage.depends_on:
            dep = STAGE_BY_KEY[dep_key]
            text = self.project.read_doc(dep.filename)
            docs.append(
                f'<document title="{dep.title}" author="{stage_role(dep).title}">\n{text.strip()}\n</document>'
            )
        if not docs:
            return "You are the first on the team to work on this project: work from the brief."
        return "Your teammates' documents that this task builds on:\n\n" + "\n\n".join(docs)

    def _author_prompt(self, stage: Stage, context: str) -> str:
        role = stage_role(stage)
        return f"""\
You are the {role.title} on this team.

{context}

# Your task: {stage.title}

{stage.task}"""

    def _revision_prompt(self, stage: Stage, context: str, draft: str, review: Review) -> str:
        role = stage_role(stage)
        return f"""\
You are the {role.title} on this team.

{context}

<previous_draft>
{draft.strip()}
</previous_draft>

The showrunner reviewed this draft of the {stage.title} and scored it {review.score}/10. \
The bar for this project is {self.quality.threshold}/10.

Strengths to keep:
{_bullets(review.strengths)}

Issues to fix:
{_bullets(review.issues)}

Revision notes:
{review.revision_notes or "(none)"}

Write the complete revised {stage.title}: the whole document, not a list of changes. Keep what \
works and fix everything the notes raise. The original task is below for reference.

# Your task: {stage.title}

{stage.task}"""

    def _review_prompt(self, stage: Stage, context: str, draft: str) -> str:
        role = stage_role(stage)
        return f"""\
You are the showrunner. You review each teammate's work before it goes into production, and \
you hold it to the standard of a masterpiece: work a top music-video director would be proud \
to put their name on.

{context}

<draft title="{stage.title}" author="{role.title}">
{draft.strip()}
</draft>

Review this {stage.title} against these criteria: {stage.criteria}

Score it from 1 to 10. 10 is exceptional and ready for production; 8 is strong with minor \
issues; 6 is competent but unremarkable; 4 or below has real problems. Be specific and \
demanding: name the exact shots, lines or sections that fall short and say concretely how to \
fix each. Don't ask for anything that contradicts the brief or the documents this one builds \
on, and don't ask for extra length for its own sake.

Return JSON with: score (integer 1-10), strengths, issues (most important first), and \
revision_notes (the concrete changes to make)."""

    # ------------------------------------------------------------------ one stage

    def _call(self, stage: Stage, kind: str, round_no: int, model: str, effort: str,
              prompt: str, schema: dict | None = None) -> Reply:
        reply = self.backend.complete(model=model, effort=effort, system=self.system, prompt=prompt, schema=schema)
        self.project.record_attempt(stage.key, {
            "kind": kind,
            "round": round_no,
            "model": reply.model,
            "effort": effort,
            "stop_reason": reply.stop_reason,
            "usage": reply.usage.to_dict(),
            "cost": round(reply.cost, 5),
            "seconds": round(reply.seconds, 1),
            "at": now(),
        })
        return reply

    def run_stage(self, stage: Stage, start_effort: str) -> None:
        role = stage_role(stage)
        critic = ROLES["showrunner"]
        _, ceiling = self.quality.effort_range(role)
        critiqued = stage.key in self.quality.critique_stages and stage.criteria is not None
        critic_effort = clamp(self.quality.critic_effort, critic.min_effort, critic.max_effort)
        context = self._context(stage)
        started = time.monotonic()

        self.project.reset_stage(stage.key)
        self.project.update_stage(stage.key, status="running", started=now())

        effort = start_effort
        best_text, best_review = None, None
        rounds = 0
        for round_no in range(self.quality.max_revisions + 1):
            rounds = round_no + 1
            if round_no == 0:
                verb, prompt = "writing", self._author_prompt(stage, context)
            else:
                verb, prompt = "revising", self._revision_prompt(stage, context, best_text, best_review)
            self.log(f"  ▶ {role.title} · {model_name(role.model)} · effort {effort} → {verb} {stage.title}")
            reply = self._call(stage, "author", round_no, role.model, effort, prompt)
            if reply.model != role.model:
                self.log(f"  i {stage.title}: served by fallback model {reply.model}")
            if reply.truncated:
                self.log(f"  ! {stage.title} hit the output limit and may be cut short.")
            draft = reply.text

            if not critiqued:
                best_text = draft
                break

            review_reply = self._call(
                stage, "review", round_no, critic.model, critic_effort,
                self._review_prompt(stage, context, draft), schema=REVIEW_SCHEMA,
            )
            review = Review.parse(review_reply.text)
            if review.score is None:
                if best_text is None:
                    best_text = draft
                    self.log(f"  ! Showrunner's review of {stage.title} was unreadable; keeping this draft.")
                else:
                    self.log(f"  ! Showrunner's review of {stage.title} was unreadable; keeping the best reviewed draft.")
                break

            if best_review is None or review.score >= best_review.score:
                best_text, best_review = draft, review
            # Save progress after every round so an interrupted run loses nothing.
            self.project.write_doc(stage.filename, best_text)

            if review.score >= self.quality.threshold:
                self.log(f"  ★ Showrunner · {model_name(critic.model)} · effort {critic_effort}: "
                         f"{stage.title} {review.score}/10, approved")
                break
            if round_no == self.quality.max_revisions:
                self.log(f"  ★ Showrunner: {stage.title} {review.score}/10; out of revision rounds, "
                         f"keeping the best draft ({best_review.score}/10)")
                break
            next_effort = escalate(effort, 1, ceiling)
            self.log(f"  ★ Showrunner · {model_name(critic.model)} · effort {critic_effort}: "
                     f"{stage.title} {review.score}/10 (bar {self.quality.threshold}), sending back"
                     + (f"; effort {effort} → {next_effort}" if next_effort != effort else ""))
            effort = next_effort

        self.project.write_doc(stage.filename, best_text)
        attempts = self.project.stage_state(stage.key).get("attempts", [])
        cost = sum(a.get("cost", 0) for a in attempts)
        self.project.update_stage(
            stage.key,
            status="done",
            finished=now(),
            rounds=rounds,
            score=best_review.score if best_review else None,
            final_effort=effort,
            file=f"outputs/{stage.filename}",
        )
        score = f" · {best_review.score}/10" if best_review else ""
        self.log(f"  ✓ {stage.title}{score} · {rounds} round{'s' if rounds > 1 else ''} · "
                 f"{_duration(time.monotonic() - started)} · ${cost:.2f}")

    # ------------------------------------------------------------------ the run

    def select(self, only: str | None = None, from_stage: str | None = None) -> list[str]:
        if only:
            missing = [d for d in STAGE_BY_KEY[only].depends_on if not self.project.is_done(d)]
            if missing:
                raise StudioError(f"{only} needs {', '.join(missing)} first. Run without --only, or with --from {missing[0]}.")
            return [only]
        if from_stage:
            return downstream_of(from_stage)
        return [s.key for s in STAGES if not self.project.is_done(s.key)]

    def run(self, targets: list[str], plan: list[StageEffort]) -> dict[str, str]:
        efforts = {p.stage: p.effort for p in plan}
        todo = [k for k in (s.key for s in STAGES) if k in targets]
        for key in todo:
            self.project.reset_stage(key)
        outcome: dict[str, str] = {}
        running: dict[Future, str] = {}

        def ready(key: str) -> bool:
            return all(self.project.is_done(d) for d in STAGE_BY_KEY[key].depends_on)

        def blocked(key: str) -> bool:
            return any(outcome.get(d) in {"failed", "blocked"} for d in STAGE_BY_KEY[key].depends_on)

        with ThreadPoolExecutor(max_workers=self.parallel) as pool:
            while todo or running:
                for key in list(todo):
                    if self._fatal:
                        break
                    if blocked(key):
                        outcome[key] = "blocked"
                        self.project.update_stage(key, status="blocked")
                        todo.remove(key)
                    elif ready(key) and len(running) < self.parallel:
                        running[pool.submit(self.run_stage, STAGE_BY_KEY[key], efforts[key])] = key
                        todo.remove(key)
                if self._fatal and not running:
                    break
                if not running:
                    if todo:  # nothing runnable and nothing in flight: dependencies can't be met
                        for key in todo:
                            outcome[key] = "blocked"
                        break
                    continue
                done, _ = wait(running, return_when=FIRST_COMPLETED)
                for future in done:
                    key = running.pop(future)
                    error = future.exception()
                    if error is None:
                        outcome[key] = "done"
                        continue
                    outcome[key] = "failed"
                    self.project.update_stage(key, status="failed", error=str(error))
                    self.log(f"  ✗ {STAGE_BY_KEY[key].title} failed: {error}")
                    if isinstance(error, FatalError):
                        self._fatal = error
                    elif not isinstance(error, StudioError):
                        raise error
        if self._fatal:
            raise self._fatal
        return outcome

    # ------------------------------------------------------------------ reporting

    def total_cost(self) -> float:
        return self.project.spent

    def compile_bible(self) -> str:
        """Bundle every finished document into one production bible."""
        state = self.project.state["stages"]
        rows, toc, body = [], [], []
        for n, stage in enumerate(STAGES, 1):
            entry = state.get(stage.key, {})
            if entry.get("status") != "done":
                continue
            role = stage_role(stage)
            efforts = [a["effort"] for a in entry.get("attempts", []) if a.get("kind") == "author"]
            score = entry.get("score")
            rows.append(f"| {n}. {stage.title} | {role.title} | {model_name(role.model)} | "
                        f"{' → '.join(efforts) or '-'} | {entry.get('rounds', 1)} | "
                        f"{f'{score}/10' if score else '-'} |")
            anchor = f"{n}-{stage.title}".lower().replace(" ", "-").replace("'", "")
            toc.append(f"{n}. [{stage.title}](#{anchor})")
            body.append(f"# {n}. {stage.title}\n\n{self.project.read_doc(stage.filename).strip()}")
        bible = "\n\n".join([
            f"# {self.project.title}: Production Bible",
            f"Made by the music video studio in **{self.quality.name}** mode on {now()[:10]}. "
            f"Estimated API cost so far: ${self.total_cost():.2f}.",
            "## The team\n\n| Document | Written by | Model | Effort per round | Rounds | Showrunner score |\n"
            "|---|---|---|---|---|---|\n" + "\n".join(rows),
            "## Contents\n\n" + "\n".join(toc),
            *body,
        ])
        self.project.write_doc("production-bible.md", bible)
        return bible
