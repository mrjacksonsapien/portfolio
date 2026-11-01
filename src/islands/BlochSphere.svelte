<script lang="ts">
  // Decorative wireframe Bloch sphere drawn behind the hero text.
  // To remove it: delete the <BlochSphere> line (and its import) in Hero.astro, then this file.
  // Pauses while off screen or the tab is hidden; renders one static frame under reduced motion.
  import { onMount } from 'svelte';

  type Vec = [number, number, number];

  const TILT = 0.45; // view angle above the equator, radians
  const YAW_SPEED = 0.08; // rad/s
  const PRECESSION = 0.6; // rad/s, state vector around the z axis
  const SEGMENTS = 96;

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--color-fg').trim() || '#fff';
    const font = style.getPropertyValue('--font-mono').trim() || 'monospace';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let radius = 0;
    let raf = 0;
    let start = 0;
    let visible = true;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      radius = Math.min(height * 0.5, width * 0.46);
      cx = width > 800 ? width * 0.68 : width * 0.5;
      cy = height * 0.46;
      draw(performance.now());
    }

    // Bloch coordinates (z up) -> screen x, y and depth (larger = farther).
    function project([x, y, z]: Vec, yaw: number): Vec {
      const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
      const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
      const depth = y1 * Math.cos(TILT) - z * Math.sin(TILT);
      const up = y1 * Math.sin(TILT) + z * Math.cos(TILT);
      return [cx + radius * x1, cy - radius * up, depth];
    }

    // Polyline of 3D points, each segment dimmer when on the far side of the sphere.
    function line(points: Vec[], yaw: number, near: number, far: number, width_ = 1) {
      ctx!.lineWidth = width_;
      for (let i = 1; i < points.length; i++) {
        const a = project(points[i - 1], yaw);
        const b = project(points[i], yaw);
        ctx!.globalAlpha = (a[2] + b[2]) / 2 < 0 ? near : far;
        ctx!.beginPath();
        ctx!.moveTo(a[0], a[1]);
        ctx!.lineTo(b[0], b[1]);
        ctx!.stroke();
      }
    }

    function circle(fn: (t: number) => Vec): Vec[] {
      return Array.from({ length: SEGMENTS + 1 }, (_, i) => fn((i / SEGMENTS) * Math.PI * 2));
    }

    function label(text: string, p: Vec, yaw: number, dx = 0, dy = 0) {
      const [x, y, depth] = project(p, yaw);
      ctx!.globalAlpha = depth < 0 ? 0.6 : 0.25;
      ctx!.fillText(text, x + dx, y + dy);
    }

    function draw(time: number) {
      const t = reducedMotion.matches ? 0 : (time - start) / 1000;
      const yaw = 0.6 + t * YAW_SPEED;
      const phi = t * PRECESSION;
      const theta = 1.1 + 0.4 * Math.sin(t * 0.3);

      ctx!.clearRect(0, 0, width, height);
      ctx!.strokeStyle = color;
      ctx!.fillStyle = color;
      ctx!.font = `${Math.max(11, radius * 0.05)}px ${font}`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';

      // Outline of the sphere (always facing the viewer).
      ctx!.globalAlpha = 0.3;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx!.stroke();

      // Equator, two meridians and two parallels.
      line(circle((a) => [Math.cos(a), Math.sin(a), 0]), yaw, 0.4, 0.12);
      line(circle((a) => [Math.cos(a), 0, Math.sin(a)]), yaw, 0.22, 0.07);
      line(circle((a) => [0, Math.cos(a), Math.sin(a)]), yaw, 0.22, 0.07);
      for (const lat of [Math.PI / 6, -Math.PI / 6]) {
        const r = Math.cos(lat);
        line(circle((a) => [r * Math.cos(a), r * Math.sin(a), Math.sin(lat)]), yaw, 0.12, 0.04);
      }

      // Axes and basis state labels.
      const axes: Vec[][] = [
        [[-1, 0, 0], [1, 0, 0]],
        [[0, -1, 0], [0, 1, 0]],
        [[0, 0, -1], [0, 0, 1]],
      ];
      for (const axis of axes) line(axis, yaw, 0.3, 0.1);
      label('|0⟩', [0, 0, 1.08], yaw, 0, -4);
      label('|1⟩', [0, 0, -1.08], yaw, 0, 4);
      label('|+⟩', [1.08, 0, 0], yaw);
      label('|−⟩', [-1.08, 0, 0], yaw);
      label('|+i⟩', [0, 1.1, 0], yaw);
      label('|−i⟩', [0, -1.1, 0], yaw);

      // State vector with its dashed projection onto the equatorial plane.
      const tip: Vec = [
        Math.sin(theta) * Math.cos(phi),
        Math.sin(theta) * Math.sin(phi),
        Math.cos(theta),
      ];
      const foot: Vec = [tip[0], tip[1], 0];
      ctx!.setLineDash([4, 5]);
      line([foot, tip], yaw, 0.35, 0.35);
      line([[0, 0, 0], foot], yaw, 0.35, 0.35);
      ctx!.setLineDash([]);
      line([[0, 0, 0], tip], yaw, 0.9, 0.9, 1.5);
      const [tx, ty] = project(tip, yaw);
      ctx!.globalAlpha = 1;
      ctx!.beginPath();
      ctx!.arc(tx, ty, 3.5, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.globalAlpha = 1;
    }

    function frame(time: number) {
      draw(time);
      raf = requestAnimationFrame(frame);
    }

    function play() {
      if (raf || reducedMotion.matches || !visible || document.hidden) return;
      // Keep the animation continuous across pauses.
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onMotionChange() {
      if (reducedMotion.matches) {
        pause();
        draw(performance.now());
      } else {
        play();
      }
    }

    start = performance.now();
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) play();
      else pause();
    });
    intersectionObserver.observe(canvas);
    const onVisibility = () => (document.hidden ? pause() : play());
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotionChange);

    return () => {
      pause();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionChange);
    };
  });
</script>

<canvas bind:this={canvas} aria-hidden="true"></canvas>

<style>
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
  }
</style>
