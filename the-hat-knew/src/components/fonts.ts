import {useEffect} from 'react';
import {continueRender, delayRender} from 'remotion';
import '@fontsource/im-fell-english/400.css';
import '@fontsource/im-fell-english/400-italic.css';
import '@fontsource/cinzel-decorative/700.css';
import '@fontsource/cinzel-decorative/900.css';

const SPECS = [
  '400 48px "IM Fell English"',
  'italic 400 48px "IM Fell English"',
  '700 48px "Cinzel Decorative"',
  '900 48px "Cinzel Decorative"',
];

/** Blocks rendering until the storybook fonts are decoded. */
export const useStorybookFonts = () => {
  useEffect(() => {
    const h = delayRender('Loading storybook fonts');
    Promise.all(SPECS.map((s) => document.fonts.load(s, 'AaBbSLYTHERIN 123')))
      .then(() => document.fonts.ready)
      .catch(() => undefined)
      .finally(() => continueRender(h));
  }, []);
};
