<script lang="ts">
  // Live SGL demo. The engine is NOT copied into this repo: it is loaded at runtime from the
  // `main` branch of github.com/mrjacksonsapien/SGL (through jsDelivr, which serves it with the
  // correct module MIME type; raw.githubusercontent.com does not). When SGL's main changes,
  // this demo follows it (jsDelivr may cache a branch for up to ~12 hours).
  // The controls mirror the original demo: click to focus (pointer lock), mouse to look,
  // WASD to move, Space / Shift for up / down, Esc to release.
  // Only the engine API used below (Camera, Scene, Renderer, Cube, Vector3) is a contract.
  import { onMount } from 'svelte';

  const SGL_URL = 'https://cdn.jsdelivr.net/gh/mrjacksonsapien/SGL@main/sgl.js';
  const MOVE_SPEED = 3; // world units per second
  const LOOK_SENSITIVITY = 0.15; // degrees per pixel of mouse movement

  const WIDTH = 640;
  const HEIGHT = 480;

  let canvas: HTMLCanvasElement;
  let frameEl: HTMLDivElement;
  let scale = 1;
  let status: 'loading' | 'ready' | 'locked' | 'error' = 'loading';

  onMount(() => {
    let disposed = false;
    let raf = 0;
    let visible = true;
    let last = 0;
    let dt = 0;
    const keys = new Set<string>();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let cleanup = () => {};

    // SGL maps to the screen with canvas.clientWidth/clientHeight but fills a width x height buffer, so the
    // two must be equal. The canvas therefore stays at its native CSS size and is scaled with a transform
    // (which clientWidth ignores) to fit the column.
    const resizeObserver = new ResizeObserver(() => {
      scale = frameEl.clientWidth / WIDTH;
    });
    resizeObserver.observe(frameEl);

    (async () => {
      let sgl: any;
      try {
        sgl = await import(/* @vite-ignore */ SGL_URL);
      } catch {
        if (!disposed) status = 'error';
        return;
      }
      if (disposed) return;

      const camera = new sgl.Camera(canvas, 0.1, 40, 90, new sgl.Vector3(0, 0, 0), new sgl.Vector3(0, 0, 0));
      const scene = new sgl.Scene(camera);
      const renderer = new sgl.Renderer(canvas, scene);

      // A few cubes at different depths, each spinning at its own rate.
      const layout: [number, number, number][] = [
        [0, 0, 3],
        [-3, 1, 5],
        [3, -1, 5],
        [-2, -1.5, 8],
        [2.5, 1.5, 8],
        [0, 2, 11],
        [-5, 0, 11],
        [5, 0, 11],
      ];
      layout.forEach(([x, y, z], i) => {
        const cube = new sgl.Cube(new sgl.Vector3(x, y, z));
        const rate = 30 + i * 12;
        cube.act = () => {
          if (!reducedMotion) cube.rotation.y += dt * rate;
        };
        scene.add(cube);
      });

      const yaw = () => (camera.orientation.y * Math.PI) / 180;

      function move(forward: number, strafe: number, up: number) {
        const s = Math.sin(yaw());
        const c = Math.cos(yaw());
        // Same convention as the original demo: forward is -z at yaw 0.
        camera.position.x += (-forward * s + strafe * c) * MOVE_SPEED * dt;
        camera.position.z += (-forward * c - strafe * s) * MOVE_SPEED * dt;
        camera.position.y += up * MOVE_SPEED * dt;
      }

      function frame(now: number) {
        raf = 0;
        if (disposed || !visible || document.hidden) return;
        dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        if (status === 'locked') {
          move(
            Number(keys.has('KeyW')) - Number(keys.has('KeyS')),
            Number(keys.has('KeyD')) - Number(keys.has('KeyA')),
            Number(keys.has('Space')) - Number(keys.has('ShiftLeft') || keys.has('ShiftRight')),
          );
        }
        scene.act();
        renderer.render();
        raf = requestAnimationFrame(frame);
      }

      function start() {
        if (raf || disposed) return;
        last = performance.now();
        raf = requestAnimationFrame(frame);
      }

      function onMouseMove(e: MouseEvent) {
        if (status !== 'locked') return;
        camera.orientation.y -= e.movementX * LOOK_SENSITIVITY;
        // Pitch is clamped so the camera can never flip over.
        camera.orientation.x = Math.max(-89, Math.min(89, camera.orientation.x - e.movementY * LOOK_SENSITIVITY));
      }
      function onKeyDown(e: KeyboardEvent) {
        if (status !== 'locked') return;
        keys.add(e.code);
        if (e.code === 'Space') e.preventDefault();
      }
      function onKeyUp(e: KeyboardEvent) {
        keys.delete(e.code);
      }
      function onLockChange() {
        status = document.pointerLockElement === canvas ? 'locked' : 'ready';
        if (status !== 'locked') keys.clear();
      }
      function onClick() {
        canvas.requestPointerLock?.();
      }
      function onVisibility() {
        if (!document.hidden) start();
      }

      const observer = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible) start();
      });
      observer.observe(canvas);

      canvas.addEventListener('click', onClick);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      document.addEventListener('pointerlockchange', onLockChange);
      document.addEventListener('visibilitychange', onVisibility);

      status = 'ready';
      start();

      cleanup = () => {
        observer.disconnect();
        canvas.removeEventListener('click', onClick);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
        document.removeEventListener('pointerlockchange', onLockChange);
        document.removeEventListener('visibilitychange', onVisibility);
        if (document.pointerLockElement === canvas) document.exitPointerLock();
      };
    })();

    return () => {
      disposed = true;
      resizeObserver.disconnect();
      cancelAnimationFrame(raf);
      cleanup();
    };
  });
</script>

<figure class="demo">
  <div class="demo__frame" bind:this={frameEl} style:--scale={scale}>
    <canvas bind:this={canvas} width={WIDTH} height={HEIGHT} aria-label="Interactive SGL software-rendered 3D scene"></canvas>
    {#if status === 'loading'}
      <p class="demo__overlay meta">Loading engine from GitHub…</p>
    {:else if status === 'error'}
      <p class="demo__overlay meta">
        Could not load the engine. <a href="https://github.com/mrjacksonsapien/SGL">View the source on GitHub</a>.
      </p>
    {:else if status === 'ready'}
      <p class="demo__overlay meta">Click to focus</p>
    {/if}
  </div>
  <figcaption class="meta">
    Live: rendered on the CPU by SGL, loaded from its <code>main</code> branch.
    Click to focus · mouse to look · WASD to move · Space / Shift up / down · Esc to release.
  </figcaption>
</figure>

<style>
  .demo {
    margin: 0 0 var(--space-4);
  }
  .demo__frame {
    position: relative;
    border: 1px solid var(--color-line);
    aspect-ratio: 4 / 3;
    overflow: hidden;
  }
  canvas {
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    width: 640px;
    height: 480px;
    transform: scale(var(--scale, 1));
    transform-origin: 0 0;
    background: var(--color-bg);
    cursor: pointer;
  }
  .demo__overlay {
    position: absolute;
    inset: auto 0 var(--space-2) 0;
    margin: 0;
    text-align: center;
    pointer-events: none;
  }
  .demo__overlay a {
    pointer-events: auto;
  }
  figcaption {
    margin-top: var(--space-1);
  }
</style>
