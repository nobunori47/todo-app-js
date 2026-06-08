import { chromium } from 'playwright'
import type { Todo } from '../src/types'

const BASE_URL = 'http://localhost:5174'
const KEY = 'todo-app-todos'

const seedData: Todo[] = [
  {
    id: 'seed-1',
    title: '要件定義書の作成',
    content: '新機能の要件をステークホルダーと合意し、ドキュメントにまとめる',
    dueDate: '2026-06-09',
    createdAt: new Date().toISOString(),
    priority: 'high',
    subtasks: [],
  },
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')
  await page.evaluate(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key: KEY, data: seedData }
  )
  await page.reload()
  await page.waitForLoadState('networkidle')

  // Verify AI button exists on card
  const aiBtn = page.locator('button:has-text("AIで分解")')
  const count = await aiBtn.count()
  console.log(`AI decompose buttons visible: ${count}`)

  await page.screenshot({ path: 'scripts/ai-button-result.png', fullPage: true })
  console.log('Screenshot saved to scripts/ai-button-result.png')

  await browser.close()
}

main().catch(console.error)
