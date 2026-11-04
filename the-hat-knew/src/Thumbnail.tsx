import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';
import {DECOR_FONT} from './components/theme';
import {Cover} from './components/end/Cover';
import {SCRIPT_FONT, useEndFonts} from './components/end/endFonts';

export type ThumbVariant = 'split' | 'narrator' | 'storybook';

const shot = (n: string) => staticFile(`shots/${n}.webp`);

const GoldText: React.FC<{children: React.ReactNode; size: number; style?: React.CSSProperties; align?: 'center' | 'left'; line?: number}> = ({
  children, size, style, align = 'center', line = 1,
}) => {
  const base: React.CSSProperties = {
    fontFamily: DECOR_FONT, fontWeight: 900, fontSize: size, lineHeight: line, whiteSpace: 'nowrap', textAlign: align, letterSpacing: 2,
  };
  return (
    <div style={{position: 'relative', ...style}}>
      <div
        style={{
          ...base, color: '#1a0a02', WebkitTextStroke: `${Math.round(size * 0.16)}px #1a0a02`,
          filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.8))',
        }}
      >
        {children}
      </div>
      <div
        style={{
          ...base, position: 'absolute', inset: 0, color: 'transparent',
          backgroundImage: 'linear-gradient(180deg,#fff6c4 0%,#ffd75e 35%,#e0a02a 60%,#fbe08a 100%)',
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
        }}
      >
        {children}
      </div>
    </div>
  );
};

const Split: React.FC = () => (
  <AbsoluteFill style={{background: '#120a05'}}>
    <AbsoluteFill style={{clipPath: 'polygon(0 0,700px 0,560px 100%,0 100%)'}}>
      <Img src={shot('64')} style={{position: 'absolute', width: 1600, height: 900, left: -470, top: -75}} />
      <AbsoluteFill style={{background: 'rgba(40,170,110,0.14)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'linear-gradient(270deg,rgba(60,230,150,0.38),rgba(0,0,0,0) 22%), linear-gradient(90deg,rgba(40,200,130,0.16),rgba(0,0,0,0) 12%)'}} />
    </AbsoluteFill>
    <AbsoluteFill style={{clipPath: 'polygon(740px 0,100% 0,100% 100%,600px 100%)'}}>
      <Img src={shot('57')} style={{position: 'absolute', width: 1600, height: 900, left: 175, top: -32}} />
      <AbsoluteFill style={{background: 'rgba(255,120,70,0.1)', mixBlendMode: 'multiply'}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(255,200,80,0.35),rgba(0,0,0,0) 22%)'}} />
    </AbsoluteFill>
    <svg width={1280} height={720} style={{position: 'absolute', inset: 0}}>
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="10" /></filter>
      </defs>
      <polygon points="700,0 740,0 600,720 560,720" fill="#ffcf5a" filter="url(#glow)" opacity={0.9} />
      <polygon points="712,0 728,0 588,720 572,720" fill="#fff3b8" />
    </svg>
    <div
      style={{
        position: 'absolute', left: 530, top: 10, width: 260, height: 260, overflow: 'hidden', borderRadius: '50%',
        border: '4px solid #f3c95c', boxShadow: '0 0 40px 18px rgba(0,0,0,0.55), 0 0 14px rgba(255,207,90,0.6)',
      }}
    >
      <Img src={shot('45')} style={{position: 'absolute', width: 1024, height: 576, left: -430, top: -134}} />
    </div>
    <AbsoluteFill style={{background: 'linear-gradient(180deg,rgba(0,0,0,0) 62%,rgba(0,0,0,0.7) 100%)'}} />
    <GoldText size={100} style={{position: 'absolute', left: 0, width: 1080, bottom: 62}}>THE HAT KNEW</GoldText>
  </AbsoluteFill>
);

const HEART = 'M50 88 C10 56 0 36 0 24 C0 8 12 0 26 0 C36 0 46 6 50 16 C54 6 64 0 74 0 C88 0 100 8 100 24 C100 36 90 56 50 88 Z';
const Locket: React.FC<{src: string; x: number; y: number; rim: string; id: string; ox: number; oy: number; size: number; rot: number}> = ({
  src, x, y, rim, id, ox, oy, size, rot,
}) => (
  <svg width={size} height={size * 0.95} viewBox="-8 -8 116 106" style={{position: 'absolute', left: x, top: y, transform: `rotate(${rot}deg)`, filter: 'drop-shadow(0 8px 10px rgba(0,0,0,0.75))'}}>
    <defs>
      <clipPath id={id}><path d={HEART} /></clipPath>
      <linearGradient id={`${id}g`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff0b0" /><stop offset="0.5" stopColor="#c8902c" /><stop offset="1" stopColor="#f7dd8a" />
      </linearGradient>
    </defs>
    <path d={HEART} fill="none" stroke={rim} strokeWidth={14} strokeLinejoin="round" />
    <path d={HEART} fill="none" stroke={`url(#${id}g)`} strokeWidth={6} strokeLinejoin="round" />
    <g clipPath={`url(#${id})`}>
      <image href={src} x={ox} y={oy} width={380} height={214} />
    </g>
  </svg>
);

const Narrator: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse at 75% 50%,#3a1c0a,#0d0603 75%)'}}>
    <div style={{position: 'absolute', left: 0, top: 0, width: 760, height: 720, overflow: 'hidden', clipPath: 'polygon(0 0,100% 0,88% 100%,0 100%)'}}>
      <Img src={shot('45')} style={{position: 'absolute', width: 1664, height: 936, left: -510, top: -99}} />
      <AbsoluteFill style={{background: 'linear-gradient(90deg,rgba(0,0,0,0) 70%,rgba(13,6,3,0.8))'}} />
    </div>
    <div style={{position: 'absolute', left: 735, top: 0, width: 8, height: 720, background: 'linear-gradient(180deg,#fff0b0,#c8902c)', transform: 'skewX(-7deg)', boxShadow: '0 0 18px #ffcf5a'}} />
    <div style={{position: 'absolute', left: 745, top: 30, width: 520}}>
      {['THE', 'HAT', 'KNEW'].map((w) => (
        <GoldText key={w} size={w === 'KNEW' ? 140 : 168} line={0.98} style={{marginBottom: 4}}>{w}</GoldText>
      ))}
    </div>
    <Locket id="lk1" src={shot('57')} ox={-134} oy={-48} x={26} y={430} size={250} rim="#c0262d" rot={-8} />
    <Locket id="lk2" src={shot('64')} ox={-140} oy={-51} x={250} y={470} size={230} rim="#1f8f5a" rot={7} />
  </AbsoluteFill>
);

const Storybook: React.FC = () => (
  <AbsoluteFill style={{background: 'radial-gradient(ellipse 55% 75% at 30% 52%,#8a4a14 0%,#2a1206 55%,#080402 100%)'}}>
    {[0, 1, 2, 3].map((i) => (
      <div key={i} style={{position: 'absolute', left: 40 + i * 330, top: 80 + (i % 2) * 450, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle,rgba(255,190,90,0.4),rgba(255,150,50,0) 65%)'}} />
    ))}
    <div style={{position: 'absolute', left: 60, top: 50, width: 563, height: 634, perspective: 2000}}>
      <div style={{transform: 'rotateX(4deg) rotateY(-8deg) scale(0.55)', transformOrigin: '0 0', filter: 'drop-shadow(18px 26px 26px rgba(0,0,0,0.8))'}}>
        <Cover p={{flicker: 0.8, lightX: 0.3}} />
      </div>
    </div>
    <div style={{position: 'absolute', left: 650, top: 90, width: 600}}>
      <GoldText size={112} line={0.98}>THE HAT</GoldText>
      <GoldText size={150} line={0.98}>KNEW</GoldText>
    </div>
    <div
      style={{
        position: 'absolute', left: 650, width: 600, top: 440, textAlign: 'center', fontFamily: SCRIPT_FONT, fontSize: 78, color: '#f6dc86',
        WebkitTextStroke: '6px #1a0a02', paintOrder: 'stroke fill', textShadow: '0 6px 10px rgba(0,0,0,0.7)', whiteSpace: 'nowrap',
      }}
    >
      Zandran × Alarix
    </div>
  </AbsoluteFill>
);

export const Thumbnail: React.FC<{variant: ThumbVariant}> = ({variant}) => {
  useEndFonts();
  if (variant === 'split') return <Split />;
  if (variant === 'narrator') return <Narrator />;
  return <Storybook />;
};
