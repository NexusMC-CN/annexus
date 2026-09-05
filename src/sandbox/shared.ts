import { computed, defineComponent, h, inject, onBeforeUnmount, onMounted, provide, shallowRef, watchEffect, type Component, type InjectionKey, type Ref, type PropType, type VNodeChild } from 'vue'
import { COLUMN_UNIT, GUTTER_UNIT, columnSystem } from '@charcoal-ui/foundation'
import { useMedia, useThemeObject } from '../core/theme'
export { useMedia }
export const MAIN_COLUMN_HORIZONTAL_MIN_MARGIN = 72
export const RESPONSIVE_LEFT_WIDTH = columnSystem(2, COLUMN_UNIT, GUTTER_UNIT) + GUTTER_UNIT
export const RESPONSIVE_MAIN_MAX_WIDTH = columnSystem(12, COLUMN_UNIT, GUTTER_UNIT)
export interface LinkProps { to: string }
export const DefaultLink = defineComponent({ name: 'DefaultLink', props: { to: { type: String, required: true } }, setup(props, { attrs, slots }) { return () => h('a', { ...attrs, href: props.to }, slots.default?.()) } })
const AbstractionKey: InjectionKey<Ref<{ Link: Component }>> = Symbol('annexus-components')
export const ComponentAbstraction = defineComponent({ name: 'ComponentAbstraction', props: { components: { type: Object as PropType<{ Link?: Component }>, required: true } }, setup(props, { slots }) { provide(AbstractionKey, computed(() => ({ Link: props.components.Link ?? DefaultLink }))); return () => slots.default?.() } })
export const useComponentAbstraction = () => inject(AbstractionKey, computed(() => ({ Link: DefaultLink })))
export function useMediaScreen1() { return useMedia(`(max-width: ${useThemeObject().value.breakpoint.screen1 - 1}px)`) }
export function useElementSize(element: Ref<Element | null | undefined>, deps: unknown[] = []) {
  const size = shallowRef<{ width: number; height: number }>()
  let observer: ResizeObserver | undefined
  let stop: (() => void) | undefined
  const measure = () => { if (element.value) { const rect = element.value.getBoundingClientRect(); size.value = { width: rect.width, height: rect.height } } }
  onMounted(() => {
    stop = watchEffect(() => { observer?.disconnect(); if (element.value && typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(measure); observer.observe(element.value); if (deps.length) measure() } }, { flush: 'post' })
  })
  onBeforeUnmount(() => { observer?.disconnect(); stop?.() })
  return size
}
export const renderContent = (node: VNodeChild | (() => VNodeChild)) => typeof node === 'function' ? node() : node
export function divComponent(name: string) { return defineComponent({ name, setup(_, { attrs, slots }) { return () => h('div', { ...attrs, class: [name, attrs.class] }, slots.default?.()) } }) }
export const wedge = (direction: 'left' | 'right', size = 16) => h('svg', { viewBox: '0 0 10 8', width: size, height: size }, [h('polyline', { 'stroke-width': 2, points: '1,2 5,6 9,2', transform: `rotate(${direction === 'left' ? 90 : -90} 5 4)`, fill: 'none', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', stroke: 'currentColor' })])
