// Drawing code for the SGL project page: one small looping animation per pipeline stage.
// Plain functions that draw one frame on a 2D context; SglStage.svelte owns the canvas and the loop.
// Everything is drawn in the foreground color at varying opacity (see docs/art-direction.md).

export type StageKind = 'mesh' | 'transform' | 'culling' | 'projection' | 'clipping' | 'raster';

export interface Frame {
  g: CanvasRenderingContext2D;
  w: number;
  h: number;
  /** Seconds since the animation started. */
  t: number;
  font: string;
}

type Pt = [number, number];

const TAU = Math.PI * 2;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));
const ease = (x: number) => x * x * (3 - 2 * x);
/** 1 between a and b, fading in and out over `fade` seconds on each side. */
const win = (t: number, a: number, b: number, fade = 0.5) => clamp01((t - a) / fade) * clamp01((b - t) / fade);

function line(g: CanvasRenderingContext2D, [x1, y1]: Pt, [x2, y2]: Pt) {
  g.beginPath();
  g.moveTo(x1, y1);
  g.lineTo(x2, y2);
  g.stroke();
}

function dot(g: CanvasRenderingContext2D, [x, y]: Pt, r: number) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}

function path(g: CanvasRenderingContext2D, pts: Pt[]) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
}

function arrow(g: CanvasRenderingContext2D, from: Pt, to: Pt) {
  line(g, from, to);
  const a = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const head = 6;
  g.beginPath();
  g.moveTo(to[0], to[1]);
  g.lineTo(to[0] - head * Math.cos(a - 0.45), to[1] - head * Math.sin(a - 0.45));
  g.moveTo(to[0], to[1]);
  g.lineTo(to[0] - head * Math.cos(a + 0.45), to[1] - head * Math.sin(a + 0.45));
  g.stroke();
}

function text(f: Frame, s: string, x: number, y: number, alpha = 0.6, align: CanvasTextAlign = 'left') {
  f.g.globalAlpha = alpha;
  f.g.font = `11px ${f.font}`;
  f.g.textAlign = align;
  f.g.fillText(s, x, y);
}

/** Rotate around y by `yaw`, around x by `tilt`, then perspective with the eye 4 units away. Returns screen x, y (y down). */
function view3(x: number, y: number, z: number, yaw: number, tilt: number, f: Frame, scale: number): Pt {
  const x1 = x * Math.cos(yaw) + z * Math.sin(yaw);
  const z1 = -x * Math.sin(yaw) + z * Math.cos(yaw);
  const y1 = y * Math.cos(tilt) - z1 * Math.sin(tilt);
  const z2 = y * Math.sin(tilt) + z1 * Math.cos(tilt);
  const k = 4 / (4 - z2);
  return [f.w / 2 + x1 * k * scale, f.h / 2 - y1 * k * scale];
}

// --- 1. Vertex -> triangle -> cube ---------------------------------------------------------

const CUBE_VERTS: [number, number, number][] = Array.from({ length: 8 }, (_, i) => [
  i & 1 ? 1 : -1,
  i & 2 ? 1 : -1,
  i & 4 ? 1 : -1,
]);
const CUBE_EDGES: [number, number][] = [];
const CUBE_DIAGONALS: [number, number][] = [];
for (let a = 0; a < 8; a++) {
  for (let bit = 1; bit < 8; bit <<= 1) if (!(a & bit)) CUBE_EDGES.push([a, a | bit]);
}
// One diagonal per face: the lowest and highest vertex of the four sharing a coordinate.
for (let axis = 1; axis < 8; axis <<= 1) {
  for (const side of [0, axis]) {
    const face = [0, 1, 2, 3, 4, 5, 6, 7].filter((v) => (v & axis) === side);
    CUBE_DIAGONALS.push([face[0], face[3]]);
  }
}

function mesh(f: Frame) {
  const { g, w, h } = f;
  const t = f.t % 13;
  const c: Pt = [w / 2, h / 2];

  // One vertex.
  const a1 = win(t, 0, 2.6);
  if (a1 > 0) {
    g.globalAlpha = a1;
    dot(g, c, 3 + 1.5 * Math.sin(t * 5));
    g.globalAlpha = a1 * 0.4;
    g.beginPath();
    g.arc(c[0], c[1], 8 + 4 * Math.sin(t * 5), 0, TAU);
    g.stroke();
    text(f, 'vertex = (x, y, z)', c[0], h - 16, a1 * 0.7, 'center');
  }

  // Three vertices, one triangle.
  const a2 = win(t, 2.6, 6);
  if (a2 > 0) {
    const tri: Pt[] = [
      [c[0], c[1] - w * 0.22],
      [c[0] - w * 0.24, c[1] + w * 0.16],
      [c[0] + w * 0.24, c[1] + w * 0.16],
    ];
    const grow = ease(seg(t, 3.2, 4.6));
    const perimeter = tri.reduce((s, p, i) => s + Math.hypot(p[0] - tri[(i + 1) % 3][0], p[1] - tri[(i + 1) % 3][1]), 0);
    g.globalAlpha = a2;
    g.setLineDash([perimeter * grow, perimeter]);
    path(g, tri);
    g.stroke();
    g.setLineDash([]);
    g.globalAlpha = a2 * 0.12 * grow;
    path(g, tri);
    g.fill();
    g.globalAlpha = a2;
    tri.forEach((p) => dot(g, p, 3));
    text(f, '3 vertices = 1 triangle', c[0], h - 16, a2 * 0.7, 'center');
  }

  // A cube: 8 vertices, 12 triangles.
  const a3 = win(t, 6, 13);
  if (a3 > 0) {
    const yaw = t * 0.6;
    const p = CUBE_VERTS.map(([x, y, z]) => view3(x, y, z, yaw, 0.5, f, w * 0.17));
    g.globalAlpha = a3 * 0.85;
    CUBE_EDGES.forEach(([i, j]) => line(g, p[i], p[j]));
    g.globalAlpha = a3 * 0.3 * ease(seg(t, 7.5, 9.5));
    CUBE_DIAGONALS.forEach(([i, j]) => line(g, p[i], p[j]));
    g.globalAlpha = a3;
    p.forEach((q) => dot(g, q, 2.5));
    text(f, '8 vertices = 12 triangles = a cube', c[0], h - 16, a3 * 0.7, 'center');
  }
}

// --- 2. Matrices move things around --------------------------------------------------------

function transform(f: Frame) {
  const { g, w, h, t } = f;
  const u = w / 6.5;
  const origin: Pt = [w * 0.36, h * 0.66];
  const px = (x: number, y: number): Pt => [origin[0] + x * u, origin[1] - y * u];

  const s = 1 + 0.35 * Math.sin(t * 0.9);
  const th = t * 0.5;
  const tx = 0.7 * Math.sin(t * 0.7);
  const ty = 0.4 * Math.cos(t * 0.6);
  const a = s * Math.cos(th);
  const b = s * Math.sin(th);
  const c = -b;
  const d = a;
  const apply = (x: number, y: number): Pt => px(a * x + c * y + tx, b * x + d * y + ty);

  // Axes.
  g.globalAlpha = 0.2;
  g.lineWidth = 1;
  for (let i = -2; i <= 5; i++) {
    line(g, px(i, -2), px(i, 4));
    line(g, px(-2, i), px(5, i));
  }

  const square: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  // Original, dashed.
  g.globalAlpha = 0.35;
  g.setLineDash([3, 4]);
  path(g, square.map(([x, y]) => px(x, y)));
  g.stroke();
  g.setLineDash([]);
  // Transformed.
  const moved = square.map(([x, y]) => apply(x, y));
  g.globalAlpha = 0.14;
  path(g, moved);
  g.fill();
  g.globalAlpha = 0.9;
  path(g, moved);
  g.stroke();
  // Where the axes end up: the columns of the matrix.
  g.lineWidth = 1.5;
  arrow(g, apply(0, 0), apply(1, 0));
  arrow(g, apply(0, 0), apply(0, 1));
  g.lineWidth = 1;
  text(f, 'x', apply(1.2, 0.05)[0], apply(1.2, 0.05)[1], 0.8);
  text(f, 'y', apply(-0.05, 1.25)[0], apply(-0.05, 1.25)[1], 0.8);

  const n = (v: number) => v.toFixed(2).padStart(5);
  text(f, `${n(a)} ${n(c)} ${n(tx)}`, 12, 20, 0.7);
  text(f, `${n(b)} ${n(d)} ${n(ty)}`, 12, 34, 0.7);
  text(f, `${n(0)} ${n(0)} ${n(1)}`, 12, 48, 0.7);
  text(f, 'the columns are where the axes land', w / 2, h - 16, 0.55, 'center');
}

// --- 3. Backface culling -------------------------------------------------------------------

function culling(f: Frame) {
  const { g, w, h, t } = f;
  const scale = w * 0.22;
  const verts: [number, number][] = [[0, 1], [-1, -0.8], [1, -0.8]];
  const p = verts.map(([x, y]) => view3(x, y, 0, t * 0.9, 0.2, f, scale));
  // Signed area with y up: positive means counter-clockwise, i.e. facing the camera.
  const area =
    -((p[1][0] - p[0][0]) * (p[2][1] - p[0][1]) - (p[1][1] - p[0][1]) * (p[2][0] - p[0][0])) / (2 * scale * scale);
  const front = area > 0;

  g.lineWidth = 1.5;
  if (front) {
    g.globalAlpha = 0.2;
    path(g, p);
    g.fill();
    g.globalAlpha = 0.95;
    path(g, p);
    g.stroke();
  } else {
    g.globalAlpha = 0.35;
    g.setLineDash([3, 5]);
    path(g, p);
    g.stroke();
    g.setLineDash([]);
  }
  g.lineWidth = 1;
  g.globalAlpha = 0.9;
  p.forEach((q, i) => {
    dot(g, q, 3);
    text(f, String(i + 1), q[0] + (q[0] < w / 2 ? -14 : 8), q[1] + (i === 0 ? -8 : 14), 0.8);
  });

  const sign = area >= 0 ? '+' : '-';
  text(f, `signed area ${sign}${Math.abs(area).toFixed(2)}`, w / 2, h - 34, 0.7, 'center');
  text(f, front ? 'facing us: drawn' : 'facing away: culled', w / 2, h - 16, front ? 0.85 : 0.45, 'center');
}

// --- 4. Perspective projection -------------------------------------------------------------

function projection(f: Frame) {
  const { g, w, h, t } = f;
  const cam: Pt = [w * 0.1, h * 0.5];
  const nearX = w * 0.42;
  const farX = w * 0.95;
  const slope = 0.42;
  const half = (x: number) => (x - cam[0]) * slope;

  // Frustum and near plane.
  g.globalAlpha = 0.3;
  line(g, cam, [farX, cam[1] - half(farX)]);
  line(g, cam, [farX, cam[1] + half(farX)]);
  line(g, [farX, cam[1] - half(farX)], [farX, cam[1] + half(farX)]);
  g.globalAlpha = 0.9;
  g.lineWidth = 2;
  line(g, [nearX, cam[1] - half(nearX)], [nearX, cam[1] + half(nearX)]);
  g.lineWidth = 1;
  dot(g, cam, 3);
  text(f, 'camera', cam[0] - 4, cam[1] + 20, 0.6);
  text(f, 'near plane', nearX, cam[1] - half(nearX) - 8, 0.6, 'center');

  // An object of fixed size sliding away from the camera.
  const x = w * (0.55 + 0.35 * (0.5 + 0.5 * Math.sin(t * 0.8)));
  const top = cam[1] - h * 0.2;
  const bottom = cam[1] + h * 0.06;
  const ratio = (nearX - cam[0]) / (x - cam[0]);
  const topP = cam[1] + (top - cam[1]) * ratio;
  const bottomP = cam[1] + (bottom - cam[1]) * ratio;

  g.globalAlpha = 0.35;
  g.setLineDash([2, 4]);
  line(g, cam, [x, top]);
  line(g, cam, [x, bottom]);
  g.setLineDash([]);
  g.globalAlpha = 0.9;
  g.lineWidth = 2;
  line(g, [x, top], [x, bottom]);
  line(g, [nearX, topP], [nearX, bottomP]);
  g.lineWidth = 1;
  dot(g, [nearX, topP], 3);
  dot(g, [nearX, bottomP], 3);

  const z = ((x - cam[0]) / w) * 10;
  text(f, `z = ${z.toFixed(1)}`, 12, 20, 0.7);
  text(f, `size on screen = 1 / z`, 12, 34, 0.7);
  text(f, "x' = x / z   y' = y / z", w / 2, h - 16, 0.55, 'center');
}

// --- 5. Clipping against the near plane ----------------------------------------------------

function clipLeft(poly: Pt[], x0: number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const aIn = a[0] >= x0;
    const bIn = b[0] >= x0;
    if (aIn) out.push(a);
    if (aIn !== bIn) {
      const k = (x0 - a[0]) / (b[0] - a[0]);
      out.push([x0, a[1] + k * (b[1] - a[1])]);
    }
  }
  return out;
}

function clipping(f: Frame) {
  const { g, w, h, t } = f;
  const plane = w * 0.5;
  const cx = plane + w * 0.3 * Math.sin(t * 0.7);
  const cy = h * 0.5;
  const tri: Pt[] = [
    [cx - w * 0.22, cy - h * 0.2],
    [cx + w * 0.2, cy - h * 0.05],
    [cx - w * 0.05, cy + h * 0.22],
  ];
  const clipped = clipLeft(tri, plane);

  // Behind the plane is greyed out.
  g.globalAlpha = 0.06;
  g.fillRect(0, 0, plane, h);
  g.globalAlpha = 0.9;
  g.lineWidth = 2;
  line(g, [plane, h * 0.1], [plane, h * 0.8]);
  g.lineWidth = 1;
  text(f, 'near plane', plane, h * 0.1 - 8, 0.6, 'center');
  text(f, 'behind', plane - 10, h * 0.8 + 14, 0.4, 'right');
  text(f, 'visible', plane + 10, h * 0.8 + 14, 0.7);

  g.globalAlpha = 0.3;
  g.setLineDash([3, 4]);
  path(g, tri);
  g.stroke();
  g.setLineDash([]);

  if (clipped.length >= 3) {
    g.globalAlpha = 0.18;
    path(g, clipped);
    g.fill();
    g.globalAlpha = 0.95;
    path(g, clipped);
    g.stroke();
    clipped.forEach((p) => {
      if (Math.abs(p[0] - plane) < 0.01) {
        g.globalAlpha = 0.95;
        g.beginPath();
        g.arc(p[0], p[1], 5, 0, TAU);
        g.stroke();
      }
    });
  }
  const count = Math.max(0, clipped.length - 2);
  text(f, `triangles kept: ${count}`, w / 2, h - 16, 0.6, 'center');
}

// --- 6. Rasterization and the depth buffer -------------------------------------------------

const GRID = 10;
const RASTER_TRIANGLES: { pts: Pt[]; depth: number; shade: number }[] = [
  { pts: [[1, 1], [9.2, 3], [3, 9.2]], depth: 0.8, shade: 0.3 },
  { pts: [[3.5, 2], [9, 8.5], [1.5, 6]], depth: 0.4, shade: 0.8 },
];

function edge(ax: number, ay: number, bx: number, by: number, px: number, py: number) {
  return (py - ay) * (bx - ax) - (px - ax) * (by - ay);
}

function inside(pts: Pt[], x: number, y: number) {
  const e = [0, 1, 2].map((i) => edge(pts[i][0], pts[i][1], pts[(i + 1) % 3][0], pts[(i + 1) % 3][1], x, y));
  return e.every((v) => v >= 0) || e.every((v) => v <= 0);
}

function raster(f: Frame) {
  const { g, w, t } = f;
  const cell = (w - 24) / GRID;
  const ox = 12;
  const oy = 12;
  const cycle = t % 11;
  const scanned = Math.floor(clamp01(cycle / 8) * GRID * GRID);

  for (let i = 0; i < GRID * GRID; i++) {
    const cx = i % GRID;
    const cy = Math.floor(i / GRID);
    let best = Infinity;
    let shade = 0;
    if (i < scanned) {
      for (const tri of RASTER_TRIANGLES) {
        if (tri.depth < best && inside(tri.pts, cx + 0.5, cy + 0.5)) {
          best = tri.depth;
          shade = tri.shade;
        }
      }
    }
    g.globalAlpha = 0.07;
    g.strokeRect(ox + cx * cell + 0.5, oy + cy * cell + 0.5, cell - 1, cell - 1);
    if (shade) {
      g.globalAlpha = shade;
      g.fillRect(ox + cx * cell + 2, oy + cy * cell + 2, cell - 4, cell - 4);
    }
  }
  if (scanned < GRID * GRID) {
    g.globalAlpha = 0.9;
    g.strokeRect(ox + (scanned % GRID) * cell + 0.5, oy + Math.floor(scanned / GRID) * cell + 0.5, cell - 1, cell - 1);
  }

  g.globalAlpha = 0.35;
  for (const tri of RASTER_TRIANGLES) path(g, tri.pts.map(([x, y]) => [ox + x * cell, oy + y * cell]));
  g.stroke();
  text(f, 'nearest triangle wins each pixel', w / 2, w - 2, 0.55, 'center');
}

export const stages: Record<StageKind, (f: Frame) => void> = { mesh, transform, culling, projection, clipping, raster };

/** Time (seconds) shown under reduced motion: a frame where the idea reads clearly. */
export const stillTime: Record<StageKind, number> = {
  mesh: 9,
  transform: 4,
  culling: 0.3,
  projection: 1.2,
  clipping: 0.9,
  raster: 8,
};
