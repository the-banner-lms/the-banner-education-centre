import ManualStudentForm from '@/components/students/ManualStudentForm'

export const metadata = {
  title: 'Add Student | Staff',
}

export default function StaffNewStudentPage() {
  return <ManualStudentForm basePath="/staff/students" />
}
