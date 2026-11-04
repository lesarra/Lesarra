import React from 'react';
import type {Fx} from '../../fx';
import {Timing, clamp, hump, r2, singingAt, smooth} from './util';

type N = Extract<Fx, {kind: 'notes'}>;

const Single: React.FC<{c: string}> = ({c}) => (
  <g fill={c}>
    <ellipse cx="12" cy="44" rx="9.5" ry="6.5" transform="rotate(-22 12 44)" />
    <rect x="19.5" y="8" width="3.2" height="37" rx="1.4" />
    <path d="M22 8 C 24 20, 38 22, 34 37 C 33 28, 27 26, 22 24 Z" />
  </g>
);
const Beamed: React.FC<{c: string}> = ({c}) => (
  <g fill={c}>
    <ellipse cx="10" cy="46" rx="9" ry="6.2" transform="rotate(-22 10 46)" />
    <ellipse cx="36" cy="40" rx="9" ry="6.2" transform="rotate(-22 36 40)" />
    <rect x="17" y="10" width="3.2" height="37" rx="1.4" />
    <rect x="43" y="4" width="3.2" height="37" rx="1.4" />
    <path d="M17 8 L46 1 L46 11 L17 18 Z" />
  </g>
);

const SLOTS = 6;
const PERIOD = 2.3;

export const Notes: React.FC<{fx: N; tm: Timing}> = ({fx, tm}) => {
  const color = fx.color ?? '#ffd77a';
  return (
    <>
      {Array.from({length: SLOTS}).map((_, i) => {
        const off = (i * PERIOD) / SLOTS;
        const k = Math.floor((tm.t - off) / PERIOD);
        const spawn = off + k * PERIOD;
        // only spawn while the hat is singing (a note already in flight keeps going)
        if (!singingAt(spawn, 0.1, 0.15)) return null;
        const u = (tm.t - spawn) / PERIOD;
        if (u < 0 || u > 1) return null;
        const seed = tm.seed + i * 7 + k * 31;
        const dir = r2(seed, 1) > 0.5 ? 1 : -1;
        const x = fx.from.x * 1920 + dir * (30 + r2(seed, 2) * 130) * u + Math.sin(u * 7 + seed) * 26;
        const y = fx.from.y * 1080 - u * (170 + r2(seed, 3) * 150);
        const o = smooth(u / 0.15) * (1 - smooth((u - 0.65) / 0.35)) * 0.95;
        const sc = (0.55 + 0.35 * smooth(u / 0.3)) * (0.9 + 0.3 * r2(seed, 4));
        const rot = Math.sin(u * 5 + seed) * 16;
        return (
          <svg
            key={i}
            width={60}
            height={64}
            viewBox="0 0 56 62"
            style={{
              position: 'absolute',
              left: x,
              top: y,
              opacity: clamp(o),
              transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${sc * 1.1})`,
              filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 14px ${color}aa)`,
              overflow: 'visible',
            }}
          >
            {r2(seed, 5) > 0.5 ? <Single c={color} /> : <Beamed c={color} />}
          </svg>
        );
      })}
    </>
  );
};
