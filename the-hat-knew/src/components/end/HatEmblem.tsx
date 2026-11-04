import React from 'react';

/** Gold line-art emblem of the crooked, patched hat with a sly face.
 * wink: 0 open .. 1 closed (right eye). star: 0..1 twinkle amount. */
export const HatEmblem: React.FC<{wink: number; star: number; stroke?: string}> = ({wink, star, stroke = 'url(#goldStroke)'}) => {
  const eyeScale = Math.max(0.07, 1 - wink);
  const sp = star;
  const starScale = sp * (1.1 + 0.3 * Math.sin(sp * 9));
  return (
    <svg width={460} height={420} viewBox="0 0 400 365" style={{overflow: 'visible'}}>
      <g fill="none" stroke={stroke} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round">
        {/* cone, bent over to the right */}
        <path d="M82 300 C104 220 140 140 182 92 C208 62 250 40 292 52 C326 62 350 90 354 128 C326 100 296 96 272 112 C240 140 262 226 304 304" />
        {/* brim */}
        <path d="M18 312 C90 280 300 280 384 318 C300 356 96 360 18 312 Z" />
        <path d="M60 322 C130 340 270 340 345 322" strokeWidth={2.5} />
        {/* patches */}
        <path d="M168 120 L206 108 L214 146 L176 156 Z" strokeWidth={3} />
        <path d="M126 182 L154 176 L158 204 L130 208 Z" strokeWidth={3} />
        <path d="M262 150 L290 160 L282 190 L258 182 Z" strokeWidth={3} />
        <path d="M168 120 L206 108" strokeWidth={1.5} strokeDasharray="3 4" />
        {/* left eye crease */}
        <path d="M130 224 Q152 206 178 224" strokeWidth={4} />
        <path d="M138 236 Q153 244 170 236" strokeWidth={2.5} />
        {/* right brow crease */}
        <path d="M222 220 Q246 202 272 220" strokeWidth={4} />
        {/* smile */}
        <path d="M122 268 Q196 312 284 262" strokeWidth={5} />
        <path d="M122 268 l-9 -7 M284 262 l10 -9" strokeWidth={3.5} />
      </g>
      {/* eyes */}
      <g fill="none" stroke={stroke} strokeWidth={4.5} strokeLinecap="round">
        <g transform="translate(154 236)">
          <path d="M-14 0 Q0 -8 14 0 Q0 7 -14 0 Z" />
          <circle r={3} fill={stroke} stroke="none" />
        </g>
        <g transform={`translate(247 234) scale(1 ${eyeScale})`}>
          <path d="M-15 0 Q0 -9 15 0 Q0 8 -15 0 Z" strokeWidth={4.5 / Math.max(0.3, eyeScale) ** 0.5} />
          <circle r={3.2} fill={stroke} stroke="none" opacity={eyeScale > 0.4 ? 1 : 0} />
        </g>
      </g>
      {/* twinkle */}
      {sp > 0.01 ? (
        <g transform={`translate(318 196) rotate(${sp * 60}) scale(${starScale})`} opacity={Math.min(1, sp * 2.5)}>
          <path d="M0 -30 Q3 -3 30 0 Q3 3 0 30 Q-3 3 -30 0 Q-3 -3 0 -30 Z" fill="#fff4c4" stroke="#f3c95c" strokeWidth={2} />
        </g>
      ) : null}
    </svg>
  );
};
