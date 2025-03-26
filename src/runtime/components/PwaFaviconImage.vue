<script setup lang="ts">
import type { PwaFaviconImageProps } from '#build/pwa-icons/PwaFaviconImage'
import { useFaviconPwaIcon } from '#pwa'

const props = defineProps<PwaFaviconImageProps>()

const { icon } = useFaviconPwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
