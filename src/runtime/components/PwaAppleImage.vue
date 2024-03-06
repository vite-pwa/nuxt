<script setup lang="ts">
import { useApplePwaIcon } from '#pwa'
import type { PwaAppleImageProps } from '#build/pwa-icons/PwaAppleImage'

const props = defineProps<PwaAppleImageProps>()

const { icon } = useApplePwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
