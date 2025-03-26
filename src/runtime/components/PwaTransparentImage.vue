<script setup lang="ts">
import type { PwaTransparentImageProps } from '#build/pwa-icons/PwaTransparentImage'
import { useTransparentPwaIcon } from '#pwa'

const props = defineProps<PwaTransparentImageProps>()

const { icon } = useTransparentPwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
