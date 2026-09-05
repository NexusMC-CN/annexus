import { createApp, defineComponent, h, reactive, type Component } from 'vue'
import * as C from '../../src'
import * as S from '../../src/sandbox'
import { IconAdd24 } from '../../src/icons/v1/24/Add'
import { IconCheck } from '../../src/icons/v2/24/regular/Check'
import { light, dark } from '@charcoal-ui/theme'
import { fixture, initial, n, type Node } from './cases'

const components: Record<string, Component> = { ...C, ...Object.fromEntries(Object.entries(S).map(([key, value]) => [`S.${key}`, value])), V1Add24: IconAdd24, V2Check24: IconCheck } as any
function render(node: Node): any {
  if (node === null || typeof node !== 'object') return node
  const slots: Record<string, () => any> = {}
  const props = Object.fromEntries(Object.entries(node.props).flatMap(([key, value]) => {
    if (value && typeof value === 'object' && 'type' in value) { slots[key] = () => render(value); return [] }
    return [[key === 'className' ? 'class' : key, value]]
  }))
  const children = () => node.children.map(render)
  if (node.children.length) slots.default = children
  return components[node.type] ? h(components[node.type], props, slots) : h(node.type, props, children())
}
const App = defineComponent({ setup() {
  const state = reactive({ ...initial })
  const [Snackbar, showSnackbar] = C.unstable_useSnackbar({ duration: 1200 })
  const [Toast, showToast] = C.unstable_useToast({ duration: 1200 })
  const name = new URLSearchParams(location.search).get('case') ?? 'buttons'
  return () => h(C.ThemeProvider, { theme: document.documentElement.dataset.theme === 'dark' ? dark : light }, () => h(C.CharcoalProvider, {}, () => name === 'notifications' ? [render(n('Button', { onClick: () => showSnackbar('Saved', { action: () => h(C.Button, { size: 'S' }, () => 'Undo') }) }, 'Snackbar')), render(n('Button', { onClick: () => showToast('Complete', { type: 'success' }) }, 'Toast')), h(Snackbar), h(Toast)] : render(fixture(name, state, (key, value) => { (state as any)[key] = value }))))
} })
createApp(App).mount('#app')
