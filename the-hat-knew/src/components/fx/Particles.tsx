import React from 'react';
import type {Fx} from '../../fx';
import {W, H, Timing, WORDS, clamp, lerp, r2, smooth, hump} from './util';
import {Star} from './Twinkle';

type Of<K extends Fx['kind']> = Extract<Fx, {kind: K}>;

/** bursts on each word onset while the shot is visible (or every 0.6 s without words) */
export const Sparks: React.FC<{fx: Of<'sparks'>; tm: Timing}> = ({fx, tm}) => {
  const onsets = WORDS.filter((w) => w.s >= tm.t0 - 0.05 && w.s < tm.t1).map((w) => w.s);
  const times: number[] = [];
  if (onsets.length >= 2) times.push(...onsets);
  else for (let s = tm.t0 + 0.2; s < tm.t1; s += 0.6) times.push(s);
  const live = times.filter((s) => tm.t >= s && tm.t - s < 1.1).slice(-4);
  const els: React.ReactNode[] = [];
  live.forEach((s, bi) => {
    const age = tm.t - s;
    for (let i = 0; i < 16; i++) {
      const seed = Math.round(s * 100) + i * 17;
      const ang = -Math.PI / 2 + (r2(seed, 1) - 0.5) * 2.5;
      const sp = 220 + r2(seed, 3) * 360;
      const x = fx.from.x * W + Math.cos(ang) * sp * age * (1 - age * 0.25);
      const y = fx.from.y * H + Math.sin(ang) * sp * age * (1 - age * 0.25) + 520 * age * age;
      const life = 0.7 + r2(seed, 3) * 0.4;
      const o = clamp(1 - age / life) ** 1.3;
      if (o <= 0) continue;
      const size = 5 + r2(seed, 4) * 7;
      els.push(
        <div
          key={`${bi}-${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: y,
            width: size,
            height: size,
            borderRadius: '50%',
            transform: 'translate(-50%,-50%)',
            background: `radial-gradient(circle, #fff 0%, ${fx.color} 55%, ${fx.color}00 100%)`,
            boxShadow: `0 0 ${size * 2.5}px ${fx.color}`,
            opacity: o,
          }}
        />,
      );
    }
  });
  // soft muzzle glow on the latest burst
  const last = live[live.length - 1];
  const gl = last === undefined ? 0 : Math.exp(-(tm.t - last) * 7);
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: `${fx.from.x * 100}%`,
          top: `${fx.from.y * 100}%`,
          width: 240,
          height: 240,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${fx.color} 0%, ${fx.color}00 70%)`,
          opacity: 0.8 * gl,
          mixBlendMode: 'screen',
        }}
      />
      {els}
    </>
  );
};

export const Sand: React.FC<{fx: Of<'sand'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const x0 = fx.from.x * W;
  const y0 = fx.from.y * H;
  const x1 = fx.to.x * W;
  const y1 = fx.to.y * H;
  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: Math.min(x0, x1) - 1.5,
          top: y0,
          width: 3 + Math.abs(x1 - x0),
          height: y1 - y0,
          background: `linear-gradient(to bottom, ${fx.color}00, ${fx.color}aa 20%, ${fx.color}cc)`,
          opacity: 0.55,
          filter: 'blur(0.6px)',
        }}
      />
      {Array.from({length: 22}).map((_, i) => {
        const u = (((t * 1.5 + r2(i, 1)) % 1) + 1) % 1;
        const e = u * u * 0.6 + u * 0.4;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: lerp(x0, x1, e) + (r2(i, 2) - 0.5) * 5,
              top: lerp(y0, y1, e),
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: fx.color,
              boxShadow: `0 0 4px ${fx.color}`,
              opacity: 0.9,
            }}
          />
        );
      })}
      <div
        style={{
          position: 'absolute',
          left: x1,
          top: y1,
          width: 56,
          height: 36,
          transform: 'translate(-50%,-60%)',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, ${fx.color} 0%, ${fx.color}00 70%)`,
          opacity: 0.5 + 0.15 * Math.sin(t * 5),
          mixBlendMode: 'screen',
        }}
      />
    </>
  );
};

export const Snow: React.FC<{tm: Timing}> = ({tm}) => {
  const t = tm.f / 30;
  return (
    <>
      {Array.from({length: 44}).map((_, i) => {
        const sp = 0.05 + r2(i, 1) * 0.07;
        const u = (((t * sp + r2(i, 2)) % 1) + 1) % 1;
        const size = 2.5 + r2(i, 3) * 5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${r2(i, 4) * 100 + Math.sin(t * 0.9 + i) * 1.6}%`,
              top: `${-4 + u * 108}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: 'radial-gradient(circle,#fff 0%,rgba(235,246,255,0.8) 50%,rgba(235,246,255,0) 100%)',
              opacity: 0.55 + r2(i, 5) * 0.4,
              filter: size > 5 ? 'blur(1px)' : undefined,
            }}
          />
        );
      })}
      {Array.from({length: 4}).map((_, i) => {
        const per = 2.2;
        const local = (((t - i * 0.6) % per) + per) % per;
        if (local > 0.9) return null;
        const s = hump(local / 0.9);
        return (
          <div key={`s${i}`} style={{position: 'absolute', left: `${12 + r2(i, 7) * 76}%`, top: `${10 + r2(i, 8) * 60}%`}}>
            <Star size={30} color="#d8efff" scale={s} rot={45} glow={0.6} />
          </div>
        );
      })}
    </>
  );
};

export const Fireflies: React.FC<{fx: Of<'fireflies'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  const b = fx.box;
  const n = Math.min(fx.count, 40);
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const cx = lerp(b.x0, b.x1, r2(i, 1));
        const cy = lerp(b.y0, b.y1, r2(i, 2));
        const ax = (b.x1 - b.x0) * (0.05 + r2(i, 3) * 0.08);
        const ay = (b.y1 - b.y0) * (0.05 + r2(i, 4) * 0.1);
        const x = cx + ax * Math.sin(t * (0.3 + r2(i, 5) * 0.4) + i) + ax * 0.5 * Math.sin(t * (0.8 + r2(i, 6) * 0.5) + i * 2);
        const y = cy + ay * Math.sin(t * (0.25 + r2(i, 7) * 0.4) + i * 3) + ay * 0.5 * Math.cos(t * (0.7 + r2(i, 8) * 0.5) + i);
        const pulse = 0.3 + 0.7 * Math.max(0, Math.sin(t * (1.2 + r2(i, 9) * 1.4) + i * 5)) ** 2;
        const size = 14 + r2(i, 10) * 14;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: size,
              height: size,
              transform: 'translate(-50%,-50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #fffde0 0%, #ffe98a 22%, rgba(255,214,90,0.35) 50%, rgba(255,214,90,0) 72%)',
              opacity: pulse,
              mixBlendMode: 'screen',
            }}
          />
        );
      })}
    </>
  );
};

export const Confetti: React.FC<{fx: Of<'confetti'>; tm: Timing}> = ({fx, tm}) => {
  const t = tm.f / 30;
  return (
    <>
      {Array.from({length: 30}).map((_, i) => {
        const sp = 0.16 + r2(i, 1) * 0.14;
        const u = (((t * sp + r2(i, 2)) % 1) + 1) % 1;
        const c = fx.colors[Math.floor(r2(i, 3) * fx.colors.length) % fx.colors.length];
        const flip = Math.cos(t * (3 + r2(i, 4) * 4) + i);
        const w = 9 + r2(i, 5) * 8;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${r2(i, 6) * 100 + Math.sin(t * 1.1 + i) * 2.5}%`,
              top: `${-5 + u * 110}%`,
              width: w,
              height: w * 1.5,
              background: `linear-gradient(135deg, #fff8 0%, ${c} 40%, ${c} 100%)`,
              opacity: 0.88 * smooth(u / 0.06) * (1 - smooth((u - 0.92) / 0.08)),
              transform: `rotate(${t * 60 * (r2(i, 7) - 0.5) + i * 40}deg) scaleX(${flip})`,
              boxShadow: `0 0 6px ${c}88`,
              borderRadius: 1,
            }}
          />
        );
      })}
    </>
  );
};
