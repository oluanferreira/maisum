interface Column {
  key: string
  label: string
}

interface TableProps {
  columns: Column[]
  data: Record<string, any>[]
  className?: string
}

export function Table({ columns, data, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200 bg-neutral-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase text-neutral-600"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b border-neutral-200 hover:bg-neutral-50">
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-neutral-800">
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
