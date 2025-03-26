<script setup lang="ts">
const pwa = usePWA()
</script>

<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <ClientOnly>
      PWA Installed: {{ pwa?.isPWAInstalled }}
    </ClientOnly>
    <NuxtLink to="/">
      Home 1
    </NuxtLink>
  </div>
</template>
