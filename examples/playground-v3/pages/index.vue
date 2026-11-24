<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <p data-testid="pwa-installed">
      PWA Installed: {{ $pwa?.isPWAInstalled }}
    </p>
    <p v-if="$pwa?.isPWAInstalled" data-testid="pwa-installed-message">
      PWA is installed
    </p>
    <p v-if="$pwa" data-testid="pwa-sw-state">
      SW: {{ $pwa.swActivated }} {{ $pwa.registrationError }} {{ $pwa.offlineReady }} {{ $pwa.needRefresh }} {{ $pwa.showInstallPrompt }}
    </p>
    <NuxtLink to="/about">
      About
    </NuxtLink>
  </div>
</template>
