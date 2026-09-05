import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { h, nextTick, ref, defineComponent } from 'vue'
import { Checkbox, Switch, TextField, TextArea, RadioGroup, Radio, MultiSelectGroup, MultiSelect, SegmentedControl, Pagination, TagItem } from '../../src'

describe.each([Checkbox, Switch])('$name', component => {
  it('supports v-model and boolean change events', async () => {
    const checked = ref(false)
    const change = vi.fn()
    const host = mount(defineComponent(() => () => h(component, { modelValue: checked.value, 'onUpdate:modelValue': value => { checked.value = value }, onChange: change }, () => 'Choice')))
    await host.get('input').setValue(true)
    expect(checked.value).toBe(true)
    expect(change).toHaveBeenCalledWith(true)
    expect(host.get('label').attributes('for')).toBe(host.get('input').attributes('id'))
    checked.value = false; await nextTick()
    expect(host.get('input').element.checked).toBe(false)
  })
  it('keeps a controlled value when the parent declines the change', async () => {
    const host = mount(component, { props: { checked: false } })
    await host.get('input').setValue(true)
    expect(host.get('input').element.checked).toBe(false)
  })
  it('changes an uncontrolled initial value', async () => {
    const host = mount(component, { props: { defaultChecked: true } })
    expect(host.get('input').element.checked).toBe(true)
    await host.get('input').setValue(false)
    expect(host.get('input').element.checked).toBe(false)
  })
})
describe.each([TextField, TextArea])('$name', component => {
  it('counts Unicode characters and forwards values', async () => {
    const host = mount(component as typeof TextField, { props: { label: 'Name', showCount: true, maxLength: 8, defaultValue: '😀é', assistiveText: 'Help' } })
    const input = host.get('input,textarea')
    expect(host.text()).toContain(component === TextField ? '0/8' : '2/8')
    await input.setValue('Vue😀')
    expect(host.emitted('change')?.[0]).toEqual(['Vue😀'])
    expect(host.text()).toContain('4/8')
    expect(input.attributes('aria-describedby')).toBe(host.get('.charcoal-text-field-assistive-text').attributes('id'))
  })
  it('does not change a controlled value without an update', async () => {
    const host = mount(component as typeof TextField, { props: { value: 'original' } })
    await host.get('input,textarea').setValue('other')
    expect((host.get('input,textarea').element as HTMLInputElement).value).toBe('original')
  })
})
it('supports textarea imperative updates without reporting user input', async () => {
  const host = mount(TextArea, { props: { defaultValue: 'start', showCount: true } })
  host.vm.setValue('new\nvalue'); await nextTick()
  expect(host.get('textarea').element.value).toBe('new\nvalue')
  expect(host.emitted('change')).toBeUndefined()
})
it('shares selection, name, and disabled state in radio groups', async () => {
  const value = ref('a')
  const host = mount(defineComponent(() => () => h(RadioGroup, { value: value.value, name: 'group', onChange: next => { value.value = next } }, () => [h(Radio, { value: 'a' }, () => 'Alpha'), h(Radio, { value: 'b' }, () => 'Beta'), h(Radio, { value: 'c', disabled: true }, () => 'Disabled')])))
  await host.findAll('input')[1].setValue(true)
  expect(value.value).toBe('b')
  expect(host.findAll('input').map(input => input.element.checked)).toEqual([false, true, false])
  expect(host.findAll('input').every(input => input.attributes('name') === 'group')).toBe(true)
  expect(host.findAll('input')[2].element.disabled).toBe(true)
})
it('adds and removes multi selections without duplicates', async () => {
  const value = ref(['a'])
  const host = mount(defineComponent(() => () => h(MultiSelectGroup, { name: 'multi', label: 'Multi', selected: value.value, onChange: next => { value.value = next } }, () => ['a', 'b'].map(key => h(MultiSelect, { value: key }, () => key)))))
  await host.findAll('input')[1].setValue(true)
  expect(value.value).toEqual(['a', 'b'])
  await host.findAll('input')[0].setValue(false)
  expect(value.value).toEqual(['b'])
})
it('skips disabled segmented items during keyboard navigation', async () => {
  const host = mount(SegmentedControl, { props: { name: 'segment', defaultValue: 'a', data: ['a', { value: 'b', label: 'b', disabled: true }, 'c'] }, attachTo: document.body })
  await host.findAll('input')[0].trigger('keydown', { key: 'ArrowRight' })
  expect(host.emitted('change')?.[0]).toEqual(['c'])
})
it('generates button and link pagination windows', async () => {
  const host = mount(Pagination, { props: { page: 6, pageCount: 20 } })
  expect(host.get('[aria-current]').text()).toBe('6')
  await host.get('[aria-label="Next"]').trigger('click')
  expect(host.emitted('change')?.[0]).toEqual([7])
  const links = mount(Pagination, { props: { page: 1, pageCount: 3, makeUrl: page => `/page/${page}` } })
  expect(links.findAll('a').some(a => a.attributes('href') === '/page/2')).toBe(true)
})
it('prevents disabled tags from navigating', async () => {
  const click = vi.fn()
  const host = mount(TagItem, { props: { label: 'Tag', disabled: true }, attrs: { href: '/destination', onClick: click } })
  expect(host.attributes('href')).toBeUndefined()
  await host.trigger('click')
  expect(click).not.toHaveBeenCalled()
})
