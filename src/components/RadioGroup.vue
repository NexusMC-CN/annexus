<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { RadioGroupKey } from './group-context'
import { useElement } from '../internal/dom'
export interface RadioGroupProps { value?: string; modelValue?: string; defaultValue?: string; label?: string; name: string; disabled?: boolean; readonly?: boolean; invalid?: boolean }
const props = defineProps<RadioGroupProps>()
const emit = defineEmits<{ change: [value: string]; 'update:modelValue': [value: string]; 'update:value': [value: string] }>()
const local = ref(props.defaultValue)
function change(value: string) {
  if (props.disabled || props.readonly) return
  local.value = value; emit('change', value); emit('update:modelValue', value); emit('update:value', value)
}
provide(RadioGroupKey, computed(() => ({ name: props.name, selected: props.modelValue ?? props.value ?? local.value, disabled: props.disabled ?? false, readonly: props.readonly ?? false, invalid: props.invalid ?? false, change })))
const { element } = useElement<HTMLDivElement>()
defineExpose({ element })
</script>
<template><div ref="element" class="charcoal-radio-group" role="radiogroup" :aria-disabled="disabled" :aria-invalid="invalid" :aria-label="label" aria-orientation="vertical"><slot /></div></template>
