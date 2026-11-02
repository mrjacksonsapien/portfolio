<script lang="ts">
  // Full-screen picture viewer. Any `a[data-lightbox]` on the page opens it (the link's href is the large image,
  // its <img> the thumbnail, `data-caption` the caption), in document order, so the arrows and the carousel at the
  // bottom walk through every picture of the page. Built on <dialog>, which brings focus trapping and Escape.
  import { onMount } from 'svelte';

  interface Item {
    full: string;
    thumb: string;
    alt: string;
    caption: string;
  }

  let items = $state<Item[]>([]);
  let index = $state(0);
  let dialog: HTMLDialogElement;
  let strip: HTMLElement;

  const total = $derived(items.length);
  const current = $derived(items[index]);

  function readItems(): Item[] {
    return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[data-lightbox]')).map((a) => {
      const img = a.querySelector('img');
      return {
        full: a.href,
        thumb: img?.currentSrc || img?.src || a.href,
        alt: img?.alt ?? '',
        caption: a.dataset.caption ?? '',
      };
    });
  }

  function open(i: number) {
    index = i;
    if (!dialog.open) dialog.showModal();
    document.documentElement.style.overflow = 'hidden';
  }

  function close() {
    dialog.close();
  }

  function go(step: number) {
    index = (index + step + total) % total;
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') go(-1);
    else if (event.key === 'ArrowRight') go(1);
    else if (event.key === 'Home') index = 0;
    else if (event.key === 'End') index = total - 1;
    else return;
    event.preventDefault();
  }

  // A click on the empty area around the picture closes the viewer.
  function onBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) close();
  }

  let swipeStart: number | null = null;

  function onPointerDown(event: PointerEvent) {
    if (event.pointerType !== 'mouse') swipeStart = event.clientX;
  }

  function onPointerUp(event: PointerEvent) {
    if (swipeStart === null) return;
    const dx = event.clientX - swipeStart;
    swipeStart = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  }

  // Keep the neighbours loaded so arrow navigation is instant, and the active thumbnail centered.
  $effect(() => {
    if (!dialog?.open || !total) return;
    for (const step of [-1, 1]) new Image().src = items[(index + step + total) % total].full;
    const active = strip?.querySelector('[aria-current="true"]');
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    active?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: smooth ? 'smooth' : 'auto' });
  });

  onMount(() => {
    items = readItems();

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey) return;
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-lightbox]');
      if (!link) return;
      const i = items.findIndex((item) => item.full === link.href);
      if (i < 0) return;
      event.preventDefault();
      open(i);
    }

    document.addEventListener('click', onClick);
    return () => {
      document.removeEventListener('click', onClick);
      document.documentElement.style.overflow = '';
    };
  });
</script>

<dialog bind:this={dialog} aria-label="Picture viewer" onkeydown={onKeydown} onclose={() => (document.documentElement.style.overflow = '')}>
  {#if current}
    <div class="bar">
      <span class="meta">{String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}</span>
      <button class="icon" type="button" aria-label="Close" onclick={close}>
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19" /></svg>
      </button>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
    <div class="stage" onclick={onBackdropClick} onpointerdown={onPointerDown} onpointerup={onPointerUp}>
      <button class="icon arrow" type="button" aria-label="Previous picture" onclick={() => go(-1)}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m15 4-8 8 8 8" /></svg>
      </button>
      {#key index}
        <img class="main" src={current.full} alt={current.alt} draggable="false" />
      {/key}
      <button class="icon arrow" type="button" aria-label="Next picture" onclick={() => go(1)}>
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m9 4 8 8-8 8" /></svg>
      </button>
    </div>

    <p class="caption meta">{current.caption}</p>

    <div class="strip" bind:this={strip}>
      {#each items as item, i}
        <button type="button" class="thumb" aria-label={`Show picture ${i + 1}: ${item.caption || item.alt}`} aria-current={i === index} onclick={() => (index = i)}>
          <img src={item.thumb} alt="" draggable="false" />
        </button>
      {/each}
    </div>
  {/if}
</dialog>

<style>
  dialog {
    width: 100%;
    height: 100%;
    max-width: none;
    max-height: none;
    margin: 0;
    padding: 0;
    border: 0;
    background: rgb(0 0 0 / 0.96);
    color: var(--color-fg);
  }
  dialog[open] {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto auto;
    animation: lb-fade 0.3s ease-out;
  }
  dialog::backdrop {
    background: #000;
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-2) var(--gutter);
  }
  .icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: var(--space-1);
    border: 0;
    background: none;
    color: var(--color-fg-muted);
    cursor: pointer;
    transition: color 0.2s;
  }
  .icon:hover,
  .icon:focus-visible {
    color: var(--color-fg);
  }
  .stage {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
    min-height: 0;
    padding-inline: var(--gutter);
  }
  .main {
    justify-self: center;
    max-width: 100%;
    max-height: 100%;
    min-height: 0;
    object-fit: contain;
    animation: lb-fade 0.35s ease-out;
    user-select: none;
  }
  .caption {
    margin: 0;
    padding: var(--space-2) var(--gutter) 0;
    text-align: center;
    min-height: 2.2em;
  }
  .strip {
    display: flex;
    gap: var(--space-1);
    overflow-x: auto;
    padding: var(--space-2) var(--gutter) var(--space-3);
    scrollbar-width: none;
  }
  .thumb {
    flex: none;
    width: 7.5rem;
    padding: 0;
    border: 1px solid var(--color-line);
    background: none;
    opacity: 0.5;
    cursor: pointer;
    transition:
      opacity 0.2s,
      border-color 0.2s;
  }
  .thumb:hover,
  .thumb:focus-visible,
  .thumb[aria-current='true'] {
    opacity: 1;
  }
  .thumb[aria-current='true'] {
    border-color: var(--color-fg);
  }
  .thumb img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
  @keyframes lb-fade {
    from {
      opacity: 0;
    }
  }
  /* On narrow screens the arrows float over the picture edges instead of taking their own columns. */
  @media (max-width: 40rem) {
    .stage {
      grid-template-columns: minmax(0, 1fr);
      grid-template-areas: 'pic';
    }
    .stage > * {
      grid-area: pic;
    }
    .arrow {
      z-index: 1;
      background: rgb(0 0 0 / 0.5);
    }
    .arrow:first-child {
      justify-self: start;
    }
    .arrow:last-child {
      justify-self: end;
    }
    .thumb {
      width: 5.5rem;
    }
  }
</style>
