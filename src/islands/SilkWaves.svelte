<script lang="ts">
  // Hero visual: soft translucent ribbons flowing across the hero, inspired by the PS3 boot screen.
  // Filled ribbons with a faint wireframe mesh drawn over them. To remove it: delete the <SilkWaves> line (and its import) in Hero.astro, then this file.
  // Hovering an element with data-wave-focus="fill" (the word "Art" in the headline) keeps only the filled ribbons;
  // data-wave-focus="mesh" ("Systems") keeps only the wireframe, which is then drawn brighter.
  // Pauses while off screen or the tab is hidden; renders one static frame under reduced motion.
  import { onMount } from 'svelte';

  interface Ribbon {
    offset: number; // vertical offset, fraction of the height
    amp: number; // wave amplitude, fraction of the height
    thick: number; // max thickness, fraction of the height
    freq: number; // spatial frequency
    speed: number; // rad/s
    phase: number;
    alpha: number; // fill opacity
  }

  const RIBBONS: Ribbon[] = [
    { offset: 0.0, amp: 0.07, thick: 0.1, freq: 1.2, speed: 0.22, phase: 0.0, alpha: 0.1 },
    { offset: 0.01, amp: 0.08, thick: 0.07, freq: 1.5, speed: 0.3, phase: 1.3, alpha: 0.12 },
    { offset: -0.015, amp: 0.06, thick: 0.05, freq: 1.9, speed: -0.26, phase: 2.6, alpha: 0.14 },
    { offset: 0.03, amp: 0.09, thick: 0.12, freq: 0.9, speed: 0.17, phase: 4.1, alpha: 0.07 },
    { offset: 0.0, amp: 0.05, thick: 0.025, freq: 2.3, speed: 0.38, phase: 5.2, alpha: 0.2 },
  ];
  const STEP = 8; // px between samples along x
  const RIBS = 12; // mesh cross lines are drawn every RIBS samples
  const STRANDS = 7; // mesh lines along each ribbon
  const MESH_ALPHA = 0.9; // mesh opacity as a multiple of the ribbon's fill opacity
  const BASE_Y = 0.55; // ribbon centre line, fraction of the height

  const MESH_FOCUS_GAIN = 2.4; // wireframe brightness when it is the only layer shown
  const FILL_FOCUS_GAIN = 1.5; // ribbon brightness when they are the only layer shown
  const BLEND_RATE = 6; // how fast the layers cross-fade, per second

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const color =
      getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim() || '#fff';

    let width = 0;
    let height = 0;
    let raf = 0;
    let visible = true;
    let fade: CanvasGradient;
    // Current and target brightness multipliers of the two layers.
    let fillK = 1;
    let meshK = 1;
    let fillTarget = 1;
    let meshTarget = 1;
    let lastTime = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Ribbons dissolve into the dark at both ends.
      fade = ctx!.createLinearGradient(0, 0, width, 0);
      fade.addColorStop(0, 'rgb(255 255 255 / 0)');
      fade.addColorStop(0.18, 'rgb(255 255 255 / 0.8)');
      fade.addColorStop(0.8, 'rgb(255 255 255 / 1)');
      fade.addColorStop(1, 'rgb(255 255 255 / 0)');
      draw(performance.now());
    }

    function draw(time: number) {
      const t = time / 1000;
      const k = Math.min(1, Math.max(0, (time - lastTime) / 1000) * BLEND_RATE);
      lastTime = time;
      fillK += (fillTarget - fillK) * k;
      meshK += (meshTarget - meshK) * k;
      ctx!.clearRect(0, 0, width, height);
      ctx!.globalCompositeOperation = 'lighter';
      ctx!.fillStyle = color;
      ctx!.strokeStyle = color;
      ctx!.lineWidth = 1;

      for (const r of RIBBONS) {
        const top: number[] = [];
        const bottom: number[] = [];
        const n = Math.ceil(width / STEP);
        for (let i = 0; i <= n; i++) {
          const u = i / n;
          const p = r.phase + t * r.speed;
          const wave =
            Math.sin(u * Math.PI * 2 * r.freq + p) * 0.6 +
            Math.sin(u * Math.PI * 2 * r.freq * 1.7 - p * 1.3) * 0.4;
          // The ribbon pinches and swells along its length, like folded silk.
          const swell = Math.abs(Math.sin(u * Math.PI * r.freq * 0.8 + p * 0.7 + r.phase));
          const centre = (BASE_Y + r.offset + wave * r.amp) * height;
          const thick = r.thick * (0.15 + 0.85 * swell) * height;

          const half = thick / 2;
          top.push(centre - half);
          bottom.push(centre + half);
        }
        ctx!.beginPath();
        for (let i = 0; i <= n; i++) ctx!.lineTo(i * STEP, top[i]);
        for (let i = n; i >= 0; i--) ctx!.lineTo(i * STEP, bottom[i]);
        ctx!.closePath();
        ctx!.globalAlpha = Math.min(1, r.alpha * fillK);
        if (fillK > 0.005) ctx!.fill();

        // Wireframe overlay: strands along the ribbon plus cross ribs.
        ctx!.globalAlpha = Math.min(Math.min(r.alpha * MESH_ALPHA, 0.2) * meshK, 0.5);
        ctx!.beginPath();
        for (let k = 0; k < STRANDS; k++) {
          const v = k / (STRANDS - 1);
          for (let i = 0; i <= n; i++) {
            const y = top[i] + (bottom[i] - top[i]) * v;
            if (i === 0) ctx!.moveTo(0, y);
            else ctx!.lineTo(i * STEP, y);
          }
        }
        for (let i = 0; i <= n; i += RIBS) {
          ctx!.moveTo(i * STEP, top[i]);
          ctx!.lineTo(i * STEP, bottom[i]);
        }
        if (meshK > 0.005) ctx!.stroke();
      }

      // Fade the ribbon ends.
      ctx!.globalAlpha = 1;
      ctx!.globalCompositeOperation = 'destination-in';
      ctx!.fillStyle = fade;
      ctx!.fillRect(0, 0, width, height);
      ctx!.globalCompositeOperation = 'source-over';
    }

    function frame(time: number) {
      draw(time);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || reducedMotion.matches || !visible || document.hidden) return;
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    // Under reduced motion nothing animates, so a short loop plays the cross-fade and stops once it settles.
    let settling = 0;
    function settle(time: number) {
      draw(time);
      const done = Math.abs(fillK - fillTarget) < 0.01 && Math.abs(meshK - meshTarget) < 0.01;
      settling = done ? 0 : requestAnimationFrame(settle);
    }

    function focusOn(mode: string | null) {
      fillTarget = mode === 'fill' ? FILL_FOCUS_GAIN : mode === 'mesh' ? 0 : 1;
      meshTarget = mode === 'mesh' ? MESH_FOCUS_GAIN : mode === 'fill' ? 0 : 1;
      if (reducedMotion.matches && !settling) {
        lastTime = performance.now();
        settling = requestAnimationFrame(settle);
      }
    }

    const focusables = Array.from(document.querySelectorAll<HTMLElement>('[data-wave-focus]'));
    const focusHandlers = focusables.map((el) => {
      const enter = () => focusOn(el.dataset.waveFocus ?? null);
      const leave = () => focusOn(null);
      el.addEventListener('pointerenter', enter);
      el.addEventListener('pointerleave', leave);
      return () => {
        el.removeEventListener('pointerenter', enter);
        el.removeEventListener('pointerleave', leave);
      };
    });

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
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotionChange);

    return () => {
      stop();
      cancelAnimationFrame(settling);
      focusHandlers.forEach((off) => off());
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
  }
</style>
