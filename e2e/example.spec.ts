import {test, expect} from '@playwright/test'

test('homepage has title and bypass works', async ({page}) => {
  await page.goto('/?bypass=birim-dev-2025')
  await expect(page).toHaveTitle(/BIRIM/)
})
