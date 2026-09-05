import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

enableAutoUnmount(afterEach)
Object.defineProperty(window, 'matchMedia', { writable: true, value: vi.fn(query => ({ matches: false, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => true })) })
globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} }
globalThis.IntersectionObserver = class { root = null; rootMargin = ''; thresholds = []; observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
HTMLElement.prototype.scrollIntoView = vi.fn()
afterEach(() => { document.body.innerHTML = ''; document.body.removeAttribute('style'); localStorage.clear(); vi.useRealTimers() })
