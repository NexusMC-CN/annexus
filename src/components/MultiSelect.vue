<script setup lang="ts">
import { computed, inject, nextTick } from 'vue'
import { MultiSelectGroupKey } from './group-context'
import { useElement, useInputDefault } from '../internal/dom'
import Icon from './Icon.vue'
export interface MultiSelectProps { value: string; disabled?: boolean; variant?: 'default' | 'overlay' }
const props = withDefaults(defineProps<MultiSelectProps>(), { variant: 'default' })
const emit = defineEmits<{ change: [payload: { value: string; selected: boolean }] }>()
const group = inject(MultiSelectGroupKey)
if (!group) throw new Error('MultiSelect requires MultiSelectGroup')
const selected = computed(() => group.value.selected?.includes(props.value) ?? false)
const disabled = computed(() => props.disabled || group.value.disabled || group.value.readonly)
const { element, focus, blur } = useElement<HTMLInputElement>()
const initialChecked = selected.value
useInputDefault(element, () => initialChecked, true)
function change(event: Event) { const next = (event.target as HTMLInputElement).checked; emit('change', { value: props.value, selected: next }); group!.value.change(props.value, next); void nextTick(() => { if (element.value) element.value.checked = selected.value }) }
defineExpose({ element, focus, blur })
</script>
<template><label class="charcoal-multi-select" :aria-disabled="disabled"><input ref="element" class="charcoal-multi-select-input" :name="group.name" :value="value" type="checkbox" :checked="selected" :disabled="disabled" :data-overlay="variant === 'overlay'" :aria-invalid="group.invalid" @change="change" /><div class="charcoal-multi-select-overlay" :data-overlay="variant === 'overlay'" :aria-invalid="group.invalid" aria-hidden="true"><Icon name="24/Check" :fixed-size="16" /></div><div v-if="$slots.default" class="charcoal-multi-select-label"><slot /></div></label></template>
