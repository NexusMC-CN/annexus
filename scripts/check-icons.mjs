import { build } from 'esbuild'
import { JSDOM } from 'jsdom'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createSSRApp, h } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { mkdir } from 'node:fs/promises'
import assert from 'node:assert/strict'

await mkdir('.cache', { recursive: true })
const document = new JSDOM('').window.document
function shape(markup) {
  const template = document.createElement('template'); template.innerHTML = markup
  function tree(element) { return { name: element.tagName, attributes: Object.fromEntries([...element.attributes].map(({ name, value }) => [name, value]).sort()), children: [...element.children].map(tree) } }
  return tree(template.content.firstElementChild)
}
let total = 0
for (const version of ['v1', 'v2']) {
  const outfile = `.cache/reference-icons-${version}.mjs`
  await build({ entryPoints: [`node_modules/@charcoal-ui/icons/react/${version}/index.js`], bundle: true, platform: 'node', format: 'esm', external: ['react'], outfile })
  const reference = await import(`../${outfile}`)
  const actual = await import(`../dist/icons/${version}/index.js`)
  assert.deepEqual(Object.keys(actual).sort(), Object.keys(reference).sort())
  for (const name of Object.keys(reference)) {
    assert.deepEqual(shape(await renderToString(createSSRApp({ render: () => h(actual[name], { 'aria-label': name, class: 'icon' }) }))), shape(renderToStaticMarkup(createElement(reference[name], { 'aria-label': name, className: 'icon' }))), name)
    total++
  }
}
assert.equal(total, 826)
console.log(`${total} SVG render trees match upstream`)
