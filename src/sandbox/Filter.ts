import { defineComponent, h, shallowRef } from 'vue'
import { divComponent, useComponentAbstraction } from './shared'
export const Filter = divComponent('annexus-filter')
const props = { active: Boolean, hover: Boolean, reactive: Boolean, width: Number, height: Number, to: String }
function filter(name: string, icon: boolean, link: boolean) {
  return defineComponent({
    name, inheritAttrs: false, props,
    setup(props, { attrs, slots, expose }) {
      const abstraction = useComponentAbstraction(); const element = shallowRef<HTMLElement>()
      expose({ element, focus: () => element.value?.focus() })
      return () => {
        const style = { width: props.width === undefined ? undefined : `${props.width}px`, height: props.height === undefined ? undefined : `${props.height}px` }
        const block = h(link ? 'span' : 'button', { ...(!link ? attrs : {}), ref: element, class: ['annexus-filter-button', icon && 'annexus-filter-icon', !link && attrs.class], style, 'data-active': props.active, 'data-hover': props.hover, 'data-reactive': props.reactive, onClickCapture: (event: Event) => { if (props.active && !props.reactive) event.stopImmediatePropagation() } }, slots.default?.())
        return link && (!props.active || props.reactive) ? h(abstraction.value.Link, { ...attrs, to: props.to ?? '' }, () => block) : block
      }
    }
  })
}
export const FilterButton = filter('FilterButton', false, false)
export const FilterIconButton = filter('FilterIconButton', true, false)
export const FilterLink = filter('FilterLink', false, true)
