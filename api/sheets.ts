import { createSign } from 'crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { Todo } from '../src/types'

// ---- googleAuth ----

function parsePrivateKey(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '')
    .replace(/^["']|["']$/g, '')
    .trim()
}

function base64url(input: string): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function makeJWT(clientEmail: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000)
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }))
  const unsigned = `${header}.${payload}`
  const sign = createSign('RSA-SHA256')
  sign.update(unsigned)
  const sig = sign.sign(privateKey, 'base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `${unsigned}.${sig}`
}

async function getAccessToken(): Promise<string> {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL

  if (!rawKey) throw new Error('環境変数 GOOGLE_PRIVATE_KEY が未設定です')
  if (!clientEmail) throw new Error('環境変数 GOOGLE_SERVICE_ACCOUNT_EMAIL が未設定です')

  const privateKey = parsePrivateKey(rawKey)
  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error(
      `GOOGLE_PRIVATE_KEY のフォーマットが不正です。先頭: "${privateKey.slice(0, 30)}"`
    )
  }

  const jwt = makeJWT(clientEmail, privateKey)

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Google OAuth2 トークン取得失敗 (${res.status}): ${body}`)
  }

  const data = await res.json() as { access_token: string }
  return data.access_token
}

// ---- sheetsClient ----

const BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

async function authHeaders() {
  const token = await getAccessToken()
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
}

async function checkResponse(res: Response, label: string) {
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Sheets API ${label} 失敗 (${res.status}): ${body}`)
  }
}

async function sheetsGet(spreadsheetId: string, range: string) {
  const headers = await authHeaders()
  const res = await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers }
  )
  await checkResponse(res, `GET ${range}`)
  return res.json() as Promise<{ values?: string[][] }>
}

async function sheetsAppend(
  spreadsheetId: string,
  range: string,
  values: string[][]
) {
  const headers = await authHeaders()
  const res = await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW`,
    { method: 'POST', headers, body: JSON.stringify({ values }) }
  )
  await checkResponse(res, `APPEND ${range}`)
}

// ---- handler ----

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
