import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, Teleport, useId, type PropType, type VNodeChild } from 'vue'
export type NotificationOrder = 'queue' | 'replace'
export interface UseNotificationOptions { position?: 'top' | 'bottom'; offset?: number; headerOffset?: number; duration?: number; order?: NotificationOrder }
export interface ToastProps extends UseNotificationOptions { zIndex?: number; portalContainer?: HTMLElement; class?: string }
export type SnackbarCloseReason = 'action' | 'unmounted'
export type SnackbarRootAttributes = { [key: `data-${string}`]: string | number | boolean | undefined }
export type Content = VNodeChild | (() => VNodeChild)
export interface ShowSnackbarOptions { action?: Content; onClose?: (reason: SnackbarCloseReason) => void; rootAttributes?: SnackbarRootAttributes }
export interface UseSnackbarProps extends ToastProps { dim?: boolean }
export interface ShowToastOptions { type: 'success' | 'error' }
export interface ToastHandler { show(message: Content, options: ShowToastOptions): void }
export interface SnackbarProps { message: Content; action: Content; dim?: boolean }
const render = (value: Content) => typeof value === 'function' ? value() : value

export const Snackbar = defineComponent({
  name: 'Snackbar', props: { message: [String, Number, Object, Array, Function] as PropType<Content>, action: [String, Number, Object, Array, Function] as PropType<Content>, dim: Boolean },
  setup(props, { slots }) { return () => h('div', { class: 'charcoal-notification charcoal-snackbar', 'data-dim': props.dim, 'data-with-action': props.action !== undefined || !!slots.action }, [h('div', { role: 'status', class: 'charcoal-notification-content' }, [h('div', { class: 'charcoal-notification-label' }, slots.default?.() ?? [render(props.message)])]), props.action !== undefined || slots.action ? h('div', {}, slots.action?.() ?? [render(props.action)]) : null]) }
})

interface Item extends ShowSnackbarOptions { message: Content; type?: 'success' | 'error'; id: number; notified?: boolean; reason?: SnackbarCloseReason }
function useNotification(name: 'toast' | 'snackbar', options: UseSnackbarProps = {}) {
  const active = shallowRef<Item>(); const exiting = ref(false); const queue: Item[] = []
  const element = shallowRef<HTMLElement>(); const region = shallowRef<HTMLElement>()
  let sequence = 0; let timer: ReturnType<typeof setTimeout> | undefined; let exitTimer: ReturnType<typeof setTimeout> | undefined
  let hovering = false; let focused = false; let pending = false; let expires = 0; let remaining = 0; let disposed = false
  let lastFocused: HTMLElement | undefined; let pointer = false
  const titleId = useId()
  const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const duration = () => Number.isFinite(options.duration) ? Math.max(0, options.duration!) : 5000
  function notify(item: Item | undefined) { if (item && !item.notified) { item.notified = true; item.onClose?.(item.reason ?? 'unmounted') } }
  function play() {
    active.value = queue.shift(); exiting.value = false; pending = false
    if (active.value) { remaining = Math.max(1, duration() + (reduced() ? 0 : 300)); resume() }
  }
  function finish() {
    clearTimeout(exitTimer); notify(active.value); active.value = undefined
    const restore = focused; if (!disposed) play()
    if (restore) void nextTick(() => {
      if (active.value && !pointer) element.value?.focus({ preventScroll: true })
      else { focused = false; lastFocused?.focus({ preventScroll: true }); lastFocused = undefined; resume() }
    })
  }
  function close(reason?: SnackbarCloseReason, immediate = false) {
    if (!active.value || exiting.value) return
    clearTimeout(timer)
    if (reason) active.value.reason = reason
    if (hovering && reason !== 'action') { pending = true; return }
    pending = false
    if (immediate || reduced()) { finish(); return }
    exiting.value = true; exitTimer = setTimeout(finish, 400)
  }
  function pause() { remaining = Math.max(1, expires - Date.now()); clearTimeout(timer) }
  function resume() { if (focused || !active.value || exiting.value) return; clearTimeout(timer); expires = Date.now() + remaining; timer = setTimeout(() => close(), remaining) }
  function show(message: Content, itemOptions: ShowSnackbarOptions & Partial<ShowToastOptions> = {}) {
    if (disposed) return
    queue.push({ ...itemOptions, message, id: ++sequence })
    if (!active.value) play()
    else if (options.order === 'replace') { hovering = false; close(undefined, name === 'toast') }
  }
  function restoreFocus() { if (focused && lastFocused?.isConnected) lastFocused.focus({ preventScroll: true }); lastFocused = undefined; focused = false }
  function dispose() { disposed = true; clearTimeout(timer); clearTimeout(exitTimer); notify(active.value); queue.length = 0; active.value = undefined; restoreFocus() }
  onBeforeUnmount(dispose)
  const Region = defineComponent({
    name: name === 'toast' ? 'ToastRegion' : 'SnackbarRegion',
    setup() {
      function keydown(event: KeyboardEvent) {
        pointer = false
        if (event.key !== 'F6' || event.defaultPrevented || !region.value) return
        const regions = Array.from(document.querySelectorAll<HTMLElement>('[data-annexus-live]'))
        const current = regions.findIndex(node => node.contains(document.activeElement))
        const index = current < 0 ? (event.shiftKey ? regions.length - 1 : 0) : (current + (event.shiftKey ? -1 : 1) + regions.length) % regions.length
        event.preventDefault(); regions[index]?.focus({ preventScroll: true })
      }
      const pointerdown = () => { pointer = true }
      onMounted(() => { document.addEventListener('keydown', keydown); document.addEventListener('pointerdown', pointerdown, true) })
      onBeforeUnmount(() => { document.removeEventListener('keydown', keydown); document.removeEventListener('pointerdown', pointerdown, true); clearTimeout(timer); clearTimeout(exitTimer); notify(active.value); active.value = undefined; queue.length = 0; restoreFocus() })
      return () => {
        const item = active.value
        if (!item || typeof document === 'undefined') return null
        const position = name === 'snackbar' && item.action !== undefined ? 'bottom' : options.position ?? (name === 'snackbar' ? 'bottom' : 'top')
        return h(Teleport, { to: options.portalContainer ?? 'body' }, [h('div', {
          ref: region, role: 'region', 'aria-label': 'Notifications', tabindex: -1, 'data-annexus-live': true,
          class: ['charcoal-notification-region', options.class], style: { zIndex: options.zIndex ?? 20, [`--charcoal-${name}-offset`]: `${Math.max(16, options.offset ?? 16)}px`, justifyContent: position === 'top' ? 'flex-start' : 'flex-end' },
          onFocusin: (event: FocusEvent) => { if (!focused) { lastFocused = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : undefined; focused = true; pause() } }, onFocusout: (event: FocusEvent) => { if (event.relatedTarget && !region.value?.contains(event.relatedTarget as Node)) { focused = false; lastFocused = undefined; resume() } }
        }, [h('div', { style: { height: `calc(${options.headerOffset ?? 0}px + env(safe-area-inset-top, 0px) + var(--charcoal-${name}-offset))` } }), h('div', { 'data-position': position, class: `charcoal-${name}-region` }, [
          h('div', { ...item.rootAttributes, ref: element, key: item.id, role: 'alertdialog', 'aria-modal': 'false', 'aria-labelledby': titleId, tabindex: 0, class: `charcoal-notification charcoal-${name}`, 'data-type': item.type, 'data-dim': name === 'snackbar' ? options.dim ?? false : undefined, 'data-with-action': name === 'snackbar' ? item.action !== undefined : undefined, 'data-exiting': exiting.value || undefined,
            onPointerenter: () => { hovering = true }, onPointerleave: () => { hovering = false; if (pending) close() },
            onAnimationend: (event: AnimationEvent) => { if (exiting.value && event.target === element.value && event.animationName === `charcoal-${name}-exit`) finish() }
          }, [h('div', { role: 'status', 'aria-atomic': true, class: 'charcoal-notification-content' }, [h('div', { id: titleId, class: 'charcoal-notification-label' }, [render(item.message)])]), item.action !== undefined ? h('div', { onClick: () => { hovering = false; close('action') } }, [h('div', {}, [render(item.action)])]) : null])
        ])])])
      }
    }
  })
  return [Region, show] as const
}
export function useSnackbar(props: UseSnackbarProps = {}) { const [element, show] = useNotification('snackbar', props); return [element, (message: Content, options?: ShowSnackbarOptions) => show(message, options)] as const }
export function useToast(props: ToastProps = {}) { const [element, show] = useNotification('toast', props); return [element, (message: Content, options: ShowToastOptions) => show(message, options)] as const }
export const Toast = defineComponent({
  name: 'Toast',
  props: { position: String as PropType<'top' | 'bottom'>, duration: Number, order: String as PropType<NotificationOrder>, offset: Number, headerOffset: Number, zIndex: Number, portalContainer: Object as PropType<HTMLElement> },
  setup(props, { expose }) { const [Region, show] = useToast(props); expose({ show }); return () => h(Region) }
})
