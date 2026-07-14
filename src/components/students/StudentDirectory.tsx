import Link from 'next/link'

export default function StudentDirectory({
  students,
  basePath,
  title = "Student Directory"
}: {
  students: any[]
  basePath: string
  title?: string
}) {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900">{title}</h1>
      
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto overscroll-x-contain">
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
