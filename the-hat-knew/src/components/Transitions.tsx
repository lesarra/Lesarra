import React from 'react';
import {AbsoluteFill, Easing, Img, staticFile} from 'remotion';
import type {Transition} from '../direction';
import {clamp01, rand} from './theme';

const W = 1920;
const H = 1080;

export const TRANSITION_FRAMES: Record<Transition, number> = {
  'fade-black': 20,
  crossfade: 16,
  'ink-bleed': 22,
  'page-turn': 20,
  iris: 18,
  'blur-dissolve': 18,
  'slide-left': 14,
  'slide-right': 14,
  'slide-up': 14,
  'flash-gold': 18,
  'flash-green': 18,
  burn: 22,
  frost: 22,
};

export const transitionEase = Easing.bezier(0.45, 0.05, 0.3, 1);

/** Outgoing-layer offset (px) for push transitions; q is eased 0..1 progress. */
export const slideOut = (type: Transition, q: number): {x: number; y: number} => {
  if (type === 'slide-left') return {x: -q * W, y: 0};
  if (type === 'slide-right') return {x: q * W, y: 0};
  if (type === 'slide-up') return {x: 0, y: -q * H};
  return {x: 0, y: 0};
};

// ---------- organic blot masks (ink-bleed, burn) ----------
type Blot = {x: number; y: number; d: number; g: number; a: number};
const mkBlots = (seed: number, n: number, bias: [number, number, number, number]): Blot[] =>
  Array.from({length: n}, (_, k) => ({
    x: bias[0] + rand(seed + k * 7 + 1) * bias[1],
    y: bias[2] + rand(seed + k * 7 + 2) * bias[3],
    d: rand(seed + k * 7 + 3) * 0.4,
    g: 0.55 + rand(seed + k * 7 + 4) * 0.45,
    a: 0.7 + rand(seed + k * 7 + 5) * 0.7,
  }));
const INK_BLOTS = mkBlots(10, 9, [8, 84, 10, 80]);
const BURN_BLOTS = mkBlots(40, 10, [45, 55, 40, 60]);

const blotMask = (blots: Blot[], p: number, extra: number, soft: number) => {
  const parts: string[] = [];
  for (const b of blots) {
    const pk = clamp01((p - b.d) / (1 - b.d));
    let r = Math.pow(pk, 1.05) * 2400 * b.g;
    if (p > 0.8) r += ((p - 0.8) / 0.2) * 1700;
    if (r <= 1) continue;
    r += extra;
    const rx = r;
    const ry = r * b.a;
    const stop = Math.max(0, 100 - (soft / Math.min(rx, ry)) * 100);
    parts.push(
      `radial-gradient(ellipse ${rx.toFixed(0)}px ${ry.toFixed(0)}px at ${b.x.toFixed(1)}% ${b.y.toFixed(1)}%, #000 ${stop.toFixed(1)}%, transparent 100%)`,
    );
  }
  return parts.length ? parts.join(',') : 'linear-gradient(transparent, transparent)';
};
const maskStyle = (img: string): React.CSSProperties => ({
  WebkitMaskImage: img,
  maskImage: img,
});

const Fill: React.FC<{style?: React.CSSProperties; children?: React.ReactNode}> = ({style, children}) => (
  <AbsoluteFill style={style}>{children}</AbsoluteFill>
);

const Flash: React.FC<{p: number; c0: string; c1: string; c2: string; children: React.ReactNode}> = ({
  p,
  c0,
  c1,
  c2,
  children,
}) => {
  const imgO = clamp01((p - 0.42) / 0.14);
  const f = Math.pow(Math.max(0, 1 - Math.abs(p - 0.5) / 0.5), 1.2);
  return (
    <>
      <Fill style={{opacity: imgO}}>{children}</Fill>
      <Fill style={{background: `radial-gradient(circle at 50% 50%, ${c0} 0%, ${c1} 50%, ${c2} 100%)`, opacity: f}} />
    </>
  );
};

const frostPoly = (e: number, pad = 0) => {
  const N = 22;
  const pts: string[] = ['0px 0px'];
  for (let k = 0; k <= N; k++) {
    const y = (k / N) * H;
    const jag = (rand(k * 3 + 5) - 0.5) * 80 + (k % 2 ? 46 : -26);
    pts.push(`${(e + jag + pad).toFixed(1)}px ${y.toFixed(1)}px`);
  }
  pts.push(`0px ${H}px`);
  return `polygon(${pts.join(',')})`;
};

type Props = {type: Transition; raw: number; children: React.ReactNode};

export const TransitionLayer: React.FC<Props> = ({type, raw, children}) => {
  if (raw >= 1) return <AbsoluteFill>{children}</AbsoluteFill>;
  const r0 = clamp01(raw);
  const p = type === 'burn' || type === 'ink-bleed' ? 0.6 * r0 + 0.4 * transitionEase(r0) : transitionEase(r0);

  switch (type) {
    case 'crossfade':
      return <Fill style={{opacity: p}}>{children}</Fill>;

    case 'fade-black':
      return (
        <>
          <Fill style={{backgroundColor: '#050302', opacity: Math.min(1, p * 2.2)}} />
          <Fill style={{opacity: clamp01((p - 0.5) * 2)}}>{children}</Fill>
        </>
      );

    case 'blur-dissolve':
      return (
        <Fill style={{opacity: clamp01(p * 1.4), filter: `blur(${((1 - p) * 20).toFixed(1)}px)`}}>
          {children}
        </Fill>
      );

    case 'slide-left':
    case 'slide-right':
    case 'slide-up': {
      const q = 1 - p;
      const x = type === 'slide-left' ? q * W : type === 'slide-right' ? -q * W : 0;
      const y = type === 'slide-up' ? q * H : 0;
      const blur = Math.sin(Math.PI * p) * 5;
      return (
        <Fill style={{transform: `translate(${x}px, ${y}px)`, filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined}}>
          {children}
        </Fill>
      );
    }

    case 'iris': {
      const r = p * 1130;
      return (
        <>
          <Fill style={{clipPath: `circle(${r.toFixed(1)}px at 50% 50%)`}}>{children}</Fill>
          <div
            style={{
              position: 'absolute',
              left: W / 2 - r,
              top: H / 2 - r,
              width: r * 2,
              height: r * 2,
              borderRadius: '50%',
              boxShadow: `0 0 ${18 + 30 * (1 - p)}px 4px rgba(240,200,110,${0.85 * (1 - p * 0.6)}), inset 0 0 22px 2px rgba(240,200,110,${0.55 * (1 - p)})`,
              border: '2px solid rgba(255,226,150,0.85)',
              opacity: p < 0.02 ? 0 : 1,
            }}
          />
        </>
      );
    }

    case 'ink-bleed':
      return (
        <>
          <Fill
            style={{
              ...maskStyle(blotMask(INK_BLOTS, p, 34, 30)),
              backgroundColor: '#1a0f08',
              opacity: 0.92 * (1 - 0.5 * p),
            }}
          />
          <Fill style={maskStyle(blotMask(INK_BLOTS, p, 0, 12))}>{children}</Fill>
        </>
      );

    case 'burn':
      return (
        <>
          <Fill style={{...maskStyle(blotMask(BURN_BLOTS, p, 58, 52)), backgroundColor: 'rgba(255,110,20,0.9)'}} />
          <Fill style={{...maskStyle(blotMask(BURN_BLOTS, p, 20, 12)), backgroundColor: '#150803'}} />
          <Fill style={{...maskStyle(blotMask(BURN_BLOTS, p, 6, 5)), backgroundColor: '#ffd77a'}} />
          <Fill style={maskStyle(blotMask(BURN_BLOTS, p, 0, 3))}>{children}</Fill>
        </>
      );

    case 'frost': {
      const e = p * (W + 500) - 220;
      return (
        <>
          <Fill style={{clipPath: frostPoly(e, 26), backgroundColor: '#e6f6ff', opacity: 0.9}} />
          <Fill style={{clipPath: frostPoly(e, 60), backgroundColor: 'rgba(150,200,240,0.45)'}} />
          <Fill style={{clipPath: frostPoly(e, 0)}}>
            {children}
            <div
              style={{
                position: 'absolute',
                left: e - 260,
                top: 0,
                width: 360,
                height: H,
                background: 'linear-gradient(90deg, rgba(215,240,255,0) 0%, rgba(215,240,255,0.8) 100%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: e - 260,
                top: 0,
                width: 360,
                height: H,
                backgroundImage:
                  'repeating-linear-gradient(60deg, rgba(255,255,255,0.55) 0 1.5px, transparent 1.5px 17px), repeating-linear-gradient(-58deg, rgba(255,255,255,0.4) 0 1px, transparent 1px 23px)',
                WebkitMaskImage: 'linear-gradient(90deg, transparent, #000)',
                maskImage: 'linear-gradient(90deg, transparent, #000)',
              }}
            />
            <Fill style={{backgroundColor: `rgba(190,225,255,${0.4 * (1 - p)})`}} />
          </Fill>
        </>
      );
    }

    case 'page-turn': {
      // The incoming image is a page swinging over from the left (hinge on its left edge).
      // The hinge glides in from slightly right of the frame edge so the parchment back is seen first.
      const deg = 180 - 180 * p; // the page lies away from the camera as it settles onto the stack
      const rad = (deg * Math.PI) / 180;
      const hinge = W * 0.42 * Math.sin(Math.PI * p);
      const flat = Math.abs(Math.cos(rad)); // 1 = facing camera
      const front = deg < 90;
      const zf = -W * Math.sin(rad);
      const farX = hinge + (W * Math.cos(rad) * 2400) / (2400 - zf); // projected free edge
      const coverEdge = front ? farX : hinge;
      const shade = 1 - flat; // 0 facing, 1 edge-on
      const shadowO = clamp01(1.0 * (0.45 + 0.55 * shade) * (1 - p * 0.7));
      return (
        <>
          {/* soft shadow cast on the uncovered outgoing page */}
          <div
            style={{
              position: 'absolute',
              left: coverEdge - 40,
              top: 0,
              width: 520,
              height: H,
              opacity: shadowO,
              background:
                'linear-gradient(90deg, rgba(20,10,2,0.85) 0%, rgba(20,10,2,0.5) 18%, rgba(20,10,2,0.2) 50%, rgba(20,10,2,0) 100%)',
            }}
          />
          <AbsoluteFill
            style={{
              transformOrigin: '0px 50%',
              transform: `translateX(${hinge.toFixed(1)}px) perspective(2400px) rotateY(${deg.toFixed(2)}deg)`,
            }}
          >
            {front ? (
              <AbsoluteFill style={{overflow: 'hidden'}}>
                {children}
                <Fill style={{backgroundColor: `rgba(25,12,4,${(0.6 * Math.pow(shade, 1.3)).toFixed(3)})`}} />
                {/* curl highlight along the moving edge */}
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    width: 220,
                    height: H,
                    opacity: clamp01(shade * 1.6) * 0.9,
                    background:
                      'linear-gradient(90deg, rgba(255,240,200,0) 0%, rgba(255,236,190,0.45) 65%, rgba(255,248,225,0.95) 94%, rgba(150,104,50,0.8) 100%)',
                  }}
                />
              </AbsoluteFill>
            ) : (
              <AbsoluteFill style={{overflow: 'hidden', backgroundColor: '#b89a63'}}>
                {/* the page seen from behind */}
                <AbsoluteFill>
                  <Img
                    src={staticFile('textures/parchment_fibre.png')}
                    style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.78) sepia(0.35)'}}
                  />
                  <Fill style={{backgroundColor: `rgba(40,22,6,${(0.1 + 0.55 * shade * shade).toFixed(3)})`}} />
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 240,
                      height: H,
                      opacity: clamp01(0.5 + shade),
                      background:
                        'linear-gradient(90deg, rgba(255,236,190,0) 0%, rgba(255,236,190,0.25) 55%, rgba(255,240,200,0.7) 92%, rgba(120,84,40,0.65) 100%)',
                    }}
                  />
                </AbsoluteFill>
              </AbsoluteFill>
            )}
          </AbsoluteFill>
        </>
      );
    }

    case 'flash-gold':
      return (
        <Flash p={p} c0="#fffbe2" c1="#f4c64f" c2="#a8741a">
          {children}
        </Flash>
      );
    case 'flash-green':
      return (
        <Flash p={p} c0="#f0fff6" c1="#35d98a" c2="#0b5a36">
          {children}
        </Flash>
      );
  }
};
