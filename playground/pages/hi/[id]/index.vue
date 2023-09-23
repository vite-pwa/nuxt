<script setup lang="ts">
const route = useRoute<'hi-id'>()
const name = route.params.id ?? ''
if (process.server) {
  // eslint-disable-next-line no-console
  console.log('Server side', name)
}
</script>

<template>
  <div>
    <div text-xl>
      {{ name }}!
    </div>
    <NuxtLink :to="`/hi/${name}/detail`" class="m-3 text-sm btn">
      Detail
    </NuxtLink>
  </div>
</template>
