import { computed, defineComponent, h, inject, mergeProps, nextTick, onBeforeUnmount, provide, ref, shallowRef, Teleport, useId, type Component, type InjectionKey, type PropType, type VNode, type VNodeChild } from 'vue'
import FieldLabel from './FieldLabel.vue'
import Icon from './Icon.vue'
import { flatten, visuallyHidden } from '../internal/dom'
import { activateOverlay } from '../internal/overlay'

type MenuContext = { value(): string; root: ReturnType<typeof shallowRef<HTMLUListElement | undefined>>; select(value: string): void }
const MenuKey: InjectionKey<MenuContext> = Symbol('annexus-menu')
export interface MenuItemProps { value?: string; disabled?: boolean; as?: string | Component }
export interface DropdownMenuItemProps extends MenuItemProps { secondary?: string; contentFullWidth?: boolean }
export interface MenuItemGroupProps { text: string }

export const MenuItem = defineComponent({
  name: 'MenuItem', inheritAttrs: false, props: { value: String, disabled: Boolean, as: [String, Object, Function] as PropType<string | Component> },
  setup(props, { slots, attrs, expose }) {
    const ctx = inject(MenuKey); const element = shallowRef<HTMLElement>(); let pen = false; let start: { x: number; y: number } | undefined
    const select = () => { if (!props.disabled && props.value !== undefined) ctx?.select(props.value) }
    function keydown(event: KeyboardEvent) {
      if (event.key === 'Enter') { event.preventDefault(); select(); return }
      if (!['ArrowUp', 'ArrowDown'].includes(event.key)) return
      event.preventDefault()
      const nodes = Array.from(ctx?.root.value?.querySelectorAll<HTMLElement>('[role="option"]') ?? []).filter(node => node.getAttribute('aria-disabled') !== 'true')
      if (!nodes.length) return
      const index = nodes.indexOf(element.value!)
      const next = nodes[(index + (event.key === 'ArrowDown' ? 1 : -1) + nodes.length) % nodes.length]
      next.focus({ preventScroll: true }); next.scrollIntoView?.({ block: 'nearest' })
    }
    expose({ element, focus: () => element.value?.focus() })
    return () => h(props.as ?? 'li', mergeProps(attrs, {
      ref: element, class: 'charcoal-list-item', role: 'option', tabindex: -1, 'data-key': props.value, 'aria-disabled': props.disabled,
      onKeydown: keydown,
      onPointerdown: (event: PointerEvent) => { if (event.pointerType === 'pen') start = { x: event.clientX, y: event.clientY } },
      onPointerup: (event: PointerEvent) => { if (event.pointerType === 'pen' && start && Math.abs(event.clientX - start.x) <= 8 && Math.abs(event.clientY - start.y) <= 8) { pen = true; select() } },
      onClick: () => { if (pen) { pen = false; return } select() }
    }), slots.default?.())
  }
})
export const DropdownMenuItem = defineComponent({
  name: 'DropdownMenuItem', props: { value: String, disabled: Boolean, secondary: String, contentFullWidth: Boolean },
  setup(props, { slots, attrs }) {
    const ctx = inject(MenuKey)
    return () => {
      const selected = props.value === ctx?.value(); const full = props.contentFullWidth ? 'charcoal-dropdown-selector-menu-fullwidth' : ''
      return h(MenuItem, { ...attrs, value: props.value, disabled: props.disabled, 'aria-selected': selected }, () => [h('div', { class: full }, [
        h('div', { class: ['charcoal-dropdown-selector-menu-item-container', full] }, [selected ? h(Icon, { class: 'charcoal-dropdown-selector-menu-item-icon', name: '16/Check' }) : null, h('span', { class: ['charcoal-dropdown-selector-menu-item', full], 'data-selected': selected }, slots.default?.())]),
        props.secondary || slots.secondary ? h('span', { class: 'charcoal-dropdown-selector-menu-secondary' }, slots.secondary?.() ?? props.secondary) : null
      ])])
    }
  }
})
export const MenuItemGroup = defineComponent({ name: 'MenuItemGroup', props: { text: { type: String, required: true } }, setup(props, { slots }) { return () => h('li', { class: 'charcoal-menu-item-group', role: 'presentation' }, [h('span', props.text), h('ul', { role: 'group' }, slots.default?.())]) } })
export const Divider = defineComponent({ name: 'Divider', setup() { return () => h('div', { class: 'charcoal-menu-group-divider', role: 'separator' }) } })
export const MenuList = defineComponent({
  name: 'MenuList', props: { value: String }, emits: ['change'],
  setup(props, { slots, emit, expose }) { const root = shallowRef<HTMLUListElement>(); provide(MenuKey, { value: () => props.value ?? '', root, select: value => emit('change', value) }); expose({ element: root }); return () => h('ul', { ref: root, class: 'charcoal-menu-list' }, slots.default?.()) }
})

function children(node: VNode): VNode[] {
  if (node.children && !Array.isArray(node.children) && typeof node.children === 'object' && 'default' in node.children) return (node.children.default as () => VNode[])()
  return flatten(node.children as VNodeChild[])
}
function collect(nodes: VNode[]): { value: string; disabled: boolean; preview: VNodeChild[] }[] {
  return flatten(nodes).flatMap(node => node.type === MenuItemGroup ? collect(children(node)) : (node.type === MenuItem || node.type === DropdownMenuItem) && node.props?.value !== undefined ? [{ value: String(node.props.value), disabled: !!node.props.disabled, preview: children(node) }] : [])
}
export interface DropdownSelectorProps { label: string; value?: string; modelValue?: string; defaultValue?: string; disabled?: boolean; placeholder?: string; showLabel?: boolean; invalid?: boolean; assistiveText?: string; required?: boolean; requiredText?: string; subLabel?: string; name?: string; inertWorkaround?: boolean }
export default defineComponent({
  name: 'DropdownSelector', inheritAttrs: false,
  props: { label: { type: String, required: true }, value: String, modelValue: String, defaultValue: String, disabled: Boolean, placeholder: String, showLabel: Boolean, invalid: Boolean, assistiveText: String, required: Boolean, requiredText: String, subLabel: String, name: String, inertWorkaround: Boolean },
  emits: ['change', 'update:modelValue', 'update:value'],
  setup(props, { slots, attrs, emit, expose }) {
    const open = ref(false); const local = ref(props.defaultValue ?? '')
    const value = computed(() => props.modelValue ?? props.value ?? local.value)
    const trigger = shallowRef<HTMLButtonElement>(); const selectElement = shallowRef<HTMLSelectElement>(); const popover = shallowRef<HTMLDivElement>()
    const style = ref<Record<string, string | number>>({ position: 'absolute', zIndex: 100000 })
    const labelId = useId(); const describedbyId = useId(); const menuId = useId()
    let cleanup: (() => void) | undefined; let pen = false
    function position() {
      const button = trigger.value; const popup = popover.value
      if (!button || !popup) return
      const rect = button.getBoundingClientRect(); const below = window.innerHeight - rect.bottom - 20; const above = rect.top - 20
      const flip = below < Math.min(popup.scrollHeight, 160) && above > below
      const width = button.clientWidth
      const height = Math.min(popup.scrollHeight, flip ? above : below)
      style.value = { position: 'absolute', zIndex: 100000, width: `${width}px`, maxHeight: `${Math.max(0, flip ? above : below)}px`, left: `${window.scrollX + Math.max(16, Math.min(rect.left + (rect.width - width) / 2, window.innerWidth - width - 16))}px`, top: `${window.scrollY + (flip ? rect.top - height - 8 : rect.bottom)}px` }
    }
    function outside(event: PointerEvent) { if (open.value && !popover.value?.contains(event.target as Node) && !trigger.value?.contains(event.target as Node)) close() }
    function ancestorScroll(event: Event) {
      if (!trigger.value || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
      if (!(event.target instanceof Node) || event.target.contains(trigger.value)) close()
    }
    function close() {
      open.value = false; cleanup?.(); cleanup = undefined
      window.removeEventListener('resize', position); document.removeEventListener('pointerup', outside, true); document.removeEventListener('scroll', ancestorScroll, true)
    }
    async function show() {
      if (props.disabled || open.value) return
      open.value = true; await nextTick()
      if (!open.value || !popover.value) return
      position(); cleanup = activateOverlay(popover.value, { restore: trigger.value, escape: close, contain: false })
      const nodes = Array.from(popover.value.querySelectorAll<HTMLElement>('[role="option"]'))
      const selected = nodes.find(node => node.dataset.key === value.value) ?? nodes.find(node => node.getAttribute('aria-disabled') !== 'true')
      selected?.focus({ preventScroll: true })
      window.addEventListener('resize', position); document.addEventListener('pointerup', outside, true); document.addEventListener('scroll', ancestorScroll, true)
    }
    function change(next: string) { local.value = next; emit('change', next); emit('update:modelValue', next); emit('update:value', next); close() }
    onBeforeUnmount(() => { if (typeof window !== 'undefined') close() })
    expose({ element: trigger, selectElement, open: show, close, focus: () => trigger.value?.focus() })
    return () => {
      const nodes = slots.default?.() ?? []; const options = collect(nodes); const selected = options.find(option => option.value === value.value)
      const placeholder = props.placeholder !== undefined && selected === undefined
      return h('div', { ...attrs, class: ['charcoal-dropdown-selector-root', attrs.class], 'aria-disabled': props.disabled }, [
        h(FieldLabel, { id: labelId, label: props.label, required: props.required, requiredText: props.requiredText, subLabel: props.subLabel, style: props.showLabel ? undefined : visuallyHidden }, { subLabel: slots.subLabel }),
        h('div', { style: visuallyHidden, 'aria-hidden': 'true' }, [h('select', { name: props.name, value: value.value, tabindex: -1, ref: selectElement, onChange: (event: Event) => change((event.target as HTMLSelectElement).value) }, [!selected ? h('option', { value: value.value }, value.value) : null, ...options.map(option => h('option', { value: option.value, disabled: option.disabled }, option.value))])]),
        h('button', { ref: trigger, class: 'charcoal-dropdown-selector-button', type: 'button', 'aria-labelledby': labelId, 'aria-invalid': props.invalid, 'aria-describedby': props.assistiveText !== undefined ? describedbyId : undefined, disabled: props.disabled, 'data-active': open.value,
          onPointerup: (event: PointerEvent) => { if (event.pointerType === 'pen') { pen = true; void show() } },
          onClick: () => { if (pen) { pen = false; return } void show() }
        }, [h('span', { class: 'charcoal-ui-dropdown-selector-text', 'data-placeholder': placeholder }, placeholder ? props.placeholder : selected?.preview), h(Icon, { class: 'charcoal-ui-dropdown-selector-icon', name: '16/Menu' })]),
        open.value ? h(Teleport, { to: 'body' }, [
          h('div', { style: { position: 'fixed', zIndex: 99999, inset: 0 }, onClick: close }),
          h('div', { ref: popover, id: menuId, class: 'charcoal-popover', style: style.value, tabindex: -1 }, [
            h('button', { type: 'button', style: visuallyHidden, 'aria-label': 'Dismiss', onClick: close }), h('div', { tabindex: 0, onFocus: close }),
            h(MenuList, { value: value.value, onChange: change }, () => nodes),
            h('div', { tabindex: 0, onFocus: close }), h('button', { type: 'button', style: visuallyHidden, 'aria-label': 'Dismiss', onClick: close })
          ])
        ]) : null,
        props.assistiveText !== undefined ? h('div', { id: describedbyId, class: 'charcoal-text-field-assistive-text', 'data-invalid': props.invalid === true }, props.assistiveText) : null
      ])
    }
  }
})
