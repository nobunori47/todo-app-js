import { useState, useEffect } from 'react'
import type { Todo, Priority } from '../types'
import { decomposeTask } from '../services/claudeApi'

interface Props {
  initial?: Todo
  onSubmit: (todo: Omit<Todo, 'id' | 'createdAt'> & { id?: string; createdAt?: string }) => void
  onCancel: () => void
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'high', label: '高' },
  { value: 'medium', label: '中' },
  { value: 'low', label: '低' },
]

export default function TodoForm({ initial, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [content, setContent] = useState(initial?.content ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? 'medium')
  const [subtasks, setSubtasks] = useState<string[]>(initial?.subtasks ?? [])
  const [decomposing, setDecomposing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initial) {
      setTitle(initial.title)
      setContent(initial.content)
      setDueDate(initial.dueDate)
      setPriority(initial.priority)
      setSubtasks(initial.subtasks ?? [])
    }
  }, [initial])

  const handleDecompose = async () => {
    if (!title.trim()) {
      setError('タイトルを入力してください')
      return
    }
    setDecomposing(true)
    setError('')
    try {
      const result = await decomposeTask(title, content)
      setSubtasks(result)
    } catch {
      setError('タスク分解に失敗しました')
    } finally {
      setDecomposing(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('タイトルは必須です')
      return
    }
    onSubmit({ id: initial?.id, createdAt: initial?.createdAt, title, content, dueDate, priority, subtasks })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">タイトル *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="タスクのタイトル"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">内容</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          placeholder="タスクの詳細"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">期日</label>
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">優先度</label>
          <select
            value={priority}
            onChange={e => setPriority(e.target.value as Priority)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">AIサブタスク分解</label>
          <button
            type="button"
            onClick={handleDecompose}
            disabled={decomposing}
            className="text-sm px-3 py-1 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 transition"
          >
            {decomposing ? '分解中...' : 'AIで分解'}
          </button>
        </div>
        {subtasks.length > 0 && (
          <ul className="space-y-1">
            {subtasks.map((st, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 text-purple-400">•</span>
                <input
                  type="text"
                  value={st}
                  onChange={e => {
                    const next = [...subtasks]
                    next[i] = e.target.value
                    setSubtasks(next)
                  }}
                  className="flex-1 border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple-300"
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
        >
          キャンセル
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
        >
          {initial ? '更新する' : '登録する'}
        </button>
      </div>
    </form>
  )
}
