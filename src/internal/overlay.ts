const focusable = 'button:not(:disabled),[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])'
type Layer = { element: HTMLElement; restore?: HTMLElement; escape?: () => void }
type DocumentState = { layers: Layer[]; overflow?: string; paddingRight?: string; hidden: Map<HTMLElement, { aria: string | null; inert: boolean }> }
const documents = new WeakMap<Document, DocumentState>()

export function activateOverlay(element: HTMLElement, options: { escape?: () => void; restore?: HTMLElement; contain?: boolean; overflowClip?: boolean } = {}) {
  const doc = element.ownerDocument
  let state = documents.get(doc)
  if (!state) { state = { layers: [], hidden: new Map() }; documents.set(doc, state) }
  const current = state
  const layer: Layer = { element, restore: options.restore ?? (doc.activeElement instanceof HTMLElement ? doc.activeElement : undefined), escape: options.escape }
  if (current.layers.length === 0) {
    current.overflow = doc.body.style.overflow
    current.paddingRight = doc.body.style.paddingRight
    const width = (doc.defaultView?.innerWidth ?? 0) - doc.documentElement.clientWidth
    if (width > 0 && doc.documentElement.clientWidth > 0) doc.body.style.paddingRight = `${width + parseFloat(getComputedStyle(doc.body).paddingRight || '0')}px`
    doc.body.style.overflow = options.overflowClip ? 'clip' : 'hidden'
  }
  current.layers.push(layer)
  function refresh() {
    for (const [node, previous] of current.hidden) {
      if (previous.aria === null) node.removeAttribute('aria-hidden'); else node.setAttribute('aria-hidden', previous.aria)
      node.inert = previous.inert
    }
    current.hidden.clear()
    const top = current.layers.at(-1)?.element
    if (!top) return
    let child = top
    while (child.parentElement) {
      for (const node of child.parentElement.children) {
        if (!(node instanceof HTMLElement) || node === child || ['SCRIPT', 'STYLE', 'LINK'].includes(node.tagName) || node.hasAttribute('data-annexus-live')) continue
        current.hidden.set(node, { aria: node.getAttribute('aria-hidden'), inert: node.inert })
        node.setAttribute('aria-hidden', 'true'); node.inert = true
      }
      child = child.parentElement
      if (child === doc.body) break
    }
  }
  refresh()
  const observer = new MutationObserver(refresh)
  observer.observe(doc.body, { childList: true })
  function keydown(event: KeyboardEvent) {
    if (current.layers.at(-1) !== layer) return
    if (event.key === 'Escape' && layer.escape) { event.preventDefault(); event.stopPropagation(); layer.escape() }
    if (event.key !== 'Tab' || options.contain === false) return
    const targets = Array.from(element.querySelectorAll<HTMLElement>(focusable)).filter(node => !node.closest('[inert]') && !node.hidden && node.getClientRects().length > 0)
    const first = targets[0]; const last = targets.at(-1)
    if (!first) { event.preventDefault(); element.focus(); return }
    if (event.shiftKey && (doc.activeElement === first || doc.activeElement === element)) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && (doc.activeElement === last || doc.activeElement === element)) { event.preventDefault(); first.focus() }
  }
  function focusin(event: FocusEvent) {
    if (options.contain === false || current.layers.at(-1) !== layer || element.contains(event.target as Node) || (event.target instanceof Element && event.target.closest('[data-annexus-live]'))) return
    element.focus({ preventScroll: true })
  }
  doc.addEventListener('keydown', keydown, true); doc.addEventListener('focusin', focusin, true)
  let released = false
  return () => {
    if (released) return
    released = true
    observer.disconnect()
    doc.removeEventListener('keydown', keydown, true); doc.removeEventListener('focusin', focusin, true)
    const index = current.layers.indexOf(layer)
    const wasTop = index === current.layers.length - 1
    if (index >= 0) current.layers.splice(index, 1)
    refresh()
    if (current.layers.length === 0) {
      doc.body.style.overflow = current.overflow ?? ''
      doc.body.style.paddingRight = current.paddingRight ?? ''
    }
    if (wasTop && layer.restore?.isConnected) layer.restore.focus({ preventScroll: true })
  }
}
