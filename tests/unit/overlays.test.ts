import { expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { Modal, ModalHeader, Button, DropdownSelector, DropdownMenuItem, MenuItemGroup, unstable_useSnackbar } from '../../src'

it('restores focus and document state after nested modals', async () => {
  const open = ref(false); const nested = ref(false)
  const host = mount(defineComponent(() => () => h('main', {}, [h(Button, { onClick: () => { open.value = true } }, () => 'Open'), h(Modal, { title: 'Outer', isOpen: open.value, isDismissable: true, onClose: () => { open.value = false } }, () => [h(ModalHeader), h(Button, { onClick: () => { nested.value = true } }, () => 'Nested'), h(Modal, { title: 'Inner', isOpen: nested.value, isDismissable: true, onClose: () => { nested.value = false } }, () => h(Button, {}, () => 'Inner button'))])])), { attachTo: document.body })
  host.get('button').element.focus()
  await host.get('button').trigger('click'); await flushPromises()
  expect(document.body.style.overflow).toBe('hidden')
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(1)
  ;(document.querySelector('[role="dialog"] button') as HTMLButtonElement).click(); await flushPromises()
  expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2)
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await flushPromises()
  expect(nested.value).toBe(false); expect(open.value).toBe(true)
  expect(document.body.style.overflow).toBe('hidden')
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await flushPromises()
  expect(document.body.style.overflow).toBe('')
  expect(document.activeElement).toBe(host.get('button').element)
  expect(host.element.hasAttribute('inert')).toBe(false)
})
it('selects grouped dropdown options and returns focus', async () => {
  const value = ref('a')
  const host = mount(defineComponent(() => () => h(DropdownSelector, { label: 'Choice', name: 'choice', modelValue: value.value, 'onUpdate:modelValue': next => { value.value = next } }, () => [h(DropdownMenuItem, { value: 'a' }, () => 'Alpha'), h(MenuItemGroup, { text: 'Group' }, () => [h(DropdownMenuItem, { value: 'b' }, () => 'Beta')])])), { attachTo: document.body })
  await host.get('button').trigger('click'); await flushPromises()
  expect(document.activeElement?.textContent).toContain('Alpha')
  ;(document.querySelector('[data-key="b"]') as HTMLElement).click(); await flushPromises()
  expect(value.value).toBe('b')
  expect(host.get('select').element.value).toBe('b')
  expect(document.querySelector('.charcoal-popover')).toBeNull()
  expect(document.activeElement).toBe(host.get('button').element)
})
it('queues notifications and reports action closure once', async () => {
  vi.useFakeTimers(); const closed = vi.fn()
  let show!: ReturnType<typeof unstable_useSnackbar>[1]
  mount(defineComponent({ setup() { const [Region, trigger] = unstable_useSnackbar({ duration: 1000 }); show = trigger; return () => h(Region) } }), { attachTo: document.body })
  show('First', { action: () => h('button', {}, 'Undo'), onClose: closed }); show('Second'); await nextTick()
  expect(document.querySelector('[role="status"]')?.textContent).toBe('First')
  ;(document.querySelector('.charcoal-snackbar button') as HTMLButtonElement).click()
  await vi.advanceTimersByTimeAsync(401)
  expect(closed).toHaveBeenCalledExactlyOnceWith('action')
  expect(document.querySelector('[role="status"]')?.textContent).toBe('Second')
  await vi.advanceTimersByTimeAsync(1800)
  expect(document.querySelector('[role="status"]')).toBeNull()
})
