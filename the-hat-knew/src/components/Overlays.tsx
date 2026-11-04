import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {GOLD, rand} from './theme';

const BRIDGE: [number, number] = [142, 172];
const FINAL: [number, number] = [172, 208];

const env = (sec: number, [a, b]: [number, number], ramp = 2.5) =>
  interpolate(sec, [a - ramp, a, b, b + ramp], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sec = frame / fps;
  const flicker =
    0.5 +
    0.25 * Math.sin(frame / 7.3) +
    0.15 * Math.sin(frame / 3.1 + 1.7) +
    0.1 * Math.sin(frame / 1.9 + 4);
  const moon = env(sec, BRIDGE);
  const warm = 0.06 + 0.07 * flicker;

  return (
    <>
      {/* candle warmth */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 50% 62%, rgba(255,170,70,${warm * (1 - moon * 0.8)}) 0%, rgba(255,140,40,0) 70%)`,
          mixBlendMode: 'soft-light',
        }}
      />
      <AbsoluteFill
        style={{backgroundColor: `rgba(255,190,110,${0.05 * (1 - moon)})`, mixBlendMode: 'multiply'}}
      />
      {/* moonlight grade */}
      <AbsoluteFill
        style={{backgroundColor: `rgba(70,100,190,${0.28 * moon})`, mixBlendMode: 'color'}}
      />
      <AbsoluteFill
        style={{backgroundColor: `rgba(20,35,90,${0.22 * moon})`, mixBlendMode: 'multiply'}}
      />
      {/* parchment vignette */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0) 55%, rgba(40,22,8,0.42) 85%, rgba(20,10,3,0.7) 100%)',
        }}
      />
      <AbsoluteFill
        style={{boxShadow: 'inset 0 0 160px 30px rgba(60,35,12,0.35)'}}
      />
    </>
  );
};

const FLECKS = 46;
export const GoldFlecks: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sec = frame / fps;
  const o = env(sec, FINAL, 1.5);
  if (o <= 0) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none', opacity: o}}>
      {Array.from({length: FLECKS}).map((_, i) => {
        const speed = 0.35 + rand(i + 1) * 0.6; // cycles per 10 s
        const phase = rand(i + 50);
        const p = (((frame / fps) * speed) / 10 + phase) % 1;
        const x = rand(i + 100) * 100 + Math.sin(frame / 40 + i) * 2.5;
        const y = 108 - p * 120;
        const size = 4 + rand(i + 200) * 9;
        const tw = 0.55 + 0.45 * Math.sin(frame / 6 + i * 2.3);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              background: `radial-gradient(circle, #fff6c8 0%, ${GOLD} 45%, rgba(232,197,106,0) 75%)`,
              opacity: tw * 0.9,
              boxShadow: `0 0 ${size * 2}px ${GOLD}`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
