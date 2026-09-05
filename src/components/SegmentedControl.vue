<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import { useElement } from '../internal/dom'
export interface SegmentedControlItem { label: string; value: string; disabled?: boolean }
export interface SegmentedControlProps {
  name?: string; disabled?: boolean; readonly?: boolean; required?: boolean; uniformSegmentWidth?: boolean
  fullWidth?: boolean; value?: string; modelValue?: string; defaultValue?: string; data: (string | SegmentedControlItem)[]
}
const props = defineProps<SegmentedControlProps>()
const emit = defineEmits<{ change: [value: string]; 'update:modelValue': [value: string]; 'update:value': [value: string] }>()
const uid = useId(); const local = ref(props.defaultValue)
const value = computed(() => props.modelValue ?? props.value ?? local.value)
const items = computed(() => props.data.map(item => typeof item === 'string' ? { label: item, value: item } : item))
const { element } = useElement<HTMLDivElement>()
function change(next: string) {
  if (props.disabled || props.readonly) return
  local.value = next; emit('change', next); emit('update:modelValue', next); emit('update:value', next)
}
function keyboard(event: KeyboardEvent, index: number) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key) || props.disabled || props.readonly) return
  event.preventDefault()
  const rtl = element.value && getComputedStyle(element.value).direction === 'rtl'
  const dir = (event.key === 'ArrowDown' || event.key === (rtl ? 'ArrowLeft' : 'ArrowRight')) ? 1 : -1
  for (let n = 1; n <= items.value.length; n++) {
    const next = (index + dir * n + items.value.length) % items.value.length
    if (items.value[next].disabled) continue
    element.value?.querySelectorAll('input')[next]?.focus()
    change(items.value[next].value); break
  }
}
defineExpose({ element })
</script>
<template><div ref="element" class="charcoal-segmented-control" role="radiogroup" :aria-label="name" :aria-disabled="disabled || undefined" :aria-readonly="readonly || undefined" :aria-required="required || undefined" :data-uniform-segment-width="uniformSegmentWidth" :data-full-width="fullWidth">
  <label v-for="(item, index) in items" :key="item.value" class="charcoal-segmented-control-radio__label" :aria-disabled="disabled || item.disabled || readonly || false" :data-checked="item.value === value" :data-uniform-segment-width="uniformSegmentWidth">
    <input class="charcoal-segmented-control-radio__input" type="radio" :name="name ?? uid" :value="item.value" :checked="item.value === value" :disabled="disabled || item.disabled" :required="required" :tabindex="value === undefined ? (index === items.findIndex(i => !i.disabled) ? 0 : -1) : item.value === value ? 0 : -1" @click="readonly && $event.preventDefault()" @change="change(item.value)" @keydown="keyboard($event, index)" />
    <slot name="item" :item="item">{{ item.label }}</slot>
  </label>
</div></template>
