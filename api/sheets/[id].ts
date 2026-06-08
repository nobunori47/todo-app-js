import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Todo } from '../../src/types'
import { sheetsGet, sheetsUpdate, sheetsClear } from '../_lib/sheetsClient'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const SHEET = 'Sheet1'

function todoToRow(todo: Todo): string[] {
  return [
    todo.id, todo.title, todo.content, todo.dueDate,
    todo.createdAt, todo.priority, JSON.stringify(todo.subtasks ?? []),
  ]
}

async function findSheetRow(id: string): Promise<number> {
  const data = await sheetsGet(SPREADSHEET_ID, `${SHEET}!A:A`)
  const rows = data.values ?? []
  const idx = rows.findIndex(r => r[0] === id)
  return idx === -1 ? -1 : idx + 1  // スプレッドシートは1始まり
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const { id } = req.query as { id: string }
    if (!id) return res.status(400).json({ error: 'id パラメータが必要です' })

    const sheetRow = await findSheetRow(id)
    if (sheetRow === -1) {
      return res.status(404).json({ error: `id="${id}" のタスクが見つかりません` })
    }

    if (req.method === 'PUT') {
      const todo = req.body as Todo
      if (!todo?.id) return res.status(400).json({ error: 'リクエストボディに id が必要です' })
      await sheetsUpdate(SPREADSHEET_ID, `${SHEET}!A${sheetRow}:G${sheetRow}`, [todoToRow(todo)])
      return res.json({ success: true })
    }

    if (req.method === 'DELETE') {
      await sheetsClear(SPREADSHEET_ID, `${SHEET}!A${sheetRow}:G${sheetRow}`)
      return res.json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[api/sheets/[id]]', err)
    return res.status(500).json({ error: message, stack })
  }
}
