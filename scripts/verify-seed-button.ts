import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:5174'

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  // Verify button exists in dev mode
  const seedBtn = page.locator('button:has-text("テストデータ挿入")')
  const btnVisible = await seedBtn.isVisible()
  console.log(`Seed button visible: ${btnVisible}`)

  // Click it
  await seedBtn.click()
  await page.waitForTimeout(300)

  const cards = await page.locator('.bg-white.rounded-xl.shadow-sm').count()
  console.log(`Rendered todo cards after seed: ${cards}`)

  await page.screenshot({ path: 'scripts/seed-button-result.png', fullPage: true })
  console.log('Screenshot saved to scripts/seed-button-result.png')

  await browser.close()
}

main().catch(console.error)
