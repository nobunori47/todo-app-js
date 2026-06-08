import type { Todo } from '../types'
import {
  localFetchTodos,
  localSaveTodo,
  localUpdateTodo,
  localDeleteTodo,
  localSeedTodos,
} from './localStore'

const IS_DEV = import.meta.env.DEV
const BASE_URL = '/api/sheets'

export async function fetchTodos(): Promise<Todo[]> {
  if (IS_DEV) return Promise.resolve(localFetchTodos())
  const res = await fetch(BASE_URL)
  if (!res.ok) throw new Error('Failed to fetch todos')
  return res.json() as Promise<Todo[]>
}

export async function saveTodo(todo: Todo): Promise<void> {
  if (IS_DEV) { localSaveTodo(todo); return }
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todo),
  })
  if (!res.ok) throw new Error('Failed to save todo')
}

export async function updateTodo(todo: Todo): Promise<void> {
  if (IS_DEV) { localUpdateTodo(todo); return }
  const res = await fetch(`${BASE_URL}/${todo.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(todo),
  })
  if (!res.ok) throw new Error('Failed to update todo')
}

export async function deleteTodo(id: string): Promise<void> {
  if (IS_DEV) { localDeleteTodo(id); return }
  const res = await fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete todo')
}

export function seedTodos(): void {
  if (IS_DEV) localSeedTodos()
}
