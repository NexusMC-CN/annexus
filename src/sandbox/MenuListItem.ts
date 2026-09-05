import { computed, defineComponent, h, inject, provide, type InjectionKey, type ComputedRef, type PropType, type VNodeChild } from 'vue'
import TextEllipsis from './TextEllipsis'
import { divComponent, useComponentAbstraction } from './shared'
export interface MenuListItemBaseData { primary: VNodeChild; secondary?: string; disabled?: boolean; gtmClass?: string; noHover?: boolean }
const PaddingKey: InjectionKey<ComputedRef<{ padding: 16 | 24 }>> = Symbol('annexus-menu-padding')
export const MenuListItemContext = defineComponent({ name: 'MenuListItemContext', props: { value: Object as PropType<{ padding: 16 | 24 }>, padding: { type: Number as PropType<16 | 24>, default: 24 } }, setup(props, { slots }) { provide(PaddingKey, computed(() => props.value ?? { padding: props.padding })); return () => slots.default?.() } })
const props = { primary: [String, Number, Object, Array] as PropType<VNodeChild>, secondary: String, disabled: Boolean, gtmClass: String, noHover: Boolean, link: String, icon: [String, Object, Array] as PropType<VNodeChild> }
export const MenuListItem = defineComponent({
  name: 'MenuListItem', inheritAttrs: false, props,
  setup(props, { slots, attrs }) {
    const padding = inject(PaddingKey, computed(() => ({ padding: 24 })))
    return () => h('div', { ...attrs, class: ['annexus-menu-list-item', props.gtmClass !== undefined ? `gtm-${props.gtmClass}` : undefined, attrs.class], style: [attrs.style, { '--annexus-menu-padding': `${padding.value.padding}px` }], 'data-secondary': props.secondary !== undefined, 'data-no-hover': props.noHover, 'data-no-click': attrs.onClick === undefined, 'aria-disabled': props.disabled, role: attrs.onClick !== undefined ? 'button' : undefined, onClickCapture: (event: Event) => { if (props.disabled) event.stopImmediatePropagation() } }, [
      h('div', { class: 'annexus-menu-labels' }, [h('div', { class: 'annexus-menu-primary' }, [h(TextEllipsis, { lineHeight: 22, lineLimit: 1 }, { default: () => slots.primary?.() ?? [props.primary] })]), props.secondary !== undefined ? h('div', { class: 'annexus-menu-secondary' }, [h(TextEllipsis, { lineHeight: 22, lineLimit: 1 }, () => props.secondary)]) : null]), slots.default?.()
    ])
  }
})
export const MenuListLinkItem = defineComponent({
  name: 'MenuListLinkItem', inheritAttrs: false, props,
  setup(props, { slots, attrs }) { const abstraction = useComponentAbstraction(); return () => props.disabled ? h('span', { onClick: attrs.onClick }, [h(MenuListItem, props, slots)]) : h(abstraction.value.Link, { ...attrs, to: props.link ?? '', style: [attrs.style, { display: 'block' }] }, () => h(MenuListItem, { ...props, onClick: () => undefined }, slots)) }
})
function withIcon(name: string, link: boolean) { return defineComponent({ name, props, setup(props, { slots, attrs }) { return () => h(link ? MenuListLinkItem : MenuListItem, { ...props, ...attrs }, { ...slots, primary: () => h('div', { class: 'annexus-menu-icon-container' }, [h('div', { class: 'annexus-menu-icon' }, slots.icon?.() ?? [props.icon]), props.primary]) }) } }) }
export const MenuListItemWithIcon = withIcon('MenuListItemWithIcon', false)
export const MenuListLinkItemWithIcon = withIcon('MenuListLinkItemWithIcon', true)
export const MenuListSpacer = divComponent('annexus-menu-spacer')
export const MenuListLabel = divComponent('annexus-menu-label')
export const LeftMenu = defineComponent({
  name: 'LeftMenu', props: { links: { type: Array as PropType<readonly { text: string; to: string; id: string }[]>, required: true }, active: String },
  setup(props) { const abstraction = useComponentAbstraction(); return () => h('div', { class: 'annexus-left-menu' }, props.links.map(link => h(abstraction.value.Link, { key: link.id, to: link.to }, () => h('div', { class: 'annexus-left-menu-item', 'aria-current': link.id === props.active || undefined }, link.text)))) }
})
export const LeftMenuContent = defineComponent({ name: 'LeftMenuContent', props: { links: { type: Array as PropType<readonly { text: string; to: string; id: string }[]>, required: true }, active: String }, setup(props) { return () => props.links.map(link => h(MenuListLinkItem, { key: link.id, link: link.to, primary: link.text })) } })
