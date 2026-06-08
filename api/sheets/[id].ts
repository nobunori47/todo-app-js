import type { VercelRequest, VercelResponse } from '@vercel/node'
import { google } from 'googleapis'
import type { Todo } from '../../src/types'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const SHEET_NAME = 'Sheet1'

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

async function findRowIndex(sheets: ReturnType<typeof google.sheets>, id: string): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  })
  const rows = res.data.values ?? []
  return rows.findIndex(r => r[0] === id)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { id } = req.query as { id: string }
  const sheets = await getSheetsClient()
  const rowIndex = await findRowIndex(sheets, id)

  if (rowIndex === -1) {
    return res.status(404).json({ error: 'Todo not found' })
  }

  const sheetRow = rowIndex + 1

  if (req.method === 'PUT') {
    const todo = req.body as Todo
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${sheetRow}:G${sheetRow}`,
      valueInputOption: 'RAW',
      requestBody: { values: [todoToRow(todo)] },
    })
    return res.json({ success: true })
  }

  if (req.method === 'DELETE') {
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${sheetRow}:G${sheetRow}`,
    })
    return res.json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
