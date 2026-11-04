import React from 'react';
import {AbsoluteFill, Easing, interpolate, useCurrentFrame} from 'remotion';
import {DECOR_FONT, rand} from './theme';

const TEXT = 'The Hat Knew';
const FONT_SIZE = 160;
const REVEAL_START = 10;
const STEP = 4.5;
const REVEAL_LEN = 20;
const DISSOLVE_START = 105; // 3.5 s
const c01 = (v: number) => Math.min(1, Math.max(0, v));

const Letter: React.FC<{ch: string; i: number; frame: number; dur: number}> = ({ch, i, frame, dur}) => {
  if (ch === ' ') return <span style={{display: 'inline-block', width: FONT_SIZE * 0.34}} />;
  const start = REVEAL_START + i * STEP;
  const p = c01((frame - start) / REVEAL_LEN);
  const e = Easing.out(Easing.cubic)(p);
  const dStart = DISSOLVE_START + i * 2.2;
  const dLen = Math.max(12, dur - 12 - dStart);
  const d = c01((frame - dStart) / dLen);
  const letterOpacity = e * (1 - c01(d * 2.2));
  const blur = (1 - e) * 22 + d * 6;
  const glintP = c01((frame - start - REVEAL_LEN * 0.6) / 14);
  const glintOn = glintP > 0 && glintP < 1;
  return (
    <span style={{position: 'relative', display: 'inline-block'}}>
      <span
        style={{
          display: 'inline-block', opacity: letterOpacity, filter: `blur(${blur}px) drop-shadow(0 4px 6px rgba(0,0,0,0.7))`,
          transform: `translateY(${(1 - e) * 26}px) scale(${1.15 - 0.15 * e})`,
          backgroundImage: 'linear-gradient(180deg,#fff2b8 0%,#f2cf6a 38%,#c8902c 62%,#f6dd8c 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          textShadow: 'none',
        }}
      >
        {ch}
      </span>
      {glintOn ? (
        <svg
          width={80} height={80} viewBox="-40 -40 80 80"
          style={{position: 'absolute', left: FONT_SIZE * 0.3 - 40, top: FONT_SIZE * 0.22 - 40, pointerEvents: 'none'}}
        >
          <g transform={`rotate(${glintP * 40}) scale(${Math.sin(glintP * Math.PI) * 1.1})`}>
            <path d="M0 -38 Q3 -3 38 0 Q3 3 0 38 Q-3 3 -38 0 Q-3 -3 0 -38 Z" fill="#fffbe0" />
          </g>
        </svg>
      ) : null}
      {d > 0 && d < 1
        ? Array.from({length: 16}).map((_, k) => {
            const seed = i * 31 + k * 7;
            const ang = rand(seed) * Math.PI * 2;
            const sp = 80 + rand(seed + 1) * 260;
            const ox = (rand(seed + 2) - 0.5) * FONT_SIZE * 0.6 + FONT_SIZE * 0.35;
            const oy = rand(seed + 3) * FONT_SIZE * 0.75 + FONT_SIZE * 0.1;
            const pd = c01(d * 1.15 - rand(seed + 4) * 0.15);
            const ee = 1 - Math.pow(1 - pd, 2);
            const x = ox + Math.cos(ang) * sp * ee * 0.9;
            const y = oy + Math.sin(ang) * sp * ee * 0.5 - 200 * ee;
            const size = 3 + rand(seed + 5) * 6;
            return (
              <span
                key={k}
                style={{
                  position: 'absolute', left: x, top: y, width: size, height: size, borderRadius: '50%',
                  background: 'radial-gradient(circle,#fff7d0,#f0c14a 65%,rgba(240,190,60,0))',
                  opacity: (1 - pd) * Math.min(1, d * 8) , boxShadow: '0 0 8px rgba(255,205,90,0.9)',
                }}
              />
            );
          })
        : null}
    </span>
  );
};

export const TitleDrop: React.FC<{durationInFrames: number}> = ({durationInFrames}) => {
  const frame = useCurrentFrame();
  const dur = durationInFrames;
  const bgIn = interpolate(frame, [0, 24, dur - 30, dur - 4], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const flourish = c01((frame - 62) / 38);
  const flourishE = Easing.inOut(Easing.cubic)(flourish);
  const flourishOut = 1 - c01((frame - (DISSOLVE_START + 6)) / 22);
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <AbsoluteFill
        style={{background: 'radial-gradient(ellipse 62% 40% at 50% 50%,rgba(8,4,2,0.85) 0%,rgba(8,4,2,0.6) 55%,rgba(8,4,2,0) 100%)', opacity: bgIn}}
      />
      {/* drifting gold dust */}
      {Array.from({length: 46}).map((_, k) => {
        const x = rand(k + 100) * 1920;
        const speed = 0.4 + rand(k + 110) * 0.9;
        const baseY = rand(k + 120) * 1300;
        const y = 1180 - ((baseY + frame * speed * 3) % 1300);
        const size = 2 + rand(k + 130) * 4;
        const a = (0.3 + 0.5 * Math.abs(Math.sin(frame * 0.07 + k))) * bgIn;
        return (
          <div
            key={k}
            style={{
              position: 'absolute', left: x + Math.sin(frame * 0.03 + k) * 20, top: y, width: size, height: size, borderRadius: '50%',
              background: '#f4d27a', opacity: a, boxShadow: '0 0 6px rgba(255,210,100,0.9)',
            }}
          />
        );
      })}
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'center'}}>
        <div style={{position: 'relative', transform: 'translateY(-30px)'}}>
          <div style={{fontFamily: DECOR_FONT, fontWeight: 900, fontSize: FONT_SIZE, lineHeight: 1, whiteSpace: 'nowrap', letterSpacing: 4}}>
            {TEXT.split('').map((ch, i) => (
              <Letter key={i} ch={ch} i={i} frame={frame} dur={dur} />
            ))}
          </div>
          <svg width={1280} height={80} viewBox="0 0 1280 80" style={{display: 'block', margin: '10px auto 0', opacity: flourishOut, overflow: 'visible', filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.7))'}}>
            <defs>
              <linearGradient id="flGold" x1="0" x2="1">
                <stop offset="0" stopColor="#c8902c" />
                <stop offset="0.5" stopColor="#fff0b0" />
                <stop offset="1" stopColor="#c8902c" />
              </linearGradient>
            </defs>
            {[false, true].map((m) => (
              <path
                key={String(m)}
                d="M640 40 C590 40 560 18 510 26 C455 35 440 62 380 58 C310 53 270 20 190 30 C120 38 80 52 24 40"
                transform={m ? 'translate(1280 0) scale(-1 1)' : undefined}
                fill="none" stroke="url(#flGold)" strokeWidth={4} strokeLinecap="round" pathLength={1}
                strokeDasharray={1} strokeDashoffset={1 - flourishE}
              />
            ))}
            <g opacity={c01(flourish * 3)} transform="translate(640 40)">
              <path d="M0 -12 L10 0 L0 12 L-10 0 Z" fill="#f6dd8c" />
              <circle cx={-26} cy={0} r={3} fill="#f6dd8c" />
              <circle cx={26} cy={0} r={3} fill="#f6dd8c" />
            </g>
          </svg>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
