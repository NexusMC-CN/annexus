<script setup lang="ts">
import { nextTick, computed, ref, useAttrs, useId, watch, type CSSProperties } from 'vue'
import FieldLabel from './FieldLabel.vue'
import { countCodePointsInString, useElement, useInputDefault, visuallyHidden } from '../internal/dom'
defineOptions({ inheritAttrs: false })
export interface TextFieldProps {
  value?: string; modelValue?: string; defaultValue?: string; prefix?: string; suffix?: string
  showCount?: boolean; showLabel?: boolean; assistiveText?: string; invalid?: boolean
  label?: string; required?: boolean; requiredText?: string; disabled?: boolean; subLabel?: string
  maxLength?: number; type?: string; id?: string; getCount?: (value: string) => number
}
const props = withDefaults(defineProps<TextFieldProps>(), { label: '', type: 'text', getCount: countCodePointsInString, disabled: false })
const emit = defineEmits<{ change: [value: string]; 'update:modelValue': [value: string]; 'update:value': [value: string] }>()
const attrs = useAttrs()
const local = ref(props.defaultValue ?? '')
const value = computed(() => props.modelValue ?? props.value ?? local.value)
const count = ref(props.getCount(props.modelValue ?? props.value ?? ''))
watch(() => [props.modelValue, props.value, props.getCount], () => { count.value = props.getCount(props.modelValue ?? props.value ?? '') })
const uid = useId(); const inputId = computed(() => props.id ?? uid)
const describedbyId = useId(); const labelledbyId = useId()
const { element, focus, blur } = useElement<HTMLInputElement>()
useInputDefault(element, () => props.modelValue ?? props.value ?? props.defaultValue ?? '', false, next => { if (props.modelValue === undefined && props.value === undefined) local.value = String(next) })
function input(event: Event) {
  const input = event.target as HTMLInputElement
  const next = input.value
  if (props.maxLength !== undefined && props.getCount(next) > props.maxLength) { input.value = value.value; return }
  local.value = next
  count.value = props.getCount(next)
  emit('change', next); emit('update:modelValue', next); emit('update:value', next)
  void nextTick(() => { if (element.value) element.value.value = value.value })
}
function containerClick(event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest('button,a,input,select,textarea,[tabindex]')) return
  if (!window.getSelection()?.toString()) focus()
}
defineExpose({ element, focus, blur, select: () => element.value?.select() })
</script>
<template>
  <div :class="['charcoal-text-field-root', attrs.class]" :style="attrs.style as CSSProperties" :aria-disabled="disabled">
    <FieldLabel :id="labelledbyId" :html-for="inputId" :label="label" :required="required" :required-text="requiredText" :sub-label="subLabel" :style="showLabel ? undefined : visuallyHidden"><template #subLabel><slot name="subLabel">{{ subLabel }}</slot></template></FieldLabel>
    <div class="charcoal-text-field-container" :aria-disabled="disabled || undefined" :data-invalid="invalid === true" @click="containerClick">
      <div v-if="prefix || $slots.prefix" class="charcoal-text-field-prefix"><slot name="prefix">{{ prefix }}</slot></div>
      <div class="charcoal-text-field-input-root"><input v-bind="{ ...attrs, class: undefined, style: undefined }" :id="inputId" ref="element" class="charcoal-text-field-input" :aria-describedby="assistiveText ? describedbyId : undefined" :aria-invalid="invalid" :aria-labelledby="labelledbyId" :data-invalid="invalid === true" :maxlength="maxLength" :disabled="disabled" :type="type" :value="value" @input="input" /></div>
      <div v-if="suffix || showCount || $slots.suffix" class="charcoal-text-field-suffix"><slot name="suffix">{{ suffix }}</slot><span v-if="showCount" class="charcoal-text-field-line-counter">{{ maxLength !== undefined ? `${count}/${maxLength}` : count }}</span></div>
    </div>
    <div v-if="assistiveText" :id="describedbyId" class="charcoal-text-field-assistive-text" :data-invalid="invalid === true">{{ assistiveText }}</div>
  </div>
</template>
