<script setup lang="ts">
const route = useRoute<'hi-id'>()
</script>

<template>
  <div>
    <h1>Hi {{ route.params.id }}</h1>
    <NuxtLink to="/">
      Back
    </NuxtLink>
  </div>
</template>
