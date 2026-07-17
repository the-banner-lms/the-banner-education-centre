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
