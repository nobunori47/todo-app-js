import { useState, useEffect, useCallback } from 'react'
import type { Todo } from './types'
import { fetchTodos, saveTodo, updateTodo, deleteTodo, seedTodos } from './services/sheetsApi'
import TodoCard from './components/TodoCard'
import TodoForm from './components/TodoForm'
import ConfirmDialog from './components/ConfirmDialog'

type Modal = { mode: 'add' } | { mode: 'edit'; todo: Todo } | null

export default function App() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [modal, setModal] = useState<Modal>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const loadTodos = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchTodos()
      setTodos(data)
    } catch {
      setError('データの読み込みに失敗しました')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadTodos() }, [loadTodos])

  const handleSubmit = async (
    data: Omit<Todo, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ) => {
    setSaving(true)
    setError('')
    try {
      if (data.id) {
        const todo: Todo = { ...data, id: data.id, createdAt: data.createdAt! }
        await updateTodo(todo)
        setTodos(prev => prev.map(t => t.id === todo.id ? todo : t))
      } else {
        const todo: Todo = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }
        await saveTodo(todo)
        setTodos(prev => [...prev, todo])
      }
      setModal(null)
    } catch {
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteTodo(deleteTarget)
      setTodos(prev => prev.filter(t => t.id !== deleteTarget))
    } catch {
      setError('削除に失敗しました')
    } finally {
      setSaving(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">Todo リスト</h1>
          <div className="flex gap-2">
            <button
              onClick={loadTodos}
              disabled={loading}
              className="text-sm px-3 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
            >
              {loading ? '読み込み中...' : '更新'}
            </button>
            {import.meta.env.DEV && (
              <button
                onClick={() => { seedTodos(); loadTodos() }}
                className="text-sm px-3 py-2 border border-purple-300 text-purple-600 rounded-lg hover:bg-purple-50 transition"
                title="開発用：テストデータをlocalStorageに挿入"
              >
                テストデータ挿入
              </button>
            )}
            <button
              onClick={() => setModal({ mode: 'add' })}
              className="text-sm px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              + 新規タスク
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {saving && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-600 text-sm">
            保存中...
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-gray-400">読み込み中...</div>
        ) : todos.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg mb-2">タスクがありません</p>
            <p className="text-sm">「+ 新規タスク」から追加してください</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todos.map(todo => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onEdit={todo => setModal({ mode: 'edit', todo })}
                onDelete={id => setDeleteTarget(id)}
                onUpdate={async (updated) => {
                  await updateTodo(updated)
                  setTodos(prev => prev.map(t => t.id === updated.id ? updated : t))
                }}
              />
            ))}
          </div>
        )}
      </main>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-start justify-center z-40 pt-16 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {modal.mode === 'add' ? '新規タスク登録' : 'タスク編集'}
            </h2>
            <TodoForm
              initial={modal.mode === 'edit' ? modal.todo : undefined}
              onSubmit={handleSubmit}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}

      {deleteTarget && (
        <ConfirmDialog
          message="このタスクを削除しますか？"
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}
