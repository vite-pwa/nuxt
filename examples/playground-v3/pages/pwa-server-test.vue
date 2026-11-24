<script setup lang="ts">
const pwa = usePWA()

if (import.meta.server) {
  pwa.isPWAInstalled = true
  pwa.showInstallPrompt = true
  pwa.swActivated = true
  pwa.registrationError = true
  pwa.offlineReady = true
  pwa.needRefresh = true
}
</script>

<template>
  <p data-testid="pwa-server-state">
    PWA: {{ pwa.isPWAInstalled }} {{ pwa.showInstallPrompt }} {{ pwa.swActivated }} {{ pwa.registrationError }} {{ pwa.offlineReady }} {{ pwa.needRefresh }}
  </p>
</template>
