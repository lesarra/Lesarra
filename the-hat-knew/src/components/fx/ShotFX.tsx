import React from 'react';
import {fx as FX} from '../../fx';
import {Timing} from './util';
import {Glow} from './Glow';
import {Notes} from './Notes';
import {Zzz} from './Zzz';
import {Twinkle} from './Twinkle';
import {Glint} from './Glint';
import {Sparks, Sand, Snow, Fireflies, Confetti} from './Particles';
import {Leaves, Hearts, Planes, Flutter, Candles} from './Shapes';
import {Wisps, Steam, Rays} from './Atmos';

/** Renders fx[shot] in percentages of the image box. Mount inside the moving image container. */
export const ShotFX: React.FC<{shot: number; t: number; f: number; t0: number; t1: number}> = ({shot, t, f, t0, t1}) => {
  const list = FX[shot];
  if (!list) return null;
  const tm: Timing = {t, f, t0, t1, seed: shot * 13};
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {list.map((e, i) => {
        switch (e.kind) {
          case 'glow':
            return <Glow key={i} fx={e} tm={tm} idx={i} />;
          case 'notes':
            return <Notes key={i} fx={e} tm={tm} />;
          case 'zzz':
            return <Zzz key={i} fx={e} tm={tm} />;
          case 'twinkle':
            return <Twinkle key={i} fx={e} tm={tm} />;
          case 'glint':
            return <Glint key={i} fx={e} tm={tm} />;
          case 'sparks':
            return <Sparks key={i} fx={e} tm={tm} />;
          case 'sand':
            return <Sand key={i} fx={e} tm={tm} />;
          case 'snow':
            return <Snow key={i} tm={tm} />;
          case 'fireflies':
            return <Fireflies key={i} fx={e} tm={tm} />;
          case 'confetti':
            return <Confetti key={i} fx={e} tm={tm} />;
          case 'leaves':
            return <Leaves key={i} fx={e} tm={tm} />;
          case 'hearts':
            return <Hearts key={i} fx={e} tm={tm} />;
          case 'planes':
            return <Planes key={i} fx={e} tm={tm} />;
          case 'flutter':
            return <Flutter key={i} fx={e} tm={tm} />;
          case 'candles':
            return <Candles key={i} fx={e} tm={tm} />;
          case 'wisps':
            return <Wisps key={i} fx={e} tm={tm} />;
          case 'steam':
            return <Steam key={i} fx={e} tm={tm} />;
          case 'rays':
            return <Rays key={i} fx={e} tm={tm} />;
          default:
            return null;
        }
      })}
    </div>
  );
};
