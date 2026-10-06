import { expect, test } from '@playwright/test'
import { installBackend, login, makeBackup, makeOrder } from './backend.js'

const openSettings = async (page) => {
  await login(page)
  await page.goto('/#/settings')
  await expect(page.getByRole('heading', { name: 'Automatic Backups' })).toBeVisible()
}

test.describe('backup status', () => {
  test('says automatic backups are running and lists them', async ({ page }) => {
    await installBackend(page)
    await openSettings(page)
    await expect(page.getByRole('status').filter({ hasText: 'Automatic backups are running' })).toContainText('2 days ago')
    const row = page.getByRole('row', { name: /Automatic/ })
    await expect(row).toContainText('4') // 3 current orders plus the deleted one
  })

  test('warns when the last automatic backup is too old', async ({ page }) => {
    await installBackend(page, { backups: [makeBackup('scheduled', 12, [makeOrder()])] })
    await openSettings(page)
    await expect(page.getByRole('status')).toContainText('The last automatic backup was 12 days ago')
  })

  test('is not fooled by manual backups', async ({ page }) => {
    await installBackend(page, { backups: [makeBackup('manual', 0, [makeOrder()])] })
    await openSettings(page)
    await expect(page.getByRole('status')).toContainText('No automatic backup has run yet')
  })

  test('explains when the database update has not been applied', async ({ page }) => {
    await installBackend(page, { backupsMissing: true })
    await openSettings(page)
    await expect(page.getByRole('alert')).toContainText('The database is missing a required update')
  })
})

test('Back up now adds a manual backup', async ({ page }) => {
  const backend = await installBackend(page)
  await openSettings(page)

  await page.getByRole('button', { name: 'Back up now' }).click()
  await expect(page.getByText('Backup saved with 4 service orders.')).toBeVisible()
  await expect(page.getByRole('row', { name: /Manual/ })).toBeVisible()
  expect(backend.backups).toHaveLength(2)
  expect(backend.backups[0].source).toBe('manual')
})

test('downloads a backup as a file the import screen understands', async ({ page }) => {
  await installBackend(page)
  await openSettings(page)

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('row', { name: /Automatic/ }).getByRole('button', { name: 'Download' }).click()
  ])
  const { readFile } = await import('node:fs/promises')
  const file = JSON.parse(await readFile(await download.path(), 'utf8'))

  expect(download.suggestedFilename()).toMatch(/^servicetracker-backup-\d{4}-\d{2}-\d{2}\.json$/)
  expect(file.data.map((o) => o.id).sort()).toEqual(['607', '650', '700', '705'])
  expect(file.data[0].statusHistory.length).toBeGreaterThan(0)
})

test('restores deleted orders after a preview and the PIN', async ({ page }) => {
  const backend = await installBackend(page)
  await openSettings(page)
  expect(backend.find('650')).toBeUndefined()

  await page.getByRole('row', { name: /Automatic/ }).getByRole('button', { name: 'Restore' }).click()
  await expect(page.getByText('Reviewing the backup from')).toBeVisible()
  await expect(page.getByText('1 new service orders will be added')).toBeVisible()
  await expect(page.getByText('3 existing service orders will be overwritten')).toBeVisible()
  expect(backend.count(/import_service_orders/)).toBe(0)

  await page.getByPlaceholder('PIN').fill('0000')
  await page.getByRole('button', { name: /Import 4 service orders/ }).click()
  await expect(page.getByText('Incorrect PIN.')).toBeVisible()
  expect(backend.find('650')).toBeUndefined()

  await page.getByPlaceholder('PIN').fill('1111')
  await page.getByRole('button', { name: /Import 4 service orders/ }).click()
  await expect(page.getByText('Import complete: 1 added, 3 updated')).toBeVisible()
  expect(backend.find('650').customer_name).toBe('Deleted Later')
})
