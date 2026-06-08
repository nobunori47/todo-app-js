import { createSign } from 'crypto'

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

export async function getAccessToken(): Promise<string> {
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
