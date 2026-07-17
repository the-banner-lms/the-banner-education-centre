export const PAYMENT_METHODS = [
  { value: 'direct', label: 'Direct Payment (Cash / In Person)' },
  { value: 'kbzpay', label: 'KBZPay' },
  { value: 'wavepay', label: 'WavePay' },
  { value: 'ayapay', label: 'AYA Pay' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value']

export function getPaymentMethodLabel(value: string | null | undefined) {
  return PAYMENT_METHODS.find(method => method.value === value)?.label || 'Not specified'
}
