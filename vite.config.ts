import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'

const upstream = resolve(process.env.CHARCOAL_SOURCE ?? (existsSync('tests/upstream/charcoal') ? 'tests/upstream/charcoal' : '../charcoal'))

export default defineConfig(({ command }) => ({
  plugins: [vue(), ...(command === 'serve' ? [react(), {
    name: 'reference-dependencies',
    async resolveId(id: string, importer?: string) {
      if (importer?.startsWith(upstream) && !id.startsWith('.') && !id.startsWith('/') && !id.startsWith('reference-')) {
        return this.resolve(id, resolve('tests/browser/react.tsx'), { skipSelf: true })
      }
    }
  }] : [])],
  root: command === 'serve' ? 'tests/browser' : '.',
  resolve: { alias: { 'reference-core': resolve(upstream, 'packages/react/src'), 'reference-sandbox': resolve(upstream, 'packages/react-sandbox/src'), 'reference-icons-v1': resolve(upstream, 'packages/icons/src/react/v1'), 'reference-icons-v2': resolve(upstream, 'packages/icons/src/react/v2'), 'react': resolve('node_modules/react'), 'react-dom': resolve('node_modules/react-dom') }, dedupe: ['react', 'react-dom', 'vue', 'styled-components'] },
  server: { fs: { allow: [resolve('.'), upstream] } },
  build: {
    lib: {
      entry: Object.fromEntries(['index', 'sandbox/index', 'theme', 'foundation', 'utils', 'tailwind-config', 'icons/v1/index', 'icons/v2/index'].map(name => [name, resolve(`src/${name}.ts`)])),
      formats: ['es', 'cjs'],
      fileName: (format, name) => `${name}.${format === 'es' ? 'js' : 'cjs'}`,
      cssFileName: 'index'
    },
    minify: false,
    reportCompressedSize: false,
    sourcemap: true,
    rollupOptions: {
      external: id => id === 'vue' || id.startsWith('@charcoal-ui/'),
      output: { preserveModules: true, preserveModulesRoot: 'src', exports: 'named' }
    }
  }
}))
