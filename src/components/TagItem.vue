<script setup lang="ts">
import { computed, useAttrs, type Component } from 'vue'
import Icon from './Icon.vue'
import { useElement } from '../internal/dom'
defineOptions({ inheritAttrs: false })
export interface TagItemProps { label: string; translatedLabel?: string; bgColor?: string; bgImage?: string; status?: 'default' | 'active' | 'inactive'; size?: 'S' | 'M'; disabled?: boolean; component?: string | Component }
const props = withDefaults(defineProps<TagItemProps>(), { bgColor: '#7ACCB1', size: 'M', status: 'default', component: 'a' })
const attrs = useAttrs()
const hasTranslated = computed(() => !!props.translatedLabel)
const bgVariant = computed(() => props.bgImage ? 'image' : 'color')
const { element, focus, blur } = useElement<HTMLElement>()
function click(event: MouseEvent) { if (props.disabled) { event.preventDefault(); event.stopImmediatePropagation() } }
defineExpose({ element, focus, blur })
</script>
<template><component :is="component" v-bind="attrs" ref="element" class="charcoal-tag-item charcoal-tag-item__bg" :href="disabled && component !== 'button' ? undefined : attrs.href" :disabled="component === 'button' ? disabled : undefined" :aria-disabled="component === 'button' ? attrs['aria-disabled'] : disabled || undefined" :role="component !== 'a' && component !== 'button' ? 'link' : undefined" :tabindex="disabled && component !== 'button' ? undefined : attrs.tabindex" :data-state="status" :data-bg-variant="bgVariant" :data-size="hasTranslated ? 'M' : size" :style="{ '--charcoal-tag-item-bg': bgVariant === 'color' ? bgColor : `url(${bgImage})` }" @click.capture="click">
  <div class="charcoal-tag-item__label" :data-has-translate="hasTranslated"><span v-if="hasTranslated" class="charcoal-tag-item__label__translated">{{ translatedLabel }}</span><span class="charcoal-tag-item__label__text" :data-has-translate="hasTranslated">{{ label }}</span></div><Icon v-if="status === 'active'" name="16/Remove" />
</component></template>
