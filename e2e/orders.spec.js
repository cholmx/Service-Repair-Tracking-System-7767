import { expect, test } from '@playwright/test'
import { installBackend, login } from './backend.js'

const openTracking = async (page) => {
  await page.getByRole('link', { name: 'Track Service Orders' }).first().click()
  await expect(page.getByRole('heading', { name: 'Track Service Orders' })).toBeVisible()
}

test.describe('tracking', () => {
  test('lists orders, searches and filters', async ({ page }) => {
    await installBackend(page)
    await login(page)
    await openTracking(page)

    await expect(page.getByRole('row')).toHaveCount(4) // header and three orders

    await page.getByPlaceholder(/Search by customer/).fill('roy')
    await expect(page.getByRole('row')).toHaveCount(2)
    await expect(page.getByRole('row', { name: /#700/ })).toBeVisible()

    await page.getByPlaceholder(/Search by customer/).fill('')
    await page.locator('select').first().selectOption('in-progress')
    await expect(page.getByRole('row')).toHaveCount(2)
    await expect(page.getByRole('row', { name: /#705/ })).toBeVisible()
  })

  test('loads archived orders only when asked', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await openTracking(page)
    expect(backend.count(/ archived$/)).toBe(0)

    await page.getByRole('button', { name: 'View Archived' }).click()
    await expect(page.getByRole('row', { name: /#300/ })).toBeVisible()
    expect(backend.count(/ archived$/)).toBe(1)
  })

  test('archives an order and can undo it', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await openTracking(page)

    await page.getByRole('row', { name: /#700/ }).getByRole('button', { name: 'Archive' }).click()
    await page
      .locator('div.fixed')
      .filter({ hasText: 'Archive Service Order' })
      .getByRole('button', { name: 'Archive', exact: true })
      .click()

    await expect(page.getByText('Service Order #700 archived')).toBeVisible()
    await expect(page.getByRole('row', { name: /#700/ })).toHaveCount(0)
    expect(backend.find('700').archived_at).not.toBeNull()

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect(page.getByRole('row', { name: /#700/ })).toBeVisible()
    expect(backend.find('700').archived_at).toBeNull()
    expect(backend.find('700').status).toBe('ready')
  })

  test('deletes an archived order and can undo it', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await openTracking(page)
    await page.getByRole('button', { name: 'View Archived' }).click()

    await page.getByRole('row', { name: /#300/ }).getByRole('button', { name: 'Delete' }).click()
    await page.getByRole('button', { name: 'Delete Permanently' }).click()
    await expect(page.getByText('Service Order #300 deleted')).toBeVisible()
    expect(backend.find('300')).toBeUndefined()

    await page.getByRole('button', { name: 'Undo' }).click()
    await expect.poll(() => backend.find('300')?.customer_name).toBe('Old Customer')
  })
})

test.describe('order details', () => {
  test('adds parts and labor, with warranty lines left out of the total', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await page.goto('/#/item/607')
    await page.getByRole('button', { name: 'Prepare Quote' }).click()

    await page.getByRole('button', { name: 'Add Part' }).click()
    await page.getByPlaceholder('Part description').fill('Valve')
    const numbers = page.locator('input[type=number]')
    await numbers.nth(0).fill('2')
    await numbers.nth(1).fill('10.25')
    const estimate = page.getByText('Estimated total').locator('..')
    await expect(estimate).toContainText('$20.50')

    // Warranty lines are free
    await page.getByRole('button', { name: 'Regular' }).click()
    await expect(estimate).toContainText('$0.00')
    await page.getByRole('button', { name: 'Warranty', exact: true }).click()
    await numbers.nth(1).fill('10.25')
    await expect(estimate).toContainText('$20.50')

    await page.getByRole('button', { name: 'Add Labor' }).click()
    await numbers.nth(2).fill('1.5')
    await numbers.nth(3).fill('80')
    await numbers.nth(4).fill('8.25')
    await expect(estimate).toContainText('$152.09')

    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(0)
    await expect(page.getByText('$152.09').first()).toBeVisible()
    expect(backend.find('607').parts).toHaveLength(1)
    expect(backend.find('607').total).toBe(152.09)
  })

  test('will not send an empty quote for approval', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await page.goto('/#/item/607')
    await page.getByRole('button', { name: 'Prepare Quote' }).click()
    await page.locator('select').selectOption('quote-approval')
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('alert')).toContainText('Please add parts or labor')
    expect(backend.count(/rpc\/update_service_order/)).toBe(0)
  })

  test('edits customer details', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await page.goto('/#/item/705')
    await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
    await page.getByPlaceholder('Customer name').fill('Samuel Jones')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page.getByText('Samuel Jones')).toBeVisible()
    expect(backend.find('705').customer_name).toBe('Samuel Jones')
    // changing details does not add a status history entry
    expect(backend.find('705').status_history).toHaveLength(1)
  })

  test('opens archived orders by link and explains missing ones', async ({ page }) => {
    await installBackend(page)
    await login(page)
    await page.goto('/#/item/300')
    await expect(page.getByRole('heading', { name: 'Service Order #300' })).toBeVisible()
    await page.goto('/#/item/999')
    await expect(page.getByText('Service Order Not Found')).toBeVisible()
  })
})

test.describe('intake', () => {
  test('fills in a returning customer and creates one order per item', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await page.goto('/#/intake')

    await page.getByPlaceholder('Enter customer name').fill('Lee')
    await page.getByRole('option', { name: /Lee Roy/ }).click()
    await expect(page.getByPlaceholder('Enter phone number')).toHaveValue('555-0101')
    await expect(page.getByPlaceholder('Enter email address')).toHaveValue('lee@example.com')
    await expect(page.getByPlaceholder('Enter company name (optional)')).toHaveValue('Roy Fire Co')

    await page.getByPlaceholder('Enter item type').fill('Mask')
    await page.locator('form textarea').nth(0).fill('Cracked lens')
    await page.getByRole('button', { name: 'Add Item to Service Order' }).click()
    await page.getByPlaceholder('Enter item type').nth(1).fill('Harness')
    await page.locator('form textarea').nth(1).fill('Torn strap')
    await page.getByRole('button', { name: /Register Service Order/ }).click()

    await expect(page.getByRole('heading', { name: 'Service Dashboard' })).toBeVisible()
    const created = backend.orders.filter((o) => ['Mask', 'Harness'].includes(o.item_type))
    expect(created).toHaveLength(2)
    expect(new Set(created.map((o) => o.id)).size).toBe(2)
    expect(created.every((o) => o.customer_name === 'Lee Roy' && o.company === 'Roy Fire Co')).toBe(true)
  })

  test('shows a message instead of creating anything when required fields are empty', async ({ page }) => {
    const backend = await installBackend(page)
    await login(page)
    await page.goto('/#/intake')
    await page.getByRole('button', { name: /Register Service Order/ }).click()
    await expect(page.getByText('Item type is required')).toBeVisible()
    expect(backend.count(/create_service_orders/)).toBe(0)
  })
})
