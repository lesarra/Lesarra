import React from 'react';
import {AbsoluteFill, Easing, Img, staticFile, useCurrentFrame} from 'remotion';
import type {Motion, Transition} from '../direction';
import {clamp01, rand} from './theme';
import {TransitionLayer, slideOut, transitionEase} from './Transitions';

const W = 1920;
const H = 1080;
const ease = Easing.bezier(0.45, 0.05, 0.35, 1);
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;

type Pose = {s: number; x: number; y: number; r: number}; // x,y px, r deg

/** Camera pose for the foreground image. Always guarantees frame coverage. */
const pose = (m: Motion, f: number, n: number, shot: number): Pose => {
  const u = ease(clamp01(f / Math.max(1, n)));
  let s = 1.1;
  let x = 0; // -1..1 fraction of available travel
  let y = 0;
  let r = 0;
  let jx = 0;
  let jy = 0;
  switch (m) {
    case 'push-in':
      s = lerp(1.05, 1.17, u);
      x = (rand(shot * 3) - 0.5) * 0.7 * u;
      y = (rand(shot * 5) - 0.5) * 0.5 * u;
      break;
    case 'pull-out':
      s = lerp(1.17, 1.05, u);
      x = (rand(shot * 3) - 0.5) * 0.7 * (1 - u);
      y = (rand(shot * 5) - 0.5) * 0.5 * (1 - u);
      break;
    case 'pan-left':
      s = lerp(1.12, 1.15, u);
      x = lerp(0.95, -0.95, u);
      break;
    case 'pan-right':
      s = lerp(1.12, 1.15, u);
      x = lerp(-0.95, 0.95, u);
      break;
    case 'pan-up':
      s = lerp(1.12, 1.15, u);
      y = lerp(0.95, -0.95, u);
      break;
    case 'pan-down':
      s = lerp(1.12, 1.15, u);
      y = lerp(-0.95, 0.95, u);
      break;
    case 'drift':
      s = lerp(1.1, 1.16, u);
      x = lerp(-0.8, 0.8, u);
      y = lerp(0.6, -0.6, u);
      r = lerp(-0.6, 0.6, u);
      break;
    case 'float':
      s = lerp(1.09, 1.13, u);
      x = Math.sin(f / 38) * 0.35;
      y = Math.sin(f / 27 + 1) * 0.3;
      r = Math.sin(f / 55) * 0.5;
      break;
    case 'shake': {
      s = lerp(1.1, 1.15, u);
      const A = 26 * Math.exp(-f / 10);
      jx = A * Math.sin(f * 2.3);
      jy = A * Math.cos(f * 3.1);
      r = (A / 26) * 1.1 * Math.sin(f * 1.7);
      break;
    }
    case 'tremble':
      s = lerp(1.08, 1.12, u);
      jx = 3.2 * (Math.sin(f * 1.7) + 0.6 * Math.sin(f * 4.3 + 1));
      jy = 3.2 * (Math.cos(f * 2.1) + 0.6 * Math.sin(f * 5.1));
      r = 0.12 * Math.sin(f * 1.3);
      break;
    case 'zoom-punch':
      s = 1.08 + 0.18 * Math.pow(1 - clamp01(f / 18), 3) + 0.04 * u;
      x = (rand(shot * 3) - 0.5) * 0.4 * u;
      break;
  }
  // coverage: rotation and jitter must stay inside the zoom margin
  const margin = s - 1 - 0.035 * Math.abs(r);
  const mx = Math.max(0, margin * (W / 2));
  const my = Math.max(0, margin * (H / 2));
  const cx = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
  return {s, x: cx(x * mx * 0.92 + jx, mx), y: cx(y * my * 0.92 + jy, my), r};
};

const Stack: React.FC<{image: string; motion: Motion; shot: number; len: number}> = ({
  image,
  motion,
  shot,
  len,
}) => {
  const f = useCurrentFrame();
  const p = pose(motion, f, len, shot);
  const src = staticFile(image);
  return (
    <AbsoluteFill style={{backgroundColor: '#120c07', overflow: 'hidden'}}>
      {/* parallax back plate: low-res blurred copy, larger, moves against the foreground */}
      <Img
        src={src}
        style={{
          position: 'absolute',
          left: W / 2 - 96,
          top: H / 2 - 54,
          width: 192,
          height: 108,
          filter: 'blur(2.2px) saturate(1.15) brightness(0.85)',
          transform: `translate(${-p.x * 0.55}px, ${-p.y * 0.55}px) scale(${10.8 * (1.12 + (p.s - 1) * 0.3)})`,
        }}
      />
      <AbsoluteFill
        style={{
          transform: `translate(${p.x}px, ${p.y}px) rotate(${p.r}deg) scale(${p.s})`,
          WebkitMaskImage: 'radial-gradient(ellipse 78% 82% at 50% 50%, #000 72%, rgba(0,0,0,0.55) 100%)',
          maskImage: 'radial-gradient(ellipse 78% 82% at 50% 50%, #000 72%, rgba(0,0,0,0.55) 100%)',
        }}
      >
        <Img src={src} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const ShotScene: React.FC<{
  image: string;
  shot: number;
  motion: Motion;
  len: number;
  inType: Transition;
  inFrames: number;
  outType?: Transition;
  outFrames?: number;
}> = ({image, shot, motion, len, inType, inFrames, outType, outFrames}) => {
  const frame = useCurrentFrame();
  const raw = frame / Math.max(1, inFrames);
  let exit: React.CSSProperties | undefined;
  if (outType && outFrames) {
    const q = transitionEase(clamp01((frame - (len - outFrames)) / outFrames));
    if (q > 0) {
      const o = slideOut(outType, q);
      if (o.x !== 0 || o.y !== 0) {
        const blur = Math.sin(Math.PI * q) * 5;
        exit = {
          transform: `translate(${o.x}px, ${o.y}px)`,
          filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined,
        };
      }
    }
  }
  return (
    <TransitionLayer type={inType} raw={raw}>
      <AbsoluteFill style={exit}>
        <Stack image={image} motion={motion} shot={shot} len={len} />
      </AbsoluteFill>
    </TransitionLayer>
  );
};
