import { google } from 'googleapis'

function parsePrivateKey(raw: string): string {
  return raw
    .replace(/\\n/g, '\n')   // Vercel が literal \n で保存した場合
    .replace(/\\r/g, '')      // \r が混入している場合
    .replace(/^["']|["']$/g, '') // 前後のクォートが残っている場合
    .trim()
}

export function getGoogleAuth() {
  const rawKey = process.env.GOOGLE_PRIVATE_KEY
  if (!rawKey) throw new Error('GOOGLE_PRIVATE_KEY が未設定です')

  const privateKey = parsePrivateKey(rawKey)

  // PEM 形式の最低限の検証
  if (!privateKey.includes('-----BEGIN')) {
    throw new Error(`GOOGLE_PRIVATE_KEY のフォーマットが不正です (先頭40文字: ${privateKey.slice(0, 40)})`)
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
}

export function getSheetsClient() {
  const auth = getGoogleAuth()
  return google.sheets({ version: 'v4', auth })
}
