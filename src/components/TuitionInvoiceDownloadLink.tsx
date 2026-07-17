import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

export default function TuitionInvoiceDownloadLink({
  feeId,
  invoiceNumber,
}: {
  feeId: string
  invoiceNumber: string | null
}) {
  if (!invoiceNumber) return <span className="text-xs text-gray-500">Preparing…</span>

  return (
    <a
      href={`/api/tuition-invoice/${feeId}`}
      download={`${invoiceNumber}.pdf`}
      className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-lg border border-green-700 bg-white px-3 py-2 text-xs font-black text-green-800 hover:bg-green-50"
      aria-label={`Download invoice ${invoiceNumber}`}
    >
      <ArrowDownTrayIcon className="h-4 w-4" aria-hidden="true" />
      Download PDF
    </a>
  )
}
