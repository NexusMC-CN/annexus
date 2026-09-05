<script setup lang="ts">
import { nextTick, computed, ref, useAttrs, useId, watch, onMounted, type CSSProperties } from 'vue'
import FieldLabel from './FieldLabel.vue'
import { countCodePointsInString, useElement, useInputDefault, visuallyHidden } from '../internal/dom'
defineOptions({ inheritAttrs: false })
export interface TextAreaImperativeHandle { setValue(value: string): void; sync(): void }
export interface TextAreaProps {
  value?: string; modelValue?: string; defaultValue?: string; showCount?: boolean; showLabel?: boolean
  assistiveText?: string; invalid?: boolean; label?: string; required?: boolean; requiredText?: string
  disabled?: boolean; subLabel?: string; autoHeight?: boolean; maxRows?: number; rows?: number
  maxLength?: number; id?: string; getCount?: (value: string) => number
}
const props = withDefaults(defineProps<TextAreaProps>(), { label: '', rows: 4, getCount: countCodePointsInString, disabled: false })
const emit = defineEmits<{ change: [value: string]; 'update:modelValue': [value: string]; 'update:value': [value: string] }>()
const attrs = useAttrs(); const local = ref(props.defaultValue ?? '')
const value = computed(() => props.modelValue ?? props.value ?? local.value)
const heightValue = ref(value.value)
const count = ref(props.getCount(value.value))
watch(() => [props.modelValue, props.value, props.getCount], () => { if (props.modelValue !== undefined || props.value !== undefined) count.value = props.getCount(value.value) })
const rows = computed(() => {
  if (!props.autoHeight && !(props.maxRows !== undefined && props.maxRows >= 0)) return props.rows
  const next = Math.max(props.rows, heightValue.value.split('\n').length)
  return props.maxRows !== undefined && props.maxRows >= 1 ? Math.min(next, props.maxRows) : next
})
watch(() => props.modelValue ?? props.value, next => { if (next !== undefined) heightValue.value = next })
const uid = useId(); const inputId = computed(() => props.id ?? uid)
const describedbyId = useId(); const labelledbyId = useId()
const { element, focus, blur } = useElement<HTMLTextAreaElement>()
useInputDefault(element, () => props.modelValue ?? props.value ?? props.defaultValue ?? '', false, next => { if (props.modelValue === undefined && props.value === undefined) local.value = String(next) })
function sync() {
  if (!element.value) return
  const next = element.value.value
  if (props.modelValue === undefined && props.value === undefined) { local.value = next; count.value = props.getCount(next) }
  heightValue.value = next
}
function setValue(next: string) { if (element.value) { element.value.value = next; sync() } }
function input(event: Event) {
  const textarea = event.target as HTMLTextAreaElement
  const next = textarea.value
  if (props.maxLength !== undefined && props.getCount(next) > props.maxLength) { textarea.value = value.value; return }
  sync(); emit('change', next); emit('update:modelValue', next); emit('update:value', next)
  void nextTick(() => { if (element.value) element.value.value = value.value })
}
function containerClick(event: MouseEvent) {
  if (event.target instanceof Element && event.target.closest('button,a,input,select,textarea,[tabindex]')) return
  if (!window.getSelection()?.toString()) focus()
}
onMounted(sync)
defineExpose({ element, focus, blur, setValue, sync, select: () => element.value?.select() })
</script>
<template>
  <div :class="['charcoal-text-area-root', attrs.class]" :style="attrs.style as CSSProperties" :aria-disabled="disabled">
    <FieldLabel :id="labelledbyId" :html-for="inputId" :label="label" :required="required" :required-text="requiredText" :sub-label="subLabel" :style="showLabel ? undefined : visuallyHidden"><template #subLabel><slot name="subLabel">{{ subLabel }}</slot></template></FieldLabel>
    <div class="charcoal-text-area-container" :aria-disabled="disabled || undefined" :aria-invalid="invalid === true" :style="{ '--charcoal-text-area-rows': rows }" @click="containerClick">
      <textarea v-bind="{ ...attrs, class: undefined, style: undefined }" :id="inputId" ref="element" class="charcoal-text-area-textarea" :aria-describedby="assistiveText ? describedbyId : undefined" :aria-invalid="invalid" :aria-labelledby="labelledbyId" :maxlength="maxLength" :data-no-bottom-padding="showCount" :rows="rows" :value="value" :disabled="disabled" @input="input" />
      <span v-if="showCount" class="charcoal-text-area-counter">{{ maxLength !== undefined ? `${count}/${maxLength}` : count }}</span>
    </div>
    <div v-if="assistiveText" :id="describedbyId" class="charcoal-text-field-assistive-text" :data-invalid="invalid === true">{{ assistiveText }}</div>
  </div>
</template>
