import { useState } from 'react'
import type { Todo } from '../types'
import PriorityBadge from './PriorityBadge'
import DueDateBadge from './DueDateBadge'
import { decomposeTask } from '../services/claudeApi'

interface Props {
  todo: Todo
  onEdit: (todo: Todo) => void
  onDelete: (id: string) => void
  onUpdate: (todo: Todo) => void
}

export default function TodoCard({ todo, onEdit, onDelete, onUpdate }: Props) {
  const [decomposing, setDecomposing] = useState(false)
  const [decomposeError, setDecomposeError] = useState('')

  const handleDecompose = async () => {
    setDecomposing(true)
    setDecomposeError('')
    try {
      const subtasks = await decomposeTask(todo.title, todo.content)
      onUpdate({ ...todo, subtasks })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[TodoCard] AI分解エラー:', err)
      setDecomposeError(`AI分解に失敗しました: ${msg}`)
    } finally {
      setDecomposing(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <PriorityBadge priority={todo.priority} />
            <h3 className="font-semibold text-gray-800 truncate">{todo.title}</h3>
          </div>
          {todo.content && (
            <p className="text-sm text-gray-500 mb-2 line-clamp-2">{todo.content}</p>
          )}
          <div className="flex items-center gap-3 flex-wrap">
            <DueDateBadge dueDate={todo.dueDate} />
            <span className="text-xs text-gray-400">
              作成: {new Date(todo.createdAt).toLocaleDateString('ja-JP')}
            </span>
          </div>
          {todo.subtasks && todo.subtasks.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-purple-600 font-medium mb-1">サブタスク ({todo.subtasks.length})</p>
              <ul className="space-y-0.5">
                {todo.subtasks.map((st, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-1">
                    <span className="text-purple-300 mt-0.5">•</span>
                    {st}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {decomposeError && (
            <p className="mt-1 text-xs text-red-500">{decomposeError}</p>
          )}
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(todo)}
              className="text-sm px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 transition"
            >
              編集
            </button>
            <button
              onClick={() => onDelete(todo.id)}
              className="text-sm px-3 py-1.5 border border-red-300 text-red-500 rounded-lg hover:bg-red-50 transition"
            >
              削除
            </button>
          </div>
          <button
            onClick={handleDecompose}
            disabled={decomposing}
            className="text-sm px-3 py-1.5 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 disabled:opacity-50 transition whitespace-nowrap"
          >
            {decomposing ? 'AI分解中...' : '✦ AIで分解'}
          </button>
        </div>
      </div>
    </div>
  )
}
