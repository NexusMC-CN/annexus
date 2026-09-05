import { defineComponent, h } from 'vue'
export type CharcoalProviderProps = Record<string, never>
export const SSRProvider = defineComponent({ name: 'SSRProvider', setup(_, { slots }) { return () => slots.default?.() } })
export const OverlayProvider = defineComponent({ name: 'OverlayProvider', setup(_, { slots, attrs }) { return () => h('div', { ...attrs, 'data-overlay-container': true }, slots.default?.()) } })
export const CharcoalProvider = OverlayProvider
export const AnnexusProvider = OverlayProvider
