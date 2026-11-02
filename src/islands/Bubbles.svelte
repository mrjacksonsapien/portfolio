<script lang="ts">
  // Decorative background for the Aquamania page: small bubbles rising with a slight wobble. The pointer
  // pushes them aside and drags them along its movement, like moving through water.
  // Fixed to the viewport, so its cost does not grow with the page. Pauses while the tab is hidden and draws
  // one still frame under reduced motion.
  // With `contained` it fills its positioned parent instead of the viewport (project cards on the home page).
  // To remove it: delete the <Bubbles> line (and its import) in ShowcaseProject.astro, then this file.
  import { onMount } from 'svelte';

  interface Bubble {
    x: number;
    y: number;
    r: number;
    rise: number; // px per second
    phase: number;
    wobble: number; // px of sideways sway
    vx: number; // velocity added by the pointer, px per second
    vy: number;
  }

  const BUBBLE_DENSITY = 1 / 32000; // bubbles per CSS pixel
  const CARD_DENSITY = 1 / 4500; // denser in a small card, so it is not nearly empty
  const CARD_BRIGHTNESS = 1.3; // alpha multiplier in a card
  const REACH = 150; // pointer influence radius, px
  const DRAG = 0.5; // share of the pointer velocity handed to bubbles at its center
  const PUSH = 700; // outward acceleration at the pointer, px per second squared
  const DAMPING = 1.6; // how fast pointer-induced velocity fades, per second

  let { contained = false }: { contained?: boolean } = $props();
  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-fg').trim() || '#fff';

    let bubbles: Bubble[] = [];
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    let visible = true; // false while a contained canvas is scrolled off screen
    // Pointer position and smoothed velocity (px per second); inactive until it moves over the page.
    let pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false };
    let pointerTime = 0;

    function spawn(anywhere: boolean): Bubble {
      const r = 1.5 + Math.random() ** 2 * 5;
      return {
        x: Math.random() * width,
        y: anywhere ? Math.random() * height : height + r + Math.random() * 40,
        r,
        rise: 14 + r * 7 + Math.random() * 10,
        phase: Math.random() * Math.PI * 2,
        wobble: 4 + Math.random() * 10,
        vx: 0,
        vy: 0,
      };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(width * height * (contained ? CARD_DENSITY : BUBBLE_DENSITY));
      if (bubbles.length > count) bubbles.length = count;
      while (bubbles.length < count) bubbles.push(spawn(true));
      draw(performance.now());
    }

    function draw(time: number) {
      ctx!.clearRect(0, 0, width, height);
      ctx!.strokeStyle = color;
      ctx!.fillStyle = color;
      for (const b of bubbles) {
        const x = b.x + Math.sin(time / 1400 + b.phase) * b.wobble;
        // Bigger bubbles are nearer: a little brighter.
        const alpha = Math.min(1, (0.12 + b.r * 0.035) * (contained ? CARD_BRIGHTNESS : 1));
        ctx!.globalAlpha = alpha;
        ctx!.lineWidth = 1;
        ctx!.beginPath();
        ctx!.arc(x, b.y, b.r, 0, Math.PI * 2);
        ctx!.stroke();
        // Small highlight on the upper left.
        ctx!.globalAlpha = Math.min(1, alpha * 1.6);
        ctx!.beginPath();
        ctx!.arc(x - b.r * 0.35, b.y - b.r * 0.35, Math.max(b.r * 0.18, 0.4), 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;
    }

    function frame(time: number) {
      const dt = Math.min((time - last) / 1000, 0.1);
      last = time;
      // The pointer's velocity fades if it stops sending events.
      if (time - pointerTime > 80) {
        pointer.vx *= Math.exp(-dt * 8);
        pointer.vy *= Math.exp(-dt * 8);
      }
      const damp = Math.exp(-dt * DAMPING);
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        if (pointer.active) {
          const dx = b.x - pointer.x;
          const dy = b.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REACH && dist > 0.001) {
            const falloff = (1 - dist / REACH) ** 2;
            b.vx += ((dx / dist) * PUSH + pointer.vx * DRAG * 8) * falloff * dt;
            b.vy += ((dy / dist) * PUSH + pointer.vy * DRAG * 8) * falloff * dt;
          }
        }
        b.vx *= damp;
        b.vy *= damp;
        b.x += b.vx * dt;
        b.y += (b.vy - b.rise) * dt;
        if (b.y < -b.r - 10 || b.x < -50 || b.x > width + 50 || b.y > height + 200) bubbles[i] = spawn(false);
      }
      draw(time);
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (raf || reducedMotion.matches || document.hidden || !visible) return;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }

    function stop() {
      cancelAnimationFrame(raf);
      raf = 0;
    }

    function onPointerMove(event: PointerEvent) {
      const now = performance.now();
      const rect0 = canvas.getBoundingClientRect();
      const dt = Math.max((now - pointerTime) / 1000, 0.008);
      if (pointer.active) {
        // Smooth the raw velocity so one jumpy event does not fling bubbles.
        pointer.vx += ((event.clientX - rect0.left - pointer.x) / dt - pointer.vx) * 0.3;
        pointer.vy += ((event.clientY - rect0.top - pointer.y) / dt - pointer.vy) * 0.3;
      }
      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
      pointer.active = true;
      pointerTime = now;
    }

    function onPointerLeave() {
      pointer.active = false;
      pointer.vx = 0;
      pointer.vy = 0;
    }

    function onMotionChange() {
      if (reducedMotion.matches) {
        stop();
        draw(performance.now());
      } else {
        start();
      }
    }

    const onVisibility = () => (document.hidden ? stop() : start());

    resize();
    start();
    // A card can scroll off screen: stop drawing then.
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
      else stop();
    });
    if (contained) intersection.observe(canvas);
    const resizeObserver = new ResizeObserver(resize);
    if (contained) resizeObserver.observe(canvas);
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', onVisibility);
    reducedMotion.addEventListener('change', onMotionChange);

    return () => {
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointerMove);
      document.documentElement.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', onVisibility);
      reducedMotion.removeEventListener('change', onMotionChange);
    };
  });
</script>

<canvas bind:this={canvas} class:contained aria-hidden="true"></canvas>

<style>
  canvas {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
    pointer-events: none;
  }
  canvas.contained {
    position: absolute;
  }
</style>
