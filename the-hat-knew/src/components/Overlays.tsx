import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import {GOLD, rand} from './theme';
import {lyrics} from '../lyrics';

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

const lyricStarts = lyrics.map((l) => l.start);
export const BeatPulse: React.FC = () => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const sec = frame / fps;
  let pulse = 0;
  for (const st of lyricStarts) {
    const dt = sec - st;
    if (dt >= 0 && dt < 0.7) pulse = Math.max(pulse, Math.exp(-dt * 7));
  }
  if (pulse < 0.01) return null;
  return <AbsoluteFill style={{backgroundColor: '#fff1d0', opacity: 0.02 * pulse * 1.5, mixBlendMode: 'screen'}} />;
};

const BOKEH = 16;
const MOTES = 34;
/** Light foreground dust + bokeh, drifting slowly. */
export const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const moon = env(frame / 30, BRIDGE);
  return (
    <AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
      {Array.from({length: BOKEH}).map((_, i) => {
        const size = 40 + rand(i + 300) * 110;
        const x = ((rand(i + 310) * 120 - 10 + frame * (0.004 + rand(i + 320) * 0.006) * (i % 2 ? 1 : -1)) % 120 + 120) % 120 - 10;
        const y = ((rand(i + 330) * 120 - frame * (0.006 + rand(i + 340) * 0.008)) % 120 + 120) % 120 - 10;
        const o = (0.05 + rand(i + 350) * 0.08) * (0.7 + 0.3 * Math.sin(frame / 40 + i));
        const c = moon > 0.5 ? '170,200,255' : '255,214,140';
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
              background: `radial-gradient(circle, rgba(${c},${o * 1.4}) 0%, rgba(${c},${o}) 55%, rgba(${c},0) 72%)`,
            }}
          />
        );
      })}
      {Array.from({length: MOTES}).map((_, i) => {
        const size = 1.5 + rand(i + 400) * 3;
        const x = (((rand(i + 410) * 100 + Math.sin(frame / 55 + i) * 2 + frame * 0.01) % 100) + 100) % 100;
        const y = (((rand(i + 420) * 100 - frame * (0.02 + rand(i + 430) * 0.03)) % 100) + 100) % 100;
        const o = 0.25 + 0.35 * Math.abs(Math.sin(frame / 18 + i * 1.7));
        return (
          <div
            key={`m${i}`}
            style={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: '50%',
              backgroundColor: `rgba(255,236,190,${o})`,
              boxShadow: '0 0 6px rgba(255,220,150,0.7)',
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};
