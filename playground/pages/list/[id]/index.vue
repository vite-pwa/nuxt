<script setup lang="ts">
definePageMeta({
  key: route => route.fullPath,
})
const route = useRoute<'list-id'>()
const name = route.params.id ?? ''
if (process.server) {
  // eslint-disable-next-line no-console
  console.log('Server side', name)
}
</script>

<template>
  <div>
    <h1>Child</h1>
    <NuxtLink to="/list">
      Back
    </NuxtLink>
  </div>
</template>
