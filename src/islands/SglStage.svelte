<script lang="ts">
  // One small looping animation explaining a stage of the SGL pipeline (see sgl-stages.ts).
  // Pauses while off screen or the tab is hidden; draws a single still frame under reduced motion.
  import { onMount } from 'svelte';
  import { stages, stillTime, type StageKind } from './sgl-stages';

  let { kind, label }: { kind: StageKind; label: string } = $props();

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(document.documentElement);
    const color = style.getPropertyValue('--color-fg').trim() || '#fff';
    const font = style.getPropertyValue('--font-mono').trim() || 'monospace';
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let size = 0;
    let raf = 0;
    let start = 0;
    let visible = true;

    function draw(now: number) {
      const t = reducedMotion ? stillTime[kind] : (now - start) / 1000;
      ctx!.clearRect(0, 0, size, size);
      ctx!.strokeStyle = color;
      ctx!.fillStyle = color;
      ctx!.lineWidth = 1;
      ctx!.setLineDash([]);
      ctx!.globalAlpha = 1;
      stages[kind]({ g: ctx!, w: size, h: size, t, font });
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = rect.width;
      canvas.width = Math.round(size * dpr);
      canvas.height = Math.round(size * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      draw(performance.now());
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

<canvas bind:this={canvas} role="img" aria-label={label}></canvas>

<style>
  canvas {
    display: block;
    width: 100%;
    aspect-ratio: 1;
    outline: 1px solid var(--color-line);
    outline-offset: -1px;
  }
</style>
