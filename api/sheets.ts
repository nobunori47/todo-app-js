import type { VercelRequest, VercelResponse } from '@vercel/node'
import { google } from 'googleapis'
import type { Todo } from '../src/types'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const SHEET_NAME = 'Sheet1'
const HEADERS = ['id', 'タイトル', '内容', '期日', '作成日時', 'priority']

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n')
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

async function getSheetsClient() {
  const auth = getAuth()
  return google.sheets({ version: 'v4', auth })
}

function rowToTodo(row: string[]): Todo {
  return {
    id: row[0] ?? '',
    title: row[1] ?? '',
    content: row[2] ?? '',
    dueDate: row[3] ?? '',
    createdAt: row[4] ?? '',
    priority: (row[5] as Todo['priority']) ?? 'medium',
    subtasks: row[6] ? JSON.parse(row[6]) as string[] : [],
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

async function ensureHeaders(sheets: ReturnType<typeof google.sheets>) {
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
      requestBody: { values: [[...HEADERS, 'subtasks']] },
    })
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sheets = await getSheetsClient()

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
}
