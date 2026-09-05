<script setup lang="ts">
import type { Component } from 'vue'
import { useElement } from '../internal/dom'
export interface ClickableProps { component?: string | Component }
export type ClickableElement = HTMLButtonElement | HTMLAnchorElement
defineProps<ClickableProps>()
const { element, focus, blur } = useElement<HTMLElement>()
defineExpose({ element, focus, blur })
</script>
<template><component :is="component ?? 'button'" ref="element" class="charcoal-clickable"><slot /></component></template>
