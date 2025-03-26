<script setup lang="ts">
import type { PwaAppleImageProps } from '#build/pwa-icons/PwaAppleImage'
import { useApplePwaIcon } from '#pwa'

const props = defineProps<PwaAppleImageProps>()

const { icon } = useApplePwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
