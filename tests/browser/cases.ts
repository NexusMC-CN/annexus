export type Node = string | number | null | { type: string; props: Record<string, any>; children: Node[] }
export const n = (type: string, props: Record<string, any> = {}, ...children: Node[]): Node => ({ type, props, children })
const row = (...children: Node[]) => n('div', { className: 'row' }, ...children)
const field = (node: Node) => n('div', { className: 'field' }, node)
export const initial = { checkbox: false, switch: false, radio: 'a', multi: ['a'], text: '', area: '', segment: 'one', page: 6, select: 'a', modal: false, nested: false, clicks: 0 }

export function fixture(name: string, state: typeof initial, set: (key: string, value: any) => void): Node {
  const update = (key: string) => (value: any) => set(key, value)
  let children: Node[] = []
  if (name === 'defaults') children = [n('form', {},
    n('TextField', { label: 'Default field', defaultValue: 'start', showCount: true, showLabel: true }),
    n('TextArea', { label: 'Default area', defaultValue: 'start', showCount: true, showLabel: true }),
    n('Checkbox', { defaultChecked: true }, 'Default checkbox'), n('Switch', { defaultChecked: true }, 'Default switch'),
    n('Button', { type: 'reset' }, 'Reset')),
    n('TextField', { label: 'Controlled field', value: 'fixed', onChange: () => {}, showCount: true, showLabel: true }),
    n('TextArea', { label: 'Controlled area', value: 'fixed', onChange: () => {}, showCount: true, showLabel: true }),
    n('Checkbox', { checked: false, onChange: () => {} }, 'Controlled checkbox'), n('Switch', { checked: false, onChange: () => {} }, 'Controlled switch')]
  if (name === 'spinners') children = [row(...[24, 48, 64].map(size => n('LoadingSpinner', { size, padding: 8 })), n('LoadingSpinner', { transparent: true }), n('LoadingSpinnerIcon', { once: true }))]
  if (name === 'buttons') children = [
    ...['M', 'S'].map(size => row(...['Default', 'Primary', 'Overlay', 'Danger', 'Navigation'].flatMap(variant => [n('Button', { variant, size, onClick: () => set('clicks', state.clicks + 1) }, variant), n('Button', { variant, size, disabled: true }, variant)]))),
    row(...['M', 'S', 'XS'].flatMap(size => ['Default', 'Primary', 'Overlay', 'Navigation'].map(variant => n('IconButton', { size, variant, icon: size === 'XS' ? '16/Add' : '24/Add', 'aria-label': `${variant}-${size}` })))),
    row(n('Button', { isActive: true }, 'Active'), n('Button', { component: 'a', href: '#link' }, 'Link'), n('Clickable', { component: 'a', href: '#click' }, 'Clickable')),
    field(n('Button', { fullWidth: true, variant: 'Primary' }, 'Full width')), n('output', {}, String(state.clicks))
  ]
  if (name === 'forms') children = [
    row(n('Checkbox', { checked: state.checkbox, onChange: update('checkbox'), name: 'check' }, 'Checkbox'), n('Checkbox', { defaultChecked: true, rounded: true }, 'Rounded'), n('Checkbox', { checked: true, disabled: true }, 'Disabled'), n('Checkbox', { invalid: true }, 'Invalid')),
    row(n('Switch', { checked: state.switch, onChange: update('switch') }, 'Switch'), n('Switch', { defaultChecked: true }, 'Enabled'), n('Switch', { checked: true, disabled: true }, 'Disabled')),
    n('RadioGroup', { name: 'radio', value: state.radio, onChange: update('radio') }, row(n('Radio', { value: 'a' }, 'Alpha'), n('Radio', { value: 'b' }, 'Beta'), n('Radio', { value: 'c', disabled: true }, 'Gamma'))),
    n('MultiSelectGroup', { name: 'multi', label: 'Multi', selected: state.multi, onChange: update('multi') }, row(n('MultiSelect', { value: 'a' }, 'Option A'), n('MultiSelect', { value: 'b' }, 'Option B'), n('MultiSelect', { value: 'c', disabled: true }, 'Option C'))),
    row(field(n('TextField', { label: 'Name', showLabel: true, value: state.text, onChange: update('text'), prefix: '@', suffix: 'USD', showCount: true, maxLength: 20, required: true, requiredText: 'Required', subLabel: 'Public', assistiveText: 'Enter a name', placeholder: 'Name' })), field(n('TextField', { label: 'Invalid', showLabel: true, defaultValue: 'Invalid value', invalid: true, assistiveText: 'Required field' }))),
    row(field(n('TextField', { label: 'Disabled', showLabel: true, disabled: true, defaultValue: 'Disabled value' })), field(n('TextField', { label: 'Hidden', placeholder: 'Hidden label' }))),
    row(field(n('TextArea', { label: 'Description', showLabel: true, value: state.area, onChange: update('area'), showCount: true, maxLength: 100, autoHeight: true, maxRows: 6, assistiveText: 'Describe it' })), field(n('TextArea', { label: 'Invalid area', showLabel: true, defaultValue: 'One\nTwo', invalid: true, assistiveText: 'Invalid', disabled: true }))),
    n('output', { 'data-testid': 'state' }, JSON.stringify(state))
  ]
  if (name === 'selection') children = [
    row(n('SegmentedControl', { name: 'segment', data: ['one', 'two', { value: 'three', label: 'three', disabled: true }], value: state.segment, onChange: update('segment') })),
    row(n('SegmentedControl', { data: ['First', 'Second'], value: 'First', uniformSegmentWidth: true, disabled: true })),
    field(n('SegmentedControl', { data: ['One', 'Two'], value: 'One', fullWidth: true, uniformSegmentWidth: true })),
    n('Pagination', { page: state.page, pageCount: 20, onChange: update('page') }),
    n('Pagination', { page: 1, pageCount: 3, onChange: () => {} }),
    n('Pagination', { page: 10, pageCount: 10, makeUrl: (page: number) => `#${page}` }),
    field(n('DropdownSelector', { label: 'Choice', showLabel: true, value: state.select, onChange: update('select'), name: 'choice', assistiveText: 'Choose one', required: true, requiredText: 'Required' },
      n('DropdownMenuItem', { value: 'a', secondary: 'First choice' }, 'Alpha'), n('DropdownMenuItem', { value: 'disabled', disabled: true }, 'Disabled'), n('MenuItemGroup', { text: 'Group' }, n('DropdownMenuItem', { value: 'b' }, 'Beta'), n('DropdownMenuItem', { value: 'c' }, 'Gamma')))),
    field(n('DropdownSelector', { label: 'Empty', placeholder: 'Choose', value: '', disabled: true }, n('DropdownMenuItem', { value: 'a' }, 'Alpha'))),
    n('output', { 'data-testid': 'state' }, JSON.stringify(state))
  ]
  if (name === 'content') children = [
    row(...['default', 'active', 'inactive'].map(status => n('TagItem', { status, label: 'Illustration', translatedLabel: 'Artwork', href: '#tag' })), n('TagItem', { label: 'Color', bgColor: '#246' })),
    n('HintText', {}, 'Information'), n('HintText', { context: 'page' }, 'Danger'), n('HintText', { context: 'section' }, 'Success'),
    row(n('div', { className: 'clip' }, n('TextEllipsis', { lineLimit: 1, showTooltip: true }, 'A long label that should be truncated after the first line')), n('div', { className: 'clip' }, n('TextEllipsis', { lineLimit: 2, lineHeight: 22, showTooltip: true }, 'A long description that should be truncated after two lines of content. More text follows.'))),
    row(n('Icon', { name: '24/Add' }), n('Icon', { name: '24/Close', fixedSize: 48 }), n('V1Add24'), n('V2Check24')),
    n('UnstableSnackbar', { message: 'Saved successfully', action: n('Button', { size: 'S' }, 'Undo') }),
    n('div', { className: 'fixed' }, n('Carousel', { size: 'M', indicator: true }, ...Array.from({ length: 8 }, (_, i) => n('div', { className: 'tile' }, i + 1))))
  ]
  if (name === 'modal') children = [
    n('Button', { onClick: () => set('modal', true) }, 'Open modal'),
    n('Modal', { title: 'Dialog title', isOpen: state.modal, isDismissable: true, bottomSheet: true, onClose: () => set('modal', false) }, n('ModalHeader'), n('ModalBody', {}, n('TextField', { label: 'Dialog input', showLabel: true }), n('Button', { onClick: () => set('nested', true) }, 'Nested')), n('ModalButtons', {}, n('Button', { onClick: () => set('modal', false) }, 'Cancel'), n('Button', { variant: 'Primary', onClick: () => set('modal', false) }, 'Save')),
      n('Modal', { title: 'Nested dialog', isOpen: state.nested, isDismissable: true, onClose: () => set('nested', false) }, n('ModalHeader'), n('ModalBody', {}, 'Nested content'), n('ModalButtons', {}, n('Button', { onClick: () => set('nested', false) }, 'Back'))))
  ]
  if (name === 'sandbox') children = [
    n('S.Filter', {}, n('S.FilterButton', { active: true }, 'Active'), n('S.FilterButton', {}, 'Filter'), n('S.FilterButton', { disabled: true }, 'Disabled'), n('S.FilterLink', { href: '#filter' }, 'Link'), n('S.FilterIconButton', { 'aria-label': 'Add filter' }, n('V1Add24'))),
    row(n('S.SwitchCheckbox', { checked: state.checkbox, onChange: (event: Event) => set('checkbox', (event.target as HTMLInputElement).checked) }, 'Switch checkbox'), n('S.SwitchCheckbox', { checked: true, disabled: true }, 'Disabled')),
    n('S.HintText', { context: 'section' }, 'Legacy information'),
    row(n('S.WithIcon', { icon: n('V1Add24') }, 'With icon'), n('S.WithIcon', { icon: n('V1Add24'), prefix: true, fit: true }, 'Prefix'), n('div', { className: 'clip' }, n('S.TextEllipsis', { lineLimit: 2 }, 'Legacy ellipsis. A long description that should be truncated after two lines of content. More text follows.'))),
    n('div', { className: 'menu' }, n('S.MenuListLabel', {}, 'Navigation'), n('S.MenuListItem', { primary: 'Primary', secondary: 'Secondary', onClick: () => {} }), n('S.MenuListItemWithIcon', { primary: 'With icon', icon: n('V1Add24') }), n('S.MenuListLinkItem', { primary: 'Link', link: '#link' }), n('S.MenuListItem', { primary: 'Disabled', disabled: true }), n('S.MenuListSpacer')),
    n('S.Pager', { page: state.page, pageCount: 20, onChange: update('page') }),
    n('div', { className: 'fixed' }, n('S.Carousel', {}, ...Array.from({ length: 8 }, (_, i) => n('div', { className: 'tile' }, i + 1))))
  ]
  if (name === 'layout') children = [n('S.Layout', { menu: n('S.LeftMenu', { links: [{id:'home',text:'Home',to:'#home'}], active:'home' }), header: n('div', {}, 'Header') }, n('S.LayoutItem', { span: 1 }, n('S.LayoutItemHeader', {}, 'Section'), n('S.LayoutItemBody', {}, 'Body')), n('S.LayoutItem', { span: 2 }, n('S.LayoutItemHeader', {}, 'Wide'), n('S.LayoutItemBody', {}, 'Wide body')))]
  return n('div', { className: 'fixture', 'data-testid': 'fixture' }, ...children)
}
