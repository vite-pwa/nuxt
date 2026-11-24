<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <p data-testid="pwa-installed">
      PWA Installed: {{ $pwa?.isPWAInstalled }}
    </p>
    <p v-if="$pwa?.isPWAInstalled" data-testid="pwa-installed-message">
      PWA is installed
    </p>
    <NuxtLink to="/about">
      About
    </NuxtLink>
  </div>
</template>
