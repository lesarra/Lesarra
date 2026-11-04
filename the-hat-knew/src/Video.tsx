import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {shots} from './shots';
import {direction} from './direction';
import {lyrics} from './lyrics';
import {ShotScene} from './components/ShotScene';
import {Caption} from './components/Caption';
import {Atmosphere, BeatPulse, Dust, GoldFlecks} from './components/Overlays';
import {TRANSITION_FRAMES} from './components/Transitions';
import {useStorybookFonts} from './components/fonts';

const FPS = 30;
const TOTAL = Math.ceil(218.424 * FPS);

const cuts = shots.map((s, i) => (i === 0 ? 0 : Math.round(s.start * FPS)));
const dirOf = (shot: number) => direction[shot];
const inFrames = shots.map((s) => TRANSITION_FRAMES[dirOf(s.shot).transitionIn]);
// Each layer starts half a transition before its cut and ends when the next transition completes.
const layerFrom = shots.map((_, i) => (i === 0 ? 0 : cuts[i] - Math.floor(inFrames[i] / 2)));
const layerEnd = shots.map((_, i) => (i === shots.length - 1 ? TOTAL : layerFrom[i + 1] + inFrames[i + 1]));

const shotAt = (sec: number) => {
  let idx = 0;
  for (let i = 0; i < shots.length; i++) if (shots[i].start <= sec) idx = i;
  return shots[idx];
};

type Cue = {line: (typeof lyrics)[number]; from: number; dur: number; shot: number};
const cues: Cue[] = lyrics.map((line, i) => {
  const next = lyrics[i + 1];
  const a = line.start - 0.25;
  const b = Math.min(next ? next.start - 0.28 : Infinity, line.end + 0.8);
  const from = Math.max(0, Math.round(a * FPS));
  const to = Math.min(TOTAL, Math.max(from + 6, Math.round(b * FPS)));
  return {line, from, dur: to - from, shot: shotAt(line.start).shot};
});

export const Video: React.FC = () => {
  useStorybookFonts();
  const frame = useCurrentFrame();
  const endFade = interpolate(frame, [TOTAL - 120, TOTAL - 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{backgroundColor: '#0c0703'}}>
      <Audio src={staticFile('hat_knew.mp3')} />
      {shots.map((s, i) => {
        const d = dirOf(s.shot);
        const len = layerEnd[i] - layerFrom[i];
        const hasNext = i < shots.length - 1;
        return (
          <Sequence key={s.shot} from={layerFrom[i]} durationInFrames={len} layout="none">
            <ShotScene
              image={s.image}
              shot={s.shot}
              motion={d.motion}
              len={len}
              inType={d.transitionIn}
              inFrames={inFrames[i]}
              outType={hasNext ? dirOf(shots[i + 1].shot).transitionIn : undefined}
              outFrames={hasNext ? inFrames[i + 1] : undefined}
            />
          </Sequence>
        );
      })}
      <Atmosphere />
      <Dust />
      <GoldFlecks />
      <BeatPulse />
      {cues.map((c, i) => {
        const d = dirOf(c.shot);
        return (
          <Sequence key={`c${i}`} from={c.from} durationInFrames={c.dur} layout="none">
            <Caption
              line={c.line}
              from={c.from}
              dur={c.dur}
              pos={d.caption === 'none' ? 'bottom' : d.caption}
              accent={d.accent}
              style={d.lyricStyle}
            />
          </Sequence>
        );
      })}
      <AbsoluteFill style={{backgroundColor: '#050302', opacity: endFade}} />
    </AbsoluteFill>
  );
};
