"""The production team: which Claude model does which job, and what each job is.

Each role is matched to the model that does that kind of work best:

* Opus 5.5   - deep creative reasoning and judgment: the director's vision and
               the showrunner's critique.
* Sonnet 5.5 - fast, detailed production writing: storyboard, generation
               prompts, edit plan, YouTube package.
* Haiku 5.5  - quick structured work: song mapping, effort planning, social
               copy, the production checklist.

Edit this file to change who does what, or the instructions each stage gets.
"""

from __future__ import annotations

from dataclasses import dataclass

OPUS = "claude-opus-5-5"
SONNET = "claude-sonnet-5-5"
HAIKU = "claude-haiku-5-5"

MODEL_NAMES = {OPUS: "Opus 5.5", SONNET: "Sonnet 5.5", HAIKU: "Haiku 5.5"}


def model_name(model_id: str) -> str:
    return MODEL_NAMES.get(model_id, model_id)


@dataclass(frozen=True)
class Role:
    key: str
    title: str
    model: str
    why: str
    min_effort: str
    default_effort: str
    max_effort: str


@dataclass(frozen=True)
class Stage:
    key: str
    title: str
    role: str
    filename: str
    depends_on: tuple[str, ...]
    summary: str  # one line, shown to the effort planner and in `mvstudio team`
    task: str  # full instructions for the author
    criteria: str | None  # what the showrunner judges; None = never critiqued


ROLES: dict[str, Role] = {
    r.key: r
    for r in [
        Role(
            "analyst", "Lyric Analyst", HAIKU,
            "Fast, precise structure work: maps sections, timing, hooks and imagery.",
            "low", "low", "high",
        ),
        Role(
            "director", "Creative Director", OPUS,
            "The strongest creative reasoning: weighs many concepts and picks the one that serves the song.",
            "high", "high", "max",
        ),
        Role(
            "storyboard", "Storyboard Artist", SONNET,
            "Detailed, consistent shot planning at speed.",
            "medium", "high", "xhigh",
        ),
        Role(
            "prompter", "Visual Prompt Engineer", SONNET,
            "Writes precise, tool-ready prompts for every shot.",
            "medium", "medium", "xhigh",
        ),
        Role(
            "editor", "Editor", SONNET,
            "Practical post-production planning: rhythm, grade, cut-downs, export.",
            "low", "medium", "high",
        ),
        Role(
            "strategist", "YouTube Strategist", SONNET,
            "Packaging that earns clicks honestly: titles, thumbnails, description, launch.",
            "low", "medium", "high",
        ),
        Role(
            "social", "Social Copywriter", HAIKU,
            "Short, punchy promo copy, quickly and cheaply.",
            "low", "low", "medium",
        ),
        Role(
            "producer", "Producer", HAIKU,
            "Turns the whole plan into an ordered checklist and budget.",
            "low", "low", "medium",
        ),
        Role(
            "showrunner", "Showrunner (critic)", OPUS,
            "The most demanding judge: scores each deliverable and sends it back until it is great.",
            "medium", "high", "xhigh",
        ),
        Role(
            "planner", "Effort Planner", HAIKU,
            "Cheap, quick read of the brief to decide how hard each teammate should think.",
            "low", "low", "low",
        ),
    ]
}


SYSTEM_PROMPT = """\
You are part of a small AI production team making an original music video for a YouTube \
channel. Each teammate is a Claude model assigned the work it does best, and the documents \
your teammates have already written are included when your task builds on them. The human \
creator will take the team's documents into AI image and video tools and an editing app to \
produce the video, so everything you write must be specific enough to act on directly.

Ground every decision in the song itself (its lyrics, structure, tempo and emotion) and in \
the creator's brief. Make original creative choices and describe looks and moods in your own \
words rather than copying existing music videos, films or other artists' signature styles. \
Treat the brief's "avoid" list as absolute.

Write in Markdown. Start directly with the deliverable: no preamble, no sign-off."""


STAGES: list[Stage] = [
    Stage(
        key="lyrics",
        title="Song Map",
        role="analyst",
        filename="01-song-map.md",
        depends_on=(),
        summary="Map song sections, timing, hooks, imagery and energy so visuals can sync to the music.",
        task="""\
Map the song's structure so the rest of the team can sync visuals to it.

## Song map
A table: Section | Opening words | Start-End | Bars (approx.) | Energy 1-10 | Notes.
Use timestamps from the lyrics file if it has them (for example `[Chorus 0:45]`). Otherwise \
estimate them from the BPM and duration in the brief and mark each estimate `~est`.

## Hooks and repeats
The lines that repeat or are most quotable, and where each occurs.

## Imagery bank
Concrete nouns, places, colours, actions and metaphors from the lyrics, grouped by section.

## Emotional arc
One line per section: the feeling, and how it shifts from the section before.

## Beat notes
Where builds, drops, breaks and silences most likely land, for cut timing.

If there are no lyrics (an instrumental), map the structure from the brief and mark it as inferred.""",
        criteria=None,
    ),
    Stage(
        key="treatment",
        title="Director's Treatment",
        role="director",
        filename="02-treatment.md",
        depends_on=("lyrics",),
        summary="The core creative vision: concept, story arc, look, characters, motifs, hook. Everything else follows it.",
        task="""\
Write the director's treatment: the single creative vision the whole video will follow.

Consider several genuinely different concepts before you choose; the literal reading of the \
lyrics is rarely the strongest. Choose the one that best serves the song's emotion and the \
creator's brief, and that the chosen AI video tools can render well: consistent characters \
and locations, motion that holds up, and shots achievable on the stated budget.

## Logline
One sentence.

## The idea
What the video is really about beneath the surface, and why it fits this song.

## Story arc
Beat by beat across the song map's sections: how the visuals build to the emotional peak and \
how the ending lands.

## Visual world
Locations, era, time of day, weather, production design.

## Look
Colour palette (named colours with hex codes), lighting, lens and camera feel, texture \
(grain, halation and so on), and how the frame works in each aspect ratio in the brief.

## Characters
Each character with a fixed visual description (age range, build, hair, wardrobe, \
distinguishing details) written so it can be pasted unchanged into every generation prompt \
for consistency. Include the artist if they appear on camera.

## Motifs
Two to four recurring visual motifs and where each recurs.

## The hook
What happens in the first five seconds to stop a viewer scrolling, and the single most \
thumbnail-worthy moment.

## Feasibility
The risks for AI generation in this concept (hands, on-screen text, crowds, fast motion, \
lip-sync, character drift) and how the concept avoids or handles each.

## Alternate concepts
The two strongest runners-up, two lines each.""",
        criteria="""\
originality (not the most literal reading of the lyrics); emotional fidelity to the lyrics \
and the music; a clear arc that peaks with the song and lands the ending; a scroll-stopping \
first five seconds; a cohesive, specific look; character descriptions precise enough to \
reuse verbatim; feasibility with the named AI tools and the budget; respect for the brief's \
must-include and avoid lists.""",
    ),
    Stage(
        key="storyboard",
        title="Storyboard",
        role="storyboard",
        filename="03-storyboard.md",
        depends_on=("lyrics", "treatment"),
        summary="Shot-by-shot plan for the whole song, timed to sections and beats, with hero shots marked.",
        task="""\
Turn the treatment into a shot-by-shot storyboard synced to the song map.

For each section of the song, a heading with its time range, then a table:
Shot | Time | Dur | Size and angle | Camera move | Action / subject | Location | Light and colour | Transition out | Beat sync

- Cover the whole song with no gaps; shot durations must add up to each section's length.
- Pace the cutting to the BPM and energy: longer, calmer shots in quiet sections, faster \
cutting into choruses and drops, and room to breathe on key lyric moments.
- Keep characters, wardrobe and locations consistent with the treatment, and note continuity \
explicitly when a shot depends on an earlier one.
- Most AI video clips run 5-10 seconds: split longer moments into several shots.
- Respect the budget: a low budget means fewer unique setups and more reuse of locations \
and characters.
- Mark the three to five hero shots with ★; they get the most generation effort.
- Number shots S01, S02, ... Later documents refer to these IDs.

End with **## Shot count**: total shots, hero shots, and shots per location.""",
        criteria="""\
full coverage of the song with no gaps and durations that add up; cutting rhythm that \
follows the BPM and energy; faithfulness to the treatment's arc, look and motifs; continuity \
of characters and locations; clip lengths that AI video tools can generate; hero shots that \
deliver the emotional peaks; a strong opening five seconds.""",
    ),
    Stage(
        key="prompts",
        title="Generation Prompts",
        role="prompter",
        filename="04-generation-prompts.md",
        depends_on=("treatment", "storyboard"),
        summary="Image and video prompts for every shot, plus a consistency kit, tuned to the brief's AI tools.",
        task="""\
Write generation prompts for every storyboard shot, tailored to the image and video tools \
named in the brief.

## Consistency kit
- Character sheets: the exact reusable description of each character (from the treatment) \
and a prompt to generate a reference image of each.
- Location plates: a prompt for an establishing reference image of each location.
- Style suffix: one style string (look, palette, lens, texture) appended to every prompt.
- Tool settings: aspect ratio, quality and style options, and character or image-reference \
features for the named tools. Only include settings you are confident those tools support; \
otherwise describe the intent.

## Shots
For each shot, in storyboard order:

### S01 - short name (★ if hero)
- **Image prompt (start frame):** ...
- **Motion prompt (video):** the camera move and subject motion across the clip; one idea per clip.
- **Avoid:** negative prompt or things to steer away from.
- **Attach:** which character sheet, location plate or previous frame to use as reference.
- **Duration and aspect:** ...
- **Notes:** tips such as how many variants to generate, or using the last frame of S06 as the start frame.

Give hero shots two alternative image prompts. Write in the vocabulary these tools respond to \
best: concrete subject, action, setting, lighting, lens and mood, with no story exposition the \
model can't see. Never put readable text or logos in frame unless the brief asks for it.""",
        criteria="""\
every storyboard shot has prompts; prompts are concrete and suited to the named tools; \
characters and style stay consistent through the kit; motion prompts are achievable single \
ideas; the avoid lists cover likely artifacts; no text or logos in frame unless requested; \
hero shots have strong alternatives.""",
    ),
    Stage(
        key="edit",
        title="Edit Plan",
        role="editor",
        filename="05-edit-plan.md",
        depends_on=("lyrics", "treatment", "storyboard"),
        summary="Timeline, beat-synced cuts, colour grade, Shorts cut-downs, export settings, artifact fixes.",
        task="""\
Write the edit plan for assembling the generated clips in the editing app named in the brief.

## Timeline
A table: Time | Shot | Cut type | Transition | Speed | Effect or note. Cuts land on beats from \
the song map.

## Rhythm and pacing
How the cutting rate tracks the song's energy, section by section.

## Colour grade
Step by step: matching exposure and white balance across AI clips, building the treatment's \
look, adding texture, and an optional LUT described by its intent.

## Performance and lip-sync
If the artist is on camera: how to get convincing sync, and where performance shots sit. \
Otherwise say so in one line.

## Titles and graphics
Artist and title card, optional lyric captions (style, placement, timing), and space for \
YouTube end-screen elements in the last 20 seconds.

## Shorts cut-downs
Two or three vertical 9:16 edits of 15-45 seconds: the section, the shots, reframing notes, \
and the hook in the first second.

## Export
Upload settings for the main video and for Shorts: resolution, frame rate, codec, bitrate, audio.

## Fix-it list
Likely AI artifacts (flicker, morphing, warped hands or faces, drifting characters) and how \
to hide or repair each in the edit.""",
        criteria="""\
cuts land on beats and pacing follows the energy; the grade will unify inconsistent AI \
clips into the treatment's look; Shorts cut-downs have strong first-second hooks; export \
settings are correct for YouTube; artifact fixes are practical in the named editing app.""",
    ),
    Stage(
        key="youtube",
        title="YouTube Launch Package",
        role="strategist",
        filename="06-youtube-package.md",
        depends_on=("lyrics", "treatment", "storyboard"),
        summary="Titles, thumbnail concepts, description with chapters, tags, pinned comment, launch timing.",
        task="""\
Create the YouTube launch package for this music video.

## Titles
Five options; mark your top pick and say why. Follow the channel's format if the brief gives \
one (for example: Artist - Song (Official Music Video)) and add curiosity-driven variants.

## Thumbnails
Three concepts. For each: composition, the shot it is based on (shot ID), expression, colour \
contrast, any text (three words at most), and an image-generation prompt.

## Description
Ready to paste: a hook line, the story or meaning in two or three lines, credits with \
placeholders such as [Director: ...], chapters with timestamps from the song map, link \
placeholders, and three hashtags.

## Tags
15-25 relevant tags, comma-separated.

## Pinned comment
One that invites viewers to engage.

## Launch plan
The best day and time to publish for the brief's audience (with your reasoning), premiere \
or direct upload, and what to do in the first 48 hours.

Avoid clickbait the video doesn't deliver on: YouTube rewards satisfied viewers.""",
        criteria="""\
titles are compelling and honest; thumbnail concepts have a clear focal point and strong \
contrast at small sizes; the description is complete, with correct chapters; tags are \
relevant; the launch plan is concrete and suited to the audience.""",
    ),
    Stage(
        key="social",
        title="Social Promo Copy",
        role="social",
        filename="07-social-promo.md",
        depends_on=("youtube", "edit"),
        summary="Hooks and captions for the Shorts cut-downs, teaser posts, community post.",
        task="""\
Write promo copy for launch week, based on the YouTube package and the Shorts cut-downs in the \
edit plan.

## Shorts, Reels and TikTok
For each cut-down: on-screen hook text (six words at most), a caption, and five hashtags.

## Teasers
Three pre-release posts: seven days out, three days out, and launch day.

## Community post
YouTube community-tab text for launch day, with a poll idea.

## Behind the scenes
Two post ideas about how the video was made.

Match the channel's voice and language from the brief.""",
        criteria=None,
    ),
    Stage(
        key="checklist",
        title="Production Checklist",
        role="producer",
        filename="08-production-checklist.md",
        depends_on=("treatment", "storyboard", "prompts", "edit", "youtube"),
        summary="Step-by-step making-of checklist, generation budget, time estimate, risk watchlist.",
        task="""\
Write the production checklist: the order in which the creator should actually make this \
video using the team's documents.

## Checklist
Numbered phases with checkboxes (`- [ ]`): prep (reference images from the consistency kit), \
generate stills (hero shots first), animate clips, assemble the edit, grade and finish, \
thumbnails, upload and launch. Refer to shot IDs and document names.

## Generation budget
Estimated image and video generations including retries (hero shots need about four times as \
many), grouped by tool.

## Time estimate
Rough hours per phase for one person.

## Risk watchlist
The five things most likely to go wrong, and the fallback for each.""",
        criteria=None,
    ),
]

STAGE_BY_KEY: dict[str, Stage] = {s.key: s for s in STAGES}


def stage_role(stage: Stage) -> Role:
    return ROLES[stage.role]


def downstream_of(key: str) -> list[str]:
    """`key` and every stage that depends on it, directly or not, in pipeline order."""
    affected = {key}
    for stage in STAGES:  # STAGES is in dependency order
        if any(dep in affected for dep in stage.depends_on):
            affected.add(stage.key)
    return [s.key for s in STAGES if s.key in affected]
