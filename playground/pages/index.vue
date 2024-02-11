<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <ClientOnly>
      PWA Installed: {{ $pwa?.isPWAInstalled }}
    </ClientOnly>
    <NuxtLink to="/about">
      About
    </NuxtLink>
  </div>
</template>
