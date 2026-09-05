<script setup lang="ts">
import { useAttrs, type CSSProperties } from 'vue'
import { useElement } from '../internal/dom'
defineOptions({ inheritAttrs: false })
export interface FieldLabelProps { label?: string; htmlFor?: string; required?: boolean; requiredText?: string; subLabel?: string }
defineProps<FieldLabelProps>()
const attrs = useAttrs()
const { element } = useElement<HTMLLabelElement>()
defineExpose({ element })
</script>
<template>
  <div :class="['charcoal-field-label-root', attrs.class]" :style="attrs.style as CSSProperties">
    <label v-bind="{ ...attrs, class: undefined, style: undefined }" ref="element" class="charcoal-field-label" :for="htmlFor">{{ label }}</label>
    <div v-if="required" class="charcoal-field-label-required-text">{{ requiredText }}</div>
    <div class="charcoal-field-label-sub-label"><span><slot name="subLabel">{{ subLabel }}</slot></span></div>
  </div>
</template>
