import React from 'react';
import {staticFile} from 'remotion';
import {DECOR_FONT, LYRIC_FONT} from '../theme';
import {HatEmblem} from './HatEmblem';
import {SCRIPT_FONT} from './endFonts';

export const COVER_W = 1024;
export const COVER_H = 1152;

export type CoverProps = {
  titleFill: number; // 0..1 molten gold fill, left to right
  glint: number; // -1 none, 0..1 diagonal glint sweep
  madeBy: number; // 0..1
  names: number; // 0..1 ink reveal
  sparkle: number; // 0..1 sparkle on the x
  wink: number; // 0..1
  star: number; // 0..1
  sway: number; // ribbon sway, degrees
  flicker: number; // candle light intensity ~0..1
  lightX: number; // 0..1 horizontal position of candle light
};

export const defaultCoverProps: CoverProps = {
  titleFill: 1, glint: -1, madeBy: 1, names: 1, sparkle: 0, wink: 0, star: 0, sway: 0, flicker: 0.5, lightX: 0.35,
};

const GOLD_GRAD = 'linear-gradient(100deg,#8a5a14 0%,#f7dd8a 22%,#c8902c 40%,#fff0b0 58%,#b5801f 78%,#f3d27a 100%)';

const Corner: React.FC = () => (
  <g fill="none" stroke="url(#goldStroke)" strokeWidth={3} strokeLinecap="round">
    <path d="M0 150 C0 70 30 20 90 0" strokeWidth={0} />
    <path d="M30 150 C30 80 60 40 150 30" />
    <path d="M30 30 C30 80 70 110 110 90 C140 75 130 45 105 50" />
    <path d="M30 30 C80 30 110 70 90 110 C75 140 45 130 50 105" />
    <circle cx={52} cy={52} r={7} fill="url(#goldStroke)" />
    <path d="M110 30 q18 -14 34 0 q-16 12 -34 0 Z" />
    <path d="M30 110 q-14 18 0 34 q12 -16 0 -34 Z" />
  </g>
);

export const Cover: React.FC<{p?: Partial<CoverProps>}> = ({p}) => {
  const c = {...defaultCoverProps, ...p};
  const W = 1000;
  const H = 1128;
  const lines = ['The Hat', 'Knew'];
  const fillFor = (i: number) => Math.min(1, Math.max(0, c.titleFill * 2 - i));
  const titleStyle: React.CSSProperties = {
    fontFamily: DECOR_FONT, fontWeight: 900, fontSize: 168, lineHeight: 1.02, textAlign: 'center', whiteSpace: 'nowrap',
    letterSpacing: 2,
  };
  return (
    <div style={{position: 'relative', width: COVER_W, height: COVER_H}}>
      {/* page block */}
      <div
        style={{
          position: 'absolute', left: 14, top: 18, width: 1010, height: 1134, borderRadius: '4px 10px 10px 4px',
          background: 'repeating-linear-gradient(90deg,#efe2bd 0,#efe2bd 3px,#cdb98a 4px,#f6ecd0 6px)',
          boxShadow: 'inset -6px 0 12px rgba(80,50,10,0.5)',
        }}
      />
      <div
        style={{
          position: 'absolute', left: 14, top: 1128, width: 1010, height: 24, borderRadius: '0 0 10px 4px',
          background: 'repeating-linear-gradient(0deg,#efe2bd 0,#efe2bd 3px,#c4ae7c 4px,#f6ecd0 6px)',
          boxShadow: 'inset 0 -5px 10px rgba(80,50,10,0.5)',
        }}
      />
      {/* ribbon bookmark, hangs from the bottom edge */}
      <div style={{position: 'absolute', left: 690, top: 1110, width: 70, height: 260, transformOrigin: '35px 20px', transform: `rotate(${c.sway}deg)`}}>
        <svg width={70} height={260} viewBox="0 0 70 260">
          <defs>
            <linearGradient id="silk" x1="0" x2="1">
              <stop offset="0" stopColor="#7a0f1f" />
              <stop offset="0.35" stopColor="#d4313f" />
              <stop offset="0.6" stopColor="#a31628" />
              <stop offset="1" stopColor="#68091a" />
            </linearGradient>
          </defs>
          <path d="M4 0 L66 0 L66 250 L35 222 L4 250 Z" fill="url(#silk)" />
          <path d="M4 0 L66 0 L66 250 L35 222 L4 250 Z" fill="none" stroke="#f0c25a" strokeWidth={1.5} opacity={0.5} />
        </svg>
      </div>
      {/* cover board */}
      <div
        style={{
          position: 'absolute', left: 0, top: 0, width: W, height: H, borderRadius: '14px 6px 6px 14px', overflow: 'hidden',
          backgroundImage: `url(${staticFile('textures/leather_emerald.png')})`, backgroundSize: '100% 100%',
          boxShadow: '0 0 0 2px #0a2a1e',
        }}
      >
        {/* spine */}
        <div
          style={{
            position: 'absolute', left: 0, top: 0, width: 70, height: '100%',
            background: 'linear-gradient(90deg,rgba(0,0,0,0.65),rgba(0,0,0,0.1) 60%,rgba(255,255,255,0.12) 78%,rgba(0,0,0,0.35))',
          }}
        />
        {[200, 380, 760, 940].map((y) => (
          <div key={y} style={{position: 'absolute', left: 6, top: y, width: 60, height: 8, background: GOLD_GRAD, opacity: 0.8, borderRadius: 4}} />
        ))}
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 45%,rgba(0,0,0,0) 40%,rgba(0,0,0,0.55) 100%)'}} />
        {/* tooled border */}
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0, filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.7))'}}>
          <defs>
            <linearGradient id="goldStroke" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#a8741c" />
              <stop offset="0.3" stopColor="#f7dd8a" />
              <stop offset="0.55" stopColor="#c8902c" />
              <stop offset="0.8" stopColor="#fff0b0" />
              <stop offset="1" stopColor="#b5801f" />
            </linearGradient>
          </defs>
          <rect x={92} y={42} width={W - 134} height={H - 84} fill="none" stroke="url(#goldStroke)" strokeWidth={5} />
          <rect x={110} y={60} width={W - 170} height={H - 120} fill="none" stroke="url(#goldStroke)" strokeWidth={2} />
          <g transform="translate(86 36)"><Corner /></g>
          <g transform={`translate(${W - 36} 36) scale(-1 1)`}><Corner /></g>
          <g transform={`translate(86 ${H - 36}) scale(1 -1)`}><Corner /></g>
          <g transform={`translate(${W - 36} ${H - 36}) scale(-1 -1)`}><Corner /></g>
          <g fill="none" stroke="url(#goldStroke)" strokeWidth={2.5}>
            <path d={`M${W / 2 + 45 - 120} 76 h240 M${W / 2 + 45 - 120} ${H - 76} h240`} />
            <path d={`M${W / 2 + 45} 68 l8 8 l-8 8 l-8 -8 Z M${W / 2 + 45} ${H - 84} l8 8 l-8 8 l-8 -8 Z`} fill="url(#goldStroke)" />
          </g>
        </svg>
        {/* emblem */}
        <div style={{position: 'absolute', left: 80 + (W - 80) / 2 - 230, top: 92, transform: 'scale(0.92)', transformOrigin: '50% 0', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.75)) drop-shadow(0 0 10px rgba(240,200,90,0.35))'}}>
          <HatEmblem wink={c.wink} star={c.star} />
        </div>
        {/* title: debossed, then molten fill */}
        <div style={{position: 'absolute', left: 80, width: W - 80, top: 488}}>
          {lines.map((ln, i) => {
            const f = fillFor(i);
            const edge = f * 112 - 6;
            const gold = `linear-gradient(90deg, #d9a93c 0%, #ffe9a0 ${Math.max(0, edge - 22)}%, #ffd45c ${Math.max(0, edge - 4)}%, #fffbe8 ${Math.max(0, edge)}%, rgba(255,255,255,0) ${Math.max(0, edge) + 0.01}%)`;
            const glintPos = c.glint * 170 - 35;
            return (
              <div key={i} style={{position: 'relative', height: 172, marginBottom: i === 0 ? -6 : 0}}>
                <div
                  style={{
                    ...titleStyle, position: 'absolute', inset: 0, color: '#06231a',
                    textShadow: '0 -3px 3px rgba(0,0,0,0.85), 0 3px 1px rgba(150,235,190,0.28)',
                  }}
                >
                  {ln}
                </div>
                {f > 0 ? (
                  <div
                    style={{
                      ...titleStyle, position: 'absolute', inset: 0, color: 'transparent',
                      backgroundImage: gold, WebkitBackgroundClip: 'text', backgroundClip: 'text',
                      filter: f < 1 ? 'drop-shadow(0 0 14px rgba(255,200,80,0.8))' : 'drop-shadow(0 2px 2px rgba(0,0,0,0.6))',
                    }}
                  >
                    {ln}
                  </div>
                ) : null}
                {c.glint >= 0 && c.glint <= 1 ? (
                  <div
                    style={{
                      ...titleStyle, position: 'absolute', inset: 0, color: 'transparent',
                      backgroundImage: `linear-gradient(105deg, rgba(255,255,255,0) ${glintPos - 14}%, rgba(255,255,255,0.95) ${glintPos}%, rgba(255,255,255,0) ${glintPos + 14}%)`,
                      WebkitBackgroundClip: 'text', backgroundClip: 'text',
                    }}
                  >
                    {ln}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
        {/* made by */}
        <div
          style={{
            position: 'absolute', left: 80, width: W - 80, top: 876, textAlign: 'center', fontFamily: LYRIC_FONT, fontStyle: 'italic',
            fontSize: 40, letterSpacing: 10, textTransform: 'uppercase', color: '#e9cf8a', opacity: c.madeBy,
            transform: `translateY(${(1 - c.madeBy) * 10}px)`, textShadow: '0 2px 3px rgba(0,0,0,0.7)',
          }}
        >
          made by
        </div>
        {/* names */}
        <div
          style={{
            position: 'absolute', left: 80, width: W - 80, top: 920, textAlign: 'center', fontFamily: SCRIPT_FONT, fontSize: 92, lineHeight: 1.1,
            color: '#f4d577', whiteSpace: 'nowrap', textShadow: '0 3px 4px rgba(0,0,0,0.75), 0 0 16px rgba(240,190,70,0.35)',
            WebkitMaskImage: `linear-gradient(90deg,#000 ${c.names * 112 - 12}%,transparent ${c.names * 112}%)`,
            maskImage: `linear-gradient(90deg,#000 ${c.names * 112 - 12}%,transparent ${c.names * 112}%)`,
          }}
        >
          Zandran <span style={{position: 'relative'}}>
            ×
            {c.sparkle > 0 ? (
              <svg width={110} height={110} viewBox="-55 -55 110 110" style={{position: 'absolute', left: '50%', top: '58%', marginLeft: -55, marginTop: -55}}>
                <g transform={`rotate(${c.sparkle * 50}) scale(${c.sparkle * 1.2})`} opacity={c.sparkle < 0.7 ? 1 : (1 - c.sparkle) / 0.3}>
                  <path d="M0 -50 Q4 -4 50 0 Q4 4 0 50 Q-4 4 -50 0 Q-4 -4 0 -50 Z" fill="#fff6c8" />
                </g>
              </svg>
            ) : null}
          </span> Alarix
        </div>
        {/* candlelight sweeping across */}
        <div
          style={{
            position: 'absolute', inset: 0, mixBlendMode: 'screen', opacity: 0.22 + 0.26 * c.flicker,
            background: `radial-gradient(ellipse 70% 55% at ${c.lightX * 100}% 35%, rgba(255,190,90,0.75), rgba(255,150,50,0.0) 70%)`,
          }}
        />
      </div>
    </div>
  );
};
