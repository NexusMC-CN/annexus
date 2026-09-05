<script setup lang="ts">
import { useElement } from '../internal/dom'
export interface LoadingSpinnerIconHandler { restart(): void }
withDefaults(defineProps<{ once?: boolean }>(), { once: false })
const { element } = useElement<HTMLDivElement>()
function restart() {
  if (!element.value) return
  element.value.dataset.resetAnimation = 'true'
  void element.value.offsetWidth
  delete element.value.dataset.resetAnimation
}
defineExpose({ element, restart })
</script>
<template><div ref="element" class="charcoal-loading-spinner-icon" role="presentation" :data-once="once" /></template>
