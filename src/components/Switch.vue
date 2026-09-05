<script setup lang="ts">
import { nextTick, computed, ref, useAttrs, useId, type CSSProperties } from 'vue'
import { useElement, useInputDefault } from '../internal/dom'
defineOptions({ inheritAttrs: false })
export interface SwitchProps { id?: string; checked?: boolean; modelValue?: boolean; defaultChecked?: boolean; disabled?: boolean }
const props = withDefaults(defineProps<SwitchProps>(), { checked: undefined, modelValue: undefined })
const emit = defineEmits<{ change: [checked: boolean]; 'update:modelValue': [checked: boolean]; 'update:checked': [checked: boolean] }>()
const attrs = useAttrs()
const generatedId = useId()
const id = computed(() => props.id ?? generatedId)
const local = ref(props.defaultChecked ?? false)
const checked = computed(() => props.modelValue ?? props.checked ?? local.value)
const { element, focus, blur } = useElement<HTMLInputElement>()
const initialChecked = checked.value
useInputDefault(element, () => (props.modelValue ?? props.checked) === undefined ? props.defaultChecked ?? false : initialChecked, true, next => { if (props.modelValue === undefined && props.checked === undefined) local.value = Boolean(next) })
function change(event: Event) {
  const next = (event.target as HTMLInputElement).checked
  local.value = next
  emit('change', next); emit('update:modelValue', next); emit('update:checked', next)
  void nextTick(() => { if (element.value) element.value.checked = checked.value })
}
defineExpose({ element, focus, blur })
</script>
<template>
  <label v-if="$slots.default" :for="id" :aria-disabled="disabled" :class="['charcoal-switch__label', attrs.class]" :style="attrs.style as CSSProperties">
    <input v-bind="{ ...attrs, class: undefined, style: undefined }" :id="id" ref="element" class="charcoal-switch-input" type="checkbox" role="switch" :checked="checked" :disabled="disabled" @change="change" />
    <div class="charcoal-switch__label_div"><slot /></div>
  </label>
  <input v-else v-bind="attrs" :id="id" ref="element" class="charcoal-switch-input" type="checkbox" role="switch" :checked="checked" :disabled="disabled" @change="change" />
</template>
