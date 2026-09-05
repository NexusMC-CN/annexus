import { computed, defineComponent, h, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, shallowRef, Teleport, useId, watch, type InjectionKey, type ComputedRef, type PropType } from 'vue'
import IconButton from './IconButton.vue'
import Button from './Button.vue'
import { activateOverlay } from '../internal/overlay'
export type BottomSheet = boolean | 'full'
export interface ModalProps { title: string; isOpen?: boolean; modelValue?: boolean; size?: 'S' | 'M' | 'L'; bottomSheet?: BottomSheet; isDismissable?: boolean; zIndex?: number; closeButtonAriaLabel?: string; portalContainer?: HTMLElement; overflowClip?: boolean; isKeyboardDismissDisabled?: boolean }
const ModalKey: InjectionKey<ComputedRef<{ title: string; bottomSheet: BottomSheet; showDismiss: boolean; close(): void; titleId: string }>> = Symbol('annexus-modal')
export default defineComponent({
  name: 'Modal', inheritAttrs: false,
  props: {
    title: { type: String, required: true }, isOpen: { type: Boolean, default: undefined }, modelValue: { type: Boolean, default: undefined },
    size: { type: String as PropType<'S' | 'M' | 'L'>, default: 'M' }, bottomSheet: { type: [Boolean, String] as PropType<BottomSheet>, default: false },
    isDismissable: Boolean, zIndex: { type: Number, default: 10 }, closeButtonAriaLabel: { type: String, default: 'Close' }, portalContainer: Object as PropType<HTMLElement>, overflowClip: Boolean, isKeyboardDismissDisabled: Boolean
  },
  emits: ['close', 'update:modelValue', 'update:isOpen'],
  setup(props, { slots, attrs, emit, expose }) {
    const ready = ref(false); const mobile = ref(false); const element = shallowRef<HTMLDivElement>(); const background = shallowRef<HTMLDivElement>()
    const open = computed(() => props.modelValue ?? props.isOpen ?? false)
    const transition = computed(() => mobile.value && props.bottomSheet !== false)
    const animation = ref<'exited' | 'entering' | 'entered' | 'exiting'>('exited')
    const titleId = useId(); let timer: ReturnType<typeof setTimeout> | undefined; let cleanup: (() => void) | undefined; let generation = 0
    const close = () => { emit('close'); emit('update:modelValue', false); emit('update:isOpen', false) }
    provide(ModalKey, computed(() => ({ title: props.title, titleId, bottomSheet: props.bottomSheet, showDismiss: !mobile.value || props.bottomSheet !== true, close })))
    const resize = () => { mobile.value = window.innerWidth < 744 }
    onMounted(() => { resize(); ready.value = true; window.addEventListener('resize', resize) })
    function settle() { if (animation.value === 'entering') animation.value = 'entered'; else if (animation.value === 'exiting') animation.value = 'exited' }
    watch([open, ready, transition], async () => {
      const token = ++generation
      clearTimeout(timer)
      if (!ready.value) return
      if (!open.value) {
        cleanup?.(); cleanup = undefined
        if (transition.value && animation.value !== 'exited') { animation.value = 'exiting'; timer = setTimeout(settle, 500) }
        else animation.value = 'exited'
        return
      }
      if (!transition.value) animation.value = 'entered'
      await nextTick()
      if (token !== generation || !open.value || !element.value) return
      if (transition.value) { if (background.value) void background.value.offsetHeight; animation.value = 'entering'; timer = setTimeout(settle, 500) }
      if (!cleanup) {
        cleanup = activateOverlay(element.value, { escape: () => { if (props.isDismissable) close() }, overflowClip: props.overflowClip })
        element.value.focus({ preventScroll: true })
      }
    }, { immediate: true, flush: 'post' })
    onBeforeUnmount(() => { generation++; clearTimeout(timer); cleanup?.(); window.removeEventListener('resize', resize) })
    expose({ element, close, focus: () => element.value?.focus() })
    return () => {
      if (!ready.value || (!open.value && (!transition.value || animation.value === 'exited'))) return null
      return h(Teleport, { to: props.portalContainer ?? 'body' }, [h('div', {
        ref: background, class: 'charcoal-modal-background', style: { zIndex: props.zIndex }, 'data-bottom-sheet': props.bottomSheet,
        'data-animation': transition.value ? animation.value : undefined,
        onClick: (event: MouseEvent) => { if (event.target === event.currentTarget) close() },
        onTransitionend: (event: TransitionEvent) => { if (event.target === element.value && event.propertyName === 'transform') settle() }
      }, [h('div', { ...attrs, ref: element, class: ['charcoal-modal-dialog', attrs.class], role: attrs.role ?? 'dialog', tabindex: -1, 'aria-modal': true, 'aria-label': attrs['aria-label'] ?? props.title, 'data-size': props.size, 'data-bottom-sheet': props.bottomSheet }, [
        slots.default?.(), props.isDismissable ? h(ModalCloseButton, { 'aria-label': props.closeButtonAriaLabel, onClick: close }) : null
      ])])])
    }
  }
})
export const ModalHeader = defineComponent({
  name: 'ModalHeader', setup(_, { slots }) { const context = inject(ModalKey); return () => h('div', { class: 'charcoal-modal-header-root', 'data-bottom-sheet': context?.value.bottomSheet }, [h('div', { id: context?.value.titleId, class: 'charcoal-modal-header-title' }, slots.default?.() ?? context?.value.title)]) }
})
export const ModalCloseButton = defineComponent({ name: 'ModalCloseButton', setup(_, { attrs }) { return () => h(IconButton, { class: 'charcoal-modal-close-button', size: 'S', icon: '24/Close', type: 'button', ...attrs }) } })
export const ModalDismissButton = defineComponent({ name: 'ModalDismissButton', setup(_, { slots, attrs }) { const context = inject(ModalKey); return () => context?.value.showDismiss ? h(Button, { ...attrs, fullWidth: true, onClick: context.value.close }, slots) : null } })
function div(name: string) { return defineComponent({ name, setup(_, { slots, attrs }) { return () => h('div', { ...attrs, class: [name, attrs.class] }, slots.default?.()) } }) }
export const ModalAlign = div('charcoal-modal-align')
export const ModalBody = div('charcoal-modal-body')
export const ModalButtons = div('charcoal-modal-buttons')
