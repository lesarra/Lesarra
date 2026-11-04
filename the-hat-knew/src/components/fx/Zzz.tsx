import React from 'react';
import type {Fx} from '../../fx';
import {LYRIC_FONT} from '../theme';
import {Timing, clamp, smooth} from './util';

type Z = Extract<Fx, {kind: 'zzz'}>;
const LIFE = 3.4;

export const Zzz: React.FC<{fx: Z; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const k = (((t - i * 0.95) / LIFE) % 1 + 1) % 1;
        const o = smooth(k / 0.2) * (1 - smooth((k - 0.6) / 0.4)) * 0.9;
        const size = [38, 54, 76][i] * (0.7 + 0.6 * k);
        const x = fx.from.x * 1920 + i * 16 + k * 110 + Math.sin(k * 6 + i) * 8;
        const y = fx.from.y * 1080 - k * 150 - i * 20;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              fontFamily: LYRIC_FONT,
              fontStyle: 'italic',
              fontWeight: 700,
              fontSize: size,
              color: '#f6ecd0',
              opacity: clamp(o),
              transform: `translate(-50%,-50%) rotate(${-8 + i * 6}deg)`,
              textShadow: '0 0 14px rgba(255,236,190,0.7), 0 2px 3px rgba(40,20,5,0.6)',
            }}
          >
            {i === 2 ? 'Z' : 'z'}
          </div>
        );
      })}
    </>
  );
};
