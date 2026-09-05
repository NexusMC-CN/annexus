import { defineComponent, h, shallowRef, type PropType, type VNodeChild } from 'vue'
import { useElementSize } from './shared'
export default defineComponent({
  name: 'WithIcon', props: { icon: [Object, Function, String] as PropType<VNodeChild>, show: { type: [Boolean, String] as PropType<boolean | 'collapse'>, default: true }, prefix: Boolean, fit: Boolean, width: Number, fixed: Boolean },
  setup(props, { slots }) {
    const icon = shallowRef<HTMLElement>(); const size = useElementSize(icon, [null])
    return () => {
      const node = h('div', { class: ['annexus-with-icon-anchor', props.fit && 'annexus-with-icon-anchor-fit'], 'data-prefix': props.prefix, style: { display: props.show === 'collapse' ? 'none' : undefined, visibility: props.show ? 'visible' : 'hidden', width: props.fit ? `${props.width ?? size.value?.width ?? 0}px` : undefined } }, [h('div', { ref: icon, class: ['annexus-with-icon-icon', props.fit && 'annexus-with-icon-icon-fit'] }, slots.icon?.() ?? [props.icon])])
      return h('div', { class: 'annexus-with-icon' }, [props.prefix ? node : null, h('div', { class: 'annexus-with-icon-text', 'data-fixed': props.fixed }, slots.default?.()), props.prefix ? null : node])
    }
  }
})
