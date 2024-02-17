<script setup lang="ts">
import { useAppleSplashScreenPwaIcon } from '#pwa'
import type { PwaAppleSplashScreenImageProps } from '#build/pwa-icons/PwaAppleSplashScreenImage'

const props = defineProps<PwaAppleSplashScreenImageProps>()

const { icon } = useAppleSplashScreenPwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
