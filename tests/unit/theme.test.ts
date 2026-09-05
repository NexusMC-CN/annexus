import { expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createSSRApp, defineComponent, h, nextTick } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { light, dark } from '@charcoal-ui/theme'
import { Checkbox, Modal, ThemeProvider, TokenInjector, useLocalStorage, makeSetThemeScriptCode, useThemeSetter } from '../../src'

it('isolates theme and IDs across server renders', async () => {
  const render = (theme: typeof light) => renderToString(createSSRApp(defineComponent(() => () => h(ThemeProvider, { theme }, () => [h(Checkbox, {}, () => 'Choice'), h(Modal, { title: 'Closed', isOpen: false }, () => 'Hidden')]))))
  const [one, two] = await Promise.all([render(light), render(dark)])
  expect(one).toContain(`--charcoal-background1:${light.color.background1}`)
  expect(two).toContain(`--charcoal-background1:${dark.color.background1}`)
  expect(one).not.toContain('charcoal-modal-background')
  expect(one.match(/id="([^"]+)"/)?.[1]).toBe(two.match(/id="([^"]+)"/)?.[1])
})
it('synchronizes storage between components and ignores other storage areas', async () => {
  let set!: (value: { count: number } | undefined) => void
  const Reader = defineComponent({ setup() { const [value, setter] = useLocalStorage('settings', () => ({ count: 0 })); set = setter; return () => h('output', JSON.stringify(value.value)) } })
  const first = mount(Reader); const second = mount(Reader)
  set({ count: 3 }); await nextTick()
  expect(first.text()).toBe('{"count":3}'); expect(second.text()).toBe('{"count":3}')
  localStorage.setItem('settings', '{"count":9}')
  window.dispatchEvent(new StorageEvent('storage', { key: 'settings', storageArea: sessionStorage }))
  await nextTick(); expect(first.text()).toBe('{"count":3}')
  set(undefined); await nextTick(); expect(second.text()).toBe('{"count":0}')
})
it('sets stored themes and returns to the system theme', async () => {
  localStorage.setItem('charcoal-theme', 'dark')
  const setter = vi.fn()
  mount(defineComponent({ setup() { useThemeSetter({ setter }); return () => null } }))
  await nextTick(); expect(setter).toHaveBeenLastCalledWith('dark')
  localStorage.removeItem('charcoal-theme')
  window.dispatchEvent(new StorageEvent('storage', { key: 'charcoal-theme', storageArea: localStorage }))
  await nextTick(); expect(setter).toHaveBeenLastCalledWith(undefined)
})
it('generates guarded startup scripts and theme variables', () => {
  expect(() => makeSetThemeScriptCode({ localStorageKey: "bad'</script>" })).toThrow()
  expect(() => makeSetThemeScriptCode({ rootAttribute: 'bad name' })).toThrow()
  localStorage.setItem('custom-theme', 'dark')
  window.eval(makeSetThemeScriptCode({ localStorageKey: 'custom-theme', rootAttribute: 'custom' }))
  expect(document.documentElement.dataset.custom).toBe('dark')
  const host = mount(TokenInjector, { props: { theme: { ':root': light, '@media(prefers-color-scheme:dark)': dark } } })
  expect(host.text()).toContain('--charcoal-brand:')
  expect(host.text()).toContain('--charcoal-brand-hover:')
})
