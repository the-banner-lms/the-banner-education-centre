import { formatTuitionAmount } from '@/lib/tuition'
import { getYleSubclassLabel } from '@/lib/studentClasses'

export default function TuitionAmountBreakdown({
  total,
  baseAmount,
  yleAmount,
  yleSubclass,
}: {
  total: number | string | null
  baseAmount?: number | string | null
  yleAmount?: number | string | null
  yleSubclass?: string | null
}) {
  const totalValue = Number(total || 0)
  const yleValue = Number(yleAmount || 0)
  const storedBaseValue = Number(baseAmount || 0)
  const baseValue = storedBaseValue + yleValue === totalValue
    ? storedBaseValue
    : Math.max(0, totalValue - yleValue)

  return (
    <div className="min-w-40">
      <p className="whitespace-nowrap font-bold text-gray-900">Total: {formatTuitionAmount(totalValue)}</p>
      {yleSubclass && (
        <div className="mt-1 space-y-0.5 text-xs font-semibold leading-5 text-gray-600">
          <p className="whitespace-nowrap">Base class: {formatTuitionAmount(baseValue)}</p>
          <p className="whitespace-nowrap text-blue-700">YLE {getYleSubclassLabel(yleSubclass)}: {formatTuitionAmount(yleValue)}</p>
        </div>
      )}
    </div>
  )
}
