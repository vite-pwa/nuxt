<script setup lang="ts">
</script>

<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <ClientOnly>
      PWA Installed: {{ $pwa?.isPWAInstalled }}
    </ClientOnly>
    <br>
    <NuxtLink to="/about">
      About
    </NuxtLink>
    <br>
    <PwaTransparentImage image="pwa-64x64.png" alt="PWA Icon" />
  </div>
</template>
