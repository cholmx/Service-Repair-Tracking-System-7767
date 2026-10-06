import { expect, test } from '@playwright/test'
import { installBackend, login } from './backend.js'

const importFile = (rows) => ({
  name: 'export.json',
  mimeType: 'application/json',
  buffer: Buffer.from(JSON.stringify({ version: '1.0', data: rows }))
})

const row = (overrides) => ({
  id: '999',
  customer_name: 'New Person',
  customer_phone: '555-9999',
  item_type: 'Gizmo',
  description: 'Imported',
  status: 'received',
  quantity: 1,
  ...overrides
})

test('exports active and archived orders with their history', async ({ page }) => {
  await installBackend(page)
  await login(page)
  await page.goto('/#/settings')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export Data' }).click()
  ])
  const { createReadStream } = await import('node:fs')
  const chunks = []
  for await (const chunk of createReadStream(await download.path())) chunks.push(chunk)
  const exported = JSON.parse(Buffer.concat(chunks).toString())

  expect(download.suggestedFilename()).toMatch(/^servicetracker-export-\d{4}-\d{2}-\d{2}\.json$/)
  expect(exported.recordCount).toBe(4)
  expect(exported.data.map((o) => o.id).sort()).toEqual(['300', '607', '700', '705'])
  expect(exported.data.every((o) => Array.isArray(o.statusHistory))).toBe(true)
})

test.describe('import', () => {
  test('previews the changes and only imports after the right PIN', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await page.goto('/#/settings')

    await page.setInputFiles('input[type=file]', importFile([row(), row({ id: '607', customer_name: 'Changed Name' }), row({ id: '5', customer_name: '' })]))
    await expect(page.getByText('1 new service orders will be added')).toBeVisible()
    await expect(page.getByText('1 existing service orders will be overwritten')).toBeVisible()
    await expect(page.getByText('1 rows in the file are invalid')).toBeVisible()
    await expect(page.getByText('Overwritten: #607')).toBeVisible()
    expect(backend.count(/import_service_orders/)).toBe(0)

    await page.getByPlaceholder('PIN').fill('0000')
    await page.getByRole('button', { name: /Import 2 service orders/ }).click()
    await expect(page.getByText('Incorrect PIN.')).toBeVisible()
    expect(backend.count(/import_service_orders/)).toBe(0)

    await page.getByPlaceholder('PIN').fill('1111')
    await page.getByRole('button', { name: /Import 2 service orders/ }).click()
    await expect(page.getByText('Import complete: 1 added, 1 updated')).toBeVisible()
    expect(backend.find('999').customer_name).toBe('New Person')
    expect(backend.find('607').customer_name).toBe('Changed Name')
  })

  test('cancel leaves everything untouched', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await page.goto('/#/settings')
    await page.setInputFiles('input[type=file]', importFile([row()]))
    await page.getByRole('button', { name: 'Cancel' }).click()
    await expect(page.getByText('Select export file')).toBeVisible()
    expect(backend.count(/import_service_orders/)).toBe(0)
  })

  test('rejects a file that is not an export', async ({ page }) => {
    await installBackend(page)
    await login(page)
    await page.goto('/#/settings')
    await page.setInputFiles('input[type=file]', { name: 'nope.json', mimeType: 'application/json', buffer: Buffer.from('this is not json') })
    await expect(page.getByText('The file is not valid JSON.')).toBeVisible()
  })
})
