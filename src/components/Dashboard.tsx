import type { DashboardStats } from '../utils/todoStats'

interface Props {
  stats: DashboardStats
}

const items: { key: keyof DashboardStats; label: string; suffix?: string }[] = [
  { key: 'incompleteCount', label: '未完了タスク' },
  { key: 'completionRate', label: '完了率', suffix: '%' },
  { key: 'highPriorityCount', label: '高優先度' },
  { key: 'todayDueCount', label: '今日期限' },
]

export default function Dashboard({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {items.map(({ key, label, suffix }) => (
        <div
          key={key}
          className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3 text-center"
        >
          <p className="text-2xl font-bold text-gray-800">
            {stats[key]}
            {suffix ?? ''}
          </p>
          <p className="text-xs text-gray-500 mt-1">{label}</p>
        </div>
      ))}
    </div>
  )
}
