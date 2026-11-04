import type {Accent} from '../direction';

export const LYRIC_FONT = "'IM Fell English', 'Palatino Linotype', Georgia, serif";
export const DECOR_FONT = "'Cinzel Decorative', 'IM Fell English', Georgia, serif";
export const SERIF = LYRIC_FONT;
export const CREAM = '#f6ecd0';
export const GOLD = '#e8c56a';

export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export type AccentTheme = {main: string; hi: string; glow: string};
export const ACCENTS: Record<Accent, AccentTheme> = {
  // main = sung/settled colour, hi = currently-sung word, glow = shadow colour
  // (hues brightened from the house colours so they stay legible on dark art)
  slytherin: {main: '#3fbf84', hi: '#e4f1ea', glow: '#2fa36b'},
  gryffindor: {main: '#e0474c', hi: '#f2c14e', glow: '#c0262d'},
  ravenclaw: {main: '#5d8fe3', hi: '#d9a566', glow: '#2a5db0'},
  hufflepuff: {main: '#f4cd34', hi: '#fff6b8', glow: '#f0c419'},
  moon: {main: '#bcd2f0', hi: '#ffffff', glow: '#8fb4ea'},
  gold: {main: '#f0d27a', hi: '#fff6cf', glow: '#e8b93c'},
  neutral: {main: CREAM, hi: '#ffffff', glow: '#e8c56a'},
  split: {main: CREAM, hi: '#ffffff', glow: '#e8c56a'},
};

export type Keyword = {c: string; hi: string};
const GREEN: Keyword = {c: '#43c98a', hi: '#a4ffd0'};
const RED: Keyword = {c: '#e5484d', hi: '#ff9d92'};
const GOLDK: Keyword = {c: '#f2c14e', hi: '#fff0b0'};
const BLUE: Keyword = {c: '#6c9cf0', hi: '#c3d9ff'};
const YELLOW: Keyword = {c: '#f7d23e', hi: '#fff4a8'};
const MOON: Keyword = {c: '#bcd6ff', hi: '#ffffff'};
const ROSE: Keyword = {c: '#f1a08c', hi: '#ffd6c8'};
const KEYWORDS: Record<string, Keyword> = {
  green: GREEN, serpent: GREEN, "serpent's": GREEN, snakes: GREEN, slytherin: GREEN, "slytherin'd": GREEN,
  red: RED, lion: RED, lions: RED, gryffindor: RED, "gryffindor'd": RED, sword: RED,
  gold: GOLDK, crown: GOLDK,
  "ravenclaw'd": BLUE, "hufflepuff'd": YELLOW,
  moon: MOON,
  heart: ROSE, hearts: ROSE,
};
export const keywordFor = (word: string): Keyword | null => {
  const k = word.toLowerCase().replace(/[^a-z']/g, '').replace(/^'+|'+$/g, '');
  return KEYWORDS[k] ?? null;
};
