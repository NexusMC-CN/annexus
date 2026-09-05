import { build } from 'vite'
import { gzipSync } from 'node:zlib'
import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const result = await build({ configFile: false, logLevel: 'error', build: { write: false, minify: true, rollupOptions: { input: 'dist/components/Button.vue.js', preserveEntrySignatures: 'strict', external: ['vue'], output: { format: 'es' } } } })
const chunks = result.output.filter(item => item.type === 'chunk')
const size = chunks.reduce((bytes, item) => bytes + gzipSync(item.code).byteLength, 0)
assert(size < 2048, `Button unexpectedly grew: ${size} gzip bytes`)
assert(!chunks.some(item => Object.keys(item.modules).some(id => /react|styled-components|icons\/v[12]/.test(id))))
const css = gzipSync(await readFile('dist/index.css')).byteLength
assert(css < 18000, `CSS unexpectedly grew: ${css} gzip bytes`)
console.log(`Button: ${size} gzip bytes; styles: ${css} gzip bytes`)
