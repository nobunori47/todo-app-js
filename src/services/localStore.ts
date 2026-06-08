import type { Todo } from '../types'

const KEY = 'todo-app-todos'

export const SEED_TODOS: Todo[] = [
  {
    id: 'seed-1',
    title: '要件定義書の作成',
    content: '新機能の要件をステークホルダーと合意し、ドキュメントにまとめる',
    dueDate: '2026-06-09',
    createdAt: new Date().toISOString(),
    priority: 'high',
    subtasks: [],
  },
  {
    id: 'seed-2',
    title: 'パフォーマンス改善の調査',
    content: 'APIレスポンスが遅い箇所を特定し、改善案を検討する',
    dueDate: '2026-06-13',
    createdAt: new Date().toISOString(),
    priority: 'medium',
    subtasks: [],
  },
  {
    id: 'seed-3',
    title: 'ドキュメント整備',
    content: 'READMEおよびAPI仕様書を最新の実装に合わせて更新する',
    dueDate: '2026-06-30',
    createdAt: new Date().toISOString(),
    priority: 'low',
    subtasks: [],
  },
]

export function localSeedTodos(): void {
  persist(SEED_TODOS)
}

function load(): Todo[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Todo[]
  } catch {
    return []
  }
}

function persist(todos: Todo[]) {
  localStorage.setItem(KEY, JSON.stringify(todos))
}

export function localFetchTodos(): Todo[] {
  return load()
}

export function localSaveTodo(todo: Todo): void {
  persist([...load(), todo])
}

export function localUpdateTodo(todo: Todo): void {
  persist(load().map(t => (t.id === todo.id ? todo : t)))
}

export function localDeleteTodo(id: string): void {
  persist(load().filter(t => t.id !== id))
}
