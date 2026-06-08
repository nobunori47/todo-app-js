import type { Priority } from '../types'

interface Props {
  priority: Priority
}

const config: Record<Priority, { label: string; className: string }> = {
  high: { label: '高', className: 'bg-red-100 text-red-700 border border-red-300' },
  medium: { label: '中', className: 'bg-yellow-100 text-yellow-700 border border-yellow-300' },
  low: { label: '低', className: 'bg-green-100 text-green-700 border border-green-300' },
}

export default function PriorityBadge({ priority }: Props) {
  const { label, className } = config[priority]
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${className}`}>
      {label}
    </span>
  )
}
