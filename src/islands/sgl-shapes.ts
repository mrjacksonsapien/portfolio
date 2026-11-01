// Extra meshes for the SGL demo, built only from the engine's public classes (Mesh, Vertex, Triangle, Color, Vector3).
// SGL ships a Cube template only; these are experiments to find the limits of the engine.
//
// Coordinates: shapes are modeled in an intuitive space (x right, y up, z away from the default camera). SGL's
// world is x-left, y-down, z-forward (a 180 degree turn about z, so handedness and winding are preserved), hence
// toEngine() below. Every triangle is wound so its front faces outward: SGL's front face is the one where
// (b - a) x (c - a) points away from the solid.

type Sgl = any;
export type ShapeKind = 'cube' | 'pyramid' | 'sphere' | 'character';

export type V3 = [number, number, number];
export type Face = [number, number, number];
export type Rgb = [number, number, number];

/** A piece of geometry: positions, index triples, and for each face a point it must face away from. */
export interface Part {
  p: V3[];
  f: Face[];
  ref: V3[];
  color: Rgb;
  /** Optional per-face colors, cycled; overrides `color`. */
  colors?: Rgb[];
  /** Flip every face after orienting, e.g. for the inside of a hull. */
  invert?: boolean;
}

export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => mul(a, 1 / (Math.hypot(...a) || 1));

/** Intuitive space to SGL world space. */
export const toEngine = ([x, y, z]: V3): V3 => [-x, -y, z];

// --- Primitives ----------------------------------------------------------------------------

/** UV sphere / ellipsoid. `rings` bands pole to pole; `maxPhi` (0..1 of a half turn) stops early for an open cap. */
export function ellipsoid(center: V3, radii: V3, segments: number, rings: number, color: Rgb, maxPhi = 1): Part {
  const p: V3[] = [[center[0], center[1] + radii[1], center[2]]];
  const last = Math.max(1, Math.round(rings * maxPhi));
  const closed = maxPhi >= 1;
  const upto = closed ? rings - 1 : last;
  for (let r = 1; r <= upto; r++) {
    const phi = (Math.PI * r) / rings;
    for (let s = 0; s < segments; s++) {
      const theta = (2 * Math.PI * s) / segments;
      p.push([
        center[0] + radii[0] * Math.sin(phi) * Math.cos(theta),
        center[1] + radii[1] * Math.cos(phi),
        center[2] + radii[2] * Math.sin(phi) * Math.sin(theta),
      ]);
    }
  }
  if (closed) p.push([center[0], center[1] - radii[1], center[2]]);
  const ring = (r: number, s: number) => 1 + (r - 1) * segments + (s % segments);

  const f: Face[] = [];
  for (let s = 0; s < segments; s++) f.push([0, ring(1, s + 1), ring(1, s)]);
  for (let r = 1; r < upto; r++) {
    for (let s = 0; s < segments; s++) {
      f.push([ring(r, s), ring(r, s + 1), ring(r + 1, s)]);
      f.push([ring(r, s + 1), ring(r + 1, s + 1), ring(r + 1, s)]);
    }
  }
  if (closed) {
    const south = p.length - 1;
    for (let s = 0; s < segments; s++) f.push([south, ring(rings - 1, s), ring(rings - 1, s + 1)]);
  }
  return { p, f, ref: f.map(() => center), color };
}

/** A tube from `a` to `b` whose elliptical cross-section changes along the way: rings are [t, radiusU, radiusW]. */
export function loft(a: V3, b: V3, rings: [number, number, number][], segments: number, color: Rgb): Part {
  const axis = sub(b, a);
  const dir = norm(axis);
  const u = norm(cross(dir, Math.abs(dir[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1]));
  const w = cross(dir, u);
  const at = (t: number) => add(a, mul(axis, t));

  const p: V3[] = [];
  for (const [t, ru, rw] of rings) {
    for (let s = 0; s < segments; s++) {
      const th = (2 * Math.PI * s) / segments;
      p.push(add(at(t), add(mul(u, ru * Math.cos(th)), mul(w, rw * Math.sin(th)))));
    }
  }
  const f: Face[] = [];
  const ref: V3[] = [];
  for (let r = 0; r < rings.length - 1; r++) {
    const mid = at((rings[r][0] + rings[r + 1][0]) / 2);
    for (let s = 0; s < segments; s++) {
      const [a0, a1] = [r * segments + s, r * segments + ((s + 1) % segments)];
      const [b0, b1] = [a0 + segments, a1 + segments];
      f.push([a0, a1, b0], [a1, b1, b0]);
      ref.push(mid, mid);
    }
  }
  // End caps: fans around a center vertex, facing away from the middle of the tube.
  const middle = at((rings[0][0] + rings[rings.length - 1][0]) / 2);
  for (const [ringIndex, t] of [[0, rings[0][0]], [rings.length - 1, rings[rings.length - 1][0]]] as const) {
    const c = p.length;
    p.push(at(t));
    for (let s = 0; s < segments; s++) {
      f.push([c, ringIndex * segments + s, ringIndex * segments + ((s + 1) % segments)]);
      ref.push(middle);
    }
  }
  return { p, f, ref, color };
}

const limb = (a: V3, b: V3, r0: number, r1: number, color: Rgb): Part =>
  loft(a, b, [[0, r0, r0], [1, r1, r1]], 8, color);
const ball = (c: V3, r: number, color: Rgb): Part => ellipsoid(c, [r, r, r], 8, 5, color);

// --- Assembly ------------------------------------------------------------------------------

const LIGHT = norm([-0.4, 0.8, -0.45]);

/** Merges parts into one SGL mesh. With `lit`, a fixed light is baked into each triangle's color. */
export function toMesh(sgl: Sgl, parts: Part[], at: V3, lit: boolean, scale = 1) {
  const positions: V3[] = [];
  const triangles: { i: Face; color: Rgb }[] = [];
  for (const part of parts) {
    const base = positions.length;
    part.p.forEach((v) => positions.push(mul(v, scale)));
    part.f.forEach(([i, j, k], n) => {
      const [a, b, c] = [positions[base + i], positions[base + j], positions[base + k]];
      const normal = cross(sub(b, a), sub(c, a));
      const centroid = mul(add(add(a, b), c), 1 / 3);
      const outward = (dot(normal, sub(centroid, mul(part.ref[n], scale))) >= 0) !== !!part.invert;
      const face: Face = outward ? [base + i, base + j, base + k] : [base + i, base + k, base + j];
      const shade = lit ? 0.4 + 0.6 * Math.max(0, dot(norm(outward ? normal : mul(normal, -1)), LIGHT)) : 1;
      triangles.push({ i: face, color: (part.colors?.[n % part.colors.length] ?? part.color).map((ch) => Math.round(ch * shade)) as Rgb });
    });
  }
  const vertices = positions.map((v) => new sgl.Vertex(new sgl.Vector3(...toEngine(v))));
  const tris = triangles.map(
    ({ i, color }) => new sgl.Triangle(vertices[i[0]], vertices[i[1]], vertices[i[2]], new sgl.Color(...color)),
  );
  return new sgl.Mesh(vertices, tris, new sgl.Vector3(...toEngine(at)));
}

// --- Shapes --------------------------------------------------------------------------------

const RED: Rgb = [255, 0, 0];
const GREEN: Rgb = [0, 255, 0];
const BLUE: Rgb = [0, 0, 255];

function pyramid(sgl: Sgl, at: V3) {
  const p: V3[] = [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [0, 1, 0]];
  const f: Face[] = [[0, 1, 4], [1, 2, 4], [2, 3, 4], [3, 0, 4], [0, 3, 2], [0, 2, 1]];
  return toMesh(sgl, [{ p, f, ref: f.map(() => [0, 0, 0] as V3), color: RED, colors: [RED, GREEN, BLUE] }], at, false);
}

function sphere(sgl: Sgl, at: V3) {
  const part = ellipsoid([0, 0, 0], [1, 1, 1], 12, 8, RED);
  return toMesh(sgl, [{ ...part, colors: [RED, GREEN, BLUE, GREEN] }], at, false);
}

const SKIN: Rgb = [232, 180, 146];
const HAIR: Rgb = [70, 45, 30];
const SHIRT: Rgb = [46, 112, 204];
const PANTS: Rgb = [48, 52, 78];
const BOOTS: Rgb = [110, 70, 40];
const EYES: Rgb = [20, 20, 24];

/** A stylized figure about 2.2 units tall, feet on y = 0, facing -z. Medium poly (roughly 1,500 triangles). */
function character(sgl: Sgl, at: V3, scale: number) {
  const parts: Part[] = [];

  // Torso, neck, head.
  parts.push(loft([0, 0.9, 0], [0, 1.62, 0], [[0, 0.2, 0.13], [0.3, 0.17, 0.11], [0.75, 0.23, 0.14], [1, 0.2, 0.12]], 12, SHIRT));
  parts.push(limb([0, 1.6, 0], [0, 1.76, 0], 0.065, 0.06, SKIN));
  parts.push(ellipsoid([0, 1.96, 0], [0.17, 0.2, 0.18], 14, 10, SKIN));
  parts.push(ellipsoid([0, 2.0, 0.02], [0.19, 0.21, 0.2], 14, 10, HAIR, 0.42));
  for (const side of [-1, 1]) parts.push(ellipsoid([side * 0.07, 1.98, -0.168], [0.025, 0.03, 0.015], 6, 4, EYES));

  for (const side of [-1, 1]) {
    // Arm: shoulder, sleeve, elbow, forearm, hand.
    const shoulder: V3 = [side * 0.27, 1.55, 0];
    const elbow: V3 = [side * 0.33, 1.25, 0];
    const wrist: V3 = [side * 0.33, 0.98, -0.12];
    parts.push(ball(shoulder, 0.09, SHIRT));
    parts.push(limb(shoulder, elbow, 0.08, 0.065, SHIRT));
    parts.push(ball(elbow, 0.065, SHIRT));
    parts.push(limb(elbow, wrist, 0.058, 0.045, SKIN));
    parts.push(ellipsoid([side * 0.33, 0.92, -0.15], [0.05, 0.065, 0.05], 8, 5, SKIN));

    // Leg: thigh, knee, shin, boot.
    const hip: V3 = [side * 0.12, 0.95, 0];
    const knee: V3 = [side * 0.12, 0.5, 0];
    const ankle: V3 = [side * 0.12, 0.1, 0];
    parts.push(limb(hip, knee, 0.105, 0.085, PANTS));
    parts.push(ball(knee, 0.085, PANTS));
    parts.push(limb(knee, ankle, 0.083, 0.06, PANTS));
    parts.push(ellipsoid([side * 0.12, 0.07, -0.04], [0.08, 0.07, 0.15], 8, 5, BOOTS));
  }
  return toMesh(sgl, parts, at, true, scale);
}

export function createShape(sgl: Sgl, kind: ShapeKind, at: V3, scale = 1) {
  if (kind === 'pyramid') return pyramid(sgl, at);
  if (kind === 'sphere') return sphere(sgl, at);
  if (kind === 'character') return character(sgl, at, scale);
  return new sgl.Cube(new sgl.Vector3(...toEngine(at)));
}
