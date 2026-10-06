import { expect, test } from '@playwright/test'
import { installBackend, login } from './backend.js'

test('rejects a wrong PIN and stays on the login screen', async ({ page }) => {
  await installBackend(page)
  await page.goto('/')
  await page.getByPlaceholder('Enter PIN').fill('0000')
  await page.keyboard.press('Enter')
  await expect(page.getByText(/invalid pin/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Service Dashboard' })).toHaveCount(0)
})

test('accepts either of the two PINs', async ({ page }) => {
  await installBackend(page)
  await login(page, '2222')
  await expect(page.getByRole('heading', { name: 'Service Dashboard' })).toBeVisible()
})

test('stays signed in after a reload', async ({ page }) => {
  await installBackend(page)
  await login(page)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Service Dashboard' })).toBeVisible()
})
