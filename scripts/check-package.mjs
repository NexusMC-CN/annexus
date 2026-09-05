import { readFile, access, mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import assert from 'node:assert/strict'

const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const require = createRequire(import.meta.url)
for (const [key, target] of Object.entries(pkg.exports)) {
  for (const file of typeof target === 'string' ? [target] : Object.values(target)) await access(file)
  if (typeof target === 'object') {
    const name = pkg.name + (key === '.' ? '' : key.slice(1))
    const esm = await import(name)
    const cjs = require(name)
    assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort(), name)
  }
}
assert(!Object.keys(pkg.dependencies).some(name => /react|styled-components/.test(name)))
await mkdir('.cache/artifacts', { recursive: true })
const [packed] = JSON.parse(execFileSync('npm', ['pack', '--json', '--pack-destination', '.cache/artifacts'], { encoding: 'utf8' }))
assert(packed.files.every(({ path }) => path.startsWith('dist/') || ['README.md', 'package.json'].includes(path)))
assert(packed.files.some(({ path }) => path === 'dist/index.d.ts'))
await writeFile('.cache/artifacts/package.json', JSON.stringify(packed))
console.log(`Package: ${packed.filename}; ${packed.entryCount} files; ${packed.size} bytes`)
