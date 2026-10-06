import { expect, test } from '@playwright/test'
import { installBackend, login, makeOrder } from './backend.js'

test('printing shows only the receipt, on one page', async ({ page }) => {
  await installBackend(page, {
    orders: [
      makeOrder({
        id: '700',
        status: 'ready',
        customer_name: 'Lee Roy',
        company: 'Roy Fire Co',
        item_type: 'SCBA',
        parts: [{ description: 'Hose assembly', quantity: 2, price: 42.5 }, { description: 'O-ring kit', quantity: 1, price: 9, isWarranty: true }],
        labor: [{ description: 'Replace and flow test', hours: 1.5, rate: 80 }],
        parts_total: 85,
        labor_total: 120,
        tax_rate: 8,
        tax: 16.4,
        total: 221.4
      })
    ]
  })
  await login(page)
  await page.goto('/#/item/700')
  await page.getByRole('button', { name: 'Print Receipt' }).click()
  await expect(page.locator('.print-receipt')).toBeVisible()

  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('#root')).toBeHidden()
  await expect(page.locator('.print-receipt')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Print', exact: true })).toBeHidden()
  await expect(page.locator('.print-receipt')).toContainText('$221.40')
  await expect(page.locator('.print-receipt h1')).toHaveText('Fire Force')
  await expect(page.locator('.print-receipt')).not.toContainText('ServiceTracker')

  const pdf = await page.pdf({ format: 'Letter', preferCSSPageSize: true })
  const pages = pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []
  expect(pages).toHaveLength(1)
})
