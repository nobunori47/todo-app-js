import { chromium } from 'playwright'

const BASE_URL = 'http://localhost:5174'

const tasks = [
  {
    title: '要件定義書の作成',
    content: '新機能の要件をステークホルダーと合意し、ドキュメントにまとめる',
    dueDate: '2026-06-09',
    priority: 'high',
  },
  {
    title: 'パフォーマンス改善の調査',
    content: 'APIレスポンスが遅い箇所を特定し、改善案を検討する',
    dueDate: '2026-06-13',
    priority: 'medium',
  },
  {
    title: 'ドキュメント整備',
    content: 'READMEおよびAPI仕様書を最新の実装に合わせて更新する',
    dueDate: '2026-06-30',
    priority: 'low',
  },
]

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext()
  const page = await context.newPage()

  await page.goto(BASE_URL)
  await page.waitForLoadState('networkidle')

  for (const task of tasks) {
    console.log(`Adding: ${task.title}`)
    await page.click('button:has-text("+ 新規タスク")')
    await page.waitForSelector('input[placeholder="タスクのタイトル"]')

    await page.fill('input[placeholder="タスクのタイトル"]', task.title)
    await page.fill('textarea[placeholder="タスクの詳細"]', task.content)
    await page.fill('input[type="date"]', task.dueDate)
    await page.selectOption('select', task.priority)

    await page.click('button:has-text("登録する")')
    await page.waitForTimeout(300)
  }

  await page.screenshot({ path: 'scripts/result.png', fullPage: true })
  console.log('Screenshot saved to scripts/result.png')

  await browser.close()
}

main().catch(console.error)
