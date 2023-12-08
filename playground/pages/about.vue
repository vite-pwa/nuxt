<script setup lang="ts">
</script>

<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <div>
      PWA Installed: {{ $pwa?.isPWAInstalled }}
    </div>
    <NuxtLink to="/">
      Home 1
    </NuxtLink>
  </div>
</template>
