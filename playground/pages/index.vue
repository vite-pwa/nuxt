<script setup lang="ts">
const online = ref(false)

onBeforeMount(() => {
  online.value = navigator.onLine
  window.addEventListener('online', () => {
    online.value = true
  })
  window.addEventListener('offline', () => {
    online.value = false
  })
})
</script>

<template>
  <div>
    <h1>Nuxt Vite PWA</h1>
    <div>
      PWA Installed: {{ $pwa?.isPWAInstalled }}
    </div>
    <Suspense>
      <ClientOnly>
        <div v-if="!online">
          You're offline
        </div>
      </ClientOnly>
      <template #fallback>
        <div italic op50>
          <span animate-pulse>Loading...</span>
        </div>
      </template>
    </Suspense>
    <NuxtLink to="/about">
      About
    </NuxtLink>
    <InputEntry />
  </div>
</template>
