import { formatTuitionAmount, getTuitionDisplayStatus, getTuitionStatusStyle } from '@/lib/tuition'
import { getYleSubclassLabel } from '@/lib/studentClasses'

export default function TuitionAmountBreakdown({
  total,
  baseAmount,
  yleAmount,
  baseStatus,
  yleStatus,
  dueDate,
  assignedClass,
  yleSubclass,
}: {
  total: number | string | null
  baseAmount?: number | string | null
  yleAmount?: number | string | null
  baseStatus?: string | null
  yleStatus?: string | null
  dueDate?: string | null
  assignedClass?: string | null
  yleSubclass?: string | null
}) {
  const totalValue = Number(total || 0)
  const isYleStandalone = assignedClass === 'yle'
  const yleValue = isYleStandalone ? totalValue : Number(yleAmount || 0)
  const storedBaseValue = Number(baseAmount || 0)
  const baseValue = storedBaseValue + yleValue === totalValue
    ? storedBaseValue
    : Math.max(0, totalValue - yleValue)
  const statusBadge = (status?: string | null) => {
    const display = getTuitionDisplayStatus(status || 'unpaid', dueDate)
    return <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${getTuitionStatusStyle(display)}`}>{display}</span>
  }

  return (
    <div className="min-w-40">
      <p className="whitespace-nowrap font-bold text-gray-900">Total: {formatTuitionAmount(totalValue)}</p>
      {yleSubclass && (
        <div className="mt-1 space-y-0.5 text-xs font-semibold leading-5 text-gray-600">
          {!isYleStandalone && <p className="whitespace-nowrap">Base class: {formatTuitionAmount(baseValue)} {statusBadge(baseStatus)}</p>}
          <p className="whitespace-nowrap text-blue-700">
            YLE {getYleSubclassLabel(yleSubclass)}{isYleStandalone ? ' (Standalone)' : ''}: {formatTuitionAmount(yleValue)} {statusBadge(yleStatus)}
          </p>
        </div>
      )}
      {!yleSubclass && <div className="mt-1 text-xs font-semibold text-gray-600">Base class {statusBadge(baseStatus)}</div>}
    </div>
  )
}
