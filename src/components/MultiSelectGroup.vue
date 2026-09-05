<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import { MultiSelectGroupKey } from './group-context'
export interface MultiSelectGroupProps { name: string; label: string; selected?: string[]; modelValue?: string[]; disabled?: boolean; readonly?: boolean; invalid?: boolean }
const props = defineProps<MultiSelectGroupProps>()
const emit = defineEmits<{ change: [selected: string[]]; 'update:modelValue': [selected: string[]]; 'update:selected': [selected: string[]] }>()
const local = ref<string[]>([])
const selected = computed(() => [...new Set(props.modelValue ?? props.selected ?? local.value)])
function change(value: string, checked?: boolean) {
  if (props.disabled || props.readonly) return
  const next = checked ? [...new Set([...selected.value, value])] : selected.value.filter(v => v !== value)
  local.value = next; emit('change', next); emit('update:modelValue', next); emit('update:selected', next)
}
provide(MultiSelectGroupKey, computed(() => ({ name: props.name, selected: selected.value, disabled: props.disabled ?? false, readonly: props.readonly ?? false, invalid: props.invalid ?? false, change })))
</script>
<template><div :aria-label="label" data-testid="SelectGroup"><slot /></div></template>
