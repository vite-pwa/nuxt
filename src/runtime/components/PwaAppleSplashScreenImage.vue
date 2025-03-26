<script setup lang="ts">
import type { PwaAppleSplashScreenImageProps } from '#build/pwa-icons/PwaAppleSplashScreenImage'
import { useAppleSplashScreenPwaIcon } from '#pwa'

const props = defineProps<PwaAppleSplashScreenImageProps>()

const { icon } = useAppleSplashScreenPwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
