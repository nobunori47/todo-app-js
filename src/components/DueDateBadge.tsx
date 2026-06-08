import { getDueDateStatus, formatDate } from '../utils/dateUtils'

interface Props {
  dueDate: string
}

export default function DueDateBadge({ dueDate }: Props) {
  if (!dueDate) return null
  const status = getDueDateStatus(dueDate)

  const styles: Record<string, string> = {
    overdue: 'text-red-600 font-bold',
    critical: 'text-red-500 font-semibold',
    warning: 'text-orange-500 font-semibold',
    normal: 'text-gray-500',
  }

  const labels: Record<string, string> = {
    overdue: '期限超過',
    critical: '3日以内',
    warning: '7日以内',
    normal: '',
  }

  return (
    <span className={`text-sm ${styles[status]}`}>
      {formatDate(dueDate)}
      {labels[status] && <span className="ml-1 text-xs">({labels[status]})</span>}
    </span>
  )
}
