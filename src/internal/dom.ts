import { Fragment, Text, Comment, isVNode, onMounted, onUpdated, ref, watchEffect, type Ref, type VNode, type VNodeChild } from 'vue'

export const visuallyHidden = {
  border: '0', clip: 'rect(0, 0, 0, 0)', clipPath: 'inset(50%)', height: '1px', margin: '-1px',
  overflow: 'hidden', padding: '0', position: 'absolute' as const, width: '1px', whiteSpace: 'nowrap' as const
}

export function flatten(nodes: VNodeChild | VNodeChild[]): VNode[] {
  return (Array.isArray(nodes) ? nodes : [nodes]).flatMap(node => {
    if (Array.isArray(node)) return flatten(node)
    if (!isVNode(node) || node.type === Comment) return []
    return node.type === Fragment ? flatten(node.children as VNodeChild[]) : [node]
  })
}

export function textContent(nodes: VNodeChild | VNodeChild[]): string {
  return (Array.isArray(nodes) ? nodes : [nodes]).map(node => {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (!isVNode(node)) return Array.isArray(node) ? textContent(node) : ''
    if (node.type === Comment) return ''
    if (node.type === Text || typeof node.children === 'string') return String(node.children ?? '')
    return Array.isArray(node.children) ? textContent(node.children) : ''
  }).join('')
}

export function useElement<T extends HTMLElement>() {
  const element = ref<T>()
  return { element, focus: (options?: FocusOptions) => element.value?.focus(options), blur: () => element.value?.blur() }
}

export function useInputDefault(element: Ref<HTMLInputElement | HTMLTextAreaElement | undefined>, value: () => string | boolean, checked = false, reset?: (value: string | boolean) => void) {
  const sync = () => {
    const initial = value()
    if (!element.value) return
    if (checked) (element.value as HTMLInputElement).defaultChecked = Boolean(initial)
    else element.value.defaultValue = String(initial)
  }
  watchEffect(cleanup => {
    sync()
    const input = element.value; const form = input?.form
    const onReset = (event: Event) => queueMicrotask(() => { if (input && !event.defaultPrevented) reset?.(checked ? (input as HTMLInputElement).checked : input.value) })
    form?.addEventListener('reset', onReset)
    cleanup(() => form?.removeEventListener('reset', onReset))
  }, { flush: 'post' })
  onUpdated(sync)
}

let registration: Promise<unknown> | undefined
export function useIconRegistration() {
  onMounted(() => {
    registration ??= import('@charcoal-ui/icons')
    void registration
  })
}

export const countCodePointsInString = (value: string) => [...value].length
