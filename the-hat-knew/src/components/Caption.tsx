import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {CREAM, SERIF} from './theme';

export const Caption: React.FC<{text: string; duration: number; big?: boolean}> = ({
  text,
  duration,
  big,
}) => {
  const frame = useCurrentFrame();
  const fade = Math.min(10, Math.floor(duration / 3));
  const opacity = interpolate(frame, [0, fade, duration - fade, duration], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [0, fade], [10, 0], {extrapolateRight: 'clamp'});
  const pop = big
    ? interpolate(frame, [0, 14, 30], [0.85, 1.06, 1], {extrapolateRight: 'clamp'})
    : 1;
  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: big ? 120 : 84}}>
      <div
        style={{
          opacity,
          transform: `translateY(${rise}px) scale(${pop})`,
          fontFamily: SERIF,
          fontStyle: big ? 'normal' : 'italic',
          fontWeight: big ? 700 : 500,
          fontSize: big ? 170 : 62,
          letterSpacing: big ? '0.08em' : '0.01em',
          color: big ? '#ffe9a8' : CREAM,
          textAlign: 'center',
          maxWidth: 1560,
          lineHeight: 1.15,
          textShadow: big
            ? '0 4px 18px rgba(0,0,0,0.9), 0 0 40px rgba(232,170,50,0.7), 0 0 4px rgba(0,0,0,0.9)'
            : '0 2px 10px rgba(10,5,0,0.95), 0 0 24px rgba(10,5,0,0.8), 0 0 3px rgba(0,0,0,0.9)',
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};
