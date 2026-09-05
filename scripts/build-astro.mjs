import { cp, mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { execFileSync, spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'

const root = resolve('.cache/astro-consumer')
await mkdir(root, { recursive: true })
await cp('tests/astro', root, { recursive: true })
const packed = JSON.parse(await readFile('.cache/artifacts/package.json', 'utf8'))
await writeFile(`${root}/package.json`, JSON.stringify({ private: true, type: 'module', dependencies: { '@nexusmc/annexus': `file:${resolve('.cache/artifacts', packed.filename)}`, astro: '5.18.1', '@astrojs/vue': '5.1.4', '@astrojs/node': '9.5.5', vue: '3.5.31' } }))
await rm(`${root}/node_modules/@nexusmc/annexus`, { recursive: true, force: true })
execFileSync('npm', ['install', '--no-audit', '--no-fund'], { cwd: root, stdio: 'inherit' })
const tree = JSON.parse(spawnSync('npm', ['ls', 'react', 'react-dom', 'styled-components', '--json'], { cwd: root, encoding: 'utf8' }).stdout || '{}')
assert(!tree.dependencies || Object.keys(tree.dependencies).length === 0, 'React leaked into the Vue consumer')
execFileSync(process.execPath, ['node_modules/astro/astro.js', 'build'], { cwd: root, stdio: 'inherit', env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' } })
