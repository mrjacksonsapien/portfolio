<script lang="ts">
  // Placeholder island: hydrated only when scrolled into view (client:visible).
  // Replace with the real visual (starfield / orb) later.
  import { onMount } from 'svelte';

  let canvas: HTMLCanvasElement;

  onMount(() => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvas;
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 150; i++) {
      ctx.globalAlpha = Math.random();
      ctx.fillRect(Math.random() * width, Math.random() * height, 1.5, 1.5);
    }
  });
</script>

<canvas bind:this={canvas} width="1600" height="900" aria-hidden="true"></canvas>

<style>
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }
</style>
