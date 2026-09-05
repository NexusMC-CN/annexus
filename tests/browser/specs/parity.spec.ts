import { test, expect, type Page, type TestInfo } from '@playwright/test'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'

export async function open(page: Page, name: string, impl: string, theme = 'light') {
  await page.goto(`/?case=${name}&impl=${impl}&theme=${theme}`)
  await expect(page.locator('html')).toHaveAttribute('data-ready', 'true', { timeout: 30000 })
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  await expect(page.locator('#app > *')).not.toHaveCount(0)
  await page.evaluate(async () => { await document.fonts.ready; if (document.querySelector('pixiv-icon')) await customElements.whenDefined('pixiv-icon') })
  await page.waitForTimeout(400)
}
async function compare(before: Buffer, after: Buffer, info: TestInfo) {
  const a = PNG.sync.read(before); const b = PNG.sync.read(after)
  await info.attach('upstream', { body: before, contentType: 'image/png' })
  await info.attach('vue', { body: after, contentType: 'image/png' })
  expect({ width: b.width, height: b.height }).toEqual({ width: a.width, height: a.height })
  const diff = new PNG({ width: a.width, height: a.height })
  const pixels = pixelmatch(a.data, b.data, diff.data, a.width, a.height, { threshold: 0.1 })
  if (pixels) await info.attach('difference', { body: PNG.sync.write(diff), contentType: 'image/png' })
  expect(pixels, 'Differing pixels from pinned upstream').toBeLessThanOrEqual(20)
}
for (const name of ['buttons', 'forms', 'selection', 'content', 'sandbox', 'layout', 'defaults', 'spinners']) {
  for (const theme of ['light', 'dark']) {
    for (const width of [1024, 390]) {
      test(`${name} ${theme} ${width}`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 900 })
        const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
        await open(page, name, 'react', theme)
        const reference = await page.locator('[data-testid="fixture"]').screenshot({ animations: 'disabled' })
        await open(page, name, 'vue', theme)
        const actual = await page.locator('[data-testid="fixture"]').screenshot({ animations: 'disabled' })
        expect(errors).toEqual([])
        await compare(reference, actual, info)
      })
    }
  }
}
for (const theme of ['light', 'dark']) {
  for (const width of [1024, 390]) {
    for (const name of ['modal', 'dropdown', 'hover', 'focus', 'notification']) {
      test(`${name} ${theme} ${width}`, async ({ page }, info) => {
        await page.setViewportSize({ width, height: 900 })
        const screenshots: Buffer[] = []
        for (const impl of ['react', 'vue']) {
          await open(page, name === 'dropdown' ? 'selection' : name === 'hover' || name === 'focus' ? 'buttons' : name === 'notification' ? 'notifications' : name, impl, theme)
          if (name === 'modal') { await page.getByRole('button', { name: 'Open modal', exact: true }).click(); await expect(page.getByRole('dialog')).toBeVisible() }
          if (name === 'dropdown') { await page.getByRole('button', { name: /Choice/ }).click(); await expect(page.getByRole('option', { name: 'Beta', exact: true })).toBeVisible() }
          if (name === 'hover') await page.getByRole('button', { name: 'Primary', exact: true }).first().hover()
          if (name === 'focus') { await page.locator('body').click({ position: { x: 1, y: 1 } }); await page.keyboard.press('Tab') }
          if (name === 'notification') { await page.getByRole('button', { name: 'Snackbar', exact: true }).click(); await expect(page.getByRole('status')).toContainText('Saved') }
          await page.waitForTimeout(name === 'modal' ? 600 : 200)
          screenshots.push(await page.screenshot({ animations: 'disabled' }))
        }
        await compare(screenshots[0], screenshots[1], info)
      })
    }
  }
}
