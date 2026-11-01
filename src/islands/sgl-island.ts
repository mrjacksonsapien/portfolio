// A high-poly test scene for the SGL demo: an island with animated waves, a dock with a boat, a wooden shack and
// a palm tree. Built only from SGL's public classes. Intuitive coordinates (x right, y up, z away); sea level is
// y = 0. See sgl-shapes.ts for the conversion to SGL's world space and the winding rules.

import { add, cross, dot, ellipsoid, loft, mul, norm, sub, toEngine, toMesh, type Face, type Part, type Rgb, type V3 } from './sgl-shapes';

type Sgl = any;

const LIGHT = norm([-0.4, 0.8, -0.45]);
const UP: V3 = [0, 1, 0];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// --- Level of detail -----------------------------------------------------------------------

/** Every resolution in the scene. `low` keeps the same layout with far fewer triangles. */
export interface Detail {
  terrainRings: number;
  terrainSegments: number;
  waterRings: number;
  waterSegments: number;
  dockPlanks: number;
  postSides: number;
  frontPlanks: number;
  sidePlanks: number;
  gableRows: number;
  trunkRings: number;
  trunkSides: number;
  fronds: number;
  frondPoints: number;
  coconut: [number, number];
  boatStations: number;
  boatAround: number;
}

export const DETAILS: Record<'high' | 'low', Detail> = {
  high: {
    terrainRings: 26, terrainSegments: 48, waterRings: 26, waterSegments: 64,
    dockPlanks: 16, postSides: 8, frontPlanks: 12, sidePlanks: 10, gableRows: 5,
    trunkRings: 14, trunkSides: 10, fronds: 10, frondPoints: 11, coconut: [8, 6],
    boatStations: 12, boatAround: 8,
  },
  low: {
    terrainRings: 9, terrainSegments: 22, waterRings: 11, waterSegments: 30,
    dockPlanks: 8, postSides: 5, frontPlanks: 4, sidePlanks: 3, gableRows: 2,
    trunkRings: 6, trunkSides: 5, fronds: 7, frondPoints: 5, coconut: [5, 3],
    boatStations: 6, boatAround: 4,
  },
};

// --- Terrain -------------------------------------------------------------------------------

const SHACK: [number, number] = [-1.2, 1.0];
const WATER_RADIUS = 13;

function baseHeight(x: number, z: number) {
  const r = Math.hypot(x, z);
  const th = Math.atan2(z, x);
  const radius = 5.4 + 0.7 * Math.sin(3 * th + 1) + 0.4 * Math.sin(5 * th + 2);
  const u = r / radius;
  const hill = 1.9 * Math.pow(Math.max(0, 1 - u * u), 1.1) - 0.35;
  return hill + 0.18 * Math.sin(1.3 * x + 0.5) * Math.cos(1.1 * z) + 0.1 * Math.sin(2.7 * x + 1.9 * z);
}

/** Island height at (x, z), flattened into a plateau around the shack. */
export function terrainHeight(x: number, z: number) {
  const flat = baseHeight(SHACK[0], SHACK[1]);
  const s = smooth(2.3, 1.4, Math.hypot(x - SHACK[0], z - SHACK[1]));
  return lerp(baseHeight(x, z), flat, s);
}

const SAND: Rgb = [226, 200, 146];
const WET_SAND: Rgb = [170, 150, 105];
const GRASS: Rgb = [62, 138, 66];

function terrainColor(h: number, x: number, z: number): Rgb {
  const patch = 0.9 + 0.2 * Math.sin(2.1 * x) * Math.sin(1.7 * z);
  const sand = h < 0.0 ? mix(WET_SAND, SAND, smooth(-0.35, 0, h)) : SAND;
  const grass: Rgb = [GRASS[0] * patch, GRASS[1] * patch, GRASS[2] * patch];
  return mix(sand, grass, smooth(0.3, 0.7, h));
}

function terrain(lod: Detail): Part {
  const rings = lod.terrainRings;
  const segments = lod.terrainSegments;
  const maxRadius = 6.6;
  const p: V3[] = [];
  p.push([0, terrainHeight(0, 0), 0]);
  for (let k = 1; k <= rings; k++) {
    const r = (maxRadius * k) / rings;
    for (let s = 0; s < segments; s++) {
      const th = (2 * Math.PI * s) / segments;
      const x = r * Math.cos(th);
      const z = r * Math.sin(th);
      p.push([x, terrainHeight(x, z), z]);
    }
  }
  const idx = (k: number, s: number) => 1 + (k - 1) * segments + (s % segments);
  const f: Face[] = [];
  for (let s = 0; s < segments; s++) f.push([0, idx(1, s + 1), idx(1, s)]);
  for (let k = 1; k < rings; k++) {
    for (let s = 0; s < segments; s++) {
      f.push([idx(k, s), idx(k, s + 1), idx(k + 1, s)]);
      f.push([idx(k, s + 1), idx(k + 1, s + 1), idx(k + 1, s)]);
    }
  }
  const colors = f.map(([i, j, k]) => {
    const c = mul(add(add(p[i], p[j]), p[k]), 1 / 3);
    return terrainColor(c[1], c[0], c[2]);
  });
  return { p, f, ref: f.map(([i, j, k]) => sub(mul(add(add(p[i], p[j]), p[k]), 1 / 3), UP)), color: SAND, colors };
}

// --- Small building blocks -----------------------------------------------------------------

function rotate([x, y, z]: V3, [rx, ry, rz]: V3): V3 {
  let [a, b, c] = [x, y, z];
  [b, c] = [b * Math.cos(rx) - c * Math.sin(rx), b * Math.sin(rx) + c * Math.cos(rx)];
  [a, c] = [a * Math.cos(ry) + c * Math.sin(ry), -a * Math.sin(ry) + c * Math.cos(ry)];
  [a, b] = [a * Math.cos(rz) - b * Math.sin(rz), a * Math.sin(rz) + b * Math.cos(rz)];
  return [a, b, c];
}

const BOX_FACES: Face[] = [
  [0, 1, 2], [0, 2, 3], [4, 6, 5], [4, 7, 6], [0, 4, 5], [0, 5, 1],
  [3, 2, 6], [3, 6, 7], [0, 3, 7], [0, 7, 4], [1, 5, 6], [1, 6, 2],
];

/** A box (12 triangles), optionally rotated about its own center by (rx, ry, rz) radians. */
function box(center: V3, size: V3, color: Rgb, rot: V3 = [0, 0, 0]): Part {
  const p: V3[] = [];
  for (const [sx, sy, sz] of [[-1, 1, -1], [1, 1, -1], [1, -1, -1], [-1, -1, -1], [-1, 1, 1], [1, 1, 1], [1, -1, 1], [-1, -1, 1]]) {
    p.push(add(center, rotate([(sx * size[0]) / 2, (sy * size[1]) / 2, (sz * size[2]) / 2], rot)));
  }
  return { p, f: BOX_FACES, ref: BOX_FACES.map(() => center), color };
}

const cylinder = (a: V3, b: V3, r: number, color: Rgb, segments = 8): Part =>
  loft(a, b, [[0, r, r], [1, r, r]], segments, color);

/** A tube along a path with a radius and color per ring. */
function sweep(path: V3[], radii: number[], segments: number, colors: Rgb[]): Part {
  const p: V3[] = [];
  const centers: V3[] = [];
  path.forEach((c, i) => {
    const t = norm(sub(path[Math.min(i + 1, path.length - 1)], path[Math.max(i - 1, 0)]));
    const u = norm(cross(t, [0, 0, 1]));
    const w = cross(t, u);
    for (let s = 0; s < segments; s++) {
      const th = (2 * Math.PI * s) / segments;
      p.push(add(c, add(mul(u, radii[i] * Math.cos(th)), mul(w, radii[i] * Math.sin(th)))));
      centers.push(c);
    }
  });
  const f: Face[] = [];
  const ref: V3[] = [];
  const faceColors: Rgb[] = [];
  for (let r = 0; r < path.length - 1; r++) {
    for (let s = 0; s < segments; s++) {
      const [a0, a1] = [r * segments + s, r * segments + ((s + 1) % segments)];
      const [b0, b1] = [a0 + segments, a1 + segments];
      f.push([a0, a1, b0], [a1, b1, b0]);
      ref.push(path[r], path[r]);
      faceColors.push(colors[r % colors.length], colors[r % colors.length]);
    }
  }
  const middle = path[Math.floor(path.length / 2)];
  for (const r of [0, path.length - 1]) {
    const c = p.length;
    p.push(path[r]);
    for (let s = 0; s < segments; s++) {
      f.push([c, r * segments + s, r * segments + ((s + 1) % segments)]);
      ref.push(middle);
      faceColors.push(colors[r % colors.length]);
    }
  }
  return { p, f, ref, color: colors[0], colors: faceColors };
}

/** A flat ribbon along a path (two-sided), `widths` wide at each point, used for leaves and sails. */
function ribbon(path: V3[], widths: number[], side: V3, colors: Rgb[], away: V3 = [0, -1, 0]): Part[] {
  const p: V3[] = [];
  path.forEach((c, i) => {
    p.push(add(c, mul(side, widths[i])), sub(c, mul(side, widths[i])));
  });
  const f: Face[] = [];
  const faceColors: Rgb[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [l0, r0, l1, r1] = [i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 3];
    f.push([l0, r0, l1], [r0, r1, l1]);
    faceColors.push(colors[i % colors.length], colors[i % colors.length]);
  }
  // Two layers with opposite windings, each facing away from a point above or below the ribbon.
  const above = f.map((face) => add(mul(add(add(p[face[0]], p[face[1]]), p[face[2]]), 1 / 3), away));
  return [
    { p, f, ref: above, color: colors[0], colors: faceColors },
    { p, f, ref: above, color: colors[0], colors: faceColors.map((c) => mul(c, 0.8) as Rgb), invert: true },
  ];
}

// --- Dock, shack, palm ---------------------------------------------------------------------

const WOOD: Rgb[] = [[150, 105, 66], [134, 94, 58], [162, 117, 76], [124, 86, 54]];
const DARK_WOOD: Rgb = [92, 62, 40];

function dock(lod: Detail): Part[] {
  const parts: Part[] = [];
  const x = 1.7;
  const [z0, z1] = [-3.7, -9.2];
  const deckY = 0.55;
  const count = lod.dockPlanks;
  const step = (z1 - z0) / count;
  for (let i = 0; i < count; i++) {
    parts.push(box([x, deckY, z0 + step * (i + 0.5)], [1.5, 0.1, Math.abs(step) - 0.05], WOOD[i % WOOD.length]));
  }
  for (const dx of [-0.55, 0.55]) parts.push(box([x + dx, deckY - 0.13, (z0 + z1) / 2], [0.12, 0.14, Math.abs(z1 - z0)], DARK_WOOD));
  for (const z of [-4.6, -6.4, -8.2, -9.1]) {
    for (const dx of [-0.72, 0.72]) parts.push(cylinder([x + dx, -0.9, z], [x + dx, deckY + 0.35, z], 0.09, DARK_WOOD, lod.postSides));
  }
  return parts;
}

function shack(lod: Detail): Part[] {
  const parts: Part[] = [];
  const [cx, cz] = SHACK;
  const ground = terrainHeight(cx, cz);
  const [w, d, h] = [2.4, 2.0, 1.45];
  const floor = ground + 0.18;

  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    parts.push(box([cx + (dx * (w - 0.2)) / 2, ground + 0.1, cz + (dz * (d - 0.2)) / 2], [0.3, 0.45, 0.3], [128, 128, 132]));
  }
  parts.push(box([cx, floor, cz], [w + 0.1, 0.1, d + 0.1], DARK_WOOD));

  // Walls made of vertical planks.
  const planks = lod.frontPlanks;
  const pw = w / planks;
  for (let i = 0; i < planks; i++) {
    const px = cx - w / 2 + pw * (i + 0.5);
    parts.push(box([px, floor + 0.05 + h / 2, cz - d / 2], [pw - 0.015, h, 0.08], WOOD[i % WOOD.length]));
    parts.push(box([px, floor + 0.05 + h / 2, cz + d / 2], [pw - 0.015, h, 0.08], WOOD[(i + 1) % WOOD.length]));
  }
  const sidePlanks = lod.sidePlanks;
  const sw = d / sidePlanks;
  for (let i = 0; i < sidePlanks; i++) {
    const pz = cz - d / 2 + sw * (i + 0.5);
    parts.push(box([cx - w / 2, floor + 0.05 + h / 2, pz], [0.08, h, sw - 0.015], WOOD[i % WOOD.length]));
    parts.push(box([cx + w / 2, floor + 0.05 + h / 2, pz], [0.08, h, sw - 0.015], WOOD[(i + 2) % WOOD.length]));
  }

  // Door and window (front faces -z, toward the camera), then a small porch.
  parts.push(box([cx + 0.3, floor + 0.05 + 0.55, cz - d / 2 - 0.06], [0.7, 1.1, 0.06], [96, 60, 38]));
  parts.push(ellipsoid([cx + 0.55, floor + 0.05 + 0.55, cz - d / 2 - 0.11], [0.04, 0.04, 0.04], 6, 4, [220, 190, 90]));
  parts.push(box([cx - w / 2 - 0.1, floor + 0.05 + 0.85, cz], [0.06, 0.5, 0.6], [150, 200, 225]));
  parts.push(box([cx - w / 2 - 0.07, floor + 0.05 + 0.85, cz], [0.04, 0.58, 0.68], DARK_WOOD));
  parts.push(box([cx + 0.3, floor - 0.02, cz - d / 2 - 0.5], [1.3, 0.08, 0.9], WOOD[0]));

  // Gable roof along x.
  const eave = floor + 0.05 + h;
  const pitch = 0.62;
  const half = d / 2 + 0.3;
  const slab = half / Math.cos(pitch);
  parts.push(box([cx, eave + (Math.sin(pitch) * slab) / 2 + 0.05, cz - half / 2], [w + 0.6, 0.1, slab], [150, 60, 48], [-pitch, 0, 0]));
  parts.push(box([cx, eave + (Math.sin(pitch) * slab) / 2 + 0.05, cz + half / 2], [w + 0.6, 0.1, slab], [140, 54, 44], [pitch, 0, 0]));
  parts.push(box([cx, eave + Math.sin(pitch) * slab + 0.1, cz], [w + 0.65, 0.1, 0.2], DARK_WOOD));
  // Gable ends: stacked planks that shrink toward the ridge.
  const rows = lod.gableRows;
  for (let i = 0; i < rows; i++) {
    const t = (i + 0.5) / rows;
    const span = (d - 0.1) * (1 - t) * 0.98;
    const y = eave + t * Math.sin(pitch) * slab;
    for (const sx of [-1, 1]) parts.push(box([cx + (sx * w) / 2, y, cz], [0.08, (Math.sin(pitch) * slab) / rows, span], WOOD[i % WOOD.length]));
  }
  return parts;
}

function palm(lod: Detail): Part[] {
  const parts: Part[] = [];
  const base: V3 = [1.7, terrainHeight(1.7, 1.5) - 0.1, 1.5];
  const rings = lod.trunkRings;
  const path: V3[] = [];
  const radii: number[] = [];
  const colors: Rgb[] = [];
  for (let i = 0; i < rings; i++) {
    const t = i / (rings - 1);
    path.push([base[0] + 1.1 * t * t, base[1] + 4.0 * t, base[2] - 0.4 * t * t]);
    radii.push(0.2 * (1 - 0.45 * t) + 0.12 * Math.max(0, 1 - t * 8));
    colors.push(i % 2 ? [128, 98, 66] : [102, 76, 50]);
  }
  parts.push(sweep(path, radii, lod.trunkSides, colors));
  const top = path[rings - 1];

  const fronds = lod.fronds;
  for (let n = 0; n < fronds; n++) {
    const th = (2 * Math.PI * n) / fronds + 0.3;
    const dir: V3 = [Math.cos(th), 0, Math.sin(th)];
    const side: V3 = [-Math.sin(th), 0, Math.cos(th)];
    const length = 2.2 + 0.3 * Math.sin(n * 2.3);
    const lift = 0.7 + 0.25 * Math.cos(n * 1.7);
    const points = lod.frondPoints;
    const leafPath: V3[] = [];
    const widths: number[] = [];
    for (let i = 0; i < points; i++) {
      const s = i / (points - 1);
      leafPath.push(add(top, add(mul(dir, s * length), [0, (lift * s - 1.6 * s * s) * length * 0.55 + 0.1, 0] as V3)));
      widths.push(0.32 * Math.sin(Math.PI * Math.pow(s, 0.7)) * (i % 2 ? 0.7 : 1));
    }
    const green: Rgb = n % 2 ? [48, 128, 60] : [60, 148, 70];
    parts.push(...ribbon(leafPath, widths, side, [green, mul(green, 0.85) as Rgb]));
  }
  for (const [dx, dz] of [[0.14, 0.05], [-0.1, 0.12], [0.02, -0.14]]) {
    parts.push(ellipsoid([top[0] + dx, top[1] - 0.15, top[2] + dz], [0.11, 0.13, 0.11], lod.coconut[0], lod.coconut[1], [96, 66, 40]));
  }
  return parts;
}

// --- Boat ----------------------------------------------------------------------------------

function boat(lod: Detail): Part[] {
  const stations = lod.boatStations;
  const around = lod.boatAround;
  const length = 1.35;
  const hull = (shrink: number, lift: number): V3[] => {
    const p: V3[] = [];
    for (let i = 0; i <= stations; i++) {
      const t = (i / stations) * 2 - 1;
      const z = t * length;
      const width = 0.52 * Math.pow(Math.max(0, 1 - t * t), 0.6) * shrink;
      const top = 0.3 + 0.16 * t * t;
      const bottom = -0.3 * Math.sqrt(Math.max(0, 1 - t * t)) + 0.02;
      for (let j = 0; j <= around; j++) {
        const a = (Math.PI * j) / around;
        p.push([width * Math.cos(a), top - (top - bottom) * Math.sin(a) * shrink + lift, z]);
      }
    }
    return p;
  };
  const faces = (): Face[] => {
    const f: Face[] = [];
    const row = around + 1;
    for (let i = 0; i < stations; i++) {
      for (let j = 0; j < around; j++) {
        const [a, b] = [i * row + j, i * row + j + 1];
        f.push([a, b, a + row], [b, b + row, a + row]);
      }
    }
    return f;
  };
  const outer = hull(1, 0);
  const inner = hull(0.9, 0.04);
  const f = faces();
  const axisRef = (p: V3[]) => f.map(([i, j, k]) => [0, (p[i][1] + p[j][1] + p[k][1]) / 3 + 0.1, (p[i][2] + p[j][2] + p[k][2]) / 3] as V3);

  const parts: Part[] = [
    { p: outer, f, ref: axisRef(outer), color: [176, 52, 42] },
    { p: inner, f, ref: axisRef(inner), color: [166, 120, 78], invert: true },
  ];
  // Rim: joins the outer and inner hulls along both gunwales.
  const row = around + 1;
  const rimP = [...outer, ...inner];
  const rimF: Face[] = [];
  for (let i = 0; i < stations; i++) {
    for (const j of [0, around]) {
      const [a, b] = [i * row + j, (i + 1) * row + j];
      const off = outer.length;
      rimF.push([a, b, off + a], [b, off + b, off + a]);
    }
  }
  parts.push({ p: rimP, f: rimF, ref: rimF.map(([i, j, k]) => sub(mul(add(add(rimP[i], rimP[j]), rimP[k]), 1 / 3), UP)), color: [240, 236, 226] });

  for (const z of [-0.5, 0.35]) parts.push(box([0, 0.05, z], [0.9, 0.06, 0.26], [150, 108, 70]));
  parts.push(cylinder([0, 0.05, -0.75], [0, 1.55, -0.75], 0.035, DARK_WOOD, 6));
  // A triangular sail behind the mast: the ribbon widens from the top down.
  const ys = [1.45, 1.1, 0.75, 0.4];
  const sailWidths = [0.01, 0.3, 0.55, 0.8];
  const sail = ys.map((y, i): V3 => [0, y, -0.75 + sailWidths[i] / 2]);
  parts.push(...ribbon(sail, sailWidths.map((w) => w / 2), [0, 0, 1], [[240, 236, 220], [226, 220, 202]], [-1, 0, 0]));
  return parts;
}

// --- Water ---------------------------------------------------------------------------------

export function waveHeight(x: number, z: number, t: number) {
  return (
    0.1 * Math.sin(0.7 * x + 1.1 * t) + 0.08 * Math.sin(0.9 * z - 0.9 * t) + 0.05 * Math.sin(1.6 * (x + z) + 1.7 * t)
  );
}

const SHALLOW: Rgb = [70, 190, 190];
const DEEP: Rgb = [18, 70, 140];

// --- Scene ---------------------------------------------------------------------------------

/** Same output as SGL's Renderer, but looks vertices up in a Map instead of `indexOf` (which is quadratic). */
export function createFastRenderer(sgl: Sgl, canvas: HTMLCanvasElement, scene: any) {
  const Base: any = sgl.Renderer;
  class FastRenderer extends Base {
    convertSceneToFlatArrays() {
      const triangles: any[] = [];
      const vertices: any[] = [];
      const index = new Map<any, number>();
      for (const mesh of this.scene.meshes) {
        mesh.updateTransformationMatrix();
        for (const t of mesh.triangles) triangles.push(t);
        for (const v of mesh.vertices) {
          index.set(v, vertices.length);
          vertices.push(v);
        }
      }
      const T = sgl.Renderer.SIZEOF_TRIANGLE_DATA;
      const V = sgl.Renderer.SIZEOF_VERTEX_DATA;
      const trianglesData = new Float32Array(triangles.length * T);
      triangles.forEach((t, i) => {
        trianglesData[i * T] = index.get(t.vertex1)! * V;
        trianglesData[i * T + 1] = index.get(t.vertex2)! * V;
        trianglesData[i * T + 2] = index.get(t.vertex3)! * V;
        trianglesData[i * T + 3] = t.color.r;
        trianglesData[i * T + 4] = t.color.g;
        trianglesData[i * T + 5] = t.color.b;
      });
      const verticesData = new Float32Array(vertices.length * V);
      const tmp = new Float32Array(4);
      vertices.forEach((v, i) => {
        tmp[0] = v.position.x;
        tmp[1] = v.position.y;
        tmp[2] = v.position.z;
        tmp[3] = 1;
        sgl.Matrix.multiplyMatrixWithVertex(v.mesh.transformationMatrix, 0, tmp);
        verticesData.set(tmp, i * V);
      });
      return [trianglesData, verticesData];
    }

    /** Triangles fully inside the view volume would come out of SGL's six-pass clip unchanged, so only the few that
     * cross a plane go through it. The inside test is the same one SGL's `clip()` uses. */
    clip(trianglesData: Float32Array, verticesData: Float32Array) {
      const T = sgl.Renderer.SIZEOF_TRIANGLE_DATA;
      const V = sgl.Renderer.SIZEOF_VERTEX_DATA;
      const inside = (o: number) => {
        const [x, y, z, w] = [verticesData[o], verticesData[o + 1], verticesData[o + 2], verticesData[o + 3]];
        return x >= w && x <= -w && y >= w && y <= -w && z >= w && z <= -w;
      };
      const kept: number[] = [];
      const crossing: number[] = [];
      for (let i = 0; i < trianglesData.length; i += T) {
        const target = inside(trianglesData[i]) && inside(trianglesData[i + 1]) && inside(trianglesData[i + 2]) ? kept : crossing;
        for (let k = 0; k < T; k++) target.push(trianglesData[i + k]);
      }
      const [clippedTriangles, clippedVertices] = crossing.length
        ? super.clip(new Float32Array(crossing), verticesData)
        : [new Float32Array(0), new Float32Array(0)];

      // Append the kept triangles, copying the vertices they use after the clipped ones.
      const remap = new Map<number, number>();
      const extraVertices: number[] = [];
      const keptOut = new Float32Array(kept);
      for (let i = 0; i < keptOut.length; i += T) {
        for (let k = 0; k < 3; k++) {
          const old = keptOut[i + k];
          let next: number = remap.get(old) ?? -1;
          if (next < 0) {
            next = clippedVertices.length + extraVertices.length;
            remap.set(old, next);
            for (let c = 0; c < V; c++) extraVertices.push(verticesData[old + c]);
          }
          keptOut[i + k] = next;
        }
      }
      const triangles = new Float32Array(clippedTriangles.length + keptOut.length);
      triangles.set(clippedTriangles);
      triangles.set(keptOut, clippedTriangles.length);
      const vertices = new Float32Array(clippedVertices.length + extraVertices.length);
      vertices.set(clippedVertices);
      vertices.set(extraVertices, clippedVertices.length);
      return [triangles, vertices];
    }
  }
  return new (FastRenderer as any)(canvas, scene);
}

export function createIslandScene(sgl: Sgl, scene: any, lod: Detail = DETAILS.high) {
  // Static pieces: lit once, then merged into a few meshes.
  scene.add(toMesh(sgl, [terrain(lod)], [0, 0, 0], true));
  scene.add(toMesh(sgl, shack(lod), [0, 0, 0], true));
  scene.add(toMesh(sgl, dock(lod), [0, 0, 0], true));
  scene.add(toMesh(sgl, palm(lod), [0, 0, 0], true));

  const boatMesh = toMesh(sgl, boat(lod), [3.1, 0, -6.6], true);
  scene.add(boatMesh);

  // Water: a disc of rings, re-shaped and re-lit every frame.
  const rings = lod.waterRings;
  const segments = lod.waterSegments;
  const rest: V3[] = [[0, 0, 0]];
  for (let k = 1; k <= rings; k++) {
    const r = (WATER_RADIUS * k) / rings;
    for (let s = 0; s < segments; s++) {
      const th = (2 * Math.PI * s) / segments;
      rest.push([r * Math.cos(th), 0, r * Math.sin(th)]);
    }
  }
  const idx = (k: number, s: number) => 1 + (k - 1) * segments + (s % segments);
  const allFaces: Face[] = [];
  for (let s = 0; s < segments; s++) allFaces.push([0, idx(1, s + 1), idx(1, s)]);
  for (let k = 1; k < rings; k++) {
    for (let s = 0; s < segments; s++) {
      allFaces.push([idx(k, s), idx(k, s + 1), idx(k + 1, s)]);
      allFaces.push([idx(k, s + 1), idx(k + 1, s + 1), idx(k + 1, s)]);
    }
  }
  // Skip water hidden under the island.
  const faces = allFaces.filter((f) => f.some((i) => terrainHeight(rest[i][0], rest[i][2]) < 0.6));

  const vertices = rest.map(([x, , z]) => new sgl.Vertex(new sgl.Vector3(...toEngine([x, 0, z]))));
  const baseColor = rest.map(([x, , z]) => {
    const depth = clamp01((0 - terrainHeight(x, z)) / 1.6);
    const water = mix(SHALLOW, DEEP, Math.pow(depth, 0.7));
    const fade = 1 - smooth(WATER_RADIUS * 0.55, WATER_RADIUS, Math.hypot(x, z));
    return mul(water, fade) as Rgb;
  });
  const triangles = faces.map(([i, j, k]) => new sgl.Triangle(vertices[i], vertices[j], vertices[k], new sgl.Color(0, 0, 0)));
  const waterMesh = new sgl.Mesh(vertices, triangles, new sgl.Vector3(0, 0, 0));
  scene.add(waterMesh);

  const heights = new Float32Array(rest.length);
  const eye: V3 = [-9, 13.7, -9];

  /** Moves the vertices and recolors every triangle by its slope, with a glint where it reflects the sun. */
  function update(t: number) {
    rest.forEach(([x, , z], i) => {
      const y = waveHeight(x, z, t);
      heights[i] = y;
      vertices[i].position.y = -y;
    });
    faces.forEach(([i, j, k], n) => {
      const a: V3 = [rest[i][0], heights[i], rest[i][2]];
      const b: V3 = [rest[j][0], heights[j], rest[j][2]];
      const c: V3 = [rest[k][0], heights[k], rest[k][2]];
      let normal = norm(cross(sub(b, a), sub(c, a)));
      if (normal[1] < 0) normal = mul(normal, -1);
      const centroid = mul(add(add(a, b), c), 1 / 3);
      const view = norm(sub(eye, centroid));
      const glint = Math.pow(Math.max(0, dot(normal, norm(add(LIGHT, view)))), 40);
      const shade = 0.62 + 0.38 * Math.max(0, dot(normal, LIGHT));
      const base = mul(add(add(baseColor[i], baseColor[j]), baseColor[k]), 1 / 3);
      // Glints fade out with the water toward the edge of the disc.
      const sparkle = 128 * glint * clamp01((base[0] + base[1] + base[2]) / 150);
      const color = triangles[n].color;
      color.r = Math.min(255, base[0] * shade + sparkle);
      color.g = Math.min(255, base[1] * shade + sparkle);
      color.b = Math.min(255, base[2] * shade + sparkle);
    });

    // The boat rides the waves: height from the swell, tilt from its slope.
    const [bx, , bz] = [3.1, 0, -6.6];
    const e = 0.5;
    const dydx = (waveHeight(bx + e, bz, t) - waveHeight(bx - e, bz, t)) / (2 * e);
    const dydz = (waveHeight(bx, bz + e, t) - waveHeight(bx, bz - e, t)) / (2 * e);
    boatMesh.position.y = -(waveHeight(bx, bz, t) + 0.12);
    boatMesh.rotation.z = (-Math.atan(dydx) * 180) / Math.PI;
    boatMesh.rotation.x = (-Math.atan(dydz) * 180) / Math.PI;
  }

  update(0);
  return { update, triangleCount: () => scene.meshes.reduce((n: number, m: any) => n + m.triangles.length, 0) };
}
