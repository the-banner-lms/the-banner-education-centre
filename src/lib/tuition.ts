export type TuitionStatus = 'paid' | 'unpaid' | 'scholar'

export function getTuitionStatusStyle(status: string) {
  if (status === 'paid') return 'bg-green-100 text-green-800'
  if (status === 'scholar') return 'bg-blue-100 text-blue-800'
  if (status === 'overdue') return 'bg-red-100 text-red-900'
  return 'bg-red-100 text-red-800'
}

export function getTuitionDisplayStatus(status: string, dueDate?: string | null) {
  if (status === 'unpaid' && dueDate) {
    const endOfDueDate = new Date(`${dueDate}T23:59:59+06:30`).getTime()
    if (Number.isFinite(endOfDueDate) && endOfDueDate < Date.now()) return 'overdue'
  }
  return status
}

export function formatTuitionAmount(amount: number | string | null | undefined) {
  const value = Number(amount || 0)
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)} MMK`
}

export function splitTuitionAmount({
  total,
  assignedClass,
  assignedSubclass,
  yleMonthlyFee,
}: {
  total: number | string
  assignedClass?: string | null
  assignedSubclass?: string | null
  yleMonthlyFee?: number | string | null
}) {
  const totalAmount = Math.max(0, Math.round(Number(total || 0) * 100) / 100)

  // YLE can be the student's only class. In that case the whole invoice is YLE tuition.
  if (assignedClass === 'yle') {
    return { baseAmount: 0, yleAmount: totalAmount }
  }

  if (!assignedSubclass) {
    return { baseAmount: totalAmount, yleAmount: 0 }
  }

  const configuredYleAmount = Number(yleMonthlyFee)
  const yleAmount = yleMonthlyFee !== null
    && yleMonthlyFee !== undefined
    && Number.isFinite(configuredYleAmount)
    ? Math.min(totalAmount, Math.max(0, configuredYleAmount))
    : 0

  return {
    baseAmount: Math.round((totalAmount - yleAmount) * 100) / 100,
    yleAmount: Math.round(yleAmount * 100) / 100,
  }
}
