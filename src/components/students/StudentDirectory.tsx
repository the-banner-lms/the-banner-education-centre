import Link from 'next/link'
import {
  getStudentClassLabel,
  getYleSubclassLabel,
  YLE_SUBCLASSES,
  STUDENT_CLASSES,
} from '@/lib/studentClasses'
import StudentAssignmentForm from '@/components/students/StudentAssignmentForm'

type Student = {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  assigned_class?: string | null
  assigned_subclass?: string | null
  yle_monthly_fee?: number | string | null
  address?: string | null
  student_number?: string | null
}

function StudentDetailsForm({ student }: { student: Student }) {
  return (
    <StudentAssignmentForm
      studentId={student.id}
      assignedClass={student.assigned_class}
      assignedSubclass={student.assigned_subclass}
      yleMonthlyFee={student.yle_monthly_fee}
      address={student.address}
      compact
    />
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
                  <p className="mt-1 text-xs font-semibold text-gray-600">
                    Student ID: {student.student_number || 'Pending assignment'}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                    Address: {student.address || 'No address'}
                  </p>
                  <span className="mt-1 inline-flex rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-semibold text-[#0f6630] ring-1 ring-inset ring-green-200">
                    {getStudentClassLabel(student.assigned_class)}
                  </span>
                  {student.assigned_subclass && (
                    <span className="ml-1 mt-1 inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                      YLE: {getYleSubclassLabel(student.assigned_subclass)}
                    </span>
                  )}
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
                    {student.assigned_subclass && (
                      <>
                        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-gray-500">YLE Dual / Sub-class</p>
                        <p className="mt-1 font-semibold text-blue-700">{getYleSubclassLabel(student.assigned_subclass)}</p>
                      </>
                    )}
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

function YleSubclassDirectory({
  students,
  basePath,
  canAssign,
}: {
  students: Student[]
  basePath: string
  canAssign: boolean
}) {
  const subclassGroups = YLE_SUBCLASSES.map((subclass) => ({
    ...subclass,
    students: students.filter((student) => student.assigned_subclass === subclass.value),
  }))
  const unassignedStudents = students.filter(
    (student) => !YLE_SUBCLASSES.some((subclass) => subclass.value === student.assigned_subclass)
  )
  const groups = [
    ...subclassGroups,
    { value: 'unassigned-yle', label: 'YLE Sub-class Unassigned', students: unassignedStudents },
  ]
  const firstPopulatedGroup = groups.findIndex((group) => group.students.length > 0)

  return (
    <div className="space-y-3 border-t border-gray-200 bg-blue-50/40 p-3 sm:p-4">
      <p className="px-1 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">YLE Sub-classes</p>
      {groups.map((group, index) => (
        <details
          key={group.value}
          open={index === firstPopulatedGroup}
          className="group/subclass overflow-hidden rounded-lg border border-blue-100 bg-white"
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 font-semibold text-gray-800 marker:content-none">
            <span>{group.label}</span>
            <span className="flex items-center gap-3">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">{group.students.length}</span>
              <span aria-hidden="true" className="text-gray-400 transition-transform group-open/subclass:rotate-180">⌄</span>
            </span>
          </summary>
          <StudentList students={group.students} basePath={basePath} canAssign={canAssign} />
        </details>
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
    students: students.filter((student) => studentClass.value === 'yle'
      ? student.assigned_class === 'yle' || Boolean(student.assigned_subclass)
      : student.assigned_class === studentClass.value),
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
            {group.value === 'yle' ? (
              <YleSubclassDirectory students={group.students} basePath={basePath} canAssign={canAssign} />
            ) : (
              <StudentList students={group.students} basePath={basePath} canAssign={canAssign} />
            )}
          </details>
        ))}
      </div>
    </div>
  )
}
