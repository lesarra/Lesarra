import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {shots} from './shots';
import {ShotScene} from './components/ShotScene';
import {Caption} from './components/Caption';
import {Atmosphere, GoldFlecks} from './components/Overlays';

const FPS = 30;
const TOTAL = Math.ceil(218.424 * FPS);
const XFADE = 12;

const starts = shots.map((s, i) => (i === 0 ? 0 : Math.round(s.start * FPS)));

export const Video: React.FC = () => {
  const frame = useCurrentFrame();
  const endFade = interpolate(frame, [TOTAL - 120, TOTAL - 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#0c0703'}}>
      <Audio src={staticFile('hat_knew.mp3')} />
      {shots.map((s, i) => {
        const from = starts[i];
        const next = i < shots.length - 1 ? starts[i + 1] : TOTAL;
        const hold = next - from;
        const dur = i < shots.length - 1 ? hold + XFADE : hold;
        return (
          <Sequence key={s.shot} from={from} durationInFrames={dur} layout="none">
            <ShotScene image={s.image} shot={s.shot} duration={dur} fadeIn={i === 0 ? 0 : XFADE} />
          </Sequence>
        );
      })}
      <Atmosphere />
      <GoldFlecks />
      {shots.map((s, i) => {
        if (!s.lyric) return null;
        const from = starts[i];
        const next = i < shots.length - 1 ? starts[i + 1] : TOTAL;
        return (
          <Sequence key={`c${s.shot}`} from={from} durationInFrames={next - from} layout="none">
            <Caption text={s.lyric} duration={next - from} big={s.shot === 7} />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{backgroundColor: '#050302', opacity: endFade}} />
    </AbsoluteFill>
  );
};
