// Per-shot "image magic" plan, owned by the main session. Read-only for agents.
// All coordinates are fractions of the shot IMAGE (x: 0 = left .. 1 = right, y: 0 = top .. 1 = bottom).
// The images are 16:9 like the frame, so (x, y) maps straight onto the image box before Ken Burns motion;
// effects must be rendered INSIDE the moving image container so they stay glued to the picture.
// Coordinates were read off a grid by eye: treat them as +/- 3 %, and keep effects soft so small misses don't show.

export type Pt = {x: number; y: number};
export type Box = {x0: number; y0: number; x1: number; y1: number};

export type Fx =
  | {kind: 'notes'; from: Pt; color?: string} // music notes rising and swaying out of the hat's mouth while it sings
  | {kind: 'zzz'; from: Pt} // sleepy "z z Z" in the storybook font drifting up and fading
  | {kind: 'twinkle'; at: Pt[]; color?: string; size?: number} // 4-point star glints popping one after another
  | {kind: 'glint'; box: Box; angle?: number} // a soft light band sweeping once (or twice) across glass / metal
  | {kind: 'glow'; at: Pt; r: number; color: string; pulse: 'flicker' | 'beat' | 'slow'} // additive light (screen blend)
  | {kind: 'sparks'; from: Pt; color: string} // magic sparks spraying from a wand tip, gravity + fade
  | {kind: 'wisps'; box: Box; color: string} // slow curling smoke / magic mist drifting through a region
  | {kind: 'steam'; from: Pt[]} // thin rising steam / candle-smoke curls
  | {kind: 'sand'; from: Pt; to: Pt; color: string} // thin falling sand stream through an hourglass neck
  | {kind: 'snow'} // gentle full-frame snowfall with a few frost sparkles
  | {kind: 'fireflies'; box: Box; count: number} // glowing dots wandering and pulsing
  | {kind: 'leaves'; count: number} // a few gold leaves tumbling down across the frame
  | {kind: 'hearts'; box: Box; colors: string[]} // small hearts floating up and fading
  | {kind: 'planes'; paths: {from: Pt; to: Pt}[]} // paper planes gliding along gentle arcs
  | {kind: 'flutter'; box: Box; color: string} // small envelopes / papers flying up and spinning
  | {kind: 'rays'; from: Pt; color?: string} // soft god rays fanning from a light source
  | {kind: 'candles'; box: Box; count: number} // extra small floating candles bobbing (Great Hall magic)
  | {kind: 'confetti'; colors: string[]}; // falling confetti / gold leaf flakes

/** Hat "mouth" for lip-sync: an ellipse around the hat's mouth crease. While a word is being sung,
 * the region is stretched vertically around its centre (feathered mask), so the crease looks like it opens. */
export type Mouth = {x: number; y: number; rx: number; ry: number; strength?: number};

const GOLD = '#ffd77a';
const GREEN = '#5dffa8';
const WARM = '#ffb35c';
const MOON = '#cfe3ff';

export const mouths: Record<number, Mouth> = {
  2: {x: 0.52, y: 0.64, rx: 0.2, ry: 0.05},
  6: {x: 0.47, y: 0.63, rx: 0.12, ry: 0.04},
  7: {x: 0.52, y: 0.56, rx: 0.13, ry: 0.06, strength: 1.5}, // "SLYTHERIN!" shout
  17: {x: 0.5, y: 0.71, rx: 0.12, ry: 0.04},
  19: {x: 0.52, y: 0.56, rx: 0.13, ry: 0.06},
  24: {x: 0.53, y: 0.75, rx: 0.18, ry: 0.05},
  25: {x: 0.52, y: 0.6, rx: 0.18, ry: 0.05},
  32: {x: 0.45, y: 0.62, rx: 0.15, ry: 0.045},
  33: {x: 0.5, y: 0.75, rx: 0.12, ry: 0.04},
  39: {x: 0.48, y: 0.41, rx: 0.12, ry: 0.05},
  45: {x: 0.55, y: 0.57, rx: 0.14, ry: 0.045},
  47: {x: 0.5, y: 0.75, rx: 0.1, ry: 0.035, strength: 0.6},
  55: {x: 0.48, y: 0.41, rx: 0.12, ry: 0.05, strength: 1.3},
  61: {x: 0.5, y: 0.65, rx: 0.3, ry: 0.06},
};

export const fx: Record<number, Fx[]> = {
  1: [{kind: 'zzz', from: {x: 0.66, y: 0.38}}, {kind: 'glow', at: {x: 0.97, y: 0.1}, r: 0.09, color: WARM, pulse: 'flicker'}],
  2: [{kind: 'twinkle', at: [{x: 0.4, y: 0.5}], color: '#ff9a9a', size: 1.2}],
  3: [{kind: 'candles', box: {x0: 0.15, y0: 0.12, x1: 0.85, y1: 0.5}, count: 14}, {kind: 'twinkle', at: [{x: 0.3, y: 0.04}, {x: 0.45, y: 0.02}, {x: 0.6, y: 0.05}, {x: 0.72, y: 0.03}], color: '#fff6d8', size: 0.6}],
  4: [{kind: 'leaves', count: 5}],
  5: [{kind: 'snow'}, {kind: 'twinkle', at: [{x: 0.27, y: 0.17}, {x: 0.23, y: 0.26}, {x: 0.31, y: 0.24}], color: '#e8f6ff', size: 1.1}],
  7: [{kind: 'sparks', from: {x: 0.52, y: 0.56}, color: GREEN}],
  10: [{kind: 'wisps', box: {x0: 0, y0: 0.55, x1: 1, y1: 1}, color: '#6fe0b0'}, {kind: 'glow', at: {x: 0.16, y: 0.3}, r: 0.07, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.82, y: 0.35}, r: 0.07, color: WARM, pulse: 'flicker'}],
  11: [{kind: 'glow', at: {x: 0.82, y: 0.38}, r: 0.09, color: WARM, pulse: 'flicker'}],
  12: [{kind: 'sand', from: {x: 0.5, y: 0.48}, to: {x: 0.5, y: 0.66}, color: '#4fd18f'}, {kind: 'glow', at: {x: 0.25, y: 0.42}, r: 0.08, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.74, y: 0.42}, r: 0.08, color: WARM, pulse: 'flicker'}],
  13: [{kind: 'sand', from: {x: 0.62, y: 0.5}, to: {x: 0.62, y: 0.66}, color: '#ff6a4a'}, {kind: 'glow', at: {x: 0.62, y: 0.5}, r: 0.06, color: WARM, pulse: 'flicker'}],
  15: [{kind: 'sparks', from: {x: 0.385, y: 0.33}, color: GREEN}],
  16: [{kind: 'confetti', colors: [GOLD, '#e8b93c', '#c0262d']}, {kind: 'rays', from: {x: 0.5, y: 0.3}, color: GOLD}],
  17: [{kind: 'rays', from: {x: 0.5, y: 0.0}, color: '#ffe6a8'}],
  18: [{kind: 'glow', at: {x: 0.5, y: 0.06}, r: 0.08, color: WARM, pulse: 'flicker'}, {kind: 'leaves', count: 4}],
  19: [{kind: 'notes', from: {x: 0.55, y: 0.52}, color: GOLD}],
  20: [{kind: 'glow', at: {x: 0.17, y: 0.42}, r: 0.17, color: GREEN, pulse: 'beat'}, {kind: 'leaves', count: 3}],
  21: [{kind: 'leaves', count: 4}],
  22: [{kind: 'glow', at: {x: 0.468, y: 0.65}, r: 0.1, color: WARM, pulse: 'flicker'}],
  23: [{kind: 'fireflies', box: {x0: 0, y0: 0, x1: 1, y1: 0.6}, count: 22}, {kind: 'twinkle', at: [{x: 0.66, y: 0.47}, {x: 0.62, y: 0.52}], color: '#ffffff', size: 0.8}, {kind: 'glow', at: {x: 0.82, y: 0.27}, r: 0.07, color: WARM, pulse: 'flicker'}],
  24: [{kind: 'notes', from: {x: 0.53, y: 0.72}, color: GOLD}],
  26: [{kind: 'rays', from: {x: 0.33, y: 0.2}, color: '#ffe6a8'}, {kind: 'rays', from: {x: 0.66, y: 0.2}, color: '#ffe6a8'}],
  27: [{kind: 'steam', from: [{x: 0.46, y: 0.72}]}, {kind: 'glow', at: {x: 0.3, y: 0.45}, r: 0.06, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.69, y: 0.42}, r: 0.06, color: WARM, pulse: 'flicker'}],
  28: [{kind: 'sparks', from: {x: 0.23, y: 0.77}, color: GREEN}],
  29: [{kind: 'hearts', box: {x0: 0.05, y0: 0.1, x1: 0.3, y1: 0.55}, colors: ['#ff8fa3', '#ff5e7a']}],
  30: [{kind: 'glow', at: {x: 0.42, y: 0.25}, r: 0.15, color: '#fff2c4', pulse: 'slow'}, {kind: 'leaves', count: 6}],
  31: [{kind: 'twinkle', at: [{x: 0.27, y: 0.56}, {x: 0.34, y: 0.7}, {x: 0.6, y: 0.5}, {x: 0.44, y: 0.47}], color: '#fff3c0', size: 0.9}],
  32: [{kind: 'glint', box: {x0: 0.3, y0: 0.2, x1: 0.6, y1: 0.38}, angle: 20}, {kind: 'twinkle', at: [{x: 0.33, y: 0.24}, {x: 0.56, y: 0.29}], color: '#fff3c0', size: 1.2}],
  34: [{kind: 'steam', from: [{x: 0.3, y: 0.42}, {x: 0.68, y: 0.38}]}],
  35: [{kind: 'glow', at: {x: 0.65, y: 0.18}, r: 0.08, color: WARM, pulse: 'flicker'}, {kind: 'twinkle', at: [{x: 0.17, y: 0.12}, {x: 0.42, y: 0.55}], color: '#a9c8ff', size: 0.8}],
  36: [{kind: 'glow', at: {x: 0.37, y: 0.12}, r: 0.035, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.41, y: 0.11}, r: 0.035, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.5, y: 0.11}, r: 0.035, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.56, y: 0.12}, r: 0.035, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.62, y: 0.12}, r: 0.035, color: WARM, pulse: 'flicker'}, {kind: 'confetti', colors: ['#f0c419', '#ff6a8a', '#7ad0ff', '#7dff9a', '#ffffff']}],
  37: [{kind: 'glint', box: {x0: 0.44, y0: 0.34, x1: 0.56, y1: 0.9}, angle: 80}, {kind: 'twinkle', at: [{x: 0.52, y: 0.35}], color: '#ff6a6a', size: 1.1}],
  38: [{kind: 'glow', at: {x: 0.53, y: 0.6}, r: 0.06, color: GREEN, pulse: 'beat'}, {kind: 'glow', at: {x: 0.18, y: 0.24}, r: 0.06, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.6, y: 0.18}, r: 0.06, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.72, y: 0.27}, r: 0.06, color: WARM, pulse: 'flicker'}],
  39: [{kind: 'notes', from: {x: 0.48, y: 0.4}, color: GOLD}],
  40: [{kind: 'twinkle', at: [{x: 0.08, y: 0.3}, {x: 0.17, y: 0.33}, {x: 0.27, y: 0.22}, {x: 0.75, y: 0.2}, {x: 0.83, y: 0.3}], color: GREEN, size: 0.9}],
  41: [{kind: 'leaves', count: 5}],
  42: [{kind: 'glow', at: {x: 0.5, y: 0.06}, r: 0.06, color: MOON, pulse: 'slow'}, {kind: 'glow', at: {x: 0.5, y: 0.72}, r: 0.12, color: WARM, pulse: 'beat'}, {kind: 'leaves', count: 6}],
  43: [{kind: 'fireflies', box: {x0: 0.05, y0: 0.05, x1: 0.95, y1: 0.85}, count: 38}],
  44: [{kind: 'sand', from: {x: 0.375, y: 0.56}, to: {x: 0.375, y: 0.7}, color: '#e2c79a'}, {kind: 'glow', at: {x: 0.6, y: 0.47}, r: 0.06, color: WARM, pulse: 'flicker'}],
  45: [{kind: 'twinkle', at: [{x: 0.43, y: 0.4}], color: '#fff3c0', size: 1.4}],
  46: [{kind: 'glow', at: {x: 0.33, y: 0.42}, r: 0.08, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.68, y: 0.37}, r: 0.08, color: WARM, pulse: 'flicker'}, {kind: 'steam', from: [{x: 0.5, y: 0.55}]}],
  47: [{kind: 'glow', at: {x: 0.17, y: 0.2}, r: 0.08, color: MOON, pulse: 'slow'}, {kind: 'glow', at: {x: 0.83, y: 0.2}, r: 0.08, color: MOON, pulse: 'slow'}],
  48: [{kind: 'glow', at: {x: 0.88, y: 0.22}, r: 0.18, color: MOON, pulse: 'slow'}],
  49: [{kind: 'glint', box: {x0: 0.08, y0: 0.05, x1: 0.45, y1: 0.95}, angle: 25}, {kind: 'glow', at: {x: 0.3, y: 0.12}, r: 0.08, color: MOON, pulse: 'slow'}],
  50: [{kind: 'glint', box: {x0: 0.22, y0: 0.05, x1: 0.52, y1: 0.95}, angle: 25}, {kind: 'glow', at: {x: 0.45, y: 0.22}, r: 0.06, color: MOON, pulse: 'slow'}],
  51: [{kind: 'glow', at: {x: 0.28, y: 0.4}, r: 0.08, color: '#ffffff', pulse: 'beat'}, {kind: 'twinkle', at: [{x: 0.12, y: 0.3}, {x: 0.86, y: 0.32}, {x: 0.6, y: 0.7}], color: '#fff3c0', size: 0.9}],
  52: [{kind: 'twinkle', at: [{x: 0.23, y: 0.25}, {x: 0.7, y: 0.2}, {x: 0.82, y: 0.5}], color: GOLD, size: 0.9}],
  53: [{kind: 'glow', at: {x: 0.52, y: 0.57}, r: 0.11, color: GOLD, pulse: 'beat'}, {kind: 'twinkle', at: [{x: 0.47, y: 0.47}, {x: 0.58, y: 0.62}], color: '#fffbe0', size: 1}],
  54: [{kind: 'glow', at: {x: 0.5, y: 0.5}, r: 0.12, color: '#fff3d0', pulse: 'beat'}, {kind: 'hearts', box: {x0: 0.25, y0: 0.2, x1: 0.75, y1: 0.85}, colors: ['#ff5e6c', '#4fd18f']}],
  55: [{kind: 'notes', from: {x: 0.48, y: 0.4}, color: GOLD}, {kind: 'confetti', colors: [GOLD, '#e8b93c']}],
  56: [{kind: 'glow', at: {x: 0.28, y: 0.27}, r: 0.07, color: '#fff3d0', pulse: 'beat'}, {kind: 'glow', at: {x: 0.73, y: 0.27}, r: 0.07, color: '#fff3d0', pulse: 'beat'}, {kind: 'twinkle', at: [{x: 0.15, y: 0.5}, {x: 0.4, y: 0.7}, {x: 0.6, y: 0.45}, {x: 0.85, y: 0.65}], color: GOLD, size: 0.8}],
  57: [{kind: 'hearts', box: {x0: 0.62, y0: 0.15, x1: 0.92, y1: 0.6}, colors: ['#ff8fa3', '#4fd18f']}],
  58: [{kind: 'twinkle', at: [{x: 0.4, y: 0.06}, {x: 0.45, y: 0.035}, {x: 0.5, y: 0.07}], color: '#ffffff', size: 1.1}, {kind: 'confetti', colors: [GOLD, '#e8b93c']}],
  59: [{kind: 'planes', paths: [{from: {x: 0.08, y: 0.78}, to: {x: 0.7, y: 0.25}}, {from: {x: 0.95, y: 0.62}, to: {x: 0.35, y: 0.15}}]}, {kind: 'glow', at: {x: 0.5, y: 0.18}, r: 0.08, color: WARM, pulse: 'flicker'}, {kind: 'glow', at: {x: 0.5, y: 0.43}, r: 0.06, color: WARM, pulse: 'flicker'}],
  60: [{kind: 'flutter', box: {x0: 0.1, y0: 0.05, x1: 0.9, y1: 0.7}, color: '#d9452b'}],
  61: [{kind: 'hearts', box: {x0: 0, y0: 0, x1: 1, y1: 0.45}, colors: ['#f08a4b', '#ff5e6c']}, {kind: 'confetti', colors: [GOLD, '#e8b93c']}],
  62: [{kind: 'candles', box: {x0: 0.15, y0: 0.1, x1: 0.85, y1: 0.45}, count: 16}, {kind: 'confetti', colors: [GOLD, '#e8b93c', '#c0262d', '#2fa36b']}, {kind: 'rays', from: {x: 0.5, y: 0.0}, color: '#ffe6a8'}],
  63: [{kind: 'glow', at: {x: 0.855, y: 0.32}, r: 0.1, color: WARM, pulse: 'flicker'}, {kind: 'leaves', count: 3}],
  64: [{kind: 'glow', at: {x: 0.85, y: 0.9}, r: 0.1, color: '#9dffb8', pulse: 'flicker'}],
};
