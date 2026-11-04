import React from 'react';
import type {Fx} from '../../fx';
import {W, Timing, clamp, flickerAt, sinceBeat} from './util';

type G = Extract<Fx, {kind: 'glow'}>;

export const Glow: React.FC<{fx: G; tm: Timing; idx: number}> = ({fx, tm, idx}) => {
  let k: number;
  if (fx.pulse === 'flicker') k = flickerAt(tm.f, idx * 3.1 + tm.seed);
  else if (fx.pulse === 'beat') k = 0.5 + 0.5 * Math.exp(-6 * Math.min(10, sinceBeat(tm.t)));
  else k = 0.68 + 0.32 * Math.sin(tm.f / 24 + idx);
  const size = fx.r * W * 2 * (0.9 + 0.2 * k);
  const core = size * 0.35;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: `${fx.at.x * 100}%`,
          top: `${fx.at.y * 100}%`,
          width: size,
          height: size,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${fx.color} 0%, ${fx.color}88 28%, ${fx.color}00 70%)`,
          opacity: clamp(0.25 + 0.5 * k, 0, 0.85),
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: `${fx.at.x * 100}%`,
          top: `${fx.at.y * 100}%`,
          width: core,
          height: core,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: 'radial-gradient(circle, #fffbe8 0%, rgba(255,251,232,0.35) 45%, rgba(255,251,232,0) 70%)',
          opacity: clamp(0.15 + 0.5 * k, 0, 0.7),
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
};
