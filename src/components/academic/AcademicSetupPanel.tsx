import {
  createAcademicClass,
  createClassSection,
  generateMonthlyInvoices,
  saveAcademicSettings,
  sendPendingPaidInvoiceEmails,
  updateAcademicClass,
  updateClassSection,
} from '@/app/actions/academicSetupActions'

export type AcademicSettings = {
  academic_year: number
  current_term: string
  payment_due_day: number
  receipt_prefix: string
}

export type AcademicSection = {
  id: string
  name: string
  monthly_fee: number | string
  sort_order: number
  is_active: boolean
}

export type AcademicClass = {
  id: string
  academic_year: number
  code: string
  name: string
  monthly_fee: number | string
  sort_order: number
  is_active: boolean
  class_sections: AcademicSection[] | null
}

const labelClass = 'block text-xs font-black uppercase tracking-wide text-gray-600'
const inputClass = 'mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30'
const compactInputClass = 'min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30'

function ReturnPath({ value }: { value: string }) {
  return <input type="hidden" name="return_path" value={value} />
}

export default function AcademicSetupPanel({
  settings,
  classes,
  returnPath,
  notice,
  error,
  emailConfigured,
}: {
  settings: AcademicSettings
  classes: AcademicClass[]
  returnPath: '/admin/academic-setup' | '/staff/academic-setup'
  notice?: string
  error?: string
  emailConfigured: boolean
}) {
  const activeClasses = classes.filter(schoolClass => schoolClass.is_active).length
  const totalMonthlyFees = classes
    .filter(schoolClass => schoolClass.is_active)
    .reduce((sum, schoolClass) => (
      sum
      + (schoolClass.code === 'yle' ? 0 : Number(schoolClass.monthly_fee || 0))
      + (schoolClass.code === 'yle'
        ? (schoolClass.class_sections || [])
          .filter(section => section.is_active)
          .reduce((sectionSum, section) => sectionSum + Number(section.monthly_fee || 0), 0)
        : 0)
    ), 0)

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.16em] text-banner-dark">School Management</p>
        <h1 className="mt-2 text-3xl font-black text-gray-950">Academic Setup</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">Manage the academic year, current term, payment due day, receipt prefix, classes, sections and monthly fee plans.</p>
      </div>

      {notice && <p className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">{notice}</p>}
      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p>}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Academic setup summary">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Academic Year</p>
          <p className="mt-2 text-2xl font-black text-banner-dark">{settings.academic_year}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Current Term</p>
          <p className="mt-2 text-2xl font-black text-banner-brown">{settings.current_term}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Active Classes</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{activeClasses}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-black uppercase tracking-wide text-gray-500">Configured Fees Total</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{new Intl.NumberFormat('en-US').format(totalMonthlyFees)} MMK</p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="school-settings-title">
        <div className="mb-5">
          <h2 id="school-settings-title" className="text-xl font-black text-gray-950">Year, Term & Payment Rules</h2>
          <p className="mt-1 text-sm text-gray-600">Receipt example: {settings.receipt_prefix}-KG-{settings.academic_year}-0001</p>
        </div>
        <form action={saveAcademicSettings} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1.4fr_1fr_1fr_auto] lg:items-end">
          <ReturnPath value={returnPath} />
          <label className={labelClass}>Academic Year
            <input name="academic_year" type="number" min="2000" max="2100" required defaultValue={settings.academic_year} className={inputClass} />
          </label>
          <label className={labelClass}>Current Term
            <input name="current_term" required minLength={2} maxLength={40} defaultValue={settings.current_term} placeholder="2nd Term" className={inputClass} />
          </label>
          <label className={labelClass}>Monthly Due Day
            <input name="payment_due_day" type="number" min="1" max="28" required defaultValue={settings.payment_due_day} className={inputClass} />
          </label>
          <label className={labelClass}>Receipt Prefix
            <input name="receipt_prefix" required minLength={2} maxLength={16} defaultValue={settings.receipt_prefix} className={`${inputClass} uppercase`} />
          </label>
          <button type="submit" className="min-h-11 rounded-lg bg-banner-dark px-5 py-2 text-sm font-black text-white hover:bg-[#0b5226]">Save Settings</button>
        </form>
      </section>

      <section className="rounded-2xl border border-green-200 bg-green-50/50 p-5 shadow-sm sm:p-6" aria-labelledby="generate-invoices-title">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id="generate-invoices-title" className="text-xl font-black text-gray-950">Generate Monthly Invoices</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-600">Creates one unpaid invoice for every approved student. YLE works as either a standalone class or a dual fee added separately to KG–Primary 6. Existing invoices for the selected month are kept unchanged.</p>
          </div>
          <form action={generateMonthlyInvoices} className="grid shrink-0 gap-3 sm:grid-cols-[minmax(12rem,1fr)_auto] sm:items-end">
            <ReturnPath value={returnPath} />
            <label className={labelClass}>Invoice Month
              <input name="month_year" type="month" required defaultValue={`${settings.academic_year}-${String(new Date().getMonth() + 1).padStart(2, '0')}`} className={inputClass} />
            </label>
            <button type="submit" className="min-h-11 rounded-lg bg-green-700 px-5 py-2 text-sm font-black text-white hover:bg-green-800">Generate Invoices</button>
          </form>
        </div>
        <div className={`mt-5 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${emailConfigured ? 'border-green-200 bg-white' : 'border-amber-200 bg-amber-50'}`}>
          <div>
            <p className="text-sm font-black text-gray-900">Paid invoice email: {emailConfigured ? 'Ready' : 'Configuration required'}</p>
            <p className="mt-1 text-xs leading-5 text-gray-600">Verified payments are emailed once. Use this button to send or retry invoices for existing paid students.</p>
          </div>
          <form action={sendPendingPaidInvoiceEmails}>
            <ReturnPath value={returnPath} />
            <button type="submit" className="min-h-10 whitespace-nowrap rounded-lg border border-banner-dark bg-white px-4 py-2 text-sm font-black text-banner-dark hover:bg-green-50">Send Pending Paid Emails</button>
          </form>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="add-class-title">
        <h2 id="add-class-title" className="text-xl font-black text-gray-950">Add Class</h2>
        <p className="mt-1 text-sm text-gray-600">Create classes manually for {settings.academic_year}. A class code is a short internal value such as primary1.</p>
        <form action={createAcademicClass} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.7fr_auto] lg:items-end">
          <ReturnPath value={returnPath} />
          <input type="hidden" name="academic_year" value={settings.academic_year} />
          <label className={labelClass}>Class Name
            <input name="name" required minLength={2} maxLength={80} placeholder="Primary 1" className={inputClass} />
          </label>
          <label className={labelClass}>Class Code
            <input name="code" required minLength={2} maxLength={32} placeholder="primary1" className={inputClass} />
          </label>
          <label className={labelClass}>Monthly Fee (MMK)
            <input name="monthly_fee" type="number" min="0" max="100000000" step="100" required defaultValue="0" className={inputClass} />
          </label>
          <label className={labelClass}>Display Order
            <input name="sort_order" type="number" min="0" max="10000" required defaultValue="100" className={inputClass} />
          </label>
          <button type="submit" className="min-h-11 rounded-lg bg-banner-brown px-5 py-2 text-sm font-black text-white hover:bg-[#4f2c1d]">Add Class</button>
        </form>
      </section>

      <section className="space-y-4" aria-labelledby="class-fees-title">
        <div>
          <h2 id="class-fees-title" className="text-xl font-black text-gray-950">Classes, Sections & Monthly Fees</h2>
          <p className="mt-1 text-sm text-gray-600">Save each class separately. Archive keeps historical records without deleting them.</p>
        </div>

        {classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center text-sm font-semibold text-gray-600">No classes configured for {settings.academic_year}.</div>
        ) : classes.map(schoolClass => {
          const updateClassAction = updateAcademicClass.bind(null, schoolClass.id)
          const createSectionAction = createClassSection.bind(null, schoolClass.id)
          const sections = [...(schoolClass.class_sections || [])].sort((first, second) => first.sort_order - second.sort_order || first.name.localeCompare(second.name))

          return (
            <article key={schoolClass.id} className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${schoolClass.is_active ? 'border-gray-200' : 'border-gray-300 opacity-75'}`}>
              <form action={updateClassAction} className="grid gap-3 border-b border-gray-100 bg-gray-50/70 p-4 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_.7fr_1fr_auto] lg:items-end sm:p-5">
                <ReturnPath value={returnPath} />
                <label className={labelClass}>Class Name
                  <input name="name" required minLength={2} maxLength={80} defaultValue={schoolClass.name} className={inputClass} />
                </label>
                <label className={labelClass}>Code
                  <input name="code" required minLength={2} maxLength={32} defaultValue={schoolClass.code} className={inputClass} />
                </label>
                <label className={labelClass}>Monthly Fee
                  {schoolClass.code === 'yle' ? (
                    <>
                      <input type="hidden" name="monthly_fee" value="0" />
                      <input type="number" value="0" disabled aria-label="YLE parent fee is set per sub-class" className={`${inputClass} cursor-not-allowed bg-gray-100 text-gray-500`} />
                    </>
                  ) : (
                    <input name="monthly_fee" type="number" min="0" max="100000000" step="100" required defaultValue={Number(schoolClass.monthly_fee)} className={inputClass} />
                  )}
                </label>
                <label className={labelClass}>Order
                  <input name="sort_order" type="number" min="0" max="10000" required defaultValue={schoolClass.sort_order} className={inputClass} />
                </label>
                <label className={labelClass}>Status
                  <select name="is_active" defaultValue={String(schoolClass.is_active)} className={inputClass}>
                    <option value="true">Active</option>
                    <option value="false">Archived</option>
                  </select>
                </label>
                <button type="submit" className="min-h-11 rounded-lg bg-banner-dark px-4 py-2 text-sm font-black text-white hover:bg-[#0b5226]">Save Class</button>
              </form>

              <div className="p-4 sm:p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-black text-gray-900">Sections</h3>
                    <p className="text-xs text-gray-500">YLE sections use their own monthly fees; students in KG–Primary 6 can take YLE as a dual class.</p>
                  </div>
                  <p className="text-xs font-bold text-gray-500">{sections.filter(section => section.is_active).length} active</p>
                </div>

                {sections.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {sections.map(section => {
                      const updateSectionAction = updateClassSection.bind(null, section.id)
                      return (
                        <form key={section.id} action={updateSectionAction} className="grid gap-2 rounded-xl border border-gray-200 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_.8fr_.5fr_.8fr_auto] lg:items-end">
                          <ReturnPath value={returnPath} />
                          <label className={labelClass}>Section Name
                            <input name="name" required minLength={1} maxLength={60} defaultValue={section.name} className={compactInputClass} />
                          </label>
                          <label className={labelClass}>Order
                            <input name="sort_order" type="number" min="0" max="10000" required defaultValue={section.sort_order} className={compactInputClass} />
                          </label>
                          <label className={labelClass}>Monthly Fee (MMK)
                            <input name="monthly_fee" type="number" min="0" max="100000000" step="100" required defaultValue={Number(section.monthly_fee || 0)} className={compactInputClass} />
                          </label>
                          <label className={labelClass}>Status
                            <select name="is_active" defaultValue={String(section.is_active)} className={compactInputClass}>
                              <option value="true">Active</option>
                              <option value="false">Archived</option>
                            </select>
                          </label>
                          <button type="submit" className="min-h-10 rounded-lg border border-banner-dark px-4 py-2 text-sm font-black text-banner-dark hover:bg-green-50">Save</button>
                        </form>
                      )
                    })}
                  </div>
                )}

                <form action={createSectionAction} className="mt-4 grid gap-2 rounded-xl border border-dashed border-green-300 bg-green-50/40 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_.8fr_.5fr_auto] lg:items-end">
                  <ReturnPath value={returnPath} />
                  <label className={labelClass}>New Section
                    <input name="name" required minLength={1} maxLength={60} placeholder="Section A" className={compactInputClass} />
                  </label>
                  <label className={labelClass}>Monthly Fee (MMK)
                    <input name="monthly_fee" type="number" min="0" max="100000000" step="100" required defaultValue="0" className={compactInputClass} />
                  </label>
                  <label className={labelClass}>Order
                    <input name="sort_order" type="number" min="0" max="10000" required defaultValue="10" className={compactInputClass} />
                  </label>
                  <button type="submit" className="min-h-10 rounded-lg bg-green-700 px-4 py-2 text-sm font-black text-white hover:bg-green-800">Add Section</button>
                </form>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
