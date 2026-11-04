import React from 'react';
import type {Fx} from '../../fx';
import {W, H, Timing, clamp, flickerAt, hump, lerp, r2, smooth} from './util';

type Of<K extends Fx['kind']> = Extract<Fx, {kind: K}>;

const LEAF = 'M0 -20 C 12 -12, 14 6, 0 22 C -14 6, -12 -12, 0 -20 Z';

export const Leaves: React.FC<{fx: Of<'leaves'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  return (
    <>
      {Array.from({length: Math.min(fx.count, 8)}).map((_, i) => {
        const per = 7 + r2(i, 1) * 4;
        const u = (((t + r2(i, 2) * per) / per) % 1 + 1) % 1;
        const x = r2(i, 3) * 100 + Math.sin(u * 9 + i) * 5;
        const flip = Math.cos(t * 1.8 + i * 2);
        const s = 0.8 + r2(i, 4) * 0.7;
        return (
          <svg
            key={i}
            width={44}
            height={52}
            viewBox="-22 -26 44 52"
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${-8 + u * 112}%`,
              opacity: 0.9 * smooth(u / 0.05) * (1 - smooth((u - 0.94) / 0.06)),
              transform: `rotate(${Math.sin(u * 8 + i) * 50 + u * 200}deg) scale(${s * flip}, ${s})`,
              filter: 'drop-shadow(0 0 5px rgba(255,215,120,0.7))',
              overflow: 'visible',
            }}
          >
            <defs>
              <linearGradient id={`lg${i}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#fff0b0" />
                <stop offset="0.5" stopColor="#e8b93c" />
                <stop offset="1" stopColor="#a8741c" />
              </linearGradient>
            </defs>
            <path d={LEAF} fill={`url(#lg${i})`} />
            <path d="M0 -16 L0 20" stroke="#8a5a14" strokeWidth="1.2" opacity="0.6" />
          </svg>
        );
      })}
    </>
  );
};

const HEART = 'M0 9 C -14 -2, -12 -13, -5 -13 C -1 -13, 0 -9, 0 -8 C 0 -9, 1 -13, 5 -13 C 12 -13, 14 -2, 0 9 Z';

export const Hearts: React.FC<{fx: Of<'hearts'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const b = fx.box;
  return (
    <>
      {Array.from({length: 9}).map((_, i) => {
        const per = 3.2 + r2(i, 1) * 1.6;
        const k = (((t + r2(i, 2) * per) / per) % 1 + 1) % 1;
        const c = fx.colors[i % fx.colors.length];
        const x = lerp(b.x0, b.x1, r2(i, 3)) * W + Math.sin(k * 6 + i) * 18;
        const y = lerp(b.y0, b.y1, 0.5 + r2(i, 4) * 0.5) * H - k * (b.y1 - b.y0) * H * 0.7;
        const sc = (0.7 + r2(i, 5) * 0.8) * (0.4 + 0.6 * smooth(k / 0.2));
        return (
          <svg
            key={i}
            width={44}
            height={40}
            viewBox="-17 -16 34 30"
            style={{
              position: 'absolute',
              left: x,
              top: y,
              opacity: 0.9 * hump(k) ** 0.5 * (1 - smooth((k - 0.6) / 0.4)),
              transform: `translate(-50%,-50%) rotate(${Math.sin(k * 5 + i) * 14}deg) scale(${sc * 1.6})`,
              filter: `drop-shadow(0 0 7px ${c})`,
              overflow: 'visible',
            }}
          >
            <path d={HEART} fill={c} />
            <path d="M-8 -9 C -10 -6 -9 -3 -7 -1" stroke="#fff" strokeWidth="1.8" fill="none" opacity="0.6" strokeLinecap="round" />
          </svg>
        );
      })}
    </>
  );
};

export const Planes: React.FC<{fx: Of<'planes'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const per = 4.2;
  return (
    <>
      {fx.paths.map((p, i) => {
        const u = (((t + 0.6 + i * 1.7) / per) % 1 + 1) % 1;
        const x0 = p.from.x * W;
        const y0 = p.from.y * H;
        const x1 = p.to.x * W;
        const y1 = p.to.y * H;
        const dx = x1 - x0;
        const dy = y1 - y0;
        const len = Math.hypot(dx, dy);
        let nx = dy / len;
        let ny = -dx / len;
        if (ny > 0) {
          nx = -nx;
          ny = -ny;
        }
        const cx = (x0 + x1) / 2 + nx * len * 0.16;
        const cy = (y0 + y1) / 2 + ny * len * 0.16;
        const pt = (v: number) => ({
          x: (1 - v) * (1 - v) * x0 + 2 * (1 - v) * v * cx + v * v * x1,
          y: (1 - v) * (1 - v) * y0 + 2 * (1 - v) * v * cy + v * v * y1,
        });
        const P = pt(u);
        const Q = pt(Math.min(1, u + 0.02));
        const ang = (Math.atan2(Q.y - P.y, Q.x - P.x) * 180) / Math.PI;
        const bank = Math.sin(u * 9 + i) * 0.35;
        const o = smooth(u / 0.1) * (1 - smooth((u - 0.88) / 0.12));
        return (
          <svg
            key={i}
            width={80}
            height={40}
            viewBox="-4 -14 52 28"
            style={{
              position: 'absolute',
              left: P.x,
              top: P.y,
              opacity: o,
              transform: `translate(-50%,-50%) rotate(${ang}deg) scaleY(${1 - Math.abs(bank)})`,
              filter: 'drop-shadow(0 2px 3px rgba(40,20,5,0.45))',
              overflow: 'visible',
            }}
          >
            <path d="M0 -9 L42 0 L10 0 Z" fill="#fffaf0" />
            <path d="M10 0 L42 0 L0 7 Z" fill="#e6dcc2" />
            <path d="M0 -9 L42 0 L0 7 Z" fill="none" stroke="rgba(70,45,20,0.55)" strokeWidth="1" strokeLinejoin="round" />
          </svg>
        );
      })}
    </>
  );
};

export const Flutter: React.FC<{fx: Of<'flutter'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const b = fx.box;
  return (
    <>
      {Array.from({length: 9}).map((_, i) => {
        const per = 3.4 + r2(i, 1) * 1.4;
        const k = (((t + r2(i, 2) * per) / per) % 1 + 1) % 1;
        const x = lerp(b.x0, b.x1, r2(i, 3)) * W + Math.sin(k * 7 + i) * 40;
        const y = lerp(b.y1, b.y0, k) * H;
        return (
          <svg
            key={i}
            width={50}
            height={36}
            viewBox="0 0 50 36"
            style={{
              position: 'absolute',
              left: x,
              top: y,
              opacity: 0.92 * smooth(k / 0.1) * (1 - smooth((k - 0.8) / 0.2)),
              transform: `translate(-50%,-50%) rotate(${k * 360 * (r2(i, 4) > 0.5 ? 1 : -1) * 0.6 + i * 30}deg) scale(${(0.7 + r2(i, 5) * 0.5) * (0.8 + 0.2 * Math.cos(t * 4 + i))})`,
              filter: 'drop-shadow(0 2px 4px rgba(30,10,0,0.5))',
              overflow: 'visible',
            }}
          >
            <rect x="1" y="3" width="48" height="31" rx="2" fill={fx.color} />
            <path d="M1 4 L25 21 L49 4" stroke="#f6ecd0" strokeWidth="1.6" fill="none" opacity="0.8" />
            <path d="M1 33 L19 17 M49 33 L31 17" stroke="#6a1608" strokeWidth="1" opacity="0.5" />
            <circle cx="25" cy="21" r="4" fill="#f0c419" />
          </svg>
        );
      })}
    </>
  );
};

export const Candles: React.FC<{fx: Of<'candles'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const b = fx.box;
  const n = Math.min(fx.count, 18);
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const x = lerp(b.x0, b.x1, r2(i, 1)) * W;
        const y = lerp(b.y0, b.y1, r2(i, 2)) * H + Math.sin(t * (0.7 + r2(i, 3) * 0.5) + i * 2) * 10;
        const sc = 0.7 + r2(i, 4) * 0.5;
        const fl = flickerAt(tm.f + i * 9, i);
        return (
          <div key={i} style={{position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${sc})`}}>
            <div
              style={{
                position: 'absolute',
                left: -45,
                top: -62,
                width: 90,
                height: 90,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,200,110,0.85) 0%, rgba(255,170,70,0.3) 40%, rgba(255,170,70,0) 70%)',
                opacity: 0.35 + 0.4 * fl,
                mixBlendMode: 'screen',
              }}
            />
            <svg width={18} height={52} viewBox="-9 -26 18 52" style={{position: 'absolute', left: -9, top: -26, overflow: 'visible'}}>
              <rect x="-4.5" y="0" width="9" height="24" rx="1.5" fill="#f3e6c4" />
              <rect x="-4.5" y="0" width="3" height="24" rx="1.5" fill="#fff8e0" opacity="0.6" />
              <path d="M-4.5 4 q4.5 5 9 0" fill="#d9c9a0" />
              <path d="M0 0 L0 -3" stroke="#3a2a1a" strokeWidth="1" />
              <g transform={`translate(0 -4) scale(${0.9 + 0.2 * fl} ${0.9 + 0.3 * fl})`}>
                <path d="M0 -14 C 5 -7, 5 -2, 0 0 C -5 -2, -5 -7, 0 -14 Z" fill="#ffd36a" />
                <path d="M0 -8 C 2.2 -5, 2 -2, 0 0 C -2 -2, -2.2 -5, 0 -8 Z" fill="#fffbe8" />
              </g>
            </svg>
          </div>
        );
      })}
    </>
  );
};
