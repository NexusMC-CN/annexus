import { defineComponent, h, mergeProps, type PropType, type CSSProperties } from 'vue'
import { textContent } from '../internal/dom'
export interface TextEllipsisProps { lineHeight?: number; lineLimit?: number; hyphens?: CSSProperties['hyphens']; showTooltip?: boolean; useNowrap?: boolean; title?: string }
export default defineComponent({
  name: 'TextEllipsis', inheritAttrs: false,
  props: { lineHeight: Number, lineLimit: { type: Number, default: 1 }, hyphens: { type: String as PropType<CSSProperties['hyphens']>, default: 'auto' }, showTooltip: { type: Boolean, default: true }, useNowrap: Boolean, title: String },
  setup(props, { attrs, slots }) {
    return () => {
      const children = slots.default?.() ?? []
      return h('div', mergeProps({
        class: 'charcoal-text-ellipsis', 'data-line-limit': props.lineLimit, 'data-has-line-height': props.lineHeight !== undefined,
        'data-use-nowrap': props.useNowrap || undefined,
        style: { '--charcoal-text-ellipsis-line-height': props.lineHeight === undefined ? undefined : `${props.lineHeight}px`, '--charcoal-text-ellipsis-line-limit': props.lineLimit, hyphens: props.hyphens }
      }, attrs, { title: props.showTooltip ? props.title ?? textContent(children) : undefined }), children)
    }
  }
})
