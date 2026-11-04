import React from 'react';
import {Composition} from 'remotion';
import {Video} from './Video';
import {AUDIO_DURATION} from './shots';

export const FPS = 30;
export const DURATION = Math.ceil(AUDIO_DURATION * FPS);

export const RemotionRoot: React.FC = () => (
  <Composition
    id="HatKnew"
    component={Video}
    durationInFrames={DURATION}
    fps={FPS}
    width={1920}
    height={1080}
  />
);
