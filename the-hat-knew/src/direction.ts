// Per-shot direction, written in the main session. Read-only for agents.
// caption: where the lyric sits (chosen to keep faces clear). "none" = instrumental.
// motion: how the image moves. transitionIn: how this shot enters from the previous one.
// accent: colour theme for the caption (slytherin=green/silver, gryffindor=red/gold,
//   ravenclaw=blue/bronze, hufflepuff=yellow/black, moon=blue/silver, gold, neutral,
//   split=per-word lion red / serpent green). lyricStyle: how the words animate in.
export type CaptionPos = "top"|"bottom"|"left"|"right"|"center"|"top-left"|"top-right"|"bottom-left"|"bottom-right"|"none";
export type Motion = "push-in"|"pull-out"|"pan-left"|"pan-right"|"pan-up"|"pan-down"|"drift"|"float"|"shake"|"tremble"|"zoom-punch";
export type Transition = "fade-black"|"crossfade"|"ink-bleed"|"page-turn"|"iris"|"blur-dissolve"|"slide-left"|"slide-right"|"slide-up"|"flash-gold"|"flash-green"|"burn"|"frost";
export type Accent = "slytherin"|"gryffindor"|"ravenclaw"|"hufflepuff"|"moon"|"gold"|"neutral"|"split";
export type LyricStyle = "ink-write"|"typewriter"|"word-pop"|"bounce"|"glow"|"shout"|"whisper"|"none";
export type Tone = "ink"|"light";
// tone: "ink" = the caption area is light, so set the words in dark storybook ink with a soft cream glow behind;
//       "light" = the area is dark, so use cream text with a dark ink outline and a soft dark wash behind.
// hook: where/how to set the big chorus lines ("the hat knew…", "all along") on this shot: a centred band at the top or bottom.
export type Direction = {caption: CaptionPos; motion: Motion; transitionIn: Transition; accent: Accent; lyricStyle: LyricStyle; tone: Tone; hook?: {pos: "top"|"bottom"; tone: Tone}};
export const direction: Record<number, Direction> = {
  1: {caption: "bottom", motion: "push-in", transitionIn: "fade-black", accent: "gold", lyricStyle: "ink-write", tone: "light"},
  2: {caption: "top", motion: "pan-up", transitionIn: "ink-bleed", accent: "neutral", lyricStyle: "typewriter", tone: "ink"},
  3: {caption: "none", motion: "pan-down", transitionIn: "page-turn", accent: "gold", lyricStyle: "none", tone: "light"},
  4: {caption: "bottom-left", motion: "pull-out", transitionIn: "crossfade", accent: "slytherin", lyricStyle: "word-pop", tone: "ink"},
  5: {caption: "bottom-left", motion: "push-in", transitionIn: "frost", accent: "slytherin", lyricStyle: "glow", tone: "light"},
  6: {caption: "top", motion: "float", transitionIn: "slide-up", accent: "neutral", lyricStyle: "bounce", tone: "ink"},
  7: {caption: "center", motion: "shake", transitionIn: "flash-green", accent: "slytherin", lyricStyle: "shout", tone: "light"},
  8: {caption: "bottom", motion: "pull-out", transitionIn: "iris", accent: "gryffindor", lyricStyle: "whisper", tone: "light"},
  9: {caption: "top-left", motion: "tremble", transitionIn: "crossfade", accent: "neutral", lyricStyle: "typewriter", tone: "ink"},
  10: {caption: "bottom", motion: "push-in", transitionIn: "ink-bleed", accent: "slytherin", lyricStyle: "ink-write", tone: "light"},
  11: {caption: "bottom-left", motion: "drift", transitionIn: "blur-dissolve", accent: "neutral", lyricStyle: "whisper", tone: "light"},
  12: {caption: "left", motion: "pan-right", transitionIn: "slide-left", accent: "slytherin", lyricStyle: "typewriter", tone: "ink"},
  13: {caption: "left", motion: "pan-left", transitionIn: "slide-right", accent: "gryffindor", lyricStyle: "typewriter", tone: "light"},
  14: {caption: "bottom-right", motion: "pan-right", transitionIn: "crossfade", accent: "gryffindor", lyricStyle: "word-pop", tone: "ink"},
  15: {caption: "bottom-right", motion: "zoom-punch", transitionIn: "flash-green", accent: "slytherin", lyricStyle: "bounce", tone: "ink"},
  16: {caption: "bottom", motion: "pan-up", transitionIn: "flash-gold", accent: "gryffindor", lyricStyle: "bounce", tone: "ink"},
  17: {caption: "top", motion: "push-in", transitionIn: "crossfade", accent: "gold", lyricStyle: "glow", tone: "ink"},
  18: {caption: "none", motion: "pull-out", transitionIn: "page-turn", accent: "gold", lyricStyle: "none", tone: "light"},
  19: {caption: "top", motion: "pan-left", transitionIn: "flash-gold", accent: "gold", lyricStyle: "bounce", tone: "ink", hook: {pos: "top", tone: "ink"}},
  20: {caption: "right", motion: "pan-left", transitionIn: "crossfade", accent: "slytherin", lyricStyle: "word-pop", tone: "ink"},
  21: {caption: "bottom", motion: "pan-right", transitionIn: "crossfade", accent: "gryffindor", lyricStyle: "word-pop", tone: "ink"},
  22: {caption: "right", motion: "pan-right", transitionIn: "slide-left", accent: "neutral", lyricStyle: "typewriter", tone: "light"},
  23: {caption: "bottom", motion: "drift", transitionIn: "blur-dissolve", accent: "gold", lyricStyle: "ink-write", tone: "light"},
  24: {caption: "top", motion: "float", transitionIn: "page-turn", accent: "gold", lyricStyle: "bounce", tone: "ink"},
  25: {caption: "top-left", motion: "pull-out", transitionIn: "flash-gold", accent: "gold", lyricStyle: "glow", tone: "ink", hook: {pos: "top", tone: "light"}},
  26: {caption: "bottom", motion: "pan-right", transitionIn: "page-turn", accent: "neutral", lyricStyle: "ink-write", tone: "light"},
  27: {caption: "bottom", motion: "push-in", transitionIn: "iris", accent: "neutral", lyricStyle: "typewriter", tone: "light"},
  28: {caption: "top-left", motion: "pan-left", transitionIn: "flash-green", accent: "slytherin", lyricStyle: "bounce", tone: "ink"},
  29: {caption: "bottom-left", motion: "push-in", transitionIn: "crossfade", accent: "gryffindor", lyricStyle: "bounce", tone: "ink"},
  30: {caption: "bottom", motion: "pull-out", transitionIn: "slide-up", accent: "gryffindor", lyricStyle: "word-pop", tone: "ink"},
  31: {caption: "top", motion: "pan-left", transitionIn: "page-turn", accent: "neutral", lyricStyle: "typewriter", tone: "ink"},
  32: {caption: "top-left", motion: "push-in", transitionIn: "flash-gold", accent: "gold", lyricStyle: "bounce", tone: "ink"},
  33: {caption: "top", motion: "tremble", transitionIn: "burn", accent: "gold", lyricStyle: "shout", tone: "light"},
  34: {caption: "top", motion: "pan-right", transitionIn: "crossfade", accent: "split", lyricStyle: "word-pop", tone: "ink"},
  35: {caption: "top-left", motion: "pan-left", transitionIn: "page-turn", accent: "ravenclaw", lyricStyle: "typewriter", tone: "ink"},
  36: {caption: "bottom", motion: "push-in", transitionIn: "slide-left", accent: "hufflepuff", lyricStyle: "bounce", tone: "ink"},
  37: {caption: "bottom", motion: "pan-up", transitionIn: "flash-gold", accent: "gryffindor", lyricStyle: "shout", tone: "light"},
  38: {caption: "top", motion: "drift", transitionIn: "burn", accent: "slytherin", lyricStyle: "ink-write", tone: "ink"},
  39: {caption: "bottom-left", motion: "float", transitionIn: "flash-gold", accent: "gold", lyricStyle: "bounce", tone: "light", hook: {pos: "bottom", tone: "light"}},
  40: {caption: "bottom-left", motion: "push-in", transitionIn: "crossfade", accent: "slytherin", lyricStyle: "bounce", tone: "light"},
  41: {caption: "bottom", motion: "pan-up", transitionIn: "crossfade", accent: "gryffindor", lyricStyle: "word-pop", tone: "ink"},
  42: {caption: "bottom", motion: "push-in", transitionIn: "ink-bleed", accent: "moon", lyricStyle: "typewriter", tone: "light"},
  43: {caption: "bottom", motion: "drift", transitionIn: "blur-dissolve", accent: "gold", lyricStyle: "ink-write", tone: "light"},
  44: {caption: "bottom", motion: "pan-right", transitionIn: "page-turn", accent: "gold", lyricStyle: "typewriter", tone: "light"},
  45: {caption: "left", motion: "push-in", transitionIn: "flash-gold", accent: "gold", lyricStyle: "bounce", tone: "light", hook: {pos: "bottom", tone: "light"}},
  46: {caption: "none", motion: "push-in", transitionIn: "crossfade", accent: "gold", lyricStyle: "none", tone: "light"},
  47: {caption: "bottom", motion: "float", transitionIn: "iris", accent: "moon", lyricStyle: "glow", tone: "light"},
  48: {caption: "bottom-right", motion: "drift", transitionIn: "blur-dissolve", accent: "moon", lyricStyle: "whisper", tone: "light"},
  49: {caption: "bottom", motion: "pan-left", transitionIn: "slide-right", accent: "moon", lyricStyle: "whisper", tone: "light"},
  50: {caption: "bottom", motion: "pan-right", transitionIn: "slide-left", accent: "moon", lyricStyle: "whisper", tone: "light"},
  51: {caption: "bottom", motion: "push-in", transitionIn: "iris", accent: "split", lyricStyle: "glow", tone: "ink"},
  52: {caption: "top", motion: "pull-out", transitionIn: "page-turn", accent: "split", lyricStyle: "word-pop", tone: "ink"},
  53: {caption: "top", motion: "push-in", transitionIn: "flash-gold", accent: "gold", lyricStyle: "glow", tone: "ink"},
  54: {caption: "bottom", motion: "push-in", transitionIn: "blur-dissolve", accent: "split", lyricStyle: "glow", tone: "light"},
  55: {caption: "bottom-right", motion: "pan-right", transitionIn: "flash-gold", accent: "gold", lyricStyle: "shout", tone: "light", hook: {pos: "bottom", tone: "light"}},
  56: {caption: "bottom", motion: "pan-left", transitionIn: "page-turn", accent: "gold", lyricStyle: "word-pop", tone: "light"},
  57: {caption: "bottom-left", motion: "push-in", transitionIn: "crossfade", accent: "slytherin", lyricStyle: "word-pop", tone: "ink"},
  58: {caption: "bottom-left", motion: "pull-out", transitionIn: "flash-gold", accent: "gold", lyricStyle: "glow", tone: "ink"},
  59: {caption: "bottom", motion: "pan-up", transitionIn: "slide-up", accent: "gold", lyricStyle: "typewriter", tone: "ink"},
  60: {caption: "top", motion: "tremble", transitionIn: "burn", accent: "gryffindor", lyricStyle: "shout", tone: "ink"},
  61: {caption: "top", motion: "float", transitionIn: "flash-gold", accent: "gold", lyricStyle: "bounce", tone: "ink"},
  62: {caption: "bottom", motion: "pull-out", transitionIn: "flash-gold", accent: "gold", lyricStyle: "shout", tone: "light", hook: {pos: "bottom", tone: "light"}},
  63: {caption: "bottom-left", motion: "drift", transitionIn: "page-turn", accent: "slytherin", lyricStyle: "ink-write", tone: "light"},
  64: {caption: "top-left", motion: "push-in", transitionIn: "crossfade", accent: "slytherin", lyricStyle: "glow", tone: "ink"},
  65: {caption: "none", motion: "pull-out", transitionIn: "page-turn", accent: "gold", lyricStyle: "none", tone: "light"},
};
