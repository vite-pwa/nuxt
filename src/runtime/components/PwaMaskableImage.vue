<script setup lang="ts">
import { useMaskablePwaIcon } from '#pwa'
import type { PwaMaskableImageProps } from '#build/pwa-icons/PwaMaskableImage'

const props = defineProps<PwaMaskableImageProps>()

const { icon } = useMaskablePwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
