<script lang="ts">
  // Hero visual: slow drifting starfield with twinkle and a faint pointer parallax.
  // Hydrated lazily by the parent (client:idle). Draws a single static frame when
  // the user prefers reduced motion, and pauses while off screen or the tab is hidden.
  import { onMount } from 'svelte';

  interface Star {
    x: number; // 0..1
    y: number; // 0..1
    z: number; // depth 0..1 (1 = near)
    phase: number;
  }

  const STAR_DENSITY = 1 / 6000; // stars per CSS pixel
  const DRIFT = 0.004; // fraction of the height per second at full depth
  const PARALLAX = 14; // max pointer offset in px at full depth

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim() || '#fff';

    let stars: Star[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    let visible = true;
    let pointerX = 0;
    let pointerY = 0;
    let smoothX = 0;
    let smoothY = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(width * height * STAR_DENSITY);
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random() ** 2,
        phase: Math.random() * Math.PI * 2,
      }));
      draw(performance.now());
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);
      ctx!.fillStyle = color;
      for (const s of stars) {
        const twinkle = reducedMotion.matches ? 1 : 0.65 + 0.35 * Math.sin(time / 1500 + s.phase);
        const size = 0.6 + s.z * 1.4;
        const x = s.x * width + smoothX * s.z * PARALLAX;
        const y = s.y * height + smoothY * s.z * PARALLAX;
        ctx!.globalAlpha = (0.25 + s.z * 0.75) * twinkle;
        ctx!.fillRect(x, y, size, size);
      }
      ctx!.globalAlpha = 1;
    }

    function frame(time: number) {
      const dt = Math.min((time - last) / 1000, 0.1);
      last = time;
      smoothX += (pointerX - smoothX) * 0.05;
      smoothY += (pointerY - smoothY) * 0.05;
      for (const s of stars) {
        s.y += DRIFT * (0.2 + s.z) * dt;
        if (s.y > 1) {
          s.y -= 1;
          s.x = Math.random();
        }
      }
      draw(time);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || reducedMotion.matches || !visible || document.hidden) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onPointerMove(event: PointerEvent) {
      pointerX = event.clientX / window.innerWidth - 0.5;
      pointerY = event.clientY / window.innerHeight - 0.5;
    }

    function onMotionChange() {
      if (reducedMotion.matches) {
        stop();
        draw(performance.now());
      } else {
        start();
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    intersectionObserver.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : start());
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotionChange);

    return () => {
      stop();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
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
  }
</style>
