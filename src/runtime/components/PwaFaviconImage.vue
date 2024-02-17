<script setup lang="ts">
import { useFaviconPwaIcon } from '#pwa'
import type { PwaFaviconImageProps } from '#build/pwa-icons/PwaFaviconImage'

const props = defineProps<PwaFaviconImageProps>()

const { icon } = useFaviconPwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
