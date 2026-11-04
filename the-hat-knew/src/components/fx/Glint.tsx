import React from 'react';
import type {Fx} from '../../fx';
import {W, H, Timing, smooth} from './util';

type G = Extract<Fx, {kind: 'glint'}>;
const SWEEP = 1.1;

export const Glint: React.FC<{fx: G; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const dur = tm.t1 - tm.t0;
  const starts = dur > 2.6 ? [0.5, dur * 0.58] : [0.5];
  const b = fx.box;
  const bw = (b.x1 - b.x0) * W;
  const bh = (b.y1 - b.y0) * H;
  const diag = Math.hypot(bw, bh);
  let pos = -2;
  for (const s of starts) {
    const u = (t - s) / SWEEP;
    if (u >= 0 && u <= 1) pos = smooth(u) * 1.0;
  }
  if (pos < -1) return null;
  const angle = fx.angle ?? 20;
  const band = Math.max(40, diag * 0.16);
  const offset = (pos - 0.5) * (diag + band * 2);
  return (
    <div
      style={{
        position: 'absolute',
        left: `${b.x0 * 100}%`,
        top: `${b.y0 * 100}%`,
        width: bw,
        height: bh,
        overflow: 'hidden',
        WebkitMaskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%)',
        maskImage: 'radial-gradient(ellipse 50% 50% at 50% 50%, #000 55%, transparent 100%)',
        mixBlendMode: 'screen',
      }}
    >
      <div style={{position: 'absolute', left: '50%', top: '50%', width: 0, height: 0, transform: `rotate(${angle}deg)`}}>
        <div
          style={{
            position: 'absolute',
            left: offset - band / 2,
            top: -diag,
            width: band,
            height: diag * 2,
            background:
              'linear-gradient(90deg, rgba(255,246,214,0) 0%, rgba(255,246,214,0.8) 50%, rgba(255,246,214,0) 100%)',
          }}
        />
      </div>
    </div>
  );
};
