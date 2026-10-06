import { expect, test } from '@playwright/test'
import { installBackend, login, makeOrder } from './backend.js'

test('shows an offline banner and refreshes when the connection returns', async ({ page, context }) => {
  const backend = await installBackend(page)
  await login(page)
  await expect(page.getByText(/You are offline/)).toHaveCount(0)

  await context.setOffline(true)
  await expect(page.getByText(/You are offline/)).toBeVisible()

  const before = backend.count(/^GET service_orders$/)
  await context.setOffline(false)
  await expect(page.getByText(/You are offline/)).toHaveCount(0)
  await expect.poll(() => backend.count(/^GET service_orders$/)).toBeGreaterThan(before)
})

test('keeps the edit open with a readable error when saving fails, and retries', async ({ page }) => {
  const backend = await installBackend(page)
  await login(page)
  await page.goto('/#/item/700')
  await page.getByRole('button', { name: /Edit Status/ }).click()
  await page.getByPlaceholder(/notes about this status update/).fill('Tested OK')

  backend.failWrites = true
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('alert')).toContainText('Could not save the service order')
  await expect(page.getByRole('alert')).toContainText('The server is having a bad day')
  await expect(page.getByPlaceholder(/notes about this status update/)).toHaveValue('Tested OK')

  backend.failWrites = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0)
  expect(backend.find('700').status_history.at(-1).notes).toBe('Tested OK')
})

test('recovers from a failed load with Try again', async ({ page }) => {
  const backend = await installBackend(page)
  backend.failReads = true
  await page.goto('/')
  await page.getByPlaceholder('Enter PIN').fill('1111')
  await page.keyboard.press('Enter')
  await expect(page.getByText('Connection Error')).toBeVisible()

  backend.failReads = false
  await page.getByRole('button', { name: 'Try again' }).click()
  await expect(page.getByRole('heading', { name: 'Service Dashboard' })).toBeVisible()
})

test('shows changes made on another device without a reload', async ({ page }) => {
  const backend = await installBackend(page)
  await login(page)
  await expect.poll(() => backend.sockets[0]?.bindings.length).toBe(2)
  await expect(page.getByText('Remote Person')).toHaveCount(0)

  // Another device creates a ready order, then the database announces it
  backend.orders.unshift(makeOrder({ id: '888', status: 'ready', customer_name: 'Remote Person', company: null }))
  backend.pushChange('service_orders')

  await expect(page.getByText('Remote Person').first()).toBeVisible({ timeout: 5000 })
})
