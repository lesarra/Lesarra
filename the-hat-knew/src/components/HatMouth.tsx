import React from 'react';
import {Img} from 'remotion';
import type {Mouth} from '../fx';
import {WORDS, clamp} from './fx/util';

const RISE = 0.05;
const FALL = 0.08;

/** 0..1 mouth opening at absolute time t (seconds), driven by sung word timings. */
export const mouthOpen = (t: number): number => {
  let open = 0;
  for (const w of WORDS) {
    if (t < w.s - 0.001 || t > w.e + FALL + 0.01) continue;
    const dur = w.e - w.s;
    const holdEnd = Math.max(w.s + RISE, w.e - 0.05);
    let v: number;
    if (t < w.s + RISE) v = (t - w.s) / RISE;
    else if (t <= holdEnd) v = 1;
    else v = 1 - (t - holdEnd) / (FALL + 0.05);
    let amp = 0.8;
    if (dur > 0.4) amp = 0.72 + 0.28 * Math.sin(((t - w.s) / 0.17) * Math.PI * 0.9) ** 2;
    open = Math.max(open, clamp(v) * amp);
  }
  return clamp(open);
};

/** Second copy of the shot image clipped to the hat's mouth ellipse (feathered), stretched vertically while singing. */
export const HatMouth: React.FC<{mouth: Mouth; src: string; t: number}> = ({mouth, src, t}) => {
  const open = mouthOpen(t);
  if (open < 0.01) return null;
  const k = 1 + open * 0.1 * (mouth.strength ?? 1) * 1.0;
  const px = mouth.x * 100;
  const py = mouth.y * 100;
  const rx = mouth.rx * 1.6 * 1920;
  const ry = mouth.ry * 1.6 * 1080;
  const mask = `radial-gradient(ellipse ${rx}px ${ry}px at ${px}% ${py}%, #000 55%, rgba(0,0,0,0) 100%)`;
  return (
    <div style={{position: 'absolute', inset: 0, WebkitMaskImage: mask, maskImage: mask}}>
      <Img
        src={src}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transformOrigin: `${px}% ${py}%`,
          transform: `scale(1, ${k})`,
        }}
      />
    </div>
  );
};
