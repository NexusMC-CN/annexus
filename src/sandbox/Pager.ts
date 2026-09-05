import { defineComponent, h, type PropType } from 'vue'
import { useComponentAbstraction, wedge } from './shared'
const dots = () => h('svg', { viewBox: '0 0 20 6', width: 20, height: 20, fill: 'currentColor' }, [h('path', { 'fill-rule': 'evenodd', transform: 'translate(-2 -9)', d: 'M5,14.5 C3.61928813,14.5 2.5,13.3807119 2.5,12 C2.5,10.6192881 3.61928813,9.5 5,9.5 C6.38071187,9.5 7.5,10.6192881 7.5,12 C7.5,13.3807119 6.38071187,14.5 5,14.5 Z M12,14.5 C10.6192881,14.5 9.5,13.3807119 9.5,12 C9.5,10.6192881 10.6192881,9.5 12,9.5 C13.3807119,9.5 14.5,10.6192881 14.5,12 C14.5,13.3807119 13.3807119,14.5 12,14.5 Z M19,14.5 C17.6192881,14.5 16.5,13.3807119 16.5,12 C16.5,10.6192881 17.6192881,9.5 19,9.5 C20.3807119,9.5 21.5,10.6192881 21.5,12 C21.5,13.3807119 20.3807119,14.5 19,14.5 Z' })])
function pager(link: boolean) { return defineComponent({ name: link ? 'LinkPager' : 'Pager', props: { page: { type: Number, required: true }, pageCount: { type: Number, required: true }, pageRangeDisplayed: { type: Number, default: 7 }, makeUrl: Function as PropType<(page: number) => string> }, emits: ['change'], setup(props, { emit }) {
  const abstraction = useComponentAbstraction()
  return () => {
    const last = Math.min(props.pageCount, Math.max(props.page + Math.floor(props.pageRangeDisplayed / 2), props.pageRangeDisplayed))
    const start = last - (props.pageRangeDisplayed - 1) + 2
    const pages = last <= props.pageRangeDisplayed ? Array.from({ length: Math.max(0, last) }, (_, i) => i + 1) : [1, '...', ...Array.from({ length: last - start + 1 }, (_, i) => start + i)]
    const nav = (dir: 'left' | 'right') => {
      const target = dir === 'left' ? Math.max(1, props.page - 1) : Math.min(props.pageCount, props.page + 1)
      const disabled = dir === 'left' ? props.page <= 1 : props.page >= props.pageCount
      const button = h('button', { type: link ? undefined : 'button', class: 'annexus-pager-button', hidden: disabled, disabled: link ? undefined : disabled, 'aria-disabled': link ? disabled : undefined, 'data-no-background': true, onClick: link ? undefined : () => emit('change', target) }, [wedge(dir)])
      return link ? h(abstraction.value.Link, { to: props.makeUrl?.(target) ?? '' }, () => button) : button
    }
    return h('nav', { class: 'annexus-pager' }, [nav('left'), ...pages.map(page => {
      if (page === '...') return h('button', { key: page, type: 'button', disabled: true, class: 'annexus-pager-button annexus-pager-spacer' }, [dots()])
      const selected = page === props.page
      const button = h('button', { key: page, type: 'button', class: 'annexus-pager-button', 'aria-current': selected || undefined, onClick: !link && !selected ? () => emit('change', page) : undefined }, [h('span', page)])
      return link && !selected ? h(abstraction.value.Link, { key: page, to: props.makeUrl?.(Number(page)) ?? '' }, () => button) : button
    }), nav('right')])
  }
} }) }
export const Pager = pager(false)
export const LinkPager = pager(true)
