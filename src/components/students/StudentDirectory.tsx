import Link from 'next/link'
import { updateStudentDetails } from '@/app/actions/studentActions'
import { getStudentClassLabel, STUDENT_CLASSES } from '@/lib/studentClasses'

type Student = {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  assigned_class?: string | null
  address?: string | null
}

function StudentDetailsForm({ student }: { student: Student }) {
  const fieldId = `assigned-class-${student.id}`
  const addressId = `address-${student.id}`

  return (
    <form action={updateStudentDetails.bind(null, student.id)} className="grid min-w-0 gap-3 xl:grid-cols-[minmax(9rem,0.7fr)_minmax(14rem,1.3fr)_auto] xl:items-end">
      <div>
        <label htmlFor={fieldId} className="mb-1 block text-xs font-semibold text-gray-600">Class</label>
        <select
          id={fieldId}
          name="assigned_class"
          required
          defaultValue={student.assigned_class || ''}
          className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-900 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20"
        >
          <option value="" disabled>Select class</option>
          {STUDENT_CLASSES.map((studentClass) => (
            <option key={studentClass.value} value={studentClass.value}>{studentClass.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={addressId} className="mb-1 block text-xs font-semibold text-gray-600">Address</label>
        <input
          id={addressId}
          name="address"
          type="text"
          required
          minLength={3}
          maxLength={300}
          defaultValue={student.address || ''}
          placeholder="Enter student address"
          autoComplete="street-address"
          className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20"
        />
      </div>
      <button
        type="submit"
        className="min-h-10 shrink-0 rounded-lg bg-[#0f6630] px-4 py-1.5 text-sm font-semibold text-white hover:bg-[#0b5226] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6630] focus-visible:ring-offset-1"
      >
        Save
      </button>
    </form>
  )
}

function StudentList({ students, basePath, canAssign }: { students: Student[]; basePath: string; canAssign: boolean }) {
  if (students.length === 0) {
    return <p className="border-t border-gray-200 p-6 text-center text-sm text-gray-500">No students assigned to this class.</p>
  }

  return (
    <div className="space-y-4 border-t border-gray-200 bg-gray-50/70 p-4 sm:p-5">
        {students.map((student) => (
          <article key={student.id} className="w-full rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-3 lg:w-72 lg:shrink-0">
                <Link href={`/dashboard/${student.id}`} className="shrink-0">
                  <img
                    className="h-14 w-14 rounded-full object-cover ring-1 ring-gray-200 transition-all hover:ring-2 hover:ring-indigo-300"
                    src={student.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.email)}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                </Link>
                <div className="min-w-0">
                  <Link href={`/dashboard/${student.id}`} className="block truncate font-semibold text-gray-900 hover:text-indigo-600">
                    {student.full_name || 'No Name'}
                  </Link>
                  <p className="truncate text-sm text-gray-500">{student.email}</p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                    Address: {student.address || 'No address'}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-[#0f6630] ring-1 ring-inset ring-green-200">
                    {getStudentClassLabel(student.assigned_class)}
                  </span>
                </div>
              </div>

              <div className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
                {canAssign ? (
                  <>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Student Assignment</p>
                    <StudentDetailsForm student={student} />
                  </>
                ) : (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned Class</p>
                    <p className="mt-1 font-semibold text-[#0f6630]">{getStudentClassLabel(student.assigned_class)}</p>
                    <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">Address</p>
                    <p className="mt-1 text-sm text-gray-700">{student.address || 'No address'}</p>
                  </div>
                )}
              </div>

              <Link
                href={`${basePath}/${student.id}`}
                className="inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-lg bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 lg:w-auto"
              >
                Manage Profile &rarr;
              </Link>
            </div>
          </article>
        ))}
    </div>
  )
}

export default function StudentDirectory({
  students,
  basePath,
  title = 'Student Directory',
  canCreate = false,
  canAssign = false,
}: {
  students: Student[]
  basePath: string
  title?: string
  canCreate?: boolean
  canAssign?: boolean
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
            <StudentList students={group.students} basePath={basePath} canAssign={canAssign} />
          </details>
        ))}
      </div>
    </div>
  )
}
