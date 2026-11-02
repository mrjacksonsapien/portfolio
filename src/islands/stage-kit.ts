// Shared by the small canvas animations on the showcase pages (aqua-stages.ts, maze-stages.ts, Stage.svelte).

export interface StageArgs {
  g: CanvasRenderingContext2D;
  w: number;
  h: number;
  t: number;
  font: string;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const k = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return k * k * (3 - 2 * k);
};
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export function label(
  g: CanvasRenderingContext2D,
  font: string,
  size: number,
  text: string,
  x: number,
  y: number,
  alpha: number,
  align: CanvasTextAlign = 'left',
) {
  g.font = `${size}px ${font}`;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.globalAlpha = alpha;
  g.fillText(text, x, y);
}
