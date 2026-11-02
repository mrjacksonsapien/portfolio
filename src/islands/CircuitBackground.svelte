<script lang="ts">
  // Decorative background for the Maze game page: the project's circuit drawn as white lines on black. An ESP32 sends
  // data, clock and latch to two 74HC595 shift registers, which drive the rows and columns of an 8x8 LED matrix that
  // shows the game. Electricity flows along the traces as short pulses; the matrix is scanned one column at a time.
  // Fixed to the viewport, so its cost does not grow with the page. Pauses while the tab is hidden and draws one
  // still frame under reduced motion.
  // To remove it: delete the <CircuitBackground> line (and its import) in ShowcaseProject.astro, then this file.
  import { onMount } from 'svelte';
  import { ROOM, WIFI_FRAMES, CHECK } from './maze-stages';

  type Point = [number, number];

  interface Trace {
    pts: Point[];
    len: number[]; // cumulative length at each point
    total: number;
  }

  // The drawing lives in a 1600 x 900 world that is scaled to fit the viewport.
  const WORLD_W = 1600;
  const WORLD_H = 900;
  const BASE = 0.12; // opacity of a quiet trace
  const PULSE = 0.5; // opacity of a pulse of current
  const STEP_RATE = 11; // columns scanned per second (the real board does 1000, too fast to see)
  const PULSE_SPEED = 260; // world units per second

  const ESP = { x: 80, y: 300, w: 180, h: 300 };
  const IC_A = { x: 520, y: 220, w: 90, h: 220 }; // drives the rows
  const IC_B = { x: 520, y: 520, w: 90, h: 220 }; // drives the columns
  const MATRIX = { x: 1000, y: 420, pitch: 40 };
  const JOYSTICK = { x: 150, y: 790 };

  function trace(pts: Point[]): Trace {
    const len = [0];
    for (let i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts, len, total: len[len.length - 1] };
  }

  // Row i leaves IC A on the right, turns toward the matrix row and enters from the left.
  const rowTraces = Array.from({ length: 8 }, (_, i) => {
    const sy = IC_A.y + 30 + i * 22;
    const bus = 700 + (7 - i) * 14;
    const ry = MATRIX.y + MATRIX.pitch * (i + 0.5);
    return trace([[IC_A.x + IC_A.w, sy], [bus, sy], [bus, ry], [MATRIX.x, ry]]);
  });
  // Column j leaves IC B, runs under the matrix and enters from below. Current flows the other way in a column.
  const colTraces = Array.from({ length: 8 }, (_, j) => {
    const sy = IC_B.y + 30 + j * 22;
    const bus = 612 + (7 - j) * 10;
    const under = 780 + j * 10;
    const cx = MATRIX.x + MATRIX.pitch * (j + 0.5);
    const bottom = MATRIX.y + MATRIX.pitch * 8;
    return trace([[IC_B.x + IC_B.w, sy], [bus, sy], [bus, under], [cx, under], [cx, bottom]]);
  });
  const dataTrace = trace([[ESP.x + ESP.w, 330], [400, 330], [400, IC_A.y + 30], [IC_A.x, IC_A.y + 30]]);
  const clockTraces = [
    trace([[ESP.x + ESP.w, 380], [450, 380], [450, IC_A.y + 80], [IC_A.x, IC_A.y + 80]]),
    trace([[450, 380], [450, IC_B.y + 80], [IC_B.x, IC_B.y + 80]]),
  ];
  const latchTraces = [
    trace([[ESP.x + ESP.w, 430], [480, 430], [480, IC_A.y + 110], [IC_A.x, IC_A.y + 110]]),
    trace([[480, 430], [480, IC_B.y + 120], [IC_B.x, IC_B.y + 120]]),
  ];
  const serialTrace = trace([[IC_A.x + IC_A.w / 2, IC_A.y + IC_A.h], [IC_A.x + IC_A.w / 2, 490], [500, 490], [500, IC_B.y + 50], [IC_B.x, IC_B.y + 50]]);
  // The joystick sends its X and Y (analog) and button (digital) to the ESP32; the 5V line goes the other way.
  const joyTraces = [110, 150, 190].map((x) => trace([[x, JOYSTICK.y - 50], [x, ESP.y + ESP.h]]));
  const powerTrace = trace([[60, 120], [1540, 120]]);
  const groundTrace = trace([[60, 860], [1540, 860]]);

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--color-fg').trim() || '#fff';
    const font = style.getPropertyValue('--font-mono').trim() || 'monospace';

    let width = 0;
    let height = 0;
    let raf = 0;
    let t0 = 0;

    /** Strokes the part of a trace between two distances along it. */
    function path(g: CanvasRenderingContext2D, tr: Trace, from = 0, to = tr.total) {
      g.beginPath();
      let drawing = false;
      for (let i = 1; i < tr.pts.length; i++) {
        const l0 = tr.len[i - 1];
        const l1 = tr.len[i];
        if (l1 < from || l0 > to) continue;
        const [ax, ay] = tr.pts[i - 1];
        const [bx, by] = tr.pts[i];
        const k0 = (Math.max(from, l0) - l0) / (l1 - l0);
        const k1 = (Math.min(to, l1) - l0) / (l1 - l0);
        if (!drawing) {
          g.moveTo(ax + (bx - ax) * k0, ay + (by - ay) * k0);
          drawing = true;
        }
        g.lineTo(ax + (bx - ax) * k1, ay + (by - ay) * k1);
      }
      g.stroke();
    }

    /** A pulse of current: a short bright stretch of the trace, `at` world units from its start (negative = not there). */
    function pulse(g: CanvasRenderingContext2D, tr: Trace, at: number, size = 22, alpha = PULSE) {
      if (at < -size || at > tr.total + size) return;
      const a = Math.max(at - size, 0);
      const b = Math.min(at, tr.total);
      if (b <= a) return;
      g.globalAlpha = alpha;
      g.lineWidth = 2;
      path(g, tr, a, b);
      g.lineWidth = 1;
    }

    /** Pulses spaced along a trace, moving continuously (data and clock). */
    function stream(g: CanvasRenderingContext2D, tr: Trace, time: number, gap: number, offset = 0) {
      const shift = (time * PULSE_SPEED * 0.6 + offset) % gap;
      for (let at = shift; at < tr.total + 22; at += gap) pulse(g, tr, at);
    }

    function box(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, alpha: number) {
      g.globalAlpha = alpha;
      g.strokeRect(x, y, w, h);
    }

    function text(g: CanvasRenderingContext2D, s: string, x: number, y: number, size = 11, alpha = 0.3, align: CanvasTextAlign = 'left') {
      g.font = `${size}px ${font}`;
      g.textAlign = align;
      g.textBaseline = 'middle';
      g.globalAlpha = alpha;
      g.fillText(s, x, y);
    }

    /** What the matrix shows at time `t` (seconds): the maze with a walking player, then the wifi symbol, then a check. */
    function picture(time: number): string[] {
      const c = time % 26;
      const rows = (bytes: string[]) => bytes.map((b) => [...b].map((d) => (d === '1' ? '#' : '.')).join(''));
      if (c >= 20) return rows(CHECK);
      if (c >= 14) return rows(WIFI_FRAMES[Math.floor((c - 14) / 0.5) % 3]);
      // The player walks a loop through the room, one cell at a time.
      const walk: Point[] = [[3, 3], [3, 4], [3, 5], [4, 5], [5, 5], [5, 4], [5, 3], [4, 3]];
      const [px, py] = walk[Math.floor(c / 1.5) % walk.length];
      const grid = ROOM.map((r) => r.split(''));
      grid[3][4] = '.';
      grid[py][px] = '#';
      return grid.map((r) => r.join(''));
    }

    function draw(time: number) {
      const g = ctx!;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
      const dpr = canvas.width / width;
      const scale = Math.min(width / WORLD_W, height / WORLD_H);
      g.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (width - WORLD_W * scale) / 2, dpr * (height - WORLD_H * scale) / 2);
      g.strokeStyle = color;
      g.fillStyle = color;
      g.lineWidth = 1;
      g.lineCap = 'round';
      g.lineJoin = 'round';

      const step = Math.floor(time * STEP_RATE); // scan steps so far; each selects one column
      const col = step % 8;
      const stepAge = time - step / STEP_RATE; // seconds since this step began
      const pic = picture(time);
      const rowBits = (c: number) => pic.map((r) => r[c] === '#');

      // Power rails: a quiet line with a slow flow of 5V along it.
      g.globalAlpha = BASE * 0.8;
      for (const rail of [powerTrace, groundTrace]) path(g, rail);
      text(g, '5V', 40, 120, 11, 0.3, 'center');
      text(g, 'GND', 36, 860, 11, 0.3, 'center');
      stream(g, powerTrace, time * 0.5, 260);

      // ESP32.
      box(g, ESP.x, ESP.y, ESP.w, ESP.h, 0.3);
      g.globalAlpha = 0.18;
      g.strokeRect(ESP.x + 20, ESP.y - 40, ESP.w - 40, 40);
      g.beginPath();
      for (let k = 0; k < 5; k++) {
        const x = ESP.x + 30 + k * 30;
        g.moveTo(x, ESP.y - 30);
        g.lineTo(x, ESP.y - 6);
      }
      g.stroke();
      text(g, 'ESP32', ESP.x + ESP.w / 2, ESP.y + ESP.h / 2 - 10, 16, 0.4, 'center');
      text(g, 'C', ESP.x + ESP.w / 2, ESP.y + ESP.h / 2 + 14, 11, 0.25, 'center');
      text(g, 'GPIO15 data', ESP.x + ESP.w - 8, 322, 10, 0.3, 'right');
      text(g, 'GPIO4 clock', ESP.x + ESP.w - 8, 372, 10, 0.3, 'right');
      text(g, 'GPIO2 latch', ESP.x + ESP.w - 8, 422, 10, 0.3, 'right');

      // 74HC595 shift registers: DIP outlines with pins.
      for (const [ic, name] of [[IC_A, '74HC595 / rows'], [IC_B, '74HC595 / columns']] as const) {
        box(g, ic.x, ic.y, ic.w, ic.h, 0.3);
        g.globalAlpha = 0.3;
        g.beginPath();
        g.arc(ic.x + ic.w / 2, ic.y, 7, 0, Math.PI);
        g.stroke();
        for (let k = 0; k < 8; k++) {
          for (const px of [ic.x - 8, ic.x + ic.w]) {
            g.globalAlpha = 0.25;
            g.strokeRect(px, ic.y + 22 + k * 22, 8, 6);
          }
        }
        text(g, name, ic.x + ic.w / 2, ic.y + ic.h + 18, 10, 0.3, 'center');
      }

      // Quiet traces.
      g.globalAlpha = BASE;
      for (const tr of [dataTrace, ...clockTraces, ...latchTraces, serialTrace, ...joyTraces, ...rowTraces, ...colTraces]) path(g, tr);

      // Signals: data and clock stream continuously; the latch fires once per scan step.
      stream(g, dataTrace, time, 70);
      stream(g, serialTrace, time, 70, 30);
      for (const tr of clockTraces) stream(g, tr, time, 46, 10);
      for (const tr of latchTraces) pulse(g, tr, stepAge * PULSE_SPEED * 1.4, 28, 0.7);

      // Each scan step: the rows that are lit in this column carry current in, and the selected column carries it out.
      for (let k = 0; k < 2; k++) {
        const s = step - k;
        const c = ((s % 8) + 8) % 8;
        const age = time - s / STEP_RATE;
        const bits = rowBits(c);
        for (let r = 0; r < 8; r++) if (bits[r]) pulse(g, rowTraces[r], age * PULSE_SPEED * 1.1 - 40, 26);
        const colT = colTraces[c];
        pulse(g, colT, colT.total - age * PULSE_SPEED * 1.1 + 40 + 26, 26);
      }

      // Joystick: a stick on a base; its three lines carry a pulse whenever the player moves.
      box(g, JOYSTICK.x - 60, JOYSTICK.y - 50, 120, 100, 0.25);
      g.globalAlpha = 0.3;
      g.beginPath();
      g.arc(JOYSTICK.x, JOYSTICK.y, 24, 0, Math.PI * 2);
      g.stroke();
      const wobble = Math.sin(time * 1.3) * 5;
      g.globalAlpha = 0.45;
      g.beginPath();
      g.arc(JOYSTICK.x + wobble, JOYSTICK.y + Math.cos(time * 1.3) * 4, 12, 0, Math.PI * 2);
      g.stroke();
      text(g, 'joystick', JOYSTICK.x, JOYSTICK.y + 72, 10, 0.3, 'center');
      text(g, 'X', 110, JOYSTICK.y - 62, 10, 0.3, 'center');
      text(g, 'Y', 150, JOYSTICK.y - 62, 10, 0.3, 'center');
      text(g, 'SW', 190, JOYSTICK.y - 62, 10, 0.3, 'center');
      const move = (time / 1.5) % 1; // the player steps every 1.5 s while the maze is shown
      if (time % 26 < 14) {
        pulse(g, joyTraces[0], (1 - move) * 3 * joyTraces[0].total, 20);
        pulse(g, joyTraces[1], (1 - move) * 3 * joyTraces[1].total - 90, 20, PULSE * 0.7);
      }

      // The 8x8 LED matrix: a faint grid of the row and column lines, the LEDs, and the column being scanned.
      const { x: mx, y: my, pitch } = MATRIX;
      box(g, mx - 6, my - 6, pitch * 8 + 12, pitch * 8 + 12, 0.3);
      g.globalAlpha = 0.07;
      g.beginPath();
      for (let k = 0; k < 8; k++) {
        const o = pitch * (k + 0.5);
        g.moveTo(mx, my + o);
        g.lineTo(mx + pitch * 8, my + o);
        g.moveTo(mx + o, my);
        g.lineTo(mx + o, my + pitch * 8);
      }
      g.stroke();
      for (let c = 0; c < 8; c++) {
        const bits = rowBits(c);
        // Afterglow: the column that was just scanned is still bright, older ones fade.
        const since = (((step - c) % 8) + 8) % 8 + stepAge * STEP_RATE;
        const glow = Math.exp(-since / 5.5);
        for (let r = 0; r < 8; r++) {
          const cx = mx + pitch * (c + 0.5);
          const cy = my + pitch * (r + 0.5);
          if (bits[r]) {
            g.globalAlpha = 0.12 + 0.75 * glow;
            g.beginPath();
            g.arc(cx, cy, 10, 0, Math.PI * 2);
            g.fill();
            if (c === col) {
              g.globalAlpha = 0.35;
              g.beginPath();
              g.arc(cx, cy, 17, 0, Math.PI * 2);
              g.stroke();
            }
          } else {
            g.globalAlpha = 0.1;
            g.beginPath();
            g.arc(cx, cy, 9, 0, Math.PI * 2);
            g.stroke();
          }
        }
      }
      g.globalAlpha = 0.3;
      g.strokeRect(mx + pitch * col + 3, my - 3, pitch - 6, pitch * 8 + 6);
      text(g, '8x8 LED matrix', mx + pitch * 4, my - 26, 11, 0.3, 'center');
      g.globalAlpha = 1;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      draw(reducedMotion.matches ? 3.1 : (performance.now() - t0) / 1000);
    }

    function frame(now: number) {
      draw(Math.max(now - t0, 0) / 1000); // the first frame can carry a timestamp from just before t0
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || reducedMotion.matches || document.hidden) return;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onMotionChange() {
      if (reducedMotion.matches) {
        stop();
        draw(3.1);
      } else start();
    }

    const onVisibility = () => (document.hidden ? stop() : start());

    t0 = performance.now();
    resize();
    start();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotionChange);

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionChange);
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
    opacity: 0.7; /* keeps the text above it readable */
    animation: circuit-in 2s ease-out both;
  }
  @keyframes circuit-in {
    from {
      opacity: 0;
    }
  }
</style>
