import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import type {Accent, CaptionPos, LyricStyle} from '../direction';
import type {LyricLine, Word as LWord} from '../lyrics';
import {ACCENTS, DECOR_FONT, LYRIC_FONT, clamp01, keywordFor} from './theme';
import type {AccentTheme} from './theme';

const FPS = 30;

type Layout = {v: 'flex-start' | 'center' | 'flex-end'; h: 'flex-start' | 'center' | 'flex-end'; side: boolean};
const layoutFor = (pos: CaptionPos): Layout => {
  const v = pos.startsWith('top') ? 'flex-start' : pos.startsWith('bottom') ? 'flex-end' : 'center';
  const h = pos.endsWith('left') || pos === 'left' ? 'flex-start' : pos.endsWith('right') || pos === 'right' ? 'flex-end' : 'center';
  const side = h !== 'center';
  return {v, h, side};
};

const exitVec = (pos: CaptionPos): [number, number] => {
  const dx = pos.endsWith('left') || pos === 'left' ? -26 : pos.endsWith('right') || pos === 'right' ? 26 : 0;
  const dy = pos.startsWith('top') ? -18 : pos.startsWith('bottom') ? 18 : pos === 'center' ? -12 : 0;
  return [dx, dy];
};

type WProps = {
  w: LWord;
  sec: number;
  absFrame: number;
  style: LyricStyle;
  theme: AccentTheme;
  size: number;
  sly: boolean;
};

const DARK = '0 3px 6px rgba(0,0,0,0.85), 0 0 14px rgba(6,3,0,0.55)';
const MINO = 0.55;

const WordView: React.FC<WProps> = ({w, sec, absFrame, style, theme, size, sly}) => {
  const kw = sly ? null : keywordFor(w.t);
  const dur = Math.max(0.14, w.e - w.s);
  const p = clamp01((sec - w.s) / dur);
  const started = sec >= w.s;
  const current = started && sec < w.e + 0.06;
  const sinceF = Math.max(0, absFrame - w.s * FPS);
  const base = kw ? kw.c : theme.main;
  const color = current ? (kw ? kw.hi : theme.hi) : base;
  const glow = kw ? kw.c : theme.glow;
  const glowNow = current ? `, 0 0 26px ${glow}, 0 0 8px ${glow}` : `, 0 0 14px ${glow}55`;

  const css: React.CSSProperties = {
    display: 'inline-block',
    position: 'relative',
    marginRight: '0.26em',
    color,
    fontFamily: LYRIC_FONT,
    fontStyle: 'normal',
    fontWeight: 400,
    WebkitTextStroke: '2.5px rgba(25,12,4,0.85)',
    paintOrder: 'stroke fill',
    fontSize: size,
    lineHeight: 1.18,
    textShadow: DARK + glowNow,
    whiteSpace: 'pre',
  };
  const spr = (damping: number, stiffness: number, mass = 1) =>
    spring({frame: sinceF, fps: FPS, config: {damping, stiffness, mass}});
  const curBoost = current ? 1.04 : 1;
  let content: React.ReactNode = w.t;

  switch (style) {
    case 'word-pop': {
      const s = spr(11, 170, 0.7);
      css.transform = `scale(${(started ? 0.6 + 0.4 * s : 0.9) * curBoost})`;
      css.opacity = started ? Math.min(1, MINO + sinceF / 6) : MINO;
      break;
    }
    case 'bounce': {
      const s = spr(6, 140, 0.8);
      const hop = started ? -46 * Math.exp(-sinceF / 9) * Math.abs(Math.sin(sinceF * 0.42)) * (0.4 + 0.6 * (1 - s)) : 0;
      css.transform = `translateY(${hop * 1.6}px) scale(${curBoost})`;
      css.opacity = started ? Math.min(1, MINO + sinceF / 6) : MINO;
      break;
    }
    case 'glow': {
      const g = started ? 0.5 + 1.8 * Math.exp(-sinceF / 11) : 0;
      css.opacity = started ? Math.min(1, MINO + sinceF / 16) : MINO;
      css.textShadow = `${DARK}, 0 0 ${8 + 20 * g}px ${glow}, 0 0 ${4 + 40 * g}px ${theme.glow}${current ? '' : 'aa'}`;
      css.transform = `scale(${curBoost})`;
      break;
    }
    case 'shout': {
      const s = spr(8, 260, 0.6);
      const amp = started ? 9 * Math.exp(-sinceF / 5) : 0;
      css.fontFamily = DECOR_FONT;
      css.fontStyle = 'normal';
      css.fontWeight = 900;
      css.WebkitTextStroke = '2.5px rgba(25,12,4,0.85)';
      css.textTransform = 'uppercase';
      css.letterSpacing = '0.04em';
      css.fontSize = size * (sly ? 1 : 1.3);
      css.transform = `translate(${amp * Math.sin(sinceF * 2.6)}px, ${amp * Math.cos(sinceF * 3.4)}px) scale(${started ? 1 + 0.55 * (1 - s) : 1})`;
      css.opacity = started ? Math.min(1, MINO + sinceF / 4) : MINO;
      if (sly) {
        css.WebkitTextStroke = '3px #17603e';
        css.paintOrder = 'stroke fill';
        css.textShadow = `0 4px 0 #0d4429, 0 0 36px #2fa36b, 0 0 90px #1f8a58, ${DARK}`;
      }
      break;
    }
    case 'whisper': {
      const r = clamp01(sinceF / 20);
      css.fontSize = size * 0.8;
      css.letterSpacing = `${0.01 + 0.05 * r}em`;
      css.opacity = started ? MINO + 0.4 * r : MINO;
      css.textShadow = DARK;
      break;
    }
    case 'ink-write': {
      const ghost = (
        <span style={{opacity: MINO}}>{w.t}</span>
      );
      const wipe = (
        <span
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            clipPath: `inset(-20% ${(1 - p) * 100}% -20% -10%)`,
            filter: p > 0 && p < 1 ? `blur(${((1 - p) * 2.2).toFixed(2)}px)` : undefined,
          }}
        >
          {w.t}
        </span>
      );
      content = (
        <>
          {ghost}
          {sec >= w.s ? wipe : null}
        </>
      );
      css.textShadow = DARK;
      css.color = color;
      break;
    }
    case 'typewriter': {
      const n = w.t.length;
      const shown = started ? Math.ceil(p * n - 1e-6) : 0;
      content = w.t.split('').map((ch, i) => (
        <span key={i} style={{opacity: i < shown ? 1 : MINO}}>
          {ch}
        </span>
      ));
      css.opacity = 1;
      break;
    }
    default:
      break;
  }
  return <span style={css}>{content}</span>;
};

type Props = {
  line: LyricLine;
  from: number;
  dur: number;
  pos: CaptionPos;
  accent: Accent;
  style: LyricStyle;
};

export const Caption: React.FC<Props> = ({line, from, dur, pos, accent, style}) => {
  const frame = useCurrentFrame();
  const absFrame = from + frame;
  const sec = absFrame / FPS;
  const sly = line.text.toUpperCase().includes('SLYTHERIN!');
  const lay = layoutFor(sly ? 'center' : pos);
  const theme = sly ? {main: '#e2efe8', hi: '#ffffff', glow: '#2fa36b'} : ACCENTS[accent];
  const st: LyricStyle = sly ? 'shout' : style === 'none' ? 'word-pop' : style;

  const inO = clamp01(frame / 5);
  const outQ = clamp01((frame - (dur - 8)) / 8);
  const [dx, dy] = exitVec(pos);
  const size = sly ? 185 : st === 'whisper' ? 62 / 0.8 : lay.side ? 70 : 78;
  const maxW = sly ? 1760 : lay.side ? 760 : 1500;
  const exitScale = pos === 'center' || sly ? 1 + 0.05 * outQ : 1;

  const firstS = line.words.length ? line.words[0].s : line.start;
  const flash = sly ? 0.8 * Math.exp(-Math.max(0, absFrame - firstS * FPS) / 6) * (sec >= firstS ? 1 : 0) : 0;

  return (
    <>
      {flash > 0.01 && (
        <AbsoluteFill
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(160,255,200,0.95) 0%, rgba(47,163,107,0.8) 45%, rgba(8,70,40,0.5) 100%)',
            opacity: flash,
          }}
        />
      )}
      <AbsoluteFill
        style={{
          justifyContent: lay.v,
          alignItems: lay.h,
          padding: 90,
          opacity: inO * (1 - outQ),
        }}
      >
        <div
          style={{
            position: 'relative',
            maxWidth: maxW,
            textAlign: lay.h === 'flex-start' ? 'left' : lay.h === 'flex-end' ? 'right' : 'center',
            transform: `translate(${dx * outQ}px, ${dy * outQ}px) scale(${exitScale})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: sly ? '-120px -240px' : '-110px -200px',
              background: `radial-gradient(ellipse closest-side at 50% 50%, rgba(30,15,5,${sly ? 0.4 : 0.45}) 0%, rgba(30,15,5,${sly ? 0.22 : 0.25}) 50%, rgba(30,15,5,0) 100%)`,
              zIndex: 0,
            }}
          />
          <div style={{position: 'relative', zIndex: 1}}>
            {line.words.map((w, i) => (
              <WordView
                key={i}
                w={w}
                sec={sec}
                absFrame={absFrame}
                style={st}
                theme={theme}
                size={size}
                sly={sly}
              />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </>
  );
};
