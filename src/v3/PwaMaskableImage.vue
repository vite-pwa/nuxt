<script setup lang="ts">
import type { PwaMaskableImageProps } from '#build/pwa-icons/PwaMaskableImage'
import { useMaskablePwaIcon } from '#pwa'

const props = defineProps<PwaMaskableImageProps>()

const { icon } = useMaskablePwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
