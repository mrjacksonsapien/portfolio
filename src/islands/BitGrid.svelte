<script lang="ts">
  // Decorative grid of bits that flip constantly, like a view of memory.
  // To remove it: delete the <BitGrid> line (and its import) in about.astro, then this file.
  // Pauses while off screen or the tab is hidden; renders one static grid under reduced motion.
  import { onMount } from 'svelte';

  const CELL = 22; // px
  const FLIPS_PER_SECOND = 0.6; // fraction of all cells flipped each second
  const FRAME_MS = 50; // redraw throttle (~20 fps)
  const GLOW_DECAY = 1.8; // per second

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--color-fg').trim() || '#fff';
    const font = style.getPropertyValue('--font-mono').trim() || 'monospace';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let cols = 0;
    let rows = 0;
    let width = 0;
    let height = 0;
    let bits = new Uint8Array(0);
    let glow = new Float32Array(0);
    let raf = 0;
    let last = 0;
    let lastDraw = 0;
    let visible = true;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      bits = Uint8Array.from({ length: cols * rows }, () => (Math.random() < 0.5 ? 1 : 0));
      glow = new Float32Array(cols * rows);
      draw();
    }

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = color;
      ctx!.font = `${CELL * 0.6}px ${font}`;
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          ctx!.globalAlpha = 0.025 + glow[i] * 0.2;
          ctx!.fillText(bits[i] ? '1' : '0', c * CELL + CELL / 2, r * CELL + CELL / 2);
        }
      }
      ctx!.globalAlpha = 1;
    }

    function frame(time: number) {
      const dt = Math.min((time - last) / 1000, 0.1);
      last = time;

      // Flip a random share of cells; a flipped cell lights up, then fades.
      const flips = Math.round(bits.length * FLIPS_PER_SECOND * dt + Math.random());
      for (let n = 0; n < flips; n++) {
        const i = (Math.random() * bits.length) | 0;
        bits[i] ^= 1;
        glow[i] = 1;
      }
      for (let i = 0; i < glow.length; i++) {
        if (glow[i] > 0) glow[i] = Math.max(0, glow[i] - GLOW_DECAY * dt);
      }

      if (time - lastDraw >= FRAME_MS) {
        lastDraw = time;
        draw();
      }
      raf = requestAnimationFrame(frame);
    }

    function play() {
      if (raf || reducedMotion.matches || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function pause() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onMotionChange() {
      if (reducedMotion.matches) {
        pause();
        draw();
      } else {
        play();
      }
    }

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
    bottom: calc(-1 * var(--bitgrid-extend, 0px));
    width: 100%;
    height: calc(100% + var(--bitgrid-extend, 0px));
    z-index: -1;
    pointer-events: none;
  }
</style>
