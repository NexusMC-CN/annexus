import js from '@eslint/js'
import ts from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import globals from 'globals'

export default ts.config(
  { ignores: ['dist/**', 'node_modules/**', '.cache/**', 'tests/upstream/**', 'test-results/**', 'playwright-report/**', 'src/icons/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  ...vue.configs['flat/essential'],
  { languageOptions: { globals: { ...globals.browser, ...globals.node }, parserOptions: { parser: ts.parser } }, rules: { 'vue/multi-word-component-names': 'off', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }], '@typescript-eslint/no-explicit-any': 'off' } }
)
