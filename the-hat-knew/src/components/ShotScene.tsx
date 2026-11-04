import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import {rand} from './theme';

export const ShotScene: React.FC<{
  image: string;
  shot: number;
  duration: number;
  fadeIn: number;
}> = ({image, shot, duration, fadeIn}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, Math.max(1, duration)], [0, 1], {
    extrapolateRight: 'clamp',
  });
  // Deterministic variation by shot number
  const zoomIn = shot % 2 === 1;
  const amount = 0.07 + rand(shot) * 0.08;
  const s0 = zoomIn ? 1.04 : 1.04 + amount;
  const s1 = zoomIn ? 1.04 + amount : 1.04;
  const scale = interpolate(t, [0, 1], [s0, s1]);
  const dirX = Math.floor(rand(shot + 11) * 3) - 1; // -1,0,1
  const dirY = Math.floor(rand(shot + 23) * 3) - 1;
  const px = interpolate(t, [0, 1], [-dirX * 1.6, dirX * 1.6]);
  const py = interpolate(t, [0, 1], [-dirY * 1.2, dirY * 1.2]);
  const opacity = fadeIn > 0 ? interpolate(frame, [0, fadeIn], [0, 1], {extrapolateRight: 'clamp'}) : 1;

  return (
    <AbsoluteFill style={{opacity, backgroundColor: '#120c07'}}>
      <Img
        src={staticFile(image)}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transform: `translate(${px}%, ${py}%) scale(${scale})`,
          transformOrigin: '50% 50%',
        }}
      />
    </AbsoluteFill>
  );
};
