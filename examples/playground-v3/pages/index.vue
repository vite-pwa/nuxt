<script setup lang="ts">
const pwa = usePWA()
</script>

<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <p data-testid="pwa-installed">
      PWA Installed: {{ pwa.isPWAInstalled }}
    </p>
    <p data-testid="pwa-state">
      SW: {{ pwa.swActivated }} {{ pwa.registrationError }} {{ pwa.offlineReady }} {{ pwa.needRefresh }} {{ pwa.showInstallPrompt }}
    </p>
    <NuxtLink to="/about">
      About
    </NuxtLink>
  </div>
</template>
