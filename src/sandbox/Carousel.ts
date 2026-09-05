import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, type PropType } from 'vue'
export const GRADIENT_WIDTH = 72
export const SCROLL_AMOUNT_COEF = 0.75
export interface CarouselHandlerRef { resetScroll(): void }
export interface CarouselProps { buttonOffset?: number; buttonPadding?: number; bottomOffset?: number; defaultScroll?: { align?: 'center' | 'left' | 'right'; offset?: number }; hasGradient?: boolean; fadeInGradient?: boolean; centerItems?: boolean; scrollAmountCoef?: number }
export default defineComponent({
  name: 'SandboxCarousel',
  props: { buttonOffset: { type: Number, default: 0 }, buttonPadding: { type: Number, default: 16 }, bottomOffset: { type: Number, default: 0 }, defaultScroll: Object as PropType<CarouselProps['defaultScroll']>, hasGradient: Boolean, fadeInGradient: Boolean, centerItems: Boolean, scrollAmountCoef: { type: Number, default: SCROLL_AMOUNT_COEF } },
  emits: ['scroll', 'resize', 'scrollStateChange'],
  setup(props, { slots, expose, emit }) {
    const element = shallowRef<HTMLElement>(); const scroller = shallowRef<HTMLElement>(); const inner = shallowRef<HTMLElement>()
    const target = ref(0); const max = ref(0); const edge = ref(false)
    let position = 0; let velocity = 0; let from = 0; let frame = 0; let previous = 0; let observer: ResizeObserver | undefined; let previousCan: boolean | undefined
    function update() { if (!scroller.value) return; max.value = scroller.value.scrollWidth - scroller.value.clientWidth; const can = target.value > 0 || target.value < max.value && max.value > 0; if (can !== previousCan) { previousCan = can; emit('scrollStateChange', can) } }
    function resetScroll() {
      if (!scroller.value) return
      const align = props.defaultScroll?.align ?? 'left'; const offset = props.defaultScroll?.offset ?? 0
      const left = align === 'left' && offset > 0 ? offset : align === 'center' ? max.value / 2 + offset : align === 'right' && offset <= max.value ? max.value - offset / 2 : 0
      target.value = Math.max(0, Math.min(left, max.value)); scroller.value.scrollLeft = target.value; position = target.value; update()
    }
    function animate(time: number) {
      const dt = Math.min(64, previous ? time - previous : 16.667); previous = time
      const precision = from === target.value ? 0.005 : Math.max(Math.max(Math.abs(target.value), Math.abs(from), 1) * Number.EPSILON, Math.min(1, Math.abs(target.value - from) * 0.001))
      let done = false
      for (let i = 0; i < Math.ceil(dt); i++) {
        if (Math.abs(velocity) <= precision / 10 && Math.abs(target.value - position) <= precision) { done = true; break }
        velocity += -170 * 0.000001 * (position - target.value) - 26 * 0.001 * velocity
        position += velocity
      }
      if (scroller.value) scroller.value.scrollLeft = done ? target.value : position
      if (done) { frame = 0; previous = 0; velocity = 0 }
      else frame = requestAnimationFrame(animate)
    }
    function move(right: boolean) {
      const width = element.value?.clientWidth ?? 0
      if (!frame) { from = target.value; position = scroller.value?.scrollLeft ?? target.value; velocity = 0 }
      target.value = Math.max(0, Math.min(max.value, target.value + width * props.scrollAmountCoef * (right ? 1 : -1)))
      update(); if (!frame) frame = requestAnimationFrame(animate)
    }
    const wheel = () => { cancelAnimationFrame(frame); frame = 0; previous = 0; target.value = scroller.value?.scrollLeft ?? 0; position = target.value; update() }
    onMounted(async () => {
      edge.value = /Edge\//.test(navigator.userAgent); update(); await nextTick(); resetScroll()
      if (typeof ResizeObserver !== 'undefined') { observer = new ResizeObserver(() => { update(); emit('resize', scroller.value?.clientWidth ?? 0) }); if (scroller.value) observer.observe(scroller.value); if (inner.value) observer.observe(inner.value) }
      scroller.value?.addEventListener('wheel', wheel, { passive: true })
    })
    onBeforeUnmount(() => { observer?.disconnect(); cancelAnimationFrame(frame); scroller.value?.removeEventListener('wheel', wheel) })
    expose({ element, scroller, resetScroll })
    return () => {
      const gradient = props.hasGradient && !edge.value
      const scroll = h('div', { ref: scroller, class: 'annexus-carousel-scroll', onScroll: () => emit('scroll', scroller.value?.scrollLeft ?? 0) }, [h('ul', { ref: inner, class: 'annexus-carousel-items', 'data-center': props.centerItems }, slots.default?.())])
      return h('div', { ref: element, class: 'annexus-carousel' }, [gradient ? h('div', { class: 'annexus-carousel-gradient', 'data-fade': props.fadeInGradient }, [h('div', { class: 'annexus-carousel-gradient-right' }, [h('div', { class: 'annexus-carousel-gradient-left', 'data-show': !props.fadeInGradient || target.value > 0 }, [scroll])])]) : scroll,
        h('div', { class: 'annexus-carousel-buttons' }, [false, true].map(right => h('button', { type: 'button', class: 'annexus-carousel-button', 'data-hide': right ? !(target.value < max.value && max.value > 0) : !(target.value > 0), style: { [right ? 'right' : 'left']: `${props.buttonOffset - (gradient && (right || !props.fadeInGradient) ? 72 : 0)}px`, [right ? 'paddingRight' : 'paddingLeft']: `${Math.max(0, props.buttonPadding)}px`, paddingBottom: `${props.bottomOffset}px` }, onClick: () => move(right) }, [h('div', { class: 'annexus-carousel-button-icon' }, [h('svg', { viewBox: '0 0 24 24', class: 'annexus-legacy-icon', style: { width: '24px', height: '24px' } }, [h('path', { transform: right ? undefined : 'rotate(180 12 12)', d: 'M8.08579 16.5858C7.30474 17.3668 7.30474 18.6332 8.08579 19.4142C8.86684 20.1953 10.1332 20.1953 10.9142 19.4142L18.3284 12L10.9142 4.58579C10.1332 3.80474 8.86684 3.80474 8.08579 4.58579C7.30474 5.36684 7.30474 6.63317 8.08579 7.41421L12.6716 12L8.08579 16.5858Z' })])])])))] )
    }
  }
})
