import { defineComponent, h } from 'vue'
import { textContent } from '../internal/dom'
export default defineComponent({ name: 'SandboxTextEllipsis', props: { lineHeight: { type: Number, required: true }, lineLimit: { type: Number, default: 1 }, title: String }, setup(props, { slots, attrs }) { return () => {
  const nodes = slots.default?.() ?? []; const title = props.title ?? textContent(nodes)
  return h('div', { ...attrs, class: ['annexus-text-ellipsis', attrs.class], title: title || undefined, 'data-line-limit': props.lineLimit, style: [attrs.style, { lineHeight: `${props.lineHeight}px`, ...(props.lineLimit !== 1 ? { display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: props.lineLimit, maxHeight: `${props.lineLimit * props.lineHeight}px` } : {}) }] }, nodes)
} } })
