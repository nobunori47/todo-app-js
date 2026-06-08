import { chromium } from 'playwright'
import type { Todo } from '../src/types'

const BASE_URL = 'http://localhost:5174'
const KEY = 'todo-app-todos'

const seedData: Todo[] = [
  {
    id: 'debug-1',
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

  const consoleLogs: string[] = []
  page.on('console', msg => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`)
    console.log(`BROWSER ${msg.type().toUpperCase()}: ${msg.text()}`)
  })
  page.on('pageerror', err => {
    console.error('PAGE ERROR:', err.message)
  })

  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  // Check console output on page load (API key check fires here)
  console.log('\n--- ページ読み込み時のコンソール ---')

  await page.evaluate(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key: KEY, data: seedData }
  )
  await page.reload()
  await page.waitForLoadState('networkidle')

  // Click AI decompose button
  console.log('\n--- AIで分解ボタンをクリック ---')
  const aiBtn = page.locator('button:has-text("AIで分解")')
  await aiBtn.click()

  // Wait up to 30s for response or error
  await page.waitForTimeout(5000)

  // Check for error message in UI
  const errorText = await page.locator('.text-red-500').first().textContent().catch(() => '')
  console.log('\n--- UI上のエラー表示 ---')
  console.log('エラーテキスト:', errorText || '(なし)')

  await page.screenshot({ path: 'scripts/debug-result.png', fullPage: true })
  console.log('\nScreenshot saved to scripts/debug-result.png')

  await browser.close()
}

main().catch(console.error)
