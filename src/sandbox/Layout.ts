import { computed, defineComponent, h, inject, provide, type ComputedRef, type InjectionKey } from 'vue'
import { divComponent, useMediaScreen1 } from './shared'
type Config = { wide: boolean; center: boolean; withLeft: boolean }
const LayoutKey: InjectionKey<ComputedRef<Config>> = Symbol('annexus-layout')
const useConfig = () => inject(LayoutKey, computed(() => ({ wide: false, center: false, withLeft: false })))
export const LAYOUT_ITEM_BODY_PADDING = { wide: { x: 40, y: 40 }, default: { x: 24, y: 24 }, column1: { x: 16, y: 16 }, narrow: { x: 24, yTop: 12, yBottom: 20 }, narrowColumn1: { x: 16, yTop: 4, yBottom: 0 } }
export default defineComponent({
  name: 'Layout', props: { isHeaderTopMenu: Boolean, wide: Boolean, center: Boolean },
  setup(props, { slots }) {
    const config = computed(() => ({ center: props.center, wide: props.center || props.wide, withLeft: !!slots.menu && !props.isHeaderTopMenu }))
    provide(LayoutKey, config)
    return () => h('div', { class: 'annexus-layout' }, [config.value.withLeft ? h('div', { class: 'annexus-layout-left' }, slots.menu?.()) : null,
      h('div', { class: 'annexus-layout-main', 'data-center': props.center }, [slots.header ? h('div', { class: 'annexus-layout-header' }, slots.header()) : null, props.isHeaderTopMenu ? h('div', { class: 'annexus-layout-top-menu' }, slots.menu?.()) : null, h('div', { class: 'annexus-layout-grid' }, slots.default?.())]),
      h('style', ':root{background-color:var(--charcoal-background2)}@media(max-width:743px){:root{background-color:var(--charcoal-background1)}}')
    ])
  }
})
export const LayoutItem = defineComponent({ name: 'LayoutItem', props: { span: { type: Number, required: true } }, setup(props, { slots }) { return () => h('div', { class: 'annexus-layout-item', style: { '--annexus-layout-span': props.span } }, slots.default?.()) } })
export const LayoutItemHeader = defineComponent({ name: 'LayoutItemHeader', setup(_, { slots }) { const config = useConfig(); return () => h('div', { class: 'annexus-layout-item-header', 'data-wide': config.value.wide, 'data-center': config.value.center }, slots.default?.()) } })
export const StyledLayoutItemBody = defineComponent({ name: 'StyledLayoutItemBody', props: { wide: Boolean, horizontal: Boolean, narrow: Boolean }, setup(props, { slots }) { return () => h('div', { class: 'annexus-layout-item-body', 'data-wide': props.wide, 'data-horizontal': props.horizontal, 'data-narrow': props.narrow }, slots.default?.()) } })
export const LayoutItemBody = defineComponent({ name: 'LayoutItemBody', props: { horizontal: Boolean, narrow: Boolean }, setup(props, { slots }) { const config = useConfig(); return () => h(StyledLayoutItemBody, { ...props, wide: config.value.wide }, slots) } })
export const StyledCancelLayoutItemBodyPadding = defineComponent({ name: 'StyledCancelLayoutItemBodyPadding', props: { wide: Boolean, cancelTop: Boolean }, setup(props, { slots }) { return () => h('div', { class: 'annexus-layout-cancel-padding', 'data-wide': props.wide, 'data-cancel-top': props.cancelTop }, slots.default?.()) } })
export const CancelLayoutItemBodyPadding = defineComponent({ name: 'CancelLayoutItemBodyPadding', props: { cancelTop: Boolean }, setup(props, { slots }) { const config = useConfig(); return () => h(StyledCancelLayoutItemBodyPadding, { ...props, wide: config.value.wide }, slots) } })
export function useLayoutItemBodyPadding() { const config = useConfig(); const mobile = useMediaScreen1(); return computed(() => mobile.value ? LAYOUT_ITEM_BODY_PADDING.column1 : config.value.wide ? LAYOUT_ITEM_BODY_PADDING.wide : LAYOUT_ITEM_BODY_PADDING.default) }
export const LayoutRoot = divComponent('annexus-layout')
