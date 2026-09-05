<script setup lang="ts">
import { watchEffect, type Component } from 'vue'
import { useElement, useIconRegistration } from '../internal/dom'
export interface IconButtonProps {
  variant?: 'Default' | 'Overlay'
  size?: 'XS' | 'S' | 'M'
  icon: string
  isActive?: boolean
  component?: string | Component
}
const props = withDefaults(defineProps<IconButtonProps>(), { variant: 'Default', size: 'M', isActive: false })
const { element, focus, blur } = useElement<HTMLElement>()
useIconRegistration()
watchEffect(() => {
  const size = props.size === 'XS' ? '16' : '24'
  if (!props.icon.startsWith(size + '/')) console.warn(`IconButton with size "${props.size}" expects a ${size}px icon`)
})
defineExpose({ element, focus, blur })
</script>
<template>
  <component :is="component ?? 'button'" ref="element" class="charcoal-icon-button" :data-size="size" :data-active="isActive" :data-variant="variant"><component :is="'pixiv-icon'" :name="icon" /></component>
</template>
