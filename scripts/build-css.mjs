import fs from 'node:fs/promises'
import path from 'node:path'
import postcss from 'postcss'
import nested from 'postcss-nested'
import autoprefixer from 'autoprefixer'
import { light, dark } from '@charcoal-ui/theme'
import { themeToVariables } from '../dist/core/theme.js'

const css = await fs.readFile('dist/index.css', 'utf8')
await fs.writeFile('dist/layered.css', `@layer charcoal {\n${css}\n}\n`)
const rule = (selector, theme) => `${selector}{${Object.entries(themeToVariables(theme)).map(([k,v]) => `${k}:${v}`).join(';')}}`
let themes = rule(':root', light) + '\n' + rule(':root[data-theme="dark"]', dark) + '\n' + rule(':root[data-theme="light"]', light)
themes += '\n@media(prefers-color-scheme:dark){' + rule(':root:not([data-theme])', dark) + '}\n'
for (const file of ['v1/remap', 'v2/light', 'v2/dark']) themes += await fs.readFile(`src/styles/theme/${file}.css`, 'utf8')
await fs.writeFile('dist/theme.css', (await postcss([nested(), autoprefixer()]).process(themes, { from: undefined })).css)
for (const name of ['v1/remap', 'v2/light', 'v2/dark']) {
  await fs.mkdir(path.dirname(`dist/theme/${name}.css`), { recursive: true })
  await fs.copyFile(`src/styles/theme/${name}.css`, `dist/theme/${name}.css`)
}
