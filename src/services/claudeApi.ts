import Anthropic from '@anthropic-ai/sdk'

const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined

if (!apiKey) {
  console.error('[claudeApi] VITE_ANTHROPIC_API_KEY が未設定です。.env ファイルを確認してください。')
} else {
  console.info('[claudeApi] APIキー確認: 先頭8文字 =', apiKey.slice(0, 8))
}

const client = new Anthropic({
  apiKey: apiKey ?? '',
  dangerouslyAllowBrowser: true,
})

export async function decomposeTask(title: string, content: string): Promise<string[]> {
  console.info('[claudeApi] decomposeTask 開始:', { title, content })

  let message: Anthropic.Message
  try {
    message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `以下のタスクを5〜7つの具体的なサブタスクに分解してください。
サブタスクのみをJSON配列形式で返してください。説明文は不要です。

タイトル: ${title}
内容: ${content}

例: ["サブタスク1", "サブタスク2", "サブタスク3"]`,
        },
      ],
    })
  } catch (err) {
    console.error('[claudeApi] messages.create 失敗:', err)
    throw err
  }

  console.info('[claudeApi] レスポンス受信:', message.content)

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) {
    console.error('[claudeApi] JSON配列が見つかりません。レスポンス全文:', text)
    throw new Error('AIのレスポンスからサブタスク配列を取得できませんでした')
  }

  try {
    const subtasks = JSON.parse(match[0]) as string[]
    console.info('[claudeApi] パース成功:', subtasks)
    return subtasks
  } catch (err) {
    console.error('[claudeApi] JSON.parse 失敗。マッチ文字列:', match[0], err)
    throw new Error('サブタスクのJSONパースに失敗しました')
  }
}
