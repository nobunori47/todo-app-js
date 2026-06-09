import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Todo } from '../src/types'
import { sheetsGet, sheetsAppend } from './lib/sheetsClient'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const SHEET = 'Sheet1'
const HEADERS = ['id', 'タイトル', '内容', '期日', '作成日時', 'priority', 'subtasks']

function rowToTodo(row: string[]): Todo {
  return {
    id: row[0] ?? '',
    title: row[1] ?? '',
    content: row[2] ?? '',
    dueDate: row[3] ?? '',
    createdAt: row[4] ?? '',
    priority: (row[5] as Todo['priority']) ?? 'medium',
    subtasks: row[6] ? (JSON.parse(row[6]) as string[]) : [],
  }
}

function todoToRow(todo: Todo): string[] {
  return [
    todo.id, todo.title, todo.content, todo.dueDate,
    todo.createdAt, todo.priority, JSON.stringify(todo.subtasks ?? []),
  ]
}

async function ensureHeaders() {
  const data = await sheetsGet(SPREADSHEET_ID, `${SHEET}!A1:G1`)
  const first = data.values?.[0]
  if (!first || first[0] !== 'id') {
    await sheetsAppend(SPREADSHEET_ID, `${SHEET}!A1`, [HEADERS])
  }
}

function setCors(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res)
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    if (req.method === 'GET') {
      await ensureHeaders()
      const data = await sheetsGet(SPREADSHEET_ID, `${SHEET}!A2:G`)
      const todos = (data.values ?? []).filter(r => r[0]).map(rowToTodo)
      return res.json(todos)
    }

    if (req.method === 'POST') {
      const todo = req.body as Todo
      if (!todo?.id) return res.status(400).json({ error: 'id は必須です' })
      await ensureHeaders()
      await sheetsAppend(SPREADSHEET_ID, `${SHEET}!A:G`, [todoToRow(todo)])
      return res.json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const stack = err instanceof Error ? err.stack : undefined
    console.error('[api/sheets]', err)
    return res.status(500).json({ error: message, stack })
  }
}
