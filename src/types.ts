export type Priority = 'high' | 'medium' | 'low'

export interface Todo {
  id: string
  title: string
  content: string
  dueDate: string
  createdAt: string
  priority: Priority
  subtasks?: string[]
}
