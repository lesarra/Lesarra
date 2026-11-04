# Music Video Studio

A team of Claude models that plans an original music video for your YouTube channel. Each
model does the job it is best at, and each task gets as much effort (thinking) as it
actually needs.

You describe the song and the video you want. The team produces a full production
package: concept, storyboard, prompts for your AI image and video tools, an edit plan, the
YouTube launch package, promo copy, and a checklist that walks you through making it.

> The studio writes the plan and the prompts. You still generate the images and clips in
> your own tools (Midjourney, Runway, Kling, and so on) and cut them together in your editor.

## The team

| Stage | Document | Role | Model | Why this model |
|---|---|---|---|---|
| 1 | Song Map | Lyric Analyst | Haiku 5.5 | Fast, precise structure work: sections, timing, hooks, imagery |
| 2 | Director's Treatment | Creative Director | **Opus 5.5** | Strongest creative reasoning: weighs many concepts, picks the one that serves the song |
| 3 | Storyboard | Storyboard Artist | Sonnet 5.5 | Detailed, consistent shot planning at speed |
| 4 | Generation Prompts | Visual Prompt Engineer | Sonnet 5.5 | Precise, tool-ready prompts plus a character and style consistency kit |
| 5 | Edit Plan | Editor | Sonnet 5.5 | Beat-synced cuts, colour grade, Shorts cut-downs, export settings |
| 6 | YouTube Launch Package | YouTube Strategist | Sonnet 5.5 | Titles, thumbnails, description with chapters, tags, launch timing |
| 7 | Social Promo Copy | Social Copywriter | Haiku 5.5 | Short, punchy copy, quickly and cheaply |
| 8 | Production Checklist | Producer | Haiku 5.5 | Step-by-step making-of order, generation budget, risks |
| - | (reviews drafts) | Showrunner | **Opus 5.5** | The most demanding judge: scores drafts and sends them back until they are great |
| - | (before the run) | Effort Planner | Haiku 5.5 | Reads the brief and decides how hard each teammate should think |

Stages start as soon as the documents they need are done, so independent work runs in
parallel. For example, the prompts, edit plan and YouTube package are written at the same
time once the storyboard exists:

```
Song Map ──► Treatment ──► Storyboard ──┬──► Generation Prompts ──┐
 (Haiku)      (Opus)        (Sonnet)    ├──► Edit Plan ───────────┼──► Production Checklist (Haiku)
                                        └──► YouTube Package ─────┘
                                              (all Sonnet, in parallel)

                          Edit Plan + YouTube Package ──► Social Promo Copy (Haiku)

Showrunner (Opus) scores every major draft and sends it back until it reaches the bar.
```

## How effort is decided

Effort is how much reasoning a model spends on a request. More effort means better work on
hard problems, but it costs more and takes longer. The studio sets it in three layers:

1. **Quality mode sets the range.** Each role has an effort range (for example, the
   director works between `high` and `max`). `masterpiece` never lets a role drop below
   its default; `draft` caps every role at its default.
2. **The Effort Planner picks a level for each task.** Before the run, Haiku reads your
   brief and chooses an effort for every stage based on how demanding this project makes
   it. A narrative with several characters pushes up the treatment, storyboard and prompts;
   a simple performance video brings them down. You see its choices and reasons in a table
   before anything else runs.
3. **Revisions escalate.** When the showrunner scores a draft below the bar, the author
   revises it **one effort level higher**, up to the role's maximum. If no revision reaches
   the bar, the best-scoring draft is kept, not the last one.

You can pin any stage in `brief.toml`, and a pin always wins over the planner:

```toml
[studio.effort]
treatment = "max"
```

## Quality modes

| Mode | Critique | Approval bar | Revisions | Efforts |
|---|---|---|---|---|
| `draft` | none | - | 0 | capped at each role's default |
| `standard` | treatment and storyboard | 8/10 | 1 | full range |
| `masterpiece` (default) | treatment, storyboard, prompts, edit plan, YouTube package | 9/10 | up to 3, each one effort level higher | never below each role's default |

## Setup

You need Python 3.11+ and an [Anthropic API key](https://console.anthropic.com/).

```bash
cd music-video-studio
```

```bash
python3 -m venv .venv && source .venv/bin/activate
```

```bash
pip install -e .
```

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

## Make a video plan

Create a project. This writes a `brief.toml` and a sample `lyrics.txt`:

```bash
mvstudio new my-song --title "Your Song" --artist "Lesarra" --lyrics path/to/lyrics.txt
```

Edit `my-song/brief.toml`: genre, BPM, mood, the story you want, the look, what must be in
it, what to avoid, which AI tools and editor you use, and your channel's audience. The more
specific you are, the better the result. Add `[Chorus 0:48]`-style markers to the lyrics if
you know the timings; otherwise the team estimates them from the BPM and duration.

Try it free first. A dry run makes no API calls and shows the whole flow:

```bash
mvstudio run my-song --dry-run
```

See the effort plan (one cheap Haiku call):

```bash
mvstudio plan my-song
```

Run the team for real:

```bash
mvstudio run my-song
```

Everything lands in `my-song/outputs/`: one Markdown file per document, plus
`production-bible.md` with all of them combined and a table of which model wrote what, at
which efforts, and with which score.

## Commands

| Command | What it does |
|---|---|
| `mvstudio team` | Show the team, models, effort ranges and quality modes |
| `mvstudio new <folder>` | Create a project with a brief to fill in |
| `mvstudio plan <folder>` | Show the effort plan for this project |
| `mvstudio run <folder>` | Run the team; resumes where it left off if interrupted |
| `mvstudio run <folder> --from storyboard` | Redo a stage and everything that depends on it |
| `mvstudio run <folder> --only treatment` | Redo just one stage |
| `mvstudio run <folder> --quality draft` | Override the brief's quality mode |
| `mvstudio run <folder> --replan` | Ask the effort planner again |
| `mvstudio run <folder> --fixed-effort` | Skip the planner and use each role's default effort |
| `mvstudio status <folder>` | Progress, effort per round, scores and estimated cost |

Progress is saved after every model call, so if a run stops (Ctrl-C, network error), run
the same command again to continue. The effort plan is reused until you change the brief.

## Cost

Every call's token usage is recorded and priced, and `mvstudio status` shows the running
total. Rough expectations (not measured yet; they depend on song length and how many
revisions the showrunner asks for):

- `draft`: usually well under $1.
- `standard`: a dollar or two.
- `masterpiece`: typically a few dollars. The worst case, where every critiqued stage uses
  all three revisions, can reach roughly $10-20.

## Under the hood

- Every request streams, uses adaptive thinking, and sets effort through
  `output_config.effort`.
- The shared system prompt (studio rules, your brief and lyrics) is identical for every
  stage and is prompt-cached, so later calls to the same model re-read it cheaply.
- Opus and Sonnet requests use server-side refusal fallbacks (`fallbacks: "default"`). If a
  safety classifier declines a request, the API reruns it on a suitable model instead of
  failing the stage. Turn this off with `--no-fallbacks`.
- The planner and showrunner reply in validated JSON (structured outputs), so scores and
  effort choices are always machine-readable.
- One failed stage blocks only the stages that depend on it; independent ones finish.

## Customising

All roles, models, effort ranges and stage instructions live in
[`mvstudio/team.py`](mvstudio/team.py). Change a role's model, rewrite a stage's task,
adjust what the showrunner judges, or add a stage. Quality modes are in
[`mvstudio/effort.py`](mvstudio/effort.py).

## Tests

```bash
pip install -e '.[test]'
```

```bash
pytest
```

The tests cover the critique loop, effort escalation and clamping, the planner, resuming,
failure handling, and the exact API request shape (against a local fake API server, so no
key or network is needed).
