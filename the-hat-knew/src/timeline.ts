// Master timeline, owned by the main session. Read-only for agents.
// All times are in seconds on the composition clock (the song starts at 0).

export const FPS = 30;

/** Length of the original song file. */
export const SONG_END = 218.424;

/** Extended soundtrack: the song, then a credits tail (stretched final chord,
 * book-close thump, wink chime). Built by the main session. */
export const AUDIO_FILE = 'audio/hat_knew_extended.mp3';

/** Title drop over the instrumental break (shot 3, Great Hall). */
export const TITLE_DROP = {start: 7.62, end: 12.12};

/** The end sequence replaces shot 65 and runs to the end of the video. */
export const END_START = 215.7;
export const END_DURATION = 13.8;
export const TOTAL_DURATION = END_START + END_DURATION; // 229.5 s
export const TOTAL_FRAMES = Math.ceil(TOTAL_DURATION * FPS); // 6885

/** Beats inside the end sequence, in seconds relative to END_START.
 * The soundtrack is cut to these exact moments, so keep them in sync. */
export const END_BEATS = {
  pageHoldEnd: 1.5, // final open-book page (shot 65 image) holds until here
  closeStart: 1.5, // left half of the page flips over the spine...
  closeEnd: 3.0, // ...and lands: soft "thump" in the soundtrack (218.70 s)
  centerEnd: 4.4, // camera settles on the closed book cover, golden dust puff
  titleStart: 4.4, // "The Hat Knew" fills with molten gold, then a glint sweeps
  titleEnd: 6.2,
  madeByStart: 6.4, // "made by" fades in
  namesStart: 6.8, // "Zandran × Alarix" writes in like ink calligraphy
  namesEnd: 8.8,
  wink: 10.4, // the embossed hat emblem winks: twinkle chime (226.10 s)
  fadeStart: 12.2, // fade to black
  end: END_DURATION,
};

export const CREDITS = {
  title: 'The Hat Knew',
  madeBy: 'made by',
  names: 'Zandran × Alarix',
};

/** Finale montage inside shot 62 (198.50–207.50): one quick memory flash per
 * "the hat knew", then back to the Great Hall for "all along".
 * image = path under public/. */
export const FINALE_MONTAGE = [
  {start: 198.5, end: 199.62, image: 'shots/45.webp', note: 'the hat winking'},
  {start: 199.62, end: 200.62, image: 'shots/57.webp', note: 'Harry blushing in her scarf'},
  {start: 200.62, end: 201.64, image: 'shots/58.webp', note: 'Draconia with the tiara'},
  {start: 201.64, end: 202.7, image: 'shots/54.webp', note: 'the two heart halves'},
  // 202.70 onward: back to shot 62 (Great Hall) for "All along." with a big gold burst
];
