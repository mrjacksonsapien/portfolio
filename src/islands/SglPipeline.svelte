<script lang="ts">
  // Decorative background for the SGL project page: the rendering pipeline as a flow of function calls.
  // Vertex packets travel along arrows between function boxes and are rewritten by each step, with the
  // real matrices (row-vector convention, as in SGL) popping out where they are applied.
  // To remove it: delete the <SglPipeline> line (and its import) in [slug].astro, then this file.
  // Pauses while off screen or the tab is hidden; renders one still frame under reduced motion.
  import { onMount } from 'svelte';

  type Vec4 = [number, number, number, number];
  type Mat = number[]; // 16 numbers, row-major, as in SGL

  const BOX_W = 190;
  const BOX_H = 26;
  const ROW_GAP = 190;
  const COL_GAP = 90;
  const SPEED = 70; // px/s
  const PACKET_SPACING = 520; // px along the path
  const ALPHA = 0.1;

  // The data the packets carry: illustrative values pushed through the real maths (same matrix layout, row-vector
  // convention and projection formula as SGL; near 0.1, far 40, fov 90, 640x480).
  const model: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, -3, 1];
  const view: Mat = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.5, -0.2, 0, 1];
  const near = 0.1;
  const far = 40;
  const proj: Mat = [0.75, 0, 0, 0, 0, 1, 0, 0, 0, 0, -far / (far - near), -1, 0, 0, (far * near) / (far - near), 0];

  const mul = (v: Vec4, m: Mat): Vec4 => [0, 1, 2, 3].map((c) => v[0] * m[c] + v[1] * m[4 + c] + v[2] * m[8 + c] + v[3] * m[12 + c]) as Vec4;
  const local: Vec4 = [1, 1, -1, 1];
  const world = mul(local, model);
  const viewed = mul(world, view);
  const clip = mul(viewed, proj);
  const ndc: Vec4 = [clip[0] / clip[3], clip[1] / clip[3], clip[2] / clip[3], 1];
  const screen: Vec4 = [((ndc[0] + 1) / 2) * 640, ((1 - ndc[1]) / 2) * 480, ndc[2], 1];

  // Each stage: the function that runs, the matrix it applies (if any) and the packet it outputs.
  const stages: { fn: string; matrix?: Mat; name?: string; out: Vec4 }[] = [
    { fn: 'convertSceneToFlatArrays()', matrix: model, name: 'model', out: world },
    { fn: 'applyMatrixToVertices()', matrix: view, name: 'view', out: viewed },
    { fn: 'cull()', out: viewed },
    { fn: 'applyMatrixToVertices()', matrix: proj, name: 'projection', out: clip },
    { fn: 'clip()', out: clip },
    { fn: 'applyPerspectiveDivision()', out: ndc },
    { fn: 'mapNdcToScreen()', out: screen },
    { fn: 'renderTriangles()', out: screen },
  ];

  const fmt = (n: number) => String(Number(n.toFixed(Math.abs(n) >= 100 ? 0 : 2)));
  const vecText = (v: Vec4) => `[${v.map(fmt).join(' ')}]`;

  // For cards: `zoom` shrinks the drawing, `boost` brightens it and `dense` packs the rows and the packets closer, so
  // more functions and matrices are on screen at once.
  let { zoom = 1, boost = 1, dense = false }: { zoom?: number; boost?: number; dense?: boolean } = $props();
  const rowGap = dense ? ROW_GAP * 0.6 : ROW_GAP;
  const packetSpacing = dense ? PACKET_SPACING * 0.45 : PACKET_SPACING;
  const A = ALPHA * boost;
  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--color-fg').trim() || '#fff';
    const font = style.getPropertyValue('--font-mono').trim() || 'monospace';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    type Node = { x: number; y: number; stage: number };
    let nodes: Node[] = [];
    let lengths: number[] = []; // distance from each node to the next
    let total = 0;
    let width = 0;
    let height = 0;
    let raf = 0;
    let start = 0;
    let visible = true;

    function layout() {
      const perRow = Math.max(1, Math.floor((width + COL_GAP) / (BOX_W + COL_GAP)));
      const rows = Math.ceil(height / rowGap) + 1;
      const rowWidth = perRow * BOX_W + (perRow - 1) * COL_GAP;
      const left = (width - rowWidth) / 2;
      nodes = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < perRow; c++) {
          const col = r % 2 ? perRow - 1 - c : c; // snake path
          nodes.push({ x: left + col * (BOX_W + COL_GAP) + BOX_W / 2, y: 40 + r * rowGap, stage: nodes.length % stages.length });
        }
      }
      lengths = nodes.map((n, i) => {
        const next = nodes[(i + 1) % nodes.length];
        return Math.hypot(next.x - n.x, next.y - n.y);
      });
      total = lengths.reduce((a, b) => a + b, 0);
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width / zoom;
      height = rect.height / zoom;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx!.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);
      layout();
      draw(performance.now());
    }

    /** Point at distance s along the closed path, plus the index of the segment's start node. */
    function pointAt(s: number) {
      s = ((s % total) + total) % total;
      let i = 0;
      while (s > lengths[i]) s -= lengths[i++];
      const a = nodes[i];
      const b = nodes[(i + 1) % nodes.length];
      const k = lengths[i] ? s / lengths[i] : 0;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, from: i, k };
    }

    // Connection point on the edge of a box facing the other node.
    function edgePoint(a: Node, b: Node): [number, number] {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (Math.abs(dy) > Math.abs(dx) * 0.2) return [a.x, a.y + Math.sign(dy) * BOX_H / 2];
      return [a.x + Math.sign(dx) * BOX_W / 2, a.y];
    }

    function drawMatrix(m: Mat, name: string, x: number, y: number, alpha: number) {
      const g = ctx!;
      g.globalAlpha = alpha;
      g.textAlign = 'left';
      g.font = `9px ${font}`;
      g.fillText(name, x, y - 4);
      for (let r = 0; r < 4; r++) {
        g.fillText(m.slice(r * 4, r * 4 + 4).map((n) => fmt(n).padStart(6)).join(' '), x, y + 8 + r * 11);
      }
      g.strokeRect(x - 5, y - 1, 6 * 4 * 5.4 + 36, 50);
    }

    function draw(now: number) {
      const g = ctx!;
      g.clearRect(0, 0, width, height);
      g.strokeStyle = color;
      g.fillStyle = color;
      g.lineWidth = 1;
      g.textBaseline = 'middle';
      const t = reducedMotion ? 6 : (now - start) / 1000;

      // Arrows between consecutive boxes.
      g.globalAlpha = A * 0.8;
      nodes.forEach((a, i) => {
        const b = nodes[(i + 1) % nodes.length];
        if (b === nodes[0]) return;
        const p = edgePoint(a, b);
        const q = edgePoint(b, a);
        g.beginPath();
        g.moveTo(p[0], p[1]);
        g.lineTo(q[0], q[1]);
        g.stroke();
        const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
        g.beginPath();
        g.moveTo(q[0], q[1]);
        g.lineTo(q[0] - 7 * Math.cos(ang - 0.4), q[1] - 7 * Math.sin(ang - 0.4));
        g.moveTo(q[0], q[1]);
        g.lineTo(q[0] - 7 * Math.cos(ang + 0.4), q[1] - 7 * Math.sin(ang + 0.4));
        g.stroke();
      });

      // Packets: where one is, the box ahead of it lights up and, for matrix stages, the matrix appears.
      const lit = new Map<number, number>();
      const packets: { x: number; y: number; stage: number }[] = [];
      const count = Math.max(1, Math.floor(total / packetSpacing));
      for (let k = 0; k < count; k++) {
        const pos = pointAt(t * SPEED + k * (total / count));
        const next = (pos.from + 1) % nodes.length;
        // A packet carries the output of the box it just left.
        packets.push({ x: pos.x, y: pos.y, stage: nodes[pos.from].stage });
        const nearness = pos.k > 0.5 ? (pos.k - 0.5) * 2 : 0;
        lit.set(next, Math.max(lit.get(next) ?? 0, nearness));
        const justLeft = 1 - Math.min(1, pos.k * 2);
        lit.set(pos.from, Math.max(lit.get(pos.from) ?? 0, justLeft));
      }

      // Boxes.
      nodes.forEach((n, i) => {
        // drawMatrix changes the font and alignment, so set them again for every box.
        g.font = `10px ${font}`;
        g.textAlign = 'center';
        const glow = lit.get(i) ?? 0;
        g.globalAlpha = A + glow * 0.12;
        g.strokeRect(n.x - BOX_W / 2, n.y - BOX_H / 2, BOX_W, BOX_H);
        g.fillText(stages[n.stage].fn, n.x, n.y);
        const s = stages[n.stage];
        if (s.matrix && glow > 0.05) {
          const side = n.x < width / 2 ? 1 : -1;
          const mx = side > 0 ? n.x + BOX_W / 2 + 14 : n.x - BOX_W / 2 - 14 - 140;
          drawMatrix(s.matrix, `${s.name} matrix`, mx, n.y - 22, A * 1.4 * glow);
        }
      });

      // Packets on top.
      packets.forEach((p) => {
        g.globalAlpha = A * 2.2;
        g.beginPath();
        g.arc(p.x, p.y, 3, 0, Math.PI * 2);
        g.fill();
        g.font = `9px ${font}`;
        g.textAlign = 'left';
        g.fillText(vecText(stages[p.stage].out), p.x + 8, p.y - 9);
      });
    }

    function loop(now: number) {
      raf = 0;
      if (!visible || document.hidden) return;
      draw(now);
      raf = requestAnimationFrame(loop);
    }
    function startLoop() {
      if (reducedMotion || raf) return;
      raf = requestAnimationFrame(loop);
    }

    start = performance.now();
    resize();
    startLoop();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) startLoop();
    });
    intersection.observe(canvas);
    const onVisibility = () => {
      if (!document.hidden) startLoop();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
