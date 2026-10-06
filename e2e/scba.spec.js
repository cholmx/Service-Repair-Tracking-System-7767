import { expect, test } from '@playwright/test'
import { installBackend, login, makeOrder } from './backend.js'

const DAY = 24 * 60 * 60 * 1000
// One fixed moment, so the gaps between the dates below are exact
const NOW = Date.now()
const ago = (days) => new Date(NOW - days * DAY).toISOString()
const finished = (id, finishedDaysAgo) => [
  { id: crypto.randomUUID(), service_order_id: id, status: 'received', notes: '', created_at: ago(finishedDaysAgo + 5) },
  { id: crypto.randomUUID(), service_order_id: id, status: 'ready', notes: 'Done', created_at: ago(finishedDaysAgo) }
]

// Two SCBAs, one of them (SN-4471) seen three times and typed three different ways, plus a gas
// detector that happens to share the same serial text. Only SCBAs keep a history.
const fleet = () => ({
  orders: [
    makeOrder({ id: '404', item_type: 'ALTAIR 4X', serial_number: 'SN-4471', status: 'in-progress', customer_name: 'Gas Detector Owner', company: null }),
    makeOrder({ id: '800', item_type: 'G1 SCBA', serial_number: 'SN 4471', status: 'in-progress', customer_name: 'Lee Roy', company: 'Roy Fire Co', created_at: ago(10), description: 'Leaks at the regulator again' })
  ],
  archived: [
    makeOrder({ id: '401', item_type: 'G1 SCBA', serial_number: 'SN-4471', status: 'archived', archived_at: ago(390), created_at: ago(405), status_history: finished('401', 400), customer_name: 'Lee Roy', company: 'Roy Fire Co', description: 'Cracked hose' }),
    makeOrder({ id: '402', item_type: 'G1 SCBA', serial_number: 'sn 4471', status: 'archived', archived_at: ago(30), created_at: ago(45), status_history: finished('402', 41), customer_name: 'Lee Roy', company: 'Roy Fire Co', description: 'Low pressure alarm', parts: [{ description: 'Regulator', quantity: 1, price: 120 }], total: 120 }),
    makeOrder({ id: '403', item_type: 'FIREHAWK', serial_number: 'SN-9000', status: 'archived', archived_at: ago(90), created_at: ago(100), status_history: finished('403', 95), customer_name: 'Other Dept', company: null })
  ]
})

test.describe('SCBA repair history page', () => {
  test('finds a unit however the serial was typed and lists only SCBA repairs', async ({ page }) => {
    await installBackend(page, fleet())
    await login(page)
    await page.getByRole('link', { name: 'SCBA History' }).first().click()
    await expect(page.getByRole('heading', { name: 'SCBA Repair History' })).toBeVisible()

    await page.getByPlaceholder(/Serial number/).fill('sn 44')
    const unit = page.getByRole('button', { name: /3 repairs/ })
    await expect(unit).toBeVisible()
    await expect(page.getByRole('button')).not.toContainText('Gas Detector Owner')
    await unit.click()

    await expect(page.getByText('3 repairs on record')).toBeVisible()
    const timeline = page.getByRole('list').filter({ hasText: '#800' })
    await expect(timeline.getByRole('link', { name: '#800' })).toBeVisible()
    await expect(timeline.getByRole('link', { name: '#402' })).toBeVisible()
    await expect(timeline.getByRole('link', { name: '#401' })).toBeVisible()
    await expect(timeline.getByRole('link', { name: '#404' })).toHaveCount(0)
    await expect(timeline.getByText('Cracked hose')).toBeVisible()
    await expect(timeline.getByText(/Parts: Regulator/)).toBeVisible()
    // 800 came back 31 days after 402 was finished, 402 came back 355 days after 401
    await expect(timeline.getByText(/Repeat: 31 days after the previous repair/)).toBeVisible()
    await expect(timeline.getByText(/Repeat:/)).toHaveCount(1)
  })

  test('says so when there is nothing to find', async ({ page }) => {
    await installBackend(page, fleet())
    await login(page)
    await page.goto('/#/scba')
    await page.getByPlaceholder(/Serial number/).fill('zzz999')
    await expect(page.getByText(/has been repaired here/)).toBeVisible()
  })

  test('does not search below three characters', async ({ page }) => {
    const backend = await installBackend(page, fleet())
    await login(page)
    await page.goto('/#/scba')
    await page.getByPlaceholder(/Serial number/).fill('sn')
    await page.waitForTimeout(600)
    expect(backend.count(/is_scba/)).toBe(0)
  })
})

test.describe('on an order', () => {
  test('an SCBA shows its other repairs and warns about a repeat', async ({ page }) => {
    await installBackend(page, fleet())
    await login(page)
    await page.goto('/#/item/800')

    const card = page.locator('div.bg-white').filter({ has: page.getByRole('heading', { name: 'SCBA Repair History' }) }).last()
    await expect(card.getByText(/Repeat repair: this SCBA was last finished 41 days ago \(order #402\)/)).toBeVisible()
    await expect(card.getByRole('link', { name: '#402' })).toBeVisible()
    await expect(card.getByRole('link', { name: '#401' })).toBeVisible()
    await expect(card.getByRole('link', { name: '#800' })).toHaveCount(0) // not itself
    await expect(card.getByRole('link', { name: '#404' })).toHaveCount(0) // a gas detector with the same serial text

    await card.getByRole('link', { name: 'View full history' }).click()
    await expect(page.getByText('3 repairs on record')).toBeVisible()
  })

  test('the serial number links to the history, and only for SCBAs', async ({ page }) => {
    await installBackend(page, fleet())
    await login(page)
    await page.goto('/#/item/800')
    await expect(page.getByRole('link', { name: 'SN 4471' })).toHaveAttribute('href', /scba\?serial=SN4471/)
    await expect(page.getByText('SCBA', { exact: true })).toBeVisible()

    await page.goto('/#/item/404')
    await expect(page.getByRole('heading', { name: 'SCBA Repair History' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'SN-4471' })).toHaveCount(0)
  })

  test('marking an order as an SCBA starts its history', async ({ page }) => {
    const backend = await installBackend(page, fleet())
    await login(page)
    await page.goto('/#/item/404')
    await expect(page.getByRole('heading', { name: 'SCBA Repair History' })).toHaveCount(0)

    await page.getByRole('button', { name: 'Edit', exact: true }).first().click()
    await page.getByLabel('SCBA (keep repair history for this unit)').check()
    await page.getByRole('button', { name: 'Save' }).click()

    await expect(page.getByRole('heading', { name: 'SCBA Repair History' })).toBeVisible()
    expect(backend.find('404').is_scba).toBe(true)
  })

  test('tracking links SCBA serial numbers only', async ({ page }) => {
    await installBackend(page, fleet())
    await login(page)
    await page.getByRole('link', { name: 'Track Service Orders' }).first().click()
    await expect(page.getByRole('row', { name: /#800/ }).getByRole('link', { name: 'SN 4471' })).toBeVisible()
    await expect(page.getByRole('row', { name: /#404/ }).getByRole('link', { name: 'SN-4471' })).toHaveCount(0)
    await expect(page.getByRole('row', { name: /#404/ })).toContainText('SN-4471')
  })
})

test.describe('at intake', () => {
  test('guesses SCBA from the item type, and warns about open orders and repeats', async ({ page }) => {
    const backend = await installBackend(page, fleet())
    await login(page)
    await page.goto('/#/intake')
    const box = page.getByLabel('SCBA (keep repair history for this unit)')

    await expect(box).not.toBeChecked()
    await page.getByPlaceholder('Enter item type').fill('FIREHAWK')
    await expect(box).toBeChecked()

    await page.getByPlaceholder('Enter serial number (optional)').fill('sn4471')
    await expect(page.getByText(/already has an open order in the shop: #800/)).toBeVisible()
    await expect(page.getByText(/Repaired 41 days ago \(order #402\)/)).toBeVisible()
    expect(backend.count(/POST rpc\/create_service_orders/)).toBe(0) // a notice never creates or blocks anything
  })

  test('says nothing for a serial the shop has not seen, or for a gas detector', async ({ page }) => {
    await installBackend(page, fleet())
    await login(page)
    await page.goto('/#/intake')
    const box = page.getByLabel('SCBA (keep repair history for this unit)')

    await page.getByPlaceholder('Enter item type').fill('G1 SCBA')
    await page.getByPlaceholder('Enter serial number (optional)').fill('BRAND-NEW-1')
    await page.waitForTimeout(700)
    await expect(page.getByRole('status')).toHaveCount(0)

    await page.getByPlaceholder('Enter item type').fill('ALTAIR 4X')
    await expect(box).not.toBeChecked()
    await page.getByPlaceholder('Enter serial number (optional)').fill('SN-4471')
    await page.waitForTimeout(700)
    await expect(page.getByRole('status')).toHaveCount(0)
  })

  test('a manual choice sticks, and the flag is saved with the order', async ({ page }) => {
    const backend = await installBackend(page, fleet())
    await login(page)
    await page.goto('/#/intake')
    await page.getByPlaceholder('Enter customer name').fill('Pat')
    await page.getByPlaceholder('Enter phone number').fill('555-7777')

    const box = page.getByLabel('SCBA (keep repair history for this unit)')
    await page.getByPlaceholder('Enter item type').fill('ALTAIR 4X')
    await box.check() // the shop knows better than the guess
    await page.getByPlaceholder('Enter item type').fill('ALTAIR 4XR')
    await expect(box).toBeChecked() // changing the type does not undo it
    await page.locator('form textarea').nth(0).fill('Sensor error')
    await page.getByRole('button', { name: /Register Service Order/ }).click()

    await expect(page.getByRole('heading', { name: 'Service Dashboard' })).toBeVisible()
    expect(backend.orders.find((o) => o.item_type === 'ALTAIR 4XR').is_scba).toBe(true)
  })
})
