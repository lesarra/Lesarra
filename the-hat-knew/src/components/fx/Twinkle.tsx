import React from 'react';
import type {Fx} from '../../fx';
import {Timing, clamp, hump, r2} from './util';

type T = Extract<Fx, {kind: 'twinkle'}>;

export const Star: React.FC<{size: number; color: string; scale: number; rot?: number; glow?: number}> = ({
  size,
  color,
  scale,
  rot = 0,
  glow = 1,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="-1.2 -1.2 2.4 2.4"
    style={{
      position: 'absolute',
      left: 0,
      top: 0,
      transform: `translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`,
      overflow: 'visible',
      filter: `drop-shadow(0 0 ${6 * glow}px ${color}) drop-shadow(0 0 ${16 * glow}px ${color})`,
    }}
  >
    <path d="M0 -1.15 Q0.09 -0.09 1.15 0 Q0.09 0.09 0 1.15 Q-0.09 0.09 -1.15 0 Q-0.09 -0.09 0 -1.15Z" fill="#fffdf0" />
    <path d="M0 -0.55 Q0.1 -0.1 0.55 0 Q0.1 0.1 0 0.55 Q-0.1 0.1 -0.55 0 Q-0.1 -0.1 0 -0.55Z" fill={color} opacity={0.9} />
  </svg>
);

export const Twinkle: React.FC<{fx: T; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const size = (fx.size ?? 1) * 44;
  const color = fx.color ?? '#fff3c0';
  return (
    <>
      {fx.at.map((p, i) => {
        const period = 1.5 + r2(tm.seed, i) * 1.0;
        const life = 0.8;
        const off = 0.25 + i * 0.45 + r2(tm.seed, i + 9) * 0.3;
        const local = (((t - off) % period) + period) % period;
        if (t < off || local > life) return null;
        const u = local / life;
        const s = hump(u) ** 1.2;
        return (
          <div key={i} style={{position: 'absolute', left: `${p.x * 100}%`, top: `${p.y * 100}%`}}>
            <div
              style={{
                position: 'absolute',
                width: size * 2.4,
                height: size * 2.4,
                left: 0,
                top: 0,
                transform: 'translate(-50%,-50%)',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${color}aa 0%, ${color}00 65%)`,
                opacity: clamp(s) * 0.7,
                mixBlendMode: 'screen',
              }}
            />
            <Star size={size} color={color} scale={s} rot={u * 25 - 8} />
          </div>
        );
      })}
    </>
  );
};
