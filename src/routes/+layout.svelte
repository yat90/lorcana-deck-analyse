<script>
  import '../app.css';
  import { onMount } from 'svelte';
  import { pwaInfo } from 'virtual:pwa-info';

  $: webManifestLink = pwaInfo?.webManifest?.linkTag ?? '';

  onMount(() => {
    import('virtual:pwa-register').then((m) => {
      m.registerSW?.({ immediate: true });
    }).catch(() => {});
  });
</script>

<svelte:head>
  {#if webManifestLink}
    {@html webManifestLink}
  {/if}
  <meta name="theme-color" content="#0071e3" />
</svelte:head>

<slot />
