import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {END_BEATS as B, FPS, END_START} from '../../timeline';
import {rand} from '../theme';
import {COVER_H, COVER_W, Cover} from './Cover';
import {useEndFonts} from './endFonts';

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t: number, a: number, b: number, e?: (x: number) => number) => {
  const x = clamp((t - a) / (b - a));
  return e ? e(x) : x;
};
const inOut = Easing.inOut(Easing.cubic);

const flickerAt = (t: number) =>
  0.5 + 0.22 * Math.sin(t * 7.3) + 0.15 * Math.sin(t * 13.1 + 1.7) + 0.1 * Math.sin(t * 23.7 + 0.4);

/** Hinge angle of the turning page in degrees (0 open .. 180 closed) with a tiny bounce at the end. */
const flipAngle = (t: number) => {
  const u = seg(t, B.closeStart, B.closeEnd);
  const hit = 0.88;
  if (u <= hit) return 180 * Math.pow(u / hit, 1.8) ;
  const v = (u - hit) / (1 - hit);
  return 180 - 7 * Math.sin(Math.PI * v) * (1 - v);
};

const PageHalf: React.FC<{side: 'left' | 'right'; scale: number; dark: number}> = ({side, scale, dark}) => (
  <div style={{position: 'absolute', left: 0, top: 0, width: 960, height: 1080, overflow: 'hidden'}}>
    <Img
      src={staticFile('shots/65.webp')}
      style={{
        position: 'absolute', top: 0, left: side === 'left' ? 0 : -960, width: 1920, height: 1080, transform: `scale(${scale})`,
        transformOrigin: '50% 50%',
      }}
    />
    <div style={{position: 'absolute', inset: 0, background: `rgba(10,4,0,${dark})`}} />
  </div>
);

const Burst: React.FC<{t: number; at: number; seed: number; points: Array<[number, number]>; n: number}> = ({t, at, seed, points, n}) => {
  const age = t - at;
  if (age < 0 || age > 2.4) return null;
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const r = rand(seed + i * 3.1);
        const [ox, oy] = points[i % points.length];
        const ang = rand(seed + i * 7.7) * Math.PI * 2;
        const sp = 90 + rand(seed + i * 1.3) * 260;
        const life = 1.2 + rand(seed + i * 5.5) * 1.2;
        const k = clamp(age / life);
        const e = 1 - Math.pow(1 - k, 2.2);
        const x = ox + Math.cos(ang) * sp * e * 1.2;
        const y = oy + Math.sin(ang) * sp * e - 60 * k * k * life * 30 / 30 - 40 * k;
        const size = 3 + r * 6;
        const tw = 0.6 + 0.4 * Math.sin(age * 14 + i);
        return (
          <div
            key={i}
            style={{
              position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, borderRadius: '50%',
              background: 'radial-gradient(circle,#fff6cf,#f0c14a 60%,rgba(240,190,60,0))', opacity: (1 - k) * tw,
              boxShadow: '0 0 8px rgba(255,210,100,0.9)',
            }}
          />
        );
      })}
    </>
  );
};

export const EndSequence: React.FC<{layerStartFrame: number}> = ({layerStartFrame}) => {
  useEndFonts();
  const frame = useCurrentFrame();
  const t = Math.max(0, (layerStartFrame + frame) / FPS - END_START);
  const fl = flickerAt(t);

  // page push-in, warm flicker
  const push = 1 + 0.06 * seg(t, 0, B.pageHoldEnd, Easing.out(Easing.quad));
  const flipOn = t >= B.closeStart && t < B.closeEnd;
  const angle = flipAngle(t);
  const rad = (angle * Math.PI) / 180;
  const s = Math.sin(rad);

  // glide
  const g = seg(t, B.closeEnd, B.centerEnd, inOut);
  const settle = t > B.centerEnd ? t - B.centerEnd : 0;
  const drift = Math.sin(settle * 0.8) ;
  const scale = 1 - 0.18 * g;
  const tx = -480 * g;
  const rx = 6 * g + drift * 0.5 * g;
  const ry = -8 * g + Math.sin(settle * 0.6 + 1) * 0.8 * g;

  // credits beats
  const titleFill = seg(t, B.titleStart, B.titleEnd, Easing.inOut(Easing.quad));
  const glint = t >= B.titleEnd && t < B.titleEnd + 1.1 ? seg(t, B.titleEnd, B.titleEnd + 1.1, Easing.inOut(Easing.quad)) : -1;
  const madeBy = seg(t, B.madeByStart, B.madeByStart + 0.8);
  const names = seg(t, B.namesStart, B.namesEnd, Easing.inOut(Easing.sin));
  const sp = seg(t, B.namesStart + 0.9, B.namesEnd + 0.5);
  const sparkleT = seg(t, B.namesEnd - 0.2, B.namesEnd + 0.8);
  const wk = t - B.wink;
  const wink = wk >= 0 && wk <= 0.35 ? Math.sin((wk / 0.35) * Math.PI) : 0;
  const star = wk >= 0.05 && wk <= 1.15 ? Math.sin(clamp((wk - 0.05) / 1.1) * Math.PI) : 0;
  void sp;
  const cp = {
    titleFill, glint, madeBy, names, sparkle: sparkleT > 0 && sparkleT < 1 ? sparkleT : 0, wink, star,
    sway: Math.sin(t * 1.6) * 5 + Math.sin(t * 2.9 + 1) * 1.5, flicker: fl, lightX: 0.5 + 0.35 * Math.sin(t * 0.9) + 0.1 * Math.sin(t * 5),
  };

  const fade = seg(t, B.fadeStart, B.end - 0.12);
  const shadowW = 760 * s;
  const cover = <Cover p={cp} />;
  const coverScale = 960 / COVER_W; // fills a 960x1080 half exactly (COVER_H 1152 * .9375 = 1080)
  void COVER_H;

  const bgFlick = 0.8 + 0.2 * fl;
  return (
    <AbsoluteFill style={{background: '#050302', overflow: 'hidden'}}>
      {/* dark candlelit background */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 60% 70% at ${50 + 6 * Math.sin(t * 1.1)}% 52%, rgba(120,62,18,${0.55 * bgFlick}) 0%, rgba(40,18,6,0.9) 55%, #060302 100%)`,
        }}
      />
      {t >= B.closeEnd - 1 ? (
        <>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const x = 80 + rand(i + 40) * 1760;
            const y = 700 + rand(i + 50) * 330;
            const sz = 90 + rand(i + 60) * 90;
            const a = (0.25 + 0.2 * Math.sin(t * (3 + i * 1.3) + i)) * seg(t, B.closeEnd - 1, B.closeEnd + 0.6);
            return (
              <div
                key={i}
                style={{
                  position: 'absolute', left: x - sz, top: y - sz, width: sz * 2, height: sz * 2, borderRadius: '50%',
                  background: 'radial-gradient(circle,rgba(255,190,90,0.55),rgba(255,150,50,0) 65%)', opacity: a,
                }}
              />
            );
          })}
        </>
      ) : null}

      {t < B.closeEnd ? (
        <AbsoluteFill style={{perspective: 4200, perspectiveOrigin: '960px 540px'}}>
          {/* right half (stationary) */}
          <div style={{position: 'absolute', left: 960, top: 0, width: 960, height: 1080}}>
            <PageHalf side="right" scale={push} dark={0.12 * (1 - fl) + (flipOn ? 0.0 : 0)} />
            {flipOn ? (
              <div
                style={{
                  position: 'absolute', left: 0, top: 0, width: shadowW, height: 1080,
                  background: `linear-gradient(90deg,rgba(0,0,0,${0.75 * s}),rgba(0,0,0,0))`,
                }}
              />
            ) : null}
          </div>
          {/* left half (turning) */}
          <div
            style={{
              position: 'absolute', left: 0, top: 0, width: 960, height: 1080, transformOrigin: '100% 50%',
              transformStyle: 'preserve-3d', transform: `rotateY(${flipOn ? angle : 0}deg)`,
            }}
          >
            <div style={{position: 'absolute', inset: 0, backfaceVisibility: 'hidden'}}>
              <PageHalf side="left" scale={push} dark={0.12 * (1 - fl) + 0.45 * s} />
            </div>
            <div
              style={{
                position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', overflow: 'hidden',
              }}
            >
              <div style={{width: COVER_W, height: COVER_H, transform: `scale(${coverScale})`, transformOrigin: '0 0'}}>{cover}</div>
              <div style={{position: 'absolute', inset: 0, background: `rgba(0,0,0,${0.55 * s})`}} />
            </div>
          </div>
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{perspective: 4200, perspectiveOrigin: '960px 540px'}}>
          <div
            style={{
              position: 'absolute', left: 960, top: 0, width: 960, height: 1080, transformStyle: 'preserve-3d',
              transform: `translateX(${tx}px) rotateX(${rx}deg) rotateY(${ry}deg) scale(${scale})`,
              filter: `drop-shadow(${20 * g}px ${34 * g}px ${34 * g}px rgba(0,0,0,0.75))`,
            }}
          >
            <div style={{width: COVER_W, height: COVER_H, transform: `scale(${coverScale})`, transformOrigin: '0 0'}}>{cover}</div>
          </div>
        </AbsoluteFill>
      )}

      {/* dust bursts */}
      <Burst
        t={t}
        at={B.closeEnd}
        seed={11}
        n={34}
        points={Array.from({length: 17}, (_, i): [number, number] => [962, 60 + i * 58])}
      />
      <Burst
        t={t}
        at={B.centerEnd - 0.1}
        seed={77}
        n={70}
        points={Array.from({length: 24}, (_, i): [number, number] => {
          // perimeter of the settled book: x 566..1354, y 97..983
          const k = i / 24;
          if (k < 0.25) return [566 + (k / 0.25) * 788, 97];
          if (k < 0.5) return [1354, 97 + ((k - 0.25) / 0.25) * 886];
          if (k < 0.75) return [1354 - ((k - 0.5) / 0.25) * 788, 983];
          return [566, 983 - ((k - 0.75) / 0.25) * 886];
        })}
      />

      {/* warm flicker over the final page */}
      {t < B.closeEnd ? (
        <AbsoluteFill style={{background: `rgba(255,170,70,${0.05 + 0.07 * fl})`, mixBlendMode: 'soft-light'}} />
      ) : null}
      <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 55%,rgba(0,0,0,0.45) 100%)`}} />
      <AbsoluteFill style={{background: '#000', opacity: fade}} />
    </AbsoluteFill>
  );
};
