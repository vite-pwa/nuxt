<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <div>
      PWA Installed: {{ $pwa?.isPWAInstalled }}
    </div>
    <NuxtLink to="/about">
      About
    </NuxtLink>
  </div>
</template>
