import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAccessToken } from './_lib/googleAuth'
import { sheetsGet } from './_lib/sheetsClient'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const checks: Record<string, string> = {}

  // 環境変数チェック
  checks.GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID ? '✅ 設定済み' : '❌ 未設定'
  checks.GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ 設定済み' : '❌ 未設定'

  const rawKey = process.env.GOOGLE_PRIVATE_KEY ?? ''
  checks.GOOGLE_PRIVATE_KEY_LENGTH = `${rawKey.length} 文字`
  checks.GOOGLE_PRIVATE_KEY_LITERAL_BACKSLASH_N = rawKey.includes('\\n') ? '⚠️ あり（自動変換されます）' : '✅ なし'
  const normalizedKey = rawKey.replace(/\\n/g, '\n')
  checks.GOOGLE_PRIVATE_KEY_HAS_BEGIN = normalizedKey.includes('-----BEGIN PRIVATE KEY-----') ? '✅ あり' : '❌ なし'

  // アクセストークン取得テスト
  let token: string | null = null
  try {
    token = await getAccessToken()
    checks.OAUTH2_TOKEN = `✅ 取得成功 (先頭20文字: ${token.slice(0, 20)}...)`
  } catch (err) {
    checks.OAUTH2_TOKEN = `❌ 失敗: ${err instanceof Error ? err.message : String(err)}`
  }

  // Sheets 読み取りテスト
  if (token) {
    try {
      await sheetsGet(process.env.GOOGLE_SHEETS_ID!, 'Sheet1!A1:A1')
      checks.SHEETS_READ = '✅ 読み取り成功'
    } catch (err) {
      checks.SHEETS_READ = `❌ 失敗: ${err instanceof Error ? err.message : String(err)}`
    }
  } else {
    checks.SHEETS_READ = '⏭️ スキップ（トークン取得失敗のため）'
  }

  return res.json(checks)
}
