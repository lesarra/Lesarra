"""A project folder: the creator's brief, the lyrics, the team's documents and run state.

    my-song/
      brief.toml          what the video should be (you edit this)
      lyrics.txt          the lyrics, optionally with [Section 0:45] timestamps
      outputs/            one Markdown document per stage, plus production-bible.md
      state.json          what has run, at which effort, scores and estimated cost
"""

from __future__ import annotations

import json
import re
import shutil
import threading
import tomllib
from datetime import datetime, timezone
from importlib import resources
from pathlib import Path

from .effort import validate_pins

BRIEF_FILE = "brief.toml"
STATE_FILE = "state.json"
OUTPUT_DIR = "outputs"


class ProjectError(Exception):
    pass


def slugify(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-") or "project"


def create_project(path: Path, title: str | None, artist: str | None, lyrics: Path | None) -> Path:
    if (path / BRIEF_FILE).exists():
        raise ProjectError(f"{path / BRIEF_FILE} already exists; not overwriting it.")
    path.mkdir(parents=True, exist_ok=True)
    template = resources.files("mvstudio").joinpath("templates/brief.toml").read_text(encoding="utf-8")
    if title:
        template = template.replace('title = "Midnight Rivers"', f"title = {json.dumps(title)}", 1)
    if artist:
        template = template.replace('artist = "Lesarra"', f"artist = {json.dumps(artist)}", 1)
    (path / BRIEF_FILE).write_text(template, encoding="utf-8")
    if lyrics:
        shutil.copyfile(lyrics, path / "lyrics.txt")
    else:
        sample = resources.files("mvstudio").joinpath("templates/lyrics.txt").read_text(encoding="utf-8")
        (path / "lyrics.txt").write_text(sample, encoding="utf-8")
    return path


class Project:
    def __init__(self, path: Path):
        self.path = Path(path)
        brief_path = self.path / BRIEF_FILE
        if not brief_path.exists():
            raise ProjectError(f"No {BRIEF_FILE} in {self.path}. Create one with: mvstudio new {self.path}")
        try:
            self.brief = tomllib.loads(brief_path.read_text(encoding="utf-8"))
        except tomllib.TOMLDecodeError as e:
            raise ProjectError(f"{brief_path} is not valid TOML: {e}") from None

        studio = self.brief.get("studio", {})
        try:
            self.effort_pins = validate_pins(studio.get("effort", {}))
        except ValueError as e:
            raise ProjectError(f"{brief_path}: {e}") from None
        self.quality = studio.get("quality", "masterpiece")

        self.lyrics = ""
        lyrics_file = self.brief.get("song", {}).get("lyrics_file")
        if lyrics_file:
            lyrics_path = self.path / lyrics_file
            if not lyrics_path.exists():
                raise ProjectError(f"brief.toml points to lyrics_file {lyrics_file!r}, but {lyrics_path} doesn't exist.")
            self.lyrics = lyrics_path.read_text(encoding="utf-8").strip()

        self.outputs = self.path / OUTPUT_DIR
        self._lock = threading.Lock()
        self.state = self._load_state()

    # ---------- brief ----------

    @property
    def title(self) -> str:
        song = self.brief.get("song", {})
        return f"{song.get('artist', 'Unknown artist')} - {song.get('title', 'Untitled')}"

    def brief_markdown(self) -> str:
        """The brief rendered for the team: every section and field, then the lyrics."""
        parts = [f"# Project brief: {self.title}"]
        for section, values in self.brief.items():
            if section == "studio" or not isinstance(values, dict):
                continue
            parts.append(f"\n## {section.replace('_', ' ').title()}")
            for key, value in values.items():
                if key == "lyrics_file":
                    continue
                if isinstance(value, list):
                    value = "; ".join(str(v) for v in value) if value else "(none)"
                elif isinstance(value, bool):
                    value = "yes" if value else "no"
                parts.append(f"- **{key.replace('_', ' ')}:** {value}")
        parts.append("\n## Lyrics")
        parts.append(f"```\n{self.lyrics}\n```" if self.lyrics else "(Instrumental: no lyrics provided.)")
        return "\n".join(parts)

    # ---------- documents ----------

    def doc_path(self, filename: str) -> Path:
        return self.outputs / filename

    def read_doc(self, filename: str) -> str:
        path = self.doc_path(filename)
        return path.read_text(encoding="utf-8") if path.exists() else ""

    def write_doc(self, filename: str, text: str) -> Path:
        self.outputs.mkdir(parents=True, exist_ok=True)
        path = self.doc_path(filename)
        path.write_text(text.rstrip() + "\n", encoding="utf-8")
        return path

    # ---------- state ----------

    def _load_state(self) -> dict:
        path = self.path / STATE_FILE
        if path.exists():
            try:
                return json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                raise ProjectError(f"{path} is corrupted; delete it to start the project's run history fresh.") from None
        return {"stages": {}, "plan": None}

    def save_state(self) -> None:
        with self._lock:
            path = self.path / STATE_FILE
            tmp = path.with_suffix(".tmp")
            tmp.write_text(json.dumps(self.state, indent=2), encoding="utf-8")
            tmp.replace(path)

    def stage_state(self, key: str) -> dict:
        with self._lock:
            return self.state["stages"].setdefault(key, {"status": "pending", "attempts": []})

    def update_stage(self, key: str, **fields) -> None:
        with self._lock:
            self.state["stages"].setdefault(key, {"status": "pending", "attempts": []}).update(fields)
        self.save_state()

    def record_attempt(self, key: str, attempt: dict) -> None:
        with self._lock:
            entry = self.state["stages"].setdefault(key, {"status": "pending", "attempts": []})
            entry.setdefault("attempts", []).append(attempt)
        self.add_spend(attempt.get("cost", 0.0))

    def add_spend(self, cost: float) -> None:
        """Running total of estimated API cost; survives stages being redone."""
        with self._lock:
            self.state["spent"] = round(self.state.get("spent", 0.0) + cost, 5)
        self.save_state()

    @property
    def spent(self) -> float:
        return self.state.get("spent", 0.0)

    def reset_stage(self, key: str) -> None:
        with self._lock:
            self.state["stages"][key] = {"status": "pending", "attempts": []}
        self.save_state()

    def is_done(self, key: str) -> bool:
        return self.state["stages"].get(key, {}).get("status") == "done"


def now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
