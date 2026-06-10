import { getDueDateAlertType } from '../utils/dateUtils'

interface Props {
  dueDate: string
}

const config = {
  today: { emoji: '🔴', label: '今日締切', className: 'bg-red-50 text-red-700 border-red-200' },
  tomorrow: { emoji: '🟡', label: '明日期限', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  overdue: { emoji: '⚠️', label: '期限切れ', className: 'bg-orange-50 text-orange-700 border-orange-200' },
} as const

export default function DueDateAlertBadge({ dueDate }: Props) {
  const alertType = getDueDateAlertType(dueDate)
  if (!alertType) return null

  const { emoji, label, className } = config[alertType]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${className}`}>
      <span>{emoji}</span>
      <span>{label}</span>
    </span>
  )
}
