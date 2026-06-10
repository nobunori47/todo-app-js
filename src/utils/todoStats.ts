import type { Todo } from '../types'
import { isDueToday } from './dateUtils'

export interface DashboardStats {
  incompleteCount: number
  completionRate: number
  highPriorityCount: number
  todayDueCount: number
}

export function getDashboardStats(todos: Todo[]): DashboardStats {
  const total = todos.length
  const completedCount = todos.filter(t => t.completed).length

  return {
    incompleteCount: total - completedCount,
    completionRate: total === 0 ? 0 : Math.round((completedCount / total) * 100),
    highPriorityCount: todos.filter(t => t.priority === 'high' && !t.completed).length,
    todayDueCount: todos.filter(t => !t.completed && isDueToday(t.dueDate)).length,
  }
}

export function filterTodosByQuery(todos: Todo[], query: string): Todo[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return todos

  return todos.filter(todo =>
    todo.title.toLowerCase().includes(normalized) ||
    todo.content.toLowerCase().includes(normalized)
  )
}
