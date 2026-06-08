import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Todo } from '../../src/types'
import { getSheetsClient } from '../_lib/googleAuth'

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID!
const SHEET_NAME = 'Sheet1'

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

async function findRowIndex(sheets: ReturnType<typeof getSheetsClient>, id: string): Promise<number> {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  })
  const rows = res.data.values ?? []
  return rows.findIndex(r => r[0] === id)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { id } = req.query as { id: string }
    const sheets = getSheetsClient()
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
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[api/sheets/[id]] error:', err)
    return res.status(500).json({ error: message })
  }
}
