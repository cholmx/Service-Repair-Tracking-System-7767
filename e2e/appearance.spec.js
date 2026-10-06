import { expect, test } from '@playwright/test'
import { installBackend, login, makeOrder } from './backend.js'

const orders = () => [
  makeOrder({ id: '426', status: 'received', company: 'Cherry City', customer_name: 'Rich Loch', item_type: 'G1 SCBA' }),
  makeOrder({ id: '251', status: 'ready', company: 'West Homestead', customer_name: 'Megan Barco', item_type: 'G1 SCBA' }),
  makeOrder({ id: '496', status: 'quote-approval', company: 'Evans City VFD', customer_name: 'Jason Butterfield', item_type: 'Fire Hawk', total: 0 }),
  makeOrder({ id: '717', status: 'quote-approval', company: 'Butler Township Fire District', customer_name: 'Seth Miller', item_type: 'Altair 4XR', total: 245.5 })
]

test('customer names stand out and secondary text is dark enough to read', async ({ page }) => {
  await installBackend(page, { orders: orders(), archived: [] })
  await login(page)

  const company = page.getByText('Cherry City').first()
  await expect(company).toBeVisible()
  expect(await company.evaluate((el) => getComputedStyle(el).fontWeight)).toBe('700')

  // The item line under the name is gray text: it must be no lighter than #404040
  const itemLine = page.getByText('G1 SCBA').first()
  const [r, g, b] = (await itemLine.evaluate((el) => getComputedStyle(el).color)).match(/\d+/g).map(Number)
  expect(Math.max(r, g, b)).toBeLessThanOrEqual(0x52)
})

test('a quote with no total yet does not print a stray 0', async ({ page }) => {
  await installBackend(page, { orders: orders(), archived: [] })
  await login(page)

  const card = page.locator('div.bg-white').filter({ has: page.getByRole('heading', { name: 'Quote Management' }) }).last()
  await expect(card.getByText('Evans City VFD')).toBeVisible()
  await expect(card.getByText(/^0$/)).toHaveCount(0)
  await expect(card.getByText('$245.50')).toBeVisible() // a real total still shows
})

test('input placeholders are dark enough to read', async ({ page }) => {
  await installBackend(page)
  await login(page)
  await page.goto('/#/intake')
  const color = await page.getByPlaceholder('Enter customer name').evaluate((el) => getComputedStyle(el, '::placeholder').color)
  expect(color).toBe('rgb(115, 115, 115)')
})
