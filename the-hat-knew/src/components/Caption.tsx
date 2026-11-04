import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame} from 'remotion';
import type {Accent, CaptionPos, LyricStyle, Tone} from '../direction';
import type {LyricLine, Word as LWord} from '../lyrics';
import {ACCENTS, DECOR_FONT, INK, LYRIC_FONT, clamp01, inkTheme, keywordFor, rand} from './theme';
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
  tone: Tone;
};

const DARK = '0 3px 6px rgba(0,0,0,0.85), 0 0 14px rgba(6,3,0,0.55)';
const MINO = 0.7;
const INK_SHADOW = '0 0 8px rgba(250,240,215,0.95), 0 0 20px rgba(250,240,215,0.65)';

const WordView: React.FC<WProps> = ({w, sec, absFrame, style, theme, size, sly, tone}) => {
  const ink = tone === 'ink' && !sly;
  const kw = sly ? null : keywordFor(w.t);
  const dur = Math.max(0.14, w.e - w.s);
  const p = clamp01((sec - w.s) / dur);
  const started = sec >= w.s;
  const current = started && sec < w.e + 0.06;
  const sinceF = Math.max(0, absFrame - w.s * FPS);
  const base = kw ? (ink ? kw.ink : kw.c) : theme.main;
  const color = current ? (kw ? (ink ? kw.ink : kw.hi) : theme.hi) : base;
  const glow = kw ? (ink ? kw.ink : kw.c) : theme.glow;
  const DARKSH = ink ? INK_SHADOW : DARK;
  const glowNow = ink
    ? current
      ? `, 0 0 14px ${glow}77`
      : ''
    : current
      ? `, 0 0 26px ${glow}, 0 0 8px ${glow}`
      : `, 0 0 14px ${glow}55`;

  const css: React.CSSProperties = {
    display: 'inline-block',
    position: 'relative',
    marginRight: '0.26em',
    color,
    fontFamily: LYRIC_FONT,
    fontStyle: 'normal',
    fontWeight: 400,
    WebkitTextStroke: ink ? '3px rgba(250,240,215,0.9)' : '2.5px rgba(25,12,4,0.85)',
    paintOrder: 'stroke fill',
    fontSize: size,
    lineHeight: 1.18,
    textShadow: DARKSH + glowNow,
    whiteSpace: 'pre',
  };
  const spr = (damping: number, stiffness: number, mass = 1) =>
    spring({frame: sinceF, fps: FPS, config: {damping, stiffness, mass}});
  const curBoost = current ? (ink ? 1.07 : 1.04) : 1;
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
      css.textShadow = ink
        ? `${INK_SHADOW}, 0 0 ${8 + 14 * g}px ${glow}${current ? 'aa' : '55'}`
        : `${DARK}, 0 0 ${8 + 20 * g}px ${glow}, 0 0 ${4 + 40 * g}px ${theme.glow}${current ? '' : 'aa'}`;
      css.transform = `scale(${curBoost})`;
      break;
    }
    case 'shout': {
      const s = spr(8, 260, 0.6);
      const amp = started ? 9 * Math.exp(-sinceF / 5) : 0;
      css.fontFamily = DECOR_FONT;
      css.fontStyle = 'normal';
      css.fontWeight = 900;
      css.WebkitTextStroke = ink ? '3px rgba(250,240,215,0.9)' : '2.5px rgba(25,12,4,0.85)';
      css.textTransform = 'uppercase';
      css.letterSpacing = '0.04em';
      css.fontSize = size * (sly ? 1 : 1.3);
      // wider gap + a smaller punch so the word being shouted never runs into its neighbours
      css.marginRight = '0.42em';
      css.transform = `translate(${amp * Math.sin(sinceF * 2.6)}px, ${amp * Math.cos(sinceF * 3.4)}px) scale(${started ? 1 + (sly ? 0.55 : 0.16) * (1 - s) : 1})`;
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
      css.opacity = started ? 0.85 + 0.15 * r : 0.85;
      css.textShadow = DARKSH;
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
      css.textShadow = DARKSH;
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
  tone?: Tone;
  hook?: {pos: 'top' | 'bottom'; tone: Tone};
};

export const HOOK_RE = /hat knew|all along/i;

// ---------------- hook (chorus) style ----------------
const GOLD_FILL = 'linear-gradient(180deg, #fff3c2 0%, #f6cf5e 38%, #d49a22 62%, #8d5d10 100%)';
const BROWN_FILL = 'linear-gradient(180deg, #8a5a14 0%, #6a4208 50%, #4c2c04 100%)';

const HookWord: React.FC<{w: LWord; absFrame: number; tone: Tone; size: number; final: boolean; idx: number}> = ({
  w,
  absFrame,
  tone,
  size,
  final,
  idx,
}) => {
  const sinceF = absFrame - w.s * FPS;
  const started = sinceF >= 0;
  const f = Math.max(0, sinceF);
  const sp = spring({frame: f, fps: FPS, config: {damping: 11, stiffness: 240, mass: 0.7}});
  const sc = started ? 1.5 - 0.5 * sp : 1.5;
  const blur = started ? Math.max(0, 1 - f / 6) * 10 : 10;
  const amp = started ? (final ? 5 : 3.5) * Math.exp(-f / 5) : 0;
  const op = started ? clamp01(f / 3) : 0;
  const dark = tone === 'light';
  const fill = dark ? GOLD_FILL : BROWN_FILL;
  const common: React.CSSProperties = {
    fontFamily: DECOR_FONT,
    fontWeight: 900,
    fontSize: size,
    lineHeight: 1.12,
    letterSpacing: '0.02em',
    whiteSpace: 'pre',
  };
  const glowPulse = final ? 0.6 + 0.4 * Math.sin(f / 7) : 0;
  const particles = Array.from({length: 10}, (_, k) => {
    const a = rand(idx * 31 + k * 3 + 1) * Math.PI * 2;
    const dist = (0.35 + rand(idx * 31 + k * 3 + 2) * 0.5) * size * (final ? 1.6 : 1.1);
    const u = clamp01(f / 20);
    const e = 1 - Math.pow(1 - u, 2.2);
    const r = 3 + rand(idx * 31 + k * 3 + 3) * 4;
    return (
      <span
        key={k}
        style={{
          position: 'absolute',
          left: '50%',
          top: '55%',
          width: r,
          height: r,
          borderRadius: '50%',
          background: 'radial-gradient(circle,#fff8d6,#f0c14a 70%,rgba(240,190,60,0))',
          boxShadow: '0 0 8px rgba(255,210,100,0.9)',
          opacity: started && u < 1 ? (1 - u) : 0,
          transform: `translate(${Math.cos(a) * dist * e}px, ${Math.sin(a) * dist * e * 0.8 + u * u * 16}px)`,
        }}
      />
    );
  });
  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        marginRight: size * 0.3,
        opacity: op,
        filter: blur > 0.2 ? `blur(${blur.toFixed(1)}px)` : undefined,
        transform: `translate(${amp * Math.sin(f * 2.9)}px, ${amp * Math.cos(f * 3.7)}px) scale(${sc})`,
      }}
    >
      {/* outline / glow layer */}
      <span
        style={{
          ...common,
          position: 'absolute',
          left: 0,
          top: 0,
          color: dark ? '#2a1604' : 'rgba(250,240,215,0.95)',
          WebkitTextStroke: dark ? `${size * 0.075}px #2a1604` : `${size * 0.06}px rgba(250,240,215,0.95)`,
          textShadow: dark
            ? `0 6px 10px rgba(0,0,0,0.7), 0 0 ${final ? 50 + 30 * glowPulse : 18}px rgba(255,200,80,${final ? 0.9 : 0.5})`
            : `0 0 18px rgba(250,240,215,0.95), 0 0 ${final ? 60 : 36}px rgba(250,240,215,0.7)`,
        }}
      >
        {w.t}
      </span>
      <span
        style={{
          ...common,
          position: 'relative',
          backgroundImage: fill,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {w.t}
      </span>
      {particles}
    </span>
  );
};

const HookCaption: React.FC<{line: LyricLine; from: number; dur: number; pos: 'top' | 'bottom'; tone: Tone}> = ({
  line,
  from,
  dur,
  pos,
  tone,
}) => {
  const frame = useCurrentFrame();
  const absFrame = from + frame;
  const final = /all along/i.test(line.text) && line.start > 200;
  // balanced lines: break after the first comma-ended word that is not the last
  const bi = line.words.findIndex((w, i) => /,$/.test(w.t) && i < line.words.length - 1);
  const rows = bi >= 0 ? [line.words.slice(0, bi + 1), line.words.slice(bi + 1)] : [line.words];
  const longest = Math.max(...rows.map((r) => r.reduce((n, w) => n + w.t.length + 0.38, 0)));
  const base = final ? 210 : 124;
  const size = Math.min(base, 1700 / (longest * 0.8));
  const outQ = clamp01((frame - (dur - 10)) / 10);
  const inO = clamp01(frame / 4);
  const dark = tone === 'light';
  const firstS = line.words[0].s * FPS;
  const breathe = final ? 1 + 0.035 * clamp01((absFrame - firstS) / 120) : 1;
  let gi = 0;
  return (
    <AbsoluteFill
      style={{
        justifyContent: pos === 'top' ? 'flex-start' : 'flex-end',
        alignItems: 'center',
        padding: final ? '60px 60px 90px' : pos === 'top' ? '50px 60px' : '60px 60px 70px',
        opacity: inO * (1 - outQ),
      }}
    >
      <div style={{position: 'relative', maxWidth: 1760, textAlign: 'center', transform: `scale(${breathe})`}}>
        <div
          style={{
            position: 'absolute',
            inset: '-90px -260px',
            background: dark
              ? 'radial-gradient(ellipse closest-side at 50% 50%, rgba(30,15,5,0.55) 0%, rgba(30,15,5,0.32) 55%, rgba(30,15,5,0) 100%)'
              : 'radial-gradient(ellipse closest-side at 50% 50%, rgba(250,240,215,0.62) 0%, rgba(250,240,215,0.36) 55%, rgba(250,240,215,0) 100%)',
          }}
        />
        {final && (
          <div
            style={{
              position: 'absolute',
              inset: '-160px -320px',
              opacity: clamp01((absFrame - firstS) / 10) * (0.7 + 0.3 * Math.sin((absFrame - firstS) / 9)),
              background: 'radial-gradient(ellipse closest-side, rgba(255,226,140,0.55) 0%, rgba(255,200,80,0.25) 55%, rgba(255,200,80,0) 100%)',
            }}
          />
        )}
        <div style={{position: 'relative'}}>
          {rows.map((r, ri) => (
            <div key={ri} style={{whiteSpace: 'nowrap'}}>
              {r.map((w) => (
                <HookWord key={gi} w={w} absFrame={absFrame} tone={tone} size={size} final={final} idx={gi++} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Caption: React.FC<Props> = ({line, from, dur, pos, accent, style, tone = 'light', hook}) => {
  const frame = useCurrentFrame();
  if (HOOK_RE.test(line.text)) {
    return <HookCaption line={line} from={from} dur={dur} pos={hook?.pos ?? 'bottom'} tone={hook?.tone ?? tone} />;
  }
  const absFrame = from + frame;
  const sec = absFrame / FPS;
  const sly = line.text.toUpperCase().includes('SLYTHERIN!');
  const ink = tone === 'ink' && !sly;
  const lay = layoutFor(sly ? 'center' : pos);
  const theme = sly ? {main: '#e2efe8', hi: '#ffffff', glow: '#2fa36b'} : ink ? inkTheme(accent) : ACCENTS[accent];
  const st: LyricStyle = sly ? 'shout' : style === 'none' ? 'word-pop' : style;

  const inO = clamp01(frame / 5);
  const outQ = clamp01((frame - (dur - 8)) / 8);
  const [dx, dy] = exitVec(pos);
  const size = sly ? 185 : st === 'whisper' ? 66 / 0.8 : lay.side ? 70 : 78;
  const maxW = sly ? 1760 : lay.side ? 760 : 1500;
  const exitScale = pos === 'center' || sly ? 1 + 0.05 * outQ : 1;

  const firstS = line.words.length ? line.words[0].s : line.start;
  const flash = sly ? 0.8 * Math.exp(-Math.max(0, absFrame - firstS * FPS) / 6) * (sec >= firstS ? 1 : 0) : 0;
  const wash = ink
    ? 'radial-gradient(ellipse closest-side at 50% 50%, rgba(250,240,215,0.6) 0%, rgba(250,240,215,0.38) 55%, rgba(250,240,215,0) 100%)'
    : `radial-gradient(ellipse closest-side at 50% 50%, rgba(30,15,5,0.55) 0%, rgba(30,15,5,${sly ? 0.3 : 0.32}) 55%, rgba(30,15,5,0) 100%)`;
  void INK;

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
              background: wash,
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
                tone={tone}
              />
            ))}
          </div>
        </div>
      </AbsoluteFill>
    </>
  );
};
