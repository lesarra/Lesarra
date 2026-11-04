"""Command line: mvstudio new | team | plan | run | status"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

from .backend import ClaudeBackend, DryRunBackend, StudioError
from .effort import QUALITIES, StageEffort
from .pipeline import Studio
from .project import Project, ProjectError, create_project
from .team import ROLES, STAGE_BY_KEY, STAGES, downstream_of, model_name, stage_role

STAGE_KEYS = [s.key for s in STAGES]


def _table(headers: list[str], rows: list[list[str]]) -> str:
    widths = [max(len(str(x)) for x in col) for col in zip(headers, *rows, strict=True)]

    def line(cells):
        return "  ".join(str(c).ljust(w) for c, w in zip(cells, widths, strict=True)).rstrip()

    return "\n".join([line(headers), line(["-" * w for w in widths]), *(line(r) for r in rows)])


def _quality(args, project: Project):
    name = args.quality or project.quality
    if name not in QUALITIES:
        raise ProjectError(f"Unknown quality {name!r}; use one of {', '.join(QUALITIES)}.")
    return QUALITIES[name]


def _studio(args, project: Project) -> Studio:
    backend = DryRunBackend() if args.dry_run else ClaudeBackend(use_fallbacks=not args.no_fallbacks)
    return Studio(project, backend, _quality(args, project), parallel=getattr(args, "parallel", 3))


def _print_plan(plan: list[StageEffort], studio: Studio) -> None:
    rows = []
    for p in plan:
        stage = STAGE_BY_KEY[p.stage]
        role = stage_role(stage)
        reviewed = "yes" if stage.key in studio.quality.critique_stages and stage.criteria else "-"
        rows.append([stage.key, role.title, model_name(role.model), p.effort, reviewed, p.reason])
    print(_table(["stage", "role", "model", "effort", "critiqued", "why"], rows))
    q = studio.quality
    if q.critique_stages:
        print(f"\nShowrunner: {model_name(ROLES['showrunner'].model)} at effort {q.critic_effort}; "
              f"approves at {q.threshold}/10; up to {q.max_revisions} revision(s), each one effort level higher.")


def cmd_new(args) -> None:
    path = create_project(Path(args.path), args.title, args.artist, Path(args.lyrics) if args.lyrics else None)
    print(f"Created {path}/brief.toml and {path}/lyrics.txt.")
    print("Edit them to describe your song and video, then run:")
    print(f"  mvstudio plan {path}      # see who does what, at which effort")
    print(f"  mvstudio run {path}       # make the video plan")


def cmd_team(args) -> None:
    rows = []
    for stage in STAGES:
        role = stage_role(stage)
        rows.append([stage.key, stage.title, role.title, model_name(role.model),
                     f"{role.min_effort}..{role.max_effort}", role.why])
    for key in ("showrunner", "planner"):
        role = ROLES[key]
        rows.append(["-", "(reviews drafts)" if key == "showrunner" else "(before the run)", role.title,
                     model_name(role.model), f"{role.min_effort}..{role.max_effort}", role.why])
    print(_table(["stage", "document", "role", "model", "effort range", "why this model"], rows))
    print("\nQuality modes:")
    for q in QUALITIES.values():
        print(f"  {q.name:<12} {q.description}")


def cmd_plan(args) -> None:
    project = Project(Path(args.path))
    studio = _studio(args, project)
    print(f"{project.title}: {studio.quality.name} mode\n")
    plan = studio.plan(replan=args.replan)
    print()
    _print_plan(plan, studio)


def cmd_run(args) -> None:
    project = Project(Path(args.path))
    studio = _studio(args, project)
    targets = studio.select(only=args.only, from_stage=args.from_stage)
    if not targets:
        print(f"Everything is already done for {project.title}. "
              f"Use --from <stage> to redo a stage and everything after it, or --only <stage>.")
        return

    mode = " (dry run: no API calls)" if args.dry_run else ""
    print(f"{project.title}: {studio.quality.name} mode{mode}\n")
    plan = studio.plan(replan=args.replan, use_planner=not args.fixed_effort)
    print()
    _print_plan([p for p in plan if p.stage in targets], studio)
    print(f"\nRunning {len(targets)} stage(s), up to {studio.parallel} at a time:\n")

    outcome = studio.run(targets, plan)
    bible = project.path / "outputs" / "production-bible.md"
    studio.compile_bible()

    failed = [k for k, v in outcome.items() if v != "done"]
    print(f"\nEstimated API cost for this project so far: ${studio.total_cost():.2f}")
    print(f"Documents: {project.path / 'outputs'}/")
    print(f"Everything in one file: {bible}")
    if args.only:
        later = [k for k in downstream_of(args.only)[1:] if project.is_done(k)]
        if later:
            print(f"Note: {', '.join(later)} were made from the previous {args.only}. "
                  f"To refresh them too: mvstudio run {args.path} --from {args.only}")
    if failed:
        print(f"Not finished: {', '.join(failed)}. Run the same command again to retry them.")
        sys.exit(1)


def cmd_status(args) -> None:
    project = Project(Path(args.path))
    stages = project.state.get("stages", {})
    rows = []
    for stage in STAGES:
        entry = stages.get(stage.key, {})
        attempts = entry.get("attempts", [])
        efforts = " → ".join(a["effort"] for a in attempts if a.get("kind") == "author") or "-"
        score = entry.get("score")
        cost = sum(a.get("cost", 0) for a in attempts)
        rows.append([stage.key, model_name(stage_role(stage).model), entry.get("status", "pending"),
                     efforts, f"{score}/10" if score else "-", f"${cost:.2f}"])
    print(f"{project.title}\n")
    print(_table(["stage", "model", "status", "effort per round", "score", "cost"], rows))
    print(f"\nEstimated total spent on this project (including redone stages): ${project.spent:.2f}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        prog="mvstudio",
        description="A team of Claude models that plans your music video, each on the job it does best.",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    p = sub.add_parser("new", help="create a project folder with a brief to fill in")
    p.add_argument("path")
    p.add_argument("--title", help="song title")
    p.add_argument("--artist", help="artist name")
    p.add_argument("--lyrics", help="lyrics file to copy into the project")
    p.set_defaults(func=cmd_new)

    p = sub.add_parser("team", help="show who does what")
    p.set_defaults(func=cmd_team)

    def common(p):
        p.add_argument("path", help="project folder (contains brief.toml)")
        p.add_argument("--quality", choices=list(QUALITIES), help="overrides [studio] quality in brief.toml")
        p.add_argument("--dry-run", action="store_true", help="placeholder output; no API calls, no cost")
        p.add_argument("--replan", action="store_true", help="ask the effort planner again")
        p.add_argument("--no-fallbacks", action="store_true", help="don't use server-side refusal fallbacks")

    p = sub.add_parser("plan", help="show the effort plan: which model works on what, how hard")
    common(p)
    p.set_defaults(func=cmd_plan)

    p = sub.add_parser("run", help="run the team (resumes where it left off)")
    common(p)
    which = p.add_mutually_exclusive_group()
    which.add_argument("--only", choices=STAGE_KEYS, help="redo just this stage")
    which.add_argument("--from", dest="from_stage", choices=STAGE_KEYS, help="redo this stage and everything after it")
    p.add_argument("--parallel", type=int, default=3, help="stages to run at once (default 3)")
    p.add_argument("--fixed-effort", action="store_true", help="skip the planner; use each role's default effort")
    p.set_defaults(func=cmd_run)

    p = sub.add_parser("status", help="show progress, efforts, scores and cost")
    p.add_argument("path")
    p.set_defaults(func=cmd_status)
    return parser


def main(argv: list[str] | None = None) -> None:
    args = build_parser().parse_args(argv)
    try:
        args.func(args)
    except (ProjectError, StudioError) as e:
        print(f"mvstudio: {e}", file=sys.stderr)
        sys.exit(1)
    except KeyboardInterrupt:
        # Progress is saved after every model call; the next run resumes from there.
        print("\nStopped. Run the same command again to pick up where it left off.", file=sys.stderr)
        sys.stdout.flush()
        os._exit(130)


if __name__ == "__main__":
    main()
