<script setup lang="ts">
import { computed } from 'vue'
import { useElement, useIconRegistration } from '../internal/dom'
export interface IconProps { name: string; scale?: 1 | 2 | 3 | '1' | '2' | '3'; fixedSize?: number; unsafeNonGuidelineScale?: number }
const props = defineProps<IconProps>()
const { element } = useElement<HTMLElement>()
useIconRegistration()
const actualSize = computed(() => {
  const { name, fixedSize, unsafeNonGuidelineScale, scale } = props
  if (fixedSize !== undefined) {
    if (!Number.isFinite(fixedSize) || fixedSize <= 0) throw new TypeError('fixedSize must be positive and finite')
    return fixedSize
  }
  const [size] = name.split('/')
  const base = size === 'Inline' ? 16 : parseInt(size)
  if (!name.includes('/') || !Number.isFinite(base) || base <= 0) throw new TypeError('Invalid icon name')
  if (unsafeNonGuidelineScale !== undefined) {
    const result = base * unsafeNonGuidelineScale
    if (!Number.isFinite(result) || result <= 0) throw new TypeError('Icon scale must be positive and finite')
    return result
  }
  return size === 'Inline' ? (Number(scale) === 2 ? 32 : 16) : size === '24' ? base * Number(scale ?? 1) : base
})
defineExpose({ element })
</script>
<template><component :is="'pixiv-icon'" ref="element" class="charcoal-icon" :name="name" :scale="scale" :fixed-size="fixedSize" :unsafe-non-guideline-scale="unsafeNonGuidelineScale" :style="{ '--charcoal-icon-size': `${actualSize}px` }" /></template>
