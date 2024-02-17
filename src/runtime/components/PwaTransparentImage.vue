<script setup lang="ts">
import { useTransparentPwaIcon } from '#pwa'
import type { PwaTransparentImageProps } from '#build/pwa-icons/PwaTransparentImage'

const props = defineProps<PwaTransparentImageProps>()

const { icon } = useTransparentPwaIcon(props)
</script>

<template>
  <img v-if="icon" v-bind="icon">
</template>
