import { defineComponent, h, mergeProps, shallowRef, type SVGAttributes, type VNodeChild } from 'vue'

export function createSvgIcon(name: string, defaults: SVGAttributes, children: () => VNodeChild[]) {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, expose, slots }) {
      const element = shallowRef<SVGSVGElement>()
      expose({ element })
      return () => h('svg', mergeProps({ ...defaults }, attrs, { ref: element }), [...children(), slots.default?.()])
    }
  })
}
