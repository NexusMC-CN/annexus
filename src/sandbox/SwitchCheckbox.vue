<script setup lang="ts">
import { computed, ref, useAttrs } from 'vue'
import { useElement } from '../internal/dom'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ gtmClass?: string; flex?: boolean; rowReverse?: boolean; checked?: boolean; modelValue?: boolean; defaultChecked?: boolean; disabled?: boolean }>(), { checked: undefined, modelValue: undefined })
const emit = defineEmits<{ change: [event: Event]; 'update:modelValue': [checked: boolean] }>()
const attrs = useAttrs(); const local = ref(props.defaultChecked ?? false)
const checked = computed(() => props.modelValue ?? props.checked ?? local.value)
const { element, focus, blur } = useElement<HTMLInputElement>()
function change(event: Event) { local.value = (event.target as HTMLInputElement).checked; emit('change', event); emit('update:modelValue', local.value) }
defineExpose({ element, focus, blur })
</script>
<template><label :class="['annexus-switch-label', gtmClass !== undefined && `gtm-${gtmClass}`]" :data-flex="flex" :data-reverse="rowReverse" :aria-disabled="disabled"><span class="annexus-switch-outer"><input v-bind="attrs" ref="element" class="annexus-switch-input" type="checkbox" :checked="checked" :disabled="disabled" @change="change" /><div class="annexus-switch-inner"><div class="annexus-switch-knob" /></div></span><span v-if="$slots.default" class="annexus-switch-children"><slot /></span></label></template>
