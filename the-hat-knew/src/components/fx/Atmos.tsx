import React from 'react';
import type {Fx} from '../../fx';
import {W, H, Timing, clamp, lerp, r2, smooth} from './util';

type Of<K extends Fx['kind']> = Extract<Fx, {kind: K}>;

export const Wisps: React.FC<{fx: Of<'wisps'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const b = fx.box;
  const bw = (b.x1 - b.x0) * W;
  const bh = (b.y1 - b.y0) * H;
  return (
    <svg
      width={bw}
      height={bh}
      viewBox={`0 0 ${bw} ${bh}`}
      style={{
        position: 'absolute',
        left: `${b.x0 * 100}%`,
        top: `${b.y0 * 100}%`,
        overflow: 'visible',
        filter: 'blur(14px)',
        mixBlendMode: 'screen',
      }}
    >
      {Array.from({length: 5}).map((_, i) => {
        const y = bh * (0.15 + 0.7 * ((i + 0.5) / 5)) + Math.sin(t * 0.3 + i * 2) * 18;
        const ph = t * (0.35 + r2(i, 1) * 0.3) + i * 1.7;
        const amp = bh * (0.08 + r2(i, 2) * 0.1);
        const drift = ((t * (20 + r2(i, 3) * 25) * (i % 2 ? 1 : -1)) % bw);
        const pts: string[] = [];
        for (let k = -1; k <= 8; k++) {
          const x = (k / 7) * bw + drift;
          pts.push(`${x},${y + Math.sin(ph + k * 0.95) * amp + Math.sin(ph * 1.7 + k * 2.1) * amp * 0.4}`);
        }
        // smooth path through points using quadratic mid-point curves
        const P = pts.map((s) => s.split(',').map(Number));
        let d = `M${P[0][0]},${P[0][1]}`;
        for (let k = 1; k < P.length - 1; k++) {
          const mx = (P[k][0] + P[k + 1][0]) / 2;
          const my = (P[k][1] + P[k + 1][1]) / 2;
          d += ` Q${P[k][0]},${P[k][1]} ${mx},${my}`;
        }
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={fx.color}
            strokeWidth={26 + r2(i, 4) * 26}
            strokeLinecap="round"
            opacity={0.2 + 0.08 * Math.sin(t * 0.8 + i)}
          />
        );
      })}
    </svg>
  );
};

export const Steam: React.FC<{fx: Of<'steam'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  return (
    <>
      {fx.from.map((p, pi) =>
        [0, 1, 2].map((ci) => {
          const per = 3.6;
          const k = (((t - ci * 1.2 - pi * 0.5) / per) % 1 + 1) % 1;
          const h = 230;
          const x0 = p.x * W + (ci - 1) * 16;
          const y0 = p.y * H;
          const pts: string[] = [];
          for (let s = 0; s <= 14; s++) {
            const v = s / 14;
            const x = x0 + Math.sin(v * 5 + t * 1.3 + ci * 2 + pi) * (10 + v * 22) * 1;
            const y = y0 - v * h * (0.4 + 0.6 * k);
            pts.push(`${s === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`);
          }
          return (
            <svg
              key={`${pi}-${ci}`}
              width={1}
              height={1}
              style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', filter: 'blur(2px)', opacity: 1.0 * smooth(k / 0.15) * (1 - smooth((k - 0.5) / 0.5))}}
            >
              <defs>
                <linearGradient id={`st${pi}${ci}`} x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={pts.join(' ')} fill="none" stroke={`url(#st${pi}${ci})`} strokeWidth={9} strokeLinecap="round" />
            </svg>
          );
        }),
      )}
    </>
  );
};

export const Rays: React.FC<{fx: Of<'rays'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const c = fx.color ?? '#ffe6a8';
  const n = 6;
  return (
    <div style={{position: 'absolute', left: `${fx.from.x * 100}%`, top: `${fx.from.y * 100}%`, width: 0, height: 0, mixBlendMode: 'screen'}}>
      {Array.from({length: n}).map((_, i) => {
        const a = (i - (n - 1) / 2) * 11 + Math.sin(t * 0.35 + i * 1.9) * 4;
        const wid = 170 + r2(i, 1) * 160;
        const o = (0.26 + 0.1 * Math.sin(t * 0.6 + i * 2.3)) * (0.8 + 0.2 * smooth(t / 1.2));
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: -wid / 2,
              top: 0,
              width: wid,
              height: 1300,
              transformOrigin: '50% 0%',
              transform: `rotate(${a}deg)`,
              background: `linear-gradient(90deg, ${c}00 0%, ${c} 50%, ${c}00 100%)`,
              clipPath: 'polygon(46% 0, 54% 0, 100% 100%, 0 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.5) 40%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, #000 0%, rgba(0,0,0,0.5) 40%, transparent 100%)',
              opacity: clamp(o),
            }}
          />
        );
      })}
    </div>
  );
};
