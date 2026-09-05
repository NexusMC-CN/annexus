import { defineComponent, h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, shallowRef, watch, type PropType } from 'vue'
import IconButton from './IconButton.vue'
import { flatten } from '../internal/dom'
import { observeCenter } from '../internal/intersectionObserver'
import { observeResize } from '../internal/resizeObserver'
export type ScrollAlign = 'left' | 'center' | 'right'
export type ScrollSnapType = 'none' | 'proximity' | 'mandatory'
export type ScrollSnapAlign = 'center' | 'start'
export type ScrollSnap = Readonly<{ type?: ScrollSnapType; align?: ScrollSnapAlign }>
export type ScrollStepContext = Readonly<{ clientWidth: number; scrollWidth: number; scrollLeft: number; direction: 'prev' | 'next' }>
export type ScrollStep = number | ((context: ScrollStepContext) => number)
export type CarouselHandlerRef = { resetScroll(): void }
export interface CarouselProps { hasGradient?: boolean; fullWidth?: boolean; navigationButtons?: boolean; indicator?: boolean; size?: 'S' | 'M'; scrollStep?: ScrollStep; scrollSnap?: ScrollSnap; defaultScroll?: { align?: ScrollAlign; offset?: number }; gap?: number | string }
export default defineComponent({
  name: 'Carousel', inheritAttrs: false,
  props: {
    hasGradient: Boolean, fullWidth: Boolean, navigationButtons: { type: Boolean, default: undefined }, indicator: { type: Boolean, default: undefined }, size: { type: String as PropType<'S' | 'M'>, default: 'M' },
    scrollStep: { type: [Number, Function] as PropType<ScrollStep>, default: 0.75 }, scrollSnap: Object as PropType<ScrollSnap>, defaultScroll: Object as PropType<{ align?: ScrollAlign; offset?: number }>, gap: [Number, String]
  },
  emits: ['scroll', 'resize', 'scrollStateChange'],
  setup(props, { slots, attrs, emit, expose }) {
    const scroller = shallowRef<HTMLDivElement>(); const element = shallowRef<HTMLDivElement>()
    const activeIndex = ref(0); const canPrev = ref(false); const canNext = ref(false); const keyboard = ref(false); const focused = ref(false)
    let initial = true; let previousCanScroll: boolean | undefined; let mounted = false; let ro: ResizeObserver | undefined
    const observers = new Map<HTMLElement, () => void>()
    function update() {
      const el = scroller.value
      if (!el) return
      canPrev.value = el.scrollLeft > 1; canNext.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 1
      const canScroll = canPrev.value || canNext.value
      if (canScroll !== previousCanScroll) { previousCanScroll = canScroll; emit('scrollStateChange', canScroll) }
    }
    function initialScroll() {
      const el = scroller.value
      if (!el || !initial) return
      const max = el.scrollWidth - el.clientWidth
      const align = props.defaultScroll?.align ?? 'left'
      const left = (align === 'right' ? max : align === 'center' ? max / 2 : 0) + (props.defaultScroll?.offset ?? 0)
      el.scrollTo?.({ left: Math.max(0, Math.min(left, max)), behavior: 'instant' }); update()
    }
    function observeItems() {
      if (!mounted || !scroller.value) return
      const items = Array.from(scroller.value.children) as HTMLElement[]
      for (const [el, cleanup] of observers) if (!items.includes(el)) { cleanup(); observers.delete(el) }
      items.forEach((item, index) => {
        if (observers.has(item)) return
        const a = observeCenter(item, () => { activeIndex.value = Array.from(scroller.value?.children ?? []).indexOf(item) })
        const b = observeResize(item, () => { initialScroll(); update() })
        observers.set(item, () => { a(); b() })
        if (index === 0) update()
      })
    }
    function step(direction: 'prev' | 'next') {
      const el = scroller.value
      if (!el) return
      initial = false
      const delta = typeof props.scrollStep === 'function' ? props.scrollStep({ clientWidth: el.clientWidth, scrollWidth: el.scrollWidth, scrollLeft: el.scrollLeft, direction }) : el.clientWidth * props.scrollStep
      el.scrollBy?.({ left: direction === 'next' ? delta : -delta, behavior: 'smooth' })
    }
    function select(index: number) { (scroller.value?.children[index] as HTMLElement)?.scrollIntoView?.({ behavior: 'smooth', inline: 'center', block: 'nearest' }) }
    const stop = () => { initial = false }
    const keyModality = () => { keyboard.value = true }
    const pointerModality = () => { keyboard.value = false }
    const scroll = () => { update(); emit('scroll', scroller.value?.scrollLeft ?? 0) }
    onMounted(() => {
      document.addEventListener('keydown', keyModality, true); document.addEventListener('pointerdown', pointerModality, true)
      mounted = true; observeItems(); initialScroll(); update()
      if (typeof ResizeObserver !== 'undefined' && scroller.value) { ro = new ResizeObserver(() => { initialScroll(); update(); emit('resize', scroller.value?.clientWidth ?? 0) }); ro.observe(scroller.value) }
      for (const name of ['pointerdown', 'wheel', 'touchstart']) scroller.value?.addEventListener(name, stop, true)
    })
    onUpdated(observeItems)
    watch(() => [props.defaultScroll?.align, props.defaultScroll?.offset], async () => { initial = true; await nextTick(); initialScroll() })
    onBeforeUnmount(() => { document.removeEventListener('keydown', keyModality, true); document.removeEventListener('pointerdown', pointerModality, true); ro?.disconnect(); for (const cleanup of observers.values()) cleanup(); for (const name of ['pointerdown', 'wheel', 'touchstart']) scroller.value?.removeEventListener(name, stop, true) })
    expose({ element, scroller, resetScroll: () => { initial = true; initialScroll(); update() } })
    return () => {
      const slides = flatten(slots.default?.() ?? [])
      const navigation = props.navigationButtons ?? props.size === 'M'; const indicator = props.indicator ?? props.size === 'S'
      return h('div', { ...attrs, ref: element, class: ['charcoal-carousel', attrs.class], style: [attrs.style, props.gap != null ? { '--charcoal-carousel-gap': typeof props.gap === 'number' ? `${props.gap}px` : props.gap } : {}],
        'data-size': props.size, 'data-has-gradient': props.hasGradient, 'data-full-width': props.fullWidth, 'data-indicator': indicator, 'data-scroll-snap-type': props.scrollSnap?.type ?? (props.size === 'S' ? 'mandatory' : 'none'), 'data-scroll-snap-align': props.scrollSnap?.align ?? 'center', 'data-can-prev': canPrev.value, 'data-can-next': canNext.value, 'data-focus-visible-within': focused.value && keyboard.value || undefined,
        role: 'region', 'aria-roledescription': 'carousel', 'aria-label': attrs['aria-label'] ?? 'Carousel', onKeydownCapture: () => { keyboard.value = true }, onPointerdownCapture: () => { keyboard.value = false }, onFocusin: () => { focused.value = true }, onFocusout: (event: FocusEvent) => { if (!element.value?.contains(event.relatedTarget as Node)) focused.value = false }
      }, [h('div', { class: 'charcoal-carousel__viewport', 'data-focus-visible': focused.value && keyboard.value && scroller.value === scroller.value?.ownerDocument.activeElement || undefined }, [
        h('div', { ref: scroller, class: 'charcoal-carousel__scroller', tabindex: 0, onScroll: scroll, onKeydown: (event: KeyboardEvent) => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); step(event.key === 'ArrowRight' ? 'next' : 'prev') } } }, slides.map((slide, index) => h('div', { key: slide.key ?? index, class: 'charcoal-carousel__item' }, [slide]))),
        h('div', { class: 'charcoal-carousel__navigation', 'data-visible': navigation, 'aria-hidden': !navigation }, (['prev', 'next'] as const).map(direction => h(IconButton, { variant: 'Overlay', size: 'S', icon: direction === 'prev' ? '24/Prev' : '24/Next', 'aria-label': direction === 'prev' ? 'Previous' : 'Next', disabled: !(direction === 'prev' ? canPrev.value : canNext.value), onClick: () => step(direction), class: 'charcoal-carousel__navigation__item', 'data-direction': direction, 'data-hidden': !(direction === 'prev' ? canPrev.value : canNext.value) })))
      ]), h('div', { class: 'charcoal-carousel__indicator', 'data-visible': indicator, 'aria-hidden': !indicator }, slides.map((slide, index) => h('button', { key: slide.key ?? index, class: 'charcoal-carousel__indicator__item', 'data-active': index === activeIndex.value, 'aria-current': index === activeIndex.value || undefined, 'aria-label': `Go to slide ${index + 1}`, onClick: () => select(index) })))])
    }
  }
})
