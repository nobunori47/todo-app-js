interface Props {
  value: string
  onChange: (value: string) => void
  resultCount: number
}

export default function TaskSearch({ value, onChange, resultCount }: Props) {
  const isSearching = value.trim().length > 0

  return (
    <div className="mb-4">
      <div className="relative">
        <input
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="タスク名・説明で検索..."
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
            aria-label="検索をクリア"
          >
            ✕
          </button>
        )}
      </div>
      {isSearching && (
        <p className="mt-2 text-sm text-gray-500">
          {resultCount}件見つかりました
        </p>
      )}
    </div>
  )
}
