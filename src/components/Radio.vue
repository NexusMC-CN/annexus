<script setup lang="ts">
import { computed, inject, nextTick } from 'vue'
import { RadioGroupKey } from './group-context'
import { useElement, useInputDefault } from '../internal/dom'
export interface RadioProps { value: string; disabled?: boolean }
const props = defineProps<RadioProps>()
const group = inject(RadioGroupKey)
if (!group) throw new Error('Radio requires RadioGroup')
const selected = computed(() => group.value.selected === props.value)
const disabled = computed(() => props.disabled || group.value.disabled || (group.value.readonly && !selected.value))
const { element, focus, blur } = useElement<HTMLInputElement>()
const initialChecked = selected.value
useInputDefault(element, () => initialChecked, true)
function change() { group!.value.change(props.value); void nextTick(() => { for (const input of element.value?.closest('.charcoal-radio-group')?.querySelectorAll<HTMLInputElement>('input[type=radio]') ?? []) input.checked = input.value === group!.value.selected }) }
defineExpose({ element, focus, blur })
</script>
<template><label class="charcoal-radio__label" :aria-disabled="disabled"><input ref="element" class="charcoal-radio-input" type="radio" :name="group.name" :value="value" :checked="selected" :disabled="disabled" :aria-invalid="group.invalid" @change="change" /><div v-if="$slots.default" class="charcoal-radio__label_div"><slot /></div></label></template>
