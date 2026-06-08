import { getAccessToken } from './googleAuth'

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

export async function sheetsGet(spreadsheetId: string, range: string) {
  const headers = await authHeaders()
  const res = await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}`,
    { headers }
  )
  await checkResponse(res, `GET ${range}`)
  return res.json() as Promise<{ values?: string[][] }>
}

export async function sheetsAppend(
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

export async function sheetsUpdate(
  spreadsheetId: string,
  range: string,
  values: string[][]
) {
  const headers = await authHeaders()
  const res = await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`,
    { method: 'PUT', headers, body: JSON.stringify({ values }) }
  )
  await checkResponse(res, `UPDATE ${range}`)
}

export async function sheetsClear(spreadsheetId: string, range: string) {
  const headers = await authHeaders()
  const res = await fetch(
    `${BASE}/${spreadsheetId}/values/${encodeURIComponent(range)}:clear`,
    { method: 'POST', headers }
  )
  await checkResponse(res, `CLEAR ${range}`)
}
