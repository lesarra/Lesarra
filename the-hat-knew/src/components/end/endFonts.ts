import {useEffect} from 'react';
import {continueRender, delayRender} from 'remotion';
import '@fontsource/pinyon-script/400.css';
import {useStorybookFonts} from '../fonts';

export const SCRIPT_FONT = "'Pinyon Script', 'Great Vibes', 'IM Fell English', cursive";

/** Loads the storybook fonts plus the calligraphy script font. */
export const useEndFonts = () => {
  useStorybookFonts();
  useEffect(() => {
    const h = delayRender('Loading Pinyon Script');
    document.fonts
      .load('400 48px "Pinyon Script"', 'Zandran × Alarix')
      .then(() => document.fonts.ready)
      .catch(() => undefined)
      .finally(() => continueRender(h));
  }, []);
};
