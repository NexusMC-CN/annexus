<script setup lang="ts">
import LoadingSpinnerIcon from './LoadingSpinnerIcon.vue'
import { useElement } from '../internal/dom'
export interface LoadingSpinnerProps { size?: number; padding?: number; transparent?: boolean }
withDefaults(defineProps<LoadingSpinnerProps>(), { size: 48, padding: 16, transparent: false })
const { element } = useElement<HTMLDivElement>()
defineExpose({ element })
</script>
<template><div ref="element" class="charcoal-loading-spinner" role="progressbar" :style="{ '--charcoal-loading-spinner-size': `${size}px`, '--charcoal-loading-spinner-padding': `${padding}px` }" :data-transparent="transparent"><LoadingSpinnerIcon /></div></template>
