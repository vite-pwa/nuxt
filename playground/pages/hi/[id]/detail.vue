<script setup lang="ts">
const route = useRoute<'hi-id-detail'>()
const name = route.params.id ?? ''
if (process.server) {
  // eslint-disable-next-line no-console
  console.log('Server side', name)
}
</script>

<template>
  <div>
    <div text-xl>
      Detail {{ name }}
    </div>
    <NuxtLink :to="`/hi/${name}`" class="m-3 text-sm btn">
      Back Hi
    </NuxtLink>
  </div>
</template>
