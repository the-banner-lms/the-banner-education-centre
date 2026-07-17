import Link from 'next/link'
import { getStudentClassLabel, STUDENT_CLASSES } from '@/lib/studentClasses'

type Student = {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  assigned_class?: string | null
}

function StudentList({ students, basePath }: { students: Student[]; basePath: string }) {
  if (students.length === 0) {
    return <p className="border-t border-gray-200 p-6 text-center text-sm text-gray-500">No students assigned to this class.</p>
  }

  return (
    <div className="border-t border-gray-200">
      <div className="divide-y divide-gray-200 md:hidden">
        {students.map((student) => (
          <article key={student.id} className="p-4">
            <div className="flex items-center gap-3">
              <Link href={`/dashboard/${student.id}`} className="shrink-0">
                <img
                  className="h-12 w-12 rounded-full object-cover ring-1 ring-gray-200"
                  src={student.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.email)}
                  alt=""
                  referrerPolicy="no-referrer"
                />
              </Link>
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/${student.id}`} className="block truncate font-semibold text-gray-900 hover:text-indigo-600">
                  {student.full_name || 'No Name'}
                </Link>
                <p className="truncate text-sm text-gray-500">{student.email}</p>
                <span className="mt-1 inline-flex rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-[#0f6630]">
                  {getStudentClassLabel(student.assigned_class)}
                </span>
              </div>
            </div>
            <Link
              href={`${basePath}/${student.id}`}
              className="mt-3 block rounded-md bg-indigo-50 px-3 py-2 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
            >
              Manage Profile
            </Link>
          </article>
        ))}
      </div>

      <div className="hidden overflow-x-auto overscroll-x-contain md:block">
        <table className="min-w-[720px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Student</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Class</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Email</th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="whitespace-nowrap px-6 py-4">
                  <div className="flex items-center">
                    <Link href={`/dashboard/${student.id}`} className="shrink-0">
                      <img
                        className="h-10 w-10 rounded-full object-cover transition-all hover:ring-2 hover:ring-indigo-300"
                        src={student.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.email)}
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                    </Link>
                    <Link href={`/dashboard/${student.id}`} className="ml-4 text-sm font-medium text-gray-900 hover:text-indigo-600">
                      {student.full_name || 'No Name'}
                    </Link>
                  </div>
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-[#0f6630]">
                    {getStudentClassLabel(student.assigned_class)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{student.email}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <Link href={`${basePath}/${student.id}`} className="text-indigo-600 hover:text-indigo-900">
                    Manage Profile &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function StudentDirectory({
  students,
  basePath,
  title = 'Student Directory',
  canCreate = false,
}: {
  students: Student[]
  basePath: string
  title?: string
  canCreate?: boolean
}) {
  const classGroups = STUDENT_CLASSES.map((studentClass) => ({
    ...studentClass,
    students: students.filter((student) => student.assigned_class === studentClass.value),
  }))
  const unassignedStudents = students.filter(
    (student) => !STUDENT_CLASSES.some((studentClass) => studentClass.value === student.assigned_class)
  )
  const groups = [
    ...classGroups,
    { value: 'unassigned', label: 'Unassigned', students: unassignedStudents },
  ]
  const firstPopulatedGroup = groups.findIndex((group) => group.students.length > 0)

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">{students.length} students across {STUDENT_CLASSES.length} classes</p>
        </div>
        {canCreate && (
          <Link
            href={`${basePath}/new`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0f6630] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0b5226] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6630] focus-visible:ring-offset-2"
          >
            + Add Student
          </Link>
        )}
      </div>

      <div className="space-y-3">
        {groups.map((group, index) => (
          <details
            key={group.value}
            open={index === firstPopulatedGroup}
            className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold text-gray-900 marker:content-none sm:px-6">
              <span>{group.label}</span>
              <span className="flex items-center gap-3">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-700">
                  {group.students.length}
                </span>
                <span aria-hidden="true" className="text-lg text-gray-400 transition-transform group-open:rotate-180">⌄</span>
              </span>
            </summary>
            <StudentList students={group.students} basePath={basePath} />
          </details>
        ))}
      </div>
    </div>
  )
}
