import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {shots} from './shots';
import {direction} from './direction';
import type {CaptionPos} from './direction';
import {lyrics} from './lyrics';
import {AUDIO_FILE, END_START, FINALE_MONTAGE, TITLE_DROP, TOTAL_FRAMES} from './timeline';
import {ShotScene} from './components/ShotScene';
import {Caption} from './components/Caption';
import {Atmosphere, BeatPulse, Dust, GoldFlecks} from './components/Overlays';
import {TRANSITION_FRAMES, TransitionLayer} from './components/Transitions';
import {useStorybookFonts} from './components/fonts';
import {EndSequence} from './components/end/EndSequence';
import {TitleDrop} from './components/TitleDrop';
import {clamp01} from './components/theme';

const FPS = 30;
const TOTAL = TOTAL_FRAMES;
const MONTAGE_END = 202.7; // back to the Great Hall for "All along."
const MONTAGE_TRANSITION = 8;

const cuts = shots.map((s, i) => (i === 0 ? 0 : Math.round(s.start * FPS)));
const dirOf = (shot: number) => direction[shot];
const inFrames = shots.map((s) => TRANSITION_FRAMES[dirOf(s.shot).transitionIn]);
// Each layer starts half a transition before its cut and ends when the next transition completes.
const layerFrom = shots.map((_, i) => (i === 0 ? 0 : cuts[i] - Math.floor(inFrames[i] / 2)));
const layerEnd = shots.map((_, i) => (i === shots.length - 1 ? TOTAL : layerFrom[i + 1] + inFrames[i + 1]));
const LAST = shots.length - 1;

const shotAt = (sec: number) => {
  let idx = 0;
  for (let i = 0; i < shots.length; i++) if (shots[i].start <= sec) idx = i;
  return shots[idx];
};

type Cue = {line: (typeof lyrics)[number]; from: number; dur: number; shot: number; pos?: CaptionPos};
const isSly = (t: string) => /^\W*SLYTHERIN!\W*$/.test(t);
const cues: Cue[] = lyrics.map((line, i) => {
  const next = lyrics[i + 1];
  const prev = lyrics[i - 1];
  let a = line.start - 0.25;
  let b = Math.min(next ? next.start - 0.28 : Infinity, line.end + 0.8);
  // the very last "All along." holds to the end of the line
  if (/all along/i.test(line.text) && line.start > 200) b = line.end + 0.35;
  // the big "SLYTHERIN!" lands exactly on the shout and holds to the end of its shot;
  // the line sung under it ("Read her like a book,") drops to the bottom so the two never collide
  let pos: CaptionPos | undefined;
  if (isSly(line.text)) {
    const sh = shots.findIndex((s) => s.shot === shotAt(line.start).shot);
    a = line.start - 0.03;
    b = (shots[sh + 1]?.start ?? line.end + 1.5) - 0.12;
  }
  if (prev && isSly(prev.text)) pos = 'bottom';
  const from = Math.max(0, Math.round(a * FPS));
  const to = Math.min(TOTAL, Math.max(from + 6, Math.round(b * FPS)));
  return {line, from, dur: to - from, shot: shotAt(line.start).shot, pos};
});

// Finale montage flashes (inside shot 62)
const MONTAGE_SHOTS = [45, 57, 58, 54];
const montage = FINALE_MONTAGE.map((m, i) => {
  const from = Math.round(m.start * FPS);
  const to = Math.round((FINALE_MONTAGE[i + 1]?.start ?? MONTAGE_END) * FPS);
  return {...m, shot: MONTAGE_SHOTS[i], from, dur: to - from};
});
const RETURN_FRAME = Math.round(MONTAGE_END * FPS);

/** End sequence wrapped in the shot's incoming transition. */
const EndLayer: React.FC<{len: number; inType: (typeof direction)[number]['transitionIn']; inF: number; layerStart: number}> = ({
  inType,
  inF,
  layerStart,
}) => {
  const frame = useCurrentFrame();
  return (
    <TransitionLayer type={inType} raw={frame / Math.max(1, inF)}>
      <EndSequence layerStartFrame={layerStart} />
    </TransitionLayer>
  );
};

/** Big gold flash as the Great Hall returns for "All along." */
const GoldBurst: React.FC = () => {
  const f = useCurrentFrame(); // 0 == RETURN_FRAME - 3
  const up = clamp01(f / 3);
  const down = clamp01((f - 3) / 20);
  const o = up * (1 - down) * (1 - down);
  return (
    <AbsoluteFill
      style={{
        opacity: o,
        background: 'radial-gradient(circle at 50% 55%, #fffbe2 0%, #f8d56a 38%, rgba(214,150,40,0.85) 75%, rgba(150,95,20,0.8) 100%)',
      }}
    />
  );
};

export const Video: React.FC = () => {
  useStorybookFonts();
  const titleFrom = Math.round(TITLE_DROP.start * FPS);
  const titleDur = Math.round((TITLE_DROP.end - TITLE_DROP.start) * FPS);

  return (
    <AbsoluteFill style={{backgroundColor: '#0c0703'}}>
      <Audio src={staticFile(AUDIO_FILE)} />
      {shots.map((s, i) => {
        const d = dirOf(s.shot);
        const len = layerEnd[i] - layerFrom[i];
        const hasNext = i < shots.length - 1;
        return (
          <Sequence key={s.shot} from={layerFrom[i]} durationInFrames={len} layout="none">
            {i === LAST ? (
              <EndLayer len={len} inType={d.transitionIn} inF={inFrames[i]} layerStart={layerFrom[i]} />
            ) : (
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
            )}
          </Sequence>
        );
      })}
      {/* finale montage: quick memory flashes above shot 62 */}
      {montage.map((m) => (
        <Sequence key={`m${m.shot}`} from={m.from} durationInFrames={m.dur} layout="none">
          <ShotScene
            image={m.image}
            shot={m.shot}
            motion="zoom-punch"
            len={m.dur}
            inType="flash-gold"
            inFrames={MONTAGE_TRANSITION}
          />
        </Sequence>
      ))}
      <Sequence from={RETURN_FRAME - 3} durationInFrames={30} layout="none">
        <GoldBurst />
      </Sequence>
      <Atmosphere />
      <Dust />
      <GoldFlecks />
      <BeatPulse />
      <Sequence from={titleFrom} durationInFrames={titleDur} layout="none">
        <TitleDrop durationInFrames={titleDur} />
      </Sequence>
      {cues.map((c, i) => {
        const d = dirOf(c.shot);
        if (c.from >= Math.round(END_START * FPS)) return null;
        return (
          <Sequence key={`c${i}`} from={c.from} durationInFrames={c.dur} layout="none">
            <Caption
              line={c.line}
              from={c.from}
              dur={c.dur}
              pos={c.pos ?? (d.caption === 'none' ? 'bottom' : d.caption)}
              accent={d.accent}
              style={d.lyricStyle}
              tone={d.tone}
              hook={d.hook}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
