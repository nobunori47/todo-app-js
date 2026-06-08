import { JWT } from 'google-auth-library'
import { google } from 'googleapis'

function parsePrivateKey(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')      // Vercel が literal \n で保存した場合
    .replace(/\\r/g, '')         // \r が混入している場合
    .replace(/^["']|["']$/g, '') // 前後のクォートが残っている場合
    .trim()
}

export function getSheetsClient() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL

  if (!rawKey) throw new Error('環境変数 GOOGLE_PRIVATE_KEY が未設定です')
  if (!clientEmail) throw new Error('環境変数 GOOGLE_SERVICE_ACCOUNT_EMAIL が未設定です')
  if (!process.env.GOOGLE_SHEETS_ID) throw new Error('環境変数 GOOGLE_SHEETS_ID が未設定です')

  const privateKey = parsePrivateKey(rawKey)

  if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
    throw new Error(
      `GOOGLE_PRIVATE_KEY のフォーマットが不正です。` +
      `先頭30文字: "${privateKey.slice(0, 30)}"。` +
      `Vercel の環境変数にPEMキーをそのまま貼り付けてください。`
    )
  }

  // GoogleAuth の自動検出を避け、JWT で明示的に認証
  const auth = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })

  return google.sheets({ version: 'v4', auth })
}
