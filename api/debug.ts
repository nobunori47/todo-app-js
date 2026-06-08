import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSheetsClient } from './_lib/googleAuth'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const checks: Record<string, string> = {}

  // 環境変数の存在確認（値は伏せる）
  checks.GOOGLE_SHEETS_ID = process.env.GOOGLE_SHEETS_ID ? '✅ 設定済み' : '❌ 未設定'
  checks.GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? '✅ 設定済み' : '❌ 未設定'

  const rawKey = process.env.GOOGLE_PRIVATE_KEY ?? ''
  checks.GOOGLE_PRIVATE_KEY_LENGTH = `${rawKey.length} 文字`
  checks.GOOGLE_PRIVATE_KEY_HAS_LITERAL_BACKSLASH_N = rawKey.includes('\\n') ? '⚠️ あり（要変換）' : '✅ なし'
  checks.GOOGLE_PRIVATE_KEY_HAS_BEGIN = rawKey.replace(/\\n/g, '\n').includes('-----BEGIN') ? '✅ あり' : '❌ なし'

  // 実際の接続テスト
  try {
    const sheets = getSheetsClient()
    await sheets.spreadsheets.get({ spreadsheetId: process.env.GOOGLE_SHEETS_ID! })
    checks.SHEETS_CONNECTION = '✅ 接続成功'
  } catch (err) {
    checks.SHEETS_CONNECTION = `❌ ${err instanceof Error ? err.message : String(err)}`
  }

  return res.json(checks)
}
