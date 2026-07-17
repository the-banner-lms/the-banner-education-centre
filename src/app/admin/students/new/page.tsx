import ManualStudentForm from '@/components/students/ManualStudentForm'

export const metadata = {
  title: 'Add Student | Admin',
}

export default function AdminNewStudentPage() {
  return <ManualStudentForm basePath="/admin/students" />
}
