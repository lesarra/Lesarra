import {BEATS} from '../../analysis';
import {lyrics} from '../../lyrics';
import {rand} from '../theme';

export const W = 1920;
export const H = 1080;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const smooth = (u: number) => {
  const c = clamp(u);
  return c * c * (3 - 2 * c);
};
/** seeded random with two integer keys */
export const r2 = (a: number, b: number) => rand(a * 97.13 + b * 13.7 + 5.1);
/** 0 -> 1 -> 0 hump */
export const hump = (u: number) => Math.sin(Math.PI * clamp(u));

/** Timing handed to every effect. t = absolute seconds, f = shot-local frame. */
export type Timing = {t: number; f: number; t0: number; t1: number; seed: number};

export const WORDS: {s: number; e: number; t: string}[] = lyrics.flatMap((l) =>
  l.words.map((w) => ({s: w.s, e: w.e, t: w.t})),
);

export const singingAt = (t: number, pre = 0, post = 0) =>
  WORDS.some((w) => t >= w.s - pre && t <= w.e + post);

/** seconds since the most recent beat (Infinity before the first) */
export const sinceBeat = (t: number) => {
  let last = -1;
  for (let i = 0; i < BEATS.length; i++) {
    if (BEATS[i] <= t) last = i;
    else break;
  }
  return last < 0 ? Infinity : t - BEATS[last];
};

/** soft irregular candle flicker 0..1 */
export const flickerAt = (f: number, seed = 0) =>
  clamp(
    0.62 +
      0.16 * Math.sin(f / 5.3 + seed) +
      0.1 * Math.sin(f / 2.3 + seed * 1.7 + 1.3) +
      0.07 * Math.sin(f / 1.37 + seed * 2.9) +
      0.05 * Math.sin(f / 9.1 + seed * 0.4),
  );
