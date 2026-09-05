<script setup lang="ts">
import type { Component } from 'vue'
import { useElement } from '../internal/dom'
export interface ButtonProps {
  variant?: 'Primary' | 'Default' | 'Overlay' | 'Danger' | 'Navigation'
  size?: 'S' | 'M'
  fullWidth?: boolean
  isActive?: boolean
  component?: string | Component
}
defineProps<ButtonProps>()
const { element, focus, blur } = useElement<HTMLButtonElement>()
defineExpose({ element, focus, blur })
</script>
<template>
  <component :is="component ?? 'button'" ref="element" class="charcoal-button" :data-variant="variant" :data-size="size" :data-full-width="fullWidth" :data-active="isActive"><slot /></component>
</template>
