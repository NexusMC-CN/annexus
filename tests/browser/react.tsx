import React, { createElement, useState } from 'react'
import { createRoot } from 'react-dom/client'
import * as C from 'reference-core'
import * as S from 'reference-sandbox'
import { IconAdd24 } from 'reference-icons-v1/24/Add'
import { IconCheck } from 'reference-icons-v2/24/regular/Check'
import { ThemeProvider } from 'styled-components'
import { light, dark } from '@charcoal-ui/theme'
import { fixture, initial, n, type Node } from './cases'

const components: Record<string, any> = { ...C, ...Object.fromEntries(Object.entries(S).map(([key, value]) => [`S.${key}`, value])), V1Add24: IconAdd24, V2Check24: IconCheck }
function render(node: Node): any {
  if (node === null || typeof node !== 'object') return node
  const props = Object.fromEntries(Object.entries(node.props).map(([key, value]) => [key, value && typeof value === 'object' && 'type' in value ? render(value) : value]))
  return createElement(components[node.type] ?? node.type, props, ...node.children.map((child, index) => typeof child === 'object' && child ? render({ ...child, props: { ...child.props, key: index } }) : child))
}
function App() {
  const [state, set] = useState(initial)
  const [snackbar, showSnackbar] = C.unstable_useSnackbar({ duration: 1200 })
  const [toast, showToast] = C.unstable_useToast({ duration: 1200 })
  const name = new URLSearchParams(location.search).get('case') ?? 'buttons'
  return <ThemeProvider theme={document.documentElement.dataset.theme === 'dark' ? dark : light}><C.CharcoalProvider>
    {name === 'notifications' ? <>{render(n('Button', { onClick: () => showSnackbar('Saved', { action: createElement(C.Button, { size: 'S' }, 'Undo') }) }, 'Snackbar'))}{render(n('Button', { onClick: () => showToast('Complete', { type: 'success' }) }, 'Toast'))}{snackbar}{toast}</> : render(fixture(name, state, (key, value) => set(s => ({ ...s, [key]: value }))))}
  </C.CharcoalProvider></ThemeProvider>
}
createRoot(document.getElementById('app')!).render(<App />)
