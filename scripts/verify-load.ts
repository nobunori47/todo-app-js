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
    createdAt: '2026-06-08T00:00:00.000Z',
    priority: 'high',
    subtasks: [],
  },
  {
    id: 'seed-2',
    title: 'パフォーマンス改善の調査',
    content: 'APIレスポンスが遅い箇所を特定し、改善案を検討する',
    dueDate: '2026-06-13',
    createdAt: '2026-06-08T00:00:00.000Z',
    priority: 'medium',
    subtasks: [],
  },
  {
    id: 'seed-3',
    title: 'ドキュメント整備',
    content: 'READMEおよびAPI仕様書を最新の実装に合わせて更新する',
    dueDate: '2026-06-30',
    createdAt: '2026-06-08T00:00:00.000Z',
    priority: 'low',
    subtasks: [],
  },
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  // Step 1: open the page
  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  // Step 2: inject data directly into localStorage (simulates pre-existing data)
  await page.evaluate(
    ({ key, data }) => localStorage.setItem(key, JSON.stringify(data)),
    { key: KEY, data: seedData }
  )

  // Step 3: verify what's stored
  const stored = await page.evaluate(
    (key) => localStorage.getItem(key),
    KEY
  )
  console.log('localStorage after inject:', stored ? `${JSON.parse(stored).length} items` : 'empty')

  // Step 4: reload - this triggers the app's loadTodos() on mount
  await page.reload()
  await page.waitForLoadState('networkidle')

  // Step 5: check rendered cards
  const cards = await page.locator('.bg-white.rounded-xl.shadow-sm').count()
  console.log(`Rendered todo cards after reload: ${cards}`)

  await page.screenshot({ path: 'scripts/verify-result.png', fullPage: true })
  console.log('Screenshot saved to scripts/verify-result.png')

  await browser.close()
}

main().catch(console.error)
