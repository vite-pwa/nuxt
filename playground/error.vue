<script setup lang="ts">
import type { NuxtError } from '#app'

// prevent reactive update when clearing error
const { error } = defineProps<{
  error: Partial<NuxtError>
}>()
console.error(error)
</script>

<template>
  <div>
    <NuxtLayout>
      <h1>Error</h1>
      <NuxtLink to="/">
        Back Home
      </NuxtLink>
    </NuxtLayout>
  </div>
</template>
