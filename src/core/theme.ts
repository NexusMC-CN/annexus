import { computed, defineComponent, h, onBeforeUnmount, onMounted, ref, watchEffect, provide, inject, type PropType, type InjectionKey, type ComputedRef } from 'vue'
import { light, type CharcoalTheme, type CharcoalAbstractTheme } from '@charcoal-ui/theme'
import { applyEffect, customPropertyToken } from '@charcoal-ui/utils'

export const LOCAL_STORAGE_KEY = 'charcoal-theme'
export const DEFAULT_ROOT_ATTRIBUTE = 'theme'
export function assertKeyString(key: string) {
  if (!/^[\w-]+$/.test(key)) throw new Error(`Unexpected key: ${key}`)
}
export const themeSetter = (attr = DEFAULT_ROOT_ATTRIBUTE) => (theme: string | undefined) => {
  assertKeyString(attr)
  if (typeof document === 'undefined') return
  if (theme === undefined) delete document.documentElement.dataset[attr]
  else document.documentElement.dataset[attr] = theme
}
export const themeSelector = (theme: string, attr = DEFAULT_ROOT_ATTRIBUTE) => `:root[data-${attr}='${theme}']`
export const prefersColorScheme = (theme: 'light' | 'dark') => `@media (prefers-color-scheme: ${theme})`
export function getThemeSync(key = LOCAL_STORAGE_KEY): string | null {
  if (typeof localStorage === 'undefined') return null
  try { return localStorage.getItem(key) } catch { return null }
}

export function useMedia(query: string) {
  const matches = ref<boolean>()
  let media: MediaQueryList | undefined
  const sync = () => { matches.value = media?.matches }
  onMounted(() => { media = window.matchMedia?.(query); media?.addEventListener('change', sync); sync() })
  onBeforeUnmount(() => media?.removeEventListener('change', sync))
  return matches
}

export function useLocalStorage<T>(key: string, defaultValue?: () => T) {
  const state = ref<T>()
  const ready = ref(false)
  const fallback = defaultValue?.()
  const fetch = () => {
    const raw = getThemeSync(key)
    let value: unknown = raw
    if (raw !== null) { try { value = JSON.parse(raw) } catch { value = raw } }
    state.value = (value ?? fallback) as typeof state.value
    ready.value = true
  }
  const handle = (event: StorageEvent) => { if (event.storageArea === localStorage && event.key === key) fetch() }
  onMounted(() => { fetch(); window.addEventListener('storage', handle) })
  onBeforeUnmount(() => window.removeEventListener('storage', handle))
  const set = (value: T | undefined) => {
    state.value = value as typeof state.value
    if (typeof window === 'undefined') return
    try {
      if (value === undefined) localStorage.removeItem(key)
      else localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
      window.dispatchEvent(new StorageEvent('storage', { key, storageArea: localStorage, url: location.href }))
    } catch { ready.value = true }
  }
  return [computed(() => state.value ?? fallback), set, ready] as const
}

export function useTheme(key = LOCAL_STORAGE_KEY) {
  assertKeyString(key)
  const dark = useMedia('(prefers-color-scheme: dark)')
  const [local, set, ready] = useLocalStorage<string>(key)
  const system = computed(() => local.value === undefined)
  const current = computed(() => !ready.value || dark.value === undefined ? undefined : local.value ?? (dark.value ? 'dark' : 'light'))
  return [current, set, system] as const
}
export function useThemeSetter({ key = LOCAL_STORAGE_KEY, setter = themeSetter() }: { key?: string; setter?: (theme: string | undefined) => void } = {}) {
  const [theme, , system] = useTheme(key)
  watchEffect(() => { if (theme.value !== undefined) setter(system.value ? undefined : theme.value) })
}

export function makeSetThemeScriptCode({ localStorageKey = LOCAL_STORAGE_KEY, rootAttribute = DEFAULT_ROOT_ATTRIBUTE }: { localStorageKey?: string; rootAttribute?: string } = {}) {
  assertKeyString(localStorageKey); assertKeyString(rootAttribute)
  return `"use strict";(function(){try{var t=localStorage.getItem(${JSON.stringify(localStorageKey)});if(t)document.documentElement.dataset[${JSON.stringify(rootAttribute)}]=t}catch(e){}})();`
}
export const SetThemeScript = defineComponent({
  name: 'SetThemeScript', props: { localStorageKey: String, rootAttribute: String },
  setup(props, { attrs }) { return () => h('script', { ...attrs, innerHTML: makeSetThemeScriptCode(props) }) }
})

type TokenTheme = Pick<CharcoalAbstractTheme, 'color' | 'effect' | 'border'>
export function defineThemeVariables(colors: Partial<CharcoalAbstractTheme['color']>, effects?: Partial<CharcoalAbstractTheme['effect']>) {
  return ({ theme }: { theme: Pick<CharcoalAbstractTheme, 'effect'> }) => {
    const values: Record<string, string> = {}
    for (const [name, color] of Object.entries(colors)) {
      if (color == null) continue
      values[customPropertyToken(name)] = color
      for (const [effectName, effect] of Object.entries({ ...theme.effect, ...effects })) {
        values[customPropertyToken(name, [effectName])] = applyEffect(color, [effect])
      }
    }
    return values
  }
}
export function themeToVariables(theme: TokenTheme) {
  const borders = Object.fromEntries(Object.entries(theme.border).map(([name, value]) => [`border-${name}`, value.color]))
  return defineThemeVariables({ ...theme.color, ...borders })({ theme })
}
export const TokenInjector = defineComponent({
  name: 'TokenInjector',
  props: { theme: { type: Object as PropType<Record<string, TokenTheme>>, required: true }, background: String },
  setup(props, { attrs }) {
    return () => h('style', attrs, Object.entries(props.theme).map(([selector, theme]) => {
      let css = Object.entries(themeToVariables(theme)).map(([key, value]) => `${key}:${value}`).join(';')
      if (props.background && theme.color[props.background]) css += `;background-color:${theme.color[props.background]}`
      return selector.startsWith('@media') ? `${selector}{:root{${css}}}` : `${selector}{${css}}`
    }).join('\n'))
  }
})
const ThemeKey: InjectionKey<ComputedRef<CharcoalTheme>> = Symbol('annexus-theme')
export const ThemeProvider = defineComponent({
  name: 'ThemeProvider', props: { theme: { type: Object as PropType<CharcoalTheme>, default: () => light } },
  setup(props, { slots }) { provide(ThemeKey, computed(() => props.theme)); return () => h('div', { style: { display: 'contents', ...themeToVariables(props.theme) } }, slots.default?.()) }
})
export const useThemeObject = () => inject(ThemeKey, computed(() => light))
