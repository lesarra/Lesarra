import React from 'react';
import {AbsoluteFill, Composition, Img, Still, staticFile} from 'remotion';
import {Video} from './Video';
import {END_START, FPS as TL_FPS, TOTAL_FRAMES} from './timeline';
import {TitleDrop} from './components/TitleDrop';
import {EndSequence} from './components/end/EndSequence';
import {useEndFonts} from './components/end/endFonts';
import {Thumbnail} from './Thumbnail';

export const FPS = TL_FPS;
export const DURATION = TOTAL_FRAMES;

const END_LAYER_START = Math.round(END_START * FPS);

const TitlePreview: React.FC = () => {
  useEndFonts();
  return (
    <AbsoluteFill style={{background: '#000'}}>
      <Img src={staticFile('shots/03.webp')} style={{width: 1920, height: 1080}} />
      <TitleDrop durationInFrames={135} />
    </AbsoluteFill>
  );
};

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="HatKnew" component={Video} durationInFrames={DURATION} fps={FPS} width={1920} height={1080} />
    <Composition id="TitlePreview" component={TitlePreview} durationInFrames={135} fps={FPS} width={1920} height={1080} />
    <Composition
      id="EndPreview"
      component={EndSequence}
      defaultProps={{layerStartFrame: END_LAYER_START}}
      durationInFrames={TOTAL_FRAMES - END_LAYER_START}
      fps={FPS}
      width={1920}
      height={1080}
    />
    <Still id="Thumb1" component={Thumbnail} defaultProps={{variant: 'split' as const}} width={1280} height={720} />
    <Still id="Thumb2" component={Thumbnail} defaultProps={{variant: 'narrator' as const}} width={1280} height={720} />
    <Still id="Thumb3" component={Thumbnail} defaultProps={{variant: 'storybook' as const}} width={1280} height={720} />
  </>
);
