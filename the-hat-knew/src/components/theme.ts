export const SERIF = "'Cormorant Garamond', 'EB Garamond', Georgia, 'Times New Roman', serif";
export const CREAM = '#f6ecd0';
export const GOLD = '#e8c56a';

export const rand = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
