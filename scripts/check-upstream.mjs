import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const source = resolve(process.env.CHARCOAL_SOURCE ?? (existsSync('tests/upstream/charcoal') ? 'tests/upstream/charcoal' : '../charcoal'))
const manifest = JSON.parse(readFileSync('scripts/upstream.json', 'utf8'))
assert.equal(execFileSync('git', ['-C', source, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), manifest.commit)
execFileSync('python3', ['scripts/sync-upstream.py', source, '--check'], { stdio: 'inherit' })
const ours = readFileSync('src/index.ts', 'utf8')
const original = readFileSync(`${source}/packages/react/src/index.ts`, 'utf8')
for (const match of original.matchAll(/export\s*\{([\s\S]*?)\}\s*from/g)) {
  for (const item of match[1].split(',').map(item => item.trim()).filter(Boolean)) {
    const name = item.replace(/^type\s+/, '').split(/\s+as\s+/).at(-1)
    assert(new RegExp(`\\b${name}\\b`).test(ours), `Missing export ${name}`)
  }
}
console.log('Upstream source, component exports, styles, and 826 icons verified')
