import Link from 'next/link'

export default function StudentDirectory({
  students,
  basePath,
  title = "Student Directory",
  canCreate = false,
}: {
  students: any[]
  basePath: string
  title?: string
  canCreate?: boolean
}) {
  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {canCreate && (
          <Link
            href={`${basePath}/new`}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0f6630] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0b5226] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6630] focus-visible:ring-offset-2"
          >
            + Add Student
          </Link>
        )}
      </div>
      
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="divide-y divide-gray-200 md:hidden">
          {students?.map((student) => (
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
          {(!students || students.length === 0) && (
            <p className="p-6 text-center text-sm text-gray-500">No students found.</p>
          )}
        </div>
        <div className="hidden overflow-x-auto overscroll-x-contain md:block">
        <table className="min-w-[640px] divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students?.map((student) => {
              return (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <Link href={`/dashboard/${student.id}`}>
                          <img className="h-10 w-10 rounded-full hover:ring-2 hover:ring-indigo-300 transition-all cursor-pointer" src={student.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.email)} alt="" referrerPolicy="no-referrer" />
                        </Link>
                      </div>
                      <div className="ml-4">
                        <Link href={`/dashboard/${student.id}`} className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                          {student.full_name || 'No Name'}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{student.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link href={`${basePath}/${student.id}`} className="text-indigo-600 hover:text-indigo-900">
                      Manage Profile &rarr;
                    </Link>
                  </td>
                </tr>
              )
            })}
            {(!students || students.length === 0) && (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                  No students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
