interface StudentReportDownloadButtonProps {
  studentId: string
  weekStartDate: string
}

export default function StudentReportDownloadButton({
  studentId,
  weekStartDate,
}: StudentReportDownloadButtonProps) {
  const params = new URLSearchParams({
    studentId,
    week: weekStartDate,
  })

  return (
    <a
      href={`/api/student-report?${params.toString()}`}
      target="_blank"
      rel="noopener noreferrer"
      download="student-report.pdf"
      className="inline-block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-semibold text-sm"
    >
      Download as PDF
    </a>
  )
}
