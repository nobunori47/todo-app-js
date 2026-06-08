import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Todo } from '../src/types'
import { getSheetsClient } from './_lib/googleAuth'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const SHEET_NAME = 'Sheet1'
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
    todo.id,
    todo.title,
    todo.content,
    todo.dueDate,
    todo.createdAt,
    todo.priority,
    JSON.stringify(todo.subtasks ?? []),
  ]
}

async function ensureHeaders(sheets: ReturnType<typeof getSheetsClient>) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A1:G1`,
  })
  const existing = res.data.values?.[0]
  if (!existing || existing[0] !== 'id') {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    })
  }
}

function errorResponse(res: VercelResponse, err: unknown, status = 500) {
  const message = err instanceof Error ? err.message : String(err)
  const stack = err instanceof Error ? err.stack : undefined
  console.error('[api/sheets]', err)
  return res.status(status).json({ error: message, stack })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS ヘッダー（Vercel Preview URL からのアクセス対応）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const sheets = getSheetsClient()

    if (req.method === 'GET') {
      await ensureHeaders(sheets)
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:G`,
      })
      const rows = result.data.values ?? []
      const todos = rows.filter(r => r[0]).map(rowToTodo)
      return res.json(todos)
    }

    if (req.method === 'POST') {
      const todo = req.body as Todo
      if (!todo?.id) return res.status(400).json({ error: 'id は必須です' })
      await ensureHeaders(sheets)
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:G`,
        valueInputOption: 'RAW',
        requestBody: { values: [todoToRow(todo)] },
      })
      return res.json({ success: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    return errorResponse(res, err)
  }
}
